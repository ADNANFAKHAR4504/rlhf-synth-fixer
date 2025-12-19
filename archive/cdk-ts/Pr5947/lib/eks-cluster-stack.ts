import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as logs from 'aws-cdk-lib/aws-logs';
import { KubectlV29Layer } from '@aws-cdk/lambda-layer-kubectl-v29';
import { Construct } from 'constructs';

export interface EksClusterStackProps {
  environmentSuffix: string;
}

export class EksClusterStack extends Construct {
  public readonly cluster: eks.Cluster;
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: EksClusterStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;
    const region = cdk.Stack.of(this).region;

    // Create VPC for EKS cluster with cost-optimized NAT Gateway configuration
    this.vpc = new ec2.Vpc(this, 'EksVpc', {
      vpcName: `eks-vpc-${environmentSuffix}`,
      maxAzs: 3,
      natGateways: 1, // Cost optimization: 1 NAT Gateway instead of 3
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

    // Add VPC Endpoints for cost optimization and better performance
    this.vpc.addInterfaceEndpoint('LogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.vpc.addInterfaceEndpoint('EcrApiEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.vpc.addInterfaceEndpoint('EcrDkrEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // S3 Gateway Endpoint (free)
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
    });

    // Create KMS key for EKS secrets encryption with automatic rotation
    const kmsKey = new kms.Key(this, 'EksSecretsKey', {
      alias: `eks-secrets-${environmentSuffix}`,
      description: 'KMS key for EKS secrets encryption',
      enableKeyRotation: true,
    });

    // Create CloudWatch Log Group for Fluent Bit with proper retention and encryption
    const fluentBitLogGroup = new logs.LogGroup(this, 'FluentBitLogGroup', {
      logGroupName: `/aws/eks/cluster-logs-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Grant KMS key permissions for CloudWatch Logs
    kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Enable CloudWatch Logs',
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:CreateGrant',
          'kms:DescribeKey',
        ],
        principals: [new iam.ServicePrincipal(`logs.${region}.amazonaws.com`)],
        resources: ['*'],
        conditions: {
          ArnLike: {
            'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${region}:${cdk.Stack.of(this).account}:log-group:/aws/eks/cluster-logs-${environmentSuffix}`,
          },
        },
      })
    );

    // Create EKS cluster
    this.cluster = new eks.Cluster(this, 'EksCluster', {
      clusterName: `eks-cluster-${environmentSuffix}`,
      version: eks.KubernetesVersion.V1_28,
      vpc: this.vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      defaultCapacity: 0,
      secretsEncryptionKey: kmsKey,
      kubectlLayer: new KubectlV29Layer(this, 'KubectlLayer'),
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
    this.cluster.addNodegroupCapacity('NodeGroup1', {
      nodegroupName: `eks-ng1-${environmentSuffix}`,
      instanceTypes: [new ec2.InstanceType('m5.large')],
      minSize: 1,
      maxSize: 3,
      desiredSize: 1,
      subnets: { availabilityZones: [this.vpc.availabilityZones[0]] },
      labels: {
        'node-group': 'ng1',
      },
      tags: {
        'k8s.io/cluster-autoscaler/enabled': 'true',
      },
    });

    this.cluster.addNodegroupCapacity('NodeGroup2', {
      nodegroupName: `eks-ng2-${environmentSuffix}`,
      instanceTypes: [new ec2.InstanceType('m5.large')],
      minSize: 1,
      maxSize: 3,
      desiredSize: 1,
      subnets: { availabilityZones: [this.vpc.availabilityZones[1]] },
      labels: {
        'node-group': 'ng2',
      },
      tags: {
        'k8s.io/cluster-autoscaler/enabled': 'true',
      },
    });

    this.cluster.addNodegroupCapacity('NodeGroup3', {
      nodegroupName: `eks-ng3-${environmentSuffix}`,
      instanceTypes: [new ec2.InstanceType('m5.large')],
      minSize: 1,
      maxSize: 3,
      desiredSize: 1,
      subnets: { availabilityZones: [this.vpc.availabilityZones[2]] },
      labels: {
        'node-group': 'ng3',
      },
      tags: {
        'k8s.io/cluster-autoscaler/enabled': 'true',
      },
    });

    // Create namespace for Fluent Bit with environmentSuffix for uniqueness
    const fluentBitNamespaceName = `amazon-cloudwatch-${environmentSuffix}`;
    const fluentBitNamespace = this.cluster.addManifest('FluentBitNamespace', {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name: fluentBitNamespaceName,
      },
    });

    // Create service account for Fluent Bit with IRSA
    const fluentBitServiceAccount = this.cluster.addServiceAccount(
      'FluentBitServiceAccount',
      {
        name: 'fluent-bit',
        namespace: fluentBitNamespaceName,
      }
    );

    fluentBitServiceAccount.node.addDependency(fluentBitNamespace);

    // Grant CloudWatch and SSM permissions to Fluent Bit
    fluentBitServiceAccount.role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogStreams',
        ],
        resources: [fluentBitLogGroup.logGroupArn],
      })
    );

    fluentBitServiceAccount.role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter', 'ssm:GetParameters'],
        resources: [
          `arn:aws:ssm:${region}:${cdk.Stack.of(this).account}:parameter/eks/${environmentSuffix}/fluent-bit-config`,
        ],
      })
    );

    // Grant KMS decrypt permissions for SSM parameter
    kmsKey.grantDecrypt(fluentBitServiceAccount.role);

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
    Mem_Buf_Limit             5MB
    Skip_Long_Lines           On

[FILTER]
    Name                      kubernetes
    Match                     kube.*
    Kube_URL                  https://kubernetes.default.svc:443
    Kube_CA_File              /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    Kube_Token_File           /var/run/secrets/kubernetes.io/serviceaccount/token
    Merge_Log                 On
    Keep_Log                  Off
    K8S-Logging.Parser        On
    K8S-Logging.Exclude       On

[OUTPUT]
    Name                      cloudwatch_logs
    Match                     *
    region                    ${region}
    log_group_name            ${fluentBitLogGroup.logGroupName}
    auto_create_group         false
    log_stream_prefix         fluent-bit-`,
      tier: ssm.ParameterTier.ADVANCED,
    });

    // Create service account for the config map creator job
    const configMapCreatorSA = this.cluster.addServiceAccount(
      'ConfigMapCreatorSA',
      {
        name: 'configmap-creator',
        namespace: fluentBitNamespaceName,
      }
    );

    configMapCreatorSA.node.addDependency(fluentBitNamespace);
    configMapCreatorSA.role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [fluentBitConfig.parameterArn],
      })
    );
    kmsKey.grantDecrypt(configMapCreatorSA.role);

    // Job to create ConfigMap from SSM Parameter
    const configMapCreatorJob = this.cluster.addManifest(
      'ConfigMapCreatorJob',
      {
        apiVersion: 'batch/v1',
        kind: 'Job',
        metadata: {
          name: 'fluent-bit-config-loader',
          namespace: fluentBitNamespaceName,
        },
        spec: {
          template: {
            metadata: {
              labels: {
                app: 'config-loader',
              },
            },
            spec: {
              serviceAccountName: 'configmap-creator',
              restartPolicy: 'OnFailure',
              containers: [
                {
                  name: 'aws-cli',
                  image: 'amazon/aws-cli:latest',
                  command: [
                    'sh',
                    '-c',
                    `aws ssm get-parameter --name /eks/${environmentSuffix}/fluent-bit-config --with-decryption --region ${region} --query 'Parameter.Value' --output text > /tmp/fluent-bit.conf && kubectl create configmap fluent-bit-config --from-file=fluent-bit.conf=/tmp/fluent-bit.conf --namespace ${fluentBitNamespaceName} --dry-run=client -o yaml | kubectl apply -f -`,
                  ],
                },
              ],
            },
          },
          backoffLimit: 4,
        },
      }
    );

    configMapCreatorJob.node.addDependency(configMapCreatorSA);
    configMapCreatorJob.node.addDependency(fluentBitConfig);

    // Deploy Fluent Bit as a DaemonSet with ConfigMap mounted from SSM
    const fluentBitDaemonSet = this.cluster.addManifest('FluentBitDaemonSet', {
      apiVersion: 'apps/v1',
      kind: 'DaemonSet',
      metadata: {
        name: 'fluent-bit',
        namespace: fluentBitNamespaceName,
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
                image:
                  'public.ecr.aws/aws-observability/aws-for-fluent-bit:latest',
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
                    readOnly: true,
                  },
                  {
                    name: 'varlibdockercontainers',
                    mountPath: '/var/lib/docker/containers',
                    readOnly: true,
                  },
                  {
                    name: 'fluent-bit-config',
                    mountPath: '/fluent-bit/etc',
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
              {
                name: 'fluent-bit-config',
                configMap: {
                  name: 'fluent-bit-config',
                },
              },
            ],
            tolerations: [
              {
                key: 'node-role.kubernetes.io/master',
                operator: 'Exists',
                effect: 'NoSchedule',
              },
            ],
          },
        },
      },
    });

    fluentBitDaemonSet.node.addDependency(fluentBitServiceAccount);
    fluentBitDaemonSet.node.addDependency(configMapCreatorJob);

    // Deploy metrics-server using Helm
    this.cluster.addHelmChart('MetricsServer', {
      chart: 'metrics-server',
      repository: 'https://kubernetes-sigs.github.io/metrics-server/',
      namespace: 'kube-system',
      version: '3.11.0',
      values: {
        args: ['--kubelet-preferred-address-types=InternalIP'],
        resources: {
          requests: {
            cpu: '100m',
            memory: '200Mi',
          },
        },
      },
    });

    // Create namespaces with resource quotas and pod security standards
    const namespaceConfigs = [
      { name: 'dev', enforce: 'baseline' },
      { name: 'staging', enforce: 'baseline' },
      { name: 'prod', enforce: 'restricted' },
    ];

    namespaceConfigs.forEach(nsConfig => {
      // Create namespace with Pod Security Standards labels
      const namespace = this.cluster.addManifest(`${nsConfig.name}Namespace`, {
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: {
          name: nsConfig.name,
          labels: {
            'pod-security.kubernetes.io/enforce': nsConfig.enforce,
            'pod-security.kubernetes.io/audit': nsConfig.enforce,
            'pod-security.kubernetes.io/warn': nsConfig.enforce,
            Environment: nsConfig.name,
          },
        },
      });

      // Create resource quota for each namespace
      const resourceQuota = this.cluster.addManifest(
        `${nsConfig.name}ResourceQuota`,
        {
          apiVersion: 'v1',
          kind: 'ResourceQuota',
          metadata: {
            name: 'resource-quota',
            namespace: nsConfig.name,
          },
          spec: {
            hard: {
              'requests.cpu': '100',
              'requests.memory': '200Gi',
              'limits.cpu': '200',
              'limits.memory': '400Gi',
              pods: '100',
            },
          },
        }
      );

      resourceQuota.node.addDependency(namespace);

      // Create limit ranges for default resource limits
      const limitRange = this.cluster.addManifest(
        `${nsConfig.name}LimitRange`,
        {
          apiVersion: 'v1',
          kind: 'LimitRange',
          metadata: {
            name: 'resource-limits',
            namespace: nsConfig.name,
          },
          spec: {
            limits: [
              {
                type: 'Container',
                default: {
                  cpu: '500m',
                  memory: '1Gi',
                },
                defaultRequest: {
                  cpu: '100m',
                  memory: '256Mi',
                },
              },
            ],
          },
        }
      );

      limitRange.node.addDependency(namespace);
    });

    // Add tags to all resources
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('CostCenter', 'FinTech');

    // Outputs with proper export names for integration tests
    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      description: 'EKS Cluster Name',
      exportName: `EksClusterName${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: this.cluster.clusterEndpoint,
      description: 'EKS Cluster Endpoint',
      exportName: `EksClusterEndpoint${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OIDCProviderArn', {
      value: this.cluster.openIdConnectProvider.openIdConnectProviderArn,
      description: 'OIDC Provider ARN',
      exportName: `EksOIDCProviderArn${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KubectlConfig', {
      value: `aws eks update-kubeconfig --name ${this.cluster.clusterName} --region ${region}`,
      description: 'Command to configure kubectl',
      exportName: `EksKubectlConfig${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `EksVpcId${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.privateSubnets.map(s => s.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `EksPrivateSubnetIds${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterSecurityGroupId', {
      value: this.cluster.clusterSecurityGroup.securityGroupId,
      description: 'Cluster Security Group ID',
      exportName: `EksClusterSecurityGroupId${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'FluentBitLogGroupName', {
      value: fluentBitLogGroup.logGroupName,
      description: 'Fluent Bit CloudWatch Log Group Name',
      exportName: `EksFluentBitLogGroupName${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: kmsKey.keyArn,
      description: 'KMS Key ARN for EKS Secrets',
      exportName: `EksKmsKeyArn${environmentSuffix}`,
    });
  }
}
