import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

// Import modules from modules.ts
import {
  CommonTags,
  VPCConstruct,
  VPCConfig,
  SecurityGroupsConstruct,
  IAMConstruct,
  RDSConstruct,
  RDSConfig,
  ALBConstruct,
  ASGConstruct,
  ASGConfig,
  MonitoringConstruct,
  SSMHelpers,
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

    // Define common tags for all resources
    const commonTags: CommonTags = {
      Project: 'tap-project',
      Environment: environmentSuffix,
      Owner: 'platform-team',
      ManagedBy: 'terraform-cdktf',
      CostCenter: 'engineering',
    };

    // 1. Create VPC with public and private subnets across multiple AZs
    const vpcConfig: VPCConfig = {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGatewayCount: 2, // High availability NAT gateways
      tags: commonTags,
    };
    const vpcModule = new VPCConstruct(this, 'vpc', vpcConfig);

    // 2. Create Security Groups for ALB, EC2, and RDS
    const securityGroups = new SecurityGroupsConstruct(
      this,
      'security-groups',
      vpcModule.vpc.id,
      commonTags
    );

    // 3. Create IAM roles and policies for EC2 instances
    const iamModule = new IAMConstruct(this, 'iam', commonTags);

    // 4. Create RDS PostgreSQL instance with Multi-AZ deployment
    const rdsConfig: RDSConfig = {
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      engine: 'postgres',
      username: 'dbadmin',
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      tags: commonTags,
    };
    const rdsModule = new RDSConstruct(
      this,
      'rds',
      rdsConfig,
      vpcModule.privateSubnets.map(subnet => subnet.id),
      [securityGroups.rdsSg.id]
    );

    // 5. Create Application Load Balancer in public subnets
    const albModule = new ALBConstruct(
      this,
      'alb',
      vpcModule.vpc.id,
      vpcModule.publicSubnets.map(subnet => subnet.id),
      [securityGroups.albSg.id],
      commonTags
    );

    // 6. Create Auto Scaling Group with launch template
    const asgConfig: ASGConfig = {
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 2,
      instanceType: 't3.micro',
      // keyName: 'your-key-pair-name', // Uncomment and set your EC2 key pair name
      tags: commonTags,
    };
    const asgModule = new ASGConstruct(
      this,
      'asg',
      asgConfig,
      vpcModule.privateSubnets.map(subnet => subnet.id),
      [securityGroups.ec2Sg.id],
      [albModule.targetGroup.arn],
      iamModule.ec2InstanceProfile.name
    );

    // 7. Create Monitoring resources (CloudWatch, CloudTrail, SNS)
    const monitoringModule = new MonitoringConstruct(
      this,
      'monitoring',
      commonTags,
      albModule.alb.arn,
      asgModule.asg.name,
      rdsModule.instance.id
    );

    // 8. Create SSM Parameter Store entries for configuration
    SSMHelpers.createCloudWatchAgentConfig(this, commonTags);

    // Store ALB DNS name in SSM for reference
    SSMHelpers.createParameter(
      this,
      'alb/dns-name',
      albModule.alb.dnsName,
      'ALB DNS name for application access',
      commonTags,
      false
    );

    // Terraform Outputs - only necessary outputs based on created resources
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: albModule.alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'alb-arn', {
      value: albModule.alb.arn,
      description: 'Application Load Balancer ARN',
    });

    new TerraformOutput(this, 'asg-name', {
      value: asgModule.asg.name,
      description: 'Auto Scaling Group name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.instance.endpoint,
      description: 'RDS PostgreSQL instance endpoint',
    });

    new TerraformOutput(this, 'rds-instance-id', {
      value: rdsModule.instance.id,
      description: 'RDS instance identifier',
    });

    new TerraformOutput(this, 'sns-topic-arn', {
      value: monitoringModule.snsTopic.arn,
      description: 'SNS topic ARN for alerts',
    });

    new TerraformOutput(this, 'cloudwatch-log-group', {
      value: monitoringModule.logGroup.name,
      description: 'CloudWatch log group for application logs',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });

    new TerraformOutput(this, 'aws-region', {
      value: awsRegion,
      description: 'AWS Region where resources are deployed',
    });
  }
}
