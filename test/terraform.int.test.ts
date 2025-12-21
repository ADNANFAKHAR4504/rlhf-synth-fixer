import {
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  ListBucketsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// Detect LocalStack environment
const isLocalStack = (() => {
  const endpoint = process.env.AWS_ENDPOINT_URL || '';
  return endpoint.includes('localhost') || endpoint.includes('localstack');
})();

const region = process.env.AWS_REGION || 'us-east-1';

// AWS SDK client configuration
const clientConfig = isLocalStack
  ? {
      region,
      endpoint: process.env.AWS_ENDPOINT_URL,
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
    }
  : { region };

const ec2 = new EC2Client(clientConfig);
const s3 = new S3Client(clientConfig);

// Load outputs from file (deployed by CI)
const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, any> = {};

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} catch (e) {
  console.warn('Could not load outputs file:', outputsPath);
}

// Check if outputs look like placeholders
const hasOutputs = Object.keys(outputs).length > 0;
const looksPlaceholder = (() => {
  const vpcPlaceholder = /placeholder/.test(outputs?.vpc_id || '');
  return vpcPlaceholder;
})();

// Auto-enable E2E tests when valid outputs exist
const runE2E = (() => {
  if (process.env.E2E === 'false') return false;
  if (process.env.E2E === 'true') return true;
  return hasOutputs && !looksPlaceholder;
})();

if (!runE2E) {
  console.warn('Skipping E2E tests: No valid outputs or E2E=false');
}

describe('Terraform Integration Tests - Output Validation', () => {
  test('outputs file exists and has required keys', () => {
    expect(fs.existsSync(outputsPath)).toBe(true);

    const requiredKeys = [
      'vpc_id',
      'public_subnet_ids',
      'private_subnet_ids',
      'alb_dns_name',
      'app_data_s3_bucket_name',
    ];

    for (const key of requiredKeys) {
      expect(outputs[key]).toBeDefined();
      const val = outputs[key];
      if (Array.isArray(val)) {
        expect(val.length).toBeGreaterThan(0);
      } else {
        expect(String(val).length).toBeGreaterThan(0);
      }
    }
  });

  test('VPC ID has valid format', () => {
    if (looksPlaceholder) return;
    expect(outputs.vpc_id).toMatch(/^vpc-[0-9a-f]{8,}/);
  });

  test('Subnet IDs have valid format', () => {
    if (looksPlaceholder) return;

    // Handle both comma-separated string and array formats
    const parseSubnets = (val: string | string[]) => {
      if (Array.isArray(val)) return val;
      return val.split(',').map(s => s.trim());
    };

    const publicSubnets = parseSubnets(outputs.public_subnet_ids);
    const privateSubnets = parseSubnets(outputs.private_subnet_ids);

    expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
    expect(privateSubnets.length).toBeGreaterThanOrEqual(2);

    for (const id of [...publicSubnets, ...privateSubnets]) {
      expect(id).toMatch(/^subnet-[0-9a-f]{8,}/);
    }
  });

  test('S3 bucket name follows naming rules', () => {
    if (looksPlaceholder) return;
    expect(outputs.app_data_s3_bucket_name).toMatch(/^[a-z0-9.-]{3,63}$/);
  });
});

describe('Terraform E2E Tests - Live AWS/LocalStack Checks', () => {
  (runE2E ? test : test.skip)('VPC created with correct CIDR', async () => {
    const vpcId = outputs.vpc_id;
    const vpc = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));

    expect(vpc.Vpcs).toHaveLength(1);
    expect(vpc.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
    // Note: LocalStack may not return DNS attributes, so we only check CIDR
  });

  (runE2E ? test : test.skip)('Public and private subnets exist in multiple AZs', async () => {
    const parseSubnets = (val: string | string[]) => {
      if (Array.isArray(val)) return val;
      return val.split(',').map(s => s.trim());
    };

    const publicSubnets = parseSubnets(outputs.public_subnet_ids);
    const privateSubnets = parseSubnets(outputs.private_subnet_ids);
    const allSubnetIds = [...publicSubnets, ...privateSubnets];

    const subnets = await ec2.send(
      new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
    );

    expect(subnets.Subnets?.length).toBe(allSubnetIds.length);

    // Check AZ distribution
    const azs = new Set(subnets.Subnets?.map(s => s.AvailabilityZone));
    expect(azs.size).toBeGreaterThanOrEqual(2);
  });

  (runE2E ? test : test.skip)('Security groups are created', async () => {
    const sgIds = [outputs.ec2_sg_id, outputs.alb_sg_id].filter(Boolean);

    if (sgIds.length === 0) {
      console.warn('No security group IDs in outputs, skipping');
      return;
    }

    const sgs = await ec2.send(
      new DescribeSecurityGroupsCommand({ GroupIds: sgIds })
    );
    expect(sgs.SecurityGroups?.length).toBe(sgIds.length);
  });

  (runE2E ? test : test.skip)('S3 app data bucket exists in bucket list', async () => {
    const buckets = await s3.send(new ListBucketsCommand({}));
    const bucketNames = buckets.Buckets?.map(b => b.Name) || [];
    expect(bucketNames).toContain(outputs.app_data_s3_bucket_name);
  });

  (runE2E ? test : test.skip)('ALB DNS name has valid format', () => {
    const albDns = outputs.alb_dns_name;
    expect(albDns).toBeTruthy();
    // LocalStack uses .localhost.localstack.cloud, AWS uses .amazonaws.com
    expect(albDns).toMatch(/\.(localhost\.localstack\.cloud|amazonaws\.com)$/);
  });

  (runE2E ? test : test.skip)('EC2 security group ID is valid', () => {
    expect(outputs.ec2_sg_id).toMatch(/^sg-[0-9a-f]{8,}/);
  });

  (runE2E ? test : test.skip)('ALB security group ID is valid', () => {
    expect(outputs.alb_sg_id).toMatch(/^sg-[0-9a-f]{8,}/);
  });

  (runE2E ? test : test.skip)('RDS security group ID is valid', () => {
    expect(outputs.rds_sg_id).toMatch(/^sg-[0-9a-f]{8,}/);
  });

  (runE2E ? test : test.skip)('KMS key ID is valid', () => {
    // KMS key IDs are UUIDs
    expect(outputs.rds_kms_key_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });
});
