import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { NetworkModule, SecurityModule, ComputeModule } from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

const AWS_REGION_OVERRIDE = 'us-west-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'prod';
    const awsRegion = AWS_REGION_OVERRIDE || props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'your-tf-states-bucket-name'; // <-- IMPORTANT: Change this
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];
    const projectName = `webapp-${environmentSuffix}`;

    // --- Configure AWS Provider ---
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // --- Configure S3 Backend with native state locking ---
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // ===================================================================
    // ## Instantiate Infrastructure Modules
    // ===================================================================

    // --- 1. Network Module ---
    const network = new NetworkModule(this, 'NetworkInfrastructure', {
      vpcCidr: '10.0.0.0/16',
      projectName: projectName,
    });

    // --- 2. Security Module ---
    const security = new SecurityModule(this, 'SecurityInfrastructure', {
      vpcId: network.vpc.id,
      projectName: projectName,
    });

    // --- 3. Compute Module ---
    const compute = new ComputeModule(this, 'ComputeInfrastructure', {
      vpcId: network.vpc.id,
      publicSubnets: network.publicSubnets,
      privateSubnets: network.privateSubnets,
      albSg: security.albSg,
      ec2Sg: security.ec2Sg,
      kmsKey: security.kmsKey,
      instanceProfile: security.instanceProfile,
      projectName: projectName,
    });

    // ===================================================================
    // ## Stack Outputs
    // ===================================================================
    new TerraformOutput(this, 'ApplicationLoadBalancerDNS', {
      description: 'Public DNS name of the Application Load Balancer',
      value: compute.alb.dnsName,
    });

    new TerraformOutput(this, 'ApplicationURL', {
      description: 'URL to access the web application',
      value: `https://${compute.alb.dnsName}`,
    });

    new TerraformOutput(this, 'KmsKeyArn', {
      description: 'ARN of the KMS key for EBS encryption',
      value: security.kmsKey.arn,
    });

    new TerraformOutput(this, 'VpcId', {
      description: 'ID of the provisioned VPC',
      value: network.vpc.id,
    });
  }
}
