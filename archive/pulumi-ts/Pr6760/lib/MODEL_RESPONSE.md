# Production-Ready EKS Cluster Infrastructure - Implementation

This implementation creates a complete production-grade Amazon EKS cluster with advanced configuration including VPC, managed node groups, OIDC provider, essential add-ons (AWS Load Balancer Controller, EBS CSI Driver, Cluster Autoscaler), CloudWatch Container Insights, and pod security standards.

## Architecture Overview

- **VPC**: 3 public + 3 private subnets across availability zones
- **EKS Cluster**: Kubernetes 1.28+ with all control plane logging
- **Node Groups**: Two managed groups (c7g.large on-demand, c7g.xlarge spot)
- **Add-ons**: Load Balancer Controller, EBS CSI Driver, Cluster Autoscaler
- **Security**: OIDC provider for IRSA, pod security standards, network policies
- **Monitoring**: CloudWatch Container Insights

## File: Pulumi.yaml

```yaml
name: TapStack
runtime:
  name: nodejs
description: Production-ready EKS cluster infrastructure
main: lib/index.ts
```

## File: lib/index.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

const stack = new TapStack('eks-cluster', {
  environmentSuffix,
  tags: {
    Environment: environmentSuffix,
    ManagedBy: 'Pulumi',
    Project: 'EKS-Production',
  },
});

export const vpcId = stack.vpcId;
export const clusterName = stack.clusterName;
export const clusterEndpoint = stack.clusterEndpoint;
export const clusterOidcIssuer = stack.clusterOidcIssuer;
export const kubeconfig = stack.kubeconfig;
export const clusterSecurityGroupId = stack.clusterSecurityGroupId;
export const nodeGroupArns = stack.nodeGroupArns;
```

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as k8s from '@pulumi/kubernetes';

export interface TapStackArgs {
  environmentSuffix: string;
  tags?: { [key: string]: string };
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly clusterOidcIssuer: pulumi.Output<string>;
  public readonly kubeconfig: pulumi.Output<any>;
  public readonly clusterSecurityGroupId: pulumi.Output<string>;
  public readonly nodeGroupArns: pulumi.Output<string[]>;

  constructor(name: string, args: TapStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const { environmentSuffix, tags = {} } = args;
    const resourceTags = {
      ...tags,
      EnvironmentSuffix: environmentSuffix,
    };

    // Create VPC with public and private subnets
    const vpc = new awsx.ec2.Vpc(
      `eks-vpc-${environmentSuffix}`,
      {
        numberOfAvailabilityZones: 3,
        natGateways: { strategy: 'Single' }, // Cost optimization with single NAT
        subnetSpecs: [
          {
            type: awsx.ec2.SubnetType.Public,
            cidrMask: 24,
            tags: {
              ...resourceTags,
              Name: `eks-public-subnet-${environmentSuffix}`,
              'kubernetes.io/role/elb': '1',
            },
          },
          {
            type: awsx.ec2.SubnetType.Private,
            cidrMask: 24,
            tags: {
              ...resourceTags,
              Name: `eks-private-subnet-${environmentSuffix}`,
              'kubernetes.io/role/internal-elb': '1',
            },
          },
        ],
        tags: {
          ...resourceTags,
          Name: `eks-vpc-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create IAM role for EKS cluster
    const clusterRole = new aws.iam.Role(
      `eks-cluster-role-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'eks.amazonaws.com',
        }),
        tags: {
          ...resourceTags,
          Name: `eks-cluster-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-cluster-policy-${environmentSuffix}`,
      {
        role: clusterRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-vpc-resource-controller-${environmentSuffix}`,
      {
        role: clusterRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController',
      },
      { parent: this }
    );

    // CloudWatch log group for EKS control plane logs
    const clusterLogGroup = new aws.cloudwatch.LogGroup(
      `eks-cluster-logs-${environmentSuffix}`,
      {
        name: `/aws/eks/eks-cluster-${environmentSuffix}/cluster`,
        retentionInDays: 7,
        tags: {
          ...resourceTags,
          Name: `eks-cluster-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create EKS cluster with all control plane logging enabled
    const cluster = new aws.eks.Cluster(
      `eks-cluster-${environmentSuffix}`,
      {
        name: `eks-cluster-${environmentSuffix}`,
        version: '1.28',
        roleArn: clusterRole.arn,
        vpcConfig: {
          subnetIds: vpc.privateSubnetIds.apply((ids) => ids),
          endpointPrivateAccess: true,
          endpointPublicAccess: true,
        },
        enabledClusterLogTypes: ['api', 'audit', 'authenticator', 'controllerManager', 'scheduler'],
        tags: {
          ...resourceTags,
          Name: `eks-cluster-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [clusterLogGroup] }
    );

    // Create OIDC provider for IRSA
    const oidcProvider = new aws.iam.OpenIdConnectProvider(
      `eks-oidc-provider-${environmentSuffix}`,
      {
        url: cluster.identities[0].oidcs[0].issuer,
        clientIdLists: ['sts.amazonaws.com'],
        thumbprintLists: ['9e99a48a9960b14926bb7f3b02e22da2b0ab7280'],
        tags: {
          ...resourceTags,
          Name: `eks-oidc-provider-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create IAM role for node groups
    const nodeRole = new aws.iam.Role(
      `eks-node-role-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'ec2.amazonaws.com',
        }),
        tags: {
          ...resourceTags,
          Name: `eks-node-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-worker-node-policy-${environmentSuffix}`,
      {
        role: nodeRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-cni-policy-${environmentSuffix}`,
      {
        role: nodeRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-container-registry-policy-${environmentSuffix}`,
      {
        role: nodeRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
      },
      { parent: this }
    );

    // Create managed node group for general workloads (on-demand)
    const generalNodeGroup = new aws.eks.NodeGroup(
      `eks-general-nodes-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        nodeGroupName: `general-nodes-${environmentSuffix}`,
        nodeRoleArn: nodeRole.arn,
        subnetIds: vpc.privateSubnetIds.apply((ids) => ids),
        instanceTypes: ['c7g.large'],
        amiType: 'AL2_ARM_64',
        capacityType: 'ON_DEMAND',
        scalingConfig: {
          desiredSize: 2,
          minSize: 2,
          maxSize: 10,
        },
        updateConfig: {
          maxUnavailablePercentage: 33,
        },
        tags: {
          ...resourceTags,
          Name: `eks-general-nodes-${environmentSuffix}`,
          WorkloadType: 'general',
        },
      },
      { parent: this }
    );

    // Create managed node group for batch processing (spot)
    const batchNodeGroup = new aws.eks.NodeGroup(
      `eks-batch-nodes-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        nodeGroupName: `batch-nodes-${environmentSuffix}`,
        nodeRoleArn: nodeRole.arn,
        subnetIds: vpc.privateSubnetIds.apply((ids) => ids),
        instanceTypes: ['c7g.xlarge'],
        amiType: 'AL2_ARM_64',
        capacityType: 'SPOT',
        scalingConfig: {
          desiredSize: 2,
          minSize: 2,
          maxSize: 10,
        },
        updateConfig: {
          maxUnavailablePercentage: 50,
        },
        taints: [
          {
            key: 'workload',
            value: 'batch',
            effect: 'NO_SCHEDULE',
          },
        ],
        tags: {
          ...resourceTags,
          Name: `eks-batch-nodes-${environmentSuffix}`,
          WorkloadType: 'batch',
        },
      },
      { parent: this }
    );

    // Create Kubernetes provider
    const k8sProvider = new k8s.Provider(
      `k8s-provider-${environmentSuffix}`,
      {
        kubeconfig: pulumi
          .all([cluster.endpoint, cluster.certificateAuthority, cluster.name])
          .apply(([endpoint, ca, name]) =>
            JSON.stringify({
              apiVersion: 'v1',
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
              kind: 'Config',
              users: [
                {
                  name: 'aws',
                  user: {
                    exec: {
                      apiVersion: 'client.authentication.k8s.io/v1beta1',
                      command: 'aws',
                      args: ['eks', 'get-token', '--cluster-name', name],
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Install EBS CSI Driver addon
    const ebsCsiDriverRole = this.createIRSARole(
      `ebs-csi-driver-${environmentSuffix}`,
      cluster,
      oidcProvider,
      'kube-system',
      'ebs-csi-controller-sa',
      resourceTags
    );

    new aws.iam.RolePolicyAttachment(
      `ebs-csi-driver-policy-${environmentSuffix}`,
      {
        role: ebsCsiDriverRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy',
      },
      { parent: this }
    );

    const ebsCsiAddon = new aws.eks.Addon(
      `ebs-csi-addon-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        addonName: 'aws-ebs-csi-driver',
        addonVersion: 'v1.25.0-eksbuild.1',
        serviceAccountRoleArn: ebsCsiDriverRole.arn,
        resolveConflictsOnCreate: 'OVERWRITE',
        resolveConflictsOnUpdate: 'PRESERVE',
        tags: {
          ...resourceTags,
          Name: `ebs-csi-addon-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create IAM role for AWS Load Balancer Controller
    const lbControllerRole = this.createIRSARole(
      `aws-lb-controller-${environmentSuffix}`,
      cluster,
      oidcProvider,
      'kube-system',
      'aws-load-balancer-controller',
      resourceTags
    );

    const lbControllerPolicy = new aws.iam.Policy(
      `aws-lb-controller-policy-${environmentSuffix}`,
      {
        name: `AWSLoadBalancerControllerPolicy-${environmentSuffix}`,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'iam:CreateServiceLinkedRole',
                'ec2:DescribeAccountAttributes',
                'ec2:DescribeAddresses',
                'ec2:DescribeAvailabilityZones',
                'ec2:DescribeInternetGateways',
                'ec2:DescribeVpcs',
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
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['ec2:CreateSecurityGroup'],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['ec2:CreateTags'],
              Resource: 'arn:aws:ec2:*:*:security-group/*',
            },
            {
              Effect: 'Allow',
              Action: ['ec2:CreateTags', 'ec2:DeleteTags'],
              Resource: 'arn:aws:ec2:*:*:security-group/*',
            },
            {
              Effect: 'Allow',
              Action: [
                'ec2:AuthorizeSecurityGroupIngress',
                'ec2:RevokeSecurityGroupIngress',
                'ec2:DeleteSecurityGroup',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'elasticloadbalancing:CreateLoadBalancer',
                'elasticloadbalancing:CreateTargetGroup',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'elasticloadbalancing:CreateListener',
                'elasticloadbalancing:DeleteListener',
                'elasticloadbalancing:CreateRule',
                'elasticloadbalancing:DeleteRule',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'elasticloadbalancing:AddTags',
                'elasticloadbalancing:RemoveTags',
              ],
              Resource: [
                'arn:aws:elasticloadbalancing:*:*:targetgroup/*/*',
                'arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*',
                'arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*',
              ],
            },
            {
              Effect: 'Allow',
              Action: [
                'elasticloadbalancing:ModifyLoadBalancerAttributes',
                'elasticloadbalancing:SetIpAddressType',
                'elasticloadbalancing:SetSecurityGroups',
                'elasticloadbalancing:SetSubnets',
                'elasticloadbalancing:DeleteLoadBalancer',
                'elasticloadbalancing:ModifyTargetGroup',
                'elasticloadbalancing:ModifyTargetGroupAttributes',
                'elasticloadbalancing:DeleteTargetGroup',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'elasticloadbalancing:RegisterTargets',
                'elasticloadbalancing:DeregisterTargets',
              ],
              Resource: 'arn:aws:elasticloadbalancing:*:*:targetgroup/*/*',
            },
            {
              Effect: 'Allow',
              Action: [
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
          ...resourceTags,
          Name: `aws-lb-controller-policy-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `aws-lb-controller-attachment-${environmentSuffix}`,
      {
        role: lbControllerRole.name,
        policyArn: lbControllerPolicy.arn,
      },
      { parent: this }
    );

    // Deploy AWS Load Balancer Controller using Helm
    const lbControllerChart = new k8s.helm.v3.Chart(
      `aws-lb-controller-${environmentSuffix}`,
      {
        chart: 'aws-load-balancer-controller',
        version: '1.6.2',
        namespace: 'kube-system',
        fetchOpts: {
          repo: 'https://aws.github.io/eks-charts',
        },
        values: {
          clusterName: cluster.name,
          serviceAccount: {
            create: true,
            name: 'aws-load-balancer-controller',
            annotations: {
              'eks.amazonaws.com/role-arn': lbControllerRole.arn,
            },
          },
          region: aws.getRegionOutput().name,
          vpcId: vpc.vpcId,
        },
      },
      { provider: k8sProvider, parent: this }
    );

    // Create IAM role for Cluster Autoscaler
    const autoscalerRole = this.createIRSARole(
      `cluster-autoscaler-${environmentSuffix}`,
      cluster,
      oidcProvider,
      'kube-system',
      'cluster-autoscaler',
      resourceTags
    );

    const autoscalerPolicy = new aws.iam.Policy(
      `cluster-autoscaler-policy-${environmentSuffix}`,
      {
        name: `ClusterAutoscalerPolicy-${environmentSuffix}`,
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
                'ec2:DescribeInstanceTypes',
                'ec2:DescribeLaunchTemplateVersions',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'autoscaling:SetDesiredCapacity',
                'autoscaling:TerminateInstanceInAutoScalingGroup',
                'ec2:DescribeImages',
                'ec2:GetInstanceTypesFromInstanceRequirements',
                'eks:DescribeNodegroup',
              ],
              Resource: '*',
            },
          ],
        }),
        tags: {
          ...resourceTags,
          Name: `cluster-autoscaler-policy-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `cluster-autoscaler-attachment-${environmentSuffix}`,
      {
        role: autoscalerRole.name,
        policyArn: autoscalerPolicy.arn,
      },
      { parent: this }
    );

    // Deploy Cluster Autoscaler
    const autoscalerDeployment = new k8s.apps.v1.Deployment(
      `cluster-autoscaler-${environmentSuffix}`,
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
                  image: 'registry.k8s.io/autoscaling/cluster-autoscaler:v1.28.2',
                  command: [
                    './cluster-autoscaler',
                    '--v=4',
                    '--stderrthreshold=info',
                    '--cloud-provider=aws',
                    '--skip-nodes-with-local-storage=false',
                    '--expander=least-waste',
                    pulumi.interpolate`--node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/${cluster.name},k8s.io/cluster-autoscaler/enabled`,
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
      { provider: k8sProvider, parent: this }
    );

    const autoscalerServiceAccount = new k8s.core.v1.ServiceAccount(
      `cluster-autoscaler-sa-${environmentSuffix}`,
      {
        metadata: {
          name: 'cluster-autoscaler',
          namespace: 'kube-system',
          annotations: {
            'eks.amazonaws.com/role-arn': autoscalerRole.arn,
          },
        },
      },
      { provider: k8sProvider, parent: this }
    );

    // Create ClusterRole for Cluster Autoscaler
    const autoscalerClusterRole = new k8s.rbac.v1.ClusterRole(
      `cluster-autoscaler-role-${environmentSuffix}`,
      {
        metadata: {
          name: 'cluster-autoscaler',
        },
        rules: [
          {
            apiGroups: [''],
            resources: ['events', 'endpoints'],
            verbs: ['create', 'patch'],
          },
          {
            apiGroups: [''],
            resources: ['pods/eviction'],
            verbs: ['create'],
          },
          {
            apiGroups: [''],
            resources: ['pods/status'],
            verbs: ['update'],
          },
          {
            apiGroups: [''],
            resources: ['endpoints'],
            resourceNames: ['cluster-autoscaler'],
            verbs: ['get', 'update'],
          },
          {
            apiGroups: [''],
            resources: ['nodes'],
            verbs: ['watch', 'list', 'get', 'update'],
          },
          {
            apiGroups: [''],
            resources: ['namespaces', 'pods', 'services', 'replicationcontrollers', 'persistentvolumeclaims', 'persistentvolumes'],
            verbs: ['watch', 'list', 'get'],
          },
          {
            apiGroups: ['extensions'],
            resources: ['replicasets', 'daemonsets'],
            verbs: ['watch', 'list', 'get'],
          },
          {
            apiGroups: ['policy'],
            resources: ['poddisruptionbudgets'],
            verbs: ['watch', 'list'],
          },
          {
            apiGroups: ['apps'],
            resources: ['statefulsets', 'replicasets', 'daemonsets'],
            verbs: ['watch', 'list', 'get'],
          },
          {
            apiGroups: ['storage.k8s.io'],
            resources: ['storageclasses', 'csinodes', 'csidrivers', 'csistoragecapacities'],
            verbs: ['watch', 'list', 'get'],
          },
          {
            apiGroups: ['batch', 'extensions'],
            resources: ['jobs'],
            verbs: ['get', 'list', 'watch', 'patch'],
          },
          {
            apiGroups: ['coordination.k8s.io'],
            resources: ['leases'],
            verbs: ['create'],
          },
          {
            apiGroups: ['coordination.k8s.io'],
            resourceNames: ['cluster-autoscaler'],
            resources: ['leases'],
            verbs: ['get', 'update'],
          },
        ],
      },
      { provider: k8sProvider, parent: this }
    );

    const autoscalerClusterRoleBinding = new k8s.rbac.v1.ClusterRoleBinding(
      `cluster-autoscaler-binding-${environmentSuffix}`,
      {
        metadata: {
          name: 'cluster-autoscaler',
        },
        roleRef: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'ClusterRole',
          name: 'cluster-autoscaler',
        },
        subjects: [
          {
            kind: 'ServiceAccount',
            name: 'cluster-autoscaler',
            namespace: 'kube-system',
          },
        ],
      },
      { provider: k8sProvider, parent: this }
    );

    // Enable CloudWatch Container Insights
    const containerInsightsNamespace = new k8s.core.v1.Namespace(
      `amazon-cloudwatch-${environmentSuffix}`,
      {
        metadata: {
          name: 'amazon-cloudwatch',
          labels: {
            name: 'amazon-cloudwatch',
          },
        },
      },
      { provider: k8sProvider, parent: this }
    );

    const containerInsightsRole = this.createIRSARole(
      `cloudwatch-agent-${environmentSuffix}`,
      cluster,
      oidcProvider,
      'amazon-cloudwatch',
      'cloudwatch-agent',
      resourceTags
    );

    new aws.iam.RolePolicyAttachment(
      `cloudwatch-agent-policy-${environmentSuffix}`,
      {
        role: containerInsightsRole.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      },
      { parent: this }
    );

    // Deploy CloudWatch agent using Helm
    const cloudwatchChart = new k8s.helm.v3.Chart(
      `cloudwatch-agent-${environmentSuffix}`,
      {
        chart: 'aws-cloudwatch-metrics',
        version: '0.0.10',
        namespace: 'amazon-cloudwatch',
        fetchOpts: {
          repo: 'https://aws.github.io/eks-charts',
        },
        values: {
          clusterName: cluster.name,
          serviceAccount: {
            create: true,
            name: 'cloudwatch-agent',
            annotations: {
              'eks.amazonaws.com/role-arn': containerInsightsRole.arn,
            },
          },
        },
      },
      { provider: k8sProvider, parent: this, dependsOn: [containerInsightsNamespace] }
    );

    // Apply Pod Security Standards
    const pssNamespace = new k8s.core.v1.Namespace(
      `restricted-namespace-${environmentSuffix}`,
      {
        metadata: {
          name: 'restricted',
          labels: {
            'pod-security.kubernetes.io/enforce': 'restricted',
            'pod-security.kubernetes.io/audit': 'restricted',
            'pod-security.kubernetes.io/warn': 'restricted',
          },
        },
      },
      { provider: k8sProvider, parent: this }
    );

    // Create Network Policy for namespace isolation
    const denyAllNetworkPolicy = new k8s.networking.v1.NetworkPolicy(
      `deny-all-${environmentSuffix}`,
      {
        metadata: {
          name: 'deny-all-traffic',
          namespace: 'restricted',
        },
        spec: {
          podSelector: {},
          policyTypes: ['Ingress', 'Egress'],
        },
      },
      { provider: k8sProvider, parent: this, dependsOn: [pssNamespace] }
    );

    // Export outputs
    this.vpcId = vpc.vpcId;
    this.clusterName = cluster.name;
    this.clusterEndpoint = cluster.endpoint;
    this.clusterOidcIssuer = cluster.identities[0].oidcs[0].issuer;
    this.clusterSecurityGroupId = cluster.vpcConfig.clusterSecurityGroupId;
    this.nodeGroupArns = pulumi.all([generalNodeGroup.arn, batchNodeGroup.arn]);

    this.kubeconfig = pulumi
      .all([cluster.endpoint, cluster.certificateAuthority, cluster.name])
      .apply(([endpoint, ca, name]) =>
        JSON.stringify({
          apiVersion: 'v1',
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
          kind: 'Config',
          users: [
            {
              name: 'aws',
              user: {
                exec: {
                  apiVersion: 'client.authentication.k8s.io/v1beta1',
                  command: 'aws',
                  args: ['eks', 'get-token', '--cluster-name', name],
                },
              },
            },
          ],
        })
      );

    this.registerOutputs({
      vpcId: this.vpcId,
      clusterName: this.clusterName,
      clusterEndpoint: this.clusterEndpoint,
      clusterOidcIssuer: this.clusterOidcIssuer,
      kubeconfig: this.kubeconfig,
      clusterSecurityGroupId: this.clusterSecurityGroupId,
      nodeGroupArns: this.nodeGroupArns,
    });
  }

  private createIRSARole(
    name: string,
    cluster: aws.eks.Cluster,
    oidcProvider: aws.iam.OpenIdConnectProvider,
    namespace: string,
    serviceAccountName: string,
    tags: { [key: string]: string }
  ): aws.iam.Role {
    const role = new aws.iam.Role(
      `${name}-role`,
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
                      [`${url.replace('https://', '')}:sub`]: `system:serviceaccount:${namespace}:${serviceAccountName}`,
                      [`${url.replace('https://', '')}:aud`]: 'sts.amazonaws.com',
                    },
                  },
                },
              ],
            })
          ),
        tags: {
          ...tags,
          Name: `${name}-role`,
        },
      },
      { parent: this }
    );

    return role;
  }
}
```

## File: lib/README.md

```markdown
# Production-Ready EKS Cluster Infrastructure

This Pulumi TypeScript project creates a complete production-grade Amazon EKS cluster with advanced configuration for hosting microservices.

## Architecture

### Network Infrastructure
- **VPC**: Custom VPC with 3 public and 3 private subnets across availability zones
- **NAT Gateway**: Single NAT gateway for cost optimization
- **Subnets**: Properly tagged for EKS load balancer discovery

### EKS Cluster
- **Version**: Kubernetes 1.28+
- **Control Plane Logging**: All log types enabled (api, audit, authenticator, controllerManager, scheduler)
- **OIDC Provider**: Configured for IRSA (IAM Roles for Service Accounts)
- **Networking**: Private worker nodes with public API endpoint

### Node Groups
1. **General Workloads**: c7g.large Graviton3 on-demand instances (2-10 nodes)
2. **Batch Processing**: c7g.xlarge Graviton3 spot instances (2-10 nodes) with taint

### Add-ons and Controllers
- **AWS Load Balancer Controller**: IRSA-enabled ingress management
- **EBS CSI Driver**: For persistent volume support
- **Cluster Autoscaler**: Automatic node scaling based on pod demands
- **CloudWatch Container Insights**: Comprehensive cluster monitoring

### Security
- **Pod Security Standards**: Restricted enforcement level by default
- **Network Policies**: Namespace isolation with deny-all default
- **IRSA**: All service accounts use IAM roles for AWS API access
- **Private Nodes**: Worker nodes deployed in private subnets only

## Prerequisites

- Node.js 20+
- Pulumi CLI
- AWS CLI configured with appropriate credentials
- kubectl (for cluster interaction)

## Configuration

Set the environment suffix for resource naming:

```bash
export ENVIRONMENT_SUFFIX=dev
```

Or configure via Pulumi config:

```bash
pulumi config set environmentSuffix dev
```

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Preview changes:
```bash
pulumi preview
```

3. Deploy infrastructure:
```bash
pulumi up
```

4. Get kubeconfig:
```bash
pulumi stack output kubeconfig > kubeconfig.json
export KUBECONFIG=kubeconfig.json
```

5. Verify cluster:
```bash
kubectl get nodes
kubectl get pods -A
```

## Outputs

- `vpcId`: VPC identifier
- `clusterName`: EKS cluster name
- `clusterEndpoint`: Kubernetes API endpoint
- `clusterOidcIssuer`: OIDC provider issuer URL
- `kubeconfig`: Kubernetes configuration for kubectl
- `clusterSecurityGroupId`: Cluster security group
- `nodeGroupArns`: ARNs of managed node groups

## Testing

Run unit tests:
```bash
npm run test:unit
```

Run integration tests:
```bash
npm run test:integration
```

## Cleanup

Destroy all resources:
```bash
pulumi destroy
```

## Cost Optimization

- Single NAT gateway instead of one per AZ
- Spot instances for batch workloads
- Graviton3 (ARM-based) instances for better price/performance
- 7-day CloudWatch log retention

## Scaling

The cluster autoscaler automatically scales node groups between 2-10 nodes based on pod resource requests. Adjust scaling limits in `tap-stack.ts`:

```typescript
scalingConfig: {
  desiredSize: 2,
  minSize: 2,
  maxSize: 10,
}
```

## Troubleshooting

### Pods not scheduling on batch nodes
Batch nodes have a taint. Add toleration to pod spec:
```yaml
tolerations:
- key: workload
  value: batch
  effect: NoSchedule
```

### Load balancer not provisioning
Check AWS Load Balancer Controller logs:
```bash
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

### Cluster autoscaler not working
Verify IAM role and check logs:
```bash
kubectl logs -n kube-system deployment/cluster-autoscaler
```
```

## File: test/tap-stack.unit.test.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    const mockOutputs: Record<string, any> = {
      ...args.inputs,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      id: `${args.name}-id`,
    };

    // Mock specific resource outputs
    switch (args.type) {
      case 'aws:eks/cluster:Cluster':
        mockOutputs.endpoint = 'https://mock-eks-endpoint.eks.amazonaws.com';
        mockOutputs.version = '1.28';
        mockOutputs.certificateAuthority = {
          data: 'mock-certificate-data',
        };
        mockOutputs.identities = [
          {
            oidcs: [
              {
                issuer: 'https://oidc.eks.us-east-1.amazonaws.com/id/MOCK',
              },
            ],
          },
        ];
        mockOutputs.vpcConfig = {
          clusterSecurityGroupId: 'sg-mock-cluster',
          subnetIds: ['subnet-1', 'subnet-2', 'subnet-3'],
        };
        break;
      case 'awsx:ec2:Vpc':
        mockOutputs.vpcId = 'vpc-mock';
        mockOutputs.privateSubnetIds = ['subnet-private-1', 'subnet-private-2', 'subnet-private-3'];
        mockOutputs.publicSubnetIds = ['subnet-public-1', 'subnet-public-2', 'subnet-public-3'];
        break;
      case 'aws:iam/role:Role':
        mockOutputs.name = args.name;
        break;
      case 'aws:eks/nodeGroup:NodeGroup':
        mockOutputs.arn = `arn:aws:eks:us-east-1:123456789012:nodegroup/${args.name}`;
        break;
    }

    return {
      id: mockOutputs.id,
      state: mockOutputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return { name: 'us-east-1' };
    }
    return {};
  },
});

describe('TapStack', () => {
  let stack: TapStack;

  beforeAll(() => {
    stack = new TapStack('test-eks-cluster', {
      environmentSuffix: 'test',
      tags: {
        Environment: 'test',
        ManagedBy: 'Pulumi',
      },
    });
  });

  describe('Stack Creation', () => {
    it('should create a TapStack instance', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should have required output properties', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.clusterName).toBeDefined();
      expect(stack.clusterEndpoint).toBeDefined();
      expect(stack.clusterOidcIssuer).toBeDefined();
      expect(stack.kubeconfig).toBeDefined();
      expect(stack.clusterSecurityGroupId).toBeDefined();
      expect(stack.nodeGroupArns).toBeDefined();
    });
  });

  describe('VPC Configuration', () => {
    it('should create VPC with correct naming convention', (done) => {
      pulumi.all([stack.vpcId]).apply(([vpcId]) => {
        expect(vpcId).toContain('vpc-mock');
        done();
      });
    });
  });

  describe('EKS Cluster Configuration', () => {
    it('should create cluster with environmentSuffix in name', (done) => {
      pulumi.all([stack.clusterName]).apply(([clusterName]) => {
        expect(clusterName).toContain('test');
        done();
      });
    });

    it('should have valid cluster endpoint', (done) => {
      pulumi.all([stack.clusterEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toContain('https://');
        expect(endpoint).toContain('eks.amazonaws.com');
        done();
      });
    });

    it('should have OIDC issuer configured', (done) => {
      pulumi.all([stack.clusterOidcIssuer]).apply(([issuer]) => {
        expect(issuer).toContain('https://oidc.eks');
        done();
      });
    });

    it('should have kubeconfig with required fields', (done) => {
      pulumi.all([stack.kubeconfig]).apply(([kubeconfig]) => {
        const config = JSON.parse(kubeconfig);
        expect(config).toHaveProperty('apiVersion');
        expect(config).toHaveProperty('clusters');
        expect(config).toHaveProperty('contexts');
        expect(config).toHaveProperty('users');
        expect(config.apiVersion).toBe('v1');
        done();
      });
    });
  });

  describe('Node Groups', () => {
    it('should create two node groups', (done) => {
      pulumi.all([stack.nodeGroupArns]).apply(([arns]) => {
        expect(arns).toHaveLength(2);
        done();
      });
    });

    it('should have node group ARNs with correct format', (done) => {
      pulumi.all([stack.nodeGroupArns]).apply(([arns]) => {
        arns.forEach((arn) => {
          expect(arn).toContain('arn:aws:eks');
          expect(arn).toContain('nodegroup');
        });
        done();
      });
    });
  });

  describe('Security Configuration', () => {
    it('should have cluster security group', (done) => {
      pulumi.all([stack.clusterSecurityGroupId]).apply(([sgId]) => {
        expect(sgId).toContain('sg-');
        done();
      });
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in cluster name', (done) => {
      pulumi.all([stack.clusterName]).apply(([name]) => {
        expect(name).toMatch(/eks-cluster-test/);
        done();
      });
    });
  });
});
```

## File: test/tap-stack.int.test.ts

```typescript
import {
  EKSClient,
  DescribeClusterCommand,
  ListNodegroupsCommand,
  DescribeNodegroupCommand,
} from '@aws-sdk/client-eks';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import {
  IAMClient,
  GetOpenIDConnectProviderCommand,
  GetRoleCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import * as fs from 'fs';
import * as path from 'path';

describe('EKS Cluster Integration Tests', () => {
  let outputs: any;
  let eksClient: EKSClient;
  let ec2Client: EC2Client;
  let iamClient: IAMClient;
  let logsClient: CloudWatchLogsClient;
  let clusterName: string;
  let vpcId: string;

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Outputs file not found at ${outputsPath}`);
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    const region = process.env.AWS_REGION || 'us-east-1';
    eksClient = new EKSClient({ region });
    ec2Client = new EC2Client({ region });
    iamClient = new IAMClient({ region });
    logsClient = new CloudWatchLogsClient({ region });

    clusterName = outputs.clusterName;
    vpcId = outputs.vpcId;

    if (!clusterName || !vpcId) {
      throw new Error('Required outputs (clusterName, vpcId) not found in flat-outputs.json');
    }
  });

  afterAll(() => {
    eksClient.destroy();
    ec2Client.destroy();
    iamClient.destroy();
    logsClient.destroy();
  });

  describe('VPC Configuration', () => {
    it('should have VPC created', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0].VpcId).toBe(vpcId);
    });

    it('should have 6 subnets (3 public + 3 private)', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBeGreaterThanOrEqual(6);
    });

    it('should have subnets in multiple availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const azs = new Set(response.Subnets?.map((subnet) => subnet.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('EKS Cluster', () => {
    it('should have cluster created and active', async () => {
      const command = new DescribeClusterCommand({
        name: clusterName,
      });

      const response = await eksClient.send(command);
      expect(response.cluster).toBeDefined();
      expect(response.cluster?.status).toBe('ACTIVE');
      expect(response.cluster?.name).toBe(clusterName);
    });

    it('should have Kubernetes version 1.28 or higher', async () => {
      const command = new DescribeClusterCommand({
        name: clusterName,
      });

      const response = await eksClient.send(command);
      const version = response.cluster?.version;
      expect(version).toBeDefined();

      const versionNumber = parseFloat(version!);
      expect(versionNumber).toBeGreaterThanOrEqual(1.28);
    });

    it('should have all control plane logging enabled', async () => {
      const command = new DescribeClusterCommand({
        name: clusterName,
      });

      const response = await eksClient.send(command);
      const logging = response.cluster?.logging?.clusterLogging;

      expect(logging).toBeDefined();
      const enabledLogs = logging?.[0]?.types || [];

      expect(enabledLogs).toContain('api');
      expect(enabledLogs).toContain('audit');
      expect(enabledLogs).toContain('authenticator');
      expect(enabledLogs).toContain('controllerManager');
      expect(enabledLogs).toContain('scheduler');
    });

    it('should have OIDC provider configured', async () => {
      const describeCommand = new DescribeClusterCommand({
        name: clusterName,
      });

      const clusterResponse = await eksClient.send(describeCommand);
      const oidcIssuer = clusterResponse.cluster?.identity?.oidc?.issuer;

      expect(oidcIssuer).toBeDefined();
      expect(oidcIssuer).toContain('https://');

      // Extract OIDC provider ARN from issuer
      const oidcId = oidcIssuer?.split('/').pop();
      expect(oidcId).toBeDefined();
    });

    it('should have private subnet configuration', async () => {
      const command = new DescribeClusterCommand({
        name: clusterName,
      });

      const response = await eksClient.send(command);
      const resourcesVpcConfig = response.cluster?.resourcesVpcConfig;

      expect(resourcesVpcConfig?.subnetIds).toBeDefined();
      expect(resourcesVpcConfig?.subnetIds?.length).toBeGreaterThanOrEqual(3);
      expect(resourcesVpcConfig?.endpointPrivateAccess).toBe(true);
    });
  });

  describe('Node Groups', () => {
    it('should have two node groups', async () => {
      const command = new ListNodegroupsCommand({
        clusterName,
      });

      const response = await eksClient.send(command);
      expect(response.nodegroups).toBeDefined();
      expect(response.nodegroups?.length).toBeGreaterThanOrEqual(2);
    });

    it('should have general workload node group with c7g.large', async () => {
      const listCommand = new ListNodegroupsCommand({
        clusterName,
      });

      const listResponse = await eksClient.send(listCommand);
      const generalNodeGroup = listResponse.nodegroups?.find((ng) =>
        ng.includes('general')
      );

      expect(generalNodeGroup).toBeDefined();

      const describeCommand = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: generalNodeGroup,
      });

      const response = await eksClient.send(describeCommand);
      expect(response.nodegroup?.instanceTypes).toContain('c7g.large');
      expect(response.nodegroup?.capacityType).toBe('ON_DEMAND');
      expect(response.nodegroup?.amiType).toBe('AL2_ARM_64');
    });

    it('should have batch workload node group with c7g.xlarge spot', async () => {
      const listCommand = new ListNodegroupsCommand({
        clusterName,
      });

      const listResponse = await eksClient.send(listCommand);
      const batchNodeGroup = listResponse.nodegroups?.find((ng) =>
        ng.includes('batch')
      );

      expect(batchNodeGroup).toBeDefined();

      const describeCommand = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: batchNodeGroup,
      });

      const response = await eksClient.send(describeCommand);
      expect(response.nodegroup?.instanceTypes).toContain('c7g.xlarge');
      expect(response.nodegroup?.capacityType).toBe('SPOT');
      expect(response.nodegroup?.amiType).toBe('AL2_ARM_64');
    });

    it('should have node groups with scaling configuration', async () => {
      const listCommand = new ListNodegroupsCommand({
        clusterName,
      });

      const listResponse = await eksClient.send(listCommand);

      for (const nodegroupName of listResponse.nodegroups || []) {
        const describeCommand = new DescribeNodegroupCommand({
          clusterName,
          nodegroupName,
        });

        const response = await eksClient.send(describeCommand);
        const scalingConfig = response.nodegroup?.scalingConfig;

        expect(scalingConfig).toBeDefined();
        expect(scalingConfig?.minSize).toBeGreaterThanOrEqual(2);
        expect(scalingConfig?.maxSize).toBeLessThanOrEqual(10);
        expect(scalingConfig?.desiredSize).toBeGreaterThanOrEqual(2);
      }
    });

    it('should have batch node group with taint', async () => {
      const listCommand = new ListNodegroupsCommand({
        clusterName,
      });

      const listResponse = await eksClient.send(listCommand);
      const batchNodeGroup = listResponse.nodegroups?.find((ng) =>
        ng.includes('batch')
      );

      expect(batchNodeGroup).toBeDefined();

      const describeCommand = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: batchNodeGroup,
      });

      const response = await eksClient.send(describeCommand);
      const taints = response.nodegroup?.taints;

      expect(taints).toBeDefined();
      expect(taints?.length).toBeGreaterThan(0);

      const workloadTaint = taints?.find((t) => t.key === 'workload');
      expect(workloadTaint).toBeDefined();
      expect(workloadTaint?.value).toBe('batch');
      expect(workloadTaint?.effect).toBe('NO_SCHEDULE');
    });
  });

  describe('CloudWatch Logs', () => {
    it('should have CloudWatch log group for cluster', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/eks/${clusterName}`,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const clusterLogGroup = response.logGroups?.find((lg) =>
        lg.logGroupName?.includes(clusterName)
      );
      expect(clusterLogGroup).toBeDefined();
    });

    it('should have log retention configured', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/eks/${clusterName}`,
      });

      const response = await logsClient.send(command);
      const clusterLogGroup = response.logGroups?.[0];

      expect(clusterLogGroup?.retentionInDays).toBeDefined();
      expect(clusterLogGroup?.retentionInDays).toBe(7);
    });
  });

  describe('Resource Naming', () => {
    it('should have environmentSuffix in cluster name', () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      expect(clusterName).toContain(environmentSuffix);
    });

    it('should have environmentSuffix in VPC ID tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];

      const envSuffixTag = vpc?.Tags?.find((tag) => tag.Key === 'EnvironmentSuffix');
      expect(envSuffixTag).toBeDefined();
    });
  });

  describe('Outputs Validation', () => {
    it('should have all required outputs', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.clusterName).toBeDefined();
      expect(outputs.clusterEndpoint).toBeDefined();
      expect(outputs.clusterOidcIssuer).toBeDefined();
      expect(outputs.kubeconfig).toBeDefined();
      expect(outputs.clusterSecurityGroupId).toBeDefined();
      expect(outputs.nodeGroupArns).toBeDefined();
    });

    it('should have valid cluster endpoint URL', () => {
      expect(outputs.clusterEndpoint).toMatch(/^https:\/\//);
      expect(outputs.clusterEndpoint).toContain('eks.amazonaws.com');
    });

    it('should have valid OIDC issuer URL', () => {
      expect(outputs.clusterOidcIssuer).toMatch(/^https:\/\//);
      expect(outputs.clusterOidcIssuer).toContain('oidc.eks');
    });

    it('should have valid kubeconfig structure', () => {
      const kubeconfig = JSON.parse(outputs.kubeconfig);

      expect(kubeconfig).toHaveProperty('apiVersion');
      expect(kubeconfig).toHaveProperty('clusters');
      expect(kubeconfig).toHaveProperty('contexts');
      expect(kubeconfig).toHaveProperty('users');
      expect(kubeconfig).toHaveProperty('current-context');

      expect(kubeconfig.apiVersion).toBe('v1');
      expect(kubeconfig.clusters).toHaveLength(1);
      expect(kubeconfig.contexts).toHaveLength(1);
      expect(kubeconfig.users).toHaveLength(1);
    });

    it('should have node group ARNs array', () => {
      expect(Array.isArray(outputs.nodeGroupArns)).toBe(true);
      expect(outputs.nodeGroupArns.length).toBeGreaterThanOrEqual(2);

      outputs.nodeGroupArns.forEach((arn: string) => {
        expect(arn).toContain('arn:aws:eks');
        expect(arn).toContain('nodegroup');
      });
    });
  });
});
```
