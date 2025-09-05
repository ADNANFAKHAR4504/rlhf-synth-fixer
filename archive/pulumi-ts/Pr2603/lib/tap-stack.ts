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
import { WebAppInfrastructure } from './webappinfra';
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
  public readonly infrastructure: WebAppInfrastructure;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);
    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {
      Project: 'MyApp',
      Owner: 'DevOps Team',
      CostCenter: 'Engineering',
    };

    // The following variables are commented out as they are only used in example code.
    // To use them, uncomment the lines below and the corresponding example code.
    // const environmentSuffix = args.environmentSuffix || 'dev';
    // const tags = args.tags || {};

    // --- Instantiate Nested Components Here ---
    // This is where you would create instances of your other component resources,
    // passing them the necessary configuration.

    // Example of instantiating a DynamoDBStack component:
    // const dynamoDBStack = new DynamoDBStack("tap-dynamodb", {
    //   environmentSuffix: environmentSuffix,
    //   tags: tags,
    // }, { parent: this });

    // Example of creating a resource directly (for truly global resources only):
    // const bucket = new aws.s3.Bucket(`tap-global-bucket-${environmentSuffix}`, {
    //   tags: tags,
    // }, { parent: this });

    // --- Expose Outputs from Nested Components ---
    // Make outputs from your nested components available as outputs of this main stack.
    // this.table = dynamoDBStack.table;

    this.infrastructure = new WebAppInfrastructure(
      'ap-south-1',
      environmentSuffix,
      tags
    );

    // Register the outputs of this component.
    this.registerOutputs({
      // VPC and Networking outputs
      vpcId: this.infrastructure.vpc.id,
      VPCId: this.infrastructure.vpc.id,
      publicSubnetIds: this.infrastructure.publicSubnets.map(
        subnet => subnet.id
      ),
      privateSubnetIds: this.infrastructure.privateSubnets.map(
        subnet => subnet.id
      ),
      internetGatewayId: this.infrastructure.internetGateway.id,
      natGatewayIds: this.infrastructure.natGateways.map(nat => nat.id),

      // Load Balancer outputs
      loadBalancerArn: this.infrastructure.loadBalancer.arn,
      loadBalancerDnsName: this.infrastructure.loadBalancer.dnsName,
      albDnsName: this.infrastructure.loadBalancer.dnsName,
      LoadBalancerDNS: this.infrastructure.loadBalancer.dnsName,

      // Auto Scaling Group outputs
      autoScalingGroupId: this.infrastructure.autoScalingGroup.id,
      asgId: this.infrastructure.autoScalingGroup.id,
      AutoScalingGroupId: this.infrastructure.autoScalingGroup.id,

      // S3 Bucket outputs
      s3BucketName: this.infrastructure.s3Bucket.id,
      S3BucketName: this.infrastructure.s3Bucket.id,
      s3BucketArn: this.infrastructure.s3Bucket.arn,

      // CloudFront Distribution outputs
      cloudFrontDistributionId: this.infrastructure.cloudFrontDistribution.id,
      cloudfrontDistributionId: this.infrastructure.cloudFrontDistribution.id,
      CloudFrontDistributionId: this.infrastructure.cloudFrontDistribution.id,
      cloudFrontDistributionDomainName:
        this.infrastructure.cloudFrontDistribution.domainName,
      cloudfrontDomainName:
        this.infrastructure.cloudFrontDistribution.domainName,
      CloudFrontDomainName:
        this.infrastructure.cloudFrontDistribution.domainName,

      // Security Group outputs
      albSecurityGroupId: this.infrastructure.albSecurityGroup.id,
      ec2SecurityGroupId: this.infrastructure.ec2SecurityGroup.id,
      cloudTrailBucketName: this.infrastructure.cloudTrailBucket.id,

      rdsInstanceId: this.infrastructure.rdsInstance.id,
      flowLogGroupName: this.infrastructure.flowLogGroup.name,
      flowLogGroupArn: this.infrastructure.flowLogGroup.arn,
    });
  }
}
