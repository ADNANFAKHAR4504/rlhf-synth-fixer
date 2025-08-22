import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

// Import resource constructs (not stacks)
import { Ec2Stack } from './ec2-stack';
import { KmsStack } from './kms-stack';
import { LambdaStack } from './lambda-stack';
import { RdsStack } from './rds-stack';
import { S3Stack } from './s3-stack';
import { VpcStack } from './vpc-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const AWS_REGION_OVERRIDE = process.env.AWS_REGION || '';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-west-2';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Instantiate resource constructs (not stacks)
    const vpcStack = new VpcStack(this, 'prodVpcStack', { environmentSuffix });

    const s3Stack = new S3Stack(this, 'prodS3Stack', {
      environmentSuffix,
      vpcId: vpcStack.vpcId,
    });

    new Ec2Stack(this, 'prodEc2Stack', {
      environmentSuffix,
      vpcId: vpcStack.vpcId,
      subnetId: vpcStack.subnetIds[0],
      securityGroupIds: [vpcStack.ec2SgId],
    });

    new LambdaStack(this, 'prodLambdaStack', {
      environmentSuffix,
      vpcId: vpcStack.vpcId,
      subnetIds: vpcStack.subnetIds,
      securityGroupIds: [vpcStack.lambdaSgId],
    });

    new RdsStack(this, 'prodRdsStack', {
      environmentSuffix,
      vpcId: vpcStack.vpcId,
      kmsKeyId: s3Stack.kmsKeyArn, // <-- Pass ARN, not ID
      subnetIds: vpcStack.subnetIds,
      securityGroupIds: [vpcStack.rdsSgId],
    });

    new KmsStack(this, 'prodKmsStack', {
      environmentSuffix,
    });

    new TerraformOutput(this, 's3_bucket_name', {
      value: s3Stack.bucketName,
    });
  }
}
