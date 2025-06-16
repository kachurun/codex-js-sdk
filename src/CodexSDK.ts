import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { EventEmitter } from 'events';
import { resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

import { configToArgs } from './config';
import {
    AskForApproval,
    CodexMessageTypeEnum,
    ConfigureSessionOperation,
    ModelReasoningEffort,
    ModelReasoningSummary,
    ReviewDecision,
    SandboxPermission,
    WireApi
} from './types';

import type { CodexMessage, CodexMessageType, CodexProcessOptions, CodexResponse, InputItem } from './types';

/**
 * Logging levels supported by the SDK
 */
export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug'
}


/**
 * Main SDK class for interacting with the Codex process.
 * Handles process management, communication, and session configuration.
 */
export class CodexSDK {
    private codexProc: ChildProcessWithoutNullStreams | null = null;
    private emitter = new EventEmitter();
    private options: Required<CodexProcessOptions>;
    private logger: winston.Logger;

    /**
     * Creates a new instance of CodexSDK
     * @param options - Configuration options for the SDK
     */
    constructor(options: CodexProcessOptions = {}) {
        this.options = {
            logLevel: LogLevel.INFO,
            env: process.env,
            config: {},
            ...options,
            cwd: resolve(process.cwd(), options.cwd || ''),
        } as Required<CodexProcessOptions>;

        this.logger = winston.createLogger({
            level: this.options.logLevel,
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ level, message, ...meta }: { level: string; message: string; [key: string]: unknown }) => {
                    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';

                    return `${ level }: ${ message }${ metaStr ? `\n${ metaStr }` : '' }`;
                })
            ),
            transports: [
                new winston.transports.Console(),
            ],
        });
    }

    /**
     * Starts the Codex process if it's not already running.
     * Initializes process communication and sets up event handlers.
     */
    start() {
        if (this.codexProc) {
            return;
        }

        const args = [
            '-a=never',
            '--skip-git-repo-check',
            ...configToArgs(this.options.config),
            'proto',
        ] as const;

        const codexBinary = this.options.codexPath || 'codex';

        this.codexProc = spawn(codexBinary, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: this.options.cwd,
            env: {
                ...this.options.env,
            },
        });

        this.logger.info('Codex: started with config:', this.options.config);

        if (!this.codexProc.stdout || !this.codexProc.stderr) {
            throw new Error('Failed to initialize Codex process streams');
        }

        this.codexProc.stdout.setEncoding('utf-8');

        this.codexProc.stdout.on('data', (chunk: string) => {
            try {
                const json = JSON.parse(chunk);

                this.logger.debug('Codex: message to user', { data: json });
                this.emitter.emit('response', json);

                return;
            }
            catch (_e: unknown) {
                // Ignore
            }

            const lines = chunk.split('\n');

            for (const line of lines) {
                if (!line.trim()) {
                    continue;
                }

                try {
                    const json = JSON.parse(line);

                    this.logger.debug('Codex: message to user', { data: json });
                    this.emitter.emit('response', json);
                }
                catch (_e: unknown) {
                    this.logger.warn('Codex: invalid JSON:', line);
                }
            }
        });

        this.codexProc.stderr.on('data', (data: string) => {
            const errorData = data.toString().trim();

            if (errorData) {
                if (errorData.includes('INFO')) {
                    this.logger.info(`Codex: ${ errorData }`);
                }
                else {
                    this.logger.error('Codex: stderr', { error: errorData });
                    this.emitter.emit('error', {
                        id: 'error',
                        op: {
                            type: 'error',
                            message: errorData,
                        },
                    });
                }
            }
        });

        this.codexProc.on('exit', (code: number) => {
            this.logger.warn(`Codex: process exited with code ${ code }`);
            this.codexProc = null;
        });
    }

    /**
     * Stops the Codex process if it's running
     */
    stop() {
        if (!this.codexProc) {
            return;
        }

        this.codexProc.kill();
        this.codexProc = null;
    }

    /**
     * Restarts the Codex process by stopping and starting it again
     */
    restart() {
        this.stop();
        this.start();
    }

    /**
     * Aborts the current operation.
     * 
     * @param requestId - The ID of the request to abort
     */
    abort(requestId: string) {
        this.sendRaw({
            id: requestId,
            op: {
                type: 'interrupt',
            },
        });
    }

    /**
     * Configures the Codex session with the specified settings.
     * This is a helper method that wraps the raw configure_session operation.
     * 
     * @param options - Session configuration options
     * @returns A promise that resolves when the session is configured
     */
    async configureSession(options: Partial<Omit<ConfigureSessionOperation, 'type'>>) {
        const config = {
            type: 'configure_session',
            provider: {
                name: 'OpenAI',
                base_url: 'https://api.openai.com/v1',
                env_key: 'OPENAI_API_KEY',
                env_key_instructions: 'Create an API key (https://platform.openai.com) and export it as an environment variable.',
                wire_api: WireApi.RESPONSES,
                ...options.provider,
            },
            model: 'o4-mini',
            instructions: '',
            model_reasoning_effort: ModelReasoningEffort.LOW,
            model_reasoning_summary: ModelReasoningSummary.CONCISE,
            approval_policy: AskForApproval.UNLESS_ALLOW_LISTED,
            sandbox_policy: { permissions: [SandboxPermission.DISK_WRITE_CWD] },
            cwd: options.cwd || this.options.cwd,
            ...options,
        } as ConfigureSessionOperation;

        return new Promise<void>((resolve, reject) => {
            const unsubscribe = this.onResponse((response) => {
                if (response.msg.type === CodexMessageTypeEnum.SESSION_CONFIGURED) {
                    unsubscribe();
                    resolve();
                }
                else if (response.msg.type === CodexMessageTypeEnum.ERROR) {
                    unsubscribe();
                    reject(new Error((response.msg).message));
                }
            });

            this.sendRaw({
                id: uuidv4(),
                op: config,
            });
        });
    }

    /**
     * Sends a raw message to the Codex process.
     * 
     * @param message - The message to send, following the CodexMessage interface
     * @throws {Error} If Codex process is not started or stdin is not writable
     */
    sendRaw(message: CodexMessage) {
        this.logger.debug('Sending to Codex', { id: message.id, op: message.op });

        if (!this.codexProc) {
            throw new Error('Codex not started');
        }

        if (!this.codexProc.stdin.writable) {
            throw new Error('Codex stdin is not writable');
        }

        try {
            this.codexProc.stdin.write(`${ JSON.stringify(message) }\n`);
        }
        catch (error) {
            this.logger.error('Failed to send message to Codex:', { error });

            throw error;
        }
    }

    /**
     * Sends a user message to the Codex process.
     * 
     * @param items - Array of input items (text messages and/or images) to send
     * @param runId - Optional unique identifier for the message run. If not provided, a new UUID will be generated
     */
    sendUserMessage(items: InputItem[], runId: string = uuidv4()) {
        this.sendRaw({
            id: runId,
            op: {
                type: 'user_input',
                items,
            },
        });

        return runId;
    }

    /**
     * Handles a command execution request by approving or rejecting it.
     * 
     * @param callId - The ID of the command approval request
     * @param approved - Whether to approve or reject the command
     * @param forSession - If true, the approval will persist for the current session only
     */
    handleCommand(callId: string, approved: boolean, forSession: boolean = false) {
        const decision = approved
            ? (forSession ? ReviewDecision.APPROVED_FOR_SESSION : ReviewDecision.APPROVED)
            : ReviewDecision.DENIED;

        this.sendRaw({
            id: uuidv4(),
            op: {
                type: 'exec_approval',
                id: callId,
                decision,
            },
        });
    }

    /**
     * Handles a patch application request by approving or rejecting it.
     * 
     * @param callId - The ID of the patch approval request
     * @param approved - Whether to approve or reject the patch
     * @param forSession - If true, the approval will persist for the current session only
     */
    handlePatch(callId: string, approved: boolean, forSession: boolean = false) {
        const decision = approved
            ? (forSession ? ReviewDecision.APPROVED_FOR_SESSION : ReviewDecision.APPROVED)
            : ReviewDecision.DENIED;

        this.sendRaw({
            id: uuidv4(),
            op: {
                type: 'patch_approval',
                id: callId,
                decision,
            },
        });
    }

    /**
     * Registers a callback function to handle Codex responses.
     * 
     * @param cb - Callback function that will be called with each response from Codex
     * @returns A function that can be called to unsubscribe the callback
     */
    onResponse(cb: (msg: CodexResponse<CodexMessageType>) => void) {
        this.emitter.on('response', cb);

        return () => this.emitter.off('response', cb);
    }

    /**
     * Registers a callback function to handle Codex errors.
     * 
     * @param cb - Callback function that will be called with each error from Codex
     * @returns A function that can be called to unsubscribe the callback
     */
    onError(cb: (msg: CodexResponse<CodexMessageType>) => void) {
        this.emitter.on('error', cb);

        return () => this.emitter.off('error', cb);
    }
}
