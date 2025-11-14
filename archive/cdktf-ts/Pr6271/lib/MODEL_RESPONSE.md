## modules.ts

```typescript
import { Construct } from "constructs";
import * as aws from "@cdktf/provider-aws";
import { DataAwsCallerIdentity } from "@cdktf/provider-aws/lib/data-aws-caller-identity";
import { DataAwsIamPolicyDocument } from "@cdktf/provider-aws/lib/data-aws-iam-policy-document";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";
import { IamOpenidConnectProvider } from "@cdktf/provider-aws/lib/iam-openid-connect-provider";
import { DataTlsCertificate } from "@cdktf/provider-tls/lib/data-tls-certificate";

export interface VpcConfig {
  vpcCidr: string;
  azCount: number;
  tags: { [key: string]: string };
}

export interface EksConfig {
  clusterName: string;
  kubernetesVersion: string;
  tags: { [key: string]: string };
}

export interface NodeGroupConfig {
  name: string;
  instanceTypes: string[];
  minSize: number;
  maxSize: number;
  desiredSize: number;
  diskSize: number;
  labels?: { [key: string]: string };
  taints?: Array<{
    key: string;
    value: string;
    effect: string;
  }>;
}

export class NetworkModule extends Construct {
  public vpc: aws.vpc.Vpc;
  public privateSubnets: aws.subnet.Subnet[];
  public publicSubnets: aws.subnet.Subnet[];
  public natGateways: aws.natGateway.NatGateway[];

  constructor(scope: Construct, id: string, config: VpcConfig) {
    super(scope, id);

    const azs = ["us-east-1a", "us-east-1b", "us-east-1c"];

    // Create VPC
    this.vpc = new aws.vpc.Vpc(this, "vpc", {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...config.tags,
        Name: `${config.tags.Environment}-eks-vpc`,
      },
    });

    // Internet Gateway
    const igw = new aws.internetGateway.InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.tags.Environment}-eks-igw`,
      },
    });

    // Create public and private subnets
    this.publicSubnets = [];
    this.privateSubnets = [];
    this.natGateways = [];

    for (let i = 0; i < config.azCount; i++) {
      // Public subnet
      const publicSubnet = new aws.subnet.Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: azs[i],
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `${config.tags.Environment}-public-${azs[i]}`,
          "kubernetes.io/role/elb": "1",
          [`kubernetes.io/cluster/${config.tags.Environment}-eks-cluster`]: "shared",
        },
      });
      this.publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new aws.subnet.Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: azs[i],
        tags: {
          ...config.tags,
          Name: `${config.tags.Environment}-private-${azs[i]}`,
          "kubernetes.io/role/internal-elb": "1",
          [`kubernetes.io/cluster/${config.tags.Environment}-eks-cluster`]: "shared",
        },
      });
      this.privateSubnets.push(privateSubnet);

      // EIP for NAT Gateway
      const eip = new aws.eip.Eip(this, `nat-eip-${i}`, {
        domain: "vpc",
        tags: {
          ...config.tags,
          Name: `${config.tags.Environment}-nat-eip-${i}`,
        },
      });

      // NAT Gateway
      const natGateway = new aws.natGateway.NatGateway(this, `nat-gateway-${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          ...config.tags,
          Name: `${config.tags.Environment}-nat-${i}`,
        },
      });
      this.natGateways.push(natGateway);
    }

    // Route tables
    const publicRouteTable = new aws.routeTable.RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.tags.Environment}-public-rt`,
      },
    });

    new aws.route.Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, i) => {
      new aws.routeTableAssociation.RouteTableAssociation(this, `public-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Private route tables (one per AZ for HA)
    this.privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.routeTable.RouteTable(this, `private-rt-${i}`, {
        vpcId: this.vpc.id,
        tags: {
          ...config.tags,
          Name: `${config.tags.Environment}-private-rt-${i}`,
        },
      });

      new aws.route.Route(this, `private-route-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: this.natGateways[i].id,
      });

      new aws.routeTableAssociation.RouteTableAssociation(this, `private-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });
  }
}

export class IamModule extends Construct {
  public eksClusterRole: IamRole;
  public eksNodeRole: IamRole;
  public oidcProvider: IamOpenidConnectProvider;

  constructor(scope: Construct, id: string, config: EksConfig) {
    super(scope, id);

    // EKS Cluster IAM Role
    const eksAssumeRolePolicy = new DataAwsIamPolicyDocument(this, "eks-assume-role", {
      statement: [{
        actions: ["sts:AssumeRole"],
        principals: [{
          type: "Service",
          identifiers: ["eks.amazonaws.com"],
        }],
      }],
    });

    this.eksClusterRole = new IamRole(this, "eks-cluster-role", {
      name: `${config.clusterName}-cluster-role`,
      assumeRolePolicy: eksAssumeRolePolicy.json,
      tags: config.tags,
    });

    new IamRolePolicyAttachment(this, "eks-cluster-policy", {
      role: this.eksClusterRole.name!,
      policyArn: "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy",
    });

    new IamRolePolicyAttachment(this, "eks-vpc-resource-controller", {
      role: this.eksClusterRole.name!,
      policyArn: "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController",
    });

    // EKS Node IAM Role
    const nodeAssumeRolePolicy = new DataAwsIamPolicyDocument(this, "node-assume-role", {
      statement: [{
        actions: ["sts:AssumeRole"],
        principals: [{
          type: "Service",
          identifiers: ["ec2.amazonaws.com"],
        }],
      }],
    });

    this.eksNodeRole = new IamRole(this, "eks-node-role", {
      name: `${config.clusterName}-node-role`,
      assumeRolePolicy: nodeAssumeRolePolicy.json,
      tags: config.tags,
    });

    const nodePolicies = [
      "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
      "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
      "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
      "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
    ];

    nodePolicies.forEach((policyArn, i) => {
      new IamRolePolicyAttachment(this, `node-policy-${i}`, {
        role: this.eksNodeRole.name!,
        policyArn,
      });
    });
  }

  public setupOidcProvider(cluster: aws.eksCluster.EksCluster): void {
    const tlsCert = new DataTlsCertificate(this, "tls-cert", {
      url: cluster.identity.get(0).oidc.get(0).issuer,
    });

    this.oidcProvider = new IamOpenidConnectProvider(this, "oidc-provider", {
      clientIdList: ["sts.amazonaws.com"],
      thumbprintList: [tlsCert.certificates.get(0).sha1Fingerprint],
      url: cluster.identity.get(0).oidc.get(0).issuer,
      tags: cluster.tags,
    });
  }
}

export class IrsaRoleModule extends Construct {
  public role: IamRole;

  constructor(
    scope: Construct,
    id: string,
    name: string,
    namespace: string,
    serviceAccount: string,
    oidcProviderArn: string,
    oidcProviderUrl: string,
    policyDocument: string,
    tags: { [key: string]: string }
  ) {
    super(scope, id);

    const assumeRolePolicy = new DataAwsIamPolicyDocument(this, "assume-role-policy", {
      statement: [{
        actions: ["sts:AssumeRoleWithWebIdentity"],
        principals: [{
          type: "Federated",
          identifiers: [oidcProviderArn],
        }],
        condition: [{
          test: "StringEquals",
          variable: `${oidcProviderUrl.replace("https://", "")}:sub`,
          values: [`system:serviceaccount:${namespace}:${serviceAccount}`],
        }, {
          test: "StringEquals",
          variable: `${oidcProviderUrl.replace("https://", "")}:aud`,
          values: ["sts.amazonaws.com"],
        }],
      }],
    });

    this.role = new IamRole(this, "role", {
      name,
      assumeRolePolicy: assumeRolePolicy.json,
      tags,
    });

    if (policyDocument) {
      const policy = new IamPolicy(this, "policy", {
        name: `${name}-policy`,
        policy: policyDocument,
        tags,
      });

      new IamRolePolicyAttachment(this, "policy-attachment", {
        role: this.role.name!,
        policyArn: policy.arn,
      });
    }
  }
}

export class WorkloadRoleModule extends Construct {
  public role: IamRole;

  constructor(
    scope: Construct,
    id: string,
    name: string,
    namespace: string,
    oidcProviderArn: string,
    oidcProviderUrl: string,
    policies: { [key: string]: string },
    tags: { [key: string]: string }
  ) {
    super(scope, id);

    const assumeRolePolicy = new DataAwsIamPolicyDocument(this, "assume-role-policy", {
      statement: [{
        actions: ["sts:AssumeRoleWithWebIdentity"],
        principals: [{
          type: "Federated",
          identifiers: [oidcProviderArn],
        }],
        condition: [{
          test: "StringLike",
          variable: `${oidcProviderUrl.replace("https://", "")}:sub`,
          values: [`system:serviceaccount:${namespace}:*`],
        }, {
          test: "StringEquals",
          variable: `${oidcProviderUrl.replace("https://", "")}:aud`,
          values: ["sts.amazonaws.com"],
        }],
      }],
    });

    this.role = new IamRole(this, "role", {
      name,
      assumeRolePolicy: assumeRolePolicy.json,
      tags,
    });

    Object.entries(policies).forEach(([policyName, policyDocument]) => {
      const policy = new IamPolicy(this, `policy-${policyName}`, {
        name: `${name}-${policyName}`,
        policy: policyDocument,
        tags,
      });

      new IamRolePolicyAttachment(this, `attachment-${policyName}`, {
        role: this.role.name!,
        policyArn: policy.arn,
      });
    });
  }
}
```

## tap-stack.ts

```typescript
import { Construct } from "constructs";
import { TerraformStack, TerraformOutput } from "cdktf";
import * as aws from "@cdktf/provider-aws";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { TlsProvider } from "@cdktf/provider-tls/lib/provider";
import { KubernetesProvider } from "@cdktf/provider-kubernetes/lib/provider";
import { DataAwsCallerIdentity } from "@cdktf/provider-aws/lib/data-aws-caller-identity";
import { DataAwsIamPolicyDocument } from "@cdktf/provider-aws/lib/data-aws-iam-policy-document";
import { ConfigMap } from "@cdktf/provider-kubernetes/lib/config-map";
import { NetworkPolicy } from "@cdktf/provider-kubernetes/lib/network-policy";
import {
  NetworkModule,
  IamModule,
  IrsaRoleModule,
  WorkloadRoleModule,
  NodeGroupConfig,
} from "./modules";

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Providers
    new AwsProvider(this, "aws", {
      region: "us-east-1",
    });

    new TlsProvider(this, "tls");

    // Common tags
    const commonTags = {
      Environment: "production",
      ManagedBy: "terraform-cdk",
      CostCenter: "engineering",
    };

    // Get account ID
    const callerIdentity = new DataAwsCallerIdentity(this, "caller-identity");

    // Network Module
    const network = new NetworkModule(this, "network", {
      vpcCidr: "10.0.0.0/16",
      azCount: 3,
      tags: commonTags,
    });

    // IAM Module
    const iam = new IamModule(this, "iam", {
      clusterName: `${commonTags.Environment}-eks-cluster`,
      kubernetesVersion: "1.28",
      tags: commonTags,
    });

    // Security Group for EKS Cluster
    const clusterSecurityGroup = new aws.securityGroup.SecurityGroup(this, "cluster-sg", {
      name: `${commonTags.Environment}-eks-cluster-sg`,
      description: "Security group for EKS cluster control plane",
      vpcId: network.vpc.id,
      tags: {
        ...commonTags,
        Name: `${commonTags.Environment}-eks-cluster-sg`,
      },
    });

    const clusterSecurityGroupRule = new aws.securityGroupRule.SecurityGroupRule(this, "cluster-sg-rule", {
      type: "ingress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["10.0.0.0/16"],
      securityGroupId: clusterSecurityGroup.id,
      description: "Allow nodes to communicate with cluster API",
    });

    const clusterEgressRule = new aws.securityGroupRule.SecurityGroupRule(this, "cluster-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: clusterSecurityGroup.id,
      description: "Allow all outbound traffic",
    });

    // CloudWatch Log Group for EKS
    const logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(this, "eks-log-group", {
      name: `/aws/eks/${commonTags.Environment}-eks-cluster/cluster`,
      retentionInDays: 30,
      tags: commonTags,
    });

    // EKS Cluster
    const eksCluster = new aws.eksCluster.EksCluster(this, "eks-cluster", {
      name: `${commonTags.Environment}-eks-cluster`,
      roleArn: iam.eksClusterRole.arn,
      version: "1.28",
      
      vpcConfig: {
        subnetIds: [...network.privateSubnets.map(s => s.id), ...network.publicSubnets.map(s => s.id)],
        securityGroupIds: [clusterSecurityGroup.id],
        endpointPrivateAccess: true,
        endpointPublicAccess: false,
        publicAccessCidrs: ["10.0.0.0/16"],
      },

      encryptionConfig: {
        provider: {
          keyArn: new aws.kmsKey.KmsKey(this, "eks-kms-key", {
            description: "KMS key for EKS cluster encryption",
            enableKeyRotation: true,
            tags: commonTags,
          }).arn,
        },
        resources: ["secrets"],
      },

      enabledClusterLogTypes: ["api", "audit", "authenticator", "controllerManager", "scheduler"],
      
      tags: {
        ...commonTags,
        Name: `${commonTags.Environment}-eks-cluster`,
      },

      dependsOn: [
        logGroup,
        clusterSecurityGroupRule,
        clusterEgressRule,
      ],
    });

    // Setup OIDC Provider
    iam.setupOidcProvider(eksCluster);

    // Kubernetes Provider
    const k8sProvider = new KubernetesProvider(this, "k8s", {
      host: eksCluster.endpoint,
      clusterCaCertificate: Buffer.from(eksCluster.certificateAuthority.get(0).data, "base64").toString(),
      exec: {
        apiVersion: "client.authentication.k8s.io/v1beta1",
        command: "aws",
        args: ["eks", "get-token", "--cluster-name", eksCluster.name],
      },
    });

    // Node Groups configuration
    const nodeGroups: NodeGroupConfig[] = [
      {
        name: "small",
        instanceTypes: ["t3.medium"],
        minSize: 2,
        maxSize: 10,
        desiredSize: 3,
        diskSize: 100,
        labels: { workload: "general", size: "small" },
      },
      {
        name: "medium",
        instanceTypes: ["t3.large"],
        minSize: 2,
        maxSize: 10,
        desiredSize: 3,
        diskSize: 100,
        labels: { workload: "general", size: "medium" },
      },
      {
        name: "large",
        instanceTypes: ["t3.xlarge"],
        minSize: 2,
        maxSize: 10,
        desiredSize: 3,
        diskSize: 100,
        labels: { workload: "general", size: "large" },
      },
    ];

    // Create Node Groups
    nodeGroups.forEach((ngConfig) => {
      new aws.eksNodeGroup.EksNodeGroup(this, `node-group-${ngConfig.name}`, {
        clusterName: eksCluster.name,
        nodeGroupName: `${commonTags.Environment}-${ngConfig.name}`,
        nodeRoleArn: iam.eksNodeRole.arn,
        subnetIds: network.privateSubnets.map(s => s.id),
        
        scalingConfig: {
          minSize: ngConfig.minSize,
          maxSize: ngConfig.maxSize,
          desiredSize: ngConfig.desiredSize,
        },
        
        updateConfig: {
          maxUnavailable: 1,
        },
        
        instanceTypes: ngConfig.instanceTypes,
        diskSize: ngConfig.diskSize,
        
        labels: ngConfig.labels,
        
        tags: {
          ...commonTags,
          Name: `${commonTags.Environment}-node-${ngConfig.name}`,
          "kubernetes.io/cluster-autoscaler/enabled": "true",
          [`kubernetes.io/cluster-autoscaler/${eksCluster.name}`]: "owned",
        },
        
        dependsOn: [eksCluster],
      });
    });

    // EKS Add-ons
    const addons = [
      { name: "vpc-cni", version: "v1.15.4-eksbuild.1" },
      { name: "kube-proxy", version: "v1.28.4-eksbuild.1" },
      { name: "coredns", version: "v1.10.1-eksbuild.6", 
        configurationValues: JSON.stringify({
          computeType: "EC2",
          replicaCount: 3,
          nodeSelector: { "workload": "general" },
          tolerations: [],
          affinity: {
            podAntiAffinity: {
              preferredDuringSchedulingIgnoredDuringExecution: [{
                weight: 100,
                podAffinityTerm: {
                  labelSelector: {
                    matchExpressions: [{
                      key: "k8s-app",
                      operator: "In",
                      values: ["kube-dns"],
                    }],
                  },
                  topologyKey: "kubernetes.io/hostname",
                },
              }],
            },
          },
          cache: { enabled: true },
        })
      },
      { name: "aws-ebs-csi-driver", version: "v1.25.0-eksbuild.1" },
    ];

    addons.forEach((addon) => {
      new aws.eksAddon.EksAddon(this, `addon-${addon.name}`, {
        clusterName: eksCluster.name,
        addonName: addon.name,
        addonVersion: addon.version,
        resolveConflictsOnUpdate: "OVERWRITE",
        configurationValues: addon.configurationValues,
        tags: commonTags,
        dependsOn: [eksCluster],
      });
    });

    // IRSA for Cluster Autoscaler
    const autoscalerPolicyDoc = new DataAwsIamPolicyDocument(this, "autoscaler-policy-doc", {
      statement: [
        {
          sid: "AutoScalerDescribe",
          actions: [
            "autoscaling:DescribeAutoScalingGroups",
            "autoscaling:DescribeAutoScalingInstances",
            "autoscaling:DescribeLaunchConfigurations",
            "autoscaling:DescribeTags",
            "ec2:DescribeInstanceTypes",
            "ec2:DescribeLaunchTemplateVersions",
          ],
          resources: ["*"],
        },
        {
          sid: "AutoScalerModify",
          actions: [
            "autoscaling:SetDesiredCapacity",
            "autoscaling:TerminateInstanceInAutoScalingGroup",
            "autoscaling:UpdateAutoScalingGroup",
          ],
          resources: [`arn:aws:autoscaling:us-east-1:${callerIdentity.accountId}:autoScalingGroup:*:autoScalingGroupName/*`],
          condition: [{
            test: "StringEquals",
            variable: `autoscaling:ResourceTag/kubernetes.io/cluster-autoscaler/${eksCluster.name}`,
            values: ["owned"],
          }],
        },
      ],
    });

    const autoscalerRole = new IrsaRoleModule(
      this,
      "cluster-autoscaler-irsa",
      `${eksCluster.name}-cluster-autoscaler`,
      "kube-system",
      "cluster-autoscaler",
      iam.oidcProvider.arn,
      eksCluster.identity.get(0).oidc.get(0).issuer,
      autoscalerPolicyDoc.json,
      commonTags
    );

    // IRSA for EBS CSI Driver
    const ebsCsiPolicyDoc = new DataAwsIamPolicyDocument(this, "ebs-csi-policy-doc", {
      statement: [
        {
          actions: [
            "ec2:CreateSnapshot",
            "ec2:CreateTags",
            "ec2:CreateVolume",
            "ec2:DeleteSnapshot",
            "ec2:DeleteTags",
            "ec2:DeleteVolume",
            "ec2:DescribeInstances",
            "ec2:DescribeSnapshots",
            "ec2:DescribeTags",
            "ec2:DescribeVolumes",
            "ec2:DetachVolume",
            "ec2:ModifyVolume",
            "ec2:AttachVolume",
            "ec2:DescribeAvailabilityZones",
            "ec2:DescribeInstanceTypes",
            "ec2:DescribeVolumesModifications",
            "ec2:DescribeVolumeAttribute",
          ],
          resources: ["*"],
        },
      ],
    });

    const ebsCsiRole = new IrsaRoleModule(
      this,
      "ebs-csi-irsa",
      `${eksCluster.name}-ebs-csi-driver`,
      "kube-system",
      "ebs-csi-controller-sa",
      iam.oidcProvider.arn,
      eksCluster.identity.get(0).oidc.get(0).issuer,
      ebsCsiPolicyDoc.json,
      commonTags
    );

    // Workload IAM Roles
    const backendPolicies = {
      "s3-access": new DataAwsIamPolicyDocument(this, "backend-s3-policy", {
        statement: [{
          actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
          resources: [
            `arn:aws:s3:::${commonTags.Environment}-backend-data/*`,
            `arn:aws:s3:::${commonTags.Environment}-backend-data`,
          ],
        }],
      }).json,
      "dynamodb-access": new DataAwsIamPolicyDocument(this, "backend-dynamodb-policy", {
        statement: [{
          actions: [
            "dynamodb:GetItem",
            "dynamodb:PutItem",
            "dynamodb:UpdateItem",
            "dynamodb:DeleteItem",
            "dynamodb:Query",
            "dynamodb:Scan",
          ],
          resources: [`arn:aws:dynamodb:us-east-1:${callerIdentity.accountId}:table/${commonTags.Environment}-*`],
        }],
      }).json,
    };

    const backendRole = new WorkloadRoleModule(
      this,
      "backend-workload-role",
      `${eksCluster.name}-backend-role`,
      "backend",
      iam.oidcProvider.arn,
      eksCluster.identity.get(0).oidc.get(0).issuer,
      backendPolicies,
      commonTags
    );

    const frontendPolicies = {
      "s3-static": new DataAwsIamPolicyDocument(this, "frontend-s3-policy", {
        statement: [{
          actions: ["s3:GetObject", "s3:ListBucket"],
          resources: [
            `arn:aws:s3:::${commonTags.Environment}-frontend-assets/*`,
            `arn:aws:s3:::${commonTags.Environment}-frontend-assets`,
          ],
        }],
      }).json,
      "cloudfront": new DataAwsIamPolicyDocument(this, "frontend-cf-policy", {
        statement: [{
          actions: ["cloudfront:CreateInvalidation"],
          resources: [`arn:aws:cloudfront::${callerIdentity.accountId}:distribution/*`],
        }],
      }).json,
    };

    const frontendRole = new WorkloadRoleModule(
      this,
      "frontend-workload-role",
      `${eksCluster.name}-frontend-role`,
      "frontend",
      iam.oidcProvider.arn,
      eksCluster.identity.get(0).oidc.get(0).issuer,
      frontendPolicies,
      commonTags
    );

    const dataProcessingPolicies = {
      "s3-data": new DataAwsIamPolicyDocument(this, "data-s3-policy", {
        statement: [{
          actions: ["s3:*"],
          resources: [
            `arn:aws:s3:::${commonTags.Environment}-data-lake/*`,
            `arn:aws:s3:::${commonTags.Environment}-data-lake`,
          ],
        }],
      }).json,
      "kinesis": new DataAwsIamPolicyDocument(this, "data-kinesis-policy", {
        statement: [{
          actions: [
            "kinesis:PutRecords",
            "kinesis:GetRecords",
            "kinesis:GetShardIterator",
            "kinesis:DescribeStream",
            "kinesis:ListStreams",
          ],
          resources: [`arn:aws:kinesis:us-east-1:${callerIdentity.accountId}:stream/${commonTags.Environment}-*`],
        }],
      }).json,
      "glue": new DataAwsIamPolicyDocument(this, "data-glue-policy", {
        statement: [{
          actions: [
            "glue:GetDatabase",
            "glue:GetTable",
            "glue:GetPartitions",
            "glue:CreateTable",
            "glue:UpdateTable",
          ],
          resources: ["*"],
        }],
      }).json,
    };

    const dataProcessingRole = new WorkloadRoleModule(
      this,
      "data-processing-workload-role",
      `${eksCluster.name}-data-processing-role`,
      "data-processing",
      iam.oidcProvider.arn,
      eksCluster.identity.get(0).oidc.get(0).issuer,
      dataProcessingPolicies,
      commonTags
    );

    // aws-auth ConfigMap
    const awsAuth = new ConfigMap(this, "aws-auth", {
      metadata: {
        name: "aws-auth",
        namespace: "kube-system",
      },
      data: {
        mapRoles: JSON.stringify([
          {
            rolearn: iam.eksNodeRole.arn,
            username: "system:node:{{EC2PrivateDNSName}}",
            groups: ["system:bootstrappers", "system:nodes"],
          },
          {
            rolearn: backendRole.role.arn,
            username: "backend-role",
            groups: ["backend-group"],
          },
          {
            rolearn: frontendRole.role.arn,
            username: "frontend-role",
            groups: ["frontend-group"],
          },
          {
            rolearn: dataProcessingRole.role.arn,
            username: "data-processing-role",
            groups: ["data-processing-group"],
          },
        ]),
        mapUsers: JSON.stringify([]),
      },
      dependsOn: [eksCluster],
    });

    // Network Policies
    const namespaces = ["backend", "frontend", "data-processing"];
    
    namespaces.forEach(ns => {
      // Create namespace first (simplified approach - in production use namespace resource)
      const denyAllIngress = new NetworkPolicy(this, `${ns}-deny-all-ingress`, {
        metadata: {
          name: "deny-all-ingress",
          namespace: ns,
        },
        spec: {
          podSelector: {},
          policyTypes: ["Ingress"],
        },
        dependsOn: [eksCluster],
      });

      // Allow traffic within namespace
      const allowSameNamespace = new NetworkPolicy(this, `${ns}-allow-same-namespace`, {
        metadata: {
          name: "allow-same-namespace",
          namespace: ns,
        },
        spec: {
          podSelector: {},
          policyTypes: ["Ingress"],
          ingress: [{
            from: [{
              podSelector: {},
            }],
          }],
        },
        dependsOn: [eksCluster],
      });

      // Allow ingress from ingress-nginx namespace
      const allowIngress = new NetworkPolicy(this, `${ns}-allow-ingress`, {
        metadata: {
          name: "allow-from-ingress",
          namespace: ns,
        },
        spec: {
          podSelector: {},
          policyTypes: ["Ingress"],
          ingress: [{
            from: [{
              namespaceSelector: {
                matchLabels: {
                  name: "ingress-nginx",
                },
              },
            }],
          }],
        },
        dependsOn: [eksCluster],
      });
    });

    // Default Storage Class for GP3
    const gp3StorageClass = new aws.dataAwsStorageClass.DataAwsStorageClass(this, "gp3", {
      storageClassName: "gp3",
      dependsOn: [eksCluster],
    });

    // Outputs
    new TerraformOutput(this, "cluster_endpoint", {
      value: eksCluster.endpoint,
      description: "EKS cluster endpoint",
    });

    new TerraformOutput(this, "cluster_name", {
      value: eksCluster.name,
      description: "EKS cluster name",
    });

    new TerraformOutput(this, "cluster_security_group_id", {
      value: clusterSecurityGroup.id,
      description: "Security group ID for cluster",
    });

    new TerraformOutput(this, "cluster_certificate_authority_data", {
      value: eksCluster.certificateAuthority.get(0).data,
      description: "Base64 encoded certificate data required to communicate with the cluster",
      sensitive: true,
    });

    new TerraformOutput(this, "cluster_oidc_issuer_url", {
      value: eksCluster.identity.get(0).oidc.get(0).issuer,
      description: "The URL on the EKS cluster's OIDC Issuer",
    });

    new TerraformOutput(this, "vpc_id", {
      value: network.vpc.id,
      description: "VPC ID",
    });

    new TerraformOutput(this, "private_subnet_ids", {
      value: network.privateSubnets.map(s => s.id).join(","),
      description: "Private subnet IDs",
    });

    new TerraformOutput(this, "kubeconfig_command", {
      value: `aws eks update-kubeconfig --region us-east-1 --name ${eksCluster.name}`,
      description: "Command to update kubeconfig",
    });

    new TerraformOutput(this, "cluster_autoscaler_role_arn", {
      value: autoscalerRole.role.arn,
      description: "IAM role ARN for cluster autoscaler",
    });

    new TerraformOutput(this, "ebs_csi_driver_role_arn", {
      value: ebsCsiRole.role.arn,
      description: "IAM role ARN for EBS CSI driver",
    });

    new TerraformOutput(this, "backend_workload_role_arn", {
      value: backendRole.role.arn,
      description: "IAM role ARN for backend workloads",
    });

    new TerraformOutput(this, "frontend_workload_role_arn", {
      value: frontendRole.role.arn,
      description: "IAM role ARN for frontend workloads",
    });

    new TerraformOutput(this, "data_processing_workload_role_arn", {
      value: dataProcessingRole.role.arn,
      description: "IAM role ARN for data processing workloads",
    });
  }
}
```