import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
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
        'Secure VPC with EC2, S3, and monitoring - deployed in us-east-1'
      );
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParams = ['EnvironmentSuffix', 'Environment', 'Owner', 'Project', 'AllowedSSHRanges', 'KeyName', 'InstanceType', 'AMIId', 'VPCCidr'];
      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('VPCCidr parameter should have correct default', () => {
      const vpcCidrParam = template.Parameters.VPCCidr;
      expect(vpcCidrParam.Type).toBe('String');
      expect(vpcCidrParam.Default).toBe('10.0.0.0/16');
    });

    test('AllowedSSHRanges should be CommaDelimitedList', () => {
      const sshRangesParam = template.Parameters.AllowedSSHRanges;
      expect(sshRangesParam.Type).toBe('CommaDelimitedList');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VPCCidr' });
    });

    test('should have InternetGateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have NAT Gateway and EIP', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGatewayEIP).toBeDefined();
      expect(template.Resources.NATGatewayEIP.Type).toBe('AWS::EC2::EIP');
    });
  });

  describe('Subnet Resources', () => {
    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('subnets should use dynamic CIDR allocation', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      expect(publicSubnet1.Properties.CidrBlock).toEqual({
        "Fn::Select": [0, {"Fn::Cidr": [{"Ref": "VPCCidr"}, 4, 8]}]
      });
    });

    test('subnets should use dynamic AZ selection', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      expect(publicSubnet1.Properties.AvailabilityZone).toEqual({
        "Fn::Select": [0, {"Fn::GetAZs": ""}]
      });
    });
  });

  describe('Route Tables and Routes', () => {
    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
    });

    test('should have route table associations', () => {
      expect(template.Resources.PublicSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation2).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation2).toBeDefined();
    });
  });

  describe('Security Resources', () => {
    test('should have KMS key with encryption enabled', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.KMSKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have SSH security group', () => {
      expect(template.Resources.SSHSecurityGroup).toBeDefined();
      expect(template.Resources.SSHSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have conditional SSH ingress rules', () => {
      expect(template.Resources.SSHSecurityGroupIngress1).toBeDefined();
      expect(template.Resources.SSHSecurityGroupIngress1.Condition).toBe('HasFirstSSHRange');
      expect(template.Resources.SSHSecurityGroupIngress2).toBeDefined();
      expect(template.Resources.SSHSecurityGroupIngress2.Condition).toBe('HasSecondSSHRange');
    });
  });

  describe('EC2 Resources', () => {
    test('should have EC2 instance', () => {
      expect(template.Resources.EC2Instance).toBeDefined();
      expect(template.Resources.EC2Instance.Type).toBe('AWS::EC2::Instance');
    });

    test('EC2 instance should be in private subnet', () => {
      const ec2Instance = template.Resources.EC2Instance;
      expect(ec2Instance.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
    });

    test('should have IAM role and instance profile', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('S3 Resources', () => {
    test('should have S3 bucket with security configurations', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      expect(template.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should block public access', () => {
      const s3Bucket = template.Resources.S3Bucket;
      const publicAccessConfig = s3Bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have KMS encryption', () => {
      const s3Bucket = template.Resources.S3Bucket;
      const encryption = s3Bucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('should have S3 access log bucket', () => {
      expect(template.Resources.S3AccessLogBucket).toBeDefined();
      expect(template.Resources.S3AccessLogBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have S3 bucket policy denying insecure connections', () => {
      expect(template.Resources.S3BucketPolicy).toBeDefined();
      expect(template.Resources.S3BucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('CloudTrail and Monitoring', () => {
    test('should have CloudTrail', () => {
      expect(template.Resources.CloudTrail).toBeDefined();
      expect(template.Resources.CloudTrail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('should have CloudWatch log groups', () => {
      expect(template.Resources.CloudTrailLogGroup).toBeDefined();
      expect(template.Resources.CloudTrailLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.S3AccessLogGroup).toBeDefined();
      expect(template.Resources.S3AccessLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.S3PublicAccessAlarm).toBeDefined();
      expect(template.Resources.UnauthorizedAPICallsAlarm).toBeDefined();
      expect(template.Resources.SSHFailureAlarm).toBeDefined();
    });
  });

  describe('Lambda Function', () => {
    test('should have S3 log processor Lambda function', () => {
      expect(template.Resources.S3LogProcessorFunction).toBeDefined();
      expect(template.Resources.S3LogProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function should have proper runtime and handler', () => {
      const lambda = template.Resources.S3LogProcessorFunction;
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
    });

    test('should have Lambda permission for S3 trigger', () => {
      expect(template.Resources.S3LogProcessorPermission).toBeDefined();
      expect(template.Resources.S3LogProcessorPermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('Conditions', () => {
    test('should have SSH range conditions', () => {
      expect(template.Conditions.HasFirstSSHRange).toBeDefined();
      expect(template.Conditions.HasSecondSSHRange).toBeDefined();
      expect(template.Conditions.HasThirdSSHRange).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VpcId',
        'PublicSubnetIds',
        'PrivateSubnetIds',
        'S3BucketName',
        'KmsKeyId',
        'InstanceId',
        'IAMRoleName',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VpcId output should be correct', () => {
      const output = template.Outputs.VpcId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('subnet outputs should join multiple subnets', () => {
      const publicOutput = template.Outputs.PublicSubnetIds;
      expect(publicOutput.Value).toEqual({
        "Fn::Join": [",", [{"Ref": "PublicSubnet1"}, {"Ref": "PublicSubnet2"}]]
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
      expect(template.Conditions).not.toBeNull();
    });

    test('should have comprehensive resource count (VPC infrastructure)', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // VPC infrastructure has many resources
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with environment suffix', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value).toEqual({
        'Fn::Sub': '${Project}-${EnvironmentSuffix}-vpc'
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });
});
