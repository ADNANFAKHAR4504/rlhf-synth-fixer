import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly devOpsGroupArn: string;
  public readonly customEC2PolicyArn: string;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create the DevOps IAM user group
    const devOpsGroup = new iam.Group(this, 'DevOpsGroup', {
      groupName: `DevOps-${environmentSuffix}`,
    });

    // Attach the AWS managed policy AmazonS3ReadOnlyAccess to the DevOps group
    devOpsGroup.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess')
    );

    // Create custom IAM policy for EC2 start/stop permissions
    const customEC2Policy = new iam.ManagedPolicy(this, 'CustomEC2Policy', {
      managedPolicyName: `CustomEC2Policy-${environmentSuffix}`,
      description: 'Policy to allow starting and stopping EC2 instances',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ec2:StartInstances',
            'ec2:StopInstances',
            'ec2:DescribeInstances',
            'ec2:DescribeInstanceStatus',
          ],
          resources: ['*'],
        }),
      ],
    });

    // Attach the custom EC2 policy to the DevOps group
    devOpsGroup.addManagedPolicy(customEC2Policy);

    // Add consistent tags to all IAM resources
    cdk.Tags.of(devOpsGroup).add('Environment', environmentSuffix);
    cdk.Tags.of(devOpsGroup).add('Department', 'DevOps');

    cdk.Tags.of(customEC2Policy).add('Environment', environmentSuffix);
    cdk.Tags.of(customEC2Policy).add('Department', 'DevOps');

    // Export outputs for testing and reference
    this.devOpsGroupArn = devOpsGroup.groupArn;
    this.customEC2PolicyArn = customEC2Policy.managedPolicyArn;

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'DevOpsGroupArn', {
      value: devOpsGroup.groupArn,
      description: 'ARN of the DevOps IAM group',
      exportName: `DevOpsGroupArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CustomEC2PolicyArn', {
      value: customEC2Policy.managedPolicyArn,
      description: 'ARN of the custom EC2 policy',
      exportName: `CustomEC2PolicyArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DevOpsGroupName', {
      value: devOpsGroup.groupName,
      description: 'Name of the DevOps IAM group',
      exportName: `DevOpsGroupName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CustomEC2PolicyName', {
      value: customEC2Policy.managedPolicyName!,
      description: 'Name of the custom EC2 policy',
      exportName: `CustomEC2PolicyName-${environmentSuffix}`,
    });
  }
}
