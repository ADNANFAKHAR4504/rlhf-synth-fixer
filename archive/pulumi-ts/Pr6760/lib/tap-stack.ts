import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix: string;
  tags?: { [key: string]: string };
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly clusterOidcIssuer: pulumi.Output<string>;
  public readonly kubeconfig: pulumi.Output<unknown>;
  public readonly clusterSecurityGroupId: pulumi.Output<string>;
  public readonly nodeGroupArns: pulumi.Output<string[]>;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
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
        natGateways: { strategy: 'OnePerAz' }, // HA with one NAT per AZ
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
        retentionInDays: 90,
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
          subnetIds: pulumi
            .all([vpc.privateSubnetIds, vpc.publicSubnetIds])
            .apply(([privateIds, publicIds]) => [...privateIds, ...publicIds]),
          endpointPrivateAccess: true,
          endpointPublicAccess: true,
        },
        enabledClusterLogTypes: [
          'api',
          'audit',
          'authenticator',
          'controllerManager',
          'scheduler',
        ],
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
        subnetIds: vpc.privateSubnetIds.apply(ids => ids),
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
        subnetIds: vpc.privateSubnetIds.apply(ids => ids),
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
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy',
      },
      { parent: this }
    );

    new aws.eks.Addon(
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

    // Install CoreDNS addon (EKS managed)
    new aws.eks.Addon(
      `coredns-addon-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        addonName: 'coredns',
        resolveConflictsOnCreate: 'OVERWRITE',
        resolveConflictsOnUpdate: 'PRESERVE',
        tags: {
          ...resourceTags,
          Name: `coredns-addon-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Install kube-proxy addon (EKS managed)
    new aws.eks.Addon(
      `kube-proxy-addon-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        addonName: 'kube-proxy',
        resolveConflictsOnCreate: 'OVERWRITE',
        resolveConflictsOnUpdate: 'PRESERVE',
        tags: {
          ...resourceTags,
          Name: `kube-proxy-addon-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Install VPC CNI addon (EKS managed)
    new aws.eks.Addon(
      `vpc-cni-addon-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        addonName: 'vpc-cni',
        resolveConflictsOnCreate: 'OVERWRITE',
        resolveConflictsOnUpdate: 'PRESERVE',
        tags: {
          ...resourceTags,
          Name: `vpc-cni-addon-${environmentSuffix}`,
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
    new k8s.helm.v3.Chart(
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
    new k8s.apps.v1.Deployment(
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
                  image: pulumi.interpolate`registry.k8s.io/autoscaling/cluster-autoscaler:v${cluster.version}.2`,
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
                      mountPath: '/etc/ssl/certs',
                      readOnly: true,
                    },
                  ],
                },
              ],
              volumes: [
                {
                  name: 'ssl-certs',
                  hostPath: {
                    path: '/etc/ssl/certs',
                    type: 'Directory',
                  },
                },
              ],
            },
          },
        },
      },
      { provider: k8sProvider, parent: this }
    );

    new k8s.core.v1.ServiceAccount(
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
    new k8s.rbac.v1.ClusterRole(
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
            resources: [
              'namespaces',
              'pods',
              'services',
              'replicationcontrollers',
              'persistentvolumeclaims',
              'persistentvolumes',
            ],
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
            resources: [
              'storageclasses',
              'csinodes',
              'csidrivers',
              'csistoragecapacities',
            ],
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

    new k8s.rbac.v1.ClusterRoleBinding(
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
    new k8s.helm.v3.Chart(
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
      {
        provider: k8sProvider,
        parent: this,
        dependsOn: [containerInsightsNamespace],
      }
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
    new k8s.networking.v1.NetworkPolicy(
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
                      [`${url.replace('https://', '')}:aud`]:
                        'sts.amazonaws.com',
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
