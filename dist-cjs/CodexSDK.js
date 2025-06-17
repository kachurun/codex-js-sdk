"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodexSDK = exports.LogLevel = void 0;
const child_process_1 = require("child_process");
const events_1 = require("events");
const path_1 = require("path");
const uuid_1 = require("uuid");
const winston_1 = __importDefault(require("winston"));
const config_1 = require("./config");
const types_1 = require("./types");
/**
 * Logging levels supported by the SDK
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Main SDK class for interacting with the Codex process.
 * Handles process management, communication, and session configuration.
 */
class CodexSDK {
    codexProc = null;
    emitter = new events_1.EventEmitter();
    options;
    logger;
    /**
     * Creates a new instance of CodexSDK
     * @param options - Configuration options for the SDK
     */
    constructor(options = {}) {
        this.options = {
            logLevel: LogLevel.INFO,
            env: process.env,
            config: {},
            ...options,
            cwd: (0, path_1.resolve)(process.cwd(), options.cwd || ''),
        };
        this.logger = winston_1.default.createLogger({
            level: this.options.logLevel,
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf(({ level, message, ...meta }) => {
                const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                return `${level}: ${message}${metaStr ? `\n${metaStr}` : ''}`;
            })),
            transports: [
                new winston_1.default.transports.Console(),
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
            ...(0, config_1.configToArgs)(this.options.config),
            'proto',
        ];
        const codexBinary = this.options.codexPath || 'codex';
        this.codexProc = (0, child_process_1.spawn)(codexBinary, args, {
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
        this.codexProc.stdout.on('data', (chunk) => {
            try {
                const json = JSON.parse(chunk);
                this.logger.debug('Codex: message to user', { data: json });
                this.emitter.emit('response', json);
                return;
            }
            catch (_e) {
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
                catch (_e) {
                    this.logger.warn('Codex: invalid JSON:', line);
                }
            }
        });
        this.codexProc.stderr.on('data', (data) => {
            const errorData = data.toString().trim();
            if (errorData) {
                if (errorData.includes('INFO')) {
                    this.logger.info(`Codex: ${errorData}`);
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
        this.codexProc.on('exit', (code) => {
            this.logger.warn(`Codex: process exited with code ${code}`);
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
    abort(requestId) {
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
    async configureSession(options) {
        const config = {
            type: 'configure_session',
            provider: {
                name: 'OpenAI',
                base_url: 'https://api.openai.com/v1',
                env_key: 'OPENAI_API_KEY',
                env_key_instructions: 'Create an API key (https://platform.openai.com) and export it as an environment variable.',
                wire_api: types_1.WireApi.RESPONSES,
                ...options.provider,
            },
            model: 'o4-mini',
            instructions: '',
            model_reasoning_effort: types_1.ModelReasoningEffort.LOW,
            model_reasoning_summary: types_1.ModelReasoningSummary.CONCISE,
            approval_policy: types_1.AskForApproval.UNLESS_ALLOW_LISTED,
            sandbox_policy: { permissions: [types_1.SandboxPermission.DISK_WRITE_CWD] },
            cwd: options.cwd || this.options.cwd,
            ...options,
        };
        return new Promise((resolve, reject) => {
            const unsubscribe = this.onResponse((response) => {
                if (response.msg.type === types_1.CodexMessageTypeEnum.SESSION_CONFIGURED) {
                    unsubscribe();
                    resolve();
                }
                else if (response.msg.type === types_1.CodexMessageTypeEnum.ERROR) {
                    unsubscribe();
                    reject(new Error((response.msg).message));
                }
            });
            this.sendRaw({
                id: (0, uuid_1.v4)(),
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
    sendRaw(message) {
        this.logger.debug('Sending to Codex', { id: message.id, op: message.op });
        if (!this.codexProc) {
            throw new Error('Codex not started');
        }
        if (!this.codexProc.stdin.writable) {
            throw new Error('Codex stdin is not writable');
        }
        try {
            this.codexProc.stdin.write(`${JSON.stringify(message)}\n`);
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
    sendUserMessage(items, runId = (0, uuid_1.v4)()) {
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
    handleCommand(callId, approved, forSession = false) {
        const decision = approved
            ? (forSession ? types_1.ReviewDecision.APPROVED_FOR_SESSION : types_1.ReviewDecision.APPROVED)
            : types_1.ReviewDecision.DENIED;
        this.sendRaw({
            id: (0, uuid_1.v4)(),
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
    handlePatch(callId, approved, forSession = false) {
        const decision = approved
            ? (forSession ? types_1.ReviewDecision.APPROVED_FOR_SESSION : types_1.ReviewDecision.APPROVED)
            : types_1.ReviewDecision.DENIED;
        this.sendRaw({
            id: (0, uuid_1.v4)(),
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
    onResponse(cb) {
        this.emitter.on('response', cb);
        return () => this.emitter.off('response', cb);
    }
    /**
     * Registers a callback function to handle Codex errors.
     *
     * @param cb - Callback function that will be called with each error from Codex
     * @returns A function that can be called to unsubscribe the callback
     */
    onError(cb) {
        this.emitter.on('error', cb);
        return () => this.emitter.off('error', cb);
    }
}
exports.CodexSDK = CodexSDK;
//# sourceMappingURL=CodexSDK.js.map