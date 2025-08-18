import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

// Import custom modules
import {
  ComputeModule,
  DatabaseModule,
  KmsModule,
  NetworkModule,
  StorageModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const project = 'tap'; // ✅ fixed project name
    const env = props?.environmentSuffix || 'dev';

    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';

    //const defaultTags = props?.defaultTags;

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      // defaultTags: defaultTags ? { tags: defaultTags.tags } : undefined,
    });

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${env}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // --- Instantiate Modules ---
    const network = new NetworkModule(this, 'network');
    const kms = new KmsModule(this, 'kms', { project, env });

    const compute = new ComputeModule(this, 'compute', {
      project,
      env,
      vpcId: network.vpc.id,
      subnetId: network.privateSubnetIds[0],
      kmsKeyId: kms.kmsKey.arn,
    });

    const database = new DatabaseModule(this, 'database', {
      project,
      env,
      vpcId: network.vpc.id,
      subnetIds: network.privateSubnetIds,
      kmsKeyArn: kms.kmsKey.arn,
    });

    const storage = new StorageModule(this, 'storage', {
      project,
      env,
      kmsKeyArn: kms.kmsKey.arn,
    });

    // --- Outputs ---
    new TerraformOutput(this, 'vpcId', {
      value: network.vpc.id,
    });

    new TerraformOutput(this, 'privateSubnetId', {
      value: network.privateSubnetIds[0],
    });

    new TerraformOutput(this, 'ec2InstanceId', {
      value: compute.instance.id,
    });

    new TerraformOutput(this, 'ec2PrivateIp', {
      value: compute.instance.privateIp,
    });

    new TerraformOutput(this, 'rdsInstanceEndpoint', {
      value: database.db.endpoint,
      sensitive: true,
    });

    new TerraformOutput(this, 's3BucketName', {
      value: storage.bucket.bucket,
    });
  }
}
