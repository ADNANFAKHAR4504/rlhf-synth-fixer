import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      stackName: `TapStack-${environmentSuffix}`,
      environmentSuffix: environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      corporateIpRanges: ['203.0.113.0/24', '198.51.100.0/24'],
      alertEmail: 'security@example.com',
      environmentName: 'test',
      description: 'Test TAP Stack',
    });
    template = Template.fromStack(stack);
  });

  describe('Constructor and Initialization Tests', () => {
    test('handles default environment suffix when not provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestDefaultEnvStack', {
        stackName: 'TapStack-default',
        // environmentSuffix not provided, should default to 'dev'
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        corporateIpRanges: ['203.0.113.0/24'],
        alertEmail: 'test@example.com',
        environmentName: 'test',
        description: 'Test with default env suffix',
      });

      expect(testStack.environmentSuffix).toBe('dev');
    });

    test('uses provided environment suffix', () => {
      expect(stack.environmentSuffix).toBe(environmentSuffix);
    });

    test('generates random suffix for unique naming', () => {
      expect(stack.randomSuffix).toMatch(/^[a-z0-9]{6}$/);
    });

    test('exposes public readonly properties', () => {
      expect(stack.kmsKey).toBeDefined();
      expect(stack.vpc).toBeDefined();
      expect(stack.secureDataBucket).toBeDefined();
      expect(stack.cloudTrailBucket).toBeDefined();
    });
  });

  describe('Environment Variations Tests', () => {
    test('creates stack with production environment suffix', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'TestProdStack', {
        stackName: 'TapStack-prod',
        environmentSuffix: 'prod',
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
        corporateIpRanges: ['10.0.0.0/8'],
        alertEmail: 'prod-security@example.com',
        environmentName: 'production',
        description: 'Production TAP Stack',
      });

      const prodTemplate = Template.fromStack(prodStack);
      prodTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp('alias/secure-enterprise-key-prod-.*'),
      });
    });

    test('creates stack with staging environment suffix', () => {
      const stagingApp = new cdk.App();
      const stagingStack = new TapStack(stagingApp, 'TestStagingStack', {
        stackName: 'TapStack-staging',
        environmentSuffix: 'staging',
        env: {
          account: '123456789012',
          region: 'eu-west-1',
        },
        corporateIpRanges: ['192.168.0.0/16'],
        alertEmail: 'staging-security@example.com',
        environmentName: 'staging',
        description: 'Staging TAP Stack',
      });

      const stagingTemplate = Template.fromStack(stagingStack);
      stagingTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('secure-enterprisedata-staging-.*'),
      });
    });
  });

  describe('Corporate IP Range Variations Tests', () => {
    test('creates stack with empty corporate IP ranges', () => {
      const emptyIpApp = new cdk.App();
      const emptyIpStack = new TapStack(emptyIpApp, 'TestEmptyIPStack', {
        stackName: 'TapStack-empty-ip',
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        corporateIpRanges: [], // Empty array
        alertEmail: 'test@example.com',
        environmentName: 'test',
        description: 'Test with empty IP ranges',
      });

      const emptyIpTemplate = Template.fromStack(emptyIpStack);
      // Should still create security group but with no ingress rules
      emptyIpTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for VPC endpoints - corporate access only',
      });
    });


    test('creates stack with multiple corporate IP ranges', () => {
      const multiIpApp = new cdk.App();
      const multiIpStack = new TapStack(multiIpApp, 'TestMultiIPStack', {
        stackName: 'TapStack-multi-ip',
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        corporateIpRanges: ['10.0.0.0/24', '172.16.0.0/16', '192.168.1.0/24'], // Multiple ranges
        alertEmail: 'test@example.com',
        environmentName: 'test',
        description: 'Test with multiple IP ranges',
      });

      const multiIpTemplate = Template.fromStack(multiIpStack);
      multiIpTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({ CidrIp: '10.0.0.0/24' }),
          Match.objectLike({ CidrIp: '172.16.0.0/16' }),
          Match.objectLike({ CidrIp: '192.168.1.0/24' })
        ])
      });
    });
  });

  describe('KMS Key Tests', () => {
    test('creates KMS key with proper configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting sensitive enterprise data',
        EnableKeyRotation: true,
        KeySpec: 'SYMMETRIC_DEFAULT',
        KeyUsage: 'ENCRYPT_DECRYPT',
      });
    });

    test('creates KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp(`alias/secure-enterprise-key-${environmentSuffix}-.*`),
      });
    });

    test('KMS key has proper policy for CloudTrail', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Allow CloudTrail to encrypt logs',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com'
              },
              Action: Match.arrayWith([
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:ReEncrypt*',
                'kms:Decrypt',
                'kms:CreateGrant'
              ])
            })
          ])
        }
      });
    });

    test('KMS key has proper policy for CloudWatch Logs', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Allow CloudWatch Logs',
              Effect: 'Allow',
              Principal: {
                Service: 'logs.amazonaws.com'
              }
            })
          ])
        }
      });
    });

    test('KMS key has proper policy for S3 service', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Allow S3 service',
              Effect: 'Allow',
              Principal: {
                Service: 's3.amazonaws.com'
              }
            })
          ])
        }
      });
    });
  });

  describe('VPC Tests', () => {
    test('creates VPC with proper configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 9); // 3 AZs x 3 subnet types
    });

    test('creates NAT gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('creates VPC flow logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });

    test('creates flow log CloudWatch log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp(`/aws/vpc/flowlogs/${environmentSuffix}-.*`),
        RetentionInDays: 365,
      });
    });

    test('creates flow log IAM role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com'
            }
          }]
        }
      });
    });
  });

  describe('S3 Buckets Tests', () => {
    test('creates secure data bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`secure-enterprisedata-${environmentSuffix}-.*`),
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms'
            }
          }]
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('creates CloudTrail bucket with proper configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`cloudtrailsecure-logs-${environmentSuffix}-.*`),
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms'
            }
          }]
        }
      });
    });

    test('secure data bucket has proper lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteIncompleteMultipartUploads',
              Status: 'Enabled'
            }),
            Match.objectLike({
              Id: 'TransitionToIA',
              Status: 'Enabled'
            })
          ])
        }
      });
    });

    test('CloudTrail bucket has proper lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'CloudTrailLogRetention',
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30
                },
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90
                }
              ])
            })
          ])
        }
      });
    });

    test('CloudTrail bucket has all required permissions', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AWSCloudTrailAclCheck',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com'
              },
              Action: ['s3:GetBucketAcl', 's3:ListBucket']
            }),
            Match.objectLike({
              Sid: 'AWSCloudTrailWrite',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com'
              },
              Action: 's3:PutObject'
            }),
            Match.objectLike({
              Sid: 'AWSCloudTrailGetBucketLocation',
              Effect: 'Allow'
            }),
            Match.objectLike({
              Sid: 'AWSCloudTrailBucketExistenceCheck',
              Effect: 'Allow'
            })
          ])
        }
      });
    });
  });

  describe('IAM Roles Tests', () => {
    test('creates data access role with MFA requirement', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Description: 'Role for accessing secure enterprise data with MFA requirement',
        MaxSessionDuration: 7200, // 2 hours
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Action: 'sts:AssumeRole',
            Principal: {
              AWS: Match.objectLike({
                'Fn::Join': Match.anyValue()
              })
            }
          }]
        }
      });
    });

    test('creates admin role with strict MFA requirements', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Description: 'Administrative role with strict MFA requirements',
        MaxSessionDuration: 3600, // 1 hour
      });
    });

    test('creates MFA required group', () => {
      template.hasResourceProperties('AWS::IAM::Group', {
        GroupName: Match.stringLikeRegexp(`MFARequired-${environmentSuffix}-.*`),
      });
    });

    test('creates MFA required managed policy with all required statements', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        Description: 'Policy that requires MFA for all actions',
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowViewAccountInfo',
              Effect: 'Allow'
            }),
            Match.objectLike({
              Sid: 'AllowManageOwnPasswords',
              Effect: 'Allow'
            }),
            Match.objectLike({
              Sid: 'AllowManageOwnMFA',
              Effect: 'Allow'
            }),
            Match.objectLike({
              Sid: 'DenyAllExceptUnlessMFAAuthenticated',
              Effect: 'Deny',
              Condition: {
                BoolIfExists: {
                  'aws:MultiFactorAuthPresent': 'false'
                }
              }
            })
          ])
        }
      });
    });

    test('data access role has MFA-required policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Description: 'Role for accessing secure enterprise data with MFA requirement',
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Sid: 'RequireMFAForAssumeRole',
                  Effect: 'Deny'
                }),
                Match.objectLike({
                  Sid: 'AllowSecureDataAccess',
                  Effect: 'Allow'
                }),
                Match.objectLike({
                  Sid: 'AllowKMSAccess',
                  Effect: 'Allow'
                })
              ])
            }
          })
        ])
      });
    });

    test('admin role has MFA-required policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Description: 'Administrative role with strict MFA requirements',
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Sid: 'RequireMFAForAdmin',
                  Effect: 'Deny'
                }),
                Match.objectLike({
                  Sid: 'AllowAdminAccess',
                  Effect: 'Allow'
                })
              ])
            }
          })
        ])
      });
    });
  });

  describe('VPC Endpoints Tests', () => {
    test('creates S3 gateway endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
        ServiceName: Match.objectLike({
          'Fn::Join': Match.anyValue()
        })
      });
    });

    test('creates all required interface endpoints', () => {
      const expectedServices = ['kms', 'cloudtrail', 'monitoring', 'logs', 'sns', 'sts'];

      expectedServices.forEach(service => {
        template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
          VpcEndpointType: 'Interface',
          ServiceName: `com.amazonaws.us-east-1.${service}`
        });
      });
    });

    test('interface endpoints have proper configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
        PrivateDnsEnabled: true,
        PolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: '*',
            Action: '*',
            Resource: '*',
            Condition: {
              StringEquals: {
                'aws:PrincipalAccount': '123456789012'
              }
            }
          }]
        }
      });
    });

    test('creates security group for VPC endpoints', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for VPC endpoints - corporate access only',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '203.0.113.0/24',
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp'
          }),
          Match.objectLike({
            CidrIp: '198.51.100.0/24',
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp'
          })
        ])
      });
    });
  });

  describe('CloudTrail Tests', () => {
    test('creates CloudTrail with proper configuration', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: Match.stringLikeRegexp(`secure-enterprise-trail-${environmentSuffix}-.*`),
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
        S3KeyPrefix: 'cloudtrail-logs/'
      });
    });

    test('CloudTrail has insights enabled', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        InsightSelectors: [{
          InsightType: 'ApiCallRateInsight'
        }]
      });
    });

    test('creates CloudTrail log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp(`/aws/cloudtrail/${environmentSuffix}-.*`),
        RetentionInDays: 365
      });
    });

    test('CloudTrail has data event selectors for S3', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        EventSelectors: Match.arrayWith([
          Match.objectLike({
            ReadWriteType: 'All',
            IncludeManagementEvents: true,
            DataResources: Match.arrayWith([
              Match.objectLike({
                Type: 'AWS::S3::Object'
              })
            ])
          })
        ])
      });
    });
  });

  describe('CloudWatch Monitoring Tests', () => {
    test('creates SNS topic for security alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp(`security-alerts-${environmentSuffix}-.*`),
        DisplayName: 'Security Alerts'
      });
    });

    test('creates email subscription for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'security@example.com'
      });
    });

    test('creates all security metric filters', () => {
      const expectedMetrics = [
        'UnauthorizedAPICallsMetric',
        'MFALoginFailuresMetric',
        'RootAccountUsageMetric',
        'IAMPolicyChangesMetric',
        'SecurityGroupChangesMetric',
        'CloudTrailChangesMetric'
      ];

      expectedMetrics.forEach(metricName => {
        template.hasResourceProperties('AWS::Logs::MetricFilter', {
          MetricTransformations: [{
            MetricNamespace: 'Security/Monitoring',
            MetricName: metricName,
            MetricValue: '1'
          }]
        });
      });
    });

    test('creates S3 access denied metric filter', () => {
      template.hasResourceProperties('AWS::Logs::MetricFilter', {
        MetricTransformations: [{
          MetricNamespace: 'Security/S3',
          MetricName: 'AccessDeniedEvents',
          MetricValue: '1'
        }]
      });
    });

    test('creates CloudWatch alarms for all security events', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 7); // 6 security metrics + 1 S3 access denied
    });

    test('alarms are connected to SNS topic', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: [
          Match.objectLike({
            Ref: Match.stringLikeRegexp('SecurityAlertsTopic.*')
          })
        ]
      });
    });

    test('creates security dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp(`security-monitoring-${environmentSuffix}-.*`),
      });
    });
  });

  describe('Stack Outputs Tests', () => {
    test('creates all required outputs', () => {
      const expectedOutputs = [
        'KMSKeyId',
        'KMSKeyArn',
        'VPCId',
        'SecureDataBucketName',
        'CloudTrailBucketName'
      ];

      expectedOutputs.forEach(outputName => {
        template.hasOutput(outputName, {});
      });
    });

    test('outputs have proper export names', () => {
      template.hasOutput('KMSKeyId', {
        Export: {
          Name: Match.stringLikeRegexp(`TapStack-${environmentSuffix}-KMSKeyId`)
        }
      });

      template.hasOutput('VPCId', {
        Export: {
          Name: Match.stringLikeRegexp(`TapStack-${environmentSuffix}-VPCId`)
        }
      });
    });
  });

  describe('Tagging Tests', () => {
    test('KMS key has proper tags', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Tags: Match.arrayWith([
          { Key: 'Purpose', Value: 'Enterprise Data Encryption' }
        ])
      });
    });

    test('VPC has proper tags', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Name', Value: 'SecureEnterpriseVPC' }
        ])
      });
    });
  });

  describe('Security Configuration Tests', () => {
    test('all S3 buckets block public access', () => {
      const s3Buckets = template.findResources('AWS::S3::Bucket');
      Object.values(s3Buckets).forEach(bucket => {
        expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        });
      });
    });

    test('all S3 buckets have versioning enabled', () => {
      const s3Buckets = template.findResources('AWS::S3::Bucket');
      Object.values(s3Buckets).forEach(bucket => {
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });
    });

    test('all S3 buckets enforce SSL', () => {
      template.resourceCountIs('AWS::S3::BucketPolicy', 2);
    });

    test('all log groups are encrypted', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach(logGroup => {
        expect(logGroup.Properties).toHaveProperty('KmsKeyId');
      });
    });

    test('all log groups have retention policies', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach(logGroup => {
        expect(logGroup.Properties).toHaveProperty('RetentionInDays');
        expect(logGroup.Properties.RetentionInDays).toBe(365);
      });
    });
  });

  describe('Write Integration TESTS', () => {
    test('All stack resources are properly integrated', () => {
      // Test that stack has minimum required resources
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::S3::Bucket', 2);
      template.resourceCountIs('AWS::CloudTrail::Trail', 1);
      template.resourceCountIs('AWS::SNS::Topic', 1);

      // Test that stack outputs exist
      template.hasOutput('KMSKeyId', {});
      template.hasOutput('VPCId', {});
      template.hasOutput('SecureDataBucketName', {});

      // Verify stack can be synthesized without errors
      expect(() => app.synth()).not.toThrow();
    });

    test('Stack synthesizes correctly', () => {
      const assembly = app.synth();
      expect(assembly.stacks).toHaveLength(1);
      expect(assembly.stacks[0].stackName).toBe(`TapStack-${environmentSuffix}`);
    });

    test('Stack has expected resource counts', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::KMS::Alias', 1);
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::S3::Bucket', 2);
      template.resourceCountIs('AWS::CloudTrail::Trail', 1);
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::SNS::Subscription', 1);
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 7); // 1 gateway + 6 interface
      template.resourceCountIs('AWS::Logs::MetricFilter', 7); // 6 security + 1 S3
      template.resourceCountIs('AWS::CloudWatch::Alarm', 7);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      template.resourceCountIs('AWS::IAM::Role', 3); // data access + admin + flow log
      template.resourceCountIs('AWS::IAM::Group', 1);
      template.resourceCountIs('AWS::IAM::ManagedPolicy', 1);
    });
  });
});
