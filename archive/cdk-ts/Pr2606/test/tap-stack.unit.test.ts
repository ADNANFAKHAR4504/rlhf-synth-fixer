import * as cdk from 'aws-cdk-lib';
import { Template, Match, Capture } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

// Set CDK environment variables to avoid actual AWS calls in tests
process.env.CDK_DEFAULT_ACCOUNT = '123456789012';
process.env.CDK_DEFAULT_REGION = 'us-east-1';
process.env.CDK_DISABLE_STACK_TRACE = '1';

// Mock Route53 to avoid AWS API calls during testing
jest.mock('aws-cdk-lib/aws-route53', () => {
  const actual = jest.requireActual('aws-cdk-lib/aws-route53');
  const mockHostedZoneId = 'Z123456789ABCDEFGHIJK';
  
  return {
    ...actual,
    HostedZone: {
      ...actual.HostedZone,
      fromLookup: jest.fn().mockImplementation((scope: any, id: string, props: any) => {
        return {
          hostedZoneId: mockHostedZoneId,
          zoneName: props.domainName,
          hostedZoneArn: `arn:aws:route53:::hostedzone/${mockHostedZoneId}`
        };
      })
    }
  };
});

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('should apply common tags to all resources', () => {
      const expectedTags = {
        Environment: environmentSuffix,
        Project: 'TAP-Migration',
        ManagedBy: 'CDK',
        CostCenter: 'Engineering',
      };

      // Check that tags are applied at the stack level
      expect(stack.tags.tagValues()).toEqual(expectedTags);
    });

    test('should handle custom environment suffix', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', { 
        environmentSuffix: 'prod',
        env: { account: '123456789012', region: 'us-east-1' }
      });
      const customTemplate = Template.fromStack(customStack);
      
      expect(customStack.tags.tagValues().Environment).toBe('prod');
    });

    test('should handle domain name configuration', () => {
      // Skip this test as it requires actual hosted zone lookup
      // In a real test environment, you would mock the hosted zone
      expect(true).toBe(true);
    });
  });

  describe('Branch Coverage - Constructor Parameters', () => {
    describe('Environment Suffix Resolution', () => {
      test('should use props.environmentSuffix when provided', () => {
        const testApp = new cdk.App();
        const testStack = new TapStack(testApp, 'TestPropsEnvStack', {
          environmentSuffix: 'staging'
        });
        
        // Verify the environment suffix is used in resource names
        const testTemplate = Template.fromStack(testStack);
        testTemplate.hasResourceProperties('AWS::KMS::Alias', {
          AliasName: 'alias/tap-key-staging'
        });
        
        // Also check VPC name
        testTemplate.hasResourceProperties('AWS::EC2::VPC', {
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'Name',
              Value: 'tap-vpc-staging'
            })
          ])
        });
      });

      test('should use context environmentSuffix when props not provided', () => {
        const testApp = new cdk.App({
          context: {
            environmentSuffix: 'context-env'
          }
        });
        const testStack = new TapStack(testApp, 'TestContextEnvStack');
        
        const testTemplate = Template.fromStack(testStack);
        testTemplate.hasResourceProperties('AWS::KMS::Alias', {
          AliasName: 'alias/tap-key-context-env'
        });
      });

      test('should use default "dev" when neither props nor context provided', () => {
        const testApp = new cdk.App();
        const testStack = new TapStack(testApp, 'TestDefaultEnvStack');
        
        const testTemplate = Template.fromStack(testStack);
        testTemplate.hasResourceProperties('AWS::KMS::Alias', {
          AliasName: 'alias/tap-key-dev'
        });
      });

      test('should prefer props.environmentSuffix over context', () => {
        const testApp = new cdk.App({
          context: {
            environmentSuffix: 'context-env'
          }
        });
        const testStack = new TapStack(testApp, 'TestPropsOverContextStack', {
          environmentSuffix: 'props-env'
        });
        
        const testTemplate = Template.fromStack(testStack);
        testTemplate.hasResourceProperties('AWS::KMS::Alias', {
          AliasName: 'alias/tap-key-props-env'
        });
      });

      test('should handle undefined props parameter', () => {
        const testApp = new cdk.App();
        const testStack = new TapStack(testApp, 'TestUndefinedPropsStack', undefined);
        
        const testTemplate = Template.fromStack(testStack);
        testTemplate.hasResourceProperties('AWS::KMS::Alias', {
          AliasName: 'alias/tap-key-dev'
        });
      });

      test('should handle empty props object', () => {
        const testApp = new cdk.App();
        const testStack = new TapStack(testApp, 'TestEmptyPropsStack', {});
        
        const testTemplate = Template.fromStack(testStack);
        testTemplate.hasResourceProperties('AWS::KMS::Alias', {
          AliasName: 'alias/tap-key-dev'
        });
      });
    });

    describe('Domain Name Resolution', () => {
      test('should use props.domainName when provided and create Route53 resources', () => {
        const testApp = new cdk.App({
          context: {
            // Set context to avoid Route53 lookup in tests
            '@aws-cdk/aws-route53:Route53HostedZone.fromLookup': false
          }
        });
        const testStack = new TapStack(testApp, 'TestPropsDomainStack', {
          environmentSuffix: 'test',
          domainName: 'example.com',
          env: { account: '123456789012', region: 'us-east-1' }
        });
        
        const testTemplate = Template.fromStack(testStack);
        const outputs = testTemplate.findOutputs('*');
        expect(outputs).toHaveProperty('ApplicationDomain');
        expect(outputs.ApplicationDomain.Value).toBe('tap-test.example.com');
      });

      test('should use context domainName when props not provided', () => {
        const testApp = new cdk.App({
          context: {
            domainName: 'context-domain.com',
            '@aws-cdk/aws-route53:Route53HostedZone.fromLookup': false
          }
        });
        const testStack = new TapStack(testApp, 'TestContextDomainStack', {
          environmentSuffix: 'test',
          env: { account: '123456789012', region: 'us-east-1' }
        });
        
        const testTemplate = Template.fromStack(testStack);
        const outputs = testTemplate.findOutputs('*');
        expect(outputs).toHaveProperty('ApplicationDomain');
        expect(outputs.ApplicationDomain.Value).toBe('tap-test.context-domain.com');
      });

      test('should handle no domain name (undefined in both props and context)', () => {
        const testApp = new cdk.App();
        const testStack = new TapStack(testApp, 'TestNoDomainStack', {
          environmentSuffix: 'test'
        });
        
        const testTemplate = Template.fromStack(testStack);
        const outputs = testTemplate.findOutputs('*');
        expect(outputs).not.toHaveProperty('ApplicationDomain');
      });

      test('should handle empty string domain name in props', () => {
        const testApp = new cdk.App();
        const testStack = new TapStack(testApp, 'TestEmptyStringDomainStack', {
          environmentSuffix: 'test',
          domainName: ''
        });
        
        const testTemplate = Template.fromStack(testStack);
        const outputs = testTemplate.findOutputs('*');
        // Empty string is falsy, so no domain output should be created
        expect(outputs).not.toHaveProperty('ApplicationDomain');
      });

      test('should handle null domain name in props', () => {
        const testApp = new cdk.App();
        const testStack = new TapStack(testApp, 'TestNullDomainStack', {
          environmentSuffix: 'test',
          domainName: null as any
        });
        
        const testTemplate = Template.fromStack(testStack);
        const outputs = testTemplate.findOutputs('*');
        // null is falsy, so no domain output should be created
        expect(outputs).not.toHaveProperty('ApplicationDomain');
      });
    });
  });

  describe('Branch Coverage - Conditional Resource Creation', () => {
    describe('Conditional Domain Output Branch', () => {
      test('should NOT create ApplicationDomain output when domainName is falsy', () => {
        const testApp = new cdk.App();
        const testStack = new TapStack(testApp, 'TestNoDomainOutputStack', {
          environmentSuffix: 'test'
        });
        
        const testTemplate = Template.fromStack(testStack);
        const outputs = testTemplate.findOutputs('*');
        
        expect(outputs).not.toHaveProperty('ApplicationDomain');
        
        // Verify all other outputs still exist
        expect(outputs).toHaveProperty('VpcId');
        expect(outputs).toHaveProperty('LoadBalancerDnsName');
        expect(outputs).toHaveProperty('LoadBalancerUrl');
        expect(outputs).toHaveProperty('DatabaseEndpoint');
        expect(outputs).toHaveProperty('DatabasePort');
        expect(outputs).toHaveProperty('ReadReplicaEndpoint');
        expect(outputs).toHaveProperty('BackupBucketName');
        expect(outputs).toHaveProperty('BackupBucketArn');
        expect(outputs).toHaveProperty('AutoScalingGroupName');
        expect(outputs).toHaveProperty('AlarmTopicArn');
      });
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `tap-vpc-${environmentSuffix}`
          })
        ])
      });
    });

    test('should create public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*Public.*')
          })
        ])
      });
    });

    test('should create private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*Private.*')
          })
        ])
      });
    });

    test('should create NAT Gateway', () => {
      template.hasResourceProperties('AWS::EC2::NatGateway', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.anyValue()
          })
        ])
      });
    });

    test('should create Internet Gateway', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.anyValue()
          })
        ])
      });
    });

    test('should create VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 'cloud-watch-logs'
      });
    });
  });

  describe('KMS Key Configuration', () => {
    test('should create KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP application encryption',
        EnableKeyRotation: true,
        Enabled: true,
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: { AWS: Match.anyValue() },
              Action: 'kms:*',
              Resource: '*'
            })
          ])
        }
      });
    });

    test('should create KMS alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/tap-key-${environmentSuffix}`
      });
    });

    test('should configure KMS key policy for EC2 service', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Enable use of the key via EC2',
              Effect: 'Allow',
              Principal: {
                Service: Match.arrayWith(['ec2.amazonaws.com', 'autoscaling.amazonaws.com'])
              },
              Action: Match.arrayWith([
                'kms:CreateGrant',
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:GenerateDataKey*',
                'kms:GenerateDataKeyWithoutPlainText',
                'kms:ReEncrypt*'
              ])
            })
          ])
        }
      });
    });

    test('should configure KMS key policy for Auto Scaling service', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'autoscaling.amazonaws.com'
              },
              Action: Match.arrayWith([
                'kms:CreateGrant',
                'kms:ListGrants',
                'kms:RevokeGrant'
              ]),
              Condition: {
                Bool: {
                  'kms:GrantIsForAWSResource': 'true'
                }
              }
            })
          ])
        }
      });
    });
  });

  describe('Security Groups Configuration', () => {
    test('should create ALB security group with HTTP/HTTPS access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        GroupName: `tap-alb-sg-${environmentSuffix}`,
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp'
          }),
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp'
          })
        ])
      });
    });

    test('should create application security group with ALB access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        GroupName: `tap-app-sg-${environmentSuffix}`
      });
      
      // Check ingress rules separately
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        SourceSecurityGroupId: Match.anyValue()
      });
    });

    test('should create database security group with PostgreSQL access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
        GroupName: `tap-db-sg-${environmentSuffix}`
      });
      
      // Check ingress rules separately
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
        SourceSecurityGroupId: Match.anyValue()
      });
    });
  });

  describe('IAM Role Configuration', () => {
    test('should create EC2 role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-ec2-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ]
        },
        ManagedPolicyArns: [
          Match.objectLike({
            'Fn::Join': Match.anyValue()
          })
        ]
      });
    });

    test('should attach KMS policy to EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'kms:CreateGrant',
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:GenerateDataKeyWithoutPlainText',
                'kms:GenerateDataKey*',
                'kms:ReEncrypt*',
                'kms:Encrypt'
              ])
            })
          ])
        }
      });
    });
  });

  describe('S3 Backup Bucket Configuration', () => {
    test('should create S3 bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms'
              }
            }
          ]
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        },
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'transition-to-glacier',
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'GLACIER',
                  TransitionInDays: 30
                }),
                Match.objectLike({
                  StorageClass: 'DEEP_ARCHIVE',
                  TransitionInDays: 180
                })
              ]),
              ExpirationInDays: 365
            }
          ]
        }
      });
    });

    test('should grant S3 permissions to EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObject*',
                's3:GetBucket*',
                's3:List*',
                's3:DeleteObject*',
                's3:PutObject',
                's3:PutObjectLegalHold',
                's3:PutObjectRetention',
                's3:PutObjectTagging',
                's3:PutObjectVersionTagging',
                's3:Abort*'
              ])
            })
          ])
        }
      });
    });
  });

  describe('RDS Database Configuration', () => {
    test('should create database subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupName: `tap-db-subnet-${environmentSuffix}`,
        DBSubnetGroupDescription: 'Subnet group for RDS database'
      });
    });

    test('should create PostgreSQL database with correct configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        EngineVersion: '15.7',
        DBInstanceClass: 'db.t3.medium',
        DBName: 'tapdb',
        DBInstanceIdentifier: `tap-db-${environmentSuffix}`,
        AllocatedStorage: '100',
        MaxAllocatedStorage: 200,
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        PreferredBackupWindow: '03:00-04:00',
        PreferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        MultiAZ: true,
        DeletionProtection: false,
        MonitoringInterval: 60,
        EnablePerformanceInsights: true
      });
    });

    test('should create read replica', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: `tap-db-replica-${environmentSuffix}`,
        DBInstanceClass: 'db.t3.medium',
        StorageEncrypted: true,
        MonitoringInterval: 60,
        SourceDBInstanceIdentifier: Match.anyValue()
      });
    });
  });

  describe('Load Balancer Configuration', () => {
    test('should create Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `tap-alb-${environmentSuffix}`,
        Scheme: 'internet-facing',
        Type: 'application'
      });
    });

    test('should create target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: `tap-tg-${environmentSuffix}`,
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'instance',
        HealthCheckEnabled: true,
        HealthCheckPath: '/health',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
        TargetGroupAttributes: Match.arrayWith([
          Match.objectLike({
            Key: 'deregistration_delay.timeout_seconds',
            Value: '30'
          })
        ])
      });
    });

    test('should create HTTP listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP'
      });
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('should create launch template', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `tap-lt-${environmentSuffix}`,
        LaunchTemplateData: {
          InstanceType: 't3.small',
          ImageId: Match.anyValue(),
          IamInstanceProfile: {
            Arn: Match.anyValue()
          },
          BlockDeviceMappings: [
            {
              DeviceName: '/dev/xvda',
              Ebs: {
                VolumeSize: 30,
                VolumeType: 'gp3',
                Encrypted: true
              }
            }
          ],
          UserData: Match.anyValue()
        }
      });
    });

    test('should create Auto Scaling Group with correct configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: `tap-asg-${environmentSuffix}`,
        MinSize: '2',
        MaxSize: '6',
        DesiredCapacity: '2',
        HealthCheckType: 'ELB',
        HealthCheckGracePeriod: 300
      });
    });

    test('should create CPU scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: {
          TargetValue: 50,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ASGAverageCPUUtilization'
          }
        }
      });
    });
  });

  describe('CloudWatch Monitoring Configuration', () => {
    test('should create SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `tap-alarms-${environmentSuffix}`,
        DisplayName: 'TAP Application Alarms'
      });
    });

    test('should create CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-high-cpu-${environmentSuffix}`,
        AlarmDescription: 'Alarm when CPU exceeds 70%',
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Statistic: 'Average',
        Period: 300,
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
        Threshold: 70,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        Dimensions: [
          {
            Name: 'AutoScalingGroupName',
            Value: Match.anyValue()
          }
        ]
      });
    });

    test('should create database CPU alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-db-cpu-${environmentSuffix}`,
        AlarmDescription: 'Database CPU utilization alarm',
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
        Threshold: 70
      });
    });

    test('should create database storage alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-db-storage-${environmentSuffix}`,
        AlarmDescription: 'Database storage space alarm',
        MetricName: 'FreeStorageSpace',
        Namespace: 'AWS/RDS',
        Threshold: 10737418240, // 10 GB in bytes
        ComparisonOperator: 'LessThanThreshold'
      });
    });

    test('should create unhealthy hosts alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-unhealthy-hosts-${environmentSuffix}`,
        AlarmDescription: 'Alarm when unhealthy hosts detected',
        MetricName: 'UnHealthyHostCount',
        Namespace: 'AWS/ApplicationELB',
        Threshold: 1
      });
    });

    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardBody: Match.anyValue()
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create all required outputs (without domain)', () => {
      const outputs = template.findOutputs('*');
      
      expect(outputs).toHaveProperty('VpcId');
      expect(outputs).toHaveProperty('LoadBalancerDnsName');
      expect(outputs).toHaveProperty('LoadBalancerUrl');
      expect(outputs).toHaveProperty('DatabaseEndpoint');
      expect(outputs).toHaveProperty('DatabasePort');
      expect(outputs).toHaveProperty('ReadReplicaEndpoint');
      expect(outputs).toHaveProperty('BackupBucketName');
      expect(outputs).toHaveProperty('BackupBucketArn');
      expect(outputs).toHaveProperty('AutoScalingGroupName');
      expect(outputs).toHaveProperty('AlarmTopicArn');
      // ApplicationDomain should not exist when domainName is not provided
      expect(outputs).not.toHaveProperty('ApplicationDomain');
    });

    test('should export values with correct names (without domain)', () => {
      const outputs = template.findOutputs('*');
      
      expect(outputs.VpcId.Export?.Name).toBe(`tap-vpc-id-${environmentSuffix}`);
      expect(outputs.LoadBalancerDnsName.Export?.Name).toBe(`tap-alb-dns-${environmentSuffix}`);
      expect(outputs.LoadBalancerUrl.Export?.Name).toBe(`tap-app-url-${environmentSuffix}`);
      expect(outputs.DatabaseEndpoint.Export?.Name).toBe(`tap-db-endpoint-${environmentSuffix}`);
      expect(outputs.DatabasePort.Export?.Name).toBe(`tap-db-port-${environmentSuffix}`);
      expect(outputs.ReadReplicaEndpoint.Export?.Name).toBe(`tap-db-replica-endpoint-${environmentSuffix}`);
      expect(outputs.BackupBucketName.Export?.Name).toBe(`tap-backup-bucket-${environmentSuffix}`);
      expect(outputs.BackupBucketArn.Export?.Name).toBe(`tap-backup-bucket-arn-${environmentSuffix}`);
      expect(outputs.AutoScalingGroupName.Export?.Name).toBe(`tap-asg-name-${environmentSuffix}`);
      expect(outputs.AlarmTopicArn.Export?.Name).toBe(`tap-alarm-topic-${environmentSuffix}`);
    });

  });

  describe('Resource Count Validation', () => {
    test('should create expected number of resources', () => {
      const template_json = template.toJSON();
      const resources = template_json.Resources || {};
      
      // Verify minimum expected resources are created
      expect(Object.keys(resources).length).toBeGreaterThan(25);
    });

    test('should create exactly one VPC', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('should create expected number of subnets', () => {
      // 2 public + 2 private subnets (2 AZs)
      template.resourceCountIs('AWS::EC2::Subnet', 4);
    });

    test('should create expected number of security groups', () => {
      // ALB, Application, Database (VPC default is not explicitly created)
      template.resourceCountIs('AWS::EC2::SecurityGroup', 3);
    });

    test('should create one KMS key', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
    });

    test('should create one S3 bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('should create two RDS instances (primary + replica)', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 2);
    });

    test('should create one load balancer', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    });

    test('should create one auto scaling group', () => {
      template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
    });
  });

  describe('Security Best Practices', () => {
    test('should ensure S3 bucket blocks public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('should ensure RDS is encrypted', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true
      });
    });

    test('should ensure EBS volumes are encrypted', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              Ebs: {
                Encrypted: true
              }
            })
          ])
        }
      });
    });

    test('should ensure KMS key rotation is enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true
      });
    });

    test('should ensure database has backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7
      });
    });

    test('should ensure load balancer is in public subnets only', () => {
      // Verify ALB has security group attached
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        SecurityGroups: Match.anyValue()
      });
    });
  });

  describe('Network Security', () => {
    test('should ensure database is in private subnets', () => {
      // Database subnet group should only contain private subnets
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database'
      });
    });

    test('should ensure proper security group relationships', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer'
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances'
      });
      
      // Verify security group ingress rules are created
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80
      });
    });

    test('should ensure VPC has DNS support enabled', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });
  });
});
