/**
 * Node Groups Stack - Creates managed node groups with custom launch templates
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NodeGroupsStackArgs {
  environmentSuffix: string;
  clusterName: pulumi.Output<string>;
  nodeRole: pulumi.Output<aws.iam.Role>;
  privateSubnetIds: pulumi.Output<string[]>;
  clusterSecurityGroup: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class NodeGroupsStack extends pulumi.ComponentResource {
  public readonly generalNodeGroupName: pulumi.Output<string>;
  public readonly computeNodeGroupName: pulumi.Output<string>;
  public readonly nodeGroupTags: pulumi.Output<{ [key: string]: string }>;

  constructor(
    name: string,
    args: NodeGroupsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:eks:NodeGroupsStack', name, args, opts);

    const {
      environmentSuffix,
      clusterName,
      nodeRole,
      privateSubnetIds,
      clusterSecurityGroup,
      tags,
    } = args;

    // Note: Using EKS-optimized AMI (default) instead of custom AMI
    // to avoid user data configuration issues with Bottlerocket

    // Create security group for nodes
    const nodeSecurityGroup = new aws.ec2.SecurityGroup(
      `eks-node-sg-${environmentSuffix}`,
      {
        vpcId: privateSubnetIds
          .apply(ids => ids[0])
          .apply(async id => {
            const subnet = await aws.ec2.getSubnet({ id });
            return subnet.vpcId;
          }),
        description: 'Security group for EKS nodes',
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `eks-node-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Allow nodes to communicate with cluster
    new aws.ec2.SecurityGroupRule(
      `eks-node-ingress-cluster-${environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 0,
        toPort: 65535,
        protocol: '-1',
        sourceSecurityGroupId: clusterSecurityGroup,
        securityGroupId: nodeSecurityGroup.id,
      },
      { parent: this }
    );

    // Allow nodes to communicate with each other
    new aws.ec2.SecurityGroupRule(
      `eks-node-ingress-self-${environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 0,
        toPort: 65535,
        protocol: '-1',
        self: true,
        securityGroupId: nodeSecurityGroup.id,
      },
      { parent: this }
    );

    // Allow all outbound traffic
    new aws.ec2.SecurityGroupRule(
      `eks-node-egress-${environmentSuffix}`,
      {
        type: 'egress',
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
        securityGroupId: nodeSecurityGroup.id,
      },
      { parent: this }
    );

    // Note: Removed custom launch templates to use EKS-managed configuration
    // with default EKS-optimized AMI. Custom launch templates with Bottlerocket
    // require complex user data configuration for cluster joining.

    // Create general workloads node group
    const generalNodeGroup = new aws.eks.NodeGroup(
      `eks-general-ng-${environmentSuffix}`,
      {
        clusterName: clusterName,
        nodeGroupName: `general-${environmentSuffix}`,
        nodeRoleArn: nodeRole.apply(r => r.arn),
        subnetIds: privateSubnetIds,
        instanceTypes: ['t3.large'],
        diskSize: 100,
        scalingConfig: {
          minSize: 2,
          maxSize: 10,
          desiredSize: 2,
        },
        labels: {
          workload: 'general',
        },
        tags: pulumi.all([tags, clusterName]).apply(([t, cn]) => ({
          ...t,
          'k8s.io/cluster-autoscaler/enabled': 'true',
          [`k8s.io/cluster-autoscaler/${cn}`]: 'owned',
          'k8s.io/cluster-autoscaler/node-template/label/workload': 'general',
          priority: '10',
        })),
      },
      { parent: this }
    );

    // Create compute-intensive workloads node group
    const computeNodeGroup = new aws.eks.NodeGroup(
      `eks-compute-ng-${environmentSuffix}`,
      {
        clusterName: clusterName,
        nodeGroupName: `compute-${environmentSuffix}`,
        nodeRoleArn: nodeRole.apply(r => r.arn),
        subnetIds: privateSubnetIds,
        instanceTypes: ['c5.2xlarge'],
        diskSize: 100,
        scalingConfig: {
          minSize: 1,
          maxSize: 5,
          desiredSize: 1,
        },
        labels: {
          workload: 'compute',
        },
        tags: pulumi.all([tags, clusterName]).apply(([t, cn]) => ({
          ...t,
          'k8s.io/cluster-autoscaler/enabled': 'true',
          [`k8s.io/cluster-autoscaler/${cn}`]: 'owned',
          'k8s.io/cluster-autoscaler/node-template/label/workload': 'compute',
          priority: '5',
        })),
      },
      { parent: this }
    );

    this.generalNodeGroupName = generalNodeGroup.nodeGroupName;
    this.computeNodeGroupName = computeNodeGroup.nodeGroupName;
    this.nodeGroupTags = pulumi.all([tags, clusterName]).apply(([t, cn]) => ({
      ...t,
      'k8s.io/cluster-autoscaler/enabled': 'true',
      [`k8s.io/cluster-autoscaler/${cn}`]: 'owned',
    }));

    this.registerOutputs({
      generalNodeGroupName: this.generalNodeGroupName,
      computeNodeGroupName: this.computeNodeGroupName,
    });
  }
}
