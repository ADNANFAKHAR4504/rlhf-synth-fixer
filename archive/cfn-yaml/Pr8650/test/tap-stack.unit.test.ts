import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Secure Web Application Infrastructure', () => {
  let template: any;

  beforeAll(() => {
    // Template should be converted from YAML using: pipenv run cfn-flip-to-json > lib/TapStack.json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // Unit tests for secure web application infrastructure components

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have secure web application description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure, resilient, and compliant web application infrastructure with VPC, Lambda, S3, and comprehensive security controls'
      );
    });

    test('should have mappings for subnet configuration', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.SubnetConfig).toBeDefined();
      expect(template.Mappings.SubnetConfig.VPC.CIDR).toBe('10.0.0.0/16');
    });
  });

  describe('Parameters', () => {
    test('should have ProjectName parameter', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.ProjectName.Type).toBe('String');
      expect(template.Parameters.ProjectName.Default).toBe('SecureWebApp');
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.Default).toBe('Dev');
      expect(template.Parameters.Environment.AllowedValues).toEqual([
        'Dev',
        'Test',
        'Prod',
      ]);
    });

    test('should have Owner parameter', () => {
      expect(template.Parameters.Owner).toBeDefined();
      expect(template.Parameters.Owner.Type).toBe('String');
      expect(template.Parameters.Owner.Default).toBe('DevOps-Team');
    });
  });

  describe('VPC Resources', () => {
    test('should have SecureVPC resource', () => {
      expect(template.Resources.SecureVPC).toBeDefined();
      expect(template.Resources.SecureVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnetAZ1).toBeDefined();
      expect(template.Resources.PublicSubnetAZ2).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ1).toBeDefined();
      expect(template.Resources.PrivateSubnetAZ2).toBeDefined();
    });

    test('should have NAT Gateways for high availability', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP).toBeDefined();
    });

    test('should have proper route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have WebApplicationSecurityGroup', () => {
      expect(template.Resources.WebApplicationSecurityGroup).toBeDefined();
      expect(template.Resources.WebApplicationSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('should have LambdaSecurityGroup', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('WebApp security group should allow HTTP and HTTPS', () => {
      const sg = template.Resources.WebApplicationSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toContainEqual({
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        CidrIp: '0.0.0.0/0',
        Description: 'Allow HTTP traffic from anywhere',
      });
      expect(ingress).toContainEqual({
        IpProtocol: 'tcp',
        FromPort: 443,
        ToPort: 443,
        CidrIp: '0.0.0.0/0',
        Description: 'Allow HTTPS traffic from anywhere',
      });
    });
  });

  describe('S3 Resources', () => {
    test('should have SecureS3Bucket', () => {
      expect(template.Resources.SecureS3Bucket).toBeDefined();
      expect(template.Resources.SecureS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.SecureS3Bucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have S3 bucket policy', () => {
      expect(template.Resources.S3BucketPolicy).toBeDefined();
      expect(template.Resources.S3BucketPolicy.Type).toBe(
        'AWS::S3::BucketPolicy'
      );
    });
  });

  describe('IAM Resources', () => {
    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe(
        'AWS::IAM::Role'
      );
    });

    test('Lambda role should have proper S3 permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const s3Policy = policies.find(
        (p: any) => p.PolicyName === 'S3AccessPolicy'
      );
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain(
        's3:GetObject'
      );
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain(
        's3:PutObject'
      );
    });
  });

  describe('Lambda Resources', () => {
    test('should have SecureLambdaFunction', () => {
      expect(template.Resources.SecureLambdaFunction).toBeDefined();
      expect(template.Resources.SecureLambdaFunction.Type).toBe(
        'AWS::Lambda::Function'
      );
    });

    test('Lambda function should be in VPC', () => {
      const lambda = template.Resources.SecureLambdaFunction;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toBeDefined();
    });

    test('Lambda function should have environment variables', () => {
      const lambda = template.Resources.SecureLambdaFunction;
      expect(
        lambda.Properties.Environment.Variables.S3_BUCKET_NAME
      ).toBeDefined();
      expect(lambda.Properties.Environment.Variables.ENVIRONMENT).toBeDefined();
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have Lambda log group', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
    });

    test('should have VPC Flow Logs', () => {
      expect(template.Resources.VPCFlowLogs).toBeDefined();
      expect(template.Resources.VPCFlowLogs.Type).toBe('AWS::EC2::FlowLog');
    });

    test('should have security monitoring alarms', () => {
      expect(template.Resources.UnauthorizedS3AccessAlarm).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.SuspiciousSSHAlarm).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetIds',
        'PrivateSubnetIds',
        'S3BucketName',
        'LambdaFunctionArn',
        'WebApplicationSecurityGroupId',
        'LambdaSecurityGroupId',
      ];

      expectedOutputs.forEach((outputName: string) => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('ID of the created VPC');
      expect(output.Value).toEqual({ Ref: 'SecureVPC' });
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('Name of the secure S3 bucket');
      expect(output.Value).toEqual({ Ref: 'SecureS3Bucket' });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('ARN of the Lambda function');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['SecureLambdaFunction', 'Arn'],
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

    test('should have comprehensive infrastructure resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(15); // Should have VPC, subnets, Lambda, S3, IAM, etc.
    });

    test('should have three parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have seven outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7);
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have consistent tagging', () => {
      const taggedResources = [
        'SecureVPC',
        'InternetGateway',
        'PublicSubnetAZ1',
        'SecureS3Bucket',
        'SecureLambdaFunction',
        'LambdaExecutionRole',
      ];

      taggedResources.forEach((resourceName: string) => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const projectTag = tags.find((tag: any) => tag.Key === 'Project');
          const envTag = tags.find((tag: any) => tag.Key === 'Environment');
          const ownerTag = tags.find((tag: any) => tag.Key === 'Owner');

          expect(projectTag).toBeDefined();
          expect(envTag).toBeDefined();
          expect(ownerTag).toBeDefined();
        }
      });
    });
  });

  describe('Security Compliance', () => {
    test('IAM roles should follow least privilege principle', () => {
      const lambdaRole = template.Resources.LambdaExecutionRole;
      const policies = lambdaRole.Properties.Policies;

      // Should have specific S3 permissions, not broad access
      const s3Policy = policies.find(
        (p: any) => p.PolicyName === 'S3AccessPolicy'
      );
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).not.toContain('s3:*');
    });
  });
});
