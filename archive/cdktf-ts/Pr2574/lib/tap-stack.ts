import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// Import your stacks here
import {
  NetworkModule,
  SecurityModule,
  ComputeModule,
  DatabaseModule,
  StorageModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
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

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure Random Provider for password generation
    new RandomProvider(this, 'random');

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

    // Add your stack instantiations here
    // Do NOT create resources directly in this stack.
    // Instead, create separate stacks for each resource type.

    // Network Module
    const networkModule = new NetworkModule(this, 'network', {
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
    });

    // Security Module
    const securityModule = new SecurityModule(this, 'security', {
      vpcId: networkModule.outputs.vpcId,
    });

    // Storage Module (needs to be created before Compute for instance profile)
    const storageModule = new StorageModule(this, 'storage', {});

    // Compute Module
    const computeModule = new ComputeModule(this, 'compute', {
      vpcId: networkModule.outputs.vpcId,
      publicSubnetIds: networkModule.outputs.publicSubnetIds,
      privateSubnetIds: networkModule.outputs.privateSubnetIds,
      ec2SecurityGroupId: securityModule.outputs.ec2SecurityGroupId,
      albSecurityGroupId: securityModule.outputs.albSecurityGroupId,
      instanceProfileName: storageModule.outputs.instanceProfileName,
    });

    // Database Module
    const databaseModule = new DatabaseModule(this, 'database', {
      privateSubnetIds: networkModule.outputs.privateSubnetIds,
      rdsSecurityGroupId: securityModule.outputs.rdsSecurityGroupId,
    });

    // Terraform Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: networkModule.outputs.vpcId,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: JSON.stringify(networkModule.outputs.publicSubnetIds),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: JSON.stringify(networkModule.outputs.privateSubnetIds),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'internet-gateway-id', {
      value: networkModule.outputs.internetGatewayId,
      description: 'Internet Gateway ID',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: storageModule.outputs.s3BucketName,
      description: 'S3 bucket name',
    });

    new TerraformOutput(this, 'ec2-instance-profile-name', {
      value: storageModule.outputs.instanceProfileName,
      description: 'EC2 instance profile name',
    });

    new TerraformOutput(this, 'alb-security-group-id', {
      value: securityModule.outputs.albSecurityGroupId,
      description: 'ALB Security Group ID',
    });

    new TerraformOutput(this, 'ec2-security-group-id', {
      value: securityModule.outputs.ec2SecurityGroupId,
      description: 'EC2 Security Group ID',
    });

    new TerraformOutput(this, 'rds-security-group-id', {
      value: securityModule.outputs.rdsSecurityGroupId,
      description: 'RDS Security Group ID',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: computeModule.outputs.albDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'asg-name', {
      value: computeModule.outputs.asgName,
      description: 'Auto Scaling Group name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: databaseModule.outputs.rdsEndpoint,
      description: 'RDS database endpoint',
    });

    new TerraformOutput(this, 'rds-port', {
      value: databaseModule.outputs.rdsPort,
      description: 'RDS database port',
    });

    // Add these outputs after your existing outputs
    new TerraformOutput(this, 'rds-secret-arn', {
      value: databaseModule.outputs.secretArn,
      description: 'RDS password secret ARN',
      sensitive: true, // Mark as sensitive to avoid displaying in logs
    });

    new TerraformOutput(this, 'rds-secret-name', {
      value: databaseModule.outputs.secretName,
      description: 'RDS password secret name',
    });
  }
}
