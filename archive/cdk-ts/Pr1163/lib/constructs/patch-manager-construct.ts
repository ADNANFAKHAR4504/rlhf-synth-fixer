import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface PatchManagerConstructProps {
  environment: string;
  alertTopic: sns.Topic;
}

export class PatchManagerConstruct extends Construct {
  public readonly patchBaseline: ssm.CfnPatchBaseline;

  constructor(scope: Construct, id: string, props: PatchManagerConstructProps) {
    super(scope, id);

    const { environment, alertTopic } = props;

    // Create patch baseline for security updates
    this.patchBaseline = new ssm.CfnPatchBaseline(
      this,
      `PatchBaseline-${environment}`,
      {
        name: `SecurityPatchBaseline-${environment}`,
        description: `Security patch baseline for ${environment} environment`,
        operatingSystem: 'AMAZON_LINUX_2',
        approvalRules: {
          patchRules: [
            {
              approveAfterDays: 7,
              complianceLevel: 'CRITICAL',
              enableNonSecurity: false,
              patchFilterGroup: {
                patchFilters: [
                  {
                    key: 'CLASSIFICATION',
                    values: ['Security'],
                  },
                  {
                    key: 'SEVERITY',
                    values: ['Critical', 'Important'],
                  },
                ],
              },
            },
          ],
        },
        globalFilters: {
          patchFilters: [
            {
              key: 'PRODUCT',
              values: ['AmazonLinux2'],
            },
          ],
        },
        rejectedPatches: [],
        rejectedPatchesAction: 'ALLOW_AS_DEPENDENCY',
        sources: [],
      }
    );

    // Create maintenance window for patching
    const maintenanceWindow = new ssm.CfnMaintenanceWindow(
      this,
      `MaintenanceWindow-${environment}`,
      {
        name: `PatchMaintenanceWindow-${environment}`,
        description: `Maintenance window for ${environment} environment patching`,
        schedule: 'cron(0 2 ? * SUN *)', // Every Sunday at 2 AM
        duration: 4, // 4 hours
        cutoff: 1, // 1 hour before
        allowUnassociatedTargets: false,
      }
    );

    // Create maintenance window target
    new ssm.CfnMaintenanceWindowTarget(
      this,
      `MaintenanceWindowTarget-${environment}`,
      {
        windowId: maintenanceWindow.ref,
        resourceType: 'INSTANCE',
        targets: [
          {
            key: 'tag:PatchGroup',
            values: [`${environment}-servers`],
          },
        ],
      }
    );

    // Create maintenance window task for patching
    new ssm.CfnMaintenanceWindowTask(this, `PatchTask-${environment}`, {
      windowId: maintenanceWindow.ref,
      taskType: 'RUN_COMMAND',
      taskArn: 'AWS-RunPatchBaseline',
      priority: 1,
      maxConcurrency: '1',
      maxErrors: '1',
      targets: [
        {
          key: 'WindowTargetIds',
          values: [maintenanceWindow.ref],
        },
      ],
      taskParameters: {
        Operation: {
          Values: ['Install'],
        },
        RebootOption: {
          Values: ['RebootIfNeeded'],
        },
      },
    });

    // Create CloudWatch alarm for patch compliance
    const patchComplianceAlarm = new cloudwatch.Alarm(
      this,
      `PatchComplianceAlarm-${environment}`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/SSM',
          metricName: 'PatchCompliance',
          statistic: 'Average',
          period: cdk.Duration.hours(24),
          dimensionsMap: {
            PatchGroup: `${environment}-servers`,
          },
        }),
        threshold: 90, // Alert if compliance drops below 90%
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
        alarmDescription: `Patch compliance alarm for ${environment} environment`,
      }
    );

    patchComplianceAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    // Create CloudWatch alarm for failed patch operations
    const failedPatchAlarm = new cloudwatch.Alarm(
      this,
      `FailedPatchAlarm-${environment}`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/SSM',
          metricName: 'FailedPatchOperations',
          statistic: 'Sum',
          period: cdk.Duration.hours(1),
          dimensionsMap: {
            PatchGroup: `${environment}-servers`,
          },
        }),
        threshold: 1, // Alert if any patch operations fail
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `Failed patch operations alarm for ${environment} environment`,
      }
    );

    failedPatchAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    // Tag resources
    cdk.Tags.of(this.patchBaseline).add('Name', `PatchBaseline-${environment}`);
    cdk.Tags.of(this.patchBaseline).add('Component', 'PatchManager');
    cdk.Tags.of(this.patchBaseline).add('Environment', environment);
    cdk.Tags.of(maintenanceWindow).add(
      'Name',
      `MaintenanceWindow-${environment}`
    );
    cdk.Tags.of(maintenanceWindow).add('Component', 'PatchManager');
    cdk.Tags.of(maintenanceWindow).add('Environment', environment);
  }
}
