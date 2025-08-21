import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { CloudWatchLoggingConstruct } from './constructs/cloudwatch-logging.mjs';
import { EC2InstancesConstruct } from './constructs/ec2-instances.mjs';
import { IAMRolesConstruct } from './constructs/iam-roles.mjs';
import { SecurityGroupConstruct } from './constructs/security-group.mjs';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Apply Environment tag to everything in this stack
    Tags.of(this).add("Environment", props.config.environment);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const { config } = props;

    // Import existing VPC
    const vpc = ec2.Vpc.fromLookup(this, 'ExistingVPC', {
      vpcId: config.vpcId
    });

    // Create IAM roles and policies
    const iamRoles = new IAMRolesConstruct(this, 'IAMRoles', {
      s3BucketName: config.existingS3Bucket
    });

    // Create security group
    const securityGroup = new SecurityGroupConstruct(this, 'SecurityGroup', {
      vpc: vpc,
      sshCidrBlock: config.sshCidrBlock,
      trustedOutboundCidrs: config.trustedOutboundCidrs
    });

    // Create CloudWatch logging setup
    const logging = new CloudWatchLoggingConstruct(this, 'CloudWatchLogging', {
      s3BucketName: config.existingS3Bucket
    });

    // Create EC2 instances
    const instances = new EC2InstancesConstruct(this, 'EC2Instances', {
      vpc: vpc,
      securityGroup: securityGroup.securityGroup,
      instanceProfile: iamRoles.instanceProfile,
      cloudWatchConfig: logging.cloudWatchConfig
    });

    // Output important information
    instances.instances.forEach((instance, index) => {
      new cdk.CfnOutput(this, `Instance${index + 1}Id`, {
        value: instance.instanceId,
        description: `Instance ID for web app instance ${index + 1}`
      });

      new cdk.CfnOutput(this, `Instance${index + 1}PrivateIP`, {
        value: instance.instancePrivateIp,
        description: `Private IP for web app instance ${index + 1}`
      });
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: securityGroup.securityGroup.securityGroupId,
      description: 'Security Group ID for web application instances'
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: logging.logGroup.logGroupName,
      description: 'CloudWatch Log Group name'
    });
  }
}

export { TapStack };
