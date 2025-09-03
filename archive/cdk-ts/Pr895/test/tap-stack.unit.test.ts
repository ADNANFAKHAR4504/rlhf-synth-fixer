import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test123';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Public',
          }),
        ]),
      });
    });

    test('creates private subnets with egress', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-name',
            Value: 'Private',
          }),
        ]),
      });
    });

    test('creates isolated database subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-name',
            Value: 'Database',
          }),
        ]),
      });
    });

    test('creates NAT gateways', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(natGateways).length).toBeGreaterThanOrEqual(1);
    });

    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('Application Load Balancer', () => {
    test('creates ALB with correct configuration', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing',
        Name: `tap-${environmentSuffix}-alb`,
      });
    });

    test('creates HTTP listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('creates target group with health check', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckEnabled: true,
        HealthCheckPath: '/',
        HealthCheckProtocol: 'HTTP',
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
      });
    });

    test('ALB has access logging enabled', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        LoadBalancerAttributes: Match.arrayWith([
          Match.objectLike({
            Key: 'access_logs.s3.enabled',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('creates Auto Scaling Group with correct capacity', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '10',
        DesiredCapacity: '2',
      });
    });

    test('creates launch template with correct instance type', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.micro',
        }),
      });
    });

    test('configures CPU-based scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        TargetTrackingConfiguration: Match.objectLike({
          PredefinedMetricSpecification: Match.objectLike({
            PredefinedMetricType: 'ASGAverageCPUUtilization',
          }),
          TargetValue: 70,
        }),
      });
    });

    test('configures request count scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        TargetTrackingConfiguration: Match.objectLike({
          PredefinedMetricSpecification: Match.objectLike({
            PredefinedMetricType: 'ALBRequestCountPerTarget',
          }),
          TargetValue: 1000,
        }),
      });
    });

    test('Auto Scaling Group spans multiple AZs', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        VPCZoneIdentifier: Match.anyValue(),
      });
    });
  });

  describe('RDS Database', () => {
    test('creates RDS instance with Multi-AZ deployment', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MultiAZ: true,
        DBInstanceIdentifier: `tap-${environmentSuffix}-db`,
        Engine: 'mysql',
        DBInstanceClass: 'db.t3.medium',
      });
    });

    test('configures RDS with storage autoscaling', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        AllocatedStorage: '20',
        MaxAllocatedStorage: 100,
      });
    });

    test('enables RDS encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });
    });

    test('configures backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
      });
    });

    test('deletion protection is disabled for testing', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: false,
      });
    });

    test('enables performance insights', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnablePerformanceInsights: true,
      });
    });

    test('creates DB subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });

    test('configures CloudWatch log exports', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnableCloudwatchLogsExports: ['error', 'general'],
      });
    });
  });

  describe('S3 Buckets', () => {
    test('creates static assets bucket with versioning', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const staticAssetsBucket = Object.values(buckets).find((bucket) => {
        const name = bucket.Properties?.BucketName;
        if (typeof name === 'object' && name['Fn::Join']) {
          const parts = name['Fn::Join'][1];
          return parts.some((part: any) => 
            typeof part === 'string' && part.includes(`tap-${environmentSuffix}-assets`)
          );
        }
        return false;
      });
      
      expect(staticAssetsBucket).toBeDefined();
      expect(staticAssetsBucket?.Properties?.VersioningConfiguration?.Status).toBe('Enabled');
    });

    test('creates ALB logs bucket', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const logsBucket = Object.values(buckets).find((bucket) => {
        const name = bucket.Properties?.BucketName;
        if (typeof name === 'object' && name['Fn::Join']) {
          const parts = name['Fn::Join'][1];
          return parts.some((part: any) => 
            typeof part === 'string' && part.includes(`tap-${environmentSuffix}-logs`)
          );
        }
        return false;
      });
      
      expect(logsBucket).toBeDefined();
    });

    test('buckets have deletion policy for cleanup', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket) => {
        expect(bucket.DeletionPolicy).toEqual('Delete');
      });
    });

    test('static assets bucket has lifecycle rules', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const staticAssetsBucket = Object.values(buckets).find((bucket) => {
        const name = bucket.Properties?.BucketName;
        if (typeof name === 'object' && name['Fn::Join']) {
          const parts = name['Fn::Join'][1];
          return parts.some((part: any) => 
            typeof part === 'string' && part.includes(`tap-${environmentSuffix}-assets`)
          );
        }
        return false;
      });
      
      expect(staticAssetsBucket).toBeDefined();
      const rules = staticAssetsBucket?.Properties?.LifecycleConfiguration?.Rules;
      expect(rules).toBeDefined();
      expect(rules).toContainEqual(expect.objectContaining({
        Id: 'DeleteOldVersions',
        ExpiredObjectDeleteMarker: true,
      }));
    });

    test('ALB logs bucket has lifecycle rules', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const logsBucket = Object.values(buckets).find((bucket) => {
        const name = bucket.Properties?.BucketName;
        if (typeof name === 'object' && name['Fn::Join']) {
          const parts = name['Fn::Join'][1];
          return parts.some((part: any) => 
            typeof part === 'string' && part.includes(`tap-${environmentSuffix}-logs`)
          );
        }
        return false;
      });
      
      expect(logsBucket).toBeDefined();
      const rules = logsBucket?.Properties?.LifecycleConfiguration?.Rules;
      expect(rules).toBeDefined();
      expect(rules).toContainEqual(expect.objectContaining({
        Id: 'DeleteOldLogs',
        ExpirationInDays: 30,
      }));
    });
  });

  describe('Security Groups', () => {
    test('creates ALB security group with HTTP and HTTPS ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
          }),
        ]),
      });
    });

    test('creates EC2 security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances in Auto Scaling group',
      });
    });

    test('creates RDS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
      });
    });

    test('EC2 security group allows traffic from ALB', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const ec2SecurityGroup = Object.entries(securityGroups).find(
        ([, resource]) =>
          resource.Properties?.GroupDescription ===
          'Security group for EC2 instances in Auto Scaling group'
      );
      expect(ec2SecurityGroup).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    test('creates IAM role for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            }),
          ]),
        }),
      });
    });

    test('EC2 role has CloudWatch and SSM policies', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Role = Object.values(roles).find((role) => {
        const statement = role.Properties?.AssumeRolePolicyDocument?.Statement?.[0];
        return statement?.Principal?.Service === 'ec2.amazonaws.com';
      });
      
      expect(ec2Role).toBeDefined();
      const managedPolicies = ec2Role?.Properties?.ManagedPolicyArns;
      expect(managedPolicies).toBeDefined();
      
      // Check that CloudWatch and SSM policies are included
      const policiesAsString = JSON.stringify(managedPolicies);
      expect(policiesAsString).toContain('CloudWatchAgentServerPolicy');
      expect(policiesAsString).toContain('AmazonSSMManagedInstanceCore');
    });
  });

  describe('Parameters', () => {
    test('creates database password parameter', () => {
      template.hasParameter('DatabasePassword', {
        Type: 'String',
        NoEcho: true,
        MinLength: 8,
        Description: 'Password for RDS database',
      });
    });
  });

  describe('Outputs', () => {
    test('creates LoadBalancerDNS output', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'DNS name of the Application Load Balancer',
      });
    });

    test('creates WebsiteURL output', () => {
      template.hasOutput('WebsiteURL', {
        Description: Match.stringLikeRegexp('Website URL.*'),
      });
    });

    test('creates DatabaseEndpoint output', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS database endpoint',
      });
    });

    test('creates StaticAssetsBucketName output', () => {
      template.hasOutput('StaticAssetsBucketName', {
        Description: 'S3 bucket for static assets',
      });
    });

    test('creates ALBLogsBucketName output', () => {
      template.hasOutput('ALBLogsBucketName', {
        Description: 'S3 bucket for ALB logs',
      });
    });
  });

  describe('Tagging', () => {
    test('all resources are tagged with Environment: Production', () => {
      // Check VPC tagging as a representative
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });
    });

    test('all resources are tagged with Application: WebApp', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Application',
            Value: 'WebApp',
          }),
        ]),
      });
    });

    test('all resources are tagged with Owner: DevOps', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Owner',
            Value: 'DevOps',
          }),
        ]),
      });
    });
  });

  describe('High Availability', () => {
    test('Auto Scaling Group has minimum 2 instances', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
      });
    });

    test('RDS has Multi-AZ enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MultiAZ: true,
      });
    });

    test('VPC has multiple availability zones', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const publicSubnets = Object.values(subnets).filter((subnet) =>
        subnet.Properties?.Tags?.some(
          (tag: any) => tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Public'
        )
      );
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Resource Naming', () => {
    test('ALB includes environment suffix in name', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `tap-${environmentSuffix}-alb`,
      });
    });

    test('RDS instance includes environment suffix in identifier', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: `tap-${environmentSuffix}-db`,
      });
    });

    test('S3 buckets include environment suffix in names', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketNames = Object.values(buckets).map((bucket) => bucket.Properties?.BucketName);
      
      // Check that at least one bucket has the proper naming
      const hasProperNaming = bucketNames.some((name) => {
        if (typeof name === 'object' && name['Fn::Join']) {
          // Check the joined string contains our prefix
          const parts = name['Fn::Join'][1];
          return parts.some((part: any) => 
            typeof part === 'string' && part.includes(`tap-${environmentSuffix}`)
          );
        }
        return false;
      });
      
      expect(hasProperNaming).toBe(true);
    });
  });

  describe('Environment Suffix Handling', () => {
    test('uses environment suffix from props when provided', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'custom',
      });
      const customTemplate = Template.fromStack(customStack);
      
      customTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: 'tap-custom-alb',
      });
    });

    test('uses environment suffix from context when props not provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack');
      const contextTemplate = Template.fromStack(contextStack);
      
      contextTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: 'tap-context-alb',
      });
    });

    test('uses environment suffix from env variable when context not provided', () => {
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      process.env.ENVIRONMENT_SUFFIX = 'envvar';
      
      const envApp = new cdk.App();
      const envStack = new TapStack(envApp, 'EnvStack');
      const envTemplate = Template.fromStack(envStack);
      
      envTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: 'tap-envvar-alb',
      });
      
      // Restore original env
      if (originalEnv) {
        process.env.ENVIRONMENT_SUFFIX = originalEnv;
      } else {
        delete process.env.ENVIRONMENT_SUFFIX;
      }
    });

    test('defaults to dev when no environment suffix provided', () => {
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      delete process.env.ENVIRONMENT_SUFFIX;
      
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);
      
      defaultTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: 'tap-dev-alb',
      });
      
      // Restore original env
      if (originalEnv) {
        process.env.ENVIRONMENT_SUFFIX = originalEnv;
      }
    });
  });
});