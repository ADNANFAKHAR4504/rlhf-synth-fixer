import * as fs from 'fs';
import * as path from 'path';

const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

describe('TapStack CloudFormation Integration (int)', () => {
  let outputs: any;

  beforeAll(() => {
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Integration outputs not found. Run CDK/CI to produce ${outputsPath}`);
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  });

  test('required exports exist and are non-empty', () => {
    const expected = [
      'VPCId',
      'ALBDNSName',
      'CloudFrontDomain',
      'RDSEndpoint',
      'SNSTopic',
      'LogsBucket',
      'KMSKeyId',
    ];
    expected.forEach(k => {
      expect(outputs[k]).toBeDefined();
      expect(outputs[k]).not.toBeNull();
      if (typeof outputs[k] === 'string') {
        expect(outputs[k].length).toBeGreaterThan(0);
      }
    });
  });

  test('VPCId looks like a VPC id', () => {
    expect(outputs.VPCId).toMatch(/^vpc-[0-9a-fA-F]+$/);
  });

  test('ALBDNSName looks like an ELB DNS name', () => {
    expect(outputs.ALBDNSName).toMatch(/\.elb\.amazonaws\.com$/);
  });

  test('CloudFrontDomain ends with cloudfront.net', () => {
    expect(outputs.CloudFrontDomain).toMatch(/\.cloudfront\.net$/);
  });

  test('RDSEndpoint looks like an RDS endpoint', () => {
    expect(outputs.RDSEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
  });

  test('SNSTopic looks like an ARN', () => {
    expect(outputs.SNSTopic).toMatch(/^arn:aws:sns:[\w-]+:\d+:/);
  });

  test('LogsBucket is a non-empty string', () => {
    expect(typeof outputs.LogsBucket).toBe('string');
    expect(outputs.LogsBucket.length).toBeGreaterThan(0);
  });

  test('KMSKeyId present and looks plausible', () => {
    expect(typeof outputs.KMSKeyId).toBe('string');
    // allow either raw key id or arn
    expect(
      outputs.KMSKeyId.match(/^arn:aws:kms:[\w-]+:\d+:key\/[0-9a-f-]+$/) ||
        outputs.KMSKeyId.match(/^[0-9a-f-]{36}$/)
    ).toBeTruthy();
  });

  test('stack name or environment suffix present if exported', () => {
    // optional: check for stack-level exports if present
    if (outputs.StackName) {
      expect(typeof outputs.StackName).toBe('string');
    }
    if (outputs.EnvironmentSuffix) {
      expect(typeof outputs.EnvironmentSuffix).toBe('string');
    }
  });
});
