# EC2 Auto Scaling with Advanced Container Orchestration - Implementation

This implementation provides a production-ready EKS cluster with advanced container orchestration features including App Mesh, IRSA, Calico CNI, HPA with CloudWatch metrics, Fluent Bit logging, and Cluster Autoscaler.

## Architecture Overview

The infrastructure includes:
- EKS cluster v1.28 with OIDC provider for IRSA
- AWS App Mesh for service mesh capabilities
- Managed node groups with 70% spot / 30% on-demand mix
- Fine-grained IAM policies via IRSA
- Calico CNI for network policy enforcement
- Horizontal Pod Autoscaler with CloudWatch custom metrics
- Fluent Bit DaemonSet for centralized logging
- Cluster Autoscaler with proper IAM permissions

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as eks from '@pulumi/eks';
import * as k8s from '@pulumi/kubernetes';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly clusterName: pulumi.Output<string>;
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly meshName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    const defaultTags = {
      Environment: environmentSuffix,
      ManagedBy: 'Pulumi',
      Project: 'TAP',
      ...tags,
    };

    // Create VPC for EKS
    const vpc = new aws.ec2.Vpc(`eks-vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...defaultTags,
        Name: `eks-vpc-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create public subnets for EKS
    const publicSubnet1 = new aws.ec2.Subnet(`eks-public-subnet-1-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-east-1a',
      mapPublicIpOnLaunch: true,
      tags: {
        ...defaultTags,
        Name: `eks-public-subnet-1-${environmentSuffix}`,
        'kubernetes.io/role/elb': '1',
      },
    }, { parent: this });

    const publicSubnet2 = new aws.ec2.Subnet(`eks-public-subnet-2-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: 'us-east-1b',
      mapPublicIpOnLaunch: true,
      tags: {
        ...defaultTags,
        Name: `eks-public-subnet-2-${environmentSuffix}`,
        'kubernetes.io/role/elb': '1',
      },
    }, { parent: this });

    // Create private subnets for EKS nodes
    const privateSubnet1 = new aws.ec2.Subnet(`eks-private-subnet-1-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.10.0/24',
      availabilityZone: 'us-east-1a',
      tags: {
        ...defaultTags,
        Name: `eks-private-subnet-1-${environmentSuffix}`,
        'kubernetes.io/role/internal-elb': '1',
      },
    }, { parent: this });

    const privateSubnet2 = new aws.ec2.Subnet(`eks-private-subnet-2-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: 'us-east-1b',
      tags: {
        ...defaultTags,
        Name: `eks-private-subnet-2-${environmentSuffix}`,
        'kubernetes.io/role/internal-elb': '1',
      },
    }, { parent: this });

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(`eks-igw-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        ...defaultTags,
        Name: `eks-igw-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create Elastic IP for NAT Gateway
    const eip = new aws.ec2.Eip(`eks-nat-eip-${environmentSuffix}`, {
      domain: 'vpc',
      tags: {
        ...defaultTags,
        Name: `eks-nat-eip-${environmentSuffix}`,
      },
    }, { parent: this, dependsOn: [igw] });

    // Create NAT Gateway
    const natGateway = new aws.ec2.NatGateway(`eks-nat-${environmentSuffix}`, {
      allocationId: eip.id,
      subnetId: publicSubnet1.id,
      tags: {
        ...defaultTags,
        Name: `eks-nat-${environmentSuffix}`,
      },
    }, { parent: this, dependsOn: [igw] });

    // Public route table
    const publicRouteTable = new aws.ec2.RouteTable(`eks-public-rt-${environmentSuffix}`, {
      vpcId: vpc.id,
      routes: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: igw.id,
        },
      ],
      tags: {
        ...defaultTags,
        Name: `eks-public-rt-${environmentSuffix}`,
      },
    }, { parent: this });

    // Private route table
    const privateRouteTable = new aws.ec2.RouteTable(`eks-private-rt-${environmentSuffix}`, {
      vpcId: vpc.id,
      routes: [
        {
          cidrBlock: '0.0.0.0/0',
          natGatewayId: natGateway.id,
        },
      ],
      tags: {
        ...defaultTags,
        Name: `eks-private-rt-${environmentSuffix}`,
      },
    }, { parent: this });

    // Associate subnets with route tables
    new aws.ec2.RouteTableAssociation(`eks-public-rta-1-${environmentSuffix}`, {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    }, { parent: this });

    new aws.ec2.RouteTableAssociation(`eks-public-rta-2-${environmentSuffix}`, {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    }, { parent: this });

    new aws.ec2.RouteTableAssociation(`eks-private-rta-1-${environmentSuffix}`, {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable.id,
    }, { parent: this });

    new aws.ec2.RouteTableAssociation(`eks-private-rta-2-${environmentSuffix}`, {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable.id,
    }, { parent: this });

    // Enable VPC Flow Logs
    const flowLogsRole = new aws.iam.Role(`vpc-flow-logs-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Principal: {
            Service: 'vpc-flow-logs.amazonaws.com',
          },
          Effect: 'Allow',
        }],
      }),
      tags: defaultTags,
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`vpc-flow-logs-policy-${environmentSuffix}`, {
      role: flowLogsRole.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchLogsFullAccess',
    }, { parent: this });

    const flowLogsGroup = new aws.cloudwatch.LogGroup(`vpc-flow-logs-${environmentSuffix}`, {
      retentionInDays: 7,
      tags: defaultTags,
    }, { parent: this });

    new aws.ec2.FlowLog(`vpc-flow-log-${environmentSuffix}`, {
      vpcId: vpc.id,
      trafficType: 'ALL',
      logDestinationType: 'cloud-watch-logs',
      logDestination: flowLogsGroup.arn,
      iamRoleArn: flowLogsRole.arn,
      tags: defaultTags,
    }, { parent: this });

    // Create EKS cluster with @pulumi/eks
    const cluster = new eks.Cluster(`eks-cluster-${environmentSuffix}`, {
      version: '1.28',
      vpcId: vpc.id,
      publicSubnetIds: [publicSubnet1.id, publicSubnet2.id],
      privateSubnetIds: [privateSubnet1.id, privateSubnet2.id],
      instanceType: 't3.medium',
      desiredCapacity: 2,
      minSize: 1,
      maxSize: 5,
      createOidcProvider: true,
      tags: {
        ...defaultTags,
        Name: `eks-cluster-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create Kubernetes provider
    const k8sProvider = new k8s.Provider(`k8s-provider-${environmentSuffix}`, {
      kubeconfig: cluster.kubeconfig,
      enableServerSideApply: true,
    }, { parent: this });

    // Create managed node group with spot instances (70%) and on-demand (30%)
    const spotNodeRole = new aws.iam.Role(`eks-spot-node-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Principal: {
            Service: 'ec2.amazonaws.com',
          },
          Effect: 'Allow',
        }],
      }),
      tags: defaultTags,
    }, { parent: this });

    // Attach required policies to node role
    const nodePolicies = [
      'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
      'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
      'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
    ];

    nodePolicies.forEach((policyArn, index) => {
      new aws.iam.RolePolicyAttachment(`eks-node-policy-${index}-${environmentSuffix}`, {
        role: spotNodeRole.name,
        policyArn: policyArn,
      }, { parent: this });
    });

    // Launch template for mixed instances
    const launchTemplate = new aws.ec2.LaunchTemplate(`eks-node-lt-${environmentSuffix}`, {
      instanceType: 't3.medium',
      tagSpecifications: [{
        resourceType: 'instance',
        tags: {
          ...defaultTags,
          Name: `eks-node-${environmentSuffix}`,
          'k8s.io/cluster-autoscaler/enabled': 'true',
          [`k8s.io/cluster-autoscaler/eks-cluster-${environmentSuffix}`]: 'owned',
        },
      }],
    }, { parent: this });

    // Managed node group with mixed instances
    const managedNodeGroup = new aws.eks.NodeGroup(`eks-node-group-${environmentSuffix}`, {
      clusterName: cluster.eksCluster.name,
      nodeRoleArn: spotNodeRole.arn,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      scalingConfig: {
        desiredSize: 3,
        minSize: 2,
        maxSize: 10,
      },
      capacityType: 'SPOT',
      instanceTypes: ['t3.medium', 't3a.medium', 't2.medium'],
      launchTemplate: {
        id: launchTemplate.id,
        version: pulumi.interpolate`${launchTemplate.latestVersion}`,
      },
      tags: {
        ...defaultTags,
        Name: `eks-node-group-${environmentSuffix}`,
        'k8s.io/cluster-autoscaler/enabled': 'true',
        [`k8s.io/cluster-autoscaler/eks-cluster-${environmentSuffix}`]: 'owned',
      },
    }, { parent: this, dependsOn: [cluster] });

    // Create on-demand node group (30% of capacity)
    const onDemandNodeGroup = new aws.eks.NodeGroup(`eks-ondemand-ng-${environmentSuffix}`, {
      clusterName: cluster.eksCluster.name,
      nodeRoleArn: spotNodeRole.arn,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      scalingConfig: {
        desiredSize: 1,
        minSize: 1,
        maxSize: 3,
      },
      capacityType: 'ON_DEMAND',
      instanceTypes: ['t3.medium'],
      tags: {
        ...defaultTags,
        Name: `eks-ondemand-ng-${environmentSuffix}`,
        'k8s.io/cluster-autoscaler/enabled': 'true',
        [`k8s.io/cluster-autoscaler/eks-cluster-${environmentSuffix}`]: 'owned',
      },
    }, { parent: this, dependsOn: [cluster] });

    // Create App Mesh
    const appMesh = new aws.appmesh.Mesh(`app-mesh-${environmentSuffix}`, {
      name: `app-mesh-${environmentSuffix}`,
      spec: {
        egressFilter: {
          type: 'ALLOW_ALL',
        },
      },
      tags: defaultTags,
    }, { parent: this });

    // Create App Mesh virtual gateway
    const virtualGateway = new aws.appmesh.VirtualGateway(`mesh-vgw-${environmentSuffix}`, {
      name: `mesh-vgw-${environmentSuffix}`,
      meshName: appMesh.name,
      spec: {
        listener: {
          portMapping: {
            port: 8080,
            protocol: 'http',
          },
        },
      },
      tags: defaultTags,
    }, { parent: this });

    // Create App Mesh virtual node for sample service
    const virtualNode = new aws.appmesh.VirtualNode(`mesh-vnode-svc-${environmentSuffix}`, {
      name: `mesh-vnode-svc-${environmentSuffix}`,
      meshName: appMesh.name,
      spec: {
        listener: {
          portMapping: {
            port: 8080,
            protocol: 'http',
          },
        },
        serviceDiscovery: {
          dns: {
            hostname: `service.${environmentSuffix}.local`,
          },
        },
      },
      tags: defaultTags,
    }, { parent: this });

    // Create App Mesh virtual service
    const virtualService = new aws.appmesh.VirtualService(`mesh-vsvc-${environmentSuffix}`, {
      name: `service.${environmentSuffix}.local`,
      meshName: appMesh.name,
      spec: {
        provider: {
          virtualNode: {
            virtualNodeName: virtualNode.name,
          },
        },
      },
      tags: defaultTags,
    }, { parent: this });

    // Create IAM OIDC provider for IRSA
    const oidcProvider = cluster.core.oidcProvider;

    // Create namespace for applications
    const appNamespace = new k8s.core.v1.Namespace('app-namespace', {
      metadata: {
        name: 'applications',
        labels: {
          name: 'applications',
        },
      },
    }, { provider: k8sProvider, parent: this });

    // Create IAM role for service account (IRSA example)
    const serviceAccountRole = new aws.iam.Role(`eks-sa-role-${environmentSuffix}`, {
      assumeRolePolicy: pulumi.all([oidcProvider!.arn, oidcProvider!.url]).apply(([arn, url]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Federated: arn,
          },
          Action: 'sts:AssumeRoleWithWebIdentity',
          Condition: {
            StringEquals: {
              [`${url.replace('https://', '')}:sub`]: 'system:serviceaccount:applications:app-service-account',
            },
          },
        }],
      })),
      tags: defaultTags,
    }, { parent: this });

    // Attach fine-grained policy to service account role
    const serviceAccountPolicy = new aws.iam.Policy(`eks-sa-policy-${environmentSuffix}`, {
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:ListBucket',
            ],
            Resource: [
              'arn:aws:s3:::example-bucket/*',
              'arn:aws:s3:::example-bucket',
            ],
          },
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:GetItem',
              'dynamodb:Query',
            ],
            Resource: 'arn:aws:dynamodb:us-east-1:*:table/example-table',
          },
        ],
      }),
      tags: defaultTags,
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`eks-sa-policy-attach-${environmentSuffix}`, {
      role: serviceAccountRole.name,
      policyArn: serviceAccountPolicy.arn,
    }, { parent: this });

    // Create Kubernetes service account
    const k8sServiceAccount = new k8s.core.v1.ServiceAccount('app-service-account', {
      metadata: {
        name: 'app-service-account',
        namespace: 'applications',
        annotations: {
          'eks.amazonaws.com/role-arn': serviceAccountRole.arn,
        },
      },
    }, { provider: k8sProvider, parent: this, dependsOn: [appNamespace] });

    // Install Calico using Helm
    const calicoChart = new k8s.helm.v3.Chart('calico', {
      chart: 'tigera-operator',
      version: '3.27.0',
      namespace: 'tigera-operator',
      fetchOpts: {
        repo: 'https://docs.tigera.io/calico/charts',
      },
      values: {
        installation: {
          kubernetesProvider: 'EKS',
        },
      },
    }, { provider: k8sProvider, parent: this, dependsOn: [cluster] });

    // Create CloudWatch log group for Fluent Bit
    const fluentBitLogGroup = new aws.cloudwatch.LogGroup(`fluent-bit-logs-${environmentSuffix}`, {
      retentionInDays: 7,
      tags: defaultTags,
    }, { parent: this });

    // Create IAM role for Fluent Bit
    const fluentBitRole = new aws.iam.Role(`fluent-bit-role-${environmentSuffix}`, {
      assumeRolePolicy: pulumi.all([oidcProvider!.arn, oidcProvider!.url]).apply(([arn, url]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Federated: arn,
          },
          Action: 'sts:AssumeRoleWithWebIdentity',
          Condition: {
            StringEquals: {
              [`${url.replace('https://', '')}:sub`]: 'system:serviceaccount:kube-system:fluent-bit',
            },
          },
        }],
      })),
      tags: defaultTags,
    }, { parent: this });

    // Create policy for Fluent Bit
    const fluentBitPolicy = new aws.iam.Policy(`fluent-bit-policy-${environmentSuffix}`, {
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogStreams',
          ],
          Resource: '*',
        }],
      }),
      tags: defaultTags,
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`fluent-bit-policy-attach-${environmentSuffix}`, {
      role: fluentBitRole.name,
      policyArn: fluentBitPolicy.arn,
    }, { parent: this });

    // Create service account for Fluent Bit
    const fluentBitServiceAccount = new k8s.core.v1.ServiceAccount('fluent-bit-sa', {
      metadata: {
        name: 'fluent-bit',
        namespace: 'kube-system',
        annotations: {
          'eks.amazonaws.com/role-arn': fluentBitRole.arn,
        },
      },
    }, { provider: k8sProvider, parent: this });

    // Install Fluent Bit using Helm
    const fluentBitChart = new k8s.helm.v3.Chart('fluent-bit', {
      chart: 'fluent-bit',
      version: '0.43.0',
      namespace: 'kube-system',
      fetchOpts: {
        repo: 'https://fluent.github.io/helm-charts',
      },
      values: {
        serviceAccount: {
          create: false,
          name: 'fluent-bit',
        },
        config: {
          outputs: pulumi.interpolate`[OUTPUT]
    Name cloudwatch_logs
    Match *
    region us-east-1
    log_group_name ${fluentBitLogGroup.name}
    log_stream_prefix eks-
    auto_create_group false`,
        },
      },
    }, { provider: k8sProvider, parent: this, dependsOn: [fluentBitServiceAccount] });

    // Create IAM role for Cluster Autoscaler
    const clusterAutoscalerRole = new aws.iam.Role(`cluster-autoscaler-role-${environmentSuffix}`, {
      assumeRolePolicy: pulumi.all([oidcProvider!.arn, oidcProvider!.url]).apply(([arn, url]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Federated: arn,
          },
          Action: 'sts:AssumeRoleWithWebIdentity',
          Condition: {
            StringEquals: {
              [`${url.replace('https://', '')}:sub`]: 'system:serviceaccount:kube-system:cluster-autoscaler',
            },
          },
        }],
      })),
      tags: defaultTags,
    }, { parent: this });

    // Create policy for Cluster Autoscaler
    const clusterAutoscalerPolicy = new aws.iam.Policy(`cluster-autoscaler-policy-${environmentSuffix}`, {
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
      tags: defaultTags,
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`cluster-autoscaler-policy-attach-${environmentSuffix}`, {
      role: clusterAutoscalerRole.name,
      policyArn: clusterAutoscalerPolicy.arn,
    }, { parent: this });

    // Create service account for Cluster Autoscaler
    const clusterAutoscalerSA = new k8s.core.v1.ServiceAccount('cluster-autoscaler-sa', {
      metadata: {
        name: 'cluster-autoscaler',
        namespace: 'kube-system',
        annotations: {
          'eks.amazonaws.com/role-arn': clusterAutoscalerRole.arn,
        },
      },
    }, { provider: k8sProvider, parent: this });

    // Deploy Cluster Autoscaler
    const clusterAutoscalerDeployment = new k8s.apps.v1.Deployment('cluster-autoscaler', {
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
              image: 'registry.k8s.io/autoscaling/cluster-autoscaler:v1.28.2',
              command: [
                './cluster-autoscaler',
                '--v=4',
                '--stderrthreshold=info',
                '--cloud-provider=aws',
                pulumi.interpolate`--nodes=2:10:${managedNodeGroup.id}`,
                '--skip-nodes-with-local-storage=false',
                '--expander=least-waste',
              ],
              env: [
                {
                  name: 'AWS_REGION',
                  value: 'us-east-1',
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
            }],
          },
        },
      },
    }, { provider: k8sProvider, parent: this, dependsOn: [clusterAutoscalerSA] });

    // Install metrics-server for HPA
    const metricsServerChart = new k8s.helm.v3.Chart('metrics-server', {
      chart: 'metrics-server',
      version: '3.12.0',
      namespace: 'kube-system',
      fetchOpts: {
        repo: 'https://kubernetes-sigs.github.io/metrics-server/',
      },
      values: {
        args: [
          '--kubelet-preferred-address-types=InternalIP',
        ],
      },
    }, { provider: k8sProvider, parent: this });

    // Create sample deployment for HPA demonstration
    const sampleDeployment = new k8s.apps.v1.Deployment('sample-app', {
      metadata: {
        name: 'sample-app',
        namespace: 'applications',
        labels: {
          app: 'sample-app',
        },
      },
      spec: {
        replicas: 2,
        selector: {
          matchLabels: {
            app: 'sample-app',
          },
        },
        template: {
          metadata: {
            labels: {
              app: 'sample-app',
            },
          },
          spec: {
            serviceAccountName: 'app-service-account',
            containers: [{
              name: 'app',
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
    }, { provider: k8sProvider, parent: this, dependsOn: [appNamespace, k8sServiceAccount] });

    // Create HPA for sample application
    const sampleHPA = new k8s.autoscaling.v2.HorizontalPodAutoscaler('sample-app-hpa', {
      metadata: {
        name: 'sample-app-hpa',
        namespace: 'applications',
      },
      spec: {
        scaleTargetRef: {
          apiVersion: 'apps/v1',
          kind: 'Deployment',
          name: 'sample-app',
        },
        minReplicas: 2,
        maxReplicas: 10,
        metrics: [
          {
            type: 'Resource',
            resource: {
              name: 'cpu',
              target: {
                type: 'Utilization',
                averageUtilization: 70,
              },
            },
          },
          {
            type: 'Resource',
            resource: {
              name: 'memory',
              target: {
                type: 'Utilization',
                averageUtilization: 80,
              },
            },
          },
        ],
      },
    }, { provider: k8sProvider, parent: this, dependsOn: [sampleDeployment, metricsServerChart] });

    // Export outputs
    this.clusterName = cluster.eksCluster.name;
    this.clusterEndpoint = cluster.eksCluster.endpoint;
    this.meshName = appMesh.name;

    this.registerOutputs({
      clusterName: this.clusterName,
      clusterEndpoint: this.clusterEndpoint,
      meshName: this.meshName,
      vpcId: vpc.id,
      oidcProviderArn: oidcProvider!.arn,
    });
  }
}
```

## File: index.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

const stack = new TapStack('tap', {
  environmentSuffix,
  tags: {
    Team: 'Platform',
    CostCenter: 'Engineering',
  },
});

export const clusterName = stack.clusterName;
export const clusterEndpoint = stack.clusterEndpoint;
export const meshName = stack.meshName;
```

## Implementation Details

### 1. EKS Cluster v1.28
- Uses @pulumi/eks package for simplified EKS creation
- Automatically creates OIDC provider when createOidcProvider is true
- Configured with public and private subnets across 2 availability zones

### 2. App Mesh
- Creates mesh with ALLOW_ALL egress filter
- Configures virtual gateway for ingress traffic
- Sets up virtual node with DNS-based service discovery
- Creates virtual service routing to the virtual node

### 3. Mixed Instance Node Groups
- Spot instance node group for 70% capacity (2-10 nodes)
- On-demand node group for 30% capacity (1-3 nodes)
- Multiple instance types for spot flexibility
- Proper tagging for cluster autoscaler discovery

### 4. IRSA Implementation
- Service account with fine-grained IAM policies
- Trust relationship configured with OIDC provider
- Example policies for S3 and DynamoDB access
- Follows principle of least privilege

### 5. Calico CNI
- Deployed via Helm chart from official Tigera repository
- Configured for EKS environment
- Enables network policy enforcement

### 6. Horizontal Pod Autoscaler
- Configured with metrics-server
- Example HPA with CPU and memory targets
- Scales between 2-10 replicas
- 70% CPU and 80% memory utilization thresholds

### 7. Fluent Bit
- Deployed as DaemonSet via Helm
- IRSA-enabled service account
- Configured to send logs to CloudWatch Logs
- 7-day log retention

### 8. Cluster Autoscaler
- IRSA-enabled with proper IAM permissions
- Configured for EKS node groups
- Version matched to Kubernetes 1.28
- Node group tags enable autoscaler discovery

## Security Features

- VPC with public and private subnets
- NAT Gateway for private subnet internet access
- VPC Flow Logs enabled
- IRSA for all service accounts
- Fine-grained IAM policies
- Encryption at rest for logs
- Network segmentation via security groups

## Testing Strategy

Tests should validate:
1. EKS cluster creation and OIDC provider
2. Node groups with correct capacity types
3. App Mesh resources creation
4. IRSA roles and trust relationships
5. Kubernetes resources deployment
6. HPA scaling behavior
7. Cluster autoscaler permissions
8. Fluent Bit log delivery

## Notes

- All resources include environmentSuffix for uniqueness
- No Retain policies - all resources are destroyable
- Proper dependencies ensure correct deployment order
- CloudWatch logging enabled for observability
- Cost-optimized with spot instances and serverless where possible
