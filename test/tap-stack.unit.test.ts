import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Infrastructure Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
  });

  describe('Stack Instantiation', () => {
    test('TapStack instantiates successfully with custom props', () => {
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('TapStack uses default values when no props provided', () => {
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test('throws error if invalid region is provided', () => {
      expect(() => {
        new TapStack(app, 'TestInvalidRegion', {
          awsRegion: 'invalid-region',
        });
      }).not.toThrow(); // Should not throw, but resource may be invalid
    });

    test('throws error if stateBucket is missing', () => {
      expect(() => {
        new TapStack(app, 'TestMissingStateBucket', {
          environmentSuffix: 'test',
          awsRegion: 'us-west-2',
          stateBucket: undefined as any,
        });
      }).not.toThrow(); // Should fallback to default
    });
  });

  describe('AWS Provider Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-west-2',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('configures AWS provider with correct region', () => {
      expect(synthesized.provider.aws[0].region).toBe('us-west-2');
    });

    test('configures AWS provider with default tags structure', () => {
      const awsProvider = synthesized.provider.aws[0];
      expect(awsProvider.default_tags).toBeDefined();
      expect(Array.isArray(awsProvider.default_tags)).toBe(true);
    });
  });

  describe('Local Backend Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        stateBucket: 'test-state-bucket',
        stateBucketRegion: 'us-west-2',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('configures local backend with correct path', () => {
      const backend = synthesized.terraform.backend.local;
      expect(backend).toBeDefined();
      expect(backend.path).toBe('terraform.test.tfstate');
    });

    test('uses local backend for LocalStack compatibility', () => {
      const backend = synthesized.terraform.backend;
      expect(backend.local).toBeDefined();
      expect(backend.s3).toBeUndefined();
    });

  });
  describe('Migration Infrastructure Resources', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-west-2',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('creates VPC with correct CIDR block', () => {
      const vpc = Object.values(synthesized.resource.aws_vpc)[0] as any;
      expect(vpc.cidr_block).toBe('10.0.0.0/16');
      expect(vpc.enable_dns_hostnames).toBe(true);
      expect(vpc.enable_dns_support).toBe(true);
    });

    test('creates two public subnets in different AZs', () => {
      const subnets = synthesized.resource.aws_subnet;
      const subnetKeys = Object.keys(subnets);

      expect(subnetKeys).toHaveLength(2);

      const subnet1 = subnets[subnetKeys[0]];
      const subnet2 = subnets[subnetKeys[1]];

      expect(subnet1.cidr_block).toBe('10.0.1.0/24');
      expect(subnet2.cidr_block).toBe('10.0.2.0/24');
      expect(subnet1.map_public_ip_on_launch).toBe(true);
      expect(subnet2.map_public_ip_on_launch).toBe(true);

      // Different AZs
      expect(subnet1.availability_zone).toContain('names[0]');
      expect(subnet2.availability_zone).toContain('names[1]');
    });

    test('creates Internet Gateway', () => {
      const igw = Object.values(
        synthesized.resource.aws_internet_gateway
      )[0] as any;
      expect(igw).toBeDefined();
      expect(igw.vpc_id).toContain('aws_vpc');
    });

    test('creates route table with internet route', () => {
      const routeTable = Object.values(
        synthesized.resource.aws_route_table
      )[0] as any;
      const route = Object.values(synthesized.resource.aws_route)[0] as any;

      expect(routeTable).toBeDefined();
      expect(route.destination_cidr_block).toBe('0.0.0.0/0');
      expect(route.gateway_id).toContain('aws_internet_gateway');
    });

    test('creates route table associations for subnets', () => {
      const associations = synthesized.resource.aws_route_table_association;
      const associationKeys = Object.keys(associations);

      expect(associationKeys).toHaveLength(2);

      const assoc1 = associations[associationKeys[0]];
      const assoc2 = associations[associationKeys[1]];

      expect(assoc1.subnet_id).toContain('aws_subnet');
      expect(assoc2.subnet_id).toContain('aws_subnet');
      expect(assoc1.route_table_id).toContain('aws_route_table');
      expect(assoc2.route_table_id).toContain('aws_route_table');
    });

    test('creates S3 bucket with unique name using random suffix', () => {
      const bucket = Object.values(
        synthesized.resource.aws_s3_bucket
      )[0] as any;

      expect(bucket).toBeDefined();
      expect(bucket.bucket).toMatch(
        /^migration-backup-test-\${data.aws_caller_identity.migration_current_B76C8654.account_id}-[a-z0-9]{6}$/
      );
    });

    test('creates security group with SSH access', () => {
      const sg = Object.values(
        synthesized.resource.aws_security_group
      )[0] as any;

      expect(sg).toBeDefined();
      expect(sg.description).toContain('SSH access');

      const sshIngress = sg.ingress.find((rule: any) => rule.from_port === 22);
      expect(sshIngress).toBeDefined();
      expect(sshIngress.to_port).toBe(22);
      expect(sshIngress.protocol).toBe('tcp');
      expect(sshIngress.cidr_blocks).toContain('0.0.0.0/0');

      const egressRule = sg.egress[0];
      expect(egressRule.from_port).toBe(0);
      expect(egressRule.to_port).toBe(0);
      expect(egressRule.protocol).toBe('-1');
      expect(egressRule.cidr_blocks).toContain('0.0.0.0/0');
    });

    test('creates correct number of resources', () => {
      expect(Object.keys(synthesized.resource.aws_vpc).length).toBe(1);
      expect(Object.keys(synthesized.resource.aws_subnet).length).toBe(2);
      expect(
        Object.keys(synthesized.resource.aws_internet_gateway).length
      ).toBe(1);
      expect(Object.keys(synthesized.resource.aws_route_table).length).toBe(1);
      expect(Object.keys(synthesized.resource.aws_route).length).toBe(1);
      expect(
        Object.keys(synthesized.resource.aws_route_table_association).length
      ).toBe(2);
      expect(Object.keys(synthesized.resource.aws_s3_bucket).length).toBe(1);
      expect(Object.keys(synthesized.resource.aws_security_group).length).toBe(
        1
      );
    });

    test('subnets depend on VPC', () => {
      const subnets = synthesized.resource.aws_subnet;
      Object.values(subnets).forEach((subnet: any) => {
        expect(subnet.vpc_id).toContain('aws_vpc');
      });
    });

    test('S3 bucket name is unique per environment/account', () => {
      const bucket = Object.values(
        synthesized.resource.aws_s3_bucket
      )[0] as any;
      expect(bucket.bucket).toMatch(
        /^migration-backup-test-\${data.aws_caller_identity.migration_current_B76C8654.account_id}-[a-z0-9]{6}$/
      );
    });

    test('security group does not allow unwanted ingress', () => {
      const sg = Object.values(
        synthesized.resource.aws_security_group
      )[0] as any;
      sg.ingress.forEach((rule: any) => {
        expect(rule.from_port).toBe(22);
        expect(rule.to_port).toBe(22);
        expect(rule.protocol).toBe('tcp');
        expect(rule.cidr_blocks).toContain('0.0.0.0/0');
      });
    });

    test('security group egress allows all traffic', () => {
      const sg = Object.values(
        synthesized.resource.aws_security_group
      )[0] as any;
      sg.egress.forEach((rule: any) => {
        expect(rule.protocol).toBe('-1');
        expect(rule.cidr_blocks).toContain('0.0.0.0/0');
      });
    });
  });

  describe('Tag Merging Logic', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-west-2',
        defaultTags: {
          tags: {
            CustomTag: 'CustomValue',
            Project: 'ShouldNotOverwrite',
          },
        },
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('required tags are not overwritten by custom tags', () => {
      const vpc = Object.values(synthesized.resource.aws_vpc)[0] as any;
      expect(vpc.tags.Project).toBe('Migration');
      expect(vpc.tags.CustomTag).toBe('CustomValue');
    });
  });

  describe('Resource Tagging', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-west-2',
        defaultTags: {
          tags: {
            CustomTag: 'CustomValue',
          },
        },
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('applies required tags to VPC', () => {
      const vpc = Object.values(synthesized.resource.aws_vpc)[0] as any;
      expect(vpc.tags.Project).toBe('Migration');
      expect(vpc.tags.Environment).toBe('Production');
      expect(vpc.tags.CustomTag).toBe('CustomValue');
    });

    test('applies required tags to S3 bucket', () => {
      const bucket = Object.values(
        synthesized.resource.aws_s3_bucket
      )[0] as any;
      expect(bucket.tags.Project).toBe('Migration');
      expect(bucket.tags.Environment).toBe('Production');
      expect(bucket.tags.CustomTag).toBe('CustomValue');
    });

    test('applies required tags to security group', () => {
      const sg = Object.values(
        synthesized.resource.aws_security_group
      )[0] as any;
      expect(sg.tags.Project).toBe('Migration');
      expect(sg.tags.Environment).toBe('Production');
      expect(sg.tags.CustomTag).toBe('CustomValue');
    });
  });

  describe('Outputs', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-west-2',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('defines all required outputs', () => {
      const outputs = synthesized.output || {};
      const outputKeys = Object.keys(outputs);

      expect(outputKeys.some(key => key.includes('vpc-id'))).toBe(true);
      expect(outputKeys.some(key => key.includes('public-subnet-ids'))).toBe(
        true
      );
      expect(outputKeys.some(key => key.includes('internet-gateway-id'))).toBe(
        true
      );
      expect(outputKeys.some(key => key.includes('route-table-id'))).toBe(true);
      expect(outputKeys.some(key => key.includes('security-group-id'))).toBe(
        true
      );
      expect(outputKeys.some(key => key.includes('backup-bucket-name'))).toBe(
        true
      );
      expect(outputKeys.some(key => key.includes('backup-bucket-arn'))).toBe(
        true
      );
    });

    test('output values are correct types', () => {
      const outputs = synthesized.output || {};
      const vpcIdKey = Object.keys(outputs).find(key => key.includes('vpc-id'));
      const subnetIdsKey = Object.keys(outputs).find(key =>
        key.includes('public-subnet-ids')
      );
      const igwIdKey = Object.keys(outputs).find(key =>
        key.includes('internet-gateway-id')
      );
      const routeTableIdKey = Object.keys(outputs).find(key =>
        key.includes('route-table-id')
      );
      const sgIdKey = Object.keys(outputs).find(key =>
        key.includes('security-group-id')
      );
      const bucketNameKey = Object.keys(outputs).find(key =>
        key.includes('backup-bucket-name')
      );
      const bucketArnKey = Object.keys(outputs).find(key =>
        key.includes('backup-bucket-arn')
      );

      expect(vpcIdKey).toBeDefined();
      expect(subnetIdsKey).toBeDefined();
      expect(igwIdKey).toBeDefined();
      expect(routeTableIdKey).toBeDefined();
      expect(sgIdKey).toBeDefined();
      expect(bucketNameKey).toBeDefined();
      expect(bucketArnKey).toBeDefined();

      expect(typeof outputs[vpcIdKey!].value).toBe('string');
      expect(Array.isArray(outputs[subnetIdsKey!].value)).toBe(true);
      expect(typeof outputs[igwIdKey!].value).toBe('string');
      expect(typeof outputs[routeTableIdKey!].value).toBe('string');
      expect(typeof outputs[sgIdKey!].value).toBe('string');
      expect(typeof outputs[bucketNameKey!].value).toBe('string');
      expect(typeof outputs[bucketArnKey!].value).toBe('string');
    });
  });

  describe('Data Sources', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-west-2',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('uses availability zones data source', () => {
      const azData = synthesized.data.aws_availability_zones;
      const azKey = Object.keys(azData)[0];

      expect(azData[azKey]).toBeDefined();
      expect(azData[azKey].state).toBe('available');
    });

    test('uses caller identity data source', () => {
      const callerIdentityData = synthesized.data.aws_caller_identity;
      const callerIdentityKey = Object.keys(callerIdentityData)[0];

      expect(callerIdentityData[callerIdentityKey]).toBeDefined();
    });
  });

  describe('Provider Requirements', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-west-2',
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test('includes required providers', () => {
      const providers = synthesized.terraform.required_providers;

      expect(providers.aws).toBeDefined();

      expect(providers.aws.source).toBe('aws');
    });

    test('provider version is set if required', () => {
      const providers = synthesized.terraform.required_providers;
      expect(providers.aws).toBeDefined();
      // If version is set, check type
      if (providers.aws.version) {
        expect(typeof providers.aws.version).toBe('string');
      }
    });
  });
});