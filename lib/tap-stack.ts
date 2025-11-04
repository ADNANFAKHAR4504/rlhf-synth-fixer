import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { NetworkingConstruct } from './networking-construct';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// Override AWS Region to ca-central-1 for this task
const AWS_REGION_OVERRIDE = 'ca-central-1';

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

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Note: Using local backend - S3 backend not accessible

    // Create networking infrastructure
    const networking = new NetworkingConstruct(this, 'Networking', {
      environmentSuffix,
      region: awsRegion,
    });

    // Export outputs
    new TerraformOutput(this, 'VpcId', {
      value: networking.vpcId,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'PublicSubnetIds', {
      value: networking.publicSubnetIds,
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'PrivateSubnetIds', {
      value: networking.privateSubnetIds,
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'IsolatedSubnetIds', {
      value: networking.isolatedSubnetIds,
      description: 'Isolated subnet IDs',
    });

    new TerraformOutput(this, 'WebSecurityGroupId', {
      value: networking.webSecurityGroupId,
      description: 'Web tier security group ID',
    });

    new TerraformOutput(this, 'AppSecurityGroupId', {
      value: networking.appSecurityGroupId,
      description: 'App tier security group ID',
    });

    new TerraformOutput(this, 'DatabaseSecurityGroupId', {
      value: networking.databaseSecurityGroupId,
      description: 'Database tier security group ID',
    });
  }
}
