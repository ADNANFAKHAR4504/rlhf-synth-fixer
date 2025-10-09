import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { PodcastCdnStack } from '../lib/podcast-cdn-stack';
import { PodcastMonitoringStack } from '../lib/podcast-monitoring-stack';
import { PodcastStorageStack } from '../lib/podcast-storage-stack';
import { PodcastSubscriberStack } from '../lib/podcast-subscriber-stack';

describe('Step 7: Monitoring Stack Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let storageStack: PodcastStorageStack;
  let subscriberStack: PodcastSubscriberStack;
  let cdnStack: PodcastCdnStack;
  let monitoringStack: PodcastMonitoringStack;
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
    cdnStack = new PodcastCdnStack(stack, 'PodcastCdn', {
      audioBucket: storageStack.audioBucket,
      subscriberTable: subscriberStack.subscriberTable,
      environmentSuffix: 'test'
    });
    monitoringStack = new PodcastMonitoringStack(stack, 'PodcastMonitoring', {
      distribution: cdnStack.distribution,
      environmentSuffix: 'test'
    });
    template = Template.fromStack(stack);
  });

  test('Step 7.1: Monitoring stack is created', () => {
    expect(monitoringStack).toBeDefined();
  });

  test('Step 7.2: CloudWatch dashboard is created', () => {
    template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
      DashboardName: Match.stringLikeRegexp('.*podcast.*')
    });
  });

  test('Step 7.3: SNS topic for alarms is created', () => {
    template.hasResourceProperties('AWS::SNS::Topic', {
      TopicName: Match.stringLikeRegexp('.*alarm.*')
    });
  });

  test('Step 7.4: CloudWatch alarm for 5xx errors is created', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      MetricName: '5xxErrorRate',
      Namespace: 'AWS/CloudFront',
      Statistic: 'Average',
      Period: 300,
      EvaluationPeriods: 2,
      Threshold: 5,
      ComparisonOperator: 'GreaterThanThreshold'
    });
  });

  test('Step 7.5: CloudWatch alarm for 4xx errors is created', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      MetricName: '4xxErrorRate',
      Namespace: 'AWS/CloudFront',
      Statistic: 'Average',
      Period: 300,
      EvaluationPeriods: 2,
      Threshold: 10,
      ComparisonOperator: 'GreaterThanThreshold'
    });
  });

  test('Step 7.6: Alarms are connected to SNS topic', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmActions: Match.arrayWith([
        Match.objectLike({
          Ref: Match.stringLikeRegexp('.*Topic.*')
        })
      ])
    });
  });

  test('Step 7.7: Dashboard has correct widgets', () => {
    template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
      DashboardBody: Match.objectLike({
        'Fn::Join': Match.arrayWith([
          Match.anyValue(),
          Match.arrayWith([
            Match.stringLikeRegexp('.*widgets.*')
          ])
        ])
      })
    });
  });

  test('Step 7.8: Alarms have treat missing data policy', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      TreatMissingData: 'notBreaching'
    });
  });
});

