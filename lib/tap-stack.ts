import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

import { ComputeStack } from './compute-stack';
import { DatabaseStack } from './database-stack';
import { SecureVpcStack } from './secure-vpc-stack';
import { SecurityStack } from './security-stack';
import { StorageStack } from './storage-stack';

import AWS_REGION_OVERRIDE from './AWS_REGION';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags; // single object from caller
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix ?? 'dev';
    const awsRegion = AWS_REGION_OVERRIDE || props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion ?? 'us-east-1';
    const stateBucket = props?.stateBucket ?? 'iac-rlhf-tf-states';

    // Provider expects list form for defaultTags in this binding
    const defaultTagsList = props?.defaultTags ? [props.defaultTags] : [];

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTagsList,
    });

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Network + security
    const vpcStack = new SecureVpcStack(this, 'SecureVpcStack');
    const securityStack = new SecurityStack(this, 'SecurityStack', {
      vpcId: vpcStack.outputs.vpcId,
      vpcCidr: '10.0.0.0/16',
    });

    // Compute
    new ComputeStack(this, 'ComputeStack', {
      subnetIds: vpcStack.outputs.publicSubnetIds,
      securityGroupIds: [securityStack.outputs.webSgId],
      instanceType: 't3.micro',
      instanceCount: 2,
    });

    // Database (CI-safe: reads DB_PASSWORD at synth)
    new DatabaseStack(this, 'DatabaseStack', {
      subnetIds: vpcStack.outputs.privateSubnetIds,
      securityGroupIds: [securityStack.outputs.dbSgId],
      dbName: 'appdb',
      username: 'admin',
      // prefer Secrets Manager in real envs; env var for tests/CI
      passwordEnvVarName: 'DB_PASSWORD',
    });

    // Storage
    new StorageStack(this, 'StorageStack');
  }
}
