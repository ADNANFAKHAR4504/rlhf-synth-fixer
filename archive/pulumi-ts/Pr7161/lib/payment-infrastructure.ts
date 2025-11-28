import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { VpcComponent } from './components/vpc';
import { EcsComponent } from './components/ecs';
import { DatabaseComponent } from './components/database';
import { AlbComponent } from './components/alb';
import { Route53Component } from './components/route53';
import { EcrComponent } from './components/ecr';

export interface PaymentInfrastructureArgs {
  environment: string;
  region: string;
  vpcCidr: string;
  availabilityZoneCount: number;
  dbInstanceClass: string;
  scalingCpuThreshold: number;
  tags: { [key: string]: string };
}

export class PaymentInfrastructure extends pulumi.ComponentResource {
  public readonly vpc: VpcComponent;
  public readonly ecrRepository: EcrComponent;
  public readonly database: DatabaseComponent;
  public readonly ecsCluster: aws.ecs.Cluster;
  public readonly alb: AlbComponent;
  public readonly route53Zone: Route53Component;
  public readonly ecsService: aws.ecs.Service;

  constructor(
    name: string,
    args: PaymentInfrastructureArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:payment:Infrastructure', name, {}, opts);

    const resourceOpts = { parent: this };

    // Create VPC with public/private subnets
    this.vpc = new VpcComponent(
      `${args.environment}-vpc`,
      {
        cidr: args.vpcCidr,
        availabilityZoneCount: args.availabilityZoneCount,
        environment: args.environment,
        tags: args.tags,
      },
      resourceOpts
    );

    // Create shared ECR repository (or reference existing one)
    this.ecrRepository = new EcrComponent(
      `${args.environment}-ecr`,
      {
        environment: args.environment,
        repositoryName: 'payment-processor',
        tags: args.tags,
      },
      resourceOpts
    );

    // Create RDS Aurora PostgreSQL database
    this.database = new DatabaseComponent(
      `${args.environment}-db`,
      {
        environment: args.environment,
        vpcId: this.vpc.vpcId,
        privateSubnetIds: this.vpc.privateSubnetIds,
        instanceClass: args.dbInstanceClass,
        tags: args.tags,
      },
      resourceOpts
    );

    // Create Application Load Balancer
    this.alb = new AlbComponent(
      `${args.environment}-alb`,
      {
        environment: args.environment,
        vpcId: this.vpc.vpcId,
        publicSubnetIds: this.vpc.publicSubnetIds,
        tags: args.tags,
      },
      resourceOpts
    );

    // Create Route53 private hosted zone
    this.route53Zone = new Route53Component(
      `${args.environment}-dns`,
      {
        environment: args.environment,
        vpcId: this.vpc.vpcId,
        zoneName: `${args.environment}.payment.internal`,
        tags: args.tags,
      },
      resourceOpts
    );

    // Create ECS Cluster
    this.ecsCluster = new aws.ecs.Cluster(
      `${args.environment}-payment-cluster`,
      {
        name: `${args.environment}-payment-cluster`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: args.tags,
      },
      resourceOpts
    );

    // Create ECS component with Fargate service
    const ecsComponent = new EcsComponent(
      `${args.environment}-ecs`,
      {
        environment: args.environment,
        clusterArn: this.ecsCluster.arn,
        vpcId: this.vpc.vpcId,
        privateSubnetIds: this.vpc.privateSubnetIds,
        targetGroupArn: this.alb.targetGroupArn,
        ecrRepositoryUrl: this.ecrRepository.repositoryUrl,
        dbSecretArn: this.database.secretArn,
        scalingCpuThreshold: args.scalingCpuThreshold,
        albSecurityGroupId: this.alb.securityGroupId,
        tags: args.tags,
      },
      resourceOpts
    );

    this.ecsService = ecsComponent.service;

    this.registerOutputs({
      vpcId: this.vpc.vpcId,
      ecsClusterArn: this.ecsCluster.arn,
      albDnsName: this.alb.dnsName,
      dbEndpoint: this.database.endpoint,
      ecrRepositoryUrl: this.ecrRepository.repositoryUrl,
    });
  }

  generateOutputs(): pulumi.Output<{
    vpcId: string;
    clusterArn: string;
    albDns: string;
    dbEndpoint: string;
    dbInstanceClass: string;
    ecrUrl: string;
  }> {
    return pulumi
      .all([
        this.vpc.vpcId,
        this.ecsCluster.arn,
        this.alb.dnsName,
        this.database.endpoint,
        this.database.instanceClass,
        this.ecrRepository.repositoryUrl,
      ])
      .apply(
        ([vpcId, clusterArn, albDns, dbEndpoint, dbInstanceClass, ecrUrl]) => ({
          vpcId,
          clusterArn,
          albDns,
          dbEndpoint,
          dbInstanceClass,
          ecrUrl,
        })
      );
  }
}
