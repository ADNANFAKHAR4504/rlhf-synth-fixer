import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the CloudFormation template
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
      expect(template.Description).toContain(
        'CloudFormation template to set up a development environment'
      );
      expect(template.Description).toContain('us-west-2');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have BucketName parameter', () => {
      const param = template.Parameters.BucketName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('my-dev-public-bucket-123456');
      expect(param.Description).toContain('globally unique');
    });

    test('should have EC2KeyName parameter', () => {
      const param = template.Parameters.EC2KeyName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('iac-rlhf-aws-trainer-instance');
      expect(param.AllowedPattern).toBe(
        '^$|^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$'
      );
      expect(param.ConstraintDescription).toContain('valid EC2 KeyPair name');
    });

    test('should have SubnetId parameter', () => {
      const param = template.Parameters.SubnetId;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('subnet-03d1b6cd1d8b40c33');
      expect(param.Description).toContain('Subnet ID within the existing VPC');
    });

    test('should have SecurityGroupId parameter', () => {
      const param = template.Parameters.SecurityGroupId;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('sg-02a873ae7a82d01d7');
      expect(param.Description).toContain(
        'Security Group ID for the EC2 instance'
      );
    });
  });

  describe('Conditions', () => {
    test('should have HasKeyName condition', () => {
      const condition = template.Conditions.HasKeyName;
      expect(condition).toBeDefined();
      expect(condition['Fn::Not']).toBeDefined();
      expect(condition['Fn::Not'][0]['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Not'][0]['Fn::Equals'][0]).toEqual({
        Ref: 'EC2KeyName',
      });
      expect(condition['Fn::Not'][0]['Fn::Equals'][1]).toBe('');
    });
  });

  describe('S3 Resources', () => {
    test('should have S3AccessLogBucket resource', () => {
      const resource = template.Resources.S3AccessLogBucket;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::S3::Bucket');
      expect(resource.Properties.BucketName).toEqual({
        'Fn::Sub': '${BucketName}-logs',
      });
      expect(resource.Properties.Tags).toBeDefined();
      expect(resource.Properties.Tags[0].Key).toBe('Environment');
      expect(resource.Properties.Tags[0].Value).toBe('Development');
    });

    test('should have PublicS3Bucket resource', () => {
      const resource = template.Resources.PublicS3Bucket;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::S3::Bucket');
      expect(resource.Properties.BucketName).toEqual({ Ref: 'BucketName' });

      // Check logging configuration
      expect(resource.Properties.LoggingConfiguration).toBeDefined();
      expect(
        resource.Properties.LoggingConfiguration.DestinationBucketName
      ).toEqual({ Ref: 'S3AccessLogBucket' });
      expect(resource.Properties.LoggingConfiguration.LogFilePrefix).toBe(
        'access-logs/'
      );

      // Check public access block configuration
      expect(resource.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(
        resource.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(false);
      expect(
        resource.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy
      ).toBe(false);
      expect(
        resource.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls
      ).toBe(false);
      expect(
        resource.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets
      ).toBe(false);
    });
  });

  describe('IAM Resources', () => {
    test('should have S3ReadOnlyInstanceRole resource', () => {
      const resource = template.Resources.S3ReadOnlyInstanceRole;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::IAM::Role');

      // Check assume role policy
      expect(resource.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(resource.Properties.AssumeRolePolicyDocument.Version).toBe(
        '2012-10-17'
      );
      expect(
        resource.Properties.AssumeRolePolicyDocument.Statement[0].Effect
      ).toBe('Allow');
      expect(
        resource.Properties.AssumeRolePolicyDocument.Statement[0].Principal
          .Service
      ).toBe('ec2.amazonaws.com');
      expect(
        resource.Properties.AssumeRolePolicyDocument.Statement[0].Action
      ).toBe('sts:AssumeRole');

      // Check policies
      expect(resource.Properties.Policies).toBeDefined();
      expect(resource.Properties.Policies[0].PolicyName).toBe(
        'S3ReadOnlyAccess'
      );
      expect(
        resource.Properties.Policies[0].PolicyDocument.Statement[0].Effect
      ).toBe('Allow');
      expect(
        resource.Properties.Policies[0].PolicyDocument.Statement[0].Action
      ).toBe('s3:Get*');
      expect(
        resource.Properties.Policies[0].PolicyDocument.Statement[0].Resource
      ).toBe('*');
    });

    test('should have S3ReadOnlyInstanceProfile resource', () => {
      const resource = template.Resources.S3ReadOnlyInstanceProfile;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::IAM::InstanceProfile');
      expect(resource.Properties.Path).toBe('/');
      expect(resource.Properties.Roles).toEqual([
        { Ref: 'S3ReadOnlyInstanceRole' },
      ]);
    });
  });

  describe('EC2 Resources', () => {
    test('should have EC2EIP resource', () => {
      const resource = template.Resources.EC2EIP;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::EC2::EIP');
      expect(resource.Properties.Domain).toBe('vpc');
      expect(resource.Properties.Tags).toBeDefined();
      expect(resource.Properties.Tags[0].Key).toBe('Environment');
      expect(resource.Properties.Tags[0].Value).toBe('Development');
    });

    test('should have DevInstance resource', () => {
      const resource = template.Resources.DevInstance;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::EC2::Instance');
      expect(resource.Properties.InstanceType).toBe('t2.micro');
      expect(resource.Properties.ImageId).toBe('ami-0a70b9d193ae8a799');

      // Check conditional KeyName
      expect(resource.Properties.KeyName).toBeDefined();
      expect(resource.Properties.KeyName['Fn::If']).toBeDefined();
      expect(resource.Properties.KeyName['Fn::If'][0]).toBe('HasKeyName');
      expect(resource.Properties.KeyName['Fn::If'][1]).toEqual({
        Ref: 'EC2KeyName',
      });
      expect(resource.Properties.KeyName['Fn::If'][2]).toEqual({
        Ref: 'AWS::NoValue',
      });

      // Check network interfaces
      expect(resource.Properties.NetworkInterfaces).toBeDefined();
      expect(
        resource.Properties.NetworkInterfaces[0].AssociatePublicIpAddress
      ).toBe(true);
      expect(resource.Properties.NetworkInterfaces[0].DeviceIndex).toBe(0);
      expect(resource.Properties.NetworkInterfaces[0].SubnetId).toEqual({
        Ref: 'SubnetId',
      });
      expect(resource.Properties.NetworkInterfaces[0].GroupSet).toEqual([
        { Ref: 'SecurityGroupId' },
      ]);

      // Check IAM instance profile
      expect(resource.Properties.IamInstanceProfile).toEqual({
        Ref: 'S3ReadOnlyInstanceProfile',
      });
    });

    test('should have EIPAssociation resource', () => {
      const resource = template.Resources.EIPAssociation;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::EC2::EIPAssociation');
      expect(resource.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['EC2EIP', 'AllocationId'],
      });
      expect(resource.Properties.InstanceId).toEqual({ Ref: 'DevInstance' });
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have CPUAlarmHigh resource', () => {
      const resource = template.Resources.CPUAlarmHigh;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::CloudWatch::Alarm');
      expect(resource.Properties.AlarmDescription).toBe(
        'Alarm if CPU > 80% for 5 consecutive minutes'
      );
      expect(resource.Properties.Namespace).toBe('AWS/EC2');
      expect(resource.Properties.MetricName).toBe('CPUUtilization');
      expect(resource.Properties.Dimensions[0].Name).toBe('InstanceId');
      expect(resource.Properties.Dimensions[0].Value).toEqual({
        Ref: 'DevInstance',
      });
      expect(resource.Properties.Statistic).toBe('Average');
      expect(resource.Properties.Period).toBe(60);
      expect(resource.Properties.EvaluationPeriods).toBe(5);
      expect(resource.Properties.Threshold).toBe(80);
      expect(resource.Properties.ComparisonOperator).toBe(
        'GreaterThanThreshold'
      );
      expect(resource.Properties.AlarmActions).toEqual([]);
    });
  });

  describe('Outputs', () => {
    test('should have S3BucketName output', () => {
      const output = template.Outputs.S3BucketName;
      expect(output).toBeDefined();
      expect(output.Description).toBe('Name of the public S3 bucket');
      expect(output.Value).toEqual({ Ref: 'PublicS3Bucket' });
    });

    test('should have EC2PublicIP output', () => {
      const output = template.Outputs.EC2PublicIP;
      expect(output).toBeDefined();
      expect(output.Description).toBe('Public IP of the EC2 instance');
      expect(output.Value).toEqual({ Ref: 'EC2EIP' });
    });

    test('should have Reminder output', () => {
      const output = template.Outputs.Reminder;
      expect(output).toBeDefined();
      expect(output.Description).toContain(
        'S3 bucket public access policy removed'
      );
      expect(output.Value).toContain(
        'manually configure S3 bucket public access'
      );
      expect(output.Value).toContain(
        'Security Group allows SSH from 203.0.113.0/24'
      );
    });
  });

  describe('Resource Dependencies', () => {
    test('DevInstance should depend on IAM instance profile', () => {
      const devInstance = template.Resources.DevInstance;
      expect(devInstance.Properties.IamInstanceProfile).toEqual({
        Ref: 'S3ReadOnlyInstanceProfile',
      });
    });

    test('EIPAssociation should depend on both EIP and Instance', () => {
      const eipAssociation = template.Resources.EIPAssociation;
      expect(eipAssociation.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['EC2EIP', 'AllocationId'],
      });
      expect(eipAssociation.Properties.InstanceId).toEqual({
        Ref: 'DevInstance',
      });
    });

    test('S3ReadOnlyInstanceProfile should depend on IAM role', () => {
      const instanceProfile = template.Resources.S3ReadOnlyInstanceProfile;
      expect(instanceProfile.Properties.Roles).toEqual([
        { Ref: 'S3ReadOnlyInstanceRole' },
      ]);
    });

    test('PublicS3Bucket should depend on S3AccessLogBucket', () => {
      const publicBucket = template.Resources.PublicS3Bucket;
      expect(
        publicBucket.Properties.LoggingConfiguration.DestinationBucketName
      ).toEqual({ Ref: 'S3AccessLogBucket' });
    });

    test('CPUAlarmHigh should depend on DevInstance', () => {
      const alarm = template.Resources.CPUAlarmHigh;
      expect(alarm.Properties.Dimensions[0].Value).toEqual({
        Ref: 'DevInstance',
      });
    });
  });

  describe('Security Configuration', () => {
    test('should use existing VPC and Security Group', () => {
      const devInstance = template.Resources.DevInstance;
      expect(devInstance.Properties.NetworkInterfaces[0].SubnetId).toEqual({
        Ref: 'SubnetId',
      });
      expect(devInstance.Properties.NetworkInterfaces[0].GroupSet).toEqual([
        { Ref: 'SecurityGroupId' },
      ]);
    });

    test('should not create new security groups or VPCs', () => {
      // Ensure no new security groups are created
      const securityGroupResources = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::EC2::SecurityGroup'
      );
      expect(securityGroupResources).toHaveLength(0);

      // Ensure no VPCs are created
      const vpcResources = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::EC2::VPC'
      );
      expect(vpcResources).toHaveLength(0);
    });

    test('should configure S3 bucket for public access', () => {
      const publicBucket = template.Resources.PublicS3Bucket;
      const publicAccessBlock =
        publicBucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(false);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(false);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(false);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(false);
    });
  });

  describe('Tagging', () => {
    test('should tag all resources with Environment=Development', () => {
      const taggedResources = [
        'S3AccessLogBucket',
        'PublicS3Bucket',
        'S3ReadOnlyInstanceRole',
        'EC2EIP',
        'DevInstance',
        'CPUAlarmHigh',
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        const environmentTag = resource.Properties.Tags.find(
          (tag: any) => tag.Key === 'Environment'
        );
        expect(environmentTag).toBeDefined();
        expect(environmentTag.Value).toBe('Development');
      });
    });
  });
});
