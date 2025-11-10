import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Outputs', () => {
  const outputsPath = path.resolve(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
  let outputs: Record<string, unknown>;

  beforeAll(() => {
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Expected outputs file at ${outputsPath}`);
    }

    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent);
  });

  it('outputs file contains at least one output', () => {
    expect(Object.keys(outputs).length).toBeGreaterThan(0);
  });

  it('all output values are strings', () => {
    Object.values(outputs).forEach((value) => {
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
    });
  });

  // Test for VPC outputs if present
  describe('VPC Outputs', () => {
    it('contains VpcId output if present', () => {
      if (outputs.VpcId) {
        expect(typeof outputs.VpcId).toBe('string');
        const vpcId = outputs.VpcId as string;
        expect(vpcId).toMatch(/^vpc-[0-9a-f]{8,}$/);
      } else {
        console.log('⚠️  VpcId not found in outputs, skipping VPC tests');
      }
    });

    it('contains VpcCidr output if present', () => {
      if (outputs.VpcCidr) {
        expect(typeof outputs.VpcCidr).toBe('string');
        const cidr = outputs.VpcCidr as string;
        const cidrParts = cidr.split('/');
        expect(cidrParts).toHaveLength(2);
        const [ip] = cidrParts;
        const firstOctet = Number(ip.split('.')[0]);
        expect(firstOctet).toBeGreaterThanOrEqual(0);
        expect(firstOctet).toBeLessThanOrEqual(255);
      } else {
        console.log('⚠️  VpcCidr not found in outputs, skipping CIDR tests');
      }
    });
  });

  // Test for multi-region disaster recovery outputs if present
  describe('Multi-Region Disaster Recovery Outputs', () => {
    it('contains globalTableName output if present', () => {
      if (outputs.globalTableName) {
        expect(typeof outputs.globalTableName).toBe('string');
        const tableName = outputs.globalTableName as string;
        expect(tableName.length).toBeGreaterThan(0);
      } else {
        console.log('⚠️  globalTableName not found in outputs');
      }
    });

    it('contains primaryBucketName output if present', () => {
      if (outputs.primaryBucketName) {
        expect(typeof outputs.primaryBucketName).toBe('string');
        const bucketName = outputs.primaryBucketName as string;
        expect(bucketName.length).toBeGreaterThan(0);
        expect(bucketName).toMatch(/^[a-z0-9-]+$/);
      } else {
        console.log('⚠️  primaryBucketName not found in outputs');
      }
    });

    it('contains secondaryBucketName output if present', () => {
      if (outputs.secondaryBucketName) {
        expect(typeof outputs.secondaryBucketName).toBe('string');
        const bucketName = outputs.secondaryBucketName as string;
        expect(bucketName.length).toBeGreaterThan(0);
        expect(bucketName).toMatch(/^[a-z0-9-]+$/);
      } else {
        console.log('⚠️  secondaryBucketName not found in outputs');
      }
    });

    it('contains primaryLambdaUrl output if present', () => {
      if (outputs.primaryLambdaUrl) {
        expect(typeof outputs.primaryLambdaUrl).toBe('string');
        const url = outputs.primaryLambdaUrl as string;
        expect(url).toMatch(/^https:\/\/.+/);
      } else {
        console.log('⚠️  primaryLambdaUrl not found in outputs');
      }
    });

    it('contains secondaryLambdaUrl output if present', () => {
      if (outputs.secondaryLambdaUrl) {
        expect(typeof outputs.secondaryLambdaUrl).toBe('string');
        const url = outputs.secondaryLambdaUrl as string;
        expect(url).toMatch(/^https:\/\/.+/);
      } else {
        console.log('⚠️  secondaryLambdaUrl not found in outputs');
      }
    });
  });
});
