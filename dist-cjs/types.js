"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SandboxPermission = exports.AskForApproval = exports.WireApi = exports.HistoryPersistence = exports.FileOpener = exports.EnvironmentInheritPolicy = exports.ApprovalPolicy = exports.ModelReasoningSummary = exports.ModelReasoningEffort = exports.ReviewDecision = exports.CodexMessageTypeEnum = void 0;
var CodexMessageTypeEnum;
(function (CodexMessageTypeEnum) {
    CodexMessageTypeEnum["AGENT_REASONING"] = "agent_reasoning";
    CodexMessageTypeEnum["AGENT_MESSAGE"] = "agent_message";
    CodexMessageTypeEnum["TASK_COMPLETE"] = "task_complete";
    CodexMessageTypeEnum["TASK_STARTED"] = "task_started";
    CodexMessageTypeEnum["EXEC_COMMAND_BEGIN"] = "exec_command_begin";
    CodexMessageTypeEnum["EXEC_COMMAND_END"] = "exec_command_end";
    CodexMessageTypeEnum["SESSION_CONFIGURED"] = "session_configured";
    CodexMessageTypeEnum["BACKGROUND_EVENT"] = "background_event";
    CodexMessageTypeEnum["EXEC_APPROVAL_REQUEST"] = "exec_approval_request";
    CodexMessageTypeEnum["ERROR"] = "error";
    CodexMessageTypeEnum["MCP_TOOL_CALL_BEGIN"] = "mcp_tool_call_begin";
    CodexMessageTypeEnum["MCP_TOOL_CALL_END"] = "mcp_tool_call_end";
    CodexMessageTypeEnum["APPLY_PATCH_APPROVAL_REQUEST"] = "apply_patch_approval_request";
    CodexMessageTypeEnum["PATCH_APPLY_BEGIN"] = "patch_apply_begin";
    CodexMessageTypeEnum["PATCH_APPLY_END"] = "patch_apply_end";
    CodexMessageTypeEnum["GET_HISTORY_ENTRY_RESPONSE"] = "get_history_entry_response";
})(CodexMessageTypeEnum || (exports.CodexMessageTypeEnum = CodexMessageTypeEnum = {}));
var ReviewDecision;
(function (ReviewDecision) {
    ReviewDecision["APPROVED"] = "approved";
    ReviewDecision["APPROVED_FOR_SESSION"] = "approved_for_session";
    ReviewDecision["DENIED"] = "denied";
    ReviewDecision["ABORT"] = "abort";
})(ReviewDecision || (exports.ReviewDecision = ReviewDecision = {}));
var ModelReasoningEffort;
(function (ModelReasoningEffort) {
    ModelReasoningEffort["NONE"] = "none";
    ModelReasoningEffort["LOW"] = "low";
    ModelReasoningEffort["MEDIUM"] = "medium";
    ModelReasoningEffort["HIGH"] = "high";
})(ModelReasoningEffort || (exports.ModelReasoningEffort = ModelReasoningEffort = {}));
var ModelReasoningSummary;
(function (ModelReasoningSummary) {
    ModelReasoningSummary["NONE"] = "none";
    ModelReasoningSummary["AUTO"] = "auto";
    ModelReasoningSummary["CONCISE"] = "concise";
    ModelReasoningSummary["DETAILED"] = "detailed";
})(ModelReasoningSummary || (exports.ModelReasoningSummary = ModelReasoningSummary = {}));
var ApprovalPolicy;
(function (ApprovalPolicy) {
    ApprovalPolicy["UNLESS_ALLOW_LISTED"] = "unless-allow-listed";
    ApprovalPolicy["ON_FAILURE"] = "on-failure";
    ApprovalPolicy["NEVER"] = "never";
})(ApprovalPolicy || (exports.ApprovalPolicy = ApprovalPolicy = {}));
var EnvironmentInheritPolicy;
(function (EnvironmentInheritPolicy) {
    EnvironmentInheritPolicy["CORE"] = "core";
    EnvironmentInheritPolicy["ALL"] = "all";
    EnvironmentInheritPolicy["NONE"] = "none";
})(EnvironmentInheritPolicy || (exports.EnvironmentInheritPolicy = EnvironmentInheritPolicy = {}));
var FileOpener;
(function (FileOpener) {
    FileOpener["VSCODE"] = "vscode";
    FileOpener["VSCODE_INSIDERS"] = "vscode-insiders";
    FileOpener["WINDSURF"] = "windsurf";
    FileOpener["CURSOR"] = "cursor";
    FileOpener["NONE"] = "none";
})(FileOpener || (exports.FileOpener = FileOpener = {}));
var HistoryPersistence;
(function (HistoryPersistence) {
    HistoryPersistence["NONE"] = "none";
    HistoryPersistence["SAVE_ALL"] = "save-all";
})(HistoryPersistence || (exports.HistoryPersistence = HistoryPersistence = {}));
/**
 * Determines which wire protocol the provider expects
 */
var WireApi;
(function (WireApi) {
    /** Regular Chat Completions compatible with `/v1/chat/completions` */
    WireApi["CHAT"] = "chat";
    /** The experimental "Responses" API exposed by OpenAI at `/v1/responses` */
    WireApi["RESPONSES"] = "responses";
})(WireApi || (exports.WireApi = WireApi = {}));
var AskForApproval;
(function (AskForApproval) {
    AskForApproval["UNLESS_ALLOW_LISTED"] = "unless-allow-listed";
    AskForApproval["AUTO_EDIT"] = "auto-edit";
    AskForApproval["ON_FAILURE"] = "on-failure";
    AskForApproval["NEVER"] = "never";
})(AskForApproval || (exports.AskForApproval = AskForApproval = {}));
var SandboxPermission;
(function (SandboxPermission) {
    SandboxPermission["DISK_FULL_READ_ACCESS"] = "disk-full-read-access";
    SandboxPermission["DISK_WRITE_PLATFORM_USER_TEMP_FOLDER"] = "disk-write-platform-user-temp-folder";
    SandboxPermission["DISK_WRITE_PLATFORM_GLOBAL_TEMP_FOLDER"] = "disk-write-platform-global-temp-folder";
    SandboxPermission["DISK_WRITE_CWD"] = "disk-write-cwd";
    SandboxPermission["DISK_WRITE_FOLDER"] = "disk-write-folder";
    SandboxPermission["DISK_FULL_WRITE_ACCESS"] = "disk-full-write-access";
    SandboxPermission["NETWORK_FULL_ACCESS"] = "network-full-access";
})(SandboxPermission || (exports.SandboxPermission = SandboxPermission = {}));
//# sourceMappingURL=types.js.map