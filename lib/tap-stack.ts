import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

import { Id as RandomId } from '@cdktf/provider-random/lib/id';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';

import {
  IamRoleModule,
  ModuleConfig,
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
  projectName?: string;
}

const AWS_REGION_OVERRIDE = 'us-east-1'; // stick to us-east-1

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // AWS_REGION_OVERRIDE is always truthy in this build, so the else branch is unreachable
    /* istanbul ignore next */
    const awsRegion = AWS_REGION_OVERRIDE || props?.awsRegion || 'us-east-1';

    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];
    const projectName = props?.projectName || 'tap-project';

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new RandomProvider(this, 'random');

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    const nameSuffixResource = new RandomId(this, 'suffix-generator', {
      byteLength: 2,
    });

    const current = new DataAwsCallerIdentity(this, 'current');

    const moduleConfig: ModuleConfig = {
      environment: environmentSuffix,
      projectName,
      nameSuffix: nameSuffixResource.hex,
      tags: {
        Environment: environmentSuffix,
        Project: projectName,
        ManagedBy: 'terraform',
        ...(props?.defaultTags?.tags || {}),
      },
    };

    const vpcModule = new VpcModule(this, 'vpc', moduleConfig);
    const s3Module = new S3Module(this, 's3', moduleConfig);

    const securityGroupModule = new SecurityGroupModule(
      this,
      'security-group',
      {
        ...moduleConfig,
        vpcId: vpcModule.vpcId,
      }
    );

    const iamRoleModule = new IamRoleModule(this, 'iam-role', {
      ...moduleConfig,
      bucketArn: s3Module.bucketArn,
    });

    new TerraformOutput(this, 'name-suffix', {
      value: nameSuffixResource.hex,
      description: 'Stable random suffix used in resource names',
    });

    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpcId,
      description: 'Default VPC ID',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucketName,
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
      value: iamRoleModule.roleName,
      description: 'IAM Role name',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });
  }
}
