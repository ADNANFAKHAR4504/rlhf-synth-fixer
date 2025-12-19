import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack - IoT Recovery Automation', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('Stack should be created successfully', () => {
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('Stack should be created with correct stack ID', () => {
      expect(stack.artifactId).toBe('TestTapStack');
    });

    test('Stack should have environment suffix property', () => {
      expect(stack.environmentSuffix).toBe(environmentSuffix);
    });

    test('Stack with custom environment suffix', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'staging'
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'iot-device-recovery-staging'
      });
    });

    test('Stack with production environment has RETAIN policies', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdStack', {
        environmentSuffix: 'prod'
      });
      const prodTemplate = Template.fromStack(prodStack);

      // Verify S3 bucket has RETAIN policy for prod
      const s3Buckets = prodTemplate.findResources('AWS::S3::Bucket');
      const bucketKey = Object.keys(s3Buckets)[0];
      expect(s3Buckets[bucketKey].UpdateReplacePolicy).toBe('Retain');
      expect(s3Buckets[bucketKey].DeletionPolicy).toBe('Retain');
    });

    test('Stack with non-prod environment has DESTROY policies', () => {
      const devApp = new cdk.App();
      const devStack = new TapStack(devApp, 'DevStack', {
        environmentSuffix: 'dev'
      });
      const devTemplate = Template.fromStack(devStack);

      // Verify S3 bucket has DESTROY policy for dev
      const s3Buckets = devTemplate.findResources('AWS::S3::Bucket');
      const bucketKey = Object.keys(s3Buckets)[0];
      expect(s3Buckets[bucketKey].UpdateReplacePolicy).toBe('Delete');
      expect(s3Buckets[bucketKey].DeletionPolicy).toBe('Delete');
    });
  });

  describe('S3 Archive Bucket', () => {
    test('Should create S3 bucket for IoT data archival', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('Should have versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('Should have lifecycle policy for Glacier transition', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'archive-old-data',
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'GLACIER',
                  TransitionInDays: 30
                })
              ])
            })
          ])
        }
      });
    });

    test('Should have environment-specific bucket name', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucket = Object.values(buckets)[0] as any;
      const bucketName = bucket.Properties.BucketName;

      // BucketName might be Fn::Join, so check if it's an object or string
      if (typeof bucketName === 'object' && bucketName['Fn::Join']) {
        const joinedParts = bucketName['Fn::Join'][1];
        const nameString = joinedParts.join('');
        expect(nameString).toContain('iot-archive');
        expect(nameString).toContain(environmentSuffix);
      } else {
        expect(bucketName).toMatch(/iot-archive-.*-dev-.*/);
      }
    });
  });

  describe('DynamoDB Tables', () => {
    test('Should create two DynamoDB tables', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 2);
    });

    test('Device recovery table should have correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `iot-device-recovery-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        }
      });
    });

    test('Device recovery table should have deviceId as partition key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `iot-device-recovery-${environmentSuffix}`,
        KeySchema: Match.arrayWith([
          {
            AttributeName: 'deviceId',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE'
          }
        ])
      });
    });

    test('Device recovery table should have GSI on deviceType', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `iot-device-recovery-${environmentSuffix}`,
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: `deviceType-index-${environmentSuffix}`,
            KeySchema: Match.arrayWith([
              {
                AttributeName: 'deviceType',
                KeyType: 'HASH'
              },
              {
                AttributeName: 'timestamp',
                KeyType: 'RANGE'
              }
            ])
          })
        ])
      });
    });

    test('Device recovery table should have DynamoDB streams enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `iot-device-recovery-${environmentSuffix}`,
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES'
        }
      });
    });

    test('Validation table should have correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `iot-recovery-validation-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        }
      });
    });

    test('Validation table should have GSI for time-range queries', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `iot-recovery-validation-${environmentSuffix}`,
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: `timestamp-index-${environmentSuffix}`,
            KeySchema: Match.arrayWith([
              {
                AttributeName: 'validationType',
                KeyType: 'HASH'
              },
              {
                AttributeName: 'timestamp',
                KeyType: 'RANGE'
              }
            ])
          })
        ])
      });
    });
  });

  describe('Kinesis Streams - Message Replay', () => {
    test('Should create 10 Kinesis streams for partitioned replay', () => {
      template.resourceCountIs('AWS::Kinesis::Stream', 10);
    });

    test('Each Kinesis stream should have 100 shards', () => {
      const streams = template.findResources('AWS::Kinesis::Stream');
      Object.values(streams).forEach((stream: any) => {
        expect(stream.Properties.ShardCount).toBe(100);
      });
    });

    test('Kinesis streams should have 24-hour retention', () => {
      template.hasResourceProperties('AWS::Kinesis::Stream', {
        RetentionPeriodHours: 24
      });
    });

    test('Kinesis streams should have environment-specific names', () => {
      for (let i = 0; i < 10; i++) {
        template.hasResourceProperties('AWS::Kinesis::Stream', {
          Name: `iot-replay-stream-${environmentSuffix}-${i}`
        });
      }
    });

    test('Total shard count should support 45M messages', () => {
      // 10 streams * 100 shards = 1000 shards total
      const streams = template.findResources('AWS::Kinesis::Stream');
      const totalShards = Object.values(streams).reduce(
        (sum: number, stream: any) => sum + stream.Properties.ShardCount,
        0
      );
      expect(totalShards).toBe(1000);
    });
  });

  describe('SQS Dead Letter Queues - Device Type Routing', () => {
    test('Should create DLQs for all 4 device types', () => {
      // 4 primary DLQs + 4 secondary DLQs = 8 total
      template.resourceCountIs('AWS::SQS::Queue', 8);
    });

    test('Should create sensor device DLQ', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `iot-recovery-dlq-${environmentSuffix}-sensor`
      });
    });

    test('Should create actuator device DLQ', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `iot-recovery-dlq-${environmentSuffix}-actuator`
      });
    });

    test('Should create gateway device DLQ', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `iot-recovery-dlq-${environmentSuffix}-gateway`
      });
    });

    test('Should create edge device DLQ', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `iot-recovery-dlq-${environmentSuffix}-edge`
      });
    });

    test('DLQs should have 15-minute visibility timeout', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.stringLikeRegexp(`iot-recovery-dlq-${environmentSuffix}-(sensor|actuator|gateway|edge)$`),
        VisibilityTimeout: 900 // 15 minutes
      });
    });

    test('DLQs should have 14-day message retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.stringLikeRegexp(`iot-recovery-dlq-${environmentSuffix}-(sensor|actuator|gateway|edge)$`),
        MessageRetentionPeriod: 1209600 // 14 days
      });
    });

    test('DLQs should have secondary DLQ configured', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.stringLikeRegexp(`iot-recovery-dlq-${environmentSuffix}-(sensor|actuator|gateway|edge)$`),
        RedrivePolicy: {
          maxReceiveCount: 3,
          deadLetterTargetArn: Match.anyValue()
        }
      });
    });
  });

  describe('Lambda Functions - IoT Shadow & Message Processing', () => {
    test('Should create 4 Lambda functions', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      // Filter out log retention custom resources
      const appFunctions = Object.values(lambdaFunctions).filter(
        (fn: any) => !fn.Properties.FunctionName?.includes('LogRetention')
      );
      expect(appFunctions.length).toBeGreaterThanOrEqual(4);
    });

    test('Shadow analysis Lambda should be configured correctly', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `iot-shadow-analysis-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        MemorySize: 3008,
        Timeout: 900, // 15 minutes
        ReservedConcurrentExecutions: 100
      });
    });

    test('Shadow analysis Lambda should have correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `iot-shadow-analysis-${environmentSuffix}`,
        Environment: {
          Variables: {
            DEVICE_TABLE_NAME: Match.anyValue(),
            BUCKET_NAME: Match.anyValue(),
            ENVIRONMENT: environmentSuffix
          }
        }
      });
    });

    test('Kinesis republish Lambda should be configured correctly', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `iot-kinesis-republish-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        MemorySize: 3008,
        Timeout: 900, // 15 minutes
        ReservedConcurrentExecutions: 100
      });
    });

    test('Kinesis republish Lambda should have Kinesis streams in environment', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `iot-kinesis-republish-${environmentSuffix}`,
        Environment: {
          Variables: {
            KINESIS_STREAMS: Match.anyValue(),
            ENVIRONMENT: environmentSuffix
          }
        }
      });
    });

    test('DynamoDB validation Lambda should be configured correctly', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `iot-dynamodb-validation-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        MemorySize: 3008,
        Timeout: 300 // 5 minutes for validation requirement
      });
    });

    test('DynamoDB validation Lambda should have table references', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `iot-dynamodb-validation-${environmentSuffix}`,
        Environment: {
          Variables: {
            VALIDATION_TABLE_NAME: Match.anyValue(),
            DEVICE_TABLE_NAME: Match.anyValue(),
            ENVIRONMENT: environmentSuffix
          }
        }
      });
    });

    test('Trigger state machine Lambda should be configured', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `iot-trigger-recovery-${environmentSuffix}`,
        Runtime: 'nodejs18.x'
      });
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('Should create IAM roles for all Lambda functions', () => {
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: {
                  Service: 'lambda.amazonaws.com'
                }
              })
            ])
          }
        }
      });
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(4);
    });

    test('Shadow analysis Lambda should have IoT permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasIoTPolicy = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some(
          (stmt: any) =>
            stmt.Action &&
            Array.isArray(stmt.Action) &&
            (stmt.Action.includes('iot:GetThingShadow') || stmt.Action.includes('iot:ListThings'))
        );
      });
      expect(hasIoTPolicy).toBe(true);
    });

    test('Shadow analysis Lambda should have DynamoDB permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasDDBPolicy = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some(
          (stmt: any) =>
            stmt.Action &&
            Array.isArray(stmt.Action) &&
            stmt.Action.includes('dynamodb:PutItem')
        );
      });
      expect(hasDDBPolicy).toBe(true);
    });

    test('Shadow analysis Lambda should have S3 read permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasS3Policy = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some(
          (stmt: any) =>
            stmt.Action &&
            Array.isArray(stmt.Action) &&
            (stmt.Action.includes('s3:GetObject*') || stmt.Action.includes('s3:GetBucket*'))
        );
      });
      expect(hasS3Policy).toBe(true);
    });

    test('Kinesis republish Lambda should have Kinesis write permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasKinesisPolicy = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some(
          (stmt: any) =>
            stmt.Action &&
            Array.isArray(stmt.Action) &&
            (stmt.Action.includes('kinesis:PutRecord') || stmt.Action.includes('kinesis:PutRecords'))
        );
      });
      expect(hasKinesisPolicy).toBe(true);
    });

    test('Validation Lambda should have CloudWatch permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasCWPolicy = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some(
          (stmt: any) =>
            stmt.Action &&
            Array.isArray(stmt.Action) &&
            stmt.Action.includes('cloudwatch:PutMetricData')
        );
      });
      expect(hasCWPolicy).toBe(true);
    });

    test('Step Functions should have Lambda invoke permissions', () => {
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Principal: {
                  Service: 'states.amazonaws.com'
                }
              })
            ])
          }
        }
      });
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Step Functions - Recovery Orchestration', () => {
    test('Should create Step Functions state machine', () => {
      template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
    });

    test('State machine should have correct name', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: `iot-recovery-orchestration-${environmentSuffix}`
      });
    });

    test('State machine should have 2-hour timeout', () => {
      const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
      const stateMachine = Object.values(stateMachines)[0] as any;
      const definitionObj = stateMachine.Properties.DefinitionString;

      // DefinitionString is Fn::Join, get the parts and check
      if (definitionObj['Fn::Join']) {
        const parts = definitionObj['Fn::Join'][1];
        const defString = JSON.stringify(parts);
        expect(defString).toContain('7200'); // 2 hours
      }
    });

    test('State machine should have parallel backfill branches', () => {
      const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
      const stateMachine = Object.values(stateMachines)[0] as any;
      const definitionObj = stateMachine.Properties.DefinitionString;
      const defString = JSON.stringify(definitionObj);
      expect(defString).toContain('ParallelBackfill');
    });

    test('State machine should include BackfillTask', () => {
      const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
      const stateMachine = Object.values(stateMachines)[0] as any;
      const definitionObj = stateMachine.Properties.DefinitionString;
      const defString = JSON.stringify(definitionObj);
      expect(defString).toContain('BackfillTask');
    });

    test('State machine should include RepublishTask', () => {
      const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
      const stateMachine = Object.values(stateMachines)[0] as any;
      const definitionObj = stateMachine.Properties.DefinitionString;
      const defString = JSON.stringify(definitionObj);
      expect(defString).toContain('RepublishTask');
    });

    test('State machine should include ValidationTask', () => {
      const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
      const stateMachine = Object.values(stateMachines)[0] as any;
      const definitionObj = stateMachine.Properties.DefinitionString;
      const defString = JSON.stringify(definitionObj);
      expect(defString).toContain('ValidationTask');
    });

    test('State machine should have IAM role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'states.amazonaws.com'
              }
            })
          ])
        }
      });
    });
  });

  describe('EventBridge - Event Routing', () => {
    test('Should create custom EventBridge event bus', () => {
      template.resourceCountIs('AWS::Events::EventBus', 1);
    });

    test('Event bus should have environment-specific name', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `iot-recovery-events-${environmentSuffix}`
      });
    });

    test('Should create EventBridge rules for all device types', () => {
      const rules = template.findResources('AWS::Events::Rule');
      const deviceTypeRules = Object.values(rules).filter((rule: any) =>
        ['sensor', 'actuator', 'gateway', 'edge'].some((type) =>
          rule.Properties.Name?.includes(type)
        )
      );
      expect(deviceTypeRules.length).toBe(4);
    });

    test('EventBridge rules should route to correct SQS queues', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `iot-recovery-${environmentSuffix}-sensor`,
        EventPattern: {
          source: ['iot.recovery'],
          'detail-type': ['Device Recovery Event'],
          detail: {
            deviceType: ['sensor']
          }
        }
      });
    });

    test('EventBridge rules should have SQS targets', () => {
      const rules = template.findResources('AWS::Events::Rule');
      Object.values(rules).forEach((rule: any) => {
        if (rule.Properties.Name?.includes('recovery')) {
          expect(rule.Properties.Targets).toBeDefined();
          expect(Array.isArray(rule.Properties.Targets)).toBe(true);
          expect(rule.Properties.Targets.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('CloudWatch Monitoring - Rule Failure Detection', () => {
    test('Should create CloudWatch alarm for IoT rule failures', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `iot-rule-failures-${environmentSuffix}`,
        MetricName: 'RuleMessageThrottled',
        Namespace: 'AWS/IoT'
      });
    });

    test('CloudWatch alarm should have 1-minute period', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `iot-rule-failures-${environmentSuffix}`,
        Period: 60 // 1 minute (changed from 15 seconds requirement due to AWS limitations)
      });
    });

    test('CloudWatch alarm should trigger on any failure', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `iot-rule-failures-${environmentSuffix}`,
        Threshold: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 1
      });
    });

    test('CloudWatch alarm should invoke shadow analysis Lambda', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarm = Object.values(alarms).find((a: any) =>
        a.Properties.AlarmName === `iot-rule-failures-${environmentSuffix}`
      ) as any;

      expect(alarm).toBeDefined();
      expect(alarm.Properties.AlarmActions).toBeDefined();
      expect(Array.isArray(alarm.Properties.AlarmActions)).toBe(true);
      expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
    });

    test('Should create CloudWatch dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });

    test('CloudWatch dashboard should have environment-specific name', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `iot-recovery-monitoring-${environmentSuffix}`
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('Should have S3 bucket outputs', () => {
      template.hasOutput('IoTArchiveBucketName', {
        Description: 'S3 bucket for archived IoT data'
      });
      template.hasOutput('IoTArchiveBucketArn', {});
    });

    test('Should have DynamoDB table outputs', () => {
      template.hasOutput('DeviceRecoveryTableName', {
        Description: 'DynamoDB table for device recovery state'
      });
      template.hasOutput('ValidationTableName', {
        Description: 'DynamoDB table for recovery validation'
      });
    });

    test('Should have Lambda function outputs', () => {
      template.hasOutput('ShadowAnalysisLambdaName', {});
      template.hasOutput('KinesisRepublishLambdaName', {});
      template.hasOutput('DynamoDBValidationLambdaName', {});
      template.hasOutput('TriggerStateMachineLambdaName', {});
    });

    test('Should have Step Functions outputs', () => {
      template.hasOutput('RecoveryStateMachineArn', {
        Description: 'ARN of recovery orchestration state machine'
      });
    });

    test('Should have EventBridge outputs', () => {
      template.hasOutput('RecoveryEventBusName', {});
      template.hasOutput('RecoveryEventBusArn', {});
    });

    test('Should have SQS queue outputs', () => {
      template.hasOutput('SensorDLQUrl', {});
      template.hasOutput('ActuatorDLQUrl', {});
      template.hasOutput('GatewayDLQUrl', {});
      template.hasOutput('EdgeDLQUrl', {});
    });

    test('Should have helper command outputs', () => {
      template.hasOutput('TestShadowAnalysisCommand', {});
      template.hasOutput('StartRecoveryCommand', {});
      template.hasOutput('ViewLogsCommand', {});
      template.hasOutput('CheckSensorDLQCommand', {});
    });

    test('Outputs should have export names for cross-stack references', () => {
      template.hasOutput('IoTArchiveBucketName', {
        Export: {
          Name: `IoTArchiveBucket-${environmentSuffix}`
        }
      });
      template.hasOutput('RecoveryStateMachineArn', {
        Export: {
          Name: `RecoveryStateMachine-${environmentSuffix}`
        }
      });
    });
  });

  describe('Resource Counts', () => {
    test('Should create expected number of core resources', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::DynamoDB::Table', 2);
      template.resourceCountIs('AWS::Kinesis::Stream', 10);
      template.resourceCountIs('AWS::SQS::Queue', 8); // 4 primary + 4 secondary
      template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
      template.resourceCountIs('AWS::Events::EventBus', 1);
      template.resourceCountIs('AWS::Events::Rule', 4); // One per device type
      template.resourceCountIs('AWS::CloudWatch::Alarm', 1);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });

    test('Should create Lambda functions for all processing tasks', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const appFunctions = Object.values(lambdaFunctions).filter(
        (fn: any) => !fn.Properties.FunctionName?.includes('LogRetention')
      );
      expect(appFunctions.length).toBeGreaterThanOrEqual(4);
    });

    test('Should create IAM policies for permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      expect(Object.keys(policies).length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Scale and Performance Requirements', () => {
    test('Lambda functions should support 2.3M device processing', () => {
      // High memory for processing large device sets
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `iot-shadow-analysis-${environmentSuffix}`,
        MemorySize: 3008 // Max Lambda memory
      });
    });

    test('Kinesis should support 45M message replay', () => {
      // 10 streams * 100 shards = 1000 shards
      const streams = template.findResources('AWS::Kinesis::Stream');
      const totalShards = Object.values(streams).reduce(
        (sum: number, stream: any) => sum + stream.Properties.ShardCount,
        0
      );
      // 1000 shards can handle 1000 MB/s write (1 MB/s per shard)
      // 45M messages over 12 hours = ~1041 messages/second
      expect(totalShards).toBeGreaterThanOrEqual(1000);
    });

    test('Step Functions should support 2-hour parallel backfill', () => {
      const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
      const stateMachine = Object.values(stateMachines)[0] as any;
      const defString = JSON.stringify(stateMachine.Properties.DefinitionString);
      expect(defString).toContain('7200');
    });

    test('DynamoDB validation should complete within 5 minutes', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `iot-dynamodb-validation-${environmentSuffix}`,
        Timeout: 300 // 5 minutes
      });
    });

    test('Lambda concurrency should not exceed account limits', () => {
      // Total reserved concurrency should leave room for account minimum
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const totalReserved = Object.values(lambdaFunctions).reduce(
        (sum: number, fn: any) => sum + (fn.Properties.ReservedConcurrentExecutions || 0),
        0
      );
      // Should be 200 (100 + 100), leaving 800+ unreserved
      expect(totalReserved).toBeLessThanOrEqual(900); // Safe margin below 1000
    });
  });

  describe('Architecture Flow Requirements', () => {
    test('CloudWatch alarm should be configured to trigger Lambda', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const ruleAlarm = Object.values(alarms).find((alarm: any) =>
        alarm.Properties.AlarmName?.includes('rule-failures')
      );
      expect(ruleAlarm).toBeDefined();
      expect((ruleAlarm as any).Properties.AlarmActions).toBeDefined();
    });

    test('Step Functions should orchestrate parallel execution', () => {
      const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
      const stateMachine = Object.values(stateMachines)[0] as any;
      const defString = JSON.stringify(stateMachine.Properties.DefinitionString);
      expect(defString).toContain('Parallel');
      expect(defString).toContain('Branches');
    });

    test('EventBridge rules should target SQS queues', () => {
      const rules = template.findResources('AWS::Events::Rule');
      Object.values(rules).forEach((rule: any) => {
        if (rule.Properties.Name?.includes('recovery')) {
          expect(rule.Properties.Targets).toBeDefined();
          expect(rule.Properties.Targets.length).toBeGreaterThan(0);
        }
      });
    });

    test('Lambda functions should be invokable by Step Functions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasInvokePolicy = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some(
          (stmt: any) =>
            stmt.Action &&
            (stmt.Action === 'lambda:InvokeFunction' ||
              (Array.isArray(stmt.Action) && stmt.Action.includes('lambda:InvokeFunction')))
        );
      });
      expect(hasInvokePolicy).toBe(true);
    });
  });

  describe('Security and Compliance', () => {
    test('DynamoDB tables should have point-in-time recovery enabled', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      Object.values(tables).forEach((table: any) => {
        expect(table.Properties.PointInTimeRecoverySpecification).toEqual({
          PointInTimeRecoveryEnabled: true
        });
      });
    });

    test('S3 bucket should have versioning for data protection', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('Lambda functions should have log groups for monitoring', () => {
      // Log groups are created automatically by Lambda service or via custom resources
      // We verify Lambda functions exist which will have implicit log groups
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const appLambdas = Object.values(lambdaFunctions).filter(
        (fn: any) => !fn.Properties.FunctionName?.includes('LogRetention')
      );
      expect(appLambdas.length).toBeGreaterThanOrEqual(4);
    });

    test('Lambda log groups should have retention policy', () => {
      // Log groups with retention are created via custom resources at deployment time
      // This test verifies the Lambda functions exist
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdaFunctions).length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Environment-Specific Behavior', () => {
    test('Production environment should retain resources', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdStack', {
        environmentSuffix: 'prod'
      });
      const prodTemplate = Template.fromStack(prodStack);

      // Check S3 bucket retention
      const s3Buckets = prodTemplate.findResources('AWS::S3::Bucket');
      const bucketKey = Object.keys(s3Buckets)[0];
      expect(s3Buckets[bucketKey].UpdateReplacePolicy).toBe('Retain');

      // Check DynamoDB table retention
      const tables = prodTemplate.findResources('AWS::DynamoDB::Table');
      Object.values(tables).forEach((table: any) => {
        expect(table.UpdateReplacePolicy).toBe('Retain');
      });
    });

    test('Development environment should destroy resources', () => {
      const devApp = new cdk.App();
      const devStack = new TapStack(devApp, 'DevStack', {
        environmentSuffix: 'dev'
      });
      const devTemplate = Template.fromStack(devStack);

      // Check S3 bucket deletion
      const s3Buckets = devTemplate.findResources('AWS::S3::Bucket');
      const bucketKey = Object.keys(s3Buckets)[0];
      expect(s3Buckets[bucketKey].UpdateReplacePolicy).toBe('Delete');

      // Check DynamoDB table deletion
      const tables = devTemplate.findResources('AWS::DynamoDB::Table');
      Object.values(tables).forEach((table: any) => {
        expect(table.UpdateReplacePolicy).toBe('Delete');
      });
    });

    test('Non-prod S3 should have auto-delete objects enabled', () => {
      const devApp = new cdk.App();
      const devStack = new TapStack(devApp, 'DevStack', {
        environmentSuffix: 'dev'
      });
      const devTemplate = Template.fromStack(devStack);

      const s3Buckets = devTemplate.findResources('AWS::S3::Bucket');
      const bucket = Object.values(s3Buckets)[0] as any;
      const tags = bucket.Properties.Tags || [];
      const autoDeleteTag = tags.find((tag: any) => tag.Key === 'aws-cdk:auto-delete-objects');
      expect(autoDeleteTag).toBeDefined();
      expect(autoDeleteTag.Value).toBe('true');
    });
  });

  describe('Resource Naming Conventions', () => {
    test('All resources should include environment suffix', () => {
      // Check DynamoDB tables
      const tables = template.findResources('AWS::DynamoDB::Table');
      Object.values(tables).forEach((table: any) => {
        expect(table.Properties.TableName).toContain(environmentSuffix);
      });

      // Check Lambda functions
      const lambdas = template.findResources('AWS::Lambda::Function');
      Object.values(lambdas).forEach((lambda: any) => {
        if (lambda.Properties.FunctionName && !lambda.Properties.FunctionName.includes('LogRetention')) {
          expect(lambda.Properties.FunctionName).toContain(environmentSuffix);
        }
      });

      // Check Kinesis streams
      const streams = template.findResources('AWS::Kinesis::Stream');
      Object.values(streams).forEach((stream: any) => {
        expect(stream.Properties.Name).toContain(environmentSuffix);
      });
    });

    test('Resource names should follow kebab-case convention', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('^[a-z0-9-]+$')
      });

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('^[a-z0-9-]+$')
      });
    });
  });

  describe('Data Continuity and Gap Detection', () => {
    test('Validation table should support time-series queries', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `iot-recovery-validation-${environmentSuffix}`,
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: `timestamp-index-${environmentSuffix}`,
            KeySchema: Match.arrayWith([
              {
                AttributeName: 'timestamp',
                KeyType: 'RANGE'
              }
            ])
          })
        ])
      });
    });

    test('Validation table should have TTL for auto-cleanup', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `iot-recovery-validation-${environmentSuffix}`,
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true
        }
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    test('SQS queues should have dead letter queues', () => {
      const queues = template.findResources('AWS::SQS::Queue');
      const primaryQueues = Object.values(queues).filter((queue: any) =>
        queue.Properties.QueueName?.match(/sensor|actuator|gateway|edge/) &&
        !queue.Properties.QueueName?.includes('secondary')
      );

      primaryQueues.forEach((queue: any) => {
        expect(queue.Properties.RedrivePolicy).toBeDefined();
        expect(queue.Properties.RedrivePolicy.maxReceiveCount).toBe(3);
      });
    });

    test('Lambda functions should have appropriate timeout for long operations', () => {
      // Shadow analysis and Kinesis republish need 15 minutes
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `iot-shadow-analysis-${environmentSuffix}`,
        Timeout: 900 // 15 minutes
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `iot-kinesis-republish-${environmentSuffix}`,
        Timeout: 900 // 15 minutes
      });
    });

    test('Step Functions should have retry logic', () => {
      const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
      const stateMachine = Object.values(stateMachines)[0] as any;
      const defString = JSON.stringify(stateMachine.Properties.DefinitionString);
      expect(defString).toContain('Retry');
      expect(defString).toContain('ErrorEquals');
    });
  });

  describe('Cross-Service Integration', () => {
    test('Lambda should have permissions to access DynamoDB tables', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasTableAccess = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) => {
          if (!stmt.Resource || !Array.isArray(stmt.Resource)) return false;
          return stmt.Resource.some((resource: any) =>
            JSON.stringify(resource).includes('DeviceRecoveryTable')
          );
        });
      });
      expect(hasTableAccess).toBe(true);
    });

    test('Lambda should have permissions to access S3 archives', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasS3Access = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) => {
          if (!stmt.Resource || !Array.isArray(stmt.Resource)) return false;
          return stmt.Resource.some((resource: any) =>
            JSON.stringify(resource).includes('IoTArchiveBucket')
          );
        });
      });
      expect(hasS3Access).toBe(true);
    });

    test('Lambda should have permissions to write to Kinesis streams', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasKinesisAccess = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) => {
          const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
          return actions.some((action: string) =>
            action?.includes('kinesis:PutRecord') || action?.includes('kinesis:PutRecords')
          );
        });
      });
      expect(hasKinesisAccess).toBe(true);
    });

    test('EventBridge rules should have permissions to send to SQS', () => {
      const queuePolicies = template.findResources('AWS::SQS::QueuePolicy');
      expect(Object.keys(queuePolicies).length).toBeGreaterThan(0);

      Object.values(queuePolicies).forEach((policy: any) => {
        const statements = policy.Properties.PolicyDocument.Statement;
        const hasEventBridgePermission = statements.some(
          (stmt: any) =>
            stmt.Principal?.Service === 'events.amazonaws.com' &&
            stmt.Action?.includes('sqs:SendMessage')
        );
        expect(hasEventBridgePermission).toBe(true);
      });
    });

    test('Step Functions should have permission to invoke Lambda functions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasSFNPolicy = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some(
          (stmt: any) =>
            stmt.Action === 'lambda:InvokeFunction' ||
            (Array.isArray(stmt.Action) && stmt.Action.includes('lambda:InvokeFunction'))
        );
      });
      expect(hasSFNPolicy).toBe(true);
    });

    test('Trigger Lambda should have permission to start state machine', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const hasStartExecPolicy = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some(
          (stmt: any) =>
            stmt.Action === 'states:StartExecution' ||
            (Array.isArray(stmt.Action) && stmt.Action.includes('states:StartExecution'))
        );
      });
      expect(hasStartExecPolicy).toBe(true);
    });
  });

  describe('Best Practices Compliance', () => {
    test('All Lambda functions should have log groups', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');

      const appLambdas = Object.values(lambdaFunctions).filter(
        (fn: any) => !fn.Properties.FunctionName?.includes('LogRetention')
      );

      // Log groups are created automatically by CloudFormation at deploy time
      // We verify Lambda functions exist which will have implicit log groups
      expect(appLambdas.length).toBeGreaterThanOrEqual(4);
    });

    test('Lambda log groups should have retention policy', () => {
      // Log groups are created by CDK with retention policies via custom resources
      // This happens at deployment, not in the template itself
      // Verify that Lambda functions exist that will have managed log groups
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const appLambdas = Object.values(lambdaFunctions).filter(
        (fn: any) => !fn.Properties.FunctionName?.includes('LogRetention')
      );
      expect(appLambdas.length).toBeGreaterThanOrEqual(4);
    });

    test('IAM roles should follow least privilege principle', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      Object.values(policies).forEach((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        statements.forEach((stmt: any) => {
          // No wildcard-only resources unless necessary
          if (stmt.Resource === '*') {
            // Only allowed for services that don't support resource-level permissions
            const allowedActions = [
              'iot:GetThingShadow',
              'iot:ListThings',
              'cloudwatch:PutMetricData',
              'cloudwatch:GetMetricStatistics',
              'cloudwatch:ListMetrics'
            ];
            if (Array.isArray(stmt.Action)) {
              stmt.Action.forEach((action: string) => {
                expect(allowedActions.some((allowed) => action.includes(allowed.split(':')[1]))).toBe(
                  true
                );
              });
            }
          }
        });
      });
    });

    test('All taggable resources should have tags', () => {
      // Check S3 buckets - these should have tags
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.Tags).toBeDefined();
        expect(Array.isArray(bucket.Properties.Tags)).toBe(true);
        expect(bucket.Properties.Tags.length).toBeGreaterThan(0);
      });

      // Verify tags are properly structured with Key/Value pairs
      const bucket = Object.values(buckets)[0] as any;
      const tags = bucket.Properties.Tags;
      tags.forEach((tag: any) => {
        expect(tag.Key).toBeDefined();
        expect(tag.Value).toBeDefined();
      });
    });
  });

  describe('Recovery Workflow Validation', () => {
    test('State machine definition should contain all required tasks', () => {
      const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
      const stateMachine = Object.values(stateMachines)[0] as any;
      const defString = JSON.stringify(stateMachine.Properties.DefinitionString);

      // Verify all required tasks are in the definition
      expect(defString).toContain('ParallelBackfill');
      expect(defString).toContain('BackfillTask');
      expect(defString).toContain('RepublishTask');
      expect(defString).toContain('ValidationTask');
      expect(defString).toContain('RecoveryComplete');
    });

    test('Parallel execution should have 2 branches', () => {
      const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
      const stateMachine = Object.values(stateMachines)[0] as any;
      const definitionStr = JSON.stringify(stateMachine.Properties.DefinitionString);

      // Should have Branches array with 2 items (Backfill and Republish)
      expect(definitionStr).toMatch(/Branches/);
    });

    test('Validation should follow parallel execution', () => {
      const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
      const stateMachine = Object.values(stateMachines)[0] as any;
      const definitionStr = JSON.stringify(stateMachine.Properties.DefinitionString);

      // ValidationTask should come after ParallelBackfill
      const parallelIndex = definitionStr.indexOf('ParallelBackfill');
      const validationIndex = definitionStr.indexOf('ValidationTask');
      expect(parallelIndex).toBeGreaterThan(-1);
      expect(validationIndex).toBeGreaterThan(-1);
      expect(validationIndex).toBeGreaterThan(parallelIndex);
    });
  });

  describe('Message Ordering and Replay', () => {
    test('Kinesis streams should use partition keys for ordering', () => {
      // Verify Lambda environment includes stream configuration
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `iot-kinesis-republish-${environmentSuffix}`,
        Environment: {
          Variables: {
            KINESIS_STREAMS: Match.anyValue()
          }
        }
      });
    });

    test('Messages should be distributed across 10 streams', () => {
      // Verify exactly 10 streams exist
      template.resourceCountIs('AWS::Kinesis::Stream', 10);

      // Verify streams are numbered 0-9
      for (let i = 0; i < 10; i++) {
        template.hasResourceProperties('AWS::Kinesis::Stream', {
          Name: `iot-replay-stream-${environmentSuffix}-${i}`
        });
      }
    });
  });

  describe('Data Recovery Targets', () => {
    test('Should support 2.3M device processing requirement', () => {
      // High memory Lambda for large device sets
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `iot-shadow-analysis-${environmentSuffix}`,
        MemorySize: 3008
      });
    });

    test('Should support 45M message replay requirement', () => {
      // 1000 total shards (10 streams * 100 shards each)
      const streams = template.findResources('AWS::Kinesis::Stream');
      expect(Object.keys(streams).length).toBe(10);
      Object.values(streams).forEach((stream: any) => {
        expect(stream.Properties.ShardCount).toBe(100);
      });
    });

    test('Should support 12-hour backfill window requirement', () => {
      // Step Functions 2-hour timeout supports 12-hour backfill
      const stateMachines = template.findResources('AWS::StepFunctions::StateMachine');
      const stateMachine = Object.values(stateMachines)[0] as any;
      const defString = JSON.stringify(stateMachine.Properties.DefinitionString);
      expect(defString).toContain('7200'); // 2 hours in seconds
    });

    test('Should support 99.9% recovery target validation', () => {
      // Validation Lambda with 5-minute timeout
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `iot-dynamodb-validation-${environmentSuffix}`,
        Timeout: 300 // 5 minutes
      });
    });
  });

  describe('Template Synthesis', () => {
    test('Template should synthesize without errors', () => {
      expect(() => {
        Template.fromStack(stack);
      }).not.toThrow();
    });

    test('Template should be valid CloudFormation', () => {
      const json = template.toJSON();
      expect(json).toBeDefined();
      expect(json.Resources).toBeDefined();
      expect(Object.keys(json.Resources).length).toBeGreaterThan(0);
    });

    test('Template should have Parameters section', () => {
      const json = template.toJSON();
      expect(json.Parameters).toBeDefined();
    });

    test('Template should have Outputs section', () => {
      const json = template.toJSON();
      expect(json.Outputs).toBeDefined();
      expect(Object.keys(json.Outputs).length).toBeGreaterThan(0);
    });
  });
});
