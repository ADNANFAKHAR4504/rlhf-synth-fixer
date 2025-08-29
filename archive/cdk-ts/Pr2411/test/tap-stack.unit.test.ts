import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack, TapApp } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Core Infrastructure', () => {
    test('VPC is created with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('VPC has public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
    });

    test('KMS Key is created with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('Secrets Manager secret is created', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: `Application secrets for tap ${environmentSuffix}`,
      });
    });

    test('DynamoDB table is created with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 500,
          WriteCapacityUnits: 500,
        },
      });
    });

    test('DynamoDB auto scaling is configured', () => {
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalableTarget', 2);
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalingPolicy', 2);
    });

    test('S3 bucket is created with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms'
            }
          }]
        },
      });
    });

    test('Lambda execution role is created with proper permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
          }]
        }
      });
    });

    test('Lambda security group is created', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 1);
    });

    test('Lambda function is created with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 512,
      });
    });

    test('API Gateway is created', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('API Gateway usage plan is configured', () => {
      template.resourceCountIs('AWS::ApiGateway::UsagePlan', 1);
    });

    test('WAF Web ACL is created', () => {
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);
    });

    test('CloudFront distribution is created', () => {
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    });

    test('X-Ray sampling rule is created', () => {
      template.resourceCountIs('AWS::XRay::SamplingRule', 1);
    });

    test('CloudWatch alarms are created', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
    });

    test('CloudWatch log group is created', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30,
      });
    });
  });

  describe('Outputs', () => {
    test('Stack outputs are created correctly', () => {
      template.hasOutput('ApiGatewayUrl', {});
      template.hasOutput('CloudFrontUrl', {});
      template.hasOutput('DynamoDBTableName', {});
      template.hasOutput('S3BucketName', {});
      template.hasOutput('LambdaFunctionName', {});
      template.hasOutput('UsagePlanId', {});
    });
  });

  describe('Conditional Features', () => {
    test('Domain-related resources are created when domain configuration is provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestDomainStack', { 
        environmentSuffix: 'test',
        domainName: 'example.com',
        hostedZoneId: 'Z1234567890'
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.resourceCountIs('AWS::CertificateManager::Certificate', 1);
      testTemplate.resourceCountIs('AWS::Route53::RecordSet', 1);
    });

    test('CI/CD pipeline resources are created when GitHub configuration is provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestCICDStack', { 
        environmentSuffix: 'test',
        githubOwner: 'testowner',
        githubRepo: 'testrepo'
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.resourceCountIs('AWS::CodeCommit::Repository', 1);
      testTemplate.resourceCountIs('AWS::CodeBuild::Project', 1);
      testTemplate.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
    });
  });

  describe('TapApp class', () => {
    test('TapApp creates a TapStack correctly', () => {
      const testApp = new cdk.App();
      // Use a different stack name to avoid conflicts
      const testStack = new TapStack(testApp, 'TestDirectTapStack', { 
        environmentSuffix: 'test' 
      });
      const testTemplate = Template.fromStack(testStack);
      
      expect(testTemplate).toBeDefined();
      testTemplate.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('TapApp constructor creates proper infrastructure', () => {
      const tapApp = new TapApp();
      expect(tapApp).toBeInstanceOf(cdk.App);
      
      // Verify the app has stacks
      expect(tapApp.node.children.length).toBeGreaterThan(0);
    });

    test('TapApp synth works correctly', () => {
      const tapApp = new TapApp();
      const assembly = tapApp.synth();
      
      expect(assembly).toBeDefined();
      expect(assembly.stacks.length).toBeGreaterThan(0);
    });
  });

  describe('Default Values', () => {
    test('Stack works with minimal configuration', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestMinimalStack', { 
        environmentSuffix: 'minimal'
      });
      const testTemplate = Template.fromStack(testStack);
      
      // Should still create core infrastructure with defaults
      testTemplate.resourceCountIs('AWS::EC2::VPC', 1);
      testTemplate.resourceCountIs('AWS::DynamoDB::Table', 1);
      testTemplate.resourceCountIs('AWS::Lambda::Function', 1);
    });
  });

  describe('Resource Naming with Randomness', () => {
    test('Resource names should include random suffix for uniqueness', () => {
      const testApp = new cdk.App();
      const testStack1 = new TapStack(testApp, 'TestRandomStack1', { 
        environmentSuffix: 'rand1' 
      });
      const testStack2 = new TapStack(testApp, 'TestRandomStack2', { 
        environmentSuffix: 'rand2' 
      });
      
      const template1 = Template.fromStack(testStack1);
      const template2 = Template.fromStack(testStack2);
      
      // Both stacks should have VPCs with different random suffixes
      template1.resourceCountIs('AWS::EC2::VPC', 1);
      template2.resourceCountIs('AWS::EC2::VPC', 1);
      
      // Names should be different due to random suffix
      expect(template1).not.toEqual(template2);
    });
  });

  describe('Environment Variables and Configuration', () => {
    test('Lambda environment variables are set correctly', () => {
      // Check that Lambda function has environment variables defined
      const lambdaResources = template.findResources('AWS::Lambda::Function');
      const lambdaResource = Object.values(lambdaResources)[0] as any;
      
      expect(lambdaResource.Properties.Environment.Variables.DYNAMODB_TABLE_NAME).toBeDefined();
      expect(lambdaResource.Properties.Environment.Variables.S3_BUCKET_NAME).toBeDefined();
      expect(lambdaResource.Properties.Environment.Variables.KMS_KEY_ID).toBeDefined();
    });

    test('Stack tags are applied correctly', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestTaggedStack', { 
        environmentSuffix: 'tagged',
        projectName: 'testproject',
        environment: 'testenv'
      });
      
      // Check that tags are applied by examining the template resources
      const testTemplate = Template.fromStack(testStack);
      const vpcResources = testTemplate.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(vpcResources)[0] as any;
      
      const tags = vpcResource.Properties.Tags;
      expect(tags.find((tag: any) => tag.Key === 'Project')?.Value).toBe('testproject');
      expect(tags.find((tag: any) => tag.Key === 'Environment')?.Value).toBe('testenv');
      expect(tags.find((tag: any) => tag.Key === 'ManagedBy')?.Value).toBe('CDK');
    });
  });

  describe('Security Configuration', () => {
    test('KMS encryption is enabled for all resources', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS'
        }
      });

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms'
            }
          }]
        }
      });
    });

    test('S3 bucket has proper security configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('Lambda function has proper IAM permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
          }]
        }
      });
    });

    test('Security groups are configured properly', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda functions',
        SecurityGroupEgress: [{
          CidrIp: '0.0.0.0/0',
          IpProtocol: '-1'
        }]
      });
    });
  });

  describe('Monitoring and Observability', () => {
    test('CloudWatch log groups have proper retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 30
      });
    });

    test('X-Ray tracing is enabled', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active'
        }
      });

      template.resourceCountIs('AWS::XRay::SamplingRule', 1);
    });

    test('API Gateway has logging and tracing enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        TracingEnabled: true,
        MethodSettings: [{
          LoggingLevel: 'INFO',
          DataTraceEnabled: true,
          MetricsEnabled: true,
          ResourcePath: '/*',
          HttpMethod: '*'
        }]
      });
    });
  });

  describe('High Availability and Scaling', () => {
    test('VPC spans multiple availability zones', () => {
      // VPC should have subnets in multiple AZs
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
    });

    test('DynamoDB auto scaling is configured correctly', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: {
          TargetValue: 70,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'DynamoDBReadCapacityUtilization'
          }
        }
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    test('Lambda function has timeout and memory configured', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 30,
        MemorySize: 512,
        ReservedConcurrentExecutions: 100
      });
    });

    test('API Gateway has usage plan for throttling', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        Throttle: {
          RateLimit: 1000,
          BurstLimit: 2000
        },
        Quota: {
          Limit: 1000000,
          Period: 'MONTH'
        }
      });
    });

    test('WAF is configured for security', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
        DefaultAction: { Allow: {} }
      });
      
      // Check that WAF has rules configured
      const wafResources = template.findResources('AWS::WAFv2::WebACL');
      const wafResource = Object.values(wafResources)[0] as any;
      expect(wafResource.Properties.Rules).toBeDefined();
      expect(wafResource.Properties.Rules.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Validation', () => {
    test('Stack handles different environment suffixes correctly', () => {
      const envSuffixes = ['dev', 'staging', 'prod', 'test123', 'pr456'];
      
      envSuffixes.forEach(suffix => {
        const testApp = new cdk.App();
        const testStack = new TapStack(testApp, `TestStack${suffix}`, { 
          environmentSuffix: suffix 
        });
        const testTemplate = Template.fromStack(testStack);
        
        // Should create all core resources regardless of environment suffix
        testTemplate.resourceCountIs('AWS::EC2::VPC', 1);
        testTemplate.resourceCountIs('AWS::DynamoDB::Table', 1);
        testTemplate.resourceCountIs('AWS::Lambda::Function', 1);
        testTemplate.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      });
    });

    test('Stack works with different project names', () => {
      const projectNames = ['myapp', 'test-project', 'prod-api', 'dev123'];
      
      projectNames.forEach(projectName => {
        const testApp = new cdk.App();
        const testStack = new TapStack(testApp, `TestProject${projectName}`, { 
          environmentSuffix: 'test',
          projectName: projectName
        });
        const testTemplate = Template.fromStack(testStack);
        
        testTemplate.resourceCountIs('AWS::EC2::VPC', 1);
        testTemplate.resourceCountIs('AWS::DynamoDB::Table', 1);
      });
    });

    test('Stack handles custom DynamoDB capacity settings', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestCustomCapacityStack', { 
        environmentSuffix: 'capacity-test',
        dynamoDbReadCapacity: 1000,
        dynamoDbWriteCapacity: 2000
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        ProvisionedThroughput: {
          ReadCapacityUnits: 1000,
          WriteCapacityUnits: 2000
        }
      });
    });
  });

  describe('TapApp', () => {
    test('TapApp creates stack correctly', () => {
      const tapApp = new TapApp();
      expect(tapApp).toBeInstanceOf(cdk.App);
      
      // Check that the app has the expected stack
      const stacks = tapApp.node.children;
      expect(stacks.length).toBeGreaterThan(0);
    });

    test('TapApp synth method works', () => {
      const tapApp = new TapApp();
      const synthResult = tapApp.synth();
      expect(synthResult).toBeDefined();
      expect(synthResult.stacks.length).toBeGreaterThan(0);
    });

    test('Direct execution scenario coverage', () => {
      // This test covers the direct execution logic by simulating it
      // The actual lines 741-742 cannot be covered in a normal test environment
      // since they only execute when the file is run directly (require.main === module)
      
      // We'll test the equivalent logic to ensure the behavior is correct
      const tapApp = new TapApp();
      expect(() => {
        tapApp.synth();
      }).not.toThrow();
      
      // Verify the synth result contains the expected stack
      const synthResult = tapApp.synth();
      expect(synthResult.stacks).toHaveLength(1);
      expect(synthResult.stacks[0].stackName).toMatch(/TapStack/);
    });
  });
});
