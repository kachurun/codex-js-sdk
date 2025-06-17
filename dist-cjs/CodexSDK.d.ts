import { EventEmitter } from 'events';
import { ConfigureSessionOperation } from './types';
import type { CodexMessage, CodexMessageType, CodexProcessOptions, CodexResponse, InputItem } from './types';
/**
 * Logging levels supported by the SDK
 */
export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug"
}
/**
 * Main SDK class for interacting with the Codex process.
 * Handles process management, communication, and session configuration.
 */
export declare class CodexSDK {
    private codexProc;
    private emitter;
    private options;
    private logger;
    /**
     * Creates a new instance of CodexSDK
     * @param options - Configuration options for the SDK
     */
    constructor(options?: CodexProcessOptions);
    /**
     * Starts the Codex process if it's not already running.
     * Initializes process communication and sets up event handlers.
     */
    start(): void;
    /**
     * Stops the Codex process if it's running
     */
    stop(): void;
    /**
     * Restarts the Codex process by stopping and starting it again
     */
    restart(): void;
    /**
     * Aborts the current operation.
     *
     * @param requestId - The ID of the request to abort
     */
    abort(requestId: string): void;
    /**
     * Configures the Codex session with the specified settings.
     * This is a helper method that wraps the raw configure_session operation.
     *
     * @param options - Session configuration options
     * @returns A promise that resolves when the session is configured
     */
    configureSession(options: Partial<Omit<ConfigureSessionOperation, 'type'>>): Promise<void>;
    /**
     * Sends a raw message to the Codex process.
     *
     * @param message - The message to send, following the CodexMessage interface
     * @throws {Error} If Codex process is not started or stdin is not writable
     */
    sendRaw(message: CodexMessage): void;
    /**
     * Sends a user message to the Codex process.
     *
     * @param items - Array of input items (text messages and/or images) to send
     * @param runId - Optional unique identifier for the message run. If not provided, a new UUID will be generated
     */
    sendUserMessage(items: InputItem[], runId?: string): string;
    /**
     * Handles a command execution request by approving or rejecting it.
     *
     * @param callId - The ID of the command approval request
     * @param approved - Whether to approve or reject the command
     * @param forSession - If true, the approval will persist for the current session only
     */
    handleCommand(callId: string, approved: boolean, forSession?: boolean): void;
    /**
     * Handles a patch application request by approving or rejecting it.
     *
     * @param callId - The ID of the patch approval request
     * @param approved - Whether to approve or reject the patch
     * @param forSession - If true, the approval will persist for the current session only
     */
    handlePatch(callId: string, approved: boolean, forSession?: boolean): void;
    /**
     * Registers a callback function to handle Codex responses.
     *
     * @param cb - Callback function that will be called with each response from Codex
     * @returns A function that can be called to unsubscribe the callback
     */
    onResponse(cb: (msg: CodexResponse<CodexMessageType>) => void): () => EventEmitter<[never]>;
    /**
     * Registers a callback function to handle Codex errors.
     *
     * @param cb - Callback function that will be called with each error from Codex
     * @returns A function that can be called to unsubscribe the callback
     */
    onError(cb: (msg: CodexResponse<CodexMessageType>) => void): () => EventEmitter<[never]>;
}
//# sourceMappingURL=CodexSDK.d.ts.map