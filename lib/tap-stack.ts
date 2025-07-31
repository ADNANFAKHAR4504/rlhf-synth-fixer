import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecureCloudEnvironmentConstruct } from './secure-cloud-environment-construct';
import { SecureCloudEnvironmentConstruct } from './secure-cloud-environment-construct';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly secureEnvironment: SecureCloudEnvironmentConstruct;
  public readonly secureEnvironment: SecureCloudEnvironmentConstruct;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, {
      ...props,
      env: {
        ...props?.env,
        region: 'us-west-2', // Hardcode region as per PROMPT.md requirements
      },
    });

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Instantiate the Secure Cloud Environment construct
    this.secureEnvironment = new SecureCloudEnvironmentConstruct(this, 'SecureEnvironment', {
      environmentSuffix,
    });

    // --- Outputs ---
    new cdk.CfnOutput(this, 'ALB_DNS', {
      value: this.secureEnvironment.alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
    });
    new cdk.CfnOutput(this, 'BastionHostId', {
      value: this.secureEnvironment.bastionHost.instanceId,
      description: 'ID of the Bastion Host instance',
    });
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.secureEnvironment.database.instanceEndpoint.hostname,
      description: 'Endpoint of the MySQL database instance',
    });
  }
  }
}
