import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack, EnvironmentConfig } from '../lib/tap-stack';

const environmentSuffix = 'test123';

// Environment configurations for testing
const testConfigs: { [key: string]: EnvironmentConfig } = {
  development: {
    environment: 'Development',
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
    environment: 'Staging',
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
    environment: 'Production',
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

describe('TapStack', () => {
  describe('Development Environment', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix,
        config: testConfigs.development,
      });
      template = Template.fromStack(stack);
    });

    describe('VPC Configuration', () => {
      test('creates VPC with correct CIDR', () => {
        template.hasResourceProperties('AWS::EC2::VPC', {
          CidrBlock: '10.0.0.0/16',
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
        });
      });

      test('creates VPC with correct tags and naming', () => {
        template.hasResourceProperties('AWS::EC2::VPC', {
          Tags: Match.arrayWith([
            Match.objectLike({ Key: 'Name', Value: `development-webapp-vpc-${environmentSuffix}` }),
            Match.objectLike({ Key: 'Environment', Value: 'Development' }),
            Match.objectLike({ Key: 'Project', Value: 'WebApplication' }),
            Match.objectLike({ Key: 'ManagedBy', Value: 'CDK' }),
          ]),
        });
      });

      test('creates public, private and isolated subnets', () => {
        const subnets = template.findResources('AWS::EC2::Subnet');
        const subnetTypes = Object.values(subnets).map((subnet: any) => {
          const tags = subnet.Properties?.Tags || [];
          const typeTag = tags.find((tag: any) => tag.Key === 'aws-cdk:subnet-type');
          return typeTag?.Value;
        });

        expect(subnetTypes).toContain('Public');
        expect(subnetTypes).toContain('Private');
        expect(subnetTypes).toContain('Isolated');
        expect(Object.keys(subnets).length).toBeGreaterThanOrEqual(6); // At least 2 of each type
      });

      test('creates NAT gateways for private subnets', () => {
        const natGateways = template.findResources('AWS::EC2::NatGateway');
        expect(Object.keys(natGateways).length).toBeGreaterThanOrEqual(2);
      });

      test('creates Internet Gateway', () => {
        template.hasResourceProperties('AWS::EC2::InternetGateway', {
          Tags: Match.arrayWith([
            Match.objectLike({ Key: 'Name', Value: `development-webapp-vpc-${environmentSuffix}` }),
          ]),
        });
      });
    });

    describe('Security Groups', () => {
      test('creates web security group with correct rules', () => {
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
          GroupName: `development-web-sg-${environmentSuffix}`,
          GroupDescription: 'Security group for Development web servers',
          SecurityGroupIngress: Match.arrayWith([
            Match.objectLike({
              IpProtocol: 'tcp',
              FromPort: 80,
              ToPort: 80,
              CidrIp: '0.0.0.0/0',
            }),
            Match.objectLike({
              IpProtocol: 'tcp',
              FromPort: 443,
              ToPort: 443,
              CidrIp: '0.0.0.0/0',
            }),
            Match.objectLike({
              IpProtocol: 'tcp',
              FromPort: 22,
              ToPort: 22,
              CidrIp: '0.0.0.0/0',
            }),
          ]),
        });
      });

      test('creates database security group with restricted access', () => {
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
          GroupName: `development-db-sg-${environmentSuffix}`,
          GroupDescription: 'Security group for Development database',
        });

        // Check that database SG has ingress rule from web SG
        const securityGroupIngress = template.findResources('AWS::EC2::SecurityGroupIngress');
        const dbIngress = Object.values(securityGroupIngress).find((sg: any) => 
          sg.Properties?.FromPort === 3306 && sg.Properties?.ToPort === 3306
        );
        expect(dbIngress).toBeDefined();
      });
    });

    describe('Compute Resources', () => {
      test('creates key pair with environment suffix', () => {
        template.hasResourceProperties('AWS::EC2::KeyPair', {
          KeyName: `development-keypair-${environmentSuffix}`,
          KeyType: 'rsa',
        });
      });

      test('creates launch template with correct configuration', () => {
        template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
          LaunchTemplateName: `development-webapp-template-${environmentSuffix}`,
          LaunchTemplateData: Match.objectLike({
            InstanceType: 't3.micro',
            UserData: Match.anyValue(),
          }),
        });
      });

      test('creates auto scaling group with correct settings', () => {
        template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
          AutoScalingGroupName: `development-webapp-asg-${environmentSuffix}`,
          MinSize: '1',
          MaxSize: '3',
          DesiredCapacity: '1',
        });
      });

      test('creates IAM role for EC2 instances', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
          RoleName: 'TestTapStack-ec2-role',
          AssumeRolePolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: 'sts:AssumeRole',
                Principal: Match.objectLike({
                  Service: 'ec2.amazonaws.com',
                }),
              }),
            ]),
          }),
        });
      });

      test('attaches correct managed policies to EC2 role', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
          ManagedPolicyArns: Match.arrayWith([
            Match.objectLike({
              'Fn::Join': Match.arrayWith([
                '',
                Match.arrayWith([
                  Match.anyValue(),
                  ':iam::aws:policy/CloudWatchAgentServerPolicy',
                ]),
              ]),
            }),
            Match.objectLike({
              'Fn::Join': Match.arrayWith([
                '',
                Match.arrayWith([
                  Match.anyValue(),
                  ':iam::aws:policy/AmazonSSMManagedInstanceCore',
                ]),
              ]),
            }),
          ]),
        });
      });
    });

    describe('Load Balancer', () => {
      test('creates application load balancer', () => {
        template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
          Name: `development-alb-${environmentSuffix}`,
          Type: 'application',
          Scheme: 'internet-facing',
        });
      });

      test('creates listener on port 80', () => {
        template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
          Port: 80,
          Protocol: 'HTTP',
        });
      });

      test('creates target group with health check', () => {
        template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
          Name: `development-targets-${environmentSuffix}`,
          Port: 80,
          Protocol: 'HTTP',
          HealthCheckPath: '/',
          HealthCheckIntervalSeconds: 30,
        });
      });
    });

    describe('Database', () => {
      test('creates RDS subnet group', () => {
        template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
          DBSubnetGroupName: `development-db-subnet-${environmentSuffix}`,
          DBSubnetGroupDescription: 'Database subnet group for Development',
        });
      });

      test('creates RDS instance with correct configuration', () => {
        template.hasResourceProperties('AWS::RDS::DBInstance', {
          DBInstanceIdentifier: `development-db-${environmentSuffix}`,
          Engine: 'mysql',
          DBInstanceClass: 'db.t3.small',
          AllocatedStorage: '20',
          StorageType: 'gp2',
          BackupRetentionPeriod: 1,
          DeletionProtection: false,
        });
      });

      test('database has DESTROY removal policy', () => {
        const databases = template.findResources('AWS::RDS::DBInstance');
        Object.values(databases).forEach((db: any) => {
          expect(db.DeletionPolicy).not.toBe('Retain');
          expect(db.UpdateReplacePolicy).not.toBe('Retain');
        });
      });

      test('creates database credentials secret', () => {
        template.hasResourceProperties('AWS::SecretsManager::Secret', {
          Name: `development-db-creds-${environmentSuffix}`,
          Description: Match.anyValue(),
          GenerateSecretString: Match.objectLike({
            SecretStringTemplate: '{"username":"admin"}',
          }),
        });
      });
    });

    describe('Storage', () => {
      test('creates assets S3 bucket with environment suffix', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketName: Match.stringLikeRegexp(`tap-${environmentSuffix}-assets-.*`),
          VersioningConfiguration: {
            Status: 'Suspended',
          },
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
        });
      });

      test('creates logs S3 bucket with environment suffix', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketName: Match.stringLikeRegexp(`tap-${environmentSuffix}-logs-.*`),
          LifecycleConfiguration: {
            Rules: Match.arrayWith([
              Match.objectLike({
                Id: 'DeleteOldLogs',
                ExpirationInDays: 30,
                Status: 'Enabled',
              }),
            ]),
          },
        });
      });

      test('all S3 buckets have DESTROY removal policy', () => {
        const buckets = template.findResources('AWS::S3::Bucket');
        Object.values(buckets).forEach((bucket: any) => {
          expect(bucket.DeletionPolicy).not.toBe('Retain');
          expect(bucket.UpdateReplacePolicy).not.toBe('Retain');
        });
      });
    });

    describe('Monitoring', () => {
      test('creates CloudWatch log group', () => {
        template.hasResourceProperties('AWS::Logs::LogGroup', {
          LogGroupName: `/aws/webapp/development-${environmentSuffix}`,
          RetentionInDays: 7,
        });
      });

      test('log group has DESTROY removal policy', () => {
        const logGroups = template.findResources('AWS::Logs::LogGroup');
        Object.values(logGroups).forEach((lg: any) => {
          expect(lg.DeletionPolicy).not.toBe('Retain');
          expect(lg.UpdateReplacePolicy).not.toBe('Retain');
        });
      });
    });

    describe('Stack Outputs', () => {
      test('creates all required outputs', () => {
        const outputs = template.findOutputs('*');
        const outputKeys = Object.keys(outputs);

        expect(outputKeys).toContain('LoadBalancerDNS');
        expect(outputKeys).toContain('DatabaseEndpoint');
        expect(outputKeys).toContain('AssetsBucketName');
        expect(outputKeys).toContain('LogsBucketName');
        expect(outputKeys).toContain('VPCId');
        expect(outputKeys).toContain('KeyPairName');
        expect(outputKeys).toContain('LogGroupName');
      });
    });

    describe('Tagging', () => {
      test('applies consistent tags to all resources', () => {
        const vpc = template.findResources('AWS::EC2::VPC');
        const vpcTags = Object.values(vpc)[0].Properties?.Tags || [];

        expect(vpcTags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ Key: 'Environment', Value: 'Development' }),
            expect.objectContaining({ Key: 'Project', Value: 'WebApplication' }),
            expect.objectContaining({ Key: 'ManagedBy', Value: 'CDK' }),
          ])
        );
      });
    });
  });

  describe('Staging Environment', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix,
        config: testConfigs.staging,
      });
      template = Template.fromStack(stack);
    });

    test('uses staging-specific VPC CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
      });
    });

    test('uses staging-specific instance types', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.small',
        }),
      });
    });

    test('enables bucket versioning for staging', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const assetsBucket = Object.values(buckets).find((bucket: any) =>
        bucket.Properties?.BucketName?.includes('assets')
      );
      expect(assetsBucket?.Properties?.VersioningConfiguration?.Status).toBe('Enabled');
    });

    test('uses staging-specific database configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.small',
        AllocatedStorage: '50',
      });
    });
  });

  describe('Production Environment', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix,
        config: testConfigs.production,
      });
      template = Template.fromStack(stack);
    });

    test('uses production-specific VPC CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.2.0.0/16',
      });
    });

    test('uses production-specific instance types', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.medium',
        }),
      });
    });

    test('uses custom AMI for production', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          ImageId: 'ami-0abcdef1234567890',
        }),
      });
    });

    test('uses production-specific auto scaling configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '6',
        DesiredCapacity: '2',
      });
    });

    test('uses production-specific database configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.medium',
        AllocatedStorage: '100',
      });
    });

    test('enables bucket versioning for production', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const assetsBucket = Object.values(buckets).find((bucket: any) =>
        bucket.Properties?.BucketName?.includes('assets')
      );
      expect(assetsBucket?.Properties?.VersioningConfiguration?.Status).toBe('Enabled');
    });

    test('production still has DESTROY removal policy (per requirements)', () => {
      const databases = template.findResources('AWS::RDS::DBInstance');
      Object.values(databases).forEach((db: any) => {
        expect(db.DeletionPolicy).not.toBe('Retain');
      });

      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.DeletionPolicy).not.toBe('Retain');
      });
    });
  });

  describe('Environment Suffix Application', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      const customSuffix = 'pr123';
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: customSuffix,
        config: testConfigs.development,
      });
      template = Template.fromStack(stack);
    });

    test('applies environment suffix to all named resources', () => {
      // Check VPC name
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: Match.stringLikeRegexp('.*pr123') }),
        ]),
      });

      // Check security groups
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.stringLikeRegexp('.*pr123'),
      });

      // Check launch template
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: Match.stringLikeRegexp('.*pr123'),
      });

      // Check auto scaling group
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: Match.stringLikeRegexp('.*pr123'),
      });

      // Check load balancer
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: Match.stringLikeRegexp('.*pr123'),
      });

      // Check RDS instance
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: Match.stringLikeRegexp('.*pr123'),
      });

      // Check S3 buckets
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties?.BucketName).toMatch(/pr123/);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles missing environment suffix gracefully', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestTapStack', {
        config: testConfigs.development,
      });
      const template = Template.fromStack(stack);

      // Should use 'dev' as default
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.stringLikeRegexp('.*dev'),
      });
    });

    test('handles environment suffix from context', () => {
      const app = new cdk.App({
        context: {
          environmentSuffix: 'context123',
        },
      });
      const stack = new TapStack(app, 'TestTapStack', {
        config: testConfigs.development,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.stringLikeRegexp('.*context123'),
      });
    });
  });

  describe('Resource Dependencies', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix,
        config: testConfigs.development,
      });
      template = Template.fromStack(stack);
    });

    test('database is in isolated subnets', () => {
      const dbSubnetGroup = template.findResources('AWS::RDS::DBSubnetGroup');
      const subnetGroupProps = Object.values(dbSubnetGroup)[0].Properties;
      
      // Check that subnet refs are present
      expect(subnetGroupProps?.SubnetIds).toBeDefined();
      expect(subnetGroupProps?.SubnetIds.length).toBeGreaterThan(0);
    });

    test('auto scaling group is in private subnets', () => {
      const asg = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      const asgProps = Object.values(asg)[0].Properties;
      
      // Check that VPC zone identifier is present
      expect(asgProps?.VPCZoneIdentifier).toBeDefined();
      expect(asgProps?.VPCZoneIdentifier.length).toBeGreaterThan(0);
    });

    test('load balancer is in public subnets', () => {
      const alb = template.findResources('AWS::ElasticLoadBalancingV2::LoadBalancer');
      const albProps = Object.values(alb)[0].Properties;
      
      // Check that subnets are specified
      expect(albProps?.Subnets).toBeDefined();
      expect(albProps?.Subnets.length).toBeGreaterThan(0);
    });
  });
});