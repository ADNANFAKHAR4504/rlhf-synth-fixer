import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { CloudWatchLoggingConstruct } from './constructs/cloudwatch-logging.mjs';
import { EC2InstancesConstruct } from './constructs/ec2-instances.mjs';
import { IAMRolesConstruct } from './constructs/iam-roles.mjs';
import { SecurityGroupConstruct } from './constructs/security-group.mjs';

export class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Check if running in LocalStack or test mode
    this.isLocalStack = process.env.CDK_LOCAL === 'true' || process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true' || process.env.CDK_LOCAL === 'true' || 
                        process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                        process.env.LOCALSTACK_HOSTNAME !== undefined;

    this.environmentSuffix = props?.environmentSuffix || this.node.tryGetContext('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';
    this.config = this.loadConfig(props);

    if (this.config.environment) {
      Tags.of(this).add('Environment', this.config.environment);

      this.vpc = this.setupVpc();
      this.bucket = this.setupS3Bucket();
      this.logging = this.setupCloudWatchLogging();
      this.iamRoles = this.setupIamRoles();
      this.securityGroup = this.setupSecurityGroup();
      this.instances = this.setupEC2Instances();
      this.addOutputs();
    } else {
      console.error(`No configuration found for '${this.environmentSuffix}'`);
    }
  }

  loadConfig(props) {
    let cfg = null;
    let environments = null;

    if (props && props.config) {
      // Expect props.config to be env-keyed: { dev: {...}, qa: {...}, prod: {...} }
      environments = props.config;
      cfg = props.config[this.environmentSuffix]; // pick env-specific config
    } else {
      environments = this.node.tryGetContext('environments');
      if (environments) {
        cfg = environments[this.environmentSuffix];
      } else {
        throw new Error("No configuration found in 'props' or cdk.json context");
      }
    }

    if (!cfg) {
      if (this.environmentSuffix === 'prod') {
        throw new Error("No configuration found for 'prod'.");
      }
      console.info(`No configuration found for '${this.environmentSuffix}', falling back to 'dev'.`);
      cfg = environments?.['dev'];
    }

    if (!cfg) {
      throw new Error(
        `No configuration found for environment: '${this.environmentSuffix}' (even 'dev' is missing).`
      );
    }

    return cfg;
  }

  setupVpc() {
    if (!this.config.existingVpcId) {
      throw new Error('VPC ID must be provided');
    }

    // Use fromVpcAttributes for LocalStack/test (no AWS API lookup needed)
    // Use fromLookup for real AWS environments
    if (this.isLocalStack) {
      return ec2.Vpc.fromVpcAttributes(this, `${this.stackName}-VPC`, {
        vpcId: this.config.existingVpcId,
        vpcCidrBlock: this.config.vpcCidrBlock || '10.0.0.0/16',
        availabilityZones: this.config.availabilityZones || ['us-east-1a', 'us-east-1b'],
        publicSubnetIds: this.config.subnetIds || ['subnet-12345678'],
        privateSubnetIds: this.config.subnetIds || ['subnet-12345678'],
      });
    }

    return ec2.Vpc.fromLookup(this, `${this.stackName}-VPC`, {
      vpcId: this.config.existingVpcId
    });
  }

  setupS3Bucket() {
    if (!this.config.existingS3Bucket) {
      throw new Error('S3 bucket must be provided');
    }

    return s3.Bucket.fromBucketName(
      this,
      `${this.stackName}-LogsBucket`,
      this.config.existingS3Bucket
    );
  }

  setupIamRoles() {
    return new IAMRolesConstruct(this, `${this.stackName}-IAMRoles`, {
      s3BucketName: this.bucket.bucketName,
      logGroup: this.logging.logGroup
    });
  }

  setupSecurityGroup() {
    return new SecurityGroupConstruct(this, `${this.stackName}-SecurityGroup`, {
      vpc: this.vpc,
      sshCidrBlock: this.config.sshCidrBlock,
      trustedOutboundCidrs: this.config.trustedOutboundCidrs,
    });
  }

  setupCloudWatchLogging() {
    return new CloudWatchLoggingConstruct(this, `${this.stackName}-CloudWatchLogging`, {
      s3BucketName: this.bucket.bucketName,
    });
  }

  setupEC2Instances() {
    return new EC2InstancesConstruct(this, `${this.stackName}-EC2Instances`, {
      vpc: this.vpc,
      securityGroup: this.securityGroup.securityGroup,
      instanceProfile: this.iamRoles.instanceProfile,
      cloudWatchConfig: this.logging.cloudWatchConfig,
      isLocalStack: this.isLocalStack,
    });
  }

  addOutputs() {
    this.instances.instances.forEach((instance, index) => {
      new cdk.CfnOutput(this, `${this.stackName}-Instance${index + 1}Id`, {
        value: instance.instanceId,
        description: `Instance ID for web app instance ${index + 1}`,
      });

      new cdk.CfnOutput(this, `${this.stackName}-Instance${index + 1}PrivateIP`, {
        value: instance.instancePrivateIp,
        description: `Private IP for web app instance ${index + 1}`,
      });
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: this.securityGroup.securityGroup.securityGroupId,
      description: 'Security Group ID for web application instances',
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: this.logging.logGroup.logGroupName,
      description: 'CloudWatch Log Group name',
    });

    // Optional: export VPC and bucket if you need them in tests or other stacks
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID used by the stack',
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: this.bucket.bucketName,
      description: 'S3 bucket used for logs',
    });
  }
}
