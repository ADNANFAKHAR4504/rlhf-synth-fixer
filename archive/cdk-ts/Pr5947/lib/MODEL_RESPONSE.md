# EKS Cluster with Observability Stack - Initial Implementation

This document contains the initial implementation for the EKS cluster with comprehensive observability features.

## File: lib/eks-cluster-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface EksClusterStackProps {
  environmentSuffix: string;
}

export class EksClusterStack extends Construct {
  public readonly cluster: eks.Cluster;

  constructor(scope: Construct, id: string, props: EksClusterStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Create VPC for EKS cluster
    const vpc = new ec2.Vpc(this, 'EksVpc', {
      vpcName: `eks-vpc-${environmentSuffix}`,
      maxAzs: 3,
      natGateways: 3,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // Create KMS key for EKS secrets encryption
    const kmsKey = new kms.Key(this, 'EksSecretsKey', {
      alias: `eks-secrets-${environmentSuffix}`,
      description: 'KMS key for EKS secrets encryption',
      enableKeyRotation: true,
    });

    // Create EKS cluster
    this.cluster = new eks.Cluster(this, 'EksCluster', {
      clusterName: `eks-cluster-${environmentSuffix}`,
      version: eks.KubernetesVersion.V1_28,
      vpc: vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      defaultCapacity: 0, // We'll add managed node groups manually
      secretsEncryptionKey: kmsKey,
      clusterLogging: [
        eks.ClusterLoggingTypes.API,
        eks.ClusterLoggingTypes.AUDIT,
        eks.ClusterLoggingTypes.AUTHENTICATOR,
        eks.ClusterLoggingTypes.CONTROLLER_MANAGER,
        eks.ClusterLoggingTypes.SCHEDULER,
      ],
    });

    // Add Container Insights as an add-on
    new eks.CfnAddon(this, 'ContainerInsights', {
      clusterName: this.cluster.clusterName,
      addonName: 'amazon-cloudwatch-observability',
      resolveConflicts: 'OVERWRITE',
    });

    // Create managed node groups across 3 AZs
    const nodeGroup1 = this.cluster.addNodegroupCapacity('NodeGroup1', {
      nodegroupName: `eks-ng1-${environmentSuffix}`,
      instanceTypes: [new ec2.InstanceType('m5.large')],
      minSize: 1,
      maxSize: 3,
      desiredSize: 1,
      subnets: { availabilityZones: [vpc.availabilityZones[0]] },
    });

    const nodeGroup2 = this.cluster.addNodegroupCapacity('NodeGroup2', {
      nodegroupName: `eks-ng2-${environmentSuffix}`,
      instanceTypes: [new ec2.InstanceType('m5.large')],
      minSize: 1,
      maxSize: 3,
      desiredSize: 1,
      subnets: { availabilityZones: [vpc.availabilityZones[1]] },
    });

    const nodeGroup3 = this.cluster.addNodegroupCapacity('NodeGroup3', {
      nodegroupName: `eks-ng3-${environmentSuffix}`,
      instanceTypes: [new ec2.InstanceType('m5.large')],
      minSize: 1,
      maxSize: 3,
      desiredSize: 1,
      subnets: { availabilityZones: [vpc.availabilityZones[2]] },
    });

    // Create namespace for Fluent Bit
    const fluentBitNamespace = this.cluster.addManifest('FluentBitNamespace', {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name: 'amazon-cloudwatch',
      },
    });

    // Create service account for Fluent Bit with IRSA
    const fluentBitServiceAccount = this.cluster.addServiceAccount('FluentBitServiceAccount', {
      name: 'fluent-bit',
      namespace: 'amazon-cloudwatch',
    });

    fluentBitServiceAccount.node.addDependency(fluentBitNamespace);

    // Grant CloudWatch permissions to Fluent Bit
    fluentBitServiceAccount.role.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams',
      ],
      resources: ['*'],
    }));

    // Store Fluent Bit configuration in SSM Parameter Store
    const fluentBitConfig = new ssm.StringParameter(this, 'FluentBitConfig', {
      parameterName: `/eks/${environmentSuffix}/fluent-bit-config`,
      stringValue: `[SERVICE]
    Flush                     5
    Log_Level                 info
    Daemon                    off

[INPUT]
    Name                      tail
    Path                      /var/log/containers/*.log
    Parser                    docker
    Tag                       kube.*
    Refresh_Interval          5

[FILTER]
    Name                      kubernetes
    Match                     kube.*
    Kube_URL                  https://kubernetes.default.svc:443
    Kube_CA_File              /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    Kube_Token_File           /var/run/secrets/kubernetes.io/serviceaccount/token
    Merge_Log                 On
    Keep_Log                  Off

[OUTPUT]
    Name                      cloudwatch_logs
    Match                     *
    region                    ap-southeast-1
    log_group_name            /aws/eks/cluster-logs
    auto_create_group         true`,
      tier: ssm.ParameterTier.ADVANCED,
      type: ssm.ParameterType.SECURE_STRING,
    });

    // Deploy Fluent Bit as a DaemonSet
    const fluentBitDaemonSet = this.cluster.addManifest('FluentBitDaemonSet', {
      apiVersion: 'apps/v1',
      kind: 'DaemonSet',
      metadata: {
        name: 'fluent-bit',
        namespace: 'amazon-cloudwatch',
        labels: {
          app: 'fluent-bit',
        },
      },
      spec: {
        selector: {
          matchLabels: {
            app: 'fluent-bit',
          },
        },
        template: {
          metadata: {
            labels: {
              app: 'fluent-bit',
            },
          },
          spec: {
            serviceAccountName: 'fluent-bit',
            containers: [
              {
                name: 'fluent-bit',
                image: 'public.ecr.aws/aws-observability/aws-for-fluent-bit:latest',
                resources: {
                  limits: {
                    memory: '200Mi',
                  },
                  requests: {
                    cpu: '100m',
                    memory: '100Mi',
                  },
                },
                volumeMounts: [
                  {
                    name: 'varlog',
                    mountPath: '/var/log',
                  },
                  {
                    name: 'varlibdockercontainers',
                    mountPath: '/var/lib/docker/containers',
                    readOnly: true,
                  },
                ],
              },
            ],
            volumes: [
              {
                name: 'varlog',
                hostPath: {
                  path: '/var/log',
                },
              },
              {
                name: 'varlibdockercontainers',
                hostPath: {
                  path: '/var/lib/docker/containers',
                },
              },
            ],
          },
        },
      },
    });

    fluentBitDaemonSet.node.addDependency(fluentBitServiceAccount);

    // Deploy metrics-server using Helm
    this.cluster.addHelmChart('MetricsServer', {
      chart: 'metrics-server',
      repository: 'https://kubernetes-sigs.github.io/metrics-server/',
      namespace: 'kube-system',
      values: {
        args: ['--kubelet-insecure-tls'],
      },
    });

    // Create namespaces with resource quotas
    const namespaces = ['dev', 'staging', 'prod'];

    namespaces.forEach((ns) => {
      const namespace = this.cluster.addManifest(`${ns}Namespace`, {
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: {
          name: ns,
        },
      });

      const resourceQuota = this.cluster.addManifest(`${ns}ResourceQuota`, {
        apiVersion: 'v1',
        kind: 'ResourceQuota',
        metadata: {
          name: 'resource-quota',
          namespace: ns,
        },
        spec: {
          hard: {
            'requests.cpu': '100',
            'requests.memory': '200Gi',
          },
        },
      });

      resourceQuota.node.addDependency(namespace);
    });

    // Add tags to all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('CostCenter', 'FinTech');

    // Outputs
    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: this.cluster.clusterEndpoint,
      description: 'EKS Cluster Endpoint',
    });

    new cdk.CfnOutput(this, 'OIDCProviderArn', {
      value: this.cluster.openIdConnectProvider.openIdConnectProviderArn,
      description: 'OIDC Provider ARN',
    });

    new cdk.CfnOutput(this, 'KubectlConfig', {
      value: `aws eks update-kubeconfig --name ${this.cluster.clusterName} --region ap-southeast-1`,
      description: 'Command to configure kubectl',
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EksClusterStack } from './eks-cluster-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Instantiate EKS cluster stack
    new EksClusterStack(this, 'EksCluster', {
      environmentSuffix,
    });
  }
}
```

## Implementation Summary

This implementation creates:

1. **VPC**: 3-AZ VPC with public and private subnets, 3 NAT gateways
2. **EKS Cluster**: Version 1.28 with all control plane logging enabled
3. **KMS Key**: For secrets encryption with automatic rotation
4. **Node Groups**: Three managed node groups (m5.large), one per AZ
5. **Container Insights**: CloudWatch observability add-on
6. **Fluent Bit**: DaemonSet with IRSA for CloudWatch Logs
7. **Fluent Bit Config**: Stored in SSM Parameter Store as SecureString
8. **Metrics Server**: Deployed via Helm for autoscaling support
9. **Namespaces**: dev, staging, prod with resource quotas (100 CPU, 200Gi memory)
10. **Tags**: Environment=Production, CostCenter=FinTech on all resources
11. **Outputs**: Cluster endpoint, OIDC provider ARN, kubectl config command

The implementation follows AWS best practices for EKS deployments and includes comprehensive observability features for financial services workloads.
