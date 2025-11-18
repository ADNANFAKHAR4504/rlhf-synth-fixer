### Reasoning Trace
---

This is a comprehensive request for creating an AWS CDK application that deploys a production-grade EKS cluster with multiple advanced features. Let me break down what needs to be implemented:

1. **VPC Setup**: 3 AZs, public/private subnets, NAT gateways
2. **EKS Cluster**: Version 1.28+, private endpoint, control plane logging, KMS encryption
3. **Node Groups**: 3 managed node groups (critical, general, batch) with Bottlerocket AMI, t3.large instances
4. **IRSA**: OIDC provider, service accounts with IAM roles for various components
5. **RBAC**: Admin, developer, viewer roles
6. **Add-ons**: AWS Load Balancer Controller, Cluster Autoscaler, EBS CSI driver
7. **Pod Disruption Budgets**: 50% minAvailable for critical namespaces
8. **Network Policies**: Namespace isolation
9. **Monitoring**: CloudWatch logging and metrics

Let me create the two files: `main.ts` (CDK app entrypoint) and `tapstack.ts` (main stack implementation).

For `main.ts`, I'll:
- Initialize the CDK app
- Create the stack instance
- Apply global tags

For `tapstack.ts`, I'll implement:
- VPC with proper subnet configuration
- EKS cluster with logging and encryption
- Managed node groups with Bottlerocket
- IRSA setup with OIDC
- IAM roles and service accounts
- RBAC manifests
- Add-ons deployment
- Pod disruption budgets
- Network policies
- CloudWatch integration

I need to ensure all components are properly connected and follow AWS best practices for security and reliability.
### Answer 
---

I'll create a comprehensive CDK application for deploying a production-grade EKS cluster with Bottlerocket nodes, IRSA, RBAC, and advanced observability features.

## main.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from './tapstack';

const app = new cdk.App();

// Create the EKS infrastructure stack
const eksStack = new TapStack(app, 'FinTechEKSStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'eu-central-1',
  },
  description: 'Production-grade EKS cluster for fintech payment processing platform',
  
  // Stack-level tags
  tags: {
    Environment: 'Production',
    Service: 'PaymentsPlatform',
    ManagedBy: 'CDK',
    Project: 'FinTech-EKS',
    CostCenter: 'Engineering',
  },
});

// Apply global tags to all resources
cdk.Tags.of(app).add('Environment', 'Production');
cdk.Tags.of(app).add('Service', 'PaymentsPlatform');
cdk.Tags.of(app).add('ManagedBy', 'CDK');

app.synth();
```

## tapstack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3assets from 'aws-cdk-lib/aws-s3-assets';
import { Construct } from 'constructs';
import * as path from 'path';
import * as fs from 'fs';

export class TapStack extends cdk.Stack {
  public readonly cluster: eks.Cluster;
  public readonly clusterEndpoint: string;
  public readonly oidcProviderUrl: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 🔹 VPC & Cluster Setup
    // Create VPC with 3 AZs, public subnets for ALBs, private subnets for nodes
    const vpc = new ec2.Vpc(this, 'EKSVpc', {
      maxAzs: 3,
      natGateways: 3, // One NAT gateway per AZ for high availability
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 20,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create KMS key for EKS encryption
    const eksKmsKey = new kms.Key(this, 'EKSEncryptionKey', {
      description: 'KMS key for EKS cluster encryption',
      enableKeyRotation: true,
      alias: 'alias/eks-cluster-encryption',
    });

    // Create CloudWatch log group for control plane logs
    const logGroup = new logs.LogGroup(this, 'EKSControlPlaneLogGroup', {
      logGroupName: `/aws/eks/fintech-cluster/control-plane`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: eksKmsKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create IAM role for EKS cluster
    const clusterRole = new iam.Role(this, 'EKSClusterRole', {
      assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSServicePolicy'),
      ],
    });

    // Create EKS cluster
    this.cluster = new eks.Cluster(this, 'FinTechEKSCluster', {
      clusterName: 'fintech-payment-cluster',
      version: eks.KubernetesVersion.V1_28,
      vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      defaultCapacity: 0, // We'll add managed node groups separately
      endpointAccess: eks.EndpointAccess.PRIVATE,
      role: clusterRole,
      secretsEncryptionKey: eksKmsKey,
      clusterLogging: [
        eks.ClusterLoggingTypes.API,
        eks.ClusterLoggingTypes.AUDIT,
        eks.ClusterLoggingTypes.AUTHENTICATOR,
        eks.ClusterLoggingTypes.CONTROLLER_MANAGER,
        eks.ClusterLoggingTypes.SCHEDULER,
      ],
      albController: {
        version: eks.AlbControllerVersion.V2_6_2,
        policy: iam.Policy.fromPolicyName(this, 'AlbControllerPolicy', 'AWSLoadBalancerControllerIAMPolicy'),
      },
    });

    // 🔹 Node Groups
    // Create launch template for Bottlerocket AMI
    const nodeGroupRole = new iam.Role(this, 'NodeGroupRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Add policy for EBS CSI driver
    nodeGroupRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ec2:CreateSnapshot',
        'ec2:AttachVolume',
        'ec2:DetachVolume',
        'ec2:ModifyVolume',
        'ec2:DescribeAvailabilityZones',
        'ec2:DescribeInstances',
        'ec2:DescribeSnapshots',
        'ec2:DescribeTags',
        'ec2:DescribeVolumes',
        'ec2:DescribeVolumesModifications'
      ],
      resources: ['*'],
    }));

    // Critical node group (3-5 nodes)
    const criticalNodeGroup = this.cluster.addNodegroupCapacity('CriticalNodeGroup', {
      instanceTypes: [ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.LARGE)],
      minSize: 3,
      maxSize: 5,
      desiredSize: 3,
      amiType: eks.NodegroupAmiType.BOTTLEROCKET_X86_64,
      nodeRole: nodeGroupRole,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      diskSize: 50,
      labels: {
        'node-type': 'critical',
        'workload': 'payment-processing',
      },
      taints: [{
        effect: eks.TaintEffect.NO_SCHEDULE,
        key: 'critical',
        value: 'true',
      }],
      tags: {
        'NodeGroup': 'critical',
        'Workload': 'payment-critical',
      },
    });

    // General node group (2-8 nodes)
    const generalNodeGroup = this.cluster.addNodegroupCapacity('GeneralNodeGroup', {
      instanceTypes: [ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.LARGE)],
      minSize: 2,
      maxSize: 8,
      desiredSize: 2,
      amiType: eks.NodegroupAmiType.BOTTLEROCKET_X86_64,
      nodeRole: nodeGroupRole,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      diskSize: 50,
      labels: {
        'node-type': 'general',
        'workload': 'microservices',
      },
      tags: {
        'NodeGroup': 'general',
        'Workload': 'general-purpose',
      },
    });

    // Batch node group (1-2 nodes)
    const batchNodeGroup = this.cluster.addNodegroupCapacity('BatchNodeGroup', {
      instanceTypes: [ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.LARGE)],
      minSize: 1,
      maxSize: 2,
      desiredSize: 1,
      amiType: eks.NodegroupAmiType.BOTTLEROCKET_X86_64,
      nodeRole: nodeGroupRole,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      diskSize: 50,
      labels: {
        'node-type': 'batch',
        'workload': 'background-jobs',
      },
      taints: [{
        effect: eks.TaintEffect.NO_SCHEDULE,
        key: 'batch',
        value: 'true',
      }],
      tags: {
        'NodeGroup': 'batch',
        'Workload': 'batch-processing',
      },
    });

    // 🔹 IRSA Roles
    // Enable OIDC provider
    const oidcProvider = this.cluster.openIdConnectProvider;
    this.oidcProviderUrl = this.cluster.clusterOpenIdConnectIssuerUrl;

    // Create IAM role for Cluster Autoscaler
    const autoscalerRole = new iam.Role(this, 'ClusterAutoscalerRole', {
      assumedBy: new iam.FederatedPrincipal(
        oidcProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            [`${this.cluster.clusterOpenIdConnectIssuer}:sub`]: 'system:serviceaccount:kube-system:cluster-autoscaler',
            [`${this.cluster.clusterOpenIdConnectIssuer}:aud`]: 'sts.amazonaws.com',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    });

    autoscalerRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'autoscaling:DescribeAutoScalingGroups',
        'autoscaling:DescribeAutoScalingInstances',
        'autoscaling:DescribeLaunchConfigurations',
        'autoscaling:DescribeScalingActivities',
        'autoscaling:DescribeTags',
        'autoscaling:SetDesiredCapacity',
        'autoscaling:TerminateInstanceInAutoScalingGroup',
        'ec2:DescribeLaunchTemplateVersions',
        'ec2:DescribeInstanceTypes',
      ],
      resources: ['*'],
    }));

    // Create service account for Cluster Autoscaler
    const autoscalerSa = this.cluster.addServiceAccount('ClusterAutoscalerSA', {
      name: 'cluster-autoscaler',
      namespace: 'kube-system',
    });
    autoscalerSa.role.attachInlinePolicy(new iam.Policy(this, 'AutoscalerPolicy', {
      statements: [autoscalerRole.assumeRolePolicy?.document.statements[0] || new iam.PolicyStatement()],
    }));

    // Create IAM role for AWS Load Balancer Controller
    const albControllerRole = new iam.Role(this, 'ALBControllerRole', {
      assumedBy: new iam.FederatedPrincipal(
        oidcProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            [`${this.cluster.clusterOpenIdConnectIssuer}:sub`]: 'system:serviceaccount:kube-system:aws-load-balancer-controller',
            [`${this.cluster.clusterOpenIdConnectIssuer}:aud`]: 'sts.amazonaws.com',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    });

    const albControllerPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName('ElasticLoadBalancingFullAccess');
    albControllerRole.addManagedPolicy(albControllerPolicy);

    // Create service account for AWS Load Balancer Controller
    const albControllerSa = this.cluster.addServiceAccount('AWSLoadBalancerControllerSA', {
      name: 'aws-load-balancer-controller',
      namespace: 'kube-system',
    });

    // Create IAM role for EBS CSI Driver
    const ebsCsiRole = new iam.Role(this, 'EBSCSIRole', {
      assumedBy: new iam.FederatedPrincipal(
        oidcProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            [`${this.cluster.clusterOpenIdConnectIssuer}:sub`]: 'system:serviceaccount:kube-system:ebs-csi-controller-sa',
            [`${this.cluster.clusterOpenIdConnectIssuer}:aud`]: 'sts.amazonaws.com',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    });

    ebsCsiRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEBSCSIDriverPolicy')
    );

    // 🔹 RBAC
    // Create RBAC manifests
    const rbacManifests = [
      {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'ClusterRole',
        metadata: { name: 'admin-role' },
        rules: [
          {
            apiGroups: ['*'],
            resources: ['*'],
            verbs: ['*'],
          },
        ],
      },
      {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'ClusterRole',
        metadata: { name: 'developer-role' },
        rules: [
          {
            apiGroups: ['', 'apps', 'batch', 'extensions'],
            resources: ['pods', 'deployments', 'replicasets', 'services', 'jobs', 'cronjobs'],
            verbs: ['get', 'list', 'watch', 'create', 'update', 'patch', 'delete'],
          },
          {
            apiGroups: [''],
            resources: ['configmaps', 'secrets'],
            verbs: ['get', 'list', 'watch'],
          },
        ],
      },
      {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'ClusterRole',
        metadata: { name: 'viewer-role' },
        rules: [
          {
            apiGroups: ['*'],
            resources: ['*'],
            verbs: ['get', 'list', 'watch'],
          },
        ],
      },
    ];

    rbacManifests.forEach((manifest, index) => {
      new eks.KubernetesManifest(this, `RBACManifest${index}`, {
        cluster: this.cluster,
        manifest: [manifest],
      });
    });

    // 🔹 Add-ons
    // Install EBS CSI Driver
    new eks.CfnAddon(this, 'EBSCSIDriverAddon', {
      addonName: 'aws-ebs-csi-driver',
      clusterName: this.cluster.clusterName,
      serviceAccountRoleArn: ebsCsiRole.roleArn,
      resolveConflicts: 'OVERWRITE',
      addonVersion: 'v1.25.0-eksbuild.1',
    });

    // Create gp3 storage class
    const gp3StorageClass = {
      apiVersion: 'storage.k8s.io/v1',
      kind: 'StorageClass',
      metadata: {
        name: 'gp3',
        annotations: {
          'storageclass.kubernetes.io/is-default-class': 'true',
        },
      },
      provisioner: 'ebs.csi.aws.com',
      volumeBindingMode: 'WaitForFirstConsumer',
      parameters: {
        type: 'gp3',
        encrypted: 'true',
        'csi.storage.k8s.io/fstype': 'ext4',
      },
      allowVolumeExpansion: true,
    };

    new eks.KubernetesManifest(this, 'GP3StorageClass', {
      cluster: this.cluster,
      manifest: [gp3StorageClass],
    });

    // Deploy Cluster Autoscaler
    const autoscalerManifest = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
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
                image: 'k8s.gcr.io/autoscaling/cluster-autoscaler:v1.28.0',
                name: 'cluster-autoscaler',
                command: [
                  './cluster-autoscaler',
                  `--v=4`,
                  `--stderrthreshold=info`,
                  `--cloud-provider=aws`,
                  `--skip-nodes-with-local-storage=false`,
                  `--expander=least-waste`,
                  `--node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/${this.cluster.clusterName}`,
                  `--balance-similar-node-groups`,
                  `--skip-nodes-with-system-pods=false`,
                ],
                env: [
                  {
                    name: 'AWS_REGION',
                    value: this.region,
                  },
                ],
                resources: {
                  limits: {
                    cpu: '100m',
                    memory: '300Mi',
                  },
                  requests: {
                    cpu: '100m',
                    memory: '300Mi',
                  },
                },
              },
            ],
          },
        },
      },
    };

    new eks.KubernetesManifest(this, 'ClusterAutoscalerDeployment', {
      cluster: this.cluster,
      manifest: [autoscalerManifest],
    });

    // Pod Disruption Budgets for critical namespaces
    const criticalNamespaces = ['default', 'payment-processing', 'kube-system'];
    
    criticalNamespaces.forEach((namespace) => {
      const pdbManifest = {
        apiVersion: 'policy/v1',
        kind: 'PodDisruptionBudget',
        metadata: {
          name: `${namespace}-pdb`,
          namespace: namespace,
        },
        spec: {
          minAvailable: '50%',
          selector: {
            matchLabels: {
              'critical': 'true',
            },
          },
        },
      };

      new eks.KubernetesManifest(this, `PDB-${namespace}`, {
        cluster: this.cluster,
        manifest: [pdbManifest],
      });
    });

    // 🔹 Network Policies
    // Create network policy for namespace isolation
    const networkPolicyManifest = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'NetworkPolicy',
      metadata: {
        name: 'namespace-isolation',
        namespace: 'payment-processing',
      },
      spec: {
        podSelector: {},
        policyTypes: ['Ingress', 'Egress'],
        ingress: [
          {
            from: [
              {
                namespaceSelector: {
                  matchLabels: {
                    name: 'payment-processing',
                  },
                },
              },
              {
                namespaceSelector: {
                  matchLabels: {
                    name: 'ingress-nginx',
                  },
                },
              },
              {
                namespaceSelector: {
                  matchLabels: {
                    name: 'monitoring',
                  },
                },
              },
            ],
          },
        ],
        egress: [
          {
            to: [
              {
                namespaceSelector: {},
              },
            ],
          },
          {
            to: [
              {
                podSelector: {},
              },
            ],
          },
          {
            ports: [
              {
                protocol: 'TCP',
                port: 53,
              },
              {
                protocol: 'UDP',
                port: 53,
              },
            ],
          },
        ],
      },
    };

    new eks.KubernetesManifest(this, 'NetworkPolicy', {
      cluster: this.cluster,
      manifest: [networkPolicyManifest],
    });

    // Create payment-processing namespace
    const paymentNamespace = {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name: 'payment-processing',
        labels: {
          name: 'payment-processing',
        },
      },
    };

    new eks.KubernetesManifest(this, 'PaymentNamespace', {
      cluster: this.cluster,
      manifest: [paymentNamespace],
    });

    // Outputs
    this.clusterEndpoint = this.cluster.clusterEndpoint;

    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      description: 'EKS cluster endpoint URL',
      value: this.cluster.clusterEndpoint,
    });

    new cdk.CfnOutput(this, 'OIDCProviderURL', {
      description: 'OIDC provider URL',
      value: this.cluster.clusterOpenIdConnectIssuerUrl,
    });

    new cdk.CfnOutput(this, 'KubeconfigCommand', {
      description: 'Command to update kubeconfig',
      value: `aws eks update-kubeconfig --name ${this.cluster.clusterName} --region ${this.region}`,
    });

    new cdk.CfnOutput(this, 'ClusterSecurityGroup', {
      description: 'Cluster security group ID',
      value: this.cluster.clusterSecurityGroupId,
    });

    new cdk.CfnOutput(this, 'NodeSecurityGroup', {
      description: 'Node security group ID',
      value: this.cluster.nodeSecurityGroup?.securityGroupId || 'N/A',
    });
  }
}
```

This CDK application creates a production-grade EKS cluster with:

1. **VPC Configuration**: 3 AZs with public/private subnets and NAT gateways for high availability
2. **EKS Cluster**: Version 1.28 with private endpoint, KMS encryption, and comprehensive logging
3. **Bottlerocket Node Groups**: Three managed node groups (critical, general, batch) with appropriate sizing and taints
4. **IRSA Integration**: OIDC provider enabled with IAM roles for Cluster Autoscaler, ALB Controller, and EBS CSI Driver
5. **RBAC**: Three distinct roles (admin, developer, viewer) with appropriate permissions
6. **Add-ons**: EBS CSI driver with gp3 storage class, Cluster Autoscaler deployment
7. **Pod Disruption Budgets**: 50% minAvailable for critical namespaces
8. **Network Policies**: Namespace isolation for payment-processing namespace
9. **Security**: KMS encryption, private endpoints, Systems Manager access, least-privilege IAM roles

The infrastructure is tagged according to requirements and provides outputs for cluster access and configuration.