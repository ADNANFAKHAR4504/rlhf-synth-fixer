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

    this.environmentSuffix = props.environmentSuffix || 'dev';
    this.createIfNotExists = props.createIfNotExists ?? false;

    // Load config
    this.config = this.loadConfig();

    // Apply tags
    Tags.of(this).add('Environment', this.config.environment);

    // Build resources step by step
    this.vpc = this.setupVpc();
    this.iamRoles = this.setupIamRoles();
    this.securityGroup = this.setupSecurityGroup();
    this.logging = this.setupCloudWatchLogging();
    this.instances = this.setupEC2Instances();

    this.addOutputs();
  }

  loadConfig() {
    const environments = this.node.tryGetContext('environments');
    if (!environments) {
      throw new Error("No 'environments' config found in cdk.json context");
    }

    let cfg = environments[this.environmentSuffix];
    if (!cfg) {
      if (this.environmentSuffix === 'prod') {
        throw new Error("No configuration found for 'prod'.");
      }
      console.warn(`No config for "${this.environmentSuffix}", falling back to "dev".`);
      cfg = environments['dev'];
    }
    if (!cfg) {
      throw new Error(
        `No configuration found for environment: ${this.environmentSuffix} (even 'dev' is missing).`
      );
    }
    return cfg;
  }

  setupVpc() {
    if (this.config.vpcId) {
      return ec2.Vpc.fromLookup(this, `${this.stackName}-ExistingVPC`, {
        vpcId: this.config.vpcId,
      });
    }

    if (this.createIfNotExists) {
      return new ec2.Vpc(this, `${this.stackName}-NewVPC`, {
        maxAzs: 2,
        natGateways: 1,
      });
    }

    throw new Error("VPC not found and createIfNotExists is false");
  }

  setupIamRoles() {
    return new IAMRolesConstruct(this, `${this.stackName}-IAMRoles`, {
      s3BucketName: this.config.existingS3Bucket,
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
    if (this.config.existingS3Bucket) {
      return new CloudWatchLoggingConstruct(this, `${this.stackName}-CloudWatchLogging`, {
        s3BucketName: this.config.existingS3Bucket,
      });
    }

    if (this.createIfNotExists) {
      const bucket = new s3.Bucket(this, `${this.stackName}-NewLogsBucket`, {
        encryption: s3.BucketEncryption.S3_MANAGED,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });

      return new CloudWatchLoggingConstruct(this, `${this.stackName}-CloudWatchLogging`, {
        s3BucketName: bucket.bucketName,
      });
    }

    throw new Error("S3 bucket not found and createIfNotExists is false");
  }

  setupEC2Instances() {
    return new EC2InstancesConstruct(this, `${this.stackName}-EC2Instances`, {
      vpc: this.vpc,
      securityGroup: this.securityGroup.securityGroup,
      instanceProfile: this.iamRoles.instanceProfile,
      cloudWatchConfig: this.logging.cloudWatchConfig,
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

    new cdk.CfnOutput(this, `${this.stackName}-SecurityGroupId`, {
      value: this.securityGroup.securityGroup.securityGroupId,
      description: 'Security Group ID for web application instances',
    });

    new cdk.CfnOutput(this, `${this.stackName}-LogGroupName`, {
      value: this.logging.logGroup.logGroupName,
      description: 'CloudWatch Log Group name',
    });
  }
}
