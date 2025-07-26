import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Metadata', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toContain('secure infrastructure as per AWS CIS Foundations Benchmark');
    });
  });

  describe('Parameters', () => {
    test('should include AllowedSSHLocation parameter', () => {
      const param = template.Parameters.AllowedSSHLocation;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('192.0.2.0/24');
      expect(param.AllowedPattern).toBe('^(\\d{1,3}\\.){3}\\d{1,3}(\\/\\d{1,2})$');
    });
  });

  describe('Resources', () => {
    test('should define log S3 bucket with encryption and versioning', () => {
      const bucket = template.Resources.LogBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const props = bucket.Properties;
      expect(props.VersioningConfiguration.Status).toBe('Enabled');
      expect(props.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('should define an IAM role with S3 write access', () => {
      const role = template.Resources.EC2Role;
      expect(role.Type).toBe('AWS::IAM::Role');
      const assumePolicy = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(assumePolicy.Principal.Service).toBe('ec2.amazonaws.com');

      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('S3WriteAccess');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
    });

    test('should define a multi-region CloudTrail with log validation', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      const props = trail.Properties;
      expect(props.IsMultiRegionTrail).toBe(true);
      expect(props.EnableLogFileValidation).toBe(true);
    });

    test('should define a VPC and at least 6 subnets', () => {
      expect(template.Resources.VPC).toBeDefined();

      const subnetKeys = Object.keys(template.Resources).filter(key =>
        key.toLowerCase().includes('subnet')
      );
      expect(subnetKeys.length).toBeGreaterThanOrEqual(6);
    });

    test('should define a restricted security group for SSH', () => {
      const sg = template.Resources.RestrictedSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.FromPort).toBe(22);
      expect(ingress.CidrIp).toBeDefined();
    });

    test('should attach IGW and route for public subnets', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = ['LogBucketName', 'EC2RoleArn', 'VPCId', 'RestrictedSecurityGroupId'];

    test('should have expected outputs', () => {
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('LogBucketName should return S3 bucket reference', () => {
      expect(template.Outputs.LogBucketName.Value).toEqual({ Ref: 'LogBucket' });
    });

    test('EC2RoleArn should use GetAtt', () => {
      expect(template.Outputs.EC2RoleArn.Value).toEqual({
        'Fn::GetAtt': ['EC2Role', 'Arn'],
      });
    });

    test('VPCId should return VPC ref', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });
  });

  describe('Template Validation', () => {
    test('should be a valid CloudFormation template object', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should not contain undefined outputs', () => {
      Object.entries(template.Outputs).forEach(([key, value]) => {
        const output = value as {
          Description: string;
          Value: any;
          Export?: { Name: any };
        };
        expect(output.Description).toBeDefined();
        expect(output.Value).toBeDefined();
      });

    });
  });
});
