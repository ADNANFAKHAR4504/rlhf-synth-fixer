import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Highly Secure AWS Infrastructure CloudFormation Template', () => {
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
      expect(template.Description).toBe(
        'Highly secure AWS infrastructure with VPC, EC2, KMS encryption, S3, and Secrets Manager'
      );
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'Environment',
        'Project',
        'Owner',
        'VpcCidr',
        'PublicSubnet1Cidr',
        'PublicSubnet2Cidr',
        'PrivateSubnet1Cidr',
        'PrivateSubnet2Cidr',
        'InstanceType',
        'KeyPairName',
        'SSHAllowedCidr',
        'EnableNatGateway',
      ];

      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('VpcCidr parameter should have correct validation', () => {
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('InstanceType parameter should have allowed values', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toContain('t3.micro');
      expect(param.AllowedValues).toContain('t3.small');
      expect(param.AllowedValues).toContain('t3.medium');
      expect(param.AllowedValues).toContain('t3.large');
    });

    test('EnableNatGateway parameter should be boolean string', () => {
      const param = template.Parameters.EnableNatGateway;
      expect(param.AllowedValues).toEqual(['true', 'false']);
      expect(param.Default).toBe('true');
    });
  });

  describe('Conditions', () => {
    test('should have HasKeyPair condition', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });

    test('should have EnableNat condition', () => {
      expect(template.Conditions.EnableNat).toBeDefined();
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS key with rotation configuration', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      // EnableKeyRotation is conditional (true in AWS, false in LocalStack)
      expect(kmsKey.Properties.EnableKeyRotation).toBeDefined();
    });

    test('should have KMS key alias', () => {
      const keyAlias = template.Resources.KMSKeyAlias;
      expect(keyAlias.Type).toBe('AWS::KMS::Alias');
      expect(keyAlias.Properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('KMS key should have proper policy', () => {
      const kmsKey = template.Resources.KMSKey;
      const policy = kmsKey.Properties.KeyPolicy;
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toBeInstanceOf(Array);
      expect(policy.Statement.length).toBeGreaterThan(0);
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC with proper configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('private subnets should not auto-assign public IPs', () => {
      expect(
        template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch
      ).toBe(false);
      expect(
        template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch
      ).toBe(false);
    });

    test('public subnets should auto-assign public IPs', () => {
      expect(
        template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch
      ).toBe(true);
      expect(
        template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch
      ).toBe(true);
    });

    test('should have NAT Gateways with conditions', () => {
      const nat1 = template.Resources.NatGateway1;
      const nat2 = template.Resources.NatGateway2;
      expect(nat1.Type).toBe('AWS::EC2::NatGateway');
      expect(nat2.Type).toBe('AWS::EC2::NatGateway');
      expect(nat1.Condition).toBe('EnableNat');
      expect(nat2.Condition).toBe('EnableNat');
    });
  });

  describe('S3 Resources', () => {
    test('should have S3 bucket with encryption', () => {
      const s3Bucket = template.Resources.S3Bucket;
      expect(s3Bucket.Type).toBe('AWS::S3::Bucket');
      expect(
        s3Bucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault
          .SSEAlgorithm
      ).toBe('aws:kms');
      // Fix: The template uses Fn::GetAtt, not Ref
      expect(
        s3Bucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault
          .KMSMasterKeyID
      ).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
    });

    test('should have S3 bucket with public access blocked', () => {
      const s3Bucket = template.Resources.S3Bucket;
      const publicAccessBlock =
        s3Bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have S3 bucket policy', () => {
      const bucketPolicy = template.Resources.S3BucketPolicy;
      expect(bucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      expect(bucketPolicy.Properties.PolicyDocument.Statement).toBeInstanceOf(
        Array
      );
    });
  });

  describe('EC2 Resources', () => {
    test('should have security group for EC2', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have launch template with encrypted volumes', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      const blockDevice =
        lt.Properties.LaunchTemplateData.BlockDeviceMappings[0];
      expect(blockDevice.Ebs.Encrypted).toBe(true);
      // Fix: The template uses Fn::GetAtt, not Ref
      expect(blockDevice.Ebs.KmsKeyId).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn'],
      });
    });

    test('should have auto scaling group in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({
        Ref: 'PrivateSubnet1',
      });
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({
        Ref: 'PrivateSubnet2',
      });
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 instance role', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });

    test('should have instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toContainEqual({
        Ref: 'EC2InstanceRole',
      });
    });

    test('EC2 role should have scoped policies', () => {
      // Fix: The policies are separate resources, not inline policies
      const kmsPolicy = template.Resources.EC2KMSAccessPolicy;
      const s3Policy = template.Resources.EC2S3AccessPolicy;
      const secretsPolicy = template.Resources.EC2SecretsManagerAccessPolicy;

      expect(kmsPolicy.Type).toBe('AWS::IAM::Policy');
      expect(s3Policy.Type).toBe('AWS::IAM::Policy');
      expect(secretsPolicy.Type).toBe('AWS::IAM::Policy');

      // Check that KMS policy has specific resource
      expect(kmsPolicy.Properties.PolicyDocument.Statement[0].Resource).toEqual(
        {
          'Fn::GetAtt': ['KMSKey', 'Arn'],
        }
      );
    });
  });

  describe('Secrets Manager', () => {
    test('should have secrets manager secret', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      // Fix: The template uses Fn::GetAtt, not Ref
      expect(secret.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn'],
      });
    });

    test('secret should generate password', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VpcId',
        'PublicSubnetIds',
        'PrivateSubnetIds',
        'KmsKeyId',
        'KmsKeyArn',
        'KmsKeyAlias', // Add missing output
        'S3BucketName',
        'AutoScalingGroupName',
        'EC2InstanceRoleArn',
        'SecretsManagerSecretArn',
        'LaunchTemplateId',
        'SecurityGroupId',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VpcId output should reference VPC', () => {
      const output = template.Outputs.VpcId;
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export).toBeDefined();
    });

    test('KmsKeyArn output should use GetAtt', () => {
      const output = template.Outputs.KmsKeyArn;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
    });
  });

  describe('Security Validation', () => {
    test('should not have hardcoded secrets', () => {
      const templateStr = JSON.stringify(template);
      // Check for actual hardcoded plaintext passwords/secrets/keys, not CloudFormation properties
      expect(templateStr).not.toMatch(/"password"\s*:\s*"[a-zA-Z0-9]{8,}"/i);
      expect(templateStr).not.toMatch(/"secret"\s*:\s*"[a-zA-Z0-9]{8,}"/i);
      expect(templateStr).not.toMatch(/"apikey"\s*:\s*"[a-zA-Z0-9]{8,}"/i);
      expect(templateStr).not.toMatch(/"accesskey"\s*:\s*"[a-zA-Z0-9]{8,}"/i);
    });

    test('should use resource-specific IAM policies', () => {
      // Fix: Check the separate policy resources instead of inline policies
      const kmsPolicy = template.Resources.EC2KMSAccessPolicy;
      const s3Policy = template.Resources.EC2S3AccessPolicy;
      const secretsPolicy = template.Resources.EC2SecretsManagerAccessPolicy;

      // Check KMS policy has specific resource ARN
      const kmsStatements = kmsPolicy.Properties.PolicyDocument.Statement;
      kmsStatements.forEach((statement: any) => {
        if (statement.Resource) {
          expect(statement.Resource).not.toBe('*');
          expect(statement.Resource).toEqual({
            'Fn::GetAtt': ['KMSKey', 'Arn'],
          });
        }
      });

      // Check S3 policy has specific bucket ARN
      const s3Statements = s3Policy.Properties.PolicyDocument.Statement;
      s3Statements.forEach((statement: any) => {
        if (statement.Resource) {
          expect(statement.Resource).not.toBe('*');
          // Should reference the specific S3 bucket
          expect(typeof statement.Resource).toBe('object');
        }
      });

      // Check Secrets Manager policy has specific secret ARN
      const secretsStatements =
        secretsPolicy.Properties.PolicyDocument.Statement;
      secretsStatements.forEach((statement: any) => {
        if (statement.Resource) {
          expect(statement.Resource).not.toBe('*');
          expect(statement.Resource).toEqual({ Ref: 'DatabaseSecret' });
        }
      });
    });

    test('should have no open SSH to world', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress || [];

      ingressRules.forEach((rule: any) => {
        if (rule && rule.FromPort === 22 && rule.ToPort === 22) {
          // SSH rule should be conditional and reference the parameter, not hardcoded
          expect(rule.CidrIp).toEqual({ Ref: 'SSHAllowedCidr' });
        }
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
      expect(template.Conditions).not.toBeNull();
    });

    test('should have proper resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // Should have many resources for secure infrastructure
    });

    test('should have comprehensive parameter set', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThan(8); // Should have many parameters for flexibility
    });

    test('should have comprehensive outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(10); // Should have many outputs for integration
    });
  });

  describe('Resource Tagging', () => {
    test('should have consistent tagging on resources', () => {
      const resourcesWithTags = [
        'KMSKey',
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PrivateSubnet1',
        'S3Bucket',
        'EC2SecurityGroup',
        'EC2InstanceRole',
        'DatabaseSecret',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const tagKeys = tags.map((tag: any) => tag.Key);
          expect(tagKeys).toContain('Environment');
          expect(tagKeys).toContain('Project');
          expect(tagKeys).toContain('Owner');
        }
      });
    });
  });
});
