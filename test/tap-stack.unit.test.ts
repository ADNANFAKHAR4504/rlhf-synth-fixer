import fs from 'fs';
import path from 'path';

describe('ServerlessApp CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Basic Template Structure', () => {
    test('should be valid CloudFormation JSON', async () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('ServerlessApp');
      expect(template.Description).toContain('Lambda triggered by S3');
    });

    test('should have mappings section', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.RegionMap).toBeDefined();
      expect(template.Mappings.RegionMap['us-west-2']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      expect(template.Parameters.LambdaRuntime).toBeDefined();
      expect(template.Parameters.LambdaHandler).toBeDefined();
      expect(template.Parameters.S3BucketName).toBeDefined();
    });

    test('LambdaRuntime parameter should have correct properties', () => {
      const param = template.Parameters.LambdaRuntime;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('python3.12');
      expect(param.AllowedValues).toContain('python3.12');
      expect(param.AllowedValues).toContain('nodejs20.x');
    });

    test('LambdaHandler parameter should have correct properties', () => {
      const param = template.Parameters.LambdaHandler;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('lambda_function.lambda_handler');
    });

    test('S3BucketName parameter should have correct properties', () => {
      const param = template.Parameters.S3BucketName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('serverlessapp-bucket');
    });
  });

  describe('S3 Resources', () => {
    test('should have S3 bucket resource', () => {
      expect(template.Resources.ServerlessAppBucket).toBeDefined();
      expect(template.Resources.ServerlessAppBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.ServerlessAppBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.ServerlessAppBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have Lambda notification configuration', () => {
      const bucket = template.Resources.ServerlessAppBucket;
      expect(bucket.Properties.NotificationConfiguration).toBeDefined();
      expect(bucket.Properties.NotificationConfiguration.LambdaConfigurations).toHaveLength(1);
      expect(bucket.Properties.NotificationConfiguration.LambdaConfigurations[0].Event).toBe('s3:ObjectCreated:*');
    });

    test('should have S3 bucket invoke permission for Lambda', () => {
      expect(template.Resources.ServerlessAppBucketInvokePermission).toBeDefined();
      expect(template.Resources.ServerlessAppBucketInvokePermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('Lambda Resources', () => {
    test('should have Lambda function resource', () => {
      expect(template.Resources.ServerlessAppLambda).toBeDefined();
      expect(template.Resources.ServerlessAppLambda.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function should have correct basic properties', () => {
      const lambda = template.Resources.ServerlessAppLambda;
      expect(lambda.Properties.FunctionName).toBe('ServerlessAppLambda');
      expect(lambda.Properties.Timeout).toBe(60);
      expect(lambda.Properties.MemorySize).toBe(256);
    });

    test('Lambda function should have VPC configuration', () => {
      const lambda = template.Resources.ServerlessAppLambda;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toBeDefined();
    });

    test('Lambda function should have environment variables', () => {
      const lambda = template.Resources.ServerlessAppLambda;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables.SERVERLESSAPP_SECRET_ARN).toBeDefined();
    });

    test('should have Lambda IAM role with correct assume role policy', () => {
      const role = template.Resources.ServerlessAppLambdaRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('Lambda IAM role should have least privilege policies', () => {
      const role = template.Resources.ServerlessAppLambdaRole;
      const policies = role.Properties.Policies[0].PolicyDocument.Statement;
      
      // Should have Secrets Manager access
      const secretsPolicy = policies.find((s: any) => s.Action.includes('secretsmanager:GetSecretValue'));
      expect(secretsPolicy).toBeDefined();
      
      // Should have CloudWatch logs access
      const logsPolicy = policies.find((s: any) => s.Action.includes('logs:CreateLogGroup'));
      expect(logsPolicy).toBeDefined();
      
      // Should have S3 read access
      const s3Policy = policies.find((s: any) => s.Action.includes('s3:GetObject'));
      expect(s3Policy).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.ServerlessAppVPC).toBeDefined();
      expect(template.Resources.ServerlessAppVPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.ServerlessAppVPC.Properties.CidrBlock).toBe('10.0.0.0/24');
    });

    test('should have subnets in multiple AZs', () => {
      expect(template.Resources.ServerlessAppSubnetAZ1).toBeDefined();
      expect(template.Resources.ServerlessAppSubnetAZ2).toBeDefined();
      expect(template.Resources.ServerlessAppSubnetAZ1.Properties.CidrBlock).toBe('10.0.0.0/26');
      expect(template.Resources.ServerlessAppSubnetAZ2.Properties.CidrBlock).toBe('10.0.0.64/26');
    });

    test('should have internet gateway and routing', () => {
      expect(template.Resources.ServerlessAppInternetGateway).toBeDefined();
      expect(template.Resources.ServerlessAppRouteTable).toBeDefined();
      expect(template.Resources.ServerlessAppRoute).toBeDefined();
    });

    test('should have security group for Lambda', () => {
      expect(template.Resources.ServerlessAppLambdaSecurityGroup).toBeDefined();
      expect(template.Resources.ServerlessAppLambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe('Secrets Manager Resources', () => {
    test('should have Secrets Manager secret', () => {
      expect(template.Resources.ServerlessAppSecret).toBeDefined();
      expect(template.Resources.ServerlessAppSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('secret should have proper configuration', () => {
      const secret = template.Resources.ServerlessAppSecret;
      expect(secret.Properties.Name).toBe('ServerlessAppSecret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have CloudWatch log group', () => {
      expect(template.Resources.ServerlessAppLogGroup).toBeDefined();
      expect(template.Resources.ServerlessAppLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have CloudWatch alarms for Lambda monitoring', () => {
      expect(template.Resources.ServerlessAppLambdaErrorAlarm).toBeDefined();
      expect(template.Resources.ServerlessAppLambdaInvocationsAlarm).toBeDefined();
    });

    test('error alarm should have correct configuration', () => {
      const alarm = template.Resources.ServerlessAppLambdaErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Threshold).toBe(1);
    });

    test('invocations alarm should have correct configuration', () => {
      const alarm = template.Resources.ServerlessAppLambdaInvocationsAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Invocations');
      expect(alarm.Properties.Threshold).toBe(100);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'S3BucketName',
        'LambdaFunctionName',
        'LambdaFunctionArn',
        'SecretArn',
        'Alarms',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toContain('S3 bucket');
      expect(output.Value).toEqual({ Ref: 'ServerlessAppBucket' });
    });

    test('LambdaFunctionName output should be correct', () => {
      const output = template.Outputs.LambdaFunctionName;
      expect(output.Description).toContain('Lambda function name');
      expect(output.Value).toEqual({ Ref: 'ServerlessAppLambda' });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toContain('Lambda function ARN');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ServerlessAppLambda', 'Arn'],
      });
    });

    test('SecretArn output should be correct', () => {
      const output = template.Outputs.SecretArn;
      expect(output.Description).toContain('Secret');
      expect(output.Value).toEqual({ Ref: 'ServerlessAppSecret' });
    });

    test('Alarms output should be correct', () => {
      const output = template.Outputs.Alarms;
      expect(output.Description).toContain('CloudWatch Alarms');
      expect(output.Value).toBeDefined();
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
      expect(template.Mappings).not.toBeNull();
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(15); // Should have all serverless app resources
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3); // LambdaRuntime, LambdaHandler, S3BucketName
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(5); // S3BucketName, LambdaFunctionName, LambdaFunctionArn, SecretArn, Alarms
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should follow ServerlessApp naming convention', () => {
      const resourceNames = Object.keys(template.Resources);
      const serverlessAppResources = resourceNames.filter(name => name.startsWith('ServerlessApp'));
      expect(serverlessAppResources.length).toBeGreaterThan(10); // Most resources should follow this convention
    });

    test('S3 bucket should reference parameter for naming', () => {
      const bucket = template.Resources.ServerlessAppBucket;
      expect(bucket.Properties.BucketName).toEqual({ Ref: 'S3BucketName' });
    });

    test('Lambda function should have consistent naming', () => {
      const lambda = template.Resources.ServerlessAppLambda;
      expect(lambda.Properties.FunctionName).toBe('ServerlessAppLambda');
    });

    test('all resources should have proper tags', () => {
      const resourcesWithTags = ['ServerlessAppBucket', 'ServerlessAppVPC', 'ServerlessAppLambda', 'ServerlessAppSecret'];
      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        expect(resource.Properties.Tags.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Security Configuration', () => {
    test('should implement least privilege IAM policies', () => {
      const role = template.Resources.ServerlessAppLambdaRole;
      const statements = role.Properties.Policies[0].PolicyDocument.Statement;
      
      // Each statement should have specific resources, not wildcards
      statements.forEach((statement: any) => {
        if (statement.Resource) {
          expect(statement.Resource).toBeDefined();
          // Resource should not be just '*' for sensitive actions
          if (statement.Action.includes('secretsmanager') || statement.Action.includes('s3:GetObject')) {
            expect(statement.Resource).not.toBe('*');
          }
        }
      });
    });

    test('should have proper VPC isolation', () => {
      const lambda = template.Resources.ServerlessAppLambda;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toBeDefined();
    });

    test('should have encrypted storage', () => {
      const bucket = template.Resources.ServerlessAppBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      
      const secret = template.Resources.ServerlessAppSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
    });
  });

  describe('High Availability Configuration', () => {
    test('should deploy across multiple availability zones', () => {
      expect(template.Resources.ServerlessAppSubnetAZ1).toBeDefined();
      expect(template.Resources.ServerlessAppSubnetAZ2).toBeDefined();
      
      const subnet1 = template.Resources.ServerlessAppSubnetAZ1;
      const subnet2 = template.Resources.ServerlessAppSubnetAZ2;
      
      expect(subnet1.Properties.AvailabilityZone).toBeDefined();
      expect(subnet2.Properties.AvailabilityZone).toBeDefined();
      expect(subnet1.Properties.AvailabilityZone).not.toEqual(subnet2.Properties.AvailabilityZone);
    });

    test('Lambda should be configured for multi-AZ deployment', () => {
      const lambda = template.Resources.ServerlessAppLambda;
      expect(lambda.Properties.VpcConfig.SubnetIds).toHaveLength(2);
    });
  });

  describe('Monitoring and Observability', () => {
    test('should have CloudWatch log group with retention policy', () => {
      const logGroup = template.Resources.ServerlessAppLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(7);
      expect(logGroup.Properties.LogGroupName).toBe('/aws/lambda/ServerlessAppLambda');
    });

    test('should have comprehensive CloudWatch alarms', () => {
      const errorAlarm = template.Resources.ServerlessAppLambdaErrorAlarm;
      const invocationAlarm = template.Resources.ServerlessAppLambdaInvocationsAlarm;
      
      expect(errorAlarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(errorAlarm.Properties.MetricName).toBe('Errors');
      
      expect(invocationAlarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(invocationAlarm.Properties.MetricName).toBe('Invocations');
    });
  });
});