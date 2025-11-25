import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly oidcIssuer: pulumi.Output<string>;
  public readonly kubeconfig: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const envSuffix = args.environmentSuffix || 'dev';
    const defaultTags = args.tags || {};
    const region = 'us-east-1';
    const azs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `eks-vpc-${envSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...defaultTags, Name: `eks-vpc-${envSuffix}` },
      },
      { parent: this }
    );

    // Add secondary CIDR for pods
    const secondaryCidr = new aws.ec2.VpcIpv4CidrBlockAssociation(
      `eks-pod-cidr-${envSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '100.64.0.0/16',
      },
      { parent: this }
    );

    // Create private subnets for nodes
    const nodeSubnets = azs.map((az, i) => {
      return new aws.ec2.Subnet(
        `eks-node-subnet-${i}-${envSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: false,
          tags: {
            ...defaultTags,
            Name: `eks-node-subnet-${i}-${envSuffix}`,
            'kubernetes.io/role/internal-elb': '1',
            [`kubernetes.io/cluster/eks-cluster-${envSuffix}`]: 'shared',
          },
        },
        { parent: this }
      );
    });

    // Create private subnets for pods (from secondary CIDR)
    const podSubnets = azs.map((az, i) => {
      return new aws.ec2.Subnet(
        `eks-pod-subnet-${i}-${envSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `100.64.${i}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: false,
          tags: {
            ...defaultTags,
            Name: `eks-pod-subnet-${i}-${envSuffix}`,
          },
        },
        { parent: this, dependsOn: [secondaryCidr] }
      );
    });

    // Create route table
    const routeTable = new aws.ec2.RouteTable(
      `eks-rt-${envSuffix}`,
      {
        vpcId: vpc.id,
        tags: { ...defaultTags, Name: `eks-rt-${envSuffix}` },
      },
      { parent: this }
    );

    // Associate subnets with route table
    nodeSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `eks-rta-node-${i}-${envSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: routeTable.id,
        },
        { parent: this }
      );
    });

    podSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `eks-rta-pod-${i}-${envSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: routeTable.id,
        },
        { parent: this }
      );
    });

    // Create security group for VPC endpoints
    const vpcEndpointSg = new aws.ec2.SecurityGroup(
      `eks-vpce-sg-${envSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for VPC endpoints',
        ingress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['10.0.0.0/16', '100.64.0.0/16'],
            description: 'Allow HTTPS from VPC',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: { ...defaultTags, Name: `eks-vpce-sg-${envSuffix}` },
      },
      { parent: this }
    );

    // Create VPC endpoints for cost optimization and private access
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Creates VPC endpoint
    const s3Endpoint = new aws.ec2.VpcEndpoint(
      `eks-s3-endpoint-${envSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: `com.amazonaws.${region}.s3`,
        vpcEndpointType: 'Gateway',
        routeTableIds: [routeTable.id],
        tags: { ...defaultTags, Name: `eks-s3-endpoint-${envSuffix}` },
      },
      { parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Creates VPC endpoint
    const ec2Endpoint = new aws.ec2.VpcEndpoint(
      `eks-ec2-endpoint-${envSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: `com.amazonaws.${region}.ec2`,
        vpcEndpointType: 'Interface',
        subnetIds: nodeSubnets.map(s => s.id),
        securityGroupIds: [vpcEndpointSg.id],
        privateDnsEnabled: true,
        tags: { ...defaultTags, Name: `eks-ec2-endpoint-${envSuffix}` },
      },
      { parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Creates VPC endpoint
    const ecrApiEndpoint = new aws.ec2.VpcEndpoint(
      `eks-ecr-api-endpoint-${envSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: `com.amazonaws.${region}.ecr.api`,
        vpcEndpointType: 'Interface',
        subnetIds: nodeSubnets.map(s => s.id),
        securityGroupIds: [vpcEndpointSg.id],
        privateDnsEnabled: true,
        tags: { ...defaultTags, Name: `eks-ecr-api-endpoint-${envSuffix}` },
      },
      { parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Creates VPC endpoint
    const ecrDkrEndpoint = new aws.ec2.VpcEndpoint(
      `eks-ecr-dkr-endpoint-${envSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: `com.amazonaws.${region}.ecr.dkr`,
        vpcEndpointType: 'Interface',
        subnetIds: nodeSubnets.map(s => s.id),
        securityGroupIds: [vpcEndpointSg.id],
        privateDnsEnabled: true,
        tags: { ...defaultTags, Name: `eks-ecr-dkr-endpoint-${envSuffix}` },
      },
      { parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Creates VPC endpoint
    const logsEndpoint = new aws.ec2.VpcEndpoint(
      `eks-logs-endpoint-${envSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: `com.amazonaws.${region}.logs`,
        vpcEndpointType: 'Interface',
        subnetIds: nodeSubnets.map(s => s.id),
        securityGroupIds: [vpcEndpointSg.id],
        privateDnsEnabled: true,
        tags: { ...defaultTags, Name: `eks-logs-endpoint-${envSuffix}` },
      },
      { parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Creates VPC endpoint
    const stsEndpoint = new aws.ec2.VpcEndpoint(
      `eks-sts-endpoint-${envSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: `com.amazonaws.${region}.sts`,
        vpcEndpointType: 'Interface',
        subnetIds: nodeSubnets.map(s => s.id),
        securityGroupIds: [vpcEndpointSg.id],
        privateDnsEnabled: true,
        tags: { ...defaultTags, Name: `eks-sts-endpoint-${envSuffix}` },
      },
      { parent: this }
    );

    // Create CloudWatch log group
    const logGroup = new aws.cloudwatch.LogGroup(
      `/aws/eks/cluster-${envSuffix}`,
      {
        retentionInDays: 7,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Create EKS cluster IAM role
    const clusterRole = new aws.iam.Role(
      `eks-cluster-role-${envSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'eks.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-cluster-policy-${envSuffix}`,
      {
        role: clusterRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-vpc-resource-controller-${envSuffix}`,
      {
        role: clusterRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController',
      },
      { parent: this }
    );

    // Create cluster security group
    const clusterSg = new aws.ec2.SecurityGroup(
      `eks-cluster-sg-${envSuffix}`,
      {
        vpcId: vpc.id,
        description: 'EKS cluster security group',
        ingress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['10.0.0.0/16'],
            description: 'Allow nodes to communicate with cluster API',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: { ...defaultTags, Name: `eks-cluster-sg-${envSuffix}` },
      },
      { parent: this }
    );

    // Create EKS cluster
    const cluster = new aws.eks.Cluster(
      `eks-cluster-${envSuffix}`,
      {
        version: '1.28',
        roleArn: clusterRole.arn,
        vpcConfig: {
          subnetIds: nodeSubnets.map(s => s.id),
          endpointPrivateAccess: true,
          endpointPublicAccess: false,
          securityGroupIds: [clusterSg.id],
        },
        enabledClusterLogTypes: [
          'api',
          'audit',
          'authenticator',
          'controllerManager',
          'scheduler',
        ],
        tags: defaultTags,
      },
      { parent: this, dependsOn: [logGroup] }
    );

    // Fetch OIDC provider TLS certificate
    const oidcThumbprint = cluster.identities[0].oidcs[0].issuer.apply(
      _issuer => {
        return '9e99a48a9960b14926bb7f3b02e22da2b0ab7280'; // Root CA thumbprint for AWS
      }
    );

    // Create OIDC provider for IRSA (IAM Roles for Service Accounts)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const oidcProvider = new aws.iam.OpenIdConnectProvider(
      `eks-oidc-${envSuffix}`,
      {
        clientIdLists: ['sts.amazonaws.com'],
        thumbprintLists: [oidcThumbprint],
        url: cluster.identities[0].oidcs[0].issuer,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Node group IAM role
    const nodeRole = new aws.iam.Role(
      `eks-node-role-${envSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'ec2.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    const nodeRolePolicies = [
      'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
      'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
      'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
      'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    ];

    nodeRolePolicies.forEach((policyArn, i) => {
      new aws.iam.RolePolicyAttachment(
        `eks-node-policy-${i}-${envSuffix}`,
        {
          role: nodeRole.name,
          policyArn,
        },
        { parent: this }
      );
    });

    // Node security group
    const nodeSg = new aws.ec2.SecurityGroup(
      `eks-node-sg-${envSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for EKS nodes',
        ingress: [
          {
            fromPort: 0,
            toPort: 65535,
            protocol: 'tcp',
            self: true,
            description: 'Allow nodes to communicate with each other',
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            securityGroups: [clusterSg.id],
            description: 'Allow cluster to communicate with nodes',
          },
          {
            fromPort: 1025,
            toPort: 65535,
            protocol: 'tcp',
            securityGroups: [clusterSg.id],
            description: 'Allow cluster to communicate with node kubelet',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: { ...defaultTags, Name: `eks-node-sg-${envSuffix}` },
      },
      { parent: this }
    );

    // Allow nodes to communicate with cluster
    new aws.ec2.SecurityGroupRule(
      `eks-cluster-ingress-node-${envSuffix}`,
      {
        type: 'ingress',
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        sourceSecurityGroupId: nodeSg.id,
        securityGroupId: clusterSg.id,
        description: 'Allow nodes to communicate with cluster API',
      },
      { parent: this }
    );

    // Install VPC CNI addon
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Installs addon
    const vpcCniAddon = new aws.eks.Addon(
      `eks-vpc-cni-${envSuffix}`,
      {
        clusterName: cluster.name,
        addonName: 'vpc-cni',
        addonVersion: 'v1.15.0-eksbuild.2',
        resolveConflictsOnCreate: 'OVERWRITE',
        resolveConflictsOnUpdate: 'OVERWRITE',
        configurationValues: JSON.stringify({
          env: {
            AWS_VPC_K8S_CNI_CUSTOM_NETWORK_CFG: 'true',
            ENI_CONFIG_LABEL_DEF: 'topology.kubernetes.io/zone',
            ENABLE_PREFIX_DELEGATION: 'true',
          },
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    // Install kube-proxy addon
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Installs addon
    const kubeProxyAddon = new aws.eks.Addon(
      `eks-kube-proxy-${envSuffix}`,
      {
        clusterName: cluster.name,
        addonName: 'kube-proxy',
        addonVersion: 'v1.28.2-eksbuild.2',
        resolveConflictsOnCreate: 'OVERWRITE',
        resolveConflictsOnUpdate: 'OVERWRITE',
        tags: defaultTags,
      },
      { parent: this }
    );

    // Install CoreDNS addon
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Installs addon
    const coreDnsAddon = new aws.eks.Addon(
      `eks-coredns-${envSuffix}`,
      {
        clusterName: cluster.name,
        addonName: 'coredns',
        addonVersion: 'v1.10.1-eksbuild.6',
        resolveConflictsOnCreate: 'OVERWRITE',
        resolveConflictsOnUpdate: 'OVERWRITE',
        tags: defaultTags,
      },
      { parent: this }
    );

    // Create kubeconfig for Kubernetes provider
    const kubeconfig = pulumi
      .all([cluster.endpoint, cluster.certificateAuthority, cluster.name])
      .apply(([endpoint, certAuth, name]) =>
        JSON.stringify({
          apiVersion: 'v1',
          clusters: [
            {
              cluster: {
                server: endpoint,
                'certificate-authority-data': certAuth.data,
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
        })
      );

    // Export kubeconfig as string
    this.clusterEndpoint = cluster.endpoint;
    this.oidcIssuer = cluster.identities[0].oidcs[0].issuer;
    this.kubeconfig = kubeconfig;

    this.registerOutputs({
      clusterEndpoint: this.clusterEndpoint,
      oidcIssuer: this.oidcIssuer,
      kubeconfig: this.kubeconfig,
      clusterSecurityGroupId: clusterSg.id,
      nodeSecurityGroupId: nodeSg.id,
      vpcId: vpc.id,
      nodeSubnetIds: pulumi.all(nodeSubnets.map(s => s.id)),
      podSubnetIds: pulumi.all(podSubnets.map(s => s.id)),
    });
  }
}
