// lib/tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { PaymentMonitoringStack } from './payment-monitoring-stack';

export interface TapStackProps extends cdk.StackProps {
  /**
   * Optional suffix used to differentiate environments (e.g., "dev", "stg", "prod").
   */
  environmentSuffix?: string;

  /**
   * Optional project/app name used in stack naming and tagging.
   */
  projectName?: string;
}

/**
 * Return the first value that's not null/undefined.
 */
function firstNonNullish<T>(...vals: Array<T | null | undefined>): T {
  const hit = vals.find(v => v !== null && v !== undefined);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return hit as T; // safe because we always pass a final fallback
}

/**
 * Orchestrator stack: only instantiates other stacks.
 * Do NOT create resources directly in this stack.
 */
export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Resolve from props → context → default
    const environmentSuffix = firstNonNullish<string>(
      props?.environmentSuffix,
      this.node.tryGetContext('environmentSuffix'),
      'dev'
    );

    const projectName = firstNonNullish<string>(
      props?.projectName,
      this.node.tryGetContext('projectName'),
      'payment'
    );

    // Helpful, consistent naming
    const stackName = `${projectName}-monitoring-${environmentSuffix}`;

    // Global tags (apply to all child constructs/stacks under this scope)
    cdk.Tags.of(this).add('Project', projectName);
    cdk.Tags.of(this).add('Environment', environmentSuffix);

    // Instantiate child stack (no resources directly in TapStack)
    new PaymentMonitoringStack(
      this,
      `PaymentMonitoringStack-${environmentSuffix}`,
      {
        ...props,
        stackName,
        description: `Payment monitoring infrastructure for ${projectName} (${environmentSuffix}).`,
      }
    );
  }
}
