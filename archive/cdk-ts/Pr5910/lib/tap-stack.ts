import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { KubectlV29Layer } from '@aws-cdk/lambda-layer-kubectl-v29';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Tags to apply to all resources
    const commonTags = {
      Environment: 'production',
      ManagedBy: 'CDK',
      EnvironmentSuffix: environmentSuffix,
    };

    // 1. Create VPC with 3 public and 3 private subnets across 3 AZs
    const vpc = new ec2.Vpc(this, `EksVpc-${environmentSuffix}`, {
      vpcName: `eks-vpc-${environmentSuffix}`,
      maxAzs: 3,
      natGateways: 3,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `private-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Apply tags to VPC
    cdk.Tags.of(vpc).add('Environment', commonTags.Environment);
    cdk.Tags.of(vpc).add('ManagedBy', commonTags.ManagedBy);
    cdk.Tags.of(vpc).add('EnvironmentSuffix', commonTags.EnvironmentSuffix);

    // 2. Create EKS cluster version 1.28 with all control plane logging enabled
    const clusterName = `eks-cluster-${environmentSuffix}`;

    // Create cluster role
    const clusterRole = new iam.Role(
      this,
      `EksClusterRole-${environmentSuffix}`,
      {
        roleName: `eks-cluster-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'),
        ],
      }
    );

    // Apply tags to cluster role
    cdk.Tags.of(clusterRole).add('Environment', commonTags.Environment);
    cdk.Tags.of(clusterRole).add('ManagedBy', commonTags.ManagedBy);

    const cluster = new eks.Cluster(this, `EksCluster-${environmentSuffix}`, {
      clusterName,
      version: eks.KubernetesVersion.V1_28,
      vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      role: clusterRole,
      defaultCapacity: 0, // We'll use managed node groups
      endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
      kubectlLayer: new KubectlV29Layer(this, 'KubectlLayer'),
      clusterLogging: [
        eks.ClusterLoggingTypes.API,
        eks.ClusterLoggingTypes.AUDIT,
        eks.ClusterLoggingTypes.AUTHENTICATOR,
        eks.ClusterLoggingTypes.CONTROLLER_MANAGER,
        eks.ClusterLoggingTypes.SCHEDULER,
      ],
    });

    // Apply tags to cluster
    cdk.Tags.of(cluster).add('Environment', commonTags.Environment);
    cdk.Tags.of(cluster).add('ManagedBy', commonTags.ManagedBy);
    cdk.Tags.of(cluster).add('EnvironmentSuffix', commonTags.EnvironmentSuffix);

    // 3. OIDC provider is automatically created by the cluster construct
    // Access via cluster.openIdConnectProvider

    // 4-5. Create managed node group with t4g.medium (ARM64) instances
    // Auto-scale between 3 and 9 instances

    // Create node role
    const nodeRole = new iam.Role(this, `EksNodeRole-${environmentSuffix}`, {
      roleName: `eks-node-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonEC2ContainerRegistryReadOnly'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Apply tags to node role
    cdk.Tags.of(nodeRole).add('Environment', commonTags.Environment);
    cdk.Tags.of(nodeRole).add('ManagedBy', commonTags.ManagedBy);

    // 8. Create launch template with IMDSv2 enforced and no SSH
    const launchTemplate = new ec2.CfnLaunchTemplate(
      this,
      `NodeLaunchTemplate-${environmentSuffix}`,
      {
        launchTemplateName: `eks-node-lt-${environmentSuffix}`,
        launchTemplateData: {
          blockDeviceMappings: [
            {
              deviceName: '/dev/xvda',
              ebs: {
                volumeSize: 20,
                volumeType: 'gp3',
                deleteOnTermination: true,
                encrypted: true,
              },
            },
          ],
          metadataOptions: {
            httpTokens: 'required', // Enforce IMDSv2
            httpPutResponseHopLimit: 2,
          },
          tagSpecifications: [
            {
              resourceType: 'instance',
              tags: [
                { key: 'Environment', value: commonTags.Environment },
                { key: 'ManagedBy', value: commonTags.ManagedBy },
                {
                  key: 'EnvironmentSuffix',
                  value: commonTags.EnvironmentSuffix,
                },
              ],
            },
            {
              resourceType: 'volume',
              tags: [
                { key: 'Environment', value: commonTags.Environment },
                { key: 'ManagedBy', value: commonTags.ManagedBy },
                {
                  key: 'EnvironmentSuffix',
                  value: commonTags.EnvironmentSuffix,
                },
              ],
            },
          ],
        },
      }
    );

    const nodeGroup = cluster.addNodegroupCapacity(
      `ManagedNodeGroup-${environmentSuffix}`,
      {
        nodegroupName: `managed-ng-${environmentSuffix}`,
        nodeRole,
        instanceTypes: [new ec2.InstanceType('t4g.medium')],
        minSize: 3,
        maxSize: 9,
        desiredSize: 3,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        capacityType: eks.CapacityType.ON_DEMAND,
        amiType: eks.NodegroupAmiType.AL2_ARM_64,
        launchTemplateSpec: {
          id: launchTemplate.ref,
          version: launchTemplate.attrLatestVersionNumber,
        },
        tags: {
          Environment: commonTags.Environment,
          ManagedBy: commonTags.ManagedBy,
          EnvironmentSuffix: commonTags.EnvironmentSuffix,
        },
      }
    );

    // 6. Install EBS CSI driver as EKS add-on with IRSA role

    // Create IRSA role for EBS CSI driver
    const ebsCsiRole = new iam.Role(this, `EbsCsiRole-${environmentSuffix}`, {
      roleName: `eks-ebs-csi-role-${environmentSuffix}`,
      assumedBy: new iam.FederatedPrincipal(
        cluster.openIdConnectProvider.openIdConnectProviderArn,
        {
          StringEquals: new cdk.CfnJson(this, 'EbsCsiCondition', {
            value: {
              [`${cluster.clusterOpenIdConnectIssuer}:sub`]:
                'system:serviceaccount:kube-system:ebs-csi-controller-sa',
              [`${cluster.clusterOpenIdConnectIssuer}:aud`]:
                'sts.amazonaws.com',
            },
          }),
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonEBSCSIDriverPolicy'
        ),
      ],
    });

    // Apply tags to EBS CSI role
    cdk.Tags.of(ebsCsiRole).add('Environment', commonTags.Environment);
    cdk.Tags.of(ebsCsiRole).add('ManagedBy', commonTags.ManagedBy);

    // Add EBS CSI driver add-on
    const ebsCsiAddon = new eks.CfnAddon(
      this,
      `EbsCsiAddon-${environmentSuffix}`,
      {
        clusterName: cluster.clusterName,
        addonName: 'aws-ebs-csi-driver',
        addonVersion: 'v1.25.0-eksbuild.1',
        serviceAccountRoleArn: ebsCsiRole.roleArn,
        resolveConflicts: 'OVERWRITE',
        tags: [
          { key: 'Environment', value: commonTags.Environment },
          { key: 'ManagedBy', value: commonTags.ManagedBy },
          { key: 'EnvironmentSuffix', value: commonTags.EnvironmentSuffix },
        ],
      }
    );

    ebsCsiAddon.node.addDependency(cluster);
    ebsCsiAddon.node.addDependency(nodeGroup);

    // 7. Create IRSA role for AWS Load Balancer Controller

    const albControllerRole = new iam.Role(
      this,
      `AlbControllerRole-${environmentSuffix}`,
      {
        roleName: `eks-alb-controller-role-${environmentSuffix}`,
        assumedBy: new iam.FederatedPrincipal(
          cluster.openIdConnectProvider.openIdConnectProviderArn,
          {
            StringEquals: new cdk.CfnJson(this, 'AlbControllerCondition', {
              value: {
                [`${cluster.clusterOpenIdConnectIssuer}:sub`]:
                  'system:serviceaccount:kube-system:aws-load-balancer-controller',
                [`${cluster.clusterOpenIdConnectIssuer}:aud`]:
                  'sts.amazonaws.com',
              },
            }),
          },
          'sts:AssumeRoleWithWebIdentity'
        ),
      }
    );

    // Apply tags to ALB controller role
    cdk.Tags.of(albControllerRole).add('Environment', commonTags.Environment);
    cdk.Tags.of(albControllerRole).add('ManagedBy', commonTags.ManagedBy);

    // Add AWS Load Balancer Controller policy
    const albPolicy = new iam.Policy(
      this,
      `AlbControllerPolicy-${environmentSuffix}`,
      {
        policyName: `eks-alb-controller-policy-${environmentSuffix}`,
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['iam:CreateServiceLinkedRole'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'iam:AWSServiceName': 'elasticloadbalancing.amazonaws.com',
              },
            },
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'ec2:DescribeAccountAttributes',
              'ec2:DescribeAddresses',
              'ec2:DescribeAvailabilityZones',
              'ec2:DescribeInternetGateways',
              'ec2:DescribeVpcs',
              'ec2:DescribeVpcPeeringConnections',
              'ec2:DescribeSubnets',
              'ec2:DescribeSecurityGroups',
              'ec2:DescribeInstances',
              'ec2:DescribeNetworkInterfaces',
              'ec2:DescribeTags',
              'ec2:GetCoipPoolUsage',
              'ec2:DescribeCoipPools',
              'elasticloadbalancing:DescribeLoadBalancers',
              'elasticloadbalancing:DescribeLoadBalancerAttributes',
              'elasticloadbalancing:DescribeListeners',
              'elasticloadbalancing:DescribeListenerCertificates',
              'elasticloadbalancing:DescribeSSLPolicies',
              'elasticloadbalancing:DescribeRules',
              'elasticloadbalancing:DescribeTargetGroups',
              'elasticloadbalancing:DescribeTargetGroupAttributes',
              'elasticloadbalancing:DescribeTargetHealth',
              'elasticloadbalancing:DescribeTags',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'cognito-idp:DescribeUserPoolClient',
              'acm:ListCertificates',
              'acm:DescribeCertificate',
              'iam:ListServerCertificates',
              'iam:GetServerCertificate',
              'waf-regional:GetWebACL',
              'waf-regional:GetWebACLForResource',
              'waf-regional:AssociateWebACL',
              'waf-regional:DisassociateWebACL',
              'wafv2:GetWebACL',
              'wafv2:GetWebACLForResource',
              'wafv2:AssociateWebACL',
              'wafv2:DisassociateWebACL',
              'shield:GetSubscriptionState',
              'shield:DescribeProtection',
              'shield:CreateProtection',
              'shield:DeleteProtection',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'ec2:AuthorizeSecurityGroupIngress',
              'ec2:RevokeSecurityGroupIngress',
              'ec2:CreateSecurityGroup',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['ec2:CreateTags'],
            resources: ['arn:aws:ec2:*:*:security-group/*'],
            conditions: {
              StringEquals: {
                'ec2:CreateAction': 'CreateSecurityGroup',
              },
              Null: {
                'aws:RequestTag/elbv2.k8s.aws/cluster': 'false',
              },
            },
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['ec2:CreateTags', 'ec2:DeleteTags'],
            resources: ['arn:aws:ec2:*:*:security-group/*'],
            conditions: {
              Null: {
                'aws:RequestTag/elbv2.k8s.aws/cluster': 'true',
                'aws:ResourceTag/elbv2.k8s.aws/cluster': 'false',
              },
            },
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'ec2:AuthorizeSecurityGroupIngress',
              'ec2:RevokeSecurityGroupIngress',
              'ec2:DeleteSecurityGroup',
            ],
            resources: ['*'],
            conditions: {
              Null: {
                'aws:ResourceTag/elbv2.k8s.aws/cluster': 'false',
              },
            },
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'elasticloadbalancing:CreateLoadBalancer',
              'elasticloadbalancing:CreateTargetGroup',
            ],
            resources: ['*'],
            conditions: {
              Null: {
                'aws:RequestTag/elbv2.k8s.aws/cluster': 'false',
              },
            },
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'elasticloadbalancing:CreateListener',
              'elasticloadbalancing:DeleteListener',
              'elasticloadbalancing:CreateRule',
              'elasticloadbalancing:DeleteRule',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'elasticloadbalancing:AddTags',
              'elasticloadbalancing:RemoveTags',
            ],
            resources: [
              'arn:aws:elasticloadbalancing:*:*:targetgroup/*/*',
              'arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*',
              'arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*',
            ],
            conditions: {
              Null: {
                'aws:RequestTag/elbv2.k8s.aws/cluster': 'true',
                'aws:ResourceTag/elbv2.k8s.aws/cluster': 'false',
              },
            },
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'elasticloadbalancing:AddTags',
              'elasticloadbalancing:RemoveTags',
            ],
            resources: [
              'arn:aws:elasticloadbalancing:*:*:listener/net/*/*/*',
              'arn:aws:elasticloadbalancing:*:*:listener/app/*/*/*',
              'arn:aws:elasticloadbalancing:*:*:listener-rule/net/*/*/*',
              'arn:aws:elasticloadbalancing:*:*:listener-rule/app/*/*/*',
            ],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'elasticloadbalancing:ModifyLoadBalancerAttributes',
              'elasticloadbalancing:SetIpAddressType',
              'elasticloadbalancing:SetSecurityGroups',
              'elasticloadbalancing:SetSubnets',
              'elasticloadbalancing:DeleteLoadBalancer',
              'elasticloadbalancing:ModifyTargetGroup',
              'elasticloadbalancing:ModifyTargetGroupAttributes',
              'elasticloadbalancing:DeleteTargetGroup',
            ],
            resources: ['*'],
            conditions: {
              Null: {
                'aws:ResourceTag/elbv2.k8s.aws/cluster': 'false',
              },
            },
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['elasticloadbalancing:AddTags'],
            resources: [
              'arn:aws:elasticloadbalancing:*:*:targetgroup/*/*',
              'arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*',
              'arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*',
            ],
            conditions: {
              StringEquals: {
                'elasticloadbalancing:CreateAction': [
                  'CreateTargetGroup',
                  'CreateLoadBalancer',
                ],
              },
              Null: {
                'aws:RequestTag/elbv2.k8s.aws/cluster': 'false',
              },
            },
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'elasticloadbalancing:RegisterTargets',
              'elasticloadbalancing:DeregisterTargets',
            ],
            resources: ['arn:aws:elasticloadbalancing:*:*:targetgroup/*/*'],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'elasticloadbalancing:SetWebAcl',
              'elasticloadbalancing:ModifyListener',
              'elasticloadbalancing:AddListenerCertificates',
              'elasticloadbalancing:RemoveListenerCertificates',
              'elasticloadbalancing:ModifyRule',
            ],
            resources: ['*'],
          }),
        ],
      }
    );

    albPolicy.attachToRole(albControllerRole);

    // Apply tags to ALB policy
    cdk.Tags.of(albPolicy).add('Environment', commonTags.Environment);
    cdk.Tags.of(albPolicy).add('ManagedBy', commonTags.ManagedBy);

    // 10. CloudFormation Outputs
    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'EKS Cluster Name',
      exportName: `eks-cluster-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: cluster.clusterEndpoint,
      description: 'EKS Cluster Endpoint',
      exportName: `eks-cluster-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OidcProviderArn', {
      value: cluster.openIdConnectProvider.openIdConnectProviderArn,
      description: 'OIDC Provider ARN',
      exportName: `eks-oidc-provider-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KubectlConfigCommand', {
      value: `aws eks update-kubeconfig --region ${this.region} --name ${cluster.clusterName}`,
      description: 'Command to update kubeconfig',
      exportName: `eks-kubectl-command-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `eks-vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'NodeGroupName', {
      value: nodeGroup.nodegroupName,
      description: 'Managed Node Group Name',
      exportName: `eks-nodegroup-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EbsCsiRoleArn', {
      value: ebsCsiRole.roleArn,
      description: 'EBS CSI Driver IAM Role ARN',
      exportName: `eks-ebs-csi-role-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlbControllerRoleArn', {
      value: albControllerRole.roleArn,
      description: 'AWS Load Balancer Controller IAM Role ARN',
      exportName: `eks-alb-controller-role-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterSecurityGroupId', {
      value: cluster.clusterSecurityGroupId,
      description: 'EKS Cluster Security Group ID',
      exportName: `eks-cluster-sg-id-${environmentSuffix}`,
    });
  }
}
