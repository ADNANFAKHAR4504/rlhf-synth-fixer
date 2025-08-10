import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load the CloudFormation template
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have security-focused description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure AWS Infrastructure Configuration');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have AllowedIPRanges parameter', () => {
      const param = template.Parameters.AllowedIPRanges;
      expect(param).toBeDefined();
      expect(param.Type).toBe('CommaDelimitedList');
      expect(param.Description).toContain('allowed IP ranges');
    });

    test('should have SuspiciousIPRanges parameter', () => {
      const param = template.Parameters.SuspiciousIPRanges;
      expect(param).toBeDefined();
      expect(param.Type).toBe('CommaDelimitedList');
      expect(param.Description).toContain('suspicious IP ranges');
    });

    test('should have Environment parameter with valid values', () => {
      const param = template.Parameters.Environment;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toEqual(['development', 'staging', 'production']);
    });

    test('should have security-focused parameter defaults', () => {
      expect(template.Parameters.Owner.Default).toBe('security-team');
      expect(template.Parameters.ProjectName.Default).toBe('secure-infrastructure');
    });
  });

  describe('S3 Security Configuration', () => {
    test('S3EncryptionKey should have proper KMS configuration', () => {
      const key = template.Resources.S3EncryptionKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.Description).toBe('KMS key for S3 bucket encryption');
      
      const keyPolicy = key.Properties.KeyPolicy;
      expect(keyPolicy.Statement).toBeDefined();
      expect(keyPolicy.Statement.length).toBeGreaterThanOrEqual(2);
      
      // Check for IAM root permissions
      const rootPermission = keyPolicy.Statement.find((s: any) => 
        s.Principal?.AWS && s.Action === 'kms:*'
      );
      expect(rootPermission).toBeDefined();
      
      // Check for S3 service permissions
      const s3Permission = keyPolicy.Statement.find((s: any) => 
        s.Principal?.Service === 's3.amazonaws.com'
      );
      expect(s3Permission).toBeDefined();
    });

    test('S3 buckets should have encryption enabled', () => {
      const buckets = ['LoggingBucket', 'SecureS3Bucket', 'SecureS3BucketTwo'];
      
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Type).toBe('AWS::S3::Bucket');
        
        const encryption = bucket.Properties.BucketEncryption;
        expect(encryption).toBeDefined();
        expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'S3EncryptionKey' });
        expect(encryption.ServerSideEncryptionConfiguration[0].BucketKeyEnabled).toBe(true);
      });
    });

    test('S3 buckets should block public access', () => {
      const buckets = ['LoggingBucket', 'SecureS3Bucket', 'SecureS3BucketTwo'];
      
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
        
        expect(publicAccessBlock).toBeDefined();
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('S3 buckets should have versioning enabled', () => {
      const buckets = ['LoggingBucket', 'SecureS3Bucket', 'SecureS3BucketTwo'];
      
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });
    });

    test('SecureS3BucketPolicy should allow CloudFront OAC access', () => {
      const policy = template.Resources.SecureS3BucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('cloudfront.amazonaws.com');
      expect(statement.Action).toBe('s3:GetObject');
      expect(statement.Condition.StringEquals['AWS:SourceArn']).toBeDefined();
    });

    test('LoggingBucket should have lifecycle policy', () => {
      const bucket = template.Resources.LoggingBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration;
      
      expect(lifecycle).toBeDefined();
      expect(lifecycle.Rules).toBeDefined();
      expect(lifecycle.Rules[0].Id).toBe('DeleteOldLogs');
      expect(lifecycle.Rules[0].Status).toBe('Enabled');
      expect(lifecycle.Rules[0].ExpirationInDays).toBe(90);
    });
  });

  describe('CloudFront and WAF Configuration', () => {
    test('CloudFrontOriginAccessControl should be properly configured', () => {
      const oac = template.Resources.CloudFrontOriginAccessControl;
      expect(oac.Type).toBe('AWS::CloudFront::OriginAccessControl');
      
      const config = oac.Properties.OriginAccessControlConfig;
      expect(config.OriginAccessControlOriginType).toBe('s3');
      expect(config.SigningBehavior).toBe('always');
      expect(config.SigningProtocol).toBe('sigv4');
    });

    test('WebACL should have required managed rules', () => {
      const webACL = template.Resources.WebACL;
      expect(webACL.Type).toBe('AWS::WAFv2::WebACL');
      expect(webACL.Properties.Scope).toBe('CLOUDFRONT');
      
      const rules = webACL.Properties.Rules;
      expect(rules.length).toBeGreaterThanOrEqual(3);
      
      // Check for Common Rule Set
      const commonRuleSet = rules.find((rule: any) => 
        rule.Name === 'AWSManagedRulesCommonRuleSet'
      );
      expect(commonRuleSet).toBeDefined();
      expect(commonRuleSet.Priority).toBe(1);
      
      // Check for Known Bad Inputs
      const badInputsRuleSet = rules.find((rule: any) => 
        rule.Name === 'AWSManagedRulesKnownBadInputsRuleSet'
      );
      expect(badInputsRuleSet).toBeDefined();
      expect(badInputsRuleSet.Priority).toBe(2);
      
      // Check for SQL Injection rules
      const sqlInjectionRuleSet = rules.find((rule: any) => 
        rule.Name === 'AWSManagedRulesSQLiRuleSet'
      );
      expect(sqlInjectionRuleSet).toBeDefined();
      expect(sqlInjectionRuleSet.Priority).toBe(3);
    });

    test('CloudFront distribution should have security settings', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution.Type).toBe('AWS::CloudFront::Distribution');
      
      const config = distribution.Properties.DistributionConfig;
      expect(config.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
      expect(config.WebACLId).toEqual({ 'Fn::GetAtt': ['WebACL', 'Arn'] });
      expect(config.HttpVersion).toBe('http2');
      
      // Check origin configuration
      const origin = config.Origins[0];
      expect(origin.OriginAccessControlId).toEqual({ Ref: 'CloudFrontOriginAccessControl' });
      expect(origin.S3OriginConfig.OriginAccessIdentity).toBe('');
    });
  });

  describe('Network Security Configuration', () => {
    test('SecureVPC should have proper configuration', () => {
      const vpc = template.Resources.SecureVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('Private subnets should be in different AZs', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(false);
      
      // Different AZs
      expect(subnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });

    test('Network ACL should deny suspicious IPs', () => {
      const nacl = template.Resources.SecureNetworkAcl;
      expect(nacl.Type).toBe('AWS::EC2::NetworkAcl');
      
      // Check deny entries
      const denyEntry1 = template.Resources.NetworkAclEntryDenySuspicious1;
      const denyEntry2 = template.Resources.NetworkAclEntryDenySuspicious2;
      
      expect(denyEntry1.Type).toBe('AWS::EC2::NetworkAclEntry');
      expect(denyEntry1.Properties.RuleAction).toBe('deny');
      expect(denyEntry1.Properties.RuleNumber).toBe(100);
      expect(denyEntry1.Properties.CidrBlock).toEqual({
        'Fn::Select': [0, { Ref: 'SuspiciousIPRanges' }]
      });
      
      expect(denyEntry2.Properties.RuleNumber).toBe(101);
      expect(denyEntry2.Properties.CidrBlock).toEqual({
        'Fn::Select': [1, { Ref: 'SuspiciousIPRanges' }]
      });
      
      // Check allow entry
      const allowEntry = template.Resources.NetworkAclEntryAllowAll;
      expect(allowEntry.Properties.RuleAction).toBe('allow');
      expect(allowEntry.Properties.RuleNumber).toBe(200);
      expect(allowEntry.Properties.CidrBlock).toBe('0.0.0.0/0');
    });

    test('RDS security group should restrict access to VPC only', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.FromPort).toBe(3306);
      expect(ingress.ToPort).toBe(3306);
      expect(ingress.CidrIp).toBe('10.0.0.0/16');
      expect(ingress.Description).toBe('MySQL access from VPC');
    });
  });

  describe('RDS Security Configuration', () => {
    test('RDSEncryptionKey should have proper configuration', () => {
      const key = template.Resources.RDSEncryptionKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.Description).toBe('KMS key for RDS encryption');
      
      const keyPolicy = key.Properties.KeyPolicy;
      const rdsPermission = keyPolicy.Statement.find((s: any) => 
        s.Principal?.Service === 'rds.amazonaws.com'
      );
      expect(rdsPermission).toBeDefined();
      expect(rdsPermission.Action).toContain('kms:Decrypt');
      expect(rdsPermission.Action).toContain('kms:GenerateDataKey');
    });

    test('SecureRDSInstance should have security best practices', () => {
      const rds = template.Resources.SecureRDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.DeletionPolicy).toBe('Snapshot');
      expect(rds.UpdateReplacePolicy).toBe('Snapshot');
      
      const props = rds.Properties;
      expect(props.StorageEncrypted).toBe(true);
      expect(props.KmsKeyId).toEqual({ Ref: 'RDSEncryptionKey' });
      expect(props.PubliclyAccessible).toBe(false);
      expect(props.DeletionProtection).toBe(true);
      expect(props.BackupRetentionPeriod).toBe(7);
      expect(props.MonitoringInterval).toBe(60);
    });

    test('DBSecret should have proper configuration', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      
      const generateSecret = secret.Properties.GenerateSecretString;
      expect(generateSecret.SecretStringTemplate).toBe('{"username": "admin"}');
      expect(generateSecret.GenerateStringKey).toBe('password');
      expect(generateSecret.PasswordLength).toBe(32);
      expect(generateSecret.ExcludeCharacters).toBe('"@/\\');
    });

    test('RDSEnhancedMonitoringRole should have correct configuration', () => {
      const role = template.Resources.RDSEnhancedMonitoringRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('monitoring.rds.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
      
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      );
    });
  });

  describe('IAM and Access Control', () => {
    test('IPRestrictedPolicy should have proper IP restrictions', () => {
      const policy = template.Resources.IPRestrictedPolicy;
      expect(policy.Type).toBe('AWS::IAM::ManagedPolicy');
      
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Deny');
      expect(statement.Action).toContain('s3:GetObject');
      expect(statement.Action).toContain('s3:PutObject');
      expect(statement.Action).toContain('s3:ListBucket');
      
      // Check IP conditions
      expect(statement.Condition.IpAddressIfExists['aws:SourceIp']).toEqual({
        Ref: 'AllowedIPRanges'
      });
      expect(statement.Condition.Bool['aws:ViaAWSService']).toBe('false');
      
      // Check resource ARNs are properly formatted
      expect(statement.Resource).toContainEqual({
        'Fn::Sub': '${SecureS3Bucket.Arn}/*'
      });
      expect(statement.Resource).toContainEqual({
        'Fn::GetAtt': ['SecureS3Bucket', 'Arn']
      });
    });
  });

  describe('GuardDuty Configuration', () => {
    test('GuardDutyDetector should have proper security features', () => {
      const detector = template.Resources.GuardDutyDetector;
      expect(detector.Type).toBe('AWS::GuardDuty::Detector');
      expect(detector.Properties.Enable).toBe(true);
      expect(detector.Properties.FindingPublishingFrequency).toBe('FIFTEEN_MINUTES');
      
      const dataSources = detector.Properties.DataSources;
      expect(dataSources.S3Logs.Enable).toBe(true);
      expect(dataSources.MalwareProtection.ScanEc2InstanceWithFindings.EbsVolumes).toBe(true);
    });
  });

  describe('Resource Tagging', () => {
    test('All resources should have consistent tags', () => {
      const taggedResourceTypes = [
        'AWS::KMS::Key',
        'AWS::S3::Bucket',
        'AWS::WAFv2::WebACL',
        'AWS::CloudFront::Distribution',
        'AWS::GuardDuty::Detector',
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::NetworkAcl',
        'AWS::RDS::DBSubnetGroup',
        'AWS::EC2::SecurityGroup',
        'AWS::RDS::DBInstance',
        'AWS::SecretsManager::Secret',
        'AWS::IAM::Role'
      ];

      Object.values(template.Resources).forEach((resource: any) => {
        if (taggedResourceTypes.includes(resource.Type) && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const tagKeys = tags.map((tag: any) => tag.Key);
          
          // Check for required tags
          expect(tagKeys).toContain('Project');
          expect(tagKeys).toContain('Environment');
          expect(tagKeys).toContain('Owner');
          
          // Verify tag values reference parameters
          const projectTag = tags.find((tag: any) => tag.Key === 'Project');
          expect(projectTag.Value).toEqual({ Ref: 'ProjectName' });
          
          const environmentTag = tags.find((tag: any) => tag.Key === 'Environment');
          expect(environmentTag.Value).toEqual({ Ref: 'Environment' });
          
          const ownerTag = tags.find((tag: any) => tag.Key === 'Owner');
          expect(ownerTag.Value).toEqual({ Ref: 'Owner' });
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'S3BucketName',
        'S3BucketTwoName',
        'LoggingBucketName',
        'CloudFrontDistributionId',
        'CloudFrontDomainName',
        'WebACLId',
        'GuardDutyDetectorId',
        'VPCId',
        'RDSInstanceId',
        'RDSEndpoint'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
        expect(template.Outputs[outputName].Export.Name).toBeDefined();
      });
    });

    test('exports should follow naming convention', () => {
      // Check specific output mappings based on actual CloudFormation template
      const expectedMappings = {
        'S3BucketName': '${AWS::StackName}-SecureS3Bucket',
        'S3BucketTwoName': '${AWS::StackName}-SecureS3BucketTwo',
        'LoggingBucketName': '${AWS::StackName}-LoggingBucket',
        'CloudFrontDistributionId': '${AWS::StackName}-CloudFrontDistribution',
        'CloudFrontDomainName': '${AWS::StackName}-CloudFrontDomainName',
        'WebACLId': '${AWS::StackName}-WebACL',
        'GuardDutyDetectorId': '${AWS::StackName}-GuardDutyDetector',
        'VPCId': '${AWS::StackName}-VPC',
        'RDSInstanceId': '${AWS::StackName}-RDSInstance',
        'RDSEndpoint': '${AWS::StackName}-RDSEndpoint'
      };

      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        const expectedExportName = expectedMappings[outputKey as keyof typeof expectedMappings];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': expectedExportName
        });
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('resource count should match expected infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      // Expected: 26 resources based on the actual security infrastructure
      expect(resourceCount).toBe(26);
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('all Ref and GetAtt functions should reference valid resources', () => {
      const resourceNames = Object.keys(template.Resources);
      const parameterNames = Object.keys(template.Parameters || {});
      const validReferences = [...resourceNames, ...parameterNames];
      
      // Helper function to check references recursively
      const checkReferences = (obj: any) => {
        if (typeof obj === 'object' && obj !== null) {
          if (obj.Ref && typeof obj.Ref === 'string' && !obj.Ref.startsWith('AWS::')) {
            expect(validReferences).toContain(obj.Ref);
          }
          if (obj['Fn::GetAtt'] && Array.isArray(obj['Fn::GetAtt'])) {
            expect(resourceNames).toContain(obj['Fn::GetAtt'][0]);
          }
          
          Object.values(obj).forEach(value => checkReferences(value));
        }
      };
      
      checkReferences(template.Resources);
      checkReferences(template.Outputs);
    });
  });
});