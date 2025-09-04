import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'Development';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the comprehensive CloudFormation template
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
        'TAP Stack - Task Assignment Platform Infrastructure'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      const expectedParams = ['KeyName', 'SSHLocation', 'Environment'];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });


    test('SSHLocation parameter should have correct properties', () => {
      const sshParam = template.Parameters.SSHLocation;
      expect(sshParam.Type).toBe('String');
      expect(sshParam.Default).toBe('0.0.0.0/0');
      expect(sshParam.AllowedPattern).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('Development');
      expect(envParam.AllowedValues).toContain('Development');
      expect(envParam.AllowedValues).toContain('Staging');
      expect(envParam.AllowedValues).toContain('Production');
    });
  });

  describe('Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have Internet Gateway and route table', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
    });
  });

  describe('Security Resources', () => {
    test('should have security group', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('security group should allow HTTP and SSH', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const sshRule = ingress.find((rule: any) => rule.FromPort === 22);

      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(sshRule).toBeDefined();
    });
  });

  describe('IAM Resources', () => {
    test('should have IAM role for EC2', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
    });

    test('should have instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe(
        'AWS::IAM::InstanceProfile'
      );
    });

    test('IAM role should have S3 access policy', () => {
      const role = template.Resources.EC2Role;
      const policies = role.Properties.Policies;
      expect(policies).toBeDefined();
      expect(policies.length).toBeGreaterThan(0);

      const s3Policy = policies.find(
        (p: any) => p.PolicyName === 'S3BucketAccess'
      );
      expect(s3Policy).toBeDefined();
    });

    test('S3 policy should use proper ARN format', () => {
      const role = template.Resources.EC2Role;
      const s3Policy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'S3BucketAccess'
      );
      const resources = s3Policy.PolicyDocument.Statement[0].Resource;

      // Check that resources use proper ARN format
      expect(resources[0]).toEqual({ 'Fn::Sub': 'arn:aws:s3:::${S3Bucket}/*' });
      expect(resources[1]).toEqual({ 'Fn::Sub': 'arn:aws:s3:::${S3Bucket}' });
    });

    test('IAM role should have CloudWatch permissions', () => {
      const role = template.Resources.EC2Role;
      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 bucket', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      expect(template.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      const encryption =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'AES256'
      );
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.S3Bucket;
      const publicAccessBlock =
        bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Compute Resources', () => {
    test('should have two EC2 instances', () => {
      expect(template.Resources.WebServerInstance1).toBeDefined();
      expect(template.Resources.WebServerInstance2).toBeDefined();
      expect(template.Resources.WebServerInstance1.Type).toBe(
        'AWS::EC2::Instance'
      );
      expect(template.Resources.WebServerInstance2.Type).toBe(
        'AWS::EC2::Instance'
      );
    });

    test('EC2 instances should have correct properties', () => {
      const instance1 = template.Resources.WebServerInstance1;
      expect(instance1.Properties.InstanceType).toBe('t3.micro');
      expect(instance1.Properties.Monitoring).toBe(true);
      expect(instance1.Properties.IamInstanceProfile).toEqual({
        Ref: 'EC2InstanceProfile',
      });
    });

    test('EC2 instances should be in different subnets', () => {
      const instance1 = template.Resources.WebServerInstance1;
      const instance2 = template.Resources.WebServerInstance2;

      expect(instance1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(instance2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('EC2 instances should use SecurityGroupIds (not VpcSecurityGroupIds)', () => {
      const instance1 = template.Resources.WebServerInstance1;
      const instance2 = template.Resources.WebServerInstance2;

      expect(instance1.Properties.SecurityGroupIds).toBeDefined();
      expect(instance2.Properties.SecurityGroupIds).toBeDefined();
      expect(instance1.Properties.VpcSecurityGroupIds).toBeUndefined();
      expect(instance2.Properties.VpcSecurityGroupIds).toBeUndefined();
    });

    test('EC2 instances should have UserData for web server setup', () => {
      const instance1 = template.Resources.WebServerInstance1;
      expect(instance1.Properties.UserData).toBeDefined();
      expect(instance1.Properties.UserData['Fn::Base64']).toBeDefined();
    });
  });

  describe('Monitoring Resources', () => {
    test('should have CloudWatch log group', () => {
      expect(template.Resources.WebServerLogGroup).toBeDefined();
      expect(template.Resources.WebServerLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
    });

    test('should have CloudWatch alarms for both instances', () => {
      expect(template.Resources.CPUAlarmInstance1).toBeDefined();
      expect(template.Resources.CPUAlarmInstance2).toBeDefined();
      expect(template.Resources.CPUAlarmInstance1.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
      expect(template.Resources.CPUAlarmInstance2.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
    });

    test('CloudWatch alarms should monitor CPU utilization', () => {
      const alarm1 = template.Resources.CPUAlarmInstance1;
      expect(alarm1.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm1.Properties.Threshold).toBe(70);
      expect(alarm1.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'SecurityGroupId',
        'S3BucketName',
        'Instance1Id',
        'Instance2Id',
        'Instance1PublicIp',
        'Instance2PublicIp',
        'Instance1PublicDNS',
        'Instance2PublicDNS',
        'WebSite1URL',
        'WebSite2URL',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPC output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('ID of the VPC');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-ID',
      });
    });

    test('S3 bucket output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe(
        'Name of the S3 bucket for application data'
      );
      expect(output.Value).toEqual({ Ref: 'S3Bucket' });
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

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(13);
    });

    test('should have expected total resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(18); // Updated to match comprehensive template
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have Environment tag', () => {
      const resourcesWithTags = [
        'VPC',
        'PublicSubnet1',
        'PublicSubnet2',
        'InternetGateway',
        'PublicRouteTable',
        'WebServerSecurityGroup',
        'EC2Role',
        'S3Bucket',
        'WebServerLogGroup',
        'WebServerInstance1',
        'WebServerInstance2',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();

        const envTag = resource.Properties.Tags.find(
          (tag: any) => tag.Key === 'Environment'
        );
        expect(envTag).toBeDefined();
        expect(envTag.Value).toEqual({ Ref: 'Environment' });
      });
    });

    test('resources should follow naming convention', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'VPC-${Environment}-TAP' });
    });
  });
});
