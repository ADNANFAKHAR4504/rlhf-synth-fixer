/**
 * TapStack - Main infrastructure stack for EKS cluster with auto-scaling groups
 *
 * This stack provisions:
 * - Custom VPC with 6 subnets across 3 AZs
 * - EKS cluster with private endpoint access
 * - Two managed node groups with auto-scaling
 * - Fargate profile for system workloads
 * - OIDC provider for IRSA
 * - IAM role for AWS Load Balancer Controller
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  tags?: { [key: string]: string };
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly clusterCertificateAuthority: pulumi.Output<string>;
  public readonly kubeconfig: pulumi.Output<string>;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:eks:TapStack', name, {}, opts);

    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
    const defaultTags = {
      Environment: 'production',
      ManagedBy: 'pulumi',
      ...(args.tags || {}),
    };

    // Define availability zones
    const availabilityZones = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `eks-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...defaultTags,
          Name: `eks-vpc-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.vpcId = vpc.id;

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `eks-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...defaultTags,
          Name: `eks-igw-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create public subnets
    const publicSubnets = availabilityZones.map((az, index) => {
      return new aws.ec2.Subnet(
        `eks-public-subnet-${index}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${index}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            ...defaultTags,
            Name: `eks-public-subnet-${index}-${environmentSuffix}`,
            'kubernetes.io/role/elb': '1',
          },
        },
        { parent: this }
      );
    });

    // Create route table for public subnets
    const publicRouteTable = new aws.ec2.RouteTable(
      `eks-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...defaultTags,
          Name: `eks-public-rt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create route to Internet Gateway
    new aws.ec2.Route(
      `eks-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate public subnets with route table
    publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `eks-public-rta-${index}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create Elastic IPs for NAT Gateways
    const eips = availabilityZones.map((az, index) => {
      return new aws.ec2.Eip(
        `eks-nat-eip-${index}-${environmentSuffix}`,
        {
          domain: 'vpc',
          tags: {
            ...defaultTags,
            Name: `eks-nat-eip-${index}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
    });

    // Create NAT Gateways
    const natGateways = publicSubnets.map((subnet, index) => {
      return new aws.ec2.NatGateway(
        `eks-nat-${index}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          allocationId: eips[index].id,
          tags: {
            ...defaultTags,
            Name: `eks-nat-${index}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
    });

    // Create private subnets
    const privateSubnets = availabilityZones.map((az, index) => {
      return new aws.ec2.Subnet(
        `eks-private-subnet-${index}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${index + 10}.0/24`,
          availabilityZone: az,
          tags: {
            ...defaultTags,
            Name: `eks-private-subnet-${index}-${environmentSuffix}`,
            'kubernetes.io/role/internal-elb': '1',
          },
        },
        { parent: this }
      );
    });

    // Create route tables for private subnets
    const privateRouteTables = natGateways.map((natGateway, index) => {
      const routeTable = new aws.ec2.RouteTable(
        `eks-private-rt-${index}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: {
            ...defaultTags,
            Name: `eks-private-rt-${index}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `eks-private-route-${index}-${environmentSuffix}`,
        {
          routeTableId: routeTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateway.id,
        },
        { parent: this }
      );

      return routeTable;
    });

    // Associate private subnets with route tables
    privateSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `eks-private-rta-${index}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTables[index].id,
        },
        { parent: this }
      );
    });

    // Create EKS cluster IAM role
    const clusterRole = new aws.iam.Role(
      `eks-cluster-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'eks.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          ...defaultTags,
          Name: `eks-cluster-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach required policies to cluster role
    new aws.iam.RolePolicyAttachment(
      `eks-cluster-policy-${environmentSuffix}`,
      {
        role: clusterRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-vpc-policy-${environmentSuffix}`,
      {
        role: clusterRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController',
      },
      { parent: this }
    );

    // Create security group for cluster
    const clusterSecurityGroup = new aws.ec2.SecurityGroup(
      `eks-cluster-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'EKS cluster security group',
        tags: {
          ...defaultTags,
          Name: `eks-cluster-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create EKS cluster
    const cluster = new aws.eks.Cluster(
      `eks-cluster-${environmentSuffix}`,
      {
        name: `eks-cluster-${environmentSuffix}`,
        version: '1.28',
        roleArn: clusterRole.arn,
        vpcConfig: {
          subnetIds: pulumi.all([...privateSubnets.map(s => s.id)]),
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
            keyArn: pulumi
              .output(aws.kms.getAlias({ name: 'alias/aws/eks' }))
              .apply(alias => alias.targetKeyArn),
          },
          resources: ['secrets'],
        },
        tags: {
          ...defaultTags,
          Name: `eks-cluster-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [clusterRole] }
    );

    this.clusterName = cluster.name;
    this.clusterEndpoint = cluster.endpoint;
    this.clusterCertificateAuthority = cluster.certificateAuthority.data;

    // Create OIDC provider for IRSA
    const oidcProvider = new aws.iam.OpenIdConnectProvider(
      `eks-oidc-${environmentSuffix}`,
      {
        clientIdLists: ['sts.amazonaws.com'],
        thumbprintLists: ['9e99a48a9960b14926bb7f3b02e22da2b0ab7280'],
        url: cluster.identities[0].oidcs[0].issuer,
        tags: {
          ...defaultTags,
          Name: `eks-oidc-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [cluster] }
    );

    // Create IAM role for AWS Load Balancer Controller
    const lbControllerRole = new aws.iam.Role(
      `eks-lb-controller-role-${environmentSuffix}`,
      {
        assumeRolePolicy: pulumi
          .all([cluster.identities[0].oidcs[0].issuer, oidcProvider.arn])
          .apply(([issuer, oidcArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    Federated: oidcArn,
                  },
                  Action: 'sts:AssumeRoleWithWebIdentity',
                  Condition: {
                    StringEquals: {
                      [`${issuer.replace('https://', '')}:sub`]:
                        'system:serviceaccount:kube-system:aws-load-balancer-controller',
                      [`${issuer.replace('https://', '')}:aud`]:
                        'sts.amazonaws.com',
                    },
                  },
                },
              ],
            })
          ),
        tags: {
          ...defaultTags,
          Name: `eks-lb-controller-role-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [oidcProvider] }
    );

    // Attach Load Balancer Controller policy (simplified inline for demonstration)
    const lbControllerPolicy = new aws.iam.Policy(
      `eks-lb-controller-policy-${environmentSuffix}`,
      {
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ec2:DescribeVpcs',
                'ec2:DescribeSubnets',
                'ec2:DescribeSecurityGroups',
                'elasticloadbalancing:*',
              ],
              Resource: '*',
            },
          ],
        }),
        tags: {
          ...defaultTags,
          Name: `eks-lb-controller-policy-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-lb-controller-attach-${environmentSuffix}`,
      {
        role: lbControllerRole.name,
        policyArn: lbControllerPolicy.arn,
      },
      { parent: this }
    );

    // Create IAM role for node groups
    const nodeRole = new aws.iam.Role(
      `eks-node-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          ...defaultTags,
          Name: `eks-node-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach required policies to node role
    const nodePolicies = [
      'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
      'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
      'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
      'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    ];

    nodePolicies.forEach((policyArn, index) => {
      new aws.iam.RolePolicyAttachment(
        `eks-node-policy-${index}-${environmentSuffix}`,
        {
          role: nodeRole.name,
          policyArn: policyArn,
        },
        { parent: this }
      );
    });

    // Get latest Bottlerocket AMI
    const bottlerocketAmi = aws.ec2.getAmiOutput({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['bottlerocket-aws-k8s-1.28-*'],
        },
        {
          name: 'architecture',
          values: ['x86_64'],
        },
      ],
    });

    // Create launch template for general workload node group
    const generalLaunchTemplate = new aws.ec2.LaunchTemplate(
      `eks-general-lt-${environmentSuffix}`,
      {
        imageId: bottlerocketAmi.id,
        instanceType: 'm5.large',
        blockDeviceMappings: [
          {
            deviceName: '/dev/xvda',
            ebs: {
              volumeSize: 50,
              volumeType: 'gp3',
              encrypted: 'true',
              deleteOnTermination: 'true',
              // Use AWS-managed EBS encryption key (default)
              kmsKeyId: pulumi
                .output(aws.kms.getAlias({ name: 'alias/aws/ebs' }))
                .apply(alias => alias.targetKeyArn),
            },
          },
        ],
        metadataOptions: {
          httpTokens: 'required',
          httpPutResponseHopLimit: 1,
        },
        tags: {
          ...defaultTags,
          Name: `eks-general-lt-${environmentSuffix}`,
        },
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...defaultTags,
              Name: `eks-general-node-${environmentSuffix}`,
            },
          },
        ],
      },
      { parent: this }
    );

    // Create general workload node group
    const generalNodeGroup = new aws.eks.NodeGroup(
      `eks-general-ng-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        nodeGroupName: `eks-general-ng-${environmentSuffix}`,
        nodeRoleArn: nodeRole.arn,
        subnetIds: privateSubnets.map(s => s.id),
        scalingConfig: {
          desiredSize: 2,
          minSize: 2,
          maxSize: 10,
        },
        launchTemplate: {
          id: generalLaunchTemplate.id,
          version: generalLaunchTemplate.latestVersion.apply(v => v.toString()),
        },
        tags: {
          ...defaultTags,
          Name: `eks-general-ng-${environmentSuffix}`,
          NodeGroupType: 'general',
        },
      },
      { parent: this, dependsOn: [cluster, nodeRole] }
    );

    // Create launch template for compute-intensive node group
    const computeLaunchTemplate = new aws.ec2.LaunchTemplate(
      `eks-compute-lt-${environmentSuffix}`,
      {
        imageId: bottlerocketAmi.id,
        instanceType: 'm5.xlarge',
        blockDeviceMappings: [
          {
            deviceName: '/dev/xvda',
            ebs: {
              volumeSize: 100,
              volumeType: 'gp3',
              encrypted: 'true',
              deleteOnTermination: 'true',
              // Use AWS-managed EBS encryption key (default)
              kmsKeyId: pulumi
                .output(aws.kms.getAlias({ name: 'alias/aws/ebs' }))
                .apply(alias => alias.targetKeyArn),
            },
          },
        ],
        metadataOptions: {
          httpTokens: 'required',
          httpPutResponseHopLimit: 1,
        },
        tags: {
          ...defaultTags,
          Name: `eks-compute-lt-${environmentSuffix}`,
        },
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...defaultTags,
              Name: `eks-compute-node-${environmentSuffix}`,
            },
          },
        ],
      },
      { parent: this }
    );

    // Create compute-intensive node group
    const computeNodeGroup = new aws.eks.NodeGroup(
      `eks-compute-ng-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        nodeGroupName: `eks-compute-ng-${environmentSuffix}`,
        nodeRoleArn: nodeRole.arn,
        subnetIds: privateSubnets.map(s => s.id),
        scalingConfig: {
          desiredSize: 1,
          minSize: 1,
          maxSize: 5,
        },
        launchTemplate: {
          id: computeLaunchTemplate.id,
          version: computeLaunchTemplate.latestVersion.apply(v => v.toString()),
        },
        tags: {
          ...defaultTags,
          Name: `eks-compute-ng-${environmentSuffix}`,
          NodeGroupType: 'compute-intensive',
        },
      },
      { parent: this, dependsOn: [cluster, nodeRole] }
    );

    // Create IAM role for Fargate profile
    const fargateRole = new aws.iam.Role(
      `eks-fargate-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'eks-fargate-pods.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          ...defaultTags,
          Name: `eks-fargate-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-fargate-policy-${environmentSuffix}`,
      {
        role: fargateRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy',
      },
      { parent: this }
    );

    // Create Fargate profile for kube-system
    const fargateProfile = new aws.eks.FargateProfile(
      `fargate-profile-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        fargateProfileName: `fargate-system-${environmentSuffix}`,
        podExecutionRoleArn: fargateRole.arn,
        subnetIds: privateSubnets.map(s => s.id),
        selectors: [
          {
            namespace: 'kube-system',
          },
        ],
        tags: {
          ...defaultTags,
          Name: `fargate-profile-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [cluster, fargateRole] }
    );

    // Install EKS add-ons
    new aws.eks.Addon(
      `eks-addon-vpc-cni-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        addonName: 'vpc-cni',
        addonVersion: 'v1.15.1-eksbuild.1',
        resolveConflictsOnCreate: 'OVERWRITE',
        resolveConflictsOnUpdate: 'OVERWRITE',
        tags: {
          ...defaultTags,
          Name: `eks-addon-vpc-cni-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [cluster] }
    );

    new aws.eks.Addon(
      `eks-addon-coredns-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        addonName: 'coredns',
        addonVersion: 'v1.10.1-eksbuild.6',
        resolveConflictsOnCreate: 'OVERWRITE',
        resolveConflictsOnUpdate: 'OVERWRITE',
        tags: {
          ...defaultTags,
          Name: `eks-addon-coredns-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [cluster, fargateProfile] }
    );

    new aws.eks.Addon(
      `eks-addon-kube-proxy-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        addonName: 'kube-proxy',
        addonVersion: 'v1.28.2-eksbuild.2',
        resolveConflictsOnCreate: 'OVERWRITE',
        resolveConflictsOnUpdate: 'OVERWRITE',
        tags: {
          ...defaultTags,
          Name: `eks-addon-kube-proxy-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [cluster] }
    );

    // Generate kubeconfig
    this.kubeconfig = pulumi
      .all([cluster.name, cluster.endpoint, cluster.certificateAuthority.data])
      .apply(([name, endpoint, certData]) =>
        JSON.stringify({
          apiVersion: 'v1',
          kind: 'Config',
          clusters: [
            {
              cluster: {
                server: endpoint,
                'certificate-authority-data': certData,
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
                    'us-east-1',
                  ],
                },
              },
            },
          ],
        })
      );

    // Export outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      clusterName: this.clusterName,
      clusterEndpoint: this.clusterEndpoint,
      clusterCertificateAuthority: this.clusterCertificateAuthority,
      kubeconfig: this.kubeconfig,
      oidcProviderArn: oidcProvider.arn,
      loadBalancerControllerRoleArn: lbControllerRole.arn,
      generalNodeGroupName: generalNodeGroup.nodeGroupName,
      computeNodeGroupName: computeNodeGroup.nodeGroupName,
      fargateProfileName: fargateProfile.fargateProfileName,
    });
  }
}
