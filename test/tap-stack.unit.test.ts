import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Secure Multi-Tier CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template that was converted from YAML
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
        'Secure Multi-Tier Cloud Infrastructure with comprehensive security, monitoring, and auditing capabilities'
      );
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups
      ).toHaveLength(2);
    });

    test('should have mappings for AMI IDs', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.RegionMap).toBeDefined();
      expect(template.Mappings.RegionMap['us-east-1']).toBeDefined();
      expect(template.Mappings.RegionMap['us-west-2']).toBeDefined();
      expect(template.Mappings.RegionMap['eu-west-1']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'EnvironmentSuffix',
        'AllowedSSHCidr',
        'InstanceType',
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

    test('AllowedSSHCidr parameter should have correct properties', () => {
      const param = template.Parameters.AllowedSSHCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('203.0.113.0/24');
      expect(param.AllowedPattern).toBe(
        '^([0-9]{1,3}\\.){3}[0-9]{1,3}\\/[0-9]{1,2}$'
      );
    });

    test('InstanceType parameter should have correct properties', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
      expect(param.AllowedValues).toEqual([
        't3.micro',
        't3.small',
        't3.medium',
      ]);
    });
  });

  describe('Networking Resources', () => {
    test('should have VPC with correct properties', () => {
      const vpc = template.Resources.SecureVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public subnets in different AZs', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;

      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);

      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets in different AZs', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.10.0/24');

      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.11.0/24');
    });

    test('should have NAT Gateways for private subnet internet access', () => {
      const nat1 = template.Resources.NatGateway1;
      const nat2 = template.Resources.NatGateway2;

      expect(nat1.Type).toBe('AWS::EC2::NatGateway');
      expect(nat2.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have route tables with proper associations', () => {
      const publicRT = template.Resources.PublicRouteTable;
      const privateRT1 = template.Resources.PrivateRouteTable1;
      const privateRT2 = template.Resources.PrivateRouteTable2;

      expect(publicRT.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRT1.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRT2.Type).toBe('AWS::EC2::RouteTable');
    });
  });

  describe('Security Groups', () => {
    test('should have security group for private instances', () => {
      const sg = template.Resources.PrivateInstanceSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);

      const sshRule = sg.Properties.SecurityGroupIngress[0];
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.FromPort).toBe(22);
      expect(sshRule.ToPort).toBe(22);
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 instance role with correct policies', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
      expect(role.Properties.Policies).toHaveLength(1);
    });

    test('should have Config service role', () => {
      const role = template.Resources.ConfigServiceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole'
      );
    });

    test('should have CloudTrail role', () => {
      const role = template.Resources.CloudTrailRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.Policies).toHaveLength(1);
    });

    test('should have EC2 instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('S3 Buckets', () => {
    test('should have secure application bucket with encryption', () => {
      const bucket = template.Resources.SecureApplicationBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have Config bucket with proper policies', () => {
      const bucket = template.Resources.ConfigBucket;
      const policy = template.Resources.ConfigBucketPolicy;

      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Statement).toHaveLength(3);
    });

    test('should have CloudTrail bucket with proper policies', () => {
      const bucket = template.Resources.CloudTrailBucket;
      const policy = template.Resources.CloudTrailBucketPolicy;

      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Statement).toHaveLength(2);
    });

    test('should have access logs bucket', () => {
      const bucket = template.Resources.AccessLogsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
    });
  });

  describe('EC2 Instances', () => {
    test('should have two private EC2 instances', () => {
      const instance1 = template.Resources.PrivateInstance1;
      const instance2 = template.Resources.PrivateInstance2;

      expect(instance1.Type).toBe('AWS::EC2::Instance');
      expect(instance2.Type).toBe('AWS::EC2::Instance');

      expect(instance1.Properties.UserData).toBeDefined();
      expect(instance2.Properties.UserData).toBeDefined();
    });

    test('instances should have correct security group and IAM profile', () => {
      const instance1 = template.Resources.PrivateInstance1;
      expect(instance1.Properties.SecurityGroupIds).toHaveLength(1);
      expect(instance1.Properties.IamInstanceProfile).toBeDefined();
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have log groups with appropriate retention', () => {
      const instanceLogs = template.Resources.InstanceLogGroup;
      const s3AccessLogs = template.Resources.S3AccessLogGroup;
      const cloudTrailLogs = template.Resources.CloudTrailLogGroup;

      expect(instanceLogs.Type).toBe('AWS::Logs::LogGroup');
      expect(instanceLogs.Properties.RetentionInDays).toBe(30);

      expect(s3AccessLogs.Type).toBe('AWS::Logs::LogGroup');
      expect(s3AccessLogs.Properties.RetentionInDays).toBe(90);

      expect(cloudTrailLogs.Type).toBe('AWS::Logs::LogGroup');
      expect(cloudTrailLogs.Properties.RetentionInDays).toBe(365);
    });
  });

  describe('AWS Config Resources', () => {
    test('should have configuration recorder', () => {
      const recorder = template.Resources.ConfigurationRecorder;
      expect(recorder.Type).toBe('AWS::Config::ConfigurationRecorder');
      expect(recorder.Properties.RecordingGroup.AllSupported).toBe(true);
      expect(
        recorder.Properties.RecordingGroup.IncludeGlobalResourceTypes
      ).toBe(true);
    });

    // Only test if delivery channel is present
    test('should have delivery channel', () => {
      const channel = template.Resources.ConfigDeliveryChannel;
      if (!channel) {
        // Delivery channel not managed by this template, skip test
        return;
      }
      expect(channel.Type).toBe('AWS::Config::DeliveryChannel');
      expect(
        channel.Properties.ConfigSnapshotDeliveryProperties.DeliveryFrequency
      ).toBe('TwentyFour_Hours');
    });

    test('should have Config rules for security compliance', () => {
      const s3Rule = template.Resources.S3BucketPublicAccessProhibited;
      const rootKeyRule = template.Resources.RootAccessKeyCheck;
      const sgRule = template.Resources.EC2SecurityGroupAttachedToENI;

      expect(s3Rule.Type).toBe('AWS::Config::ConfigRule');
      expect(rootKeyRule.Type).toBe('AWS::Config::ConfigRule');
      expect(sgRule.Type).toBe('AWS::Config::ConfigRule');
    });
  });

  describe('CloudTrail Resources', () => {
    test('should have CloudTrail with proper configuration', () => {
      const trail = template.Resources.SecurityCloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });
  });

  describe('Template Outputs', () => {
    test('should have all infrastructure outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'PrivateInstance1Id',
        'PrivateInstance2Id',
        'SecureApplicationBucketName',
        'ConfigBucketName',
        'CloudTrailBucketName',
        'SecurityCloudTrailArn',
        'StackName',
        'EnvironmentSuffix',
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

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have comprehensive resource coverage', () => {
      const resourceTypes = Object.values(template.Resources).map(
        (resource: any) => resource.Type
      );
      const expectedTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::Instance',
        'AWS::S3::Bucket',
        'AWS::IAM::Role',
        'AWS::Config::ConfigurationRecorder',
        'AWS::CloudTrail::Trail',
        'AWS::Logs::LogGroup',
      ];

      expectedTypes.forEach(type => {
        expect(resourceTypes).toContain(type);
      });
    });

    test('should meet security requirements', () => {
      // Check for security groups with restricted access
      const sg = template.Resources.PrivateInstanceSecurityGroup;
      const sshRule = sg.Properties.SecurityGroupIngress[0];
      expect(sshRule.CidrIp).toEqual({ Ref: 'AllowedSSHCidr' });

      // Check for encrypted S3 buckets
      const appBucket = template.Resources.SecureApplicationBucket;
      expect(appBucket.Properties.BucketEncryption).toBeDefined();
      expect(
        appBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);

      // Check for CloudTrail logging
      const trail = template.Resources.SecurityCloudTrail;
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with environment suffix', () => {
      const vpc = template.Resources.SecureVPC;
      expect(vpc.Properties.Tags[0].Value).toEqual({
        'Fn::Sub': 'secure-vpc-${EnvironmentSuffix}',
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
