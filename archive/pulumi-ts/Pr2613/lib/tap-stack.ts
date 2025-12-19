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
import { WebAppDeploymentStack } from './webAppInfra';

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
  public readonly albDnsName: pulumi.Output<string>;
  public readonly cloudFrontDomainName: pulumi.Output<string>;
  public readonly vpcId: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly autoScalingGroupName: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;
  public readonly launchTemplateId: pulumi.Output<string>;
  public readonly secretArn: pulumi.Output<string>;
  public readonly backupVaultName: pulumi.Output<string>;
  public readonly bastionInstanceId: pulumi.Output<string>;
  public readonly webServer1Id: pulumi.Output<string>;
  public readonly webServer2Id: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly lambdaFunctionName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const region = process.env.AWS_REGION || 'us-east-1';
    const environment = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    const webApp = WebAppDeploymentStack.create(region, environment, tags);

    this.albDnsName = webApp.alb.dnsName;
    this.cloudFrontDomainName = webApp.cloudFront.domainName;
    this.vpcId = webApp.vpc.id;
    this.rdsEndpoint = webApp.rdsInstance.endpoint;
    this.publicSubnetIds = pulumi.all([
      webApp.publicSubnet.id,
      webApp.publicSubnet2.id,
    ]);
    this.privateSubnetIds = pulumi.all([
      webApp.privateSubnet.id,
      webApp.privateSubnet2.id,
    ]);
    this.autoScalingGroupName = webApp.autoScalingGroup.name;
    this.targetGroupArn = webApp.targetGroup.arn;
    this.launchTemplateId = webApp.launchTemplate.id;
    this.secretArn = webApp.secret.arn;
    this.backupVaultName = webApp.backupVault.name;
    this.bastionInstanceId = webApp.bastionInstance.id;
    this.webServer1Id = webApp.webServer1.id;
    this.webServer2Id = webApp.webServer2.id;
    this.s3BucketName = webApp.s3Bucket.bucket;
    this.kmsKeyId = webApp.kmsKey.keyId;
    this.lambdaFunctionName = webApp.lambdaFunction.name;

    // Register the outputs of this component.
    this.registerOutputs({
      albDnsName: this.albDnsName,
      cloudFrontDomainName: this.cloudFrontDomainName,
      vpcId: this.vpcId,
      rdsEndpoint: this.rdsEndpoint,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      autoScalingGroupName: this.autoScalingGroupName,
      targetGroupArn: this.targetGroupArn,
      launchTemplateId: this.launchTemplateId,
      secretArn: this.secretArn,
      backupVaultName: this.backupVaultName,
      bastionInstanceId: this.bastionInstanceId,
      webServer1Id: this.webServer1Id,
      webServer2Id: this.webServer2Id,
      s3BucketName: this.s3BucketName,
      kmsKeyId: this.kmsKeyId,
      lambdaFunctionName: this.lambdaFunctionName,
    });
  }
}
