import * as aws from '@pulumi/aws';
import { MigrationConfig } from './config';
import { IamRoles } from './iam-roles';

export interface EventBridgeResources {
  centralEventBus: aws.cloudwatch.EventBus;
  migrationEventRule: aws.cloudwatch.EventRule;
  eventLogGroup: aws.cloudwatch.LogGroup;
  eventTarget: aws.cloudwatch.EventTarget;
}

export function createEventBridge(
  config: MigrationConfig,
  _iamRoles: IamRoles
): EventBridgeResources {
  // Central Event Bus for migration events
  const centralEventBus = new aws.cloudwatch.EventBus(
    `migration-events-${config.environmentSuffix}`,
    {
      name: `migration-events-${config.environmentSuffix}`,
      tags: {
        Name: `migration-events-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
        MigrationComponent: 'eventbridge',
      },
    }
  );

  // CloudWatch Log Group for events
  const eventLogGroup = new aws.cloudwatch.LogGroup(
    `migration-event-logs-${config.environmentSuffix}`,
    {
      name: `/aws/events/migration-${config.environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `migration-event-logs-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
        MigrationComponent: 'eventbridge',
      },
    }
  );

  // Event Rule to capture migration events
  const migrationEventRule = new aws.cloudwatch.EventRule(
    `migration-rule-${config.environmentSuffix}`,
    {
      name: `migration-rule-${config.environmentSuffix}`,
      description: `Capture migration events for ${config.environmentSuffix}`,
      eventBusName: centralEventBus.name,
      eventPattern: JSON.stringify({
        source: ['migration.orchestrator'],
        'detail-type': [
          'Migration Started',
          'Migration Progress',
          'Migration Completed',
          'Migration Failed',
          'Rollback Initiated',
        ],
      }),
      tags: {
        Name: `migration-rule-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
        MigrationComponent: 'eventbridge',
      },
    }
  );

  // Event Target - Send to CloudWatch Logs
  const eventTarget = new aws.cloudwatch.EventTarget(
    `migration-event-target-${config.environmentSuffix}`,
    {
      rule: migrationEventRule.name,
      eventBusName: centralEventBus.name,
      arn: eventLogGroup.arn,
      targetId: `migration-logs-${config.environmentSuffix}`,
    }
  );

  return {
    centralEventBus,
    migrationEventRule,
    eventLogGroup,
    eventTarget,
  };
}
