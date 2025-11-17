import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RegionalConfig } from './types';
import { NetworkingConstruct } from './constructs/networking-construct';
import { DatabaseConstruct } from './constructs/database-construct';
import { StorageConstruct } from './constructs/storage-construct';
import { ComputeConstruct } from './constructs/compute-construct';
import { LoadBalancerConstruct } from './constructs/loadbalancer-construct';
import { ContainerConstruct } from './constructs/container-construct';
import { DynamoDBConstruct } from './constructs/dynamodb-construct';
import { MonitoringConstruct } from './constructs/monitoring-construct';

export interface RegionalStackProps extends cdk.StackProps {
  config: RegionalConfig;
  replicaRegion?: string;
  replicationDestinationBucketArn?: string;
  replicationDestinationKmsArn?: string;
  tags: {
    Environment: string;
    Region: string;
    CostCenter: string;
  };
}

export class RegionalStack extends cdk.Stack {
  public readonly networking: NetworkingConstruct;
  public readonly database: DatabaseConstruct;
  public readonly storage: StorageConstruct;
  public readonly loadBalancer: LoadBalancerConstruct;
  public readonly dynamodb: DynamoDBConstruct;

  constructor(scope: Construct, id: string, props: RegionalStackProps) {
    super(scope, id, props);

    const cidrBlock = props.config.isPrimary ? '10.0.0.0/16' : '10.1.0.0/16';

    this.networking = new NetworkingConstruct(this, 'Networking', {
      environmentSuffix: props.config.environmentSuffix,
      region: props.config.region,
      cidrBlock,
    });

    this.database = new DatabaseConstruct(this, 'Database', {
      environmentSuffix: props.config.environmentSuffix,
      region: props.config.region,
      vpc: this.networking.vpc,
      privateSubnets: this.networking.privateSubnets,
    });

    this.storage = new StorageConstruct(this, 'Storage', {
      environmentSuffix: props.config.environmentSuffix,
      region: props.config.region,
      isPrimary: props.config.isPrimary,
      replicationDestinationBucketArn: props.replicationDestinationBucketArn,
      replicationDestinationKmsArn: props.replicationDestinationKmsArn,
    });

    const compute = new ComputeConstruct(this, 'Compute', {
      environmentSuffix: props.config.environmentSuffix,
      region: props.config.region,
      apiEndpoint: `https://api-${props.config.region}.example.com`,
    });

    this.loadBalancer = new LoadBalancerConstruct(this, 'LoadBalancer', {
      environmentSuffix: props.config.environmentSuffix,
      region: props.config.region,
      vpc: this.networking.vpc,
      publicSubnets: this.networking.publicSubnets,
      blockedCountries: props.config.wafBlockedCountries,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const containers = new ContainerConstruct(this, 'Containers', {
      environmentSuffix: props.config.environmentSuffix,
      region: props.config.region,
      vpc: this.networking.vpc,
      privateSubnets: this.networking.privateSubnets,
      alb: this.loadBalancer.alb,
    });

    const replicaRegions = props.replicaRegion ? [props.replicaRegion] : [];
    this.dynamodb = new DynamoDBConstruct(this, 'DynamoDB', {
      environmentSuffix: props.config.environmentSuffix,
      region: props.config.region,
      replicaRegions,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const monitoring = new MonitoringConstruct(this, 'Monitoring', {
      environmentSuffix: props.config.environmentSuffix,
      region: props.config.region,
      latencyThreshold: props.config.cloudWatchLatencyThreshold,
      lambdaFunction: compute.paymentProcessor,
      database: this.database.database,
      alb: this.loadBalancer.alb,
    });

    Object.entries(props.tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }
}
