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

  test('01 - has VpcId', () => {
    expect(typeof outputs.VpcId).toBe('string');
    expect(outputs.VpcId.length).toBeGreaterThan(5);
  });

  test('02 - has S3BucketName', () => {
    expect(typeof outputs.S3BucketName).toBe('string');
    expect(outputs.S3BucketName.length).toBeGreaterThan(5);
  });

  test('03 - has LambdaFunctionName', () => {
    expect(typeof outputs.LambdaFunctionName).toBe('string');
    expect(outputs.LambdaFunctionName.length).toBeGreaterThan(5);
  });

  test('04 - has GuardDutyDetectorId', () => {
    expect(typeof outputs.GuardDutyDetectorId).toBe('string');
  });

  test('05 - has SecurityDashboardURL', () => {
    expect(typeof outputs.SecurityDashboardURL).toBe('string');
    expect(outputs.SecurityDashboardURL.startsWith('https://')).toBe(true);
  });

  // Structure checks for required output keys
  const requiredKeys = [
    'VpcId',
    'S3BucketName',
    'LambdaFunctionName',
    'GuardDutyDetectorId',
    'SecurityDashboardURL',
  ];

  requiredKeys.forEach((key, index) => {
    test(`06.${index + 1} - output key present: ${key}`, () => {
      expect(outputs[key]).toBeDefined();
    });
  });

  test('07 - VpcId starts with expected prefix', () => {
    expect(outputs.VpcId.startsWith('SecureVpc')).toBe(true);
  });

  test('08 - S3BucketName starts with expected prefix', () => {
    expect(outputs.S3BucketName.startsWith('SecureS3Bucket')).toBe(true);
  });

  test('09 - LambdaFunctionName starts with expected prefix', () => {
    expect(outputs.LambdaFunctionName.startsWith('SecureFunction')).toBe(true);
  });

  test('10 - SecurityDashboardURL contains cloudwatch', () => {
    expect(outputs.SecurityDashboardURL.includes('cloudwatch')).toBe(true);
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

  test('13 - VpcId contains environment suffix', () => {
    expect(outputs.VpcId.includes('dev')).toBe(true);
  });

  test('14 - S3BucketName contains environment suffix', () => {
    expect(outputs.S3BucketName.includes('dev')).toBe(true);
  });

  test('15 - LambdaFunctionName contains environment suffix', () => {
    expect(outputs.LambdaFunctionName.includes('dev')).toBe(true);
  });

  test('16 - SecurityDashboardURL contains region', () => {
    expect(outputs.SecurityDashboardURL.includes('us-east-1')).toBe(true);
  });

  // Local file validation checks
  test('17 - All required output keys are present', () => {
    const missingKeys = requiredKeys.filter(key => !outputs[key]);
    expect(missingKeys).toEqual([]);
  });
});
