import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If you're testing a yaml template, run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
      expect(template.Description).toBe(
        'Secure AWS Cloud Environment - Highly secure infrastructure with encryption, least-privilege IAM, network hardening, and compliance monitoring'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('should have TrustedIpAddresses parameter', () => {
      expect(template.Parameters.TrustedIpAddresses).toBeDefined();
    });

    test('should have DatabaseUsername parameter', () => {
      expect(template.Parameters.DatabaseUsername).toBeDefined();
    });

    test('should have CreateCloudTrail parameter', () => {
      expect(template.Parameters.CreateCloudTrail).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBe('Environment suffix for resource naming (e.g., dev, staging, prod)');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });

    test('TrustedIpAddresses parameter should have correct properties', () => {
      const param = template.Parameters.TrustedIpAddresses;
      expect(param.Type).toBe('CommaDelimitedList');
      expect(param.Default).toBe('203.0.113.0/24,198.51.100.0/24');
      expect(param.Description).toBe('List of trusted IP addresses/CIDR blocks for HTTP/HTTPS access');
    });

    test('DatabaseUsername parameter should have correct properties', () => {
      const param = template.Parameters.DatabaseUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('securedbuser');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(64);
    });

    test('CreateCloudTrail parameter should have correct properties', () => {
      const param = template.Parameters.CreateCloudTrail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('false');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });
  });

  describe('Conditions', () => {
    test('should have ShouldCreateCloudTrail condition', () => {
      expect(template.Conditions.ShouldCreateCloudTrail).toBeDefined();
    });
  });

  describe('Resources', () => {
    // KMS Resources
    test('should have S3KMSKey resource', () => {
      expect(template.Resources.S3KMSKey).toBeDefined();
      expect(template.Resources.S3KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have S3KMSKeyAlias resource', () => {
      expect(template.Resources.S3KMSKeyAlias).toBeDefined();
      expect(template.Resources.S3KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    // VPC Resources
    test('should have SecureVPC resource', () => {
      expect(template.Resources.SecureVPC).toBeDefined();
      expect(template.Resources.SecureVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have PublicSubnet resource', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PublicSubnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have PrivateSubnet resource', () => {
      expect(template.Resources.PrivateSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have NATGateway resource', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have NATGatewayEIP resource', () => {
      expect(template.Resources.NATGatewayEIP).toBeDefined();
      expect(template.Resources.NATGatewayEIP.Type).toBe('AWS::EC2::EIP');
    });

    // Route Table Resources
    test('should have PublicRouteTable resource', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have PrivateRouteTable resource', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    // Network ACL Resources
    test('should have SecureNetworkACL resource', () => {
      expect(template.Resources.SecureNetworkACL).toBeDefined();
      expect(template.Resources.SecureNetworkACL.Type).toBe('AWS::EC2::NetworkAcl');
    });

    // Security Group Resources
    test('should have WebSecurityGroup resource', () => {
      expect(template.Resources.WebSecurityGroup).toBeDefined();
      expect(template.Resources.WebSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have DatabaseSecurityGroup resource', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    // S3 Resources
    test('should have SecureS3Bucket resource', () => {
      expect(template.Resources.SecureS3Bucket).toBeDefined();
      expect(template.Resources.SecureS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have AccessLogsBucket resource', () => {
      expect(template.Resources.AccessLogsBucket).toBeDefined();
      expect(template.Resources.AccessLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have SecureS3BucketPolicy resource', () => {
      expect(template.Resources.SecureS3BucketPolicy).toBeDefined();
      expect(template.Resources.SecureS3BucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    // IAM Resources
    test('should have EC2S3AccessRole resource', () => {
      expect(template.Resources.EC2S3AccessRole).toBeDefined();
      expect(template.Resources.EC2S3AccessRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have EC2InstanceProfile resource', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    // EC2 Resources
    test('should have SecureEC2Instance resource', () => {
      expect(template.Resources.SecureEC2Instance).toBeDefined();
      expect(template.Resources.SecureEC2Instance.Type).toBe('AWS::EC2::Instance');
    });

    // Secrets Manager Resources
    test('should have DatabaseSecret resource', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    // VPC Endpoints
    test('should have SSMVPCEndpoint resource', () => {
      expect(template.Resources.SSMVPCEndpoint).toBeDefined();
      expect(template.Resources.SSMVPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    test('should have SSMMessagesVPCEndpoint resource', () => {
      expect(template.Resources.SSMMessagesVPCEndpoint).toBeDefined();
      expect(template.Resources.SSMMessagesVPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    test('should have EC2MessagesVPCEndpoint resource', () => {
      expect(template.Resources.EC2MessagesVPCEndpoint).toBeDefined();
      expect(template.Resources.EC2MessagesVPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    // CloudTrail Resources (Conditional)
    test('should have CloudTrailKMSKey resource', () => {
      expect(template.Resources.CloudTrailKMSKey).toBeDefined();
      expect(template.Resources.CloudTrailKMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.CloudTrailKMSKey.Condition).toBe('ShouldCreateCloudTrail');
    });

    test('should have CloudTrailLogsBucket resource', () => {
      expect(template.Resources.CloudTrailLogsBucket).toBeDefined();
      expect(template.Resources.CloudTrailLogsBucket.Type).toBe('AWS::S3::Bucket');
      expect(template.Resources.CloudTrailLogsBucket.Condition).toBe('ShouldCreateCloudTrail');
    });

    test('should have SecurityAuditTrail resource', () => {
      expect(template.Resources.SecurityAuditTrail).toBeDefined();
      expect(template.Resources.SecurityAuditTrail.Type).toBe('AWS::CloudTrail::Trail');
      expect(template.Resources.SecurityAuditTrail.Condition).toBe('ShouldCreateCloudTrail');
    });
  });

  describe('Resource Properties', () => {
    test('SecureVPC should have correct CIDR block', () => {
      const vpc = template.Resources.SecureVPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('PublicSubnet should have correct properties', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('PrivateSubnet should have correct properties', () => {
      const subnet = template.Resources.PrivateSubnet;
      expect(subnet.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('SecureS3Bucket should have proper naming', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'secure-data-bucket-${EnvironmentSuffix}-${AWS::AccountId}'
      });
    });

    test('AccessLogsBucket should have proper naming', () => {
      const bucket = template.Resources.AccessLogsBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'access-logs-bucket-${EnvironmentSuffix}-${AWS::AccountId}'
      });
    });

    test('S3KMSKey should have deletion policies', () => {
      const key = template.Resources.S3KMSKey;
      expect(key.DeletionPolicy).toBe('Delete');
      expect(key.UpdateReplacePolicy).toBe('Delete');
    });

    test('DatabaseSecret should have correct naming pattern', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Properties.Name).toEqual({
        'Fn::Sub': 'DatabaseCredentials-${EnvironmentSuffix}'
      });
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'SecureVPC' });
    });

    test('should have PublicSubnetId output', () => {
      expect(template.Outputs.PublicSubnetId).toBeDefined();
      expect(template.Outputs.PublicSubnetId.Value).toEqual({ Ref: 'PublicSubnet' });
    });

    test('should have PrivateSubnetId output', () => {
      expect(template.Outputs.PrivateSubnetId).toBeDefined();
      expect(template.Outputs.PrivateSubnetId.Value).toEqual({ Ref: 'PrivateSubnet' });
    });

    test('should have SecureS3BucketName output', () => {
      expect(template.Outputs.SecureS3BucketName).toBeDefined();
      expect(template.Outputs.SecureS3BucketName.Value).toEqual({ Ref: 'SecureS3Bucket' });
    });

    test('should have S3KMSKeyId output', () => {
      expect(template.Outputs.S3KMSKeyId).toBeDefined();
      expect(template.Outputs.S3KMSKeyId.Value).toEqual({ Ref: 'S3KMSKey' });
    });

    test('should have EC2InstanceId output', () => {
      expect(template.Outputs.EC2InstanceId).toBeDefined();
      expect(template.Outputs.EC2InstanceId.Value).toEqual({ Ref: 'SecureEC2Instance' });
    });

    test('should have EC2RoleArn output', () => {
      expect(template.Outputs.EC2RoleArn).toBeDefined();
      expect(template.Outputs.EC2RoleArn.Value).toEqual({
        'Fn::GetAtt': ['EC2S3AccessRole', 'Arn']
      });
    });

    test('should have WebSecurityGroupId output', () => {
      expect(template.Outputs.WebSecurityGroupId).toBeDefined();
      expect(template.Outputs.WebSecurityGroupId.Value).toEqual({ Ref: 'WebSecurityGroup' });
    });

    test('should have DatabaseSecretArn output', () => {
      expect(template.Outputs.DatabaseSecretArn).toBeDefined();
      expect(template.Outputs.DatabaseSecretArn.Value).toEqual({ Ref: 'DatabaseSecret' });
    });

    test('should have CloudTrailArn output with condition', () => {
      expect(template.Outputs.CloudTrailArn).toBeDefined();
      expect(template.Outputs.CloudTrailArn.Condition).toBe('ShouldCreateCloudTrail');
      expect(template.Outputs.CloudTrailArn.Value).toEqual({
        'Fn::GetAtt': ['SecurityAuditTrail', 'Arn']
      });
    });

    test('should have StackName output', () => {
      expect(template.Outputs.StackName).toBeDefined();
      expect(template.Outputs.StackName.Value).toEqual({ Ref: 'AWS::StackName' });
    });

    test('should have EnvironmentSuffix output', () => {
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
      expect(template.Outputs.EnvironmentSuffix.Value).toEqual({ Ref: 'EnvironmentSuffix' });
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

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have substantial number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20);
    });

    test('should have comprehensive outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(10);
    });
  });

  describe('Resource Naming Convention', () => {
    test('bucket names should follow naming convention with environment suffix', () => {
      const secureS3Bucket = template.Resources.SecureS3Bucket;
      const accessLogsBucket = template.Resources.AccessLogsBucket;
      
      expect(secureS3Bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'secure-data-bucket-${EnvironmentSuffix}-${AWS::AccountId}'
      });
      
      expect(accessLogsBucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'access-logs-bucket-${EnvironmentSuffix}-${AWS::AccountId}'
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export && output.Export.Name) {
          const exportName = output.Export.Name;
          if (typeof exportName === 'string') {
            expect(exportName).toMatch(/^\$\{AWS::StackName\}-/);
          } else if (typeof exportName === 'object' && exportName['Fn::Sub']) {
            expect(exportName['Fn::Sub']).toMatch(/^\$\{AWS::StackName\}-/);
          }
        }
      });
    });

    test('should have consistent Production tagging', () => {
      // Test a few key resources for Production environment tagging
      const testResources = ['SecureVPC', 'PublicSubnet', 'PrivateSubnet', 'S3KMSKey'];
      
      testResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
          expect(envTag?.Value).toBe('Production');
        }
      });
    });
  });

  describe('Security Configuration', () => {
    test('should have KMS keys with proper deletion policies', () => {
      const s3KMSKey = template.Resources.S3KMSKey;
      const cloudTrailKMSKey = template.Resources.CloudTrailKMSKey;
      
      expect(s3KMSKey.DeletionPolicy).toBe('Delete');
      expect(s3KMSKey.UpdateReplacePolicy).toBe('Delete');
      
      if (cloudTrailKMSKey) {
        expect(cloudTrailKMSKey.DeletionPolicy).toBe('Delete');
        expect(cloudTrailKMSKey.UpdateReplacePolicy).toBe('Delete');
      }
    });

    test('should have S3 buckets with proper deletion policies', () => {
      const testBuckets = ['SecureS3Bucket', 'AccessLogsBucket', 'CloudTrailLogsBucket'];
      
      testBuckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        if (bucket) {
          expect(bucket.DeletionPolicy).toBe('Delete');
          expect(bucket.UpdateReplacePolicy).toBe('Delete');
        }
      });
    });
  });
});
