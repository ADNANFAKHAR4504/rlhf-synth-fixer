/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for multi-region disaster recovery infrastructure.
 * Orchestrates VPC, Aurora, DynamoDB, Lambda, EventBridge, Route 53, and monitoring.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { AuroraStack } from './aurora-stack';
import { DynamoDBStack } from './dynamodb-stack';
import { EventBridgeStack } from './eventbridge-stack';
import { LambdaStack } from './lambda-stack';
import { MonitoringStack } from './monitoring-stack';
import { Route53Stack } from './route53-stack';
import { VpcStack } from './vpc-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Multi-region disaster recovery infrastructure stack.
 */
export class TapStack extends pulumi.ComponentResource {
  // Primary region outputs
  public readonly primaryVpcId: pulumi.Output<string>;
  public readonly primaryAuroraEndpoint: pulumi.Output<string>;
  public readonly primaryLambdaArn: pulumi.Output<string>;

  // Secondary region outputs
  public readonly secondaryVpcId: pulumi.Output<string>;
  public readonly secondaryAuroraEndpoint: pulumi.Output<string>;
  public readonly secondaryLambdaArn: pulumi.Output<string>;

  // Global outputs
  public readonly dynamoDbTableName: pulumi.Output<string>;
  public readonly route53ZoneId: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    const primaryRegion = 'us-east-1';
    const secondaryRegion = 'us-west-2';

    // Create AWS providers for both regions
    const primaryProvider = new aws.Provider(
      `${name}-primary-provider`,
      {
        region: primaryRegion,
        defaultTags: { tags },
      },
      { parent: this }
    );

    const secondaryProvider = new aws.Provider(
      `${name}-secondary-provider`,
      {
        region: secondaryRegion,
        defaultTags: { tags },
      },
      { parent: this }
    );

    // ===== PRIMARY REGION INFRASTRUCTURE =====

    // VPC in primary region
    const primaryVpc = new VpcStack(
      `${name}-primary-vpc`,
      {
        region: primaryRegion,
        environmentSuffix,
        tags,
      },
      { parent: this, provider: primaryProvider }
    );

    // Aurora in primary region
    const primaryAurora = new AuroraStack(
      `${name}-primary-aurora`,
      {
        region: primaryRegion,
        vpcId: primaryVpc.vpcId,
        privateSubnetIds: primaryVpc.privateSubnetIds,
        securityGroupId: primaryVpc.securityGroup.id,
        environmentSuffix,
        tags,
      },
      { parent: this, provider: primaryProvider }
    );

    // ===== SECONDARY REGION INFRASTRUCTURE =====

    // VPC in secondary region
    const secondaryVpc = new VpcStack(
      `${name}-secondary-vpc`,
      {
        region: secondaryRegion,
        environmentSuffix,
        tags,
      },
      { parent: this, provider: secondaryProvider }
    );

    // Aurora in secondary region
    const secondaryAurora = new AuroraStack(
      `${name}-secondary-aurora`,
      {
        region: secondaryRegion,
        vpcId: secondaryVpc.vpcId,
        privateSubnetIds: secondaryVpc.privateSubnetIds,
        securityGroupId: secondaryVpc.securityGroup.id,
        environmentSuffix,
        tags,
      },
      { parent: this, provider: secondaryProvider }
    );

    // ===== GLOBAL RESOURCES =====

    // DynamoDB Global Table (created in primary, replicated to secondary)
    const dynamoDb = new DynamoDBStack(
      `${name}-dynamodb`,
      {
        regions: [primaryRegion, secondaryRegion],
        environmentSuffix,
        tags,
      },
      { parent: this, provider: primaryProvider }
    );

    // ===== PRIMARY REGION COMPUTE AND MONITORING =====

    // Lambda in primary region
    const primaryLambda = new LambdaStack(
      `${name}-primary-lambda`,
      {
        region: primaryRegion,
        vpcId: primaryVpc.vpcId,
        privateSubnetIds: primaryVpc.privateSubnetIds,
        securityGroupId: primaryVpc.securityGroup.id,
        auroraEndpoint: primaryAurora.clusterEndpoint,
        dynamoDbTableName: dynamoDb.tableName,
        environmentSuffix,
        tags,
      },
      { parent: this, provider: primaryProvider }
    );

    // EventBridge in primary region
    const primaryEventBridge = new EventBridgeStack(
      `${name}-primary-eventbridge`,
      {
        region: primaryRegion,
        lambdaFunctionArn: primaryLambda.functionArn,
        lambdaFunctionName: primaryLambda.functionName,
        environmentSuffix,
        tags,
      },
      { parent: this, provider: primaryProvider }
    );

    // Monitoring in primary region
    const primaryMonitoring = new MonitoringStack(
      `${name}-primary-monitoring`,
      {
        region: primaryRegion,
        lambdaFunctionName: primaryLambda.functionName,
        auroraClusterId: primaryAurora.cluster.id,
        environmentSuffix,
        tags,
      },
      { parent: this, provider: primaryProvider }
    );

    // ===== SECONDARY REGION COMPUTE AND MONITORING =====

    // Lambda in secondary region
    const secondaryLambda = new LambdaStack(
      `${name}-secondary-lambda`,
      {
        region: secondaryRegion,
        vpcId: secondaryVpc.vpcId,
        privateSubnetIds: secondaryVpc.privateSubnetIds,
        securityGroupId: secondaryVpc.securityGroup.id,
        auroraEndpoint: secondaryAurora.clusterEndpoint,
        dynamoDbTableName: dynamoDb.tableName,
        environmentSuffix,
        tags,
      },
      { parent: this, provider: secondaryProvider }
    );

    // EventBridge in secondary region
    const secondaryEventBridge = new EventBridgeStack(
      `${name}-secondary-eventbridge`,
      {
        region: secondaryRegion,
        lambdaFunctionArn: secondaryLambda.functionArn,
        lambdaFunctionName: secondaryLambda.functionName,
        environmentSuffix,
        tags,
      },
      { parent: this, provider: secondaryProvider }
    );

    // Monitoring in secondary region
    const secondaryMonitoring = new MonitoringStack(
      `${name}-secondary-monitoring`,
      {
        region: secondaryRegion,
        lambdaFunctionName: secondaryLambda.functionName,
        auroraClusterId: secondaryAurora.cluster.id,
        environmentSuffix,
        tags,
      },
      { parent: this, provider: secondaryProvider }
    );

    // ===== ROUTE 53 FOR FAILOVER =====

    // Route 53 with health checks and failover routing
    const route53 = new Route53Stack(
      `${name}-route53`,
      {
        primaryRegion,
        secondaryRegion,
        primaryEndpoint: primaryAurora.clusterEndpoint,
        secondaryEndpoint: secondaryAurora.clusterEndpoint,
        environmentSuffix,
        tags,
      },
      { parent: this, provider: primaryProvider }
    );

    // ===== VPC PEERING =====

    // VPC peering connection request from primary to secondary
    const peeringConnection = new aws.ec2.VpcPeeringConnection(
      `${name}-vpc-peering`,
      {
        vpcId: primaryVpc.vpcId,
        peerVpcId: secondaryVpc.vpcId,
        peerRegion: secondaryRegion,
        autoAccept: false,
        tags: {
          ...tags,
          Name: `${name}-vpc-peering-${environmentSuffix}-as`,
          Purpose: 'multi-region-dr',
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Accept peering connection in secondary region
    new aws.ec2.VpcPeeringConnectionAccepter(
      `${name}-vpc-peering-accepter`,
      {
        vpcPeeringConnectionId: peeringConnection.id,
        autoAccept: true,
        tags: {
          ...tags,
          Name: `${name}-vpc-peering-accepter-${environmentSuffix}-as`,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // Store outputs
    this.primaryVpcId = primaryVpc.vpcId;
    this.primaryAuroraEndpoint = primaryAurora.clusterEndpoint;
    this.primaryLambdaArn = primaryLambda.functionArn;

    this.secondaryVpcId = secondaryVpc.vpcId;
    this.secondaryAuroraEndpoint = secondaryAurora.clusterEndpoint;
    this.secondaryLambdaArn = secondaryLambda.functionArn;

    this.dynamoDbTableName = dynamoDb.tableName;
    this.route53ZoneId = route53.zoneId;

    // Register outputs
    this.registerOutputs({
      // Primary region
      primaryVpcId: primaryVpc.vpcId,
      primaryPublicSubnetIds: primaryVpc.publicSubnetIds,
      primaryPrivateSubnetIds: primaryVpc.privateSubnetIds,
      primaryAuroraEndpoint: primaryAurora.clusterEndpoint,
      primaryAuroraReaderEndpoint: primaryAurora.clusterReaderEndpoint,
      primaryLambdaArn: primaryLambda.functionArn,
      primaryLambdaName: primaryLambda.functionName,
      primaryEventBridgeRuleArn: primaryEventBridge.ruleArn,
      primarySnsTopicArn: primaryMonitoring.snsTopicArn,

      // Secondary region
      secondaryVpcId: secondaryVpc.vpcId,
      secondaryPublicSubnetIds: secondaryVpc.publicSubnetIds,
      secondaryPrivateSubnetIds: secondaryVpc.privateSubnetIds,
      secondaryAuroraEndpoint: secondaryAurora.clusterEndpoint,
      secondaryAuroraReaderEndpoint: secondaryAurora.clusterReaderEndpoint,
      secondaryLambdaArn: secondaryLambda.functionArn,
      secondaryLambdaName: secondaryLambda.functionName,
      secondaryEventBridgeRuleArn: secondaryEventBridge.ruleArn,
      secondarySnsTopicArn: secondaryMonitoring.snsTopicArn,

      // Global resources
      dynamoDbTableName: dynamoDb.tableName,
      dynamoDbTableArn: dynamoDb.tableArn,
      route53ZoneId: route53.zoneId,
      route53NameServers: route53.nameServers,
      vpcPeeringConnectionId: peeringConnection.id,
    });
  }
}
