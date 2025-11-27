import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { NetworkingComponent } from './networking';
import { DatabaseComponent } from './database';
import { ComputeComponent } from './compute';
import { StorageComponent } from './storage';
import { RegionalInfrastructureProps } from './types';

export class RegionalInfrastructure extends pulumi.ComponentResource {
  public readonly networking: NetworkingComponent;
  public readonly database: DatabaseComponent;
  public readonly compute: ComputeComponent;
  public readonly storage: StorageComponent;
  public readonly eventBus: aws.cloudwatch.EventBus;

  constructor(
    name: string,
    args: RegionalInfrastructureProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:regional:RegionalInfrastructure', name, {}, opts);

    const provider = new aws.Provider(
      `${name}-provider`,
      { region: args.region },
      { parent: this }
    );

    const providerOpts = { parent: this, provider };

    // Create Networking (with VPC Peering if provided)
    this.networking = new NetworkingComponent(
      `${name}-networking`,
      {
        cidr: args.vpcCidr,
        availabilityZones: [
          `${args.region}a`,
          `${args.region}b`,
          `${args.region}c`,
        ],
        environmentSuffix: args.environmentSuffix,
        region: args.region,
        peeringConnectionId: args.peeringConnectionId,
        peerCidr: args.peerCidr,
      },
      providerOpts
    );

    // Create Database
    this.database = new DatabaseComponent(
      `${name}-database`,
      {
        environmentSuffix: args.environmentSuffix,
        region: args.region,
        isPrimary: args.isPrimary,
        globalClusterId: args.globalClusterId?.id,
        subnetIds: this.networking.privateSubnets.map(s => s.id),
        securityGroupIds: [this.networking.securityGroup.id],
        config: {
          engine: 'aurora-postgresql',
          engineVersion: '14.6',
          instanceClass: 'db.r5.large',
          skipFinalSnapshot: true,
          deletionProtection: false,
        },
        tags: args.tags,
      },
      { ...providerOpts, dependsOn: [this.networking] }
    );

    // Create Compute (with /health endpoint)
    this.compute = new ComputeComponent(
      `${name}-compute`,
      {
        environmentSuffix: args.environmentSuffix,
        region: args.region,
        isPrimary: args.isPrimary,
        vpcId: this.networking.vpc.id,
        subnetIds: this.networking.publicSubnets.map(s => s.id),
        securityGroupId: this.networking.securityGroup.id,
        tags: args.tags,
      },
      { ...providerOpts, dependsOn: [this.networking] }
    );

    // Create Storage (no replication config here - handled in main stack)
    this.storage = new StorageComponent(
      `${name}-storage`,
      {
        environmentSuffix: args.environmentSuffix,
        region: args.region,
        isPrimary: args.isPrimary,
        tags: args.tags,
      },
      providerOpts
    );

    // Create EventBridge Bus
    this.eventBus = new aws.cloudwatch.EventBus(
      `${name}-event-bus`,
      {
        name: `healthcare-events-${args.region}-${args.environmentSuffix}`,
        tags: {
          ...args.tags,
          Name: `event-bus-${args.region}-${args.environmentSuffix}`,
        },
      },
      providerOpts
    );

    this.registerOutputs({
      vpcId: this.networking.vpc.id,
      albDnsName: this.compute.alb.dnsName,
      bucketName: this.storage.bucket.id,
      dbClusterEndpoint: this.database.cluster.endpoint,
      eventBusName: this.eventBus.name,
    });
  }
}
