import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

// Import all modules
import {
  ComputeModule,
  DatabaseModule,
  MonitoringModule,
  ParameterStoreModule,
  SecurityModule,
  StorageModule,
  VpcModule,
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

    // Define project configuration
    const projectName = `tap-${environmentSuffix}`;
    const tags = {
      Environment: environmentSuffix,
      Project: 'tap-infrastructure',
      ManagedBy: 'terraform',
    };

    // VPC Module
    const vpcModule = new VpcModule(this, 'vpc-module', {
      projectName,
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.11.0/24'],
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],
      enableFlowLogs: true,
      tags,
    });

    // Monitoring Module
    const monitoringModule = new MonitoringModule(this, 'monitoring-module', {
      projectName,
      vpcId: vpcModule.vpcId,
      tags,
    });

    // Enable VPC Flow Logs
    vpcModule.enableFlowLogs(monitoringModule.flowLogsGroup);

    // Security Module
    const securityModule = new SecurityModule(this, 'security-module', {
      vpcId: vpcModule.vpcId,
      sshAllowedCidr: '223.233.86.188/32', // TODO: Restrict this to your IP range
      tags,
    });

    // Compute Module
    const computeModule = new ComputeModule(this, 'compute-module', {
      projectName,
      publicSubnetIds: vpcModule.publicSubnetIds,
      securityGroupId: securityModule.publicInstanceSecurityGroupId,
      instanceType: 't3.micro',
      amiId: 'ami-052064a798f08f0d3', // Amazon Linux 2023 - update as needed
      tags,
    });

    // Database Module
    const databaseModule = new DatabaseModule(this, 'database-module', {
      projectName,
      privateSubnetIds: vpcModule.privateSubnetIds,
      vpcSecurityGroupIds: [securityModule.rdsSecurityGroupId],
      dbInstanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      backupRetentionPeriod: 7,
      deletionProtection: false, // Set to true for production
      tags,
    });

    // Allow database access from compute instances
    securityModule.allowDatabaseAccess(
      computeModule.instanceIds,
      databaseModule.port
    );

    // Storage Module
    const storageModule = new StorageModule(this, 'storage-module', {
      projectName,
      tags,
    });

    // Parameter Store Module
    new ParameterStoreModule(this, 'parameter-store-module', {
      projectName,
      dbEndpoint: databaseModule.endpoint,
      dbPort: databaseModule.port.toString(),
      tags,
    });

    // Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpcId,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnetIds,
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnetIds,
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'public-ec2-instance-ids', {
      value: computeModule.instanceIds,
      description: 'Public EC2 instance IDs',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: databaseModule.endpoint,
      description: 'RDS instance endpoint',
    });

    new TerraformOutput(this, 'app-logs-s3-bucket', {
      value: storageModule.bucketName,
      description: 'S3 bucket name for application logs',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });

    new TerraformOutput(this, 'nat-gateway-eip', {
      value: vpcModule.natGatewayEip,
      description: 'NAT Gateway Elastic IP',
    });
  }
}
