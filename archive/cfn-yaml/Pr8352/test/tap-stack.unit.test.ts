import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Production Security Infrastructure', () => {
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

    test('should have correct security-focused description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Production-grade secure infrastructure with encryption, monitoring, and least-privilege access controls'
      );
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      const parameterGroups = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(parameterGroups).toHaveLength(3);
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const envParam = template.Parameters.EnvironmentSuffix;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
    });

    test('should have EC2AMIId parameter', () => {
      expect(template.Parameters.EC2AMIId).toBeDefined();
      const amiParam = template.Parameters.EC2AMIId;
      expect(amiParam.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(amiParam.Default).toBe('/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64');
    });

    test('should have EC2InstanceType parameter with allowed values', () => {
      expect(template.Parameters.EC2InstanceType).toBeDefined();
      const instanceParam = template.Parameters.EC2InstanceType;
      expect(instanceParam.Type).toBe('String');
      expect(instanceParam.Default).toBe('t3.medium');
      expect(instanceParam.AllowedValues).toContain('t3.micro');
      expect(instanceParam.AllowedValues).toContain('t3.medium');
    });

    test('should have AllowedSSHCIDR parameter with pattern validation', () => {
      expect(template.Parameters.AllowedSSHCIDR).toBeDefined();
      const cidrParam = template.Parameters.AllowedSSHCIDR;
      expect(cidrParam.Type).toBe('String');
      expect(cidrParam.AllowedPattern).toBe('^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$');
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS key with correct properties', () => {
      expect(template.Resources.ProdKMSKey).toBeDefined();
      const kmsKey = template.Resources.ProdKMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.DeletionPolicy).toBe('Delete');
      expect(kmsKey.UpdateReplacePolicy).toBe('Delete');
    });

    test('KMS key should have least-privilege policy', () => {
      const kmsKey = template.Resources.ProdKMSKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');

      const statements = keyPolicy.Statement;
      expect(statements).toHaveLength(5);

      // Check for root permissions
      const rootStatement = statements.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');

      // Check for service permissions
      const servicesWithAccess = ['logs', 's3.amazonaws.com', 'ec2.amazonaws.com', 'sns.amazonaws.com'];
      servicesWithAccess.forEach(service => {
        const serviceStatement = statements.find((s: any) =>
          s.Principal && s.Principal.Service &&
          (s.Principal.Service === service || s.Principal.Service['Fn::Sub'])
        );
        expect(serviceStatement).toBeDefined();
      });
    });

    test('should have KMS key alias with environment suffix', () => {
      expect(template.Resources.ProdKMSKeyAlias).toBeDefined();
      const alias = template.Resources.ProdKMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/prod-${EnvironmentSuffix}-security-key'
      });
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC with correct configuration', () => {
      expect(template.Resources.ProdVPC).toBeDefined();
      const vpc = template.Resources.ProdVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.ProdPublicSubnet).toBeDefined();
      expect(template.Resources.ProdPrivateSubnet).toBeDefined();

      const publicSubnet = template.Resources.ProdPublicSubnet;
      const privateSubnet = template.Resources.ProdPrivateSubnet;

      expect(publicSubnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(privateSubnet.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(publicSubnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have NAT Gateway for private subnet internet access', () => {
      expect(template.Resources.ProdNATGateway).toBeDefined();
      expect(template.Resources.ProdNATGatewayEIP).toBeDefined();

      const natGateway = template.Resources.ProdNATGateway;
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have proper route tables configuration', () => {
      expect(template.Resources.ProdPublicRouteTable).toBeDefined();
      expect(template.Resources.ProdPrivateRouteTable).toBeDefined();
      expect(template.Resources.ProdPublicRoute).toBeDefined();
      expect(template.Resources.ProdPrivateRoute).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have EC2 security group with restricted SSH access', () => {
      expect(template.Resources.ProdEC2SecurityGroup).toBeDefined();
      const sg = template.Resources.ProdEC2SecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      const sshRule = ingress.find((rule: any) => rule.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).toEqual({ Ref: 'AllowedSSHCIDR' });
    });

    test('should have security group egress rules for necessary services only', () => {
      const sg = template.Resources.ProdEC2SecurityGroup;
      const egress = sg.Properties.SecurityGroupEgress;

      expect(egress).toHaveLength(4); // HTTP, HTTPS, DNS TCP, DNS UDP

      const httpRule = egress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = egress.find((rule: any) => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule.Description).toBe('HTTP outbound for package updates');
      expect(httpsRule.Description).toBe('HTTPS outbound for secure connections');
    });

    test('should have ALB security group for future use', () => {
      expect(template.Resources.ProdALBSecurityGroup).toBeDefined();
      const albSg = template.Resources.ProdALBSecurityGroup;
      expect(albSg.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe('IAM Roles and Policies - Least Privilege', () => {
    test('should have EC2 role with correct trust policy', () => {
      expect(template.Resources.ProdEC2Role).toBeDefined();
      const role = template.Resources.ProdEC2Role;
      expect(role.Type).toBe('AWS::IAM::Role');

      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Version).toBe('2012-10-17');
      expect(trustPolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('should have minimal S3 permissions policy', () => {
      const role = template.Resources.ProdEC2Role;
      const policies = role.Properties.Policies;

      const s3Policy = policies.find((p: any) => p.PolicyName['Fn::Sub'] === 'prod-${EnvironmentSuffix}-s3-access-policy');
      expect(s3Policy).toBeDefined();

      const statements = s3Policy.PolicyDocument.Statement;
      expect(statements).toHaveLength(3); // Object actions, list bucket, KMS permissions
    });

    test('should have CloudWatch logging permissions', () => {
      const role = template.Resources.ProdEC2Role;
      const policies = role.Properties.Policies;

      const cwPolicy = policies.find((p: any) => p.PolicyName['Fn::Sub'] === 'prod-${EnvironmentSuffix}-cloudwatch-policy');
      expect(cwPolicy).toBeDefined();

      const statement = cwPolicy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('logs:CreateLogGroup');
      expect(statement.Action).toContain('logs:PutLogEvents');
    });

    test('should have instance profile', () => {
      expect(template.Resources.ProdEC2InstanceProfile).toBeDefined();
      const profile = template.Resources.ProdEC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('S3 Security Controls', () => {
    test('should have S3 bucket with KMS encryption', () => {
      expect(template.Resources.ProdS3Bucket).toBeDefined();
      const bucket = template.Resources.ProdS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('should block all public access', () => {
      const bucket = template.Resources.ProdS3Bucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have versioning enabled', () => {
      const bucket = template.Resources.ProdS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have access logging bucket', () => {
      expect(template.Resources.ProdS3LoggingBucket).toBeDefined();
      const bucket = template.Resources.ProdS3Bucket;
      expect(bucket.Properties.LoggingConfiguration).toBeDefined();
    });

    test('should have HTTPS-only bucket policy', () => {
      expect(template.Resources.ProdS3BucketPolicy).toBeDefined();
      const policy = template.Resources.ProdS3BucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;

      const denyInsecure = statements.find((s: any) => s.Sid === 'DenyInsecureConnections');
      expect(denyInsecure).toBeDefined();
      expect(denyInsecure.Effect).toBe('Deny');
      expect(denyInsecure.Condition.Bool['aws:SecureTransport']).toBe('false');
    });
  });

  describe('EC2 Instance Security', () => {
    test('should have EC2 instance in private subnet', () => {
      expect(template.Resources.ProdEC2Instance).toBeDefined();
      const instance = template.Resources.ProdEC2Instance;
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.SubnetId).toEqual({ Ref: 'ProdPrivateSubnet' });
    });

    test('should have encrypted EBS volumes', () => {
      const instance = template.Resources.ProdEC2Instance;
      const blockDevices = instance.Properties.BlockDeviceMappings;

      expect(blockDevices).toHaveLength(1);
      expect(blockDevices[0].Ebs.Encrypted).toBe(true);
      expect(blockDevices[0].Ebs.KmsKeyId).toEqual({ Ref: 'ProdKMSKey' });
      expect(blockDevices[0].Ebs.DeleteOnTermination).toBe(true);
    });

    test('should have CloudWatch agent user data', () => {
      const instance = template.Resources.ProdEC2Instance;
      expect(instance.Properties.UserData).toBeDefined();

      const userData = instance.Properties.UserData['Fn::Base64']['Fn::Sub'];
      expect(userData).toContain('amazon-cloudwatch-agent');
      expect(userData).toContain('yum install -y amazon-cloudwatch-agent');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have encrypted log group', () => {
      expect(template.Resources.ProdCloudWatchLogGroup).toBeDefined();
      const logGroup = template.Resources.ProdCloudWatchLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['ProdKMSKey', 'Arn'] });
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have CPU utilization alarm', () => {
      expect(template.Resources.ProdCPUAlarm).toBeDefined();
      const alarm = template.Resources.ProdCPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have network monitoring alarms', () => {
      expect(template.Resources.ProdNetworkInAlarm).toBeDefined();
      expect(template.Resources.ProdNetworkOutAlarm).toBeDefined();

      const networkInAlarm = template.Resources.ProdNetworkInAlarm;
      const networkOutAlarm = template.Resources.ProdNetworkOutAlarm;

      expect(networkInAlarm.Properties.MetricName).toBe('NetworkIn');
      expect(networkOutAlarm.Properties.MetricName).toBe('NetworkOut');
      expect(networkInAlarm.Properties.Threshold).toBe(1000000000); // 1GB
      expect(networkOutAlarm.Properties.Threshold).toBe(1000000000); // 1GB
    });

    test('should have encrypted SNS topic for alerts', () => {
      expect(template.Resources.ProdSNSTopic).toBeDefined();
      const topic = template.Resources.ProdSNSTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'ProdKMSKey' });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should use prod-${EnvironmentSuffix} naming', () => {
      const resourcesWithNaming = [
        'ProdKMSKeyAlias',
        'ProdVPC',
        'ProdPublicSubnet',
        'ProdPrivateSubnet',
        'ProdEC2SecurityGroup',
        'ProdS3Bucket',
        'ProdEC2Role',
        'ProdCloudWatchLogGroup',
        'ProdSNSTopic'
      ];

      resourcesWithNaming.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();

        // Check naming in various property locations
        const props = resource.Properties;
        if (props.Tags) {
          const nameTag = props.Tags.find((tag: any) => tag.Key === 'Name');
          if (nameTag) {
            expect(nameTag.Value['Fn::Sub']).toContain('prod-${EnvironmentSuffix}');
          }
        }

        if (props.RoleName || props.TopicName || props.BucketName || props.LogGroupName) {
          const nameProperty = props.RoleName || props.TopicName || props.BucketName || props.LogGroupName;
          if (nameProperty && nameProperty['Fn::Sub']) {
            expect(nameProperty['Fn::Sub']).toContain('prod-${EnvironmentSuffix}');
          }
        }
      });
    });
  });

  describe('Deletion Policies', () => {
    test('all resources should have Delete policies for testing', () => {
      const resourcesWithDeletionPolicy = [
        'ProdKMSKey',
        'ProdVPC',
        'ProdInternetGateway',
        'ProdPublicSubnet',
        'ProdPrivateSubnet',
        'ProdNATGatewayEIP',
        'ProdNATGateway',
        'ProdPublicRouteTable',
        'ProdPrivateRouteTable',
        'ProdEC2SecurityGroup',
        'ProdALBSecurityGroup',
        'ProdEC2Role',
        'ProdEC2InstanceProfile',
        'ProdS3Bucket',
        'ProdS3LoggingBucket',
        'ProdCloudWatchLogGroup',
        'ProdEC2Instance',
        'ProdCPUAlarm',
        'ProdNetworkInAlarm',
        'ProdNetworkOutAlarm',
        'ProdSNSTopic'
      ];

      resourcesWithDeletionPolicy.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
        expect(resource.UpdateReplacePolicy).toBe('Delete');
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required security infrastructure outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PrivateSubnetId',
        'EC2InstanceId',
        'S3BucketName',
        'KMSKeyId',
        'CloudWatchLogGroup',
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
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have comprehensive security infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // Comprehensive infrastructure
    });

    test('should have security-focused parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4); // EnvironmentSuffix, EC2AMIId, EC2InstanceType, AllowedSSHCIDR
    });

    test('should have comprehensive outputs for integration testing', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });
  });
});