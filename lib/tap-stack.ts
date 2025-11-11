import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { TlsProvider } from '@cdktf/provider-tls/lib/provider';
import { EksCluster } from '@cdktf/provider-aws/lib/eks-cluster';
import { EksNodeGroup } from '@cdktf/provider-aws/lib/eks-node-group';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

// Import modules from modules.ts
import { 
  NetworkModule, 
  IamModule, 
  IrsaRoleModule, 
  WorkloadRoleModule,
  VpcConfig,
  EksConfig,
  NodeGroupConfig
} from './modules';

interface InfrastructureTapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  
  // Additional props for infrastructure configuration
  vpcCidr?: string;
  azCount?: number;
  clusterName?: string;
  kubernetesVersion?: string;
  nodeGroups?: NodeGroupConfig[];
  enableIrsaRoles?: boolean;
  enableWorkloadRoles?: boolean;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class InfrastructureTapStack extends TerraformStack {
  private network: NetworkModule;
  private iam: IamModule;
  private eksCluster: EksCluster;
  private nodeGroups: EksNodeGroup[] = [];
  private irsaRoles: IrsaRoleModule[] = [];
  private workloadRoles: WorkloadRoleModule[] = [];

  constructor(scope: Construct, id: string, props?: InfrastructureTapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure TLS Provider (required for OIDC thumbprint)
    new TlsProvider(this, 'tls');

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Infrastructure configuration
    const vpcCidr = props?.vpcCidr || '10.0.0.0/16';
    const azCount = props?.azCount || 3;
    const clusterName = props?.clusterName || `${environmentSuffix}-eks-cluster`;
    const kubernetesVersion = props?.kubernetesVersion || '1.28';

    const tags = {
      Environment: environmentSuffix,
      ManagedBy: 'CDKTF',
      Stack: id,
    };

    // Network Module - VPC, Subnets, NAT Gateways
    const vpcConfig: VpcConfig = {
      vpcCidr,
      azCount,
      tags,
    };
    this.network = new NetworkModule(this, 'network', vpcConfig);

    // IAM Module - EKS Roles
    const eksConfig: EksConfig = {
      clusterName,
      kubernetesVersion,
      tags,
    };
    this.iam = new IamModule(this, 'iam', eksConfig);

    // EKS Cluster
    this.eksCluster = new EksCluster(this, 'eks-cluster', {
      name: clusterName,
      version: kubernetesVersion,
      roleArn: this.iam.eksClusterRole.arn,
      vpcConfig: {
        subnetIds: [
          ...this.network.privateSubnets.map(s => s.id),
          ...this.network.publicSubnets.map(s => s.id),
        ],
        endpointPrivateAccess: true,
        endpointPublicAccess: true,
        publicAccessCidrs: ['0.0.0.0/0'],
      },
      enabledClusterLogTypes: [
        'api',
        'audit',
        'authenticator',
        'controllerManager',
        'scheduler',
      ],
      tags,
    });

    // Setup OIDC Provider
    this.iam.setupOidcProvider(this.eksCluster);

    // Node Groups
    const defaultNodeGroups: NodeGroupConfig[] = props?.nodeGroups || [
      {
        name: 'general',
        instanceTypes: ['t3.medium'],
        minSize: 2,
        maxSize: 10,
        desiredSize: 3,
        diskSize: 20,
        labels: {
          role: 'general',
        },
      },
    ];

    defaultNodeGroups.forEach((nodeGroupConfig, index) => {
      const nodeGroup = new EksNodeGroup(this, `node-group-${nodeGroupConfig.name}`, {
        clusterName: this.eksCluster.name,
        nodeGroupName: `${clusterName}-${nodeGroupConfig.name}`,
        nodeRoleArn: this.iam.eksNodeRole.arn,
        subnetIds: this.network.privateSubnets.map(s => s.id),
        instanceTypes: nodeGroupConfig.instanceTypes,
        scalingConfig: {
          minSize: nodeGroupConfig.minSize,
          maxSize: nodeGroupConfig.maxSize,
          desiredSize: nodeGroupConfig.desiredSize,
        },
        diskSize: nodeGroupConfig.diskSize,
        labels: nodeGroupConfig.labels,
        taint: nodeGroupConfig.taints,
        tags: {
          ...tags,
          NodeGroup: nodeGroupConfig.name,
        },
      });
      this.nodeGroups.push(nodeGroup);
    });

    // IRSA Roles (Example - AWS Load Balancer Controller)
    if (props?.enableIrsaRoles !== false) {
      this.setupIrsaRoles(clusterName, tags);
    }

    // Workload Roles (Example - Application roles)
    if (props?.enableWorkloadRoles) {
      this.setupWorkloadRoles(clusterName, tags);
    }
  }

  private setupIrsaRoles(clusterName: string, tags: { [key: string]: string }) {
    // AWS Load Balancer Controller IRSA Role
    const albControllerPolicy = new DataAwsIamPolicyDocument(this, 'alb-controller-policy', {
      statement: [
        {
          effect: 'Allow',
          actions: [
            'elasticloadbalancing:*',
            'ec2:Describe*',
            'ec2:CreateSecurityGroup',
            'ec2:CreateTags',
            'ec2:DeleteSecurityGroup',
            'ec2:AuthorizeSecurityGroupIngress',
            'ec2:RevokeSecurityGroupIngress',
            'ec2:AuthorizeSecurityGroupEgress',
            'ec2:RevokeSecurityGroupEgress',
            'ec2:DeleteTags',
            'iam:CreateServiceLinkedRole',
            'iam:GetServerCertificate',
            'iam:ListServerCertificates',
            'cognito-idp:DescribeUserPoolClient',
            'waf-regional:GetWebACLForResource',
            'waf-regional:AssociateWebACL',
            'waf-regional:DisassociateWebACL',
            'wafv2:GetWebACLForResource',
            'wafv2:AssociateWebACL',
            'wafv2:DisassociateWebACL',
            'shield:DescribeProtection',
            'shield:GetSubscriptionState',
            'shield:DeleteProtection',
            'shield:CreateProtection',
            'shield:DescribeSubscription',
            'shield:ListProtections',
          ],
          resources: ['*'],
        },
      ],
    });

    const albControllerRole = new IrsaRoleModule(
      this,
      'alb-controller-irsa',
      `${clusterName}-alb-controller`,
      'kube-system',
      'aws-load-balancer-controller',
      this.iam.oidcProvider.arn,
      this.eksCluster.identity.get(0).oidc.get(0).issuer,
      albControllerPolicy.json,
      tags
    );
    this.irsaRoles.push(albControllerRole);

    // EBS CSI Driver IRSA Role
    const ebsCsiPolicy = new DataAwsIamPolicyDocument(this, 'ebs-csi-policy', {
      statement: [
        {
          effect: 'Allow',
          actions: [
            'ec2:CreateSnapshot',
            'ec2:AttachVolume',
            'ec2:DetachVolume',
            'ec2:ModifyVolume',
            'ec2:DescribeAvailabilityZones',
            'ec2:DescribeInstances',
            'ec2:DescribeSnapshots',
            'ec2:DescribeTags',
            'ec2:DescribeVolumes',
            'ec2:DescribeVolumesModifications',
            'ec2:CreateTags',
            'ec2:CreateVolume',
            'ec2:DeleteSnapshot',
            'ec2:DeleteVolume',
          ],
          resources: ['*'],
        },
      ],
    });

    const ebsCsiRole = new IrsaRoleModule(
      this,
      'ebs-csi-irsa',
      `${clusterName}-ebs-csi-driver`,
      'kube-system',
      'ebs-csi-controller-sa',
      this.iam.oidcProvider.arn,
      this.eksCluster.identity.get(0).oidc.get(0).issuer,
      ebsCsiPolicy.json,
      tags
    );
    this.irsaRoles.push(ebsCsiRole);

    // Cluster Autoscaler IRSA Role
    const autoscalerPolicy = new DataAwsIamPolicyDocument(this, 'autoscaler-policy', {
      statement: [
        {
          effect: 'Allow',
          actions: [
            'autoscaling:DescribeAutoScalingGroups',
            'autoscaling:DescribeAutoScalingInstances',
            'autoscaling:DescribeLaunchConfigurations',
            'autoscaling:DescribeTags',
            'autoscaling:SetDesiredCapacity',
            'autoscaling:TerminateInstanceInAutoScalingGroup',
            'ec2:DescribeLaunchTemplateVersions',
            'ec2:DescribeInstanceTypes',
          ],
          resources: ['*'],
        },
      ],
    });

    const autoscalerRole = new IrsaRoleModule(
      this,
      'autoscaler-irsa',
      `${clusterName}-cluster-autoscaler`,
      'kube-system',
      'cluster-autoscaler',
      this.iam.oidcProvider.arn,
      this.eksCluster.identity.get(0).oidc.get(0).issuer,
      autoscalerPolicy.json,
      tags
    );
    this.irsaRoles.push(autoscalerRole);
  }

  private setupWorkloadRoles(clusterName: string, tags: { [key: string]: string }) {
    // Example workload role for applications in the 'production' namespace
    const s3Policy = new DataAwsIamPolicyDocument(this, 'workload-s3-policy', {
      statement: [
        {
          effect: 'Allow',
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:ListBucket',
          ],
          resources: [
            'arn:aws:s3:::my-app-bucket/*',
            'arn:aws:s3:::my-app-bucket',
          ],
        },
      ],
    });

    const dynamodbPolicy = new DataAwsIamPolicyDocument(this, 'workload-dynamodb-policy', {
      statement: [
        {
          effect: 'Allow',
          actions: [
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:DeleteItem',
            'dynamodb:Query',
            'dynamodb:Scan',
          ],
          resources: ['arn:aws:dynamodb:*:*:table/my-app-table*'],
        },
      ],
    });

    const workloadRole = new WorkloadRoleModule(
      this,
      'production-workload-role',
      `${clusterName}-production-apps`,
      'production',
      this.iam.oidcProvider.arn,
      this.eksCluster.identity.get(0).oidc.get(0).issuer,
      {
        's3-access': s3Policy.json,
        'dynamodb-access': dynamodbPolicy.json,
      },
      tags
    );
    this.workloadRoles.push(workloadRole);
  }
}