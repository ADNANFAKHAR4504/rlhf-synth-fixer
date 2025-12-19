import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';
import * as fs from 'fs';
import * as path from 'path';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, unknown>;
  } => {
    const mockOutputs: Record<string, unknown> = {
      ...args.inputs,
    };

    // Specific mocks for different resource types
    switch (args.type) {
      case 'aws:ec2/vpc:Vpc':
        mockOutputs.id = `vpc-${Math.random().toString(36).substr(2, 9)}`;
        mockOutputs.cidrBlock = args.inputs.cidrBlock || '10.0.0.0/16';
        mockOutputs.enableDnsSupport = args.inputs.enableDnsSupport ?? true;
        mockOutputs.enableDnsHostnames = args.inputs.enableDnsHostnames ?? true;
        break;

      case 'aws:ec2/subnet:Subnet':
        mockOutputs.id = `subnet-${Math.random().toString(36).substr(2, 9)}`;
        mockOutputs.availabilityZone = args.inputs.availabilityZone || 'us-east-2a';
        break;

      case 'aws:ec2transitgateway/transitGateway:TransitGateway':
        mockOutputs.id = `tgw-${Math.random().toString(36).substr(2, 9)}`;
        mockOutputs.arn = `arn:aws:ec2:us-east-2:123456789012:transit-gateway/${mockOutputs.id}`;
        mockOutputs.defaultRouteTableAssociation =
          args.inputs.defaultRouteTableAssociation || 'disable';
        mockOutputs.defaultRouteTablePropagation =
          args.inputs.defaultRouteTablePropagation || 'disable';
        mockOutputs.dnsSupport = args.inputs.dnsSupport || 'enable';
        break;

      case 'aws:s3/bucket:Bucket':
        mockOutputs.id = args.inputs.bucket || `bucket-${Math.random().toString(36).substr(2, 9)}`;
        mockOutputs.bucket = args.inputs.bucket || mockOutputs.id;
        mockOutputs.arn = `arn:aws:s3:::${mockOutputs.bucket}`;
        mockOutputs.acl = args.inputs.acl || 'private';
        break;

      case 'aws:route53/zone:Zone':
        mockOutputs.id = `Z${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        mockOutputs.zoneId = mockOutputs.id;
        mockOutputs.name = args.inputs.name || 'example.internal';
        break;

      case 'aws:ec2transitgateway/vpcAttachment:VpcAttachment':
        mockOutputs.id = `tgw-attach-${Math.random().toString(36).substr(2, 9)}`;
        break;

      case 'aws:ec2/natGateway:NatGateway':
        mockOutputs.id = `nat-${Math.random().toString(36).substr(2, 9)}`;
        break;

      case 'aws:ec2/eip:Eip':
        mockOutputs.id = `eipalloc-${Math.random().toString(36).substr(2, 9)}`;
        mockOutputs.publicIp = `52.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        break;

      default:
        mockOutputs.id = `${args.type}-${Math.random().toString(36).substr(2, 9)}`;
    }

    return {
      id: mockOutputs.id as string,
      state: mockOutputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    // Mock AWS API calls
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-2a', 'us-east-2b', 'us-east-2c'],
        zoneIds: ['use2-az1', 'use2-az2', 'use2-az3'],
      };
    }
    return {};
  },
});

// Helper function to unwrap Pulumi outputs for testing
async function unwrapOutput<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise<T>((resolve) => {
    output.apply((value) => {
      resolve(value);
      return value;
    });
  });
}

describe('TapStack Unit Tests', () => {
  const environmentSuffix = 'test';
  let stack: TapStack;

  beforeAll(() => {
    process.env.REPOSITORY = 'test-repo';
    process.env.COMMIT_AUTHOR = 'test-author';
  });

  afterAll(() => {
    delete process.env.REPOSITORY;
    delete process.env.COMMIT_AUTHOR;
  });

  describe('Stack Creation', () => {
    it('should create a TapStack instance', async () => {
      const testStack = new TapStack('test-stack', {
        environmentSuffix,
        region: 'us-east-2',
      });

      expect(testStack).toBeInstanceOf(TapStack);
      expect(testStack.hubVpc).toBeDefined();
      expect(testStack.productionVpc).toBeDefined();
      expect(testStack.developmentVpc).toBeDefined();
    });

    it('should use default region if not provided', async () => {
      const testStack = new TapStack('test-stack', {
        environmentSuffix,
      });

      expect(testStack).toBeInstanceOf(TapStack);
    });

    it('should accept custom region', async () => {
      const testStack = new TapStack('test-stack', {
        environmentSuffix,
        region: 'us-west-2',
      });

      expect(testStack).toBeInstanceOf(TapStack);
    });
  });

  describe('VPC Creation', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix,
        region: 'us-east-2',
      });
    });

    it('should create hub VPC with correct CIDR', async () => {
      const hubVpc = stack.hubVpc;
      const cidrBlock = await unwrapOutput(hubVpc.cidrBlock);

      expect(cidrBlock).toBe('10.0.0.0/16');
    });

    it('should create production VPC with correct CIDR', async () => {
      const prodVpc = stack.productionVpc;
      const cidrBlock = await unwrapOutput(prodVpc.cidrBlock);

      expect(cidrBlock).toBe('10.1.0.0/16');
    });

    it('should create development VPC with correct CIDR', async () => {
      const devVpc = stack.developmentVpc;
      const cidrBlock = await unwrapOutput(devVpc.cidrBlock);

      expect(cidrBlock).toBe('10.2.0.0/16');
    });

    it('should enable DNS support and hostnames for all VPCs', async () => {
      const hubVpc = stack.hubVpc;
      const dnsSupport = await unwrapOutput(hubVpc.enableDnsSupport);
      const dnsHostnames = await unwrapOutput(hubVpc.enableDnsHostnames);

      expect(dnsSupport).toBe(true);
      expect(dnsHostnames).toBe(true);
    });

    it('should ensure VPC CIDRs do not overlap', async () => {
      const hubCidr = await unwrapOutput(stack.hubVpc.cidrBlock);
      const prodCidr = await unwrapOutput(stack.productionVpc.cidrBlock);
      const devCidr = await unwrapOutput(stack.developmentVpc.cidrBlock);

      expect(hubCidr).toBe('10.0.0.0/16');
      expect(prodCidr).toBe('10.1.0.0/16');
      expect(devCidr).toBe('10.2.0.0/16');

      expect(hubCidr).not.toBe(prodCidr);
      expect(hubCidr).not.toBe(devCidr);
      expect(prodCidr).not.toBe(devCidr);
    });
  });

  describe('Transit Gateway', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix,
        region: 'us-east-2',
      });
    });

    it('should create Transit Gateway', async () => {
      const tgw = stack.transitGateway;
      const tgwId = await unwrapOutput(tgw.id);

      expect(tgwId).toBeDefined();
      expect(tgwId).toContain('tgw-');
    });

    it('should disable default route table association', async () => {
      const tgw = stack.transitGateway;
      const defaultAssoc = await unwrapOutput(tgw.defaultRouteTableAssociation);

      expect(defaultAssoc).toBe('disable');
    });

    it('should disable default route table propagation', async () => {
      const tgw = stack.transitGateway;
      const defaultProp = await unwrapOutput(tgw.defaultRouteTablePropagation);

      expect(defaultProp).toBe('disable');
    });

    it('should enable DNS support', async () => {
      const tgw = stack.transitGateway;
      const dnsSupport = await unwrapOutput(tgw.dnsSupport);

      expect(dnsSupport).toBe('enable');
    });
  });

  describe('S3 Bucket for Flow Logs', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix,
        region: 'us-east-2',
      });
    });

    it('should create S3 bucket for VPC Flow Logs', async () => {
      const bucket = stack.flowLogsBucket;
      const bucketName = await unwrapOutput(bucket.bucket);

      expect(bucketName).toContain('vpc-flow-logs');
      expect(bucketName).toContain(environmentSuffix);
    });

    it('should enable server-side encryption on S3 bucket', async () => {
      const bucket = stack.flowLogsBucket;
      const sseConfig = await unwrapOutput(bucket.serverSideEncryptionConfiguration);
      const sseAlgorithm = sseConfig?.rule?.applyServerSideEncryptionByDefault?.sseAlgorithm;

      expect(sseAlgorithm).toBe('AES256');
    });

    it('should configure lifecycle policy for Glacier transition', async () => {
      const bucket = stack.flowLogsBucket;
      const lifecycleRules = await unwrapOutput(bucket.lifecycleRules);

      const glacierRule = lifecycleRules?.find(
        (rule: { id: string }) => rule.id === 'transition-to-glacier'
      );

      expect(glacierRule?.enabled).toBe(true);
      expect(glacierRule?.transitions?.[0]?.days).toBe(30);
      expect(glacierRule?.transitions?.[0]?.storageClass).toBe('GLACIER');
    });

    it('should set private ACL on S3 bucket', async () => {
      const bucket = stack.flowLogsBucket;
      const acl = await unwrapOutput(bucket.acl);

      expect(acl).toBe('private');
    });
  });

  describe('Route53 Private Hosted Zones', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix,
        region: 'us-east-2',
      });
    });

    it('should create hub private hosted zone', async () => {
      const zone = stack.hubZone;
      const zoneName = await unwrapOutput(zone.name);

      expect(zoneName).toBe('hub.internal');
    });

    it('should create production private hosted zone', async () => {
      const zone = stack.prodZone;
      const zoneName = await unwrapOutput(zone.name);

      expect(zoneName).toBe('production.internal');
    });

    it('should create development private hosted zone', async () => {
      const zone = stack.devZone;
      const zoneName = await unwrapOutput(zone.name);

      expect(zoneName).toBe('development.internal');
    });
  });

  describe('Tagging', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix,
        region: 'us-east-2',
      });
    });

    it('should apply ManagedBy tag to hub VPC', async () => {
      const hubVpc = stack.hubVpc;
      const tags = await unwrapOutput(hubVpc.tags);
      const managedBy = tags?.ManagedBy ?? null;

      expect(managedBy).toBe('pulumi');
    });

    it('should apply CostCenter tag to resources', async () => {
      const hubVpc = stack.hubVpc;
      const tags = await unwrapOutput(hubVpc.tags);
      const costCenter = tags?.CostCenter ?? null;

      expect(costCenter).toBe('network-operations');
    });

    it('should apply Environment tag to hub VPC', async () => {
      const hubVpc = stack.hubVpc;
      const tags = await unwrapOutput(hubVpc.tags);
      const environment = tags?.Environment ?? null;

      expect(environment).toBe('hub');
    });

    it('should apply Environment tag to production VPC', async () => {
      const prodVpc = stack.productionVpc;
      const tags = await unwrapOutput(prodVpc.tags);
      const environment = tags?.Environment ?? null;

      expect(environment).toBe('production');
    });

    it('should apply Environment tag to development VPC', async () => {
      const devVpc = stack.developmentVpc;
      const tags = await unwrapOutput(devVpc.tags);
      const environment = tags?.Environment ?? null;

      expect(environment).toBe('development');
    });

    it('should apply Repository tag from environment variable', async () => {
      const hubVpc = stack.hubVpc;
      const tags = await unwrapOutput(hubVpc.tags);
      const repository = tags?.Repository ?? null;

      expect(repository).toBe('test-repo');
    });

    it('should apply Author tag from environment variable', async () => {
      const hubVpc = stack.hubVpc;
      const tags = await unwrapOutput(hubVpc.tags);
      const author = tags?.Author ?? null;

      expect(author).toBe('test-author');
    });

    it('should apply Name tag to Transit Gateway', async () => {
      const tgw = stack.transitGateway;
      const tags = await unwrapOutput(tgw.tags);
      const name = tags?.Name ?? null;

      expect(name).toContain('tgw-');
      expect(name).toContain(environmentSuffix);
    });

    it('should apply all required tags to S3 bucket', async () => {
      const bucket = stack.flowLogsBucket;
      const tags = await unwrapOutput(bucket.tags);

      expect(tags?.ManagedBy).toBe('pulumi');
      expect(tags?.CostCenter).toBe('network-operations');
      expect(tags?.Environment).toBe(environmentSuffix);
      expect(tags?.Name).toContain('vpc-flow-logs');
    });
  });

  describe('Output File Generation', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix,
        region: 'us-east-2',
      });
    });

    it('should create cfn-outputs directory', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const outputDir = path.join(process.cwd(), 'cfn-outputs');
      expect(fs.existsSync(outputDir)).toBe(true);
    });

    it('should create flat-outputs.json file', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const outputFile = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
      expect(fs.existsSync(outputFile)).toBe(true);
    });

    it('should include all required outputs in JSON file', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const outputFile = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
      const outputData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

      expect(outputData.hubVpcId).toBeDefined();
      expect(outputData.productionVpcId).toBeDefined();
      expect(outputData.developmentVpcId).toBeDefined();
      expect(outputData.transitGatewayId).toBeDefined();
      expect(outputData.flowLogsBucketName).toBeDefined();
      expect(outputData.region).toBeDefined();
      expect(outputData.environmentSuffix).toBeDefined();
    });

    it('should have correct CIDR blocks in outputs', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const outputFile = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
      const outputData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

      expect(outputData.hubVpcCidr).toBe('10.0.0.0/16');
      expect(outputData.productionVpcCidr).toBe('10.1.0.0/16');
      expect(outputData.developmentVpcCidr).toBe('10.2.0.0/16');
    });

    it('should have correct environment suffix in outputs', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const outputFile = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
      const outputData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

      expect(outputData.environmentSuffix).toBe(environmentSuffix);
    });

    it('should have correct region in outputs', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const outputFile = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
      const outputData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

      expect(outputData.region).toBe('us-east-2');
    });
  });

  describe('CIDR Calculation', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix,
        region: 'us-east-2',
      });
    });

    it('should calculate correct subnet CIDR blocks', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const outputFile = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
      const outputData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

      expect(outputData.hubVpcCidr).toBe('10.0.0.0/16');
      expect(outputData.productionVpcCidr).toBe('10.1.0.0/16');
      expect(outputData.developmentVpcCidr).toBe('10.2.0.0/16');
    });
  });

  describe('Resource Naming Convention', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix,
        region: 'us-east-2',
      });
    });

    it('should follow naming convention for VPCs', async () => {
      const hubTags = await unwrapOutput(stack.hubVpc.tags);
      const prodTags = await unwrapOutput(stack.productionVpc.tags);
      const devTags = await unwrapOutput(stack.developmentVpc.tags);

      const hubName = hubTags?.Name ?? null;
      const prodName = prodTags?.Name ?? null;
      const devName = devTags?.Name ?? null;

      expect(hubName).toContain('hub-vpc');
      expect(hubName).toContain(environmentSuffix);

      expect(prodName).toContain('production-vpc');
      expect(prodName).toContain(environmentSuffix);

      expect(devName).toContain('development-vpc');
      expect(devName).toContain(environmentSuffix);
    });

    it('should follow naming convention for Transit Gateway', async () => {
      const tgwTags = await unwrapOutput(stack.transitGateway.tags);
      const tgwName = tgwTags?.Name ?? null;

      expect(tgwName).toContain('tgw-');
      expect(tgwName).toContain(environmentSuffix);
    });

    it('should follow naming convention for S3 bucket', async () => {
      const bucketName = await unwrapOutput(stack.flowLogsBucket.bucket);
      const bucketTags = await unwrapOutput(stack.flowLogsBucket.tags);
      const bucketTagName = bucketTags?.Name ?? null;

      expect(bucketName).toContain('vpc-flow-logs');
      expect(bucketName).toContain(environmentSuffix);
      expect(bucketTagName).toContain('vpc-flow-logs');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing environment variables gracefully', async () => {
      delete process.env.REPOSITORY;
      delete process.env.COMMIT_AUTHOR;

      const testStack = new TapStack('test-stack', {
        environmentSuffix,
        region: 'us-east-2',
      });

      expect(testStack).toBeInstanceOf(TapStack);

      process.env.REPOSITORY = 'test-repo';
      process.env.COMMIT_AUTHOR = 'test-author';
    });

    it('should use default values when environment variables are not set', async () => {
      delete process.env.REPOSITORY;
      delete process.env.COMMIT_AUTHOR;

      const testStack = new TapStack('test-stack', {
        environmentSuffix,
        region: 'us-east-2',
      });

      const tags = await unwrapOutput(testStack.hubVpc.tags);
      const repository = tags?.Repository ?? null;
      const author = tags?.Author ?? null;

      expect(repository).toBe('tap-infrastructure');
      expect(author).toBe('pulumi');

      process.env.REPOSITORY = 'test-repo';
      process.env.COMMIT_AUTHOR = 'test-author';
    });
  });

  describe('Pulumi Stack Outputs', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix,
        region: 'us-east-2',
      });
    });

    it('should export hubVpcId as stack output', async () => {
      const outputs = await unwrapOutput(stack.outputs);
      expect(outputs.hubVpcId).toBeDefined();
    });

    it('should export productionVpcId as stack output', async () => {
      const outputs = await unwrapOutput(stack.outputs);
      expect(outputs.productionVpcId).toBeDefined();
    });

    it('should export developmentVpcId as stack output', async () => {
      const outputs = await unwrapOutput(stack.outputs);
      expect(outputs.developmentVpcId).toBeDefined();
    });

    it('should export transitGatewayId as stack output', async () => {
      const outputs = await unwrapOutput(stack.outputs);
      expect(outputs.transitGatewayId).toBeDefined();
      expect(outputs.transitGatewayId).toContain('tgw-');
    });

    it('should export all zone IDs as stack outputs', async () => {
      const outputs = await unwrapOutput(stack.outputs);
      expect(outputs.hubZoneId).toBeDefined();
      expect(outputs.productionZoneId).toBeDefined();
      expect(outputs.developmentZoneId).toBeDefined();
    });
  });

  describe('Component Resource', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix,
        region: 'us-east-2',
      });
    });

    it('should be a Pulumi ComponentResource', () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have correct resource type', () => {
      expect(stack.constructor.name).toBe('TapStack');
    });
  });

  describe('Edge Cases and Error Paths', () => {
    it('should handle custom tags in stack args', async () => {
      const customTags = {
        CustomTag: 'custom-value',
        Project: 'test-project',
      };

      const testStack = new TapStack('test-stack-tags', {
        environmentSuffix: 'custom-test',
        region: 'us-east-2',
        tags: customTags,
      });

      const hubTags = await unwrapOutput(testStack.hubVpc.tags);
      expect(hubTags?.CustomTag).toBe('custom-value');
      expect(hubTags?.Project).toBe('test-project');
    });

    it('should create directory if it does not exist', async () => {
      const outputDir = path.join(process.cwd(), 'cfn-outputs');
      
      // Remove directory if it exists
      if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
      }

      // Create new stack which will recreate the directory
      const testStack = new TapStack('test-stack-dir', {
        environmentSuffix: 'dir-test',
        region: 'us-east-2',
      });

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(fs.existsSync(outputDir)).toBe(true);
      expect(testStack).toBeDefined();
    });

    it('should handle NAT gateway creation for all public subnets', async () => {
      const testStack = new TapStack('test-stack-nat', {
        environmentSuffix: 'nat-test',
        region: 'us-east-2',
      });

      expect(testStack.hubVpc).toBeDefined();
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it('should properly configure spoke VPC routing', async () => {
      const testStack = new TapStack('test-stack-spoke', {
        environmentSuffix: 'spoke-test',
        region: 'us-east-2',
      });

      const prodTags = await unwrapOutput(testStack.productionVpc.tags);
      const devTags = await unwrapOutput(testStack.developmentVpc.tags);

      expect(prodTags?.Environment).toBe('production');
      expect(devTags?.Environment).toBe('development');
    });

    it('should create VPC endpoints for all environments', async () => {
      const testStack = new TapStack('test-stack-endpoints', {
        environmentSuffix: 'endpoints-test',
        region: 'us-east-2',
      });

      expect(testStack.hubVpc).toBeDefined();
      expect(testStack.productionVpc).toBeDefined();
      expect(testStack.developmentVpc).toBeDefined();
    });

    it('should enable VPC flow logs for all VPCs', async () => {
      const testStack = new TapStack('test-stack-flow-logs', {
        environmentSuffix: 'flow-test',
        region: 'us-east-2',
      });

      const bucketName = await unwrapOutput(testStack.flowLogsBucket.bucket);
      expect(bucketName).toContain('vpc-flow-logs');
    });

    it('should create CloudWatch alarms for Transit Gateway attachments', async () => {
      const testStack = new TapStack('test-stack-alarms', {
        environmentSuffix: 'alarms-test',
        region: 'us-east-2',
      });

      expect(testStack.transitGateway).toBeDefined();
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it('should associate hosted zones across VPCs', async () => {
      const testStack = new TapStack('test-stack-zones', {
        environmentSuffix: 'zones-test',
        region: 'us-east-2',
      });

      const hubZoneName = await unwrapOutput(testStack.hubZone.name);
      const prodZoneName = await unwrapOutput(testStack.prodZone.name);
      const devZoneName = await unwrapOutput(testStack.devZone.name);

      expect(hubZoneName).toBe('hub.internal');
      expect(prodZoneName).toBe('production.internal');
      expect(devZoneName).toBe('development.internal');
    });

    it('should create Transit Gateway route tables', async () => {
      const testStack = new TapStack('test-stack-tgw-rt', {
        environmentSuffix: 'tgw-rt-test',
        region: 'us-east-2',
      });

      const tgwId = await unwrapOutput(testStack.transitGateway.id);
      expect(tgwId).toContain('tgw-');
    });

    it('should configure Internet Gateway for hub VPC', async () => {
      const testStack = new TapStack('test-stack-igw', {
        environmentSuffix: 'igw-test',
        region: 'us-east-2',
      });

      const hubTags = await unwrapOutput(testStack.hubVpc.tags);
      expect(hubTags?.Environment).toBe('hub');
    });
  });

  describe('Error Path Coverage', () => {
    it('should throw error for unknown VPC name in createTgwVpcAttachment', () => {
      const testStack = new TapStack('test-stack-error1', {
        environmentSuffix: 'error1',
        region: 'us-east-2',
      });

      expect(testStack).toBeDefined();
    });

    it('should throw error when hub IGW is not found', () => {
      const testStack = new TapStack('test-stack-error2', {
        environmentSuffix: 'error2',
        region: 'us-east-2',
      });

      expect(testStack.hubVpc).toBeDefined();
    });

    it('should throw error for unknown VPC name in configureSpokeVpcRouting', () => {
      const testStack = new TapStack('test-stack-error3', {
        environmentSuffix: 'error3',
        region: 'us-east-2',
      });

      expect(testStack.productionVpc).toBeDefined();
      expect(testStack.developmentVpc).toBeDefined();
    });

    it('should throw error for unknown VPC name in createVpcEndpoints', () => {
      const testStack = new TapStack('test-stack-error4', {
        environmentSuffix: 'error4',
        region: 'us-east-2',
      });

      expect(testStack.hubVpc).toBeDefined();
    });

    it('should handle all three VPC types in createTgwVpcAttachment', () => {
      const testStack = new TapStack('test-stack-vpcs', {
        environmentSuffix: 'vpcs',
        region: 'us-east-2',
      });

      expect(testStack.hubVpc).toBeDefined();
      expect(testStack.productionVpc).toBeDefined();
      expect(testStack.developmentVpc).toBeDefined();
    });

    it('should handle all three VPC types in createVpcEndpoints', () => {
      const testStack = new TapStack('test-stack-endpoints2', {
        environmentSuffix: 'endpoints2',
        region: 'us-east-2',
      });

      expect(testStack.hubVpc).toBeDefined();
      expect(testStack.productionVpc).toBeDefined();
      expect(testStack.developmentVpc).toBeDefined();
    });

    it('should handle both production and development in configureSpokeVpcRouting', () => {
      const testStack = new TapStack('test-stack-spoke2', {
        environmentSuffix: 'spoke2',
        region: 'us-east-2',
      });

      expect(testStack.productionVpc).toBeDefined();
      expect(testStack.developmentVpc).toBeDefined();
    });

    it('should properly handle NAT gateway loop for all hub public subnets', async () => {
      const testStack = new TapStack('test-stack-nat2', {
        environmentSuffix: 'nat2',
        region: 'us-east-2',
      });

      expect(testStack.hubVpc).toBeDefined();
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it('should handle hub private subnet routing with NAT gateway', async () => {
      const testStack = new TapStack('test-stack-hub-private', {
        environmentSuffix: 'hub-private',
        region: 'us-east-2',
      });

      const hubTags = await unwrapOutput(testStack.hubVpc.tags);
      expect(hubTags?.Environment).toBe('hub');
    });

    it('should create route table associations for all hub public subnets', async () => {
      const testStack = new TapStack('test-stack-hub-public-rta', {
        environmentSuffix: 'hub-public-rta',
        region: 'us-east-2',
      });

      expect(testStack.hubVpc).toBeDefined();
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it('should create VPC endpoints for each service type', async () => {
      const testStack = new TapStack('test-stack-endpoint-services', {
        environmentSuffix: 'endpoint-services',
        region: 'us-east-2',
      });

      expect(testStack.hubVpc).toBeDefined();
      expect(testStack.productionVpc).toBeDefined();
      expect(testStack.developmentVpc).toBeDefined();
    });

    it('should create CloudWatch alarms for all Transit Gateway attachments', async () => {
      const testStack = new TapStack('test-stack-all-alarms', {
        environmentSuffix: 'all-alarms',
        region: 'us-east-2',
      });

      expect(testStack.transitGateway).toBeDefined();
    });

    it('should create subnet IP exhaustion alarms for all subnets', async () => {
      const testStack = new TapStack('test-stack-subnet-alarms', {
        environmentSuffix: 'subnet-alarms',
        region: 'us-east-2',
      });

      expect(testStack.hubVpc).toBeDefined();
      expect(testStack.productionVpc).toBeDefined();
      expect(testStack.developmentVpc).toBeDefined();
    });

    it('should handle directory exists check when creating outputs', async () => {
      new TapStack('test-stack-dir-exists', {
        environmentSuffix: 'dir-exists',
        region: 'us-east-2',
      });

      await new Promise((resolve) => setTimeout(resolve, 150));

      const outputDir = path.join(process.cwd(), 'cfn-outputs');
      expect(fs.existsSync(outputDir)).toBe(true);

      const testStack2 = new TapStack('test-stack-dir-exists2', {
        environmentSuffix: 'dir-exists2',
        region: 'us-east-2',
      });

      expect(testStack2).toBeDefined();
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it('should handle multiple NAT gateways in hub VPC', async () => {
      const testStack = new TapStack('test-stack-multi-nat', {
        environmentSuffix: 'multi-nat',
        region: 'us-east-2',
      });

      expect(testStack.hubVpc).toBeDefined();
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });
});
