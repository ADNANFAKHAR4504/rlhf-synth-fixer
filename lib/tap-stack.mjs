import * as cdk from 'aws-cdk-lib';
const { Stack } = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const { SecurityGroupConstruct } = require('./constructs/security-group.mjs');
const { IAMRolesConstruct } = require('./constructs/iam-roles.mjs');
const { CloudWatchLoggingConstruct } = require('./constructs/cloudwatch-logging.mjs');
const { EC2InstancesConstruct } = require('./constructs/ec2-instances');

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

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
      new require('aws-cdk-lib').CfnOutput(this, `Instance${index + 1}Id`, {
        value: instance.instanceId,
        description: `Instance ID for web app instance ${index + 1}`
      });

      new require('aws-cdk-lib').CfnOutput(this, `Instance${index + 1}PrivateIP`, {
        value: instance.instancePrivateIp,
        description: `Private IP for web app instance ${index + 1}`
      });
    });

    new require('aws-cdk-lib').CfnOutput(this, 'SecurityGroupId', {
      value: securityGroup.securityGroup.securityGroupId,
      description: 'Security Group ID for web application instances'
    });

    new require('aws-cdk-lib').CfnOutput(this, 'LogGroupName', {
      value: logging.logGroup.logGroupName,
      description: 'CloudWatch Log Group name'
    });
  }
}

export { TapStack };
