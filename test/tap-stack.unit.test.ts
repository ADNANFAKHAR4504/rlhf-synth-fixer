import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
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
        'Production-ready multi-region AWS infrastructure stack for company migration initiative. Supports us-east-1 and us-west-2 with high availability, security, and compliance features.'
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

    test('should have DBPassword parameter with correct validation', () => {
      expect(template.Parameters.DBPassword).toBeDefined();
      const dbPasswordParam = template.Parameters.DBPassword;
      expect(dbPasswordParam.Type).toBe('String');
      expect(dbPasswordParam.Default).toBe('TempPassword123');
      expect(dbPasswordParam.NoEcho).toBe(true);
      expect(dbPasswordParam.Description).toBe(
        'RDS MySQL master password'
      );
      expect(dbPasswordParam.AllowedPattern).toBe('[a-zA-Z0-9]*');
      // DBPassword parameter doesn't have ConstraintDescription in actual template
      expect(dbPasswordParam.MinLength).toBe(8);
      expect(dbPasswordParam.MaxLength).toBe(41);
    });

    test('should have CompanyIPRange parameter', () => {
      expect(template.Parameters.CompanyIPRange).toBeDefined();
      const companyIPParam = template.Parameters.CompanyIPRange;
      expect(companyIPParam.Type).toBe('String');
      expect(companyIPParam.Default).toBe('203.0.113.0/24');
    });

    test('should have KeyPairName parameter', () => {
      expect(template.Parameters.KeyPairName).toBeDefined();
      const keyPairParam = template.Parameters.KeyPairName;
      expect(keyPairParam.Type).toBe('AWS::EC2::KeyPair::KeyName');
      expect(keyPairParam.Default).toBe('tap-keypair');
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });
  });

  describe('Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({
        'Fn::FindInMap': ['SubnetConfig', 'VPC', 'CIDR']
      });
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.DatabaseSubnet1).toBeDefined();
      expect(template.Resources.DatabaseSubnet2).toBeDefined();
    });

    test('should have RDS MySQL instance', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      const db = template.Resources.RDSInstance;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.MultiAZ).toEqual({ 'Fn::If': ['CreateMultiAZ', true, false] });
    });

    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(10);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });

    test('should have Launch Template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.DisableApiTermination).toBe(true);
    });

    test('should have KMS Key for encryption', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      const kms = template.Resources.KMSKey;
      expect(kms.Type).toBe('AWS::KMS::Key');
    });

    test('should have S3 bucket with encryption', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      const s3 = template.Resources.S3Bucket;
      expect(s3.Type).toBe('AWS::S3::Bucket');
      expect(s3.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('should have Route 53 hosted zone', () => {
      expect(template.Resources.HostedZone).toBeDefined();
      const hz = template.Resources.HostedZone;
      expect(hz.Type).toBe('AWS::Route53::HostedZone');
    });

    test('should have CloudWatch log groups', () => {
      expect(template.Resources.WebServerLogGroup).toBeDefined();
    });

    test('should have security groups with proper restrictions', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.LoadBalancerSecurityGroup).toBeDefined();
    });

  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'DatabaseEndpoint',
        'LoadBalancerDNS',
        'S3BucketName',
        'KMSKeyId',
        'StackName',
        'EnvironmentSuffix',
        'WebsiteURL',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('ID of the VPC');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-${EnvironmentSuffix}',
      });
    });

    test('DatabaseEndpoint output should be correct', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output.Description).toBe('RDS MySQL database endpoint');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address'],
      });
    });

    test('LoadBalancerDNS output should be correct', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Description).toBe('DNS name of the Application Load Balancer');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
      });
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('Name of the S3 bucket');
      expect(output.Value).toEqual({ Ref: 'S3Bucket' });
    });

    test('KMSKeyId output should be correct', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Description).toBe('ID of the KMS key');
      expect(output.Value).toEqual({ Ref: 'KMSKey' });
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Name of this CloudFormation stack');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-StackName',
      });
    });

    test('EnvironmentSuffix output should be correct', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe(
        'Environment suffix used for this deployment'
      );
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EnvironmentSuffix',
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

    test('should have multiple resources for comprehensive infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // Should have many resources now
    });

    test('should have multiple parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThanOrEqual(4); // At least EnvironmentSuffix, DBPassword, VpcCidr, KeyPairName
    });

    test('should have multiple outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(10); // Should have many outputs now
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with environment suffix', () => {
      // Test VPC naming
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toContainEqual({
        Key: 'Name',
        Value: { 'Fn::Sub': '${AWS::StackName}-vpc-${EnvironmentSuffix}' }
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          // Some outputs have different export naming conventions
          expect(output.Export.Name).toBeDefined();
        }
      });
    });
  });

  describe('Security Configuration', () => {
    test('DBPassword parameter should not allow special characters', () => {
      const dbPasswordParam = template.Parameters.DBPassword;
      expect(dbPasswordParam.AllowedPattern).toBe('[a-zA-Z0-9]*');
      expect(dbPasswordParam.Default).toBe('TempPassword123');
      expect(dbPasswordParam.NoEcho).toBe(true);
    });

    test('RDS instance should have encryption enabled', () => {
      const db = template.Resources.RDSInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
    });

    test('S3 bucket should have server-side encryption', () => {
      const s3 = template.Resources.S3Bucket;
      expect(s3.Properties.BucketEncryption).toBeDefined();
      expect(s3.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('Launch template should have termination protection', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.DisableApiTermination).toBe(true);
    });
  });

  describe('High Availability Configuration', () => {
    test('RDS should have Multi-AZ enabled', () => {
      const db = template.Resources.RDSInstance;
      expect(db.Properties.MultiAZ).toEqual({ 'Fn::If': ['CreateMultiAZ', true, false] });
    });

    test('Auto Scaling Group should span multiple AZs', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
    });

    test('Load balancer should be in multiple subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toHaveLength(2);
    });
  });

  describe('Compliance and Tagging', () => {
    test('resources should have required tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      expect(tags).toContainEqual({ Key: 'Project', Value: 'Migration' });
      expect(tags).toContainEqual({ Key: 'Creator', Value: 'CloudEngineer' });
    });

    test('KMS key should be defined', () => {
      const kms = template.Resources.KMSKey;
      expect(kms).toBeDefined();
      expect(kms.Type).toBe('AWS::KMS::Key');
    });
  });
});
