import fs from 'fs';
import path from 'path';

describe('Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent);
  });

  test('should have all required outputs', () => {
    expect(outputs).toBeDefined();
    expect(outputs.KMSKeyId).toBeDefined();
    expect(outputs.DatabaseSecretArn).toBeDefined();
    expect(outputs.EnvironmentSuffix).toBeDefined();
  });

  test('KMS Key ARN should have correct format', () => {
    expect(outputs.KMSKeyArn).toMatch(/^arn:aws:kms/);
  });

  test('Database Secret ARN should have correct format', () => {
    expect(outputs.DatabaseSecretArn).toMatch(/^arn:aws:secretsmanager/);
  });
});
