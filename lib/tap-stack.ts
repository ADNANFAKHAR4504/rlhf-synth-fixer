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
import { ResourceOptions } from '@pulumi/pulumi';

import { WebAppInfra } from './webappinfra';
// import * as aws from '@pulumi/aws'; // Removed as it's only used in example code

// Import your nested stacks here. For example:
// import { DynamoDBStack } from "./dynamodb-stack";

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
 *
 * Note:
 * - DO NOT create resources directly here unless they are truly global.
 * - Use other components (e.g., DynamoDBStack) for AWS resource definitions.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly cloudFrontDomainName: pulumi.Output<string>;
  public readonly ec2InstanceId: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const tags = args.tags || {};
    const environmentSuffix = args.environmentSuffix || 'dev';

    const webAppInfra = new WebAppInfra(
      'webapp-infra',
      {
        region: 'us-east-1',
        environment: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    this.vpcId = webAppInfra.vpcId;
    this.publicSubnetIds = webAppInfra.publicSubnetIds;
    this.privateSubnetIds = webAppInfra.privateSubnetIds;
    this.s3BucketName = webAppInfra.s3BucketName;
    this.rdsEndpoint = webAppInfra.rdsEndpoint;
    this.lambdaFunctionArn = webAppInfra.lambdaFunctionArn;
    this.albDnsName = webAppInfra.albDnsName;
    this.cloudFrontDomainName = webAppInfra.cloudFrontDomainName;
    this.ec2InstanceId = webAppInfra.ec2InstanceId;
    this.dynamoTableName = webAppInfra.dynamoTableName;

    // Register the outputs of this component.
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      s3BucketName: this.s3BucketName,
      rdsEndpoint: this.rdsEndpoint,
      lambdaFunctionArn: this.lambdaFunctionArn,
      albDnsName: this.albDnsName,
      cloudFrontDomainName: this.cloudFrontDomainName,
      ec2InstanceId: this.ec2InstanceId,
      dynamoTableName: this.dynamoTableName,
    });
  }
}
