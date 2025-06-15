# Codex JS SDK

A TypeScript/JavaScript SDK for interacting with the Codex process. This SDK provides a simple interface for managing Codex sessions, sending messages, and handling responses.

## Installation

```bash
npm install codex-js-sdk
```

## Quick Start

```typescript
import { CodexSDK, LogLevel } from 'codex-js-sdk';

// Create a new SDK instance
const sdk = new CodexSDK({
    // Optional: Set custom working directory
    cwd: './my-project',
    // Optional: Set custom API key (defaults to OPENAI_API_KEY env variable)
    apiKey: 'your-api-key',
    // Optional: Configure logging level
    logLevel: LogLevel.DEBUG,
    // Optional: Customize session settings
    session: {
        instructions: 'Your custom instructions here',
        model: 'codex-mini-latest'
    }
});

// Start the Codex process
sdk.start();

// Listen for responses
sdk.onResponse((response) => {
    console.log('Received response:', response);
});

// Send a message
sdk.sendUserMessage([
    { type: 'text', text: 'Hello, can you help me with my code?' }
]);

// Handle command approvals
sdk.handleCommand('command-id', true); // Approve a command
sdk.handleCommand('command-id', false); // Reject a command

// Handle patch approvals
sdk.handlePatch('patch-id', true); // Approve a patch
sdk.handlePatch('patch-id', false); // Reject a patch

// Stop the process when done
sdk.stop();
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
Sends a message to Codex.

```typescript
// Send text
sdk.sendUserMessage([
    { type: 'text', text: 'Hello' }
]);

// Send text with custom run ID
sdk.sendUserMessage([
    { type: 'text', text: 'Hello' }
], 'custom-run-id');
```

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
Registers a callback for Codex responses.

```typescript
const unsubscribe = sdk.onResponse((response) => {
    console.log('Received:', response);
});

// Later, to unsubscribe:
unsubscribe();
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
- `OPENAI_API_KEY` - Your OpenAI API key (if not provided in options)

## License

MIT

