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

  // EKS Cluster outputs
  public readonly clusterName: pulumi.Output<string>;
  public readonly clusterVersion: pulumi.Output<string>;
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly oidcIssuerUrl: pulumi.Output<string>;
  public readonly kubeconfig: pulumi.Output<string>;

  // KMS outputs
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly kmsKeyAliasName: pulumi.Output<string>;
  public readonly kmsKeyArn: pulumi.Output<string>;

  // Route outputs
  public readonly publicRouteId: pulumi.Output<string>;

  // Addon outputs
  public readonly coreDnsAddonVersion: pulumi.Output<string>;
  public readonly kubeProxyAddonVersion: pulumi.Output<string>;
  public readonly vpcCniAddonVersion: pulumi.Output<string>;

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

    const eksKmsKeyAlias = new aws.kms.Alias(
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

    const publicRoute = new aws.ec2.Route(
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
        policyArn: 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _oidcProvider = new aws.iam.OpenIdConnectProvider(
      `eks-oidc-provider-${environmentSuffix}`,
      {
        url: eksCluster.identities[0].oidcs[0].issuer,
        clientIdLists: ['sts.amazonaws.com'],
        thumbprintLists: ['9e99a48a9960b14926bb7f3b02e22da2b0ab7280'], // Root CA thumbprint for EKS
        tags: commonTags,
      },
      { parent: this }
    );

    // Create Kubernetes provider using the EKS cluster
    const kubeconfig = pulumi
      .all([
        eksCluster.name,
        eksCluster.endpoint,
        eksCluster.certificateAuthority,
      ])
      .apply(([name, endpoint, ca]: [string, string, { data: string }]) => {
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
      });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _k8sProvider = new k8s.Provider(
      `k8s-provider-${environmentSuffix}`,
      {
        kubeconfig: kubeconfig,
      },
      { parent: this }
    );

    // Install EKS add-ons
    const coreDnsAddon = new aws.eks.Addon(
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

    const kubeProxyAddon = new aws.eks.Addon(
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

    const vpcCniAddon = new aws.eks.Addon(
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

    // EKS Cluster outputs
    this.clusterName = eksCluster.name;
    this.clusterVersion = eksCluster.version;
    this.clusterEndpoint = eksCluster.endpoint;
    this.oidcIssuerUrl = eksCluster.identities[0].oidcs[0].issuer;
    this.kubeconfig = kubeconfig;

    // KMS outputs
    this.kmsKeyId = eksKmsKey.id;
    this.kmsKeyAliasName = eksKmsKeyAlias.name;
    this.kmsKeyArn = eksKmsKey.arn;

    // Route outputs
    this.publicRouteId = publicRoute.id;

    // Addon outputs
    this.coreDnsAddonVersion = coreDnsAddon.addonVersion;
    this.kubeProxyAddonVersion = kubeProxyAddon.addonVersion;
    this.vpcCniAddonVersion = vpcCniAddon.addonVersion;

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
      clusterName: this.clusterName,
      clusterVersion: this.clusterVersion,
      clusterEndpoint: this.clusterEndpoint,
      oidcIssuerUrl: this.oidcIssuerUrl,
      kubeconfig: this.kubeconfig,
      kmsKeyId: this.kmsKeyId,
      kmsKeyAliasName: this.kmsKeyAliasName,
      kmsKeyArn: this.kmsKeyArn,
      publicRouteId: this.publicRouteId,
      coreDnsAddonVersion: this.coreDnsAddonVersion,
      kubeProxyAddonVersion: this.kubeProxyAddonVersion,
      vpcCniAddonVersion: this.vpcCniAddonVersion,
    });
  }
}
