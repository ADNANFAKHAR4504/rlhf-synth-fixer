import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  describe('Environment Suffix Configuration', () => {
    test('uses environmentSuffix from props', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'staging',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'fintech-payment-staging-storage',
      });
    });

    test('uses environmentSuffix from context when props not provided', () => {
      const app = new cdk.App();
      app.node.setContext('environmentSuffix', 'prod');
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'fintech-payment-prod-storage',
      });
    });

    test('defaults to dev when environmentSuffix not provided', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'fintech-payment-dev-storage',
      });
    });
  });

  describe('VPC and Networking', () => {
    test('creates VPC with correct configuration', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public, private, and isolated subnets', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      // Should have at least 6 subnets (2 NAT gateways × 3 subnet types)
      const subnetCount = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnetCount).length).toBeGreaterThanOrEqual(6);
      
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          { Key: 'aws-cdk:subnet-type', Value: 'Public' },
        ]),
      });
    });

    test('creates NAT gateways for private subnets', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('creates internet gateway', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('creates VPC flow logs', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/vpc/fintech-payment-test-flowlogs',
        RetentionInDays: 7,
      });

      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });
  });

  describe('Security Groups', () => {
    test('creates ALB security group with correct ingress rules', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'fintech-payment-test-alb-sg',
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          {
            CidrIp: '0.0.0.0/0',
            Description: 'HTTPS from Internet',
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp',
          },
          {
            CidrIp: '0.0.0.0/0',
            Description: 'HTTP from Internet',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
          },
        ]),
      });
    });

    test('creates EC2 security group with ALB ingress rule', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'fintech-payment-test-ec2-sg',
        GroupDescription: 'Security group for EC2 instances',
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        Description: 'HTTP from ALB',
        FromPort: 8080,
        ToPort: 8080,
        IpProtocol: 'tcp',
      });
    });

    test('creates RDS security group with EC2 ingress rule', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'fintech-payment-test-rds-sg',
        GroupDescription: 'Security group for RDS database',
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        Description: 'PostgreSQL from EC2',
        FromPort: 5432,
        ToPort: 5432,
        IpProtocol: 'tcp',
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates permissions boundary with correct policies', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: 'fintech-payment-test-permissions-boundary',
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ]),
              Resource: 'arn:aws:s3:::fintech-payment-test-*',
            },
            {
              Effect: 'Allow',
              Action: Match.arrayWith([
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:GetParameterHistory',
                'ssm:GetParametersByPath',
              ]),
              Resource: 'arn:aws:ssm:*:*:parameter/test/payment/*',
            },
          ]),
        },
      });
    });

    test('creates EC2 role with permissions boundary and managed policies', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'fintech-payment-test-ec2-role',
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ]),
        }),
        ManagedPolicyArns: Match.anyValue(),
      });
    });

    test('creates RDS monitoring role', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'fintech-payment-test-rds-monitoring-role',
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'monitoring.rds.amazonaws.com',
              },
            },
          ]),
        }),
        ManagedPolicyArns: Match.anyValue(),
      });
    });
  });

  describe('S3 Storage', () => {
    test('creates S3 bucket with correct configuration', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'fintech-payment-test-storage',
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
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'ExpireObjects',
              Status: 'Enabled',
              ExpirationInDays: 30,
            },
          ],
        },
      });
    });

    test('grants EC2 role read/write access to S3 bucket', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      const policies = template.findResources('AWS::IAM::Policy');
      const hasS3Access = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) => {
          const actions = Array.isArray(stmt.Action)
            ? stmt.Action
            : [stmt.Action].filter(Boolean);
          return actions.some((action: string) =>
            action.includes('s3:GetObject') || action.includes('s3:PutObject')
          );
        });
      });
      expect(hasS3Access).toBe(true);
    });
  });

  describe('RDS Database', () => {
    test('creates RDS database with correct configuration', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: 'fintech-payment-test-rds',
        DBInstanceClass: 'db.t3.micro',
        Engine: 'postgres',
        EngineVersion: '15.12',
        AllocatedStorage: '20',
        MaxAllocatedStorage: 100,
        BackupRetentionPeriod: 1,
        PreferredBackupWindow: '03:00-04:00',
        PreferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        DeletionProtection: false,
        MonitoringInterval: 60,
      });
    });

    test('creates Secrets Manager secret for database credentials', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'fintech-payment-test-db-secret',
        Description: 'RDS PostgreSQL master credentials',
        GenerateSecretString: {
          SecretStringTemplate: '{"username":"paymentadmin"}',
          GenerateStringKey: 'password',
          ExcludeCharacters:
            ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        },
      });
    });

    test('creates DB subnet group in isolated subnets', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });

      template.resourceCountIs('AWS::RDS::DBSubnetGroup', 1);
    });
  });

  describe('EC2 and Auto Scaling', () => {
    test('creates launch template with correct configuration', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: 'fintech-payment-test-launch-template',
        LaunchTemplateData: {
          InstanceType: 't3.micro',
          BlockDeviceMappings: [
            {
              DeviceName: '/dev/xvda',
              Ebs: {
                // Encrypted property not set - uses account default EBS encryption
                VolumeSize: 30,
                VolumeType: 'gp3',
              },
            },
          ],
        },
      });
    });

    test('creates auto scaling group with correct capacity', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties(
        'AWS::AutoScaling::AutoScalingGroup',
        {
          AutoScalingGroupName: 'fintech-payment-test-asg',
          MinSize: '1',
          MaxSize: '3',
          DesiredCapacity: '1',
          HealthCheckType: 'ELB',
          HealthCheckGracePeriod: 300,
        }
      );
    });

    test('user data includes CloudWatch agent configuration', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      const launchTemplate = template.findResources(
        'AWS::EC2::LaunchTemplate'
      );
      const userData = JSON.stringify(
        launchTemplate[Object.keys(launchTemplate)[0]].Properties
          .LaunchTemplateData.UserData
      );

      expect(userData).toContain('amazon-cloudwatch-agent');
      expect(userData).toContain('fintech/payment/test');
    });
  });

  describe('Application Load Balancer', () => {
    test('creates ALB with correct configuration', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Name: 'fintech-payment-test-alb',
          Scheme: 'internet-facing',
          Type: 'application',
        }
      );
    });

    test('creates target group with health check configuration', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        Match.objectLike({
          Name: 'fintech-payment-test-tg',
          Port: 8080,
          Protocol: 'HTTP',
          HealthCheckPath: '/health',
          HealthyThresholdCount: 2,
          UnhealthyThresholdCount: 3,
        })
      );
    });

    test('creates HTTP listener on port 80', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::Listener',
        {
          Port: 80,
          Protocol: 'HTTP',
        }
      );
    });
  });

  describe('Route53 DNS', () => {
    test('creates public hosted zone', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'payment-test.company.com.',
      });
    });

    test('creates A record pointing to ALB', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: 'api.payment-dev.company.com.',
        Type: 'A',
        AliasTarget: Match.anyValue(),
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates SNS topic for alarms', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'fintech-payment-test-alarms',
        DisplayName: 'Payment Processing Alarms - test',
      });
    });

    test('creates CPU alarm for EC2 with correct threshold', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'fintech-payment-test-cpu-alarm',
        AlarmDescription: 'CPU utilization exceeds 80%',
        Namespace: 'AWS/EC2',
        MetricName: 'CPUUtilization',
        Threshold: 80,
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        TreatMissingData: 'breaching',
      });
    });

    test('creates CPU alarm for RDS with correct threshold', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'fintech-payment-test-db-cpu-alarm',
        AlarmDescription: 'RDS CPU utilization high',
        Namespace: 'AWS/RDS',
        MetricName: 'CPUUtilization',
        Threshold: 85,
        EvaluationPeriods: 2,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('alarms have SNS action attached', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('SSM Parameter Store', () => {
    test('creates all required SSM parameters', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/test/payment/db-endpoint',
        Description: 'RDS database endpoint',
        Type: 'String',
      });

      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/test/payment/db-port',
        Description: 'RDS database port',
        Type: 'String',
      });

      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/test/payment/db-secret-arn',
        Description: 'Secret Manager ARN for DB credentials',
        Type: 'String',
      });

      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/test/payment/s3-bucket',
        Description: 'S3 bucket for payment data',
        Type: 'String',
      });

      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/test/payment/alb-dns',
        Description: 'Application Load Balancer DNS',
        Type: 'String',
      });

      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/test/payment/environment',
        Description: 'Current environment',
        Type: 'String',
        Value: 'test',
      });
    });

    test('grants EC2 role read access to SSM parameters', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      const policies = template.findResources('AWS::IAM::Policy');
      const hasSSMAccess = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) => {
          const actions = Array.isArray(stmt.Action)
            ? stmt.Action
            : [stmt.Action].filter(Boolean);
          return actions.some((action: string) =>
            action.includes('ssm:GetParameter')
          );
        });
      });
      expect(hasSSMAccess).toBe(true);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('creates application log group with correct retention', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/payment/test/application',
        RetentionInDays: 7,
      });
    });

    test('grants EC2 role write access to log group', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      const policies = template.findResources('AWS::IAM::Policy');
      const hasLogsAccess = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) => {
          const actions = Array.isArray(stmt.Action)
            ? stmt.Action
            : [stmt.Action].filter(Boolean);
          return actions.some((action: string) =>
            action.includes('logs:PutLogEvents') ||
            action.includes('logs:CreateLogStream')
          );
        });
      });
      expect(hasLogsAccess).toBe(true);
    });
  });

  describe('Stack Outputs', () => {
    test('exports VPC ID', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasOutput('VPCId', {
        Export: { Name: 'test-vpc-id' },
      });
    });

    test('exports Database ARN', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasOutput('DatabaseArn', {
        Export: { Name: 'test-db-arn' },
      });
    });

    test('exports ALB DNS name', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasOutput('ALBDnsName', {
        Export: { Name: 'test-alb-dns' },
      });
    });

    test('exports S3 bucket name', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      const template = Template.fromStack(stack);

      template.hasOutput('S3BucketName', {
        Export: { Name: 'test-s3-bucket' },
      });
    });
  });

  describe('Resource Tagging', () => {
    test('applies Environment tag to all resources', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'staging',
      });
      const template = Template.fromStack(stack);

      // Check tags on multiple resource types
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([{ Key: 'Environment', Value: 'staging' }]),
      });

      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([{ Key: 'Environment', Value: 'staging' }]),
      });

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Tags: Match.arrayWith([{ Key: 'Environment', Value: 'staging' }]),
      });
    });

    test('applies Team and CostCenter tags', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      const bucket = template.findResources('AWS::S3::Bucket');
      const bucketResource = Object.values(bucket)[0];
      const tags = bucketResource.Properties?.Tags || [];
      const hasTeamTag = tags.some(
        (tag: any) =>
          tag.Key === 'Team' && tag.Value === 'PaymentProcessing'
      );
      const hasCostCenterTag = tags.some(
        (tag: any) =>
          tag.Key === 'CostCenter' && tag.Value === 'Engineering'
      );
      expect(hasTeamTag).toBe(true);
      expect(hasCostCenterTag).toBe(true);
    });
  });

  describe('Resource Naming', () => {
    test('all resources use consistent naming pattern', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'prod',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'fintech-payment-prod-storage',
      });

      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'fintech-payment-prod-ec2-role',
      });

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: 'fintech-payment-prod-rds',
      });

      template.hasResourceProperties(
        'AWS::AutoScaling::AutoScalingGroup',
        {
          AutoScalingGroupName: 'fintech-payment-prod-asg',
        }
      );
    });
  });

  describe('Secrets Manager Integration', () => {
    test('grants EC2 role read access to database secret', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      const policies = template.findResources('AWS::IAM::Policy');
      const hasSecretsAccess = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) => {
          const actions = Array.isArray(stmt.Action)
            ? stmt.Action
            : [stmt.Action].filter(Boolean);
          return actions.some((action: string) =>
            action.includes('secretsmanager:GetSecretValue') ||
            action.includes('secretsmanager:DescribeSecret')
          );
        });
      });
      expect(hasSecretsAccess).toBe(true);
    });

    test('creates secret target attachment for RDS', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      template.resourceCountIs(
        'AWS::SecretsManager::SecretTargetAttachment',
        1
      );
    });
  });

  describe('Removal Policies', () => {
    test('sets DESTROY removal policy on S3 bucket', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      const bucket = template.findResources('AWS::S3::Bucket');
      const bucketResource = Object.values(bucket)[0];
      expect(bucketResource.UpdateReplacePolicy).toBe('Delete');
      expect(bucketResource.DeletionPolicy).toBe('Delete');
    });

    test('sets DESTROY removal policy on RDS database', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      const db = template.findResources('AWS::RDS::DBInstance');
      const dbResource = Object.values(db)[0];
      expect(dbResource.UpdateReplacePolicy).toBe('Delete');
      expect(dbResource.DeletionPolicy).toBe('Delete');
    });

    test('sets DESTROY removal policy on log groups', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach((logGroup: any) => {
        expect(logGroup.UpdateReplacePolicy).toBe('Delete');
        expect(logGroup.DeletionPolicy).toBe('Delete');
      });
    });
  });
});
