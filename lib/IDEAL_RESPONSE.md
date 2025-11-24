# Ideal Response - EKS Cluster Implementation

This document contains the Pulumi TypeScript implementation for deploying an Amazon EKS cluster control plane with core networking and security configurations.

## Overview

This implementation creates an EKS cluster control plane infrastructure with:
- **EKS 1.29** cluster with private endpoint access
- KMS encryption for secrets with automatic key rotation
- VPC with public and private subnets across 3 availability zones
- NAT Gateways for secure outbound connectivity
- IAM roles configured for EKS cluster and node groups
- OIDC provider for IRSA (IAM Roles for Service Accounts)
- EKS managed add-ons (CoreDNS, kube-proxy, vpc-cni)
- CloudWatch Log Group for control plane logs

## Key Features

1. **EKS Version**: EKS 1.29 cluster
2. **Add-on Versions**: CoreDNS v1.11.1, kube-proxy v1.29.0, vpc-cni v1.16.0
3. **Security**: KMS encryption, private endpoint access, OIDC provider for IRSA
4. **Networking**: VPC with 3 AZs, NAT Gateways, public and private subnets
5. **Observability**: CloudWatch Log Group for EKS control plane logs

## File: Pulumi.yaml

```yaml
name: tap
runtime: nodejs
description: EKS cluster control plane with core networking
```

## File: index.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as k8s from '@pulumi/kubernetes';

// Get stack configuration
const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || pulumi.getStack();
const awsConfig = new pulumi.Config('aws');
const region = awsConfig.get('region') || 'us-east-1';

// Common tags for all resources
const commonTags = {
  Environment: 'production',
  ManagedBy: 'pulumi',
  CostCenter: 'engineering',
  Project: `eks-cluster-${environmentSuffix}`,
};

// Create KMS key for EKS secrets encryption with automatic rotation
const eksKmsKey = new aws.kms.Key(`eks-secrets-key-${environmentSuffix}`, {
  description: `KMS key for EKS cluster secrets encryption - ${environmentSuffix}`,
  enableKeyRotation: true,
  deletionWindowInDays: 7,
  tags: commonTags,
});

const eksKmsKeyAlias = new aws.kms.Alias(
  `eks-secrets-key-alias-${environmentSuffix}`,
  {
    name: `alias/eks-secrets-${environmentSuffix}`,
    targetKeyId: eksKmsKey.id,
  }
);

// Create VPC with public and private subnets across 3 AZs
const vpc = new aws.ec2.Vpc(`eks-vpc-${environmentSuffix}`, {
  cidrBlock: '10.0.0.0/16',
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    ...commonTags,
    Name: `eks-vpc-${environmentSuffix}`,
  },
});

// Create Internet Gateway
const internetGateway = new aws.ec2.InternetGateway(
  `eks-igw-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    tags: {
      ...commonTags,
      Name: `eks-igw-${environmentSuffix}`,
    },
  }
);

// Get available AZs
const availableAZs = aws.getAvailabilityZones({
  state: 'available',
});

// Create public subnets
const publicSubnets: aws.ec2.Subnet[] = [];
const publicSubnetCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];

for (let i = 0; i < 3; i++) {
  const az = availableAZs.then(azs => azs.names[i]);
  const publicSubnet = new aws.ec2.Subnet(
    `eks-public-subnet-${i}-${environmentSuffix}`,
    {
      vpcId: vpc.id,
      cidrBlock: publicSubnetCidrs[i],
      availabilityZone: az,
      mapPublicIpOnLaunch: true,
      tags: {
        ...commonTags,
        Name: `eks-public-subnet-${i}-${environmentSuffix}`,
        'kubernetes.io/role/elb': '1',
      },
    }
  );
  publicSubnets.push(publicSubnet);
}

// Create private subnets
const privateSubnets: aws.ec2.Subnet[] = [];
const privateSubnetCidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'];

for (let i = 0; i < 3; i++) {
  const az = availableAZs.then(azs => azs.names[i]);
  const privateSubnet = new aws.ec2.Subnet(
    `eks-private-subnet-${i}-${environmentSuffix}`,
    {
      vpcId: vpc.id,
      cidrBlock: privateSubnetCidrs[i],
      availabilityZone: az,
      tags: {
        ...commonTags,
        Name: `eks-private-subnet-${i}-${environmentSuffix}`,
        'kubernetes.io/role/internal-elb': '1',
      },
    }
  );
  privateSubnets.push(privateSubnet);
}

// Create Elastic IPs for NAT Gateways
const natEips: aws.ec2.Eip[] = [];
for (let i = 0; i < 3; i++) {
  const eip = new aws.ec2.Eip(`eks-nat-eip-${i}-${environmentSuffix}`, {
    domain: 'vpc',
    tags: {
      ...commonTags,
      Name: `eks-nat-eip-${i}-${environmentSuffix}`,
    },
  });
  natEips.push(eip);
}

// Create NAT Gateways
const natGateways: aws.ec2.NatGateway[] = [];
for (let i = 0; i < 3; i++) {
  const natGateway = new aws.ec2.NatGateway(
    `eks-nat-gateway-${i}-${environmentSuffix}`,
    {
      allocationId: natEips[i].id,
      subnetId: publicSubnets[i].id,
      tags: {
        ...commonTags,
        Name: `eks-nat-gateway-${i}-${environmentSuffix}`,
      },
    }
  );
  natGateways.push(natGateway);
}

// Create public route table
const publicRouteTable = new aws.ec2.RouteTable(
  `eks-public-rt-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    tags: {
      ...commonTags,
      Name: `eks-public-rt-${environmentSuffix}`,
    },
  }
);

const publicRoute = new aws.ec2.Route(`eks-public-route-${environmentSuffix}`, {
  routeTableId: publicRouteTable.id,
  destinationCidrBlock: '0.0.0.0/0',
  gatewayId: internetGateway.id,
});

// Associate public subnets with public route table
publicSubnets.forEach((subnet, i) => {
  new aws.ec2.RouteTableAssociation(
    `eks-public-rta-${i}-${environmentSuffix}`,
    {
      subnetId: subnet.id,
      routeTableId: publicRouteTable.id,
    }
  );
});

// Create private route tables and associate with NAT gateways
privateSubnets.forEach((subnet, i) => {
  const privateRouteTable = new aws.ec2.RouteTable(
    `eks-private-rt-${i}-${environmentSuffix}`,
    {
      vpcId: vpc.id,
      tags: {
        ...commonTags,
        Name: `eks-private-rt-${i}-${environmentSuffix}`,
      },
    }
  );

  new aws.ec2.Route(`eks-private-route-${i}-${environmentSuffix}`, {
    routeTableId: privateRouteTable.id,
    destinationCidrBlock: '0.0.0.0/0',
    natGatewayId: natGateways[i].id,
  });

  new aws.ec2.RouteTableAssociation(
    `eks-private-rta-${i}-${environmentSuffix}`,
    {
      subnetId: subnet.id,
      routeTableId: privateRouteTable.id,
    }
  );
});

// Create CloudWatch Log Group for EKS control plane logs
const eksLogGroup = new aws.cloudwatch.LogGroup(
  `eks-cluster-logs-${environmentSuffix}`,
  {
    name: `/aws/eks/cluster-${environmentSuffix}/logs`,
    retentionInDays: 30,
    tags: commonTags,
  }
);

// Create IAM role for EKS cluster
const eksClusterRole = new aws.iam.Role(
  `eks-cluster-role-${environmentSuffix}`,
  {
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
    tags: commonTags,
  }
);

new aws.iam.RolePolicyAttachment(`eks-cluster-policy-${environmentSuffix}`, {
  role: eksClusterRole.name,
  policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
});

new aws.iam.RolePolicyAttachment(
  `eks-vpc-resource-controller-${environmentSuffix}`,
  {
    role: eksClusterRole.name,
    policyArn: 'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController',
  }
);

// Create IAM role for node groups with SSM access
const nodeGroupRole = new aws.iam.Role(
  `eks-nodegroup-role-${environmentSuffix}`,
  {
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
    tags: commonTags,
  }
);

new aws.iam.RolePolicyAttachment(
  `eks-worker-node-policy-${environmentSuffix}`,
  {
    role: nodeGroupRole.name,
    policyArn: 'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
  }
);

new aws.iam.RolePolicyAttachment(`eks-cni-policy-${environmentSuffix}`, {
  role: nodeGroupRole.name,
  policyArn: 'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
});

new aws.iam.RolePolicyAttachment(
  `eks-container-registry-policy-${environmentSuffix}`,
  {
    role: nodeGroupRole.name,
    policyArn: 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
  }
);

// Attach SSM managed instance core policy for Session Manager
new aws.iam.RolePolicyAttachment(
  `eks-ssm-managed-instance-core-${environmentSuffix}`,
  {
    role: nodeGroupRole.name,
    policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
  }
);

// Attach CloudWatch Container Insights policy
new aws.iam.RolePolicyAttachment(
  `eks-cloudwatch-container-insights-${environmentSuffix}`,
  {
    role: nodeGroupRole.name,
    policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
  }
);

// Create security group for EKS cluster
const clusterSecurityGroup = new aws.ec2.SecurityGroup(
  `eks-cluster-sg-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    description: 'Security group for EKS cluster',
    tags: {
      ...commonTags,
      Name: `eks-cluster-sg-${environmentSuffix}`,
    },
  }
);

// Create EKS cluster with version 1.29 (CORRECTED FROM 1.28)
const eksCluster = new aws.eks.Cluster(
  `eks-cluster-${environmentSuffix}`,
  {
    name: `eks-cluster-${environmentSuffix}`,
    version: '1.29', // CORRECTED: Was 1.28, must be 1.29+ for current AWS provider
    roleArn: eksClusterRole.arn,
    vpcConfig: {
      subnetIds: privateSubnets.map(s => s.id),
      endpointPrivateAccess: true,
      endpointPublicAccess: false,
      securityGroupIds: [clusterSecurityGroup.id],
    },
    enabledClusterLogTypes: [
      'api',
      'audit',
      'authenticator',
      'controllerManager',
      'scheduler',
    ],
    encryptionConfig: {
      provider: {
        keyArn: eksKmsKey.arn,
      },
      resources: ['secrets'],
    },
    tags: commonTags,
  },
  { dependsOn: [eksLogGroup] }
);

// Create OIDC provider for IRSA
const oidcProvider = new aws.iam.OpenIdConnectProvider(
  `eks-oidc-provider-${environmentSuffix}`,
  {
    url: eksCluster.identities[0].oidcs[0].issuer,
    clientIdLists: ['sts.amazonaws.com'],
    thumbprintLists: ['9e99a48a9960b14926bb7f3b02e22da2b0ab7280'], // Root CA thumbprint for EKS
    tags: commonTags,
  }
);

// Install EKS add-ons
const coreDnsAddon = new aws.eks.Addon(
  `coredns-addon-${environmentSuffix}`,
  {
    clusterName: eksCluster.name,
    addonName: 'coredns',
    addonVersion: 'v1.11.1-eksbuild.4',
    resolveConflictsOnCreate: 'OVERWRITE',
    resolveConflictsOnUpdate: 'OVERWRITE',
    tags: commonTags,
  }
);

const kubeProxyAddon = new aws.eks.Addon(
  `kube-proxy-addon-${environmentSuffix}`,
  {
    clusterName: eksCluster.name,
    addonName: 'kube-proxy',
    addonVersion: 'v1.29.0-eksbuild.1',
    resolveConflictsOnCreate: 'OVERWRITE',
    resolveConflictsOnUpdate: 'OVERWRITE',
    tags: commonTags,
  }
);

const vpcCniAddon = new aws.eks.Addon(
  `vpc-cni-addon-${environmentSuffix}`,
  {
    clusterName: eksCluster.name,
    addonName: 'vpc-cni',
    addonVersion: 'v1.16.0-eksbuild.1',
    resolveConflictsOnCreate: 'OVERWRITE',
    resolveConflictsOnUpdate: 'OVERWRITE',
    tags: commonTags,
  }
);


// Export cluster information
export const clusterName = eksCluster.name;
export const clusterEndpoint = eksCluster.endpoint;
export const clusterVersion = eksCluster.version;
export const oidcIssuerUrl = eksCluster.identities[0].oidcs[0].issuer;
export const kmsKeyId = eksKmsKey.id;
export const kmsKeyArn = eksKmsKey.arn;
export const vpcId = vpc.id;
export const privateSubnetIds = privateSubnets.map(s => s.id);
export const publicSubnetIds = publicSubnets.map(s => s.id);
```

## Summary

This implementation provides:

1. **EKS Control Plane**: Version 1.29 with private endpoint access and KMS encryption
2. **Add-on Version Updates**: CoreDNS v1.11.1, kube-proxy v1.29.0, vpc-cni v1.16.0
3. **Core Networking**: VPC with public and private subnets, NAT Gateways, Internet Gateway
4. **Security**: KMS encryption with automatic key rotation, OIDC provider for IRSA
5. **IAM Roles**: Configured for EKS cluster and node groups with necessary policies
6. **Observability**: CloudWatch Log Group for EKS control plane logs

This implementation focuses on the EKS control plane and core infrastructure without NodeGroup or Kubernetes workloads, providing a stable foundation for future expansion.
