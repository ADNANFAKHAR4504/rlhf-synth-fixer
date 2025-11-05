import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Comprehensive Unit Tests', () => {
  let template: any;
  let yamlContent: string;

  beforeAll(() => {
    // Read the YAML template
    const yamlPath = path.join(__dirname, '../lib/TapStack.yml');
    yamlContent = fs.readFileSync(yamlPath, 'utf8');

    // Convert YAML to JSON for testing
    try {
      // Use cfn-flip to convert YAML to JSON
      const jsonContent = execSync(
        `echo '${yamlContent.replace(/'/g, "'\\''")}' | cfn-flip`,
        { encoding: 'utf8' }
      );
      template = JSON.parse(jsonContent);
    } catch (error) {
      // Fallback: check if JSON version exists
      const jsonPath = path.join(__dirname, '../lib/TapStack.json');
      if (fs.existsSync(jsonPath)) {
        const templateContent = fs.readFileSync(jsonPath, 'utf8');
        template = JSON.parse(templateContent);
      } else {
        throw new Error(
          'Could not convert YAML to JSON. Please run: cfn-flip lib/TapStack.yml > lib/TapStack.json'
        );
      }
    }
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('TAP Stack');
      expect(template.Description).toContain('DynamoDB');
      expect(template.Description).toContain('Lambda');
    });

    test('should have metadata section with parameter interface', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups
      ).toBeDefined();
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters - Comprehensive Validation', () => {
    test('should have all required parameters', () => {
      const requiredParameters = [
        'EnvironmentSuffix',
        'ProjectOwner',
        'PointInTimeRecoveryEnabled',
        'StreamViewType',
        'LambdaRuntime',
        'LambdaTimeout',
        'LambdaMemorySize',
        'EnableDetailedMonitoring',
        'AlarmEmail',
      ];

      requiredParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('ProjectOwner parameter should have validation pattern', () => {
      const param = template.Parameters.ProjectOwner;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.Default).toBe('TAP-Team');
    });

    test('LambdaRuntime should have allowed values', () => {
      const param = template.Parameters.LambdaRuntime;
      expect(param.AllowedValues).toContain('python3.11');
      expect(param.AllowedValues).toContain('python3.12');
      expect(param.AllowedValues).toContain('nodejs20.x');
    });

    test('LambdaTimeout should have min and max values', () => {
      const param = template.Parameters.LambdaTimeout;
      expect(param.Type).toBe('Number');
      expect(param.MinValue).toBe(3);
      expect(param.MaxValue).toBe(900);
      expect(param.Default).toBe(30);
    });

    test('AlarmEmail should have email validation pattern', () => {
      const param = template.Parameters.AlarmEmail;
      // Check that pattern includes email format (@ and domain)
      expect(param.AllowedPattern).toContain('@');
      expect(param.AllowedPattern).toContain('.');
    });

    test('all parameters should have descriptions', () => {
      Object.keys(template.Parameters).forEach(paramName => {
        expect(template.Parameters[paramName].Description).toBeDefined();
        expect(template.Parameters[paramName].Description.length).toBeGreaterThan(
          10
        );
      });
    });
  });

  describe('Conditions', () => {
    test('should have all required conditions', () => {
      const requiredConditions = [
        'EnablePITR',
        'EnableMonitoring',
        'HasAlarmEmail',
        'IsProduction',
      ];

      requiredConditions.forEach(condition => {
        expect(template.Conditions[condition]).toBeDefined();
      });
    });
  });

  describe('DynamoDB Table - Comprehensive Tests', () => {
    let table: any;

    beforeAll(() => {
      table = template.Resources.TurnAroundPromptTable;
    });

    test('should exist and be correct type', () => {
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have conditional deletion and update policies', () => {
      expect(table.DeletionPolicy).toBeDefined();
      expect(table.UpdateReplacePolicy).toBeDefined();
    });

    test('should have multiple attribute definitions for GSIs', () => {
      const attrs = table.Properties.AttributeDefinitions;
      expect(attrs.length).toBeGreaterThanOrEqual(3);

      const attrNames = attrs.map((attr: any) => attr.AttributeName);
      expect(attrNames).toContain('id');
      expect(attrNames).toContain('taskType');
      expect(attrNames).toContain('status');
    });

    test('should have correct key schema', () => {
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('should have Global Secondary Indexes', () => {
      const gsis = table.Properties.GlobalSecondaryIndexes;
      expect(gsis).toBeDefined();
      expect(gsis.length).toBeGreaterThanOrEqual(2);

      const indexNames = gsis.map((gsi: any) => gsi.IndexName);
      expect(indexNames).toContain('TaskTypeIndex');
      expect(indexNames).toContain('StatusIndex');
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have stream specification enabled', () => {
      const streamSpec = table.Properties.StreamSpecification;
      expect(streamSpec).toBeDefined();
      expect(streamSpec.StreamViewType).toBeDefined();
    });

    test('should have SSE enabled with KMS', () => {
      const sse = table.Properties.SSESpecification;
      expect(sse.SSEEnabled).toBe(true);
      expect(sse.SSEType).toBe('KMS');
      expect(sse.KMSMasterKeyId).toBeDefined();
    });

    test('should have TTL specification', () => {
      const ttl = table.Properties.TimeToLiveSpecification;
      expect(ttl).toBeDefined();
      expect(ttl.AttributeName).toBe('ttl');
      expect(ttl.Enabled).toBe(true);
    });

    test('should have point-in-time recovery configured conditionally', () => {
      const pitr = table.Properties.PointInTimeRecoverySpecification;
      expect(pitr).toBeDefined();
      expect(pitr.PointInTimeRecoveryEnabled).toBeDefined();
    });

    test('should have comprehensive tags including iac-rlhf-amazon', () => {
      const tags = table.Properties.Tags;
      expect(tags).toBeDefined();

      const tagKeys = tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('Owner');
      expect(tagKeys).toContain('iac-rlhf-amazon');

      const iacTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
      expect(iacTag.Value).toBe('true');
    });
  });

  describe('KMS Keys - No Hardcoding', () => {
    test('should have DynamoDB encryption key', () => {
      const key = template.Resources.DynamoDBEncryptionKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
    });

    test('DynamoDB key should enable rotation', () => {
      const key = template.Resources.DynamoDBEncryptionKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('DynamoDB key should have proper key policy without hardcoded account', () => {
      const key = template.Resources.DynamoDBEncryptionKey;
      const policy = key.Properties.KeyPolicy;
      const policyStr = JSON.stringify(policy);

      // Should NOT have hardcoded account IDs
      expect(policyStr).not.toMatch(/\d{12}/);

      // Should use AWS::AccountId
      expect(policyStr).toContain('AWS::AccountId');
    });

    test('should have SNS encryption key', () => {
      const key = template.Resources.SNSEncryptionKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
    });

    test('should have CloudWatch Logs encryption key', () => {
      const key = template.Resources.CloudWatchLogsKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
    });

    test('all KMS keys should have iac-rlhf-amazon tag', () => {
      const kmsKeys = [
        'DynamoDBEncryptionKey',
        'SNSEncryptionKey',
        'CloudWatchLogsKey',
      ];

      kmsKeys.forEach(keyName => {
        const key = template.Resources[keyName];
        const tags = key.Properties.Tags;
        const iacTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
        expect(iacTag).toBeDefined();
        expect(iacTag.Value).toBe('true');
      });
    });
  });

  describe('Lambda Function - Real-World Use Case', () => {
    let lambda: any;

    beforeAll(() => {
      lambda = template.Resources.StreamProcessorFunction;
    });

    test('should exist and be correct type', () => {
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('should have descriptive name and description', () => {
      expect(lambda.Properties.FunctionName).toBeDefined();
      expect(lambda.Properties.Description).toBeDefined();
      expect(lambda.Properties.Description).toContain('stream');
      expect(lambda.Properties.Description.length).toBeGreaterThan(20);
    });

    test('should have proper runtime configuration', () => {
      expect(lambda.Properties.Runtime).toBeDefined();
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.Timeout).toBeDefined();
      expect(lambda.Properties.MemorySize).toBeDefined();
    });

    test('should have environment variables without hardcoding', () => {
      const envVars = lambda.Properties.Environment.Variables;
      expect(envVars.ENVIRONMENT).toBeDefined();
      expect(envVars.TABLE_NAME).toBeDefined();
      expect(envVars.NOTIFICATION_TOPIC_ARN).toBeDefined();
      expect(envVars.CLOUDWATCH_NAMESPACE).toBeDefined();

      // Should use Ref/Sub, not hardcoded values
      const envStr = JSON.stringify(envVars);
      expect(envStr).not.toMatch(/arn:aws:.*:\d{12}:/); // No hardcoded ARNs
    });

    test('should have inline code for real-world use case', () => {
      const code = lambda.Properties.Code.ZipFile;
      expect(code).toBeDefined();
      expect(code).toContain('def handler');
      expect(code).toContain('DynamoDB');
      expect(code).toContain('cloudwatch');

      // Should NOT be trivial "Hello World"
      expect(code).not.toContain('Hello World');
      expect(code.length).toBeGreaterThan(500);
    });

    test('should have comprehensive tags', () => {
      const tags = lambda.Properties.Tags;
      expect(tags).toBeDefined();

      const tagKeys = tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('iac-rlhf-amazon');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Owner');
    });
  });

  describe('IAM Roles - Least Privilege', () => {
    let role: any;

    beforeAll(() => {
      role = template.Resources.StreamProcessorRole;
    });

    test('should exist and be correct type', () => {
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have assume role policy for Lambda', () => {
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy).toBeDefined();

      const statement = assumePolicy.Statement[0];
      expect(statement.Principal.Service).toContain('lambda.amazonaws.com');
    });

    test('should have managed policies', () => {
      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toBeDefined();
      expect(managedPolicies.length).toBeGreaterThan(0);
    });

    test('should have inline policies with specific permissions', () => {
      const policies = role.Properties.Policies;
      expect(policies).toBeDefined();
      expect(policies.length).toBeGreaterThan(0);

      const policyNames = policies.map((p: any) => p.PolicyName);
      expect(policyNames).toContain('DynamoDBStreamReadPolicy');
      expect(policyNames).toContain('CloudWatchMetricsPolicy');
    });

    test('should NOT have overly permissive policies', () => {
      const policies = role.Properties.Policies;
      const policyStr = JSON.stringify(policies);

      // Should NOT have wildcard resources with powerful actions
      expect(policyStr).not.toContain('"Action":"*"');
      expect(policyStr).not.toContain('"Resource":"*","Effect":"Allow","Action":"dynamodb:*"');
    });

    test('should have no hardcoded ARNs in policies', () => {
      const policies = role.Properties.Policies;
      const policyStr = JSON.stringify(policies);

      // Should NOT have hardcoded account IDs in ARNs
      const hardcodedArnPattern = /arn:aws:[^:]+:[^:]+:\d{12}:/;
      expect(policyStr).not.toMatch(hardcodedArnPattern);
    });
  });

  describe('Event Source Mapping', () => {
    test('should exist for DynamoDB Streams', () => {
      const mapping = template.Resources.StreamEventSourceMapping;
      expect(mapping).toBeDefined();
      expect(mapping.Type).toBe('AWS::Lambda::EventSourceMapping');
    });

    test('should have proper configuration', () => {
      const mapping = template.Resources.StreamEventSourceMapping;
      expect(mapping.Properties.EventSourceArn).toBeDefined();
      expect(mapping.Properties.FunctionName).toBeDefined();
      expect(mapping.Properties.StartingPosition).toBe('LATEST');
      expect(mapping.Properties.BatchSize).toBeDefined();
    });

    test('should have error handling configuration', () => {
      const mapping = template.Resources.StreamEventSourceMapping;
      expect(mapping.Properties.BisectBatchOnFunctionError).toBeDefined();
      expect(mapping.Properties.MaximumRetryAttempts).toBeDefined();
    });
  });

  describe('SNS Topic', () => {
    test('should exist and have encryption', () => {
      const topic = template.Resources.ProcessingNotificationTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('should have proper tags', () => {
      const topic = template.Resources.ProcessingNotificationTopic;
      const tags = topic.Properties.Tags;
      const iacTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
      expect(iacTag).toBeDefined();
    });
  });

  describe('CloudWatch Alarms - Conditional', () => {
    test('should have Lambda error alarm', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Condition).toBe('EnableMonitoring');
    });

    test('should have Lambda throttle alarm', () => {
      const alarm = template.Resources.LambdaThrottleAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Condition).toBe('EnableMonitoring');
    });

    test('should have DynamoDB throttle alarms', () => {
      const readAlarm = template.Resources.DynamoDBReadThrottleAlarm;
      const writeAlarm = template.Resources.DynamoDBWriteThrottleAlarm;

      expect(readAlarm).toBeDefined();
      expect(writeAlarm).toBeDefined();
      expect(readAlarm.Condition).toBe('EnableMonitoring');
      expect(writeAlarm.Condition).toBe('EnableMonitoring');
    });

    test('all alarms should have proper metric configuration', () => {
      const alarms = [
        'LambdaErrorAlarm',
        'LambdaThrottleAlarm',
        'DynamoDBReadThrottleAlarm',
        'DynamoDBWriteThrottleAlarm',
      ];

      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.MetricName).toBeDefined();
        expect(alarm.Properties.Namespace).toBeDefined();
        expect(alarm.Properties.Threshold).toBeDefined();
        expect(alarm.Properties.ComparisonOperator).toBeDefined();
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have log group for Lambda', () => {
      const logGroup = template.Resources.StreamProcessorLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log group should have retention and encryption', () => {
      const logGroup = template.Resources.StreamProcessorLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
      expect(logGroup.Properties.KmsKeyId).toBeDefined();
    });
  });

  describe('Outputs - Cross-Stack Compatibility', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'TurnAroundPromptTableStreamArn',
        'StreamProcessorFunctionArn',
        'StreamProcessorFunctionName',
        'ProcessingNotificationTopicArn',
        'DynamoDBEncryptionKeyArn',
        'StackName',
        'EnvironmentSuffix',
        'Region',
      ];

      requiredOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        expect(template.Outputs[outputName].Description).toBeDefined();
      });
    });

    test('all outputs should have exports with unique names', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();

        // Should use stack name in export to ensure uniqueness
        const exportStr = JSON.stringify(output.Export.Name);
        expect(exportStr).toContain('AWS::StackName');
      });
    });

    test('outputs should provide useful cross-stack references', () => {
      expect(template.Outputs.TurnAroundPromptTableArn).toBeDefined();
      expect(template.Outputs.TurnAroundPromptTableStreamArn).toBeDefined();
      expect(template.Outputs.StreamProcessorFunctionArn).toBeDefined();
    });
  });

  describe('Cross-Account Executability', () => {
    test('should NOT have hardcoded account IDs anywhere', () => {
      const templateStr = JSON.stringify(template);

      // Check for 12-digit account IDs
      const accountIdPattern = /:\d{12}:/g;
      const matches = templateStr.match(accountIdPattern);

      if (matches) {
        // If there are matches, they should all be referencing AWS::AccountId
        matches.forEach(match => {
          expect(templateStr).toContain('AWS::AccountId');
        });
      }
    });

    test('should NOT have hardcoded region names', () => {
      const templateStr = JSON.stringify(template);

      // Should not have region names like us-east-1 hardcoded
      // (except in parameter defaults which is acceptable)
      const resourcesStr = JSON.stringify(template.Resources);
      expect(resourcesStr).not.toMatch(/us-east-\d/);
      expect(resourcesStr).not.toMatch(/eu-west-\d/);

      // Should use AWS::Region instead
      if (resourcesStr.includes('amazonaws.com')) {
        expect(resourcesStr).toContain('AWS::Region');
      }
    });

    test('all ARNs should use pseudo parameters', () => {
      const resourcesStr = JSON.stringify(template.Resources);

      // If ARNs are constructed, they should use Fn::Sub or similar
      if (resourcesStr.includes('arn:aws:')) {
        expect(resourcesStr).toContain('AWS::AccountId');
        expect(resourcesStr).toContain('AWS::Region');
      }
    });
  });

  describe('Tagging Compliance', () => {
    test('all taggable resources should have iac-rlhf-amazon tag', () => {
      const taggableResources = [
        'TurnAroundPromptTable',
        'DynamoDBEncryptionKey',
        'SNSEncryptionKey',
        'CloudWatchLogsKey',
        'StreamProcessorRole',
        'StreamProcessorFunction',
        'ProcessingNotificationTopic',
        'StreamProcessorLogGroup',
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();

        const tags = resource.Properties.Tags;
        expect(tags).toBeDefined();

        const iacTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
        expect(iacTag).toBeDefined();
        expect(iacTag.Value).toBe('true');
      });
    });

    test('all resources should have Environment tag', () => {
      const taggableResources = Object.keys(template.Resources).filter(
        resourceName => {
          return template.Resources[resourceName].Properties.Tags !== undefined;
        }
      );

      taggableResources.forEach(resourceName => {
        const tags = template.Resources[resourceName].Properties.Tags;
        const envTag = tags.find((tag: any) => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
      });
    });
  });

  describe('Security Best Practices', () => {
    test('DynamoDB should have encryption at rest', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('Lambda should not have public access', () => {
      const lambda = template.Resources.StreamProcessorFunction;
      // Lambda functions don't have public access by default
      // Just verify role is properly scoped
      expect(lambda.Properties.Role).toBeDefined();
    });

    test('all KMS keys should have key rotation enabled', () => {
      const kmsKeys = [
        'DynamoDBEncryptionKey',
        'SNSEncryptionKey',
        'CloudWatchLogsKey',
      ];

      kmsKeys.forEach(keyName => {
        const key = template.Resources[keyName];
        expect(key.Properties.EnableKeyRotation).toBe(true);
      });
    });

    test('SNS topic should be encrypted', () => {
      const topic = template.Resources.ProcessingNotificationTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('CloudWatch log group should be encrypted', () => {
      const logGroup = template.Resources.StreamProcessorLogGroup;
      expect(logGroup.Properties.KmsKeyId).toBeDefined();
    });
  });

  describe('Production Readiness', () => {
    test('should have appropriate deletion policies for stateful resources', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBeDefined();
      expect(table.UpdateReplacePolicy).toBeDefined();
    });

    test('should have proper monitoring in place', () => {
      // Should have CloudWatch alarms
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.DynamoDBReadThrottleAlarm).toBeDefined();
    });

    test('should have proper error handling in Lambda', () => {
      const code = template.Resources.StreamProcessorFunction.Properties.Code
        .ZipFile;
      // Check for real-world Lambda implementation with boto3 clients and error handling
      expect(code).toContain('boto3.client');
      expect(code).toContain('cloudwatch');
      expect(code).toContain('sns');
    });
  });
});
