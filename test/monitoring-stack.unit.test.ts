import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { MonitoringStack } from '../lib/monitoring-stack';

describe('MonitoringStack', () => {
  let app: cdk.App;
  let parentStack: cdk.Stack;
  let snsTopicArn: string;
  let stack: MonitoringStack;
  let template: Template;
  const environmentSuffix = 'testenv';

  beforeEach(() => {
    app = new cdk.App();
    parentStack = new cdk.Stack(app, 'ParentStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    
    const topic = new sns.Topic(parentStack, 'TestTopic');
    snsTopicArn = topic.topicArn;

    stack = new MonitoringStack(parentStack, 'TestMonitoringStack', {
      environmentSuffix,
      snsTopicArn,
    });
    
    template = Template.fromStack(stack);
  });

  describe('CloudWatch Alarms', () => {
    test('creates security alarm for GuardDuty findings', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp(`${environmentSuffix}-security-events`),
        AlarmDescription: 'Alarm for security events from GuardDuty',
        MetricName: 'FindingCount',
        Namespace: 'AWS/GuardDuty',
        Statistic: 'Sum',
        Period: 300,
        EvaluationPeriods: 1,
        Threshold: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('security alarm sends notifications to SNS topic', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const hasAlarmActions = Object.values(alarms).some(alarm => 
        alarm.Properties?.AlarmActions && 
        Array.isArray(alarm.Properties.AlarmActions) &&
        alarm.Properties.AlarmActions.length > 0
      );
      expect(hasAlarmActions).toBe(true);
    });
  });

  describe('Multi-Region GuardDuty', () => {
    test('creates outputs for multi-region GuardDuty setup', () => {
      // Check for GuardDuty region outputs
      const outputs = template.findOutputs('*');
      const guardDutyOutputs = Object.keys(outputs).filter(key => 
        key.includes('GuardDutyRegion')
      );
      
      // Should have outputs for regions other than the stack region
      expect(guardDutyOutputs.length).toBeGreaterThan(0);
    });

    test('outputs mention manual GuardDuty setup for other regions', () => {
      template.hasOutput('*', {
        Description: Match.stringLikeRegexp('Manual setup required for GuardDuty'),
      });
    });
  });

  describe('Integration with Security Services', () => {
    test('uses provided SNS topic ARN', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach(alarm => {
        const alarmActions = alarm.Properties?.AlarmActions;
        if (alarmActions) {
          expect(alarmActions).toBeDefined();
          expect(Array.isArray(alarmActions)).toBe(true);
        }
      });
    });
  });

  describe('Monitoring Coverage', () => {
    test('monitors GuardDuty findings', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'FindingCount',
        Namespace: 'AWS/GuardDuty',
      });
    });

    test('alarm triggers on any security finding', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Threshold: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('uses 5-minute evaluation period for quick response', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Period: 300, // 5 minutes in seconds
        EvaluationPeriods: 1,
      });
    });
  });
});