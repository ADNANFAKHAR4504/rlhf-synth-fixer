import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { PatchManagerConstruct } from '../../lib/constructs/patch-manager-construct';

describe('PatchManagerConstruct Unit Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;
  let alertTopic: sns.Topic;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    alertTopic = new sns.Topic(stack, 'TestAlertTopic', {
      topicName: 'test-alerts',
    });
  });

  describe('Basic Patch Manager Creation', () => {
    beforeEach(() => {
      const patchManagerConstruct = new PatchManagerConstruct(stack, 'TestPatchManagerConstruct', {
        environment: 'test',
        alertTopic,
      });
      template = Template.fromStack(stack);
    });

    test('should create patch baseline with correct configuration', () => {
      template.hasResource('AWS::SSM::PatchBaseline', {
        Properties: {
          Name: 'SecurityPatchBaseline-test',
          Description: 'Security patch baseline for test environment',
          OperatingSystem: 'AMAZON_LINUX_2',
          ApprovalRules: {
            PatchRules: [
              {
                ApproveAfterDays: 7,
                ComplianceLevel: 'CRITICAL',
                EnableNonSecurity: false,
                PatchFilterGroup: {
                  PatchFilters: [
                    {
                      Key: 'CLASSIFICATION',
                      Values: ['Security'],
                    },
                    {
                      Key: 'SEVERITY',
                      Values: ['Critical', 'Important'],
                    },
                  ],
                },
              },
            ],
          },
          GlobalFilters: {
            PatchFilters: [
              {
                Key: 'PRODUCT',
                Values: ['AmazonLinux2'],
              },
            ],
          },
          RejectedPatchesAction: 'ALLOW_AS_DEPENDENCY',
        },
      });
    });

    test('should create maintenance window with correct configuration', () => {
      template.hasResource('AWS::SSM::MaintenanceWindow', {
        Properties: {
          Name: 'PatchMaintenanceWindow-test',
          Description: 'Maintenance window for test environment patching',
          Schedule: 'cron(0 2 ? * SUN *)', // Every Sunday at 2 AM
          Duration: 4, // 4 hours
          Cutoff: 1, // 1 hour before
          AllowUnassociatedTargets: false,
        },
      });
    });

    test('should create maintenance window target', () => {
      template.hasResource('AWS::SSM::MaintenanceWindowTarget', {
        Properties: {
          ResourceType: 'INSTANCE',
          Targets: [
            {
              Key: 'tag:PatchGroup',
              Values: ['test-servers'],
            },
          ],
        },
      });
    });

    test('should create maintenance window task for patching', () => {
      template.hasResource('AWS::SSM::MaintenanceWindowTask', {
        Properties: {
          TaskType: 'RUN_COMMAND',
          TaskArn: 'AWS-RunPatchBaseline',
          Priority: 1,
          MaxConcurrency: '1',
          MaxErrors: '1',
          TaskParameters: {
            Operation: {
              Values: ['Install'],
            },
            RebootOption: {
              Values: ['RebootIfNeeded'],
            },
          },
        },
      });
    });

    test('should tag patch manager resources correctly', () => {
      // Check that patch baseline has proper tags
      const patchBaselines = template.findResources('AWS::SSM::PatchBaseline');
      const patchBaseline = Object.values(patchBaselines)[0] as any;
      
      expect(patchBaseline.Properties.Tags).toBeDefined();
      expect(Array.isArray(patchBaseline.Properties.Tags)).toBe(true);
      
      const nameTag = patchBaseline.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      const componentTag = patchBaseline.Properties.Tags.find((tag: any) => tag.Key === 'Component');
      const environmentTag = patchBaseline.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
      
      expect(nameTag).toBeDefined();
      expect(componentTag).toBeDefined();
      expect(environmentTag).toBeDefined();
      expect(componentTag.Value).toBe('PatchManager');
      expect(environmentTag.Value).toBe('test');
    });
  });

  describe('Patch Baseline Security Configuration', () => {
    beforeEach(() => {
      const patchManagerConstruct = new PatchManagerConstruct(stack, 'TestPatchManagerConstruct', {
        environment: 'test',
        alertTopic,
      });
      template = Template.fromStack(stack);
    });

    test('should only approve security patches', () => {
      const patchBaselines = template.findResources('AWS::SSM::PatchBaseline');
      const patchBaseline = Object.values(patchBaselines)[0] as any;

      const patchRule = patchBaseline.Properties.ApprovalRules.PatchRules[0];
      expect(patchRule.EnableNonSecurity).toBe(false);
      expect(patchRule.PatchFilterGroup.PatchFilters).toContainEqual({
        Key: 'CLASSIFICATION',
        Values: ['Security'],
      });
    });

    test('should only approve critical and important severity patches', () => {
      const patchBaselines = template.findResources('AWS::SSM::PatchBaseline');
      const patchBaseline = Object.values(patchBaselines)[0] as any;

      const patchRule = patchBaseline.Properties.ApprovalRules.PatchRules[0];
      expect(patchRule.PatchFilterGroup.PatchFilters).toContainEqual({
        Key: 'SEVERITY',
        Values: ['Critical', 'Important'],
      });
    });

    test('should have 7-day approval delay for security patches', () => {
      const patchBaselines = template.findResources('AWS::SSM::PatchBaseline');
      const patchBaseline = Object.values(patchBaselines)[0] as any;

      const patchRule = patchBaseline.Properties.ApprovalRules.PatchRules[0];
      expect(patchRule.ApproveAfterDays).toBe(7);
    });

    test('should filter for Amazon Linux 2 patches only', () => {
      const patchBaselines = template.findResources('AWS::SSM::PatchBaseline');
      const patchBaseline = Object.values(patchBaselines)[0] as any;

      expect(patchBaseline.Properties.GlobalFilters.PatchFilters).toContainEqual({
        Key: 'PRODUCT',
        Values: ['AmazonLinux2'],
      });
    });

    test('should allow rejected patches as dependencies', () => {
      const patchBaselines = template.findResources('AWS::SSM::PatchBaseline');
      const patchBaseline = Object.values(patchBaselines)[0] as any;

      expect(patchBaseline.Properties.RejectedPatchesAction).toBe('ALLOW_AS_DEPENDENCY');
    });
  });

  describe('Maintenance Window Configuration', () => {
    beforeEach(() => {
      const patchManagerConstruct = new PatchManagerConstruct(stack, 'TestPatchManagerConstruct', {
        environment: 'test',
        alertTopic,
      });
      template = Template.fromStack(stack);
    });

    test('should schedule maintenance window for Sunday at 2 AM', () => {
      const maintenanceWindows = template.findResources('AWS::SSM::MaintenanceWindow');
      const maintenanceWindow = Object.values(maintenanceWindows)[0] as any;

      expect(maintenanceWindow.Properties.Schedule).toBe('cron(0 2 ? * SUN *)');
    });

    test('should have 4-hour maintenance window duration', () => {
      const maintenanceWindows = template.findResources('AWS::SSM::MaintenanceWindow');
      const maintenanceWindow = Object.values(maintenanceWindows)[0] as any;

      expect(maintenanceWindow.Properties.Duration).toBe(4);
    });

    test('should have 1-hour cutoff before maintenance window', () => {
      const maintenanceWindows = template.findResources('AWS::SSM::MaintenanceWindow');
      const maintenanceWindow = Object.values(maintenanceWindows)[0] as any;

      expect(maintenanceWindow.Properties.Cutoff).toBe(1);
    });

    test('should not allow unassociated targets', () => {
      const maintenanceWindows = template.findResources('AWS::SSM::MaintenanceWindow');
      const maintenanceWindow = Object.values(maintenanceWindows)[0] as any;

      expect(maintenanceWindow.Properties.AllowUnassociatedTargets).toBe(false);
    });

    test('should target instances with correct patch group tag', () => {
      const maintenanceWindowTargets = template.findResources('AWS::SSM::MaintenanceWindowTarget');
      const maintenanceWindowTarget = Object.values(maintenanceWindowTargets)[0] as any;

      expect(maintenanceWindowTarget.Properties.Targets[0].Key).toBe('tag:PatchGroup');
      expect(maintenanceWindowTarget.Properties.Targets[0].Values).toContain('test-servers');
    });
  });

  describe('Patch Task Configuration', () => {
    beforeEach(() => {
      const patchManagerConstruct = new PatchManagerConstruct(stack, 'TestPatchManagerConstruct', {
        environment: 'test',
        alertTopic,
      });
      template = Template.fromStack(stack);
    });

    test('should use AWS-RunPatchBaseline command', () => {
      const maintenanceWindowTasks = template.findResources('AWS::SSM::MaintenanceWindowTask');
      const maintenanceWindowTask = Object.values(maintenanceWindowTasks)[0] as any;

      expect(maintenanceWindowTask.Properties.TaskArn).toBe('AWS-RunPatchBaseline');
    });

    test('should configure task to install patches', () => {
      const maintenanceWindowTasks = template.findResources('AWS::SSM::MaintenanceWindowTask');
      const maintenanceWindowTask = Object.values(maintenanceWindowTasks)[0] as any;

      expect(maintenanceWindowTask.Properties.TaskParameters.Operation.Values).toContain('Install');
    });

    test('should configure task to reboot if needed', () => {
      const maintenanceWindowTasks = template.findResources('AWS::SSM::MaintenanceWindowTask');
      const maintenanceWindowTask = Object.values(maintenanceWindowTasks)[0] as any;

      expect(maintenanceWindowTask.Properties.TaskParameters.RebootOption.Values).toContain('RebootIfNeeded');
    });

    test('should have conservative concurrency and error limits', () => {
      const maintenanceWindowTasks = template.findResources('AWS::SSM::MaintenanceWindowTask');
      const maintenanceWindowTask = Object.values(maintenanceWindowTasks)[0] as any;

      expect(maintenanceWindowTask.Properties.MaxConcurrency).toBe('1');
      expect(maintenanceWindowTask.Properties.MaxErrors).toBe('1');
    });

    test('should have high priority for patch task', () => {
      const maintenanceWindowTasks = template.findResources('AWS::SSM::MaintenanceWindowTask');
      const maintenanceWindowTask = Object.values(maintenanceWindowTasks)[0] as any;

      expect(maintenanceWindowTask.Properties.Priority).toBe(1);
    });
  });

  describe('CloudWatch Monitoring and Alarms', () => {
    beforeEach(() => {
      const patchManagerConstruct = new PatchManagerConstruct(stack, 'TestPatchManagerConstruct', {
        environment: 'test',
        alertTopic,
      });
      template = Template.fromStack(stack);
    });

    test('should create patch compliance alarm', () => {
      template.hasResource('AWS::CloudWatch::Alarm', {
        Properties: {
          MetricName: 'PatchCompliance',
          Namespace: 'AWS/SSM',
          Statistic: 'Average',
          Period: 86400, // 24 hours
          Threshold: 90,
          EvaluationPeriods: 2,
          TreatMissingData: 'breaching',
          AlarmDescription: 'Patch compliance alarm for test environment',
        },
      });
    });

    test('should create failed patch operations alarm', () => {
      template.hasResource('AWS::CloudWatch::Alarm', {
        Properties: {
          MetricName: 'FailedPatchOperations',
          Namespace: 'AWS/SSM',
          Statistic: 'Sum',
          Period: 3600, // 1 hour
          Threshold: 1,
          EvaluationPeriods: 1,
          TreatMissingData: 'notBreaching',
          AlarmDescription: 'Failed patch operations alarm for test environment',
        },
      });
    });

    test('should add SNS actions to patch compliance alarm', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const patchComplianceAlarm = Object.values(alarms).find((alarm: any) =>
        alarm.Properties.MetricName === 'PatchCompliance'
      ) as any;

      expect(patchComplianceAlarm.Properties.AlarmActions).toBeDefined();
      expect(Array.isArray(patchComplianceAlarm.Properties.AlarmActions)).toBe(true);
      expect(patchComplianceAlarm.Properties.AlarmActions.length).toBeGreaterThan(0);
    });

    test('should add SNS actions to failed patch alarm', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const failedPatchAlarm = Object.values(alarms).find((alarm: any) =>
        alarm.Properties.MetricName === 'FailedPatchOperations'
      ) as any;

      expect(failedPatchAlarm.Properties.AlarmActions).toBeDefined();
      expect(Array.isArray(failedPatchAlarm.Properties.AlarmActions)).toBe(true);
      expect(failedPatchAlarm.Properties.AlarmActions.length).toBeGreaterThan(0);
    });

    test('should have correct alarm thresholds for compliance monitoring', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const patchComplianceAlarm = Object.values(alarms).find((alarm: any) =>
        alarm.Properties.MetricName === 'PatchCompliance'
      ) as any;

      // Should alert if compliance drops below 90%
      expect(patchComplianceAlarm.Properties.Threshold).toBe(90);
      // The comparison operator should be appropriate for the metric
      expect(patchComplianceAlarm.Properties.ComparisonOperator).toBeDefined();
    });

    test('should have correct alarm thresholds for failed operations', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const failedPatchAlarm = Object.values(alarms).find((alarm: any) =>
        alarm.Properties.MetricName === 'FailedPatchOperations'
      ) as any;

      // Should alert if any patch operations fail
      expect(failedPatchAlarm.Properties.Threshold).toBe(1);
      expect(failedPatchAlarm.Properties.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('should handle different environment names', () => {
      const patchManagerConstruct = new PatchManagerConstruct(stack, 'TestPatchManagerConstruct', {
        environment: 'prod',
        alertTopic,
      });
      template = Template.fromStack(stack);

      template.hasResource('AWS::SSM::PatchBaseline', {
        Properties: {
          Name: 'SecurityPatchBaseline-prod',
          Description: 'Security patch baseline for prod environment',
        },
      });

      template.hasResource('AWS::SSM::MaintenanceWindow', {
        Properties: {
          Name: 'PatchMaintenanceWindow-prod',
          Description: 'Maintenance window for prod environment patching',
        },
      });
    });

    test('should use environment-specific patch group', () => {
      const patchManagerConstruct = new PatchManagerConstruct(stack, 'TestPatchManagerConstruct', {
        environment: 'prod',
        alertTopic,
      });
      template = Template.fromStack(stack);

      template.hasResource('AWS::SSM::MaintenanceWindowTarget', {
        Properties: {
          Targets: [
            {
              Key: 'tag:PatchGroup',
              Values: ['prod-servers'],
            },
          ],
        },
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('should expose patchBaseline property', () => {
      const patchManagerConstruct = new PatchManagerConstruct(stack, 'TestPatchManagerConstruct', {
        environment: 'test',
        alertTopic,
      });
      expect(patchManagerConstruct.patchBaseline).toBeDefined();
    });

    test('should have proper resource dependencies', () => {
      const patchManagerConstruct = new PatchManagerConstruct(stack, 'TestPatchManagerConstruct', {
        environment: 'test',
        alertTopic,
      });
      template = Template.fromStack(stack);

      // Check that required resources exist
      template.hasResource('AWS::SSM::PatchBaseline', {});
      template.hasResource('AWS::SSM::MaintenanceWindow', {});
      template.hasResource('AWS::SSM::MaintenanceWindowTarget', {});
      template.hasResource('AWS::SSM::MaintenanceWindowTask', {});
      template.hasResource('AWS::CloudWatch::Alarm', {});
    });
  });

  describe('Security Best Practices Validation', () => {
    beforeEach(() => {
      const patchManagerConstruct = new PatchManagerConstruct(stack, 'TestPatchManagerConstruct', {
        environment: 'test',
        alertTopic,
      });
      template = Template.fromStack(stack);
    });

    test('should only approve security patches with proper delay', () => {
      const patchBaselines = template.findResources('AWS::SSM::PatchBaseline');
      const patchBaseline = Object.values(patchBaselines)[0] as any;

      const patchRule = patchBaseline.Properties.ApprovalRules.PatchRules[0];
      
      // Should not enable non-security patches
      expect(patchRule.EnableNonSecurity).toBe(false);
      
      // Should have security classification filter
      const securityFilter = patchRule.PatchFilterGroup.PatchFilters.find((filter: any) =>
        filter.Key === 'CLASSIFICATION'
      );
      expect(securityFilter.Values).toContain('Security');
      
      // Should have proper approval delay
      expect(patchRule.ApproveAfterDays).toBeGreaterThan(0);
    });

    test('should have conservative maintenance window settings', () => {
      const maintenanceWindows = template.findResources('AWS::SSM::MaintenanceWindow');
      const maintenanceWindow = Object.values(maintenanceWindows)[0] as any;

      // Should not allow unassociated targets for security
      expect(maintenanceWindow.Properties.AllowUnassociatedTargets).toBe(false);
      
      // Should have reasonable duration and cutoff
      expect(maintenanceWindow.Properties.Duration).toBeGreaterThan(0);
      expect(maintenanceWindow.Properties.Cutoff).toBeGreaterThan(0);
    });

    test('should have proper monitoring and alerting', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      
      // Should have compliance monitoring
      const complianceAlarm = Object.values(alarms).find((alarm: any) =>
        alarm.Properties.MetricName === 'PatchCompliance'
      );
      expect(complianceAlarm).toBeDefined();
      
      // Should have failure monitoring
      const failureAlarm = Object.values(alarms).find((alarm: any) =>
        alarm.Properties.MetricName === 'FailedPatchOperations'
      );
      expect(failureAlarm).toBeDefined();
    });
  });
});
