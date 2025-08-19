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

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

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
    const project = props?.project || 'tap-project';
    const acmCertArn = props?.acmCertArn;

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    const awsProvider = new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure Random Provider for password generation
    new RandomProvider(this, 'random', {});

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Instantiate your modules in logical order

    // 1. KMS Key (needed by other modules)
    const kmsModule = new KmsModule(this, 'kms', {
      project,
      env: environmentSuffix,
      provider: awsProvider,
    });

    // 2. VPC and networking
    const vpcModule = new VpcModule(this, 'vpc', awsProvider);

    // 3. S3 bucket with KMS encryption and optional CloudFront support
    const s3Module = new S3Module(this, 's3', {
      project,
      env: environmentSuffix,
      kmsKeyArn: kmsModule.kmsKey.arn,
      provider: awsProvider,
      enableCloudFront: !!acmCertArn, // Enable CloudFront support if ACM cert is provided
    });

    // 4. RDS with Secrets Manager
    const rdsModule = new RdsModule(this, 'rds', {
      project,
      env: environmentSuffix,
      subnetIds: vpcModule.privateSubnetIds,
      kmsKeyArn: kmsModule.kmsKey.arn,
      provider: awsProvider,
    });

    // 5. EC2 instance
    const ec2Module = new Ec2Module(this, 'ec2', {
      project,
      env: environmentSuffix,
      vpcId: vpcModule.vpc.id,
      subnetId: vpcModule.privateSubnetIds[0],
      kmsKeyId: kmsModule.kmsKey.id,
      provider: awsProvider,
    });

    // 6. CloudFront distribution (only if ACM cert is provided)
    if (acmCertArn && s3Module.oai) {
      new CloudFrontModule(this, 'cloudfront', {
        project,
        env: environmentSuffix,
        acmCertArn,
        s3OriginDomainName: s3Module.bucket.bucketRegionalDomainName,
        originAccessIdentity: s3Module.oai.cloudfrontAccessIdentityPath,
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
      value: vpcModule.vpc.id,
    });

    new TerraformOutput(this, 'PrivateSubnetIds', {
      description: 'IDs of the private subnets',
      value: vpcModule.privateSubnetIds,
    });

    new TerraformOutput(this, 'S3BucketName', {
      description: 'Name of the secure S3 bucket',
      value: s3Module.bucket.bucket,
    });

    new TerraformOutput(this, 'S3BucketArn', {
      description: 'ARN of the secure S3 bucket',
      value: s3Module.bucket.arn,
    });

    new TerraformOutput(this, 'Ec2InstanceId', {
      description: 'ID of the EC2 instance',
      value: ec2Module.instance.id,
    });

    new TerraformOutput(this, 'Ec2InstancePrivateIp', {
      description: 'Private IP address of the EC2 instance',
      value: ec2Module.instance.privateIp,
    });

    new TerraformOutput(this, 'RdsInstanceId', {
      description: 'ID of the RDS instance',
      value: rdsModule.db.id,
    });

    new TerraformOutput(this, 'RdsEndpoint', {
      description: 'RDS instance endpoint',
      value: rdsModule.db.endpoint,
    });

    new TerraformOutput(this, 'RdsSecretArn', {
      description: 'ARN of the RDS credentials secret',
      value: rdsModule.dbSecret.arn,
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
