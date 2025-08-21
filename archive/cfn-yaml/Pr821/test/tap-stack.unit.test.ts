import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Security-Focused CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Template is already in JSON format
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a security-focused description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Security-focused CloudFormation template enforcing best practices across AWS services'
      );
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParams = [
        'Environment',
        'Owner',
        'Project',
        'VpcCidr',
        'PrivateSubnet1Cidr',
        'PrivateSubnet2Cidr',
        'KmsKeyAlias',
      ];
      requiredParams.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      expect(envParam.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('VPC CIDR parameter should have correct validation', () => {
      const vpcCidrParam = template.Parameters.VpcCidr;
      expect(vpcCidrParam.Type).toBe('String');
      expect(vpcCidrParam.Default).toBe('10.0.0.0/16');
      expect(vpcCidrParam.AllowedPattern).toBeDefined();
    });
  });

  describe('Security Resources', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.SecurityKmsKey).toBeDefined();
      expect(template.Resources.SecurityKmsKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have appropriate deletion policy', () => {
      const kmsKey = template.Resources.SecurityKmsKey;
      // KMS keys should be deletable for testing environments
      expect(kmsKey.DeletionPolicy).toBeUndefined(); // Default is Delete
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.SecurityKmsKeyAlias).toBeDefined();
      expect(template.Resources.SecurityKmsKeyAlias.Type).toBe(
        'AWS::KMS::Alias'
      );
    });

    test('should have S3 bucket with encryption', () => {
      expect(template.Resources.SecureS3Bucket).toBeDefined();
      expect(template.Resources.SecureS3Bucket.Type).toBe('AWS::S3::Bucket');

      const bucketProps = template.Resources.SecureS3Bucket.Properties;
      expect(bucketProps.BucketEncryption).toBeDefined();
      expect(
        bucketProps.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('aws:kms');
    });

    test('S3 bucket should have public access blocked', () => {
      const bucket = template.Resources.SecureS3Bucket;
      const publicAccessConfig =
        bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should have S3 bucket policy enforcing encryption', () => {
      expect(template.Resources.SecureS3BucketPolicy).toBeDefined();
      expect(template.Resources.SecureS3BucketPolicy.Type).toBe(
        'AWS::S3::BucketPolicy'
      );

      const policyDoc =
        template.Resources.SecureS3BucketPolicy.Properties.PolicyDocument;
      const statements = policyDoc.Statement;

      // Check for encryption enforcement statements
      const denyUnencryptedStmt = statements.find(
        (stmt: any) => stmt.Sid === 'DenyUnencryptedUploads'
      );
      expect(denyUnencryptedStmt).toBeDefined();
      expect(denyUnencryptedStmt.Effect).toBe('Deny');
    });
  });

  describe('VPC Security Resources', () => {
    test('should have VPC for Lambda isolation', () => {
      expect(template.Resources.SecurityVpc).toBeDefined();
      expect(template.Resources.SecurityVpc.Type).toBe('AWS::EC2::VPC');
    });

    test('should have private subnets for Lambda', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();

      // Both should be private subnets (no public IP on launch)
      expect(
        template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch
      ).toBe(false);
      expect(
        template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch
      ).toBe(false);
    });

    test('should have restrictive security group for Lambda', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );

      const sgProps = template.Resources.LambdaSecurityGroup.Properties;
      const egressRules = sgProps.SecurityGroupEgress;

      // Should only allow HTTPS and DNS outbound
      expect(egressRules).toHaveLength(2);

      const httpsRule = egressRules.find((rule: any) => rule.FromPort === 443);
      const dnsRule = egressRules.find((rule: any) => rule.FromPort === 53);

      expect(httpsRule).toBeDefined();
      expect(dnsRule).toBeDefined();
    });

    test('should have S3 VPC endpoint for secure access', () => {
      expect(template.Resources.S3VpcEndpoint).toBeDefined();
      expect(template.Resources.S3VpcEndpoint.Type).toBe(
        'AWS::EC2::VPCEndpoint'
      );

      const endpointProps = template.Resources.S3VpcEndpoint.Properties;
      expect(endpointProps.VpcEndpointType).toBe('Gateway');
    });
  });

  describe('IAM Security', () => {
    test('should have Lambda execution role with least privilege', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe(
        'AWS::IAM::Role'
      );

      const roleProps = template.Resources.LambdaExecutionRole.Properties;
      const policies = roleProps.Policies;

      // Should have KMS policy with specific resource ARN
      const kmsPolicy = policies.find(
        (policy: any) => policy.PolicyName === 'KmsAccessPolicy'
      );
      expect(kmsPolicy).toBeDefined();

      const kmsStatement = kmsPolicy.PolicyDocument.Statement[0];
      expect(kmsStatement.Action).toEqual([
        'kms:Decrypt',
        'kms:GenerateDataKey',
      ]);
      expect(kmsStatement.Resource).toEqual({
        'Fn::GetAtt': ['SecurityKmsKey', 'Arn'],
      });
    });

    test('should have separate S3 access policy', () => {
      expect(template.Resources.LambdaS3AccessPolicy).toBeDefined();
      expect(template.Resources.LambdaS3AccessPolicy.Type).toBe(
        'AWS::IAM::Policy'
      );

      const policyProps = template.Resources.LambdaS3AccessPolicy.Properties;
      const statements = policyProps.PolicyDocument.Statement;

      // Should have specific S3 permissions, no wildcards
      statements.forEach((statement: any) => {
        expect(statement.Resource).not.toBe('*');
        expect(statement.Action).not.toContain('*');
      });
    });
  });

  describe('Lambda Security', () => {
    test('should have Lambda function deployed in VPC', () => {
      expect(template.Resources.SecureLambdaFunction).toBeDefined();
      expect(template.Resources.SecureLambdaFunction.Type).toBe(
        'AWS::Lambda::Function'
      );

      const lambdaProps = template.Resources.SecureLambdaFunction.Properties;
      expect(lambdaProps.VpcConfig).toBeDefined();
      expect(lambdaProps.VpcConfig.SecurityGroupIds).toBeDefined();
      expect(lambdaProps.VpcConfig.SubnetIds).toBeDefined();
    });

    test('should have encrypted CloudWatch logs', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );

      const logProps = template.Resources.LambdaLogGroup.Properties;
      expect(logProps.KmsKeyId).toEqual({
        'Fn::GetAtt': ['SecurityKmsKey', 'Arn'],
      });
      expect(logProps.RetentionInDays).toBe(14);
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have consistent tagging', () => {
      const taggedResources = [
        'SecurityKmsKey',
        'SecurityVpc',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'LambdaSecurityGroup',
        'SecureS3Bucket',
        'SecureLambdaFunction',
        'LambdaLogGroup',
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();

        const tags = resource.Properties.Tags;
        const requiredTags = ['Environment', 'Owner', 'Project'];

        requiredTags.forEach(tagKey => {
          const tag = tags.find((t: any) => t.Key === tagKey);
          expect(tag).toBeDefined();
          expect(tag.Value).toEqual({ Ref: tagKey });
        });
      });
    });
  });

  describe('Outputs', () => {
    test('should have comprehensive outputs for cross-stack references', () => {
      const expectedOutputs = [
        'VpcId',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'SecurityGroupId',
        'KmsKeyId',
        'KmsKeyArn',
        'S3BucketName',
        'LambdaFunctionArn',
        'LambdaExecutionRoleArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required template sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have expected number of resources for security template', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(16); // All security resources
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(7);
    });

    test('should have expected number of outputs', () => {
      const outputCount: any = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9);
    });
  });

  describe('Security Best Practices Validation', () => {
    test('KMS key policy should use service principals', () => {
      const kmsKey = template.Resources.SecurityKmsKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;
      const statements = keyPolicy.Statement;

      // Should have statements for S3 and Lambda services
      const s3Statement = statements.find(
        (stmt: any) => stmt.Sid === 'Allow S3 Service'
      );
      const lambdaStatement = statements.find(
        (stmt: any) => stmt.Sid === 'Allow Lambda Service'
      );

      expect(s3Statement).toBeDefined();
      expect(s3Statement.Principal.Service).toBe('s3.amazonaws.com');

      expect(lambdaStatement).toBeDefined();
      expect(lambdaStatement.Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('template should enforce HTTPS-only access', () => {
      const bucketPolicy = template.Resources.SecureS3BucketPolicy;
      const statements = bucketPolicy.Properties.PolicyDocument.Statement;

      const httpsStatement = statements.find(
        (stmt: any) => stmt.Sid === 'DenyInsecureConnections'
      );
      expect(httpsStatement).toBeDefined();
      expect(httpsStatement.Condition.Bool['aws:SecureTransport']).toBe(
        'false'
      );
    });
  });
});
