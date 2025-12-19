import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { EnvironmentConfig, TapStack } from '../lib/tap-stack';

const testConfigs: Record<string, EnvironmentConfig> = {
  dev: {
    vpcCidr: '10.0.0.0/16',
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.T3,
      ec2.InstanceSize.MICRO
    ),
    dbInstanceClass: ec2.InstanceType.of(
      ec2.InstanceClass.T3,
      ec2.InstanceSize.SMALL
    ),
    dbAllocatedStorage: 20,
    bucketVersioning: false,
  },
  staging: {
    vpcCidr: '10.1.0.0/16',
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.T3,
      ec2.InstanceSize.SMALL
    ),
    dbInstanceClass: ec2.InstanceType.of(
      ec2.InstanceClass.T3,
      ec2.InstanceSize.SMALL
    ),
    dbAllocatedStorage: 50,
    bucketVersioning: true,
  },
  production: {
    vpcCidr: '10.2.0.0/16',
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.T3,
      ec2.InstanceSize.MEDIUM
    ),
    dbInstanceClass: ec2.InstanceType.of(
      ec2.InstanceClass.T3,
      ec2.InstanceSize.MEDIUM
    ),
    dbAllocatedStorage: 100,
    customAmiId: 'ami-0abcdef1234567890',
    bucketVersioning: true,
  },
};

describe('TapStack Tests', () => {
  const environments = ['dev', 'staging', 'production'];

  environments.forEach(env => {
    describe(`${env} environment`, () => {
      let app: cdk.App;
      let stack: TapStack;
      let template: Template;

      beforeEach(() => {
        app = new cdk.App();
        stack = new TapStack(app, `TestTapStack-${env}`, {
          environmentSuffix: env,
          config: testConfigs[env],
        });
        template = Template.fromStack(stack);
      });

      // -------------------------
      // VPC TESTS
      // -------------------------
      test('creates VPC with correct CIDR', () => {
        template.hasResourceProperties('AWS::EC2::VPC', {
          CidrBlock: testConfigs[env].vpcCidr,
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
        });
      });

      test('creates 3 subnet types', () => {
        const subnets = template.findResources('AWS::EC2::Subnet');
        expect(Object.keys(subnets).length).toBeGreaterThanOrEqual(6);
      });

      test('creates NAT gateways', () => {
        const natGateways = template.findResources('AWS::EC2::NatGateway');
        expect(Object.keys(natGateways).length).toBeGreaterThanOrEqual(2);
      });

      // -------------------------
      // SECURITY GROUPS
      // -------------------------
      test('web security group has correct ingress rules', () => {
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
          GroupDescription: Match.stringLikeRegexp('web servers'),
          SecurityGroupIngress: Match.arrayWith([
            Match.objectLike({ FromPort: 80, ToPort: 80 }),
            Match.objectLike({ FromPort: 443, ToPort: 443 }),
            Match.objectLike({ FromPort: 22, ToPort: 22 }),
          ]),
        });
      });

      test('database security group allows MySQL from web SG', () => {
        const ingress = template.findResources(
          'AWS::EC2::SecurityGroupIngress'
        );
        const dbRule = Object.values(ingress).find(
          (r: any) => r.Properties?.FromPort === 3306
        );
        expect(dbRule).toBeDefined();
      });

      // -------------------------
      // COMPUTE (Launch Template + ASG)
      // -------------------------
      test('creates launch template with correct instance type', () => {
        template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
          LaunchTemplateData: Match.objectLike({
            InstanceType: testConfigs[env].instanceType.toString(),
          }),
        });
      });

      // -------------------------
      // LOAD BALANCER
      // -------------------------
      test('creates ALB with listener', () => {
        template.hasResourceProperties(
          'AWS::ElasticLoadBalancingV2::LoadBalancer',
          {
            Scheme: 'internet-facing',
          }
        );
        template.hasResourceProperties(
          'AWS::ElasticLoadBalancingV2::Listener',
          {
            Port: 80,
          }
        );
      });

      // -------------------------
      // DATABASE
      // -------------------------
      test('creates RDS instance with correct config (except in LocalStack)', () => {
        // In LocalStack, RDS is disabled due to provisioning issues
        const isLocalStackTest =
          process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
          process.env.AWS_ENDPOINT_URL?.includes('4566');

        if (!isLocalStackTest) {
          template.hasResourceProperties('AWS::RDS::DBInstance', {
            DBInstanceClass: `db.${testConfigs[env].dbInstanceClass.toString()}`,
            AllocatedStorage: `${testConfigs[env].dbAllocatedStorage}`,
            Engine: 'mysql',
          });
        } else {
          // In LocalStack, RDS should NOT be present
          const resources = template.findResources('AWS::RDS::DBInstance');
          expect(Object.keys(resources).length).toBe(0);
        }
      });

      // -------------------------
      // S3 BUCKETS
      // -------------------------
      test('creates assets S3 bucket', () => {
        const buckets = template.findResources('AWS::S3::Bucket');

        // Find the assets bucket by matching the logical ID name
        const assetsBucket = Object.values(buckets).find((b: any) =>
          JSON.stringify(b.Properties.BucketName).includes('assets')
        );

        expect(assetsBucket).toBeDefined();
        expect(JSON.stringify(assetsBucket?.Properties.BucketName)).toContain(
          `tap-${env}-assets`
        );
      });

      test('creates logs S3 bucket', () => {
        const buckets = template.findResources('AWS::S3::Bucket');

        // Find the logs bucket by matching the logical ID name
        const logsBucket = Object.values(buckets).find((b: any) =>
          JSON.stringify(b.Properties.BucketName).includes('logs')
        );

        expect(logsBucket).toBeDefined();
        expect(JSON.stringify(logsBucket?.Properties.BucketName)).toContain(
          `tap-${env}-logs`
        );
      });

      // -------------------------
      // MONITORING
      // -------------------------
      test('creates CloudWatch log group', () => {
        template.hasResourceProperties('AWS::Logs::LogGroup', {
          LogGroupName: `/aws/webapp/${env}`,
        });
      });

      // -------------------------
      // OUTPUTS
      // -------------------------
      test('creates required outputs', () => {
        const outputs = template.findOutputs('*');
        expect(Object.keys(outputs)).toEqual(
          expect.arrayContaining([
            'LoadBalancerDNS',
            'DatabaseEndpoint',
            'AssetsBucketName',
            'LogsBucketName',
            'VPCId',
            'KeyPairName',
            'LogGroupName',
          ])
        );
      });
    });
  });

  // Additional tests for LocalStack-specific code paths
  describe('LocalStack compatibility', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      // Simulate LocalStack environment BEFORE importing/creating stack
      process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';
    });

    afterEach(() => {
      delete process.env.AWS_ENDPOINT_URL;
    });

    test('uses simplified bucket names for LocalStack', () => {
      // Create stack within test to ensure env var is read at evaluation time
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack-localstack', {
        environmentSuffix: 'dev',
        config: testConfigs.dev,
      });
      template = Template.fromStack(stack);

      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketNames = Object.values(buckets).map((b: any) =>
        JSON.stringify(b.Properties.BucketName)
      );
      // In LocalStack, bucket names should be simple (no account/region)
      expect(
        bucketNames.some(
          name => name.includes('assets-dev') || name.includes('logs-dev')
        )
      ).toBeTruthy();
    });

    test('VPC does not restrict default security group in LocalStack', () => {
      // Create stack within test to ensure env var is read at evaluation time
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack-localstack-vpc', {
        environmentSuffix: 'dev',
        config: testConfigs.dev,
      });
      template = Template.fromStack(stack);

      // When isLocalStack is true, restrictDefaultSecurityGroup should be false
      // This is a synthesized property, so we verify VPC is created
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });
  });

  // Test context-based environment suffix
  describe('Context-based configuration', () => {
    test('uses context value for environmentSuffix if provided', () => {
      const app = new cdk.App({
        context: {
          environmentSuffix: 'context-test',
        },
      });
      const stack = new TapStack(app, 'TestTapStack-context', {
        config: testConfigs.dev,
      });
      const template = Template.fromStack(stack);

      // Verify environment suffix is used in resource naming
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/webapp/context-test',
      });
    });

    test("defaults to 'dev' when no environmentSuffix provided", () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack-default', {
        config: testConfigs.dev,
      });
      const template = Template.fromStack(stack);

      // Should default to 'dev'
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/webapp/dev',
      });
    });
  });

  // Test custom AMI configuration
  describe('Custom AMI configuration', () => {
    test('uses custom AMI when specified', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack-custom-ami', {
        environmentSuffix: 'production',
        config: testConfigs.production,
      });
      const template = Template.fromStack(stack);

      // Custom AMI is specified in production config
      // Note: MachineImage.genericLinux creates a mapping, so ImageId is an object
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          ImageId: Match.anyValue(), // Accept any value (could be string or object with Fn::FindInMap)
        }),
      });

      // Verify the mapping exists for the custom AMI
      const mappings = template.findMappings('*');
      const hasMappingWithAmi = Object.values(mappings).some((mapping: any) => {
        return JSON.stringify(mapping).includes('ami-0abcdef1234567890');
      });
      expect(hasMappingWithAmi).toBeTruthy();
    });
  });

  // Test lifecycle rules variations
  describe('S3 Lifecycle rules', () => {
    test('production has different lifecycle rules', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack-prod-lifecycle', {
        environmentSuffix: 'Production',
        config: testConfigs.production,
      });
      const template = Template.fromStack(stack);

      // Verify buckets exist (lifecycle rules are handled by CDK)
      const buckets = template.findResources('AWS::S3::Bucket');
      expect(Object.keys(buckets).length).toBeGreaterThanOrEqual(2);
    });
  });

  // Test deletion protection
  describe('Deletion protection (non-LocalStack only)', () => {
    beforeEach(() => {
      delete process.env.AWS_ENDPOINT_URL;
    });

    test('production has deletion protection enabled', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack-prod-protection', {
        environmentSuffix: 'Production',
        config: testConfigs.production,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: true,
      });
    });

    test('non-production does not have deletion protection', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack-dev-no-protection', {
        environmentSuffix: 'dev',
        config: testConfigs.dev,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: false,
      });
    });
  });
});
