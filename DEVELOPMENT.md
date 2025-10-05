# Developer Documentation

Complete guide for developers who want to contribute to or modify the NSF Awards MCP Server.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Architecture Decisions](#architecture-decisions)
- [Building the Project](#building-the-project)
- [Running in Development Mode](#running-in-development-mode)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Troubleshooting](#troubleshooting)
- [Platform-Specific Instructions](#platform-specific-instructions)
- [Contributing](#contributing)

## Prerequisites

### Required Software

- **Node.js**: Version 18.x or higher (LTS recommended)
  - Check version: `node --version`
  - Download from: https://nodejs.org/

- **npm**: Version 9.x or higher (usually included with Node.js)
  - Check version: `npm --version`

- **Git**: For version control
  - Check version: `git --version`
  - Download from: https://git-scm.com/

### Optional but Recommended

- **TypeScript knowledge**: Familiarity with TypeScript 5.x
- **MCP understanding**: Basic knowledge of Model Context Protocol
- **VS Code**: Recommended editor with TypeScript support
- **nvm/fnm**: Node version manager for managing multiple Node.js versions

### Verify Prerequisites

Run these commands to verify your setup:

```bash
node --version    # Should be v18.x or higher
npm --version     # Should be 9.x or higher
git --version     # Any recent version
```

## Quick Start

Get up and running in 5 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/nsf-awards-mcp.git
cd nsf-awards-mcp

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. Run tests (optional)
npm test

# 5. Start in development mode
npm run dev
```

## Development Setup

### 1. Clone the Repository

**Via HTTPS:**
```bash
git clone https://github.com/yourusername/nsf-awards-mcp.git
cd nsf-awards-mcp
```

**Via SSH:**
```bash
git clone git@github.com:yourusername/nsf-awards-mcp.git
cd nsf-awards-mcp
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- Production dependencies (MCP SDK, axios, winston, etc.)
- Development dependencies (TypeScript, Jest, ESLint, etc.)

**Common installation issues:**

- **Permission errors on Linux/macOS**: Use `sudo` carefully or fix npm permissions
- **Network issues**: Try `npm install --registry=https://registry.npmjs.org/`
- **Lock file conflicts**: Delete `node_modules` and `package-lock.json`, then reinstall

### 3. Configure TypeScript

The project comes with a pre-configured `tsconfig.json`. Key settings:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true
  }
}
```

### 4. Set Up Your Editor

**VS Code (Recommended):**

Install these extensions:
- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- TypeScript and JavaScript Language Features (built-in)

**VS Code settings** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.validate": ["javascript", "typescript"],
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Project Structure

```
nsf-awards-mcp/
├── src/                          # Source TypeScript files
│   ├── index.ts                  # MCP server entry point
│   ├── client/                   # NSF API HTTP client
│   │   └── nsf-api-client.ts     # Axios-based API client
│   ├── tools/                    # MCP tool implementations
│   │   ├── index.ts              # Tool exports
│   │   ├── search-awards.ts      # Award search tool
│   │   ├── get-award-details.ts  # Award details tool
│   │   ├── get-project-outcomes.ts # Project outcomes tool
│   │   ├── search-by-institution.ts # Institution search
│   │   └── search-by-pi.ts       # PI search tool
│   ├── types/                    # TypeScript type definitions
│   │   ├── nsf-api.types.ts      # NSF API types
│   │   └── mcp-tools.types.ts    # MCP tool types
│   └── utils/                    # Utility functions
│       ├── logger.ts             # Winston logger
│       └── date-utils.ts         # Date formatting
├── build/                        # Compiled JavaScript (gitignored)
├── tests/                        # Test files
├── node_modules/                 # Dependencies (gitignored)
├── package.json                  # Project metadata
├── tsconfig.json                 # TypeScript configuration
├── jest.config.js                # Jest configuration
├── .eslintrc.js                  # ESLint configuration
└── README.md                     # User documentation
```

### Key Files Explained

- **`src/index.ts`**: MCP server setup, tool registration, and stdio transport
- **`src/client/nsf-api-client.ts`**: HTTP client with retry logic and error handling
- **`src/tools/*.ts`**: Individual tool implementations following MCP spec
- **`src/types/*.ts`**: Type definitions for type safety and autocomplete
- **`src/utils/logger.ts`**: Centralized logging configuration

## Architecture Decisions

### Output Format: JSON Only

**All MCP tool outputs use JSON format exclusively.**

**Rationale:**
- AI language models work best with structured JSON data
- JSON is easily parsed, validated, and transformed
- Enables consistent data handling across all tools
- Better than XML or plain text for LLM consumption

**Implementation:**
```typescript
// All tool handlers should return JSON-stringified results
return {
  content: [
    {
      type: 'text',
      text: JSON.stringify(result, null, 2) // Pretty-printed JSON
    }
  ]
};
```

**Benefits:**
- **Consistency**: All tools return data in the same format
- **Parseability**: LLMs can easily extract specific fields
- **Extensibility**: New fields can be added without breaking existing parsers
- **Human-readable**: Pretty-printing (2-space indent) makes debugging easier

**NSF API Integration:**
- NSF API supports both JSON and XML responses
- We exclusively use JSON (`format=json` parameter)
- Avoids complexity of XML parsing
- Maps directly to TypeScript types

### Type Safety

All API responses and tool arguments use TypeScript interfaces and Zod schemas for runtime validation.

### Error Handling

Errors are wrapped in MCP-compliant error objects with descriptive messages.

## Building the Project

### Standard Build

```bash
npm run build
```

This command:
1. Runs TypeScript compiler (`tsc`)
2. Outputs compiled JavaScript to `build/` directory
3. Generates source maps and type declarations
4. Reports any TypeScript errors

### Watch Mode Build

For active development:

```bash
npm run build -- --watch
```

This will rebuild automatically when you save changes.

### Type Checking Without Building

```bash
npm run type-check
```

This checks for TypeScript errors without generating output files.

### Clean Build

```bash
# Remove build directory
rm -rf build/

# Rebuild from scratch
npm run build
```

## Running in Development Mode

### Development Server with Auto-Reload

```bash
npm run dev
```

This uses `tsx` to:
- Run TypeScript directly without compilation
- Watch for file changes
- Automatically restart on changes
- Show detailed error messages

### Testing Locally

To test the MCP server locally without integrating with a client:

```bash
# Run the built server
npm start

# Or run directly
node build/index.js
```

The server will communicate via stdio (standard input/output).

### Debug Mode

Enable verbose logging:

```bash
LOG_LEVEL=debug npm run dev
```

Or set environment variable:

**Linux/macOS:**
```bash
export LOG_LEVEL=debug
npm run dev
```

**Windows (PowerShell):**
```powershell
$env:LOG_LEVEL="debug"
npm run dev
```

**Windows (Command Prompt):**
```cmd
set LOG_LEVEL=debug
npm run dev
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run in watch mode (re-runs on changes)
npm run test:watch

# Run with coverage report
npm test -- --coverage

# Run specific test file
npm test -- date-utils.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should format date"
```

### Test Structure

Tests are organized to mirror the source structure:

```
tests/
├── client/
│   └── nsf-api-client.test.ts
├── tools/
│   ├── search-awards.test.ts
│   ├── get-award-details.test.ts
│   └── ...
└── utils/
    └── date-utils.test.ts
```

### Writing Tests

Example test structure:

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import MockAdapter from 'axios-mock-adapter';
import { NSFApiClient } from '../src/client/nsf-api-client';

describe('NSFApiClient', () => {
  let client: NSFApiClient;
  let mock: MockAdapter;

  beforeEach(() => {
    client = new NSFApiClient();
    mock = new MockAdapter(client.axios);
  });

  afterEach(() => {
    mock.restore();
  });

  it('should fetch awards successfully', async () => {
    // Test implementation
  });
});
```

### Coverage Goals

Aim for:
- Overall coverage: >80%
- Critical paths (API client, tools): >90%
- Utility functions: 100%

## Code Quality

### Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### Formatting

```bash
# Format code with Prettier
npm run format

# Check formatting without changes
npm run format -- --check
```

### Pre-commit Checks

Before committing, ensure:

```bash
# 1. Type check passes
npm run type-check

# 2. Tests pass
npm test

# 3. Linting passes
npm run lint

# 4. Code is formatted
npm run format
```

### Git Hooks (Optional)

Set up automatic checks with husky:

```bash
npm install --save-dev husky lint-staged

# Initialize husky
npx husky init

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run type-check && npm run lint && npm test"
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: Build Errors

**Error: `Cannot find module '@modelcontextprotocol/sdk'`**

Solution:
```bash
rm -rf node_modules package-lock.json
npm install
```

**Error: TypeScript compilation errors**

Solution:
```bash
# Check TypeScript version
npm list typescript

# Update TypeScript
npm install --save-dev typescript@latest

# Clean and rebuild
rm -rf build/
npm run build
```

#### Issue: Runtime Errors

**Error: `MODULE_NOT_FOUND` when running**

Solution:
- Ensure you've run `npm run build` before `npm start`
- Check that `build/` directory exists and contains `.js` files
- Verify `package.json` "main" points to correct file

**Error: Port or stdio issues**

Solution:
- MCP servers use stdio, not ports
- Don't try to access via HTTP
- Ensure client is configured correctly

#### Issue: Test Failures

**Error: Tests timing out**

Solution:
```bash
# Increase timeout
npm test -- --testTimeout=10000
```

**Error: Mock adapter issues**

Solution:
- Ensure `axios-mock-adapter` is installed
- Check mock is properly initialized in `beforeEach`
- Restore mock in `afterEach`

#### Issue: Development Mode

**Error: `tsx` not found**

Solution:
```bash
npm install --save-dev tsx
```

**Error: File changes not detected**

Solution:
- Check file is within `src/` directory
- Try restarting dev server
- Use `--clear-screen=false` flag: `npm run dev -- --clear-screen=false`

### Debug Logging

Add debug logging to your code:

```typescript
import { logger } from './utils/logger';

logger.debug('Debug message', { data: someVariable });
logger.info('Info message');
logger.error('Error occurred', { error });
```

View logs in console when running with `LOG_LEVEL=debug`.

## Platform-Specific Instructions

### macOS

**Node.js Installation:**
```bash
# Using Homebrew
brew install node

# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
nvm use --lts
```

**Common Paths:**
- Node modules: `/usr/local/lib/node_modules`
- npm global: `/usr/local/bin`
- Config: `~/.npmrc`

### Linux (Ubuntu/Debian)

**Node.js Installation:**
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
```

**Permission Issues:**
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Windows

**Node.js Installation:**
1. Download installer from https://nodejs.org/
2. Run installer with default settings
3. Verify in PowerShell: `node --version`

**Alternative - Using nvm-windows:**
```powershell
# Install from: https://github.com/coreybutler/nvm-windows/releases
nvm install lts
nvm use lts
```

**Path Issues:**
- Add to PATH if needed: `C:\Program Files\nodejs\`
- npm global: `%APPDATA%\npm`

**PowerShell Execution Policy:**
```powershell
# If scripts won't run
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Line Ending Issues:**
```bash
# Configure git to handle line endings
git config --global core.autocrlf true
```

## Contributing

### Development Workflow

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/nsf-awards-mcp.git
   cd nsf-awards-mcp
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Write code following existing patterns
   - Add tests for new functionality
   - Update types as needed

4. **Test Thoroughly**
   ```bash
   npm run type-check
   npm run lint
   npm test
   npm run build
   ```

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

   Follow conventional commits:
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation
   - `test:` adding tests
   - `refactor:` code refactoring

6. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style Guidelines

- **TypeScript**: Use strict mode, avoid `any` types
- **Naming**:
  - camelCase for variables and functions
  - PascalCase for classes and types
  - UPPER_CASE for constants
- **Imports**: Group by external, internal, types
- **Error Handling**: Always handle errors, use custom error types
- **Comments**: Explain "why", not "what"

### Adding New Tools

To add a new MCP tool:

1. **Create tool file** in `src/tools/your-tool.ts`:
   ```typescript
   import { z } from 'zod';
   import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

   const YourToolSchema = z.object({
     param: z.string().describe('Parameter description'),
   });

   export const yourToolHandler = async (args: unknown) => {
     const validatedArgs = YourToolSchema.parse(args);
     // Implementation

     // IMPORTANT: Always return results as JSON
     // AI models work best with structured JSON data
     return {
       content: [
         {
           type: 'text',
           text: JSON.stringify(result, null, 2)
         }
       ]
     };
   };
   ```

2. **Add to tool exports** in `src/tools/index.ts`

3. **Register in server** in `src/index.ts`

4. **Add tests** in `tests/tools/your-tool.test.ts`

5. **Update documentation** in README.md

**Output Format Guidelines:**
- Always return data as JSON (use `JSON.stringify()`)
- Pretty-print JSON with 2-space indentation for readability
- JSON enables AI models to easily parse and understand results
- Avoid plain text or XML formats for tool outputs

### Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Commit: `git commit -m "chore: release vX.Y.Z"`
4. Tag: `git tag vX.Y.Z`
5. Push: `git push origin main --tags`
6. Publish: `npm publish` (if publishing to npm)

## Additional Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [NSF Award Search API Documentation](https://www.research.gov/common/webapi/awardapisearch-v1.htm)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)

## Getting Help

- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Contributing**: See CONTRIBUTING.md
- **Security**: See SECURITY.md for reporting vulnerabilities
