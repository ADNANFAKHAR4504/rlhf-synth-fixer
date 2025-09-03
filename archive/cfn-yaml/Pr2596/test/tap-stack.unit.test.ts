import fs from 'fs';
import path from 'path';

describe('Secure CloudFormation Template', () => {
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
      expect(template.Description).toContain('Secure AWS environment');
    });
  });

  describe('Parameters', () => {
    const params = ['VpcCidr', 'PrivateSubnet1Cidr', 'PrivateSubnet2Cidr', 'CriticalCpuThreshold'];

    test.each(params)('should define parameter: %s', (param: string) => {
      expect(template.Parameters[param]).toBeDefined();
    });

    test('CriticalCpuThreshold should have default 80', () => {
      expect(template.Parameters.CriticalCpuThreshold.Default).toBe(80);
    });
  });

  describe('Resources', () => {
    test('should include a KMS key and alias', () => {
      expect(template.Resources.KmsKey).toBeDefined();
      expect(template.Resources.KmsAlias).toBeDefined();
    });

    test('KMS key should have rotation enabled', () => {
      expect(template.Resources.KmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should include VPC and private subnets', () => {
      expect(template.Resources.Vpc).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should include versioned and encrypted S3 buckets', () => {
      ['SecretsBucket', 'ALBAccessLogsBucket'].forEach((bucket: string) => {
        const props = template.Resources[bucket].Properties;
        expect(props.VersioningConfiguration.Status).toBe('Enabled');
        expect(
          props.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm
        ).toBe('aws:kms');
      });
    });

    test('should include Lambda function with VPC config', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds.length).toBeGreaterThan(0);
    });

    test('should include a CloudWatch alarm', () => {
      const alarm = template.Resources.CloudWatchAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
    });

    test('should include a Secrets Manager secret', () => {
      const secret = template.Resources.MySecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('should include API Gateway and WAF integration', () => {
      expect(template.Resources.ApiGateway).toBeDefined();
      expect(template.Resources.WAFWebACL).toBeDefined();
      expect(template.Resources.WAFAssociation).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    test('LambdaExecutionRole uses managed policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = ['LoadBalancerDNS', 'LambdaFunctionArn', 'SecretArn'];

    test.each(expectedOutputs)('should define output: %s', (output: string) => {
      expect(template.Outputs[output]).toBeDefined();
    });

    test('LambdaFunctionArn output should refer to Lambda function', () => {
      expect(template.Outputs.LambdaFunctionArn.Value).toEqual({ Ref: 'LambdaFunction' });
    });

    test('SecretArn should reference Secrets Manager secret', () => {
      expect(template.Outputs.SecretArn.Value).toEqual({ Ref: 'MySecret' });
    });
  });

  describe('Best Practices Validation', () => {

    test('WAF should use AWS managed rules', () => {
      const wafRule = template.Resources.WAFWebACL.Properties.Rules[0];
      expect(wafRule.Statement.ManagedRuleGroupStatement.VendorName).toBe('AWS');
    });
  });
});
