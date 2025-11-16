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

    // Create custom launch template for general workloads with Bottlerocket AMI
    // Includes encrypted EBS volumes (gp3), IMDSv2 enforcement, and security best practices
    const generalLaunchTemplate = new aws.ec2.LaunchTemplate(
      `eks-general-lt-${environmentSuffix}`,
      {
        namePrefix: `eks-general-${environmentSuffix}-`,
        blockDeviceMappings: [
          {
            deviceName: '/dev/xvda',
            ebs: {
              volumeSize: 100,
              volumeType: 'gp3',
              iops: 3000,
              throughput: 125,
              encrypted: 'true',
              deleteOnTermination: 'true',
            },
          },
        ],
        metadataOptions: {
          httpTokens: 'required', // Enforce IMDSv2
          httpPutResponseHopLimit: 1,
          httpEndpoint: 'enabled',
        },
        monitoring: {
          enabled: true,
        },
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: pulumi.all([tags]).apply(([t]) => ({
              ...t,
              Name: `eks-general-node-${environmentSuffix}`,
              NodeGroup: 'general',
            })),
          },
          {
            resourceType: 'volume',
            tags: pulumi.all([tags]).apply(([t]) => ({
              ...t,
              Name: `eks-general-volume-${environmentSuffix}`,
            })),
          },
        ],
      },
      { parent: this }
    );

    // Create custom launch template for compute workloads with Bottlerocket AMI
    const computeLaunchTemplate = new aws.ec2.LaunchTemplate(
      `eks-compute-lt-${environmentSuffix}`,
      {
        namePrefix: `eks-compute-${environmentSuffix}-`,
        blockDeviceMappings: [
          {
            deviceName: '/dev/xvda',
            ebs: {
              volumeSize: 100,
              volumeType: 'gp3',
              iops: 3000,
              throughput: 125,
              encrypted: 'true',
              deleteOnTermination: 'true',
            },
          },
        ],
        metadataOptions: {
          httpTokens: 'required', // Enforce IMDSv2
          httpPutResponseHopLimit: 1,
          httpEndpoint: 'enabled',
        },
        monitoring: {
          enabled: true,
        },
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: pulumi.all([tags]).apply(([t]) => ({
              ...t,
              Name: `eks-compute-node-${environmentSuffix}`,
              NodeGroup: 'compute',
            })),
          },
          {
            resourceType: 'volume',
            tags: pulumi.all([tags]).apply(([t]) => ({
              ...t,
              Name: `eks-compute-volume-${environmentSuffix}`,
            })),
          },
        ],
      },
      { parent: this }
    );

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

    // Create general workloads node group with Bottlerocket AMI
    // Uses custom launch template for encrypted EBS volumes and IMDSv2
    const generalNodeGroup = new aws.eks.NodeGroup(
      `eks-general-ng-${environmentSuffix}`,
      {
        clusterName: clusterName,
        nodeGroupName: `general-${environmentSuffix}`,
        nodeRoleArn: nodeRole.apply(r => r.arn),
        subnetIds: privateSubnetIds,
        instanceTypes: ['t3.large'],
        amiType: 'BOTTLEROCKET_x86_64', // Use Bottlerocket AMI for enhanced security
        capacityType: 'ON_DEMAND',
        launchTemplate: {
          id: generalLaunchTemplate.id,
          version: generalLaunchTemplate.latestVersion.apply(v => v.toString()),
        },
        scalingConfig: {
          minSize: 2,
          maxSize: 10,
          desiredSize: 2,
        },
        updateConfig: {
          maxUnavailable: 1,
        },
        labels: {
          workload: 'general',
          'bottlerocket.aws/platform': 'aws-k8s',
        },
        tags: pulumi.all([tags, clusterName]).apply(([t, cn]) => ({
          ...t,
          'k8s.io/cluster-autoscaler/enabled': 'true',
          [`k8s.io/cluster-autoscaler/${cn}`]: 'owned',
          'k8s.io/cluster-autoscaler/node-template/label/workload': 'general',
          priority: '10',
          AMI: 'Bottlerocket',
        })),
      },
      { parent: this }
    );

    // Create compute-intensive workloads node group with Bottlerocket AMI
    // Uses custom launch template for encrypted EBS volumes and IMDSv2
    const computeNodeGroup = new aws.eks.NodeGroup(
      `eks-compute-ng-${environmentSuffix}`,
      {
        clusterName: clusterName,
        nodeGroupName: `compute-${environmentSuffix}`,
        nodeRoleArn: nodeRole.apply(r => r.arn),
        subnetIds: privateSubnetIds,
        instanceTypes: ['c5.2xlarge'],
        amiType: 'BOTTLEROCKET_x86_64', // Use Bottlerocket AMI for enhanced security
        capacityType: 'ON_DEMAND',
        launchTemplate: {
          id: computeLaunchTemplate.id,
          version: computeLaunchTemplate.latestVersion.apply(v => v.toString()),
        },
        scalingConfig: {
          minSize: 1,
          maxSize: 5,
          desiredSize: 1,
        },
        updateConfig: {
          maxUnavailable: 1,
        },
        labels: {
          workload: 'compute',
          'bottlerocket.aws/platform': 'aws-k8s',
        },
        tags: pulumi.all([tags, clusterName]).apply(([t, cn]) => ({
          ...t,
          'k8s.io/cluster-autoscaler/enabled': 'true',
          [`k8s.io/cluster-autoscaler/${cn}`]: 'owned',
          'k8s.io/cluster-autoscaler/node-template/label/workload': 'compute',
          priority: '5',
          AMI: 'Bottlerocket',
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
