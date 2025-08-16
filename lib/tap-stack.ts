import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import {
  S3Backend,
  TerraformStack,
  TerraformOutput,
  TerraformVariable,
} from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import {
  LoggingModule,
  KmsModule,
  SecureBucketModule,
  NetworkModule,
  SecurityGroupsModule,
  NaclModule,
  CloudTrailModule,
  CommonTags,
} from './modules';
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

const AWS_REGION_OVERRIDE = '';

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
    /* -----------------------------
       Variables (no secrets hardcoded)
    ------------------------------*/
    const project = new TerraformVariable(this, 'project', {
      type: 'string',
      default: 'tap',
      description: 'Project name for tagging/naming.',
    });

    const environment = new TerraformVariable(this, 'environment', {
      type: 'string',
      default: environmentSuffix,
      description: 'Environment identifier (dev/stage/prod).',
    });

    const vpcCidr = new TerraformVariable(this, 'vpc_cidr', {
      type: 'string',
      default: '10.0.0.0/16',
      description: 'VPC CIDR block.',
    });

    const azs = new TerraformVariable(this, 'azs', {
      type: 'list(string)',
      default: ['us-east-1a', 'us-east-1b'],
      description: 'Availability Zones to use.',
    });

    const publicCidrs = new TerraformVariable(this, 'public_subnet_cidrs', {
      type: 'list(string)',
      default: ['10.0.0.0/24', '10.0.1.0/24'],
      description: 'Public subnet CIDRs by AZ index.',
    });

    const privateCidrs = new TerraformVariable(this, 'private_subnet_cidrs', {
      type: 'list(string)',
      default: ['10.0.10.0/24', '10.0.11.0/24'],
      description: 'Private subnet CIDRs by AZ index.',
    });

    const allowSshFrom = new TerraformVariable(this, 'allow_ssh_from', {
      type: 'list(string)',
      default: ['203.0.113.0/24'], // replace with your corporate IP blocks
      description: 'CIDR ranges allowed to SSH to bastion.',
    });

    const allowHttpFrom = new TerraformVariable(this, 'allow_http_from', {
      type: 'list(string)',
      default: ['0.0.0.0/0'],
      description: 'CIDR ranges allowed to HTTP.',
    });

    const allowHttpsFrom = new TerraformVariable(this, 'allow_https_from', {
      type: 'list(string)',
      default: ['0.0.0.0/0'],
      description: 'CIDR ranges allowed to HTTPS.',
    });

    const sensitiveBucketNames = new TerraformVariable(
      this,
      'sensitive_bucket_names',
      {
        type: 'list(string)',
        default: ['tap-dev-secrets', 'tap-dev-artifacts'],
        description: 'List of S3 bucket names that must use SSE-KMS.',
      }
    );

    const createCloudTrail = new TerraformVariable(this, 'enable_cloudtrail', {
      type: 'bool',
      default: true,
      description:
        'Enable a multi-region CloudTrail that sends to CloudWatch Logs.',
    });

    const logRetentionDays = new TerraformVariable(this, 'log_retention_days', {
      type: 'number',
      default: 90,
      description: 'CloudWatch Logs retention period.',
    });

    const tags: CommonTags = {
      Project: project.stringValue,
      Environment: environment.stringValue,
      ManagedBy: 'cdktf',
    };

    /* -----------------------------
       Central logging
    ------------------------------*/
    const logging = new LoggingModule(this, 'logging', {
      name: `${project.stringValue}-${environment.stringValue}`,
      retentionDays: Number(logRetentionDays.numberValue),
      tags,
    });

    /* -----------------------------
       KMS CMK for S3 SSE-KMS
    ------------------------------*/
    const kms = new KmsModule(this, 'kms', {
      name: `${project.stringValue}-${environment.stringValue}`,
      tags,
    });

    /* -----------------------------
       VPC + Subnets + NAT + Flow Logs
    ------------------------------*/
    const logGroup = new CloudwatchLogGroup(this, 'central-logs', {
      name: 'tap-central-logs',
      retentionInDays: 30,
      tags,
    });

    const network = new NetworkModule(this, 'network', {
      name: `${project.stringValue}-${environment.stringValue}`,
      cidrBlock: vpcCidr.stringValue,
      azs: azs.listValue as string[],
      publicSubnetCidrs: publicCidrs.listValue as string[],
      privateSubnetCidrs: privateCidrs.listValue as string[],
      enableFlowLogs: true,
      logGroupArn: logGroup.arn,
      logGroupName: logging.logGroup.name,
      tags,
    });

    /* -----------------------------
       Security Groups
    ------------------------------*/
    const sgs = new SecurityGroupsModule(this, 'sgs', {
      name: `${project.stringValue}-${environment.stringValue}`,
      vpcId: network.vpc.id,
      allowSshFrom: allowSshFrom.listValue as string[],
      allowHttpFrom: allowHttpFrom.listValue as string[],
      allowHttpsFrom: allowHttpsFrom.listValue as string[],
      tags,
    });

    /* -----------------------------
       NACLs for subnets
    ------------------------------*/
    new NaclModule(this, 'nacls', {
      name: `${project.stringValue}-${environment.stringValue}`,
      vpcId: network.vpc.id,
      publicSubnetIds: network.publicSubnets.map(s => s.id),
      privateSubnetIds: network.privateSubnets.map(s => s.id),
      allowSshFrom: allowSshFrom.listValue as string[],
      allowHttpFrom: allowHttpFrom.listValue as string[],
      allowHttpsFrom: allowHttpsFrom.listValue as string[],
      tags,
    });

    /* -----------------------------
       Secure S3 buckets (SSE-KMS)
    ------------------------------*/
    const bucketNames = sensitiveBucketNames.listValue as string[];
    const secureBuckets = bucketNames.map(
      (b, i) =>
        new SecureBucketModule(this, `secure-bucket-${i}`, {
          name: `${project.stringValue}-${environment.stringValue}-s3-${i}`,
          bucketName: b,
          kmsKeyArn: kms.key.arn,
          blockPublicAccess: true,
          enableVersioning: true,
          tags,
        })
    );

    /* -----------------------------
       CloudTrail -> CloudWatch Logs (+ S3)
       (Use first secure bucket as the CloudTrail delivery bucket)
    ------------------------------*/
    let trailArn = '';
    if (createCloudTrail.booleanValue && secureBuckets.length > 0) {
      const ct = new CloudTrailModule(this, 'cloudtrail', {
        name: `${project.stringValue}-${environment.stringValue}`,
        s3BucketName: secureBuckets[0].bucket.bucket,
        cloudWatchLogGroupArn: logging.logGroup.arn,
        region: 'us-east-1',
        tags,
      });
      trailArn = ct.trail.arn;
    }

    /* -----------------------------
       Outputs
    ------------------------------*/
    new TerraformOutput(this, 'vpc_id', { value: network.vpc.id });
    new TerraformOutput(this, 'public_subnet_ids', {
      value: network.publicSubnets.map(s => s.id),
    });
    new TerraformOutput(this, 'private_subnet_ids', {
      value: network.privateSubnets.map(s => s.id),
    });
    new TerraformOutput(this, 'nat_gateway_id', {
      value: network.natGateway.id,
    });
    new TerraformOutput(this, 'security_group_bastion_id', {
      value: sgs.bastionSg.id,
    });
    new TerraformOutput(this, 'security_group_web_id', { value: sgs.webSg.id });
    new TerraformOutput(this, 'security_group_app_id', { value: sgs.appSg.id });
    new TerraformOutput(this, 'log_group_name', {
      value: logging.logGroup.name,
    });
    new TerraformOutput(this, 'kms_key_arn', { value: kms.key.arn });
    new TerraformOutput(this, 'secure_bucket_names', {
      value: secureBuckets.map(m => m.bucket.bucket),
    });
    if (trailArn) {
      new TerraformOutput(this, 'cloudtrail_arn', { value: trailArn });
    }
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
