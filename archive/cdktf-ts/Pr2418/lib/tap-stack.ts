import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

// Random provider (for unique bucket name when not provided)
import { Id as RandomId } from '@cdktf/provider-random/lib/id';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';

// Import
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

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;

  // Optional overrides
  appDataBucketName?: string; // use an existing/shared bucket instead of generating one
  keyName?: string; // EC2 key pair name
  dbPasswordSecretId?: string; // custom secret id (defaults to "my-new-secret")
  dbPassword?: string; // direct password (must be ≤ 41 chars for MySQL)

  // test helper to override the hard-coded override
  _regionOverrideForTesting?: string | null;
}

const AWS_REGION_OVERRIDE = 'us-west-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix ?? 'dev';

    const regionOverride =
      props?._regionOverrideForTesting !== undefined
        ? props._regionOverrideForTesting
        : AWS_REGION_OVERRIDE;

    const awsRegion = regionOverride || props?.awsRegion || 'us-west-2';
    const stateBucketRegion = props?.stateBucketRegion || 'us-west-2';
    const stateBucket =
      props?.stateBucket || 'prod-config-logs-us-west-2-a8e48bba';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // AWS provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags,
    });

    // Random provider (needed for unique S3 bucket names if not provided)
    new RandomProvider(this, 'random');

    // Caller identity
    const current = new DataAwsCallerIdentity(this, 'current');

    // Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // S3 backend lockfile (escape hatch)
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    const project = 'tap-project';
    const projectSlug = project.toLowerCase();
    const envSlug = environmentSuffix.toLowerCase();

    // KMS
    const kmsModule = new KmsModule(this, 'kms', {
      project,
      environment: environmentSuffix,
      description: `KMS key for ${project} ${environmentSuffix} environment`,
      accountId: current.accountId,
    });

    // S3 app data bucket
    // IMPORTANT: avoid calling .toLowerCase() on tokenized strings.
    const randomSuffix = new RandomId(this, 'app-bucket-suffix', {
      byteLength: 4,
    });
    const generatedBucketName =
      `${projectSlug}-${envSlug}-app-` + randomSuffix.hex;
    const appBucketName = props?.appDataBucketName
      ? props.appDataBucketName
      : generatedBucketName;

    const s3Module = new S3Module(this, 's3-app-data', {
      project,
      environment: environmentSuffix,
      bucketName: appBucketName,
      kmsKey: kmsModule.key,
    });

    // RDS password:
    // 1) if props.dbPassword provided, use it (ensure ≤ 41 chars)
    // 2) else read from Secrets Manager secret "my-new-secret"
    //    (can be overridden via props.dbPasswordSecretId)
    const fallbackPassword = 'A1b!A1b!A1b!A1b!A1b!A1b!'; // 24 chars, MySQL-safe
    const chosenSecretId = props?.dbPasswordSecretId ?? 'my-new-secret';
    let dbPassword: string | undefined;

    if (props?.dbPassword) {
      dbPassword = props.dbPassword;
    } else {
      const dbPasswordSecret = new DataAwsSecretsmanagerSecretVersion(
        this,
        'db-password-secret',
        { secretId: chosenSecretId }
      );
      dbPassword = dbPasswordSecret.secretString || fallbackPassword;
    }

    // CloudTrail (deterministic logs bucket name)
    const cloudTrailModule = new CloudTrailModule(this, 'cloudtrail', {
      project,
      environment: environmentSuffix,
      kmsKey: kmsModule.key,
      accountId: current.accountId,
      region: awsRegion,
    });

    // IAM for EC2
    const iamModule = new IamModule(this, 'iam', {
      project,
      environment: environmentSuffix,
      appDataBucketArn: s3Module.bucket.arn,
    });

    // VPC
    const vpcModule = new VpcModule(this, 'vpc', {
      project,
      environment: environmentSuffix,
      cidrBlock: '10.0.0.0/16',
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],
    });

    // Security groups
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
          cidrBlocks: ['0.0.0.0/0'],
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

    // EC2
    const ec2Module = new Ec2Module(this, 'ec2', {
      project,
      environment: environmentSuffix,
      instanceType: 't3.micro',
      subnetId: vpcModule.privateSubnets[0].id,
      securityGroupIds: [ec2SecurityGroup.securityGroup.id],
      instanceProfile: iamModule.instanceProfile,
      keyName: props?.keyName,
    });

    // RDS
    const rdsModule = new RdsModule(this, 'rds', {
      project,
      environment: environmentSuffix,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      dbName: 'appdb',
      username: 'admin',
      password: dbPassword!,
      subnetIds: vpcModule.privateSubnets.map(s => s.id),
      securityGroupIds: [rdsSecurityGroup.securityGroup.id],
      kmsKey: kmsModule.key,
    });

    // Outputs
    new TerraformOutput(this, 'vpc-id', { value: vpcModule.vpc.id });
    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(s => s.id),
    });
    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(s => s.id),
    });
    new TerraformOutput(this, 'ec2-instance-id', {
      value: ec2Module.instance.id,
    });
    new TerraformOutput(this, 'ec2-private-ip', {
      value: ec2Module.instance.privateIp,
    });
    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.bucket,
    });
    new TerraformOutput(this, 'cloudtrail-s3-bucket-name', {
      value: cloudTrailModule.logsBucket.bucket,
    });
    new TerraformOutput(this, 'ec2-security-group-id', {
      value: ec2SecurityGroup.securityGroup.id,
    });
    new TerraformOutput(this, 'rds-security-group-id', {
      value: rdsSecurityGroup.securityGroup.id,
    });
    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
    });
    new TerraformOutput(this, 'kms-key-id', { value: kmsModule.key.keyId });
    new TerraformOutput(this, 'kms-key-arn', { value: kmsModule.key.arn });
    new TerraformOutput(this, 'aws-account-id', { value: current.accountId });
  }
}
