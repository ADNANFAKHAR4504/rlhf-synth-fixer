# Ideal Response - Production-Ready EKS Cluster Implementation

This document contains the corrected and production-ready Pulumi TypeScript implementation for deploying an Amazon EKS cluster with advanced security configurations, addressing all issues found in the MODEL_RESPONSE.

## Overview

This implementation creates a complete production-grade EKS cluster infrastructure with:
- **EKS 1.29** cluster with private endpoint access
- KMS encryption for secrets with automatic key rotation
- VPC with public and private subnets across 3 availability zones
- NAT Gateways for secure outbound connectivity
- Managed node groups with Spot instance support
- IRSA (IAM Roles for Service Accounts) configuration
- EKS managed add-ons (CoreDNS, kube-proxy, vpc-cni)
- Cluster Autoscaler with IRSA permissions
- Pod Security Standards enforcement
- CloudWatch Container Insights
- SSM Session Manager for secure node access

## Key Corrections from MODEL_RESPONSE

1. **EKS Version**: Updated from 1.28 to 1.29 (required by current AWS provider)
2. **Add-on Versions**: Updated to versions compatible with EKS 1.29
3. **Cluster Autoscaler Image**: Updated to v1.29.0 to match cluster version
4. **Pulumi.yaml**: Removed incorrect config section
5. **Resource Exports**: Added exports for all resources to enable testing and verification

## File: Pulumi.yaml

```yaml
name: tap
runtime: nodejs
description: Production-ready EKS cluster with advanced security
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

// Launch template for node groups with EBS encryption
const launchTemplate = new aws.ec2.LaunchTemplate(
  `eks-node-lt-${environmentSuffix}`,
  {
    namePrefix: `eks-node-${environmentSuffix}-`,
    blockDeviceMappings: [
      {
        deviceName: '/dev/xvda',
        ebs: {
          volumeSize: 50,
          volumeType: 'gp3',
          encrypted: 'true',
          kmsKeyId: eksKmsKey.arn,
          deleteOnTermination: 'true',
        },
      },
    ],
    metadataOptions: {
      httpTokens: 'required',
      httpPutResponseHopLimit: 1,
    },
    tagSpecifications: [
      {
        resourceType: 'instance',
        tags: {
          ...commonTags,
          Name: `eks-node-${environmentSuffix}`,
        },
      },
    ],
    tags: commonTags,
  }
);

// Create managed node group with Spot instances
const nodeGroup = new aws.eks.NodeGroup(`eks-nodegroup-${environmentSuffix}`, {
  clusterName: eksCluster.name,
  nodeGroupName: `eks-nodegroup-${environmentSuffix}`,
  nodeRoleArn: nodeGroupRole.arn,
  subnetIds: privateSubnets.map(s => s.id),
  capacityType: 'SPOT',
  instanceTypes: ['t3.medium', 't3.large'],
  scalingConfig: {
    desiredSize: 2,
    maxSize: 10,
    minSize: 1,
  },
  updateConfig: {
    maxUnavailable: 1,
  },
  launchTemplate: {
    id: launchTemplate.id,
    version: launchTemplate.latestVersion.apply(v => v.toString()),
  },
  tags: commonTags,
});

// Create Kubernetes provider using the EKS cluster
const k8sProvider = new k8s.Provider(
  `k8s-provider-${environmentSuffix}`,
  {
    kubeconfig: pulumi
      .all([
        eksCluster.name,
        eksCluster.endpoint,
        eksCluster.certificateAuthority,
      ])
      .apply(([name, endpoint, ca]) => {
        return JSON.stringify({
          apiVersion: 'v1',
          kind: 'Config',
          clusters: [
            {
              cluster: {
                server: endpoint,
                'certificate-authority-data': ca.data,
              },
              name: 'kubernetes',
            },
          ],
          contexts: [
            {
              context: {
                cluster: 'kubernetes',
                user: 'aws',
              },
              name: 'aws',
            },
          ],
          'current-context': 'aws',
          users: [
            {
              name: 'aws',
              user: {
                exec: {
                  apiVersion: 'client.authentication.k8s.io/v1beta1',
                  command: 'aws',
                  args: [
                    'eks',
                    'get-token',
                    '--cluster-name',
                    name,
                    '--region',
                    region,
                  ],
                },
              },
            },
          ],
        });
      }),
  },
  { dependsOn: [nodeGroup] }
);

// Install EKS add-ons (CORRECTED: Updated versions for EKS 1.29)
const coreDnsAddon = new aws.eks.Addon(
  `coredns-addon-${environmentSuffix}`,
  {
    clusterName: eksCluster.name,
    addonName: 'coredns',
    addonVersion: 'v1.11.1-eksbuild.4', // CORRECTED: Was v1.10.1-eksbuild.6
    resolveConflictsOnCreate: 'OVERWRITE',
    resolveConflictsOnUpdate: 'OVERWRITE',
    tags: commonTags,
  },
  { dependsOn: [nodeGroup] }
);

const kubeProxyAddon = new aws.eks.Addon(
  `kube-proxy-addon-${environmentSuffix}`,
  {
    clusterName: eksCluster.name,
    addonName: 'kube-proxy',
    addonVersion: 'v1.29.0-eksbuild.1', // CORRECTED: Was v1.28.1-eksbuild.1
    resolveConflictsOnCreate: 'OVERWRITE',
    resolveConflictsOnUpdate: 'OVERWRITE',
    tags: commonTags,
  },
  { dependsOn: [nodeGroup] }
);

const vpcCniAddon = new aws.eks.Addon(
  `vpc-cni-addon-${environmentSuffix}`,
  {
    clusterName: eksCluster.name,
    addonName: 'vpc-cni',
    addonVersion: 'v1.16.0-eksbuild.1', // CORRECTED: Was v1.14.1-eksbuild.1
    resolveConflictsOnCreate: 'OVERWRITE',
    resolveConflictsOnUpdate: 'OVERWRITE',
    tags: commonTags,
  },
  { dependsOn: [nodeGroup] }
);

// Create IAM role for S3 access service account
const s3ServiceAccountRole = new aws.iam.Role(
  `s3-service-account-role-${environmentSuffix}`,
  {
    assumeRolePolicy: pulumi
      .all([oidcProvider.arn, oidcProvider.url])
      .apply(([arn, url]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Federated: arn,
              },
              Action: 'sts:AssumeRoleWithWebIdentity',
              Condition: {
                StringEquals: {
                  [`${url.replace('https://', '')}:sub`]:
                    'system:serviceaccount:default:s3-access-sa',
                  [`${url.replace('https://', '')}:aud`]: 'sts.amazonaws.com',
                },
              },
            },
          ],
        })
      ),
    tags: commonTags,
  }
);

const s3AccessPolicy = new aws.iam.Policy(
  `s3-access-policy-${environmentSuffix}`,
  {
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
    tags: commonTags,
  }
);

new aws.iam.RolePolicyAttachment(
  `s3-service-account-policy-attachment-${environmentSuffix}`,
  {
    role: s3ServiceAccountRole.name,
    policyArn: s3AccessPolicy.arn,
  }
);

// Create service account for S3 access
const s3ServiceAccount = new k8s.core.v1.ServiceAccount(
  's3-access-sa',
  {
    metadata: {
      name: 's3-access-sa',
      namespace: 'default',
      annotations: {
        'eks.amazonaws.com/role-arn': s3ServiceAccountRole.arn,
      },
    },
  },
  { provider: k8sProvider }
);

// Create IAM role for DynamoDB access service account
const dynamodbServiceAccountRole = new aws.iam.Role(
  `dynamodb-service-account-role-${environmentSuffix}`,
  {
    assumeRolePolicy: pulumi
      .all([oidcProvider.arn, oidcProvider.url])
      .apply(([arn, url]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Federated: arn,
              },
              Action: 'sts:AssumeRoleWithWebIdentity',
              Condition: {
                StringEquals: {
                  [`${url.replace('https://', '')}:sub`]:
                    'system:serviceaccount:default:dynamodb-access-sa',
                  [`${url.replace('https://', '')}:aud`]: 'sts.amazonaws.com',
                },
              },
            },
          ],
        })
      ),
    tags: commonTags,
  }
);

const dynamodbAccessPolicy = new aws.iam.Policy(
  `dynamodb-access-policy-${environmentSuffix}`,
  {
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:Scan'],
          Resource: ['arn:aws:dynamodb:*:*:table/*'],
        },
      ],
    }),
    tags: commonTags,
  }
);

new aws.iam.RolePolicyAttachment(
  `dynamodb-service-account-policy-attachment-${environmentSuffix}`,
  {
    role: dynamodbServiceAccountRole.name,
    policyArn: dynamodbAccessPolicy.arn,
  }
);

// Create service account for DynamoDB access
const dynamodbServiceAccount = new k8s.core.v1.ServiceAccount(
  'dynamodb-access-sa',
  {
    metadata: {
      name: 'dynamodb-access-sa',
      namespace: 'default',
      annotations: {
        'eks.amazonaws.com/role-arn': dynamodbServiceAccountRole.arn,
      },
    },
  },
  { provider: k8sProvider }
);

// Create IAM role for cluster autoscaler
const clusterAutoscalerRole = new aws.iam.Role(
  `cluster-autoscaler-role-${environmentSuffix}`,
  {
    assumeRolePolicy: pulumi
      .all([oidcProvider.arn, oidcProvider.url])
      .apply(([arn, url]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Federated: arn,
              },
              Action: 'sts:AssumeRoleWithWebIdentity',
              Condition: {
                StringEquals: {
                  [`${url.replace('https://', '')}:sub`]:
                    'system:serviceaccount:kube-system:cluster-autoscaler',
                  [`${url.replace('https://', '')}:aud`]: 'sts.amazonaws.com',
                },
              },
            },
          ],
        })
      ),
    tags: commonTags,
  }
);

const clusterAutoscalerPolicy = new aws.iam.Policy(
  `cluster-autoscaler-policy-${environmentSuffix}`,
  {
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'autoscaling:DescribeAutoScalingGroups',
            'autoscaling:DescribeAutoScalingInstances',
            'autoscaling:DescribeLaunchConfigurations',
            'autoscaling:DescribeScalingActivities',
            'autoscaling:DescribeTags',
            'ec2:DescribeImages',
            'ec2:DescribeInstanceTypes',
            'ec2:DescribeLaunchTemplateVersions',
            'ec2:GetInstanceTypesFromInstanceRequirements',
            'eks:DescribeNodegroup',
          ],
          Resource: ['*'],
        },
        {
          Effect: 'Allow',
          Action: [
            'autoscaling:SetDesiredCapacity',
            'autoscaling:TerminateInstanceInAutoScalingGroup',
          ],
          Resource: ['*'],
        },
      ],
    }),
    tags: commonTags,
  }
);

new aws.iam.RolePolicyAttachment(
  `cluster-autoscaler-policy-attachment-${environmentSuffix}`,
  {
    role: clusterAutoscalerRole.name,
    policyArn: clusterAutoscalerPolicy.arn,
  }
);

// Create service account for cluster autoscaler
const clusterAutoscalerServiceAccount = new k8s.core.v1.ServiceAccount(
  'cluster-autoscaler',
  {
    metadata: {
      name: 'cluster-autoscaler',
      namespace: 'kube-system',
      annotations: {
        'eks.amazonaws.com/role-arn': clusterAutoscalerRole.arn,
      },
    },
  },
  { provider: k8sProvider }
);

// Deploy cluster autoscaler (CORRECTED: Updated image to v1.29.0)
const clusterAutoscalerDeployment = new k8s.apps.v1.Deployment(
  'cluster-autoscaler-deployment',
  {
    metadata: {
      name: 'cluster-autoscaler',
      namespace: 'kube-system',
      labels: {
        app: 'cluster-autoscaler',
      },
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: 'cluster-autoscaler',
        },
      },
      template: {
        metadata: {
          labels: {
            app: 'cluster-autoscaler',
          },
        },
        spec: {
          serviceAccountName: 'cluster-autoscaler',
          containers: [
            {
              name: 'cluster-autoscaler',
              image: 'registry.k8s.io/autoscaling/cluster-autoscaler:v1.29.0', // CORRECTED: Was v1.28.2
              command: [
                './cluster-autoscaler',
                '--v=4',
                '--stderrthreshold=info',
                '--cloud-provider=aws',
                '--skip-nodes-with-local-storage=false',
                '--expander=least-waste',
                '--node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/' +
                  `eks-cluster-${environmentSuffix}`,
                '--balance-similar-node-groups',
                '--skip-nodes-with-system-pods=false',
              ],
              resources: {
                limits: {
                  cpu: '100m',
                  memory: '600Mi',
                },
                requests: {
                  cpu: '100m',
                  memory: '600Mi',
                },
              },
              volumeMounts: [
                {
                  name: 'ssl-certs',
                  mountPath: '/etc/ssl/certs/ca-certificates.crt',
                  readOnly: true,
                },
              ],
            },
          ],
          volumes: [
            {
              name: 'ssl-certs',
              hostPath: {
                path: '/etc/ssl/certs/ca-bundle.crt',
              },
            },
          ],
        },
      },
    },
  },
  { provider: k8sProvider, dependsOn: [clusterAutoscalerServiceAccount] }
);

// Configure pod security standards for default namespace
const defaultNamespacePSS = new k8s.core.v1.Namespace(
  'default-with-pss',
  {
    metadata: {
      name: 'default',
      labels: {
        'pod-security.kubernetes.io/enforce': 'restricted',
        'pod-security.kubernetes.io/audit': 'restricted',
        'pod-security.kubernetes.io/warn': 'restricted',
      },
    },
  },
  {
    provider: k8sProvider,
    protect: false,
    retainOnDelete: true,
  }
);

// Deploy CloudWatch Container Insights
const containerInsightsNamespace = new k8s.core.v1.Namespace(
  'amazon-cloudwatch',
  {
    metadata: {
      name: 'amazon-cloudwatch',
      labels: {
        name: 'amazon-cloudwatch',
      },
    },
  },
  { provider: k8sProvider }
);

const containerInsightsServiceAccount = new k8s.core.v1.ServiceAccount(
  'cloudwatch-agent',
  {
    metadata: {
      name: 'cloudwatch-agent',
      namespace: 'amazon-cloudwatch',
    },
  },
  { provider: k8sProvider, dependsOn: [containerInsightsNamespace] }
);

const containerInsightsClusterRole = new k8s.rbac.v1.ClusterRole(
  'cloudwatch-agent-role',
  {
    metadata: {
      name: 'cloudwatch-agent-role',
    },
    rules: [
      {
        apiGroups: [''],
        resources: ['pods', 'nodes', 'endpoints'],
        verbs: ['list', 'watch'],
      },
      {
        apiGroups: ['apps'],
        resources: ['replicasets'],
        verbs: ['list', 'watch'],
      },
      {
        apiGroups: ['batch'],
        resources: ['jobs'],
        verbs: ['list', 'watch'],
      },
      {
        apiGroups: [''],
        resources: ['nodes/proxy'],
        verbs: ['get'],
      },
      {
        apiGroups: [''],
        resources: ['nodes/stats', 'configmaps', 'events'],
        verbs: ['create', 'get', 'update'],
      },
    ],
  },
  { provider: k8sProvider }
);

const containerInsightsClusterRoleBinding = new k8s.rbac.v1.ClusterRoleBinding(
  'cloudwatch-agent-role-binding',
  {
    metadata: {
      name: 'cloudwatch-agent-role-binding',
    },
    subjects: [
      {
        kind: 'ServiceAccount',
        name: 'cloudwatch-agent',
        namespace: 'amazon-cloudwatch',
      },
    ],
    roleRef: {
      kind: 'ClusterRole',
      name: 'cloudwatch-agent-role',
      apiGroup: 'rbac.authorization.k8s.io',
    },
  },
  {
    provider: k8sProvider,
    dependsOn: [containerInsightsServiceAccount, containerInsightsClusterRole],
  }
);

const containerInsightsConfigMap = new k8s.core.v1.ConfigMap(
  'cwagentconfig',
  {
    metadata: {
      name: 'cwagentconfig',
      namespace: 'amazon-cloudwatch',
    },
    data: {
      'cwagentconfig.json': JSON.stringify({
        logs: {
          metrics_collected: {
            kubernetes: {
              cluster_name: `eks-cluster-${environmentSuffix}`,
              metrics_collection_interval: 60,
            },
          },
          force_flush_interval: 5,
        },
      }),
    },
  },
  { provider: k8sProvider, dependsOn: [containerInsightsNamespace] }
);

const containerInsightsDaemonSet = new k8s.apps.v1.DaemonSet(
  'cloudwatch-agent',
  {
    metadata: {
      name: 'cloudwatch-agent',
      namespace: 'amazon-cloudwatch',
    },
    spec: {
      selector: {
        matchLabels: {
          name: 'cloudwatch-agent',
        },
      },
      template: {
        metadata: {
          labels: {
            name: 'cloudwatch-agent',
          },
        },
        spec: {
          serviceAccountName: 'cloudwatch-agent',
          containers: [
            {
              name: 'cloudwatch-agent',
              image: 'amazon/cloudwatch-agent:latest',
              env: [
                {
                  name: 'HOST_IP',
                  valueFrom: {
                    fieldRef: {
                      fieldPath: 'status.hostIP',
                    },
                  },
                },
                {
                  name: 'HOST_NAME',
                  valueFrom: {
                    fieldRef: {
                      fieldPath: 'spec.nodeName',
                    },
                  },
                },
                {
                  name: 'K8S_NAMESPACE',
                  valueFrom: {
                    fieldRef: {
                      fieldPath: 'metadata.namespace',
                    },
                  },
                },
              ],
              resources: {
                limits: {
                  cpu: '200m',
                  memory: '200Mi',
                },
                requests: {
                  cpu: '200m',
                  memory: '200Mi',
                },
              },
              volumeMounts: [
                {
                  name: 'cwagentconfig',
                  mountPath: '/etc/cwagentconfig',
                },
                {
                  name: 'rootfs',
                  mountPath: '/rootfs',
                  readOnly: true,
                },
                {
                  name: 'dockersock',
                  mountPath: '/var/run/docker.sock',
                  readOnly: true,
                },
                {
                  name: 'varlibdocker',
                  mountPath: '/var/lib/docker',
                  readOnly: true,
                },
                {
                  name: 'sys',
                  mountPath: '/sys',
                  readOnly: true,
                },
                {
                  name: 'devdisk',
                  mountPath: '/dev/disk',
                  readOnly: true,
                },
              ],
            },
          ],
          volumes: [
            {
              name: 'cwagentconfig',
              configMap: {
                name: 'cwagentconfig',
              },
            },
            {
              name: 'rootfs',
              hostPath: {
                path: '/',
              },
            },
            {
              name: 'dockersock',
              hostPath: {
                path: '/var/run/docker.sock',
              },
            },
            {
              name: 'varlibdocker',
              hostPath: {
                path: '/var/lib/docker',
              },
            },
            {
              name: 'sys',
              hostPath: {
                path: '/sys',
              },
            },
            {
              name: 'devdisk',
              hostPath: {
                path: '/dev/disk',
              },
            },
          ],
          terminationGracePeriodSeconds: 60,
        },
      },
    },
  },
  {
    provider: k8sProvider,
    dependsOn: [
      containerInsightsServiceAccount,
      containerInsightsConfigMap,
      containerInsightsClusterRoleBinding,
    ],
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

// Export kubeconfig
export const kubeconfig = pulumi
  .all([eksCluster.name, eksCluster.endpoint, eksCluster.certificateAuthority])
  .apply(([name, endpoint, ca]) => {
    return JSON.stringify({
      apiVersion: 'v1',
      kind: 'Config',
      clusters: [
        {
          cluster: {
            server: endpoint,
            'certificate-authority-data': ca.data,
          },
          name: 'kubernetes',
        },
      ],
      contexts: [
        {
          context: {
            cluster: 'kubernetes',
            user: 'aws',
          },
          name: 'aws',
        },
      ],
      'current-context': 'aws',
      users: [
        {
          name: 'aws',
          user: {
            exec: {
              apiVersion: 'client.authentication.k8s.io/v1beta1',
              command: 'aws',
              args: [
                'eks',
                'get-token',
                '--cluster-name',
                name,
                '--region',
                region,
              ],
            },
          },
        },
      ],
    });
  });

export const s3ServiceAccountRoleArn = s3ServiceAccountRole.arn;
export const dynamodbServiceAccountRoleArn = dynamodbServiceAccountRole.arn;
export const clusterAutoscalerRoleArn = clusterAutoscalerRole.arn;

// Export additional resources to avoid unused variable warnings and enable testing
export const kmsKeyAliasName = eksKmsKeyAlias.name;
export const publicRouteId = publicRoute.id;
export const coreDnsAddonVersion = coreDnsAddon.addonVersion;
export const kubeProxyAddonVersion = kubeProxyAddon.addonVersion;
export const vpcCniAddonVersion = vpcCniAddon.addonVersion;
export const s3ServiceAccountName = s3ServiceAccount.metadata.name;
export const dynamodbServiceAccountName = dynamodbServiceAccount.metadata.name;
export const clusterAutoscalerDeploymentName =
  clusterAutoscalerDeployment.metadata.name;
export const defaultNamespacePSSLabels = defaultNamespacePSS.metadata.labels;
export const containerInsightsDaemonSetName =
  containerInsightsDaemonSet.metadata.name;
```

## Summary of Changes

The IDEAL_RESPONSE makes the following key corrections to enable successful deployment:

1. **EKS Version Upgrade**: Changed from 1.28 to 1.29 to comply with AWS provider requirements
2. **Add-on Version Updates**: Updated CoreDNS (1.10.1 → 1.11.1), kube-proxy (1.28.1 → 1.29.0), and vpc-cni (1.14.1 → 1.16.0)
3. **Cluster Autoscaler Update**: Updated image from v1.28.2 to v1.29.0
4. **Pulumi Configuration Fix**: Removed invalid aws:region configuration from Pulumi.yaml
5. **Resource Exports**: Added exports for all resources to enable proper testing and verification

These corrections transform the MODEL_RESPONSE from a non-deployable configuration into a fully functional, production-ready EKS cluster implementation that meets all security, compliance, and operational requirements.
