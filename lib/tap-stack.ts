import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ResourcesStack } from './resources-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly resourcesStack: ResourcesStack;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create the resources infrastructure stack
    this.resourcesStack = new ResourcesStack(this, 'ResourcesStack', {
      environmentSuffix,
      env: props?.env,
    });

    // Export outputs from nested stack to parent stack
    // CI/CD scripts expect outputs in the parent stack
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.resourcesStack.bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `${this.stackName}-S3BucketName`,
    });

    new cdk.CfnOutput(this, 'S3BucketArn', {
      value: this.resourcesStack.bucket.bucketArn,
      description: 'S3 Bucket ARN',
      exportName: `${this.stackName}-S3BucketArn`,
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: this.resourcesStack.instance.instanceId,
      description: 'EC2 Instance ID',
      exportName: `${this.stackName}-EC2InstanceId`,
    });

    new cdk.CfnOutput(this, 'EC2InstancePrivateIp', {
      value: this.resourcesStack.instance.instancePrivateIp,
      description: 'EC2 Instance Private IP',
      exportName: `${this.stackName}-EC2InstancePrivateIp`,
    });

    new cdk.CfnOutput(this, 'ElasticIP', {
      value: this.resourcesStack.eip.ref,
      description: 'Elastic IP Address',
      exportName: `${this.stackName}-ElasticIP`,
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: this.resourcesStack.securityGroup.securityGroupId,
      description: 'Security Group ID',
      exportName: `${this.stackName}-SecurityGroupId`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.resourcesStack.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'InstanceRoleArn', {
      value: this.resourcesStack.instanceRole.roleArn,
      description: 'EC2 Instance IAM Role ARN',
      exportName: `${this.stackName}-InstanceRoleArn`,
    });
  }
}
