import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { MonitoringStack } from '../lib/monitoring-stack';

describe('MonitoringStack', () => {
  const app = new cdk.App();
  const environmentSuffix = 'test123';

  const stack = new MonitoringStack(app, 'TestMonitoringStack', {
    environmentSuffix: environmentSuffix,
  });

  const template = Template.fromStack(stack);

  test('SNS topic created with correct name', () => {
    template.hasResourceProperties('AWS::SNS::Topic', {
      TopicName: `critical-alerts-${environmentSuffix}`,
      DisplayName: 'Critical Infrastructure Alerts',
    });
  });

  test('Email subscription created', () => {
    template.hasResourceProperties('AWS::SNS::Subscription', {
      Protocol: 'email',
      TopicArn: Match.anyValue(),
      Endpoint: Match.anyValue(),
    });
  });

  test('SNS topic ARN output exported with environmentSuffix', () => {
    template.hasOutput('AlertTopicArn', {
      Export: {
        Name: `AlertTopicArn-${environmentSuffix}`,
      },
    });
  });

  test('Exactly one SNS topic created', () => {
    template.resourceCountIs('AWS::SNS::Topic', 1);
  });

  test('Exactly one SNS subscription created', () => {
    template.resourceCountIs('AWS::SNS::Subscription', 1);
  });
});
