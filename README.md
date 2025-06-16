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

// Optional: Configure session with detailed settings
// You can also use `~/.codex/config.toml` to configure the codex (https://github.com/openai/codex/blob/main/codex-rs/config.md)
await sdk.configureSession({
    // Provide some instructions for the model
    instructions: 'You are a helpful coding assistant, your name is Flexbe AI Bot. Provide concise and clear responses.',
    // Configure the model provider (OpenAI by default)
    model: 'claude-3-7-sonnet-latest',
    provider: {
        name: 'Anthropic',
        base_url: 'https://api.anthropic.com/v1',
        env_key: 'ANTHROPIC_API_KEY',
        env_key_instructions: 'Create an API key (https://console.anthropic.com) and export it as an environment variable.',
        wire_api: WireApi.CHAT
    },
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

// Send local image
sdk.sendUserMessage([
    {
        type: 'local_image',
        path: './screenshots/error.png'
    }
]);

// Send both text and image
const requestId = sdk.sendUserMessage([
    { type: 'text', text: 'What is your name?' },
    { type: 'text', text: 'What is in this picture?' },
    { type: 'image', image_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABbwAAAJoCAMAAACa8NfLAAAAq1BMVEVHcEz////////////////////////////////////////////////////////19fX6+vr////////////////////5+fn29vb39/f+/v74+Pj9/f37+/v8/Pz////////////r6+zv7+/Pz8+fn5+QkJBwcHBgYGBAQEAgICAQEBAAAACAgIDf399QUFC/v7+vr68wMDCPj49/f39vb2+goKBfX1+wsLDAwMD64tYcAAAAIXRSTlMAECAwQGCAj5+vv8/f7////3BQf29f//////////+QsKBF8TFZAAAxvElEQVR4AezdWbaqOMDHUey9CAFvA3rE6uY/x+rr7WsQiCdk7T2E/8NvZQXQYlGb7W5/OByOx9P5fP5S/ulS/asO4zT/CitBM1obFtE2owWYZUKT6upfl/Ivf6bweDxeD1/3++2mSM1md7iezmVVRRhqDsQbkmpSfSnPp+vX/ednfPv1er7UqQ6FeEOaTarLL8f9tvgUm/31S532UIg3pNykujzui/faXcs6/aEQb0i+SeV1V7zJ/lSteCjEGxJrUnV+Q7833y6rHwrxhsSaVB22kQ/ddQjijXgj3os7b+Oluwz/Em/EG/FeSb63ZQjijXgj3qvK9+YUgngj3oj3uvL9vQ7ijXgj3tFVhwg3JuKNeCPesVXbCMdu8Ua8Ee/YvsU/dos34o14J3n4/l4H8Ua8Ee+3qq8RXjIRb8Qb8Y7ttClm2F6CeCPeMSHeEa5OdnWeQyHekH6Tql0x0Y98h0K8If0mXYtJvuU8FOIN6TfpW4R2izfijXgnWO9TEG+WjXcn3oh39Hqfg3gj3vDpTTrHuTMRb3rxRrxjOkVpt3hza8a6iTfiPcG3z223eIt3L96Id9R6fw8RiLd4N3fxRryn+FGMsgvizXgfzWgP8Ua8J9kVI2wrQ72ArhltEG/Ee5J6W/y/NpWhiNTSTrwR72kum4U/zhFvhma0XrwR74lOn/ewUrzFu3mKN+Id50eqtrWhXsO9Ga8Vb8Q7zrV3ZahX0b/h3kS80aRy2a9zxJtbM95TvBHvCBcnW0Pxuq4Z7ybeiHeEi5PKUHF5Ytk8xRvxXvzi5GCoCXg2bzl6izeadF3w00rx5t6/5egt3mhSvVnw/xfEm9t7jt7i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' }
]);
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
sdk.handleCommand(requestId, true, true);

// Approve command permanently
sdk.handleCommand(requestId, true);

// Reject command
sdk.handleCommand(requestId, false);
```

##### `handlePatch(callId: string, approved: boolean, forSession?: boolean)`

Handles patch application requests.

```typescript
// Approve patch for current session only
sdk.handlePatch(requestId, true, true);

// Approve patch permanently
sdk.handlePatch(requestId, true);

// Reject patch
sdk.handlePatch(requestId, false);
```

##### `abort(requestId: string)`

Aborts the current operation.

```typescript
sdk.abort(requestId);
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
