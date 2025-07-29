import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON first: pipenv run cfn-flip TapStack.yml > TapStack.json
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
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'EnvironmentSuffix',
        'InstanceType', 
        'VolumeSize',
        'LogRetentionDays',
        'VpcCidr',
        'SubnetCidr'
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
      expect(param.ConstraintDescription).toBeDefined();
    });

    test('InstanceType parameter should have correct properties', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
      expect(param.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium']);
    });

    test('VolumeSize parameter should have correct properties', () => {
      const param = template.Parameters.VolumeSize;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(20);
      expect(param.MinValue).toBe(8);
      expect(param.MaxValue).toBe(100);
    });

    test('LogRetentionDays parameter should have valid values', () => {
      const param = template.Parameters.LogRetentionDays;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(14);
      expect(param.AllowedValues).toContain(14);
      expect(param.AllowedValues).toContain(30);
      expect(param.AllowedValues).toContain(365);
    });

    test('VpcCidr parameter should have CIDR validation', () => {
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('SubnetCidr parameter should have CIDR validation', () => {
      const param = template.Parameters.SubnetCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.1.0/24');
      expect(param.AllowedPattern).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    test('should have SecureVPC resource', () => {
      expect(template.Resources.SecureVPC).toBeDefined();
      expect(template.Resources.SecureVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('SecureVPC should have correct properties', () => {
      const vpc = template.Resources.SecureVPC.Properties;
      expect(vpc.CidrBlock).toEqual({ Ref: 'VpcCidr' });
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('should have SecureSubnet resource', () => {
      expect(template.Resources.SecureSubnet).toBeDefined();
      expect(template.Resources.SecureSubnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('SecureSubnet should reference VPC', () => {
      const subnet = template.Resources.SecureSubnet.Properties;
      expect(subnet.VpcId).toEqual({ Ref: 'SecureVPC' });
      expect(subnet.CidrBlock).toEqual({ Ref: 'SubnetCidr' });
    });

    test('should have Internet Gateway and Route Table', () => {
      expect(template.Resources.SecureIGW).toBeDefined();
      expect(template.Resources.SecureIGW.Type).toBe('AWS::EC2::InternetGateway');
      
      expect(template.Resources.SecureRouteTable).toBeDefined();
      expect(template.Resources.SecureRouteTable.Type).toBe('AWS::EC2::RouteTable');
      
      expect(template.Resources.SecureRoute).toBeDefined();
      expect(template.Resources.SecureRoute.Type).toBe('AWS::EC2::Route');
    });
  });

  describe('Security Resources', () => {
    test('should have KMS encryption key', () => {
      expect(template.Resources.EncryptionKey).toBeDefined();
      expect(template.Resources.EncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('EncryptionKey should have proper key policy', () => {
      const key = template.Resources.EncryptionKey.Properties;
      expect(key.KeyPolicy).toBeDefined();
      expect(key.KeyPolicy.Version).toBe('2012-10-17');
      expect(key.KeyPolicy.Statement).toBeDefined();
      expect(Array.isArray(key.KeyPolicy.Statement)).toBe(true);
      expect(key.EnableKeyRotation).toBe(true);
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.EncryptionKeyAlias).toBeDefined();
      expect(template.Resources.EncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
      expect(template.Resources.EncryptionKeyAlias.Properties.TargetKeyId).toEqual({ Ref: 'EncryptionKey' });
    });

    test('should have security group for EC2', () => {
      expect(template.Resources.SecureEC2SecurityGroup).toBeDefined();
      expect(template.Resources.SecureEC2SecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('SecureEC2SecurityGroup should have proper ingress rules', () => {
      const sg = template.Resources.SecureEC2SecurityGroup.Properties;
      expect(sg.VpcId).toEqual({ Ref: 'SecureVPC' });
      expect(sg.SecurityGroupIngress).toBeDefined();
      expect(Array.isArray(sg.SecurityGroupIngress)).toBe(true);
      
      // Check SSH rule
      const sshRule = sg.SecurityGroupIngress.find((rule: any) => rule.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).toBe('10.0.0.0/8');
    });
  });

  describe('S3 Resources', () => {
    test('should have SecureS3Bucket resource', () => {
      expect(template.Resources.SecureS3Bucket).toBeDefined();
      expect(template.Resources.SecureS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('SecureS3Bucket should have encryption enabled', () => {
      const bucket = template.Resources.SecureS3Bucket.Properties;
      expect(bucket.BucketEncryption).toBeDefined();
      expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      
      const encryption = bucket.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'EncryptionKey' });
    });

    test('SecureS3Bucket should have versioning enabled', () => {
      const bucket = template.Resources.SecureS3Bucket.Properties;
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('SecureS3Bucket should block public access', () => {
      const bucket = template.Resources.SecureS3Bucket.Properties;
      const publicAccess = bucket.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have S3 bucket policy', () => {
      expect(template.Resources.SecureS3BucketPolicy).toBeDefined();
      expect(template.Resources.SecureS3BucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      expect(template.Resources.SecureS3BucketPolicy.Properties.Bucket).toEqual({ Ref: 'SecureS3Bucket' });
    });
  });

  describe('IAM Resources', () => {
    test('should have SecureEC2Role resource', () => {
      expect(template.Resources.SecureEC2Role).toBeDefined();
      expect(template.Resources.SecureEC2Role.Type).toBe('AWS::IAM::Role');
    });

    test('SecureEC2Role should have correct assume role policy', () => {
      const role = template.Resources.SecureEC2Role.Properties;
      expect(role.AssumeRolePolicyDocument).toBeDefined();
      expect(role.AssumeRolePolicyDocument.Version).toBe('2012-10-17');
      
      const statement = role.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('ec2.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('should have SecureEC2Policy resource', () => {
      expect(template.Resources.SecureEC2Policy).toBeDefined();
      expect(template.Resources.SecureEC2Policy.Type).toBe('AWS::IAM::Policy');
    });

    test('SecureEC2Policy should have proper permissions', () => {
      const policy = template.Resources.SecureEC2Policy.Properties;
      expect(policy.PolicyDocument.Version).toBe('2012-10-17');
      expect(Array.isArray(policy.PolicyDocument.Statement)).toBe(true);
      
      // Check for S3 permissions
      const s3Statement = policy.PolicyDocument.Statement.find((stmt: any) => 
        stmt.Action.includes('s3:GetObject')
      );
      expect(s3Statement).toBeDefined();
    });

    test('should have IAM instance profile', () => {
      expect(template.Resources.SecureEC2InstanceProfile).toBeDefined();
      expect(template.Resources.SecureEC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(template.Resources.SecureEC2InstanceProfile.Properties.Roles).toEqual([{ Ref: 'SecureEC2Role' }]);
    });
  });

  describe('EC2 Resources', () => {
    test('should have SecureEC2Instance resource', () => {
      expect(template.Resources.SecureEC2Instance).toBeDefined();
      expect(template.Resources.SecureEC2Instance.Type).toBe('AWS::EC2::Instance');
    });

    test('SecureEC2Instance should use SSM parameter for AMI', () => {
      const instance = template.Resources.SecureEC2Instance.Properties;
      expect(instance.ImageId).toBeDefined();
      // Should use SSM parameter for dynamic AMI lookup
      expect(JSON.stringify(instance.ImageId)).toContain('resolve:ssm');
    });

    test('SecureEC2Instance should have proper configuration', () => {
      const instance = template.Resources.SecureEC2Instance.Properties;
      expect(instance.InstanceType).toEqual({ Ref: 'InstanceType' });
      expect(instance.IamInstanceProfile).toEqual({ Ref: 'SecureEC2InstanceProfile' });
      expect(instance.SubnetId).toEqual({ Ref: 'SecureSubnet' });
      expect(instance.SecurityGroupIds).toEqual([{ Ref: 'SecureEC2SecurityGroup' }]);
    });

    test('should have encrypted EBS volume', () => {
      expect(template.Resources.SecureEBSVolume).toBeDefined();
      expect(template.Resources.SecureEBSVolume.Type).toBe('AWS::EC2::Volume');
      
      const volume = template.Resources.SecureEBSVolume.Properties;
      expect(volume.Encrypted).toBe(true);
      expect(volume.KmsKeyId).toEqual({ Ref: 'EncryptionKey' });
      expect(volume.Size).toEqual({ Ref: 'VolumeSize' });
    });

    test('should have volume attachment', () => {
      expect(template.Resources.SecureVolumeAttachment).toBeDefined();
      expect(template.Resources.SecureVolumeAttachment.Type).toBe('AWS::EC2::VolumeAttachment');
      
      const attachment = template.Resources.SecureVolumeAttachment.Properties;
      expect(attachment.InstanceId).toEqual({ Ref: 'SecureEC2Instance' });
      expect(attachment.VolumeId).toEqual({ Ref: 'SecureEBSVolume' });
      expect(attachment.Device).toBe('/dev/sdf');
    });
  });

  describe('Secrets and Parameters', () => {
    test('should have DatabaseSecret resource', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DatabaseSecret should be encrypted with KMS', () => {
      const secret = template.Resources.DatabaseSecret.Properties;
      expect(secret.KmsKeyId).toEqual({ Ref: 'EncryptionKey' });
      expect(secret.GenerateSecretString).toBeDefined();
    });

    test('should have SecureSSMParameter resource', () => {
      expect(template.Resources.SecureSSMParameter).toBeDefined();
      expect(template.Resources.SecureSSMParameter.Type).toBe('AWS::SSM::Parameter');
    });

    test('SecureSSMParameter should reference secrets manager', () => {
      const param = template.Resources.SecureSSMParameter.Properties;
      expect(param.Type).toBe('String');
      expect(JSON.stringify(param.Value)).toContain('resolve:secretsmanager');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have S3AccessLogGroup resource', () => {
      expect(template.Resources.S3AccessLogGroup).toBeDefined();
      expect(template.Resources.S3AccessLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('S3AccessLogGroup should be encrypted', () => {
      const logGroup = template.Resources.S3AccessLogGroup.Properties;
      expect(logGroup.KmsKeyId).toEqual({ 'Fn::GetAtt': ['EncryptionKey', 'Arn'] });
      expect(logGroup.RetentionInDays).toEqual({ Ref: 'LogRetentionDays' });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VpcId',
        'SubnetId',
        'S3BucketName',
        'S3BucketArn',
        'KMSKeyId',
        'KMSKeyArn',
        'IAMRoleArn',
        'EC2InstanceId',
        'SecurityGroupId',
        'SSMParameterName',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('outputs should have proper export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`
        });
      });
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Value).toEqual({ Ref: 'SecureS3Bucket' });
      expect(output.Description).toContain('S3 bucket');
    });

    test('KMSKeyArn output should use GetAtt', () => {
      const output = template.Outputs.KMSKeyArn;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['EncryptionKey', 'Arn'] });
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have Environment tag', () => {
      const taggableResources = [
        'SecureVPC',
        'SecureSubnet', 
        'EncryptionKey',
        'SecureS3Bucket',
        'SecureEC2SecurityGroup',
        'SecureEC2Instance',
        'SecureEBSVolume'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const environmentTag = resource.Properties.Tags.find((tag: any) => 
            tag.Key === 'Environment'
          );
          expect(environmentTag).toBeDefined();
          expect(environmentTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
        }
      });
    });

    test('all taggable resources should have Name tag', () => {
      const taggableResources = [
        'SecureVPC',
        'SecureSubnet',
        'EncryptionKey', 
        'SecureS3Bucket',
        'SecureEC2SecurityGroup',
        'SecureEC2Instance',
        'SecureEBSVolume'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((tag: any) => 
            tag.Key === 'Name'
          );
          expect(nameTag).toBeDefined();
        }
      });
    });
  });

  describe('Security Validation', () => {
    test('all storage resources should be encrypted', () => {
      // S3 Bucket encryption
      const s3Bucket = template.Resources.SecureS3Bucket.Properties;
      expect(s3Bucket.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');

      // EBS Volume encryption
      const ebsVolume = template.Resources.SecureEBSVolume.Properties;
      expect(ebsVolume.Encrypted).toBe(true);

      // CloudWatch Logs encryption
      const logGroup = template.Resources.S3AccessLogGroup.Properties;
      expect(logGroup.KmsKeyId).toBeDefined();
    });

    test('S3 bucket should deny insecure transport', () => {
      const bucketPolicy = template.Resources.SecureS3BucketPolicy.Properties;
      const denyStatement = bucketPolicy.PolicyDocument.Statement.find((stmt: any) => 
        stmt.Effect === 'Deny' && stmt.Condition && stmt.Condition.Bool
      );
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('security group should restrict SSH access', () => {
      const sg = template.Resources.SecureEC2SecurityGroup.Properties;
      const sshRule = sg.SecurityGroupIngress.find((rule: any) => rule.FromPort === 22);
      expect(sshRule.CidrIp).toBe('10.0.0.0/8'); // Only private networks
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have circular dependencies', () => {
      // Check that resources don't reference themselves
      Object.keys(template.Resources).forEach(resourceName => {
        const resourceStr = JSON.stringify(template.Resources[resourceName]);
        expect(resourceStr).not.toContain(`"Ref":"${resourceName}"`);
      });
    });

    test('should have proper resource count for secure infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(15); // Should have substantial infrastructure
    });

    test('all required parameters should have defaults', () => {
      Object.keys(template.Parameters).forEach(paramName => {
        const param = template.Parameters[paramName];
        expect(param.Default).toBeDefined();
      });
    });
  });
});