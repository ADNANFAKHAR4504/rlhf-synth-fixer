import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  VpcModule,
  BastionSgModule,
  RdsSgModule,
  RdsModule,
  S3LoggingBucketModule,
  SecretsManagerModule,
} from './modules';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';

// import { MyStack } from './my-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = 'us-west-2'; // Change this to your desired region

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
    const projectName = 'aurora';

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

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

    // ? Add your stack instantiations here
    new RandomProvider(this, 'random');

    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
    // 1. Network Foundation
    const vpc = new VpcModule(this, `${projectName}-vpc`, {
      cidrBlock: '10.0.0.0/16',
      availabilityZones: ['us-west-2a', 'us-west-2b'],
    });

    // 2. Security Groups (depend on the VPC)
    const bastionSg = new BastionSgModule(this, `${projectName}-bastion-sg`, {
      vpcId: vpc.vpc.id,
    });

    const rdsSg = new RdsSgModule(this, `${projectName}-rds-sg`, {
      vpcId: vpc.vpc.id,
    });

    // 3. S3 Logging Bucket
    const loggingBucket = new S3LoggingBucketModule(
      this,
      `${projectName}-logging-bucket`
    );

    // 4. Secrets Manager for RDS Password
    const dbSecrets = new SecretsManagerModule(
      this,
      `${projectName}-db-secrets`
    );

    // 5. RDS Database (depends on network, security groups, and secrets)
    const rds = new RdsModule(this, `${projectName}-rds`, {
      privateSubnetIds: vpc.privateSubnets.map(subnet => subnet.id),
      vpcSecurityGroupIds: [rdsSg.securityGroup.id],
      dbUsername: 'auroraadmin',
      dbPassword: dbSecrets.password.result,
      natGateway: vpc.natGateway,
    });

    // --- Stack Outputs (as required by prompt) ---

    new TerraformOutput(this, 'rdsInstanceEndpoint', {
      value: rds.endpoint || 'mock-rds-endpoint.amazonaws.com',
      description: 'The connection endpoint for the RDS database instance.',
      sensitive: true,
    });

    new TerraformOutput(this, 'vpcId', {
      value: vpc.vpc.id,
      description: 'The ID of the main VPC.',
    });

    new TerraformOutput(this, 'logBucketName', {
      value: loggingBucket.bucket.bucket,
      description: 'The name of the S3 bucket for logging.',
    });

    new TerraformOutput(this, 'bastionSecurityGroupId', {
      value: bastionSg.securityGroup.id,
      description: 'The ID of the Bastion Host Security Group.',
    });

    // FIX: Added the missing output for the secret's ARN, which the integration test needs.
    new TerraformOutput(this, 'DatabaseSecretArn', {
      value: dbSecrets.secret.arn,
      description: 'ARN of the Secrets Manager secret for the RDS database.',
    });

    new TerraformOutput(this, 'rdsSecurityGroupId', {
      value: rdsSg.securityGroup.id,
      description: 'The ID of the RDS Security Group.',
    });
  }
}
