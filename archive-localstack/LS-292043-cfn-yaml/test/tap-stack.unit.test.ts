import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr1107';

describe('TapStack CloudFormation Template', () => {
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
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Production-grade serverless web application with API Gateway, Lambda, S3, DynamoDB, and CloudWatch monitoring - using EnvironmentSuffix only'
      );
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'LambdaMemorySize',
        'LambdaTimeout',
        'ErrorRateThreshold',
        'DurationThreshold',
        'NotificationEmail',
        'EnvironmentSuffix',
      ];

      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('should not have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeUndefined();
    });

    test('LambdaMemorySize parameter should have correct constraints', () => {
      const param = template.Parameters.LambdaMemorySize;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(256);
      expect(param.MinValue).toBe(128);
      expect(param.MaxValue).toBe(3008);
    });

    test('LambdaTimeout parameter should have correct constraints', () => {
      const param = template.Parameters.LambdaTimeout;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(30);
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(900);
    });

    test('NotificationEmail parameter should have email validation', () => {
      const param = template.Parameters.NotificationEmail;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBe('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$');
    });

    test('EnvironmentSuffix parameter should exist', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('pr1107');
    });
  });

  describe('Resources', () => {
    describe('SNS Resources', () => {
      test('should have AlarmNotificationTopic', () => {
        const resource = template.Resources.AlarmNotificationTopic;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::SNS::Topic');
      });

      test('AlarmNotificationTopic should have correct properties', () => {
        const props = template.Resources.AlarmNotificationTopic.Properties;
        expect(props.TopicName).toEqual({
          'Fn::Sub': 'serverless-app-alarms-${EnvironmentSuffix}',
        });
        expect(props.KmsMasterKeyId).toBe('alias/aws/sns');
      });

      test('should have AlarmNotificationSubscription', () => {
        const resource = template.Resources.AlarmNotificationSubscription;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::SNS::Subscription');
        expect(resource.Properties.Protocol).toBe('email');
      });
    });

    describe('S3 Resources', () => {
      test('should have StaticContentBucket', () => {
        const resource = template.Resources.StaticContentBucket;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::S3::Bucket');
      });

      test('StaticContentBucket should have encryption enabled', () => {
        const props = template.Resources.StaticContentBucket.Properties;
        const encryption =
          props.BucketEncryption.ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
          'AES256'
        );
        expect(encryption.BucketKeyEnabled).toBe(true);
      });

      test('StaticContentBucket should have public access blocked', () => {
        const props = template.Resources.StaticContentBucket.Properties;
        const publicAccess = props.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });

      test('StaticContentBucket should have versioning enabled', () => {
        const props = template.Resources.StaticContentBucket.Properties;
        expect(props.VersioningConfiguration.Status).toBe('Enabled');
      });

      test('should have StaticContentBucketPolicy', () => {
        const resource = template.Resources.StaticContentBucketPolicy;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::S3::BucketPolicy');
      });
    });

    describe('DynamoDB Resources', () => {
      test('should have ApplicationTable', () => {
        const resource = template.Resources.ApplicationTable;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::DynamoDB::Table');
      });

      test('ApplicationTable should use on-demand billing', () => {
        const props = template.Resources.ApplicationTable.Properties;
        expect(props.BillingMode).toBe('PAY_PER_REQUEST');
      });

      test('ApplicationTable should have correct key schema', () => {
        const props = template.Resources.ApplicationTable.Properties;
        expect(props.KeySchema).toHaveLength(1);
        expect(props.KeySchema[0].AttributeName).toBe('id');
        expect(props.KeySchema[0].KeyType).toBe('HASH');
      });

      test('ApplicationTable should have global secondary index', () => {
        const props = template.Resources.ApplicationTable.Properties;
        expect(props.GlobalSecondaryIndexes).toHaveLength(1);
        expect(props.GlobalSecondaryIndexes[0].IndexName).toBe('GSI1');
      });

      test('ApplicationTable should have point-in-time recovery enabled', () => {
        const props = template.Resources.ApplicationTable.Properties;
        expect(
          props.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled
        ).toBe(true);
      });

      test('ApplicationTable should have encryption enabled', () => {
        const props = template.Resources.ApplicationTable.Properties;
        expect(props.SSESpecification.SSEEnabled).toBe(true);
        expect(props.SSESpecification.SSEType).toBe('KMS');
      });

      test('ApplicationTable should have stream enabled', () => {
        const props = template.Resources.ApplicationTable.Properties;
        expect(props.StreamSpecification.StreamViewType).toBe(
          'NEW_AND_OLD_IMAGES'
        );
      });
    });

    describe('CloudWatch Log Groups', () => {
      test('should have ApiGatewayLogGroup', () => {
        const resource = template.Resources.ApiGatewayLogGroup;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::Logs::LogGroup');
      });

      test('should have LambdaLogGroup', () => {
        const resource = template.Resources.LambdaLogGroup;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::Logs::LogGroup');
      });

      test('log groups should have retention configured', () => {
        const apiLogGroup = template.Resources.ApiGatewayLogGroup.Properties;
        const lambdaLogGroup = template.Resources.LambdaLogGroup.Properties;
        expect(apiLogGroup.RetentionInDays).toBe(30);
        expect(lambdaLogGroup.RetentionInDays).toBe(30);
      });
    });

    describe('IAM Resources', () => {
      test('should have LambdaExecutionRole', () => {
        const resource = template.Resources.LambdaExecutionRole;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::IAM::Role');
      });

      test('LambdaExecutionRole should follow least-privilege principle', () => {
        const policies =
          template.Resources.LambdaExecutionRole.Properties.Policies;

        // Check DynamoDB policy
        const dynamoPolicy = policies.find(
          (p: any) => p.PolicyName === 'DynamoDBAccess'
        );
        expect(dynamoPolicy).toBeDefined();
        const dynamoActions = dynamoPolicy.PolicyDocument.Statement[0].Action;
        expect(dynamoActions).not.toContain('dynamodb:*');

        // Check S3 policy
        const s3Policy = policies.find((p: any) => p.PolicyName === 'S3Access');
        expect(s3Policy).toBeDefined();
        const s3Actions = s3Policy.PolicyDocument.Statement[0].Action;
        expect(s3Actions).not.toContain('s3:*');
      });

      test('should have ApiGatewayCloudWatchRole', () => {
        const resource = template.Resources.ApiGatewayCloudWatchRole;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::IAM::Role');
      });
    });

    describe('Lambda Resources', () => {
      test('should have ServerlessAppFunction', () => {
        const resource = template.Resources.ServerlessAppFunction;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::Lambda::Function');
      });

      test('Lambda function should have correct runtime', () => {
        const props = template.Resources.ServerlessAppFunction.Properties;
        expect(props.Runtime).toBe('python3.11');
      });

      test('Lambda function should have tracing enabled', () => {
        const props = template.Resources.ServerlessAppFunction.Properties;
        expect(props.TracingConfig.Mode).toBe('Active');
      });

      test('Lambda function should have environment variables', () => {
        const props = template.Resources.ServerlessAppFunction.Properties;
        expect(props.Environment.Variables).toBeDefined();
        expect(props.Environment.Variables.DYNAMODB_TABLE).toEqual({
          Ref: 'ApplicationTable',
        });
        expect(props.Environment.Variables.S3_BUCKET).toEqual({
          Ref: 'StaticContentBucket',
        });
      });

      test('should have LambdaApiGatewayPermission', () => {
        const resource = template.Resources.LambdaApiGatewayPermission;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::Lambda::Permission');
      });
    });

    describe('API Gateway Resources', () => {
      test('should have ApiGateway', () => {
        const resource = template.Resources.ApiGateway;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::ApiGateway::RestApi');
      });

      test('should have all required API resources', () => {
        const expectedResources = [
          'HealthResource',
          'ItemsResource',
          'ItemResource',
        ];

        expectedResources.forEach(resourceName => {
          const resource = template.Resources[resourceName];
          expect(resource).toBeDefined();
          expect(resource.Type).toBe('AWS::ApiGateway::Resource');
        });
      });

      test('should have all required API methods', () => {
        const expectedMethods = [
          'HealthMethod',
          'ItemsPostMethod',
          'ItemGetMethod',
          'ApiGatewayRootMethod',
        ];

        expectedMethods.forEach(methodName => {
          const method = template.Resources[methodName];
          expect(method).toBeDefined();
          expect(method.Type).toBe('AWS::ApiGateway::Method');
        });
      });

      test('should have ApiGatewayDeployment', () => {
        const resource = template.Resources.ApiGatewayDeployment;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::ApiGateway::Deployment');
      });

      test('should have ApiGatewayStage', () => {
        const resource = template.Resources.ApiGatewayStage;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::ApiGateway::Stage');
      });

      test('ApiGatewayStage should have logging and tracing enabled', () => {
        const props = template.Resources.ApiGatewayStage.Properties;
        expect(props.TracingEnabled).toBe(true);
        expect(props.MethodSettings[0].LoggingLevel).toBe('INFO');
        expect(props.MethodSettings[0].DataTraceEnabled).toBe(true);
        expect(props.MethodSettings[0].MetricsEnabled).toBe(true);
      });

      test('ApiGatewayStage should use EnvironmentSuffix as stage name', () => {
        const props = template.Resources.ApiGatewayStage.Properties;
        expect(props.StageName).toEqual({ Ref: 'EnvironmentSuffix' });
      });
    });

    describe('CloudWatch Alarms', () => {
      test('should have all required alarms', () => {
        const expectedAlarms = [
          'LambdaErrorRateAlarm',
          'LambdaDurationAlarm',
          'LambdaThrottlesAlarm',
          'ApiGateway4xxAlarm',
          'ApiGateway5xxAlarm',
          'ApiGatewayLatencyAlarm',
        ];

        expectedAlarms.forEach(alarmName => {
          const alarm = template.Resources[alarmName];
          expect(alarm).toBeDefined();
          expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
        });
      });

      test('alarms should have SNS actions configured', () => {
        const alarms = [
          'LambdaErrorRateAlarm',
          'LambdaDurationAlarm',
          'LambdaThrottlesAlarm',
          'ApiGateway4xxAlarm',
          'ApiGateway5xxAlarm',
          'ApiGatewayLatencyAlarm',
        ];

        alarms.forEach(alarmName => {
          const alarm = template.Resources[alarmName];
          expect(alarm.Properties.AlarmActions).toEqual([
            { Ref: 'AlarmNotificationTopic' },
          ]);
        });
      });

      test('API Gateway alarms should use EnvironmentSuffix for stage dimension', () => {
        const apiGatewayAlarms = [
          'ApiGateway4xxAlarm',
          'ApiGateway5xxAlarm',
          'ApiGatewayLatencyAlarm',
        ];

        apiGatewayAlarms.forEach(alarmName => {
          const alarm = template.Resources[alarmName];
          const stageDimension = alarm.Properties.Dimensions.find(
            (dim: any) => dim.Name === 'Stage'
          );
          expect(stageDimension.Value).toEqual({ Ref: 'EnvironmentSuffix' });
        });
      });
    });
  });

  describe('Conditions', () => {
    test('should not have IsProduction condition', () => {
      expect(template.Conditions).toBeUndefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiGatewayUrl',
        'DynamoDBTableName',
        'S3BucketName',
        'LambdaFunctionName',
        'LambdaFunctionArn',
        'ApiGatewayId',
        'DynamoDBTableArn',
        'S3BucketArn',
        'AlarmTopicArn',
        'ApiGatewayStageArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ApiGatewayUrl output should be correct', () => {
      const output = template.Outputs.ApiGatewayUrl;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value).toEqual({
        'Fn::Sub':
          'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}',
      });
    });

    test('all outputs should have export names with EnvironmentSuffix', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        const exportName = output.Export.Name;
        expect(exportName).toBeDefined();
        expect(exportName).toEqual({
          'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
        });
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should not use wildcard (*) in IAM policies for most actions', () => {
      const lambdaRole = template.Resources.LambdaExecutionRole;
      const policies = lambdaRole.Properties.Policies;

      policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          // Skip XRayTracing policy which legitimately uses * for resources
          if (policy.PolicyName === 'XRayTracing') {
            return;
          }

          if (Array.isArray(statement.Action)) {
            statement.Action.forEach((action: string) => {
              expect(action).not.toContain('*');
            });
          } else if (statement.Action) {
            expect(statement.Action).not.toContain('*');
          }
        });
      });
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.StaticContentBucket;
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('DynamoDB table should have encryption enabled', () => {
      const table = template.Resources.ApplicationTable;
      const encryption = table.Properties.SSESpecification;
      expect(encryption).toBeDefined();
      expect(encryption.SSEEnabled).toBe(true);
    });

    test('SNS topic should use KMS encryption', () => {
      const topic = template.Resources.AlarmNotificationTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('API Gateway should have throttling configured', () => {
      const stage = template.Resources.ApiGatewayStage;
      const methodSettings = stage.Properties.MethodSettings[0];
      expect(methodSettings.ThrottlingBurstLimit).toBe(1000);
      expect(methodSettings.ThrottlingRateLimit).toBe(500);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources with names should include EnvironmentSuffix', () => {
      // Check SNS Topic
      const snsTopic =
        template.Resources.AlarmNotificationTopic.Properties.TopicName;
      expect(snsTopic).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });

      // Check S3 Bucket
      const s3Bucket =
        template.Resources.StaticContentBucket.Properties.BucketName;
      expect(s3Bucket).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });

      // Check DynamoDB Table
      const dynamoTable =
        template.Resources.ApplicationTable.Properties.TableName;
      expect(dynamoTable).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });

      // Check Lambda Function
      const lambdaFunction =
        template.Resources.ServerlessAppFunction.Properties.FunctionName;
      expect(lambdaFunction).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });

      // Check API Gateway
      const apiGateway = template.Resources.ApiGateway.Properties.Name;
      expect(apiGateway).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });
    });
  });

  describe('Template Completeness', () => {
    test('should have no Retain deletion policies', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      // Count all the resources we expect
      // SNS: 2, S3: 2, DynamoDB: 1, CloudWatch: 2, IAM: 2, Lambda: 2,
      // API Gateway: 10 (RestApi, Resources, Methods, Deployment, Stage, Account)
      // CloudWatch Alarms: 6
      expect(resourceCount).toBeGreaterThan(25);
    });

    test('Lambda function should have inline code', () => {
      const lambda = template.Resources.ServerlessAppFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('def lambda_handler');
    });

    test('Lambda function code should use aws_request_id', () => {
      const lambda = template.Resources.ServerlessAppFunction;
      const code = lambda.Properties.Code.ZipFile;
      expect(code).toContain('context.aws_request_id');
      expect(code).not.toContain('context.request_id');
    });
  });
});
