import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

// Import your modules
import {
  TagConfig,
  VpcModule,
  SubnetModule,
  InternetGatewayModule,
  RouteTableModule,
  NatGatewayModule,
  SecurityGroupModule,
  RdsModule,
  S3Module,
  IAMModule,
  EC2Module,
  ALBModule,
  CloudWatchModule,
  EBSSnapshotModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-west-2'.
const AWS_REGION_OVERRIDE = process.env.AWS_REGION_OVERRIDE || '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-west-2';
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

    // Get availability zones
    const availabilityZones = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Define environment-specific configurations
    const isProduction =
      environmentSuffix.toLowerCase() === 'prod' ||
      environmentSuffix.toLowerCase() === 'production';

    // Define tag configuration
    const tagConfig: TagConfig = {
      project: 'tap',
      env: environmentSuffix,
      owner: 'infrastructure-team',
    };

    // Create VPC
    const vpcModule = new VpcModule(this, 'vpc', {
      cidr: '10.0.0.0/16',
      tagConfig,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create Subnets
    const subnetModule = new SubnetModule(this, 'subnets', {
      vpc: vpcModule.vpc,
      subnets: [
        {
          cidr: '10.0.1.0/24',
          availabilityZone: `\${${availabilityZones.fqn}.names[0]}`,
          type: 'public',
          name: 'public-subnet-1',
        },
        {
          cidr: '10.0.2.0/24',
          availabilityZone: `\${${availabilityZones.fqn}.names[1]}`,
          type: 'public',
          name: 'public-subnet-2',
        },
        {
          cidr: '10.0.11.0/24',
          availabilityZone: `\${${availabilityZones.fqn}.names[0]}`,
          type: 'private',
          name: 'private-subnet-1',
        },
        {
          cidr: '10.0.12.0/24',
          availabilityZone: `\${${availabilityZones.fqn}.names[1]}`,
          type: 'private',
          name: 'private-subnet-2',
        },
      ],
      tagConfig,
    });

    // Create Internet Gateway
    const internetGatewayModule = new InternetGatewayModule(this, 'igw', {
      vpc: vpcModule.vpc,
      tagConfig,
    });

    // Create NAT Gateway
    const natGatewayModule = new NatGatewayModule(this, 'nat', {
      publicSubnet: subnetModule.publicSubnets[0],
      tagConfig,
    });

    // Create Route Tables
    const routeTableModule = new RouteTableModule(this, 'route-tables', {
      vpc: vpcModule.vpc,
      internetGateway: internetGatewayModule.internetGateway,
      natGateway: natGatewayModule.natGateway,
      publicSubnets: subnetModule.publicSubnets,
      privateSubnets: subnetModule.privateSubnets,
      tagConfig,
    });

    // Create Security Groups
    const securityGroupModule = new SecurityGroupModule(
      this,
      'security-groups',
      {
        vpc: vpcModule.vpc,
        sshAllowCidr: '10.0.0.0/16', // Restrict SSH to VPC CIDR for security
        tagConfig,
      }
    );

    // Create S3 bucket for log storage
    const s3Module = new S3Module(this, 's3', {
      tagConfig,
      bucketSuffix: awsRegion.replace('-', ''),
    });

    // Create IAM roles and policies
    const iamModule = new IAMModule(this, 'iam', {
      tagConfig,
      logsBucket: s3Module.logsBucket,
    });

    // Create EC2 infrastructure (Launch Template + Auto Scaling Group)
    const ec2Module = new EC2Module(this, 'ec2', {
      vpc: vpcModule.vpc,
      privateSubnets: subnetModule.privateSubnets,
      securityGroup: securityGroupModule.ec2SecurityGroup,
      instanceProfile: iamModule.ec2InstanceProfile,
      tagConfig,
      logsBucket: s3Module.logsBucket,
    });

    // Create Application Load Balancer
    const albModule = new ALBModule(this, 'alb', {
      vpc: vpcModule.vpc,
      publicSubnets: subnetModule.publicSubnets,
      securityGroup: securityGroupModule.albSecurityGroup,
      autoScalingGroup: ec2Module.autoScalingGroup,
      tagConfig,
    });

    // Create RDS with production-ready configuration
    const rdsModule = new RdsModule(this, 'rds', {
      vpc: vpcModule.vpc,
      privateSubnets: subnetModule.privateSubnets,
      securityGroup: securityGroupModule.rdsSecurityGroup,
      dbName: 'tapdb',
      dbInstanceClass: isProduction ? 'db.t3.small' : 'db.t3.micro',
      backupRetentionPeriod: isProduction ? 30 : 7,
      deletionProtection: isProduction,
      tagConfig,
      environmentName: environmentSuffix,
      masterUsername: 'dbadmin',
      enablePerformanceInsights: isProduction,
      monitoringInterval: isProduction ? 60 : 0,
    });

    // Create CloudWatch monitoring
    const cloudwatchModule = new CloudWatchModule(this, 'cloudwatch', {
      autoScalingGroup: ec2Module.autoScalingGroup,
      alb: albModule.alb,
      targetGroup: albModule.targetGroup,
      tagConfig,
    });

    // Create EBS snapshot automation
    const ebsSnapshotModule = new EBSSnapshotModule(this, 'ebs-snapshots', {
      tagConfig,
    });

    // Terraform Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: JSON.stringify(
        subnetModule.publicSubnets.map(subnet => subnet.id)
      ),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: JSON.stringify(
        subnetModule.privateSubnets.map(subnet => subnet.id)
      ),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'internet-gateway-id', {
      value: internetGatewayModule.internetGateway.id,
      description: 'Internet Gateway ID',
    });

    new TerraformOutput(this, 'nat-gateway-id', {
      value: natGatewayModule.natGateway.id,
      description: 'NAT Gateway ID',
    });

    new TerraformOutput(this, 'public-security-group-id', {
      value: securityGroupModule.publicSecurityGroup.id,
      description: 'Public Security Group ID',
    });

    new TerraformOutput(this, 'rds-security-group-id', {
      value: securityGroupModule.rdsSecurityGroup.id,
      description: 'RDS Security Group ID',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS database endpoint',
      sensitive: false,
    });

    new TerraformOutput(this, 'rds-port', {
      value: rdsModule.dbInstance.port.toString(),
      description: 'RDS database port',
    });

    new TerraformOutput(this, 'rds-master-user-secret-arn', {
      value: rdsModule.dbInstance.masterUserSecret.get(0).secretArn,
      description: 'ARN of the AWS-managed master user secret',
      sensitive: true,
    });

    new TerraformOutput(this, 'rds-instance-id', {
      value: rdsModule.dbInstance.id,
      description: 'RDS instance identifier',
    });

    new TerraformOutput(this, 'public-route-table-id', {
      value: routeTableModule.publicRouteTable.id,
      description: 'Public route table ID',
    });

    new TerraformOutput(this, 'private-route-table-id', {
      value: routeTableModule.privateRouteTable.id,
      description: 'Private route table ID',
    });

    // Additional outputs for new modules
    new TerraformOutput(this, 'alb-dns-name', {
      value: albModule.alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'alb-zone-id', {
      value: albModule.alb.zoneId,
      description: 'Application Load Balancer hosted zone ID',
    });

    new TerraformOutput(this, 's3-logs-bucket-name', {
      value: s3Module.logsBucket.bucket,
      description: 'S3 logs bucket name',
    });

    new TerraformOutput(this, 's3-logs-bucket-arn', {
      value: s3Module.logsBucket.arn,
      description: 'S3 logs bucket ARN',
    });

    new TerraformOutput(this, 'ec2-launch-template-id', {
      value: ec2Module.launchTemplate.id,
      description: 'EC2 Launch Template ID',
    });

    new TerraformOutput(this, 'auto-scaling-group-name', {
      value: ec2Module.autoScalingGroup.name,
      description: 'Auto Scaling Group name',
    });

    new TerraformOutput(this, 'cloudwatch-log-group-name', {
      value: cloudwatchModule.logGroup.name,
      description: 'CloudWatch Log Group name',
    });

    new TerraformOutput(this, 'ebs-lifecycle-policy-id', {
      value: ebsSnapshotModule.lifecyclePolicy.id,
      description: 'EBS snapshot lifecycle policy ID',
    });
  }
}
