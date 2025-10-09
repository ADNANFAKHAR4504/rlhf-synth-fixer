import { App, Testing } from 'cdktf';
import { GamingDatabaseStack } from '../lib/tap-stack';

describe('Gaming Database Stack Structure', () => {
  let app: App;
  let stack: GamingDatabaseStack;
  let synthesized: string;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('GamingDatabaseStack instantiates successfully', () => {
    app = new App();
    stack = new GamingDatabaseStack(app, 'gaming-database-stack');
    synthesized = Testing.synth(stack);

    // Verify that GamingDatabaseStack instantiates without errors
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('GamingDatabaseStack contains DynamoDB table', () => {
    app = new App();
    stack = new GamingDatabaseStack(app, 'gaming-database-stack');
    synthesized = Testing.synth(stack);

    // Verify that the synthesized stack contains a DynamoDB table
    expect(synthesized).toContain('aws_dynamodb_table');
    expect(synthesized).toContain('GamePlayerProfiles');
  });
});

// add more test suites and cases as needed
