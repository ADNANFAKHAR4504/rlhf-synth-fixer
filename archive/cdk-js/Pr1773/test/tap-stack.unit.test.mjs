import { App } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

describe('TapStack Unit Tests', () => {
  let app;
  let stack;
  let template;
  const environmentSuffix = 'test123';

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      env: { account: '123456789012', region: 'us-east-1' },
      environmentSuffix: environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('KMS Encryption', () => {
    test('should create a KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description: 'KMS key for Security Infrastructure encryption',
      });
    });

    test('should create KMS key alias with environment suffix', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/security-infra-key-${environmentSuffix}`,
      });
    });

    test('should have proper KMS key policy', () => {
      const key = template.findResources('AWS::KMS::Key');
      const keyResource = Object.values(key)[0];
      const policyStatements = keyResource.Properties.KeyPolicy.Statement;
      
      // Check for root account permissions
      const hasRootPolicy = policyStatements.some(statement => {
        const principal = statement.Principal?.AWS;
        if (typeof principal === 'string') {
          return principal.includes('root') && statement.Action === 'kms:*';
        } else if (principal && principal['Fn::Join']) {
          return JSON.stringify(principal).includes('root') && statement.Action === 'kms:*';
        }
        return false;
      });
      expect(hasRootPolicy).toBe(true);
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with multiple availability zones', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public and private subnets', () => {
      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });

      // Check for private subnets (with NAT)
      template.hasResourceProperties('AWS::EC2::NatGateway', {});

      // Check for route tables
      template.hasResourceProperties('AWS::EC2::RouteTable', {});
    });

    test('should have NAT Gateway for private subnet internet access', () => {
      template.hasResourceProperties('AWS::EC2::NatGateway', {});
    });

    test('should have Internet Gateway for public subnet', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {});
    });
  });

  describe('S3 Buckets', () => {
    test('should create encrypted data bucket with versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `secure-data-${environmentSuffix}-123456789012-us-east-1`,
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            }),
          ]),
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should enforce SSL on all S3 bucket policies', () => {
      const bucketPolicies = template.findResources('AWS::S3::BucketPolicy');
      Object.values(bucketPolicies).forEach(policy => {
        const statements = policy.Properties.PolicyDocument.Statement;
        const sslEnforcement = statements.some(stmt => 
          stmt.Effect === 'Deny' && 
          stmt.Condition?.Bool?.['aws:SecureTransport'] === 'false'
        );
        expect(sslEnforcement).toBe(true);
      });
    });

    test('all S3 buckets should have SSL enforcement', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties).toBeDefined();
      });

      // Check for bucket policies that enforce SSL
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 's3:*',
              Condition: Match.objectLike({
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create EC2 role with SSM and CloudWatch access', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Role = Object.values(roles).find(role => {
        if (role.Properties?.AssumeRolePolicyDocument?.Statement) {
          return role.Properties.AssumeRolePolicyDocument.Statement.some(stmt =>
            stmt.Principal?.Service === 'ec2.amazonaws.com'
          );
        }
        return false;
      });
      expect(ec2Role).toBeDefined();
      expect(ec2Role.Properties.ManagedPolicyArns).toBeDefined();
      
      const hasSsmPolicy = ec2Role.Properties.ManagedPolicyArns.some(arn => 
        arn['Fn::Join'] && arn['Fn::Join'][1].some(part => 
          typeof part === 'string' && part.includes('AmazonSSMManagedInstanceCore')
        )
      );
      expect(hasSsmPolicy).toBe(true);
      
      const hasCloudWatchPolicy = ec2Role.Properties.ManagedPolicyArns.some(arn => 
        arn['Fn::Join'] && arn['Fn::Join'][1].some(part => 
          typeof part === 'string' && part.includes('CloudWatchAgentServerPolicy')
        )
      );
      expect(hasCloudWatchPolicy).toBe(true);
    });

    test('EC2 role should have S3 permissions', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Role = Object.values(roles).find(role => 
        role.Properties?.AssumeRolePolicyDocument?.Statement?.some(stmt =>
          stmt.Principal?.Service === 'ec2.amazonaws.com'
        )
      );
      
      expect(ec2Role.Properties.Policies).toBeDefined();
      const s3Policy = ec2Role.Properties.Policies.find(p => p.PolicyName === 'S3Access');
      expect(s3Policy).toBeDefined();
      
      const s3Actions = s3Policy.PolicyDocument.Statement[0].Action;
      expect(s3Actions).toContain('s3:GetObject');
      expect(s3Actions).toContain('s3:PutObject');
      expect(s3Actions).toContain('s3:ListBucket');
    });

    test('EC2 role should have SSM managed policy', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Role = Object.values(roles).find(role => 
        role.Properties?.AssumeRolePolicyDocument?.Statement?.some(stmt =>
          stmt.Principal?.Service === 'ec2.amazonaws.com'
        )
      );
      
      expect(ec2Role.Properties.ManagedPolicyArns).toBeDefined();
      const hasSsmPolicy = ec2Role.Properties.ManagedPolicyArns.some(arn => 
        JSON.stringify(arn).includes('AmazonSSMManagedInstanceCore')
      );
      expect(hasSsmPolicy).toBe(true);
    });

    test('EC2 role should have Session Manager permissions', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Role = Object.values(roles).find(role => 
        role.Properties?.AssumeRolePolicyDocument?.Statement?.some(stmt =>
          stmt.Principal?.Service === 'ec2.amazonaws.com'
        )
      );
      
      expect(ec2Role.Properties.Policies).toBeDefined();
      const sessionManagerPolicy = ec2Role.Properties.Policies.find(p => p.PolicyName === 'SessionManagerAccess');
      expect(sessionManagerPolicy).toBeDefined();
      
      const statements = sessionManagerPolicy.PolicyDocument.Statement;
      const hasS3SessionLogAccess = statements.some(stmt => 
        stmt.Action.includes('s3:PutObject') && 
        stmt.Resource && JSON.stringify(stmt.Resource).includes('SessionLogsBucket')
      );
      expect(hasS3SessionLogAccess).toBe(true);
      
      const hasCloudWatchLogAccess = statements.some(stmt => 
        stmt.Action.includes('logs:CreateLogStream') && stmt.Action.includes('logs:PutLogEvents')
      );
      expect(hasCloudWatchLogAccess).toBe(true);
    });
  });

  describe('EC2 Configuration', () => {
    test('should create EC2 instance with encrypted EBS volume', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        BlockDeviceMappings: Match.arrayWith([
          Match.objectLike({
            DeviceName: '/dev/xvda',
            Ebs: Match.objectLike({
              Encrypted: true,
              VolumeSize: 20,
              VolumeType: 'gp3',
            }),
          }),
        ]),
      });
    });

    test('should create EC2 instance profile', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {});
    });

    test('should create security group for EC2', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
          }),
        ]),
      });
    });
  });

  describe('EC2 Security', () => {
    test('EC2 instance should be in private subnet', () => {
      const instances = template.findResources('AWS::EC2::Instance');
      const instance = Object.values(instances)[0];
      expect(instance.Properties.SubnetId).toBeDefined();
      // Check that it references a private subnet
      const subnetRef = instance.Properties.SubnetId.Ref;
      expect(subnetRef).toContain('PrivateSubnet');
    });

    test('Security group should only allow HTTPS ingress', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      Object.values(securityGroups).forEach(sg => {
        if (sg.Properties?.SecurityGroupIngress) {
          sg.Properties.SecurityGroupIngress.forEach(rule => {
            if (rule.FromPort) {
              expect(rule.FromPort).toBe(443);
              expect(rule.ToPort).toBe(443);
            }
          });
        }
      });
    });
  });

  describe('Compliance and Monitoring', () => {
    test('should have versioning enabled on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should block public access on all S3 buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        });
      });
    });
  });

  describe('Network Security', () => {
    test('should have proper subnet configuration', () => {
      // Check that we have both public and private subnets
      const subnets = template.findResources('AWS::EC2::Subnet');
      const publicSubnets = Object.values(subnets).filter(s => 
        s.Properties?.MapPublicIpOnLaunch === true
      );
      const privateSubnets = Object.values(subnets).filter(s => 
        s.Properties?.MapPublicIpOnLaunch === false
      );
      expect(publicSubnets.length).toBeGreaterThan(0);
      expect(privateSubnets.length).toBeGreaterThan(0);
    });

    test('should have proper VPC CIDR configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });
  });

  describe('Security Hub Configuration', () => {
    test('should create custom security insight for EC2 findings', () => {
      template.hasResourceProperties('AWS::SecurityHub::Insight', {
        Filters: {
          ResourceType: [
            {
              Comparison: 'EQUALS',
              Value: 'AwsEc2Instance',
            },
          ],
          SeverityLabel: [
            {
              Comparison: 'EQUALS',
              Value: 'HIGH',
            },
          ],
        },
        GroupByAttribute: 'ResourceId',
      });
    });

    test('security insight should have proper naming with environment suffix', () => {
      template.hasResourceProperties('AWS::SecurityHub::Insight', {
        Name: `EC2 High Severity Findings - ${environmentSuffix}`,
      });
    });
  });

  describe('Session Manager Configuration', () => {
    test('should create session logs bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `session-logs-${environmentSuffix}-123456789012-us-east-1`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            }),
          ]),
        },
      });
    });

    test('should create CloudWatch log group for session logging', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/sessionmanager/sessions-${environmentSuffix}`,
        RetentionInDays: 365,
      });
    });

    test('should create Session Manager preference documents', () => {
      template.hasResourceProperties('AWS::SSM::Document', {
        DocumentType: 'Session',
        Name: `SSM-SessionManagerRunShell-${environmentSuffix}`,
        Content: Match.objectLike({
          schemaVersion: '1.0',
          sessionType: 'Standard_Stream',
          inputs: Match.objectLike({
            s3EncryptionEnabled: true,
            cloudWatchEncryptionEnabled: false,
            idleSessionTimeout: '20',
            maxSessionDuration: '60',
          }),
        }),
      });
    });
  });

  describe('Enhanced S3 Configuration', () => {
    test('should create session logs bucket with proper security', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const sessionLogsBucket = Object.values(buckets).find(bucket => 
        bucket.Properties?.BucketName && 
        JSON.stringify(bucket.Properties.BucketName).includes('session-logs')
      );
      
      expect(sessionLogsBucket).toBeDefined();
      expect(sessionLogsBucket.Properties.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have all required outputs', () => {
      const outputs = template.findOutputs('*');
      const outputKeys = Object.keys(outputs);

      const requiredOutputs = [
        'VPCId',
        'KMSKeyId',
        'DataBucketName',
        'SessionLogsBucketName',
        'EC2InstanceId',
        'EC2RoleArn',
        'SecurityInsightName',
        'SessionLogGroupName',
        'EnvironmentSuffix',
      ];

      requiredOutputs.forEach(output => {
        expect(outputKeys).toContain(output);
      });
    });

    test('outputs should have export names with stack prefix', () => {
      const outputs = template.findOutputs('*');
      Object.entries(outputs).forEach(([key, output]) => {
        if (output.Export && output.Export.Name) {
          expect(output.Export.Name).toMatch(/TapStack.*-/);
        }
      });
    });
  });

  describe('Resource Deletion Policy', () => {
    test('all resources should be deletable (no RETAIN policies)', () => {
      const resources = template.toJSON().Resources;
      const retainedResources = [];
      Object.entries(resources).forEach(([logicalId, resource]) => {
        if (resource.DeletionPolicy === 'Retain' || resource.UpdateReplacePolicy === 'Retain') {
          retainedResources.push(logicalId);
        }
      });
      // CDK auto-generates some resources with Retain, but our main resources should not have it
      const mainResourcesWithRetain = retainedResources.filter(id => 
        !id.includes('BootstrapVersion') && 
        !id.includes('CheckBootstrapVersion') &&
        !id.includes('CDKMetadata')
      );
      expect(mainResourcesWithRetain).toEqual([]);
    });

    test('S3 buckets should have auto-delete objects enabled', () => {
      const customResources = template.findResources('Custom::S3AutoDeleteObjects');
      expect(Object.keys(customResources).length).toBeGreaterThan(0);
    });
  });

  describe('Tagging', () => {
    test('should apply common tags to all resources', () => {
      const stackTags = stack.tags.tagValues();
      expect(stackTags).toMatchObject({
        Environment: 'production',
        Project: 'SecurityInfra',
        Owner: 'SecurityTeam',
        Compliance: 'SOC2',
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any IAM policies with wildcard resources for dangerous actions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      Object.values(policies).forEach(policy => {
        if (policy.Properties && policy.Properties.PolicyDocument) {
          policy.Properties.PolicyDocument.Statement.forEach(statement => {
            if (statement.Effect === 'Allow' && statement.Resource === '*') {
              // KMS operations are acceptable with wildcard
              const acceptableActions = ['kms:*', 'kms:DescribeKey', 'kms:GenerateDataKey*'];
              if (statement.Action && !Array.isArray(statement.Action)) {
                expect(acceptableActions).toContain(statement.Action);
              }
            }
          });
        }
      });
    });

    test('should not expose any resources publicly', () => {
      // Check security groups don't allow 0.0.0.0/0 for sensitive ports
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      Object.values(securityGroups).forEach(sg => {
        if (sg.Properties && sg.Properties.SecurityGroupIngress) {
          sg.Properties.SecurityGroupIngress.forEach(rule => {
            if (rule.CidrIp === '0.0.0.0/0') {
              // Only HTTPS (443) is allowed from anywhere
              expect(rule.FromPort).toBe(443);
              expect(rule.ToPort).toBe(443);
            }
          });
        }
      });
    });

    test('all encryption keys should have rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });
  });
});