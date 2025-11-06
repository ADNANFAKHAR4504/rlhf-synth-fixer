import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CloudSetupStack } from './cloud-setup-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  existingVpcId?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Instantiate CloudSetup as a construct within this single TapStack (no nested stacks)
    const usEast = new CloudSetupStack(
      this,
      `CloudSetupUsEast1-${environmentSuffix}`,
      {
        domainName: `cloudsetup-${environmentSuffix}.example.com`,
        environmentSuffix,
        createHostedZone: false,
        existingVpcId: props?.existingVpcId,
      }
    );

    // Instantiate CloudSetupStack for eu-west-1
    /*
    const euWest = new CloudSetupStack(this, `CloudSetupEuWest1-${environmentSuffix}`, {
      env: { region: 'eu-west-1', account: props?.env?.account },
      domainName: `eu.cloudsetup-${environmentSuffix}.example.com`,
      environmentSuffix,
    });
    */

    // Re-export important outputs so the top-level stack shows flat outputs
    new cdk.CfnOutput(this, 'UsEast_VpcId', { value: usEast.vpcId });
    new cdk.CfnOutput(this, 'UsEast_RdsEndpoint', {
      value: usEast.rdsEndpoint ?? '',
    });
    new cdk.CfnOutput(this, 'UsEast_BucketName', {
      value: usEast.bucketName ?? '',
    });
    new cdk.CfnOutput(this, 'UsEast_AlbDns', { value: usEast.albDns ?? '' });
    new cdk.CfnOutput(this, 'UsEast_CloudFrontUrl', {
      value: usEast.cloudFrontUrl ?? '',
    });
    // Helpful additional outputs for integration tests
    new cdk.CfnOutput(this, 'UsEast_LambdaFunctionName', {
      value: usEast.lambdaFunctionName ?? '',
    });
    new cdk.CfnOutput(this, 'UsEast_LambdaLogGroup', {
      value: usEast.lambdaLogGroupName ?? '',
    });
    new cdk.CfnOutput(this, 'UsEast_RdsSecurityGroupId', {
      value: usEast.rdsSecurityGroupId ?? '',
    });

    /*
    new cdk.CfnOutput(this, 'EuWest_VpcId', { value: euWest.vpcId });
    new cdk.CfnOutput(this, 'EuWest_RdsEndpoint', { value: euWest.rdsEndpoint ?? '' });
    new cdk.CfnOutput(this, 'EuWest_BucketName', { value: euWest.bucketName ?? '' });
    new cdk.CfnOutput(this, 'EuWest_AlbDns', { value: euWest.albDns ?? '' });
    new cdk.CfnOutput(this, 'EuWest_CloudFrontUrl', { value: euWest.cloudFrontUrl ?? '' });
    */
  }
}
