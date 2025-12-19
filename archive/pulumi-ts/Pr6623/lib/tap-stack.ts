/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource orchestrating the payment processing migration infrastructure.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { DatabaseStack } from './database';
import { DmsStack } from './dms';
import { EcsStack } from './ecs';
import { IamRolesStack } from './iam';
import { LambdaStack } from './lambda-stack';
import { LoadBalancerStack } from './load-balancer';
import { MonitoringStack } from './monitoring';
import { NetworkingStack } from './networking';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * Environment suffix for resource naming (e.g., 'dev', 'prod', or CI/CD generated).
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * TapStack - Main orchestrator for payment processing migration infrastructure
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly rdsClusterEndpoint: pulumi.Output<string>;
  public readonly dmsTaskArn: pulumi.Output<string>;
  public readonly vpcId: pulumi.Output<string>;
  public readonly albSecurityGroupId: pulumi.Output<string>;
  public readonly clusterId: pulumi.Output<string>;
  public readonly albName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const defaultTags = {
      Environment: 'prod-migration',
      CostCenter: 'finance',
      MigrationPhase: 'active',
    };

    // 1. Networking - VPC with 3 AZs, public and private subnets
    const networking = new NetworkingStack(
      'networking',
      {
        environmentSuffix,
        vpcCidr: '10.0.0.0/16',
        publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
        privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'],
        tags: defaultTags,
      },
      { parent: this }
    );

    // 2. IAM Roles
    const iamRoles = new IamRolesStack(
      'iam-roles',
      {
        environmentSuffix,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 3. Database - RDS Aurora PostgreSQL
    const database = new DatabaseStack(
      'database',
      {
        environmentSuffix,
        vpc: networking.vpc,
        privateSubnetIds: networking.privateSubnetIds,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 4. ECS Fargate Service
    const ecs = new EcsStack(
      'ecs',
      {
        environmentSuffix,
        vpc: networking.vpc,
        privateSubnetIds: networking.privateSubnetIds,
        rdsSecurityGroupId: database.securityGroupId,
        taskExecutionRoleArn: iamRoles.ecsTaskExecutionRoleArn,
        taskRoleArn: iamRoles.ecsTaskRoleArn,
        rdsClusterEndpoint: database.clusterEndpoint,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 5. Application Load Balancer
    const loadBalancer = new LoadBalancerStack(
      'load-balancer',
      {
        environmentSuffix,
        vpc: networking.vpc,
        publicSubnetIds: networking.publicSubnetIds,
        ecsSecurityGroupId: ecs.securityGroupId,
        targetGroupArn: ecs.targetGroupArn,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Connect ALB to ECS
    ecs.attachLoadBalancer(loadBalancer.listenerArn);

    // 6. DMS - Database Migration Service
    const dms = new DmsStack(
      'dms',
      {
        environmentSuffix,
        vpc: networking.vpc,
        privateSubnetIds: networking.privateSubnetIds,
        sourceDbEndpoint: pulumi.interpolate`mock-source-db.${environmentSuffix}.local`,
        targetDbEndpoint: database.clusterEndpoint,
        targetDbSecurityGroupId: database.securityGroupId,
        dmsRoleArn: iamRoles.dmsReplicationRoleArn,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 7. Lambda - Data validation function
    new LambdaStack(
      'lambda',
      {
        environmentSuffix,
        vpc: networking.vpc,
        privateSubnetIds: networking.privateSubnetIds,
        rdsSecurityGroupId: database.securityGroupId,
        lambdaRoleArn: iamRoles.lambdaExecutionRoleArn,
        sourceDbEndpoint: pulumi.interpolate`mock-source-db.${environmentSuffix}.local`,
        targetDbEndpoint: database.clusterEndpoint,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 8. CloudWatch Monitoring
    new MonitoringStack(
      'monitoring',
      {
        environmentSuffix,
        dmsReplicationTaskArn: dms.replicationTaskArn,
        ecsClusterName: ecs.clusterName,
        ecsServiceName: ecs.serviceName,
        rdsClusterId: database.clusterId,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Export outputs
    this.albDnsName = loadBalancer.albDnsName;
    this.rdsClusterEndpoint = database.clusterEndpoint;
    this.dmsTaskArn = dms.replicationTaskArn;
    this.vpcId = networking.vpc.id;
    this.albSecurityGroupId = loadBalancer.securityGroupId;
    this.clusterId = database.clusterId;
    this.albName = loadBalancer.albName;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      rdsClusterEndpoint: this.rdsClusterEndpoint,
      dmsTaskArn: this.dmsTaskArn,
      vpcId: this.vpcId,
      albSecurityGroupId: this.albSecurityGroupId,
      clusterId: this.clusterId,
      albName: this.albName,
    });
  }
}
