import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { TlsProvider } from '@cdktf/provider-tls/lib/provider';
import { EksCluster } from '@cdktf/provider-aws/lib/eks-cluster';
import { EksNodeGroup } from '@cdktf/provider-aws/lib/eks-node-group';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

// Import modules
import {
  NetworkModule,
  IamModule,
  NodeGroupConfig,
  VpcConfig,
  EksConfig,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  // Accept an array here because `bin/tap.ts` constructs defaultTags as an array
  defaultTags?: AwsProviderDefaultTags[];
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
    // The AwsProvider accepts an array of AwsProviderDefaultTags blocks.
    // `bin/tap.ts` constructs an array, so forward the array (or undefined)
    // directly to the provider.
    const defaultTags = props?.defaultTags ? props.defaultTags : undefined;

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure TLS Provider (needed for OIDC)
    new TlsProvider(this, 'tls', {});

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

    // Get current AWS account ID
    const current = new DataAwsCallerIdentity(this, 'current', {});

    // Common tags
    const commonTags = {
      Environment: environmentSuffix,
      ManagedBy: 'terraform-cdktf',
      Stack: id,
    };

    // Create VPC and networking
    const vpcConfig: VpcConfig = {
      vpcCidr: '10.0.0.0/16',
      azCount: 3,
      tags: commonTags,
    };

    const networkModule = new NetworkModule(this, 'network', vpcConfig);

    // Create IAM roles for EKS
    const eksConfig: EksConfig = {
      clusterName: `${environmentSuffix}-eks-cluster`,
      kubernetesVersion: '1.28',
      tags: commonTags,
    };

    const iamModule = new IamModule(this, 'iam', eksConfig);

    // Create EKS cluster
    const eksCluster = new EksCluster(this, 'eks-cluster', {
      name: eksConfig.clusterName,
      version: eksConfig.kubernetesVersion,
      roleArn: iamModule.eksClusterRole.arn,
      vpcConfig: {
        subnetIds: [...networkModule.privateSubnets.map(subnet => subnet.id)],
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

    // Setup OIDC provider after cluster is created
    iamModule.setupOidcProvider(eksCluster);

    // Create node group
    const nodeGroupConfig: NodeGroupConfig = {
      name: `${environmentSuffix}-general`,
      instanceTypes: ['t3.medium'],
      minSize: 2,
      maxSize: 10,
      desiredSize: 3,
      diskSize: 20,
      labels: {
        role: 'general',
      },
    };

    const nodeGroup = new EksNodeGroup(this, 'node-group-general', {
      clusterName: eksCluster.name,
      nodeGroupName: nodeGroupConfig.name,
      nodeRoleArn: iamModule.eksNodeRole.arn,
      subnetIds: networkModule.privateSubnets.map(subnet => subnet.id),
      scalingConfig: {
        minSize: nodeGroupConfig.minSize,
        maxSize: nodeGroupConfig.maxSize,
        desiredSize: nodeGroupConfig.desiredSize,
      },
      instanceTypes: nodeGroupConfig.instanceTypes,
      diskSize: nodeGroupConfig.diskSize,
      labels: nodeGroupConfig.labels,
      tags: commonTags,
      dependsOn: [eksCluster],
    });

    // Terraform Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: networkModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: networkModule.publicSubnets.map(subnet => subnet.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: networkModule.privateSubnets.map(subnet => subnet.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'eks-cluster-name', {
      value: eksCluster.name,
      description: 'EKS cluster name',
    });

    new TerraformOutput(this, 'eks-cluster-endpoint', {
      value: eksCluster.endpoint,
      description: 'EKS cluster endpoint',
    });

    new TerraformOutput(this, 'eks-cluster-certificate-authority-data', {
      value: eksCluster.certificateAuthority.get(0).data,
      description: 'EKS cluster certificate authority data',
      sensitive: true,
    });

    new TerraformOutput(this, 'eks-oidc-provider-arn', {
      value: iamModule.oidcProvider.arn,
      description: 'EKS OIDC provider ARN',
    });

    new TerraformOutput(this, 'eks-oidc-provider-url', {
      value: eksCluster.identity.get(0).oidc.get(0).issuer,
      description: 'EKS OIDC provider URL',
    });

    new TerraformOutput(this, 'node-group-id', {
      value: nodeGroup.id,
      description: 'EKS node group ID',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });
  }
}
