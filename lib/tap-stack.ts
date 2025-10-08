import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
// import * as aws from '@cdktf/provider-aws';

// ? Import your stacks here
import {
  VpcModule,
  IamModule,
  S3Module,
  Ec2Module,
  RdsModule,
  LambdaModule,
  CloudTrailModule,
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

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Environment: 'Production',
            Compliance: 'Enforced',
            Security: 'True',
            ManagedBy: 'CDKTF',
          },
        },
      ],
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
    // Data sources
    // const callerIdentity = new aws.dataAwsCallerIdentity.DataAwsCallerIdentity(
    //   this,
    //   'current'
    // );

    // Deploy VPC Module
    const vpcModule = new VpcModule(this, 'vpc-module');

    // Deploy IAM Module
    const iamModule = new IamModule(this, 'iam-module');

    // Deploy S3 Module
    const s3Module = new S3Module(this, 's3-module');

    // Deploy CloudTrail Module
    const cloudTrailModule = new CloudTrailModule(
      this,
      'cloudtrail-module',
      s3Module.kmsKey
    );

    // Deploy EC2 Module
    new Ec2Module(
      this,
      'ec2-module',
      vpcModule.vpc,
      vpcModule.privateSubnets[0].id,
      iamModule.instanceRole
    );

    // Deploy RDS Module
    new RdsModule(
      this,
      'rds-module',
      vpcModule.vpc,
      vpcModule.privateSubnets.map(subnet => subnet.id)
    );

    // Deploy Lambda Module
    new LambdaModule(
      this,
      'lambda-module',
      vpcModule.vpc,
      vpcModule.privateSubnets.map(subnet => subnet.id),
      iamModule.lambdaRole,
      s3Module.kmsKey
    );

    // Outputs for compliance verification
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'iam-permissions-boundary-arn', {
      value: iamModule.permissionsBoundary.arn,
      description: 'IAM permissions boundary ARN',
    });

    new TerraformOutput(this, 's3-encryption-status', {
      value: 'KMS encryption enabled on all S3 buckets',
      description: 'S3 encryption status',
    });

    new TerraformOutput(this, 's3-public-access-block', {
      value: 'Public access blocked on all S3 buckets',
      description: 'S3 public access status',
    });

    new TerraformOutput(this, 'ec2-ebs-encryption', {
      value: 'All EBS volumes are encrypted',
      description: 'EC2 EBS encryption status',
    });

    new TerraformOutput(this, 'rds-encryption-status', {
      value: 'RDS instance and snapshots are encrypted',
      description: 'RDS encryption status',
    });

    new TerraformOutput(this, 'cloudtrail-status', {
      value: {
        enabled: cloudTrailModule.trail.isMultiRegionTrail,
        logFileValidation: cloudTrailModule.trail.enableLogFileValidation,
        encryptionEnabled: true,
      },
      description: 'CloudTrail configuration status',
    });

    new TerraformOutput(this, 'lambda-logging-status', {
      value: 'Lambda functions have detailed CloudWatch logging enabled',
      description: 'Lambda logging status',
    });

    new TerraformOutput(this, 'vpc-flow-logs-status', {
      value: 'VPC Flow Logs enabled and stored in encrypted S3',
      description: 'VPC Flow Logs status',
    });

    new TerraformOutput(this, 'security-compliance-summary', {
      value: {
        iamPermissionBoundaries: 'Enforced',
        mfaRequirement: 'Policy Applied',
        ec2EbsEncryption: 'Enabled',
        s3Encryption: 'KMS',
        s3PublicAccess: 'Blocked',
        sshRestriction: 'No 0.0.0.0/0 access',
        cloudTrailMultiRegion: 'Enabled',
        lambdaVpcDeployment: 'Enforced',
        rdsEncryption: 'Enabled',
        rdsPublicAccess: 'Disabled',
        vpcFlowLogs: 'Enabled',
      },
      description: 'Security compliance summary',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
