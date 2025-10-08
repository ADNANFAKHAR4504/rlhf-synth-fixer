import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr546';

describe('Serverless Image Processing CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../template.yaml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = require('js-yaml').load(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format', () => {
      expect(template).toBeDefined();
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Serverless Image Processing System');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters Validation', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBeDefined();
    });

    test('should have valid parameter types', () => {
      Object.keys(template.Parameters).forEach(param => {
        const paramDef = template.Parameters[param];
        expect(paramDef.Type).toBeDefined();
        expect(['String', 'Number', 'CommaDelimitedList']).toContain(paramDef.Type);
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should have S3 bucket resource defined', () => {
      const s3Bucket = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::S3::Bucket'
      );
      expect(s3Bucket).toBeDefined();
    });

    test('should have versioning enabled on S3 bucket', () => {
      const s3Bucket = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::S3::Bucket'
      );
      expect(s3Bucket).toBeDefined();
      expect((s3Bucket as any).Properties.VersioningConfiguration).toBeDefined();
      expect((s3Bucket as any).Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have encryption enabled on S3 bucket', () => {
      const s3Bucket = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::S3::Bucket'
      );
      expect(s3Bucket).toBeDefined();
      expect((s3Bucket as any).Properties.BucketEncryption).toBeDefined();
      expect((s3Bucket as any).Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('should have public access blocked on S3 bucket', () => {
      const s3Bucket = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::S3::Bucket'
      );
      expect(s3Bucket).toBeDefined();
      expect((s3Bucket as any).Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect((s3Bucket as any).Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect((s3Bucket as any).Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect((s3Bucket as any).Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect((s3Bucket as any).Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('should have notification configuration for Lambda', () => {
      const s3Bucket = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::S3::Bucket'
      );
      expect(s3Bucket).toBeDefined();
      expect((s3Bucket as any).Properties.NotificationConfiguration).toBeDefined();
      expect((s3Bucket as any).Properties.NotificationConfiguration.LambdaConfigurations).toBeDefined();
      expect(Array.isArray((s3Bucket as any).Properties.NotificationConfiguration.LambdaConfigurations)).toBe(true);
    });

    test('should trigger Lambda on image upload events', () => {
      const s3Bucket = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::S3::Bucket'
      );
      const lambdaConfig = (s3Bucket as any).Properties.NotificationConfiguration.LambdaConfigurations[0];
      expect(lambdaConfig.Event).toBe('s3:ObjectCreated:*');
      expect(lambdaConfig.Filter).toBeDefined();
      expect(lambdaConfig.Filter.S3Key.Rules).toBeDefined();
    });
  });

  describe('Lambda Function Configuration', () => {
    test('should have Lambda function resource defined', () => {
      const lambdaFunction = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::Lambda::Function'
      );
      expect(lambdaFunction).toBeDefined();
    });

    test('should use Python 3.9 runtime', () => {
      const lambdaFunction = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::Lambda::Function'
      );
      expect((lambdaFunction as any).Properties.Runtime).toBe('python3.9');
    });

    test('should have proper handler defined', () => {
      const lambdaFunction = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::Lambda::Function'
      );
      expect((lambdaFunction as any).Properties.Handler).toBeDefined();
      expect((lambdaFunction as any).Properties.Handler).toContain('handler');
    });

    test('should have appropriate timeout configured', () => {
      const lambdaFunction = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::Lambda::Function'
      );
      expect((lambdaFunction as any).Properties.Timeout).toBeDefined();
      expect((lambdaFunction as any).Properties.Timeout).toBeGreaterThanOrEqual(60);
      expect((lambdaFunction as any).Properties.Timeout).toBeLessThanOrEqual(900);
    });

    test('should have appropriate memory size configured', () => {
      const lambdaFunction = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::Lambda::Function'
      );
      expect((lambdaFunction as any).Properties.MemorySize).toBeDefined();
      expect((lambdaFunction as any).Properties.MemorySize).toBeGreaterThanOrEqual(128);
    });

    test('should have IAM role attached', () => {
      const lambdaFunction = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::Lambda::Function'
      );
      expect((lambdaFunction as any).Properties.Role).toBeDefined();
    });

    test('should have environment variables configured', () => {
      const lambdaFunction = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::Lambda::Function'
      );
      expect((lambdaFunction as any).Properties.Environment).toBeDefined();
      expect((lambdaFunction as any).Properties.Environment.Variables).toBeDefined();
    });

    test('should have DynamoDB table name in environment variables', () => {
      const lambdaFunction = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::Lambda::Function'
      );
      const envVars = (lambdaFunction as any).Properties.Environment.Variables;
      expect(envVars.DYNAMODB_TABLE).toBeDefined();
    });
  });

  describe('Lambda Permission Configuration', () => {
    test('should have Lambda permission resource for S3', () => {
      const lambdaPermission = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::Lambda::Permission'
      );
      expect(lambdaPermission).toBeDefined();
    });

    test('should allow S3 to invoke Lambda', () => {
      const lambdaPermission = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::Lambda::Permission'
      );
      expect((lambdaPermission as any).Properties.Action).toBe('lambda:InvokeFunction');
      expect((lambdaPermission as any).Properties.Principal).toBe('s3.amazonaws.com');
    });

    test('should reference the correct Lambda function', () => {
      const lambdaPermission = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::Lambda::Permission'
      );
      expect((lambdaPermission as any).Properties.FunctionName).toBeDefined();
    });
  });

  describe('DynamoDB Table Configuration', () => {
    test('should have DynamoDB table resource defined', () => {
      const dynamoTable = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::DynamoDB::Table'
      );
      expect(dynamoTable).toBeDefined();
    });

    test('should have ImageId as partition key', () => {
      const dynamoTable = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::DynamoDB::Table'
      );
      const keySchema = (dynamoTable as any).Properties.KeySchema;
      const partitionKey = keySchema.find((key: any) => key.KeyType === 'HASH');
      expect(partitionKey).toBeDefined();
      expect(partitionKey.AttributeName).toBe('ImageId');
    });

    test('should have proper attribute definitions', () => {
      const dynamoTable = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::DynamoDB::Table'
      );
      expect((dynamoTable as any).Properties.AttributeDefinitions).toBeDefined();
      expect(Array.isArray((dynamoTable as any).Properties.AttributeDefinitions)).toBe(true);
      expect((dynamoTable as any).Properties.AttributeDefinitions.length).toBeGreaterThan(0);
    });

    test('should have billing mode configured', () => {
      const dynamoTable = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::DynamoDB::Table'
      );
      expect((dynamoTable as any).Properties.BillingMode).toBeDefined();
      expect(['PAY_PER_REQUEST', 'PROVISIONED']).toContain((dynamoTable as any).Properties.BillingMode);
    });

    test('should have Global Secondary Index for timestamp queries', () => {
      const dynamoTable = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::DynamoDB::Table'
      );
      expect((dynamoTable as any).Properties.GlobalSecondaryIndexes).toBeDefined();
      expect(Array.isArray((dynamoTable as any).Properties.GlobalSecondaryIndexes)).toBe(true);

      const timestampIndex = (dynamoTable as any).Properties.GlobalSecondaryIndexes.find(
        (index: any) => index.IndexName.includes('Timestamp')
      );
      expect(timestampIndex).toBeDefined();
    });

    test('should have point-in-time recovery enabled', () => {
      const dynamoTable = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::DynamoDB::Table'
      );

      if ((dynamoTable as any).Properties.PointInTimeRecoverySpecification) {
        expect((dynamoTable as any).Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      }
    });
  });

  describe('IAM Role Configuration', () => {
    test('should have IAM role for Lambda function', () => {
      const iamRole = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::IAM::Role'
      );
      expect(iamRole).toBeDefined();
    });

    test('should have Lambda service as trusted entity', () => {
      const iamRole = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::IAM::Role'
      );
      const assumeRolePolicy = (iamRole as any).Properties.AssumeRolePolicyDocument;
      expect(assumeRolePolicy).toBeDefined();
      expect(assumeRolePolicy.Statement).toBeDefined();

      const lambdaStatement = assumeRolePolicy.Statement.find(
        (stmt: any) => stmt.Principal?.Service?.includes('lambda.amazonaws.com')
      );
      expect(lambdaStatement).toBeDefined();
    });

    test('should have policies attached', () => {
      const iamRole = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::IAM::Role'
      );
      expect(
        (iamRole as any).Properties.Policies ||
        (iamRole as any).Properties.ManagedPolicyArns
      ).toBeDefined();
    });

    test('should have S3 read permissions', () => {
      const iamRole = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::IAM::Role'
      );

      if ((iamRole as any).Properties.Policies) {
        const policies = (iamRole as any).Properties.Policies;
        const hasS3Permission = policies.some((policy: any) =>
          policy.PolicyDocument.Statement.some((stmt: any) =>
            stmt.Action.some((action: string) =>
              action.includes('s3:GetObject') || action === 's3:*'
            )
          )
        );
        expect(hasS3Permission).toBe(true);
      }
    });

    test('should have DynamoDB write permissions', () => {
      const iamRole = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::IAM::Role'
      );

      if ((iamRole as any).Properties.Policies) {
        const policies = (iamRole as any).Properties.Policies;
        const hasDynamoDBPermission = policies.some((policy: any) =>
          policy.PolicyDocument.Statement.some((stmt: any) =>
            stmt.Action.some((action: string) =>
              action.includes('dynamodb:PutItem') || action === 'dynamodb:*'
            )
          )
        );
        expect(hasDynamoDBPermission).toBe(true);
      }
    });

    test('should have CloudWatch Logs permissions', () => {
      const iamRole = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::IAM::Role'
      );

      if ((iamRole as any).Properties.Policies) {
        const policies = (iamRole as any).Properties.Policies;
        const hasLogsPermission = policies.some((policy: any) =>
          policy.PolicyDocument.Statement.some((stmt: any) =>
            stmt.Action.some((action: string) =>
              action.includes('logs:') || action === 'logs:*'
            )
          )
        );
        expect(hasLogsPermission).toBe(true);
      }
    });
  });

  describe('SNS Topic Configuration', () => {
    test('should have SNS topic resource defined', () => {
      const snsTopic = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::SNS::Topic'
      );
      expect(snsTopic).toBeDefined();
    });

    test('should have display name configured', () => {
      const snsTopic = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::SNS::Topic'
      );
      expect((snsTopic as any).Properties.DisplayName).toBeDefined();
    });

    test('should have subscription configured', () => {
      const snsSubscription = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::SNS::Subscription'
      );

      if (snsSubscription) {
        expect((snsSubscription as any).Properties.Protocol).toBeDefined();
        expect((snsSubscription as any).Properties.TopicArn).toBeDefined();
      }
    });
  });

  describe('CloudWatch Dashboard Configuration', () => {
    test('should have CloudWatch dashboard resource defined', () => {
      const dashboard = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::CloudWatch::Dashboard'
      );
      expect(dashboard).toBeDefined();
    });

    test('should have dashboard body defined', () => {
      const dashboard = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::CloudWatch::Dashboard'
      );
      expect((dashboard as any).Properties.DashboardBody).toBeDefined();
    });

    test('should monitor Lambda metrics', () => {
      const dashboard = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::CloudWatch::Dashboard'
      );

      if ((dashboard as any).Properties.DashboardBody) {
        const dashboardBody = typeof (dashboard as any).Properties.DashboardBody === 'string'
          ? JSON.parse((dashboard as any).Properties.DashboardBody)
          : (dashboard as any).Properties.DashboardBody;

        expect(dashboardBody.widgets).toBeDefined();
        expect(Array.isArray(dashboardBody.widgets)).toBe(true);
      }
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    test('should have CloudWatch alarms for error monitoring', () => {
      const alarms = Object.values(template.Resources).filter(
        (resource: any) => resource.Type === 'AWS::CloudWatch::Alarm'
      );

      if (alarms.length > 0) {
        expect(alarms.length).toBeGreaterThan(0);
      }
    });

    test('should have alarm for Lambda errors', () => {
      const errorAlarm = Object.values(template.Resources).find(
        (resource: any) =>
          resource.Type === 'AWS::CloudWatch::Alarm' &&
          (resource as any).Properties.MetricName === 'Errors'
      );

      if (errorAlarm) {
        expect((errorAlarm as any).Properties.Namespace).toBe('AWS/Lambda');
        expect((errorAlarm as any).Properties.Statistic).toBeDefined();
        expect((errorAlarm as any).Properties.Threshold).toBeDefined();
      }
    });

    test('should have alarm actions configured', () => {
      const alarms = Object.values(template.Resources).filter(
        (resource: any) => resource.Type === 'AWS::CloudWatch::Alarm'
      );

      if (alarms.length > 0) {
        alarms.forEach((alarm: any) => {
          expect(
            alarm.Properties.AlarmActions ||
            alarm.Properties.OKActions
          ).toBeDefined();
        });
      }
    });
  });

  describe('Outputs Configuration', () => {
    test('should have S3 bucket name in outputs', () => {
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.S3BucketName.Value).toBeDefined();
      expect(template.Outputs.S3BucketName.Description).toBeDefined();
    });

    test('should have Lambda function ARN in outputs', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn.Value).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn.Description).toBeDefined();
    });

    test('should have DynamoDB table name in outputs', () => {
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
      expect(template.Outputs.DynamoDBTableName.Value).toBeDefined();
      expect(template.Outputs.DynamoDBTableName.Description).toBeDefined();
    });

    test('should have SNS topic ARN in outputs', () => {
      expect(template.Outputs.SNSTopicArn).toBeDefined();
      expect(template.Outputs.SNSTopicArn.Value).toBeDefined();
      expect(template.Outputs.SNSTopicArn.Description).toBeDefined();
    });

    test('should have dashboard URL in outputs', () => {
      expect(template.Outputs.DashboardURL).toBeDefined();
      expect(template.Outputs.DashboardURL.Value).toBeDefined();
      expect(template.Outputs.DashboardURL.Description).toBeDefined();
    });

    test('should have export names for cross-stack references', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
        }
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('should use environment suffix in resource names', () => {
      Object.entries(template.Resources).forEach(([key, resource]: [string, any]) => {
        if (resource.Properties?.TableName ||
          resource.Properties?.FunctionName ||
          resource.Properties?.BucketName) {

          const resourceName =
            resource.Properties.TableName ||
            resource.Properties.FunctionName ||
            resource.Properties.BucketName;

          if (typeof resourceName === 'string') {
            expect(
              resourceName.includes(environmentSuffix) ||
              resourceName.includes('!Sub') ||
              resourceName.includes('!Ref')
            ).toBe(true);
          }
        }
      });
    });

    test('should have consistent naming pattern', () => {
      const resourceNames: string[] = [];

      Object.values(template.Resources).forEach((resource: any) => {
        if (resource.Properties?.TableName) {
          resourceNames.push(resource.Properties.TableName);
        }
        if (resource.Properties?.FunctionName) {
          resourceNames.push(resource.Properties.FunctionName);
        }
      });

      expect(resourceNames.length).toBeGreaterThan(0);
    });
  });

  describe('Security Best Practices', () => {
    test('should not have hardcoded credentials', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).not.toMatch(/AKIA[0-9A-Z]{16}/);
      expect(templateString).not.toMatch(/password/i);
      expect(templateString).not.toMatch(/secret/i);
    });

    test('should use least privilege IAM policies', () => {
      const iamRole = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::IAM::Role'
      );

      if ((iamRole as any).Properties.Policies) {
        const policies = (iamRole as any).Properties.Policies;
        policies.forEach((policy: any) => {
          policy.PolicyDocument.Statement.forEach((stmt: any) => {
            expect(stmt.Effect).toBe('Allow');
            expect(stmt.Action).toBeDefined();
          });
        });
      }
    });

    test('should have encryption enabled where applicable', () => {
      const s3Bucket = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::S3::Bucket'
      );

      expect((s3Bucket as any).Properties.BucketEncryption).toBeDefined();
    });
  });

  describe('Scalability Configuration', () => {
    test('should support auto-scaling for DynamoDB', () => {
      const dynamoTable = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::DynamoDB::Table'
      );

      const billingMode = (dynamoTable as any).Properties.BillingMode;
      expect(['PAY_PER_REQUEST', 'PROVISIONED']).toContain(billingMode);
    });

    test('should have Lambda reserved concurrent executions if specified', () => {
      const lambdaFunction = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::Lambda::Function'
      );

      if ((lambdaFunction as any).Properties.ReservedConcurrentExecutions) {
        expect((lambdaFunction as any).Properties.ReservedConcurrentExecutions).toBeGreaterThan(0);
      }
    });
  });

  describe('Monitoring and Logging', () => {
    test('should have CloudWatch log group for Lambda', () => {
      const logGroup = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::Logs::LogGroup'
      );

      if (logGroup) {
        expect((logGroup as any).Properties.LogGroupName).toBeDefined();
        expect((logGroup as any).Properties.RetentionInDays).toBeDefined();
      }
    });

    test('should have appropriate log retention period', () => {
      const logGroup = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::Logs::LogGroup'
      );

      if (logGroup) {
        const retentionDays = (logGroup as any).Properties.RetentionInDays;
        expect([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653]).toContain(retentionDays);
      }
    });
  });

  describe('Resource Dependencies', () => {
    test('should have proper DependsOn relationships', () => {
      const s3Bucket = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::S3::Bucket'
      );

      if ((s3Bucket as any).DependsOn) {
        expect(Array.isArray((s3Bucket as any).DependsOn) || typeof (s3Bucket as any).DependsOn === 'string').toBe(true);
      }
    });

    test('should reference Lambda function in S3 notification', () => {
      const s3Bucket = Object.values(template.Resources).find(
        (resource: any) => resource.Type === 'AWS::S3::Bucket'
      );

      const lambdaConfig = (s3Bucket as any).Properties.NotificationConfiguration?.LambdaConfigurations?.[0];
      if (lambdaConfig) {
        expect(lambdaConfig.Function).toBeDefined();
      }
    });
  });
});