# Codex JS SDK

A TypeScript/JavaScript SDK for interacting with the Codex process. This SDK provides a simple interface for managing Codex sessions, sending messages, and handling responses.

## Requirements

This SDK works with the native (Rust) version of Codex from the [codex-rs](https://github.com/openai/codex/tree/main/codex-rs) repository. You can install it either globally or locally in your project.

### API Key

The SDK requires an OpenAI API key to function. By default, it looks for the `OPENAI_API_KEY` environment variable. You can:

1. Set it in your environment:
```bash
export OPENAI_API_KEY='your-api-key'
```

2. Or provide it through the session configuration (see Quick Start example below)

## Installation

You have two options for installing Codex:

1. Global installation (recommended for most users):
```bash
npm i -g @openai/codex@native
```

2. Local installation (if you prefer to keep it project-specific):
```bash
npm install @openai/codex@native
```

Then, install the SDK:
```bash
npm install codex-js-sdk
```

## Quick Start

```typescript
import { CodexSDK, LogLevel } from 'codex-js-sdk';
import { CodexResponse, CodexMessageTypeEnum, ModelReasoningEffort, ModelReasoningSummary, SandboxPermission, AskForApproval } from 'codex-js-sdk';

// Create a new SDK instance
const sdk = new CodexSDK({
    // Optional: Set custom working directory, could be relative to the current working directory (process.cwd())
    cwd: './my-project',
    // Optional: Configure logging level
    logLevel: LogLevel.DEBUG,
    // Optional: Specify custom path to codex binary (if installed locally)
    codexPath: './node_modules/.bin/codex',
    // Optional: Initial session configuration
    // NOTE: Better to use configureSession method instead
    config: {
        model: 'codex-mini-latest'
    },
    // Optional: Set custom environment variables (by default, the SDK will use the process.env)
    env: {
        OPENAI_API_KEY: 'sk-proj-...'
    }
});

// Set up response handler
sdk.onResponse((response: CodexResponse) => {
    console.log('Received response:', response);
    const msg = response.msg;
    
    // Handle different response types
    switch (msg.type) {
        case CodexMessageTypeEnum.EXEC_APPROVAL_REQUEST: {
            console.log('\nCommand execution requested:', msg.command);
            // Handle command approval
            sdk.handleCommand(response.id, true);
            break;
        }
        case CodexMessageTypeEnum.APPLY_PATCH_APPROVAL_REQUEST: {
            console.log('\nPatch requested:', msg.changes);
            // Handle patch approval
            sdk.handlePatch(response.id, true);
            break;
        }
        case CodexMessageTypeEnum.TASK_COMPLETE: {
            console.log('\nTask complete:', msg.last_agent_message);
            // You can now send a new message or stop the SDK
            sdk.stop();
            break;
        }
        case CodexMessageTypeEnum.ERROR: {
            console.error('\nError occurred:', msg.message);
            // Handle error
            break;
        }
    }
});

// Set up error handler
sdk.onError((response: CodexResponse) => {
    console.error('Error:', response);
});

// Start the Codex process (if not started yet)
sdk.start();

// Configure session with detailed settings
// You can also use `~/.codex/config.toml` to configure the codex (https://github.com/openai/codex/blob/main/codex-rs/config.md)
await sdk.configureSession({
    model: 'codex-mini-latest',
    instructions: 'You are a helpful coding assistant. Provide concise and clear responses.',
    model_reasoning_effort: ModelReasoningEffort.NONE,
    model_reasoning_summary: ModelReasoningSummary.NONE,
    // Optional: Configure the model provider (OpenAI by default)
    // provider: {
    //     name: 'OpenAI',
    //     base_url: 'https://api.openai.com/v1',
    //     // Name in the environment variable for the API key (OPENAI_API_KEY by default)
    //     env_key: 'OPENAI_API_KEY',
    //     env_key_instructions: 'Create an API key (https://platform.openai.com) and export it as an environment variable.',
    //     wire_api: 'responses'
    // },
    approval_policy: AskForApproval.UNLESS_ALLOW_LISTED,
    sandbox_policy: { permissions: [SandboxPermission.DISK_WRITE_CWD] },
    cwd: process.cwd()
});

// Send a text message
sdk.sendUserMessage([
    { type: 'text', text: 'Hello, can you help me with my code?' }
], 'run-id');

// Send a message with both text and image
sdk.sendUserMessage([
    { type: 'text', text: 'Can you analyze this screenshot?' },
    // Option 1: Using a URL
    { 
        type: 'image',
        image_url: 'https://example.com/screenshot.png'
    },
    // Option 2: Using a local file path
    { 
        type: 'local_image',
        path: './screenshots/error.png'
    }
], 'run-id-with-image');

// Handle command approvals (if not auto-approved)
sdk.handleCommand('run-id', true); // Approve a command
sdk.handleCommand('run-id', false); // Reject a command

// Handle patch approvals (if not auto-approved)
sdk.handlePatch('run-id', true); // Approve a patch
sdk.handlePatch('run-id', false); // Reject a patch

// Abort a request if needed
sdk.abort('run-id');

// Stop the process when done
sdk.stop();

// Handle process cleanup
process.on('SIGINT', () => {
    console.log('\nStopping SDK...');
    sdk.stop();
    process.exit(0);
});
```

## API Reference

### CodexSDK

The main class for interacting with Codex.

#### Constructor

```typescript
new CodexSDK(options?: CodexProcessOptions)
```

Options:
- `cwd?: string` - Working directory for the Codex process
- `env?: NodeJS.ProcessEnv` - Environment variables
- `apiKey?: string` - OpenAI API key (defaults to OPENAI_API_KEY env variable)
- `session?: SessionConfig` - Session configuration
- `logLevel?: LogLevel` - Logging level (defaults to INFO)
- `codexPath?: string` - Custom path to the codex binary (if not provided, will look for 'codex' in PATH)

#### Methods

##### `start()`
Starts the Codex process if it's not already running.

##### `stop()`
Stops the Codex process if it's running.

##### `restart()`
Restarts the Codex process.

##### `configure(options: Partial<ConfigureSessionOperation>)`
Updates the session configuration.

```typescript
sdk.configure({
    instructions: 'New instructions',
    model: 'codex-mini-latest'
});
```

##### `sendUserMessage(items: InputItem[], runId?: string)`
Sends a message to Codex. The message can contain text and/or images.

```typescript
// InputItem type definition
type InputItem = 
    | { type: 'text'; text: string }
    | { type: 'image'; image_url: string }      // Image from URL
    | { type: 'local_image'; path: string };    // Image from local file

// Examples:
// Send text only
sdk.sendUserMessage([
    { type: 'text', text: 'Hello' }
]);

// Send image from URL
sdk.sendUserMessage([
    { 
        type: 'image',
        image_url: 'https://example.com/screenshot.png'
    }
]);

// Send local image
sdk.sendUserMessage([
    { 
        type: 'local_image',
        path: './screenshots/error.png'
    }
]);

// Send both text and image
sdk.sendUserMessage([
    { type: 'text', text: 'Description' },
    { type: 'image', image_url: 'https://example.com/image.png' }
]);

// Send with custom run ID
sdk.sendUserMessage([...], 'custom-run-id');
```

Parameters:
- `items: InputItem[]` - Array of input items (text messages and/or images)
- `runId?: string` - Optional unique identifier for the message run. If not provided, a new UUID will be generated

Note: For images, you can either:
1. Provide a URL using `type: 'image'` with `image_url`
2. Provide a local file path using `type: 'local_image'` with `path` (relative to the working directory)

##### `handleCommand(callId: string, approved: boolean, forSession?: boolean)`
Handles command execution requests.

```typescript
// Approve command for current session only
sdk.handleCommand('cmd-123', true, true);

// Approve command permanently
sdk.handleCommand('cmd-123', true);

// Reject command
sdk.handleCommand('cmd-123', false);
```

##### `handlePatch(callId: string, approved: boolean, forSession?: boolean)`
Handles patch application requests.

```typescript
// Approve patch for current session only
sdk.handlePatch('patch-123', true, true);

// Approve patch permanently
sdk.handlePatch('patch-123', true);

// Reject patch
sdk.handlePatch('patch-123', false);
```

##### `abort(requestId: string)`
Aborts the current operation.

```typescript
sdk.abort('request-123');
```

##### `onResponse(callback: (response: CodexResponse) => void)`
Registers a callback for Codex responses. The response can be of different types:

```typescript
// Common response types
type CodexResponse = {
    id: string;
    msg: {
        type: CodexMessageTypeEnum;
        // ... other fields depending on type
    }
};

// Example response handler
sdk.onResponse((response: CodexResponse) => {
    switch (response.msg.type) {
        case CodexMessageTypeEnum.TASK_COMPLETE:
            console.log('Task complete:', response.msg.summary);
            // Task is done, you can:
            // - Send a new message
            // - Stop the SDK
            // - Process the results
            break;
            
        case CodexMessageTypeEnum.ERROR:
            console.error('Error occurred:', response.msg.message);
            // Handle error, e.g.:
            // - Stop the SDK
            // - Notify the user
            break;
            
        case CodexMessageTypeEnum.EXEC_APPROVAL_REQUEST:
            // Handle command approval request
            break;
            
        case CodexMessageTypeEnum.APPLY_PATCH_APPROVAL_REQUEST:
            // Handle patch approval request
            break;
            
        case CodexMessageTypeEnum.TASK_STARTED:
            console.log('Task started:', response.msg.task_id);
            break;
            
        case CodexMessageTypeEnum.AGENT_MESSAGE:
            console.log('Agent message:', response.msg.content);
            break;
            
        // ... other response types
    }
});
```

### LogLevel

Available logging levels:
- `LogLevel.ERROR` - Error messages only
- `LogLevel.WARN` - Warning and error messages
- `LogLevel.INFO` - Info, warning, and error messages
- `LogLevel.DEBUG` - All messages including debug information

## Error Handling

The SDK throws errors in the following cases:
- When trying to send a message while Codex is not started
- When Codex's stdin is not writable
- When there are issues with the Codex process

Example error handling:

```typescript
try {
    sdk.sendUserMessage([{ type: 'text', text: 'Hello' }]);
} catch (error) {
    console.error('Failed to send message:', error);
}
```

## Environment Variables

The SDK uses the following environment variables:
- `OPENAI_API_KEY` - Your OpenAI API key (required for authentication)

## License

MIT

