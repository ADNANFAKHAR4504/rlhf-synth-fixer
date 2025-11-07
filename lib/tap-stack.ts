// lib/tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import your stacks here
import { PaymentMonitoringStack } from './payment-monitoring-stack';

export interface TapStackProps extends cdk.StackProps {
  /**
   * Optional suffix used to differentiate environments (e.g., "dev", "stg", "prod").
   * Resolved from props, then context "environmentSuffix", then ENVIRONMENT_SUFFIX, falling back to "dev".
   */
  environmentSuffix?: string;

  /**
   * Optional project/app name used in stack naming and tagging.
   * Resolved from props, then context "projectName", falling back to "payment".
   */
  projectName?: string;
}

/** Extract default from a Bash-style token like ${ENVIRONMENT_SUFFIX:-dev} and sanitize for CFN-safe usage. */
function normalizeEnvSuffix(raw: unknown, fallback = 'dev'): string {
  const val = String(raw ?? '').trim();
  // Handle literal Bash default pattern on Windows/PowerShell:
  // ${ENVIRONMENT_SUFFIX:-dev}  ->  "dev"
  const m = /^\$\{\s*[A-Za-z_][A-Za-z0-9_]*\s*:-\s*([A-Za-z0-9-]+)\s*\}$/.exec(
    val
  );
  const extracted = m ? m[1] : val || fallback;

  // Sanitize to CFN-safe: letters, numbers, hyphen only
  let safe = extracted.replace(/[^A-Za-z0-9-]/g, '-');
  // Must start with a letter for CFN stack names
  if (!/^[A-Za-z]/.test(safe)) safe = `env-${safe}`;
  return safe;
}

/** Sanitize a project/app name for use in tags and CFN names. */
function normalizeProjectName(raw: unknown, fallback = 'payment'): string {
  let s = String(raw ?? '').trim() || fallback;
  s = s.replace(/[^A-Za-z0-9-]/g, '-');
  if (!/^[A-Za-z]/.test(s)) s = `app-${s}`;
  return s;
}

/**
 * Orchestrator stack: only instantiates other stacks.
 * Do NOT create resources directly in this stack.
 */
export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Resolve environment/project with cross-platform normalization
    const rawSuffix =
      props?.environmentSuffix ??
      this.node.tryGetContext('environmentSuffix') ??
      process.env.ENVIRONMENT_SUFFIX ??
      'dev';

    const environmentSuffix = normalizeEnvSuffix(rawSuffix, 'dev');

    const rawProject =
      props?.projectName ?? this.node.tryGetContext('projectName') ?? 'payment';

    const projectName = normalizeProjectName(rawProject, 'payment');

    // Consistent physical stack name for the child CloudFormation stack
    const stackName = `${projectName}-monitoring-${environmentSuffix}`;

    // Global tags (apply to all child constructs/stacks under this scope)
    cdk.Tags.of(this).add('Project', projectName);
    cdk.Tags.of(this).add('Environment', environmentSuffix);

    // Instantiate your stacks here (no resources directly in TapStack)
    // Payment Monitoring (composes constructs: dashboards, alarms, notifications, log-processing, log-retention)
    new PaymentMonitoringStack(
      this,
      `PaymentMonitoringStack-${environmentSuffix}`,
      {
        ...props,
        stackName,
        description: `Payment monitoring infrastructure for ${projectName} (${environmentSuffix}).`,
      }
    );

    // If you later split stacks by concern, instantiate them here instead, e.g.:
    // new DashboardsStack(this, `Dashboards-${environmentSuffix}`, { ...props, stackName: `${projectName}-dashboards-${environmentSuffix}` });
    // new AlarmsStack(this, `Alarms-${environmentSuffix}`, { ...props, stackName: `${projectName}-alarms-${environmentSuffix}` });
    // new NotificationsStack(this, `Notifications-${environmentSuffix}`, { ...props, stackName: `${projectName}-notifications-${environmentSuffix}` });
    // new LogProcessingStack(this, `LogProcessing-${environmentSuffix}`, { ...props, stackName: `${projectName}-logproc-${environmentSuffix}` });
    // new LogRetentionStack(this, `LogRetention-${environmentSuffix}`, { ...props, stackName: `${projectName}-logret-${environmentSuffix}` });
  }
}
