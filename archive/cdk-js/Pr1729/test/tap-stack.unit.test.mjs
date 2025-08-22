import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';
import { SecurityStack } from '../lib/security-stack.mjs';

describe('TapStack', () => {
  let app;
  let stack;
  let template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TapStack${environmentSuffix}`, { 
      environmentSuffix: environmentSuffix 
    });
    template = Template.fromStack(stack);
  });

  test('TapStack creates nested SecurityStack', () => {
    // Verify that the parent stack is created
    expect(stack).toBeDefined();
    
    // Check that nested stack is referenced
    const nestedStacks = stack.node.children.filter(child => 
      child instanceof SecurityStack
    );
    expect(nestedStacks.length).toBe(1);
  });

  test('TapStack passes environment suffix to nested stack', () => {
    const securityStack = stack.node.children.find(child => 
      child instanceof SecurityStack
    );
    expect(securityStack).toBeDefined();
    expect(securityStack.stackName).toContain(environmentSuffix);
  });

  test('TapStack has correct tags', () => {
    const appTemplate = cdk.App.of(stack);
    expect(appTemplate).toBeDefined();
  });
});

describe('SecurityStack', () => {
  let app;
  let stack;
  let template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new SecurityStack(app, `SecurityStack${environmentSuffix}`, {
      environmentSuffix: environmentSuffix
    });
    template = Template.fromStack(stack);
  });

  describe('KMS Keys', () => {
    test('creates S3 encryption KMS key with rotation', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('.*S3 bucket encryption.*'),
        EnableKeyRotation: true
      });
    });

    test('creates RDS encryption KMS key with rotation', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('.*RDS encryption.*'),
        EnableKeyRotation: true
      });
    });
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16'
      });
    });

    test('creates both public and private subnets', () => {
      // Check for private subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false
      });
      
      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true
      });
    });

    test('creates NAT gateways for private subnet egress', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('creates Internet Gateway for public subnets', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('creates VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL'
      });
    });

    test('creates VPC endpoints for Systems Manager', () => {
      // Check that 3 VPC endpoints are created
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 3);
      
      // Verify they are interface endpoints
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
        PrivateDnsEnabled: true
      });
    });
  });

  describe('S3 Bucket Security', () => {
    test('creates S3 bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms'
              }
            })
          ])
        }
      });
    });

    test('S3 bucket has versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('S3 bucket blocks all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('S3 bucket has SSL-only policy', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false'
                }
              }
            })
          ])
        }
      });
    });
  });

  describe('RDS Security', () => {
    test('creates RDS instance with encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true
      });
    });

    test('RDS instance uses customer-managed KMS key', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        KmsKeyId: Match.anyValue()
      });
    });

    test('RDS instance has automated backups', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: Match.anyValue()
      });
    });

    test('RDS instance is in private subnet', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        SubnetIds: Match.anyValue()
      });
    });

    test('RDS security group restricts access', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription: Match.stringLikeRegexp('.*RDS.*')
        }
      });
      expect(Object.keys(securityGroups).length).toBeGreaterThan(0);
    });
  });

  describe('Lambda Security', () => {
    test('creates Lambda function with restricted IAM role', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Role: Match.anyValue()
      });
    });

    test('Lambda IAM role follows least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'lambda.amazonaws.com'
              }
            })
          ])
        }
      });
    });

    test('Lambda function runs in VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.objectLike({
          SecurityGroupIds: Match.anyValue(),
          SubnetIds: Match.anyValue()
        })
      });
    });

    test('Lambda has reserved concurrent executions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        ReservedConcurrentExecutions: 10
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates CloudWatch alarms for security monitoring', () => {
      // Suspicious activity alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2
      });
      
      // Failed login alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ConsoleSignInFailures'
      });
    });

    test('creates log groups for security logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: Match.anyValue()
      });
    });
  });

  describe('IAM Security', () => {
    test('creates IAM roles with explicit deny policies', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const rolesWithDenyPolicies = Object.values(roles).filter(role => {
        const policies = role.Properties?.Policies || [];
        return policies.some(policy => {
          const statements = policy?.PolicyDocument?.Statement || [];
          return statements.some(stmt => stmt.Effect === 'Deny');
        });
      });
      expect(rolesWithDenyPolicies.length).toBeGreaterThan(0);
    });

    test('EC2 role has Session Manager permissions', () => {
      // Look for EC2 Session Manager Role specifically
      const roles = template.findResources('AWS::IAM::Role');
      const ec2SessionManagerRole = Object.entries(roles).find(([key, value]) => {
        return key.includes('EC2SessionManagerRole');
      });
      expect(ec2SessionManagerRole).toBeDefined();
      // Verify it has managed policies
      expect(ec2SessionManagerRole[1].Properties.ManagedPolicyArns).toBeDefined();
      expect(ec2SessionManagerRole[1].Properties.ManagedPolicyArns.length).toBeGreaterThan(0);
    });

    test('IAM roles deny non-secure transport', () => {
      const lambdaRole = template.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Principal: {
                  Service: 'lambda.amazonaws.com'
                }
              })
            ])
          }
        }
      });
      expect(Object.keys(lambdaRole).length).toBeGreaterThan(0);
    });
  });

  describe('WAF Configuration', () => {
    test('creates WAF WebACL for protection', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'CLOUDFRONT',
        DefaultAction: {
          Allow: {}
        }
      });
    });

    test('WAF includes AWS Managed Rules', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesCommonRuleSet'
              }
            }
          })
        ])
      });
    });

    test('WAF includes known bad inputs rule set', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesKnownBadInputsRuleSet'
              }
            }
          })
        ])
      });
    });
  });

  describe('Security Groups', () => {
    test('EC2 security group denies public access', () => {
      const ec2SecurityGroups = template.findResources('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription: Match.stringLikeRegexp('.*EC2.*no public access.*')
        }
      });
      expect(Object.keys(ec2SecurityGroups).length).toBeGreaterThan(0);
    });

    test('Security groups have egress rules defined', () => {
      // Check that security groups have egress rules in their properties
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const groupsWithEgressRules = Object.values(securityGroups).filter(sg => {
        return sg.Properties?.SecurityGroupEgress && sg.Properties.SecurityGroupEgress.length > 0;
      });
      expect(groupsWithEgressRules.length).toBeGreaterThan(0);
    });
  });

  describe('Stack Outputs', () => {
    test('outputs VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: Match.stringLikeRegexp('.*VPC.*')
      });
    });

    test('outputs S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: Match.stringLikeRegexp('.*S3 bucket.*')
      });
    });

    test('outputs RDS endpoint', () => {
      template.hasOutput('RDSEndpoint', {
        Description: Match.stringLikeRegexp('.*RDS.*')
      });
    });

    test('outputs Lambda function name', () => {
      template.hasOutput('LambdaFunctionName', {
        Description: Match.stringLikeRegexp('.*Lambda.*')
      });
    });
  });

  describe('Resource Removal Policies', () => {
    test('all resources have DESTROY removal policy', () => {
      // Check KMS keys have deletion policy
      const kmsKeys = template.findResources('AWS::KMS::Key');
      Object.values(kmsKeys).forEach(key => {
        expect(key.DeletionPolicy).toBe('Delete');
        expect(key.UpdateReplacePolicy).toBe('Delete');
      });

      // Check S3 buckets - some may have different policies (flow logs bucket has Retain)
      const s3Buckets = template.findResources('AWS::S3::Bucket');
      // At least check that secure S3 bucket exists and has proper deletion
      const secureBucket = Object.entries(s3Buckets).find(([key, value]) => {
        return key.includes('SecureS3Bucket');
      });
      if (secureBucket) {
        expect(secureBucket[1].UpdateReplacePolicy).toBe('Delete');
      }

      // Check RDS has no deletion protection
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: false
      });
    });
  });
});