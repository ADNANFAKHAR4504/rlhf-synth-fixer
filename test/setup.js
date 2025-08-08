// Test setup configuration
global.console = {
  ...console,
  // Suppress console.log during tests unless needed for debugging
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error, // Keep error logs for debugging
};

// Mock environment variables
process.env.NODE_ENV = 'test';

// Mock AWS SDK calls to prevent actual AWS calls during testing
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({
    send: jest.fn(),
  })),
  GetItemCommand: jest.fn(),
  PutItemCommand: jest.fn(),
  UpdateItemCommand: jest.fn(),
  DeleteItemCommand: jest.fn(),
  DescribeTableCommand: jest.fn(),
}));

// Set up Jest timeout
jest.setTimeout(30000);

// CDKTF Testing setup
const cdktf = require('cdktf');
cdktf.Testing.setupJest();