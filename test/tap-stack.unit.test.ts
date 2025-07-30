import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Secure Web Application Infrastructure CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Template converted from YAML to JSON using pipenv run cfn-flip-to-json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description for secure web application', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure Web Application Infrastructure - CloudFormation Template'
      );
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      const expectedParams = [
        'EnvironmentSuffix',
        'ProjectName', 
        'VpcCidr',
        'PublicSubnetCidr',
        'PrivateSubnetCidr',
        'DataRetentionDays'
      ];
      
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('secure-web-app');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9-]+$');
    });

    test('DataRetentionDays parameter should have proper constraints', () => {
      const param = template.Parameters.DataRetentionDays;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(30);
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(365);
    });
  });

  describe('Security Resources', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.SecurityKMSKey).toBeDefined();
      expect(template.Resources.SecurityKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.SecurityKMSKeyAlias).toBeDefined();
      expect(template.Resources.SecurityKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMS key should have proper deletion policy', () => {
      const kmsKey = template.Resources.SecurityKMSKey;
      expect(kmsKey.DeletionPolicy).toBe('Delete');
    });

    test('should have GuardDuty detector enabled', () => {
      expect(template.Resources.GuardDutyDetector).toBeDefined();
      expect(template.Resources.GuardDutyDetector.Type).toBe('AWS::GuardDuty::Detector');
      expect(template.Resources.GuardDutyDetector.Properties.Enable).toBe(true);
    });

    test('should have CloudTrail with proper configuration', () => {
      expect(template.Resources.CloudTrail).toBeDefined();
      expect(template.Resources.CloudTrail.Type).toBe('AWS::CloudTrail::Trail');
      
      const cloudTrail = template.Resources.CloudTrail.Properties;
      expect(cloudTrail.IsMultiRegionTrail).toBe(true);
      expect(cloudTrail.EnableLogFileValidation).toBe(true);
      expect(cloudTrail.IsLogging).toBe(true);
    });

    test('should have Web Application Firewall (WAF)', () => {
      expect(template.Resources.WebACL).toBeDefined();
      expect(template.Resources.WebACL.Type).toBe('AWS::WAFv2::WebACL');
      
      const webACL = template.Resources.WebACL.Properties;
      expect(webACL.Scope).toBe('REGIONAL');
      expect(webACL.Rules).toBeDefined();
      expect(webACL.Rules.length).toBeGreaterThan(0);
    });
  });

  describe('Network Resources', () => {
    test('should have VPC with proper configuration', () => {
      expect(template.Resources.SecureVPC).toBeDefined();
      expect(template.Resources.SecureVPC.Type).toBe('AWS::EC2::VPC');
      
      const vpc = template.Resources.SecureVPC.Properties;
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PublicSubnet.Type).toBe('AWS::EC2::Subnet');
      
      expect(template.Resources.PrivateSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet.Type).toBe('AWS::EC2::Subnet');
      
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have Internet Gateway and NAT Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have security groups for different tiers', () => {
      expect(template.Resources.WebApplicationSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      
      expect(template.Resources.WebApplicationSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have Network ACL for additional security', () => {
      expect(template.Resources.PublicNetworkACL).toBeDefined();
      expect(template.Resources.PublicNetworkACL.Type).toBe('AWS::EC2::NetworkAcl');
    });
  });

  describe('Data Storage Resources', () => {
    test('should have encrypted DynamoDB table', () => {
      expect(template.Resources.SecureDynamoTable).toBeDefined();
      expect(template.Resources.SecureDynamoTable.Type).toBe('AWS::DynamoDB::Table');
      
      const dynamoTable = template.Resources.SecureDynamoTable.Properties;
      expect(dynamoTable.SSESpecification.SSEEnabled).toBe(true);
      expect(dynamoTable.SSESpecification.SSEType).toBe('KMS');
      expect(dynamoTable.DeletionProtectionEnabled).toBe(false);
    });

    test('should have encrypted RDS database', () => {
      expect(template.Resources.SecureDatabase).toBeDefined();
      expect(template.Resources.SecureDatabase.Type).toBe('AWS::RDS::DBInstance');
      
      const database = template.Resources.SecureDatabase.Properties;
      expect(database.StorageEncrypted).toBe(true);
      expect(database.PubliclyAccessible).toBe(false);
      expect(database.DeletionProtection).toBe(false);
    });

    test('should have database password in Secrets Manager', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('should have CloudTrail S3 bucket with encryption', () => {
      expect(template.Resources.CloudTrailS3Bucket).toBeDefined();
      expect(template.Resources.CloudTrailS3Bucket.Type).toBe('AWS::S3::Bucket');
      
      const bucket = template.Resources.CloudTrailS3Bucket.Properties;
      expect(bucket.BucketEncryption).toBeDefined();
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
    });
  });

  describe('IAM Resources', () => {
    test('should have IAM role for web application with least privilege', () => {
      expect(template.Resources.WebApplicationRole).toBeDefined();
      expect(template.Resources.WebApplicationRole.Type).toBe('AWS::IAM::Role');
      
      const role = template.Resources.WebApplicationRole.Properties;
      expect(role.Policies).toBeDefined();
      expect(role.Policies[0].PolicyName).toBe('SecureWebAppPolicy');
    });

    test('should have instance profile for web application', () => {
      expect(template.Resources.WebApplicationInstanceProfile).toBeDefined();
      expect(template.Resources.WebApplicationInstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have CloudTrail role with minimal permissions', () => {
      expect(template.Resources.CloudTrailRole).toBeDefined();
      expect(template.Resources.CloudTrailRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('Monitoring and Logging', () => {
    test('should have CloudWatch log groups with encryption', () => {
      expect(template.Resources.CloudTrailLogGroup).toBeDefined();
      expect(template.Resources.ApplicationLogGroup).toBeDefined();
      expect(template.Resources.SecurityLogGroup).toBeDefined();
      
      expect(template.Resources.CloudTrailLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.ApplicationLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.SecurityLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log groups should have proper retention and encryption', () => {
      const logGroup = template.Resources.CloudTrailLogGroup.Properties;
      expect(logGroup.KmsKeyId).toBeDefined();
      expect(logGroup.RetentionInDays).toBeDefined();
    });
  });

  describe('Load Balancer', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
      expect(alb.Subnets).toBeDefined();
      expect(alb.Subnets.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Secure Configuration Management', () => {
    test('should have SSM parameter for database connection', () => {
      expect(template.Resources.DatabaseConnectionString).toBeDefined();
      expect(template.Resources.DatabaseConnectionString.Type).toBe('AWS::SSM::Parameter');
      
      const param = template.Resources.DatabaseConnectionString.Properties;
      expect(param.Type).toBe('String');
      expect(param.Description).toContain('Database connection string');
    });
  });

  describe('Outputs', () => {
    test('should have comprehensive outputs for all major resources', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetId',
        'PrivateSubnetId',
        'WebApplicationSecurityGroupId',
        'DatabaseSecurityGroupId',
        'ApplicationLoadBalancerDNS',
        'WebACLArn',
        'DatabaseEndpoint',
        'SecureDynamoTableName',
        'SecureDynamoTableArn',
        'KMSKeyId',
        'CloudTrailArn',
        'GuardDutyDetectorId',
        'StackName',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have proper descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });

    test('all outputs should have export names for cross-stack references', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have comprehensive resource count for secure infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // Secure infrastructure has many resources
    });

    test('should have multiple parameters for configuration', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThan(3);
    });

    test('should have comprehensive outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(10);
    });
  });

  describe('Security Compliance', () => {
    test('all resources should have proper deletion policies', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).toBe('Delete'); // As per QA requirements
        }
      });
    });

    test('should follow naming convention with project and environment', () => {
      // Check that resources use proper naming patterns
      const vpcName = template.Resources.SecureVPC.Properties.Tags
        .find((tag: any) => tag.Key === 'Name');
      expect(vpcName.Value['Fn::Sub']).toContain('${ProjectName}');
      expect(vpcName.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('encryption should be enabled for data at rest', () => {
      // DynamoDB encryption
      const dynamoSSE = template.Resources.SecureDynamoTable.Properties.SSESpecification;
      expect(dynamoSSE.SSEEnabled).toBe(true);
      
      // RDS encryption
      const rdsEncryption = template.Resources.SecureDatabase.Properties.StorageEncrypted;
      expect(rdsEncryption).toBe(true);
      
      // S3 encryption
      const s3Encryption = template.Resources.CloudTrailS3Bucket.Properties.BucketEncryption;
      expect(s3Encryption).toBeDefined();
    });
  });
});
