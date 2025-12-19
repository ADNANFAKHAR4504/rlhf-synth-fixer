import { Construct } from 'constructs';
import { EksCluster } from '@cdktf/provider-aws/lib/eks-cluster';
import { EksNodeGroup } from '@cdktf/provider-aws/lib/eks-node-group';
import { EksAddon } from '@cdktf/provider-aws/lib/eks-addon';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamOpenidConnectProvider } from '@cdktf/provider-aws/lib/iam-openid-connect-provider';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { DataAwsPartition } from '@cdktf/provider-aws/lib/data-aws-partition';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';

interface EksClusterStackProps {
  environmentSuffix: string;
  vpcId: string;
  privateSubnetIds: string[];
  region: string;
}

export class EksClusterStack extends Construct {
  public readonly cluster: EksCluster;
  public readonly clusterSecurityGroup: SecurityGroup;
  public readonly nodeSecurityGroup: SecurityGroup;
  public readonly oidcProvider: IamOpenidConnectProvider;
  public readonly clusterEndpoint: string;
  public readonly clusterCertificateAuthority: string;
  public readonly oidcProviderUrl: string;

  constructor(scope: Construct, id: string, props: EksClusterStackProps) {
    super(scope, id);

    const { environmentSuffix, vpcId, privateSubnetIds } = props;

    // Data sources
    const partition = new DataAwsPartition(this, 'partition', {});

    // CloudWatch Log Group for EKS control plane logs
    const logGroup = new CloudwatchLogGroup(this, 'eks-log-group', {
      name: `/aws/eks/eks-cluster-${environmentSuffix}/cluster`,
      retentionInDays: 7,
      tags: {
        Name: `eks-cluster-logs-${environmentSuffix}`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
      },
    });

    // EKS Cluster IAM Role
    const clusterRole = new IamRole(this, 'eks-cluster-role', {
      name: `eks-cluster-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'eks.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `eks-cluster-role-${environmentSuffix}`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
      },
    });

    // Attach required policies to cluster role
    new IamRolePolicyAttachment(this, 'eks-cluster-policy', {
      role: clusterRole.name,
      policyArn: `arn:${partition.partition}:iam::aws:policy/AmazonEKSClusterPolicy`,
    });

    new IamRolePolicyAttachment(this, 'eks-vpc-resource-controller', {
      role: clusterRole.name,
      policyArn: `arn:${partition.partition}:iam::aws:policy/AmazonEKSVPCResourceController`,
    });

    // Security Group for EKS Cluster
    this.clusterSecurityGroup = new SecurityGroup(this, 'eks-cluster-sg', {
      name: `eks-cluster-sg-${environmentSuffix}`,
      description: 'Security group for EKS cluster control plane',
      vpcId: vpcId,
      tags: {
        Name: `eks-cluster-sg-${environmentSuffix}`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
      },
    });

    // Security Group for EKS Nodes
    this.nodeSecurityGroup = new SecurityGroup(this, 'eks-node-sg', {
      name: `eks-node-sg-${environmentSuffix}`,
      description: 'Security group for EKS worker nodes',
      vpcId: vpcId,
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: {
        Name: `eks-node-sg-${environmentSuffix}`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
      },
    });

    // Security Group Rules - Cluster to Nodes
    new SecurityGroupRule(this, 'cluster-to-nodes-443', {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      sourceSecurityGroupId: this.nodeSecurityGroup.id,
      securityGroupId: this.clusterSecurityGroup.id,
      description: 'Allow cluster to communicate with nodes on 443',
    });

    new SecurityGroupRule(this, 'cluster-to-nodes-kubelet', {
      type: 'egress',
      fromPort: 10250,
      toPort: 10250,
      protocol: 'tcp',
      sourceSecurityGroupId: this.nodeSecurityGroup.id,
      securityGroupId: this.clusterSecurityGroup.id,
      description: 'Allow cluster to communicate with kubelet on nodes',
    });

    // Security Group Rules - Nodes to Cluster
    new SecurityGroupRule(this, 'nodes-to-cluster-443', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      sourceSecurityGroupId: this.nodeSecurityGroup.id,
      securityGroupId: this.clusterSecurityGroup.id,
      description: 'Allow nodes to communicate with cluster API',
    });

    // Security Group Rules - Node to Node communication
    new SecurityGroupRule(this, 'nodes-to-nodes-all', {
      type: 'ingress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      sourceSecurityGroupId: this.nodeSecurityGroup.id,
      securityGroupId: this.nodeSecurityGroup.id,
      description: 'Allow nodes to communicate with each other',
    });

    // EKS Cluster
    this.cluster = new EksCluster(this, 'eks-cluster', {
      name: `eks-cluster-${environmentSuffix}`,
      version: '1.28',
      roleArn: clusterRole.arn,
      vpcConfig: {
        subnetIds: privateSubnetIds,
        securityGroupIds: [this.clusterSecurityGroup.id],
        endpointPrivateAccess: true,
        endpointPublicAccess: true,
      },
      enabledClusterLogTypes: ['audit', 'authenticator', 'controllerManager'],
      tags: {
        Name: `eks-cluster-${environmentSuffix}`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
      },
      dependsOn: [logGroup],
    });

    // Extract OIDC issuer URL
    const oidcIssuerUrl = this.cluster.identity.get(0).oidc.get(0).issuer;

    // OIDC Provider for IRSA
    this.oidcProvider = new IamOpenidConnectProvider(this, 'oidc-provider', {
      url: oidcIssuerUrl,
      clientIdList: ['sts.amazonaws.com'],
      thumbprintList: ['9e99a48a9960b14926bb7f3b02e22da2b0ab7280'],
      tags: {
        Name: `eks-oidc-provider-${environmentSuffix}`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
      },
    });

    // Node Group IAM Role
    const nodeRole = new IamRole(this, 'eks-node-role', {
      name: `eks-node-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `eks-node-role-${environmentSuffix}`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
      },
    });

    // Attach required policies to node role
    new IamRolePolicyAttachment(this, 'node-worker-policy', {
      role: nodeRole.name,
      policyArn: `arn:${partition.partition}:iam::aws:policy/AmazonEKSWorkerNodePolicy`,
    });

    new IamRolePolicyAttachment(this, 'node-cni-policy', {
      role: nodeRole.name,
      policyArn: `arn:${partition.partition}:iam::aws:policy/AmazonEKS_CNI_Policy`,
    });

    new IamRolePolicyAttachment(this, 'node-ecr-policy', {
      role: nodeRole.name,
      policyArn: `arn:${partition.partition}:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly`,
    });

    // General workload node group
    const generalNodeGroup = new EksNodeGroup(this, 'general-node-group', {
      clusterName: this.cluster.name,
      nodeGroupName: `general-node-group-${environmentSuffix}`,
      nodeRoleArn: nodeRole.arn,
      subnetIds: privateSubnetIds,
      scalingConfig: {
        minSize: 2,
        maxSize: 10,
        desiredSize: 2,
      },
      instanceTypes: ['t3.medium', 't3.large'],
      capacityType: 'ON_DEMAND',
      updateConfig: {
        maxUnavailable: 1,
      },
      tags: {
        Name: `general-node-group-${environmentSuffix}`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
        'k8s.io/cluster-autoscaler/enabled': 'true',
        [`k8s.io/cluster-autoscaler/eks-cluster-${environmentSuffix}`]: 'owned',
      },
    });

    // GPU workload node group
    new EksNodeGroup(this, 'gpu-node-group', {
      clusterName: this.cluster.name,
      nodeGroupName: `gpu-node-group-${environmentSuffix}`,
      nodeRoleArn: nodeRole.arn,
      subnetIds: privateSubnetIds,
      scalingConfig: {
        minSize: 0,
        maxSize: 3,
        desiredSize: 0,
      },
      instanceTypes: ['g4dn.xlarge'],
      capacityType: 'ON_DEMAND',
      updateConfig: {
        maxUnavailable: 1,
      },
      tags: {
        Name: `gpu-node-group-${environmentSuffix}`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
        'k8s.io/cluster-autoscaler/enabled': 'true',
        [`k8s.io/cluster-autoscaler/eks-cluster-${environmentSuffix}`]: 'owned',
      },
    });

    // EKS Add-ons
    new EksAddon(this, 'vpc-cni-addon', {
      clusterName: this.cluster.name,
      addonName: 'vpc-cni',
      addonVersion: 'v1.16.0-eksbuild.1',
      resolveConflictsOnCreate: 'OVERWRITE',
      resolveConflictsOnUpdate: 'OVERWRITE',
      tags: {
        Name: `vpc-cni-addon-${environmentSuffix}`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
      },
      dependsOn: [generalNodeGroup],
    });

    new EksAddon(this, 'kube-proxy-addon', {
      clusterName: this.cluster.name,
      addonName: 'kube-proxy',
      addonVersion: 'v1.28.2-eksbuild.2',
      resolveConflictsOnCreate: 'OVERWRITE',
      resolveConflictsOnUpdate: 'OVERWRITE',
      tags: {
        Name: `kube-proxy-addon-${environmentSuffix}`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
      },
      dependsOn: [generalNodeGroup],
    });

    new EksAddon(this, 'coredns-addon', {
      clusterName: this.cluster.name,
      addonName: 'coredns',
      addonVersion: 'v1.10.1-eksbuild.6',
      resolveConflictsOnCreate: 'OVERWRITE',
      resolveConflictsOnUpdate: 'OVERWRITE',
      tags: {
        Name: `coredns-addon-${environmentSuffix}`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
      },
      dependsOn: [generalNodeGroup],
    });

    // IRSA Example - S3 Access Role
    const s3AccessRole = new IamRole(this, 's3-access-irsa-role', {
      name: `s3-access-irsa-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Federated: this.oidcProvider.arn,
            },
            Action: 'sts:AssumeRoleWithWebIdentity',
            Condition: {
              StringEquals: {
                [`${oidcIssuerUrl.replace('https://', '')}:sub`]:
                  'system:serviceaccount:default:s3-access-sa',
                [`${oidcIssuerUrl.replace('https://', '')}:aud`]:
                  'sts.amazonaws.com',
              },
            },
          },
        ],
      }),
      tags: {
        Name: `s3-access-irsa-role-${environmentSuffix}`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
      },
    });

    // S3 Read-Only Policy for IRSA example
    const s3Policy = new IamPolicy(this, 's3-access-policy', {
      name: `s3-access-policy-${environmentSuffix}`,
      description: 'Policy for IRSA S3 access example',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:ListBucket'],
            Resource: ['arn:aws:s3:::*'],
          },
        ],
      }),
      tags: {
        Name: `s3-access-policy-${environmentSuffix}`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
      },
    });

    new IamRolePolicyAttachment(this, 's3-policy-attachment', {
      role: s3AccessRole.name,
      policyArn: s3Policy.arn,
    });

    // Export values
    this.clusterEndpoint = this.cluster.endpoint;
    this.clusterCertificateAuthority =
      this.cluster.certificateAuthority.get(0).data;
    this.oidcProviderUrl = oidcIssuerUrl;
  }
}
