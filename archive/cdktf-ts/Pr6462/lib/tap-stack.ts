import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';

// Import your modules
import {
  VpcConstruct,
  NetworkingConfig,
  EksSecurityGroups,
  IamRoles,
  EcrRepository,
  EksNodeGroup,
  EksNodeGroupConfig,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
  regionOverride?: string; // Add this to make it testable
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Make AWS_REGION_OVERRIDE testable by using props
    const AWS_REGION_OVERRIDE = props?.regionOverride || '';
    const awsRegion = AWS_REGION_OVERRIDE || props?.awsRegion || 'us-east-1';

    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
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
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      ManagedBy: 'Terraform',
      Project: 'tap-stack',
    };

    const azs = new aws.dataAwsAvailabilityZones.DataAwsAvailabilityZones(
      this,
      'azs',
      {
        state: 'available',
      }
    );

    // 1. Create VPC with networking components
    const networkingConfig: NetworkingConfig = {
      vpcCidr: '10.0.0.0/16',
      availabilityZones: [
        Fn.element(azs.names, 0), // Gets the first element (index 0)
        Fn.element(azs.names, 1), // Gets the second element (index 1)
      ],
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.11.0/24'],
      tags: commonTags,
    };

    const vpcModule = new VpcConstruct(this, 'vpc-module', networkingConfig);

    // 2. Create Security Groups for EKS
    const eksSecurityGroups = new EksSecurityGroups(
      this,
      'eks-security-groups',
      vpcModule.vpc.id,
      commonTags
    );

    // 3. Create EKS Cluster
    const eksCluster = new aws.eksCluster.EksCluster(this, 'eks-cluster', {
      name: `eks-${environmentSuffix}`,
      roleArn: '', // Will be set after IAM roles are created
      version: '1.28',
      vpcConfig: {
        subnetIds: [
          ...vpcModule.publicSubnets.map(s => s.id),
          ...vpcModule.privateSubnets.map(s => s.id),
        ],
        securityGroupIds: [eksSecurityGroups.clusterSecurityGroup.id],
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
      tags: commonTags,
    });

    // Create OIDC Provider for IRSA
    const eksOidcIssuerUrl = eksCluster.identity.get(0).oidc.get(0).issuer;
    const eksOidcProvider =
      new aws.iamOpenidConnectProvider.IamOpenidConnectProvider(
        this,
        'eks-oidc-provider',
        {
          clientIdList: ['sts.amazonaws.com'],
          thumbprintList: ['9e99a48a9960b14926bb7f3b02e22da2b0ab7280'],
          url: eksOidcIssuerUrl,
          tags: commonTags,
        }
      );

    // 4. Create IAM Roles
    const iamRoles = new IamRoles(
      this,
      'iam-roles',
      `eks-${environmentSuffix}`,
      eksOidcProvider.arn,
      eksOidcIssuerUrl,
      commonTags
    );

    // Update EKS cluster with the correct role ARN
    eksCluster.roleArn = iamRoles.eksClusterRole.arn;

    // 5. Create ECR Repository
    const ecrModule = new EcrRepository(
      this,
      'ecr-repository',
      `tap-app-${environmentSuffix}`,
      commonTags
    );

    // 6. Create EKS Node Group for general workloads
    const generalNodeGroupConfig: EksNodeGroupConfig = {
      clusterName: eksCluster.name,
      nodeRoleName: iamRoles.eksNodeRole.arn,
      subnetIds: vpcModule.privateSubnets.map(s => s.id),
      instanceTypes: ['t3.medium'],
      scalingConfig: {
        desired: 2,
        min: 1,
        max: 4,
      },
      capacityType: 'ON_DEMAND',
      labels: {
        workload: 'general',
        environment: environmentSuffix,
      },
      tags: {
        Name: `eks-${environmentSuffix}-general-nodes`,
      },
    };

    // 7. Create EKS Node Group for spot instances
    const spotNodeGroupConfig: EksNodeGroupConfig = {
      clusterName: eksCluster.name,
      nodeRoleName: iamRoles.eksNodeRole.arn,
      subnetIds: vpcModule.privateSubnets.map(s => s.id),
      instanceTypes: ['t3.small', 't3a.small'],
      scalingConfig: {
        desired: 1,
        min: 0,
        max: 3,
      },
      capacityType: 'SPOT',
      labels: {
        workload: 'spot',
        environment: environmentSuffix,
      },
      tags: {
        Name: `eks-${environmentSuffix}-spot-nodes`,
      },
    };

    const spotNodeGroup = new EksNodeGroup(
      this,
      'spot-node-group',
      spotNodeGroupConfig
    );

    const generalNodeGroup = new EksNodeGroup(
      this,
      'general-node-group',
      generalNodeGroupConfig
    );

    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'vpc-cidr', {
      value: vpcModule.vpc.cidrBlock,
      description: 'VPC CIDR block',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'nat-gateway-ids', {
      value: vpcModule.natGateways
        ? vpcModule.natGateways.map(ng => ng.id)
        : [],
      description: 'NAT Gateway IDs',
    });

    new TerraformOutput(this, 'internet-gateway-id', {
      value: vpcModule.internetGateway ? vpcModule.internetGateway.id : '',
      description: 'Internet Gateway ID',
    });

    // EKS Cluster Outputs
    new TerraformOutput(this, 'eks-cluster-name', {
      value: eksCluster.name,
      description: 'EKS cluster name',
    });

    new TerraformOutput(this, 'eks-cluster-endpoint', {
      value: eksCluster.endpoint,
      description: 'EKS cluster endpoint URL',
    });

    new TerraformOutput(this, 'eks-cluster-version', {
      value: eksCluster.version,
      description: 'EKS cluster Kubernetes version',
    });

    new TerraformOutput(this, 'eks-cluster-arn', {
      value: eksCluster.arn,
      description: 'EKS cluster ARN',
    });

    new TerraformOutput(this, 'eks-cluster-certificate-authority', {
      value: eksCluster.certificateAuthority.get(0).data,
      description: 'EKS cluster certificate authority data',
    });

    new TerraformOutput(this, 'eks-cluster-platform-version', {
      value: eksCluster.platformVersion,
      description: 'EKS cluster platform version',
    });

    new TerraformOutput(this, 'eks-cluster-status', {
      value: eksCluster.status,
      description: 'EKS cluster status',
    });

    // OIDC Provider Outputs
    new TerraformOutput(this, 'eks-oidc-provider-arn', {
      value: eksOidcProvider.arn,
      description: 'EKS OIDC Provider ARN',
    });

    new TerraformOutput(this, 'eks-oidc-issuer-url', {
      value: eksOidcIssuerUrl,
      description: 'EKS OIDC Issuer URL',
    });

    // Security Group Outputs
    new TerraformOutput(this, 'cluster-security-group-id', {
      value: eksSecurityGroups.clusterSecurityGroup.id,
      description: 'EKS cluster security group ID',
    });

    new TerraformOutput(this, 'node-security-group-id', {
      value: eksSecurityGroups.nodeSecurityGroup.id,
      description: 'EKS node security group ID',
    });

    // IAM Role Outputs
    new TerraformOutput(this, 'eks-cluster-role-arn', {
      value: iamRoles.eksClusterRole.arn,
      description: 'IAM role ARN for EKS cluster',
    });

    new TerraformOutput(this, 'eks-cluster-role-name', {
      value: iamRoles.eksClusterRole.name,
      description: 'IAM role name for EKS cluster',
    });

    new TerraformOutput(this, 'eks-node-role-arn', {
      value: iamRoles.eksNodeRole.arn,
      description: 'IAM role ARN for EKS nodes',
    });

    new TerraformOutput(this, 'eks-node-role-name', {
      value: iamRoles.eksNodeRole.name,
      description: 'IAM role name for EKS nodes',
    });

    new TerraformOutput(this, 'cluster-autoscaler-role-arn', {
      value: iamRoles.clusterAutoscalerRole.arn,
      description: 'IAM role ARN for cluster autoscaler',
    });

    new TerraformOutput(this, 'aws-load-balancer-controller-role-arn', {
      value: iamRoles.awsLoadBalancerControllerRole.arn,
      description: 'IAM role ARN for AWS Load Balancer Controller',
    });

    new TerraformOutput(this, 'ecr-repository-url', {
      value: ecrModule.repositoryUrl,
      description: 'ECR repository URL for container images',
    });

    new TerraformOutput(this, 'ecr-repository-arn', {
      value: ecrModule.repository.arn,
      description: 'ECR repository ARN',
    });

    new TerraformOutput(this, 'ecr-repository-name', {
      value: ecrModule.repository.name,
      description: 'ECR repository name',
    });

    new TerraformOutput(this, 'ecr-registry-id', {
      value: ecrModule.repository.registryId,
      description: 'ECR registry ID',
    });

    new TerraformOutput(this, 'spot-node-group-id', {
      value: spotNodeGroup.nodeGroup.id,
      description: 'Spot node group ID',
    });

    new TerraformOutput(this, 'spot-node-group-arn', {
      value: spotNodeGroup.nodeGroup.arn,
      description: 'Spot node group ARN',
    });

    new TerraformOutput(this, 'spot-node-group-status', {
      value: spotNodeGroup.nodeGroup.status,
      description: 'Spot node group status',
    });

    new TerraformOutput(this, 'general-node-group-status', {
      value: generalNodeGroup.nodeGroup.status,
      description: 'General node group status',
    });

    // Additional useful outputs
    new TerraformOutput(this, 'aws-region', {
      value: awsRegion,
      description: 'AWS region where resources are deployed',
    });

    new TerraformOutput(this, 'environment-suffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
    });

    new TerraformOutput(this, 'availability-zones', {
      value: azs.names,
      description: 'Availability zones used for the deployment',
    });

    new TerraformOutput(this, 'kubeconfig-command', {
      value: `aws eks update-kubeconfig --region ${awsRegion} --name ${eksCluster.name}`,
      description: 'Command to update kubeconfig for kubectl access',
    });
  }
}
