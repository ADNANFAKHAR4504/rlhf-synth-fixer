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

    // Load config
    this.config = this.loadConfig(props);
    this.showInfo();

    // Validate environment before tagging
    if (this.config.environment) {
      // Apply tags
      Tags.of(this).add('Environment', this.config.environment);

      // Build resources step by step
      this.vpc = this.setupVpc();
      this.bucket = this.setupS3Bucket();
      this.iamRoles = this.setupIamRoles();
      this.securityGroup = this.setupSecurityGroup();
      this.logging = this.setupCloudWatchLogging();
      this.instances = this.setupEC2Instances();

      this.addOutputs();
    } else {
      console.error(`No configuration found for '${this.environmentSuffix}'`);
    }
  }

  showInfo(id, props) {
    console.log(JSON.stringify(
      {
        environmentSuffix: this.environmentSuffix,
        id: id,
        props: props,
        config: this.config
      }));
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
      console.warn(`No configuration found for '${this.environmentSuffix}', falling back to 'dev'.`);
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
      if (this.config.createIfNotExists) {
        return new ec2.Vpc(this, `${this.stackName}-MockVPC`, { maxAzs: 2, natGateways: 1 });
      } else {
        throw new Error('VPC ID must be provided');
      }
    }
    return ec2.Vpc.fromLookup(this, `${this.stackName}-ExistingVPC`, { vpcId: this.config.existingVpcId });
  }

  setupS3Bucket() {
    if (!this.config.existingS3Bucket) {
      if (this.config.createIfNotExists) {
        return new s3.Bucket(this, `${this.stackName}-MockLogsBucket`, {
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          autoDeleteObjects: true,
          encryption: s3.BucketEncryption.S3_MANAGED,
        });
      } else {
        throw new Error('S3 bucket must be provided');
      }
    }
    return s3.Bucket.fromBucketName(this, `${this.stackName}-LogsBucket`, this.config.existingS3Bucket);
  }

  setupIamRoles() {
    return new IAMRolesConstruct(this, `${this.stackName}-IAMRoles`, {
      s3BucketName: this.bucket.bucketName,
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
