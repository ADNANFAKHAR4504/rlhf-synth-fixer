import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

// Import modules
import {
  VpcModule,
  SecurityGroupsModule,
  AlbModule,
  IamModule,
  AsgModule,
  RdsModule,
  CloudWatchModule,
  SsmParameterModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  projectName?: string;
  customAmiId?: string;
  dbPassword?: string;
  alarmEmail?: string;
  keyName?: string;
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
    const projectName = props?.projectName || 'tap-project';
    const customAmiId = props?.customAmiId || 'ami-0c02fb55956c7d316'; // Update with your AMI

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

    // Common tags
    const commonTags = {
      Project: projectName,
      Environment: environmentSuffix,
      ManagedBy: 'Terraform',
      CreatedBy: 'CDKTF',
    };

    // VPC Module
    const vpcModule = new VpcModule(this, 'vpc', {
      projectName,
      environment: environmentSuffix,
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24'],
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],
      enableNatGatewayPerAz: false, // Set to true for HA
      tags: commonTags,
    });

    // Security Groups Module
    const securityGroups = new SecurityGroupsModule(this, 'security-groups', {
      projectName,
      environment: environmentSuffix,
      vpcId: vpcModule.vpc.id,
      albAllowedCidr: '0.0.0.0/0',
      applicationPort: 8080,
      databasePort: 5432,
      tags: commonTags,
    });

    // IAM Module
    const iamModule = new IamModule(this, 'iam', {
      projectName,
      environment: environmentSuffix,
      enableSsmAccess: true,
      additionalPolicies: [
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      ],
      tags: commonTags,
    });

    // ALB Module
    const albModule = new AlbModule(this, 'alb', {
      projectName,
      environment: environmentSuffix,
      vpcId: vpcModule.vpc.id,
      publicSubnetIds: vpcModule.publicSubnets.map(subnet => subnet.id),
      securityGroupId: securityGroups.albSecurityGroup.id,
      targetType: 'instance',
      healthCheckPath: '/health',
      applicationPort: 8080,
      enableAccessLogs: false,
      tags: commonTags,
    });

    // User data script for EC2 instances
    const userData = `#!/bin/bash
# Update system
yum update -y

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Start your application here
echo "Application deployment script goes here"
`;

    // Auto Scaling Group Module
    const asgModule = new AsgModule(this, 'asg', {
      projectName,
      environment: environmentSuffix,
      customAmiId: customAmiId,
      instanceType: 't3.medium',
      keyName: props?.keyName,
      instanceProfileArn: iamModule.instanceProfile.arn,
      securityGroupIds: [securityGroups.ec2SecurityGroup.id],
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      targetGroupArns: [albModule.targetGroup.arn],
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 2,
      userData,
      tags: commonTags,
    });

    // RDS Module
    const rdsModule = new RdsModule(this, 'rds', {
      projectName,
      environment: environmentSuffix,
      instanceClass: 'db.t3.medium',
      allocatedStorage: 100,
      storageType: 'gp3',
      storageEncrypted: true,
      engine: 'postgres',
      parameterGroupFamily: 'postgres17', // Add this line
      dbName: 'appdb',
      masterUsername: 'dbadmin',
      masterPassword: props?.dbPassword,
      backupRetentionPeriod: 7,
      multiAz: true,
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      securityGroupIds: [securityGroups.rdsSecurityGroup.id],
      deletionProtection: environmentSuffix === 'prod',
      applyImmediately: false,
      tags: commonTags,
    });

    // CloudWatch Module
    new CloudWatchModule(this, 'cloudwatch', {
      projectName,
      environment: environmentSuffix,
      logRetentionDays: 7,
      alarmEmail: props?.alarmEmail,
      asgName: asgModule.autoScalingGroup.name,
      dbInstanceId: rdsModule.dbInstance.id,
      tags: commonTags,
    });

    // SSM Parameters Module
    new SsmParameterModule(this, 'ssm-parameters', {
      projectName,
      environment: environmentSuffix,
      parameters: {
        'app/database-endpoint': rdsModule.dbInstance.endpoint,
        'app/database-name': rdsModule.dbInstance.dbName,
        'app/alb-dns': albModule.alb.dnsName,
      },
      tags: commonTags,
    });

    // Terraform Outputs
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
      description: 'ALB DNS name',
    });

    new TerraformOutput(this, 'alb-arn', {
      value: albModule.alb.arn,
      description: 'ALB ARN',
    });

    new TerraformOutput(this, 'asg-name', {
      value: asgModule.autoScalingGroup.name,
      description: 'Auto Scaling Group name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS instance endpoint',
    });

    new TerraformOutput(this, 'rds-instance-id', {
      value: rdsModule.dbInstance.id,
      description: 'RDS instance ID',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });
  }
}
