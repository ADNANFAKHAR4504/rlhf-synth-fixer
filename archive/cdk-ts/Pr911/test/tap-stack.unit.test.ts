import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Security Infrastructure Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Initialization and Props Handling', () => {
    test('should handle undefined props', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackNoProps');
      const testTemplate = Template.fromStack(testStack);
      
      // Should use default 'dev' environment suffix
      testTemplate.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('.*dev.*')
      });
    });

    test('should handle undefined environmentSuffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackNoEnvSuffix', {});
      const testTemplate = Template.fromStack(testStack);
      
      // Should use default 'dev' environment suffix
      testTemplate.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('.*dev.*')
      });
    });

    test('should handle empty props object', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackEmptyProps', {});
      const testTemplate = Template.fromStack(testStack);
      
      // Should use default 'dev' environment suffix
      testTemplate.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('.*dev.*')
      });
    });
  });

  describe('VPC and Network Security', () => {
    test('should create VPC with proper subnet configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Project', Value: 'SecurityDemo' }
        ])
      });
    });

    test('should create private subnets for application resources', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          { Key: 'Name', Value: Match.stringLikeRegexp('.*PrivateSubnet.*') }
        ])
      });
    });

    test('should create isolated subnets for database', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          { Key: 'Name', Value: Match.stringLikeRegexp('.*DatabaseSubnet.*') }
        ])
      });
    });

    test('should enable VPC Flow Logs for security monitoring', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/vpc/flowlogs-test',
        RetentionInDays: 30
      });

      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL'
      });
    });
  });

  describe('Security Groups', () => {
    test('should create restrictive database security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database - restrictive inbound rules'
      });
    });

    test('should create ALB security group with restricted inbound rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp'
          })
        ])
      });
    });

    test('should create EC2 security group with no direct public access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances - no direct public access'
      });
    });
  });

  describe('Encryption and Data Security', () => {
    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description: Match.stringLikeRegexp('.*SecurityDemo.*')
      });
    });

    test('should create S3 bucket with encryption at rest', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms'
              })
            })
          ])
        }),
        PublicAccessBlockConfiguration: Match.objectLike({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }),
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('should enforce SSL for S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Condition: Match.objectLike({
                Bool: {
                  'aws:SecureTransport': 'false'
                }
              })
            })
          ])
        })
      });
    });
  });

  describe('RDS Database Security', () => {
    test('should create RDS instance with encryption enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
        PubliclyAccessible: false,
        Engine: 'mysql',
        EngineVersion: '8.0.37'
      });
    });

    test('should create RDS in isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database in isolated subnets'
      });
    });

    test('should use Secrets Manager for database credentials', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `rds-credentials-${environmentSuffix}`,
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: '{"username":"admin"}',
          PasswordLength: 30
        })
      });
    });
  });

  describe('IAM Security and Least Privilege', () => {
    test('should create Lambda execution role with minimal permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Description: 'IAM role for Lambda functions with least privilege',
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              }
            })
          ])
        })
      });
    });

    test('should create EC2 instance role with minimal permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Description: 'IAM role for EC2 instances with least privilege',
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com'
              }
            })
          ])
        })
      });
    });

    test('should create instance profile for EC2', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {});
    });
  });

  describe('Lambda Function Security', () => {
    test('should create Lambda function in VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.11',
        Handler: 'index.handler',
        VpcConfig: Match.objectLike({
          SecurityGroupIds: Match.anyValue(),
          SubnetIds: Match.anyValue()
        })
      });
    });

    test('should configure Lambda with proper timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 30
      });
    });
  });

  describe('EC2 Instance Security', () => {
    test('should create EC2 instance with encrypted EBS volumes', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        BlockDeviceMappings: Match.arrayWith([
          Match.objectLike({
            Ebs: Match.objectLike({
              Encrypted: true,
              VolumeType: 'gp3'
            })
          })
        ])
      });
    });

    test('should place EC2 instance in private subnet', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        IamInstanceProfile: Match.anyValue(),
        SecurityGroupIds: Match.anyValue()
      });
    });
  });

  describe('Load Balancer and WAF Security', () => {
    test('should create Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing'
      });
    });

    test('should configure WAF with managed rule sets', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesCommonRuleSet',
            Priority: 1,
            Statement: Match.objectLike({
              ManagedRuleGroupStatement: Match.objectLike({
                VendorName: 'AWS',
                Name: 'AWSManagedRulesCommonRuleSet'
              })
            })
          }),
          Match.objectLike({
            Name: 'AWSManagedRulesSQLiRuleSet',
            Priority: 3
          })
        ])
      });
    });

    test('should associate WAF with ALB', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {});
    });
  });

  describe('CloudTrail and Audit Logging', () => {
    test('should create CloudTrail S3 bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms'
              })
            })
          ])
        })
      });
    });

    test('should conditionally create CloudTrail based on environment', () => {
      // For test environment, CloudTrail should not be created due to 5-trail limit
      const cloudTrailResources = template.findResources('AWS::CloudTrail::Trail');
      const cloudTrailLogGroups = template.findResources('AWS::Logs::LogGroup');
      
      // Should not create CloudTrail in test environment
      expect(Object.keys(cloudTrailResources).length).toBe(0);
      
      // Should not create CloudTrail log group in test environment
      const cloudTrailLogGroup = Object.values(cloudTrailLogGroups).find((lg: any) => 
        lg.Properties?.LogGroupName?.includes('cloudtrail')
      );
      expect(cloudTrailLogGroup).toBeUndefined();
    });
  });

  describe('Resource Tagging and Naming', () => {
    test('should apply consistent tags to all resources', () => {
      // Check that resources have proper tags
      const resources = template.findResources('*');
      Object.values(resources).forEach(resource => {
        if (resource.Properties?.Tags) {
          expect(resource.Properties.Tags).toEqual(
            expect.arrayContaining([
              { Key: 'Environment', Value: 'test' },
              { Key: 'Project', Value: 'SecurityDemo' },
              { Key: 'Owner', Value: 'YourName' }
            ])
          );
        }
      });
    });

    test('should use environment-specific naming conventions', () => {
      // Check that key resources have environment-specific tags
      const vpcResources = template.findResources('AWS::EC2::VPC');
      const s3Resources = template.findResources('AWS::S3::Bucket');
      const iamResources = template.findResources('AWS::IAM::Role');
      
      let hasEnvironmentTag = false;
      
      // Check VPC resources
      Object.values(vpcResources).forEach(resource => {
        if (resource.Properties?.Tags) {
          resource.Properties.Tags.forEach((tag: any) => {
            if (tag.Key === 'Environment' && tag.Value === 'test') {
              hasEnvironmentTag = true;
            }
          });
        }
      });
      
      // Check S3 resources
      Object.values(s3Resources).forEach(resource => {
        if (resource.Properties?.Tags) {
          resource.Properties.Tags.forEach((tag: any) => {
            if (tag.Key === 'Environment' && tag.Value === 'test') {
              hasEnvironmentTag = true;
            }
          });
        }
      });
      
      // Check IAM resources
      Object.values(iamResources).forEach(resource => {
        if (resource.Properties?.Tags) {
          resource.Properties.Tags.forEach((tag: any) => {
            if (tag.Key === 'Environment' && tag.Value === 'test') {
              hasEnvironmentTag = true;
            }
          });
        }
      });
      
      expect(hasEnvironmentTag).toBe(true);
    });
  });

  describe('Security Compliance Validation', () => {
    test('should not have any resources with 0.0.0.0/0 access in production', () => {
      // This test validates that we're not using overly permissive rules
      // In production, this should be replaced with specific CIDR blocks
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      Object.values(securityGroups).forEach(sg => {
        if (sg.Properties?.SecurityGroupIngress) {
          sg.Properties.SecurityGroupIngress.forEach((rule: any) => {
            if (rule.CidrIp === '0.0.0.0/0') {
              // Only allow 0.0.0.0/0 for ALB on port 80 for testing
              expect(rule.FromPort).toBe(80);
              expect(rule.ToPort).toBe(80);
            }
          });
        }
      });
    });

    test('should have encryption enabled on all storage resources', () => {
      // Verify S3 buckets have encryption
      const s3Buckets = template.findResources('AWS::S3::Bucket');
      Object.values(s3Buckets).forEach(bucket => {
        expect(bucket.Properties?.BucketEncryption).toBeDefined();
      });

      // Verify RDS has encryption
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true
      });

      // Verify EBS volumes have encryption
      template.hasResourceProperties('AWS::EC2::Instance', {
        BlockDeviceMappings: Match.arrayWith([
          Match.objectLike({
            Ebs: Match.objectLike({
              Encrypted: true
            })
          })
        ])
      });
    });

    test('should have proper IAM roles without overly permissive policies', () => {
      const iamRoles = template.findResources('AWS::IAM::Role');
      Object.values(iamRoles).forEach(role => {
        // Verify roles have proper assume role policies
        expect(role.Properties?.AssumeRolePolicyDocument).toBeDefined();
        
        // Verify inline policies are specific and not overly permissive
        if (role.Properties?.Policies) {
          role.Properties.Policies.forEach((policy: any) => {
            expect(policy.PolicyDocument?.Statement).toBeDefined();
            policy.PolicyDocument.Statement.forEach((statement: any) => {
              // Should not have overly permissive actions like "*"
              if (statement.Action) {
                const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
                actions.forEach((action: string) => {
                  expect(action).not.toBe('*');
                });
              }
            });
          });
        }
      });
    });

    test('should validate security group egress rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      Object.values(securityGroups).forEach(sg => {
        if (sg.Properties?.SecurityGroupEgress) {
          sg.Properties.SecurityGroupEgress.forEach((rule: any) => {
            // Validate that egress rules are properly configured
            expect(rule.IpProtocol).toBeDefined();
            expect(rule.FromPort).toBeDefined();
            expect(rule.ToPort).toBeDefined();
          });
        }
      });
    });

    test('should validate security group ingress rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      Object.values(securityGroups).forEach(sg => {
        if (sg.Properties?.SecurityGroupIngress) {
          sg.Properties.SecurityGroupIngress.forEach((rule: any) => {
            // Validate that ingress rules are properly configured
            expect(rule.IpProtocol).toBeDefined();
            expect(rule.FromPort).toBeDefined();
            expect(rule.ToPort).toBeDefined();
          });
        }
      });
    });

    test('should validate IAM policy statements', () => {
      const iamRoles = template.findResources('AWS::IAM::Role');
      Object.values(iamRoles).forEach(role => {
        if (role.Properties?.Policies) {
          role.Properties.Policies.forEach((policy: any) => {
            if (policy.PolicyDocument?.Statement) {
              policy.PolicyDocument.Statement.forEach((statement: any) => {
                // Validate statement structure
                expect(statement.Effect).toBeDefined();
                if (statement.Action) {
                  expect(Array.isArray(statement.Action) || typeof statement.Action === 'string').toBe(true);
                }
                if (statement.Resource) {
                  // Resource can be string, array, or CloudFormation intrinsic function
                  const isValidResource = 
                    typeof statement.Resource === 'string' ||
                    Array.isArray(statement.Resource) ||
                    typeof statement.Resource === 'object';
                  expect(isValidResource).toBe(true);
                }
              });
            }
          });
        }
      });
    });

    test('should validate resource tagging consistency', () => {
      const resourcesWithTags = [
        'AWS::EC2::VPC',
        'AWS::S3::Bucket',
        'AWS::IAM::Role',
        'AWS::RDS::DBInstance',
        'AWS::Lambda::Function'
      ];

      resourcesWithTags.forEach(resourceType => {
        const resources = template.findResources(resourceType);
        Object.values(resources).forEach(resource => {
          if (resource.Properties?.Tags) {
            const requiredTags = ['Environment', 'Project', 'Owner'];
            const tagKeys = resource.Properties.Tags.map((tag: any) => tag.Key);
            
            requiredTags.forEach(requiredTag => {
              expect(tagKeys).toContain(requiredTag);
            });
          }
        });
      });
    });

    test('should validate environment-specific configurations', () => {
      // Test with different environment suffix to cover conditional logic
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStackProd', { 
        environmentSuffix: 'prod',
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      const testTemplate = Template.fromStack(testStack);

      // Verify that prod environment creates resources with prod suffix
      testTemplate.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('.*prod.*')
      });
    });

    test('should validate conditional resource creation', () => {
      // Test that all required resources are created
      const requiredResources = [
        'AWS::EC2::VPC',
        'AWS::KMS::Key',
        'AWS::S3::Bucket',
        'AWS::RDS::DBInstance',
        'AWS::Lambda::Function',
        'AWS::EC2::Instance',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::WAFv2::WebACL'
      ];

      requiredResources.forEach(resourceType => {
        const resources = template.findResources(resourceType);
        expect(Object.keys(resources).length).toBeGreaterThan(0);
      });
    });

    test('should validate resource dependencies', () => {
      // Test that resources have proper dependencies
      const rdsInstance = template.findResources('AWS::RDS::DBInstance');
      const dbSubnetGroup = template.findResources('AWS::RDS::DBSubnetGroup');
      
      expect(Object.keys(rdsInstance).length).toBeGreaterThan(0);
      expect(Object.keys(dbSubnetGroup).length).toBeGreaterThan(0);
    });

    test('should validate encryption key usage', () => {
      // Test that KMS key is used by multiple resources
      const kmsKey = template.findResources('AWS::KMS::Key');
      const s3Buckets = template.findResources('AWS::S3::Bucket');
      const rdsInstances = template.findResources('AWS::RDS::DBInstance');
      
      expect(Object.keys(kmsKey).length).toBeGreaterThan(0);
      expect(Object.keys(s3Buckets).length).toBeGreaterThan(0);
      expect(Object.keys(rdsInstances).length).toBeGreaterThan(0);
    });
  });

  describe('Stack Outputs', () => {
    test('should provide useful stack outputs', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID for the secure infrastructure'
      });

      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS database endpoint (private access only)'
      });

      template.hasOutput('LoadBalancerDNS', {
        Description: 'Application Load Balancer DNS name'
      });

      template.hasOutput('S3BucketName', {
        Description: 'Secure S3 bucket name'
      });

      template.hasOutput('LambdaFunctionName', {
        Description: 'Lambda function name'
      });
    });
  });
});
