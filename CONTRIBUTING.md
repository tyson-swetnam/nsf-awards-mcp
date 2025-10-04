# Contributing to NSF Awards MCP

Thank you for your interest in contributing to the NSF Awards MCP tool! This document provides guidelines for contributing to the project.

## Development Setup

1. Fork and clone the repository:
```bash
git clone https://github.com/tyson-swetnam/nsf-awards-mcp.git
cd nsf-awards-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run in development mode:
```bash
npm run dev
```

## Project Structure

```
nsf-awards-mcp/
├── src/
│   └── index.ts          # Main MCP server implementation
├── dist/                 # Compiled JavaScript (generated)
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── README.md             # Main documentation
├── USAGE.md              # Usage examples
└── LICENSE               # MIT License
```

## Making Changes

1. **Create a new branch** for your feature or bugfix:
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes** following the coding standards below

3. **Build and test** your changes:
```bash
npm run build
```

4. **Commit your changes** with a clear message:
```bash
git commit -m "Add feature: description of changes"
```

5. **Push to your fork** and create a Pull Request

## Coding Standards

- Use TypeScript for all source code
- Follow existing code formatting
- Add JSDoc comments for public functions
- Keep functions focused and modular
- Handle errors gracefully
- Validate inputs using Zod schemas

## Adding New Features

When adding new search capabilities:

1. Check the NSF API documentation for available parameters
2. Add parameter to `SearchAwardsArgsSchema` with proper validation
3. Add parameter to the tool's `inputSchema`
4. Update query parameter building in the tool handler
5. Update README.md with new parameter documentation
6. Add usage examples to USAGE.md

## Testing

Currently, the project doesn't have automated tests due to API access requirements. When testing:

1. Manually verify the MCP server starts correctly
2. Test with Claude Desktop or MCP Inspector
3. Verify search results are formatted correctly
4. Test error handling with invalid inputs

## Documentation

Please update documentation when making changes:

- **README.md**: For user-facing changes, installation, or configuration
- **USAGE.md**: For new features or search capabilities
- **CONTRIBUTING.md**: For development process changes

## API Reference

This project uses:
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) - Model Context Protocol SDK
- [NSF Award Search API](https://resources.research.gov/common/webapi/awardapisearch-v1.htm) - NSF's Award Search API

## Questions or Issues?

- Open an issue on GitHub for bugs or feature requests
- Provide as much detail as possible
- Include error messages and steps to reproduce

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
