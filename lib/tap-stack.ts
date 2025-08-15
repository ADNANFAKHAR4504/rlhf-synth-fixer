// Entry point for the production infrastructure stack
// Will import and compose all constructs

import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { App, TerraformOutput, TerraformStack } from 'cdktf';
import { ComputeConstruct } from './compute-construct';
import { DatabaseConstruct } from './database-construct';
import { DynamoDbConstruct } from './dynamodb-construct';
import { SecurityConstruct } from './security-construct';
import { StorageConstruct } from './storage-construct';
import { VpcConstruct } from './vpc-construct';

export interface TapStackProps {
  environmentSuffix: string;
  stateBucket: string;
  stateBucketRegion: string;
  awsRegion: string;
  defaultTags: { tags: Record<string, string> };
}

export class TapStack extends TerraformStack {
  constructor(scope: App, id: string, props: TapStackProps) {
    super(scope, id);

    new AwsProvider(this, 'aws', {
      region: props.awsRegion,
      defaultTags: [props.defaultTags],
    });

    const vpc = new VpcConstruct(this, 'vpc');
    const security = new SecurityConstruct(this, 'security', {
      vpcId: vpc.vpcId,
      publicSubnetIds: vpc.publicSubnetIds,
      privateSubnetIds: vpc.privateSubnetIds,
    });
    new StorageConstruct(this, 'storage');
    new DatabaseConstruct(this, 'database', {
      vpcId: vpc.vpcId,
      privateSubnetIds: vpc.privateSubnetIds,
      securityGroupId: security.rdsSecurityGroupId,
    });
    new DynamoDbConstruct(this, 'dynamodb');
    const compute = new ComputeConstruct(this, 'compute', {
      vpcId: vpc.vpcId,
      publicSubnetIds: vpc.publicSubnetIds,
      privateSubnetIds: vpc.privateSubnetIds,
      securityGroupId: security.ec2SecurityGroupId,
      instanceProfile: security.instanceProfile,
      loadBalancerSecurityGroupId: security.loadBalancerSecurityGroupId,
      domainName: 'tapstack.example.com', // <-- update to your real domain
    });

    // Output the ARN of the Application Load Balancer
    new TerraformOutput(this, 'albArn', {
      value: compute.albArn,
    });
  }
}
