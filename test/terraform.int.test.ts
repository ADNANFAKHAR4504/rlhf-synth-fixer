import fs from 'fs';
import path from 'path';

type Outputs = Partial<{
  vpc_id: string;
  private_subnet_ids: string[];
  public_subnet_ids: string[];
  rds_endpoint: string;
  dynamodb_table_name: string;
  lambda_function_name: string;
  cloudfront_domain_name: string;
  static_bucket_name: string;
  sns_topic_arn: string;
  kms_data_key_id: string;
  kms_logs_key_id: string;
}>;

const outputsPath = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');

function loadOutputs(): { found: boolean; json: Outputs } {
  if (!fs.existsSync(outputsPath)) {
    return { found: false, json: {} };
  }
  const raw = fs.readFileSync(outputsPath, 'utf8');
  try {
    const parsed = JSON.parse(raw);

    // Check if this is Terraform output format with { value, sensitive, type } structure
    const firstKey = Object.keys(parsed)[0];
    if (firstKey && parsed[firstKey] && typeof parsed[firstKey] === 'object' && 'value' in parsed[firstKey]) {
      // Extract just the values from Terraform output format
      const flatOutputs: Outputs = {};
      for (const [key, val] of Object.entries(parsed)) {
        if (val && typeof val === 'object' && 'value' in val) {
          flatOutputs[key as keyof Outputs] = (val as any).value;
        }
      }
      return { found: true, json: flatOutputs };
    }

    // Handle nested outputs property
    if (parsed && parsed.outputs) {
      return { found: true, json: parsed.outputs as Outputs };
    }

    // Handle already flat format
    return { found: true, json: parsed as Outputs };
  } catch (e) {
    throw new Error(`Failed to parse JSON at ${outputsPath}: ${(e as Error).message}`);
  }
}

// Validators
const isVpcId = (s: unknown) => typeof s === 'string' && /^vpc-[0-9a-f]{8,17}$/.test(s);
const isSubnetId = (s: unknown) => typeof s === 'string' && /^subnet-[0-9a-f]{8,17}$/.test(s);
const isArn = (s: unknown) => typeof s === 'string' && /^arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:.+/.test(s);
const isKmsKeyId = (s: unknown) => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(s);
const isCloudFrontDomain = (s: unknown) => typeof s === 'string' && /^[a-z0-9]+\.cloudfront\.net$/.test(s);
const isRdsEndpoint = (s: unknown) => typeof s === 'string' && /^[a-z0-9-]+(\.[a-z0-9]+)*\.[a-z0-9-]+\.rds\.amazonaws\.com$/.test(s);
const isBucketName = (s: unknown) => typeof s === 'string' && /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(s);

describe('Terraform integration - outputs conformance', () => {
  const { found, json } = loadOutputs();

  (found ? describe : describe.skip)('Positive path - real outputs.json present', () => {
    test('has required core outputs', () => {
      expect(json).toHaveProperty('vpc_id');
      expect(json).toHaveProperty('private_subnet_ids');
      expect(json).toHaveProperty('public_subnet_ids');
      expect(json).toHaveProperty('rds_endpoint');
      expect(json).toHaveProperty('dynamodb_table_name');
      expect(json).toHaveProperty('lambda_function_name');
      expect(json).toHaveProperty('cloudfront_domain_name');
      expect(json).toHaveProperty('static_bucket_name');
      expect(json).toHaveProperty('sns_topic_arn');
      expect(json).toHaveProperty('kms_data_key_id');
      expect(json).toHaveProperty('kms_logs_key_id');
    });

    test('VPC and subnets formats are valid', () => {
      expect(isVpcId(json.vpc_id)).toBe(true);
      expect(Array.isArray(json.private_subnet_ids)).toBe(true);
      expect(Array.isArray(json.public_subnet_ids)).toBe(true);
      expect((json.private_subnet_ids || []).length).toBeGreaterThanOrEqual(2);
      expect((json.public_subnet_ids || []).length).toBeGreaterThanOrEqual(2);
      (json.private_subnet_ids || []).forEach(id => expect(isSubnetId(id)).toBe(true));
      (json.public_subnet_ids || []).forEach(id => expect(isSubnetId(id)).toBe(true));
    });

    test('Data plane endpoints and names are sane', () => {
      expect(isRdsEndpoint(json.rds_endpoint)).toBe(true);
      expect(typeof json.dynamodb_table_name).toBe('string');
      expect((json.dynamodb_table_name || '').length).toBeGreaterThan(0);
      expect(typeof json.lambda_function_name).toBe('string');
      expect((json.lambda_function_name || '').length).toBeGreaterThan(0);
    });

    test('Delivery and storage outputs are valid', () => {
      expect(isCloudFrontDomain(json.cloudfront_domain_name)).toBe(true);
      expect(isBucketName(json.static_bucket_name)).toBe(true);
      expect(isArn(json.sns_topic_arn)).toBe(true);
      expect(isKmsKeyId(json.kms_data_key_id)).toBe(true);
      expect(isKmsKeyId(json.kms_logs_key_id)).toBe(true);
    });
  });

  describe('Edge cases - validator behavior on malformed outputs', () => {
    test('rejects invalid VPC and subnet ids', () => {
      expect(isVpcId('vpc-xyz')).toBe(false);
      expect(isSubnetId('subnet-12345')).toBe(false);
      expect(isSubnetId('')).toBe(false);
    });

    test('rejects invalid ARNs and KMS IDs', () => {
      expect(isArn('arn:aws:sns:::bad')).toBe(false);
      expect(isKmsKeyId('deadbeef')).toBe(false);
      expect(isKmsKeyId('00000000-0000-0000-0000-000000000000')).toBe(true);
    });

    test('rejects invalid domains and endpoints', () => {
      expect(isCloudFrontDomain('d111111abcdef8.cloudfront.net')).toBe(true);
      expect(isCloudFrontDomain('http://bad.cloudfront.net')).toBe(false);
      expect(isRdsEndpoint('db-abc.us-west-2.rds.amazonaws.com')).toBe(true);
      expect(isRdsEndpoint('db-abc.example.com')).toBe(false);
    });

    test('rejects invalid bucket names', () => {
      expect(isBucketName('Invalid_Bucket')).toBe(false);
      expect(isBucketName('aa')).toBe(false);
      expect(isBucketName('valid-bucket.name-123')).toBe(true);
    });
  });
});

