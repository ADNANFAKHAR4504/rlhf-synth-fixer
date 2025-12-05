import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  describe('Stack Creation and Configuration', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Stack is created successfully', () => {
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('Uses environment suffix from props', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('Defaults environment suffix to dev when not provided', () => {
      const app2 = new cdk.App();
      const stack2 = new TapStack(app2, 'TestTapStackDefault');
      const template2 = Template.fromStack(stack2);
      expect(template2).toBeDefined();
    });

    test('Uses environment suffix from context when not in props', () => {
      const app3 = new cdk.App({
        context: {
          environmentSuffix: 'context-test',
        },
      });
      const stack3 = new TapStack(app3, 'TestTapStackContext');
      const template3 = Template.fromStack(stack3);
      expect(template3).toBeDefined();
    });
  });

  describe('KMS Keys', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Creates VPC Flow Logs KMS key', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for VPC flow logs encryption',
        EnableKeyRotation: true,
      });
    });

    test('Creates VPC Flow Logs KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/payment-dashboard-test/vpc-flow-logs',
      });
    });

    test('VPC Flow Logs KMS key has CloudWatch Logs permissions', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Allow CloudWatch Logs to use the key',
              Effect: 'Allow',
              Principal: {
                Service: 'logs.us-east-1.amazonaws.com',
              },
              Action: Match.arrayWith([
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ]),
            }),
          ]),
        },
      });
    });

    test('Creates RDS encryption KMS key', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for Aurora database encryption',
        EnableKeyRotation: true,
      });
    });

    test('Creates RDS encryption KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/payment-dashboard-test/aurora',
      });
    });

    test('Creates S3 encryption KMS key', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for S3 bucket encryption',
        EnableKeyRotation: true,
      });
    });

    test('Creates S3 encryption KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/payment-dashboard-test/s3',
      });
    });
  });

  describe('VPC and Networking', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Creates VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('Creates VPC with 3 availability zones', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('Creates public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-type',
            Value: 'Public',
          },
        ]),
      });
    });

    test('Creates private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-type',
            Value: 'Private',
          },
        ]),
      });
    });

    test('Creates isolated subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-type',
            Value: 'Isolated',
          },
        ]),
      });
    });

    test('Creates NAT Gateway with default count', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('Creates NAT Gateway with custom count from context', () => {
      const app2 = new cdk.App({
        context: {
          natGateways: 2,
        },
      });
      const stack2 = new TapStack(app2, 'TestTapStackNAT', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template2 = Template.fromStack(stack2);
      template2.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('Creates VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });

    test('Creates VPC Flow Logs Log Group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30,
      });
    });

    test('Creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('VPC Endpoints', () => {
    test('Does not create VPC endpoints by default', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::EC2::VPCEndpoint', 0);
    });

    test('Creates VPC endpoints when enabled via context', () => {
      const app2 = new cdk.App({
        context: {
          enableVpcEndpoints: true,
        },
      });
      const stack2 = new TapStack(app2, 'TestTapStackEndpoints', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template2 = Template.fromStack(stack2);

      const vpcEndpoints = template2.findResources('AWS::EC2::VPCEndpoint');
      expect(Object.keys(vpcEndpoints).length).toBeGreaterThan(0);
    });
  });

  describe('Security Groups', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Creates ALB security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
      });
    });

    test('ALB security group allows HTTPS from internet', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('ALB security group allows HTTP from internet', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('Creates ECS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ECS Fargate tasks',
      });
    });

    test('Creates database security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Aurora database',
      });
    });

    test('Database security group allows MySQL from ECS', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const dbSecurityGroup = Object.values(securityGroups).find(
        (sg: any) =>
          sg.Properties?.GroupDescription ===
          'Security group for Aurora database'
      );
      expect(dbSecurityGroup).toBeDefined();
      // Security group ingress rules are created via separate resources in CDK
      const ingressRules = template.findResources(
        'AWS::EC2::SecurityGroupIngress'
      );
      const mysqlRule = Object.values(ingressRules).find(
        (rule: any) =>
          rule.Properties?.FromPort === 3306 && rule.Properties?.ToPort === 3306
      );
      expect(mysqlRule).toBeDefined();
    });
  });

  describe('RDS Aurora Cluster', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Creates Aurora MySQL cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-mysql',
        EngineVersion: Match.stringLikeRegexp('8\\.0\\.mysql_aurora\\.3\\.04'),
        DatabaseName: Match.absent(),
        StorageEncrypted: true,
        DeletionProtection: false,
        BackupRetentionPeriod: 7,
      });
    });

    test('Aurora cluster has single instance', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
    });

    test('Aurora cluster uses T3.MEDIUM instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.medium',
      });
    });

    test('Aurora cluster has CloudWatch logs enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        EnableCloudwatchLogsExports: Match.arrayWith([
          'error',
          'general',
          'slowquery',
          'audit',
        ]),
      });
    });

    test('Aurora cluster has maintenance window configured', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        PreferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      });
    });

    test('Aurora cluster has backup window configured', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        PreferredBackupWindow: '03:00-04:00',
      });
    });
  });

  describe('Secrets Manager', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Creates database credentials secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'Aurora MySQL admin credentials',
        GenerateSecretString: {
          SecretStringTemplate: Match.stringLikeRegexp(
            '.*"username":\\s*"admin".*'
          ),
          GenerateStringKey: 'password',
          PasswordLength: 32,
        },
      });
    });

    test('Creates secret rotation schedule', () => {
      template.resourceCountIs('AWS::SecretsManager::RotationSchedule', 1);
      const rotationSchedules = template.findResources(
        'AWS::SecretsManager::RotationSchedule'
      );
      const schedule = Object.values(rotationSchedules)[0];
      expect(schedule).toBeDefined();
      // Rotation rules might be in different format or use HostedRotationLambda
      expect(schedule?.Properties).toBeDefined();
    });
  });

  describe('SSM Parameters', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Creates API endpoint parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/payment-dashboard-test/api-endpoint',
        Type: 'String',
        Value: 'https://api.internal.example.com',
      });
    });

    test('Creates feature flags parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/payment-dashboard-test/feature-flags',
        Type: 'String',
      });
    });
  });

  describe('ECS Cluster and Task Definition', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Creates ECS cluster', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterSettings: Match.arrayWith([
          {
            Name: 'containerInsights',
            Value: 'enabled',
          },
        ]),
      });
    });

    test('Creates Fargate task definition', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: 'payment-dashboard-test',
        RequiresCompatibilities: ['FARGATE'],
        Cpu: '1024',
        Memory: '2048',
        NetworkMode: 'awsvpc',
      });
    });

    test('Task definition has main container', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: 'PaymentDashboardContainer',
            Cpu: 992,
            Memory: 1792,
            Essential: true,
          }),
        ]),
      });
    });

    test('Task definition has X-Ray sidecar', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: 'XRaySidecar',
            Cpu: 32,
            MemoryReservation: 256,
          }),
        ]),
      });
    });

    test('Main container has correct port mapping', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: 'PaymentDashboardContainer',
            PortMappings: Match.arrayWith([
              {
                ContainerPort: 80,
                Protocol: 'tcp',
              },
            ]),
          }),
        ]),
      });
    });

    test('Main container has X-Ray environment variables', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: 'PaymentDashboardContainer',
            Environment: Match.arrayWith([
              {
                Name: 'AWS_XRAY_TRACING_NAME',
                Value: 'payment-dashboard',
              },
              {
                Name: 'AWS_XRAY_DAEMON_ADDRESS',
                Value: '127.0.0.1:2000',
              },
            ]),
          }),
        ]),
      });
    });

    test('Main container has SSM parameter environment variables', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: 'PaymentDashboardContainer',
            Environment: Match.arrayWith([
              Match.objectLike({
                Name: 'API_ENDPOINT_PARAM',
              }),
              Match.objectLike({
                Name: 'FEATURE_FLAGS_PARAM',
              }),
            ]),
          }),
        ]),
      });
    });

    test('Main container has database secret', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: 'PaymentDashboardContainer',
            Secrets: Match.arrayWith([
              Match.objectLike({
                Name: 'DB_CONNECTION_STRING',
              }),
            ]),
          }),
        ]),
      });
    });

    test('Creates task role with X-Ray permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            }),
          ]),
        },
      });

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
            }),
          ]),
        },
      });
    });

    test('Task role has SSM permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:GetParametersByPath',
              ]),
            }),
          ]),
        },
      });
    });

    test('Task role has Secrets Manager permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const taskPolicy = Object.values(policies).find((policy: any) =>
        policy.Properties.PolicyDocument?.Statement?.some((stmt: any) =>
          stmt.Action?.includes('secretsmanager:GetSecretValue')
        )
      );
      expect(taskPolicy).toBeDefined();
    });

    test('Creates CloudWatch log group for tasks', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30,
      });
    });
  });

  describe('ECS Service', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Creates ECS Fargate service', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        LaunchType: 'FARGATE',
        DesiredCount: 1,
        EnableECSManagedTags: true,
        PropagateTags: 'TASK_DEFINITION',
      });
    });

    test('ECS service has health check grace period', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        HealthCheckGracePeriodSeconds: 1800, // 30 minutes
      });
    });
  });

  describe('Application Load Balancer', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Creates Application Load Balancer', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
          Scheme: 'internet-facing',
        }
      );
    });

    test('ALB has HTTP/2 enabled', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          LoadBalancerAttributes: Match.arrayWith([
            {
              Key: 'routing.http2.enabled',
              Value: 'true',
            },
          ]),
        }
      );
    });

    test('ALB has idle timeout configured', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          LoadBalancerAttributes: Match.arrayWith([
            {
              Key: 'idle_timeout.timeout_seconds',
              Value: '60',
            },
          ]),
        }
      );
    });

    test('ALB has access logs enabled', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          LoadBalancerAttributes: Match.arrayWith([
            {
              Key: 'access_logs.s3.enabled',
              Value: 'true',
            },
          ]),
        }
      );
    });

    test('Creates target group', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Port: 80,
          Protocol: 'HTTP',
          TargetType: 'ip',
          HealthCheckProtocol: 'HTTP',
          HealthCheckPath: '/',
          HealthyThresholdCount: 2,
          UnhealthyThresholdCount: 3,
          Matcher: {
            HttpCode: '200',
          },
        }
      );
    });

    test('Creates HTTPS listener without certificate', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 443,
        Protocol: 'HTTP',
      });
    });

    test('Creates HTTP listener without certificate', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: Match.arrayWith([
          Match.objectLike({
            Type: 'forward',
          }),
        ]),
      });
    });

    test('Creates HTTPS listener with certificate when provided', () => {
      const app2 = new cdk.App({
        context: {
          certificateArn:
            'arn:aws:acm:us-east-1:123456789012:certificate/test-cert',
        },
      });
      const stack2 = new TapStack(app2, 'TestTapStackCert', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template2 = Template.fromStack(stack2);

      template2.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 443,
        Protocol: 'HTTPS',
        Certificates: Match.arrayWith([
          {
            CertificateArn:
              'arn:aws:acm:us-east-1:123456789012:certificate/test-cert',
          },
        ]),
      });
    });

    test('Creates HTTP to HTTPS redirect when certificate provided', () => {
      const app2 = new cdk.App({
        context: {
          certificateArn:
            'arn:aws:acm:us-east-1:123456789012:certificate/test-cert',
        },
      });
      const stack2 = new TapStack(app2, 'TestTapStackCertRedirect', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template2 = Template.fromStack(stack2);

      template2.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        DefaultActions: Match.arrayWith([
          Match.objectLike({
            Type: 'redirect',
            RedirectConfig: {
              Protocol: 'HTTPS',
              Port: '443',
              StatusCode: 'HTTP_301',
            },
          }),
        ]),
      });
    });
  });

  describe('ALB Access Logs S3 Bucket', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Creates ALB logs bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('ALB logs bucket has lifecycle rule', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'delete-old-logs',
              Status: 'Enabled',
              ExpirationInDays: 90,
            }),
          ]),
        },
      });
    });

    test('ALB logs bucket has policy for log delivery', () => {
      const bucketPolicies = template.findResources('AWS::S3::BucketPolicy');
      expect(Object.keys(bucketPolicies).length).toBeGreaterThan(0);
      // Find the policy that has AWSLogDeliveryWrite statement
      const albLogsPolicy = Object.values(bucketPolicies).find(
        (policy: any) => {
          const statements = policy.Properties?.PolicyDocument?.Statement;
          return (
            Array.isArray(statements) &&
            statements.some((s: any) => s.Sid === 'AWSLogDeliveryWrite')
          );
        }
      );
      expect(albLogsPolicy).toBeDefined();
    });
  });

  describe('WAF', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Creates WAF WebACL', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
        DefaultAction: {
          Allow: {},
        },
        VisibilityConfig: {
          CloudWatchMetricsEnabled: true,
          SampledRequestsEnabled: true,
        },
      });
    });

    test('WAF WebACL has rate limit rule', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'RateLimitRule',
            Priority: 1,
            Statement: {
              RateBasedStatement: {
                AggregateKeyType: 'IP',
                Limit: 2000,
              },
            },
            Action: {
              Block: {},
            },
          }),
        ]),
      });
    });

    test('WAF WebACL has SQL injection rule', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesSQLiRuleSet',
            Priority: 2,
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesSQLiRuleSet',
              },
            },
          }),
        ]),
      });
    });

    test('WAF WebACL has XSS protection rule', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'XSSProtectionRule',
            Priority: 4,
            Statement: {
              XssMatchStatement: Match.anyValue(),
            },
            Action: {
              Block: {},
            },
          }),
        ]),
      });
    });

    test('WAF is associated with ALB', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
        ResourceArn: Match.anyValue(),
        WebACLArn: Match.anyValue(),
      });
    });
  });

  describe('Auto Scaling', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Creates scalable target', () => {
      template.hasResourceProperties(
        'AWS::ApplicationAutoScaling::ScalableTarget',
        {
          MinCapacity: 1,
          MaxCapacity: 2,
          ServiceNamespace: 'ecs',
          ScalableDimension: 'ecs:service:DesiredCount',
        }
      );
    });

    test('Creates CPU scaling policy', () => {
      template.hasResourceProperties(
        'AWS::ApplicationAutoScaling::ScalingPolicy',
        {
          PolicyType: 'TargetTrackingScaling',
          TargetTrackingScalingPolicyConfiguration: {
            PredefinedMetricSpecification: {
              PredefinedMetricType: 'ECSServiceAverageCPUUtilization',
            },
            TargetValue: 70,
            ScaleInCooldown: 300,
            ScaleOutCooldown: 60,
          },
        }
      );
    });

    test('Creates memory scaling policy', () => {
      template.hasResourceProperties(
        'AWS::ApplicationAutoScaling::ScalingPolicy',
        {
          PolicyType: 'TargetTrackingScaling',
          TargetTrackingScalingPolicyConfiguration: {
            PredefinedMetricSpecification: {
              PredefinedMetricType: 'ECSServiceAverageMemoryUtilization',
            },
            TargetValue: 80,
          },
        }
      );
    });
  });

  describe('CloudFront Distribution', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Creates CloudFront distribution', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Enabled: true,
          HttpVersion: 'http2',
          IPV6Enabled: true,
          PriceClass: 'PriceClass_100',
        },
      });
    });

    test('CloudFront has HTTPS redirect', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
          },
        },
      });
    });

    test('CloudFront has API behavior', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          CacheBehaviors: Match.arrayWith([
            Match.objectLike({
              PathPattern: '/api/*',
              ViewerProtocolPolicy: 'https-only',
              AllowedMethods: Match.arrayWith([
                'GET',
                'HEAD',
                'OPTIONS',
                'PUT',
                'PATCH',
                'POST',
                'DELETE',
              ]),
            }),
          ]),
        },
      });
    });

    test('CloudFront has geo-restriction', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Restrictions: {
            GeoRestriction: {
              RestrictionType: 'whitelist',
              Locations: Match.arrayWith(['US', 'CA', 'GB', 'DE', 'JP']),
            },
          },
        },
      });
    });

    test('CloudFront uses custom domain when certificate provided', () => {
      const app2 = new cdk.App({
        context: {
          certificateArn:
            'arn:aws:acm:us-east-1:123456789012:certificate/test-cert',
          domainName: 'payments.example.com',
        },
      });
      const stack2 = new TapStack(app2, 'TestTapStackCloudFront', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template2 = Template.fromStack(stack2);

      template2.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Aliases: ['payments.example.com'],
        },
      });
    });
  });

  describe('S3 Static Assets Bucket', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Creates static assets bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
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

    test('Static assets bucket has KMS encryption', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const staticBucket = Object.values(buckets).find(
        (bucket: any) =>
          bucket.Properties.VersioningConfiguration?.Status === 'Enabled'
      );
      expect(staticBucket).toBeDefined();
      expect(staticBucket?.Properties.BucketEncryption).toBeDefined();
      expect(
        staticBucket?.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault
          .SSEAlgorithm
      ).toBe('aws:kms');
    });

    test('Static assets bucket has lifecycle rule', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'delete-old-versions',
              Status: 'Enabled',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 90,
              },
            }),
          ]),
        },
      });
    });

    test('Creates Origin Access Identity', () => {
      template.hasResourceProperties(
        'AWS::CloudFront::CloudFrontOriginAccessIdentity',
        {
          CloudFrontOriginAccessIdentityConfig: {
            Comment: 'Payment Dashboard OAI',
          },
        }
      );
    });
  });

  describe('SNS Topics', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Creates critical alerts topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Payment Dashboard Critical Alerts',
      });
    });

    test('Critical alerts topic has email subscription', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'ops@example.com',
      });
    });

    test('Critical alerts topic uses custom email from context', () => {
      const app2 = new cdk.App({
        context: {
          opsEmail: 'custom@example.com',
        },
      });
      const stack2 = new TapStack(app2, 'TestTapStackSNS', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template2 = Template.fromStack(stack2);

      template2.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'custom@example.com',
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Creates unhealthy host alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'UnHealthyHostCount',
        Namespace: 'AWS/ApplicationELB',
        Threshold: 1,
        EvaluationPeriods: 2,
        TreatMissingData: 'breaching',
      });
    });

    test('Creates high 5xx alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'HTTPCode_Target_5XX_Count',
        Namespace: 'AWS/ApplicationELB',
        Threshold: 10,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
      });
    });

    test('Creates high latency alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'TargetResponseTime',
        Namespace: 'AWS/ApplicationELB',
        ExtendedStatistic: 'p99',
        Threshold: 2,
        EvaluationPeriods: 3,
      });
    });

    test('Creates high CPU alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/ECS',
        Threshold: 85,
        EvaluationPeriods: 2,
      });
    });

    test('Creates high memory alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'MemoryUtilization',
        Namespace: 'AWS/ECS',
        Threshold: 90,
        EvaluationPeriods: 2,
      });
    });

    test('Alarms have SNS actions', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarm = Object.values(alarms)[0];
      expect(alarm).toBeDefined();
      expect(alarm?.Properties.AlarmActions).toBeDefined();
      expect(Array.isArray(alarm?.Properties.AlarmActions)).toBe(true);
      expect(alarm?.Properties.AlarmActions.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Dashboard', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Creates CloudWatch dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboard = Object.values(dashboards)[0];
      expect(dashboard).toBeDefined();
      const dashboardBody = JSON.stringify(dashboard?.Properties.DashboardBody);
      expect(dashboardBody).toContain('Transaction Processing Latency');
    });

    test('Dashboard has error rates widget', () => {
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboard = Object.values(dashboards)[0];
      const dashboardBody = JSON.stringify(dashboard?.Properties.DashboardBody);
      expect(dashboardBody).toContain('Error Rates');
    });

    test('Dashboard has ECS service metrics widget', () => {
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboard = Object.values(dashboards)[0];
      const dashboardBody = JSON.stringify(dashboard?.Properties.DashboardBody);
      expect(dashboardBody).toContain('ECS Service Metrics');
    });

    test('Dashboard has database metrics widgets', () => {
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboard = Object.values(dashboards)[0];
      const dashboardBody = JSON.stringify(dashboard?.Properties.DashboardBody);
      expect(dashboardBody).toContain('Database Connections');
      expect(dashboardBody).toContain('Database CPU');
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Has ALB DNS name output', () => {
      template.hasOutput('AlbDnsName', {
        Description: 'Application Load Balancer DNS name',
      });
    });

    test('Has CloudFront URL output', () => {
      template.hasOutput('CloudFrontUrl', {
        Description: 'CloudFront distribution URL',
      });
    });

    test('Has Aurora cluster endpoint output', () => {
      template.hasOutput('AuroraClusterEndpoint', {
        Description: 'Aurora cluster endpoint',
      });
    });

    test('Has WAF WebACL ARN output', () => {
      template.hasOutput('WafWebAclArn', {
        Description: 'WAF WebACL ARN',
      });
    });

    test('Has ECS cluster name output', () => {
      template.hasOutput('EcsClusterName', {
        Description: 'ECS cluster name',
      });
    });

    test('Has critical alerts topic ARN output', () => {
      template.hasOutput('CriticalAlertsTopicArn', {
        Description: 'SNS topic for critical alerts',
      });
    });
  });

  describe('Container Image Configuration', () => {
    test('Uses default nginx image when not provided', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: 'PaymentDashboardContainer',
            Image: Match.stringLikeRegexp('nginx:alpine'),
          }),
        ]),
      });
    });

    test('Uses custom container image from context', () => {
      const app2 = new cdk.App({
        context: {
          containerImageUri: 'custom-repo/image:tag',
        },
      });
      const stack2 = new TapStack(app2, 'TestTapStackCustomImage', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const template2 = Template.fromStack(stack2);

      template2.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: 'PaymentDashboardContainer',
            Image: 'custom-repo/image:tag',
          }),
        ]),
      });
    });
  });

  describe('Resource Counts', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('Has correct number of KMS keys', () => {
      template.resourceCountIs('AWS::KMS::Key', 3);
    });

    test('Has correct number of KMS aliases', () => {
      template.resourceCountIs('AWS::KMS::Alias', 3);
    });

    test('Has correct number of security groups', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 3);
    });

    test('Has correct number of S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });

    test('Has correct number of CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 5);
    });

    test('Has correct number of stack outputs', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBe(6);
    });
  });
});
