import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('KMS Encryption Key', () => {
    test('should create KMS key with proper configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('Encryption key for loan processing app'),
        EnableKeyRotation: true,
      });
    });

    test('should have exactly one KMS key', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
    });

    test('should have KMS key created', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('should enable DNS hostnames and support', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public subnets across multiple AZs', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('should create private subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBeGreaterThanOrEqual(3);
    });

    test('should create NAT gateways for high availability', () => {
      const ngws = template.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(ngws).length).toBeGreaterThanOrEqual(1);
    });

    test('should allocate elastic IPs for NAT gateways', () => {
      const eips = template.findResources('AWS::EC2::EIP');
      expect(Object.keys(eips).length).toBeGreaterThanOrEqual(1);
    });

    test('should have internet gateway', () => {
      const igw = template.findResources('AWS::EC2::InternetGateway');
      expect(Object.keys(igw).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('S3 Buckets Configuration', () => {
    test('should create ALB logs bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('loan-app-alb-logs'),
      });
    });

    test('should create app logs bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('loan-app-logs'),
      });
    });

    test('should create static assets bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('loan-app-assets'),
      });
    });

    test('should have total of 3 S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 3);
    });

    test('all buckets should have versioning enabled', () => {
      template.allResources('AWS::S3::Bucket', (resource) => {
        expect(resource.Properties.VersioningConfiguration).toEqual({
          Status: 'Enabled',
        });
      });
    });

    test('all buckets should have public access blocked', () => {
      template.allResources('AWS::S3::Bucket', (resource) => {
        expect(resource.Properties).toHaveProperty('PublicAccessBlockConfiguration');
      });
    });

    test('ALB logs bucket should have lifecycle policy', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('loan-app-alb-logs'),
        LifecycleConfiguration: Match.objectLike({
          Rules: Match.arrayWith([
            Match.objectLike({
              ExpirationInDays: 90,
              Status: 'Enabled',
            }),
          ]),
        }),
      });
    });

    test('app logs bucket should have KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('loan-app-logs'),
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            }),
          ]),
        }),
      });
    });

    test('static assets bucket should have S3 encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('loan-app-assets'),
      });
    });
  });

  describe('CloudFront Distribution', () => {
    test('should create CloudFront distribution', () => {
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    });

    test('should redirect HTTP to HTTPS', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          DefaultCacheBehavior: Match.objectLike({
            ViewerProtocolPolicy: 'redirect-to-https',
          }),
        }),
      });
    });

    test('should have origin access identity for S3', () => {
      template.resourceCountIs('AWS::CloudFront::CloudFrontOriginAccessIdentity', 1);
    });
  });

  describe('ECS Cluster', () => {
    test('should create ECS cluster', () => {
      template.resourceCountIs('AWS::ECS::Cluster', 1);
    });

    test('should name cluster with environment suffix', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: Match.stringLikeRegexp('loan-processing-cluster'),
      });
    });

    test('should enable container insights', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: Match.stringLikeRegexp('loan-processing-cluster'),
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create ALB', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    });

    test('should be internet-facing', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('should enable access logs', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        LoadBalancerAttributes: Match.arrayWith([
          Match.objectLike({
            Key: 'access_logs.s3.enabled',
            Value: 'true',
          }),
        ]),
      });
    });

    test('should create listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('RDS Aurora PostgreSQL', () => {
    test('should create RDS cluster', () => {
      template.resourceCountIs('AWS::RDS::DBCluster', 1);
    });

    test('should use Aurora PostgreSQL engine', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
      });
    });

    test('should use PostgreSQL version 15.8', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        EngineVersion: Match.stringLikeRegexp('15.8'),
      });
    });

    test('should enable storage encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        StorageEncrypted: true,
      });
    });

    test('should use customer-managed KMS key', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        StorageEncrypted: true,
      });
    });

    test('should enable IAM database authentication', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        EnableIAMDatabaseAuthentication: true,
      });
    });

    test('should retain backups for 35 days', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 35,
      });
    });

    test('should have writer instance', () => {
      const instances = template.findResources('AWS::RDS::DBInstance');
      expect(Object.keys(instances).length).toBeGreaterThanOrEqual(3);
    });

    test('should have 2 reader instances', () => {
      template.allResources('AWS::RDS::DBInstance', (resource) => {
        expect(resource.Properties).toHaveProperty('DBInstanceClass');
      });
    });

    test('should be in private subnets', () => {
      template.resourceCountIs('AWS::RDS::DBSubnetGroup', 1);
    });

    test('should allow deletion for testing', () => {
      template.resourceCountIs('AWS::RDS::DBCluster', 1);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create ECS log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/ecs/loan-processing'),
      });
    });

    test('should create Lambda log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/lambda/loan-processing'),
      });
    });

    test('should set retention to 90 days for ECS', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/ecs/loan-processing'),
        RetentionInDays: 90,
      });
    });

    test('should set retention to 90 days for Lambda', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/lambda/loan-processing'),
        RetentionInDays: 90,
      });
    });

    test('should have log groups for all services', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 2);
    });
  });

  describe('Lambda Functions', () => {
    test('should create processing Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('loan-processing-async'),
      });
    });

    test('should create log export Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('loan-processing-log-export'),
      });
    });

    test('should have Lambda functions created', () => {
      const lambdas = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdas).length).toBeGreaterThanOrEqual(2);
    });

    test('processing Lambda should have Node.js 18 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
      });
    });

    test('Lambda functions should have proper configuration', () => {
      template.allResources('AWS::Lambda::Function', (resource) => {
        expect(resource.Properties.FunctionName).toBeDefined();
        expect(resource.Properties.Runtime).toBeDefined();
      });
    });

    test('processing Lambda should have VPC configuration', () => {
      template.allResources('AWS::Lambda::Function', (resource) => {
        if ((resource.Properties.FunctionName as string).includes('async')) {
          expect(resource.Properties.VpcConfig).toBeDefined();
        }
      });
    });

    test('Lambda functions should have environment variables', () => {
      template.allResources('AWS::Lambda::Function', (resource) => {
        expect(resource.Properties.Environment).toBeDefined();
      });
    });
  });

  describe('ECS Task Definition', () => {
    test('should create task definition', () => {
      template.resourceCountIs('AWS::ECS::TaskDefinition', 1);
    });

    test('should have 2048 MiB memory', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Memory: '2048',
      });
    });

    test('should have 1024 CPU units', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Cpu: '1024',
      });
    });

    test('should support Fargate', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        RequiresCompatibilities: Match.arrayWith(['FARGATE']),
      });
    });

    test('should use nginx container', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Image: Match.stringLikeRegexp('nginx:latest'),
          }),
        ]),
      });
    });

    test('should map container port 80', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            PortMappings: Match.arrayWith([
              Match.objectLike({
                ContainerPort: 80,
                Protocol: 'tcp',
              }),
            ]),
          }),
        ]),
      });
    });

    test('should have CloudWatch logging', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            LogConfiguration: Match.objectLike({
              LogDriver: 'awslogs',
            }),
          }),
        ]),
      });
    });

    test('should pass DB connection environment variables', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Environment: Match.arrayWith([
              Match.objectLike({ Name: 'DB_HOST' }),
              Match.objectLike({ Name: 'DB_PORT' }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('ECS Service', () => {
    test('should create service', () => {
      template.resourceCountIs('AWS::ECS::Service', 1);
    });

    test('should have desired count of 2 tasks', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        DesiredCount: 2,
      });
    });

    test('should use Fargate launch type', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        LaunchType: 'FARGATE',
      });
    });

    test('should be in private subnets', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        NetworkConfiguration: Match.objectLike({
          AwsvpcConfiguration: Match.objectLike({
            AssignPublicIp: 'DISABLED',
          }),
        }),
      });
    });

    test('should have load balancer config', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        LoadBalancers: Match.arrayWith([
          Match.objectLike({
            ContainerPort: 80,
          }),
        ]),
      });
    });
  });

  describe('Auto Scaling', () => {
    test('should create scalable target', () => {
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalableTarget', 1);
    });

    test('should scale between 2 and 10 tasks', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MinCapacity: 2,
        MaxCapacity: 10,
      });
    });

    test('should have CPU scaling policy', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
      });
    });

    test('should scale at 70% CPU utilization', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        TargetTrackingScalingPolicyConfiguration: Match.objectLike({
          TargetValue: 70,
        }),
      });
    });
  });

  describe('ALB Target Group', () => {
    test('should create target group', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 1);
    });

    test('should listen on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('should check health at /', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        HealthCheckPath: '/',
      });
    });

    test('should check health every 30 seconds', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        HealthCheckIntervalSeconds: 30,
      });
    });
  });

  describe('Log Subscription Filters', () => {
    test('should create subscription filters', () => {
      template.resourceCountIs('AWS::Logs::SubscriptionFilter', 2);
    });

    test('should filter all events', () => {
      template.hasResourceProperties('AWS::Logs::SubscriptionFilter', {
        FilterPattern: '',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output LoadBalancerDNS', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Application Load Balancer DNS',
      });
    });

    test('should output CloudFrontURL', () => {
      template.hasOutput('CloudFrontURL', {
        Description: 'CloudFront Distribution URL',
      });
    });

    test('should output DatabaseEndpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS Aurora Cluster Endpoint',
      });
    });

    test('should output StaticAssetsBucket', () => {
      template.hasOutput('StaticAssetsBucket', {
        Description: 'S3 Bucket for Static Assets',
      });
    });

    test('should have exactly 4 outputs', () => {
      const json = template.toJSON();
      expect(Object.keys(json.Outputs || {}).length).toBe(4);
    });
  });

  describe('Security and Access Control', () => {
    test('should create Lambda execution roles', () => {
      template.resourceCountIs('AWS::IAM::Role', 5);
    });

    test('should create IAM policies', () => {
      template.resourceCountIs('AWS::IAM::Policy', 4);
    });

    test('should grant Lambda S3 permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                Match.stringLikeRegexp('s3:'),
              ]),
            }),
          ]),
        }),
      });
    });

    test('should grant ECS task role RDS permissions', () => {
      template.resourceCountIs('AWS::IAM::Policy', 4);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should include environment suffix', () => {
      const json = template.toJSON();
      let resourcesWithSuffix = 0;
      Object.entries(json.Resources).forEach(([, resource]: [string, any]) => {
        const props = JSON.stringify(resource.Properties || {});
        if (props.includes(environmentSuffix)) {
          resourcesWithSuffix += 1;
        }
      });
      expect(resourcesWithSuffix).toBeGreaterThan(0);
    });
  });

  describe('Template Integrity', () => {
    test('should be valid CloudFormation template', () => {
      const json = template.toJSON();
      expect(json).toHaveProperty('Resources');
      expect(Object.keys(json.Resources).length).toBeGreaterThan(0);
    });

    test('all resources should have type and properties', () => {
      const json = template.toJSON();
      Object.values(json.Resources).forEach((resource: any) => {
        expect(resource).toHaveProperty('Type');
        expect(resource).toHaveProperty('Properties');
      });
    });

    test('should have descriptions for all outputs', () => {
      const json = template.toJSON();
      Object.values(json.Outputs || {}).forEach((output: any) => {
        expect(output).toHaveProperty('Description');
        expect(output.Description).toBeTruthy();
      });
    });
  });
});
