import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import { KubectlV29Layer } from '@aws-cdk/lambda-layer-kubectl-v29';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  public readonly cluster: eks.Cluster;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Create VPC for EKS cluster
    const vpc = new ec2.Vpc(this, `eks-vpc-${environmentSuffix}`, {
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
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Create IAM role for EKS cluster
    const clusterRole = new iam.Role(
      this,
      `eks-cluster-role-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonEKSVPCResourceController'
          ),
        ],
      }
    );

    // Create kubectl layer for EKS 1.28
    const kubectlLayer = new KubectlV29Layer(
      this,
      `kubectl-layer-${environmentSuffix}`
    );

    // Create EKS cluster version 1.28 with OIDC provider
    this.cluster = new eks.Cluster(
      this,
      `transaction-eks-${environmentSuffix}`,
      {
        clusterName: `transaction-processing-${environmentSuffix}`,
        version: eks.KubernetesVersion.V1_28,
        vpc,
        vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
        role: clusterRole,
        defaultCapacity: 0, // We'll add managed node groups separately
        kubectlLayer,
        clusterLogging: [
          eks.ClusterLoggingTypes.API,
          eks.ClusterLoggingTypes.AUDIT,
          eks.ClusterLoggingTypes.AUTHENTICATOR,
          eks.ClusterLoggingTypes.CONTROLLER_MANAGER,
          eks.ClusterLoggingTypes.SCHEDULER,
        ],
        endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
      }
    );

    // Note: VPC tags for cluster discovery are automatically added by EKS construct

    // Create IAM role for critical node group
    const criticalNodeRole = new iam.Role(
      this,
      `critical-node-role-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonEKSWorkerNodePolicy'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonEC2ContainerRegistryReadOnly'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonSSMManagedInstanceCore'
          ),
        ],
      }
    );

    // Create critical managed node group (On-Demand)
    const criticalNodeGroup = this.cluster.addNodegroupCapacity(
      `critical-ng-${environmentSuffix}`,
      {
        nodegroupName: `critical-${environmentSuffix}`,
        instanceTypes: [new ec2.InstanceType('t3.medium')],
        minSize: 2,
        maxSize: 4,
        desiredSize: 2,
        capacityType: eks.CapacityType.ON_DEMAND,
        nodeRole: criticalNodeRole,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        labels: {
          'workload-type': 'critical',
        },
      }
    );

    // Add tags for cluster autoscaler discovery (critical node group)
    cdk.Tags.of(criticalNodeGroup).add(
      'k8s.io/cluster-autoscaler/enabled',
      'true'
    );
    cdk.Tags.of(criticalNodeGroup).add(
      'k8s.io/cluster-autoscaler/node-template/label/workload-type',
      'critical'
    );

    // Create IAM role for workers node group
    const workersNodeRole = new iam.Role(
      this,
      `workers-node-role-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonEKSWorkerNodePolicy'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonEC2ContainerRegistryReadOnly'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonSSMManagedInstanceCore'
          ),
        ],
      }
    );

    // Create workers managed node group (Spot)
    const workersNodeGroup = this.cluster.addNodegroupCapacity(
      `workers-ng-${environmentSuffix}`,
      {
        nodegroupName: `workers-${environmentSuffix}`,
        instanceTypes: [new ec2.InstanceType('t3.large')],
        minSize: 3,
        maxSize: 10,
        desiredSize: 3,
        capacityType: eks.CapacityType.SPOT,
        nodeRole: workersNodeRole,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        labels: {
          'workload-type': 'workers',
        },
      }
    );

    // Add tags for cluster autoscaler discovery (workers node group)
    cdk.Tags.of(workersNodeGroup).add(
      'k8s.io/cluster-autoscaler/enabled',
      'true'
    );
    cdk.Tags.of(workersNodeGroup).add(
      'k8s.io/cluster-autoscaler/node-template/label/workload-type',
      'workers'
    );

    // Create Fargate execution role
    const fargateRole = new iam.Role(
      this,
      `fargate-role-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('eks-fargate-pods.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonEKSFargatePodExecutionRolePolicy'
          ),
        ],
      }
    );

    // Create Fargate profile for kube-system namespace
    new eks.FargateProfile(this, `kube-system-fargate-${environmentSuffix}`, {
      cluster: this.cluster,
      fargateProfileName: `kube-system-${environmentSuffix}`,
      podExecutionRole: fargateRole,
      selectors: [{ namespace: 'kube-system' }],
      vpc,
      subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // Create Fargate profile for aws-load-balancer-controller namespace
    new eks.FargateProfile(
      this,
      `alb-controller-fargate-${environmentSuffix}`,
      {
        cluster: this.cluster,
        fargateProfileName: `aws-load-balancer-controller-${environmentSuffix}`,
        podExecutionRole: fargateRole,
        selectors: [{ namespace: 'aws-load-balancer-controller' }],
        vpc,
        subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      }
    );

    // Create IAM policy for AWS Load Balancer Controller
    const albControllerPolicy = new iam.Policy(
      this,
      `alb-controller-policy-${environmentSuffix}`,
      {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'iam:CreateServiceLinkedRole',
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
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
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
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'ec2:AuthorizeSecurityGroupIngress',
              'ec2:RevokeSecurityGroupIngress',
              'ec2:CreateSecurityGroup',
              'ec2:CreateTags',
              'ec2:DeleteTags',
              'ec2:DeleteSecurityGroup',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
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
            resources: ['*'],
          }),
        ],
      }
    );

    // Create service account for AWS Load Balancer Controller
    const albControllerServiceAccount = this.cluster.addServiceAccount(
      `alb-controller-sa-${environmentSuffix}`,
      {
        name: 'aws-load-balancer-controller',
        namespace: 'kube-system',
      }
    );

    albControllerPolicy.attachToRole(albControllerServiceAccount.role);

    // Deploy AWS Load Balancer Controller using Helm
    const albControllerChart = this.cluster.addHelmChart(
      `alb-controller-${environmentSuffix}`,
      {
        chart: 'aws-load-balancer-controller',
        repository: 'https://aws.github.io/eks-charts',
        namespace: 'kube-system',
        values: {
          clusterName: this.cluster.clusterName,
          serviceAccount: {
            create: false,
            name: 'aws-load-balancer-controller',
          },
          region: this.region,
          vpcId: vpc.vpcId,
        },
      }
    );

    albControllerChart.node.addDependency(albControllerServiceAccount);

    // Create IAM policy for Cluster Autoscaler
    const clusterAutoscalerPolicy = new iam.Policy(
      this,
      `cluster-autoscaler-policy-${environmentSuffix}`,
      {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'autoscaling:DescribeAutoScalingGroups',
              'autoscaling:DescribeAutoScalingInstances',
              'autoscaling:DescribeLaunchConfigurations',
              'autoscaling:DescribeScalingActivities',
              'autoscaling:DescribeTags',
              'ec2:DescribeInstanceTypes',
              'ec2:DescribeLaunchTemplateVersions',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'autoscaling:SetDesiredCapacity',
              'autoscaling:TerminateInstanceInAutoScalingGroup',
              'ec2:DescribeImages',
              'ec2:GetInstanceTypesFromInstanceRequirements',
              'eks:DescribeNodegroup',
            ],
            resources: ['*'],
          }),
        ],
      }
    );

    // Create service account for Cluster Autoscaler
    const clusterAutoscalerServiceAccount = this.cluster.addServiceAccount(
      `cluster-autoscaler-sa-${environmentSuffix}`,
      {
        name: 'cluster-autoscaler',
        namespace: 'kube-system',
      }
    );

    clusterAutoscalerPolicy.attachToRole(clusterAutoscalerServiceAccount.role);

    // Deploy Cluster Autoscaler
    const clusterAutoscalerManifest = this.cluster.addManifest(
      `cluster-autoscaler-${environmentSuffix}`,
      {
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
                  name: 'cluster-autoscaler',
                  image:
                    'registry.k8s.io/autoscaling/cluster-autoscaler:v1.28.2',
                  command: [
                    './cluster-autoscaler',
                    '--v=4',
                    '--stderrthreshold=info',
                    '--cloud-provider=aws',
                    '--skip-nodes-with-local-storage=false',
                    '--expander=least-waste',
                    '--node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled',
                    '--balance-similar-node-groups',
                    '--skip-nodes-with-system-pods=false',
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
                  imagePullPolicy: 'Always',
                  securityContext: {
                    allowPrivilegeEscalation: false,
                    capabilities: {
                      drop: ['ALL'],
                    },
                    readOnlyRootFilesystem: true,
                  },
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
      }
    );

    clusterAutoscalerManifest.node.addDependency(
      clusterAutoscalerServiceAccount
    );

    // Create application namespaces with labels
    this.cluster.addManifest(`payments-namespace-${environmentSuffix}`, {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name: 'payments',
        labels: {
          'app.kubernetes.io/name': 'payments',
          'app.kubernetes.io/component': 'application',
          'pod-security.kubernetes.io/enforce': 'baseline',
          'pod-security.kubernetes.io/audit': 'baseline',
          'pod-security.kubernetes.io/warn': 'baseline',
        },
      },
    });

    this.cluster.addManifest(`processing-namespace-${environmentSuffix}`, {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name: 'processing',
        labels: {
          'app.kubernetes.io/name': 'processing',
          'app.kubernetes.io/component': 'application',
          'pod-security.kubernetes.io/enforce': 'baseline',
          'pod-security.kubernetes.io/audit': 'baseline',
          'pod-security.kubernetes.io/warn': 'baseline',
        },
      },
    });

    this.cluster.addManifest(`monitoring-namespace-${environmentSuffix}`, {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name: 'monitoring',
        labels: {
          'app.kubernetes.io/name': 'monitoring',
          'app.kubernetes.io/component': 'observability',
          'pod-security.kubernetes.io/enforce': 'baseline',
          'pod-security.kubernetes.io/audit': 'baseline',
          'pod-security.kubernetes.io/warn': 'baseline',
        },
      },
    });

    // Stack outputs
    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      description: 'EKS Cluster Name',
      exportName: `eks-cluster-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: this.cluster.clusterEndpoint,
      description: 'EKS Cluster Endpoint',
      exportName: `eks-cluster-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterArn', {
      value: this.cluster.clusterArn,
      description: 'EKS Cluster ARN',
      exportName: `eks-cluster-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OIDCIssuerURL', {
      value: this.cluster.clusterOpenIdConnectIssuerUrl,
      description: 'EKS OIDC Issuer URL',
      exportName: `eks-oidc-issuer-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KubectlConfigCommand', {
      value: `aws eks update-kubeconfig --region ${this.region} --name ${this.cluster.clusterName}`,
      description: 'Command to configure kubectl',
      exportName: `eks-kubectl-config-cmd-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `eks-vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterSecurityGroupId', {
      value: this.cluster.clusterSecurityGroupId,
      description: 'Cluster Security Group ID',
      exportName: `eks-cluster-sg-id-${environmentSuffix}`,
    });
  }
}
