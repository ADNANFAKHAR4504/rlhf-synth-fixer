import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

// Import your stacks here
import {
  S3Module,
  SecurityGroupModule,
  IamRoleModule,
  VpcModule,
  ModuleConfig,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  projectName?: string;
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
    const projectName = props?.projectName || 'tap-project';

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

    // Get current AWS account for outputs
    const current = new DataAwsCallerIdentity(this, 'current');

    // Common configuration for all modules
    const moduleConfig: ModuleConfig = {
      environment: environmentSuffix,
      projectName: projectName,
      tags: {
        Environment: environmentSuffix,
        Project: projectName,
        ManagedBy: 'terraform',
        ...(props?.defaultTags?.tags || {}),
      },
    };

    // Create VPC module (now properly retrieves default VPC)
    const vpcModule = new VpcModule(this, 'vpc', moduleConfig);

    // Create S3 module
    const s3Module = new S3Module(this, 's3', moduleConfig);

    // Create Security Group module (now uses actual VPC ID)
    const securityGroupModule = new SecurityGroupModule(
      this,
      'security-group',
      {
        ...moduleConfig,
        vpcId: vpcModule.vpcId, // This now contains the actual VPC ID
      }
    );

    // Create IAM Role module
    const iamRoleModule = new IamRoleModule(this, 'iam-role', {
      ...moduleConfig,
      bucketArn: s3Module.bucketArn,
    });

    // Terraform Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpcId,
      description: 'Default VPC ID',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.bucket,
      description: 'S3 bucket name',
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: s3Module.bucketArn,
      description: 'S3 bucket ARN',
    });

    new TerraformOutput(this, 'security-group-id', {
      value: securityGroupModule.securityGroupId,
      description: 'Security Group ID',
    });

    new TerraformOutput(this, 'iam-role-arn', {
      value: iamRoleModule.roleArn,
      description: 'IAM Role ARN',
    });

    new TerraformOutput(this, 'iam-role-name', {
      value: iamRoleModule.role.name,
      description: 'IAM Role name',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });
  }
}
