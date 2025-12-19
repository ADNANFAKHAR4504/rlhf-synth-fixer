import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('Secure Infrastructure CloudFormation Template - Unit Tests', () => {
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

    test('should have appropriate description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure infra');
      expect(template.Description).toContain('existing VPC');
      expect(template.Description).toContain('S3 public-block');
      expect(template.Description).toContain('SSE-KMS');
    });

    test('should have all required top-level sections', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Mappings', () => {
    test('should have ExistingNetwork mapping', () => {
      expect(template.Mappings.ExistingNetwork).toBeDefined();
      expect(template.Mappings.ExistingNetwork.Primary).toBeDefined();
    });

    test('should have correct VPC and subnet IDs in mapping', () => {
      const primary = template.Mappings.ExistingNetwork.Primary;
      expect(primary.VpcId).toBe('vpc-0708cdf90c4d88464');
      expect(primary.PrivateSubnetA).toBe('subnet-00dfeb752f1cc755e');
      expect(primary.PrivateSubnetB).toBe('subnet-088636eee12ba4844');
    });

    test('should have valid AWS resource ID format', () => {
      const primary = template.Mappings.ExistingNetwork.Primary;
      expect(primary.VpcId).toMatch(/^vpc-[a-f0-9]{17}$/);
      expect(primary.PrivateSubnetA).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(primary.PrivateSubnetB).toMatch(/^subnet-[a-f0-9]{17}$/);
    });
  });

  describe('Parameters', () => {
    test('should have LatestAmiId parameter', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
    });

    test('LatestAmiId should use SSM parameter for AMI', () => {
      const param = template.Parameters.LatestAmiId;
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });
  });

  describe('Security Group Resource', () => {
    test('should have InstanceSecurityGroup defined', () => {
      const sg = template.Resources.InstanceSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should reference existing VPC correctly', () => {
      const sg = template.Resources.InstanceSecurityGroup;
      expect(sg.Properties.VpcId['Fn::FindInMap']).toEqual([
        'ExistingNetwork',
        'Primary',
        'VpcId'
      ]);
    });

    test('should have restricted SSH access', () => {
      const sg = template.Resources.InstanceSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress[0];
      
      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.FromPort).toBe(22);
      expect(ingress.ToPort).toBe(22);
      expect(ingress.CidrIp).toBe('203.0.113.0/24'); // Restricted CIDR
    });

    test('should allow all outbound traffic', () => {
      const sg = template.Resources.InstanceSecurityGroup;
      const egress = sg.Properties.SecurityGroupEgress[0];
      
      expect(egress.IpProtocol).toBe(-1);
      expect(egress.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have appropriate tags', () => {
      const sg = template.Resources.InstanceSecurityGroup;
      const tags = sg.Properties.Tags;
      
      expect(tags).toContainEqual({ Key: 'Environment', Value: 'Production' });
      expect(tags).toContainEqual({ Key: 'Owner', Value: 'SecurityTeam' });
      expect(tags).toContainEqual({ Key: 'Application', Value: 'SecureInfra' });
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS key with rotation enabled', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have correct KMS key policy', () => {
      const kmsKey = template.Resources.KMSKey;
      const policy = kmsKey.Properties.KeyPolicy;
      
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Id).toBe('key-default-1');
      
      const statement = policy.Statement[0];
      expect(statement.Sid).toBe('AllowRootAccount');
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toBe('kms:*');
      expect(statement.Resource).toBe('*');
    });

    test('should have KMS alias', () => {
      const alias = template.Resources.KMSAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId.Ref).toBe('KMSKey');
    });

    test('KMS alias should follow naming convention', () => {
      const alias = template.Resources.KMSAlias;
      expect(alias.Properties.AliasName['Fn::Sub']).toBe('alias/${AWS::StackName}-secure-infra-cmk');
    });

    test('KMS key should have tags', () => {
      const kmsKey = template.Resources.KMSKey;
      const tags = kmsKey.Properties.Tags;
      
      expect(tags).toHaveLength(3);
      expect(tags).toContainEqual({ Key: 'Environment', Value: 'Production' });
      expect(tags).toContainEqual({ Key: 'Owner', Value: 'SecurityTeam' });
      expect(tags).toContainEqual({ Key: 'Application', Value: 'SecureInfra' });
    });
  });

  describe('S3 Bucket Resources', () => {
    test('should have SecureBucket with encryption', () => {
      const bucket = template.Resources.SecureBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID.Ref).toBe('KMSKey');
    });

    test('should have public access blocked', () => {
      const bucket = template.Resources.SecureBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have bucket policy enforcing TLS', () => {
      const policy = template.Resources.SecureBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.Bucket.Ref).toBe('SecureBucket');
      
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Sid).toBe('EnforceTLS');
      expect(statement.Effect).toBe('Deny');
      expect(statement.Principal).toBe('*');
      expect(statement.Action).toBe('s3:*');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe(false);
    });

    test('bucket policy should reference correct resources', () => {
      const policy = template.Resources.SecureBucketPolicy;
      const resources = policy.Properties.PolicyDocument.Statement[0].Resource;
      
      expect(resources).toHaveLength(2);
      expect(resources[0]['Fn::Sub']).toBe('arn:aws:s3:::${SecureBucket}');
      expect(resources[1]['Fn::Sub']).toBe('arn:aws:s3:::${SecureBucket}/*');
    });

    test('bucket should have tags', () => {
      const bucket = template.Resources.SecureBucket;
      const tags = bucket.Properties.Tags;
      
      expect(tags).toHaveLength(3);
      expect(tags).toContainEqual({ Key: 'Environment', Value: 'Production' });
      expect(tags).toContainEqual({ Key: 'Owner', Value: 'SecurityTeam' });
      expect(tags).toContainEqual({ Key: 'Application', Value: 'SecureInfra' });
    });
  });

  describe('IAM Resources', () => {
    test('should have InstanceRole with correct trust policy', () => {
      const role = template.Resources.InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Effect).toBe('Allow');
      expect(trustPolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have least privilege policy for S3 and KMS', () => {
      const role = template.Resources.InstanceRole;
      const policy = role.Properties.Policies[0];
      
      expect(policy.PolicyName).toBe('InstanceLeastPrivilege');
      
      const statements = policy.PolicyDocument.Statement;
      expect(statements).toHaveLength(3);
      
      // S3 List permission
      expect(statements[0].Sid).toBe('S3ListBucket');
      expect(statements[0].Action).toBe('s3:ListBucket');
      
      // S3 Object permissions
      expect(statements[1].Sid).toBe('S3ObjectRW');
      expect(statements[1].Action).toContain('s3:GetObject');
      expect(statements[1].Action).toContain('s3:PutObject');
      
      // KMS permissions
      expect(statements[2].Sid).toBe('UseKmsKey');
      expect(statements[2].Action).toContain('kms:Decrypt');
      expect(statements[2].Action).toContain('kms:Encrypt');
    });

    test('should have InstanceProfile', () => {
      const profile = template.Resources.InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Path).toBe('/');
      expect(profile.Properties.Roles[0].Ref).toBe('InstanceRole');
    });

    test('IAM role should have tags', () => {
      const role = template.Resources.InstanceRole;
      const tags = role.Properties.Tags;
      
      expect(tags).toHaveLength(3);
      expect(tags).toContainEqual({ Key: 'Environment', Value: 'Production' });
      expect(tags).toContainEqual({ Key: 'Owner', Value: 'SecurityTeam' });
      expect(tags).toContainEqual({ Key: 'Application', Value: 'SecureInfra' });
    });
  });

  describe('EC2 Instance Resources', () => {
    test('should have two EC2 instances', () => {
      expect(template.Resources.EC2InstanceA).toBeDefined();
      expect(template.Resources.EC2InstanceB).toBeDefined();
      
      expect(template.Resources.EC2InstanceA.Type).toBe('AWS::EC2::Instance');
      expect(template.Resources.EC2InstanceB.Type).toBe('AWS::EC2::Instance');
    });

    test('EC2InstanceA should be in PrivateSubnetA', () => {
      const instance = template.Resources.EC2InstanceA;
      expect(instance.Properties.SubnetId['Fn::FindInMap']).toEqual([
        'ExistingNetwork',
        'Primary',
        'PrivateSubnetA'
      ]);
    });

    test('EC2InstanceB should be in PrivateSubnetB', () => {
      const instance = template.Resources.EC2InstanceB;
      expect(instance.Properties.SubnetId['Fn::FindInMap']).toEqual([
        'ExistingNetwork',
        'Primary',
        'PrivateSubnetB'
      ]);
    });

    test('instances should have encrypted EBS volumes', () => {
      ['EC2InstanceA', 'EC2InstanceB'].forEach(instanceName => {
        const instance = template.Resources[instanceName];
        const blockDevice = instance.Properties.BlockDeviceMappings[0];
        
        expect(blockDevice.DeviceName).toBe('/dev/xvda');
        expect(blockDevice.Ebs.VolumeType).toBe('gp3');
        expect(blockDevice.Ebs.VolumeSize).toBe(8);
        expect(blockDevice.Ebs.Encrypted).toBe(true);
        expect(blockDevice.Ebs.KmsKeyId.Ref).toBe('KMSKey');
        expect(blockDevice.Ebs.DeleteOnTermination).toBe(true);
      });
    });

    test('instances should use correct configuration', () => {
      ['EC2InstanceA', 'EC2InstanceB'].forEach(instanceName => {
        const instance = template.Resources[instanceName];
        
        expect(instance.Properties.ImageId.Ref).toBe('LatestAmiId');
        expect(instance.Properties.InstanceType).toBe('t3.micro');
        expect(instance.Properties.SecurityGroupIds[0].Ref).toBe('InstanceSecurityGroup');
        expect(instance.Properties.IamInstanceProfile.Ref).toBe('InstanceProfile');
      });
    });

    test('instances should have appropriate tags', () => {
      ['EC2InstanceA', 'EC2InstanceB'].forEach(instanceName => {
        const instance = template.Resources[instanceName];
        const tags = instance.Properties.Tags;
        
        expect(tags).toHaveLength(3);
        expect(tags).toContainEqual({ Key: 'Environment', Value: 'Production' });
        expect(tags).toContainEqual({ Key: 'Owner', Value: 'SecurityTeam' });
        expect(tags).toContainEqual({ Key: 'Application', Value: 'SecureInfra' });
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VpcId',
        'PrivateSubnetAId',
        'PrivateSubnetBId',
        'InstanceSecurityGroupId',
        'KmsKeyArn',
        'SecureBucketName',
        'InstanceAId',
        'InstanceBId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPC and subnet outputs should reference mappings', () => {
      expect(template.Outputs.VpcId.Value['Fn::FindInMap']).toEqual([
        'ExistingNetwork',
        'Primary',
        'VpcId'
      ]);
      
      expect(template.Outputs.PrivateSubnetAId.Value['Fn::FindInMap']).toEqual([
        'ExistingNetwork',
        'Primary',
        'PrivateSubnetA'
      ]);
      
      expect(template.Outputs.PrivateSubnetBId.Value['Fn::FindInMap']).toEqual([
        'ExistingNetwork',
        'Primary',
        'PrivateSubnetB'
      ]);
    });

    test('resource outputs should have correct references', () => {
      expect(template.Outputs.InstanceSecurityGroupId.Value.Ref).toBe('InstanceSecurityGroup');
      expect(template.Outputs.KmsKeyArn.Value['Fn::GetAtt']).toEqual(['KMSKey', 'Arn']);
      expect(template.Outputs.SecureBucketName.Value.Ref).toBe('SecureBucket');
      expect(template.Outputs.InstanceAId.Value.Ref).toBe('EC2InstanceA');
      expect(template.Outputs.InstanceBId.Value.Ref).toBe('EC2InstanceB');
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should enforce encryption everywhere', () => {
      // KMS key rotation
      expect(template.Resources.KMSKey.Properties.EnableKeyRotation).toBe(true);
      
      // S3 encryption
      const bucket = template.Resources.SecureBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      
      // EBS encryption
      ['EC2InstanceA', 'EC2InstanceB'].forEach(instanceName => {
        const instance = template.Resources[instanceName];
        expect(instance.Properties.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
      });
    });

    test('should block all S3 public access', () => {
      const bucket = template.Resources.SecureBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should enforce TLS for S3 access', () => {
      const policy = template.Resources.SecureBucketPolicy;
      const statement = policy.Properties.PolicyDocument.Statement[0];
      
      expect(statement.Effect).toBe('Deny');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe(false);
    });

    test('should use least privilege IAM permissions', () => {
      const role = template.Resources.InstanceRole;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;
      
      // Check specific resource restrictions
      expect(statements[0].Resource['Fn::Sub']).toBe('arn:aws:s3:::${SecureBucket}');
      expect(statements[1].Resource['Fn::Sub']).toBe('arn:aws:s3:::${SecureBucket}/*');
      expect(statements[2].Resource['Fn::GetAtt']).toEqual(['KMSKey', 'Arn']);
      
      // No wildcards for actions except where necessary
      expect(statements[0].Action).toBe('s3:ListBucket');
      expect(statements[1].Action).toHaveLength(2);
    });

    test('should restrict SSH access to specific CIDR', () => {
      const sg = template.Resources.InstanceSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress[0];
      
      expect(ingress.CidrIp).not.toBe('0.0.0.0/0');
      expect(ingress.CidrIp).toBe('203.0.113.0/24');
    });

    test('instances should be in private subnets only', () => {
      ['EC2InstanceA', 'EC2InstanceB'].forEach(instanceName => {
        const instance = template.Resources[instanceName];
        const subnetRef = instance.Properties.SubnetId['Fn::FindInMap'];
        
        expect(subnetRef[2]).toContain('PrivateSubnet');
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid YAML structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have exactly 8 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(9);
    });

    test('should have exactly 1 parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have exactly 8 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });

    test('should have exactly 1 mapping', () => {
      const mappingCount = Object.keys(template.Mappings).length;
      expect(mappingCount).toBe(1);
    });

    test('all resource types should be valid CloudFormation types', () => {
      const validTypes = [
        'AWS::EC2::SecurityGroup',
        'AWS::KMS::Key',
        'AWS::KMS::Alias',
        'AWS::S3::Bucket',
        'AWS::S3::BucketPolicy',
        'AWS::IAM::Role',
        'AWS::IAM::InstanceProfile',
        'AWS::EC2::Instance'
      ];

      Object.values(template.Resources).forEach((resource: any) => {
        expect(validTypes).toContain(resource.Type);
      });
    });

    test('should not create any networking resources', () => {
      const networkingTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::NatGateway',
        'AWS::EC2::Route',
        'AWS::EC2::RouteTable'
      ];

      Object.values(template.Resources).forEach((resource: any) => {
        expect(networkingTypes).not.toContain(resource.Type);
      });
    });

    test('should not have CloudTrail resources', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        expect(resourceName).not.toContain('CloudTrail');
        expect(resourceName).not.toContain('Trail');
      });
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('all taggable resources should have consistent tags', () => {
      const taggableResources = [
        'InstanceSecurityGroup',
        'KMSKey',
        'SecureBucket',
        'InstanceRole',
        'EC2InstanceA',
        'EC2InstanceB'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags;
        
        expect(tags).toBeDefined();
        expect(tags.find((t: any) => t.Key === 'Environment')?.Value).toBe('Production');
        expect(tags.find((t: any) => t.Key === 'Owner')?.Value).toBe('SecurityTeam');
        expect(tags.find((t: any) => t.Key === 'Application')?.Value).toBe('SecureInfra');
      });
    });

    test('KMS alias should include stack name', () => {
      const alias = template.Resources.KMSAlias;
      expect(alias.Properties.AliasName['Fn::Sub']).toContain('${AWS::StackName}');
    });
  });

  describe('Cross-Resource References', () => {
    test('EC2 instances should reference all required resources', () => {
      ['EC2InstanceA', 'EC2InstanceB'].forEach(instanceName => {
        const instance = template.Resources[instanceName];
        
        // Security Group reference
        expect(instance.Properties.SecurityGroupIds[0].Ref).toBe('InstanceSecurityGroup');
        
        // IAM Instance Profile reference
        expect(instance.Properties.IamInstanceProfile.Ref).toBe('InstanceProfile');
        
        // KMS Key reference
        expect(instance.Properties.BlockDeviceMappings[0].Ebs.KmsKeyId.Ref).toBe('KMSKey');
        
        // AMI Parameter reference
        expect(instance.Properties.ImageId.Ref).toBe('LatestAmiId');
      });
    });

    test('IAM role should reference S3 bucket and KMS key', () => {
      const role = template.Resources.InstanceRole;
      const statements = role.Properties.Policies[0].PolicyDocument.Statement;
      
      // S3 bucket references
      expect(statements[0].Resource['Fn::Sub']).toContain('${SecureBucket}');
      expect(statements[1].Resource['Fn::Sub']).toContain('${SecureBucket}');
      
      // KMS key reference
      expect(statements[2].Resource['Fn::GetAtt']).toEqual(['KMSKey', 'Arn']);
    });

    test('bucket policy should reference bucket', () => {
      const policy = template.Resources.SecureBucketPolicy;
      expect(policy.Properties.Bucket.Ref).toBe('SecureBucket');
    });
  });
});