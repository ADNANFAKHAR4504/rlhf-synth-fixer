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
import { IamStack } from './iam-stack';
import { StorageStack } from './storage-stack';
import { ComputeStack } from './compute-stack';

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
  public readonly bucketName: pulumi.Output<string>;
  public readonly instanceId: pulumi.Output<string>;
  public readonly vpcId: pulumi.Output<string>;
  public readonly subnetId: pulumi.Output<string>;
  public readonly securityGroupId: pulumi.Output<string>;
  public readonly instancePublicIp: pulumi.Output<string>;
  public readonly instancePrivateIp: pulumi.Output<string>;
  public readonly s3BucketArn: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const region = 'us-east-1';
    const tags = {
      Environment: 'Development',
      ...(args.tags || {}),
    };

    // Create IAM Stack
    const iamStack = new IamStack(
      `iam-${environmentSuffix}`,
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // Create Network Stack
    const networkStack = new NetworkStack(
      `network-${environmentSuffix}`,
      {
        environmentSuffix,
        region,
        allowedCidr: '10.0.0.0/8',
        tags,
      },
      { parent: this }
    );

    // Create Storage Stack
    const storageStack = new StorageStack(
      `storage-${environmentSuffix}`,
      {
        environmentSuffix,
        region,
        isPrimary: true,
        tags,
        vpcId: networkStack.vpcId,
        privateSubnetIds: networkStack.privateSubnetIds,
      },
      { parent: this }
    );

    // Create Compute Stack
    new ComputeStack(
      `compute-${environmentSuffix}`,
      {
        environmentSuffix,
        region,
        vpcId: networkStack.vpcId,
        publicSubnetIds: networkStack.publicSubnetIds,
        privateSubnetIds: networkStack.privateSubnetIds,
        instanceRole: iamStack.instanceRole,
        s3BucketArn: storageStack.s3BucketArn,
        allowedCidr: '10.0.0.0/8',
        tags,
        albSecurityGroupId: networkStack.albSecurityGroupId,
        ec2SecurityGroupId: networkStack.ec2SecurityGroupId,
      },
      { parent: this }
    );

    // For integration tests, we need to expose a single EC2 instance
    // Let's create one directly in the public subnet
    const ami = pulumi.output(
      aws.ec2.getAmi({
        mostRecent: true,
        owners: ['amazon'],
        filters: [
          { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
          { name: 'virtualization-type', values: ['hvm'] },
        ],
      })
    );

    const testInstance = new aws.ec2.Instance(
      `tap-test-instance-${environmentSuffix}`,
      {
        ami: ami.id,
        instanceType: 't2.micro',
        subnetId: networkStack.publicSubnetIds.apply(ids => ids[0]),
        vpcSecurityGroupIds: [networkStack.ec2SecurityGroupId],
        iamInstanceProfile: iamStack.instanceProfile,
        tags: {
          ...tags,
          Name: `tap-test-instance-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Set outputs for integration tests
    this.bucketName = storageStack.s3BucketName;
    this.instanceId = testInstance.id;
    this.vpcId = networkStack.vpcId;
    this.subnetId = networkStack.publicSubnetIds.apply(ids => ids[0]);
    this.securityGroupId = networkStack.ec2SecurityGroupId;
    this.instancePublicIp = testInstance.publicIp;
    this.instancePrivateIp = testInstance.privateIp;
    this.s3BucketArn = storageStack.s3BucketArn;

    // Register the outputs of this component
    this.registerOutputs({
      bucketName: this.bucketName,
      instanceId: this.instanceId,
      vpcId: this.vpcId,
      subnetId: this.subnetId,
      securityGroupId: this.securityGroupId,
      instancePublicIp: this.instancePublicIp,
      instancePrivateIp: this.instancePrivateIp,
      s3BucketArn: this.s3BucketArn,
    });
  }
}
