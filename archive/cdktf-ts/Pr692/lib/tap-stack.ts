import * as aws from '@cdktf/provider-aws';
import { Fn, S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { CloudwatchConstruct } from './cloudwatch-construct';
import { Ec2Construct } from './ec2-construct';
import { IamConstruct } from './iam-construct';
import { S3Construct } from './s3-construct';
import { VpcConstruct } from './vpc-construct';

export interface TapStackProps {
  environmentSuffix?: string;
  awsRegion?: string;
  // keep these so bin/tap.ts compiles and we can persist state
  stateBucket?: string;
  stateBucketRegion?: string;
  defaultTags?: {
    tags: {
      Environment?: string;
      Owner?: string;
      Service?: string;
      Repository?: string;
      CommitAuthor?: string;
    };
  };
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, name: string, props?: TapStackProps) {
    super(scope, name);

    const region = process.env.AWS_REGION || props?.awsRegion || 'us-west-2';

    // ── 1) Persist Terraform state in S3 so future runs reuse it ───────────────
    const stateBucket =
      props?.stateBucket ||
      process.env.TERRAFORM_STATE_BUCKET ||
      'iac-rlhf-tf-states';
    const stateBucketRegion =
      props?.stateBucketRegion ||
      process.env.TERRAFORM_STATE_BUCKET_REGION ||
      region;

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${process.env.ENVIRONMENT || props?.environmentSuffix || 'development'}/${name}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
      // dynamodbTable: process.env.TERRAFORM_STATE_LOCK_TABLE, // optional
    });

    new aws.provider.AwsProvider(this, 'aws', { region });

    const environment =
      process.env.ENVIRONMENT || props?.environmentSuffix || 'development';

    // Allowed SSH CIDRs (comma-separated). Prod requires explicit restrictive list.
    const sshCidrsEnv = (process.env.ALLOWED_SSH_CIDRS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const allowedSshCidrs =
      environment === 'production'
        ? sshCidrsEnv.length
          ? sshCidrsEnv
          : (() => {
              throw new Error(
                'In production, set ALLOWED_SSH_CIDRS with restrictive CIDRs for SSH (e.g., 203.0.113.0/24)'
              );
            })()
        : sshCidrsEnv.length
          ? sshCidrsEnv
          : ['0.0.0.0/0'];

    // ── 2) Per-commit suffix: avoids "already exists" if last run had no state ─
    const ciSha =
      (process.env.GITHUB_SHA ||
        process.env.CI_COMMIT_SHA ||
        process.env.COMMIT_SHA ||
        '') + '';
    const ciSuffix = ciSha ? ciSha.substring(0, 6) : '';

    // Fallback to deterministic hash if no CI SHA is available
    const uniqueSuffix = ciSuffix || Fn.substr(Fn.sha1(name), 0, 6);

    const commonTags = {
      Environment: environment,
      Owner: 'team-infra',
      Service: 'core',
      ManagedBy: 'Terraform',
      ...props?.defaultTags?.tags,
    };

    const azs = [`${region}a`, `${region}b`, `${region}c`];

    const vpc = new VpcConstruct(this, `Vpc-${uniqueSuffix}`, {
      environment,
      region,
      vpcCidr: '10.0.0.0/16',
      azs,
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
      privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'],
      databaseSubnetCidrs: ['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24'],
      commonTags,
      resourceSuffix: uniqueSuffix,
    });

    const iam = new IamConstruct(this, `Iam-${uniqueSuffix}`, {
      environment,
      roleNameSuffix: uniqueSuffix as unknown as string, // CDKTF tokens are fine
      commonTags,
    });

    const ec2 = new Ec2Construct(this, `Ec2-${uniqueSuffix}`, {
      environment,
      vpcId: vpc.vpcId,
      subnetId: vpc.publicSubnets[0],
      instanceType: 't3.micro',
      keyName: process.env.EC2_KEY_NAME || '',
      iamInstanceProfile: iam.ec2ProfileName,
      allowedCidrBlocks: allowedSshCidrs,
      logGroupName: `/aws/ec2/${environment}-${uniqueSuffix}`,
      resourceSuffix: uniqueSuffix as unknown as string,
      commonTags,
    });

    const s3 = new S3Construct(this, `S3-${uniqueSuffix}`, {
      environment,
      // S3 bucket names must be globally unique; include suffix
      bucketName: `${environment}-assets-${uniqueSuffix}`,
      enableVersioning: true,
      lifecycleRules:
        environment === 'production'
          ? []
          : [
              {
                id: 'expire-old-objects',
                status: 'Enabled',
                expiration: { days: 14 }, // tightened from 30
                noncurrent_version_expiration: { noncurrent_days: 7 }, // tightened from 15
              },
            ],
      commonTags,
    });

    new CloudwatchConstruct(this, `Cloudwatch-${uniqueSuffix}`, {
      environment,
      instanceId: ec2.instanceId,
      logGroupName: `/aws/application/${environment}-${uniqueSuffix}`,
      commonTags,
    });

    // ── Integration test expects these outputs ──────────────────────────────────
    new TerraformOutput(this, 'vpc_id', { value: vpc.vpcId });
    new TerraformOutput(this, 'public_subnet_ids', {
      value: vpc.publicSubnets,
    });
    new TerraformOutput(this, 'private_subnet_ids', {
      value: vpc.privateSubnets,
    });
    new TerraformOutput(this, 'database_subnet_ids', {
      value: vpc.databaseSubnets,
    });
    new TerraformOutput(this, 'internet_gateway_id', {
      value: vpc.internetGatewayId,
    });
    new TerraformOutput(this, 'nat_gateway_ids', { value: vpc.natGatewayIds });

    // use strong types (no `any`)
    new TerraformOutput(this, 'bucket_id', { value: s3.bucketId });
    new TerraformOutput(this, 'bucket_arn', { value: s3.bucketArn });
    new TerraformOutput(this, 'bucket_domain_name', {
      value: s3.bucketDomainName,
    });
    new TerraformOutput(this, 'access_logs_bucket_id', {
      value: s3.accessLogsBucketId,
    });

    // still useful for other checks
    new TerraformOutput(this, 'instance_id', { value: ec2.instanceId });
  }
}
