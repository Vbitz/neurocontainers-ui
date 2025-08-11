# Testing Guide

This project includes comprehensive testing with both unit tests and end-to-end (E2E) tests.

## Running Tests

### Unit Tests
Unit tests cover core business logic functions and utilities:

```bash
# Run all unit tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage report
bun run test:coverage
```

### End-to-End Tests
E2E tests validate complete user workflows using Playwright:

```bash
# Run E2E tests (requires dev server)
bun run test:e2e

# Run E2E tests with UI (interactive mode)
bun run test:e2e:ui

# Run all tests (unit + E2E)
bun run test:all
```

### Prerequisites for E2E Tests
E2E tests require Playwright browsers to be installed:

```bash
bunx playwright install
```

## Test Structure

### Unit Tests (`lib/__tests__/`)
- `containerStorage.test.ts` - Tests for localStorage container management
- `packages.test.ts` - Tests for package search functionality  
- `templates.test.ts` - Tests for template system

### E2E Tests (`tests/e2e/`)
- `homepage.spec.ts` - Homepage functionality and navigation
- `container-builder.spec.ts` - Complete container creation workflows

## Coverage

Unit tests focus on:
- ✅ Container storage and persistence
- ✅ Package search and filtering
- ✅ Template system functionality
- ✅ Utility functions and helpers

E2E tests validate:
- ✅ Homepage navigation and UI elements
- ✅ Container creation workflow
- ✅ YAML import/export functionality
- ✅ Form validation and error handling
- ✅ Data persistence across page reloads

## CI/CD Integration

Tests run automatically in the CI pipeline before deployment:
1. Unit tests and linting run on every push
2. Build only proceeds if all tests pass
3. E2E tests can be enabled by uncommenting lines in `.github/workflows/deploy.yaml`

## Development Workflow

1. Write unit tests for new utility functions
2. Add E2E tests for new user-facing features
3. Run tests locally before committing
4. Ensure all tests pass in CI before merging