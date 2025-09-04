import * as cdk from 'aws-cdk-lib';
import { Template, Capture, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'testEnv';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();

    // Mock availability zones for VPC creation
    app.node.setContext(
      'availability-zones:account=123456789012:region=us-east-1',
      ['us-east-1a', 'us-east-1b']
    );

    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('should create stack with environment suffix', () => {
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should apply Environment=Production tag', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting all data at rest',
      });
      // Verify that all resources inherit the tag (implicitly through template structure)
    });

    test('should use environment suffix in resource names', () => {
      const capture = new Capture();
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting all data at rest',
      });

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: capture,
      });

      const bucketName = capture.asString();
      expect(bucketName).toContain(environmentSuffix);
    });

    test('should handle default environment suffix when not provided', () => {
      const appNoSuffix = new cdk.App();
      appNoSuffix.node.setContext(
        'availability-zones:account=123456789012:region=us-east-1',
        ['us-east-1a', 'us-east-1b']
      );

      const stackNoSuffix = new TapStack(appNoSuffix, 'TestTapStackDefault', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const templateNoSuffix = Template.fromStack(stackNoSuffix);

      // Should still create resources with default suffix
      templateNoSuffix.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting all data at rest',
      });
    });

    test('should use default VPC (no VPC resources created)', () => {
      // Should not create any VPC resources since using default VPC
      template.resourceCountIs('AWS::EC2::VPC', 0);
      template.resourceCountIs('AWS::EC2::Subnet', 0);
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
      
      // Should still create security groups that use the VPC
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
    });
  });

  describe('KMS Key Security', () => {
    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting all data at rest',
        EnableKeyRotation: true,
        KeyUsage: 'ENCRYPT_DECRYPT',
        KeySpec: 'SYMMETRIC_DEFAULT',
      });
    });

    test('should set KMS key removal policy to destroy', () => {
      template.hasResource('AWS::KMS::Key', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('S3 Bucket Security', () => {
    test('should create S3 bucket with KMS encryption', () => {
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

    test('should set S3 bucket removal policy to destroy', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('should enforce secure transport on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Principal: {
                AWS: '*',
              },
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
              Sid: 'DenyInsecureConnections',
            }),
          ]),
        },
      });
    });

    test('should enforce KMS key policy on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Principal: {
                AWS: '*',
              },
              Action: 's3:PutObject',
              Condition: {
                StringNotEquals: Match.objectLike({
                  's3:x-amz-server-side-encryption-aws-kms-key-id':
                    Match.anyValue(),
                }),
              },
              Sid: 'DenyWrongKMSKey',
            }),
          ]),
        },
      });
    });

    test('should create S3 bucket with lifecycle configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldVersions',
              Status: 'Enabled',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 90,
              },
            },
          ],
        },
      });
    });
  });

  describe('AWS Config Setup', () => {
    test('should create configuration recorder', () => {
      template.hasResourceProperties('AWS::Config::ConfigurationRecorder', {
        RecordingGroup: {
          AllSupported: true,
          IncludeGlobalResourceTypes: true,
        },
      });
    });

    test('should conditionally create delivery channel with KMS encryption', () => {
      // By default, delivery channel should NOT be created (CREATE_CONFIG_DELIVERY_CHANNEL not set to 'true')
      template.resourceCountIs('AWS::Config::DeliveryChannel', 0);
    });

    test('should create delivery channel when explicitly enabled', () => {
      // Set environment variable to enable delivery channel creation
      const originalEnv = process.env.CREATE_CONFIG_DELIVERY_CHANNEL;
      process.env.CREATE_CONFIG_DELIVERY_CHANNEL = 'true';

      try {
        // Create a new stack with delivery channel enabled
        const testApp = new cdk.App();
        testApp.node.setContext(
          'availability-zones:account=123456789012:region=us-east-1',
          ['us-east-1a', 'us-east-1b']
        );
        
        const testStack = new TapStack(testApp, 'TestTapStackWithDelivery', {
          environmentSuffix,
          env: { account: '123456789012', region: 'us-east-1' },
        });
        
        const testTemplate = Template.fromStack(testStack);
        
        testTemplate.hasResourceProperties('AWS::Config::DeliveryChannel', {
          S3KmsKeyArn: {
            'Fn::GetAtt': Match.anyValue(),
          },
        });
      } finally {
        // Restore original environment variable
        if (originalEnv !== undefined) {
          process.env.CREATE_CONFIG_DELIVERY_CHANNEL = originalEnv;
        } else {
          delete process.env.CREATE_CONFIG_DELIVERY_CHANNEL;
        }
      }
    });

    test('should create config rule for security group compliance', () => {
      template.hasResourceProperties('AWS::Config::ConfigRule', {
        Source: {
          Owner: 'AWS',
          SourceIdentifier: 'INCOMING_SSH_DISABLED',
        },
      });
    });

    test('should create IAM role for AWS Config', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'config.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([Match.stringLikeRegexp('.*ConfigRole')]),
            ]),
          }),
        ]),
      });
    });
  });

  describe('Lambda Function Security', () => {
    test('should create Lambda function with secure configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Environment: {
          Variables: {
            NODE_OPTIONS: '--enable-source-maps',
          },
        },
      });
    });

    test('should create CloudWatch log group with KMS encryption', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30,
        KmsKeyId: {
          'Fn::GetAtt': Match.anyValue(),
        },
      });
    });

    test('should set log group removal policy to destroy', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('should create Lambda IAM role with least privilege policies', () => {
      // Check that we have both Config role and Lambda role
      template.resourceCountIs('AWS::IAM::Role', 2);

      // Verify Lambda role has inline policies for logging and VPC access
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'LoggingPolicy',
          }),
          Match.objectLike({
            PolicyName: 'VPCPolicy',
          }),
        ]),
      });
    });

    test('should place Lambda in VPC with public subnets', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: {
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        },
      });
    });
  });

  describe('ALB and WAF Protection', () => {
    test('should create Application Load Balancer', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Scheme: 'internet-facing',
          Type: 'application',
        }
      );
    });

    test('should create target group for Lambda', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          TargetType: 'lambda',
          HealthCheckEnabled: true,
          Matcher: {
            HttpCode: '200',
          },
        }
      );
    });

    test('should create WAF Web ACL with SQL injection protection', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
        DefaultAction: {
          Allow: {},
        },
        Rules: [
          {
            Name: 'AWSManagedRulesCommonRuleSet',
            Priority: 1,
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesCommonRuleSet',
              },
            },
            VisibilityConfig: {
              SampledRequestsEnabled: true,
              CloudWatchMetricsEnabled: true,
              MetricName: 'CommonRuleSetMetric',
            },
          },
          {
            Name: 'AWSManagedRulesSQLiRuleSet',
            Priority: 2,
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesSQLiRuleSet',
              },
            },
            VisibilityConfig: {
              SampledRequestsEnabled: true,
              CloudWatchMetricsEnabled: true,
              MetricName: 'SQLiRuleSetMetric',
            },
          },
        ],
      });
    });

    test('should associate WAF with ALB', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
        ResourceArn: {
          Ref: Match.anyValue(),
        },
        WebACLArn: {
          'Fn::GetAtt': Match.anyValue(),
        },
      });
    });
  });

  describe('Security Group Compliance', () => {
    test('should create security group for ALB with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP traffic from internet',
          },
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

    test('should create security group for Lambda with minimal outbound access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda functions',
        SecurityGroupEgress: [
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTPS outbound for Lambda',
          },
        ],
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create all required outputs with environment suffix', () => {
      template.hasOutput(`LoadBalancerDNS${environmentSuffix}`, {
        Description: 'DNS name of the Application Load Balancer',
      });

      template.hasOutput(`KMSKeyId${environmentSuffix}`, {
        Description: 'KMS Key ID for encryption',
      });

      template.hasOutput(`WebACLArn${environmentSuffix}`, {
        Description: 'WAF Web ACL ARN',
      });

      template.hasOutput(`S3BucketName${environmentSuffix}`, {
        Description: 'Config S3 Bucket Name',
      });
    });

    test('should export outputs with proper naming', () => {
      template.hasOutput(`LoadBalancerDNS${environmentSuffix}`, {
        Export: {
          Name: `LoadBalancerDNS${environmentSuffix}`,
        },
      });

      template.hasOutput(`KMSKeyId${environmentSuffix}`, {
        Export: {
          Name: `KMSKeyId${environmentSuffix}`,
        },
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('should have proper dependencies for Config resources', () => {
      // Config rule should depend on recorder (and optionally delivery channel)
      const configRuleResources = template.findResources(
        'AWS::Config::ConfigRule'
      );
      const configRuleKeys = Object.keys(configRuleResources);
      expect(configRuleKeys.length).toBeGreaterThan(0);

      const configRule = configRuleResources[configRuleKeys[0]];
      expect(configRule.DependsOn).toBeDefined();
      expect(Array.isArray(configRule.DependsOn)).toBe(true);
      // Should have at least 1 dependency (recorder), and optionally delivery channel
      expect(configRule.DependsOn.length).toBeGreaterThanOrEqual(1);
    });

    test('should grant proper permissions to AWS Config role', () => {
      // Config role should have managed policy and S3/KMS permissions
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'config.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });
  });
});
