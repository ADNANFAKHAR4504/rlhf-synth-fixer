import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { PodcastCdnStack } from '../lib/podcast-cdn-stack';
import { PodcastSchedulerStack } from '../lib/podcast-scheduler-stack';
import { PodcastStorageStack } from '../lib/podcast-storage-stack';
import { PodcastSubscriberStack } from '../lib/podcast-subscriber-stack';
import { PodcastTranscodingStack } from '../lib/podcast-transcoding-stack';

describe('Step 6: Scheduler Stack Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let storageStack: PodcastStorageStack;
  let subscriberStack: PodcastSubscriberStack;
  let transcodingStack: PodcastTranscodingStack;
  let cdnStack: PodcastCdnStack;
  let schedulerStack: PodcastSchedulerStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    storageStack = new PodcastStorageStack(stack, 'PodcastStorage', {
      environmentSuffix: 'test'
    });
    subscriberStack = new PodcastSubscriberStack(stack, 'PodcastSubscriber', {
      environmentSuffix: 'test'
    });
    transcodingStack = new PodcastTranscodingStack(stack, 'PodcastTranscoding', {
      audioBucket: storageStack.audioBucket,
      environmentSuffix: 'test'
    });
    cdnStack = new PodcastCdnStack(stack, 'PodcastCdn', {
      audioBucket: storageStack.audioBucket,
      subscriberTable: subscriberStack.subscriberTable,
      environmentSuffix: 'test'
    });
    schedulerStack = new PodcastSchedulerStack(stack, 'PodcastScheduler', {
      subscriberTable: subscriberStack.subscriberTable,
      audioBucket: storageStack.audioBucket,
      jobTemplate: transcodingStack.jobTemplate,
      mediaConvertRole: transcodingStack.mediaConvertRole,
      keyValueStore: cdnStack.keyValueStore,
      environmentSuffix: 'test'
    });
    template = Template.fromStack(stack);
  });

  test('Step 6.1: Scheduler stack is created', () => {
    expect(schedulerStack).toBeDefined();
  });

  test('Step 6.2: Stream processor Lambda function is created', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs20.x',
      Handler: 'index.handler',
      Environment: {
        Variables: {
          KVS_ARN: Match.anyValue()
        }
      }
    });
  });

  test('Step 6.3: DynamoDB stream event source mapping is created', () => {
    template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
      EventSourceArn: Match.objectLike({
        'Fn::GetAtt': Match.arrayWith([
          Match.stringLikeRegexp('.*SubscriberTable.*'),
          'StreamArn'
        ])
      }),
      StartingPosition: 'LATEST'
    });
  });

  test('Step 6.4: Lambda functions have correct IAM permissions', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith([
              'dynamodb:Query',
              'dynamodb:Scan',
              'dynamodb:DeleteItem'
            ]),
            Effect: 'Allow'
          })
        ])
      }
    });
  });

  describe('Lambda Functions', () => {
    test('Step 6.5: Lambda functions are created', () => {
      const resources = template.toJSON().Resources;
      const lambdaFunctions = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      );

      expect(lambdaFunctions.length).toBeGreaterThan(0);
    });

    test('Step 6.6: All Lambda functions have index.handler', () => {
      const resources = template.toJSON().Resources;
      const lambdaFunctions = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      );

      lambdaFunctions.forEach((func: any) => {
        expect(func.Properties.Handler).toBe('index.handler');
      });
    });

    test('Step 6.7: Lambda functions have environment variables', () => {
      const resources = template.toJSON().Resources;
      const lambdaFunctions = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      );

      const hasEnvVars = lambdaFunctions.some((func: any) =>
        func.Properties.Environment?.Variables
      );

      expect(hasEnvVars).toBe(true);
    });

    test('Step 6.8: Stream processor Lambda has KVS_ARN variable', () => {
      const resources = template.toJSON().Resources;
      const streamFunction = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Lambda::Function' &&
          r.Properties.Environment?.Variables?.KVS_ARN
      ) as any;

      expect(streamFunction).toBeDefined();
      expect(streamFunction.Properties.Environment.Variables.KVS_ARN).toBeDefined();
    });

    test('Step 6.9: Lambda functions have appropriate memory sizes', () => {
      const resources = template.toJSON().Resources;
      const lambdaFunctions = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      );

      lambdaFunctions.forEach((func: any) => {
        expect(func.Properties.MemorySize).toBeGreaterThanOrEqual(128);
      });
    });

    test('Step 6.10: Lambda functions have timeout configured', () => {
      const resources = template.toJSON().Resources;
      const lambdaFunctions = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      );

      lambdaFunctions.forEach((func: any) => {
        expect(func.Properties.Timeout).toBeDefined();
        expect(func.Properties.Timeout).toBeGreaterThan(0);
      });
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('Step 6.12: Lambda execution roles are created', () => {
      const resources = template.toJSON().Resources;
      const roles = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Role'
      );

      expect(roles.length).toBeGreaterThan(0);
    });

    test('Step 6.13: IAM policies grant DynamoDB access', () => {
      const resources = template.toJSON().Resources;
      const policies = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      ) as any[];

      const hasDynamoDBPolicy = policies.some((policy: any) =>
        policy.Properties.PolicyDocument.Statement.some((stmt: any) =>
          stmt.Action.some((action: string) => action.includes('dynamodb:'))
        )
      );

      expect(hasDynamoDBPolicy).toBe(true);
    });

    test('Step 6.14: IAM policies grant S3 access', () => {
      const resources = template.toJSON().Resources;
      const policies = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      ) as any[];

      const hasS3Policy = policies.some((policy: any) =>
        policy.Properties.PolicyDocument.Statement.some((stmt: any) =>
          stmt.Action.some((action: string) => action.includes('s3:'))
        )
      );

      expect(hasS3Policy).toBe(true);
    });

    test('Step 6.15: IAM policies grant CloudFront KVS access', () => {
      const resources = template.toJSON().Resources;
      const policies = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      ) as any[];

      const hasKVSPolicy = policies.some((policy: any) =>
        policy.Properties.PolicyDocument.Statement.some((stmt: any) =>
          stmt.Action.some((action: string) => action.includes('cloudfront-keyvaluestore:'))
        )
      );

      expect(hasKVSPolicy).toBe(true);
    });
  });

  describe('Event Source Mapping', () => {
    test('Step 6.16: Event source mapping has correct batch size', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10
      });
    });

    test('Step 6.17: Event source mapping has retry attempts', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        MaximumRetryAttempts: 3
      });
    });

    test('Step 6.18: Exactly one event source mapping exists', () => {
      template.resourceCountIs('AWS::Lambda::EventSourceMapping', 1);
    });
  });

  describe('CloudFormation Outputs', () => {
    test('Step 6.19: Cleanup schedule name output exists', () => {
      const outputs = template.toJSON().Outputs;
      const cleanupOutput = Object.values(outputs).find(
        (o: any) => o.Description === 'EventBridge cleanup schedule name'
      );

      expect(cleanupOutput).toBeDefined();
    });

    test('Step 6.20: Transcoding schedule name output exists', () => {
      const outputs = template.toJSON().Outputs;
      const transcodingOutput = Object.values(outputs).find(
        (o: any) => o.Description === 'EventBridge transcoding schedule name'
      );

      expect(transcodingOutput).toBeDefined();
    });

    test('Step 6.21: Cleanup function ARN output exists', () => {
      const outputs = template.toJSON().Outputs;
      const functionOutput = Object.values(outputs).find(
        (o: any) => o.Description && o.Description.includes('cleanup')
      );

      expect(functionOutput).toBeDefined();
    });

    test('Step 6.22: Schedule outputs handle empty names', () => {
      const outputs = template.toJSON().Outputs;
      const scheduleOutputs = Object.values(outputs).filter(
        (o: any) => o.Description && o.Description.includes('schedule')
      );

      // Outputs should exist even if schedule names are empty
      expect(scheduleOutputs.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Counts', () => {
    test('Step 6.23: Multiple Lambda functions are created', () => {
      const resources = template.toJSON().Resources;
      const lambdaFunctions = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      );

      expect(lambdaFunctions.length).toBeGreaterThanOrEqual(3);
    });

    test('Step 6.24: Multiple IAM roles are created', () => {
      const resources = template.toJSON().Resources;
      const roles = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Role'
      );

      expect(roles.length).toBeGreaterThanOrEqual(3);
    });

    test('Step 6.25: IAM policies are created', () => {
      const resources = template.toJSON().Resources;
      const policies = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      );

      expect(policies.length).toBeGreaterThan(0);
    });
  });

  describe('Integration and Dependencies', () => {
    test('Step 6.26: Scheduler stack references subscriber table', () => {
      const resources = template.toJSON().Resources;
      const eventSourceMapping = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::Lambda::EventSourceMapping'
      ) as any;

      expect(eventSourceMapping.Properties.EventSourceArn).toBeDefined();
    });

    test('Step 6.27: Scheduler stack has Lambda environment variables', () => {
      const resources = template.toJSON().Resources;
      const lambdaFunctions = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      );

      const hasEnvVars = lambdaFunctions.some((func: any) =>
        func.Properties.Environment?.Variables
      );

      expect(hasEnvVars).toBe(true);
    });

    test('Step 6.28: Scheduler stack references KeyValueStore', () => {
      const resources = template.toJSON().Resources;
      const hasKVSRef = Object.values(resources).some((r: any) => {
        if (r.Type === 'AWS::Lambda::Function') {
          return r.Properties.Environment?.Variables?.KVS_ARN;
        }
        return false;
      });

      expect(hasKVSRef).toBe(true);
    });

    test('Step 6.29: Lambda functions have proper service role', () => {
      const resources = template.toJSON().Resources;
      const lambdaFunctions = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      );

      lambdaFunctions.forEach((func: any) => {
        expect(func.Properties.Role).toBeDefined();
      });
    });
  });

  describe('Stack Synthesis', () => {
    test('Step 6.30: Stack synthesizes without errors', () => {
      expect(() => template.toJSON()).not.toThrow();
    });

    test('Step 6.31: Template is valid CloudFormation', () => {
      const templateJson = template.toJSON();
      expect(templateJson).toBeDefined();
      expect(templateJson.Resources).toBeDefined();
    });

    test('Step 6.32: All resources have valid properties', () => {
      const resources = template.toJSON().Resources;
      Object.values(resources).forEach((resource: any) => {
        expect(resource.Type).toBeDefined();
        expect(resource.Properties).toBeDefined();
      });
    });

    test('Step 6.33: Stack is a valid construct', () => {
      expect(schedulerStack.node).toBeDefined();
      expect(schedulerStack.node.id).toBe('PodcastScheduler');
    });
  });
});

