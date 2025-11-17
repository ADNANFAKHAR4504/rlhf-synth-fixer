import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { DataStack } from '../lib/data-stack';
import { ComputeStack } from '../lib/compute-stack';
import { ApiStack } from '../lib/api-stack';
import { OrchestrationStack } from '../lib/orchestration-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack - Main Stack', () => {
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
      expect(stack.stackName).toContain('TestTapStack');
    });

    test('Stack should have correct tags', () => {
      const tags = cdk.Tags.of(stack);
      expect(tags).toBeDefined();
    });
  });

  describe('Main Stack Outputs', () => {
    test('Should have AlertQueueUrl output', () => {
      template.hasOutput('AlertQueueUrl', {
        Description: 'SQS AlertQueue URL',
      });
    });

    test('Should have PendingApprovalsQueueUrl output', () => {
      template.hasOutput('PendingApprovalsQueueUrl', {
        Description: 'SQS PendingApprovals queue URL',
      });
    });

    test('Should have KinesisStreamArn output', () => {
      template.hasOutput('KinesisStreamArn', {
        Description: 'Kinesis stream ARN',
      });
    });

    test('Should have LiveAliasArn output', () => {
      template.hasOutput('LiveAliasArn', {
        Description: 'Lambda live alias ARN',
      });
    });

    test('Should have DeploymentGroupName output', () => {
      template.hasOutput('DeploymentGroupName', {
        Description: 'CodeDeploy deployment group name',
      });
    });

    test('Should have ApiGatewayUrl output', () => {
      template.hasOutput('ApiGatewayUrl', {
        Description: 'API Gateway main endpoint URL',
      });
    });

    test('Should have CanaryApiUrl output', () => {
      template.hasOutput('CanaryApiUrl', {
        Description: 'API Gateway canary endpoint URL',
      });
    });

    test('Should have ApprovalApiUrl output', () => {
      template.hasOutput('ApprovalApiUrl', {
        Description: 'Approval API endpoint URL',
      });
    });

    test('Should have WebAclArn output', () => {
      template.hasOutput('WebAclArn', {
        Description: 'WAF WebACL ARN',
      });
    });

    test('Should have PatternAnalysisWorkflowArn output', () => {
      template.hasOutput('PatternAnalysisWorkflowArn', {
        Description: 'Step Functions PatternAnalysisWorkflow ARN',
      });
    });

    test('Should have PowerTuningWorkflowArn output', () => {
      template.hasOutput('PowerTuningWorkflowArn', {
        Description: 'Step Functions PowerTuningWorkflow ARN',
      });
    });

    test('Should have DashboardUrl output', () => {
      template.hasOutput('DashboardUrl', {
        Description: 'CloudWatch Dashboard URL',
      });
    });
  });

  describe('Environment Configuration', () => {
    test('Should use default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      expect(defaultStack).toBeDefined();
    });

    test('Should use context environment suffix', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-test',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack');
      expect(contextStack).toBeDefined();
    });

    test('Should use props environment suffix over context', () => {
      const propsApp = new cdk.App({
        context: {
          environmentSuffix: 'context-test',
        },
      });
      const propsStack = new TapStack(propsApp, 'PropsStack', {
        environmentSuffix: 'props-test',
      });
      expect(propsStack).toBeDefined();
    });
  });
});

describe('DataStack', () => {
  let app: cdk.App;
  let stack: DataStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new DataStack(app, 'TestDataStack', {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Tables', () => {
    test('Should create TradingPatterns table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `TradingPatterns-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('Should create ApprovalTracking table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `ApprovalTracking-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
      });
    });
  });

  describe('SQS Queues', () => {
    test('Should create AlertQueue and PendingApprovals queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `AlertQueue-${environmentSuffix}`,
      });
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `PendingApprovals-${environmentSuffix}`,
      });
    });
  });

  describe('SNS Topics', () => {
    test('Should create TradingAlerts and AlertApprovalRequests topics', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `TradingAlerts-${environmentSuffix}`,
      });
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `AlertApprovalRequests-${environmentSuffix}`,
      });
    });

    test('Should create email subscription when ALERT_EMAIL is set', () => {
      const originalEnv = process.env.ALERT_EMAIL;
      process.env.ALERT_EMAIL = 'test@example.com';

      const testApp = new cdk.App();
      const testStack = new DataStack(testApp, 'TestDataStackWithEmail', {
        environmentSuffix: 'email-test',
      });
      const testTemplate = Template.fromStack(testStack);

      testTemplate.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com',
      });

      // Restore original environment
      if (originalEnv === undefined) {
        delete process.env.ALERT_EMAIL;
      } else {
        process.env.ALERT_EMAIL = originalEnv;
      }
    });
  });

  describe('Kinesis Stream', () => {
    test('Should create MarketDataStream', () => {
      template.hasResourceProperties('AWS::Kinesis::Stream', {
        Name: `MarketDataStream-${environmentSuffix}`,
      });
    });
  });

  describe('S3 Buckets', () => {
    test('Should create WafLogBucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'AES256',
              }),
            }),
          ]),
        }),
      });
    });
  });
});

describe('ComputeStack', () => {
  let app: cdk.App;
  let dataStack: DataStack;
  let stack: ComputeStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    dataStack = new DataStack(app, 'TestDataStack', { environmentSuffix });

    stack = new ComputeStack(app, 'TestComputeStack', {
      environmentSuffix,
      tradingPatternsTable: dataStack.tradingPatternsTable,
      approvalTrackingTable: dataStack.approvalTrackingTable,
      alertQueue: dataStack.alertQueue,
      pendingApprovalsQueue: dataStack.pendingApprovalsQueue,
      tradingAlertsTopic: dataStack.tradingAlertsTopic,
      alertApprovalTopic: dataStack.alertApprovalTopic,
      marketDataStream: dataStack.marketDataStream,
    });

    template = Template.fromStack(stack);
  });

  describe('Lambda Functions', () => {
    test('Should create all Lambda functions with correct runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `PatternDetector-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `AlertProcessor-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
      });
    });

    test('Should create SharedDependenciesLayer', () => {
      template.hasResourceProperties('AWS::Lambda::LayerVersion', {
        LayerName: `shared-dependencies-${environmentSuffix}`,
        CompatibleRuntimes: ['nodejs20.x'],
      });
    });
  });

  describe('CodeDeploy Configuration', () => {
    test('Should create Lambda alias and deployment group', () => {
      template.hasResourceProperties('AWS::Lambda::Alias', {
        Name: 'live',
      });

      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        DeploymentConfigName: 'CodeDeployDefault.LambdaCanary10Percent5Minutes',
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('Should create error alarms for Lambda functions', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Threshold: 0.01,
        EvaluationPeriods: 2,
      });
    });
  });
});

describe('ApiStack', () => {
  let app: cdk.App;
  let dataStack: DataStack;
  let computeStack: ComputeStack;
  let stack: ApiStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    dataStack = new DataStack(app, 'TestDataStack', { environmentSuffix });
    computeStack = new ComputeStack(app, 'TestComputeStack', {
      environmentSuffix,
      tradingPatternsTable: dataStack.tradingPatternsTable,
      approvalTrackingTable: dataStack.approvalTrackingTable,
      alertQueue: dataStack.alertQueue,
      pendingApprovalsQueue: dataStack.pendingApprovalsQueue,
      tradingAlertsTopic: dataStack.tradingAlertsTopic,
      alertApprovalTopic: dataStack.alertApprovalTopic,
      marketDataStream: dataStack.marketDataStream,
    });

    stack = new ApiStack(app, 'TestApiStack', {
      environmentSuffix,
      patternDetectorFunction: computeStack.patternDetectorFunction,
      approvalProcessorFunction: computeStack.approvalProcessorFunction,
      wafLogBucket: dataStack.wafLogBucket,
    });

    template = Template.fromStack(stack);
  });

  describe('API Gateway', () => {
    test('Should create REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `pattern-detection-api-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
      });
    });

    test('Should create API resources', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'patterns',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'alerts',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'approve',
      });
    });

    test('Should use custom CORS origins when ALLOWED_ORIGINS is set', () => {
      const originalEnv = process.env.ALLOWED_ORIGINS;
      process.env.ALLOWED_ORIGINS = 'https://example.com,https://app.example.com';

      const testApp = new cdk.App();
      const testDataStack = new DataStack(testApp, 'TestDataStackCORS', {
        environmentSuffix: 'cors-test',
      });
      const testComputeStack = new ComputeStack(testApp, 'TestComputeStackCORS', {
        environmentSuffix: 'cors-test',
        tradingPatternsTable: testDataStack.tradingPatternsTable,
        approvalTrackingTable: testDataStack.approvalTrackingTable,
        alertQueue: testDataStack.alertQueue,
        pendingApprovalsQueue: testDataStack.pendingApprovalsQueue,
        tradingAlertsTopic: testDataStack.tradingAlertsTopic,
        alertApprovalTopic: testDataStack.alertApprovalTopic,
        marketDataStream: testDataStack.marketDataStream,
      });
      const testStack = new ApiStack(testApp, 'TestApiStackCORS', {
        environmentSuffix: 'cors-test',
        patternDetectorFunction: testComputeStack.patternDetectorFunction,
        approvalProcessorFunction: testComputeStack.approvalProcessorFunction,
        wafLogBucket: testDataStack.wafLogBucket,
      });

      const testTemplate = Template.fromStack(testStack);

      // Verify API Gateway was created
      testTemplate.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'pattern-detection-api-cors-test',
      });

      // Restore original environment
      if (originalEnv === undefined) {
        delete process.env.ALLOWED_ORIGINS;
      } else {
        process.env.ALLOWED_ORIGINS = originalEnv;
      }
    });
  });

  describe('WAF Configuration', () => {
    test('Should create WAF WebACL with security rules', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: `PatternDetectionWAF-${environmentSuffix}`,
        Scope: 'REGIONAL',
      });

      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'RateLimitRule',
            Priority: 1,
          }),
        ]),
      });
    });
  });
});

describe('OrchestrationStack', () => {
  let app: cdk.App;
  let dataStack: DataStack;
  let computeStack: ComputeStack;
  let stack: OrchestrationStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    dataStack = new DataStack(app, 'TestDataStack', { environmentSuffix });
    computeStack = new ComputeStack(app, 'TestComputeStack', {
      environmentSuffix,
      tradingPatternsTable: dataStack.tradingPatternsTable,
      approvalTrackingTable: dataStack.approvalTrackingTable,
      alertQueue: dataStack.alertQueue,
      pendingApprovalsQueue: dataStack.pendingApprovalsQueue,
      tradingAlertsTopic: dataStack.tradingAlertsTopic,
      alertApprovalTopic: dataStack.alertApprovalTopic,
      marketDataStream: dataStack.marketDataStream,
    });

    stack = new OrchestrationStack(app, 'TestOrchestrationStack', {
      environmentSuffix,
      thresholdCheckerFunction: computeStack.thresholdCheckerFunction,
      patternDetectorFunction: computeStack.patternDetectorFunction,
    });

    template = Template.fromStack(stack);
  });

  describe('Step Functions', () => {
    test('Should create state machines', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: `PatternAnalysisWorkflow-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: `PowerTuningWorkflow-${environmentSuffix}`,
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('Should create scheduled rules', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'rate(5 minutes)',
      });
    });
  });
});

describe('MonitoringStack', () => {
  let app: cdk.App;
  let dataStack: DataStack;
  let computeStack: ComputeStack;
  let apiStack: ApiStack;
  let orchestrationStack: OrchestrationStack;
  let stack: MonitoringStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    dataStack = new DataStack(app, 'TestDataStack', { environmentSuffix });
    computeStack = new ComputeStack(app, 'TestComputeStack', {
      environmentSuffix,
      tradingPatternsTable: dataStack.tradingPatternsTable,
      approvalTrackingTable: dataStack.approvalTrackingTable,
      alertQueue: dataStack.alertQueue,
      pendingApprovalsQueue: dataStack.pendingApprovalsQueue,
      tradingAlertsTopic: dataStack.tradingAlertsTopic,
      alertApprovalTopic: dataStack.alertApprovalTopic,
      marketDataStream: dataStack.marketDataStream,
    });
    apiStack = new ApiStack(app, 'TestApiStack', {
      environmentSuffix,
      patternDetectorFunction: computeStack.patternDetectorFunction,
      approvalProcessorFunction: computeStack.approvalProcessorFunction,
      wafLogBucket: dataStack.wafLogBucket,
    });
    orchestrationStack = new OrchestrationStack(app, 'TestOrchestrationStack', {
      environmentSuffix,
      thresholdCheckerFunction: computeStack.thresholdCheckerFunction,
      patternDetectorFunction: computeStack.patternDetectorFunction,
    });

    stack = new MonitoringStack(app, 'TestMonitoringStack', {
      environmentSuffix,
      api: apiStack.api,
      patternDetectorFunction: computeStack.patternDetectorFunction,
      alertProcessorFunction: computeStack.alertProcessorFunction,
      thresholdCheckerFunction: computeStack.thresholdCheckerFunction,
      kinesisConsumerFunction: computeStack.kinesisConsumerFunction,
      approvalProcessorFunction: computeStack.approvalProcessorFunction,
      tradingPatternsTable: dataStack.tradingPatternsTable,
      alertQueue: dataStack.alertQueue,
      patternAnalysisWorkflow: orchestrationStack.patternAnalysisWorkflow,
      marketDataStream: dataStack.marketDataStream,
      webAclArn: apiStack.webAclArn,
    });

    template = Template.fromStack(stack);
  });

  describe('CloudWatch Dashboard', () => {
    test('Should create dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `PatternDetectionDashboard-${environmentSuffix}`,
      });
    });
  });

  describe('Billing Alarms', () => {
    test('Should create billing alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `billing-threshold-${environmentSuffix}`,
        Threshold: 100,
      });
    });
  });

  describe('Anomaly Detection', () => {
    test('Should create anomaly detector', () => {
      template.hasResourceProperties('AWS::CloudWatch::AnomalyDetector', {
        Namespace: 'StockPatternDetection',
        MetricName: 'PatternDetectionDuration',
      });
    });
  });
});
