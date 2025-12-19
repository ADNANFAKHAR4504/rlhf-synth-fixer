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
  public readonly s3BucketArn: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly lambdaFunctionName: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly albArn: pulumi.Output<string>;
  public readonly cloudFrontDomainName: pulumi.Output<string>;
  public readonly cloudFrontDistributionId: pulumi.Output<string>;
  public readonly ec2InstanceId: pulumi.Output<string>;
  public readonly ec2PublicIp: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;
  public readonly dynamoTableArn: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly kmsKeyArn: pulumi.Output<string>;
  public readonly secretArn: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;

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
    this.s3BucketArn = webAppInfra.s3BucketArn;
    this.rdsEndpoint = webAppInfra.rdsEndpoint;
    this.lambdaFunctionArn = webAppInfra.lambdaFunctionArn;
    this.lambdaFunctionName = webAppInfra.lambdaFunctionName;
    this.albDnsName = webAppInfra.albDnsName;
    this.albArn = webAppInfra.albArn;
    this.cloudFrontDomainName = webAppInfra.cloudFrontDomainName;
    this.cloudFrontDistributionId = webAppInfra.cloudFrontDistributionId;
    this.ec2InstanceId = webAppInfra.ec2InstanceId;
    this.ec2PublicIp = webAppInfra.ec2PublicIp;
    this.dynamoTableName = webAppInfra.dynamoTableName;
    this.dynamoTableArn = webAppInfra.dynamoTableArn;
    this.kmsKeyId = webAppInfra.kmsKeyId;
    this.kmsKeyArn = webAppInfra.kmsKeyArn;
    this.secretArn = webAppInfra.secretArn;
    this.targetGroupArn = webAppInfra.targetGroupArn;

    // Register the outputs of this component.
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      s3BucketName: this.s3BucketName,
      s3BucketArn: this.s3BucketArn,
      rdsEndpoint: this.rdsEndpoint,
      lambdaFunctionArn: this.lambdaFunctionArn,
      lambdaFunctionName: this.lambdaFunctionName,
      albDnsName: this.albDnsName,
      albArn: this.albArn,
      cloudFrontDomainName: this.cloudFrontDomainName,
      cloudFrontDistributionId: this.cloudFrontDistributionId,
      ec2InstanceId: this.ec2InstanceId,
      ec2PublicIp: this.ec2PublicIp,
      dynamoTableName: this.dynamoTableName,
      dynamoTableArn: this.dynamoTableArn,
      kmsKeyId: this.kmsKeyId,
      kmsKeyArn: this.kmsKeyArn,
      secretArn: this.secretArn,
      targetGroupArn: this.targetGroupArn,
    });
  }
}
