// Add these additional test cases to your existing test file

describe('TapStack Edge Cases and Coverage', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Environment Suffix Variations', () => {
    test('creates stack with custom environment suffix from props', () => {
      stack = new TapStack(app, 'TestTapStackCustom', {
        environmentSuffix: 'prod'
      });
      template = Template.fromStack(stack);

      // Verify environment suffix is used in log group names
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      expect(Object.keys(logGroups).length).toBe(2);

      Object.values(logGroups).forEach(logGroup => {
        expect(logGroup.Properties?.LogGroupName).toContain('prod');
      });
    });

    test('creates stack with environment suffix from context', () => {
      app.node.setContext('environmentSuffix', 'staging');
      stack = new TapStack(app, 'TestTapStackContext');
      template = Template.fromStack(stack);

      // Verify context value is used
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach(logGroup => {
        expect(logGroup.Properties?.LogGroupName).toContain('staging');
      });
    });

    test('uses default environment suffix when none provided', () => {
      stack = new TapStack(app, 'TestTapStackDefault');
      template = Template.fromStack(stack);

      // Should default to 'dev'
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach(logGroup => {
        expect(logGroup.Properties?.LogGroupName).toContain('dev');
      });
    });
  });

  describe('Resource Count Validations', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('creates exactly expected number of each resource type', () => {
      // Core infrastructure
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 1);
      template.resourceCountIs('AWS::EC2::Instance', 1);
      template.resourceCountIs('AWS::EC2::FlowLog', 1);

      // Storage and logging
      template.resourceCountIs('AWS::S3::Bucket', 3);
      template.resourceCountIs('AWS::S3::BucketPolicy', 3);
      template.resourceCountIs('AWS::Logs::LogGroup', 2);

      // IAM and security
      template.resourceCountIs('AWS::IAM::Role', 2);
      template.resourceCountIs('AWS::IAM::InstanceProfile', 1);
      template.resourceCountIs('AWS::CloudTrail::Trail', 1);

      // Outputs and parameters
      template.hasOutput('VpcId', {});
      template.hasOutput('AppDataBucketName', {});
      template.hasOutput('WebAppSecurityGroupId', {});
      template.hasOutput('WebAppRoleArn', {});
      template.hasOutput('CloudTrailArn', {});
      template.hasParameter('WhitelistedIngressCidr', {});
    });
  });

  describe('S3 Bucket Configuration Details', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('all buckets have required security configurations', () => {
      const buckets = template.findResources('AWS::S3::Bucket');

      Object.values(buckets).forEach(bucket => {
        const props = bucket.Properties;

        // All buckets should have encryption
        expect(props?.BucketEncryption).toBeDefined();
        expect(props?.BucketEncryption?.ServerSideEncryptionConfiguration).toBeDefined();

        // All buckets should block public access
        expect(props?.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        });
      });
    });

    test('app data bucket has versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        // Should also have access logging configured
        LoggingConfiguration: Match.objectLike({
          DestinationBucketName: Match.anyValue(),
          LogFilePrefix: 'access-logs/'
        })
      });
    });

    test('lifecycle rules are properly configured', () => {
      // CloudTrail bucket lifecycle
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'CloudTrailLogsRetention',
              Status: 'Enabled',
              ExpirationInDays: 365,
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30
                },
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90
                }
              ]
            }
          ]
        }
      });

      // Access logs bucket lifecycle
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'AccessLogsRetention',
              Status: 'Enabled',
              ExpirationInDays: 90,
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30
                }
              ]
            }
          ]
        }
      });
    });
  });

  describe('IAM Policy Comprehensive Validation', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('VPC Flow Logs role has comprehensive permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Description: 'Role for VPC Flow Logs to write to CloudWatch Logs',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ]
        },
        Policies: [
          {
            PolicyName: 'FlowLogsDeliveryPolicy',
            PolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                    'logs:DescribeLogGroups',
                    'logs:DescribeLogStreams'
                  ],
                  Resource: Match.anyValue()
                }
              ]
            }
          }
        ]
      });
    });

    test('WebApp role has all three policy statements', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Description: 'IAM role for web application EC2 instances with least privilege access',
        Policies: [
          {
            PolicyName: 'WebAppPolicy',
            PolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                // Should have exactly 3 statements
                Match.objectLike({ Sid: 'S3ReadAccess' }),
                Match.objectLike({ Sid: 'CloudWatchLogsAccess' }),
                Match.objectLike({ Sid: 'CloudWatchMetricsAccess' })
              ]
            }
          }
        ]
      });
    });
  });

  describe('Tagging Consistency', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('all major resources have consistent tagging', () => {
      const expectedBaseTags = [
        { Key: 'Environment', Value: 'Prod' },
        { Key: 'Department', Value: 'Marketing' },
        { Key: 'Project', Value: 'SecureWebApp' },
        { Key: 'ManagedBy', Value: 'CDK' },
        { Key: 'SecurityReview', Value: 'Required' }
      ];

      // Check VPC
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith(expectedBaseTags)
      });

      // Check Security Group  
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        Tags: Match.arrayWith(expectedBaseTags)
      });

      // Check EC2 Instance
      template.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith(expectedBaseTags)
      });

      // Check S3 Buckets
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expectedBaseTags.forEach(tag => {
          expect(bucket.Properties?.Tags).toEqual(
            expect.arrayContaining([tag])
          );
        });
      });
    });
  });

  describe('Network Security Validation', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('EC2 instance is deployed in private subnet', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        SubnetId: {
          Ref: Match.stringLikeRegexp('SecureVpc.*PrivateSubnet.*')
        }
      });
    });

    test('security group has no SSH access', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');

      Object.values(securityGroups).forEach(sg => {
        const ingressRules = sg.Properties?.SecurityGroupIngress || [];

        // Ensure no SSH (port 22) rules exist
        ingressRules.forEach((rule: any) => {
          expect(rule.FromPort).not.toBe(22);
          expect(rule.ToPort).not.toBe(22);
        });
      });
    });

    test('VPC flow logs capture all traffic types', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 'cloud-watch-logs',
        LogDestination: Match.anyValue(),
        DeliverLogsPermissionArn: Match.anyValue()
      });
    });
  });

  describe('CloudTrail Security Configuration', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('CloudTrail has comprehensive audit configuration', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
        IsLogging: true,
        S3BucketName: Match.anyValue()
      });
    });

    test('CloudTrail bucket has proper dependencies', () => {
      const trail = template.findResources('AWS::CloudTrail::Trail');
      const trailResource = Object.values(trail)[0];

      expect(trailResource.DependsOn).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/CloudTrailLogsBucketPolicy.*/)
        ])
      );
    });
  });

  describe('Resource Naming and Uniqueness', () => {
    test('resources have unique names across multiple stacks', () => {
      const stack1 = new TapStack(app, 'TestStack1', { environmentSuffix: 'env1' });
      const stack2 = new TapStack(app, 'TestStack2', { environmentSuffix: 'env2' });

      const template1 = Template.fromStack(stack1);
      const template2 = Template.fromStack(stack2);

      // Get bucket names from both stacks
      const buckets1 = template1.findResources('AWS::S3::Bucket');
      const buckets2 = template2.findResources('AWS::S3::Bucket');

      const bucketNames1 = Object.values(buckets1).map(b => b.Properties?.BucketName);
      const bucketNames2 = Object.values(buckets2).map(b => b.Properties?.BucketName);

      // Ensure no bucket names collide between stacks
      bucketNames1.forEach(name1 => {
        bucketNames2.forEach(name2 => {
          expect(name1).not.toEqual(name2);
        });
      });
    });
  });
});