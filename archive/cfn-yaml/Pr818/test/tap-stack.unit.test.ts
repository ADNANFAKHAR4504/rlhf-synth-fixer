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
        'Secure and compliant AWS infrastructure with EC2 instances, security groups, IAM roles, and S3 buckets'
      );
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = ['VpcId', 'PrivateSubnetIds', 'AllowedCidrBlocks', 'KeyPairName', 'InstanceType', 'ProjectName', 'Environment', 'Owner'];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('VpcId parameter should have correct properties', () => {
      const param = template.Parameters.VpcId;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toBe('VPC ID where EC2 instances will be launched');
    });

    test('PrivateSubnetIds parameter should have correct properties', () => {
      const param = template.Parameters.PrivateSubnetIds;
      expect(param.Type).toBe('CommaDelimitedList');
      expect(param.Default).toBe('');
      expect(param.Description).toBe('Private subnet IDs for EC2 instances');
    });

    test('KeyPairName parameter should have correct properties', () => {
      const param = template.Parameters.KeyPairName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toBe('EC2 Key Pair for SSH access');
    });

    test('InstanceType parameter should have correct allowed values', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
      expect(param.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium']);
    });

    test('Environment parameter should have correct allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Production');
      expect(param.AllowedValues).toEqual(['Development', 'Staging', 'Production']);
    });
  });

  describe('Conditions', () => {
    test('should have all required conditions', () => {
      const expectedConditions = ['UseDefaultVpc', 'UseDefaultSubnets', 'UseDefaultKeyPair'];
      expectedConditions.forEach(condition => {
        expect(template.Conditions[condition]).toBeDefined();
      });
    });

    test('UseDefaultVpc condition should be correctly defined', () => {
      const condition = template.Conditions.UseDefaultVpc;
      expect(condition).toEqual({
        'Fn::Equals': [{ 'Ref': 'VpcId' }, '']
      });
    });

    test('UseDefaultSubnets condition should be correctly defined', () => {
      const condition = template.Conditions.UseDefaultSubnets;
      expect(condition).toEqual({
        'Fn::Equals': [{ 'Fn::Join': ['', { 'Ref': 'PrivateSubnetIds' }] }, '']
      });
    });

    test('UseDefaultKeyPair condition should be correctly defined', () => {
      const condition = template.Conditions.UseDefaultKeyPair;
      expect(condition).toEqual({
        'Fn::Equals': [{ 'Ref': 'KeyPairName' }, '']
      });
    });
  });

  describe('S3 Bucket Resources', () => {
    test('should have SecureS3Bucket resource', () => {
      expect(template.Resources.SecureS3Bucket).toBeDefined();
      expect(template.Resources.SecureS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('SecureS3Bucket should have encryption enabled', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].BucketKeyEnabled).toBe(true);
    });

    test('SecureS3Bucket should have public access blocked', () => {
      const bucket = template.Resources.SecureS3Bucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have LoggingBucket resource', () => {
      expect(template.Resources.LoggingBucket).toBeDefined();
      expect(template.Resources.LoggingBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('SecureS3Bucket should have logging configuration', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.LoggingConfiguration).toBeDefined();
      expect(bucket.Properties.LoggingConfiguration.DestinationBucketName).toEqual({ 'Ref': 'LoggingBucket' });
      expect(bucket.Properties.LoggingConfiguration.LogFilePrefix).toBe('access-logs/');
    });
  });

  describe('EC2 Resources', () => {
    test('should have EC2 IAM role with correct policies', () => {
      const role = template.Resources.EC2Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('EC2 role should have correct assume role policy', () => {
      const role = template.Resources.EC2Role;
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have EC2 instance profile', () => {
      const instanceProfile = template.Resources.EC2InstanceProfile;
      expect(instanceProfile).toBeDefined();
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(instanceProfile.Properties.Roles).toEqual([{ 'Ref': 'EC2Role' }]);
    });

    test('should have security group with conditional VPC reference', () => {
      const securityGroup = template.Resources.EC2SecurityGroup;
      expect(securityGroup).toBeDefined();
      expect(securityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      expect(securityGroup.Properties.VpcId).toEqual({
        'Fn::If': ['UseDefaultVpc', { 'Ref': 'DefaultVpc' }, { 'Ref': 'VpcId' }]
      });
    });

    test('security group should have correct ingress rules', () => {
      const securityGroup = template.Resources.EC2SecurityGroup;
      const ingressRules = securityGroup.Properties.SecurityGroupIngress;
      
      const sshRule = ingressRules.find((rule: any) => rule.FromPort === 22);
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingressRules.find((rule: any) => rule.FromPort === 443);
      
      expect(sshRule).toBeDefined();
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpsRule.IpProtocol).toBe('tcp');
    });

    test('should have launch template with conditional key pair', () => {
      const launchTemplate = template.Resources.EC2LaunchTemplate;
      expect(launchTemplate).toBeDefined();
      expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(launchTemplate.Properties.LaunchTemplateData.KeyName).toEqual({
        'Fn::If': ['UseDefaultKeyPair', { 'Ref': 'AWS::NoValue' }, { 'Ref': 'KeyPairName' }]
      });
    });

    test('launch template should have encrypted EBS volumes', () => {
      const launchTemplate = template.Resources.EC2LaunchTemplate;
      const blockDeviceMapping = launchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings[0];
      expect(blockDeviceMapping.Ebs.Encrypted).toBe(true);
      expect(blockDeviceMapping.Ebs.VolumeType).toBe('gp3');
      expect(blockDeviceMapping.Ebs.VolumeSize).toBe(20);
    });

    test('should have two EC2 instances with conditional subnet references', () => {
      expect(template.Resources.EC2Instance1).toBeDefined();
      expect(template.Resources.EC2Instance2).toBeDefined();
      
      const instance1 = template.Resources.EC2Instance1;
      const instance2 = template.Resources.EC2Instance2;
      
      expect(instance1.Properties.SubnetId).toEqual({
        'Fn::If': ['UseDefaultSubnets', { 'Ref': 'DefaultPrivateSubnet1' }, { 'Fn::Select': [0, { 'Ref': 'PrivateSubnetIds' }] }]
      });
      expect(instance2.Properties.SubnetId).toEqual({
        'Fn::If': ['UseDefaultSubnets', { 'Ref': 'DefaultPrivateSubnet2' }, { 'Fn::Select': [1, { 'Ref': 'PrivateSubnetIds' }] }]
      });
    });
  });

  describe('Default VPC and Subnet Resources', () => {
    test('should have default VPC with correct condition', () => {
      const vpc = template.Resources.DefaultVpc;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Condition).toBe('UseDefaultVpc');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should have default subnets with correct conditions and CIDR blocks', () => {
      const subnet1 = template.Resources.DefaultPrivateSubnet1;
      const subnet2 = template.Resources.DefaultPrivateSubnet2;
      
      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1.Condition).toBe('UseDefaultSubnets');
      expect(subnet2.Condition).toBe('UseDefaultSubnets');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('should have internet gateway and VPC attachment', () => {
      const igw = template.Resources.DefaultInternetGateway;
      const attachment = template.Resources.DefaultVpcGatewayAttachment;
      
      expect(igw).toBeDefined();
      expect(attachment).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(igw.Condition).toBe('UseDefaultVpc');
      expect(attachment.Condition).toBe('UseDefaultVpc');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have CloudWatch log groups', () => {
      const ec2LogGroup = template.Resources.EC2LogGroup;
      const s3LogGroup = template.Resources.S3LogGroup;
      
      expect(ec2LogGroup).toBeDefined();
      expect(s3LogGroup).toBeDefined();
      expect(ec2LogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(s3LogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(ec2LogGroup.Properties.RetentionInDays).toBe(30);
      expect(s3LogGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have CloudWatch alarms for both EC2 instances', () => {
      const alarm1 = template.Resources.HighCPUAlarm1;
      const alarm2 = template.Resources.HighCPUAlarm2;
      
      expect(alarm1).toBeDefined();
      expect(alarm2).toBeDefined();
      expect(alarm1.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm2.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm1.Properties.Threshold).toBe(80);
      expect(alarm2.Properties.Threshold).toBe(80);
      expect(alarm1.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm2.Properties.MetricName).toBe('CPUUtilization');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = ['VpcId', 'S3BucketName', 'EC2Instance1Id', 'EC2Instance2Id', 'SecurityGroupId', 'IAMRoleArn'];
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('VpcId output should use conditional reference', () => {
      const output = template.Outputs.VpcId;
      expect(output.Value).toEqual({
        'Fn::If': ['UseDefaultVpc', { 'Ref': 'DefaultVpc' }, { 'Ref': 'VpcId' }]
      });
    });

    test('outputs should have export names', () => {
      const expectedExportNames = {
        'VpcId': 'VpcId',
        'S3BucketName': 'S3Bucket', 
        'EC2Instance1Id': 'EC2Instance1',
        'EC2Instance2Id': 'EC2Instance2',
        'SecurityGroupId': 'SecurityGroup',
        'IAMRoleArn': 'IAMRole'
      };
      
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${expectedExportNames[outputKey as keyof typeof expectedExportNames]}`
        });
      });
    });
  });

  describe('Security Validations', () => {
    test('S3 buckets should have encryption enabled', () => {
      const secureS3 = template.Resources.SecureS3Bucket;
      const loggingS3 = template.Resources.LoggingBucket;
      
      expect(secureS3.Properties.BucketEncryption).toBeDefined();
      expect(loggingS3.Properties.BucketEncryption).toBeDefined();
    });

    test('EBS volumes should be encrypted', () => {
      const launchTemplate = template.Resources.EC2LaunchTemplate;
      const ebs = launchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs;
      expect(ebs.Encrypted).toBe(true);
    });

    test('IAM role should follow least privilege principle', () => {
      const role = template.Resources.EC2Role;
      const policies = role.Properties.Policies;
      
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement).toHaveLength(2);
      
      const cloudWatchPolicy = policies.find((p: any) => p.PolicyName === 'CloudWatchLogsPolicy');
      expect(cloudWatchPolicy).toBeDefined();
    });

    test('security group should have restrictive egress rules', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const egressRules = sg.Properties.SecurityGroupEgress;
      
      const httpsEgress = egressRules.find((rule: any) => rule.FromPort === 443);
      const httpEgress = egressRules.find((rule: any) => rule.FromPort === 80);
      const dnsEgress = egressRules.filter((rule: any) => rule.FromPort === 53);
      
      expect(httpsEgress).toBeDefined();
      expect(httpEgress).toBeDefined();
      expect(dnsEgress).toHaveLength(2);
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have consistent tags', () => {
      const resourcesWithTags = [
        'DefaultVpc', 'DefaultInternetGateway', 'DefaultPrivateSubnet1', 'DefaultPrivateSubnet2',
        'SecureS3Bucket', 'LoggingBucket', 'EC2LogGroup', 'S3LogGroup', 'EC2Role',
        'EC2SecurityGroup', 'EC2Instance1', 'EC2Instance2', 'HighCPUAlarm1', 'HighCPUAlarm2'
      ];
      
      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const projectTag = tags.find((tag: any) => tag.Key === 'Project');
          const environmentTag = tags.find((tag: any) => tag.Key === 'Environment');
          const ownerTag = tags.find((tag: any) => tag.Key === 'Owner');
          
          expect(projectTag).toBeDefined();
          expect(environmentTag).toBeDefined();
          expect(ownerTag).toBeDefined();
        }
      });
    });
  });
});
