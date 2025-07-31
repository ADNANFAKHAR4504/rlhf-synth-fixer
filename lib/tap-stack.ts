/* eslint-disable prettier/prettier */
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecureCloudEnvironmentConstruct } from './secure-cloud-environment-construct';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  isPrimaryRegion?: boolean;
  globalClusterId?: string;
  hostedZoneId?: string;
  domainName?: string;
}

export class TapStack extends cdk.Stack {
  public readonly secureCloudEnvironment: SecureCloudEnvironmentConstruct;

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
    this.secureCloudEnvironment = new SecureCloudEnvironmentConstruct(this, 'SecureCloudEnvironment', {
      environmentSuffix,
    });

    // --- Outputs ---
    new cdk.CfnOutput(this, 'ALB_DNS', {
      value: this.secureCloudEnvironment.alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
    });
    new cdk.CfnOutput(this, 'BastionHostId', {
      value: this.secureCloudEnvironment.bastionHost.instanceId,
      description: 'ID of the Bastion Host instance',
    });
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.secureCloudEnvironment.database.instanceEndpoint.hostname,
      description: 'Endpoint of the MySQL database instance',
    });
  }
}
