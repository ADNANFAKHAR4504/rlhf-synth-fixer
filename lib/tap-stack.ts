//fix issues
//fix another issue
//improve test coverage
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
        region: 'us-west-2',
        ...props?.env,
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

    // Output important values
    new cdk.CfnOutput(this, 'ALBDNS', {
      value: this.secureEnvironment.alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'BastionHostId', {
      value: this.secureEnvironment.bastionHost.instanceId,
      description: 'Bastion host instance ID for secure access',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.secureEnvironment.database.instanceEndpoint.hostname,
      description: 'RDS MySQL database endpoint',
    });

    new cdk.CfnOutput(this, 'LogBucketName', {
      value: this.secureEnvironment.logBucket.bucketName,
      description: 'S3 bucket for infrastructure logs',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.secureEnvironment.vpc.vpcId,
      description: 'VPC ID for the secure environment',
    });
  }
}
