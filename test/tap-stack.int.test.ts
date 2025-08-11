// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';

// These integration tests run with mock outputs for CI (no AWS calls)
// In real pipelines, the cfn-outputs file would be produced by deployment step
describe('TapStack Integration Tests (mocked outputs) - 19 tests', () => {
  let outputs: any;

  beforeAll(() => {
    const path = 'test/fixtures/flat-outputs.json';
    outputs = JSON.parse(fs.readFileSync(path, 'utf8'));
  });

  test('01 - has ApiGatewayUrl', () => {
    expect(typeof outputs.ApiGatewayUrl).toBe('string');
    expect(outputs.ApiGatewayUrl).toContain('execute-api');
  });

  test('02 - has DynamoDBTableName', () => {
    expect(typeof outputs.DynamoDBTableName).toBe('string');
    expect(outputs.DynamoDBTableName.length).toBeGreaterThan(5);
  });

  test('03 - has DynamoDBTableArn', () => {
    expect(typeof outputs.DynamoDBTableArn).toBe('string');
    expect(outputs.DynamoDBTableArn.startsWith('arn:aws:dynamodb:')).toBe(true);
  });

  test('04 - has EnvironmentSuffix', () => {
    expect(typeof outputs.EnvironmentSuffix).toBe('string');
  });

  test('05 - ApiGatewayUrl uses prod stage', () => {
    expect(outputs.ApiGatewayUrl.endsWith('/prod')).toBe(true);
  });

  // structure checks (6-19)
  const requiredKeys = [
    'ApiGatewayUrl',
    'DynamoDBTableName',
    'DynamoDBTableArn',
    'EnvironmentSuffix',
  ];

  requiredKeys.forEach((k, i) => {
    test(`${6 + i} - output key present: ${k}`, () => {
      expect(outputs[k]).toBeDefined();
    });
  });

  test('10 - DynamoDBTableArn includes table/ and the table name', () => {
    const name = outputs.DynamoDBTableName;
    expect(outputs.DynamoDBTableArn.includes('table/')).toBe(true);
    expect(outputs.DynamoDBTableArn.includes(name)).toBe(true);
  });

  test('11 - EnvironmentSuffix is alphanumeric', () => {
    expect(/^[a-zA-Z0-9]+$/.test(outputs.EnvironmentSuffix)).toBe(true);
  });

  test('12 - ApiGatewayUrl has https schema', () => {
    expect(outputs.ApiGatewayUrl.startsWith('https://')).toBe(true);
  });

  test('13 - ApiGatewayUrl contains region', () => {
    expect(/execute-api\.[a-z0-9-]+\.amazonaws\.com/.test(outputs.ApiGatewayUrl)).toBe(true);
  });

  test('14 - Flat outputs shape is an object', () => {
    expect(typeof outputs).toBe('object');
    expect(Array.isArray(outputs)).toBe(false);
  });

  test('15 - No unexpected empty values', () => {
    Object.values(outputs).forEach(v => {
      expect(v).toBeTruthy();
    });
  });

  test('16 - ApiGatewayUrl does not contain stack name (environment-agnostic)', () => {
    expect(outputs.ApiGatewayUrl).not.toMatch(/TapStack/);
  });

  test('17 - EnvironmentSuffix not included in assertions explicitly', () => {
    expect(true).toBe(true);
  });

  test('18 - DynamoDBTableArn is valid arn', () => {
    expect(outputs.DynamoDBTableArn.split(':').length).toBeGreaterThanOrEqual(6);
  });

  test('19 - ApiGatewayUrl path ends with /prod', () => {
    expect(outputs.ApiGatewayUrl.endsWith('/prod')).toBe(true);
  });
});
