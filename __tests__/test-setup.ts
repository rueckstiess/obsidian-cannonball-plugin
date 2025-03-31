// This file is used to set up the test environment
// It silences console output and restores it after tests

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug
};

// Silence console output during tests
beforeAll(() => {
  // Mock console methods to suppress output during tests
  global.console.log = jest.fn();
  global.console.error = jest.fn();
  global.console.warn = jest.fn();
  global.console.info = jest.fn();
  global.console.debug = jest.fn();
});

// Restore original console methods after tests
afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
});

// Add a dummy test to make Jest happy
test('test-setup runs correctly', () => {
  expect(true).toBe(true);
});