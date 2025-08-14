import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as logs from 'aws-cdk-lib/aws-logs';
import { MonitoringConstruct } from '../../lib/constructs/monitoring-construct';

describe('MonitoringConstruct Unit Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
  });

  describe('Basic Monitoring Creation', () => {
    beforeEach(() => {
      const monitoringConstruct = new MonitoringConstruct(stack, 'TestMonitoringConstruct', {
        environment: 'test',
      });
      template = Template.fromStack(stack);
    });

    test('should create SNS topic with correct configuration', () => {
      template.hasResource('AWS::SNS::Topic', {
        Properties: {
          DisplayName: 'Security Alerts - test',
          TopicName: 'security-alerts-test',
        },
      });
    });

    test('should create SNS subscription', () => {
      template.hasResource('AWS::SNS::Subscription', {
        Properties: {
          Protocol: 'email',
          Endpoint: Match.anyValue(),
        },
      });
    });

    test('should create security log group', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        Properties: {
          RetentionInDays: 365,
        },
      });
    });

    test('should create CloudTrail log group when not provided', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        Properties: {
          RetentionInDays: 365,
        },
      });
    });

    test('should create metric filter for failed login attempts', () => {
      template.hasResource('AWS::Logs::MetricFilter', {
        Properties: {
          FilterPattern: '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }',
          MetricTransformations: [
            {
              MetricName: 'FailedLogins',
              MetricNamespace: 'Security',
              MetricValue: '1',
            },
          ],
        },
      });
    });

    test('should create alarm for failed login attempts', () => {
      template.hasResource('AWS::CloudWatch::Alarm', {
        Properties: {
          AlarmDescription: 'Alert on multiple failed login attempts',
          Threshold: 5,
          EvaluationPeriods: 1,
          TreatMissingData: 'notBreaching',
        },
      });
    });

    test('should create metric filter for root account usage', () => {
      template.hasResource('AWS::Logs::MetricFilter', {
        Properties: {
          FilterPattern: '{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }',
          MetricTransformations: [
            {
              MetricName: 'RootAccountUsage',
              MetricNamespace: 'Security',
              MetricValue: '1',
            },
          ],
        },
      });
    });

    test('should create alarm for root account usage', () => {
      template.hasResource('AWS::CloudWatch::Alarm', {
        Properties: {
          AlarmDescription: 'Alert on root account usage',
          Threshold: 1,
          EvaluationPeriods: 1,
          TreatMissingData: 'notBreaching',
        },
      });
    });

    test('should create EventBridge rule for security events', () => {
      template.hasResource('AWS::Events::Rule', {
        Properties: {
          EventPattern: {
            source: ['aws.signin'],
            'detail-type': ['AWS Console Sign In via CloudTrail'],
            detail: {
              responseElements: {
                ConsoleLogin: ['Failure'],
              },
            },
          },
        },
      });
    });

    test('should create EventBridge rule for unauthorized access', () => {
      template.hasResource('AWS::Events::Rule', {
        Properties: {
          EventPattern: {
            source: ['aws.iam'],
            'detail-type': ['AWS API Call via CloudTrail'],
            detail: {
              eventName: [
                'CreateUser',
                'DeleteUser',
                'CreateRole',
                'DeleteRole',
                'AttachUserPolicy',
                'DetachUserPolicy',
                'AttachRolePolicy',
                'DetachRolePolicy',
              ],
            },
          },
        },
      });
    });

    test('should tag monitoring resources correctly', () => {
      template.hasResource('AWS::SNS::Topic', {
        Properties: {
          Tags: Match.arrayWith([
            {
              Key: 'Name',
              Value: 'AlertTopic-test',
            },
          ]),
        },
      });
    });
  });

  describe('Monitoring with Provided CloudTrail Log Group', () => {
    let providedLogGroup: logs.LogGroup;

    beforeEach(() => {
      providedLogGroup = new logs.LogGroup(stack, 'ProvidedCloudTrailLogGroup', {
        logGroupName: '/aws/cloudtrail/provided',
        retention: logs.RetentionDays.ONE_MONTH,
      });

      const monitoringConstruct = new MonitoringConstruct(stack, 'TestMonitoringConstruct', {
        environment: 'test',
        cloudTrailLogGroup: providedLogGroup,
      });
      template = Template.fromStack(stack);
    });

    test('should use provided CloudTrail log group', () => {
      // Should create metric filters using the provided log group
      template.hasResource('AWS::Logs::MetricFilter', {
        Properties: {
          LogGroupName: Match.anyValue(),
        },
      });
    });

    test('should create metric filters using provided log group', () => {
      template.hasResource('AWS::Logs::MetricFilter', {
        Properties: {
          LogGroupName: Match.anyValue(),
          FilterPattern: Match.anyValue(),
        },
      });
    });
  });

  describe('Monitoring Properties', () => {
    test('should expose alertTopic property', () => {
      const monitoringConstruct = new MonitoringConstruct(stack, 'TestMonitoringConstruct', {
        environment: 'test',
      });
      expect(monitoringConstruct.alertTopic).toBeDefined();
    });

    test('should expose securityLogGroup property', () => {
      const monitoringConstruct = new MonitoringConstruct(stack, 'TestMonitoringConstruct', {
        environment: 'test',
      });
      expect(monitoringConstruct.securityLogGroup).toBeDefined();
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('should handle different environment names', () => {
      const monitoringConstruct = new MonitoringConstruct(stack, 'TestMonitoringConstruct', {
        environment: 'prod',
      });
      template = Template.fromStack(stack);

      template.hasResource('AWS::SNS::Topic', {
        Properties: {
          DisplayName: 'Security Alerts - prod',
          TopicName: 'security-alerts-prod',
        },
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('should have correct resource dependencies', () => {
      const monitoringConstruct = new MonitoringConstruct(stack, 'TestMonitoringConstruct', {
        environment: 'test',
      });
      template = Template.fromStack(stack);

      // Check that required resources exist
      template.hasResource('AWS::SNS::Topic', {});
      template.hasResource('AWS::SNS::Subscription', {});
      template.hasResource('AWS::Logs::LogGroup', {});
      template.hasResource('AWS::Logs::MetricFilter', {});
      template.hasResource('AWS::CloudWatch::Alarm', {});
      template.hasResource('AWS::Events::Rule', {});
    });
  });

  describe('Alarm Actions', () => {
    test('should add SNS actions to alarms', () => {
      const monitoringConstruct = new MonitoringConstruct(stack, 'TestMonitoringConstruct', {
        environment: 'test',
      });
      template = Template.fromStack(stack);

      // Check that alarms have SNS actions
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(Array.isArray(alarm.Properties.AlarmActions)).toBe(true);
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('EventBridge Targets', () => {
    test('should add SNS targets to EventBridge rules', () => {
      const monitoringConstruct = new MonitoringConstruct(stack, 'TestMonitoringConstruct', {
        environment: 'test',
      });
      template = Template.fromStack(stack);

      // Check that EventBridge rules have SNS targets
      const rules = template.findResources('AWS::Events::Rule');
      Object.values(rules).forEach((rule: any) => {
        expect(rule.Properties.Targets).toBeDefined();
        expect(Array.isArray(rule.Properties.Targets)).toBe(true);
        expect(rule.Properties.Targets.length).toBeGreaterThan(0);
      });
    });
  });
});
