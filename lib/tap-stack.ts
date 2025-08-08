import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import AWS_REGION_OVERRIDE from './AWS_REGION';
import { ComputeStack } from './compute-stack';
import { DatabaseStack } from './database-stack';
import { SecureVpcStack } from './secure-vpc-stack';
import { SecurityStack } from './security-stack';
import { StorageStack } from './storage-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE || props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Provision VPC & Security
    const vpcStack = new SecureVpcStack(this, 'SecureVpcStack');
    const securityStack = new SecurityStack(this, 'SecurityStack', {
      vpcId: vpcStack.outputs.vpcId,
      vpcCidr: '10.0.0.0/16',
      environmentSuffix: environmentSuffix,
      projectName: 'tap-infrastructure',
    });

    // Compute
    new ComputeStack(this, 'ComputeStack', {
      subnetIds: vpcStack.outputs.publicSubnetIds,
      securityGroupIds: [securityStack.outputs.webSgId],
      instanceType: 't3.micro',
      instanceCount: 2,
    });

    // Resolve DB password
    let rawPassword = process.env.DB_PASSWORD;
    if (!rawPassword || rawPassword.trim() === '') {
      // CI fallback: generate random password (<= 41 chars)
      rawPassword = `P@ssw0rd-${Math.random().toString(36).slice(2, 15)}`;
    }
    if (rawPassword.length > 41) {
      rawPassword = rawPassword.slice(0, 41);
    }

    // Database
    new DatabaseStack(this, 'DatabaseStack', {
      subnetIds: vpcStack.outputs.privateSubnetIds,
      securityGroupIds: [securityStack.outputs.dbSgId],
      dbName: 'appdb',
      username: 'admin',
      password: rawPassword, // now always compliant
    });

    // Storage
    new StorageStack(this, 'StorageStack');
  }
}
