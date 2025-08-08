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

// Load region from shared AWS_REGION file (if implemented)
import AWS_REGION_OVERRIDE from './AWS_REGION'; // or './lib/AWS_REGION'

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

    // TapStack (simplified for fix)
    const vpcStack = new SecureVpcStack(this, 'SecureVpcStack');
    const securityStack = new SecurityStack(this, 'SecurityStack', {
      vpcId: vpcStack.outputs.vpcId,
      vpcCidr: '10.0.0.0/16', // same CIDR used in VPC stack
    });

    new ComputeStack(this, 'ComputeStack', {
      subnetIds: vpcStack.outputs.publicSubnetIds,
      securityGroupIds: [securityStack.outputs.webSgId],
      instanceType: 't3.micro',
      instanceCount: 2,
    });

        new DatabaseStack(this, 'DatabaseStack', {
          subnetIds: vpcStack.outputs.privateSubnetIds,
          securityGroupIds: [securityStack.outputs.dbSgId],
          dbName: 'appdb',
          username: 'admin',

          // Option A (preferred): Secrets Manager
          // passwordSecretArn: process.env.DB_PASSWORD_SECRET_ARN,

          // Option B (simple & works in CI/tests): environment variable
          passwordEnvVarName: 'DB_PASSWORD',
        });


    new StorageStack(this, 'StorageStack');
  }
}
