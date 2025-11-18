import { KubectlV28Layer } from '@aws-cdk/lambda-layer-kubectl-v28';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // VPC with private subnets across 3 availability zones
    const vpc = new ec2.Vpc(this, 'EksVpc', {
      vpcName: `eks-vpc-${environmentSuffix}`,
      maxAzs: 3,
      natGateways: 1, // Cost optimization: use 1 NAT Gateway instead of 3
      subnetConfiguration: [
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    // Tag VPC resources
    cdk.Tags.of(vpc).add('Environment', 'Production');
    cdk.Tags.of(vpc).add('Project', 'PaymentPlatform');

    // EKS Cluster IAM Role
    const clusterRole = new iam.Role(this, 'EksClusterRole', {
      roleName: `eks-cluster-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonEKSVPCResourceController'
        ),
      ],
    });

    // CloudWatch Log Group for EKS control plane logs
    new logs.LogGroup(this, 'EksClusterLogGroup', {
      logGroupName: `/aws/eks/payment-cluster-v1-${environmentSuffix}/cluster`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // EKS Cluster
    const cluster = new eks.Cluster(this, 'PaymentEksCluster', {
      clusterName: `payment-cluster-${environmentSuffix}`,
      version: eks.KubernetesVersion.V1_28,
      vpc: vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      role: clusterRole,
      defaultCapacity: 0, // We'll create managed node groups separately
      endpointAccess: eks.EndpointAccess.PRIVATE,
      clusterLogging: [
        eks.ClusterLoggingTypes.API,
        eks.ClusterLoggingTypes.AUDIT,
        eks.ClusterLoggingTypes.AUTHENTICATOR,
        eks.ClusterLoggingTypes.CONTROLLER_MANAGER,
        eks.ClusterLoggingTypes.SCHEDULER,
      ],
      kubectlLayer: new KubectlV28Layer(this, 'KubectlLayer'),
      outputClusterName: true,
      outputConfigCommand: true,
    });

    // Tag cluster
    cdk.Tags.of(cluster).add('Environment', 'Production');
    cdk.Tags.of(cluster).add('Project', 'PaymentPlatform');

    // IAM Role for Node Groups
    const nodeGroupRole = new iam.Role(this, 'EksNodeGroupRole', {
      roleName: `eks-nodegroup-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonEC2ContainerRegistryReadOnly'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ), // Systems Manager access
      ],
    });

    // Cluster Autoscaler policy for node group role
    nodeGroupRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'autoscaling:DescribeAutoScalingGroups',
          'autoscaling:DescribeAutoScalingInstances',
          'autoscaling:DescribeLaunchConfigurations',
          'autoscaling:DescribeScalingActivities',
          'autoscaling:DescribeTags',
          'ec2:DescribeInstanceTypes',
          'ec2:DescribeLaunchTemplateVersions',
        ],
        resources: ['*'],
      })
    );

    nodeGroupRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'autoscaling:SetDesiredCapacity',
          'autoscaling:TerminateInstanceInAutoScalingGroup',
          'ec2:DescribeImages',
          'ec2:GetInstanceTypesFromInstanceRequirements',
          'eks:DescribeNodegroup',
        ],
        resources: ['*'],
      })
    );

    // Managed Node Group with Bottlerocket AMI
    const nodeGroup = cluster.addNodegroupCapacity('BottlerocketNodeGroup', {
      nodegroupName: `bottlerocket-ng-${environmentSuffix}`,
      instanceTypes: [new ec2.InstanceType('t3.large')],
      minSize: 3,
      maxSize: 15,
      desiredSize: 3,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      nodeRole: nodeGroupRole,
      amiType: eks.NodegroupAmiType.BOTTLEROCKET_X86_64,
      capacityType: eks.CapacityType.ON_DEMAND,
      tags: {
        Environment: 'Production',
        Project: 'PaymentPlatform',
        Name: `bottlerocket-node-${environmentSuffix}`,
      },
    });

    // Service Account for Cluster Autoscaler
    const clusterAutoscalerSA = cluster.addServiceAccount(
      'ClusterAutoscalerSA',
      {
        name: 'cluster-autoscaler',
        namespace: 'kube-system',
      }
    );

    clusterAutoscalerSA.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'autoscaling:DescribeAutoScalingGroups',
          'autoscaling:DescribeAutoScalingInstances',
          'autoscaling:DescribeLaunchConfigurations',
          'autoscaling:DescribeScalingActivities',
          'autoscaling:DescribeTags',
          'ec2:DescribeInstanceTypes',
          'ec2:DescribeLaunchTemplateVersions',
          'autoscaling:SetDesiredCapacity',
          'autoscaling:TerminateInstanceInAutoScalingGroup',
          'ec2:DescribeImages',
          'ec2:GetInstanceTypesFromInstanceRequirements',
          'eks:DescribeNodegroup',
        ],
        resources: ['*'],
      })
    );

    // Example Service Account for workload IRSA
    const workloadSA = cluster.addServiceAccount('WorkloadServiceAccount', {
      name: 'payment-processor',
      namespace: 'default',
    });

    // Grant minimal permissions to workload service account
    workloadSA.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudwatch:PutMetricData',
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'EKS Cluster Name',
      exportName: `eks-cluster-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterArn', {
      value: cluster.clusterArn,
      description: 'EKS Cluster ARN',
      exportName: `eks-cluster-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: cluster.clusterEndpoint,
      description: 'EKS Cluster Endpoint (Private)',
      exportName: `eks-cluster-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterSecurityGroupId', {
      value: cluster.clusterSecurityGroupId,
      description: 'EKS Cluster Security Group ID',
      exportName: `eks-cluster-sg-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `eks-vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OidcProviderArn', {
      value: cluster.openIdConnectProvider.openIdConnectProviderArn,
      description: 'OIDC Provider ARN for IRSA',
      exportName: `eks-oidc-provider-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'NodeGroupName', {
      value: nodeGroup.nodegroupName,
      description: 'Managed Node Group Name',
      exportName: `eks-nodegroup-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterAutoscalerRoleArn', {
      value: clusterAutoscalerSA.role.roleArn,
      description: 'Cluster Autoscaler Service Account Role ARN',
      exportName: `eks-autoscaler-role-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'WorkloadServiceAccountRoleArn', {
      value: workloadSA.role.roleArn,
      description: 'Workload Service Account Role ARN',
      exportName: `eks-workload-sa-role-arn-${environmentSuffix}`,
    });
  }
}
