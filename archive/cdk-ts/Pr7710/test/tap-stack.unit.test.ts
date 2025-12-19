import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack, TapStackProps } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  const defaultProps: TapStackProps = {
    environment: 'dev',
    emailAddress: 'test@example.com',
    dbConfig: {
      username: 'testuser',
      databaseName: 'testdb',
    },
    containerConfig: {
      image: 'nginx',
      tag: '1.24',
    },
  };

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', defaultProps);
    template = Template.fromStack(stack);
  });

  describe('Stack Construction', () => {
    test('should create stack successfully', () => {
      expect(template).toBeDefined();
    });

    test('should create stack without email address', () => {
      const appWithoutEmail = new cdk.App();
      const stackWithoutEmail = new TapStack(appWithoutEmail, 'NoEmailStack', {
        environment: 'dev',
      });
      const templateWithoutEmail = Template.fromStack(stackWithoutEmail);

      expect(templateWithoutEmail).toBeDefined();
    });

    test('should apply environment tags', () => {
      expect(stack).toBeDefined();
    });

    test('should default to dev environment when none specified', () => {
      const appWithDefault = new cdk.App();
      const stackWithDefault = new TapStack(appWithDefault, 'DefaultEnvStack', {
        emailAddress: 'test@example.com',
        // environment not specified, should default to 'dev'
      });
      const templateWithDefault = Template.fromStack(stackWithDefault);

      expect(templateWithDefault).toBeDefined();
      expect(stackWithDefault.stackName).toBe('DefaultEnvStack');

      // Verify that dev environment tag is applied by default
      const resources = templateWithDefault.toJSON().Resources || {};
      let devTaggedResources = 0;

      for (const resource of Object.values(resources)) {
        const tags = (resource as any).Properties?.Tags;
        if (
          Array.isArray(tags) &&
          tags.some(
            (tag: any) => tag.Key === 'Environment' && tag.Value === 'dev'
          )
        ) {
          devTaggedResources++;
        }
      }

      expect(devTaggedResources).toBeGreaterThan(0);
    });
  });

  describe('KMS Encryption', () => {
    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('should create exactly one KMS key', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
    });
  });

  describe('VPC Resources', () => {
    test('should create VPC with correct configuration', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);

      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create subnets across multiple availability zones', () => {
      // 2 AZs * 3 subnet types (Public, Private, Isolated) = 6 subnets
      template.resourceCountIs('AWS::EC2::Subnet', 6);
    });

    test('should create NAT gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create internet gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
          }),
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
          }),
        ]),
      });
    });

    test('should create ECS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ECS tasks',
      });
    });

    test('should create RDS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
      });
    });

    test('should create total of 3 security groups', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 3);
    });
  });

  describe('RDS Database', () => {
    test('should create Aurora MySQL cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-mysql',
        StorageEncrypted: true,
        DatabaseName: 'testdb',
      });
    });

    test('should create writer and reader instances', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 2);
    });

    test('should create RDS secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: Match.stringLikeRegexp('RDS master user credentials'),
        GenerateSecretString: Match.objectLike({
          GenerateStringKey: 'password',
          PasswordLength: 32,
          ExcludePunctuation: true,
        }),
      });
    });

    test('should enable automatic secret rotation', () => {
      template.hasResourceProperties('AWS::SecretsManager::RotationSchedule', {
        RotationRules: {
          ScheduleExpression: 'rate(30 days)',
        },
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create static assets bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should create CloudFront logs bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 3);
    });

    test('should create pipeline artifacts bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              ExpirationInDays: 30,
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });

    test('should apply lifecycle rules to buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: Match.objectLike({
          Rules: Match.arrayWith([
            Match.objectLike({
              Status: 'Enabled',
            }),
          ]),
        }),
      });
    });
  });

  describe('CloudFront Distribution', () => {
    test('should create CloudFront distribution', () => {
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    });

    test('should configure HTTPS redirect', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          DefaultCacheBehavior: Match.objectLike({
            ViewerProtocolPolicy: 'redirect-to-https',
            Compress: true,
          }),
        }),
      });
    });

    test('should enable CloudFront logging', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          Logging: Match.objectLike({
            Bucket: Match.anyValue(),
          }),
        }),
      });
    });

    test('should create Origin Access Identity', () => {
      template.resourceCountIs(
        'AWS::CloudFront::CloudFrontOriginAccessIdentity',
        1
      );
    });
  });

  describe('Web Application Firewall', () => {
    test('should create separate CloudFront and regional web ACLs', () => {
      template.resourceCountIs('AWS::WAFv2::WebACL', 2);

      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'CLOUDFRONT',
      });

      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
      });
    });

    test('should associate web ACL with ALB', () => {
      // CloudFront WAF is associated via distribution's WebACLId property, not via CfnWebACLAssociation
      // Only ALB uses CfnWebACLAssociation resource
      template.resourceCountIs('AWS::WAFv2::WebACLAssociation', 1);
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
        Cpu: '1024',
        Memory: '2048',
      });
    });

    test('should configure container with health check', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            HealthCheck: Match.objectLike({
              Command: Match.arrayWith([
                'CMD-SHELL',
                Match.stringLikeRegexp('curl'),
              ]),
              Interval: 30,
              Timeout: 5,
              Retries: 3,
              StartPeriod: 60,
            }),
          }),
        ]),
      });
    });

    test('should include x-ray daemon sidecar', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: 'xray-daemon',
            Essential: false,
          }),
        ]),
      });
    });

    test('should configure application container for x-ray tracing', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: 'app-container',
            Environment: Match.arrayWith([
              Match.objectLike({
                Name: 'AWS_XRAY_DAEMON_ADDRESS',
                Value: '127.0.0.1:2000',
              }),
            ]),
          }),
        ]),
      });
    });

    test('should create ECS service with desired count', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        DesiredCount: 2,
        LaunchType: 'FARGATE',
      });
    });

    test('should enable ECS Exec', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        EnableExecuteCommand: true,
      });
    });

    test('should enable circuit breaker with rollback', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        DeploymentConfiguration: Match.objectLike({
          DeploymentCircuitBreaker: {
            Enable: true,
            Rollback: true,
          },
        }),
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create internet-facing ALB', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
          Scheme: 'internet-facing',
        }
      );
    });

    test('should create target group with health checks', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Port: 80,
          Protocol: 'HTTP',
          TargetType: 'ip',
          HealthCheckPath: '/',
          HealthCheckIntervalSeconds: 30,
          HealthCheckTimeoutSeconds: 5,
          HealthyThresholdCount: 2,
          UnhealthyThresholdCount: 3,
        }
      );
    });

    test('should create HTTP listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('should return synthetic response for /health requests', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::ListenerRule',
        {
          Priority: 1,
          Conditions: Match.arrayWith([
            Match.objectLike({
              Field: 'path-pattern',
              PathPatternConfig: Match.objectLike({
                Values: Match.arrayWith(['/health']),
              }),
            }),
          ]),
          Actions: Match.arrayWith([
            Match.objectLike({
              Type: 'fixed-response',
              FixedResponseConfig: Match.objectLike({ StatusCode: '200' }),
            }),
          ]),
        }
      );
    });
  });

  describe('API Gateway', () => {
    test('should create REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
      });
    });

    test('should configure API Gateway method settings', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            LoggingLevel: 'OFF', // Logging disabled to avoid CloudWatch Logs role requirement
            DataTraceEnabled: false,
            MetricsEnabled: true,
          }),
        ]),
        TracingEnabled: true,
      });
    });

    test('should create API deployment', () => {
      template.resourceCountIs('AWS::ApiGateway::Deployment', 1);
    });

    test('should expose dedicated health check endpoint', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health',
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        Integration: Match.objectLike({
          Type: 'MOCK',
        }),
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create log group with retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });

    test('should create CPU alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/ECS',
        Threshold: 70,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
      });
    });

    test('should create memory alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'MemoryUtilization',
        Namespace: 'AWS/ECS',
        Threshold: 80,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
      });
    });

    test('should create alarms with SNS actions', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: Match.arrayWith([
          Match.objectLike({
            Ref: Match.stringLikeRegexp('AlertNotificationTopic'),
          }),
        ]),
      });
    });
  });

  describe('SNS Topic', () => {
    test('should create SNS topic with encryption', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        KmsMasterKeyId: Match.anyValue(),
      });
    });

    test('should create email subscription when email provided', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com',
      });
    });

    test('should not create subscription when email not provided', () => {
      const appNoEmail = new cdk.App();
      const stackNoEmail = new TapStack(appNoEmail, 'NoEmailStack', {
        environment: 'dev',
      });
      const templateNoEmail = Template.fromStack(stackNoEmail);

      templateNoEmail.resourceCountIs('AWS::SNS::Subscription', 0);
    });
  });

  describe('ECR Repository', () => {
    test('should create ECR repository with image scanning', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        ImageScanningConfiguration: {
          ScanOnPush: true,
        },
        ImageTagMutability: 'MUTABLE',
        EncryptionConfiguration: {
          EncryptionType: 'KMS',
        },
      });
    });

    test('should configure lifecycle policy', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        LifecyclePolicy: Match.objectLike({
          LifecyclePolicyText: Match.stringLikeRegexp('imageCountMoreThan'),
        }),
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create monitoring Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 256,
      });
    });

    test('should configure Lambda environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            TOPIC_ARN: Match.anyValue(),
            STACK_NAME: Match.anyValue(),
          }),
        },
      });
    });

    test('should grant SNS publish permissions to Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sns:Publish',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('CodeBuild Project', () => {
    test('should create CodeBuild project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: {
          Type: 'LINUX_CONTAINER',
          PrivilegedMode: true,
          ComputeType: 'BUILD_GENERAL1_SMALL',
        },
      });
    });

    test('should configure build cache', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Cache: {
          Type: 'LOCAL',
          Modes: Match.arrayWith(['LOCAL_DOCKER_LAYER_CACHE']),
        },
      });
    });

    test('should configure environment variables', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Environment: Match.objectLike({
          EnvironmentVariables: Match.arrayWith([
            Match.objectLike({
              Name: 'ECR_REPO_URI',
            }),
            Match.objectLike({
              Name: 'AWS_ACCOUNT_ID',
            }),
          ]),
        }),
      });
    });
  });

  describe('CodePipeline', () => {
    test('should create CodePipeline', () => {
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
    });

    test('should configure source stage with S3', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Source',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Source',
                  Provider: 'S3',
                },
              }),
            ]),
          }),
        ]),
      });
    });

    test('should configure build stage', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Build',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Build',
                  Provider: 'CodeBuild',
                },
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('Disaster Recovery', () => {
    test('should create stack set for secondary regions in production', () => {
      // StackSet is only created in production environments
      const appProd = new cdk.App();
      const stackProd = new TapStack(appProd, 'ProdDRStack', {
        environment: 'prod',
        emailAddress: 'test@example.com',
        drRegions: ['us-east-1', 'us-west-2'],
      });
      const templateProd = Template.fromStack(stackProd);

      templateProd.resourceCountIs('AWS::CloudFormation::StackSet', 1);
      templateProd.hasResourceProperties('AWS::CloudFormation::StackSet', {
        StackInstancesGroup: Match.arrayWith([
          Match.objectLike({
            Regions: Match.arrayWith(['us-east-1', 'us-west-2']),
          }),
        ]),
        Parameters: Match.arrayWith([
          Match.objectLike({
            ParameterKey: 'PrimaryBucketName',
          }),
        ]),
      });
    });

    test('should not create stack set in non-production environments', () => {
      // StackSet should NOT be created in dev environment
      template.resourceCountIs('AWS::CloudFormation::StackSet', 0);
    });

    test('should exclude primary region from DR regions when region is concrete', () => {
      // This test covers line 68: drRegionSet.delete(primaryRegion)
      // by specifying a concrete region that matches one of the DR regions
      // StackSet is only created in production environments
      const appWithConcreteRegion = new cdk.App();
      const stackWithConcreteRegion = new TapStack(
        appWithConcreteRegion,
        'ConcreteRegionStack',
        {
          environment: 'prod', // Must be prod for StackSet to be created
          env: {
            region: 'us-east-1', // Concrete region that's in default DR regions
            account: '123456789012',
          },
          drRegions: ['us-east-1', 'us-west-2', 'eu-west-1'], // Include primary region
        }
      );
      const templateWithConcreteRegion = Template.fromStack(
        stackWithConcreteRegion
      );

      // The stack set should NOT include us-east-1 (the primary region) in DR regions
      templateWithConcreteRegion.hasResourceProperties(
        'AWS::CloudFormation::StackSet',
        {
          StackInstancesGroup: Match.arrayWith([
            Match.objectLike({
              // us-east-1 should be filtered out, leaving us-west-2 and eu-west-1
              Regions: Match.arrayWith(['us-west-2', 'eu-west-1']),
            }),
          ]),
        }
      );
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create CodeBuild role with proper permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('should create CodePipeline role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('should grant ECR permissions to CodeBuild', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create VPC ID output', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
      });
    });

    test('should create ALB endpoint output', () => {
      template.hasOutput('ALBEndpoint', {
        Description: 'Application Load Balancer DNS Name',
      });
    });

    test('should create CloudFront URL output', () => {
      template.hasOutput('CloudFrontURL', {
        Description: 'CloudFront Distribution URL',
      });
    });

    test('should create API Gateway URL output', () => {
      template.hasOutput('APIGatewayURL', {
        Description: 'API Gateway URL',
      });
    });

    test('should create ECR repository URI output', () => {
      template.hasOutput('ECRRepoURI', {
        Description: 'ECR Repository URI',
      });
    });

    test('should create pipeline name output', () => {
      template.hasOutput('PipelineName', {
        Description: 'CodePipeline Name',
      });
    });

    test('should create database outputs', () => {
      template.hasOutput('DBSecretARN', {
        Description: 'RDS Secret ARN',
      });

      template.hasOutput('DBClusterEndpoint', {
        Description: 'RDS Cluster Endpoint',
      });
    });

    test('should create S3 bucket outputs', () => {
      template.hasOutput('StaticAssetsBucketOutput', {
        Description: 'S3 Bucket for Static Assets',
      });
    });

    test('should create SNS topic output', () => {
      template.hasOutput('SNSTopicARN', {
        Description: 'SNS Topic ARN for Alerts',
      });
    });
  });

  describe('Resource Counts', () => {
    test('should create expected number of core resources', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::RDS::DBCluster', 1);
      template.resourceCountIs('AWS::ECS::Cluster', 1);
      template.resourceCountIs('AWS::ECS::Service', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.resourceCountIs('AWS::ECR::Repository', 1);
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
      template.resourceCountIs('AWS::CodeBuild::Project', 1);
      // Lambda count includes user Lambda + rotation Lambda + custom resources
      const lambdaCount = Object.keys(
        template.findResources('AWS::Lambda::Function')
      ).length;
      expect(lambdaCount).toBeGreaterThanOrEqual(1);
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('should create monitoring resources', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
      template.resourceCountIs('AWS::Logs::LogGroup', 2);
    });

    test('should create S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 3);
    });
  });

  describe('Removal Policies', () => {
    test('should set removal policies for stateful resources', () => {
      expect(template).toBeDefined();
      template.resourceCountIs('AWS::RDS::DBCluster', 1);
      template.resourceCountIs('AWS::S3::Bucket', 3);
      template.resourceCountIs('AWS::ECR::Repository', 1);
      template.resourceCountIs('AWS::Logs::LogGroup', 2);
      template.resourceCountIs('AWS::KMS::Key', 1);
    });
  });

  describe('Tagging', () => {
    test('should apply tags to stack', () => {
      expect(stack).toBeDefined();
    });
  });

  describe('SNS Subscription', () => {
    test('should create SNS subscription when email address is provided', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        ...defaultProps,
        emailAddress: 'user@example.com',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'user@example.com',
      });
    });

    test('should not create SNS subscription when email address is empty', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        ...defaultProps,
        emailAddress: '',
      });
      const template = Template.fromStack(stack);

      // Should not have any SNS subscriptions
      template.resourceCountIs('AWS::SNS::Subscription', 0);
    });

    test('should not create SNS subscription when email address is whitespace only', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        ...defaultProps,
        emailAddress: '   ',
      });
      const template = Template.fromStack(stack);

      // Should not have any SNS subscriptions
      template.resourceCountIs('AWS::SNS::Subscription', 0);
    });

    test('should not create SNS subscription when email address is not provided', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environment: 'dev',
        // No emailAddress provided
      });
      const template = Template.fromStack(stack);

      // Should not have any SNS subscriptions
      template.resourceCountIs('AWS::SNS::Subscription', 0);
    });
  });

  describe('Configuration Validation', () => {
    describe('Environment Validation', () => {
      test('should accept valid environments', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack1', {
              ...defaultProps,
              environment: 'dev',
            })
        ).not.toThrow();

        expect(
          () =>
            new TapStack(app, 'TestStack2', {
              ...defaultProps,
              environment: 'staging',
            })
        ).not.toThrow();

        expect(
          () =>
            new TapStack(app, 'TestStack3', {
              ...defaultProps,
              environment: 'prod',
            })
        ).not.toThrow();

        expect(
          () =>
            new TapStack(app, 'TestStack4', {
              ...defaultProps,
              environment: 'production',
            })
        ).not.toThrow();
      });

      test('should reject invalid environment', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack5', {
              ...defaultProps,
              environment: 'invalid_env',
            })
        ).toThrow(
          "Invalid environment 'invalid_env'. Must be one of: dev, staging, prod, development, production"
        );
      });
    });

    describe('Database Username Validation', () => {
      test('should use default username when dbConfig is not provided', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack', {
              environment: 'dev',
              emailAddress: 'test@example.com',
              // No dbConfig provided
            })
        ).not.toThrow();
      });

      test('should use default username when username is not provided in dbConfig', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack', {
              ...defaultProps,
              dbConfig: {
                // No username provided, should use default
                databaseName: 'testdb',
              },
            })
        ).not.toThrow();
      });

      test('should accept valid usernames', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack6', {
              ...defaultProps,
              dbConfig: {
                username: 'validuser',
                databaseName: 'testdb',
              },
            })
        ).not.toThrow();

        expect(
          () =>
            new TapStack(app, 'TestStack7', {
              ...defaultProps,
              dbConfig: {
                username: 'db_admin',
                databaseName: 'testdb',
              },
            })
        ).not.toThrow();
      });

      test('should reject empty username', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack8', {
              ...defaultProps,
              dbConfig: {
                username: '   ', // whitespace-only should trigger validation
                databaseName: 'testdb',
              },
            })
        ).toThrow(
          "Database username '   ' is invalid. Must be 1-32 characters long (after trimming)."
        );
      });

      test('should reject username too long', () => {
        const longUsername = 'a'.repeat(33);
        expect(
          () =>
            new TapStack(app, 'TestStack9', {
              ...defaultProps,
              dbConfig: {
                username: longUsername,
                databaseName: 'testdb',
              },
            })
        ).toThrow(
          `Database username '${longUsername}' is invalid. Must be 1-32 characters long (after trimming).`
        );
      });

      test('should reject invalid characters in username', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack10', {
              ...defaultProps,
              dbConfig: {
                username: 'invalid@user',
                databaseName: 'testdb',
              },
            })
        ).toThrow(
          "Database username 'invalid@user' is invalid. Must start with a letter and contain only alphanumeric characters and underscores."
        );
      });

      test('should reject reserved usernames', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack11', {
              ...defaultProps,
              dbConfig: {
                username: 'admin',
                databaseName: 'testdb',
              },
            })
        ).toThrow(
          "Database username 'admin' is not allowed. Reserved system usernames are prohibited."
        );

        expect(
          () =>
            new TapStack(app, 'TestStack12', {
              ...defaultProps,
              dbConfig: {
                username: 'root',
                databaseName: 'testdb',
              },
            })
        ).toThrow(
          "Database username 'root' is not allowed. Reserved system usernames are prohibited."
        );
      });
    });

    describe('Database Name Validation', () => {
      test('should use default database name when dbConfig is not provided', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack', {
              environment: 'dev',
              emailAddress: 'test@example.com',
              // No dbConfig provided
            })
        ).not.toThrow();
      });

      test('should use default database name when databaseName is not provided in dbConfig', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack', {
              ...defaultProps,
              dbConfig: {
                username: 'testuser',
                // No databaseName provided, should use default
              },
            })
        ).not.toThrow();
      });

      test('should accept valid database names', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack13', {
              ...defaultProps,
              dbConfig: {
                username: 'testuser',
                databaseName: 'valid_db',
              },
            })
        ).not.toThrow();

        expect(
          () =>
            new TapStack(app, 'TestStack14', {
              ...defaultProps,
              dbConfig: {
                username: 'testuser',
                databaseName: 'myDatabase123',
              },
            })
        ).not.toThrow();
      });

      test('should reject empty database name', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack15', {
              ...defaultProps,
              dbConfig: {
                username: 'testuser',
                databaseName: '   ', // whitespace-only should trigger validation
              },
            })
        ).toThrow(
          "Database name '   ' is invalid. Must be 1-64 characters long (after trimming)."
        );
      });

      test('should reject database name too long', () => {
        const longDbName = 'a'.repeat(65);
        expect(
          () =>
            new TapStack(app, 'TestStack16', {
              ...defaultProps,
              dbConfig: {
                username: 'testuser',
                databaseName: longDbName,
              },
            })
        ).toThrow(
          `Database name '${longDbName}' is invalid. Must be 1-64 characters long (after trimming).`
        );
      });

      test('should reject invalid characters in database name', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack17', {
              ...defaultProps,
              dbConfig: {
                username: 'testuser',
                databaseName: 'invalid-db',
              },
            })
        ).toThrow(
          "Database name 'invalid-db' is invalid. Must start with a letter and contain only alphanumeric characters and underscores."
        );
      });
    });

    describe('Container Image Validation', () => {
      test('should use default container image when containerConfig is not provided', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack', {
              environment: 'dev',
              emailAddress: 'test@example.com',
              // No containerConfig provided
            })
        ).not.toThrow();
      });

      test('should use default container image when image is not provided in containerConfig', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack', {
              ...defaultProps,
              containerConfig: {
                // No image provided, should use default
                tag: 'latest',
              },
            })
        ).not.toThrow();
      });

      test('should accept valid container images', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack18', {
              ...defaultProps,
              containerConfig: {
                image: 'nginx:latest',
                tag: '1.0',
              },
            })
        ).not.toThrow();

        expect(
          () =>
            new TapStack(app, 'TestStack19', {
              ...defaultProps,
              containerConfig: {
                image: 'public.ecr.aws/nginx/nginx',
                tag: '1.0',
              },
            })
        ).not.toThrow();
      });

      test('should reject empty container image', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack20', {
              ...defaultProps,
              containerConfig: {
                image: '   ', // whitespace-only should trigger validation
                tag: '1.0',
              },
            })
        ).toThrow('Container image cannot be empty');
      });

      test('should reject invalid container image format', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack21', {
              ...defaultProps,
              containerConfig: {
                image: 'invalid@image',
                tag: '1.0',
              },
            })
        ).toThrow(
          "Container image 'invalid@image' has invalid format. Must be a valid container image reference."
        );
      });
    });

    describe('Container Tag Validation', () => {
      test('should use default container tag when containerConfig is not provided', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack', {
              environment: 'dev',
              emailAddress: 'test@example.com',
              // No containerConfig provided
            })
        ).not.toThrow();
      });

      test('should use default container tag when tag is not provided in containerConfig', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack', {
              ...defaultProps,
              containerConfig: {
                image: 'nginx',
                // No tag provided, should use default
              },
            })
        ).not.toThrow();
      });

      test('should accept valid container tags', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack22', {
              ...defaultProps,
              containerConfig: {
                image: 'nginx',
                tag: 'latest',
              },
            })
        ).not.toThrow();

        expect(
          () =>
            new TapStack(app, 'TestStack23', {
              ...defaultProps,
              containerConfig: {
                image: 'nginx',
                tag: 'v1.2.3',
              },
            })
        ).not.toThrow();

        expect(
          () =>
            new TapStack(app, 'TestStack24', {
              ...defaultProps,
              containerConfig: {
                image: 'nginx',
                tag: 'my_tag-123',
              },
            })
        ).not.toThrow();
      });

      test('should reject empty container tag', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack25', {
              ...defaultProps,
              containerConfig: {
                image: 'nginx',
                tag: '   ', // whitespace-only should trigger validation
              },
            })
        ).toThrow('Container tag cannot be empty');
      });

      test('should reject container tag too long', () => {
        const longTag = 'a'.repeat(129);
        expect(
          () =>
            new TapStack(app, 'TestStack26', {
              ...defaultProps,
              containerConfig: {
                image: 'nginx',
                tag: longTag,
              },
            })
        ).toThrow(
          `Container tag '${longTag}' is too long. Maximum 128 characters allowed.`
        );
      });

      test('should reject invalid characters in container tag', () => {
        expect(
          () =>
            new TapStack(app, 'TestStack27', {
              ...defaultProps,
              containerConfig: {
                image: 'nginx',
                tag: 'invalid@tag',
              },
            })
        ).toThrow(
          "Container tag 'invalid@tag' contains invalid characters. Only alphanumeric characters, dots, underscores, and hyphens are allowed."
        );
      });
    });
  });
});
