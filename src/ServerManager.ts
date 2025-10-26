import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { connect, Socket } from 'net';
import path from 'path';
import os from 'os';
import fs from 'fs';
import fsp from 'fs/promises';
import http from 'http';
import https from 'https';
import vscode from 'vscode';
import * as tar from 'tar';
import unzipper from 'unzipper';

export type Platform = 'windows' | 'macos' | 'macos-arm' | 'linux' | 'linux-arm64';
export type ArchiveType = 'zip' | 'tar.gz';

export interface ServerArchiveInfo {
    platform: Platform;
    url: string;
    workingDir: string;
    bin: string;
    archiveType: ArchiveType;
}

export interface StreamInfo {
    reader: NodeJS.ReadableStream;
    writer: NodeJS.WritableStream;
}

interface BinMetaData {
    lastModified?: string;
}

export class ServerManager {
    private serverProcess: ChildProcessWithoutNullStreams | undefined;

    private readonly platformId: Platform;
    private readonly info: ServerArchiveInfo;

    private readonly serverRootDir: string;

    private readonly metadataFile: string;

    constructor(readonly serverInfos: ServerArchiveInfo[]) {
        this.platformId = this.detectPlatform();
        this.info = this.pickServerInfoForPlatform(this.platformId, serverInfos);

        this.serverRootDir = path.join(os.tmpdir(), 'jabref', 'server-bin');
        this.metadataFile = path.join(os.tmpdir(), 'jabref', 'jabls-download-meta.json');
    }

    public async prepareServerBinaries(): Promise<void> {
        await this.downloadOrUpdateServerIfNeeded();
    }

    public async ensureServerConnection(): Promise<StreamInfo> {
        const cfg = vscode.workspace.getConfiguration('jabref');
        const port = cfg.get<number>('client.port', 2087);
        const host = cfg.get<string>('client.host', 'localhost');

        if (await this.tryConnectOnce(port, host)) {
            return this.connectWithRetry(port, host);
        }

        await this.prepareServerBinaries();

        await this.spawnServerProcessIfNeeded();

        return this.connectWithRetry(port, host);
    }

    private detectPlatform(): Platform {
        const nodePlatform = process.platform;
        const nodeArch = process.arch;

        if (nodePlatform === 'win32') {
            return "windows";
        }

        if (nodePlatform === 'darwin') {
            if (nodeArch === 'arm64') {
                return 'macos-arm';
            }
            return 'macos';
        }

        if (nodePlatform === 'linux') {
            if (nodeArch === 'arm64') {
                return 'linux-arm64';
            }
            return 'linux';
        }

        throw new Error(`Unsupported platform: ${nodePlatform} / ${nodeArch}`);
    }

    private pickServerInfoForPlatform(
        platform: Platform,
        infos: ServerArchiveInfo[]
    ): ServerArchiveInfo {
        const match = infos.find(i => i.platform === platform);
        if (!match) {
            throw new Error(
                `No ServerArchiveInfo provided for platform "${platform}".`
            );
        }
        return match;
    }

    private async readLocalMetadata(): Promise<BinMetaData | undefined> {
        try {
            const raw = await fsp.readFile(this.metadataFile, 'utf8');
            return JSON.parse(raw) as BinMetaData;
        } catch {
            return undefined;
        }
    }

    private async writeLocalMetadata(meta: BinMetaData): Promise<void> {
        await fsp.mkdir(this.serverRootDir, { recursive: true });
        await fsp.writeFile(this.metadataFile, JSON.stringify(meta, null, 2), 'utf8');
    }

    private async getRemoteMetadata(urlStr: string): Promise<BinMetaData> {
        const { protocol } = new URL(urlStr);
        const client = protocol === 'http:' ? http : https;

        return new Promise<BinMetaData>((resolve, reject) => {
            const req = client.request(urlStr, { method: 'HEAD' }, (res) => {
                const lastModifiedHeader = res.headers['last-modified'];

                const remoteMeta: BinMetaData = {
                    lastModified: Array.isArray(lastModifiedHeader)
                        ? lastModifiedHeader[0]
                        : lastModifiedHeader,
                };

                resolve(remoteMeta);
            });

            req.on('error', reject);
            req.end();
        });
    }

    private needsRedownload(
        localMeta: BinMetaData | undefined,
        remoteMeta: BinMetaData
    ): boolean {
        if (!localMeta) {
            return true;
        }

        if (remoteMeta.lastModified && localMeta.lastModified) {
            if (remoteMeta.lastModified !== localMeta.lastModified) {
                return true;
            }
        }

        return false;
    }

    private async downloadArchive(): Promise<string> {
        await fsp.rm(this.serverRootDir, { recursive: true, force: true });
        await fsp.mkdir(this.serverRootDir, { recursive: true });

        const tmpZipPath = path.join(
            this.serverRootDir,
            `jabls-portable.${this.info.archiveType}`
        );

        await fsp.rm(tmpZipPath, { force: true });

        await new Promise<void>((resolve, reject) => {
            const url = new URL(this.info.url);
            const client = url.protocol === 'http:' ? http : https;

            const req = client.get(this.info.url, (res) => {
                if (res.statusCode && res.statusCode >= 400) {
                    reject(new Error(`Download failed with status ${res.statusCode}`));
                    return;
                }

                const fileStream = fs.createWriteStream(tmpZipPath);
                res.pipe(fileStream);

                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve();
                });
                fileStream.on('error', reject);
            });

            req.on('error', reject);
        });

        return tmpZipPath;
    }

    private async extractArchiveIntoServerDir(archivePath: string, archiveType: ArchiveType): Promise<void> {
        if (archiveType === 'zip') {
            await this.extractZipIntoServerDir(archivePath);
        } else {
            await this.extractTarGzIntoServerDir(archivePath);
        }
    }

    private async extractZipIntoServerDir(zipPath: string): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            fs.createReadStream(zipPath)
                .pipe(unzipper.Extract({ path: this.serverRootDir }))
                .on('close', resolve)
                .on('error', reject);
        });

        await fsp.rm(zipPath, { force: true });
    }

    private async extractTarGzIntoServerDir(tarGzPath: string): Promise<void> {
        await tar.x({
            file: tarGzPath,
            cwd: this.serverRootDir,
            gzip: true,
            strict: true,
        });
        await fsp.rm(tarGzPath, { force: true });
    }
    private async downloadOrUpdateServerIfNeeded(): Promise<void> {
        const remoteMeta = await this.getRemoteMetadata(this.info.url);
        const localMeta = await this.readLocalMetadata();

        const mustRedownload = this.needsRedownload(localMeta, remoteMeta);

        if (mustRedownload) {
            const zipPath = await this.downloadArchive();
            await this.extractArchiveIntoServerDir(zipPath, this.info.archiveType);
            await this.ensureExecutable(
                path.join(
                    this.serverRootDir,
                    this.info.workingDir,
                    this.info.bin
                )
            );
            const newMeta: BinMetaData = {
                lastModified: remoteMeta.lastModified,
            };
            await this.writeLocalMetadata(newMeta);
        } else {
            await fsp.mkdir(this.serverRootDir, { recursive: true });
        }
    }

    private async ensureExecutable(filePath: string): Promise<void> {
        if (process.platform === 'win32') {
            return;
        }
        await fsp.chmod(filePath, 0o755);
    }

    private async spawnServerProcessIfNeeded(): Promise<void> {
        if (this.serverProcess && this.serverProcess.exitCode === null) {
            return;
        }

        const absoluteWorkingDir = path.join(this.serverRootDir, this.info.workingDir);

        const commandPath = path.join(absoluteWorkingDir, this.info.bin);

        const args: string[] = [];

        try {
            this.serverProcess = spawn(commandPath, args, {
                stdio: 'pipe',
                shell: false,
                cwd: absoluteWorkingDir,
                detached: false
            });

            this.serverProcess.stdout?.on('data', (chunk: Buffer) => {
                console.log(`[JabLS process] ${chunk.toString().trimEnd()}`);
            });

            this.serverProcess.stderr?.on('data', (chunk: Buffer) => {
                console.error(`[JabLS process] ${chunk.toString().trimEnd()}`);
            });

            this.serverProcess.once('error', (error) => {
                console.error(
                    `[JabLS process] Failed to start server: ${error.message}`
                );
                this.serverProcess = undefined;
            });

            this.serverProcess.once('exit', (code, signal) => {
                console.log(
                    `[JabLS process] server exited code=${code} signal=${signal}`
                );
                this.serverProcess = undefined;
            });
        } catch (err: any) {
            console.error(`[JabLS process] spawn failed: ${err?.message ?? err}`);
            this.serverProcess = undefined;
        }
    }

    public stopServerProcess(): Promise<void> {
        return new Promise<void>((resolve) => {
            if (this.serverProcess) {
                this.serverProcess.once('exit', () => {
                    resolve();
                });
                this.serverProcess.kill();
                this.serverProcess = undefined;
            } else {
                resolve();
            }
        });
    }

    private connectWithRetry(
        port: number,
        host: string,
        backoffStartMs = 1000,
        backoffMaxMs = 3000
    ): Promise<StreamInfo> {
        return new Promise<StreamInfo>((resolve) => {
            let attempt = 0;

            const tryConnect = () => {
                const socket: Socket = connect({ port, host });

                const cleanup = () => {
                    socket.removeAllListeners('connect');
                    socket.removeAllListeners('error');
                    socket.removeAllListeners('close');
                };

                const restart = () => {
                    cleanup();
                    socket.destroy();
                    attempt++;
                    const delay = Math.min(
                        backoffMaxMs,
                        backoffStartMs * 2 ** (attempt - 1)
                    );
                    setTimeout(tryConnect, delay);
                };

                socket.once('connect', () => {
                    attempt = 0;
                    cleanup();
                    resolve({
                        reader: socket,
                        writer: socket
                    });
                });

                socket.once('error', () => {
                    restart();
                });

                socket.once('close', (hadError) => {
                    if (hadError) {
                        return;
                    }
                    restart();
                });
            };

            tryConnect();
        });
    }

    private tryConnectOnce(
        port: number,
        host: string,
        timeoutMs = 500
    ): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            const socket = connect({ port, host });

            const cleanup = () => {
                socket.removeAllListeners('connect');
                socket.removeAllListeners('error');
                socket.removeAllListeners('timeout');
                socket.destroy();
            };

            socket.setTimeout(timeoutMs, () => {
                cleanup();
                resolve(false);
            });

            socket.once('connect', () => {
                cleanup();
                resolve(true);
            });

            socket.once('error', () => {
                cleanup();
                resolve(false);
            });

            socket.once('timeout', () => {
                cleanup();
                resolve(false);
            });
        });
    }
}
