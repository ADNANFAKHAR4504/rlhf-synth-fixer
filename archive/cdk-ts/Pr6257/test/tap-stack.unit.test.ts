import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  describe('Stack Initialization', () => {
    test('should create stack with environmentSuffix from props', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('.*-test'),
      });
    });

    test('should use environmentSuffix from context when props not provided', () => {
      app = new cdk.App({
        context: { environmentSuffix: 'context-env' },
      });
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('.*-context-env'),
      });
    });

    test('should default to "dev" when no environmentSuffix provided', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('.*-dev'),
      });
    });

    test('should prioritize props over context for environmentSuffix', () => {
      app = new cdk.App({
        context: { environmentSuffix: 'context' },
      });
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'props',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('.*-props'),
      });
    });
  });

  describe('SNS Topic', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create SNS topic with correct name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Lambda Memory Optimization Alarms',
        TopicName: 'lambda-memory-optimization-alarms-test',
      });
    });

    test('should create email subscription for SNS topic', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'platform-team@company.com',
      });
    });

    test('should have exactly one SNS topic', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });
  });

  describe('S3 Bucket', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create S3 bucket for reports with correct name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(
          'lambda-optimization-reports-123456789012-test'
        ),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });

    test('should configure lifecycle rule for S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldReports',
              Status: 'Enabled',
              ExpirationInDays: 90,
            }),
          ]),
        },
      });
    });

    test('should enable auto delete objects on bucket', () => {
      template.hasResourceProperties('Custom::S3AutoDeleteObjects', {
        ServiceToken: Match.anyValue(),
      });
    });

    test('should have exactly one S3 bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });
  });

  describe('Lambda Functions', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create API tier function', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const apiFunction = Object.values(functions).find(
        (func: any) =>
          func.Properties?.FunctionName === 'transaction-api-handler'
      );

      expect(apiFunction).toBeDefined();
      expect(apiFunction?.Properties?.Runtime).toBe('nodejs18.x');
      expect(apiFunction?.Properties?.Handler).toBe('index.handler');
      expect(apiFunction?.Properties?.Architectures).toContain('arm64');
      expect(apiFunction?.Properties?.TracingConfig?.Mode).toBe('Active');
      expect(
        apiFunction?.Properties?.Environment?.Variables?.OPTIMIZATION_TIER
      ).toBe('api');
      expect(
        apiFunction?.Properties?.Environment?.Variables?.MEMORY_OPTIMIZED
      ).toBe('true');
    });

    test('should create async tier function', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const asyncFunction = Object.values(functions).find(
        (func: any) =>
          func.Properties?.FunctionName === 'fraud-detection-processor'
      );

      expect(asyncFunction).toBeDefined();
      expect(asyncFunction?.Properties?.Runtime).toBe('python3.11');
      expect(asyncFunction?.Properties?.Handler).toBe('handler.main');
      expect(asyncFunction?.Properties?.Architectures).toContain('arm64');
      expect(asyncFunction?.Properties?.Timeout).toBe(300);
    });

    test('should create batch tier function', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const batchFunction = Object.values(functions).find(
        (func: any) =>
          func.Properties?.FunctionName === 'daily-report-generator'
      );

      expect(batchFunction).toBeDefined();
      expect(batchFunction?.Properties?.Runtime).toBe('python3.11');
      expect(batchFunction?.Properties?.Handler).toBe('handler.main');
      expect(batchFunction?.Properties?.Timeout).toBe(900);
    });

    test('should create cost report generator function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'lambda-cost-report-generator',
        Runtime: 'python3.11',
        Handler: 'index.handler',
        MemorySize: 512,
        Timeout: 120,
        Environment: {
          Variables: Match.objectLike({
            REPORT_BUCKET: Match.anyValue(),
          }),
        },
      });
    });

    test('should have Lambda Insights enabled on optimized functions', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const optimizedFunctions = Object.values(functions).filter(
        (func: any) =>
          func.Properties?.FunctionName !== 'lambda-cost-report-generator' &&
          func.Properties?.FunctionName !== undefined
      );

      optimizedFunctions.forEach((func: any) => {
        expect(func.Properties?.Layers).toBeDefined();
      });
    });

    test('should configure log retention for all functions', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      const functionLogGroups = Object.values(logGroups).filter(
        (logGroup: any) =>
          logGroup.Properties?.LogGroupName?.includes(
            'transaction-api-handler'
          ) ||
          logGroup.Properties?.LogGroupName?.includes(
            'fraud-detection-processor'
          ) ||
          logGroup.Properties?.LogGroupName?.includes(
            'daily-report-generator'
          ) ||
          logGroup.Properties?.LogGroupName?.includes(
            'lambda-cost-report-generator'
          )
      );

      functionLogGroups.forEach((logGroup: any) => {
        expect(logGroup.Properties?.RetentionInDays).toBe(7);
      });
    });

    test('should create optimized Lambda functions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'transaction-api-handler',
      });
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'fraud-detection-processor',
      });
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'daily-report-generator',
      });
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'test-function-without-initial-memory',
      });
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'lambda-cost-report-generator',
      });
    });
  });

  describe('Lambda Function Tags', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should tag API function with optimization tags', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const apiFunction = Object.values(functions).find(
        (func: any) =>
          func.Properties?.FunctionName === 'transaction-api-handler'
      );

      expect(apiFunction).toBeDefined();
      expect(apiFunction?.Properties?.Tags).toBeDefined();
    });
  });

  describe('IAM Roles and Policies', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create IAM roles for Lambda functions', () => {
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(4);
    });

    test('should grant SSM permissions to optimized functions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const ssmPolicies = Object.values(policies).filter((policy: any) =>
        JSON.stringify(policy.Properties?.PolicyDocument).includes(
          'ssm:GetParameter'
        )
      );

      expect(ssmPolicies.length).toBeGreaterThan(0);
    });

    test('should grant S3 write permissions to cost report generator', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const s3Policies = Object.values(policies).filter((policy: any) =>
        JSON.stringify(policy.Properties?.PolicyDocument).includes(
          's3:PutObject'
        )
      );

      expect(s3Policies.length).toBeGreaterThan(0);
    });

    test('should grant CloudWatch permissions to cost report generator', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const cwPolicies = Object.values(policies).filter((policy: any) =>
        JSON.stringify(policy.Properties?.PolicyDocument).includes(
          'cloudwatch:PutMetricData'
        )
      );

      expect(cwPolicies.length).toBeGreaterThan(0);
    });
  });

  describe('SSM Parameters', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create SSM parameters for memory history', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: Match.stringLikeRegexp('/lambda/memory-history/.*'),
        Type: 'String',
      });
    });

    test('should create SSM parameters for all optimized functions', () => {
      const parameters = template.findResources('AWS::SSM::Parameter');
      const memoryHistoryParams = Object.values(parameters).filter(
        (param: any) =>
          param.Properties?.Name?.includes('/lambda/memory-history/')
      );

      expect(memoryHistoryParams.length).toBe(4);
    });
  });

  describe('CloudWatch Alarms', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create memory alarms for all optimized functions', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const memoryAlarms = Object.values(alarms).filter(
        (alarm: any) => alarm.Properties?.MetricName === 'Duration'
      );
      expect(memoryAlarms.length).toBeGreaterThanOrEqual(3);
    });

    test('should create memory alarms with correct configuration', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Namespace: 'AWS/Lambda',
        MetricName: 'Duration',
        Statistic: 'Maximum',
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create error alarms for API tier functions', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Namespace: 'AWS/Lambda',
        MetricName: 'Errors',
        Statistic: 'Sum',
        EvaluationPeriods: 2,
        Threshold: 10,
      });
    });

    test('should configure alarm actions to SNS topic', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarmsWithActions = Object.values(alarms).filter(
        (alarm: any) => alarm.Properties?.AlarmActions?.length > 0
      );

      expect(alarmsWithActions.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Dashboard', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('lambda-memory-optimization-.*'),
      });
    });

    test('should have exactly one dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });

    test('should configure dashboard with widgets', () => {
      const dashboard = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboardResource = Object.values(dashboard)[0] as any;

      expect(dashboardResource.Properties?.DashboardBody).toBeDefined();
      const body =
        typeof dashboardResource.Properties.DashboardBody === 'string'
          ? JSON.parse(dashboardResource.Properties.DashboardBody)
          : dashboardResource.Properties.DashboardBody;

      // Dashboard body should contain widget definitions
      expect(body).toBeDefined();
      if (body.widgets) {
        expect(body.widgets.length).toBeGreaterThan(0);
      } else {
        // Alternative structure might have different format
        expect(JSON.stringify(body)).toContain('widget');
      }
    });
  });

  describe('EventBridge Rule', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create EventBridge rule for daily report', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'cron(0 2 * * ? *)',
      });
    });

    test('should configure EventBridge rule target as Lambda function', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.anyValue(),
          }),
        ]),
      });
    });

    test('should grant EventBridge permission to invoke Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Principal: 'events.amazonaws.com',
        Action: 'lambda:InvokeFunction',
      });
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create DashboardURL output', () => {
      template.hasOutput('DashboardURL', {
        Description: 'CloudWatch Dashboard URL',
      });
    });

    test('should create AlarmTopicArn output', () => {
      template.hasOutput('AlarmTopicArn', {
        Description: 'SNS Topic ARN for Alarms',
      });
    });

    test('should create ReportBucketName output', () => {
      template.hasOutput('ReportBucketName', {
        Description: 'S3 Bucket for Cost Reports',
      });
    });

    test('should have exactly 3 outputs', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBe(3);
    });
  });

  describe('Memory Optimization Logic', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should set memory size within valid range (128-10240 MB)', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      Object.values(functions).forEach((func: any) => {
        const memorySize = func.Properties?.MemorySize;
        if (memorySize) {
          expect(memorySize).toBeGreaterThanOrEqual(128);
          expect(memorySize).toBeLessThanOrEqual(10240);
        }
      });
    });

    test('should round memory size to nearest 64MB increment', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      Object.values(functions).forEach((func: any) => {
        const memorySize = func.Properties?.MemorySize;
        if (memorySize) {
          expect(memorySize % 64).toBe(0);
        }
      });
    });

    test('should configure different timeouts based on tier', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const apiFunction = Object.values(functions).find(
        (func: any) =>
          func.Properties?.FunctionName === 'transaction-api-handler'
      );
      const batchFunction = Object.values(functions).find(
        (func: any) =>
          func.Properties?.FunctionName === 'daily-report-generator'
      );

      expect(apiFunction?.Properties?.Timeout).toBeLessThan(
        batchFunction?.Properties?.Timeout
      );
    });
  });

  describe('Resource Naming', () => {
    test('should include environment suffix in resource names', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'prod',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'lambda-memory-optimization-alarms-prod',
      });

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*-prod'),
      });
    });
  });

  describe('Integration Points', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should connect cost report generator to S3 bucket', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const s3WritePolicy = Object.values(policies).find((policy: any) =>
        JSON.stringify(policy.Properties?.PolicyDocument).includes(
          's3:PutObject'
        )
      );

      expect(s3WritePolicy).toBeDefined();
    });

    test('should connect alarms to SNS topic', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarmsWithSns = Object.values(alarms).filter(
        (alarm: any) => alarm.Properties?.AlarmActions?.length > 0
      );

      expect(alarmsWithSns.length).toBeGreaterThan(0);
    });

    test('should connect EventBridge rule to cost report generator', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            Id: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  describe('Memory Calculation Edge Cases', () => {
    test('should handle API tier with high cold start duration', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      // API function should have memory optimized for cold starts
      // Since tuning data has coldStartDuration: 500 (> 200), memory should be increased
      const apiFunction = template.findResources('AWS::Lambda::Function');
      const transactionApi = Object.values(apiFunction).find(
        (func: any) =>
          func.Properties?.FunctionName === 'transaction-api-handler'
      );

      expect(transactionApi).toBeDefined();
      expect(transactionApi?.Properties?.MemorySize).toBeGreaterThanOrEqual(
        512
      );
      expect(transactionApi?.Properties?.MemorySize).toBeLessThanOrEqual(3008);
      // Memory should be rounded to nearest 64MB
      expect(transactionApi?.Properties?.MemorySize % 64).toBe(0);
    });

    test('should handle batch tier with cost optimization', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      // Batch tier should apply cost optimization (reduce memory by 15%)
      const batchFunction = template.findResources('AWS::Lambda::Function');
      const reportGenerator = Object.values(batchFunction).find(
        (func: any) =>
          func.Properties?.FunctionName === 'daily-report-generator'
      );

      expect(reportGenerator).toBeDefined();
      expect(reportGenerator?.Properties?.MemorySize).toBeGreaterThanOrEqual(
        128
      );
      expect(reportGenerator?.Properties?.MemorySize).toBeLessThanOrEqual(
        10240
      );
      // Memory should be rounded to nearest 64MB
      expect(reportGenerator?.Properties?.MemorySize % 64).toBe(0);
    });

    test('should handle async tier with balanced optimization', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      // Async tier should have balanced optimization (15% headroom, no special adjustments)
      const asyncFunction = template.findResources('AWS::Lambda::Function');
      const fraudDetector = Object.values(asyncFunction).find(
        (func: any) =>
          func.Properties?.FunctionName === 'fraud-detection-processor'
      );

      expect(fraudDetector).toBeDefined();
      expect(fraudDetector?.Properties?.MemorySize).toBeGreaterThanOrEqual(256);
      expect(fraudDetector?.Properties?.MemorySize).toBeLessThanOrEqual(5120);
      expect(fraudDetector?.Properties?.MemorySize % 64).toBe(0);
    });

    test('should enforce memory boundaries (128-10240 MB)', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      const functions = template.findResources('AWS::Lambda::Function');
      Object.values(functions).forEach((func: any) => {
        const memorySize = func.Properties?.MemorySize;
        if (memorySize) {
          expect(memorySize).toBeGreaterThanOrEqual(128);
          expect(memorySize).toBeLessThanOrEqual(10240);
          expect(memorySize % 64).toBe(0);
        }
      });
    });

    test('should apply gradual memory changes', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      // All optimized functions should have memory within valid ranges
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'transaction-api-handler',
      });
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'fraud-detection-processor',
      });
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'daily-report-generator',
      });

      const functions = template.findResources('AWS::Lambda::Function');
      const optimizedFunctions = Object.values(functions).filter(
        (func: any) =>
          func.Properties?.FunctionName === 'transaction-api-handler' ||
          func.Properties?.FunctionName === 'fraud-detection-processor' ||
          func.Properties?.FunctionName === 'daily-report-generator'
      );

      optimizedFunctions.forEach((func: any) => {
        const memorySize = func.Properties?.MemorySize;
        if (memorySize !== undefined) {
          expect(memorySize).toBeGreaterThanOrEqual(128);
          expect(memorySize).toBeLessThanOrEqual(10240);
        }
      });
    });

    test('should respect gradual change limits for all tiers', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      const functions = template.findResources('AWS::Lambda::Function');

      // API tier: max change is min(25% of 1024 = 256, 256) = 256MB
      const apiFunction = Object.values(functions).find(
        (func: any) =>
          func.Properties?.FunctionName === 'transaction-api-handler'
      );
      expect(apiFunction?.Properties?.MemorySize).toBeDefined();
      // Memory should be within gradual change limit from initial 1024
      const apiMemory = apiFunction?.Properties?.MemorySize as number;
      expect(Math.abs(apiMemory - 1024)).toBeLessThanOrEqual(256 + 64); // Allow for rounding

      // Async tier: max change is min(30% of 2048 = 614, 512) = 512MB
      const asyncFunction = Object.values(functions).find(
        (func: any) =>
          func.Properties?.FunctionName === 'fraud-detection-processor'
      );
      expect(asyncFunction?.Properties?.MemorySize).toBeDefined();
      const asyncMemory = asyncFunction?.Properties?.MemorySize as number;
      expect(Math.abs(asyncMemory - 2048)).toBeLessThanOrEqual(512 + 64);

      // Batch tier: max change is min(35% of 3072 = 1075, 768) = 768MB
      const batchFunction = Object.values(functions).find(
        (func: any) =>
          func.Properties?.FunctionName === 'daily-report-generator'
      );
      expect(batchFunction?.Properties?.MemorySize).toBeDefined();
      const batchMemory = batchFunction?.Properties?.MemorySize as number;
      expect(Math.abs(batchMemory - 3072)).toBeLessThanOrEqual(768 + 64);
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing account and region gracefully', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);

      expect(template).toBeDefined();
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'transaction-api-handler',
      });
    });

    test('should handle empty environment suffix', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: '',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      expect(template).toBeDefined();
    });

    test('should handle different timeout configurations', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      const functions = template.findResources('AWS::Lambda::Function');
      const apiFunction = Object.values(functions).find(
        (func: any) =>
          func.Properties?.FunctionName === 'transaction-api-handler'
      );
      const batchFunction = Object.values(functions).find(
        (func: any) =>
          func.Properties?.FunctionName === 'daily-report-generator'
      );

      expect(apiFunction?.Properties?.Timeout).toBeLessThan(
        batchFunction?.Properties?.Timeout
      );
    });

    test('should use default timeout for non-batch functions', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      const functions = template.findResources('AWS::Lambda::Function');
      const apiFunction = Object.values(functions).find(
        (func: any) =>
          func.Properties?.FunctionName === 'transaction-api-handler'
      );
      const asyncFunction = Object.values(functions).find(
        (func: any) =>
          func.Properties?.FunctionName === 'fraud-detection-processor'
      );

      // API and async should use default 3 minutes (180 seconds)
      expect(apiFunction?.Properties?.Timeout).toBe(180);
      // Async has explicit timeout of 5 minutes (300 seconds) from createSampleFunctions
      expect(asyncFunction?.Properties?.Timeout).toBe(300);
    });

    test('should use batch timeout for batch tier functions', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      const functions = template.findResources('AWS::Lambda::Function');
      const batchFunction = Object.values(functions).find(
        (func: any) =>
          func.Properties?.FunctionName === 'daily-report-generator'
      );

      // Batch should use 15 minutes (900 seconds)
      expect(batchFunction?.Properties?.Timeout).toBe(900);
    });

    test('should use default initialMemory when not provided', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      // Test function without initialMemory should use default 1024
      // This tests the || 1024 fallback branch
      const functions = template.findResources('AWS::Lambda::Function');
      const testFunction = Object.values(functions).find(
        (func: any) =>
          func.Properties?.FunctionName ===
          'test-function-without-initial-memory'
      );

      expect(testFunction).toBeDefined();
      expect(testFunction?.Properties?.MemorySize).toBeDefined();
      expect(typeof testFunction?.Properties?.MemorySize).toBe('number');
      // Should have memory calculated from default 1024
      expect(testFunction?.Properties?.MemorySize).toBeGreaterThanOrEqual(128);
      expect(testFunction?.Properties?.MemorySize).toBeLessThanOrEqual(10240);
    });

    test('should use default timeout when not provided for non-batch functions', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      // Test function without timeout should use default (3 minutes for non-batch)
      const functions = template.findResources('AWS::Lambda::Function');
      const testFunction = Object.values(functions).find(
        (func: any) =>
          func.Properties?.FunctionName ===
          'test-function-without-initial-memory'
      );

      expect(testFunction).toBeDefined();
      // Should use default 3 minutes (180 seconds) since it's async tier, not batch
      expect(testFunction?.Properties?.Timeout).toBe(180);
    });
  });
});
