# Production-Ready EKS Cluster Implementation

This implementation provides a complete production-ready Amazon EKS cluster with enhanced security, cost optimization, and high availability features using CDKTF with TypeScript.

## Architecture Overview

The solution includes:
- VPC with public and private subnets across 3 availability zones
- EKS cluster version 1.28 with private endpoint access
- Two managed node groups (general CPU and GPU workloads)
- OIDC provider for IRSA (IAM Roles for Service Accounts)
- EKS managed add-ons (vpc-cni, kube-proxy, coredns)
- CloudWatch logging for control plane audit trails
- Proper security groups and IAM roles

## File: lib/eks-cluster-stack.ts

```typescript
import { Construct } from 'constructs';
import { TerraformStack } from 'cdktf';
import { EksCluster } from '@cdktf/provider-aws/lib/eks-cluster';
import { EksNodeGroup } from '@cdktf/provider-aws/lib/eks-node-group';
import { EksAddon } from '@cdktf/provider-aws/lib/eks-addon';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamOpenidConnectProvider } from '@cdktf/provider-aws/lib/iam-openid-connect-provider';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
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

    const { environmentSuffix, vpcId, privateSubnetIds, region } = props;

    // Data sources
    const caller = new DataAwsCallerIdentity(this, 'caller', {});
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
    const gpuNodeGroup = new EksNodeGroup(this, 'gpu-node-group', {
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
                [`${oidcIssuerUrl.replace('https://', '')}:aud`]: 'sts.amazonaws.com',
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
    this.clusterCertificateAuthority = this.cluster.certificateAuthority.get(0).data;
    this.oidcProviderUrl = oidcIssuerUrl;
  }
}
```

## File: lib/vpc-stack.ts

```typescript
import { Construct } from 'constructs';
import { TerraformStack } from 'cdktf';
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

    const { environmentSuffix, region } = props;

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
      const privateRouteTable = new RouteTable(this, `private-route-table-${i}`, {
        vpcId: this.vpc.id,
        tags: {
          Name: `eks-private-rt-${i}-${environmentSuffix}`,
          Environment: 'production',
          Team: 'platform',
          CostCenter: 'engineering',
        },
      });

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

    this.privateSubnetIds = privateSubnets.map((subnet) => subnet.id);
    this.publicSubnetIds = publicSubnets.map((subnet) => subnet.id);
  }
}
```

## File: lib/tap-stack.ts

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
    this.addOverride('terraform.backend.s3.use_lockfile', true);

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

## File: lib/README.md

```markdown
# Production-Ready EKS Cluster on AWS

This infrastructure code deploys a production-ready Amazon EKS cluster using CDKTF with TypeScript, featuring enhanced security, cost optimization, and high availability.

## Architecture

### Components

- **VPC Infrastructure**: Custom VPC with public and private subnets across 3 availability zones
- **EKS Cluster**: Version 1.28 with private endpoint access and control plane logging
- **Managed Node Groups**:
  - General workload nodes: 2-10 nodes (t3.medium, t3.large)
  - GPU workload nodes: 0-3 nodes (g4dn.xlarge)
- **OIDC Provider**: Configured for IRSA (IAM Roles for Service Accounts)
- **EKS Add-ons**: vpc-cni, kube-proxy, coredns
- **Security**: Proper security groups, IAM roles, and CloudWatch logging

### Network Design

- **VPC CIDR**: 10.0.0.0/16
- **Public Subnets**: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24
- **Private Subnets**: 10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24
- **NAT Gateways**: One per availability zone for high availability
- **Internet Gateway**: For public subnet internet access

## Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate credentials
- CDKTF CLI installed: `npm install -g cdktf-cli`
- Terraform 1.5+
- kubectl installed

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Set the environment suffix for resource naming:

```bash
export ENVIRONMENT_SUFFIX="prod"
```

### 3. Deploy Infrastructure

```bash
# Synthesize Terraform configuration
cdktf synth

# Deploy the stack
cdktf deploy
```

The deployment will create:
- VPC with networking components (10-15 minutes)
- EKS cluster (15-20 minutes)
- Node groups (5-10 minutes)
- OIDC provider and IAM roles
- EKS add-ons

Total deployment time: ~30-40 minutes

### 4. Configure kubectl

After deployment, configure kubectl using the output command:

```bash
aws eks update-kubeconfig --region us-east-2 --name eks-cluster-<environmentSuffix>
```

Verify cluster access:

```bash
kubectl get nodes
kubectl get pods --all-namespaces
```

## IRSA Example - S3 Access

The infrastructure includes an example IRSA configuration for S3 access. To use it:

### 1. Create Service Account

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: s3-access-sa
  namespace: default
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::<account-id>:role/s3-access-irsa-role-<environmentSuffix>
```

Apply the service account:

```bash
kubectl apply -f service-account.yaml
```

### 2. Use in Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: s3-test-pod
  namespace: default
spec:
  serviceAccountName: s3-access-sa
  containers:
  - name: aws-cli
    image: amazon/aws-cli
    command: ["sleep", "3600"]
```

### 3. Verify IRSA

```bash
kubectl exec -it s3-test-pod -- aws sts get-caller-identity
kubectl exec -it s3-test-pod -- aws s3 ls
```

## Cluster Autoscaler

The node groups are tagged for cluster autoscaler support. To deploy cluster autoscaler:

### 1. Create IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "autoscaling:DescribeAutoScalingGroups",
        "autoscaling:DescribeAutoScalingInstances",
        "autoscaling:DescribeLaunchConfigurations",
        "autoscaling:DescribeScalingActivities",
        "autoscaling:DescribeTags",
        "ec2:DescribeInstanceTypes",
        "ec2:DescribeLaunchTemplateVersions"
      ],
      "Resource": ["*"]
    },
    {
      "Effect": "Allow",
      "Action": [
        "autoscaling:SetDesiredCapacity",
        "autoscaling:TerminateInstanceInAutoScalingGroup",
        "ec2:DescribeImages",
        "ec2:GetInstanceTypesFromInstanceRequirements",
        "eks:DescribeNodegroup"
      ],
      "Resource": ["*"]
    }
  ]
}
```

### 2. Deploy Cluster Autoscaler

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml
```

Edit the deployment to set cluster name:

```bash
kubectl -n kube-system edit deployment cluster-autoscaler
```

Add cluster name to container command:
```
--node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/eks-cluster-<environmentSuffix>
```

## Security Features

### Control Plane Logging

Control plane logs are sent to CloudWatch Logs:
- Audit logs: API server audit logs
- Authenticator logs: Authentication attempts
- Controller Manager logs: Controller operations

Access logs:

```bash
aws logs tail /aws/eks/eks-cluster-<environmentSuffix>/cluster --follow
```

### Security Groups

- **Cluster Security Group**: Controls traffic to/from control plane
- **Node Security Group**: Controls traffic to/from worker nodes
- **Rules**:
  - Nodes can communicate with control plane on 443
  - Control plane can communicate with nodes on 443 and 10250
  - Nodes can communicate with each other on all ports

### Network Isolation

- Worker nodes run in private subnets with no direct internet access
- Outbound internet access via NAT gateways
- Load balancers use public subnets

## Cost Optimization

### Strategies Implemented

1. **Mixed Instance Types**: t3.medium and t3.large for general workloads
2. **GPU Auto-Scaling**: GPU nodes scale to zero when not in use
3. **Cluster Autoscaler**: Automatically adjusts node count based on demand
4. **7-Day Log Retention**: CloudWatch logs retained for 7 days

### Cost Estimates (us-east-2)

- **Minimum (2 t3.medium nodes)**: ~$60/month
- **Typical (5 t3.large nodes)**: ~$370/month
- **Maximum (10 t3.large + 3 g4dn.xlarge)**: ~$1,870/month

Additional costs:
- EKS cluster: $0.10/hour (~$73/month)
- NAT gateways: $0.045/hour x 3 (~$97/month)
- CloudWatch logs: Minimal (<$5/month)

## Monitoring

### CloudWatch Logs

Control plane logs are available in CloudWatch:

```bash
aws logs describe-log-streams --log-group-name /aws/eks/eks-cluster-<environmentSuffix>/cluster
```

### Cluster Health

```bash
# Check cluster status
aws eks describe-cluster --name eks-cluster-<environmentSuffix> --region us-east-2

# Check node group status
aws eks describe-nodegroup --cluster-name eks-cluster-<environmentSuffix> --nodegroup-name general-node-group-<environmentSuffix> --region us-east-2

# Check add-ons
aws eks list-addons --cluster-name eks-cluster-<environmentSuffix> --region us-east-2
```

### Kubernetes Monitoring

```bash
# Node status
kubectl get nodes -o wide

# Pod status across all namespaces
kubectl get pods --all-namespaces

# Check system pods
kubectl get pods -n kube-system

# Describe node
kubectl describe node <node-name>
```

## Troubleshooting

### Nodes Not Joining Cluster

Check node IAM role and security groups:

```bash
# Verify node role
aws iam get-role --role-name eks-node-role-<environmentSuffix>

# Verify security group rules
aws ec2 describe-security-groups --group-ids <node-sg-id>
```

### Add-on Issues

Check add-on status:

```bash
aws eks describe-addon --cluster-name eks-cluster-<environmentSuffix> --addon-name vpc-cni --region us-east-2
```

Update add-on if needed:

```bash
aws eks update-addon --cluster-name eks-cluster-<environmentSuffix> --addon-name vpc-cni --resolve-conflicts OVERWRITE --region us-east-2
```

### IRSA Not Working

Verify OIDC provider configuration:

```bash
aws iam list-open-id-connect-providers

# Verify service account annotation
kubectl describe sa s3-access-sa -n default

# Check pod identity
kubectl exec -it <pod-name> -- env | grep AWS
```

## Cleanup

To destroy all resources:

```bash
# Destroy the infrastructure
cdktf destroy

# Confirm destruction
```

**Warning**: This will delete:
- EKS cluster and all workloads
- VPC and networking components
- NAT gateways, internet gateway
- CloudWatch log groups
- IAM roles and policies

Ensure you have backed up any critical data before destroying.

## Outputs

After deployment, the following outputs are available:

- `cluster-endpoint`: EKS cluster API endpoint
- `cluster-certificate-authority`: Certificate authority data (sensitive)
- `oidc-provider-url`: OIDC provider URL for IRSA
- `cluster-name`: Name of the EKS cluster
- `region`: AWS region
- `vpc-id`: VPC identifier
- `kubectl-config-command`: Command to configure kubectl

Access outputs:

```bash
cdktf output
```

## Additional Resources

- [EKS Best Practices Guide](https://aws.github.io/aws-eks-best-practices/)
- [IRSA Documentation](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)
- [Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler)
- [EKS Add-ons](https://docs.aws.amazon.com/eks/latest/userguide/eks-add-ons.html)

## Support

For issues or questions:
1. Check CloudWatch logs for control plane issues
2. Review security group rules
3. Verify IAM roles and policies
4. Check node group status in AWS console
```

## Deployment Instructions

1. Install dependencies: `npm install`
2. Synthesize Terraform: `cdktf synth`
3. Deploy: `cdktf deploy`
4. Configure kubectl: Use the output command
5. Verify: `kubectl get nodes`

## Testing

Unit tests are provided in the test/ directory with comprehensive coverage of all infrastructure components.
