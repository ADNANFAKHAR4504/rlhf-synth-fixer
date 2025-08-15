// Configuration - Use local output files instead of live AWS calls
import fs from 'fs';
import path from 'path';

// Read outputs from local files
describe('TapStack Integration Tests (local outputs)', () => {
  let outputs: any;

  beforeAll(async () => {
    // Try to read from local output files first
    const possiblePaths = [
      path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json'),
      path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json'),
      'cfn-outputs/flat-outputs.json',
    ];

    let outputsPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        outputsPath = possiblePath;
        console.log(`Found outputs file at: ${outputsPath}`);
        break;
      }
    }

    if (!outputsPath) {
      throw new Error(
        `Outputs file not found. Checked paths: ${possiblePaths.join(', ')}`
      );
    }

    try {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      outputs = JSON.parse(outputsContent);
      console.log(`Successfully loaded outputs from: ${outputsPath}`);
      console.log(`Available output keys: ${Object.keys(outputs).join(', ')}`);
    } catch (error) {
      throw new Error(`Failed to read or parse outputs file: ${error}`);
    }
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
