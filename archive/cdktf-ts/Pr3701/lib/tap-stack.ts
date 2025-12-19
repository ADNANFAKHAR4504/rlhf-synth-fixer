import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

// Import the modules from modules.ts
import {
  NetworkModule,
  SecurityGroupModule,
  RdsModule,
  NetworkModuleConfig,
  SecurityGroupModuleConfig,
  RdsModuleConfig,
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

    // Common configuration values
    const projectName = 'tap';
    const environment = environmentSuffix;
    const commonTags = {
      Project: projectName,
      Environment: environment,
      ManagedBy: 'Terraform',
      CreatedBy: 'CDKTF',
    };

    // Network Module Configuration
    const networkConfig: NetworkModuleConfig = {
      projectName: projectName,
      environment: environment,
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.11.0/24'],
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],
      tags: commonTags,
    };

    // Create Network Module (VPC, Subnets, NAT Gateway, Route Tables)
    const networkModule = new NetworkModule(this, 'network', networkConfig);

    // Security Group Module Configuration
    const securityGroupConfig: SecurityGroupModuleConfig = {
      projectName: projectName,
      environment: environment,
      vpcId: networkModule.vpc.id,
      sshAllowedCidr: '106.213.83.113/32', // Change this to your specific IP range for SSH access
      tags: commonTags,
    };

    // Create Security Group Module
    const securityGroupModule = new SecurityGroupModule(
      this,
      'security',
      securityGroupConfig
    );

    // RDS Module Configuration
    const rdsConfig: RdsModuleConfig = {
      projectName: projectName,
      environment: environment,
      subnetIds: networkModule.privateSubnets.map(subnet => subnet.id),
      securityGroupId: securityGroupModule.rdsSecurityGroup.id,
      instanceClass: 'db.t3.micro', // Adjust based on your requirements
      allocatedStorage: 20,
      backupRetentionDays: 7,
      deletionProtection: environment === 'prod', // Enable for production
      tags: commonTags,
    };

    // Create RDS Module
    const rdsModule = new RdsModule(this, 'database', rdsConfig);

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

    new TerraformOutput(this, 'nat-gateway-id', {
      value: networkModule.natGateway.id,
      description: 'NAT Gateway ID',
    });

    new TerraformOutput(this, 'nat-eip-address', {
      value: networkModule.elasticIp.publicIp,
      description: 'NAT Gateway Elastic IP address',
    });

    new TerraformOutput(this, 'public-security-group-id', {
      value: securityGroupModule.publicSecurityGroup.id,
      description: 'Public Security Group ID',
    });

    new TerraformOutput(this, 'private-security-group-id', {
      value: securityGroupModule.privateSecurityGroup.id,
      description: 'Private Security Group ID',
    });

    new TerraformOutput(this, 'rds-security-group-id', {
      value: securityGroupModule.rdsSecurityGroup.id,
      description: 'RDS Security Group ID',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS instance endpoint',
    });

    new TerraformOutput(this, 'rds-db-name', {
      value: rdsModule.dbInstance.dbName,
      description: 'RDS database name',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });
  }
}
