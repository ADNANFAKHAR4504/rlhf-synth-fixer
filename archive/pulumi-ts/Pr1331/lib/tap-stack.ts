/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import { NetworkStack } from './network-stack';
import { SecurityStack } from './security-stack';
import { StorageStack } from './storage-stack';
import { IamStack } from './iam-stack';
import { ComputeStack } from './compute-stack';
import { DatabaseStack } from './database-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly networkStack: NetworkStack;
  public readonly securityStack: SecurityStack;
  public readonly storageStack: StorageStack;
  public readonly iamStack: IamStack;
  public readonly computeStack: ComputeStack;
  public readonly databaseStack: DatabaseStack;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Configure AWS provider for us-east-1 (avoid VPC limit in us-west-2)
    const awsProvider = new aws.Provider(
      'aws-provider',
      {
        region: 'us-east-1',
      },
      { parent: this }
    );

    const resourceOpts = { parent: this, provider: awsProvider };

    // Create Network Stack
    this.networkStack = new NetworkStack(
      'webapp-network',
      {
        environmentSuffix,
        tags,
      },
      resourceOpts
    );

    // Create Storage Stack
    this.storageStack = new StorageStack(
      'webapp-storage',
      {
        environmentSuffix,
        tags,
      },
      resourceOpts
    );

    // Create Security Stack
    this.securityStack = new SecurityStack(
      'webapp-security',
      {
        vpcId: this.networkStack.vpc.id,
        environmentSuffix,
        tags,
      },
      resourceOpts
    );

    // Create IAM Stack
    this.iamStack = new IamStack(
      'webapp-iam',
      {
        environmentSuffix,
        tags,
        s3BucketArn: this.storageStack.logsBucket.arn,
      },
      resourceOpts
    );

    // Create Compute Stack
    this.computeStack = new ComputeStack(
      'webapp-compute',
      {
        vpcId: this.networkStack.vpc.id,
        privateSubnetIds: pulumi.all(
          this.networkStack.privateSubnets.map(s => s.id)
        ),
        publicSubnetIds: pulumi.all(
          this.networkStack.publicSubnets.map(s => s.id)
        ),
        webSecurityGroupId: this.securityStack.webSecurityGroup.id,
        albSecurityGroupId: this.securityStack.albSecurityGroup.id,
        instanceProfileName: this.iamStack.instanceProfile.name,
        environmentSuffix,
        tags,
      },
      resourceOpts
    );

    // Create Database Stack
    this.databaseStack = new DatabaseStack(
      'webapp-database',
      {
        vpcId: this.networkStack.vpc.id,
        privateSubnetIds: pulumi.all(
          this.networkStack.privateSubnets.map(s => s.id)
        ),
        dbSecurityGroupId: this.securityStack.dbSecurityGroup.id,
        environmentSuffix,
        tags,
      },
      resourceOpts
    );

    // Register the outputs of this component.
    this.registerOutputs({
      vpcId: this.networkStack.vpc.id,
      albDnsName: this.computeStack.applicationLoadBalancer.dnsName,
      dbEndpoint: this.databaseStack.dbCluster.endpoint,
      logsBucketName: this.storageStack.logsBucket.id,
    });
  }
}
