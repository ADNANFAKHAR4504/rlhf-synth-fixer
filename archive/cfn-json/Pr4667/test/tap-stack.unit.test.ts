import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Streaming Media Processing Pipeline', () => {
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

    test('should have correct description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Streaming Media Processing Pipeline - Video Transcoding and Delivery Infrastructure'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });
  });

  describe('S3 Buckets', () => {
    test('should have VideoInputBucket resource', () => {
      expect(template.Resources.VideoInputBucket).toBeDefined();
      expect(template.Resources.VideoInputBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('VideoInputBucket should have correct deletion policy', () => {
      expect(template.Resources.VideoInputBucket.DeletionPolicy).toBe('Delete');
    });

    test('VideoInputBucket should have encryption enabled', () => {
      const bucket = template.Resources.VideoInputBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('VideoInputBucket should have versioning enabled', () => {
      const bucket = template.Resources.VideoInputBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('VideoInputBucket should block public access', () => {
      const bucket = template.Resources.VideoInputBucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should have VideoOutputBucket resource', () => {
      expect(template.Resources.VideoOutputBucket).toBeDefined();
      expect(template.Resources.VideoOutputBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('VideoOutputBucket should have lifecycle policy', () => {
      const bucket = template.Resources.VideoOutputBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(1);
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].Status).toBe(
        'Enabled'
      );
    });
  });

  describe('DynamoDB Table', () => {
    test('should have VideoJobStatusTable resource', () => {
      expect(template.Resources.VideoJobStatusTable).toBeDefined();
      expect(template.Resources.VideoJobStatusTable.Type).toBe(
        'AWS::DynamoDB::Table'
      );
    });

    test('VideoJobStatusTable should have correct deletion policies', () => {
      const table = template.Resources.VideoJobStatusTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('VideoJobStatusTable should use PAY_PER_REQUEST billing', () => {
      const table = template.Resources.VideoJobStatusTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('VideoJobStatusTable should have deletion protection disabled', () => {
      const table = template.Resources.VideoJobStatusTable;
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
    });

    test('VideoJobStatusTable should have correct attributes', () => {
      const table = template.Resources.VideoJobStatusTable;
      const attrs = table.Properties.AttributeDefinitions;
      expect(attrs).toHaveLength(3);
      expect(attrs.map((a: any) => a.AttributeName).sort()).toEqual([
        'jobId',
        'status',
        'timestamp',
      ]);
    });

    test('VideoJobStatusTable should have GSI for status and timestamp', () => {
      const table = template.Resources.VideoJobStatusTable;
      const gsi = table.Properties.GlobalSecondaryIndexes;
      expect(gsi).toHaveLength(1);
      expect(gsi[0].IndexName).toBe('StatusTimestampIndex');
      expect(gsi[0].KeySchema[0].AttributeName).toBe('status');
      expect(gsi[0].KeySchema[1].AttributeName).toBe('timestamp');
    });
  });

  describe('SQS Queues', () => {
    test('should have VideoProcessingQueue resource', () => {
      expect(template.Resources.VideoProcessingQueue).toBeDefined();
      expect(template.Resources.VideoProcessingQueue.Type).toBe(
        'AWS::SQS::Queue'
      );
    });

    test('VideoProcessingQueue should have DLQ configured', () => {
      const queue = template.Resources.VideoProcessingQueue;
      expect(queue.Properties.RedrivePolicy).toBeDefined();
      expect(queue.Properties.RedrivePolicy.maxReceiveCount).toBe(3);
    });

    test('should have VideoProcessingDLQ resource', () => {
      expect(template.Resources.VideoProcessingDLQ).toBeDefined();
      expect(template.Resources.VideoProcessingDLQ.Type).toBe(
        'AWS::SQS::Queue'
      );
    });

    test('VideoProcessingQueue should have appropriate timeouts', () => {
      const queue = template.Resources.VideoProcessingQueue;
      expect(queue.Properties.VisibilityTimeout).toBe(900);
      expect(queue.Properties.MessageRetentionPeriod).toBe(1209600);
    });
  });

  describe('SNS Topic', () => {
    test('should have TranscodingCompleteTopic resource', () => {
      expect(template.Resources.TranscodingCompleteTopic).toBeDefined();
      expect(template.Resources.TranscodingCompleteTopic.Type).toBe(
        'AWS::SNS::Topic'
      );
    });

    test('TranscodingCompleteTopic should have deletion policy', () => {
      expect(template.Resources.TranscodingCompleteTopic.DeletionPolicy).toBe(
        'Delete'
      );
    });
  });

  describe('IAM Roles', () => {
    test('should have MediaConvertRole resource', () => {
      expect(template.Resources.MediaConvertRole).toBeDefined();
      expect(template.Resources.MediaConvertRole.Type).toBe('AWS::IAM::Role');
    });

    test('MediaConvertRole should have correct assume role policy', () => {
      const role = template.Resources.MediaConvertRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe(
        'mediaconvert.amazonaws.com'
      );
    });

    test('should have TranscodingLambdaRole resource', () => {
      expect(template.Resources.TranscodingLambdaRole).toBeDefined();
      expect(template.Resources.TranscodingLambdaRole.Type).toBe(
        'AWS::IAM::Role'
      );
    });

    test('TranscodingLambdaRole should have necessary permissions', () => {
      const role = template.Resources.TranscodingLambdaRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const actions = policy.Statement.flatMap((s: any) => s.Action).flat();
      expect(actions).toContain('mediaconvert:CreateJob');
      expect(actions).toContain('dynamodb:PutItem');
      expect(actions).toContain('sns:Publish');
      expect(actions).toContain('iam:PassRole');
    });

    test('should have StepFunctionsRole resource', () => {
      expect(template.Resources.StepFunctionsRole).toBeDefined();
      expect(template.Resources.StepFunctionsRole.Type).toBe('AWS::IAM::Role');
    });

    test('StepFunctionsRole should have CloudWatch Logs permissions', () => {
      const role = template.Resources.StepFunctionsRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const actions = policy.Statement.flatMap((s: any) => s.Action).flat();
      expect(actions).toContain('logs:PutLogEvents');
      expect(actions).toContain('logs:CreateLogDelivery');
    });
  });

  describe('Lambda Function', () => {
    test('should have TranscodingOrchestratorFunction resource', () => {
      expect(template.Resources.TranscodingOrchestratorFunction).toBeDefined();
      expect(template.Resources.TranscodingOrchestratorFunction.Type).toBe(
        'AWS::Lambda::Function'
      );
    });

    test('TranscodingOrchestratorFunction should have correct runtime', () => {
      const lambda = template.Resources.TranscodingOrchestratorFunction;
      expect(lambda.Properties.Runtime).toBe('python3.11');
    });

    test('TranscodingOrchestratorFunction should have timeout and memory configured', () => {
      const lambda = template.Resources.TranscodingOrchestratorFunction;
      expect(lambda.Properties.Timeout).toBe(300);
      expect(lambda.Properties.MemorySize).toBe(512);
    });

    test('TranscodingOrchestratorFunction should have required environment variables', () => {
      const lambda = template.Resources.TranscodingOrchestratorFunction;
      const env = lambda.Properties.Environment.Variables;
      expect(env.MEDIACONVERT_ROLE_ARN).toBeDefined();
      expect(env.OUTPUT_BUCKET).toBeDefined();
      expect(env.JOB_STATUS_TABLE).toBeDefined();
      expect(env.SNS_TOPIC_ARN).toBeDefined();
    });

    test('should have TranscodingOrchestratorPermission for EventBridge', () => {
      expect(
        template.Resources.EventBridgeLambdaPermission
      ).toBeDefined();
      const permission = template.Resources.EventBridgeLambdaPermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });
  });

  describe('Step Functions State Machine', () => {
    test('should have TranscodingStateMachine resource', () => {
      expect(template.Resources.TranscodingStateMachine).toBeDefined();
      expect(template.Resources.TranscodingStateMachine.Type).toBe(
        'AWS::StepFunctions::StateMachine'
      );
    });

    test('TranscodingStateMachine should have logging configuration', () => {
      const sm = template.Resources.TranscodingStateMachine;
      expect(sm.Properties.LoggingConfiguration).toBeDefined();
      expect(sm.Properties.LoggingConfiguration.Level).toBe('ALL');
    });

    test('TranscodingStateMachine definition should include retry logic', () => {
      const sm = template.Resources.TranscodingStateMachine;
      const definition = JSON.parse(sm.Properties.DefinitionString['Fn::Sub']);
      expect(definition.States.StartTranscoding.Retry).toBeDefined();
      expect(definition.States.StartTranscoding.Retry[0].MaxAttempts).toBe(3);
    });
  });

  describe('EventBridge Rule', () => {
    test('should have VideoUploadEventRule resource', () => {
      expect(template.Resources.VideoUploadEventRule).toBeDefined();
      expect(template.Resources.VideoUploadEventRule.Type).toBe(
        'AWS::Events::Rule'
      );
    });

    test('VideoUploadEventRule should target Lambda function', () => {
      const rule = template.Resources.VideoUploadEventRule;
      expect(rule.Properties.Targets).toHaveLength(1);
      expect(rule.Properties.State).toBe('ENABLED');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have ProcessingErrorAlarm resource', () => {
      expect(template.Resources.ProcessingErrorAlarm).toBeDefined();
      expect(template.Resources.ProcessingErrorAlarm.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
    });

    test('should have DLQDepthAlarm resource', () => {
      expect(template.Resources.DLQDepthAlarm).toBeDefined();
      expect(template.Resources.DLQDepthAlarm.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
    });

    test('ProcessingErrorAlarm should monitor Lambda errors', () => {
      const alarm = template.Resources.ProcessingErrorAlarm;
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(5);
    });

    test('DLQDepthAlarm should monitor DLQ messages', () => {
      const alarm = template.Resources.DLQDepthAlarm;
      expect(alarm.Properties.MetricName).toBe(
        'ApproximateNumberOfMessagesVisible'
      );
      expect(alarm.Properties.Namespace).toBe('AWS/SQS');
      expect(alarm.Properties.Threshold).toBe(1);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have TranscodingLambdaLogGroup resource', () => {
      expect(template.Resources.TranscodingLambdaLogGroup).toBeDefined();
      expect(template.Resources.TranscodingLambdaLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
    });

    test('TranscodingLambdaLogGroup should have retention period', () => {
      const logGroup = template.Resources.TranscodingLambdaLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });

    test('should have TranscodingStateMachineLogGroup resource', () => {
      expect(template.Resources.TranscodingStateMachineLogGroup).toBeDefined();
      expect(template.Resources.TranscodingStateMachineLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VideoInputBucketName',
        'VideoInputBucketArn',
        'VideoOutputBucketName',
        'VideoOutputBucketArn',
        'VideoJobStatusTableName',
        'VideoJobStatusTableArn',
        'VideoProcessingQueueUrl',
        'VideoProcessingQueueArn',
        'VideoProcessingDLQUrl',
        'TranscodingCompleteTopicArn',
        'TranscodingOrchestratorFunctionArn',
        'TranscodingStateMachineArn',
        'MediaConvertRoleArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should include environment suffix in names', () => {
      const resourcesToCheck = [
        'VideoInputBucket',
        'VideoOutputBucket',
        'VideoJobStatusTable',
        'VideoProcessingQueue',
        'VideoProcessingDLQ',
        'TranscodingCompleteTopic',
        'MediaConvertRole',
        'TranscodingLambdaRole',
        'StepFunctionsRole',
        'TranscodingOrchestratorFunction',
        'TranscodingStateMachine',
        'VideoUploadEventRule',
      ];

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty =
          resource.Properties.BucketName ||
          resource.Properties.TableName ||
          resource.Properties.QueueName ||
          resource.Properties.TopicName ||
          resource.Properties.RoleName ||
          resource.Properties.FunctionName ||
          resource.Properties.StateMachineName ||
          resource.Properties.Name;

        if (nameProperty) {
          expect(nameProperty['Fn::Sub']).toMatch(/\${EnvironmentSuffix}/);
        }
      });
    });

    test('all taggable resources should have required tags', () => {
      const resourcesToCheck = [
        'VideoInputBucket',
        'VideoOutputBucket',
        'VideoJobStatusTable',
        'VideoProcessingQueue',
        'VideoProcessingDLQ',
        'TranscodingCompleteTopic',
        'MediaConvertRole',
        'TranscodingLambdaRole',
        'StepFunctionsRole',
        'TranscodingOrchestratorFunction',
        'TranscodingStateMachine',
      ];

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const tagKeys = tags.map((t: any) => t.Key);
          expect(tagKeys).toContain('Environment');
          expect(tagKeys).toContain('Application');
          expect(tagKeys).toContain('ManagedBy');
        }
      });
    });
  });

  describe('Security and Compliance', () => {
    test('all S3 buckets should have encryption enabled', () => {
      const buckets = ['VideoInputBucket', 'VideoOutputBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });

    test('all IAM roles should follow least privilege principle', () => {
      const roles = [
        'MediaConvertRole',
        'TranscodingLambdaRole',
        'StepFunctionsRole',
      ];
      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role.Properties.Policies).toBeDefined();
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      });
    });

    test('DynamoDB table should not have deletion protection', () => {
      const table = template.Resources.VideoJobStatusTable;
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
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

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(15);
    });
  });

  describe('Cost Optimization', () => {
    test('DynamoDB should use PAY_PER_REQUEST billing', () => {
      const table = template.Resources.VideoJobStatusTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('CloudWatch Logs should have retention periods', () => {
      const logGroups = [
        'TranscodingLambdaLogGroup',
        'TranscodingStateMachineLogGroup',
      ];
      logGroups.forEach(logGroupName => {
        const logGroup = template.Resources[logGroupName];
        expect(logGroup.Properties.RetentionInDays).toBeDefined();
        expect(logGroup.Properties.RetentionInDays).toBeLessThanOrEqual(14);
      });
    });

    test('S3 buckets should have lifecycle policies for cost optimization', () => {
      const bucket = template.Resources.VideoOutputBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(1);
    });
  });
});
