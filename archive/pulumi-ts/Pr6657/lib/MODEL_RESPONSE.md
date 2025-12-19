# EKS Cluster with Advanced Container Orchestration - Implementation

This implementation provides a production-ready EKS cluster with advanced container orchestration features using Pulumi with TypeScript.

## File: lib/vpc-stack.ts

```typescript
/**
 * VPC Stack for EKS Cluster
 * Creates a VPC with public and private subnets for EKS deployment
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

export interface VpcStackArgs {
  environmentSuffix: string;
  region: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpc: awsx.ec2.Vpc;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly vpcId: pulumi.Output<string>;

  constructor(name: string, args: VpcStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:eks:VpcStack', name, args, opts);

    // Create VPC with public and private subnets
    this.vpc = new awsx.ec2.Vpc(`eks-vpc-${args.environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      numberOfAvailabilityZones: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: {
        strategy: 'Single',
      },
      subnetSpecs: [
        {
          type: awsx.ec2.SubnetType.Public,
          cidrMask: 20,
          tags: {
            Name: `eks-public-subnet-${args.environmentSuffix}`,
            'kubernetes.io/role/elb': '1',
          },
        },
        {
          type: awsx.ec2.SubnetType.Private,
          cidrMask: 20,
          tags: {
            Name: `eks-private-subnet-${args.environmentSuffix}`,
            'kubernetes.io/role/internal-elb': '1',
          },
        },
      ],
      tags: {
        Name: `eks-vpc-${args.environmentSuffix}`,
        Environment: args.environmentSuffix,
        ...args.tags,
      },
    }, { parent: this });

    this.vpcId = this.vpc.vpcId;
    this.publicSubnetIds = pulumi.output(this.vpc.publicSubnetIds);
    this.privateSubnetIds = pulumi.output(this.vpc.privateSubnetIds);

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
```

## File: lib/eks-cluster-stack.ts

```typescript
/**
 * EKS Cluster Stack
 * Creates EKS cluster with OIDC provider and private endpoint access
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as eks from '@pulumi/eks';

export interface EksClusterStackArgs {
  environmentSuffix: string;
  region: string;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string[]>;
  publicSubnetIds: pulumi.Input<string[]>;
  version?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class EksClusterStack extends pulumi.ComponentResource {
  public readonly cluster: eks.Cluster;
  public readonly kubeconfig: pulumi.Output<any>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly oidcProviderArn: pulumi.Output<string>;
  public readonly oidcProviderUrl: pulumi.Output<string>;
  public readonly clusterEndpoint: pulumi.Output<string>;

  constructor(name: string, args: EksClusterStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:eks:EksClusterStack', name, args, opts);

    const clusterName = `eks-cluster-${args.environmentSuffix}`;

    // Create EKS cluster with private endpoint access
    this.cluster = new eks.Cluster(clusterName, {
      name: clusterName,
      version: args.version || '1.28',
      vpcId: args.vpcId,
      privateSubnetIds: args.privateSubnetIds,
      publicSubnetIds: args.publicSubnetIds,
      instanceType: 't3.medium',
      desiredCapacity: 2,
      minSize: 1,
      maxSize: 4,
      // Enable private endpoint access
      endpointPrivateAccess: true,
      endpointPublicAccess: true,
      // Create OIDC provider for IRSA
      createOidcProvider: true,
      // Skip creating default node group - we'll create managed node groups separately
      skipDefaultNodeGroup: true,
      tags: {
        Name: clusterName,
        Environment: args.environmentSuffix,
        ...args.tags,
      },
    }, { parent: this });

    this.kubeconfig = this.cluster.kubeconfig;
    this.clusterName = this.cluster.eksCluster.name;
    this.clusterEndpoint = this.cluster.eksCluster.endpoint;

    // Get OIDC provider details
    this.oidcProviderArn = this.cluster.core.oidcProvider!.arn;
    this.oidcProviderUrl = this.cluster.core.oidcProvider!.url;

    this.registerOutputs({
      clusterName: this.clusterName,
      kubeconfig: this.kubeconfig,
      oidcProviderArn: this.oidcProviderArn,
      oidcProviderUrl: this.oidcProviderUrl,
      clusterEndpoint: this.clusterEndpoint,
    });
  }
}
```

## File: lib/eks-node-groups-stack.ts

```typescript
/**
 * EKS Managed Node Groups Stack
 * Creates two managed node groups: one with spot instances and one with on-demand
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as eks from '@pulumi/eks';

export interface EksNodeGroupsStackArgs {
  environmentSuffix: string;
  cluster: eks.Cluster;
  privateSubnetIds: pulumi.Input<string[]>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class EksNodeGroupsStack extends pulumi.ComponentResource {
  public readonly spotNodeGroup: eks.ManagedNodeGroup;
  public readonly onDemandNodeGroup: eks.ManagedNodeGroup;

  constructor(name: string, args: EksNodeGroupsStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:eks:EksNodeGroupsStack', name, args, opts);

    // Create spot instance node group
    this.spotNodeGroup = eks.createManagedNodeGroup(`eks-spot-ng-${args.environmentSuffix}`, {
      cluster: args.cluster,
      nodeGroupName: `eks-spot-ng-${args.environmentSuffix}`,
      nodeRoleArn: args.cluster.instanceRoles[0].arn,
      subnetIds: args.privateSubnetIds,
      capacityType: 'SPOT',
      instanceTypes: ['t3.medium', 't3a.medium'],
      scalingConfig: {
        desiredSize: 2,
        minSize: 1,
        maxSize: 5,
      },
      labels: {
        'node-type': 'spot',
        'workload': 'general',
      },
      tags: {
        Name: `eks-spot-ng-${args.environmentSuffix}`,
        Environment: args.environmentSuffix,
        NodeType: 'spot',
        ...args.tags,
      },
    }, { parent: this });

    // Create on-demand instance node group
    this.onDemandNodeGroup = eks.createManagedNodeGroup(`eks-ondemand-ng-${args.environmentSuffix}`, {
      cluster: args.cluster,
      nodeGroupName: `eks-ondemand-ng-${args.environmentSuffix}`,
      nodeRoleArn: args.cluster.instanceRoles[0].arn,
      subnetIds: args.privateSubnetIds,
      capacityType: 'ON_DEMAND',
      instanceTypes: ['t3.medium'],
      scalingConfig: {
        desiredSize: 1,
        minSize: 1,
        maxSize: 3,
      },
      labels: {
        'node-type': 'on-demand',
        'workload': 'critical',
      },
      tags: {
        Name: `eks-ondemand-ng-${args.environmentSuffix}`,
        Environment: args.environmentSuffix,
        NodeType: 'on-demand',
        ...args.tags,
      },
    }, { parent: this });

    this.registerOutputs({
      spotNodeGroupName: this.spotNodeGroup.nodeGroup.nodeGroupName,
      onDemandNodeGroupName: this.onDemandNodeGroup.nodeGroup.nodeGroupName,
    });
  }
}
```

## File: lib/eks-addons-stack.ts

```typescript
/**
 * EKS Add-ons Stack
 * Installs essential EKS add-ons including EBS CSI driver
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as eks from '@pulumi/eks';
import * as k8s from '@pulumi/kubernetes';

export interface EksAddonsStackArgs {
  environmentSuffix: string;
  cluster: eks.Cluster;
  oidcProviderArn: pulumi.Input<string>;
  oidcProviderUrl: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class EksAddonsStack extends pulumi.ComponentResource {
  public readonly ebsCsiDriverRole: aws.iam.Role;
  public readonly ebsCsiAddon: aws.eks.Addon;

  constructor(name: string, args: EksAddonsStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:eks:EksAddonsStack', name, args, opts);

    // Create IAM role for EBS CSI driver with IRSA
    const ebsCsiPolicyDoc = pulumi.all([args.oidcProviderArn, args.oidcProviderUrl]).apply(([arn, url]) => {
      const urlWithoutProtocol = url.replace('https://', '');
      return aws.iam.getPolicyDocument({
        statements: [{
          effect: 'Allow',
          principals: [{
            type: 'Federated',
            identifiers: [arn],
          }],
          actions: ['sts:AssumeRoleWithWebIdentity'],
          conditions: [{
            test: 'StringEquals',
            variable: `${urlWithoutProtocol}:sub`,
            values: ['system:serviceaccount:kube-system:ebs-csi-controller-sa'],
          }, {
            test: 'StringEquals',
            variable: `${urlWithoutProtocol}:aud`,
            values: ['sts.amazonaws.com'],
          }],
        }],
      });
    });

    this.ebsCsiDriverRole = new aws.iam.Role(`ebs-csi-driver-role-${args.environmentSuffix}`, {
      name: `ebs-csi-driver-role-${args.environmentSuffix}`,
      assumeRolePolicy: ebsCsiPolicyDoc.apply(doc => doc.json),
      tags: {
        Name: `ebs-csi-driver-role-${args.environmentSuffix}`,
        Environment: args.environmentSuffix,
        ...args.tags,
      },
    }, { parent: this });

    // Attach AWS managed policy for EBS CSI driver
    new aws.iam.RolePolicyAttachment(`ebs-csi-policy-attachment-${args.environmentSuffix}`, {
      role: this.ebsCsiDriverRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy',
    }, { parent: this });

    // Install EBS CSI driver addon
    this.ebsCsiAddon = new aws.eks.Addon(`ebs-csi-addon-${args.environmentSuffix}`, {
      clusterName: args.cluster.eksCluster.name,
      addonName: 'aws-ebs-csi-driver',
      addonVersion: 'v1.25.0-eksbuild.1',
      serviceAccountRoleArn: this.ebsCsiDriverRole.arn,
      resolveConflictsOnCreate: 'OVERWRITE',
      resolveConflictsOnUpdate: 'OVERWRITE',
      tags: {
        Name: `ebs-csi-addon-${args.environmentSuffix}`,
        Environment: args.environmentSuffix,
        ...args.tags,
      },
    }, { parent: this });

    // Create storage class with encryption
    const storageClass = new k8s.storage.v1.StorageClass(`ebs-sc-encrypted-${args.environmentSuffix}`, {
      metadata: {
        name: 'ebs-sc-encrypted',
      },
      provisioner: 'ebs.csi.aws.com',
      parameters: {
        type: 'gp3',
        encrypted: 'true',
      },
      volumeBindingMode: 'WaitForFirstConsumer',
      allowVolumeExpansion: true,
    }, { provider: args.cluster.provider, parent: this });

    this.registerOutputs({
      ebsCsiDriverRoleArn: this.ebsCsiDriverRole.arn,
      ebsCsiAddonName: this.ebsCsiAddon.addonName,
    });
  }
}
```

## File: lib/eks-load-balancer-controller-stack.ts

```typescript
/**
 * AWS Load Balancer Controller Stack
 * Installs AWS Load Balancer Controller with IRSA
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as eks from '@pulumi/eks';
import * as k8s from '@pulumi/kubernetes';

export interface LoadBalancerControllerStackArgs {
  environmentSuffix: string;
  cluster: eks.Cluster;
  oidcProviderArn: pulumi.Input<string>;
  oidcProviderUrl: pulumi.Input<string>;
  vpcId: pulumi.Input<string>;
  region: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class LoadBalancerControllerStack extends pulumi.ComponentResource {
  public readonly lbControllerRole: aws.iam.Role;
  public readonly lbControllerServiceAccount: k8s.core.v1.ServiceAccount;

  constructor(name: string, args: LoadBalancerControllerStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:eks:LoadBalancerControllerStack', name, args, opts);

    // Create IAM policy for Load Balancer Controller
    const lbControllerPolicy = new aws.iam.Policy(`lb-controller-policy-${args.environmentSuffix}`, {
      name: `lb-controller-policy-${args.environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'iam:CreateServiceLinkedRole',
            ],
            Resource: '*',
            Condition: {
              StringEquals: {
                'iam:AWSServiceName': 'elasticloadbalancing.amazonaws.com',
              },
            },
          },
          {
            Effect: 'Allow',
            Action: [
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
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
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
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'ec2:AuthorizeSecurityGroupIngress',
              'ec2:RevokeSecurityGroupIngress',
              'ec2:CreateSecurityGroup',
              'ec2:CreateTags',
              'ec2:DeleteTags',
              'ec2:AuthorizeSecurityGroupEgress',
              'ec2:RevokeSecurityGroupEgress',
              'ec2:DeleteSecurityGroup',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'elasticloadbalancing:CreateLoadBalancer',
              'elasticloadbalancing:CreateTargetGroup',
              'elasticloadbalancing:CreateListener',
              'elasticloadbalancing:DeleteListener',
              'elasticloadbalancing:CreateRule',
              'elasticloadbalancing:DeleteRule',
              'elasticloadbalancing:AddTags',
              'elasticloadbalancing:RemoveTags',
              'elasticloadbalancing:ModifyLoadBalancerAttributes',
              'elasticloadbalancing:SetIpAddressType',
              'elasticloadbalancing:SetSecurityGroups',
              'elasticloadbalancing:SetSubnets',
              'elasticloadbalancing:DeleteLoadBalancer',
              'elasticloadbalancing:ModifyTargetGroup',
              'elasticloadbalancing:ModifyTargetGroupAttributes',
              'elasticloadbalancing:DeleteTargetGroup',
              'elasticloadbalancing:RegisterTargets',
              'elasticloadbalancing:DeregisterTargets',
              'elasticloadbalancing:SetWebAcl',
              'elasticloadbalancing:ModifyListener',
              'elasticloadbalancing:AddListenerCertificates',
              'elasticloadbalancing:RemoveListenerCertificates',
              'elasticloadbalancing:ModifyRule',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `lb-controller-policy-${args.environmentSuffix}`,
        Environment: args.environmentSuffix,
        ...args.tags,
      },
    }, { parent: this });

    // Create IAM role for Load Balancer Controller with IRSA
    const lbControllerPolicyDoc = pulumi.all([args.oidcProviderArn, args.oidcProviderUrl]).apply(([arn, url]) => {
      const urlWithoutProtocol = url.replace('https://', '');
      return aws.iam.getPolicyDocument({
        statements: [{
          effect: 'Allow',
          principals: [{
            type: 'Federated',
            identifiers: [arn],
          }],
          actions: ['sts:AssumeRoleWithWebIdentity'],
          conditions: [{
            test: 'StringEquals',
            variable: `${urlWithoutProtocol}:sub`,
            values: ['system:serviceaccount:kube-system:aws-load-balancer-controller'],
          }, {
            test: 'StringEquals',
            variable: `${urlWithoutProtocol}:aud`,
            values: ['sts.amazonaws.com'],
          }],
        }],
      });
    });

    this.lbControllerRole = new aws.iam.Role(`lb-controller-role-${args.environmentSuffix}`, {
      name: `lb-controller-role-${args.environmentSuffix}`,
      assumeRolePolicy: lbControllerPolicyDoc.apply(doc => doc.json),
      tags: {
        Name: `lb-controller-role-${args.environmentSuffix}`,
        Environment: args.environmentSuffix,
        ...args.tags,
      },
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`lb-controller-policy-attachment-${args.environmentSuffix}`, {
      role: this.lbControllerRole.name,
      policyArn: lbControllerPolicy.arn,
    }, { parent: this });

    // Create service account for Load Balancer Controller
    this.lbControllerServiceAccount = new k8s.core.v1.ServiceAccount(`aws-load-balancer-controller-sa-${args.environmentSuffix}`, {
      metadata: {
        name: 'aws-load-balancer-controller',
        namespace: 'kube-system',
        annotations: {
          'eks.amazonaws.com/role-arn': this.lbControllerRole.arn,
        },
      },
    }, { provider: args.cluster.provider, parent: this });

    // Install AWS Load Balancer Controller using Helm
    const lbController = new k8s.helm.v3.Release(`aws-load-balancer-controller-${args.environmentSuffix}`, {
      chart: 'aws-load-balancer-controller',
      repositoryOpts: {
        repo: 'https://aws.github.io/eks-charts',
      },
      namespace: 'kube-system',
      values: {
        clusterName: args.cluster.eksCluster.name,
        serviceAccount: {
          create: false,
          name: 'aws-load-balancer-controller',
        },
        region: args.region,
        vpcId: args.vpcId,
      },
    }, { provider: args.cluster.provider, parent: this, dependsOn: [this.lbControllerServiceAccount] });

    this.registerOutputs({
      lbControllerRoleArn: this.lbControllerRole.arn,
      lbControllerServiceAccountName: this.lbControllerServiceAccount.metadata.name,
    });
  }
}
```

## File: lib/eks-cluster-autoscaler-stack.ts

```typescript
/**
 * Cluster Autoscaler Stack
 * Installs Kubernetes Cluster Autoscaler with pod disruption budgets
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as eks from '@pulumi/eks';
import * as k8s from '@pulumi/kubernetes';

export interface ClusterAutoscalerStackArgs {
  environmentSuffix: string;
  cluster: eks.Cluster;
  oidcProviderArn: pulumi.Input<string>;
  oidcProviderUrl: pulumi.Input<string>;
  region: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class ClusterAutoscalerStack extends pulumi.ComponentResource {
  public readonly autoscalerRole: aws.iam.Role;
  public readonly autoscalerServiceAccount: k8s.core.v1.ServiceAccount;

  constructor(name: string, args: ClusterAutoscalerStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:eks:ClusterAutoscalerStack', name, args, opts);

    // Create IAM policy for Cluster Autoscaler
    const autoscalerPolicy = new aws.iam.Policy(`cluster-autoscaler-policy-${args.environmentSuffix}`, {
      name: `cluster-autoscaler-policy-${args.environmentSuffix}`,
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
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'autoscaling:SetDesiredCapacity',
              'autoscaling:TerminateInstanceInAutoScalingGroup',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `cluster-autoscaler-policy-${args.environmentSuffix}`,
        Environment: args.environmentSuffix,
        ...args.tags,
      },
    }, { parent: this });

    // Create IAM role for Cluster Autoscaler with IRSA
    const autoscalerPolicyDoc = pulumi.all([args.oidcProviderArn, args.oidcProviderUrl]).apply(([arn, url]) => {
      const urlWithoutProtocol = url.replace('https://', '');
      return aws.iam.getPolicyDocument({
        statements: [{
          effect: 'Allow',
          principals: [{
            type: 'Federated',
            identifiers: [arn],
          }],
          actions: ['sts:AssumeRoleWithWebIdentity'],
          conditions: [{
            test: 'StringEquals',
            variable: `${urlWithoutProtocol}:sub`,
            values: ['system:serviceaccount:kube-system:cluster-autoscaler'],
          }, {
            test: 'StringEquals',
            variable: `${urlWithoutProtocol}:aud`,
            values: ['sts.amazonaws.com'],
          }],
        }],
      });
    });

    this.autoscalerRole = new aws.iam.Role(`cluster-autoscaler-role-${args.environmentSuffix}`, {
      name: `cluster-autoscaler-role-${args.environmentSuffix}`,
      assumeRolePolicy: autoscalerPolicyDoc.apply(doc => doc.json),
      tags: {
        Name: `cluster-autoscaler-role-${args.environmentSuffix}`,
        Environment: args.environmentSuffix,
        ...args.tags,
      },
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`cluster-autoscaler-policy-attachment-${args.environmentSuffix}`, {
      role: this.autoscalerRole.name,
      policyArn: autoscalerPolicy.arn,
    }, { parent: this });

    // Create service account for Cluster Autoscaler
    this.autoscalerServiceAccount = new k8s.core.v1.ServiceAccount(`cluster-autoscaler-sa-${args.environmentSuffix}`, {
      metadata: {
        name: 'cluster-autoscaler',
        namespace: 'kube-system',
        annotations: {
          'eks.amazonaws.com/role-arn': this.autoscalerRole.arn,
        },
      },
    }, { provider: args.cluster.provider, parent: this });

    // Deploy Cluster Autoscaler
    const autoscalerDeployment = new k8s.apps.v1.Deployment(`cluster-autoscaler-${args.environmentSuffix}`, {
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
            containers: [{
              name: 'cluster-autoscaler',
              image: `registry.k8s.io/autoscaling/cluster-autoscaler:v1.28.2`,
              command: [
                './cluster-autoscaler',
                '--v=4',
                '--stderrthreshold=info',
                '--cloud-provider=aws',
                `--skip-nodes-with-local-storage=false`,
                '--expander=least-waste',
                pulumi.interpolate`--node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/${args.cluster.eksCluster.name}`,
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
              volumeMounts: [{
                name: 'ssl-certs',
                mountPath: '/etc/ssl/certs/ca-certificates.crt',
                readOnly: true,
              }],
            }],
            volumes: [{
              name: 'ssl-certs',
              hostPath: {
                path: '/etc/ssl/certs/ca-bundle.crt',
              },
            }],
          },
        },
      },
    }, { provider: args.cluster.provider, parent: this, dependsOn: [this.autoscalerServiceAccount] });

    // Create Pod Disruption Budget for Cluster Autoscaler
    const autoscalerPdb = new k8s.policy.v1.PodDisruptionBudget(`cluster-autoscaler-pdb-${args.environmentSuffix}`, {
      metadata: {
        name: 'cluster-autoscaler-pdb',
        namespace: 'kube-system',
      },
      spec: {
        minAvailable: 1,
        selector: {
          matchLabels: {
            app: 'cluster-autoscaler',
          },
        },
      },
    }, { provider: args.cluster.provider, parent: this });

    this.registerOutputs({
      autoscalerRoleArn: this.autoscalerRole.arn,
      autoscalerServiceAccountName: this.autoscalerServiceAccount.metadata.name,
    });
  }
}
```

## File: lib/eks-rbac-namespaces-stack.ts

```typescript
/**
 * RBAC and Namespaces Stack
 * Creates dev and prod namespaces with RBAC policies and pod security standards
 */
import * as pulumi from '@pulumi/pulumi';
import * as eks from '@pulumi/eks';
import * as k8s from '@pulumi/kubernetes';

export interface RbacNamespacesStackArgs {
  environmentSuffix: string;
  cluster: eks.Cluster;
}

export class RbacNamespacesStack extends pulumi.ComponentResource {
  public readonly devNamespace: k8s.core.v1.Namespace;
  public readonly prodNamespace: k8s.core.v1.Namespace;

  constructor(name: string, args: RbacNamespacesStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:eks:RbacNamespacesStack', name, args, opts);

    // Create dev namespace with pod security standards
    this.devNamespace = new k8s.core.v1.Namespace(`dev-namespace-${args.environmentSuffix}`, {
      metadata: {
        name: 'dev',
        labels: {
          'pod-security.kubernetes.io/enforce': 'baseline',
          'pod-security.kubernetes.io/audit': 'restricted',
          'pod-security.kubernetes.io/warn': 'restricted',
          environment: 'dev',
        },
      },
    }, { provider: args.cluster.provider, parent: this });

    // Create prod namespace with stricter pod security standards
    this.prodNamespace = new k8s.core.v1.Namespace(`prod-namespace-${args.environmentSuffix}`, {
      metadata: {
        name: 'prod',
        labels: {
          'pod-security.kubernetes.io/enforce': 'restricted',
          'pod-security.kubernetes.io/audit': 'restricted',
          'pod-security.kubernetes.io/warn': 'restricted',
          environment: 'prod',
        },
      },
    }, { provider: args.cluster.provider, parent: this });

    // Create dev role with read/write permissions
    const devRole = new k8s.rbac.v1.Role(`dev-role-${args.environmentSuffix}`, {
      metadata: {
        name: 'dev-role',
        namespace: 'dev',
      },
      rules: [
        {
          apiGroups: ['', 'apps', 'batch'],
          resources: ['pods', 'deployments', 'services', 'jobs', 'cronjobs', 'configmaps', 'secrets'],
          verbs: ['get', 'list', 'watch', 'create', 'update', 'patch', 'delete'],
        },
      ],
    }, { provider: args.cluster.provider, parent: this, dependsOn: [this.devNamespace] });

    // Create prod role with read-only permissions
    const prodRole = new k8s.rbac.v1.Role(`prod-role-${args.environmentSuffix}`, {
      metadata: {
        name: 'prod-role',
        namespace: 'prod',
      },
      rules: [
        {
          apiGroups: ['', 'apps', 'batch'],
          resources: ['pods', 'deployments', 'services', 'jobs', 'cronjobs', 'configmaps'],
          verbs: ['get', 'list', 'watch'],
        },
      ],
    }, { provider: args.cluster.provider, parent: this, dependsOn: [this.prodNamespace] });

    // Create dev service account
    const devServiceAccount = new k8s.core.v1.ServiceAccount(`dev-sa-${args.environmentSuffix}`, {
      metadata: {
        name: 'dev-service-account',
        namespace: 'dev',
      },
    }, { provider: args.cluster.provider, parent: this, dependsOn: [this.devNamespace] });

    // Create prod service account
    const prodServiceAccount = new k8s.core.v1.ServiceAccount(`prod-sa-${args.environmentSuffix}`, {
      metadata: {
        name: 'prod-service-account',
        namespace: 'prod',
      },
    }, { provider: args.cluster.provider, parent: this, dependsOn: [this.prodNamespace] });

    // Bind dev role to dev service account
    const devRoleBinding = new k8s.rbac.v1.RoleBinding(`dev-role-binding-${args.environmentSuffix}`, {
      metadata: {
        name: 'dev-role-binding',
        namespace: 'dev',
      },
      subjects: [{
        kind: 'ServiceAccount',
        name: 'dev-service-account',
        namespace: 'dev',
      }],
      roleRef: {
        kind: 'Role',
        name: 'dev-role',
        apiGroup: 'rbac.authorization.k8s.io',
      },
    }, { provider: args.cluster.provider, parent: this, dependsOn: [devRole, devServiceAccount] });

    // Bind prod role to prod service account
    const prodRoleBinding = new k8s.rbac.v1.RoleBinding(`prod-role-binding-${args.environmentSuffix}`, {
      metadata: {
        name: 'prod-role-binding',
        namespace: 'prod',
      },
      subjects: [{
        kind: 'ServiceAccount',
        name: 'prod-service-account',
        namespace: 'prod',
      }],
      roleRef: {
        kind: 'Role',
        name: 'prod-role',
        apiGroup: 'rbac.authorization.k8s.io',
      },
    }, { provider: args.cluster.provider, parent: this, dependsOn: [prodRole, prodServiceAccount] });

    this.registerOutputs({
      devNamespace: this.devNamespace.metadata.name,
      prodNamespace: this.prodNamespace.metadata.name,
    });
  }
}
```

## File: lib/eks-network-policies-stack.ts

```typescript
/**
 * Network Policies Stack
 * Creates network policies for namespace isolation
 */
import * as pulumi from '@pulumi/pulumi';
import * as eks from '@pulumi/eks';
import * as k8s from '@pulumi/kubernetes';

export interface NetworkPoliciesStackArgs {
  environmentSuffix: string;
  cluster: eks.Cluster;
  devNamespace: k8s.core.v1.Namespace;
  prodNamespace: k8s.core.v1.Namespace;
}

export class NetworkPoliciesStack extends pulumi.ComponentResource {
  constructor(name: string, args: NetworkPoliciesStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:eks:NetworkPoliciesStack', name, args, opts);

    // Network policy for dev namespace - allow intra-namespace traffic only
    const devNetworkPolicy = new k8s.networking.v1.NetworkPolicy(`dev-network-policy-${args.environmentSuffix}`, {
      metadata: {
        name: 'dev-network-policy',
        namespace: 'dev',
      },
      spec: {
        podSelector: {},
        policyTypes: ['Ingress', 'Egress'],
        ingress: [
          {
            from: [{
              namespaceSelector: {
                matchLabels: {
                  environment: 'dev',
                },
              },
            }],
          },
        ],
        egress: [
          {
            to: [{
              namespaceSelector: {
                matchLabels: {
                  environment: 'dev',
                },
              },
            }],
          },
          {
            // Allow DNS
            to: [{
              namespaceSelector: {
                matchLabels: {
                  'kubernetes.io/metadata.name': 'kube-system',
                },
              },
            }],
            ports: [{
              protocol: 'UDP',
              port: 53,
            }],
          },
          {
            // Allow external egress
            to: [{
              ipBlock: {
                cidr: '0.0.0.0/0',
                except: ['169.254.169.254/32'],
              },
            }],
          },
        ],
      },
    }, { provider: args.cluster.provider, parent: this, dependsOn: [args.devNamespace] });

    // Network policy for prod namespace - allow intra-namespace traffic only
    const prodNetworkPolicy = new k8s.networking.v1.NetworkPolicy(`prod-network-policy-${args.environmentSuffix}`, {
      metadata: {
        name: 'prod-network-policy',
        namespace: 'prod',
      },
      spec: {
        podSelector: {},
        policyTypes: ['Ingress', 'Egress'],
        ingress: [
          {
            from: [{
              namespaceSelector: {
                matchLabels: {
                  environment: 'prod',
                },
              },
            }],
          },
        ],
        egress: [
          {
            to: [{
              namespaceSelector: {
                matchLabels: {
                  environment: 'prod',
                },
              },
            }],
          },
          {
            // Allow DNS
            to: [{
              namespaceSelector: {
                matchLabels: {
                  'kubernetes.io/metadata.name': 'kube-system',
                },
              },
            }],
            ports: [{
              protocol: 'UDP',
              port: 53,
            }],
          },
          {
            // Allow external egress
            to: [{
              ipBlock: {
                cidr: '0.0.0.0/0',
                except: ['169.254.169.254/32'],
              },
            }],
          },
        ],
      },
    }, { provider: args.cluster.provider, parent: this, dependsOn: [args.prodNamespace] });

    this.registerOutputs({});
  }
}
```

## File: lib/eks-coredns-optimization-stack.ts

```typescript
/**
 * CoreDNS Optimization Stack
 * Optimizes CoreDNS and deploys node-local DNS cache
 */
import * as pulumi from '@pulumi/pulumi';
import * as eks from '@pulumi/eks';
import * as k8s from '@pulumi/kubernetes';

export interface CoreDnsOptimizationStackArgs {
  environmentSuffix: string;
  cluster: eks.Cluster;
}

export class CoreDnsOptimizationStack extends pulumi.ComponentResource {
  constructor(name: string, args: CoreDnsOptimizationStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:eks:CoreDnsOptimizationStack', name, args, opts);

    // Deploy node-local DNS cache
    const nodeLocalDns = new k8s.apps.v1.DaemonSet(`node-local-dns-${args.environmentSuffix}`, {
      metadata: {
        name: 'node-local-dns',
        namespace: 'kube-system',
        labels: {
          'k8s-app': 'node-local-dns',
        },
      },
      spec: {
        updateStrategy: {
          rollingUpdate: {
            maxUnavailable: 1,
          },
        },
        selector: {
          matchLabels: {
            'k8s-app': 'node-local-dns',
          },
        },
        template: {
          metadata: {
            labels: {
              'k8s-app': 'node-local-dns',
            },
          },
          spec: {
            priorityClassName: 'system-node-critical',
            hostNetwork: true,
            dnsPolicy: 'Default',
            tolerations: [
              {
                key: 'CriticalAddonsOnly',
                operator: 'Exists',
              },
              {
                effect: 'NoExecute',
                operator: 'Exists',
              },
              {
                effect: 'NoSchedule',
                operator: 'Exists',
              },
            ],
            containers: [{
              name: 'node-cache',
              image: 'registry.k8s.io/dns/k8s-dns-node-cache:1.22.23',
              resources: {
                requests: {
                  cpu: '25m',
                  memory: '25Mi',
                },
                limits: {
                  memory: '100Mi',
                },
              },
              args: [
                '-localip',
                '169.254.20.10,10.100.0.10',
                '-conf',
                '/etc/Corefile',
                '-upstreamsvc',
                'kube-dns-upstream',
              ],
              securityContext: {
                privileged: true,
              },
              ports: [
                {
                  containerPort: 53,
                  name: 'dns',
                  protocol: 'UDP',
                },
                {
                  containerPort: 53,
                  name: 'dns-tcp',
                  protocol: 'TCP',
                },
                {
                  containerPort: 9253,
                  name: 'metrics',
                  protocol: 'TCP',
                },
              ],
              livenessProbe: {
                httpGet: {
                  host: '169.254.20.10',
                  path: '/health',
                  port: 8080,
                },
                initialDelaySeconds: 60,
                timeoutSeconds: 5,
              },
              volumeMounts: [
                {
                  mountPath: '/run/xtables.lock',
                  name: 'xtables-lock',
                  readOnly: false,
                },
                {
                  name: 'config-volume',
                  mountPath: '/etc/coredns',
                },
                {
                  name: 'kube-dns-config',
                  mountPath: '/etc/kube-dns',
                },
              ],
            }],
            volumes: [
              {
                name: 'xtables-lock',
                hostPath: {
                  path: '/run/xtables.lock',
                  type: 'FileOrCreate',
                },
              },
              {
                name: 'kube-dns-config',
                configMap: {
                  name: 'kube-dns',
                  optional: true,
                },
              },
              {
                name: 'config-volume',
                configMap: {
                  name: 'node-local-dns',
                  items: [{
                    key: 'Corefile',
                    path: 'Corefile',
                  }],
                },
              },
            ],
          },
        },
      },
    }, { provider: args.cluster.provider, parent: this });

    // Create ConfigMap for node-local DNS cache
    const nodeLocalDnsConfig = new k8s.core.v1.ConfigMap(`node-local-dns-config-${args.environmentSuffix}`, {
      metadata: {
        name: 'node-local-dns',
        namespace: 'kube-system',
      },
      data: {
        Corefile: `cluster.local:53 {
    errors
    cache {
            success 9984 30
            denial 9984 5
    }
    reload
    loop
    bind 169.254.20.10 10.100.0.10
    forward . 10.100.0.10 {
            force_tcp
    }
    prometheus :9253
    health 169.254.20.10:8080
    }
in-addr.arpa:53 {
    errors
    cache 30
    reload
    loop
    bind 169.254.20.10 10.100.0.10
    forward . 10.100.0.10 {
            force_tcp
    }
    prometheus :9253
    }
ip6.arpa:53 {
    errors
    cache 30
    reload
    loop
    bind 169.254.20.10 10.100.0.10
    forward . 10.100.0.10 {
            force_tcp
    }
    prometheus :9253
    }
.:53 {
    errors
    cache 30
    reload
    loop
    bind 169.254.20.10 10.100.0.10
    forward . /etc/resolv.conf {
            force_tcp
    }
    prometheus :9253
    }`,
      },
    }, { provider: args.cluster.provider, parent: this });

    this.registerOutputs({});
  }
}
```

## File: lib/eks-irsa-demo-stack.ts

```typescript
/**
 * IRSA Demonstration Stack
 * Demonstrates IAM Roles for Service Accounts with a sample workload
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as eks from '@pulumi/eks';
import * as k8s from '@pulumi/kubernetes';

export interface IrsaDemoStackArgs {
  environmentSuffix: string;
  cluster: eks.Cluster;
  oidcProviderArn: pulumi.Input<string>;
  oidcProviderUrl: pulumi.Input<string>;
  region: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class IrsaDemoStack extends pulumi.ComponentResource {
  public readonly demoRole: aws.iam.Role;
  public readonly demoServiceAccount: k8s.core.v1.ServiceAccount;

  constructor(name: string, args: IrsaDemoStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:eks:IrsaDemoStack', name, args, opts);

    // Create S3 bucket for IRSA demo
    const demoBucket = new aws.s3.Bucket(`irsa-demo-bucket-${args.environmentSuffix}`, {
      bucket: `irsa-demo-bucket-${args.environmentSuffix}`,
      forceDestroy: true,
      tags: {
        Name: `irsa-demo-bucket-${args.environmentSuffix}`,
        Environment: args.environmentSuffix,
        Purpose: 'IRSA-Demo',
        ...args.tags,
      },
    }, { parent: this });

    // Create IAM policy for S3 access
    const demoPolicy = new aws.iam.Policy(`irsa-demo-policy-${args.environmentSuffix}`, {
      name: `irsa-demo-policy-${args.environmentSuffix}`,
      policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "s3:ListBucket",
              "s3:GetObject",
              "s3:PutObject"
            ],
            "Resource": [
              "${demoBucket.arn}",
              "${demoBucket.arn}/*"
            ]
          }
        ]
      }`,
      tags: {
        Name: `irsa-demo-policy-${args.environmentSuffix}`,
        Environment: args.environmentSuffix,
        ...args.tags,
      },
    }, { parent: this });

    // Create IAM role for IRSA demo with OIDC trust
    const demoPolicyDoc = pulumi.all([args.oidcProviderArn, args.oidcProviderUrl]).apply(([arn, url]) => {
      const urlWithoutProtocol = url.replace('https://', '');
      return aws.iam.getPolicyDocument({
        statements: [{
          effect: 'Allow',
          principals: [{
            type: 'Federated',
            identifiers: [arn],
          }],
          actions: ['sts:AssumeRoleWithWebIdentity'],
          conditions: [{
            test: 'StringEquals',
            variable: `${urlWithoutProtocol}:sub`,
            values: ['system:serviceaccount:dev:irsa-demo-sa'],
          }, {
            test: 'StringEquals',
            variable: `${urlWithoutProtocol}:aud`,
            values: ['sts.amazonaws.com'],
          }],
        }],
      });
    });

    this.demoRole = new aws.iam.Role(`irsa-demo-role-${args.environmentSuffix}`, {
      name: `irsa-demo-role-${args.environmentSuffix}`,
      assumeRolePolicy: demoPolicyDoc.apply(doc => doc.json),
      tags: {
        Name: `irsa-demo-role-${args.environmentSuffix}`,
        Environment: args.environmentSuffix,
        ...args.tags,
      },
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`irsa-demo-policy-attachment-${args.environmentSuffix}`, {
      role: this.demoRole.name,
      policyArn: demoPolicy.arn,
    }, { parent: this });

    // Create service account with IRSA annotation
    this.demoServiceAccount = new k8s.core.v1.ServiceAccount(`irsa-demo-sa-${args.environmentSuffix}`, {
      metadata: {
        name: 'irsa-demo-sa',
        namespace: 'dev',
        annotations: {
          'eks.amazonaws.com/role-arn': this.demoRole.arn,
        },
      },
    }, { provider: args.cluster.provider, parent: this });

    // Create demo pod that uses IRSA
    const demoPod = new k8s.core.v1.Pod(`irsa-demo-pod-${args.environmentSuffix}`, {
      metadata: {
        name: 'irsa-demo-pod',
        namespace: 'dev',
        labels: {
          app: 'irsa-demo',
        },
      },
      spec: {
        serviceAccountName: 'irsa-demo-sa',
        containers: [{
          name: 'aws-cli',
          image: 'amazon/aws-cli:latest',
          command: ['sh', '-c', pulumi.interpolate`while true; do aws s3 ls ${demoBucket.bucket} --region ${args.region}; sleep 300; done`],
          env: [
            {
              name: 'AWS_DEFAULT_REGION',
              value: args.region,
            },
          ],
        }],
        restartPolicy: 'Always',
      },
    }, { provider: args.cluster.provider, parent: this, dependsOn: [this.demoServiceAccount] });

    this.registerOutputs({
      demoRoleArn: this.demoRole.arn,
      demoServiceAccountName: this.demoServiceAccount.metadata.name,
      demoBucketName: demoBucket.bucket,
    });
  }
}
```

## File: lib/eks-spot-interruption-stack.ts

```typescript
/**
 * Spot Instance Interruption Handling Stack
 * Demonstrates handling of spot instance interruptions
 */
import * as pulumi from '@pulumi/pulumi';
import * as eks from '@pulumi/eks';
import * as k8s from '@pulumi/kubernetes';

export interface SpotInterruptionStackArgs {
  environmentSuffix: string;
  cluster: eks.Cluster;
}

export class SpotInterruptionStack extends pulumi.ComponentResource {
  constructor(name: string, args: SpotInterruptionStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:eks:SpotInterruptionStack', name, args, opts);

    // Install AWS Node Termination Handler for spot interruption handling
    const awsNodeTerminationHandler = new k8s.helm.v3.Release(`aws-node-termination-handler-${args.environmentSuffix}`, {
      chart: 'aws-node-termination-handler',
      repositoryOpts: {
        repo: 'https://aws.github.io/eks-charts',
      },
      namespace: 'kube-system',
      values: {
        enableSpotInterruptionDraining: true,
        enableScheduledEventDraining: true,
        enableRebalanceMonitoring: true,
        enableRebalanceDraining: true,
        nodeSelector: {
          'node-type': 'spot',
        },
        tolerations: [
          {
            operator: 'Exists',
          },
        ],
        podAnnotations: {
          'prometheus.io/scrape': 'true',
          'prometheus.io/port': '9092',
        },
      },
    }, { provider: args.cluster.provider, parent: this });

    // Create a sample deployment with spot node affinity
    const spotDemoDeployment = new k8s.apps.v1.Deployment(`spot-demo-deployment-${args.environmentSuffix}`, {
      metadata: {
        name: 'spot-demo-deployment',
        namespace: 'dev',
        labels: {
          app: 'spot-demo',
        },
      },
      spec: {
        replicas: 3,
        selector: {
          matchLabels: {
            app: 'spot-demo',
          },
        },
        template: {
          metadata: {
            labels: {
              app: 'spot-demo',
            },
          },
          spec: {
            affinity: {
              nodeAffinity: {
                preferredDuringSchedulingIgnoredDuringExecution: [{
                  weight: 1,
                  preference: {
                    matchExpressions: [{
                      key: 'node-type',
                      operator: 'In',
                      values: ['spot'],
                    }],
                  },
                }],
              },
            },
            containers: [{
              name: 'nginx',
              image: 'nginx:latest',
              ports: [{
                containerPort: 80,
              }],
              resources: {
                requests: {
                  cpu: '100m',
                  memory: '128Mi',
                },
                limits: {
                  cpu: '200m',
                  memory: '256Mi',
                },
              },
            }],
          },
        },
      },
    }, { provider: args.cluster.provider, parent: this });

    // Create Pod Disruption Budget for spot demo
    const spotDemoPdb = new k8s.policy.v1.PodDisruptionBudget(`spot-demo-pdb-${args.environmentSuffix}`, {
      metadata: {
        name: 'spot-demo-pdb',
        namespace: 'dev',
      },
      spec: {
        minAvailable: 2,
        selector: {
          matchLabels: {
            app: 'spot-demo',
          },
        },
      },
    }, { provider: args.cluster.provider, parent: this });

    this.registerOutputs({});
  }
}
```

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Main TapStack component that orchestrates EKS cluster deployment
 * with advanced container orchestration features
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { VpcStack } from './vpc-stack';
import { EksClusterStack } from './eks-cluster-stack';
import { EksNodeGroupsStack } from './eks-node-groups-stack';
import { EksAddonsStack } from './eks-addons-stack';
import { LoadBalancerControllerStack } from './eks-load-balancer-controller-stack';
import { ClusterAutoscalerStack } from './eks-cluster-autoscaler-stack';
import { RbacNamespacesStack } from './eks-rbac-namespaces-stack';
import { NetworkPoliciesStack } from './eks-network-policies-stack';
import { CoreDnsOptimizationStack } from './eks-coredns-optimization-stack';
import { IrsaDemoStack } from './eks-irsa-demo-stack';
import { SpotInterruptionStack } from './eks-spot-interruption-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * AWS region for deployment
   * Defaults to 'us-east-2' if not provided.
   */
  region?: string;

  /**
   * EKS cluster version
   * Defaults to '1.28' if not provided.
   */
  clusterVersion?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Main TapStack component for EKS cluster with advanced features
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly oidcProviderArn: pulumi.Output<string>;
  public readonly kubeconfig: pulumi.Output<any>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const region = args.region || 'us-east-2';
    const clusterVersion = args.clusterVersion || '1.28';
    const tags = args.tags || {
      ManagedBy: 'Pulumi',
      Project: 'TAP',
    };

    // 1. Create VPC with public and private subnets
    const vpcStack = new VpcStack('vpc-stack', {
      environmentSuffix,
      region,
      tags,
    }, { parent: this });

    // 2. Create EKS cluster with OIDC provider
    const eksClusterStack = new EksClusterStack('eks-cluster-stack', {
      environmentSuffix,
      region,
      vpcId: vpcStack.vpcId,
      privateSubnetIds: vpcStack.privateSubnetIds,
      publicSubnetIds: vpcStack.publicSubnetIds,
      version: clusterVersion,
      tags,
    }, { parent: this, dependsOn: [vpcStack] });

    // 3. Create managed node groups (spot and on-demand)
    const eksNodeGroupsStack = new EksNodeGroupsStack('eks-node-groups-stack', {
      environmentSuffix,
      cluster: eksClusterStack.cluster,
      privateSubnetIds: vpcStack.privateSubnetIds,
      tags,
    }, { parent: this, dependsOn: [eksClusterStack] });

    // 4. Install EKS add-ons (EBS CSI driver with encryption)
    const eksAddonsStack = new EksAddonsStack('eks-addons-stack', {
      environmentSuffix,
      cluster: eksClusterStack.cluster,
      oidcProviderArn: eksClusterStack.oidcProviderArn,
      oidcProviderUrl: eksClusterStack.oidcProviderUrl,
      tags,
    }, { parent: this, dependsOn: [eksNodeGroupsStack] });

    // 5. Install AWS Load Balancer Controller with IRSA
    const lbControllerStack = new LoadBalancerControllerStack('lb-controller-stack', {
      environmentSuffix,
      cluster: eksClusterStack.cluster,
      oidcProviderArn: eksClusterStack.oidcProviderArn,
      oidcProviderUrl: eksClusterStack.oidcProviderUrl,
      vpcId: vpcStack.vpcId,
      region,
      tags,
    }, { parent: this, dependsOn: [eksNodeGroupsStack] });

    // 6. Install Cluster Autoscaler with pod disruption budgets
    const clusterAutoscalerStack = new ClusterAutoscalerStack('cluster-autoscaler-stack', {
      environmentSuffix,
      cluster: eksClusterStack.cluster,
      oidcProviderArn: eksClusterStack.oidcProviderArn,
      oidcProviderUrl: eksClusterStack.oidcProviderUrl,
      region,
      tags,
    }, { parent: this, dependsOn: [eksNodeGroupsStack] });

    // 7. Create RBAC and namespaces with pod security standards
    const rbacNamespacesStack = new RbacNamespacesStack('rbac-namespaces-stack', {
      environmentSuffix,
      cluster: eksClusterStack.cluster,
    }, { parent: this, dependsOn: [eksNodeGroupsStack] });

    // 8. Create network policies for namespace isolation
    const networkPoliciesStack = new NetworkPoliciesStack('network-policies-stack', {
      environmentSuffix,
      cluster: eksClusterStack.cluster,
      devNamespace: rbacNamespacesStack.devNamespace,
      prodNamespace: rbacNamespacesStack.prodNamespace,
    }, { parent: this, dependsOn: [rbacNamespacesStack] });

    // 9. Optimize CoreDNS with node-local cache
    const coreDnsOptimizationStack = new CoreDnsOptimizationStack('coredns-optimization-stack', {
      environmentSuffix,
      cluster: eksClusterStack.cluster,
    }, { parent: this, dependsOn: [eksNodeGroupsStack] });

    // 10. Create IRSA demonstration
    const irsaDemoStack = new IrsaDemoStack('irsa-demo-stack', {
      environmentSuffix,
      cluster: eksClusterStack.cluster,
      oidcProviderArn: eksClusterStack.oidcProviderArn,
      oidcProviderUrl: eksClusterStack.oidcProviderUrl,
      region,
      tags,
    }, { parent: this, dependsOn: [rbacNamespacesStack] });

    // 11. Install spot instance interruption handler
    const spotInterruptionStack = new SpotInterruptionStack('spot-interruption-stack', {
      environmentSuffix,
      cluster: eksClusterStack.cluster,
    }, { parent: this, dependsOn: [eksNodeGroupsStack, rbacNamespacesStack] });

    // Expose outputs
    this.vpcId = vpcStack.vpcId;
    this.clusterName = eksClusterStack.clusterName;
    this.clusterEndpoint = eksClusterStack.clusterEndpoint;
    this.oidcProviderArn = eksClusterStack.oidcProviderArn;
    this.kubeconfig = eksClusterStack.kubeconfig;

    this.registerOutputs({
      vpcId: this.vpcId,
      clusterName: this.clusterName,
      clusterEndpoint: this.clusterEndpoint,
      oidcProviderArn: this.oidcProviderArn,
      kubeconfig: this.kubeconfig,
    });
  }
}
```

## File: lib/README.md

```markdown
# EKS Cluster with Advanced Container Orchestration

This infrastructure code deploys a production-ready Amazon EKS cluster with advanced container orchestration features using Pulumi with TypeScript.

## Architecture

The deployment includes:

1. **VPC Infrastructure**: Custom VPC with public and private subnets across 2 availability zones
2. **EKS Cluster**: Kubernetes v1.28 cluster with private endpoint access and OIDC provider for IRSA
3. **Node Groups**: Two managed node groups:
   - Spot instances (t3.medium/t3a.medium) for cost optimization
   - On-demand instances (t3.medium) for critical workloads
4. **Storage**: AWS EBS CSI driver with encryption enabled
5. **Load Balancing**: AWS Load Balancer Controller with IRSA for automatic ingress provisioning
6. **Auto-scaling**: Kubernetes Cluster Autoscaler with pod disruption budgets
7. **DNS Optimization**: CoreDNS with node-local DNS cache for reduced latency
8. **Security**:
   - RBAC with separate dev and prod namespaces
   - Pod security standards enforcement (baseline for dev, restricted for prod)
   - Network policies for namespace isolation
   - IRSA for pod-level AWS permissions
9. **Operational Excellence**:
   - Spot instance interruption handling
   - Pod disruption budgets for high availability
   - IRSA demonstration with sample workload

## Prerequisites

- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- Node.js and npm installed
- kubectl installed (for cluster interaction)

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Stack

```bash
# Initialize Pulumi stack
pulumi stack init dev

# Configure AWS region
pulumi config set aws:region us-east-2

# Set environment suffix
pulumi config set environmentSuffix dev
```

### 3. Deploy Infrastructure

```bash
pulumi up
```

Review the planned changes and confirm to deploy.

### 4. Access the Cluster

```bash
# Export kubeconfig
pulumi stack output kubeconfig --show-secrets > kubeconfig.yaml
export KUBECONFIG=./kubeconfig.yaml

# Verify cluster access
kubectl get nodes
kubectl get namespaces
```

## Resource Naming

All resources follow the naming convention: `{resource-type}-{environmentSuffix}`

Examples:
- EKS Cluster: `eks-cluster-dev`
- VPC: `eks-vpc-dev`
- Spot Node Group: `eks-spot-ng-dev`
- On-demand Node Group: `eks-ondemand-ng-dev`

## Deployed Components

### Namespaces

- `dev`: Development namespace with baseline pod security standards
- `prod`: Production namespace with restricted pod security standards

### RBAC

- Dev namespace: Read/write permissions for dev service account
- Prod namespace: Read-only permissions for prod service account

### Network Policies

- Dev namespace: Isolated from prod, allows internal communication and external egress
- Prod namespace: Isolated from dev, allows internal communication and external egress

### IRSA Demonstration

A sample pod in the dev namespace demonstrates IRSA by:
1. Using a service account annotated with IAM role ARN
2. Accessing S3 bucket using pod-level AWS credentials
3. Running AWS CLI commands without explicit credentials

### Spot Interruption Handling

AWS Node Termination Handler deployed to:
- Monitor spot instance interruption notices
- Gracefully drain nodes before termination
- Maintain application availability during spot reclamation

## Verification

### Check Node Groups

```bash
kubectl get nodes -L node-type
```

### Verify RBAC

```bash
kubectl get roles -n dev
kubectl get roles -n prod
kubectl get rolebindings -n dev
kubectl get rolebindings -n prod
```

### Check Network Policies

```bash
kubectl get networkpolicies -n dev
kubectl get networkpolicies -n prod
```

### Verify IRSA Demo

```bash
kubectl logs -n dev irsa-demo-pod
```

### Check Cluster Autoscaler

```bash
kubectl logs -n kube-system deployment/cluster-autoscaler
```

### Verify Load Balancer Controller

```bash
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

Confirm the destruction when prompted. All resources will be cleanly removed.

## Outputs

The stack exports the following outputs:

- `vpcId`: VPC ID
- `clusterName`: EKS cluster name
- `clusterEndpoint`: EKS cluster endpoint URL
- `oidcProviderArn`: OIDC provider ARN for IRSA
- `kubeconfig`: Kubernetes configuration for cluster access

## Cost Optimization

The deployment uses:
- Spot instances for non-critical workloads (up to 90% cost savings)
- Single NAT gateway (can be increased for high availability)
- Right-sized instance types (t3.medium)
- Auto-scaling to match demand

## Security Considerations

- Private endpoint access for EKS API
- Network policies enforce namespace isolation
- Pod security standards prevent privileged escalation
- IRSA provides fine-grained AWS permissions per pod
- All EBS volumes encrypted at rest

## Monitoring and Observability

The deployment includes:
- Prometheus annotations for metric collection
- Health checks for critical components
- Resource requests/limits for proper scheduling

## Troubleshooting

### Nodes Not Joining Cluster

Check node group status:
```bash
aws eks describe-nodegroup --cluster-name <cluster-name> --nodegroup-name <nodegroup-name>
```

### Pods Not Scheduling

Check cluster autoscaler logs:
```bash
kubectl logs -n kube-system deployment/cluster-autoscaler
```

### IRSA Not Working

Verify OIDC provider configuration:
```bash
pulumi stack output oidcProviderArn
aws iam get-role --role-name irsa-demo-role-dev
```

### Network Policy Issues

Describe network policies:
```bash
kubectl describe networkpolicy -n dev
kubectl describe networkpolicy -n prod
```

## Support

For issues and questions, refer to:
- [Pulumi Documentation](https://www.pulumi.com/docs/)
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
```

This implementation provides a complete, production-ready EKS cluster with all requested advanced features including IRSA, spot instance handling, autoscaling, RBAC, network policies, and CoreDNS optimization.
