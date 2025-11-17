/**
 * EKS Managed Node Groups Stack
 * Creates two managed node groups: one with spot instances and one with on-demand
 */
import * as pulumi from '@pulumi/pulumi';
import * as eks from '@pulumi/eks';

export interface EksNodeGroupsStackArgs {
  environmentSuffix: string;
  cluster: eks.Cluster;
  privateSubnetIds: pulumi.Input<string[]>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class EksNodeGroupsStack extends pulumi.ComponentResource {
  public readonly spotNodeGroup: eks.ManagedNodeGroup;
  public readonly onDemandNodeGroup: eks.ManagedNodeGroup;

  constructor(
    name: string,
    args: EksNodeGroupsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:eks:EksNodeGroupsStack', name, args, opts);

    // Create spot instance node group
    this.spotNodeGroup = eks.createManagedNodeGroup(
      `eks-spot-ng-${args.environmentSuffix}`,
      {
        cluster: args.cluster,
        nodeGroupName: `eks-spot-ng-${args.environmentSuffix}`,
        nodeRoleArn: args.cluster.instanceRoles[0].arn,
        subnetIds: args.privateSubnetIds,
        capacityType: 'SPOT',
        instanceTypes: ['t3.medium', 't3a.medium'],
        scalingConfig: {
          desiredSize: 2,
          minSize: 1,
          maxSize: 5,
        },
        labels: {
          'node-type': 'spot',
          workload: 'general',
        },
        tags: {
          Name: `eks-spot-ng-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
          NodeType: 'spot',
          ...args.tags,
        },
      }
    );

    // Create on-demand instance node group
    this.onDemandNodeGroup = eks.createManagedNodeGroup(
      `eks-ondemand-ng-${args.environmentSuffix}`,
      {
        cluster: args.cluster,
        nodeGroupName: `eks-ondemand-ng-${args.environmentSuffix}`,
        nodeRoleArn: args.cluster.instanceRoles[0].arn,
        subnetIds: args.privateSubnetIds,
        capacityType: 'ON_DEMAND',
        instanceTypes: ['t3.medium'],
        scalingConfig: {
          desiredSize: 1,
          minSize: 1,
          maxSize: 3,
        },
        labels: {
          'node-type': 'on-demand',
          workload: 'critical',
        },
        tags: {
          Name: `eks-ondemand-ng-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
          NodeType: 'on-demand',
          ...args.tags,
        },
      }
    );

    this.registerOutputs({
      spotNodeGroupName: this.spotNodeGroup.nodeGroup.nodeGroupName,
      onDemandNodeGroupName: this.onDemandNodeGroup.nodeGroup.nodeGroupName,
    });
  }
}
