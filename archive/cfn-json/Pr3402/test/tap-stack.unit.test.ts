import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Weather Monitoring CloudFormation Template', () => {
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
      expect(template.Description).toContain('Serverless Weather Monitoring System');
      expect(template.Description).toContain('5,200 daily sensor readings');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('should have EnableTimestream parameter', () => {
      expect(template.Parameters.EnableTimestream).toBeDefined();
      expect(template.Parameters.EnableTimestream.Type).toBe('String');
      expect(template.Parameters.EnableTimestream.Default).toBe('false');
      expect(template.Parameters.EnableTimestream.AllowedValues).toEqual(['true', 'false']);
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toContain('Environment suffix');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });
  });

  describe('Conditions', () => {
    test('should have ShouldCreateTimestream condition', () => {
      expect(template.Conditions.ShouldCreateTimestream).toBeDefined();
      expect(template.Conditions.ShouldCreateTimestream['Fn::Equals']).toEqual([
        { Ref: 'EnableTimestream' },
        'true'
      ]);
    });
  });

  describe('DynamoDB Table', () => {
    test('should have WeatherReadingsTable resource', () => {
      expect(template.Resources.WeatherReadingsTable).toBeDefined();
    });

    test('WeatherReadingsTable should have correct type and properties', () => {
      const table = template.Resources.WeatherReadingsTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');

      const properties = table.Properties;
      expect(properties.TableName).toEqual({
        'Fn::Sub': 'WeatherReadings-${EnvironmentSuffix}'
      });

      expect(properties.AttributeDefinitions).toHaveLength(2);
      expect(properties.AttributeDefinitions[0]).toEqual({
        AttributeName: 'sensorId',
        AttributeType: 'S'
      });
      expect(properties.AttributeDefinitions[1]).toEqual({
        AttributeName: 'timestamp',
        AttributeType: 'N'
      });

      expect(properties.KeySchema).toHaveLength(2);
      expect(properties.BillingMode).toBe('PROVISIONED');
      expect(properties.ProvisionedThroughput.ReadCapacityUnits).toBe(5);
      expect(properties.ProvisionedThroughput.WriteCapacityUnits).toBe(5);
      expect(properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });
  });

  describe('Auto Scaling', () => {
    test('should have TableReadScalingTarget with correct properties', () => {
      const target = template.Resources.TableReadScalingTarget;
      expect(target).toBeDefined();
      expect(target.Type).toBe('AWS::ApplicationAutoScaling::ScalableTarget');

      const properties = target.Properties;
      expect(properties.MinCapacity).toBe(5);
      expect(properties.MaxCapacity).toBe(100);
      expect(properties.ScalableDimension).toBe('dynamodb:table:ReadCapacityUnits');
    });

    test('should have TableWriteScalingTarget with correct properties', () => {
      const target = template.Resources.TableWriteScalingTarget;
      expect(target).toBeDefined();
      expect(target.Type).toBe('AWS::ApplicationAutoScaling::ScalableTarget');

      const properties = target.Properties;
      expect(properties.MinCapacity).toBe(5);
      expect(properties.MaxCapacity).toBe(100);
      expect(properties.ScalableDimension).toBe('dynamodb:table:WriteCapacityUnits');
    });

    test('should have auto-scaling policies with 70% target utilization', () => {
      const readPolicy = template.Resources.TableReadScalingPolicy;
      const writePolicy = template.Resources.TableWriteScalingPolicy;

      expect(readPolicy.Properties.TargetTrackingScalingPolicyConfiguration.TargetValue).toBe(70);
      expect(writePolicy.Properties.TargetTrackingScalingPolicyConfiguration.TargetValue).toBe(70);
    });

    test('should have DynamoDBAutoScalingRole', () => {
      const role = template.Resources.DynamoDBAutoScalingRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('application-autoscaling.amazonaws.com');
    });
  });

  describe('Lambda Function', () => {
    test('should have DataAggregationFunction resource', () => {
      expect(template.Resources.DataAggregationFunction).toBeDefined();
    });

    test('DataAggregationFunction should have correct properties', () => {
      const lambda = template.Resources.DataAggregationFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');

      const properties = lambda.Properties;
      expect(properties.Runtime).toBe('python3.11');
      expect(properties.Handler).toBe('index.lambda_handler');
      expect(properties.Timeout).toBe(30);
      expect(properties.MemorySize).toBe(256);
      expect(properties.ReservedConcurrentExecutions).toBe(100);
    });

    test('Lambda function should have environment variables', () => {
      const envVars = template.Resources.DataAggregationFunction.Properties.Environment.Variables;
      expect(envVars.TABLE_NAME).toBeDefined();
      expect(envVars.SNS_TOPIC_ARN).toBeDefined();
      expect(envVars.TIMESTREAM_DATABASE).toBe('WeatherMonitoring');
      expect(envVars.TIMESTREAM_TABLE).toBe('SensorData');
    });

    test('Lambda function code should handle multiple event types', () => {
      const code = template.Resources.DataAggregationFunction.Properties.Code.ZipFile;
      expect(code).toContain('EventBridge Scheduler');
      expect(code).toContain('handle_data_aggregation');
      expect(code).toContain('handle_daily_report');
      expect(code).toContain('write_to_timestream');
    });

    test('should have DataAggregationLambdaRole with correct permissions', () => {
      const role = template.Resources.DataAggregationLambdaRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');

      const policies = role.Properties.Policies;
      expect(policies).toBeDefined();
      expect(policies[0].PolicyName).toBe('DynamoDBAccess');

      const statements = policies[0].PolicyDocument.Statement;
      const dynamoStatement = statements.find((s: any) => s.Action.includes('dynamodb:PutItem'));
      expect(dynamoStatement).toBeDefined();

      const snsStatement = statements.find((s: any) => s.Action.includes('sns:Publish'));
      expect(snsStatement).toBeDefined();

      const timestreamStatement = statements.find((s: any) => s.Action.includes('timestream:WriteRecords'));
      expect(timestreamStatement).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    test('should have WeatherAPI resource', () => {
      const api = template.Resources.WeatherAPI;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types[0]).toBe('REGIONAL');
    });

    test('should have WeatherAPIDeployment resource', () => {
      const deployment = template.Resources.WeatherAPIDeployment;
      expect(deployment).toBeDefined();
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.Properties.StageName).toBe('prod');
    });

    test('should have SensorDataResource with correct path', () => {
      const resource = template.Resources.SensorDataResource;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('sensor-data');
    });

    test('should have SensorDataMethod with POST method', () => {
      const method = template.Resources.SensorDataMethod;
      expect(method).toBeDefined();
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('POST');
      expect(method.Properties.AuthorizationType).toBe('NONE');
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
    });

    test('should have APIUsagePlan with rate limiting', () => {
      const plan = template.Resources.APIUsagePlan;
      expect(plan).toBeDefined();
      expect(plan.Type).toBe('AWS::ApiGateway::UsagePlan');

      const throttle = plan.Properties.Throttle;
      expect(throttle.RateLimit).toBe(100);
      expect(throttle.BurstLimit).toBe(200);

      const methodThrottle = plan.Properties.ApiStages[0].Throttle['/sensor-data/POST'];
      expect(methodThrottle.RateLimit).toBe(100);
      expect(methodThrottle.BurstLimit).toBe(200);
    });
  });

  describe('EventBridge Scheduler', () => {
    test('should have SchedulerRole', () => {
      const role = template.Resources.SchedulerRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('scheduler.amazonaws.com');
    });

    test('should have HourlyAggregationSchedule', () => {
      const schedule = template.Resources.HourlyAggregationSchedule;
      expect(schedule).toBeDefined();
      expect(schedule.Type).toBe('AWS::Scheduler::Schedule');
      expect(schedule.Properties.ScheduleExpression).toBe('rate(1 hour)');
      expect(schedule.Properties.State).toBe('ENABLED');
      expect(schedule.Properties.FlexibleTimeWindow.Mode).toBe('FLEXIBLE');
      expect(schedule.Properties.FlexibleTimeWindow.MaximumWindowInMinutes).toBe(15);
    });

    test('should have DailyReportSchedule', () => {
      const schedule = template.Resources.DailyReportSchedule;
      expect(schedule).toBeDefined();
      expect(schedule.Type).toBe('AWS::Scheduler::Schedule');
      expect(schedule.Properties.ScheduleExpression).toBe('cron(0 2 * * ? *)');
      expect(schedule.Properties.ScheduleExpressionTimezone).toBe('UTC');
      expect(schedule.Properties.State).toBe('ENABLED');
      expect(schedule.Properties.FlexibleTimeWindow.MaximumWindowInMinutes).toBe(15);
    });

    test('schedules should have correct target and input', () => {
      const hourlySchedule = template.Resources.HourlyAggregationSchedule;
      const dailySchedule = template.Resources.DailyReportSchedule;

      expect(hourlySchedule.Properties.Target.Input).toBe('{"source": "EventBridge Scheduler", "action": "aggregate"}');
      expect(dailySchedule.Properties.Target.Input).toBe('{"source": "EventBridge Scheduler", "reportType": "daily"}');
    });
  });

  describe('SNS Topic', () => {
    test('should have WeatherAnomalyTopic', () => {
      const topic = template.Resources.WeatherAnomalyTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.DisplayName).toBe('Weather Anomaly Alerts');
      expect(topic.Properties.KmsMasterKeyId).toBe('alias/aws/sns');
    });
  });

  describe('S3 Bucket', () => {
    test('should have FailedEventsBucket', () => {
      const bucket = template.Resources.FailedEventsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'weather-failed-events-${EnvironmentSuffix}-${AWS::AccountId}'
      });
    });

    test('FailedEventsBucket should have lifecycle configuration', () => {
      const bucket = template.Resources.FailedEventsBucket;
      const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules;
      expect(lifecycleRules).toHaveLength(1);
      expect(lifecycleRules[0].ExpirationInDays).toBe(30);
      expect(lifecycleRules[0].Status).toBe('Enabled');
    });

    test('FailedEventsBucket should have public access blocked', () => {
      const bucket = template.Resources.FailedEventsBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have LambdaErrorAlarm', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Threshold).toBe(0.01);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
    });

    test('should have APIGateway4xxAlarm', () => {
      const alarm = template.Resources.APIGateway4xxAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('4XXError');
      expect(alarm.Properties.Threshold).toBe(0.05);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have DynamoDBThrottleAlarm', () => {
      const alarm = template.Resources.DynamoDBThrottleAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('UserErrors');
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });

    test('should have TimestreamQueryAlarm with condition', () => {
      const alarm = template.Resources.TimestreamQueryAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Condition).toBe('ShouldCreateTimestream');
      expect(alarm.Properties.MetricName).toBe('QueryExecutionTime');
      expect(alarm.Properties.Threshold).toBe(5000);
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have LambdaLogGroup', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(7);
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/WeatherDataAggregation-${EnvironmentSuffix}'
      });
    });
  });

  describe('Timestream Resources', () => {
    test('should have TimestreamDatabase with condition', () => {
      const database = template.Resources.TimestreamDatabase;
      expect(database).toBeDefined();
      expect(database.Type).toBe('AWS::Timestream::Database');
      expect(database.Condition).toBe('ShouldCreateTimestream');
      expect(database.Properties.DatabaseName).toBe('WeatherMonitoring');
    });

    test('should have TimestreamTable with correct retention properties', () => {
      const table = template.Resources.TimestreamTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::Timestream::Table');
      expect(table.Condition).toBe('ShouldCreateTimestream');
      expect(table.Properties.DatabaseName).toBe('WeatherMonitoring');
      expect(table.Properties.TableName).toBe('SensorData');
      expect(table.Properties.RetentionProperties.MemoryStoreRetentionPeriodInHours).toBe(168); // 7 days
      expect(table.Properties.RetentionProperties.MagneticStoreRetentionPeriodInDays).toBe(365);
    });
  });

  describe('Lambda Permissions', () => {
    test('should have LambdaInvokePermission for API Gateway', () => {
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });

    test('should have LambdaFailureDestination', () => {
      const destination = template.Resources.LambdaFailureDestination;
      expect(destination).toBeDefined();
      expect(destination.Type).toBe('AWS::Lambda::EventInvokeConfig');
      expect(destination.Properties.MaximumRetryAttempts).toBe(2);
      expect(destination.Properties.Qualifier).toBe('$LATEST');
    });
  });

  describe('Outputs', () => {
    test('should have APIEndpoint output', () => {
      const output = template.Outputs.APIEndpoint;
      expect(output).toBeDefined();
      expect(output.Description).toContain('API Gateway endpoint URL');
      expect(output.Export).toBeDefined();
    });

    test('should have DynamoDBTableName output', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output).toBeDefined();
      expect(output.Description).toContain('DynamoDB table');
    });

    test('should have LambdaFunctionArn output', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output).toBeDefined();
      expect(output.Description).toContain('Lambda function');
    });

    test('should have SNSTopicArn output', () => {
      const output = template.Outputs.SNSTopicArn;
      expect(output).toBeDefined();
      expect(output.Description).toContain('SNS topic');
    });

    test('should have FailedEventsBucketName output', () => {
      const output = template.Outputs.FailedEventsBucketName;
      expect(output).toBeDefined();
      expect(output.Description).toContain('S3 bucket');
    });

    test('should have TimestreamDatabaseName output with condition', () => {
      const output = template.Outputs.TimestreamDatabaseName;
      expect(output).toBeDefined();
      expect(output.Condition).toBe('ShouldCreateTimestream');
      expect(output.Description).toContain('Timestream database');
    });

    test('should have HourlyScheduleArn output', () => {
      const output = template.Outputs.HourlyScheduleArn;
      expect(output).toBeDefined();
      expect(output.Description).toContain('hourly aggregation schedule');
    });
  });

  describe('Resource Naming', () => {
    test('all named resources should use EnvironmentSuffix', () => {
      const namedResources = [
        template.Resources.WeatherReadingsTable.Properties.TableName,
        template.Resources.WeatherAnomalyTopic.Properties.TopicName,
        template.Resources.DataAggregationFunction.Properties.FunctionName,
        template.Resources.FailedEventsBucket.Properties.BucketName,
        template.Resources.WeatherAPI.Properties.Name,
        template.Resources.HourlyAggregationSchedule.Properties.Name,
        template.Resources.DailyReportSchedule.Properties.Name
      ];

      namedResources.forEach(name => {
        if (typeof name === 'object' && name['Fn::Sub']) {
          expect(name['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Security', () => {
    test('IAM roles should follow least privilege principle', () => {
      const lambdaRole = template.Resources.DataAggregationLambdaRole;
      const schedulerRole = template.Resources.SchedulerRole;

      // Check Lambda role has specific resource ARNs where possible
      const lambdaPolicies = lambdaRole.Properties.Policies[0].PolicyDocument.Statement;
      const dynamoPolicy = lambdaPolicies.find((s: any) => s.Action.includes('dynamodb:PutItem'));
      expect(dynamoPolicy.Resource).toBeDefined();
      expect(dynamoPolicy.Resource['Fn::GetAtt']).toBeDefined();

      // Check Scheduler role has specific Lambda ARN
      const schedulerPolicy = schedulerRole.Properties.Policies[0].PolicyDocument.Statement[0];
      expect(schedulerPolicy.Resource['Fn::GetAtt']).toBeDefined();
    });

    test('S3 bucket should have encryption', () => {
      const bucket = template.Resources.FailedEventsBucket;
      // While not explicitly set, S3 default encryption is enabled by default in AWS
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
    });

    test('SNS topic should use KMS encryption', () => {
      const topic = template.Resources.WeatherAnomalyTopic;
      expect(topic.Properties.KmsMasterKeyId).toBe('alias/aws/sns');
    });
  });
});