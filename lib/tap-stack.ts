import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { KubectlV29Layer } from '@aws-cdk/lambda-layer-kubectl-v29';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly cluster: eks.Cluster;
  public readonly clusterEndpoint: string;
  public readonly oidcProviderUrl: string;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // 🔹 VPC & Cluster Setup
    const vpc = new ec2.Vpc(this, 'EKSVpc', {
      vpcName: `eks-vpc-${environmentSuffix}`,
      maxAzs: 3,
      natGateways: 3,
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

    const eksKmsKey = new kms.Key(this, 'EKSEncryptionKey', {
      description: 'KMS key for EKS cluster encryption',
      enableKeyRotation: true,
      alias: `alias/eks-cluster-encryption-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const clusterRole = new iam.Role(this, 'EKSClusterRole', {
      roleName: `eks-cluster-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSServicePolicy'),
      ],
    });

    const kubectlLayer = new KubectlV29Layer(this, 'KubectlLayer');

    this.cluster = new eks.Cluster(this, 'FinTechEKSCluster', {
      clusterName: `${id.toLowerCase()}-cluster-${environmentSuffix}`,
      version: eks.KubernetesVersion.V1_28,
      vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      defaultCapacity: 0,
      endpointAccess: eks.EndpointAccess.PRIVATE,
      role: clusterRole,
      secretsEncryptionKey: eksKmsKey,
      kubectlLayer,
      clusterLogging: [
        eks.ClusterLoggingTypes.API,
        eks.ClusterLoggingTypes.AUDIT,
        eks.ClusterLoggingTypes.AUTHENTICATOR,
        eks.ClusterLoggingTypes.CONTROLLER_MANAGER,
        eks.ClusterLoggingTypes.SCHEDULER,
      ],
      albController: {
        version: eks.AlbControllerVersion.V2_6_2,
      },
    });

    // 🔹 Node Groups
    const nodeGroupRole = new iam.Role(this, 'NodeGroupRole', {
      roleName: `eks-node-group-role-${environmentSuffix}`,
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

    nodeGroupRole.addToPolicy(
      new iam.PolicyStatement({
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
          'ec2:DescribeVolumesModifications',
        ],
        resources: ['*'],
      })
    );

    this.cluster.addNodegroupCapacity('CriticalNodeGroup', {
      nodegroupName: `critical-nodegroup-${environmentSuffix}`,
      instanceTypes: [
        ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.LARGE),
      ],
      minSize: 3,
      maxSize: 5,
      desiredSize: 3,
      amiType: eks.NodegroupAmiType.BOTTLEROCKET_X86_64,
      nodeRole: nodeGroupRole,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      diskSize: 50,
      labels: {
        'node-type': 'critical',
        workload: 'payment-processing',
      },
      taints: [
        {
          effect: eks.TaintEffect.NO_SCHEDULE,
          key: 'critical',
          value: 'true',
        },
      ],
    });

    this.cluster.addNodegroupCapacity('GeneralNodeGroup', {
      nodegroupName: `general-nodegroup-${environmentSuffix}`,
      instanceTypes: [
        ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.LARGE),
      ],
      minSize: 2,
      maxSize: 8,
      desiredSize: 2,
      amiType: eks.NodegroupAmiType.BOTTLEROCKET_X86_64,
      nodeRole: nodeGroupRole,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      diskSize: 50,
      labels: {
        'node-type': 'general',
        workload: 'microservices',
      },
    });

    this.cluster.addNodegroupCapacity('BatchNodeGroup', {
      nodegroupName: `batch-nodegroup-${environmentSuffix}`,
      instanceTypes: [
        ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.LARGE),
      ],
      minSize: 1,
      maxSize: 2,
      desiredSize: 1,
      amiType: eks.NodegroupAmiType.BOTTLEROCKET_X86_64,
      nodeRole: nodeGroupRole,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      diskSize: 50,
      labels: {
        'node-type': 'batch',
        workload: 'background-jobs',
      },
      taints: [
        {
          effect: eks.TaintEffect.NO_SCHEDULE,
          key: 'batch',
          value: 'true',
        },
      ],
    });

    // 🔹 IRSA Roles
    this.oidcProviderUrl = this.cluster.clusterOpenIdConnectIssuerUrl;

    const autoscalerSa = this.cluster.addServiceAccount('ClusterAutoscalerSA', {
      name: `cluster-autoscaler-${environmentSuffix}`,
      namespace: 'kube-system',
    });

    const autoscalerPolicy = new iam.Policy(this, 'AutoscalerPolicy', {
      policyName: `cluster-autoscaler-policy-${environmentSuffix}`,
      statements: [
        new iam.PolicyStatement({
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
        }),
      ],
    });
    autoscalerSa.role.attachInlinePolicy(autoscalerPolicy);

    const albControllerSa = this.cluster.addServiceAccount(
      'AWSLoadBalancerControllerSA',
      {
        name: `aws-load-balancer-controller-${environmentSuffix}`,
        namespace: 'kube-system',
      }
    );

    albControllerSa.role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'ElasticLoadBalancingFullAccess'
      )
    );

    const ebsCsiSa = this.cluster.addServiceAccount('EBSCSIServiceAccount', {
      name: 'ebs-csi-controller-sa',
      namespace: 'kube-system',
    });

    ebsCsiSa.role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AmazonEBSCSIDriverPolicy'
      )
    );

    // 🔹 RBAC
    const rbacManifests = [
      {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'ClusterRole',
        metadata: { name: `admin-role-${environmentSuffix}` },
        rules: [{ apiGroups: ['*'], resources: ['*'], verbs: ['*'] }],
      },
      {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'ClusterRole',
        metadata: { name: `developer-role-${environmentSuffix}` },
        rules: [
          {
            apiGroups: ['', 'apps', 'batch', 'extensions'],
            resources: [
              'pods',
              'deployments',
              'replicasets',
              'services',
              'jobs',
              'cronjobs',
            ],
            verbs: [
              'get',
              'list',
              'watch',
              'create',
              'update',
              'patch',
              'delete',
            ],
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
        metadata: { name: `viewer-role-${environmentSuffix}` },
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
    const ebsCsiAddon = new eks.CfnAddon(this, 'EBSCSIDriverAddon', {
      addonName: 'aws-ebs-csi-driver',
      clusterName: this.cluster.clusterName,
      serviceAccountRoleArn: ebsCsiSa.role.roleArn,
      resolveConflicts: 'OVERWRITE',
    });

    // Ensure addon waits for service account and OIDC provider to be ready
    ebsCsiAddon.node.addDependency(ebsCsiSa);
    ebsCsiAddon.node.addDependency(this.cluster);

    new eks.KubernetesManifest(this, 'GP3StorageClass', {
      cluster: this.cluster,
      manifest: [
        {
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
        },
      ],
    });

    const autoscalerDeployment = new eks.KubernetesManifest(
      this,
      'ClusterAutoscalerDeployment',
      {
        cluster: this.cluster,
        manifest: [
          {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
              name: `cluster-autoscaler-${environmentSuffix}`,
              namespace: 'kube-system',
              labels: { app: 'cluster-autoscaler' },
            },
            spec: {
              replicas: 1,
              selector: { matchLabels: { app: 'cluster-autoscaler' } },
              template: {
                metadata: { labels: { app: 'cluster-autoscaler' } },
                spec: {
                  serviceAccountName: `cluster-autoscaler-${environmentSuffix}`,
                  containers: [
                    {
                      image:
                        'k8s.gcr.io/autoscaling/cluster-autoscaler:v1.28.0',
                      name: 'cluster-autoscaler',
                      command: [
                        './cluster-autoscaler',
                        '--v=4',
                        '--stderrthreshold=info',
                        '--cloud-provider=aws',
                        '--skip-nodes-with-local-storage=false',
                        '--expander=least-waste',
                        `--node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/${this.cluster.clusterName}`,
                        '--balance-similar-node-groups',
                        '--skip-nodes-with-system-pods=false',
                      ],
                      env: [{ name: 'AWS_REGION', value: this.region }],
                      resources: {
                        limits: { cpu: '100m', memory: '300Mi' },
                        requests: { cpu: '100m', memory: '300Mi' },
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      }
    );
    autoscalerDeployment.node.addDependency(autoscalerSa);

    // 🔹 Network Policies - Create namespace first
    const paymentNs = `payment-processing-${environmentSuffix}`;
    const paymentNamespace = new eks.KubernetesManifest(
      this,
      'PaymentNamespace',
      {
        cluster: this.cluster,
        manifest: [
          {
            apiVersion: 'v1',
            kind: 'Namespace',
            metadata: {
              name: paymentNs,
              labels: { name: paymentNs },
            },
          },
        ],
      }
    );

    // 🔹 Pod Disruption Budgets
    ['default', paymentNs, 'kube-system'].forEach(namespace => {
      const pdb = new eks.KubernetesManifest(this, `PDB-${namespace}`, {
        cluster: this.cluster,
        manifest: [
          {
            apiVersion: 'policy/v1',
            kind: 'PodDisruptionBudget',
            metadata: {
              name: `${namespace}-pdb-${environmentSuffix}`,
              namespace,
            },
            spec: {
              minAvailable: '50%',
              selector: { matchLabels: { critical: 'true' } },
            },
          },
        ],
      });

      // Ensure PDB for payment-processing namespace waits for namespace creation
      if (namespace === paymentNs) {
        pdb.node.addDependency(paymentNamespace);
      }
    });

    // 🔹 Network Policy - Must depend on namespace creation
    const networkPolicy = new eks.KubernetesManifest(this, 'NetworkPolicy', {
      cluster: this.cluster,
      manifest: [
        {
          apiVersion: 'networking.k8s.io/v1',
          kind: 'NetworkPolicy',
          metadata: {
            name: `namespace-isolation-${environmentSuffix}`,
            namespace: paymentNs,
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
                        name: paymentNs,
                      },
                    },
                  },
                  {
                    namespaceSelector: {
                      matchLabels: { name: 'ingress-nginx' },
                    },
                  },
                  {
                    namespaceSelector: { matchLabels: { name: 'monitoring' } },
                  },
                ],
              },
            ],
            egress: [
              { to: [{ namespaceSelector: {} }] },
              { to: [{ podSelector: {} }] },
              {
                ports: [
                  { protocol: 'TCP', port: 53 },
                  { protocol: 'UDP', port: 53 },
                ],
              },
            ],
          },
        },
      ],
    });
    networkPolicy.node.addDependency(paymentNamespace);

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
  }
}
