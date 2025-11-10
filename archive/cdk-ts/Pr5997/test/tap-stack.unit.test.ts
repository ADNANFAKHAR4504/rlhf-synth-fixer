import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Resources', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('customer-portal-vpc-test'),
          }),
        ]),
      });
    });

    test('should create public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
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

    test('should create private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Private',
          }),
        ]),
      });
    });

    test('should create NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('RDS Database', () => {
    test('should create RDS PostgreSQL instance with Multi-AZ', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        MultiAZ: true,
        StorageEncrypted: true,
        AllocatedStorage: '20',
        DBInstanceClass: 'db.t3.micro',
        DeletionProtection: false,
      });
    });

    test('should create database secret in Secrets Manager', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: Match.objectLike({
          GenerateStringKey: 'password',
          PasswordLength: 32,
          ExcludePunctuation: true,
        }),
      });
    });

    test('should create database security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS PostgreSQL',
        SecurityGroupEgress: [],
      });
    });
  });

  describe('ECS Resources', () => {
    test('should create ECS cluster with container insights', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterSettings: [
          {
            Name: 'containerInsights',
            Value: 'enabled',
          },
        ],
      });
    });

    test('should create Fargate task definition', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        RequiresCompatibilities: ['FARGATE'],
        NetworkMode: 'awsvpc',
        Cpu: '256',
        Memory: '512',
      });
    });

    test('should create ECS service with correct configuration', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        DesiredCount: 2,
        LaunchType: 'FARGATE',
      });
    });

    test('should create auto-scaling target', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MinCapacity: 2,
        MaxCapacity: 10,
      });
    });

    test('should create CPU-based auto-scaling policy', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: Match.objectLike({
          TargetValue: 70,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
        }),
      });
    });

    test('should create task execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            }),
          ]),
        }),
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('AmazonECSTaskExecutionRolePolicy'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('should create CloudWatch log group for ECS', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/ecs/customer-portal-test',
        RetentionInDays: 7,
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('should create target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 3000,
        Protocol: 'HTTP',
        TargetType: 'ip',
        HealthCheckPath: '/health',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
      });
    });

    test('should create HTTP listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('should create listener rule for /api/* path', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
        Priority: 1,
        Conditions: [
          {
            Field: 'path-pattern',
            PathPatternConfig: {
              Values: ['/api/*'],
            },
          },
        ],
      });
    });

    test('should create ALB security group allowing HTTP', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ALB',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
          }),
        ]),
      });
    });
  });

  describe('S3 and CloudFront', () => {
    test('should create S3 bucket for frontend', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should create CloudFront distribution', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          DefaultRootObject: 'index.html',
          Enabled: true,
        }),
      });
    });

    test('should create CloudFront Origin Access Control', () => {
      template.hasResourceProperties('AWS::CloudFront::OriginAccessControl', {
        OriginAccessControlConfig: {
          OriginAccessControlOriginType: 's3',
          SigningBehavior: 'always',
          SigningProtocol: 'sigv4',
        },
      });
    });

    test('should configure CloudFront behaviors', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          CacheBehaviors: Match.arrayWith([
            Match.objectLike({
              PathPattern: '/api/*',
              ViewerProtocolPolicy: 'redirect-to-https',
            }),
          ]),
        }),
      });
    });
  });

  describe('Configuration Management', () => {
    test('should create SSM parameter for API config', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Type: 'String',
        Description: 'API configuration parameters',
      });
    });

    test('should grant task role access to secrets', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['secretsmanager:GetSecretValue']),
              Effect: 'Allow',
            }),
          ]),
        }),
      });
    });

    test('should grant task role access to SSM parameters', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'ssm:DescribeParameters',
                'ssm:GetParameters',
                'ssm:GetParameter',
                'ssm:GetParameterHistory',
              ]),
              Effect: 'Allow',
            }),
          ]),
        }),
      });
    });
  });

  describe('Custom Resource for Parameter Updates', () => {
    test('should create Lambda function for ECS service updates', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 60,
      });
    });

    test('should create Custom Resource provider', () => {
      template.hasResourceProperties('AWS::CloudFormation::CustomResource', {
        ServiceToken: Match.anyValue(),
      });
    });

    test('should grant Lambda permission to update ECS service', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'ecs:UpdateService',
              Effect: 'Allow',
            }),
          ]),
        }),
      });
    });
  });

  describe('Security Groups', () => {
    test('should allow ALB to connect to ECS tasks', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3000,
        ToPort: 3000,
        Description: 'Allow ALB to connect to ECS tasks',
      });
    });

    test('should allow ECS tasks to connect to RDS', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
        Description: 'Allow ECS tasks to connect to RDS',
      });
    });
  });

  describe('Tags', () => {
    test('should apply Environment tag to stack', () => {
      const resources = template.toJSON().Resources;
      const taggedResources = Object.values(resources).filter((resource: any) => {
        return Array.isArray(resource.Properties?.Tags) && resource.Properties.Tags.some((tag: any) =>
          tag.Key === 'Environment' && tag.Value === 'test'
        );
      });
      expect(taggedResources.length).toBeGreaterThan(0);
    });

    test('should apply Project tag to stack', () => {
      const resources = template.toJSON().Resources;
      const taggedResources = Object.values(resources).filter((resource: any) => {
        return Array.isArray(resource.Properties?.Tags) && resource.Properties.Tags.some((tag: any) =>
          tag.Key === 'Project' && tag.Value === 'CustomerPortal'
        );
      });
      expect(taggedResources.length).toBeGreaterThan(0);
    });
  });

  describe('Outputs', () => {
    test('should create VPC ID output', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: 'test-vpc-id',
        },
      });
    });

    test('should create Database Endpoint output', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS database endpoint',
        Export: {
          Name: 'test-db-endpoint',
        },
      });
    });

    test('should create ALB DNS Name output', () => {
      template.hasOutput('AlbDnsName', {
        Description: 'ALB DNS name',
        Export: {
          Name: 'test-alb-dns',
        },
      });
    });

    test('should create CloudFront URL output', () => {
      template.hasOutput('CloudFrontUrl', {
        Description: 'CloudFront distribution URL',
        Export: {
          Name: 'test-cloudfront-url',
        },
      });
    });

    test('should create Frontend Bucket Name output', () => {
      template.hasOutput('FrontendBucketName', {
        Description: 'Frontend S3 bucket name',
        Export: {
          Name: 'test-frontend-bucket',
        },
      });
    });

    test('should create ECS Cluster Name output', () => {
      template.hasOutput('EcsClusterName', {
        Description: 'ECS cluster name',
        Export: {
          Name: 'test-ecs-cluster',
        },
      });
    });

    test('should create ECS Service Name output', () => {
      template.hasOutput('EcsServiceName', {
        Description: 'ECS service name',
        Export: {
          Name: 'test-ecs-service',
        },
      });
    });
  });

  describe('Resource Naming with environmentSuffix', () => {
    test('should include environmentSuffix in VPC name', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*-test'),
          }),
        ]),
      });
    });

    test('should include environmentSuffix in ECS cluster name', () => {
      const resources = template.toJSON().Resources;
      const cluster = Object.values(resources).find((r: any) =>
        r.Type === 'AWS::ECS::Cluster' &&
        r.Properties?.ClusterName?.includes('test')
      );
      expect(cluster).toBeDefined();
    });

    test('should include environmentSuffix in RDS instance identifier', () => {
      const resources = template.toJSON().Resources;
      const db = Object.values(resources).find((r: any) =>
        r.Type === 'AWS::RDS::DBInstance' &&
        r.Properties?.DBInstanceIdentifier?.includes('test')
      );
      expect(db).toBeDefined();
    });
  });

  describe('Deployment Region', () => {
    test('should deploy to us-east-1 region', () => {
      expect(stack.region).toBe('us-east-1');
    });
  });

  describe('Environment Suffix Handling', () => {
    test('should use default environmentSuffix when not provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackDefault', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify default suffix 'dev' is used
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*-dev'),
          }),
        ]),
      });
    });

    test('should use environmentSuffix from context when provided', () => {
      const testApp = new cdk.App({ context: { environmentSuffix: 'prod' } });
      const testStack = new TapStack(testApp, 'TestStackProd', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify context suffix 'prod' is used
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*-prod'),
          }),
        ]),
      });
    });
  });
});
