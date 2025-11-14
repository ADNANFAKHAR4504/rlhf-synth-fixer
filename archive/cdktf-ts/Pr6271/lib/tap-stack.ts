import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { TlsProvider } from '@cdktf/provider-tls/lib/provider';
import { EksCluster } from '@cdktf/provider-aws/lib/eks-cluster';
import { EksNodeGroup } from '@cdktf/provider-aws/lib/eks-node-group';
import { EksAddon } from '@cdktf/provider-aws/lib/eks-addon';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

// Import modules
import {
  NetworkModule,
  IamModule,
  IrsaRoleModule,
  WorkloadRoleModule,
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
      CostCenter: 'engineering',
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

    // Create node groups - three different instance types
    const nodeGroupConfigs: NodeGroupConfig[] = [
      {
        name: `${environmentSuffix}-medium`,
        instanceTypes: ['t3.medium'],
        minSize: 2, // Changed from 1 to 2
        maxSize: 5,
        desiredSize: 2, // Ensure this is at least 2
        diskSize: 20,
        labels: {
          role: 'general',
          size: 'medium',
        },
      },
      {
        name: `${environmentSuffix}-large`,
        instanceTypes: ['t3.large'],
        minSize: 1,
        maxSize: 3,
        desiredSize: 1,
        diskSize: 20,
        labels: {
          role: 'compute',
          size: 'large',
        },
      },
      {
        name: `${environmentSuffix}-xlarge`,
        instanceTypes: ['t3.xlarge'],
        minSize: 0,
        maxSize: 2,
        desiredSize: 0,
        diskSize: 20,
        labels: {
          role: 'batch',
          size: 'xlarge',
        },
      },
    ];

    const nodeGroups: EksNodeGroup[] = [];
    nodeGroupConfigs.forEach(config => {
      const nodeGroup = new EksNodeGroup(
        this,
        `node-group-${config.labels!.size}`,
        {
          clusterName: eksCluster.name,
          nodeGroupName: config.name,
          nodeRoleArn: iamModule.eksNodeRole.arn,
          subnetIds: networkModule.privateSubnets.map(subnet => subnet.id),
          scalingConfig: {
            minSize: config.minSize,
            maxSize: config.maxSize,
            desiredSize: config.desiredSize,
          },
          instanceTypes: config.instanceTypes,
          diskSize: config.diskSize,
          labels: config.labels,
          tags: commonTags,
          dependsOn: [eksCluster],
        }
      );
      nodeGroups.push(nodeGroup);
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
    });

    new TerraformOutput(this, 'eks-oidc-provider-arn', {
      value: iamModule.oidcProvider.arn,
      description: 'EKS OIDC provider ARN',
    });

    new TerraformOutput(this, 'eks-oidc-provider-url', {
      value: eksCluster.identity.get(0).oidc.get(0).issuer,
      description: 'EKS OIDC provider URL',
    });

    // Create IRSA roles for cluster autoscaler and EBS CSI driver
    const clusterAutoscalerPolicyDocument = JSON.stringify({
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
            'autoscaling:SetDesiredCapacity',
            'autoscaling:TerminateInstanceInAutoScalingGroup',
            'ec2:DescribeImages',
            'ec2:DescribeInstanceTypes',
            'ec2:DescribeLaunchTemplateVersions',
            'ec2:GetInstanceTypesFromInstanceRequirements',
            'eks:DescribeNodegroup',
          ],
          Resource: '*',
        },
      ],
    });

    const ebsCsiPolicyDocument = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
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
          ],
          Resource: '*',
        },
        {
          Effect: 'Allow',
          Action: ['ec2:CreateTags'],
          Resource: ['arn:aws:ec2:*:*:volume/*', 'arn:aws:ec2:*:*:snapshot/*'],
          Condition: {
            StringEquals: {
              'ec2:CreateAction': ['CreateVolume', 'CreateSnapshot'],
            },
          },
        },
        {
          Effect: 'Allow',
          Action: ['ec2:DeleteTags'],
          Resource: ['arn:aws:ec2:*:*:volume/*', 'arn:aws:ec2:*:*:snapshot/*'],
        },
        {
          Effect: 'Allow',
          Action: ['ec2:CreateVolume'],
          Resource: '*',
          Condition: {
            StringLike: {
              'aws:RequestedRegion': 'us-*',
            },
          },
        },
        {
          Effect: 'Allow',
          Action: ['ec2:DeleteVolume'],
          Resource: '*',
          Condition: {
            StringLike: {
              'ec2:ResourceTag/ebs.csi.aws.com/cluster': 'true',
            },
          },
        },
        {
          Effect: 'Allow',
          Action: ['ec2:DeleteSnapshot'],
          Resource: '*',
          Condition: {
            StringLike: {
              'ec2:ResourceTag/CSIVolumeSnapshotName': '*',
            },
          },
        },
      ],
    });

    const clusterAutoscalerRole = new IrsaRoleModule(
      this,
      'cluster-autoscaler-irsa',
      `${eksConfig.clusterName}-cluster-autoscaler`,
      'kube-system',
      'cluster-autoscaler',
      iamModule.oidcProvider.arn,
      eksCluster.identity.get(0).oidc.get(0).issuer,
      clusterAutoscalerPolicyDocument,
      commonTags
    );

    const ebsCsiRole = new IrsaRoleModule(
      this,
      'ebs-csi-irsa',
      `${eksConfig.clusterName}-ebs-csi-driver`,
      'kube-system',
      'ebs-csi-controller-sa',
      iamModule.oidcProvider.arn,
      eksCluster.identity.get(0).oidc.get(0).issuer,
      ebsCsiPolicyDocument,
      commonTags
    );

    const vpcCniAddon = new EksAddon(this, 'vpc-cni', {
      clusterName: eksCluster.name,
      addonName: 'vpc-cni',
      addonVersion: 'v1.15.4-eksbuild.1',
      tags: commonTags,
      dependsOn: [eksCluster, nodeGroups[0]],
    });
    const coreDnsAddon = new EksAddon(this, 'coredns', {
      clusterName: eksCluster.name,
      addonName: 'coredns',
      addonVersion: 'v1.10.1-eksbuild.5',
      tags: commonTags,
      dependsOn: [eksCluster, nodeGroups[0]],
    });
    // EBS CSI Driver addon
    new EksAddon(this, 'ebs-csi-driver', {
      clusterName: eksCluster.name,
      addonName: 'aws-ebs-csi-driver',
      addonVersion: 'v1.25.0-eksbuild.1', // Add explicit version
      serviceAccountRoleArn: ebsCsiRole.role.arn,
      tags: commonTags,
      dependsOn: [
        eksCluster,
        ebsCsiRole.role,
        iamModule.oidcProvider, // Add OIDC provider dependency
        nodeGroups[0], // Add dependency on at least one node group
        vpcCniAddon,
        coreDnsAddon,
      ],
    });

    // Create workload IAM roles
    const backendPolicyDocument = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            's3:GetObject',
            's3:PutObject',
            'rds:DescribeDBInstances',
            'ssm:GetParameter',
          ],
          Resource: '*',
        },
      ],
    });

    const frontendPolicyDocument = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['cloudfront:CreateInvalidation', 's3:GetObject'],
          Resource: '*',
        },
      ],
    });

    const dataProcessingPolicyDocument = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            's3:GetObject',
            's3:PutObject',
            's3:ListBucket',
            'sqs:ReceiveMessage',
            'sqs:DeleteMessage',
          ],
          Resource: '*',
        },
      ],
    });

    const backendRole = new WorkloadRoleModule(
      this,
      'backend-workload-role',
      `${eksConfig.clusterName}-backend-role`,
      'backend',
      iamModule.oidcProvider.arn,
      eksCluster.identity.get(0).oidc.get(0).issuer,
      { backend: backendPolicyDocument },
      commonTags
    );

    const frontendRole = new WorkloadRoleModule(
      this,
      'frontend-workload-role',
      `${eksConfig.clusterName}-frontend-role`,
      'frontend',
      iamModule.oidcProvider.arn,
      eksCluster.identity.get(0).oidc.get(0).issuer,
      { frontend: frontendPolicyDocument },
      commonTags
    );

    const dataProcessingRole = new WorkloadRoleModule(
      this,
      'data-processing-workload-role',
      `${eksConfig.clusterName}-data-processing-role`,
      'data-processing',
      iamModule.oidcProvider.arn,
      eksCluster.identity.get(0).oidc.get(0).issuer,
      { dataProcessing: dataProcessingPolicyDocument },
      commonTags
    );

    new TerraformOutput(this, 'node-group-ids', {
      value: nodeGroups.map(ng => ng.id),
      description: 'EKS node group IDs',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });

    new TerraformOutput(this, 'kubeconfig-command', {
      value: `aws eks update-kubeconfig --region ${awsRegion} --name ${eksCluster.name}`,
      description: 'Command to update kubeconfig',
    });

    new TerraformOutput(this, 'cluster-autoscaler-role-arn', {
      value: clusterAutoscalerRole.role.arn,
      description: 'Cluster autoscaler IAM role ARN',
    });

    new TerraformOutput(this, 'ebs-csi-role-arn', {
      value: ebsCsiRole.role.arn,
      description: 'EBS CSI driver IAM role ARN',
    });

    new TerraformOutput(this, 'backend-role-arn', {
      value: backendRole.role.arn,
      description: 'Backend workload IAM role ARN',
    });

    new TerraformOutput(this, 'frontend-role-arn', {
      value: frontendRole.role.arn,
      description: 'Frontend workload IAM role ARN',
    });

    new TerraformOutput(this, 'data-processing-role-arn', {
      value: dataProcessingRole.role.arn,
      description: 'Data processing workload IAM role ARN',
    });
  }
}
