import { DescribeInstancesCommand, DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { ElasticLoadBalancingV2Client } from '@aws-sdk/client-elastic-load-balancing-v2';
import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

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
const elbv2 = new ElasticLoadBalancingV2Client(clientConfig);

// Determine if we should run E2E tests
const hasOutputs = outputs && Object.keys(outputs).length > 0;
const looksPlaceholder = outputs.VPCId?.includes('placeholder');
const runE2E = hasOutputs && !looksPlaceholder;

describe('CFN Integration Tests - Live AWS/LocalStack Checks', () => {

  beforeAll(() => {
    console.log(`Running in ${isLocalStack ? 'LocalStack' : 'AWS'} environment`);
    console.log(`E2E tests ${runE2E ? 'enabled' : 'disabled'} (hasOutputs: ${hasOutputs}, isPlaceholder: ${looksPlaceholder})`);
  });

  // VPC Tests
  describe('VPC Configuration', () => {
    (runE2E ? test : test.skip)('VPC created with correct CIDR', async () => {
      const vpcId = outputs.VPCId;
      const vpc = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));

      expect(vpc.Vpcs).toHaveLength(1);
      expect(vpc.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
    });

    (runE2E ? test : test.skip)('Public subnets exist', async () => {
      const subnetIds = outputs.PublicSubnetIds.split(',');
      expect(subnetIds.length).toBeGreaterThanOrEqual(2);

      const subnets = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
      expect(subnets.Subnets?.length).toBe(subnetIds.length);
    });

    (runE2E ? test : test.skip)('Private subnets exist', async () => {
      const subnetIds = outputs.PrivateSubnetIds.split(',');
      expect(subnetIds.length).toBeGreaterThanOrEqual(2);

      const subnets = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
      expect(subnets.Subnets?.length).toBe(subnetIds.length);
    });
  });

  // EC2 Tests
  describe('EC2 Instance', () => {
    (runE2E ? test : test.skip)('Web server instance exists', async () => {
      const instanceId = outputs.WebServerInstanceId;
      const result = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));

      expect(result.Reservations).toHaveLength(1);
      expect(result.Reservations?.[0].Instances).toHaveLength(1);

      // Check instance state (running or pending is acceptable)
      const state = result.Reservations?.[0].Instances?.[0].State?.Name;
      expect(['running', 'pending']).toContain(state);
    });
  });

  // S3 Tests
  describe('S3 Buckets', () => {
    (runE2E ? test : test.skip)('Application bucket exists', async () => {
      const bucketName = outputs.ApplicationBucketName;
      const { Buckets } = await s3.send(new ListBucketsCommand({}));
      const bucketExists = Buckets?.some((b) => b.Name === bucketName);
      expect(bucketExists).toBe(true);
    });
  });

  // ALB Tests
  describe('Application Load Balancer', () => {
    (runE2E ? test : test.skip)('ALB DNS name is valid', async () => {
      const albDns = outputs.LoadBalancerDNS;
      expect(albDns).toBeDefined();
      expect(albDns.length).toBeGreaterThan(0);
      expect(albDns).toContain('.elb.');
    });

    (runE2E ? test : test.skip)('ALB ARN is valid', async () => {
      const albArn = outputs.LoadBalancerArn;
      expect(albArn).toBeDefined();
      expect(albArn).toContain('elasticloadbalancing');
      expect(albArn).toContain('loadbalancer/app');
    });
  });

  // CloudFront Tests
  describe('CloudFront Distribution', () => {
    (runE2E ? test : test.skip)('CloudFront domain is valid', async () => {
      const cfDomain = outputs.CloudFrontDomainName;
      expect(cfDomain).toBeDefined();
      expect(cfDomain).toContain('cloudfront');
    });
  });

  // WAF Tests
  describe('WAF Configuration', () => {
    (runE2E ? test : test.skip)('WAF Web ACL ARN is valid', async () => {
      const wafArn = outputs.WebACLArn;
      expect(wafArn).toBeDefined();
      expect(wafArn).toContain('wafv2');
      expect(wafArn).toContain('webacl');
    });
  });

  // Resource ID Validation Tests
  describe('Resource ID Validation', () => {
    test('VPC ID has valid format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[a-z0-9]+$/);
    });

    test('EC2 instance ID has valid format', () => {
      expect(outputs.WebServerInstanceId).toMatch(/^i-[a-z0-9]+$/);
    });

    test('Subnet IDs have valid format', () => {
      const publicSubnets = outputs.PublicSubnetIds.split(',');
      const privateSubnets = outputs.PrivateSubnetIds.split(',');

      publicSubnets.forEach((id: string) => {
        expect(id.trim()).toMatch(/^subnet-[a-z0-9]+$/);
      });

      privateSubnets.forEach((id: string) => {
        expect(id.trim()).toMatch(/^subnet-[a-z0-9]+$/);
      });
    });
  });
});
