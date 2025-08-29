import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { Fn, S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

// Import your modules
import {
  CloudTrailModule,
  Ec2Module,
  IamModule,
  KmsModule,
  RdsModule,
  S3Module,
  SecurityGroupModule,
  VpcModule,
} from './modules';

// Random provider (for stable unique bucket suffix + compliant DB password)
import { Provider as RandomProvider } from '@cdktf/provider-random/lib/provider';
import { Id as RandomId } from '@cdktf/provider-random/lib/id';
import { Password as RandomPassword } from '@cdktf/provider-random/lib/password';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  // testing override for region
  _regionOverrideForTesting?: string | null;
}

// Default region override
const AWS_REGION_OVERRIDE = 'us-west-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = (props?.environmentSuffix || 'dev').toLowerCase();

    // Use testing override if provided, else constant
    const regionOverride =
      props?._regionOverrideForTesting !== undefined
        ? props._regionOverrideForTesting
        : AWS_REGION_OVERRIDE;

    const awsRegion = (regionOverride ? regionOverride : props?.awsRegion || 'us-west-2').toLowerCase();

    const stateBucketRegion = props?.stateBucketRegion || 'us-west-2';
    const stateBucket = props?.stateBucket || 'prod-config-logs-us-west-2-a8e48bba';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Providers
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags,
    });

    new RandomProvider(this, 'random');

    // Who am I (for stable uniqueness keepers)
    const current = new DataAwsCallerIdentity(this, 'current');

    // Backend with lockfile
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Project name (keep lowercase and simple; don't toLowerCase() tokenized strings)
    const project = 'tap-project';

    // ===== Stable, unique suffix for S3 bucket names (per env/region/account) =====
    // Using "keepers" ensures the random value is stable for the tuple (env, region, account)
    const bucketSuffix = new RandomId(this, 'bucket_suffix', {
      byteLength: 2,
      keepers: {
        env: environmentSuffix,
        region: awsRegion,
        // token ok here; stability comes from account + env + region
        account: current.accountId,
      },
    }).hex;

    // Build a globally-unique, DNS-compliant bucket name (no upper-case or invalid chars)
    // IMPORTANT: Don't call .toLowerCase() on tokenized strings; use only lowercase constants + tokens.
    const appDataBucketName = `${project}-${environmentSuffix}-app-${awsRegion}-${bucketSuffix}`;

    // ===== KMS for encryption =====
    const kmsModule = new KmsModule(this, 'kms', {
      project,
      environment: environmentSuffix,
      description: `KMS key for ${project} ${environmentSuffix} environment`,
      accountId: current.accountId,
    });

    // ===== S3 (App data) - unique bucket to avoid BucketAlreadyOwnedByYou =====
    const s3Module = new S3Module(this, 's3-app-data', {
      project,
      environment: environmentSuffix,
      bucketName: appDataBucketName,
      kmsKey: kmsModule.key,
    });

    // ===== CloudTrail (auditing) =====
    const cloudTrailModule = new CloudTrailModule(this, 'cloudtrail', {
      project,
      environment: environmentSuffix,
      kmsKey: kmsModule.key,
      accountId: current.accountId,
      region: awsRegion,
    });

    // ===== IAM for EC2 =====
    const iamModule = new IamModule(this, 'iam', {
      project,
      environment: environmentSuffix,
      appDataBucketArn: s3Module.bucket.arn,
    });

    // ===== VPC =====
    const vpcModule = new VpcModule(this, 'vpc', {
      project,
      environment: environmentSuffix,
      cidrBlock: '10.0.0.0/16',
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],
    });

    // ===== Security Groups =====
    const ec2SecurityGroup = new SecurityGroupModule(this, 'ec2-sg', {
      project,
      environment: environmentSuffix,
      name: 'ec2',
      description: 'Security group for EC2 instances',
      vpcId: vpcModule.vpc.id,
      rules: [
        {
          type: 'ingress',
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'], // tighten in production
        },
        {
          type: 'egress',
          fromPort: 0,
          toPort: 65535,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
    });

    const rdsSecurityGroup = new SecurityGroupModule(this, 'rds-sg', {
      project,
      environment: environmentSuffix,
      name: 'rds',
      description: 'Security group for RDS instances',
      vpcId: vpcModule.vpc.id,
      rules: [
        {
          type: 'ingress',
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          sourceSecurityGroupId: ec2SecurityGroup.securityGroup.id,
        },
      ],
    });

    // ===== EC2 =====
    const ec2Module = new Ec2Module(this, 'ec2', {
      project,
      environment: environmentSuffix,
      instanceType: 't3.micro',
      subnetId: vpcModule.privateSubnets[0].id, // private subnet
      securityGroupIds: [ec2SecurityGroup.securityGroup.id],
      instanceProfile: iamModule.instanceProfile,
      keyName: 'my-key-pair', // set to your key pair if you need SSH
    });

    // ===== Secrets Manager (optional) =====
    // If the secret 'three-tier-db-credentials-dev' is JSON like {"password":"..."},
    // we'll pick that; otherwise we fall back to a compliant random password.
    const dbPasswordSecret = new DataAwsSecretsmanagerSecretVersion(
      this,
      'db-password-secret',
      { secretId: 'three-tier-db-credentials-dev' }
    );

    // Compliant random fallback (max 41 chars; exclude '/', '"', '@', and space)
    const randomDbPassword = new RandomPassword(this, 'db-pass', {
      length: 32,
      minUpper: 1,
      minLower: 1,
      minNumeric: 1,
      minSpecial: 1,
      overrideSpecial: "!#$%^&*()-_=+[]{}:,.<>?~", // allowed specials
    });

    // Try to read `password` field from a JSON secret; if absent, use our random password.
    // Note: this assumes the secret value is valid JSON when it contains structured credentials.
    const effectiveDbPassword = Fn.lookup(
      Fn.jsondecode(dbPasswordSecret.secretString),
      'password',
      randomDbPassword.result
    );

    // ===== RDS =====
    const rdsModule = new RdsModule(this, 'rds', {
      project,
      environment: environmentSuffix,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      dbName: 'appdb',
      username: 'admin',
      // ✅ either password from secret JSON, or compliant random fallback
      password: effectiveDbPassword,
      subnetIds: vpcModule.privateSubnets.map((s) => s.id),
      securityGroupIds: [rdsSecurityGroup.securityGroup.id],
      kmsKey: kmsModule.key,
    });

    // ===== Outputs =====
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map((s) => s.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map((s) => s.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: ec2Module.instance.id,
      description: 'EC2 instance ID',
    });

    new TerraformOutput(this, 'ec2-private-ip', {
      value: ec2Module.instance.privateIp,
      description: 'EC2 instance private IP address',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.bucket,
      description: 'S3 bucket name for application data',
    });

    new TerraformOutput(this, 'cloudtrail-s3-bucket-name', {
      value: cloudTrailModule.logsBucket.bucket,
      description: 'S3 bucket name for CloudTrail logs',
    });

    new TerraformOutput(this, 'ec2-security-group-id', {
      value: ec2SecurityGroup.securityGroup.id,
      description: 'EC2 Security Group ID',
    });

    new TerraformOutput(this, 'rds-security-group-id', {
      value: rdsSecurityGroup.securityGroup.id,
      description: 'RDS Security Group ID',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS instance endpoint',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: kmsModule.key.keyId,
      description: 'KMS key ID',
    });

    new TerraformOutput(this, 'kms-key-arn', {
      value: kmsModule.key.arn,
      description: 'KMS key ARN',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });
  }
}
