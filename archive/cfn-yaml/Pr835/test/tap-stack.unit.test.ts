import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe('Secure AWS Infrastructure Stack - TapStack with comprehensive security controls');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.Default).toBe('prod');
      expect(template.Parameters.Environment.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('should have AllowedCIDR parameter', () => {
      expect(template.Parameters.AllowedCIDR).toBeDefined();
      expect(template.Parameters.AllowedCIDR.Type).toBe('String');
      expect(template.Parameters.AllowedCIDR.Default).toBe('10.0.0.0/8');
    });

    test('should have database parameters', () => {
      expect(template.Parameters.DatabaseUsername).toBeDefined();
      // DatabasePassword parameter removed - now using Secrets Manager
      expect(template.Parameters.DatabasePassword).toBeUndefined();
    });

    test('should have database password via Secrets Manager', () => {
      expect(template.Resources.TapDatabasePassword).toBeDefined();
      expect(template.Resources.TapDatabasePassword.Type).toBe('AWS::SecretsManager::Secret');
      expect(template.Resources.TapDatabasePassword.Properties.GenerateSecretString).toBeDefined();
    });
  });

  describe('KMS Resources', () => {
    test('should have S3 KMS key', () => {
      expect(template.Resources.TapS3KMSKey).toBeDefined();
      expect(template.Resources.TapS3KMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.TapS3KMSKey.Properties.Description).toBe('KMS Key for S3 bucket encryption');
    });

    test('should have RDS KMS key', () => {
      expect(template.Resources.TapRDSKMSKey).toBeDefined();
      expect(template.Resources.TapRDSKMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.TapRDSKMSKey.Properties.Description).toBe('KMS Key for RDS encryption');
    });

    test('should have KMS key aliases', () => {
      expect(template.Resources.TapS3KMSKeyAlias).toBeDefined();
      expect(template.Resources.TapRDSKMSKeyAlias).toBeDefined();
    });
  });

  describe('S3 Buckets', () => {
    test('should have secure S3 bucket with encryption', () => {
      const bucket = template.Resources.TapSecureS3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('should have versioning enabled on S3 bucket', () => {
      const bucket = template.Resources.TapSecureS3Bucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should block public access on S3 bucket', () => {
      const bucket = template.Resources.TapSecureS3Bucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('should have S3 bucket policy denying insecure connections', () => {
      const policy = template.Resources.TapS3BucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Deny');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('should have CloudTrail S3 bucket', () => {
      const bucket = template.Resources.TapCloudTrailBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC with correct CIDR', () => {
      const vpc = template.Resources.TapVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have private subnets', () => {
      expect(template.Resources.TapPrivateSubnet1).toBeDefined();
      expect(template.Resources.TapPrivateSubnet2).toBeDefined();
      expect(template.Resources.TapPrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.TapPrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should have security groups with restricted access', () => {
      const ec2SG = template.Resources.TapEC2SecurityGroup;
      expect(ec2SG).toBeDefined();
      expect(ec2SG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(ec2SG.Properties.SecurityGroupIngress).toBeDefined();
      expect(ec2SG.Properties.SecurityGroupIngress.length).toBeGreaterThan(0);
      
      // Check that ingress rules use AllowedCIDR parameter
      ec2SG.Properties.SecurityGroupIngress.forEach((rule: any) => {
        if (rule.CidrIp) {
          expect(rule.CidrIp).toEqual({ Ref: 'AllowedCIDR' });
        }
      });
    });
  });

  describe('RDS Database', () => {
    test('should have RDS instance with encryption', () => {
      const rds = template.Resources.TapRDSInstance;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.KmsKeyId).toEqual({ Ref: 'TapRDSKMSKey' });
    });

    test('should have RDS in private subnet', () => {
      const rds = template.Resources.TapRDSInstance;
      expect(rds.Properties.PubliclyAccessible).toBe(false);
      expect(rds.Properties.DBSubnetGroupName).toEqual({ Ref: 'TapDBSubnetGroup' });
    });

    test('should have deletion protection disabled for destroyability', () => {
      const rds = template.Resources.TapRDSInstance;
      expect(rds.Properties.DeletionProtection).toBe(false);
      expect(rds.DeletionPolicy).toBe('Delete');
    });

    test('should have backup retention configured', () => {
      const rds = template.Resources.TapRDSInstance;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('should have DB subnet group', () => {
      const subnetGroup = template.Resources.TapDBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have EC2 role with least privilege', () => {
      const role = template.Resources.TapEC2Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      // Inline policies removed for CAPABILITY_IAM compatibility
      expect(role.Properties.Policies).toBeUndefined();
      // Should have assume role policy
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('should have Lambda role with basic execution policy', () => {
      const role = template.Resources.TapLambdaRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('should have instance profile for EC2', () => {
      const profile = template.Resources.TapEC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('Lambda Function', () => {
    test('should have Lambda function with logging', () => {
      const lambda = template.Resources.TapLambdaFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
    });

    test('should have CloudWatch log group for Lambda', () => {
      const logGroup = template.Resources.TapLambdaLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(14);
    });

    test('should have environment variables', () => {
      const lambda = template.Resources.TapLambdaFunction;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables).toBeDefined();
      expect(lambda.Properties.Environment.Variables.ENVIRONMENT).toEqual({ Ref: 'Environment' });
    });
  });

  describe('CloudTrail', () => {
    test('should have CloudTrail enabled in all regions', () => {
      const trail = template.Resources.TapCloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.IsLogging).toBe(true);
    });

    test('should have log file validation enabled', () => {
      const trail = template.Resources.TapCloudTrail;
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('should include global service events', () => {
      const trail = template.Resources.TapCloudTrail;
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
    });

    test('should have CloudTrail bucket policy', () => {
      const policy = template.Resources.TapCloudTrailBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('Elasticsearch Domain', () => {
    test('should have Elasticsearch with encryption at rest', () => {
      const es = template.Resources.TapElasticsearchDomain;
      expect(es).toBeDefined();
      expect(es.Type).toBe('AWS::Elasticsearch::Domain');
      expect(es.Properties.EncryptionAtRestOptions.Enabled).toBe(true);
    });

    test('should have node-to-node encryption', () => {
      const es = template.Resources.TapElasticsearchDomain;
      expect(es.Properties.NodeToNodeEncryptionOptions.Enabled).toBe(true);
    });

    test('should enforce HTTPS', () => {
      const es = template.Resources.TapElasticsearchDomain;
      expect(es.Properties.DomainEndpointOptions.EnforceHTTPS).toBe(true);
      expect(es.Properties.DomainEndpointOptions.TLSSecurityPolicy).toBe('Policy-Min-TLS-1-2-2019-07');
    });

    test('should be deployed in VPC', () => {
      const es = template.Resources.TapElasticsearchDomain;
      expect(es.Properties.VPCOptions).toBeDefined();
      expect(es.Properties.VPCOptions.SubnetIds).toBeDefined();
      expect(es.Properties.VPCOptions.SecurityGroupIds).toBeDefined();
    });
  });

  describe('AWS WAF', () => {
    test('should have WAF Web ACL', () => {
      const waf = template.Resources.TapWebACL;
      expect(waf).toBeDefined();
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
      expect(waf.Properties.Scope).toBe('REGIONAL');
    });

    test('should have AWS managed rule sets', () => {
      const waf = template.Resources.TapWebACL;
      expect(waf.Properties.Rules).toBeDefined();
      expect(waf.Properties.Rules.length).toBeGreaterThanOrEqual(3);
      
      const ruleNames = waf.Properties.Rules.map((r: any) => r.Name);
      expect(ruleNames).toContain('AWSManagedRulesCommonRuleSet');
      expect(ruleNames).toContain('AWSManagedRulesKnownBadInputsRuleSet');
      expect(ruleNames).toContain('AWSManagedRulesSQLiRuleSet');
    });

    test('should have CloudWatch metrics enabled', () => {
      const waf = template.Resources.TapWebACL;
      expect(waf.Properties.VisibilityConfig.CloudWatchMetricsEnabled).toBe(true);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'S3BucketName',
        'RDSEndpoint',
        'ElasticsearchDomainEndpoint',
        'LambdaFunctionArn',
        'WebACLArn',
        'CloudTrailArn',
        'CloudTrailBucketName',
        'StackName',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
      });
    });

    test('should use stack name in export names', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Security Requirements Compliance', () => {
    test('all S3 buckets should have KMS encryption', () => {
      Object.entries(template.Resources).forEach(([name, resource]: [string, any]) => {
        if (resource.Type === 'AWS::S3::Bucket') {
          expect(resource.Properties.BucketEncryption).toBeDefined();
          expect(resource.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        }
      });
    });

    test('all S3 buckets should have versioning enabled', () => {
      Object.entries(template.Resources).forEach(([name, resource]: [string, any]) => {
        if (resource.Type === 'AWS::S3::Bucket') {
          if (name !== 'TapCloudTrailBucket') { // CloudTrail bucket has versioning
            expect(resource.Properties.VersioningConfiguration).toBeDefined();
            expect(resource.Properties.VersioningConfiguration.Status).toBe('Enabled');
          }
        }
      });
    });

    test('no EC2 instances should have public IPs', () => {
      Object.entries(template.Resources).forEach(([name, resource]: [string, any]) => {
        if (resource.Type === 'AWS::EC2::Subnet') {
          expect(resource.Properties.MapPublicIpOnLaunch).toBe(false);
        }
      });
    });

    test('all resources should be destroyable', () => {
      Object.entries(template.Resources).forEach(([name, resource]: [string, any]) => {
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
        if (resource.Type === 'AWS::RDS::DBInstance') {
          expect(resource.Properties.DeletionProtection).toBe(false);
        }
      });
    });

    test('all IAM roles should follow least privilege', () => {
      Object.entries(template.Resources).forEach(([name, resource]: [string, any]) => {
        if (resource.Type === 'AWS::IAM::Role') {
          // Check assume role policy is defined
          expect(resource.Properties.AssumeRolePolicyDocument).toBeDefined();
          
          // If inline policies exist, check them (but they should be undefined for CAPABILITY_IAM compatibility)
          if (resource.Properties.Policies) {
            resource.Properties.Policies.forEach((policy: any) => {
              const statements = policy.PolicyDocument.Statement;
              statements.forEach((statement: any) => {
                // Check that actions are specific, not wildcards
                if (statement.Action) {
                  const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
                  actions.forEach((action: string) => {
                    // Allow some wildcards for specific services
                    if (!action.startsWith('s3:') && !action.startsWith('logs:')) {
                      expect(action).not.toContain('*');
                    }
                  });
                }
              });
            });
          }
        }
      });
    });

    test('security groups should restrict inbound traffic', () => {
      Object.entries(template.Resources).forEach(([name, resource]: [string, any]) => {
        if (resource.Type === 'AWS::EC2::SecurityGroup' && resource.Properties.SecurityGroupIngress) {
          resource.Properties.SecurityGroupIngress.forEach((rule: any) => {
            // Should not allow 0.0.0.0/0
            if (rule.CidrIp && typeof rule.CidrIp === 'string') {
              expect(rule.CidrIp).not.toBe('0.0.0.0/0');
            }
          });
        }
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all nameable resources should include EnvironmentSuffix', () => {
      const resourcesToCheck = [
        'TapS3KMSKeyAlias',
        'TapRDSKMSKeyAlias',
        'TapSecureS3Bucket',
        'TapRDSInstance',
        'TapEC2Role',
        'TapEC2InstanceProfile',
        'TapLambdaRole',
        'TapLambdaFunction',
        'TapCloudTrailBucket',
        'TapCloudTrail',
        'TapElasticsearchDomain',
        'TapWebACL'
      ];

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource) {
          const props = resource.Properties;
          // Check various naming properties
          const nameProps = ['BucketName', 'DBInstanceIdentifier', 'RoleName', 'InstanceProfileName', 
                           'FunctionName', 'TrailName', 'DomainName', 'Name', 'AliasName'];
          
          nameProps.forEach(prop => {
            if (props[prop]) {
              const nameValue = JSON.stringify(props[prop]);
              expect(nameValue).toContain('EnvironmentSuffix');
            }
          });
        }
      });
    });
  });
});