import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecureCloudEnvironmentConstruct } from './secure-cloud-environment-construct';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
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
    this.secureEnvironment = new SecureCloudEnvironmentConstruct(
      this,
      'SecureEnvironment',
      {
        environmentSuffix,
      }
    );

    // --- Outputs ---
    new cdk.CfnOutput(this, 'ALBDNS', {
      value: this.secureEnvironment.alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'RDSEndpoint', {
      value: this.secureEnvironment.database.instanceEndpoint.hostname,
      description: 'RDS MySQL database endpoint',
    });

    new cdk.CfnOutput(this, 'LogBucketName', {
      value: this.secureEnvironment.logBucket.bucketName,
      description: 'S3 bucket for access logs',
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: this.secureEnvironment.vpc.vpcId,
      description: 'VPC ID for the secure environment',
    });

    new cdk.CfnOutput(this, 'BastionHostId', {
      value: this.secureEnvironment.bastionHost.instanceId,
      description: 'Bastion Host Instance ID',
    });
  }
}
