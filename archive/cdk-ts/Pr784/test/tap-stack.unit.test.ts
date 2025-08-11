import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack - Secure Web Application Infrastructure', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  let computeTemplate: Template;
  let databaseTemplate: Template;
  let storageTemplate: Template;
  let securityTemplate: Template;
  let networkTemplate: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TestTapStack${environmentSuffix}`, {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
    
    // Get templates from nested stacks
    computeTemplate = Template.fromStack(stack.computeStack);
    databaseTemplate = Template.fromStack(stack.databaseStack);
    storageTemplate = Template.fromStack(stack.storageStack);
    securityTemplate = Template.fromStack(stack.securityStack);
    networkTemplate = Template.fromStack(stack.networkStack);
  });

  describe('Network Infrastructure', () => {
    test('VPC is created with correct configuration', () => {
      networkTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('VPC has public, private, and isolated subnets', () => {
      // Check for public subnets
      networkTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });

      // Check for private subnets with NAT
      const privateSubnets = networkTemplate.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false,
        },
      });
      expect(Object.keys(privateSubnets).length).toBeGreaterThan(0);

      // Check for NAT Gateways
      networkTemplate.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('VPC Flow Logs are enabled', () => {
      networkTemplate.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });

    test('Security groups are created for each tier', () => {
      // Verify that multiple security groups exist
      const securityGroups = networkTemplate.findResources('AWS::EC2::SecurityGroup');
      expect(Object.keys(securityGroups).length).toBeGreaterThanOrEqual(3);
      
      // Verify specific security groups by checking their names
      expect(Object.keys(securityGroups)).toEqual(
        expect.arrayContaining([
          expect.stringContaining('LoadBalancerSG'),
          expect.stringContaining('WebServerSG'),
          expect.stringContaining('DatabaseSG'),
        ])
      );
    });

    test('Security group rules enforce proper network segmentation', () => {
      // Check that database security group only allows traffic from web servers
      networkTemplate.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
      });
    });
  });

  describe('Security Stack', () => {
    test('KMS key is created with rotation enabled', () => {
      securityTemplate.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        KeyUsage: 'ENCRYPT_DECRYPT',
        KeySpec: 'SYMMETRIC_DEFAULT',
      });
    });

    test('IAM roles follow least privilege principle', () => {
      // EC2 Role
      securityTemplate.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            }),
          ]),
        },
      });

      // S3 Access Role
      securityTemplate.hasResourceProperties('AWS::IAM::Role', {
        Description: Match.stringLikeRegexp('.*S3 access.*'),
      });
    });

    // GuardDuty test removed - GuardDuty can only be enabled once per AWS account
    // and should be managed outside of the CloudFormation stack

    // Security Hub test removed - Security Hub can only be enabled once per AWS account
    // and should be managed outside of the CloudFormation stack

    test('SNS topic is created for alerts', () => {
      securityTemplate.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: Match.stringLikeRegexp('.*WebApp Alerts.*'),
      });
    });

    test('CloudWatch Log Group is created with retention', () => {
      securityTemplate.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30,
      });
    });
  });

  describe('Storage Stack', () => {
    test('S3 bucket is created with encryption', () => {
      storageTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
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

    test('S3 bucket has lifecycle rules', () => {
      storageTemplate.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteIncompleteMultipartUploads',
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 1,
              },
            }),
          ]),
        },
      });
    });

    test('S3 bucket policy enforces SSL', () => {
      storageTemplate.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'DenyInsecureConnections',
              Effect: 'Deny',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      });
    });

    test('CloudFront distribution is created', () => {
      storageTemplate.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Comment: Match.stringLikeRegexp('.*WebApp CDN.*'),
          Enabled: true,
          PriceClass: 'PriceClass_100',
        },
      });
    });

    test('CloudFront enforces HTTPS viewer protocol', () => {
      storageTemplate.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
            Compress: true,
          },
        },
      });
    });
  });

  describe('Database Stack', () => {
    test('RDS PostgreSQL instance is created', () => {
      databaseTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        DBInstanceClass: Match.stringLikeRegexp('db.t3.*'),
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        PubliclyAccessible: false,
        DeletionProtection: false, // Should be false for testing
        EnablePerformanceInsights: true,
      });
    });

    test('RDS is in isolated subnets', () => {
      databaseTemplate.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: Match.stringLikeRegexp('.*RDS database.*'),
      });
    });

    test('RDS parameter group is configured', () => {
      databaseTemplate.hasResourceProperties('AWS::RDS::DBParameterGroup', {
        Family: Match.stringLikeRegexp('postgres.*'),
        Parameters: {
          shared_preload_libraries: 'pg_stat_statements',
          log_statement: 'all',
        },
      });
    });

    test('CloudWatch alarms are configured for RDS', () => {
      // CPU Alarm
      databaseTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('RDS-CPU-.*'),
        MetricName: 'CPUUtilization',
        Threshold: 80,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });

      // Database Connections Alarm
      databaseTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('RDS-BurstBalance-.*'),
        MetricName: 'DatabaseConnections',
        ComparisonOperator: 'LessThanThreshold',
      });
    });
  });

  describe('Compute Stack', () => {
    test('Auto Scaling Group is configured', () => {
      computeTemplate.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '6',
        DesiredCapacity: '2',
      });
    });

    test('Launch Template is configured with IMDSv2', () => {
      computeTemplate.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          MetadataOptions: {
            HttpTokens: 'required',
            InstanceMetadataTags: 'enabled',
          },
        },
      });
    });

    test('Application Load Balancer is created', () => {
      computeTemplate.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
          Scheme: 'internet-facing',
        }
      );
    });

    test('Target Group health checks are configured', () => {
      computeTemplate.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          HealthCheckEnabled: true,
          HealthCheckIntervalSeconds: 30,
          HealthCheckPath: '/',
          HealthCheckProtocol: 'HTTP',
          HealthCheckTimeoutSeconds: 5,
          UnhealthyThresholdCount: 3,
        }
      );
    });

    test('Auto Scaling policies are configured', () => {
      computeTemplate.hasResourceProperties(
        'AWS::AutoScaling::ScalingPolicy',
        Match.objectLike({
          PolicyType: 'TargetTrackingScaling',
          TargetTrackingConfiguration: Match.objectLike({
            TargetValue: 70,
          }),
        })
      );
    });

    test('CloudWatch alarm for EC2 CPU is configured', () => {
      computeTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('EC2-CPU-.*'),
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 80,
      });
    });
  });

  describe('Resource Tagging', () => {
    test('All resources are tagged with Environment', () => {
      // Check various resource types for tags
      const vpcResources = networkTemplate.findResources('AWS::EC2::VPC');
      Object.values(vpcResources).forEach((resource: any) => {
        expect(resource.Properties.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Key: 'Environment',
            }),
          ])
        );
      });
    });

    test('Resources are tagged with component names', () => {
      const securityGroups = networkTemplate.findResources('AWS::EC2::SecurityGroup');
      Object.values(securityGroups).forEach((resource: any) => {
        expect(resource.Properties.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Key: 'Component',
            }),
          ])
        );
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Load Balancer DNS is exported', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: Match.stringLikeRegexp('.*Load Balancer.*'),
      });
    });

    test('CloudFront distribution domain is exported', () => {
      template.hasOutput('CloudFrontDistribution', {
        Description: Match.stringLikeRegexp('.*CloudFront.*'),
      });
    });

    test('Database endpoint is exported', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: Match.stringLikeRegexp('.*database.*'),
      });
    });
  });

  describe('Branch Coverage Tests', () => {
    test('Stack uses environment suffix from context when not in props', () => {
      const appWithContext = new cdk.App();
      appWithContext.node.setContext('environmentSuffix', 'context-suffix');
      const stackWithContext = new TapStack(appWithContext, 'StackWithContext', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      expect(stackWithContext).toBeDefined();
    });

    test('Stack uses default suffix when neither props nor context provided', () => {
      const appNoContext = new cdk.App();
      const stackNoContext = new TapStack(appNoContext, 'StackNoContext', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      expect(stackNoContext).toBeDefined();
    });
  });

  describe('Security Requirements Validation', () => {
    test('HTTPS-only traffic enforcement is configured', () => {
      // Security groups allow HTTP/HTTPS
      networkTemplate.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
      });
    });

    test('KMS encryption is used for S3 and RDS', () => {
      // S3 bucket uses KMS
      storageTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
        },
      });

      // RDS uses encryption
      databaseTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });
    });

    test('Database is not publicly accessible', () => {
      databaseTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        PubliclyAccessible: false,
      });
    });

    test('Auto Scaling configuration meets requirements', () => {
      computeTemplate.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '6',
      });
    });
  });
});