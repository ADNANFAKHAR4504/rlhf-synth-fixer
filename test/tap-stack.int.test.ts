import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';

// Fetch live outputs from CloudFormation
describe('TapStack Integration Tests (live AWS resources)', () => {
  let outputs: any;

  beforeAll(async () => {
    const region = process.env.AWS_REGION || 'us-east-1';
    const suffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
    const stackName = `TapStack${suffix}`;

    // Ensure shared config is loaded when using AWS_PROFILE
    if (process.env.AWS_PROFILE && !process.env.AWS_SDK_LOAD_CONFIG) {
      process.env.AWS_SDK_LOAD_CONFIG = '1';
    }

    // Basic env-based credential presence check for clearer error messages
    const hasCreds = Boolean(
      process.env.AWS_ACCESS_KEY_ID ||
        process.env.AWS_PROFILE ||
        process.env.AWS_WEB_IDENTITY_TOKEN_FILE
    );
    if (!hasCreds) {
      throw new Error(
        'AWS credentials are not configured. Set AWS_PROFILE (and AWS_SDK_LOAD_CONFIG=1) or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY before running integration tests.'
      );
    }

    const cfn = new CloudFormationClient({ region });
    const resp = await cfn.send(new DescribeStacksCommand({ StackName: stackName }));
    const stack = resp.Stacks && resp.Stacks[0];
    if (!stack || !stack.Outputs) {
      throw new Error(`Could not load CloudFormation outputs for stack ${stackName} in ${region}. Ensure the stack is deployed and AWS credentials are configured (AWS_PROFILE/keys).`);
    }
    outputs = (stack.Outputs || []).reduce((acc: Record<string, string>, o) => {
      if (o.OutputKey && o.OutputValue) acc[o.OutputKey] = o.OutputValue;
      return acc;
    }, {});

    console.log(`Loaded outputs from CloudFormation stack: ${stackName} (${region})`);
    console.log(`Available output keys: ${Object.keys(outputs).join(', ')}`);
  });

  test('01 - has ApiGatewayUrl', () => {
    expect(typeof outputs.ApiGatewayUrl).toBe('string');
    expect(outputs.ApiGatewayUrl.length).toBeGreaterThan(10);
  });

  test('02 - has DynamoDBTableName', () => {
    expect(typeof outputs.DynamoDBTableName).toBe('string');
    expect(outputs.DynamoDBTableName.length).toBeGreaterThan(5);
  });

  test('03 - has DynamoDBTableArn', () => {
    expect(typeof outputs.DynamoDBTableArn).toBe('string');
    expect(outputs.DynamoDBTableArn.length).toBeGreaterThan(20);
  });

  test('04 - has EnvironmentSuffix', () => {
    expect(typeof outputs.EnvironmentSuffix).toBe('string');
    expect(outputs.EnvironmentSuffix.length).toBeGreaterThan(0);
  });

  test('05 - ApiGatewayUrl is valid HTTPS URL', () => {
    expect(typeof outputs.ApiGatewayUrl).toBe('string');
    expect(outputs.ApiGatewayUrl.startsWith('https://')).toBe(true);
  });

  // Structure checks for required output keys
  const requiredKeys = [
    'ApiGatewayUrl',
    'DynamoDBTableName',
    'DynamoDBTableArn',
    'EnvironmentSuffix',
  ];

  requiredKeys.forEach((key, index) => {
    test(`06.${index + 1} - output key present: ${key}`, () => {
      expect(outputs[key]).toBeDefined();
    });
  });

  test('07 - ApiGatewayUrl starts with expected prefix', () => {
    expect(outputs.ApiGatewayUrl.startsWith('https://')).toBe(true);
  });

  test('08 - DynamoDBTableName contains environment suffix', () => {
    expect(outputs.DynamoDBTableName.includes(outputs.EnvironmentSuffix)).toBe(
      true
    );
  });

  test('09 - DynamoDBTableArn contains expected format', () => {
    expect(outputs.DynamoDBTableArn.includes('arn:aws:dynamodb')).toBe(true);
  });

  test('10 - ApiGatewayUrl contains expected domain', () => {
    expect(
      outputs.ApiGatewayUrl.includes('execute-api.us-east-1.amazonaws.com')
    ).toBe(true);
  });

  test('11 - outputs shape is an object', () => {
    expect(typeof outputs).toBe('object');
    expect(Array.isArray(outputs)).toBe(false);
  });

  test('12 - No unexpected empty values', () => {
    Object.values(outputs).forEach(v => {
      expect(v).toBeTruthy();
    });
  });

  test('13 - EnvironmentSuffix is valid', () => {
    expect(outputs.EnvironmentSuffix).toMatch(/^[a-zA-Z0-9]+$/);
  });

  test('14 - DynamoDBTableName follows naming convention', () => {
    expect(outputs.DynamoDBTableName).toMatch(/^[a-zA-Z0-9-]+$/);
  });

  test('15 - ApiGatewayUrl contains prod stage', () => {
    expect(outputs.ApiGatewayUrl.includes('/prod')).toBe(true);
  });

  test('16 - DynamoDBTableArn contains correct region', () => {
    expect(outputs.DynamoDBTableArn.includes('us-east-1')).toBe(true);
  });

  // Local file validation checks
  test('17 - All required output keys are present', () => {
    const missingKeys = requiredKeys.filter(key => !outputs[key]);
    expect(missingKeys).toEqual([]);
  });
});
