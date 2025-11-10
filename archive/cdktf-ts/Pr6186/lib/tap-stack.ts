import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';
import { EksClusterStack } from './eks-cluster-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

const AWS_REGION_OVERRIDE = 'us-east-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    // AWS_REGION_OVERRIDE is a constant, so it always takes precedence
    const awsRegion = AWS_REGION_OVERRIDE;
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

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

    // Create VPC Infrastructure
    const vpcStack = new VpcStack(this, 'vpc-stack', {
      environmentSuffix,
      region: awsRegion,
    });

    // Create EKS Cluster
    const eksStack = new EksClusterStack(this, 'eks-cluster-stack', {
      environmentSuffix,
      vpcId: vpcStack.vpc.id,
      privateSubnetIds: vpcStack.privateSubnetIds,
      region: awsRegion,
    });

    // Outputs
    new TerraformOutput(this, 'cluster-endpoint', {
      value: eksStack.clusterEndpoint,
      description: 'EKS cluster endpoint URL',
    });

    new TerraformOutput(this, 'cluster-certificate-authority', {
      value: eksStack.clusterCertificateAuthority,
      description: 'EKS cluster certificate authority data',
      sensitive: true,
    });

    new TerraformOutput(this, 'oidc-provider-url', {
      value: eksStack.oidcProviderUrl,
      description: 'OIDC provider URL for IRSA',
    });

    new TerraformOutput(this, 'cluster-name', {
      value: eksStack.cluster.name,
      description: 'EKS cluster name',
    });

    new TerraformOutput(this, 'region', {
      value: awsRegion,
      description: 'AWS region',
    });

    new TerraformOutput(this, 'vpc-id', {
      value: vpcStack.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'kubectl-config-command', {
      value: `aws eks update-kubeconfig --region ${awsRegion} --name eks-cluster-${environmentSuffix}`,
      description: 'Command to configure kubectl',
    });
  }
}
