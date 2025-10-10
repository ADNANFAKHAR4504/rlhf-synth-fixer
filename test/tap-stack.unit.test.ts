import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    // Set up default context for tests
    app.node.setContext('vpcId', 'vpc-12345678');
    app.node.setContext('privateSubnetIds', ['subnet-11111111', 'subnet-22222222']);
    app.node.setContext('publicSubnetIds', ['subnet-44444444', 'subnet-55555555']);
    app.node.setContext('privateSubnetRouteTableIds', ['rtb-11111111', 'rtb-22222222']);
    app.node.setContext('publicSubnetRouteTableIds', ['rtb-44444444', 'rtb-55555555']);
  });

  // Helper function to create stack with proper environment
  const createStack = (id: string, props?: any): TapStack => {
    return new TapStack(app, id, {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      ...props,
    });
  };

  describe('Stack Creation', () => {
    test('should create stack with default environment suffix', () => {
      stack = createStack('TestTapStack');
      template = Template.fromStack(stack);

      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should create stack with custom environment suffix', () => {
      stack = createStack('TestTapStack', { environmentSuffix: 'prod' });
      template = Template.fromStack(stack);

      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should create stack with environment suffix from context', () => {
      app.node.setContext('environmentSuffix', 'staging');
      stack = createStack('TestTapStack');
      template = Template.fromStack(stack);

      expect(stack).toBeDefined();
    });
  });

  describe('KMS Key', () => {
    beforeEach(() => {
      stack = createStack('TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);
    });

    test('should create KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('KMS key for encrypting storage resources at rest - dev'),
        EnableKeyRotation: true,
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp('alias/TestTapStack-storage-dev'),
      });
    });

    test('should have DESTROY removal policy', () => {
      template.hasResource('AWS::KMS::Key', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('S3 Buckets', () => {
    beforeEach(() => {
      stack = createStack('TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);
    });

    test('should create static content bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('testtapstack-static-dev-.*'),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
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

    test('should create artifact bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('testtapstack-artifacts-dev-.*'),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
      });
    });

    test('should create audit bucket with Object Lock and versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('testtapstack-audit-dev-.*'),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        ObjectLockConfiguration: {
          ObjectLockEnabled: 'Enabled',
          Rule: {
            DefaultRetention: {
              Mode: 'COMPLIANCE',
              Days: 2555,
            },
          },
        },
      });
    });

    test('should create ALB access logs bucket with S3 managed encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('testtapstack-alb-logs-dev-.*'),
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });
  });

  describe('CloudTrail', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);
    });

    test('should create CloudTrail with correct properties', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
        EventSelectors: [
          {
            ReadWriteType: 'All',
            IncludeManagementEvents: true,
            DataResources: [
              {
                Type: 'AWS::S3::Object',
                Values: [Match.anyValue()],
              },
            ],
          },
        ],
      });
    });
  });

  describe('Secrets Manager', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);
    });

    test('should create database credentials secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'RDS database master credentials',
        GenerateSecretString: {
          SecretStringTemplate: '{"username":"admin"}',
          GenerateStringKey: 'password',
          ExcludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
          PasswordLength: 32,
        },
      });
    });
  });

  describe('RDS Database', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);
    });

    test('should create RDS instance with correct properties', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0.35',
        DBInstanceClass: 'db.t3.micro',
        MultiAZ: true,
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: false,
        AutoMinorVersionUpgrade: true,
        DBName: 'enterpriseappdev',
        EnableCloudwatchLogsExports: ['error', 'general', 'slowquery'],
      });
    });

    test('should have DESTROY removal policy', () => {
      template.hasResource('AWS::RDS::DBInstance', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('Security Groups', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);
    });

    test('should create ALB security group with HTTPS ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer - HTTPS only',
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTPS traffic from internet',
          },
        ],
      });
    });

    test('should create app security group with correct egress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for application instances',
        SecurityGroupEgress: [
          {
            IpProtocol: 'tcp',
            FromPort: 3306,
            ToPort: 3306,
            Description: 'Allow app to reach database',
          },
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTPS outbound for external APIs',
          },
        ],
      });
    });

    test('should create database security group with app access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 3306,
            ToPort: 3306,
            Description: 'Allow database access from app instances',
          },
        ],
      });
    });
  });

  describe('IAM Roles', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);
    });

    test('should create EC2 instance role with correct policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/CloudWatchAgentServerPolicy',
              ],
            ],
          },
        ],
      });
    });

    test('should create CodeBuild role with correct policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
            },
          ],
        },
        Description: 'Role for CodeBuild projects with least privilege access',
      });
    });
  });

  describe('Launch Template', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);
    });

    test('should create launch template with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          InstanceType: 't3.medium',
          ImageId: {
            'Fn::FindInMap': ['AWSRegionToAMI', { Ref: 'AWS::Region' }, 'AMI'],
          },
          IamInstanceProfile: {
            Name: Match.anyValue(),
          },
          SecurityGroupIds: [Match.anyValue()],
          UserData: {
            'Fn::Base64': Match.stringLikeRegexp('#!/bin/bash'),
          },
          BlockDeviceMappings: [
            {
              DeviceName: '/dev/xvda',
              Ebs: {
                VolumeSize: 20,
                VolumeType: 'gp3',
                Encrypted: true,
              },
            },
          ],
        },
      });
    });
  });

  describe('Auto Scaling Group', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);
    });

    test('should create auto scaling group with correct properties', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '10',
        DesiredCapacity: '2',
        HealthCheckType: 'ELB',
        HealthCheckGracePeriod: 300,
        VPCZoneIdentifier: [
          'subnet-11111111',
          'subnet-22222222',
        ],
      });
    });

    test('should create CPU scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: {
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ASGAverageCPUUtilization',
          },
          TargetValue: 70,
        },
      });
    });

    test('should create memory scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: {
          CustomizedMetricSpecification: {
            MetricName: 'MEM_USED',
            Namespace: 'EnterpriseApp',
            Statistic: 'Average',
          },
          TargetValue: 80,
        },
      });
    });
  });

  describe('Application Load Balancer', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);
    });

    test('should create ALB with correct properties', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing',
        Subnets: ['subnet-44444444', 'subnet-55555555'],
        DeletionProtection: false,
      });
    });

    test('should create HTTPS listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 443,
        Protocol: 'HTTPS',
        SslPolicy: 'ELBSecurityPolicy-TLS-1-2-Ext-2018-06',
      });
    });

    test('should create target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 8080,
        Protocol: 'HTTP',
        HealthCheckEnabled: true,
        HealthCheckIntervalSeconds: 30,
        HealthCheckPath: '/health',
        HealthCheckProtocol: 'HTTP',
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
        TargetType: 'instance',
      });
    });
  });

  describe('ACM Certificate', () => {
    test('should create certificate with DNS validation when no ARN provided', () => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CertificateManager::Certificate', {
        DomainName: 'example.com',
        SubjectAlternativeNames: ['*.example.com'],
        ValidationMethod: 'DNS',
      });
    });

    test('should use provided certificate ARN when available', () => {
      app.node.setContext('certificateArn', 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012');
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);

      // Should not create a new certificate when ARN is provided
      template.resourceCountIs('AWS::CertificateManager::Certificate', 0);
    });
  });

  describe('Route53 DNS', () => {
    test('should create Route53 resources when enabled', () => {
      app.node.setContext('enableRoute53', 'true');
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Type: 'A',
        Name: 'example.com.',
      });

      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: {
          Type: 'HTTPS',
          ResourcePath: '/health',
          Port: 443,
          FullyQualifiedDomainName: Match.anyValue(),
          RequestInterval: 30,
          FailureThreshold: 3,
        },
      });
    });

    test('should not create Route53 resources when disabled', () => {
      app.node.setContext('enableRoute53', 'false');
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::Route53::RecordSet', 0);
      template.resourceCountIs('AWS::Route53::HealthCheck', 0);
    });
  });

  describe('SNS Topics', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);
    });

    test('should create alarm topic with email subscription', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Infrastructure Alarms',
      });

      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'ops-team@example.com',
      });
    });

    test('should create pipeline notification topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'CI/CD Pipeline Notifications',
      });

      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'devops@example.com',
      });
    });
  });

  describe('CloudWatch Logs', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);
    });

    test('should create log group with correct properties', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/enterprise-app/application-dev',
        RetentionInDays: 30,
      });

      template.hasResource('AWS::Logs::LogGroup', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('should create metric filter for error tracking', () => {
      template.hasResourceProperties('AWS::Logs::MetricFilter', {
        FilterPattern: '?"ERROR" ?"Error" ?"error"',
        MetricTransformations: [
          {
            MetricName: 'ApplicationErrors',
            MetricNamespace: 'EnterpriseApp',
            MetricValue: '1',
            DefaultValue: 0,
          },
        ],
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);
    });

    test('should create CPU alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Statistic: 'Average',
        Threshold: 80,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
        TreatMissingData: 'breaching',
        AlarmDescription: 'CPU utilization exceeds 80% for 10 minutes',
      });
    });

    test('should create memory alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'MEM_USED',
        Namespace: 'EnterpriseApp',
        Statistic: 'Average',
        Threshold: 85,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
        TreatMissingData: 'breaching',
        AlarmDescription: 'Memory utilization exceeds 85% for 10 minutes',
      });
    });

    test('should create database CPU alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
        Statistic: 'Average',
        Threshold: 75,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 2,
        AlarmDescription: 'Database CPU exceeds 75%',
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);
    });

    test('should create dashboard with correct name', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'TestTapStack-dashboard-dev',
      });
    });
  });

  describe('CodeBuild Project', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);
    });

    test('should create build project with correct properties', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'TestTapStack-build-dev',
        Environment: {
          ComputeType: 'BUILD_GENERAL1_MEDIUM',
          Image: 'aws/codebuild/standard:7.0',
          PrivilegedMode: true,
          Type: 'LINUX_CONTAINER',
        },
        TimeoutInMinutes: 30,
      });
    });

    test('should have correct build spec', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Source: {
          BuildSpec: Match.stringLikeRegexp('version.*0.2'),
        },
      });
    });
  });

  describe('CodePipeline', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);
    });

    test('should create pipeline with correct name', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'TestTapStack-pipeline-dev',
        RestartExecutionOnUpdate: true,
      });
    });

    test('should have correct stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: [
          {
            Name: 'Source',
            Actions: [
              {
                Name: 'Source',
                ActionTypeId: {
                  Category: 'Source',
                  Owner: 'AWS',
                  Provider: 'S3',
                },
              },
            ],
          },
          {
            Name: 'Build',
            Actions: [
              {
                Name: 'Build',
                ActionTypeId: {
                  Category: 'Build',
                  Owner: 'AWS',
                  Provider: 'CodeBuild',
                },
              },
            ],
          },
          {
            Name: 'Approval',
            Actions: [
              {
                Name: 'ManualApproval',
                ActionTypeId: {
                  Category: 'Approval',
                  Owner: 'AWS',
                  Provider: 'Manual',
                },
              },
            ],
          },
          {
            Name: 'Deploy',
            Actions: [
              {
                Name: 'DeployStack',
                ActionTypeId: {
                  Category: 'Deploy',
                  Owner: 'AWS',
                  Provider: 'CloudFormation',
                },
              },
            ],
          },
        ],
      });
    });
  });

  describe('Environment Configuration', () => {
    test('should use custom domain name from context', () => {
      app.node.setContext('domainName', 'custom.example.com');
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CertificateManager::Certificate', {
        DomainName: 'custom.example.com',
        SubjectAlternativeNames: ['*.custom.example.com'],
      });
    });

    test('should use custom VPC ID from context', () => {
      app.node.setContext('vpcId', 'vpc-custom123');
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);

      // VPC is imported, so we can't directly test the VPC ID in the template
      // But we can verify the stack creates without errors
      expect(stack).toBeDefined();
    });

    test('should use custom subnet IDs from context', () => {
      app.node.setContext('privateSubnetIds', ['subnet-custom1', 'subnet-custom2']);
      app.node.setContext('publicSubnetIds', ['subnet-custom4', 'subnet-custom5']);
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);

      // Test that ASG uses the custom private subnets
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        VPCZoneIdentifier: ['subnet-custom1', 'subnet-custom2'],
      });
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);
    });

    test('should have environment suffix output', () => {
      template.hasOutput('EnvironmentSuffix', {
        Description: 'Environment suffix for this deployment',
        Value: 'dev',
      });
    });

    test('should have load balancer DNS output', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Load Balancer DNS name',
        Value: {
          'Fn::GetAtt': [Match.stringLikeRegexp('LoadBalancer.*'), 'DNSName'],
        },
      });
    });

    test('should have application URL output', () => {
      template.hasOutput('ApplicationURL', {
        Description: 'Application URL',
        Value: 'https://example.com',
      });
    });

    test('should have database endpoint output', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS database endpoint',
        Value: {
          'Fn::GetAtt': [Match.stringLikeRegexp('Database.*'), 'Endpoint.Address'],
        },
      });
    });

    test('should have static bucket name output', () => {
      template.hasOutput('StaticBucketName', {
        Description: 'Static content S3 bucket name',
        Value: {
          Ref: Match.stringLikeRegexp('StaticContentBucket.*'),
        },
      });
    });

    test('should have dashboard URL output', () => {
      template.hasOutput('DashboardUrl', {
        Description: 'CloudWatch Dashboard URL',
        Value: {
          'Fn::Join': [
            '',
            [
              'https://console.aws.amazon.com/cloudwatch/home?region=',
              { Ref: 'AWS::Region' },
              '#dashboards:name=',
              { Ref: Match.stringLikeRegexp('ApplicationDashboard.*') },
            ],
          ],
        },
      });
    });

    test('should have pipeline URL output', () => {
      template.hasOutput('PipelineUrl', {
        Description: 'Pipeline console URL',
        Value: {
          'Fn::Join': [
            '',
            [
              'https://console.aws.amazon.com/codesuite/codepipeline/pipelines/',
              { Ref: Match.stringLikeRegexp('Pipeline.*') },
              '/view',
            ],
          ],
        },
      });
    });

    test('should have alarm topic ARN output', () => {
      template.hasOutput('AlarmTopicArn', {
        Description: 'SNS Topic for alarm notifications',
        Value: {
          Ref: Match.stringLikeRegexp('AlarmTopic.*'),
        },
      });
    });
  });

  describe('Resource Counts', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'dev' });
      template = Template.fromStack(stack);
    });

    test('should have correct number of S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 4);
    });

    test('should have correct number of security groups', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 3);
    });

    test('should have correct number of SNS topics', () => {
      template.resourceCountIs('AWS::SNS::Topic', 2);
    });

    test('should have correct number of CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
    });

    test('should have correct number of IAM roles', () => {
      template.resourceCountIs('AWS::IAM::Role', 8); // EC2, CodeBuild, Pipeline, and action roles
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing context gracefully', () => {
      // Create app without any context
      const cleanApp = new cdk.App();
      const cleanStack = new TapStack(cleanApp, 'CleanTestStack');
      const cleanTemplate = Template.fromStack(cleanStack);

      // Should still create all resources with defaults
      expect(cleanStack).toBeDefined();
      cleanTemplate.resourceCountIs('AWS::S3::Bucket', 4);
    });

    test('should handle empty environment suffix', () => {
      const emptySuffixStack = new TapStack(app, 'EmptySuffixStack', { environmentSuffix: '' });
      const emptySuffixTemplate = Template.fromStack(emptySuffixStack);

      // Should still create resources
      expect(emptySuffixStack).toBeDefined();
      emptySuffixTemplate.resourceCountIs('AWS::S3::Bucket', 4);
    });

    test('should handle special characters in environment suffix', () => {
      const specialSuffixStack = new TapStack(app, 'SpecialSuffixStack', { environmentSuffix: 'test-env_123' });
      const specialSuffixTemplate = Template.fromStack(specialSuffixStack);

      // Should create resources with sanitized names
      expect(specialSuffixStack).toBeDefined();
      specialSuffixTemplate.resourceCountIs('AWS::S3::Bucket', 4);
    });
  });
});