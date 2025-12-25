import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Secure AWS Infrastructure', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description for secure infrastructure', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure AWS Infrastructure');
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.AllowedIPRange).toBeDefined();
      expect(template.Parameters.ApplicationName).toBeDefined();
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('AllowedIPRange parameter should have correct properties', () => {
      const param = template.Parameters.AllowedIPRange;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('ApplicationName parameter should have correct properties', () => {
      const param = template.Parameters.ApplicationName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('secureapp');
    });

    test('Environment parameter should have allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });
  });

  describe('Security Features', () => {
    describe('S3 Bucket Encryption', () => {
      test('should have SecureS3Bucket with AES256 encryption', () => {
        const bucket = template.Resources.SecureS3Bucket;
        expect(bucket).toBeDefined();
        expect(bucket.Type).toBe('AWS::S3::Bucket');

        const encryption = bucket.Properties.BucketEncryption;
        expect(encryption).toBeDefined();
        expect(
          encryption.ServerSideEncryptionConfiguration[0]
            .ServerSideEncryptionByDefault.SSEAlgorithm
        ).toBe('AES256');
      });

      test('should have S3 bucket policy enforcing encryption', () => {
        const policy = template.Resources.SecureS3BucketPolicy;
        expect(policy).toBeDefined();
        expect(policy.Type).toBe('AWS::S3::BucketPolicy');

        const statements = policy.Properties.PolicyDocument.Statement;
        const encryptionStatement = statements.find(
          (s: any) => s.Sid === 'DenyUnencryptedObjectUploads'
        );
        expect(encryptionStatement).toBeDefined();
        expect(encryptionStatement.Effect).toBe('Deny');
      });

      test('should block public access on S3 buckets', () => {
        const bucket = template.Resources.SecureS3Bucket;
        const publicAccessBlock =
          bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    describe('IAM Least Privilege', () => {
      test('should have ApplicationRole with limited permissions', () => {
        const role = template.Resources.ApplicationRole;
        expect(role).toBeDefined();
        expect(role.Type).toBe('AWS::IAM::Role');

        const policies = role.Properties.Policies;
        expect(policies).toBeDefined();
        expect(Array.isArray(policies)).toBe(true);
      });

      test('IAM role should only have necessary S3 permissions', () => {
        const role = template.Resources.ApplicationRole;
        const s3Policy = role.Properties.Policies.find(
          (p: any) => p.PolicyName === 'S3AccessPolicy'
        );
        expect(s3Policy).toBeDefined();

        const statements = s3Policy.PolicyDocument.Statement;
        const s3Statement = statements.find(
          (s: any) => s.Effect === 'Allow' && s.Action.includes('s3:GetObject')
        );
        expect(s3Statement).toBeDefined();
        expect(s3Statement.Action).toEqual([
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
        ]);
      });
    });

    describe('CloudWatch Logging', () => {
      test('should have VPC Flow Logs configured', () => {
        const flowLogs = template.Resources.VPCFlowLogs;
        expect(flowLogs).toBeDefined();
        expect(flowLogs.Type).toBe('AWS::EC2::FlowLog');
        expect(flowLogs.Properties.TrafficType).toBe('ALL');
      });

      test('should have CloudWatch Log Groups', () => {
        expect(template.Resources.VPCFlowLogsGroup).toBeDefined();
        expect(template.Resources.S3CloudWatchLogGroup).toBeDefined();
        expect(template.Resources.ApplicationLogGroup).toBeDefined();
        expect(template.Resources.CloudTrailLogGroup).toBeDefined();
      });

      test('should have CloudTrail for API logging', () => {
        const cloudTrail = template.Resources.ApplicationCloudTrail;
        expect(cloudTrail).toBeDefined();
        expect(cloudTrail.Type).toBe('AWS::CloudTrail::Trail');
        expect(cloudTrail.Properties.IncludeGlobalServiceEvents).toBe(true);
        expect(cloudTrail.Properties.IsMultiRegionTrail).toBe(true);
      });
    });

    describe('Network Security', () => {
      test('should have VPC with proper configuration', () => {
        const vpc = template.Resources.SecureVPC;
        expect(vpc).toBeDefined();
        expect(vpc.Type).toBe('AWS::EC2::VPC');
        expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
        expect(vpc.Properties.EnableDnsHostnames).toBe(true);
        expect(vpc.Properties.EnableDnsSupport).toBe(true);
      });

      test('should have Security Group with restricted access', () => {
        const sg = template.Resources.ApplicationSecurityGroup;
        expect(sg).toBeDefined();
        expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

        const ingress = sg.Properties.SecurityGroupIngress;
        expect(Array.isArray(ingress)).toBe(true);

        // Check that ingress rules reference AllowedIPRange parameter
        const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);
        expect(httpsRule).toBeDefined();
        expect(httpsRule.CidrIp).toEqual({ Ref: 'AllowedIPRange' });
      });

      test('should restrict outbound traffic in Security Group', () => {
        const sg = template.Resources.ApplicationSecurityGroup;
        const egress = sg.Properties.SecurityGroupEgress;
        expect(Array.isArray(egress)).toBe(true);

        // Check that egress rules also reference AllowedIPRange parameter
        const httpsEgress = egress.find((rule: any) => rule.FromPort === 443);
        expect(httpsEgress).toBeDefined();
        expect(httpsEgress.CidrIp).toEqual({ Ref: 'AllowedIPRange' });
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'SecurityGroupId',
        'S3BucketName',
        'ApplicationRoleArn',
        'CloudWatchLogGroup',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have proper export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
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

    test('should have multiple security resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10); // Expect many security resources
    });

    test('should have security-focused parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3); // AllowedIPRange, ApplicationName, Environment
    });

    test('should have comprehensive outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8); // VPC, SG, S3, IAM Role, Log Group
    });
  });

  describe('Resource Naming Convention', () => {
    test('S3 bucket names should include account ID to ensure uniqueness', () => {
      const bucket = template.Resources.SecureS3Bucket;
      const bucketName = bucket.Properties.BucketName;
      expect(bucketName['Fn::Sub']).toContain('${AWS::AccountId}');
    });

    test('IAM role should have descriptive name with environment', () => {
      const role = template.Resources.ApplicationRole;
      const roleName = role.Properties.RoleName;
      expect(roleName['Fn::Sub']).toContain(
        '${ApplicationName}-${Environment}'
      );
    });

    test('CloudWatch log groups should have structured naming', () => {
      const logGroup = template.Resources.ApplicationLogGroup;
      const logGroupName = logGroup.Properties.LogGroupName;
      expect(logGroupName['Fn::Sub']).toContain('/aws/application/');
    });
  });
});
