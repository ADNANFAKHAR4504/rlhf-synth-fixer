import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiGatewayMonitoringStack } from './api-gateway-monitoring-stack';
import { PaymentMonitoringStack } from './payment-monitoring-stack';
import { RdsEcsMonitoringStack } from './rds-ecs-monitoring-stack';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  projectName?: string;
}

function firstNonNullish<T>(...vals: Array<T | null | undefined>): T {
  const hit = vals.find(v => v !== null && v !== undefined);
  return hit as T;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

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

    const normalizedProjectName =
      projectName === 'payment' || projectName.startsWith('payment-')
        ? projectName
        : `payment-${projectName}`;

    cdk.Tags.of(this).add('Project', projectName);
    cdk.Tags.of(this).add('Environment', environmentSuffix);

    // Set context on this stack before creating child stacks
    this.node.setContext('environmentSuffix', environmentSuffix);
    this.node.setContext('projectName', projectName);

    // Create PaymentMonitoringStack
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const paymentStack = new PaymentMonitoringStack(
      this,
      `PaymentMonitoringStack-${environmentSuffix}`,
      {
        stackName: `${normalizedProjectName.replace(
          /^payment-/,
          ''
        )}-monitoring-${environmentSuffix}`,
        description: `Payment monitoring infrastructure for ${projectName} (${environmentSuffix}).`,
      }
    );

    // Create ApiGatewayMonitoringStack
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const apiStack = new ApiGatewayMonitoringStack(
      this,
      `ApiGatewayMonitoringStack-${environmentSuffix}`,
      {
        stackName: `${normalizedProjectName}-apigw-monitoring-${environmentSuffix}`,
        description: `API Gateway monitoring for ${projectName} (${environmentSuffix}).`,
        environmentSuffix,
        projectName,
      }
    );

    // Create RdsEcsMonitoringStack
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const rdsStack = new RdsEcsMonitoringStack(
      this,
      `RdsEcsMonitoringStack-${environmentSuffix}`,
      {
        stackName: `${normalizedProjectName}-rds-ecs-monitoring-${environmentSuffix}`,
        description: `RDS and ECS monitoring for ${projectName} (${environmentSuffix}).`,
        environmentSuffix,
        projectName,
      }
    );
  }
}
