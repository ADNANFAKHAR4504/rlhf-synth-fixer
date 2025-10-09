import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Media Processing Pipeline', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON for testing
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description for media processing pipeline', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Scalable Media Processing Pipeline with S3, MediaConvert, and Lambda'
      );
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
    });

    test('should have conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.CreateNotificationTopic).toBeDefined();
      expect(template.Conditions.HasMediaConvertEndpoint).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have ProcessingConcurrency parameter', () => {
      expect(template.Parameters.ProcessingConcurrency).toBeDefined();
      const param = template.Parameters.ProcessingConcurrency;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(10);
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(100);
    });

    test('should have MediaConvertEndpoint parameter', () => {
      expect(template.Parameters.MediaConvertEndpoint).toBeDefined();
      const param = template.Parameters.MediaConvertEndpoint;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
    });

    test('should have NotificationEmail parameter', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
      const param = template.Parameters.NotificationEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
    });
  });

  describe('KMS Resources', () => {
    test('should have MediaKMSKey resource', () => {
      expect(template.Resources.MediaKMSKey).toBeDefined();
      const kmsKey = template.Resources.MediaKMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.DeletionPolicy).toBe('Delete');
      expect(kmsKey.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have MediaKMSKeyAlias resource', () => {
      expect(template.Resources.MediaKMSKeyAlias).toBeDefined();
      const keyAlias = template.Resources.MediaKMSKeyAlias;
      expect(keyAlias.Type).toBe('AWS::KMS::Alias');
      expect(keyAlias.Properties.TargetKeyId.Ref).toBe('MediaKMSKey');
    });

    test('MediaKMSKey should have correct key policy', () => {
      const kmsKey = template.Resources.MediaKMSKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toHaveLength(3);
      
      // Check if services are allowed to use the key
      const services = ['s3.amazonaws.com', 'mediaconvert.amazonaws.com'];
      const serviceStatements = keyPolicy.Statement.filter((stmt: any) => 
        stmt.Principal && stmt.Principal.Service
      );
      expect(serviceStatements).toHaveLength(2);
    });
  });

  describe('S3 Resources', () => {
    test('should have UploadsBucket resource', () => {
      expect(template.Resources.UploadsBucket).toBeDefined();
      const bucket = template.Resources.UploadsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have OutputsBucket resource', () => {
      expect(template.Resources.OutputsBucket).toBeDefined();
      const bucket = template.Resources.OutputsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.UpdateReplacePolicy).toBe('Delete');
    });

    test('S3 buckets should have KMS encryption configured', () => {
      const uploadsBucket = template.Resources.UploadsBucket;
      const outputsBucket = template.Resources.OutputsBucket;
      
      [uploadsBucket, outputsBucket].forEach(bucket => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID.Ref).toBe('MediaKMSKey');
      });
    });

    test('S3 buckets should have public access blocked', () => {
      const uploadsBucket = template.Resources.UploadsBucket;
      const outputsBucket = template.Resources.OutputsBucket;
      
      [uploadsBucket, outputsBucket].forEach(bucket => {
        const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('UploadsBucket should have EventBridge configuration', () => {
      const uploadsBucket = template.Resources.UploadsBucket;
      expect(uploadsBucket.Properties.NotificationConfiguration).toBeDefined();
      expect(uploadsBucket.Properties.NotificationConfiguration.EventBridgeConfiguration.EventBridgeEnabled).toBe(true);
    });

    test('UploadsBucket should have versioning enabled', () => {
      const uploadsBucket = template.Resources.UploadsBucket;
      expect(uploadsBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have MediaAssetsTable resource', () => {
      expect(template.Resources.MediaAssetsTable).toBeDefined();
      const table = template.Resources.MediaAssetsTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('MediaAssetsTable should have correct key schema', () => {
      const table = template.Resources.MediaAssetsTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('assetId');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('MediaAssetsTable should have GSIs', () => {
      const table = template.Resources.MediaAssetsTable;
      const gsis = table.Properties.GlobalSecondaryIndexes;
      expect(gsis).toHaveLength(2);
      
      const statusIndex = gsis.find((gsi: any) => gsi.IndexName === 'StatusIndex');
      const uploaderIndex = gsis.find((gsi: any) => gsi.IndexName === 'UploaderIndex');
      
      expect(statusIndex).toBeDefined();
      expect(uploaderIndex).toBeDefined();
    });

    test('MediaAssetsTable should have DynamoDB Streams enabled', () => {
      const table = template.Resources.MediaAssetsTable;
      expect(table.Properties.StreamSpecification).toBeDefined();
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('MediaAssetsTable should have deletion protection disabled', () => {
      const table = template.Resources.MediaAssetsTable;
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
    });
  });

  describe('SQS Resources', () => {
    test('should have ProcessingQueue resource', () => {
      expect(template.Resources.ProcessingQueue).toBeDefined();
      const queue = template.Resources.ProcessingQueue;
      expect(queue.Type).toBe('AWS::SQS::Queue');
      expect(queue.DeletionPolicy).toBe('Delete');
      expect(queue.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have ProcessingDLQ resource', () => {
      expect(template.Resources.ProcessingDLQ).toBeDefined();
      const dlq = template.Resources.ProcessingDLQ;
      expect(dlq.Type).toBe('AWS::SQS::Queue');
      expect(dlq.DeletionPolicy).toBe('Delete');
      expect(dlq.UpdateReplacePolicy).toBe('Delete');
    });

    test('ProcessingQueue should have redrive policy configured', () => {
      const queue = template.Resources.ProcessingQueue;
      expect(queue.Properties.RedrivePolicy).toBeDefined();
      expect(queue.Properties.RedrivePolicy.maxReceiveCount).toBe(3);
      expect(queue.Properties.RedrivePolicy.deadLetterTargetArn['Fn::GetAtt'][0]).toBe('ProcessingDLQ');
    });

    test('SQS queues should have KMS encryption', () => {
      const queue = template.Resources.ProcessingQueue;
      const dlq = template.Resources.ProcessingDLQ;
      
      [queue, dlq].forEach(q => {
        expect(q.Properties.KmsMasterKeyId.Ref).toBe('MediaKMSKey');
      });
    });
  });

  describe('Lambda Resources', () => {
    test('should have IngestOrchestratorFunction resource', () => {
      expect(template.Resources.IngestOrchestratorFunction).toBeDefined();
      const lambda = template.Resources.IngestOrchestratorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
    });

    test('should have JobStatusProcessorFunction resource', () => {
      expect(template.Resources.JobStatusProcessorFunction).toBeDefined();
      const lambda = template.Resources.JobStatusProcessorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
    });

    test('IngestOrchestratorFunction should have correct environment variables', () => {
      const lambda = template.Resources.IngestOrchestratorFunction;
      const envVars = lambda.Properties.Environment.Variables;
      
      expect(envVars.DYNAMODB_TABLE.Ref).toBe('MediaAssetsTable');
      expect(envVars.MEDIACONVERT_ROLE['Fn::GetAtt'][0]).toBe('MediaConvertRole');
      expect(envVars.OUTPUT_BUCKET.Ref).toBe('OutputsBucket');
      expect(envVars.ENVIRONMENT_SUFFIX.Ref).toBe('EnvironmentSuffix');
    });

    test('should have IngestOrchestratorEventSourceMapping', () => {
      expect(template.Resources.IngestOrchestratorEventSourceMapping).toBeDefined();
      const mapping = template.Resources.IngestOrchestratorEventSourceMapping;
      expect(mapping.Type).toBe('AWS::Lambda::EventSourceMapping');
      expect(mapping.Properties.BatchSize).toBe(1);
    });

    test('should have JobStatusProcessorPermission', () => {
      expect(template.Resources.JobStatusProcessorPermission).toBeDefined();
      const permission = template.Resources.JobStatusProcessorPermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });
  });

  describe('IAM Resources', () => {
    test('should have MediaConvertRole resource', () => {
      expect(template.Resources.MediaConvertRole).toBeDefined();
      const role = template.Resources.MediaConvertRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const assumePolicyDoc = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicyDoc.Statement[0].Principal.Service).toBe('mediaconvert.amazonaws.com');
    });

    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const assumePolicyDoc = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicyDoc.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('MediaConvertRole should have correct permissions', () => {
      const role = template.Resources.MediaConvertRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      
      const actions = policy.Statement.flatMap((stmt: any) => stmt.Action);
      expect(actions).toContain('s3:GetObject');
      expect(actions).toContain('s3:GetObjectVersion');
      expect(actions).toContain('s3:PutObject');
      expect(actions).toContain('kms:Decrypt');
      expect(actions).toContain('kms:GenerateDataKey');
    });

    test('LambdaExecutionRole should have comprehensive permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      
      const actions = policy.Statement.flatMap((stmt: any) => stmt.Action);
      expect(actions).toContain('dynamodb:PutItem');
      expect(actions).toContain('dynamodb:UpdateItem');
      expect(actions).toContain('mediaconvert:CreateJob');
      expect(actions).toContain('sqs:ReceiveMessage');
      expect(actions).toContain('ssm:GetParameter');
      expect(actions).toContain('cloudwatch:PutMetricData');
    });
  });

  describe('EventBridge Resources', () => {
    test('should have S3UploadEventRule resource', () => {
      expect(template.Resources.S3UploadEventRule).toBeDefined();
      const rule = template.Resources.S3UploadEventRule;
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('should have MediaConvertJobEventRule resource', () => {
      expect(template.Resources.MediaConvertJobEventRule).toBeDefined();
      const rule = template.Resources.MediaConvertJobEventRule;
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('S3UploadEventRule should have correct event pattern', () => {
      const rule = template.Resources.S3UploadEventRule;
      const eventPattern = rule.Properties.EventPattern;
      
      expect(eventPattern.source).toContain('aws.s3');
      expect(eventPattern['detail-type']).toContain('Object Created');
      expect(eventPattern.detail.object.key[0].prefix).toBe('uploads/');
    });

    test('MediaConvertJobEventRule should have correct event pattern', () => {
      const rule = template.Resources.MediaConvertJobEventRule;
      const eventPattern = rule.Properties.EventPattern;
      
      expect(eventPattern.source).toContain('aws.mediaconvert');
      expect(eventPattern['detail-type']).toContain('MediaConvert Job State Change');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have MediaProcessingDashboard resource', () => {
      expect(template.Resources.MediaProcessingDashboard).toBeDefined();
      const dashboard = template.Resources.MediaProcessingDashboard;
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('should have HighQueueDepthAlarm resource', () => {
      expect(template.Resources.HighQueueDepthAlarm).toBeDefined();
      const alarm = template.Resources.HighQueueDepthAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.Threshold).toBe(100);
    });

    test('should have HighFailureRateAlarm resource', () => {
      expect(template.Resources.HighFailureRateAlarm).toBeDefined();
      const alarm = template.Resources.HighFailureRateAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.Threshold).toBe(50);
    });
  });

  describe('SSM Resources', () => {
    test('should have MediaConvertPresetsParameter resource', () => {
      expect(template.Resources.MediaConvertPresetsParameter).toBeDefined();
      const param = template.Resources.MediaConvertPresetsParameter;
      expect(param.Type).toBe('AWS::SSM::Parameter');
    });

    test('MediaConvertPresetsParameter should have valid JSON value', () => {
      const param = template.Resources.MediaConvertPresetsParameter;
      const value = param.Properties.Value['Fn::Sub'];
      
      // Should be valid JSON structure (basic check)
      expect(value).toContain('presets');
      expect(value).toContain('hls');
      expect(value).toContain('dash');
      expect(value).toContain('mp4');
    });
  });

  describe('Resource Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'UploadsBucketName',
        'OutputsBucketName',
        'ProcessingQueueUrl',
        'MediaAssetsTableName',
        'IngestOrchestratorFunctionArn',
        'JobStatusProcessorFunctionArn',
        'MediaConvertRoleArn',
        'KMSKeyId',
        'KMSKeyArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have correct export names', () => {
      const expectedExportNames = {
        'UploadsBucketName': '${AWS::StackName}-UploadsBucket',
        'OutputsBucketName': '${AWS::StackName}-OutputsBucket',
        'ProcessingQueueUrl': '${AWS::StackName}-ProcessingQueueUrl',
        'MediaAssetsTableName': '${AWS::StackName}-MediaAssetsTable',
        'IngestOrchestratorFunctionArn': '${AWS::StackName}-IngestOrchestrator',
        'JobStatusProcessorFunctionArn': '${AWS::StackName}-JobStatusProcessor',
        'MediaConvertRoleArn': '${AWS::StackName}-MediaConvertRole',
        'KMSKeyId': '${AWS::StackName}-KMSKey',
        'KMSKeyArn': '${AWS::StackName}-KMSKeyArn'
      };
      
      Object.keys(expectedExportNames).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name['Fn::Sub']).toBe(expectedExportNames[outputKey as keyof typeof expectedExportNames]);
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with environment suffix', () => {
      const resourcesWithEnvSuffix = [
        'MediaAssetsTable',
        'ProcessingQueue',
        'ProcessingDLQ',
        'IngestOrchestratorFunction',
        'JobStatusProcessorFunction'
      ];

      resourcesWithEnvSuffix.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty = resource.Properties.TableName || 
                            resource.Properties.QueueName || 
                            resource.Properties.FunctionName;
        
        if (nameProperty && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('S3 buckets should include account ID in naming', () => {
      const uploadsBucket = template.Resources.UploadsBucket;
      const outputsBucket = template.Resources.OutputsBucket;
      
      [uploadsBucket, outputsBucket].forEach(bucket => {
        const bucketName = bucket.Properties.BucketName['Fn::Sub'];
        expect(bucketName).toContain('${AWS::AccountId}');
        expect(bucketName).toContain('${EnvironmentSuffix}');
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

    test('should have expected number of resources for media processing pipeline', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(15); // Should have many more resources than the simple table
    });

    test('should have multiple parameters for configuration', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have comprehensive outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9);
    });

    test('all deletion policies should be set to Delete for testing', () => {
      const resourcesWithDeletionPolicies = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        return resource.DeletionPolicy !== undefined;
      });

      resourcesWithDeletionPolicies.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
        expect(resource.UpdateReplacePolicy).toBe('Delete');
      });
    });
  });

  describe('Security Best Practices', () => {
    test('all S3 buckets should block public access', () => {
      const s3Resources = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::S3::Bucket'
      );

      s3Resources.forEach(resourceName => {
        const bucket = template.Resources[resourceName];
        const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
        
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('all supported resources should use KMS encryption', () => {
      // Check S3 buckets
      ['UploadsBucket', 'OutputsBucket'].forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      });

      // Check SQS queues  
      ['ProcessingQueue', 'ProcessingDLQ'].forEach(queueName => {
        const queue = template.Resources[queueName];
        expect(queue.Properties.KmsMasterKeyId.Ref).toBe('MediaKMSKey');
      });

      // Check DynamoDB
      const table = template.Resources.MediaAssetsTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('IAM roles should follow least privilege principle', () => {
      const mediaConvertRole = template.Resources.MediaConvertRole;
      const lambdaRole = template.Resources.LambdaExecutionRole;

      // MediaConvert role should only access specific S3 buckets
      const mcPolicy = mediaConvertRole.Properties.Policies[0].PolicyDocument;
      const s3Statements = mcPolicy.Statement.filter((stmt: any) => 
        stmt.Action.some((action: string) => action.startsWith('s3:'))
      );
      
      s3Statements.forEach((stmt: any) => {
        expect(stmt.Resource).toBeDefined();
        expect(Array.isArray(stmt.Resource)).toBe(true);
      });

      // Lambda role should have basic execution role attached
      expect(lambdaRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });
  });
});