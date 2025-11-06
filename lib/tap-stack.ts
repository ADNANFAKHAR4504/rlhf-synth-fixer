import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { RandomProvider } from '@cdktf/provider-random/lib/provider'; // Add this line
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { Construct } from 'constructs';

// Import your modules
import {
  KmsModule,
  S3Module,
  CloudTrailModule,
  IamModule,
  VpcModule,
  SecurityGroupModule,
  Ec2Module,
  RdsModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  // Add this for testing - allows overriding the region override
  _regionOverrideForTesting?: string | null;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.
const AWS_REGION_OVERRIDE = 'us-east-1';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Use the testing override if provided, otherwise use the constant
    const regionOverride =
      props?._regionOverrideForTesting !== undefined
        ? props._regionOverrideForTesting
        : AWS_REGION_OVERRIDE;

    const awsRegion = regionOverride
      ? regionOverride
      : props?.awsRegion || 'us-east-1';

    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Add Random Provider - ADD THIS
    new RandomProvider(this, 'random');

    // Get current AWS account information
    const current = new DataAwsCallerIdentity(this, 'current');

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

    // Instantiate your modules here
    const project = 'tap-project'; // You can make this configurable

    // Create KMS key for encryption
    const kmsModule = new KmsModule(this, 'kms', {
      project,
      environment: environmentSuffix,
      description: `KMS key for ${project} ${environmentSuffix} environment`,
      accountId: current.accountId, // Add this
    });

    // Create S3 bucket for application data
    const s3Module = new S3Module(this, 's3-app-data', {
      project,
      environment: environmentSuffix,
      bucketName: `${project}-${environmentSuffix}-app-data`,
      kmsKey: kmsModule.key,
    });

    // Create CloudTrail for auditing
    const cloudTrailModule = new CloudTrailModule(this, 'cloudtrail', {
      project,
      environment: environmentSuffix,
      kmsKey: kmsModule.key,
      accountId: current.accountId, // Add this
      region: awsRegion, // Add this
    });

    // Create IAM role and instance profile for EC2
    const iamModule = new IamModule(this, 'iam', {
      project,
      environment: environmentSuffix,
      appDataBucketArn: s3Module.bucket.arn,
    });

    // Create VPC with public and private subnets
    const vpcModule = new VpcModule(this, 'vpc', {
      project,
      environment: environmentSuffix,
      cidrBlock: '10.0.0.0/16',
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`], // Adjust based on your region
    });

    // Create security group for EC2 instances
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
          cidrBlocks: ['0.0.0.0/0'], // Consider restricting this in production
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

    // Create security group for RDS
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

    // Create EC2 instance
    const ec2Module = new Ec2Module(this, 'ec2', {
      project,
      environment: environmentSuffix,
      instanceType: 't3.micro',
      subnetId: vpcModule.privateSubnets[0].id, // Deploy in private subnet
      securityGroupIds: [ec2SecurityGroup.securityGroup.id],
      instanceProfile: iamModule.instanceProfile,
      keyName: 'compute-key', // Uncomment and set if you have a key pair
    });

    // Update the RDS module instantiation
    const rdsModule = new RdsModule(this, 'rds', {
      project,
      environment: environmentSuffix,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      dbName: 'appdb',
      username: 'admin',
      password: '', // This will be ignored since we're generating it in the module
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      securityGroupIds: [rdsSecurityGroup.securityGroup.id],
      kmsKey: kmsModule.key,
    });

    // Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id),
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

    // Add output for the generated password
    new TerraformOutput(this, 'rds-password', {
      value: rdsModule.generatedPassword.result,
      description: 'RDS instance password',
      sensitive: true, // Mark as sensitive to hide in logs
    });

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
