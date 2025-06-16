import CodexSDK from '../src/CodexSDK';
import { CodexResponse, CodexMessageTypeEnum, ExecApprovalRequestMessage, ApplyPatchApprovalRequestMessage, ModelReasoningEffort, ModelReasoningSummary, SandboxPermission, AskForApproval } from '../src/types';

async function main() {
    // Create SDK instance with custom config
    const sdk = new CodexSDK({
        // logLevel: LogLevel.DEBUG,
        config: {}
    });

    // Set up response handler
    sdk.onResponse((response: CodexResponse) => {
        console.log('response', response);
        const msg = response.msg;
        
        // Handle different response types
        switch (msg.type) {
            case CodexMessageTypeEnum.EXEC_APPROVAL_REQUEST: {
                const execResponse = response as unknown as ExecApprovalRequestMessage;
                console.log('\nCommand execution requested:', execResponse.command);
                
                // Auto-approve
                sdk.handleCommand(response.id, true);
                break;
            }
            case CodexMessageTypeEnum.APPLY_PATCH_APPROVAL_REQUEST: {
                const patchResponse = response as unknown as ApplyPatchApprovalRequestMessage;
                console.log('\nPatch requested:', patchResponse.changes);
                
                // Auto-approve
                sdk.handlePatch(response.id, true);
                break;
            }
        }
    });
    
    sdk.onError((response: CodexResponse) => {
        console.log('error', response);
    });
    
    // Start the SDK
    sdk.start();

    // Configure session
    await sdk.configureSession({
        model: 'codex-mini-latest',
        instructions: 'You are a helpful coding assistant, your name is "Flexbe Bot". Provide concise and clear responses.',
        model_reasoning_effort: ModelReasoningEffort.NONE,
        model_reasoning_summary: ModelReasoningSummary.NONE,
        provider: {
            name: 'OpenAI',
            base_url: 'https://api.openai.com/v1',
            env_key: 'OPENAI_API_KEY',
            env_key_instructions: 'Create an API key (https://platform.openai.com) and export it as an environment variable.',
            wire_api: 'responses'
        },
        approval_policy: AskForApproval.UNLESS_ALLOW_LISTED,
        sandbox_policy: { permissions: [SandboxPermission.DISK_WRITE_CWD] },
        cwd: process.cwd()
    });

    // Send a test message
    sdk.sendUserMessage([
        { type: 'text', text: 'Please create a TEST.md file with content: "This is a test file"' }
    ]);

    // Keep the process running
    process.on('SIGINT', () => {
        console.log('\nStopping SDK...');
        sdk.stop();
        process.exit(0);
    });
}

main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});
