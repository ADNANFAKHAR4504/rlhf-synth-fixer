import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';

// Import your modules
import {
  KmsModule,
  VpcModule,
  S3Module,
  RdsModule,
  Ec2Module,
  CloudFrontModule,
  CloudTrailModule,
  IamModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  project?: string;
  acmCertArn?: string;
}

const AWS_REGION_OVERRIDE = 'us-west-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];
    const project = props?.project || 'tap';
    const acmCertArn = props?.acmCertArn;

    // Configure AWS Provider
    const awsProvider = new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure Random Provider
    new RandomProvider(this, 'random', {});

    // Configure S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // 1. KMS Key (needed by other modules)
    const kmsModule = new KmsModule(this, 'kms', {
      project,
      env: environmentSuffix,
      provider: awsProvider,
    });

    // 2. VPC and networking - USE 'network' to match existing state
    const networkModule = new VpcModule(this, 'network', awsProvider);

    // 3. S3 bucket - USE 'storage' to match existing state
    const storageModule = new S3Module(this, 'storage', {
      project,
      env: environmentSuffix,
      kmsKeyArn: kmsModule.kmsKey.arn,
      provider: awsProvider,
      enableCloudFront: !!acmCertArn,
    });

    // 4. RDS - USE 'database' to match existing state
    const databaseModule = new RdsModule(this, 'database', {
      project,
      env: environmentSuffix,
      subnetIds: networkModule.privateSubnetIds,
      kmsKeyArn: kmsModule.kmsKey.arn,
      provider: awsProvider,
    });

    // 5. EC2 instance - USE 'compute' to match existing state
    const computeModule = new Ec2Module(this, 'compute', {
      project,
      env: environmentSuffix,
      vpcId: networkModule.vpc.id,
      subnetId: networkModule.privateSubnetIds[0],
      kmsKeyId: kmsModule.kmsKey.id,
      provider: awsProvider,
    });

    // 6. CloudFront distribution
    if (acmCertArn && storageModule.oai) {
      new CloudFrontModule(this, 'cloudfront', {
        project,
        env: environmentSuffix,
        acmCertArn,
        s3OriginDomainName: storageModule.bucket.bucketRegionalDomainName,
        originAccessIdentity: storageModule.oai.cloudfrontAccessIdentityPath,
        provider: awsProvider,
      });
    }

    // 7. CloudTrail for audit logging
    new CloudTrailModule(this, 'cloudtrail', {
      project,
      env: environmentSuffix,
      kmsKeyId: kmsModule.kmsKey.id,
      provider: awsProvider,
    });

    // 8. IAM users and policies
    new IamModule(this, 'iam', {
      project,
      env: environmentSuffix,
      provider: awsProvider,
    });

    // --- Outputs ---
    new TerraformOutput(this, 'VpcId', {
      description: 'ID of the provisioned VPC',
      value: networkModule.vpc.id, // Updated reference
    });

    new TerraformOutput(this, 'PrivateSubnetIds', {
      description: 'IDs of the private subnets',
      value: networkModule.privateSubnetIds, // Updated reference
    });

    new TerraformOutput(this, 'S3BucketName', {
      description: 'Name of the secure S3 bucket',
      value: storageModule.bucket.bucket,
    });

    new TerraformOutput(this, 'S3BucketArn', {
      description: 'ARN of the secure S3 bucket',
      value: storageModule.bucket.arn,
    });

    new TerraformOutput(this, 'Ec2InstanceId', {
      description: 'ID of the EC2 instance',
      value: computeModule.instance.id,
    });

    new TerraformOutput(this, 'Ec2InstancePrivateIp', {
      description: 'Private IP address of the EC2 instance',
      value: computeModule.instance.privateIp,
    });

    new TerraformOutput(this, 'RdsInstanceId', {
      description: 'ID of the RDS instance',
      value: databaseModule.db.id,
    });

    new TerraformOutput(this, 'RdsEndpoint', {
      description: 'RDS instance endpoint',
      value: databaseModule.db.endpoint,
    });

    new TerraformOutput(this, 'RdsSecretArn', {
      description: 'ARN of the RDS credentials secret',
      value: databaseModule.dbSecret.arn,
    });

    new TerraformOutput(this, 'KmsKeyId', {
      description: 'ID of the KMS key used for encryption',
      value: kmsModule.kmsKey.id,
    });

    new TerraformOutput(this, 'KmsKeyArn', {
      description: 'ARN of the KMS key used for encryption',
      value: kmsModule.kmsKey.arn,
    });
  }
}
