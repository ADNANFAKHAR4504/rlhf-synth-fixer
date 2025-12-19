import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// Import your constructs from modules
import {
  VpcConstruct,
  SecurityGroupConstruct,
  EksClusterConstruct,
  AlbConstruct,
  IrsaRoleConstruct,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  // Add specific configuration options
  vpcCidr?: string;
  eksVersion?: string;
  nodeGroupConfig?: {
    minSize: number;
    maxSize: number;
    desiredSize: number;
    instanceTypes: string[];
  };
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.
const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch for S3 state locking
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      ManagedBy: 'Terraform',
      Stack: id,
    };

    // Create VPC
    const vpcConstruct = new VpcConstruct(this, 'main-vpc', {
      cidrBlock: props?.vpcCidr || '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: commonTags,
    });

    // Create Security Group for EKS Cluster
    const eksClusterSecurityGroup = new SecurityGroupConstruct(
      this,
      'eks-cluster-sg',
      {
        vpcId: vpcConstruct.vpc.id,
        name: `${environmentSuffix}-eks-cluster-sg`,
        description: 'Security group for EKS cluster',
        ingressRules: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS traffic',
          } as any,
        ],
        egressRules: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          } as any,
        ],
        tags: commonTags,
      }
    );

    // Create EKS Cluster
    const eksCluster = new EksClusterConstruct(this, 'eks-cluster', {
      name: `${environmentSuffix}-cluster`,
      version: props?.eksVersion || '1.28',
      subnetIds: [...vpcConstruct.privateSubnets.map(s => s.id)],
      securityGroupIds: [eksClusterSecurityGroup.securityGroup.id],
      tags: commonTags,
    });

    // Create Security Group for ALB
    const albSecurityGroup = new SecurityGroupConstruct(this, 'alb-sg', {
      vpcId: vpcConstruct.vpc.id,
      name: `${environmentSuffix}-alb-sg`,
      description: 'Security group for Application Load Balancer',
      ingressRules: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP traffic',
        } as any,
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTPS traffic',
        } as any,
      ],
      egressRules: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        } as any,
      ],
      tags: commonTags,
    });

    // Create Application Load Balancer
    const alb = new AlbConstruct(this, 'main-alb', {
      name: `${environmentSuffix}-alb`,
      vpcId: vpcConstruct.vpc.id,
      subnetIds: vpcConstruct.publicSubnets.map(s => s.id),
      securityGroupId: albSecurityGroup.securityGroup.id,
      tags: commonTags,
    });

    // Create IRSA role for ALB Controller
    const albControllerRole = new IrsaRoleConstruct(
      this,
      'alb-controller-irsa',
      eksCluster.cluster.name,
      eksCluster.oidcProvider.arn,
      'kube-system',
      'aws-load-balancer-controller',
      ['arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess'],
      commonTags
    );

    // Create IRSA role for EBS CSI Driver
    const ebsCsiDriverRole = new IrsaRoleConstruct(
      this,
      'ebs-csi-driver-irsa',
      eksCluster.cluster.name,
      eksCluster.oidcProvider.arn,
      'kube-system',
      'ebs-csi-controller-sa',
      ['arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy'],
      commonTags
    );

    // Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpcConstruct.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'eks-cluster-name', {
      value: eksCluster.cluster.name,
      description: 'EKS Cluster Name',
    });

    new TerraformOutput(this, 'eks-cluster-endpoint', {
      value: eksCluster.cluster.endpoint,
      description: 'EKS Cluster Endpoint',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: alb.alb.dnsName,
      description: 'ALB DNS Name',
    });

    new TerraformOutput(this, 'alb-controller-role-arn', {
      value: albControllerRole.role.arn,
      description: 'ALB Controller IAM Role ARN',
    });

    new TerraformOutput(this, 'ebs-csi-driver-role-arn', {
      value: ebsCsiDriverRole.role.arn,
      description: 'EBS CSI Driver IAM Role ARN',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: JSON.stringify(vpcConstruct.publicSubnets.map(s => s.id)),
      description: 'Public Subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: JSON.stringify(vpcConstruct.privateSubnets.map(s => s.id)),
      description: 'Private Subnet IDs',
    });

    new TerraformOutput(this, 'eks-cluster-security-group-id', {
      value: eksClusterSecurityGroup.securityGroup.id,
      description: 'EKS Cluster Security Group ID',
    });

    new TerraformOutput(this, 'alb-security-group-id', {
      value: albSecurityGroup.securityGroup.id,
      description: 'ALB Security Group ID',
    });

    new TerraformOutput(this, 'alb-target-group-arn', {
      value: alb.targetGroup.arn,
      description: 'ALB Target Group ARN',
    });

    new TerraformOutput(this, 'nat-gateway-ids', {
      value: JSON.stringify(vpcConstruct.natGateways.map(ng => ng.id)),
      description: 'NAT Gateway IDs',
    });
  }
}
