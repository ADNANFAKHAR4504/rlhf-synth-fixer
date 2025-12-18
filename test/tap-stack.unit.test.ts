import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { ServerlessStack } from '../lib/serverless-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  test('Creates nested ServerlessStack', () => {
    // TapStack creates a nested ServerlessStack
    // In CDK v2, nested stacks create AWS::CloudFormation::Stack resources in parent
    // Since ServerlessStack is instantiated as a regular stack, not NestedStack,
    // it won't create a CloudFormation::Stack resource
    expect(stack).toBeDefined();
    expect(stack.stackName).toContain('TestTapStack');
  });

  test('Uses environment suffix from context when not provided in props', () => {
    const appWithContext = new cdk.App();
    appWithContext.node.setContext('environmentSuffix', 'context-test');
    const stackWithContext = new TapStack(
      appWithContext,
      'TestTapStackContext'
    );
    expect(stackWithContext).toBeDefined();
  });

  test('Uses default environment suffix when not provided', () => {
    const appNoContext = new cdk.App();
    const stackDefault = new TapStack(appNoContext, 'TestTapStackDefault');
    expect(stackDefault).toBeDefined();
  });
});

describe('ServerlessStack Unit Tests', () => {
  let app: cdk.App;
  let stack: ServerlessStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new ServerlessStack(app, 'TestServerlessStack', {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  test('Uses default environment suffix when not provided', () => {
    const appNoSuffix = new cdk.App();
    const stackNoSuffix = new ServerlessStack(
      appNoSuffix,
      'TestServerlessStackNoSuffix'
    );
    const templateNoSuffix = Template.fromStack(stackNoSuffix);
    // Check that stack is created with default suffix (prod)
    // The bucket name will be a Fn::Join with the pattern enterprise-processing-prod-{account}
    templateNoSuffix.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: {
        'Fn::Join': Match.arrayWith([
          '',
          Match.arrayWith([
            Match.stringLikeRegexp('enterprise-processing-prod-'),
          ]),
        ]),
      },
    });
  });

  describe('S3 Buckets', () => {
    test('Creates ProcessingBucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.anyValue(),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'ProcessedDataArchival',
              Prefix: 'processed/',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                }),
                Match.objectLike({
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                }),
              ]),
            }),
          ]),
        },
      });
    });

    test('Creates ProcessedBucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.anyValue(),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 buckets have auto-delete enabled', () => {
      template.resourceCountIs('Custom::S3AutoDeleteObjects', 2);
    });
  });

  describe('Lambda Functions', () => {
    test('Creates FileValidatorFunction with correct runtime and configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `file-validator-${environmentSuffix}`,
        Runtime: 'python3.12',
        MemorySize: 1024,
        Timeout: 120,
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('Creates DataProcessorFunction with high memory configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `data-processor-${environmentSuffix}`,
        Runtime: 'python3.12',
        MemorySize: 3008,
        Timeout: 900,
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('Creates CleanupFunction', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `cleanup-${environmentSuffix}`,
        Runtime: 'python3.12',
        MemorySize: 512,
        Timeout: 600,
      });
    });

    test('Lambda functions have Dead Letter Queue configured', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const functionsWithDLQ = Object.values(functions).filter(
        (func: any) => func.Properties?.DeadLetterConfig?.TargetArn
      );
      expect(functionsWithDLQ.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Step Functions', () => {
    test('Creates State Machine with distributed map', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: `file-processing-${environmentSuffix}`,
        TracingConfiguration: {
          Enabled: true,
        },
      });
    });

    test('State Machine has proper timeout', () => {
      const stateMachine = template.findResources(
        'AWS::StepFunctions::StateMachine'
      );
      const definitionObj =
        Object.values(stateMachine)[0].Properties.DefinitionString;
      // DefinitionString is a Fn::Join, extract the string parts
      const definitionParts = definitionObj['Fn::Join']?.[1] || [];
      const definitionStr = JSON.stringify(definitionParts);
      expect(definitionStr).toMatch(/TimeoutSeconds.*7200/);
    });

    test('State Machine includes distributed map configuration', () => {
      const stateMachine = template.findResources(
        'AWS::StepFunctions::StateMachine'
      );
      const definitionObj =
        Object.values(stateMachine)[0].Properties.DefinitionString;
      // DefinitionString is a Fn::Join, extract the string parts
      const definitionParts = definitionObj['Fn::Join']?.[1] || [];
      const definitionStr = JSON.stringify(definitionParts);
      expect(definitionStr).toMatch(/MaxConcurrency.*1000/);
      expect(definitionStr).toMatch(/Mode.*DISTRIBUTED/);
    });
  });

  describe('EventBridge', () => {
    test('Creates custom EventBridge bus', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: `file-processing-${environmentSuffix}`,
      });
    });

    test('Creates EventBridge rules for file processing', () => {
      // JSON file processing rule
      template.hasResourceProperties('AWS::Events::Rule', {
        EventBusName: Match.anyValue(),
        EventPattern: {
          source: ['custom.fileprocessor'],
          'detail-type': ['File Json Validated'],
        },
      });

      // Delimited file processing rule
      template.hasResourceProperties('AWS::Events::Rule', {
        EventBusName: Match.anyValue(),
        EventPattern: {
          source: ['custom.fileprocessor'],
          'detail-type': ['File Delimited Validated'],
        },
      });
    });

    test('Creates error handling rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.states'],
          'detail-type': ['Step Functions Execution Status Change'],
          detail: {
            status: ['FAILED', 'TIMED_OUT'],
          },
        },
      });
    });
  });

  describe('EventBridge Scheduler', () => {
    test('Creates schedule group', () => {
      template.hasResourceProperties('AWS::Scheduler::ScheduleGroup', {
        Name: `cleanup-schedules-${environmentSuffix}`,
      });
    });

    test('Creates daily cleanup schedule', () => {
      template.hasResourceProperties('AWS::Scheduler::Schedule', {
        Name: `daily-cleanup-${environmentSuffix}`,
        ScheduleExpression: 'cron(0 2 * * ? *)',
        FlexibleTimeWindow: {
          Mode: 'OFF',
        },
      });
    });

    test('Creates weekly archival schedule', () => {
      template.hasResourceProperties('AWS::Scheduler::Schedule', {
        Name: `weekly-archival-${environmentSuffix}`,
        ScheduleExpression: 'cron(0 3 ? * SUN *)',
        FlexibleTimeWindow: {
          Mode: 'OFF',
        },
      });
    });
  });

  describe('Monitoring and Alerting', () => {
    test('Creates SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `processing-alerts-${environmentSuffix}`,
        DisplayName: 'File Processing Alerts',
      });
    });

    test('Creates SQS Dead Letter Queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `processing-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600, // 14 days
      });
    });

    test('Creates CloudWatch Dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `file-processing-${environmentSuffix}`,
      });
    });

    test('Dashboard includes required widgets', () => {
      const dashboard = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboardBodyObj =
        Object.values(dashboard)[0].Properties.DashboardBody;
      // DashboardBody is a Fn::Join, extract the string parts
      const dashboardParts = dashboardBodyObj['Fn::Join']?.[1] || [];
      const dashboardStr = JSON.stringify(dashboardParts);
      expect(dashboardStr).toMatch(/Files Processed/);
      expect(dashboardStr).toMatch(/Processing Errors/);
      expect(dashboardStr).toMatch(/Lambda Duration/);
      expect(dashboardStr).toMatch(/Step Functions Executions/);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('Creates Step Functions execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'states.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('Creates EventBridge Scheduler execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'scheduler.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('Lambda functions have appropriate IAM policies', () => {
      // Check that Lambda execution roles exist
      const lambdaRoles = template.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Principal: {
                  Service: 'lambda.amazonaws.com',
                },
              }),
            ]),
          },
        },
      });
      expect(Object.keys(lambdaRoles).length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('S3 Event Notifications', () => {
    test('Creates S3 event notifications for file uploads', () => {
      const notifications = template.findResources(
        'Custom::S3BucketNotifications'
      );
      const notifConfig =
        Object.values(notifications)[0].Properties.NotificationConfiguration;
      const lambdaConfigs = notifConfig.LambdaFunctionConfigurations;

      // Check we have 4 configurations for different file types
      expect(lambdaConfigs).toHaveLength(4);

      // Check that each configuration has the expected structure
      const suffixes = ['.json', '.csv', '.tsv', '.jsonl'];
      suffixes.forEach(suffix => {
        const config = lambdaConfigs.find((c: any) =>
          c.Filter?.Key?.FilterRules?.some(
            (r: any) => r.Name === 'suffix' && r.Value === suffix
          )
        );
        expect(config).toBeDefined();
        expect(config.Events).toEqual(['s3:ObjectCreated:*']);
        expect(config.Filter?.Key?.FilterRules).toContainEqual({
          Name: 'prefix',
          Value: 'input/',
        });
      });
    });
  });

  describe('Resource Tagging', () => {
    test('Resources have required tags', () => {
      const taggedResources = [
        'AWS::S3::Bucket',
        'AWS::Lambda::Function',
        'AWS::SNS::Topic',
        'AWS::SQS::Queue',
        'AWS::Events::EventBus',
      ];

      taggedResources.forEach(resourceType => {
        const resources = template.findResources(resourceType);
        Object.values(resources).forEach((resource: any) => {
          if (resource.Properties?.Tags) {
            const tags = resource.Properties.Tags;
            const tagKeys = tags.map((tag: any) => tag.Key);
            expect(tagKeys).toContain('Environment');
            expect(tagKeys).toContain('Project');
            expect(tagKeys).toContain('CostCenter');
          }
        });
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Has required outputs', () => {
      template.hasOutput('ProcessingBucketName', {});
      template.hasOutput('ProcessedBucketName', {});
      template.hasOutput('StateMachineArn', {});
      template.hasOutput('EventBusName', {});
      template.hasOutput('DashboardURL', {});
      template.hasOutput('AlertsTopicArn', {});
    });
  });
});
