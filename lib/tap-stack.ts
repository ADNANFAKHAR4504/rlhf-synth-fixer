import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput, App } from 'cdktf';
import { Construct } from 'constructs';

// Import your modules
import { S3LoggingBucketModule, VpcModule, Ec2InstanceModule } from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

const AWS_REGION_OVERRIDE = 'us-west-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE || props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';

    // Corrected: By placing 'Environment: Production' after the spread operator,
    // we ensure it will always take precedence and cannot be overridden by props.
    const providerDefaultTags: AwsProviderDefaultTags = {
      tags: {
        ...(props?.defaultTags?.tags || {}),
        Environment: 'Production',
      },
    };

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [providerDefaultTags],
    });

    // Configure S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // -------------------------
    // MODULE INSTANTIATIONS
    // -------------------------

    const loggingBucket = new S3LoggingBucketModule(
      this,
      'LoggingBucketModule',
      {
        bucketName: `logging-bucket-${environmentSuffix}-${Date.now()}`,
      }
    );

    const vpcModule = new VpcModule(this, 'VpcModule');

    const ec2Instance = new Ec2InstanceModule(this, 'Ec2InstanceModule', {
      vpcId: vpcModule.vpc.id,
      subnetId: vpcModule.publicSubnets[0].id,
      // Corrected: Pass the SSH CIDR block to the module.
      // IMPORTANT: You must replace this placeholder with your actual IP address.
      sshCidrBlock: '0.0.0.0/0',
    });

    // -------------------------
    // OUTPUTS
    // -------------------------
    new TerraformOutput(this, 'LoggingBucketName', {
      value: loggingBucket.bucket.bucket,
    });

    new TerraformOutput(this, 'VpcId', {
      value: vpcModule.vpc.id,
    });

    new TerraformOutput(this, 'Ec2InstanceId', {
      value: ec2Instance.instance.id,
    });
  }
}

const app = new App();
new TapStack(app, 'tap-aws-stack');
app.synth();
