# Obsidian Cannonball Plugin Development Guide

## Build Commands
- `npm run dev` - Start development build with watch mode
- `npm run build` - Production build (runs TypeScript check first)
- `npm run version` - Bump version in manifest.json and versions.json
- `npm test` - Run all tests
- `npm test -- prompts.test.ts` - Run specific test file
- `npm run test:coverage` - Run tests with coverage report

## Code Style Guidelines
- **TypeScript**: Strict null checks, no implicit any
- **Format**: 2-space indentation, semicolons required
- **Naming**: Use camelCase for variables/functions, PascalCase for classes/interfaces
- **Types**: Always define types for interfaces, function parameters, and return values
- **Error Handling**: Use try/catch with specific error messages, console.error for logging
- **Imports**: Group imports by source (Obsidian first, then internal imports)
- **Comments**: Use JSDoc comments for functions (especially public ones)
- **Interfaces**: Define interfaces for data structures (see OpenAIResponse, NodeType examples)
- **Constants**: Use UPPER_CASE for constant values, PascalCase for constant objects
- **Promises**: Use async/await pattern for asynchronous code

## Architecture
The plugin uses a prompts-based system with specialized templates for different context types (tasks, questions, bullet lists, etc.), determined dynamically based on cursor position.