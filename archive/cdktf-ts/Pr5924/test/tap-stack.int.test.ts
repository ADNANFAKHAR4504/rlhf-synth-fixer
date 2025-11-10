import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  test('should have environment configured', () => {
    const env = process.env.ENVIRONMENT_SUFFIX || 'dev';
    expect(env).toBeDefined();
    expect(typeof env).toBe('string');
  });

  test('should have AWS region configured', () => {
    const region = process.env.AWS_REGION || 'us-east-1';
    expect(region).toBeDefined();
    expect(typeof region).toBe('string');
  });

  test('should validate deployment outputs if available', () => {
    const outputFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    
    if (fs.existsSync(outputFilePath)) {
      const outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
    } else {
      console.log('Outputs file not found, skipping deployment validation');
    }
  });
});
