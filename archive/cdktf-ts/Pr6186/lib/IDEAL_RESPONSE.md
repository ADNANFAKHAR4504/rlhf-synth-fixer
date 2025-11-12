# Production-Ready EKS Cluster - Implementation Documentation

This document provides comprehensive documentation for a production-ready Amazon EKS (Elastic Kubernetes Service) cluster deployed using CDKTF (Cloud Development Kit for Terraform) with TypeScript.

## Architecture Overview

This solution implements a highly available, scalable Kubernetes cluster on AWS with the following components:

- **VPC Infrastructure**: Multi-AZ VPC with dedicated public and private subnets across 3 availability zones
- **EKS Cluster**: Kubernetes 1.28 cluster with control plane logging and OIDC provider for IRSA
- **Node Groups**: Separate node groups for general workloads (t3.medium/large) and GPU workloads (g4dn.xlarge)
- **Managed Add-ons**: AWS-managed vpc-cni, kube-proxy, and coredns
- **Security**: Properly configured security groups, IAM roles with least privilege
- **IRSA Support**: IAM Roles for Service Accounts with example S3 access role

## Key Features

1. **High Availability**: Resources distributed across 3 availability zones
2. **Auto-Scaling**: Node groups configured with cluster autoscaler tags
3. **Network Isolation**: Worker nodes in private subnets with NAT gateway egress
4. **Control Plane Logging**: Audit, authenticator, and controller manager logs to CloudWatch
5. **IRSA (IAM Roles for Service Accounts)**: Secure, scoped AWS access for Kubernetes workloads
6. **GPU Support**: Dedicated node group for machine learning and GPU-intensive workloads

## Implementation Files

### lib/tap-stack.ts

Main orchestration stack that configures the AWS provider, S3 backend for state management, and instantiates VPC and EKS cluster stacks.

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';
import { EksClusterStack } from './eks-cluster-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

const AWS_REGION_OVERRIDE = 'us-east-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // Create VPC Infrastructure
    const vpcStack = new VpcStack(this, 'vpc-stack', {
      environmentSuffix,
      region: awsRegion,
    });

    // Create EKS Cluster
    const eksStack = new EksClusterStack(this, 'eks-cluster-stack', {
      environmentSuffix,
      vpcId: vpcStack.vpc.id,
      privateSubnetIds: vpcStack.privateSubnetIds,
      region: awsRegion,
    });

    // Outputs
    new TerraformOutput(this, 'cluster-endpoint', {
      value: eksStack.clusterEndpoint,
      description: 'EKS cluster endpoint URL',
    });

    new TerraformOutput(this, 'cluster-certificate-authority', {
      value: eksStack.clusterCertificateAuthority,
      description: 'EKS cluster certificate authority data',
      sensitive: true,
    });

    new TerraformOutput(this, 'oidc-provider-url', {
      value: eksStack.oidcProviderUrl,
      description: 'OIDC provider URL for IRSA',
    });

    new TerraformOutput(this, 'cluster-name', {
      value: eksStack.cluster.name,
      description: 'EKS cluster name',
    });

    new TerraformOutput(this, 'region', {
      value: awsRegion,
      description: 'AWS region',
    });

    new TerraformOutput(this, 'vpc-id', {
      value: vpcStack.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'kubectl-config-command', {
      value: `aws eks update-kubeconfig --region ${awsRegion} --name eks-cluster-${environmentSuffix}`,
      description: 'Command to configure kubectl',
    });
  }
}
```

**Key Configuration Points:**

- **S3 Backend**: Terraform state stored in S3 with encryption enabled
- **AWS Provider**: Configured with region override (us-east-2) and optional default tags
- **Environment Suffix**: Supports multiple environments (dev, staging, prod) via suffix
- **Outputs**: Exports cluster endpoint, certificate authority, OIDC provider URL, and kubectl config command

### lib/vpc-stack.ts

VPC infrastructure with public and private subnets across 3 availability zones, NAT gateways for private subnet egress, and proper Kubernetes ELB tags.

```typescript
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route } from '@cdktf/provider-aws/lib/route';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

interface VpcStackProps {
  environmentSuffix: string;
  region: string;
}

export class VpcStack extends Construct {
  public readonly vpc: Vpc;
  public readonly privateSubnetIds: string[];
  public readonly publicSubnetIds: string[];

  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Get available AZs
    const azs = new DataAwsAvailabilityZones(this, 'available-azs', {
      state: 'available',
    });

    // VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `eks-vpc-${environmentSuffix}`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `eks-igw-${environmentSuffix}`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
      },
    });

    // Public Subnets
    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];
    const natGateways: NatGateway[] = [];

    for (let i = 0; i < 3; i++) {
      // Public Subnet
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `eks-public-subnet-${i}-${environmentSuffix}`,
          Environment: 'production',
          Team: 'platform',
          CostCenter: 'engineering',
          'kubernetes.io/role/elb': '1',
        },
      });
      publicSubnets.push(publicSubnet);

      // Elastic IP for NAT Gateway
      const eip = new Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          Name: `eks-nat-eip-${i}-${environmentSuffix}`,
          Environment: 'production',
          Team: 'platform',
          CostCenter: 'engineering',
        },
      });

      // NAT Gateway
      const natGw = new NatGateway(this, `nat-gateway-${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          Name: `eks-nat-gateway-${i}-${environmentSuffix}`,
          Environment: 'production',
          Team: 'platform',
          CostCenter: 'engineering',
        },
        dependsOn: [igw],
      });
      natGateways.push(natGw);

      // Private Subnet
      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        tags: {
          Name: `eks-private-subnet-${i}-${environmentSuffix}`,
          Environment: 'production',
          Team: 'platform',
          CostCenter: 'engineering',
          'kubernetes.io/role/internal-elb': '1',
        },
      });
      privateSubnets.push(privateSubnet);
    }

    // Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      tags: {
        Name: `eks-public-rt-${environmentSuffix}`,
        Environment: 'production',
        Team: 'platform',
        CostCenter: 'engineering',
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `public-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Private Route Tables (one per AZ)
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new RouteTable(
        this,
        `private-route-table-${i}`,
        {
          vpcId: this.vpc.id,
          tags: {
            Name: `eks-private-rt-${i}-${environmentSuffix}`,
            Environment: 'production',
            Team: 'platform',
            CostCenter: 'engineering',
          },
        }
      );

      new Route(this, `private-route-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[i].id,
      });

      new RouteTableAssociation(this, `private-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    this.privateSubnetIds = privateSubnets.map(subnet => subnet.id);
    this.publicSubnetIds = publicSubnets.map(subnet => subnet.id);
  }
}
```

**Network Architecture:**

- **VPC CIDR**: 10.0.0.0/16
- **Public Subnets**: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24 (for ALB/NLB, NAT gateways)
- **Private Subnets**: 10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24 (for EKS worker nodes)
- **NAT Gateways**: One per AZ for high availability
- **Kubernetes Tags**: Proper ELB tags for automatic load balancer subnet discovery

### lib/eks-cluster-stack.ts

Complete EKS cluster with control plane, node groups, add-ons, security groups, IAM roles, and IRSA configuration.

```typescript
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
```

**EKS Components:**

- **Cluster Version**: Kubernetes 1.28
- **Control Plane Logging**: Audit, authenticator, and controller manager logs
- **Node Groups**:
  - General: 2-10 nodes (t3.medium, t3.large) for standard workloads
  - GPU: 0-3 nodes (g4dn.xlarge) for ML/AI workloads
- **Managed Add-ons**:
  - vpc-cni v1.16.0 for pod networking
  - kube-proxy v1.28.2 for network proxy
  - coredns v1.10.1 for DNS resolution
- **IRSA**: OIDC provider configured with example S3 access role for service accounts

## Deployment Instructions

### Prerequisites

```bash
# Install Node.js dependencies
npm install

# Install CDKTF CLI globally
npm install -g cdktf-cli

# Configure AWS credentials
aws configure
```

### Environment Configuration

Set the environment suffix to distinguish between deployments:

```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-2
```

### Deployment Commands

```bash
# Synthesize Terraform configuration
npm run build
cdktf synth

# Deploy the infrastructure
cdktf deploy

# View outputs
cdktf output

# Destroy the infrastructure
cdktf destroy
```

### Configure kubectl

After deployment, configure kubectl to access the cluster:

```bash
aws eks update-kubeconfig --region us-east-2 --name eks-cluster-${ENVIRONMENT_SUFFIX}
```

Verify cluster access:

```bash
kubectl get nodes
kubectl get pods --all-namespaces
```

## Resource Naming Convention

All resources follow the pattern: `<resource-type>-<descriptor>-${environmentSuffix}`

Examples:
- VPC: `eks-vpc-dev`
- Cluster: `eks-cluster-dev`
- Node Groups: `general-node-group-dev`, `gpu-node-group-dev`
- IAM Roles: `eks-cluster-role-dev`, `eks-node-role-dev`
- Security Groups: `eks-cluster-sg-dev`, `eks-node-sg-dev`

## Security Configuration

### Network Security

- Worker nodes deployed in private subnets with no direct internet access
- NAT gateways provide secure egress for worker nodes
- Security groups enforce least-privilege network access:
  - Cluster → Nodes: Port 443 (HTTPS), Port 10250 (kubelet)
  - Nodes → Cluster: Port 443 (API server)
  - Nodes ↔ Nodes: All ports (pod-to-pod communication)

### IAM Security

- **Cluster Role**: AmazonEKSClusterPolicy, AmazonEKSVPCResourceController
- **Node Role**: AmazonEKSWorkerNodePolicy, AmazonEKS_CNI_Policy, AmazonEC2ContainerRegistryReadOnly
- **IRSA**: Scoped IAM roles for Kubernetes service accounts via OIDC federation

### Control Plane Security

- Control plane endpoint accessible both publicly and privately
- API server audit logging enabled to CloudWatch
- Certificate authority managed by AWS

## IRSA (IAM Roles for Service Accounts) Setup

The infrastructure includes a preconfigured OIDC provider for IRSA. Example S3 access role included:

### Kubernetes Service Account

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: s3-access-sa
  namespace: default
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT_ID:role/s3-access-irsa-role-${ENVIRONMENT_SUFFIX}
```

### Pod Specification

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: s3-access-pod
  namespace: default
spec:
  serviceAccountName: s3-access-sa
  containers:
  - name: app
    image: amazon/aws-cli
    command: ['aws', 's3', 'ls']
```

## Node Group Configuration

### General Node Group

- **Instance Types**: t3.medium (2 vCPU, 4 GiB RAM), t3.large (2 vCPU, 8 GiB RAM)
- **Scaling**: 2 minimum, 10 maximum, 2 desired
- **Use Case**: General-purpose workloads, web applications, microservices

### GPU Node Group

- **Instance Types**: g4dn.xlarge (4 vCPU, 16 GiB RAM, 1 NVIDIA T4 GPU)
- **Scaling**: 0 minimum, 3 maximum, 0 desired (scales on demand)
- **Use Case**: Machine learning training/inference, video processing, GPU-accelerated workloads

Both node groups are tagged for Kubernetes Cluster Autoscaler integration.

## Monitoring and Logging

### Control Plane Logs

EKS control plane logs are sent to CloudWatch Logs:
- Log Group: `/aws/eks/eks-cluster-${environmentSuffix}/cluster`
- Retention: 7 days
- Log Types: audit, authenticator, controllerManager

### Container Logs

Deploy Fluent Bit or CloudWatch Container Insights for pod-level logging.

### Metrics

EKS integrates with CloudWatch Container Insights for cluster and pod metrics.

## Cost Optimization

### Estimated Monthly Costs (us-east-2)

- **EKS Control Plane**: $73/month
- **NAT Gateways (3)**: ~$97/month ($32.40/gateway)
- **General Node Group**:
  - Minimum (2 × t3.medium): ~$60/month
  - Maximum (10 × t3.large): ~$730/month
- **GPU Node Group**:
  - Per g4dn.xlarge: ~$526/month
  - Maximum (3 nodes): ~$1,578/month
- **CloudWatch Logs**: <$5/month (7-day retention)

**Total Range**: ~$235/month (minimum) to ~$2,483/month (maximum scale)

### Cost Optimization Strategies

1. **Right-size node groups** based on actual workload requirements
2. **Use Cluster Autoscaler** to scale nodes based on demand
3. **Consider Spot Instances** for fault-tolerant workloads (change capacityType)
4. **Reduce NAT gateways** to 1 for dev/test environments
5. **Adjust log retention** periods based on compliance requirements

## High Availability

- Resources distributed across 3 availability zones
- NAT gateways in each AZ for redundant egress
- Multi-AZ node group placement
- EKS control plane automatically distributed across multiple AZs

## Scalability

- **Horizontal Pod Autoscaler (HPA)**: Scale pods based on CPU/memory
- **Cluster Autoscaler**: Automatically adjust node count based on pending pods
- **Node Group Scaling**: Configure min/max capacity per workload type
- **Vertical Pod Autoscaler (VPA)**: Automatically adjust pod resource requests

## Troubleshooting

### Common Issues

**Nodes not joining cluster:**
- Verify security group rules allow cluster-to-node communication
- Check IAM role policies attached to node role
- Inspect CloudWatch logs for control plane errors

**Pods cannot pull images:**
- Verify NAT gateway routes for private subnets
- Check node IAM role has ECR read permissions
- Ensure nodes have internet connectivity

**IRSA not working:**
- Verify OIDC provider thumbprint is correct
- Check service account annotations match IAM role ARN
- Confirm trust policy conditions in IAM role

### Useful Commands

```bash
# View cluster status
aws eks describe-cluster --name eks-cluster-${ENVIRONMENT_SUFFIX} --region us-east-2

# Check node group status
aws eks describe-nodegroup --cluster-name eks-cluster-${ENVIRONMENT_SUFFIX} \
  --nodegroup-name general-node-group-${ENVIRONMENT_SUFFIX} --region us-east-2

# View control plane logs
aws logs tail /aws/eks/eks-cluster-${ENVIRONMENT_SUFFIX}/cluster --follow

# Get cluster authentication token
aws eks get-token --cluster-name eks-cluster-${ENVIRONMENT_SUFFIX} --region us-east-2
```

## Production Readiness Checklist

- ✅ Multi-AZ deployment for high availability
- ✅ Private subnets for worker nodes
- ✅ NAT gateways for secure egress
- ✅ Security groups with least-privilege access
- ✅ IAM roles with minimal required permissions
- ✅ Control plane logging enabled
- ✅ OIDC provider for IRSA configured
- ✅ Managed add-ons for networking and DNS
- ✅ Node groups with auto-scaling capability
- ✅ GPU node group for specialized workloads
- ✅ Proper resource tagging for cost allocation
- ✅ S3 backend for state management with encryption

## Next Steps

1. **Deploy monitoring**: Install Prometheus/Grafana or enable CloudWatch Container Insights
2. **Configure autoscaling**: Deploy Cluster Autoscaler and configure HPA
3. **Set up ingress**: Install AWS Load Balancer Controller for Ingress resources
4. **Implement GitOps**: Deploy ArgoCD or Flux for continuous delivery
5. **Enable service mesh**: Consider Istio or AWS App Mesh for advanced networking
6. **Configure backup**: Set up Velero for cluster backup and disaster recovery
