// Base response type
export interface CodexResponse<T extends CodexMessageType = CodexMessageType> {
    id: string;
    msg: T;
}

// Base message type
export type CodexMessageType
    = | AgentReasoningMessage
      | AgentMessage
      | TaskCompleteMessage
      | TaskStartedMessage
      | ExecCommandBeginMessage
      | ExecCommandEndMessage
      | SessionConfiguredMessage
      | BackgroundEventMessage
      | ExecApprovalRequestMessage
      | ErrorMessage
      | McpToolCallBeginMessage
      | McpToolCallEndMessage
      | ApplyPatchApprovalRequestMessage
      | PatchApplyBeginMessage
      | PatchApplyEndMessage
      | GetHistoryEntryResponseMessage;

export enum CodexMessageTypeEnum {
    AGENT_REASONING = 'agent_reasoning',
    AGENT_MESSAGE = 'agent_message',
    TASK_COMPLETE = 'task_complete',
    TASK_STARTED = 'task_started',
    EXEC_COMMAND_BEGIN = 'exec_command_begin',
    EXEC_COMMAND_END = 'exec_command_end',
    SESSION_CONFIGURED = 'session_configured',
    BACKGROUND_EVENT = 'background_event',
    EXEC_APPROVAL_REQUEST = 'exec_approval_request',
    ERROR = 'error',
    MCP_TOOL_CALL_BEGIN = 'mcp_tool_call_begin',
    MCP_TOOL_CALL_END = 'mcp_tool_call_end',
    APPLY_PATCH_APPROVAL_REQUEST = 'apply_patch_approval_request',
    PATCH_APPLY_BEGIN = 'patch_apply_begin',
    PATCH_APPLY_END = 'patch_apply_end',
    GET_HISTORY_ENTRY_RESPONSE = 'get_history_entry_response'
}

// Individual message types
export interface AgentReasoningMessage {
    type: CodexMessageTypeEnum.AGENT_REASONING;
    text: string;
}

export interface AgentMessage {
    type: CodexMessageTypeEnum.AGENT_MESSAGE;
    message: string;
}

export interface TaskCompleteMessage {
    type: CodexMessageTypeEnum.TASK_COMPLETE;
    last_agent_message?: string;
}

export interface TaskStartedMessage {
    type: CodexMessageTypeEnum.TASK_STARTED;
}

export interface ExecCommandBeginMessage {
    type: CodexMessageTypeEnum.EXEC_COMMAND_BEGIN;
    call_id: string;
    command: string[];
    cwd: string;
}

export interface ExecCommandEndMessage {
    type: CodexMessageTypeEnum.EXEC_COMMAND_END;
    call_id: string;
    command?: string[];
    stdout: string;
    stderr: string;
    exit_code: number;
}

export interface SessionConfiguredMessage {
    type: CodexMessageTypeEnum.SESSION_CONFIGURED;
    session_id: string;
    model: string;
    history_log_id: number;
    history_entry_count: number;
}

export interface BackgroundEventMessage {
    type: CodexMessageTypeEnum.BACKGROUND_EVENT;
    message: string;
}

export interface ExecApprovalRequestMessage {
    type: CodexMessageTypeEnum.EXEC_APPROVAL_REQUEST;
    command: string[];
    cwd: string;
    reason?: string;
}

export interface ErrorMessage {
    type: CodexMessageTypeEnum.ERROR;
    message: string;
}

export interface McpToolCallBeginMessage {
    type: CodexMessageTypeEnum.MCP_TOOL_CALL_BEGIN;
    call_id: string;
    server: string;
    tool: string;
    arguments?: any;
}

export interface McpToolCallEndMessage {
    type: CodexMessageTypeEnum.MCP_TOOL_CALL_END;
    call_id: string;
    result: {
        is_error?: boolean;
        [key: string]: any;
    };
}

export interface ApplyPatchApprovalRequestMessage {
    type: CodexMessageTypeEnum.APPLY_PATCH_APPROVAL_REQUEST;
    changes: Record<string, FileChange>;
    reason?: string;
    grant_root?: string;
}

export interface PatchApplyBeginMessage {
    type: CodexMessageTypeEnum.PATCH_APPLY_BEGIN;
    call_id: string;
    auto_approved: boolean;
    changes: Record<string, FileChange>;
}

export interface PatchApplyEndMessage {
    type: CodexMessageTypeEnum.PATCH_APPLY_END;
    call_id: string;
    stdout: string;
    stderr: string;
    success: boolean;
}

export interface GetHistoryEntryResponseMessage {
    type: CodexMessageTypeEnum.GET_HISTORY_ENTRY_RESPONSE;
    offset: number;
    log_id: number;
    entry?: HistoryEntry;
}

export type MessageFormatter<T extends CodexResponse['msg']['type'] = CodexResponse['msg']['type']> = (response: MessageType<T>) => string | null;

// Helper type to get the message type from a response
export type MessageType<T extends CodexResponse['msg']['type']> = CodexResponse & {
    msg: Extract<CodexMessageType, { type: T }>;
};

export enum ReviewDecision {
    APPROVED = 'approved',
    APPROVED_FOR_SESSION = 'approved_for_session',
    DENIED = 'denied',
    ABORT = 'abort'
}

export interface CodexMessage<T extends CodexOperationType = CodexOperationType> {
    id: string;
    op: T;
}

export type CodexOperationType
    = | UserInputOperation
      | ExecApprovalOperation
      | ConfigureSessionOperation
      | InterruptOperation
      | PatchApprovalOperation
      | AddToHistoryOperation
      | GetHistoryEntryRequestOperation;

export type InputItem =
  | { type: 'text'; text: string }
  | { type: 'image'; image_url: string }
  | { type: 'local_image'; path: string };

export interface UserInputOperation {
    type: 'user_input';
    items: InputItem[];
}

export interface ExecApprovalOperation {
    type: 'exec_approval';
    id: string;
    decision: ReviewDecision;
}

export enum ModelReasoningEffort {
    NONE = 'none',
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}

export enum ModelReasoningSummary {
    NONE = 'none',
    AUTO = 'auto',
    CONCISE = 'concise',
    DETAILED = 'detailed'
}

export enum ApprovalPolicy {
    UNLESS_ALLOW_LISTED = 'unless-allow-listed',
    ON_FAILURE = 'on-failure',
    NEVER = 'never'
}

export enum EnvironmentInheritPolicy {
    CORE = 'core',
    ALL = 'all',
    NONE = 'none'
}

export enum FileOpener {
    VSCODE = 'vscode',
    VSCODE_INSIDERS = 'vscode-insiders',
    WINDSURF = 'windsurf',
    CURSOR = 'cursor',
    NONE = 'none'
}

export enum HistoryPersistence {
    NONE = 'none',
    SAVE_ALL = 'save-all'
}

export interface ModelProvider {
    name: string;
    base_url: string;
    env_key?: string;
    wire_api: 'chat' | 'responses';
}

export interface McpServer {
    command: string;
    args: string[];
    env?: Record<string, string>;
}

export interface ShellEnvironmentPolicy {
    inherit?: EnvironmentInheritPolicy;
    ignore_default_excludes?: boolean;
    exclude?: string[];
    set?: Record<string, string>;
    include_only?: string[];
}

export interface TuiConfig {
    disable_mouse_capture?: boolean;
}

export interface HistoryConfig {
    persistence?: HistoryPersistence;
}

export interface CodexConfig {
    // Model configuration
    model?: string;
    model_provider?: string;
    model_providers?: Record<string, ModelProvider>;
    model_reasoning_effort?: ModelReasoningEffort;
    model_reasoning_summary?: ModelReasoningSummary;

    // Session configuration
    instructions?: string;
    approval_policy?: ApprovalPolicy;
    sandbox_permissions?: string[];
    disable_response_storage?: boolean;

    // Environment configuration
    shell_environment_policy?: ShellEnvironmentPolicy;

    // MCP configuration
    mcp_servers?: Record<string, McpServer>;

    // Notification configuration
    notify?: string[];

    // History configuration
    history?: HistoryConfig;

    // UI configuration
    file_opener?: FileOpener;
    hide_agent_reasoning?: boolean;
    project_doc_max_bytes?: number;
    tui?: TuiConfig;

    // Profile configuration
    profile?: string;
    profiles?: Record<string, Partial<CodexConfig>>;
}

export interface ModelProviderInfo {
    /** Friendly display name */
    name: string;
    /** Base URL for the provider's OpenAI-compatible API */
    base_url: string;
    /** Environment variable that stores the user's API key for this provider */
    env_key: string | null;
    /** Optional instructions to help the user get a valid value for the variable and set it */
    env_key_instructions: string | null;
    /** Which wire protocol this provider expects */
    wire_api: 'chat' | 'responses';
}

export interface ReasoningEffortConfig {
    level: ModelReasoningEffort;
}

export interface ReasoningSummaryConfig {
    level: ModelReasoningSummary;
}

export interface SandboxPolicy {
    permissions: SandboxPermission[];
}

export interface ConfigureSessionOperation {
    type: 'configure_session';
    provider: ModelProviderInfo;
    model: string;
    model_reasoning_effort: { level: ModelReasoningEffort };
    model_reasoning_summary: { level: ModelReasoningSummary };
    instructions: string | null;
    approval_policy: AskForApproval;
    sandbox_policy: SandboxPolicy;
    disable_response_storage: boolean;
    notify: string[] | null;
    cwd: string;
}

export interface InterruptOperation {
    type: 'interrupt';
}

export interface PatchApprovalOperation {
    type: 'patch_approval';
    id: string;
    decision: ReviewDecision;
}

export interface AddToHistoryOperation {
    type: 'add_to_history';
    cwd: string;
    text: string;
}

export interface GetHistoryEntryRequestOperation {
    type: 'get_history_entry_request';
    offset: number;
    log_id: number;
}

export enum AskForApproval {
    UNLESS_ALLOW_LISTED = 'unless-allow-listed',
    AUTO_EDIT = 'auto-edit',
    ON_FAILURE = 'on-failure',
    NEVER = 'never'
}

export enum SandboxPermission {
    DISK_FULL_READ_ACCESS = 'disk-full-read-access',
    DISK_WRITE_PLATFORM_USER_TEMP_FOLDER = 'disk-write-platform-user-temp-folder',
    DISK_WRITE_PLATFORM_GLOBAL_TEMP_FOLDER = 'disk-write-platform-global-temp-folder',
    DISK_WRITE_CWD = 'disk-write-cwd',
    DISK_WRITE_FOLDER = 'disk-write-folder',
    DISK_FULL_WRITE_ACCESS = 'disk-full-write-access',
    NETWORK_FULL_ACCESS = 'network-full-access'
}

export interface FileChange {
    type: 'add' | 'delete' | 'update';
    content?: string;
    unified_diff?: string;
    move_path?: string;
}

export interface HistoryEntry {
    // Add specific fields based on your needs
    [key: string]: any;
}

// Helper type to get the operation type from a message
export type OperationType<T extends CodexMessage> = T['op']['type'];

// Helper type to get the operation from a message
export type Operation<T extends CodexMessage> = T['op'];

// Example usage:
// const message: CodexMessage<UserInputOperation> = {
//     id: "123",
//     op: {
//         type: "user_input",
//         items: [...]
//     }
// };
