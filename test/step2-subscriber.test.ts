import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { PodcastSubscriberStack } from '../lib/podcast-subscriber-stack';

describe('Step 2: Subscriber Stack Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let subscriberStack: PodcastSubscriberStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    subscriberStack = new PodcastSubscriberStack(stack, 'PodcastSubscriber', {
      environmentSuffix: 'test'
    });
    template = Template.fromStack(stack);
  });

  test('Step 2.1: Subscriber stack is created', () => {
    expect(subscriberStack).toBeDefined();
    expect(subscriberStack.subscriberTable).toBeDefined();
  });

  test('Step 2.2: DynamoDB table is created with correct name', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'podcast-subscribers-test'
    });
  });

  test('Step 2.3: DynamoDB table has correct partition key', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      KeySchema: Match.arrayWith([
        Match.objectLike({
          AttributeName: 'email',
          KeyType: 'HASH'
        })
      ]),
      AttributeDefinitions: Match.arrayWith([
        Match.objectLike({
          AttributeName: 'email',
          AttributeType: 'S'
        })
      ])
    });
  });

  test('Step 2.4: DynamoDB table has GSI for subscription status', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: Match.arrayWith([
        Match.objectLike({
          IndexName: 'status-index',
          KeySchema: Match.arrayWith([
            Match.objectLike({
              AttributeName: 'subscriptionStatus',
              KeyType: 'HASH'
            })
          ])
        })
      ])
    });
  });

  test('Step 2.5: DynamoDB table has pay-per-request billing', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST'
    });
  });

  test('Step 2.6: DynamoDB table has encryption enabled', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      SSESpecification: {
        SSEEnabled: true
      }
    });
  });

  test('Step 2.7: DynamoDB table has streams enabled', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      StreamSpecification: {
        StreamViewType: 'NEW_AND_OLD_IMAGES'
      }
    });
  });

  test('Step 2.8: DynamoDB table has point-in-time recovery', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true
      }
    });
  });
});

