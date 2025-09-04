import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import { SecurityStack } from './security-stack';
import { NetworkStack } from './network-stack';
import { ComputeStack } from './compute-stack';
import { StorageStack } from './storage-stack';
import { IamStack } from './iam-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Define regions for deployment
    // For now, deploying only to primary region to simplify
    const regions = ['us-east-1']; // Removed us-west-2 for initial deployment
    const primaryRegion = 'us-east-1';
    // const secondaryRegion = 'us-west-2';  // Not used currently

    // Common configuration
    const allowedCidr = '203.0.113.0/24'; // Example allowed IP range for SSH
    const commonTags = {
      Environment: environmentSuffix,
      Project: 'TapStack',
      Security: 'High',
      ...tags,
    };

    // Create IAM stack first (global resources)
    const iamStack = new IamStack(
      'tap-iam',
      {
        environmentSuffix,
        tags: commonTags,
      },
      { parent: this }
    );

    // Create security services stack (global/regional)
    const securityStack = new SecurityStack(
      'tap-security',
      {
        environmentSuffix,
        regions,
        tags: commonTags,
      },
      { parent: this }
    );

    // Deploy infrastructure in both regions
    const regionalDeployments: {
      [region: string]: {
        network: NetworkStack;
        storage: StorageStack;
        compute: ComputeStack;
      };
    } = {};

    for (const region of regions) {
      const regionSuffix = region === primaryRegion ? 'primary' : 'secondary';

      // Create provider for this region
      const provider = new aws.Provider(`provider-${region}`, {
        region: region,
      });

      // Network stack
      const networkStack = new NetworkStack(
        `tap-network-${regionSuffix}`,
        {
          environmentSuffix,
          region,
          allowedCidr,
          tags: commonTags,
        },
        { parent: this, provider }
      );

      // Storage stack
      const storageStack = new StorageStack(
        `tap-storage-${regionSuffix}`,
        {
          environmentSuffix,
          region,
          isPrimary: region === primaryRegion,
          tags: commonTags,
          vpcId: networkStack.vpcId,
          privateSubnetIds: networkStack.privateSubnetIds,
        },
        { parent: this, provider }
      );

      // Compute stack
      const computeStack = new ComputeStack(
        `tap-compute-${regionSuffix}`,
        {
          environmentSuffix,
          region,
          vpcId: networkStack.vpcId,
          publicSubnetIds: networkStack.publicSubnetIds,
          privateSubnetIds: networkStack.privateSubnetIds,
          instanceRole: iamStack.instanceRole,
          s3BucketArn: storageStack.s3BucketArn,
          allowedCidr,
          tags: commonTags,
          albSecurityGroupId: networkStack.albSecurityGroupId,
          ec2SecurityGroupId: networkStack.ec2SecurityGroupId,
        },
        { parent: this, provider }
      );

      regionalDeployments[region] = {
        network: networkStack,
        storage: storageStack,
        compute: computeStack,
      };
    }

    // Export outputs from primary region
    const primaryDeployment = regionalDeployments[primaryRegion];
    this.albDnsName = primaryDeployment.compute.albDnsName;
    this.s3BucketName = primaryDeployment.storage.s3BucketName;
    this.rdsEndpoint = primaryDeployment.storage.rdsEndpoint;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      s3BucketName: this.s3BucketName,
      rdsEndpoint: this.rdsEndpoint,
      securityHubArn: securityStack.securityHubArn,
    });
  }
}
