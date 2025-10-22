/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the Global Banking Platform
 * Orchestrates multi-region, PCI-DSS compliant infrastructure
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Import nested stack components
import { NetworkStack } from './global-banking/network-stack';
import { SecurityStack } from './global-banking/security-stack';
import { DatabaseStack } from './global-banking/database-stack';
import { ComputeStack } from './global-banking/compute-stack';
import { ApiStack } from './global-banking/api-stack';
import { MonitoringStack } from './global-banking/monitoring-stack';
import { StorageStack } from './global-banking/storage-stack';
import { MessagingStack } from './global-banking/messaging-stack';
import { ComplianceStack } from './global-banking/compliance-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack component
 */
export interface TapStackArgs {
  /**
   * Environment suffix (e.g., 'dev', 'staging', 'prod')
   */
  environmentSuffix?: string;

  /**
   * AWS regions to deploy to
   */
  regions?: {
    primary: string;
    replicas: string[];
  };

  /**
   * VPC CIDR block
   */
  vpcCidr?: string;

  /**
   * Enable PCI-DSS compliance features
   */
  enablePciCompliance?: boolean;

  /**
   * Enable multi-region replication
   */
  enableMultiRegion?: boolean;

  /**
   * Default tags for all resources
   */
  tags?: pulumi.Input<{ [key: string]: string }>;

  /**
   * Domain name for the banking platform
   */
  domainName?: string;

  /**
   * Enable fraud detection
   */
  enableFraudDetection?: boolean;

  /**
   * Lambda runtime configuration
   */
  lambdaRuntime?: string;
}

/**
 * Main TapStack component for Global Banking Platform
 */
export class TapStack extends pulumi.ComponentResource {
  // Network outputs
  public readonly primaryVpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly transitGatewayId: pulumi.Output<string>;

  // Security outputs
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly kmsKeyArn: pulumi.Output<string>;
  public readonly secretsManagerArns: pulumi.Output<{
    database: string;
    api: string;
  }>;
  public readonly cognitoUserPoolId: pulumi.Output<string>;
  public readonly cognitoUserPoolArn: pulumi.Output<string>;

  // Database outputs
  public readonly auroraClusterEndpoint: pulumi.Output<string>;
  public readonly auroraReaderEndpoint: pulumi.Output<string>;
  public readonly dynamoDbTableName: pulumi.Output<string>;
  public readonly elastiCacheEndpoint: pulumi.Output<string>;

  // Compute outputs
  public readonly ecsClusterArn: pulumi.Output<string>;
  public readonly ecsClusterName: pulumi.Output<string>;
  public readonly appMeshName: pulumi.Output<string>;

  // API outputs
  public readonly apiGatewayUrl: pulumi.Output<string>;
  public readonly apiGatewayId: pulumi.Output<string>;
  public readonly loadBalancerDns: pulumi.Output<string>;
  public readonly globalAcceleratorDns: pulumi.Output<string>;

  // Storage outputs
  public readonly transactionBucketName: pulumi.Output<string>;
  public readonly archiveBucketName: pulumi.Output<string>;

  // Messaging outputs
  public readonly transactionQueueUrl: pulumi.Output<string>;
  public readonly kinesisStreamName: pulumi.Output<string>;

  // Monitoring outputs
  public readonly dashboardUrl: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const regions = args.regions || {
      primary: 'us-east-2',
      replicas: ['eu-west-1', 'ap-southeast-1'],
    };
    const vpcCidr = args.vpcCidr || '10.29.0.0/16';
    const enablePciCompliance = args.enablePciCompliance ?? true;
    const enableMultiRegion = args.enableMultiRegion ?? true;
    const domainName =
      args.domainName || `banking-${environmentSuffix}.example.com`;
    const lambdaRuntime = args.lambdaRuntime || 'java17';

    const tags = pulumi.output(args.tags || {}).apply(t => ({
      ...t,
      Environment: environmentSuffix,
      Project: 'GlobalBankingPlatform',
      ManagedBy: 'Pulumi',
      Compliance: 'PCI-DSS',
    }));

    // Explicit AWS provider to ensure correct signing region in CI
    const awsProvider = new aws.Provider(
      `${name}-aws-provider`,
      {
        region: regions.primary,
      },
      { parent: this }
    );

    //  1. Security Stack (Deploy First)
    const securityStack = new SecurityStack(
      `${name}-security`,
      {
        environmentSuffix,
        tags,
        enablePciCompliance,
        regions,
      },
      { parent: this, provider: awsProvider, ignoreChanges: ['provider'] }
    );

    //  2. Network Stack
    const networkStack = new NetworkStack(
      `${name}-network`,
      {
        environmentSuffix,
        vpcCidr,
        regions,
        tags,
        enableTransitGateway: enableMultiRegion,
        enableFlowLogs: true,
        kmsKeyId: securityStack.kmsKeyId,
        kmsKeyArn: securityStack.kmsKeyArn,
        awsProvider: awsProvider,
      },
      { parent: this, provider: awsProvider, ignoreChanges: ['provider'] }
    );

    // 3. Storage Stack
    const storageStack = new StorageStack(
      `${name}-storage`,
      {
        environmentSuffix,
        tags,
        kmsKeyId: securityStack.kmsKeyId,
        kmsKeyArn: securityStack.kmsKeyArn,
        enableCrossRegionReplication: enableMultiRegion,
        regions,
        enableVersioning: true,
        enableObjectLock: true,
      },
      { parent: this, provider: awsProvider, ignoreChanges: ['provider'] }
    );

    //  4. Database Stack
    const databaseStack = new DatabaseStack(
      `${name}-database`,
      {
        environmentSuffix,
        tags,
        vpcId: networkStack.primaryVpcId,
        privateSubnetIds: networkStack.privateSubnetIds,
        kmsKeyArn: securityStack.kmsKeyArn,
        regions,
        enableGlobalDatabase: enableMultiRegion,
        enablePointInTimeRecovery: true,
        secretsManagerArn: securityStack.dbSecretArn,
      },
      {
        parent: this,
        provider: awsProvider,
        ignoreChanges: ['provider'],
        dependsOn: [networkStack, securityStack],
      }
    );

    //  5. Messaging Stack
    const messagingStack = new MessagingStack(
      `${name}-messaging`,
      {
        environmentSuffix,
        tags,
        kmsKeyId: securityStack.kmsKeyId,
        regions,
        enableFifoQueues: true,
        enableCrossRegionEvents: enableMultiRegion,
      },
      {
        parent: this,
        provider: awsProvider,
        dependsOn: [securityStack, storageStack],
      }
    );

    // 6. Compute Stack (ECS Fargate + App Mesh)
    const computeStack = new ComputeStack(
      `${name}-compute`,
      {
        environmentSuffix,
        tags,
        vpcId: networkStack.primaryVpcId,
        privateSubnetIds: networkStack.privateSubnetIds,
        kmsKeyId: securityStack.kmsKeyId,
        kmsKeyArn: securityStack.kmsKeyArn,
        regions,
        enableAppMesh: true,
        enableAutoScaling: true,
        secretsManagerArns: securityStack.secretsManagerArns,
      },
      {
        parent: this,
        provider: awsProvider,
        ignoreChanges: ['provider'],
        dependsOn: [networkStack, securityStack],
      }
    );

    // --- 7. API Stack (API Gateway, ALB, Global Accelerator) ---
    const apiStack = new ApiStack(
      `${name}-api`,
      {
        environmentSuffix,
        tags,
        vpcId: networkStack.primaryVpcId,
        publicSubnetIds: networkStack.publicSubnetIds,
        privateSubnetIds: networkStack.privateSubnetIds,
        ecsClusterArn: computeStack.ecsClusterArn,
        certificateArn: securityStack.certificateArn,
        cognitoUserPoolArn: securityStack.cognitoUserPoolArn,
        wafWebAclArn: securityStack.wafWebAclArn,
        domainName,
        regions,
        enableGlobalAccelerator: enableMultiRegion,
        enableMutualTls: false,
        lambdaRuntime,
        kmsKeyId: securityStack.kmsKeyId,
        kmsKeyArn: securityStack.kmsKeyArn,
        secretsManagerArns: securityStack.secretsManagerArns,
        kinesisStreamArn: messagingStack.kinesisStreamArn,
        kinesisStreamName: messagingStack.kinesisStreamName,
        transactionQueueArn: messagingStack.transactionQueueArn,
        transactionQueueUrl: messagingStack.transactionQueueUrl,
        fraudDetectionQueueArn: messagingStack.fraudDetectionQueueArn,
        fraudDetectionQueueUrl: messagingStack.fraudDetectionQueueUrl,
      },
      {
        parent: this,
        provider: awsProvider,
        ignoreChanges: ['provider'],
        dependsOn: [networkStack, securityStack, computeStack, storageStack],
      }
    );

    // --- 8. Monitoring Stack ---
    const monitoringStack = new MonitoringStack(
      `${name}-monitoring`,
      {
        environmentSuffix,
        tags,
        regions,
        enableXRay: true,
        enableCrossRegionDashboards: enableMultiRegion,
        resourceArns: {
          ecsCluster: computeStack.ecsClusterArn,
          apiGateway: apiStack.apiGatewayId,
          loadBalancer: apiStack.loadBalancerArn,
          auroraCluster: databaseStack.auroraClusterArn,
          dynamoDbTable: databaseStack.dynamoDbTableArn,
          kinesisStream: messagingStack.kinesisStreamArn,
        },
      },
      {
        parent: this,
        provider: awsProvider,
        ignoreChanges: ['provider'],
        dependsOn: [computeStack, apiStack, databaseStack, messagingStack],
      }
    );

    // --- 9. Compliance Stack (CloudTrail, Config, GuardDuty, Security Hub) ---
    new ComplianceStack(
      `${name}-compliance`,
      {
        environmentSuffix,
        tags,
        regions,
        enablePciCompliance,
        auditLogBucket: storageStack.auditLogBucketName,
        kmsKeyArn: securityStack.kmsKeyArn,
        snsTopicArn: monitoringStack.snsTopicArn,
        enableGuardDuty: true,
        enableSecurityHub: false,
        enableConfig: true,
      },
      {
        parent: this,
        provider: awsProvider,
        ignoreChanges: ['provider'],
        dependsOn: [storageStack, securityStack, monitoringStack],
      }
    );

    // --- Expose Outputs ---
    // Network
    this.primaryVpcId = networkStack.primaryVpcId;
    this.privateSubnetIds = networkStack.privateSubnetIds;
    this.publicSubnetIds = networkStack.publicSubnetIds;
    this.transitGatewayId = networkStack.transitGatewayId;

    // Security
    this.kmsKeyId = securityStack.kmsKeyId;
    this.kmsKeyArn = securityStack.kmsKeyArn;
    this.secretsManagerArns = securityStack.secretsManagerArns;
    this.cognitoUserPoolId = securityStack.cognitoUserPoolId;
    this.cognitoUserPoolArn = securityStack.cognitoUserPoolArn;

    // Database
    this.auroraClusterEndpoint = databaseStack.auroraClusterEndpoint;
    this.auroraReaderEndpoint = databaseStack.auroraReaderEndpoint;
    this.dynamoDbTableName = databaseStack.dynamoDbTableName;
    this.elastiCacheEndpoint = databaseStack.elastiCacheEndpoint;

    // Compute
    this.ecsClusterArn = computeStack.ecsClusterArn;
    this.ecsClusterName = computeStack.ecsClusterName;
    this.appMeshName = computeStack.appMeshName;

    // API
    this.apiGatewayUrl = apiStack.apiGatewayUrl;
    this.apiGatewayId = apiStack.apiGatewayId;
    this.loadBalancerDns = apiStack.loadBalancerDns;
    this.globalAcceleratorDns = apiStack.globalAcceleratorDns;

    // Storage
    this.transactionBucketName = storageStack.transactionBucketName;
    this.archiveBucketName = storageStack.archiveBucketName;

    // Messaging
    this.transactionQueueUrl = messagingStack.transactionQueueUrl;
    this.kinesisStreamName = messagingStack.kinesisStreamName;

    // Monitoring
    this.dashboardUrl = monitoringStack.dashboardUrl;
    this.snsTopicArn = monitoringStack.snsTopicArn;

    // Register all outputs
    this.registerOutputs({
      // Network
      primaryVpcId: this.primaryVpcId,
      privateSubnetIds: this.privateSubnetIds,
      publicSubnetIds: this.publicSubnetIds,
      transitGatewayId: this.transitGatewayId,

      // Security
      kmsKeyId: this.kmsKeyId,
      kmsKeyArn: this.kmsKeyArn,
      secretsManagerArns: this.secretsManagerArns,
      cognitoUserPoolId: this.cognitoUserPoolId,
      cognitoUserPoolArn: this.cognitoUserPoolArn,

      // Database
      auroraClusterEndpoint: this.auroraClusterEndpoint,
      auroraReaderEndpoint: this.auroraReaderEndpoint,
      dynamoDbTableName: this.dynamoDbTableName,
      elastiCacheEndpoint: this.elastiCacheEndpoint,

      // Compute
      ecsClusterArn: this.ecsClusterArn,
      ecsClusterName: this.ecsClusterName,
      appMeshName: this.appMeshName,

      // API
      apiGatewayUrl: this.apiGatewayUrl,
      apiGatewayId: this.apiGatewayId,
      loadBalancerDns: this.loadBalancerDns,
      globalAcceleratorDns: this.globalAcceleratorDns,

      // Storage
      transactionBucketName: this.transactionBucketName,
      archiveBucketName: this.archiveBucketName,

      // Messaging
      transactionQueueUrl: this.transactionQueueUrl,
      kinesisStreamName: this.kinesisStreamName,

      // Monitoring
      dashboardUrl: this.dashboardUrl,
      snsTopicArn: this.snsTopicArn,

      // Deployment metadata
      environment: environmentSuffix,
      primaryRegion: regions.primary,
      replicaRegions: regions.replicas,
      deploymentTimestamp: new Date().toISOString(),
    });
  }
}
