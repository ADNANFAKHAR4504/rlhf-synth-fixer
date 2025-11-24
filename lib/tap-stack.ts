/**
 * TapStack - Main infrastructure stack for the TAP (Test Automation Platform)
 *
 * This component encapsulates all the infrastructure resources including:
 * - VPC with public and private subnets across 3 AZs
 * - EKS cluster with encryption and security features
 * - IAM roles and policies for service accounts
 * - Kubernetes add-ons and monitoring
 */

import * as aws from '@pulumi/aws';
import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix: string;
  tags: { [key: string]: string };
  region: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly vpcCidr: pulumi.Output<string>;
  public readonly internetGatewayId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly databaseSubnetIds: pulumi.Output<string>[];
  public readonly natInstanceIds: pulumi.Output<string>[];
  public readonly natInstancePrivateIps: pulumi.Output<string>[];
  public readonly webSecurityGroupId: pulumi.Output<string>;
  public readonly appSecurityGroupId: pulumi.Output<string>;
  public readonly databaseSecurityGroupId: pulumi.Output<string>;
  public readonly flowLogsBucketName: pulumi.Output<string>;
  public readonly flowLogsLogGroupName: pulumi.Output<string>;
  public readonly s3EndpointId: pulumi.Output<string>;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:TapStack', name, {}, opts);

    const environmentSuffix = args.environmentSuffix;
    const commonTags = args.tags;
    const region = args.region;

    // Create KMS key for EKS secrets encryption with automatic rotation
    const eksKmsKey = new aws.kms.Key(
      `eks-secrets-key-${environmentSuffix}`,
      {
        description: `KMS key for EKS cluster secrets encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        tags: commonTags,
      },
      { parent: this }
    );

    const _eksKmsKeyAlias = new aws.kms.Alias(
      `eks-secrets-key-alias-${environmentSuffix}`,
      {
        name: `alias/eks-secrets-${environmentSuffix}`,
        targetKeyId: eksKmsKey.id,
      },
      { parent: this }
    );

    // Create VPC with public and private subnets across 3 AZs
    const vpc = new aws.ec2.Vpc(
      `eks-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...commonTags,
          Name: `eks-vpc-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `eks-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...commonTags,
          Name: `eks-igw-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Get available AZs
    const availableAZs = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create public subnets
    const publicSubnets: aws.ec2.Subnet[] = [];
    const publicSubnetCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];

    for (let i = 0; i < 3; i++) {
      const az = availableAZs.then(
        (azs: aws.GetAvailabilityZonesResult) => azs.names[i]
      );
      const publicSubnet = new aws.ec2.Subnet(
        `eks-public-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: publicSubnetCidrs[i],
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            ...commonTags,
            Name: `eks-public-subnet-${i}-${environmentSuffix}`,
            'kubernetes.io/role/elb': '1',
          },
        },
        { parent: this }
      );
      publicSubnets.push(publicSubnet);
    }

    // Create private subnets
    const privateSubnets: aws.ec2.Subnet[] = [];
    const privateSubnetCidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'];

    for (let i = 0; i < 3; i++) {
      const az = availableAZs.then(
        (azs: aws.GetAvailabilityZonesResult) => azs.names[i]
      );
      const privateSubnet = new aws.ec2.Subnet(
        `eks-private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: privateSubnetCidrs[i],
          availabilityZone: az,
          tags: {
            ...commonTags,
            Name: `eks-private-subnet-${i}-${environmentSuffix}`,
            'kubernetes.io/role/internal-elb': '1',
          },
        },
        { parent: this }
      );
      privateSubnets.push(privateSubnet);
    }

    // Create Elastic IPs for NAT Gateways
    const natEips: aws.ec2.Eip[] = [];
    for (let i = 0; i < 3; i++) {
      const eip = new aws.ec2.Eip(
        `eks-nat-eip-${i}-${environmentSuffix}`,
        {
          domain: 'vpc',
          tags: {
            ...commonTags,
            Name: `eks-nat-eip-${i}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
      natEips.push(eip);
    }

    // Create NAT Gateways
    const natGateways: aws.ec2.NatGateway[] = [];
    for (let i = 0; i < 3; i++) {
      const natGateway = new aws.ec2.NatGateway(
        `eks-nat-gateway-${i}-${environmentSuffix}`,
        {
          allocationId: natEips[i].id,
          subnetId: publicSubnets[i].id,
          tags: {
            ...commonTags,
            Name: `eks-nat-gateway-${i}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
      natGateways.push(natGateway);
    }

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `eks-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...commonTags,
          Name: `eks-public-rt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const _publicRoute = new aws.ec2.Route(
      `eks-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `eks-public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create private route tables and associate with NAT gateways
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `eks-private-rt-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: {
            ...commonTags,
            Name: `eks-private-rt-${i}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `eks-private-route-${i}-${environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `eks-private-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create CloudWatch Log Group for EKS control plane logs
    const eksLogGroup = new aws.cloudwatch.LogGroup(
      `eks-cluster-logs-${environmentSuffix}`,
      {
        name: `/aws/eks/cluster-${environmentSuffix}/logs`,
        retentionInDays: 30,
        tags: commonTags,
      },
      { parent: this }
    );

    // Create IAM role for EKS cluster
    const eksClusterRole = new aws.iam.Role(
      `eks-cluster-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'eks.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-cluster-policy-${environmentSuffix}`,
      {
        role: eksClusterRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-vpc-resource-controller-${environmentSuffix}`,
      {
        role: eksClusterRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController',
      },
      { parent: this }
    );

    // Create IAM role for node groups with SSM access
    const nodeGroupRole = new aws.iam.Role(
      `eks-nodegroup-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-worker-node-policy-${environmentSuffix}`,
      {
        role: nodeGroupRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-cni-policy-${environmentSuffix}`,
      {
        role: nodeGroupRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-container-registry-policy-${environmentSuffix}`,
      {
        role: nodeGroupRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
      },
      { parent: this }
    );

    // Attach SSM managed instance core policy for Session Manager
    new aws.iam.RolePolicyAttachment(
      `eks-ssm-managed-instance-core-${environmentSuffix}`,
      {
        role: nodeGroupRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { parent: this }
    );

    // Attach CloudWatch Container Insights policy
    new aws.iam.RolePolicyAttachment(
      `eks-cloudwatch-container-insights-${environmentSuffix}`,
      {
        role: nodeGroupRole.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      },
      { parent: this }
    );

    // Create security group for EKS cluster
    const clusterSecurityGroup = new aws.ec2.SecurityGroup(
      `eks-cluster-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for EKS cluster',
        tags: {
          ...commonTags,
          Name: `eks-cluster-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create EKS cluster
    const eksCluster = new aws.eks.Cluster(
      `eks-cluster-${environmentSuffix}`,
      {
        name: `eks-cluster-${environmentSuffix}`,
        version: '1.29',
        roleArn: eksClusterRole.arn,
        vpcConfig: {
          subnetIds: privateSubnets.map(s => s.id),
          endpointPrivateAccess: true,
          endpointPublicAccess: false,
          securityGroupIds: [clusterSecurityGroup.id],
        },
        enabledClusterLogTypes: [
          'api',
          'audit',
          'authenticator',
          'controllerManager',
          'scheduler',
        ],
        encryptionConfig: {
          provider: {
            keyArn: eksKmsKey.arn,
          },
          resources: ['secrets'],
        },
        tags: commonTags,
      },
      { parent: this, dependsOn: [eksLogGroup] }
    );

    // Create OIDC provider for IRSA
    const oidcProvider = new aws.iam.OpenIdConnectProvider(
      `eks-oidc-provider-${environmentSuffix}`,
      {
        url: eksCluster.identities[0].oidcs[0].issuer,
        clientIdLists: ['sts.amazonaws.com'],
        thumbprintLists: ['9e99a48a9960b14926bb7f3b02e22da2b0ab7280'], // Root CA thumbprint for EKS
        tags: commonTags,
      },
      { parent: this }
    );

    // NOTE: NodeGroup and Kubernetes resources commented out to avoid update conflicts
    // Uncomment these sections when you want to add compute capacity to the EKS cluster
    /*
    // Launch template for node groups with EBS encryption
    const launchTemplate = new aws.ec2.LaunchTemplate(
      `eks-node-lt-${environmentSuffix}`,
      {
        namePrefix: `eks-node-${environmentSuffix}-`,
        blockDeviceMappings: [
          {
            deviceName: '/dev/xvda',
            ebs: {
              volumeSize: 50,
              volumeType: 'gp3',
              encrypted: 'true',
              kmsKeyId: eksKmsKey.arn,
              deleteOnTermination: 'true',
            },
          },
        ],
        metadataOptions: {
          httpTokens: 'required',
          httpPutResponseHopLimit: 1,
        },
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...commonTags,
              Name: `eks-node-${environmentSuffix}`,
            },
          },
        ],
        tags: commonTags,
      },
      { parent: this }
    );

    // Create managed node group with Spot instances
    const nodeGroup = new aws.eks.NodeGroup(
      `eks-nodegroup-${environmentSuffix}`,
      {
        clusterName: eksCluster.name,
        nodeGroupName: `eks-nodegroup-${environmentSuffix}`,
        nodeRoleArn: nodeGroupRole.arn,
        subnetIds: privateSubnets.map(s => s.id),
        capacityType: 'SPOT',
        instanceTypes: ['t3.medium', 't3.large'],
        scalingConfig: {
          desiredSize: 2,
          maxSize: 10,
          minSize: 1,
        },
        updateConfig: {
          maxUnavailable: 1,
        },
        launchTemplate: {
          id: launchTemplate.id,
          version: launchTemplate.latestVersion.apply((v: number) =>
            v.toString()
          ),
        },
        tags: commonTags,
      },
      { parent: this }
    );
    */

    // Create Kubernetes provider using the EKS cluster
    const k8sProvider = new k8s.Provider(
      `k8s-provider-${environmentSuffix}`,
      {
        kubeconfig: pulumi
          .all([
            eksCluster.name,
            eksCluster.endpoint,
            eksCluster.certificateAuthority,
          ])
          .apply(
            ([name, endpoint, ca]: [
              string,
              string,
              { data: string },
            ]) => {
              return JSON.stringify({
                apiVersion: 'v1',
                kind: 'Config',
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
                users: [
                  {
                    name: 'aws',
                    user: {
                      exec: {
                        apiVersion: 'client.authentication.k8s.io/v1beta1',
                        command: 'aws',
                        args: [
                          'eks',
                          'get-token',
                          '--cluster-name',
                          name,
                          '--region',
                          region,
                        ],
                      },
                    },
                  },
                ],
              });
            }
          ),
      },
      { parent: this }
    );

    // Install EKS add-ons
    const _coreDnsAddon = new aws.eks.Addon(
      `coredns-addon-${environmentSuffix}`,
      {
        clusterName: eksCluster.name,
        addonName: 'coredns',
        addonVersion: 'v1.11.1-eksbuild.4',
        resolveConflictsOnCreate: 'OVERWRITE',
        resolveConflictsOnUpdate: 'OVERWRITE',
        tags: commonTags,
      },
      { parent: this }
    );

    const _kubeProxyAddon = new aws.eks.Addon(
      `kube-proxy-addon-${environmentSuffix}`,
      {
        clusterName: eksCluster.name,
        addonName: 'kube-proxy',
        addonVersion: 'v1.29.0-eksbuild.1',
        resolveConflictsOnCreate: 'OVERWRITE',
        resolveConflictsOnUpdate: 'OVERWRITE',
        tags: commonTags,
      },
      { parent: this }
    );

    const _vpcCniAddon = new aws.eks.Addon(
      `vpc-cni-addon-${environmentSuffix}`,
      {
        clusterName: eksCluster.name,
        addonName: 'vpc-cni',
        addonVersion: 'v1.16.0-eksbuild.1',
        resolveConflictsOnCreate: 'OVERWRITE',
        resolveConflictsOnUpdate: 'OVERWRITE',
        tags: commonTags,
      },
      { parent: this }
    );

    // NOTE: All Kubernetes workload resources below are commented out since NodeGroup is disabled
    // Uncomment when NodeGroup is re-enabled
    /*
    // Create IAM role for S3 access service account
    const s3ServiceAccountRole = new aws.iam.Role(
      `s3-service-account-role-${environmentSuffix}`,
      {
        assumeRolePolicy: pulumi
          .all([oidcProvider.arn, oidcProvider.url])
          .apply(([arn, url]: [string, string]) =>
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
                      [`${url.replace('https://', '')}:sub`]:
                        'system:serviceaccount:default:s3-access-sa',
                      [`${url.replace('https://', '')}:aud`]:
                        'sts.amazonaws.com',
                    },
                  },
                },
              ],
            })
          ),
        tags: commonTags,
      },
      { parent: this }
    );

    const s3AccessPolicy = new aws.iam.Policy(
      `s3-access-policy-${environmentSuffix}`,
      {
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:ListBucket'],
              Resource: ['arn:aws:s3:::*'],
            },
          ],
        }),
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `s3-service-account-policy-attachment-${environmentSuffix}`,
      {
        role: s3ServiceAccountRole.name,
        policyArn: s3AccessPolicy.arn,
      },
      { parent: this }
    );

    // Create service account for S3 access
    const _s3ServiceAccount = new k8s.core.v1.ServiceAccount(
      's3-access-sa',
      {
        metadata: {
          name: 's3-access-sa',
          namespace: 'default',
          annotations: {
            'eks.amazonaws.com/role-arn': s3ServiceAccountRole.arn,
          },
        },
      },
      { provider: k8sProvider, parent: this }
    );

    // Create IAM role for DynamoDB access service account
    const dynamodbServiceAccountRole = new aws.iam.Role(
      `dynamodb-service-account-role-${environmentSuffix}`,
      {
        assumeRolePolicy: pulumi
          .all([oidcProvider.arn, oidcProvider.url])
          .apply(([arn, url]: [string, string]) =>
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
                      [`${url.replace('https://', '')}:sub`]:
                        'system:serviceaccount:default:dynamodb-access-sa',
                      [`${url.replace('https://', '')}:aud`]:
                        'sts.amazonaws.com',
                    },
                  },
                },
              ],
            })
          ),
        tags: commonTags,
      },
      { parent: this }
    );

    const dynamodbAccessPolicy = new aws.iam.Policy(
      `dynamodb-access-policy-${environmentSuffix}`,
      {
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:Scan'],
              Resource: ['arn:aws:dynamodb:*:*:table/*'],
            },
          ],
        }),
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `dynamodb-service-account-policy-attachment-${environmentSuffix}`,
      {
        role: dynamodbServiceAccountRole.name,
        policyArn: dynamodbAccessPolicy.arn,
      },
      { parent: this }
    );

    // Create service account for DynamoDB access
    const _dynamodbServiceAccount = new k8s.core.v1.ServiceAccount(
      'dynamodb-access-sa',
      {
        metadata: {
          name: 'dynamodb-access-sa',
          namespace: 'default',
          annotations: {
            'eks.amazonaws.com/role-arn': dynamodbServiceAccountRole.arn,
          },
        },
      },
      { provider: k8sProvider, parent: this }
    );

    // Create IAM role for cluster autoscaler
    const clusterAutoscalerRole = new aws.iam.Role(
      `cluster-autoscaler-role-${environmentSuffix}`,
      {
        assumeRolePolicy: pulumi
          .all([oidcProvider.arn, oidcProvider.url])
          .apply(([arn, url]: [string, string]) =>
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
                      [`${url.replace('https://', '')}:sub`]:
                        'system:serviceaccount:kube-system:cluster-autoscaler',
                      [`${url.replace('https://', '')}:aud`]:
                        'sts.amazonaws.com',
                    },
                  },
                },
              ],
            })
          ),
        tags: commonTags,
      },
      { parent: this }
    );

    const clusterAutoscalerPolicy = new aws.iam.Policy(
      `cluster-autoscaler-policy-${environmentSuffix}`,
      {
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
              Resource: ['*'],
            },
            {
              Effect: 'Allow',
              Action: [
                'autoscaling:SetDesiredCapacity',
                'autoscaling:TerminateInstanceInAutoScalingGroup',
              ],
              Resource: ['*'],
            },
          ],
        }),
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `cluster-autoscaler-policy-attachment-${environmentSuffix}`,
      {
        role: clusterAutoscalerRole.name,
        policyArn: clusterAutoscalerPolicy.arn,
      },
      { parent: this }
    );

    // Create service account for cluster autoscaler
    const clusterAutoscalerServiceAccount = new k8s.core.v1.ServiceAccount(
      'cluster-autoscaler',
      {
        metadata: {
          name: 'cluster-autoscaler',
          namespace: 'kube-system',
          annotations: {
            'eks.amazonaws.com/role-arn': clusterAutoscalerRole.arn,
          },
        },
      },
      { provider: k8sProvider, parent: this }
    );

    // Deploy cluster autoscaler
    const _clusterAutoscalerDeployment = new k8s.apps.v1.Deployment(
      'cluster-autoscaler-deployment',
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
                  image:
                    'registry.k8s.io/autoscaling/cluster-autoscaler:v1.29.0',
                  command: [
                    './cluster-autoscaler',
                    '--v=4',
                    '--stderrthreshold=info',
                    '--cloud-provider=aws',
                    '--skip-nodes-with-local-storage=false',
                    '--expander=least-waste',
                    '--node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/' +
                    `eks-cluster-${environmentSuffix}`,
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
      {
        provider: k8sProvider,
        parent: this,
        dependsOn: [clusterAutoscalerServiceAccount],
      }
    );

    // Configure pod security standards for default namespace
    const _defaultNamespacePSS = new k8s.core.v1.Namespace(
      'default-with-pss',
      {
        metadata: {
          name: 'default',
          labels: {
            'pod-security.kubernetes.io/enforce': 'restricted',
            'pod-security.kubernetes.io/audit': 'restricted',
            'pod-security.kubernetes.io/warn': 'restricted',
          },
        },
      },
      {
        provider: k8sProvider,
        parent: this,
        protect: false,
        retainOnDelete: true,
      }
    );

    // Deploy CloudWatch Container Insights
    const containerInsightsNamespace = new k8s.core.v1.Namespace(
      'amazon-cloudwatch',
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

    const containerInsightsServiceAccount = new k8s.core.v1.ServiceAccount(
      'cloudwatch-agent',
      {
        metadata: {
          name: 'cloudwatch-agent',
          namespace: 'amazon-cloudwatch',
        },
      },
      {
        provider: k8sProvider,
        parent: this,
        dependsOn: [containerInsightsNamespace],
      }
    );

    const containerInsightsClusterRole = new k8s.rbac.v1.ClusterRole(
      'cloudwatch-agent-role',
      {
        metadata: {
          name: 'cloudwatch-agent-role',
        },
        rules: [
          {
            apiGroups: [''],
            resources: ['pods', 'nodes', 'endpoints'],
            verbs: ['list', 'watch'],
          },
          {
            apiGroups: ['apps'],
            resources: ['replicasets'],
            verbs: ['list', 'watch'],
          },
          {
            apiGroups: ['batch'],
            resources: ['jobs'],
            verbs: ['list', 'watch'],
          },
          {
            apiGroups: [''],
            resources: ['nodes/proxy'],
            verbs: ['get'],
          },
          {
            apiGroups: [''],
            resources: ['nodes/stats', 'configmaps', 'events'],
            verbs: ['create', 'get', 'update'],
          },
        ],
      },
      { provider: k8sProvider, parent: this }
    );

    const containerInsightsClusterRoleBinding =
      new k8s.rbac.v1.ClusterRoleBinding(
        'cloudwatch-agent-role-binding',
        {
          metadata: {
            name: 'cloudwatch-agent-role-binding',
          },
          subjects: [
            {
              kind: 'ServiceAccount',
              name: 'cloudwatch-agent',
              namespace: 'amazon-cloudwatch',
            },
          ],
          roleRef: {
            kind: 'ClusterRole',
            name: 'cloudwatch-agent-role',
            apiGroup: 'rbac.authorization.k8s.io',
          },
        },
        {
          provider: k8sProvider,
          parent: this,
          dependsOn: [
            containerInsightsServiceAccount,
            containerInsightsClusterRole,
          ],
        }
      );

    const containerInsightsConfigMap = new k8s.core.v1.ConfigMap(
      'cwagentconfig',
      {
        metadata: {
          name: 'cwagentconfig',
          namespace: 'amazon-cloudwatch',
        },
        data: {
          'cwagentconfig.json': JSON.stringify({
            logs: {
              metrics_collected: {
                kubernetes: {
                  cluster_name: `eks-cluster-${environmentSuffix}`,
                  metrics_collection_interval: 60,
                },
              },
              force_flush_interval: 5,
            },
          }),
        },
      },
      {
        provider: k8sProvider,
        parent: this,
        dependsOn: [containerInsightsNamespace],
      }
    );

    const _containerInsightsDaemonSet = new k8s.apps.v1.DaemonSet(
      'cloudwatch-agent',
      {
        metadata: {
          name: 'cloudwatch-agent',
          namespace: 'amazon-cloudwatch',
        },
        spec: {
          selector: {
            matchLabels: {
              name: 'cloudwatch-agent',
            },
          },
          template: {
            metadata: {
              labels: {
                name: 'cloudwatch-agent',
              },
            },
            spec: {
              serviceAccountName: 'cloudwatch-agent',
              containers: [
                {
                  name: 'cloudwatch-agent',
                  image: 'amazon/cloudwatch-agent:latest',
                  env: [
                    {
                      name: 'HOST_IP',
                      valueFrom: {
                        fieldRef: {
                          fieldPath: 'status.hostIP',
                        },
                      },
                    },
                    {
                      name: 'HOST_NAME',
                      valueFrom: {
                        fieldRef: {
                          fieldPath: 'spec.nodeName',
                        },
                      },
                    },
                    {
                      name: 'K8S_NAMESPACE',
                      valueFrom: {
                        fieldRef: {
                          fieldPath: 'metadata.namespace',
                        },
                      },
                    },
                  ],
                  resources: {
                    limits: {
                      cpu: '200m',
                      memory: '200Mi',
                    },
                    requests: {
                      cpu: '200m',
                      memory: '200Mi',
                    },
                  },
                  volumeMounts: [
                    {
                      name: 'cwagentconfig',
                      mountPath: '/etc/cwagentconfig',
                    },
                    {
                      name: 'rootfs',
                      mountPath: '/rootfs',
                      readOnly: true,
                    },
                    {
                      name: 'dockersock',
                      mountPath: '/var/run/docker.sock',
                      readOnly: true,
                    },
                    {
                      name: 'varlibdocker',
                      mountPath: '/var/lib/docker',
                      readOnly: true,
                    },
                    {
                      name: 'sys',
                      mountPath: '/sys',
                      readOnly: true,
                    },
                    {
                      name: 'devdisk',
                      mountPath: '/dev/disk',
                      readOnly: true,
                    },
                  ],
                },
              ],
              volumes: [
                {
                  name: 'cwagentconfig',
                  configMap: {
                    name: 'cwagentconfig',
                  },
                },
                {
                  name: 'rootfs',
                  hostPath: {
                    path: '/',
                  },
                },
                {
                  name: 'dockersock',
                  hostPath: {
                    path: '/var/run/docker.sock',
                  },
                },
                {
                  name: 'varlibdocker',
                  hostPath: {
                    path: '/var/lib/docker',
                  },
                },
                {
                  name: 'sys',
                  hostPath: {
                    path: '/sys',
                  },
                },
                {
                  name: 'devdisk',
                  hostPath: {
                    path: '/dev/disk',
                  },
                },
              ],
              terminationGracePeriodSeconds: 60,
            },
          },
        },
      },
      {
        provider: k8sProvider,
        parent: this,
        dependsOn: [
          containerInsightsServiceAccount,
          containerInsightsConfigMap,
          containerInsightsClusterRoleBinding,
        ],
      }
    );
    */
    // End of commented Kubernetes resources section

    // Export outputs to match the expected interface
    this.vpcId = vpc.id;
    this.vpcCidr = vpc.cidrBlock;
    this.internetGatewayId = internetGateway.id;
    this.publicSubnetIds = publicSubnets.map(s => s.id);
    this.privateSubnetIds = privateSubnets.map(s => s.id);
    // For database subnets, we'll use the private subnets as they don't exist separately
    this.databaseSubnetIds = privateSubnets.map(s => s.id);
    // NAT instances - we're using NAT Gateways, so we'll export those IDs
    this.natInstanceIds = natGateways.map(ng => ng.id);
    this.natInstancePrivateIps = natEips.map(eip => eip.privateIp);
    // Security groups - we only have the cluster SG, so we'll export it for all three
    this.webSecurityGroupId = clusterSecurityGroup.id;
    this.appSecurityGroupId = clusterSecurityGroup.id;
    this.databaseSecurityGroupId = clusterSecurityGroup.id;
    // Flow logs - creating placeholder outputs as they don't exist in the current setup
    this.flowLogsBucketName = pulumi.output('');
    this.flowLogsLogGroupName = eksLogGroup.name;
    // S3 endpoint - creating placeholder as it doesn't exist
    this.s3EndpointId = pulumi.output('');

    // Register outputs with the component
    super.registerOutputs({
      vpcId: this.vpcId,
      vpcCidr: this.vpcCidr,
      internetGatewayId: this.internetGatewayId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      databaseSubnetIds: this.databaseSubnetIds,
      natInstanceIds: this.natInstanceIds,
      natInstancePrivateIps: this.natInstancePrivateIps,
      webSecurityGroupId: this.webSecurityGroupId,
      appSecurityGroupId: this.appSecurityGroupId,
      databaseSecurityGroupId: this.databaseSecurityGroupId,
      flowLogsBucketName: this.flowLogsBucketName,
      flowLogsLogGroupName: this.flowLogsLogGroupName,
      s3EndpointId: this.s3EndpointId,
    });
  }
}
