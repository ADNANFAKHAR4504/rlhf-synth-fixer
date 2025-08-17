// test/tap-stack.unit.test.ts
import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Ensure lib/TapStack.json exists (convert YAML to JSON before running tests):
    // pipenv run cfn-flip-to-json lib/TapStack.yml > lib/TapStack.json
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
        'Production-grade secure infrastructure baseline with encryption at rest, least-privilege IAM, and comprehensive monitoring (single region)',
      );
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParameters = [
        'ProjectName',
        'Environment',
        'VpcCidr',
        'PublicSubnetCidrs',
        'PrivateSubnetCidrs',
        'KeyPairName',
        'InstanceType',
        'AlertEmail',
        'AllowSshCidr',
      ];
      expectedParameters.forEach((paramName) => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('iac-nova-model-breaking');
      expect(param.Description).toBe('Project name used for resource naming and tagging');
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.Description).toBe('Environment name (prod, staging, dev)');
    });

    test('VpcCidr parameter should have correct properties', () => {
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBe('^(\\d{1,3}\\.){3}\\d{1,3}/\\d{1,2}$');
    });

    test('KeyPairName parameter should be optional string', () => {
      const param = template.Parameters.KeyPairName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBeDefined(); // empty string allowed
    });

    test('AlertEmail parameter should allow empty or valid email', () => {
      const param = template.Parameters.AlertEmail;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBe('^$|^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have NAT Gateway with EIP', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGatewayEIP).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGatewayEIP.Type).toBe('AWS::EC2::EIP');
    });
  });

  describe('Security Groups', () => {
    test('should have bastion security group', () => {
      expect(template.Resources.BastionSG).toBeDefined();
      expect(template.Resources.BastionSG.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('bastion security group should allow SSH from allowed CIDR', () => {
      const sg = template.Resources.BastionSG;
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.FromPort).toBe(22);
      expect(ingress.ToPort).toBe(22);
      expect(ingress.CidrIp).toEqual({ Ref: 'AllowSshCidr' });
    });

    test('should have application security group', () => {
      expect(template.Resources.AppSG).toBeDefined();
      expect(template.Resources.AppSG.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('application security group should allow SSH only from bastion', () => {
      const sg = template.Resources.AppSG;
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.FromPort).toBe(22);
      expect(ingress.ToPort).toBe(22);
      expect(ingress.SourceSecurityGroupId).toEqual({ Ref: 'BastionSG' });
    });
  });

  describe('KMS Keys', () => {
    test('should have data KMS key with rotation enabled', () => {
      expect(template.Resources.KmsKeyData).toBeDefined();
      expect(template.Resources.KmsKeyData.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.KmsKeyData.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have logs KMS key with rotation enabled', () => {
      expect(template.Resources.KmsKeyLogs).toBeDefined();
      expect(template.Resources.KmsKeyLogs.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.KmsKeyLogs.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have KMS key aliases', () => {
      expect(template.Resources.KmsKeyDataAlias).toBeDefined();
      expect(template.Resources.KmsKeyLogsAlias).toBeDefined();
      expect(template.Resources.KmsKeyDataAlias.Type).toBe('AWS::KMS::Alias');
      expect(template.Resources.KmsKeyLogsAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('S3 Buckets', () => {
    test('should have application data bucket with KMS encryption', () => {
      expect(template.Resources.AppDataBucket).toBeDefined();
      expect(template.Resources.AppDataBucket.Type).toBe('AWS::S3::Bucket');

      const encryption = template.Resources.AppDataBucket.Properties.BucketEncryption;
      expect(
        encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm,
      ).toBe('aws:kms');
      expect(
        encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault
          .KMSMasterKeyID,
      ).toEqual({ Ref: 'KmsKeyData' });
    });

    test('should have CloudTrail logs bucket with SSE-S3 (AES256) encryption', () => {
      expect(template.Resources.TrailLogsBucket).toBeDefined();
      expect(template.Resources.TrailLogsBucket.Type).toBe('AWS::S3::Bucket');

      const encryption = template.Resources.TrailLogsBucket.Properties.BucketEncryption;
      expect(
        encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm,
      ).toBe('AES256');
      // No KMS key id present in SSE-S3 mode
      expect(
        encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault
          .KMSMasterKeyID,
      ).toBeUndefined();
    });

    test('both S3 buckets should have public access blocked', () => {
      const appBucket = template.Resources.AppDataBucket;
      const trailBucket = template.Resources.TrailLogsBucket;

      [appBucket, trailBucket].forEach((bucket) => {
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('both S3 buckets should have versioning enabled', () => {
      const appBucket = template.Resources.AppDataBucket;
      const trailBucket = template.Resources.TrailLogsBucket;
      [appBucket, trailBucket].forEach((bucket) => {
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });
    });
  });

  describe('IAM Roles', () => {
    test('should have instance role with proper trust policy', () => {
      expect(template.Resources.InstanceRole).toBeDefined();
      expect(template.Resources.InstanceRole.Type).toBe('AWS::IAM::Role');

      const trustPolicy = template.Resources.InstanceRole.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('instance role should have SSM managed policy', () => {
      const role = template.Resources.InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      );
    });

    test('should have CloudTrail role', () => {
      expect(template.Resources.CloudTrailRole).toBeDefined();
      expect(template.Resources.CloudTrailRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have instance profile', () => {
      expect(template.Resources.InstanceProfile).toBeDefined();
      expect(template.Resources.InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('EC2 Instances', () => {
    test('should have bastion instance in public subnet', () => {
      expect(template.Resources.BastionInstance).toBeDefined();
      expect(template.Resources.BastionInstance.Type).toBe('AWS::EC2::Instance');
      expect(template.Resources.BastionInstance.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnet1',
      });
    });

    test('should have application instance in private subnet', () => {
      expect(template.Resources.AppInstance).toBeDefined();
      expect(template.Resources.AppInstance.Type).toBe('AWS::EC2::Instance');
      expect(template.Resources.AppInstance.Properties.SubnetId).toEqual({
        Ref: 'PrivateSubnet1',
      });
    });

    test('both instances should have encrypted EBS volumes', () => {
      const bastionInstance = template.Resources.BastionInstance;
      const appInstance = template.Resources.AppInstance;

      [bastionInstance, appInstance].forEach((instance) => {
        const blockDevice = instance.Properties.BlockDeviceMappings[0];
        expect(blockDevice.Ebs.Encrypted).toBe(true);
        expect(blockDevice.Ebs.KmsKeyId).toEqual({ Ref: 'KmsKeyData' });
      });
    });
  });

  describe('CloudWatch and Monitoring', () => {
    test('should have CloudTrail log group without KMS (SCP bypass path)', () => {
      expect(template.Resources.CloudTrailLogGroup).toBeDefined();
      expect(template.Resources.CloudTrailLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(
        template.Resources.CloudTrailLogGroup.Properties.KmsKeyId,
      ).toBeUndefined(); // no KMS on CT log group
    });

    test('should have EC2 log group with KMS encryption', () => {
      expect(template.Resources.EC2LogGroup).toBeDefined();
      expect(template.Resources.EC2LogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.EC2LogGroup.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['KmsKeyLogs', 'Arn'],
      });
    });

    test('should have CloudTrail without KMS key id (SSE-S3 delivery)', () => {
      expect(template.Resources.CloudTrail).toBeDefined();
      expect(template.Resources.CloudTrail.Type).toBe('AWS::CloudTrail::Trail');
      expect(template.Resources.CloudTrail.Properties.KMSKeyId).toBeUndefined();
    });

    test('should have SNS topic for alerts without KMS (avoid SCP grant)', () => {
      expect(template.Resources.AlertTopic).toBeDefined();
      expect(template.Resources.AlertTopic.Type).toBe('AWS::SNS::Topic');
      expect(template.Resources.AlertTopic.Properties.KmsMasterKeyId).toBeUndefined();
    });

    test('should have security metric filters', () => {
      expect(template.Resources.MFUnauthorizedApiCalls).toBeDefined();
      expect(template.Resources.MFConsoleSigninNoMFA).toBeDefined();
      expect(template.Resources.MFRootAccountUsage).toBeDefined();

      [
        template.Resources.MFUnauthorizedApiCalls,
        template.Resources.MFConsoleSigninNoMFA,
        template.Resources.MFRootAccountUsage,
      ].forEach((mf) => {
        expect(mf.Type).toBe('AWS::Logs::MetricFilter');
      });
    });

    test('should have security alarms', () => {
      expect(template.Resources.AlarmUnauthorizedApiCalls).toBeDefined();
      expect(template.Resources.AlarmConsoleSigninNoMFA).toBeDefined();
      expect(template.Resources.AlarmRootAccountUsage).toBeDefined();

      [
        template.Resources.AlarmUnauthorizedApiCalls,
        template.Resources.AlarmConsoleSigninNoMFA,
        template.Resources.AlarmRootAccountUsage,
      ].forEach((alarm) => {
        expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
        // Use toContainEqual for deep object comparison
        expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'AlertTopic' });
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VpcId',
        'PublicSubnetIds',
        'PrivateSubnetIds',
        'AppDataBucketName',
        'TrailLogsBucketName',
        'DataKmsKeyArn',
        'LogsKmsKeyArn',
        'CloudTrailName',
        'CloudTrailLogGroupArn',
        'AlertTopicArn',
        'BastionInstanceId',
        'AppInstanceId',
      ];
      expectedOutputs.forEach((outputName) => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VpcId output should reference VPC', () => {
      const output = template.Outputs.VpcId;
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('subnet outputs should join multiple subnets', () => {
      const publicOutput = template.Outputs.PublicSubnetIds;
      const privateOutput = template.Outputs.PrivateSubnetIds;

      expect(publicOutput.Value).toEqual({
        'Fn::Join': [',', [{ Ref: 'PublicSubnet1' }, { Ref: 'PublicSubnet2' }]],
      });
      expect(privateOutput.Value).toEqual({
        'Fn::Join': [',', [{ Ref: 'PrivateSubnet1' }, { Ref: 'PrivateSubnet2' }]],
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
  });

  describe('Security Validation', () => {
    test('all taggable resources should have consistent tags', () => {
      const taggedResources = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'NATGatewayEIP',
        'NATGateway',
        'PublicRouteTable',
        'PrivateRouteTable',
        'BastionSG',
        'AppSG',
        'KmsKeyData',
        'KmsKeyLogs',
        'AppDataBucket',
        'TrailLogsBucket',
        'InstanceRole',
        'CloudTrailRole',
        'CloudTrailLogGroup',
        'EC2LogGroup',
        'CloudTrail',
        'AlertTopic',
        'BastionInstance',
        'AppInstance',
      ];

      taggedResources.forEach((resourceName) => {
        const res = template.Resources[resourceName];
        if (res && res.Properties && res.Properties.Tags) {
          const tags = res.Properties.Tags;
          const tagMap = tags.reduce((acc: Record<string, any>, tag: any) => {
            acc[tag.Key] = tag.Value;
            return acc;
          }, {});
          expect(tagMap.Project).toEqual({ Ref: 'ProjectName' });
          expect(tagMap.Environment).toEqual({ Ref: 'Environment' });
          expect(tagMap.Region).toEqual({ Ref: 'AWS::Region' });
          expect(tagMap.Owner).toBe('Security');
        }
      });
    });

    test('sensitive resources should have DataClassification tag', () => {
      const sensitiveResources = [
        'AppDataBucket',
        'TrailLogsBucket',
        'CloudTrailLogGroup',
        'EC2LogGroup',
        'BastionInstance',
        'AppInstance',
      ];

      sensitiveResources.forEach((resourceName) => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const classificationTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'DataClassification',
          );
          expect(classificationTag).toBeDefined();
          expect(classificationTag.Value).toBe('Confidential');
        }
      });
    });
  });
});
