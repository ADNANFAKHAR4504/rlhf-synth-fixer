import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { KubectlV29Layer } from '@aws-cdk/lambda-layer-kubectl-v29';

export interface EksConstructProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  clusterRole: iam.Role;
  nodeGroupRole: iam.Role;
  enableDashboard: boolean;
}

export class EksConstruct extends Construct {
  public readonly cluster: eks.Cluster;
  public readonly nodeGroup: eks.Nodegroup;

  constructor(scope: Construct, id: string, props: EksConstructProps) {
    super(scope, id);

    // Create EKS cluster
    this.cluster = new eks.Cluster(this, 'EksCluster', {
      clusterName: `tap-cluster-${props.environmentSuffix}`,
      version: eks.KubernetesVersion.V1_29,
      role: props.clusterRole,
      vpc: props.vpc,
      vpcSubnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
      defaultCapacity: 0, // We'll use managed node groups
      outputClusterName: true,
      outputConfigCommand: true,
      kubectlLayer: new KubectlV29Layer(this, 'KubectlLayer'),
    });

    // Create managed node group
    this.nodeGroup = new eks.Nodegroup(this, 'NodeGroup', {
      cluster: this.cluster,
      nodegroupName: `tap-nodes-${props.environmentSuffix}`,
      nodeRole: props.nodeGroupRole,
      instanceTypes: [
        props.environmentSuffix === 'prod'
          ? ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE)
          : ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      ],
      minSize: props.environmentSuffix === 'prod' ? 2 : 1,
      maxSize: props.environmentSuffix === 'prod' ? 10 : 3,
      desiredSize: props.environmentSuffix === 'prod' ? 3 : 2,
      capacityType:
        props.environmentSuffix === 'prod'
          ? eks.CapacityType.ON_DEMAND
          : eks.CapacityType.SPOT,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      tags: {
        Environment: props.environmentSuffix,
        'kubernetes.io/cluster-autoscaler/enabled': 'true',
        [`kubernetes.io/cluster-autoscaler/tap-cluster-${props.environmentSuffix}`]:
          'owned',
      },
    });

    // Enable EKS Dashboard integration if requested
    if (props.enableDashboard) {
      // Add necessary IAM permissions for EKS Dashboard
      const dashboardPolicy = new iam.Policy(this, 'EksDashboardPolicy', {
        policyName: `eks-dashboard-policy-${props.environmentSuffix}`,
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'eks:DescribeCluster',
              'eks:ListClusters',
              'eks:DescribeNodegroup',
              'eks:ListNodegroups',
              'eks:DescribeAddon',
              'eks:ListAddons',
              'organizations:ListAccounts',
              'organizations:DescribeOrganization',
            ],
            resources: ['*'],
          }),
        ],
      });

      props.clusterRole.attachInlinePolicy(dashboardPolicy);
    }

    // Install AWS Load Balancer Controller
    this.cluster.addHelmChart('AwsLoadBalancerController', {
      chart: 'aws-load-balancer-controller',
      repository: 'https://aws.github.io/eks-charts',
      namespace: 'kube-system',
      release: 'aws-load-balancer-controller',
      version: '1.8.1',
      values: {
        clusterName: this.cluster.clusterName,
        serviceAccount: {
          create: false,
          name: 'aws-load-balancer-controller',
        },
        region: cdk.Stack.of(this).region,
        vpcId: props.vpc.vpcId,
      },
    });

    // Create service account for AWS Load Balancer Controller
    const lbControllerServiceAccount = this.cluster.addServiceAccount(
      'AwsLoadBalancerControllerServiceAccount',
      {
        name: 'aws-load-balancer-controller',
        namespace: 'kube-system',
      }
    );

    lbControllerServiceAccount.role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'ElasticLoadBalancingFullAccess'
      )
    );

    // Add tags
    this.cluster.node.addMetadata('Environment', props.environmentSuffix);
    this.cluster.node.addMetadata('Component', 'EKS');
    this.nodeGroup.node.addMetadata('Environment', props.environmentSuffix);
    this.nodeGroup.node.addMetadata('Component', 'EKS-NodeGroup');
  }
}
