// lib/tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import your stacks here
import { PaymentMonitoringStack } from './payment-monitoring-stack';

export interface TapStackProps extends cdk.StackProps {
  /**
   * Optional suffix used to differentiate environments (e.g., "dev", "stg", "prod").
   * Resolved from props, then context "environmentSuffix", falling back to "dev".
   */
  environmentSuffix?: string;

  /**
   * Optional project/app name used in stack naming and tagging.
   * Resolved from props, then context "projectName", falling back to "payment".
   */
  projectName?: string;
}

/**
 * Orchestrator stack: only instantiates other stacks.
 * Do NOT create resources directly in this stack.
 */
export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Resolve environment-specific values
    const environmentSuffix =
      props?.environmentSuffix ??
      this.node.tryGetContext('environmentSuffix') ??
      'dev';

    const projectName: string =
      props?.projectName ??
      this.node.tryGetContext('projectName') ??
      'payment';

    // Helpful, consistent naming
    const stackName = `${projectName}-monitoring-${environmentSuffix}`;

    // Global tags (apply to all child constructs/stacks under this scope)
    cdk.Tags.of(this).add('Project', projectName);
    cdk.Tags.of(this).add('Environment', environmentSuffix);

    // Instantiate your stacks here (no resources directly in TapStack)
    // Payment Monitoring (composes constructs: dashboards, alarms, notifications, log-processing, log-retention)
    new PaymentMonitoringStack(this, `PaymentMonitoringStack-${environmentSuffix}`, {
      ...props,
      stackName,
      description: `Payment monitoring infrastructure for ${projectName} (${environmentSuffix}).`,
    });

    // If you later split stacks by concern, instantiate them here instead, e.g.:
    // new DashboardsStack(this, `Dashboards-${environmentSuffix}`, { ...props, stackName: `${projectName}-dashboards-${environmentSuffix}` });
    // new AlarmsStack(this, `Alarms-${environmentSuffix}`, { ...props, stackName: `${projectName}-alarms-${environmentSuffix}` });
    // new NotificationsStack(this, `Notifications-${environmentSuffix}`, { ...props, stackName: `${projectName}-notifications-${environmentSuffix}` });
    // new LogProcessingStack(this, `LogProcessing-${environmentSuffix}`, { ...props, stackName: `${projectName}-logproc-${environmentSuffix}` });
    // new LogRetentionStack(this, `LogRetention-${environmentSuffix}`, { ...props, stackName: `${projectName}-logret-${environmentSuffix}` });
  }
}
