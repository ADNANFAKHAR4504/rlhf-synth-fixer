import * as fs from 'fs';
import * as path from 'path';

// Types for CloudFormation template structure
interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description: string;
  Parameters: Record<string, any>;
  Resources: Record<string, any>;
  Outputs: Record<string, any>;
}

interface Parameter {
  Type: string;
  Description: string;
  Default?: any;
  MinLength?: number;
  MaxLength?: number;
  AllowedPattern?: string;
  AllowedValues?: string[];
  ConstraintDescription?: string;
}

interface Resource {
  Type: string;
  Properties: Record<string, any>;
  DependsOn?: string | string[];
  Tags?: Array<{ Key: string; Value: any }>;
}

interface Output {
  Description: string;
  Value: any;
  Export?: { Name: any };
}

describe('TapStack CloudFormation Template Tests', () => {
  let template: CloudFormationTemplate;

  beforeAll(() => {
    // Load the CloudFormation template
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    expect(fs.existsSync(templatePath)).toBe(true);
    
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure Validation', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have meaningful description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Production-grade AWS infrastructure');
      expect(template.Description.length).toBeGreaterThan(20);
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters Validation', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'EnvironmentSuffix',
        'TrustedIpCidrs',
        'BucketNamePrefix',
        'KmsKeyAlias',
        'Environment'
      ];
      
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have proper constraints', () => {
      const param = template.Parameters.EnvironmentSuffix as Parameter;
      expect(param.Type).toBe('String');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(10);
      expect(param.AllowedPattern).toBe('^[a-z0-9]+$');
      expect(param.Default).toBe('dev');
    });

    test('TrustedIpCidrs parameter should be CommaDelimitedList', () => {
      const param = template.Parameters.TrustedIpCidrs as Parameter;
      expect(param.Type).toBe('CommaDelimitedList');
      expect(param.Default).toEqual('203.0.113.0/24,198.51.100.0/24');
    });

    test('Environment parameter should have allowed values', () => {
      const param = template.Parameters.Environment as Parameter;
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toEqual(['Production', 'Staging', 'Development']);
      expect(param.Default).toBe('Production');
    });

    test('BucketNamePrefix should have proper naming constraints', () => {
      const param = template.Parameters.BucketNamePrefix as Parameter;
      expect(param.AllowedPattern).toBe('^[a-z0-9][a-z0-9-]*[a-z0-9]$');
      expect(param.MinLength).toBe(3);
      expect(param.MaxLength).toBe(50);
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC with correct CIDR and DNS settings', () => {
      const vpc = template.Resources.SecureVPC as Resource;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public and private subnets', () => {
      const publicSubnet = template.Resources.PublicSubnet as Resource;
      const privateSubnet = template.Resources.PrivateSubnet as Resource;

      expect(publicSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet.Properties.MapPublicIpOnLaunch).toBe(true);

      expect(privateSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(privateSubnet.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should have internet gateway and proper routing', () => {
      const igw = template.Resources.InternetGateway as Resource;
      const publicRoute = template.Resources.PublicRoute as Resource;

      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(publicRoute.Type).toBe('AWS::EC2::Route');
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.DependsOn).toBe('AttachGateway');
    });

    test('should have route table associations', () => {
      const publicAssociation = template.Resources.PublicSubnetRouteTableAssociation;
      const privateAssociation = template.Resources.PrivateSubnetRouteTableAssociation;

      expect(publicAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(privateAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });
  });

  describe('S3 and CloudTrail Resources', () => {
    test('should have S3 bucket with proper encryption and security', () => {
      const bucket = template.Resources.LoggingBucket as Resource;
      
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have proper S3 bucket policy for CloudTrail', () => {
      const bucketPolicy = template.Resources.LoggingBucketPolicy as Resource;
      
      expect(bucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      
      const statements = bucketPolicy.Properties.PolicyDocument.Statement;
      const cloudTrailStatements = statements.filter((s: any) => 
        s.Sid === 'AWSCloudTrailAclCheck' || s.Sid === 'AWSCloudTrailWrite'
      );
      
      expect(cloudTrailStatements).toHaveLength(2);
      
      // Check for aws:SourceArn condition
      cloudTrailStatements.forEach((stmt: any) => {
        expect(stmt.Condition.StringEquals['aws:SourceArn']).toBeDefined();
      });
    });

    test('should have CloudTrail with proper configuration', () => {
      const cloudTrail = template.Resources.CloudTrail as Resource;
      
      expect(cloudTrail.Type).toBe('AWS::CloudTrail::Trail');
      expect(cloudTrail.DependsOn).toBe('LoggingBucketPolicy');
      expect(cloudTrail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(cloudTrail.Properties.IsMultiRegionTrail).toBe(true);
      expect(cloudTrail.Properties.EnableLogFileValidation).toBe(true);
      expect(cloudTrail.Properties.IsLogging).toBe(true);
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS key with proper policies', () => {
      const kmsKey = template.Resources.LoggingKMSKey as Resource;
      
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
      
      const keyPolicy = kmsKey.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      
      const statements = keyPolicy.Statement;
      expect(statements).toHaveLength(3); // IAM, CloudTrail, S3 statements
      
      // Check CloudTrail statement has proper condition
      const cloudTrailStmt = statements.find((s: any) => s.Sid === 'Allow CloudTrail to use the key');
      expect(cloudTrailStmt.Condition.StringLike['kms:EncryptionContext:aws:cloudtrail:arn']).toBeDefined();
    });

    test('should have KMS key alias', () => {
      const alias = template.Resources.LoggingKMSKeyAlias as Resource;
      expect(alias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 logging role with proper policies', () => {
      const role = template.Resources.EC2LoggingRole as Resource;
      
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess');
      
      const inlinePolicy = role.Properties.Policies[0];
      expect(inlinePolicy.PolicyName).toBe('LoggingBucketAccess');
      expect(inlinePolicy.PolicyDocument.Statement).toHaveLength(2); // ListBucket and GetObject
    });

    test('should have EC2 instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile as Resource;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('Security Group Resources', () => {
    test('should have EC2 security group with restricted SSH access', () => {
      const sg = template.Resources.EC2SecurityGroup as Resource;
      
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toContain('restricted SSH access');
      
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].IpProtocol).toBe('tcp');
      expect(ingressRules[0].FromPort).toBe(22);
      expect(ingressRules[0].ToPort).toBe(22);
      
      const egressRules = sg.Properties.SecurityGroupEgress;
      expect(egressRules[0].IpProtocol).toBe('-1');
      expect(egressRules[0].CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have proper tags', () => {
      const taggedResources = [
        'SecureVPC', 'PublicSubnet', 'PrivateSubnet', 'InternetGateway',
        'PublicRouteTable', 'PrivateRouteTable', 'LoggingKMSKey',
        'LoggingBucket', 'EC2LoggingRole', 'CloudTrail', 'EC2SecurityGroup'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName] as Resource;
        expect(resource.Properties.Tags).toBeDefined();
        
        const tags = resource.Properties.Tags;
        const nameTag = tags.find((tag: any) => tag.Key === 'Name');
        const envTag = tags.find((tag: any) => tag.Key === 'Environment');
        
        expect(nameTag).toBeDefined();
        expect(envTag).toBeDefined();
      });
    });
  });

  describe('Outputs Validation', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId', 'PublicSubnetId', 'PrivateSubnetId', 'EC2SecurityGroupId',
        'LoggingBucketName', 'EC2InstanceProfileArn', 'KMSKeyId', 'CloudTrailArn'
      ];

      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('all outputs should have descriptions and exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey] as Output;
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(10);
        expect(output.Export).toBeDefined();
        expect(output.Export?.Name).toBeDefined();
      });
    });

    test('output exports should follow consistent naming pattern', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey] as Output;
        const exportName = output.Export?.Name;
        
        // Should use Fn::Sub with stack name prefix
        expect(exportName['Fn::Sub']).toBeDefined();
        expect(exportName['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket should enforce secure transport', () => {
      const bucketPolicy = template.Resources.LoggingBucketPolicy as Resource;
      const statements = bucketPolicy.Properties.PolicyDocument.Statement;
      
      const secureTransportStmt = statements.find((s: any) => 
        s.Sid === 'DenyInsecureConnections'
      );
      
      expect(secureTransportStmt).toBeDefined();
      expect(secureTransportStmt.Effect).toBe('Deny');
      expect(secureTransportStmt.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('CloudTrail should use KMS encryption', () => {
      const cloudTrail = template.Resources.CloudTrail as Resource;
      expect(cloudTrail.Properties.KMSKeyId).toBeDefined();
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.LoggingBucket as Resource;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('KMS key should enable rotation', () => {
      const kmsKey = template.Resources.LoggingKMSKey as Resource;
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });
  });

  describe('Resource Dependencies', () => {
    test('CloudTrail should depend on bucket policy', () => {
      const cloudTrail = template.Resources.CloudTrail as Resource;
      expect(cloudTrail.DependsOn).toBe('LoggingBucketPolicy');
    });

    test('Public route should depend on gateway attachment', () => {
      const publicRoute = template.Resources.PublicRoute as Resource;
      expect(publicRoute.DependsOn).toBe('AttachGateway');
    });

    test('should have proper VPC references', () => {
      const vpcDependentResources = ['PublicSubnet', 'PrivateSubnet', 'PublicRouteTable', 'PrivateRouteTable', 'EC2SecurityGroup'];
      
      vpcDependentResources.forEach(resourceName => {
        const resource = template.Resources[resourceName] as Resource;
        expect(resource.Properties.VpcId).toEqual({ Ref: 'SecureVPC' });
      });
    });
  });

  describe('Parameter Validation Logic', () => {
    test('should validate CIDR blocks format', () => {
      const trustedIpParam = template.Parameters.TrustedIpCidrs;
      const defaultValue = trustedIpParam.Default;
      
      // Basic CIDR format check for default values
      const cidrBlocks = defaultValue.split(',');
      cidrBlocks.forEach((cidr: string) => {
        expect(cidr).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/);
      });
    });

    test('environment suffix should follow naming conventions', () => {
      const envSuffix = template.Parameters.EnvironmentSuffix;
      const pattern = new RegExp(envSuffix.AllowedPattern);
      expect(pattern.test(envSuffix.Default)).toBe(true);
    });
  });

  describe('Resource Naming Consistency', () => {
    test('bucket name should follow consistent pattern', () => {
      const bucket = template.Resources.LoggingBucket as Resource;
      const bucketName = bucket.Properties.BucketName['Fn::Sub'];
      
      expect(bucketName).toBe('${BucketNamePrefix}-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}');
    });

    test('trail name should follow consistent pattern', () => {
      const cloudTrail = template.Resources.CloudTrail as Resource;
      const trailName = cloudTrail.Properties.TrailName['Fn::Sub'];
      
      expect(trailName).toBe('${AWS::StackName}-CloudTrail');
    });
  });

  describe('Template Size and Complexity', () => {
    test('should have reasonable number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10);
      expect(resourceCount).toBeLessThan(50); // Avoid overly complex templates
    });

    test('template JSON should be valid and well-formed', () => {
      expect(() => JSON.stringify(template)).not.toThrow();
      
      // Check for circular references
      const jsonString = JSON.stringify(template);
      expect(jsonString.length).toBeGreaterThan(1000);
    });
  });
});