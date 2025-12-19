# EKS Cluster for Transaction Processing Platform - MODEL_RESPONSE

This implementation creates a production-ready EKS 1.28 cluster with managed node groups, Fargate profiles, AWS Load Balancer Controller, cluster autoscaler, and comprehensive security controls.

## Architecture Overview

The solution includes:
- EKS 1.28 cluster with OIDC provider for IRSA
- Two managed node groups (critical: On-Demand, workers: Spot)
- Fargate profiles for system workloads
- AWS Load Balancer Controller addon
- Cluster Autoscaler with IAM permissions
- Pod security standards enforcement
- Three application namespaces with labels
- Control plane logging to CloudWatch

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

new TapStack(app, `TapStack${environmentSuffix}`, {
  env,
  environmentSuffix,
  description: 'EKS Cluster for Transaction Processing Platform',
});

app.synth();
```

## File: lib/tap-stack.ts

```typescript
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
    const clusterRole = new iam.Role(this, `eks-cluster-role-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSVPCResourceController'),
      ],
    });

    // Create kubectl layer for EKS 1.28
    const kubectlLayer = new KubectlV29Layer(this, `kubectl-layer-${environmentSuffix}`);

    // Create EKS cluster version 1.28 with OIDC provider
    this.cluster = new eks.Cluster(this, `transaction-eks-${environmentSuffix}`, {
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
    });

    // Tag VPC and subnets for cluster discovery
    cdk.Tags.of(vpc).add(`kubernetes.io/cluster/${this.cluster.clusterName}`, 'shared');

    // Create IAM role for critical node group
    const criticalNodeRole = new iam.Role(this, `critical-node-role-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Create critical managed node group (On-Demand)
    const criticalNodeGroup = this.cluster.addNodegroupCapacity(`critical-ng-${environmentSuffix}`, {
      nodegroupName: `critical-${environmentSuffix}`,
      instanceTypes: [new ec2.InstanceType('t3.medium')],
      minSize: 2,
      maxSize: 4,
      desiredSize: 2,
      capacityType: eks.CapacityType.ON_DEMAND,
      nodeRole: criticalNodeRole,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      tags: {
        'k8s.io/cluster-autoscaler/enabled': 'true',
        [`k8s.io/cluster-autoscaler/${this.cluster.clusterName}`]: 'owned',
        'k8s.io/cluster-autoscaler/node-template/label/workload-type': 'critical',
      },
      labels: {
        'workload-type': 'critical',
      },
    });

    // Create IAM role for workers node group
    const workersNodeRole = new iam.Role(this, `workers-node-role-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Create workers managed node group (Spot)
    const workersNodeGroup = this.cluster.addNodegroupCapacity(`workers-ng-${environmentSuffix}`, {
      nodegroupName: `workers-${environmentSuffix}`,
      instanceTypes: [new ec2.InstanceType('t3.large')],
      minSize: 3,
      maxSize: 10,
      desiredSize: 3,
      capacityType: eks.CapacityType.SPOT,
      nodeRole: workersNodeRole,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      tags: {
        'k8s.io/cluster-autoscaler/enabled': 'true',
        [`k8s.io/cluster-autoscaler/${this.cluster.clusterName}`]: 'owned',
        'k8s.io/cluster-autoscaler/node-template/label/workload-type': 'workers',
      },
      labels: {
        'workload-type': 'workers',
      },
    });

    // Create Fargate execution role
    const fargateRole = new iam.Role(this, `fargate-role-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('eks-fargate-pods.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSFargatePodExecutionRolePolicy'),
      ],
    });

    // Create Fargate profile for kube-system namespace
    const kubeSystemFargateProfile = new eks.FargateProfile(
      this,
      `kube-system-fargate-${environmentSuffix}`,
      {
        cluster: this.cluster,
        fargateProfileName: `kube-system-${environmentSuffix}`,
        podExecutionRole: fargateRole,
        selectors: [{ namespace: 'kube-system' }],
        vpc,
        subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      }
    );

    // Create Fargate profile for aws-load-balancer-controller namespace
    const albControllerFargateProfile = new eks.FargateProfile(
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
    const albControllerPolicy = new iam.Policy(this, `alb-controller-policy-${environmentSuffix}`, {
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
    });

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
    const albControllerChart = this.cluster.addHelmChart(`alb-controller-${environmentSuffix}`, {
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
    });

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
                  image: 'registry.k8s.io/autoscaling/cluster-autoscaler:v1.28.2',
                  command: [
                    './cluster-autoscaler',
                    '--v=4',
                    '--stderrthreshold=info',
                    '--cloud-provider=aws',
                    '--skip-nodes-with-local-storage=false',
                    '--expander=least-waste',
                    `--node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/${this.cluster.clusterName}`,
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

    clusterAutoscalerManifest.node.addDependency(clusterAutoscalerServiceAccount);

    // Create application namespaces with labels
    const paymentsNamespace = this.cluster.addManifest(`payments-namespace-${environmentSuffix}`, {
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

    const processingNamespace = this.cluster.addManifest(
      `processing-namespace-${environmentSuffix}`,
      {
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
      }
    );

    const monitoringNamespace = this.cluster.addManifest(
      `monitoring-namespace-${environmentSuffix}`,
      {
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
      }
    );

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
```

## File: lib/README.md

```markdown
# EKS Cluster for Transaction Processing Platform

This CDK application deploys a production-ready Amazon EKS 1.28 cluster designed for transaction processing workloads in a fintech environment.

## Architecture

### Core Components

1. **EKS Cluster v1.28**
   - OIDC provider enabled for IRSA (IAM Roles for Service Accounts)
   - Control plane logging enabled for all log types
   - Public and private endpoint access
   - VPC spanning 3 availability zones

2. **Managed Node Groups**
   - **Critical Node Group**: 2-4 t3.medium On-Demand instances for system-critical workloads
   - **Workers Node Group**: 3-10 t3.large Spot instances for application workloads
   - Both configured with cluster autoscaler tags

3. **Fargate Profiles**
   - `kube-system` namespace for Kubernetes system components
   - `aws-load-balancer-controller` namespace for ingress management

4. **AWS Load Balancer Controller**
   - Deployed via Helm chart
   - Uses IRSA for AWS API access
   - Manages Application Load Balancers for Kubernetes Ingress resources

5. **Cluster Autoscaler**
   - Automatically scales node groups based on pod scheduling needs
   - Uses IRSA for AWS API access
   - Configured with least-waste expander strategy

6. **Pod Security Standards**
   - Baseline enforcement at namespace level
   - Applied to all application namespaces (payments, processing, monitoring)

### Network Architecture

- **VPC**: 10.0.0.0/16 CIDR across 3 AZs
- **Public Subnets**: For load balancers and NAT gateways
- **Private Subnets**: For EKS worker nodes and Fargate pods
- **NAT Gateways**: 3 (one per AZ) for high availability

### IAM and Security

- Separate IAM roles for cluster, node groups, and Fargate
- IRSA implementation for pod-level AWS permissions
- Systems Manager integration for node access (no SSH required)
- Security groups automatically configured by EKS

## Prerequisites

- AWS CLI v2 configured with appropriate credentials
- AWS CDK 2.x installed (`npm install -g aws-cdk`)
- Node.js 20+ and npm 10+
- kubectl 1.28+ installed
- Sufficient AWS service quotas for EKS, VPC, and EC2

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

```bash
export ENVIRONMENT_SUFFIX="prod"
export CDK_DEFAULT_REGION="us-east-1"
export CDK_DEFAULT_ACCOUNT="your-account-id"
```

### 3. Bootstrap CDK (first time only)

```bash
npm run cdk:bootstrap
```

### 4. Synthesize CloudFormation Template

```bash
npm run cdk:synth
```

### 5. Deploy the Stack

```bash
npm run cdk:deploy
```

Deployment takes approximately 15-20 minutes.

### 6. Configure kubectl

After deployment, configure kubectl to access your cluster:

```bash
aws eks update-kubeconfig --region us-east-1 --name transaction-processing-prod
```

### 7. Verify Deployment

```bash
# Check cluster status
kubectl cluster-info

# Check nodes
kubectl get nodes

# Check namespaces
kubectl get namespaces

# Check cluster autoscaler
kubectl get deployment cluster-autoscaler -n kube-system

# Check AWS Load Balancer Controller
kubectl get deployment aws-load-balancer-controller -n kube-system
```

## Configuration

### Environment Suffix

The `environmentSuffix` context variable is used to create unique resource names:

```bash
# Development
cdk deploy --context environmentSuffix=dev

# Staging
cdk deploy --context environmentSuffix=staging

# Production
cdk deploy --context environmentSuffix=prod
```

### Scaling Configuration

Node groups auto-scale based on pod demands:

- **Critical**: 2-4 instances (On-Demand)
- **Workers**: 3-10 instances (Spot)

To adjust scaling limits, modify the `minSize` and `maxSize` parameters in `lib/tap-stack.ts`.

### Cost Optimization

- Spot instances used for non-critical workloads (60-90% cost savings)
- Fargate only for system workloads to avoid over-provisioning
- Cluster autoscaler removes unused capacity
- NAT Gateways: Consider VPC endpoints for AWS services to reduce data transfer costs

## Application Deployment

### Namespaces

Three application namespaces are pre-configured:

1. **payments**: For payment processing services
2. **processing**: For transaction processing workloads
3. **monitoring**: For observability tools (Prometheus, Grafana, etc.)

Example deployment:

```bash
kubectl apply -f your-app-deployment.yaml -n payments
```

### Using IRSA

To grant AWS permissions to pods:

1. Create an IAM role with required permissions
2. Create a Kubernetes service account
3. Annotate the service account with the IAM role ARN
4. Use the service account in your pod specification

Example:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-app-sa
  namespace: payments
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT_ID:role/my-app-role
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: payments
spec:
  template:
    spec:
      serviceAccountName: my-app-sa
      containers:
      - name: my-app
        image: my-app:latest
```

### Ingress Configuration

Use Kubernetes Ingress resources with AWS Load Balancer Controller:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: payment-api
  namespace: payments
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: payment-service
            port:
              number: 80
```

## Monitoring and Logging

### Control Plane Logs

All control plane logs are sent to CloudWatch Logs:

- API server logs
- Audit logs
- Authenticator logs
- Controller manager logs
- Scheduler logs

Access logs in CloudWatch Logs under `/aws/eks/transaction-processing-{environmentSuffix}/cluster`.

### Cluster Metrics

Use CloudWatch Container Insights for cluster and pod metrics:

```bash
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluentd-quickstart.yaml
```

## Cleanup

To destroy all resources:

```bash
npm run cdk:destroy
```

**Warning**: This will delete the entire EKS cluster and all associated resources. Ensure all workloads are backed up before destroying.

## Stack Outputs

After deployment, the following outputs are available:

- `ClusterName`: EKS cluster name
- `ClusterEndpoint`: API server endpoint
- `ClusterArn`: EKS cluster ARN
- `OIDCIssuerURL`: OIDC provider URL for IRSA
- `KubectlConfigCommand`: Command to configure kubectl
- `VpcId`: VPC ID
- `ClusterSecurityGroupId`: Cluster security group ID

Access outputs:

```bash
aws cloudformation describe-stacks --stack-name TapStackprod --query 'Stacks[0].Outputs'
```

## Security Considerations

1. **Network Isolation**: Worker nodes run in private subnets with no direct internet access
2. **IRSA**: Use IAM roles for service accounts instead of node-level permissions
3. **Pod Security Standards**: Baseline enforcement prevents privileged containers
4. **Control Plane Logging**: All API and audit events logged for compliance
5. **Systems Manager**: Use SSM Session Manager instead of SSH for node access
6. **Security Groups**: Managed by EKS, follow least privilege principle

## Troubleshooting

### Cluster Autoscaler Not Scaling

Check logs:
```bash
kubectl logs -f deployment/cluster-autoscaler -n kube-system
```

Verify node group tags include:
- `k8s.io/cluster-autoscaler/enabled=true`
- `k8s.io/cluster-autoscaler/<cluster-name>=owned`

### AWS Load Balancer Controller Issues

Check controller logs:
```bash
kubectl logs -f deployment/aws-load-balancer-controller -n kube-system
```

Verify service account has correct IAM role annotation:
```bash
kubectl describe sa aws-load-balancer-controller -n kube-system
```

### Fargate Pods Not Starting

Check Fargate profile configuration:
```bash
aws eks describe-fargate-profile --cluster-name <cluster-name> --fargate-profile-name <profile-name>
```

Ensure pod namespace matches Fargate profile selectors.

### Node Group Scaling Issues

Check Auto Scaling Group status:
```bash
aws autoscaling describe-auto-scaling-groups --query 'AutoScalingGroups[?contains(Tags[?Key==`eks:cluster-name`].Value, `transaction-processing`)]'
```

## References

- [EKS User Guide](https://docs.aws.amazon.com/eks/latest/userguide/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler)
- [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/)
- [IRSA Documentation](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)
```

## Implementation Notes

This solution addresses all 10 requirements:

1. ✅ EKS 1.28 cluster with OIDC provider enabled
2. ✅ Two managed node groups (critical: On-Demand, workers: Spot)
3. ✅ AWS Load Balancer Controller via Helm with IAM service account
4. ✅ Fargate profiles for kube-system and aws-load-balancer-controller
5. ✅ Control plane logging for all log types
6. ✅ Cluster autoscaler with IAM role deployed
7. ✅ Pod security standards with baseline enforcement
8. ✅ Three namespaces (payments, processing, monitoring) with labels
9. ✅ Node group tags for autoscaler discovery
10. ✅ Stack outputs for endpoint, OIDC URL, and kubectl command

All 8 constraints are honored:
- ✅ Managed node groups with Spot instances
- ✅ IRSA implemented for Load Balancer Controller and Cluster Autoscaler
- ✅ Load Balancer Controller as Helm chart
- ✅ OIDC provider configured
- ✅ Fargate only for system workloads
- ✅ Control plane logging enabled
- ✅ Pod security standards via namespace labels
- ✅ Autoscaler IAM permissions and tags configured

All resource names include `environmentSuffix` for uniqueness across environments.
