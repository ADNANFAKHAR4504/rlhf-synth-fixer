import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { AutoscalingAttachment } from '@cdktf/provider-aws/lib/autoscaling-attachment';
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { AlbTargetGroup } from '@cdktf/provider-aws/lib/alb-target-group';
import { AlbListener } from '@cdktf/provider-aws/lib/alb-listener';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';

import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';

import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { DlmLifecyclePolicy } from '@cdktf/provider-aws/lib/dlm-lifecycle-policy';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

// Common tag configuration interface
export interface TagConfig {
  project: string;
  env: string;
  owner: string;
}

// Helper function to create standardized tags
export function createTags(
  tagConfig: TagConfig,
  resourceName: string
): Record<string, string> {
  return {
    Name: `${tagConfig.project}-${tagConfig.env}-${resourceName}`,
    Environment: tagConfig.env,
    Project: tagConfig.project,
    Owner: tagConfig.owner,
    ManagedBy: 'terraform',
  };
}

/**
 * VPC Module - Creates the main VPC with DNS support
 */
export interface VpcModuleProps {
  cidr: string;
  tagConfig: TagConfig;
  enableDnsHostnames?: boolean;
  enableDnsSupport?: boolean;
}

export class VpcModule extends Construct {
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.cidr,
      enableDnsHostnames: props.enableDnsHostnames ?? true,
      enableDnsSupport: props.enableDnsSupport ?? true,
      tags: createTags(props.tagConfig, 'vpc'),
    });
  }
}

/**
 * Subnet Module - Creates public and private subnets across multiple AZs
 */
export interface SubnetConfig {
  cidr: string;
  availabilityZone: string;
  type: 'public' | 'private';
  name: string;
}

export interface SubnetModuleProps {
  vpc: Vpc;
  subnets: SubnetConfig[];
  tagConfig: TagConfig;
}

export class SubnetModule extends Construct {
  public readonly publicSubnets: Subnet[] = [];
  public readonly privateSubnets: Subnet[] = [];

  constructor(scope: Construct, id: string, props: SubnetModuleProps) {
    super(scope, id);

    props.subnets.forEach((subnetConfig, index) => {
      const subnet = new Subnet(this, `subnet-${index}`, {
        vpcId: props.vpc.id,
        cidrBlock: subnetConfig.cidr,
        availabilityZone: subnetConfig.availabilityZone,
        mapPublicIpOnLaunch: subnetConfig.type === 'public',
        tags: createTags(props.tagConfig, subnetConfig.name),
      });

      if (subnetConfig.type === 'public') {
        this.publicSubnets.push(subnet);
      } else {
        this.privateSubnets.push(subnet);
      }
    });
  }
}

/**
 * Internet Gateway Module - Creates and attaches IGW to VPC
 */
export interface InternetGatewayModuleProps {
  vpc: Vpc;
  tagConfig: TagConfig;
}

export class InternetGatewayModule extends Construct {
  public readonly internetGateway: InternetGateway;

  constructor(scope: Construct, id: string, props: InternetGatewayModuleProps) {
    super(scope, id);

    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: props.vpc.id,
      tags: createTags(props.tagConfig, 'internet-gateway'),
    });
  }
}

/**
 * NAT Gateway Module - Creates NAT Gateway with Elastic IP
 */
export interface NatGatewayModuleProps {
  publicSubnet: Subnet;
  tagConfig: TagConfig;
}

export class NatGatewayModule extends Construct {
  public readonly natGateway: NatGateway;
  public readonly elasticIp: Eip;

  constructor(scope: Construct, id: string, props: NatGatewayModuleProps) {
    super(scope, id);

    this.elasticIp = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: createTags(props.tagConfig, 'nat-gateway-eip'),
    });

    this.natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: this.elasticIp.id,
      subnetId: props.publicSubnet.id,
      tags: createTags(props.tagConfig, 'nat-gateway'),
    });
  }
}

/**
 * Route Table Module - Creates and configures route tables for public and private subnets
 */
export interface RouteTableModuleProps {
  vpc: Vpc;
  internetGateway: InternetGateway;
  natGateway: NatGateway;
  publicSubnets: Subnet[];
  privateSubnets: Subnet[];
  tagConfig: TagConfig;
}

export class RouteTableModule extends Construct {
  public readonly publicRouteTable: RouteTable;
  public readonly privateRouteTable: RouteTable;

  constructor(scope: Construct, id: string, props: RouteTableModuleProps) {
    super(scope, id);

    // Public Route Table
    this.publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: props.vpc.id,
      tags: createTags(props.tagConfig, 'public-route-table'),
    });

    // Public route to Internet Gateway
    new Route(this, 'public-route', {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: props.internetGateway.id,
    });

    // Associate public subnets with public route table
    props.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: this.publicRouteTable.id,
      });
    });

    // Private Route Table
    this.privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: props.vpc.id,
      tags: createTags(props.tagConfig, 'private-route-table'),
    });

    // Private route to NAT Gateway
    new Route(this, 'private-route', {
      routeTableId: this.privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: props.natGateway.id,
    });

    // Associate private subnets with private route table
    props.privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `private-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: this.privateRouteTable.id,
      });
    });
  }
}

/**
 * Security Group Module - Creates security groups for different tiers
 */
export interface SecurityGroupModuleProps {
  vpc: Vpc;
  sshAllowCidr: string;
  tagConfig: TagConfig;
}

export class SecurityGroupModule extends Construct {
  public readonly albSecurityGroup: SecurityGroup;
  public readonly ec2SecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;
  public readonly publicSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityGroupModuleProps) {
    super(scope, id);

    // ALB Security Group
    this.albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `${props.tagConfig.project}-${props.tagConfig.env}-alb-sg`,
      description: 'Security group for Application Load Balancer',
      vpcId: props.vpc.id,
      tags: createTags(props.tagConfig, 'alb-security-group'),
    });

    // ALB ingress rules
    new SecurityGroupRule(this, 'alb-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
      description: 'HTTP access from internet',
    });

    new SecurityGroupRule(this, 'alb-https-ingress', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
      description: 'HTTPS access from internet',
    });

    new SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
      description: 'All outbound traffic',
    });

    // EC2 Security Group
    this.ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      name: `${props.tagConfig.project}-${props.tagConfig.env}-ec2-sg`,
      description: 'Security group for EC2 instances',
      vpcId: props.vpc.id,
      tags: createTags(props.tagConfig, 'ec2-security-group'),
    });

    // EC2 ingress from ALB
    new SecurityGroupRule(this, 'ec2-alb-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: this.albSecurityGroup.id,
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'HTTP access from ALB',
    });

    // EC2 SSH access
    new SecurityGroupRule(this, 'ec2-ssh-ingress', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: [props.sshAllowCidr],
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'SSH access',
    });

    new SecurityGroupRule(this, 'ec2-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'All outbound traffic',
    });

    // RDS Security Group
    this.rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `${props.tagConfig.project}-${props.tagConfig.env}-rds-sg`,
      description: 'Security group for RDS database',
      vpcId: props.vpc.id,
      tags: createTags(props.tagConfig, 'rds-security-group'),
    });

    // RDS ingress from EC2
    new SecurityGroupRule(this, 'rds-ec2-ingress', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: this.ec2SecurityGroup.id,
      securityGroupId: this.rdsSecurityGroup.id,
      description: 'MySQL access from EC2',
    });

    // Public Security Group (for backwards compatibility)
    this.publicSecurityGroup = this.albSecurityGroup;
  }
}

/**
 * RDS Module - Creates RDS MySQL instance with enhanced security and monitoring
 */
export interface RdsModuleProps {
  vpc: Vpc;
  privateSubnets: Subnet[];
  securityGroup: SecurityGroup;
  dbName: string;
  dbInstanceClass: string;
  backupRetentionPeriod: number;
  deletionProtection: boolean;
  tagConfig: TagConfig;
  environmentName: string;
  masterUsername: string;
  enablePerformanceInsights?: boolean;
  monitoringInterval?: number;
}

export class RdsModule extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly dbSubnetGroup: DbSubnetGroup;

  constructor(scope: Construct, id: string, props: RdsModuleProps) {
    super(scope, id);

    // DB Subnet Group
    this.dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${props.tagConfig.project}-${props.tagConfig.env}-db-subnet-group`,
      subnetIds: props.privateSubnets.map(subnet => subnet.id),
      description: `Database subnet group for ${props.tagConfig.project}-${props.tagConfig.env}`,
      tags: createTags(props.tagConfig, 'db-subnet-group'),
    });

    // RDS Instance
    this.dbInstance = new DbInstance(this, 'rds-instance', {
      identifier: `${props.tagConfig.project}-${props.tagConfig.env}-database`,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: props.dbInstanceClass,
      allocatedStorage: 20,
      storageType: 'gp3',
      storageEncrypted: true,
      dbName: props.dbName,
      username: props.masterUsername,
      manageMasterUserPassword: true,
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: [props.securityGroup.id],
      backupRetentionPeriod: props.backupRetentionPeriod,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      skipFinalSnapshot: !props.deletionProtection,
      finalSnapshotIdentifier: props.deletionProtection
        ? `${props.tagConfig.project}-${props.tagConfig.env}-final-snapshot-${Date.now()}`
        : undefined,
      deletionProtection: props.deletionProtection,
      publiclyAccessible: false,
      multiAz: props.deletionProtection, // Enable Multi-AZ for production
      performanceInsightsEnabled: props.enablePerformanceInsights ?? false,
      monitoringInterval: props.monitoringInterval ?? 0,
      autoMinorVersionUpgrade: true,
      copyTagsToSnapshot: true,
      tags: createTags(props.tagConfig, 'rds-instance'),
    });
  }
}

/**
 * S3 Module - Creates S3 bucket for log storage with encryption and security
 */
export interface S3ModuleProps {
  tagConfig: TagConfig;
  bucketSuffix?: string;
}

export class S3Module extends Construct {
  public readonly logsBucket: S3Bucket;

  constructor(scope: Construct, id: string, props: S3ModuleProps) {
    super(scope, id);

    const bucketName = `${props.tagConfig.project}-${props.tagConfig.env}-logs-${props.bucketSuffix || Date.now()}`;

    // S3 bucket for logs
    this.logsBucket = new S3Bucket(this, 'logs-bucket', {
      bucket: bucketName,
      tags: createTags(props.tagConfig, 'logs-bucket'),
    });

    // S3 bucket versioning
    new S3BucketVersioningA(this, 'logs-bucket-versioning', {
      bucket: this.logsBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // S3 bucket server-side encryption
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'logs-bucket-encryption',
      {
        bucket: this.logsBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Block public access
    new S3BucketPublicAccessBlock(this, 'logs-bucket-pab', {
      bucket: this.logsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}

/**
 * IAM Module - Creates IAM roles and policies for EC2 to access S3 and other AWS services
 */
export interface IAMModuleProps {
  tagConfig: TagConfig;
  logsBucket: S3Bucket;
}

export class IAMModule extends Construct {
  public readonly ec2Role: IamRole;
  public readonly ec2InstanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, props: IAMModuleProps) {
    super(scope, id);

    // EC2 IAM Role
    this.ec2Role = new IamRole(this, 'ec2-role', {
      name: `${props.tagConfig.project}-${props.tagConfig.env}-ec2-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
      tags: createTags(props.tagConfig, 'ec2-role'),
    });

    // S3 access policy for logs
    const s3LogsPolicy = new IamPolicy(this, 's3-logs-policy', {
      name: `${props.tagConfig.project}-${props.tagConfig.env}-s3-logs-policy`,
      description: 'Policy for EC2 to access S3 logs bucket',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
              's3:GetBucketLocation',
            ],
            Resource: [props.logsBucket.arn, `${props.logsBucket.arn}/*`],
          },
        ],
      }),
      tags: createTags(props.tagConfig, 's3-logs-policy'),
    });

    // CloudWatch Logs policy
    const cloudwatchLogsPolicy = new IamPolicy(this, 'cloudwatch-logs-policy', {
      name: `${props.tagConfig.project}-${props.tagConfig.env}-cloudwatch-logs-policy`,
      description: 'Policy for EC2 to write to CloudWatch Logs',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
              'logs:DescribeLogGroups',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: createTags(props.tagConfig, 'cloudwatch-logs-policy'),
    });

    // Attach policies to role
    new IamRolePolicyAttachment(this, 'ec2-s3-policy-attachment', {
      role: this.ec2Role.name,
      policyArn: s3LogsPolicy.arn,
    });

    new IamRolePolicyAttachment(this, 'ec2-cloudwatch-logs-policy-attachment', {
      role: this.ec2Role.name,
      policyArn: cloudwatchLogsPolicy.arn,
    });

    new IamRolePolicyAttachment(this, 'ec2-ssm-policy-attachment', {
      role: this.ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    new IamRolePolicyAttachment(
      this,
      'ec2-cloudwatch-agent-policy-attachment',
      {
        role: this.ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      }
    );

    // Instance Profile
    this.ec2InstanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${props.tagConfig.project}-${props.tagConfig.env}-ec2-instance-profile`,
        role: this.ec2Role.name,
        tags: createTags(props.tagConfig, 'ec2-instance-profile'),
      }
    );
  }
}

/**
 * EC2 Module - Creates Auto Scaling Group with Launch Template for zero-downtime deployments
 */
export interface EC2ModuleProps {
  vpc: Vpc;
  privateSubnets: Subnet[];
  securityGroup: SecurityGroup;
  instanceProfile: IamInstanceProfile;
  tagConfig: TagConfig;
  logsBucket: S3Bucket;
}

export class EC2Module extends Construct {
  public readonly launchTemplate: LaunchTemplate;
  public readonly autoScalingGroup: AutoscalingGroup;

  constructor(scope: Construct, id: string, props: EC2ModuleProps) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // User data script for EC2 initialization
    const userData = Buffer.from(
      `#!/bin/bash
# Update system
yum update -y

# Install and start web server
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create a simple index page
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>${props.tagConfig.project} - ${props.tagConfig.env}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
        .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
        .info { margin: 20px 0; }
        .status { color: #28a745; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="header">Welcome to ${props.tagConfig.project}</h1>
        <div class="info">
            <p><strong>Environment:</strong> ${props.tagConfig.env}</p>
            <p><strong>Status:</strong> <span class="status">Running</span></p>
            <p><strong>Instance ID:</strong> <span id="instance-id">Loading...</span></p>
            <p><strong>Timestamp:</strong> $(date)</p>
        </div>
    </div>
    <script>
        fetch('http://169.254.169.254/latest/meta-data/instance-id')
            .then(response => response.text())
            .then(data => document.getElementById('instance-id').textContent = data)
            .catch(() => document.getElementById('instance-id').textContent = 'N/A');
    </script>
</body>
</html>
EOF

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
    "agent": {
        "metrics_collection_interval": 300,
        "run_as_user": "cwagent"
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/ec2/${props.tagConfig.project}-${props.tagConfig.env}",
                        "log_stream_name": "{instance_id}/httpd/access_log"
                    },
                    {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/ec2/${props.tagConfig.project}-${props.tagConfig.env}",
                        "log_stream_name": "{instance_id}/httpd/error_log"
                    }
                ]
            }
        }
    },
    "metrics": {
        "namespace": "AWS/EC2/Custom",
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                ],
                "metrics_collection_interval": 300
            },
            "disk": {
                "measurement": [
                    "used_percent"
                ],
                "metrics_collection_interval": 300,
                "resources": [
                    "*"
                ]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 300
            }
        }
    }
}
EOF

# Start CloudWatch agent
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent

# Configure log rotation for application logs
cat > /etc/logrotate.d/app-logs << 'EOF'
/var/log/httpd/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 apache apache
    postrotate
        systemctl reload httpd
    endscript
}
EOF

echo "EC2 initialization completed" >> /var/log/user-data.log
`
    ).toString('base64');

    // Launch Template
    this.launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: `${props.tagConfig.project}-${props.tagConfig.env}-launch-template`,
      imageId: ami.id,
      instanceType: 't3.micro',
      vpcSecurityGroupIds: [props.securityGroup.id],
      userData: userData,
      iamInstanceProfile: {
        name: props.instanceProfile.name,
      },
      blockDeviceMappings: [
        {
          deviceName: '/dev/xvda',
          ebs: {
            volumeSize: 20,
            volumeType: 'gp3',
            encrypted: 'true',
            deleteOnTermination: 'true',
          },
        },
      ],
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: createTags(props.tagConfig, 'web-server'),
        },
        {
          resourceType: 'volume',
          tags: createTags(props.tagConfig, 'web-server-volume'),
        },
      ],
      tags: createTags(props.tagConfig, 'launch-template'),
    });

    // Auto Scaling Group
    this.autoScalingGroup = new AutoscalingGroup(this, 'asg', {
      name: `${props.tagConfig.project}-${props.tagConfig.env}-asg`,
      vpcZoneIdentifier: props.privateSubnets.map(subnet => subnet.id),
      minSize: 1,
      maxSize: 6,
      desiredCapacity: 1,
      waitForCapacityTimeout: '0s',
      launchTemplate: {
        id: this.launchTemplate.id,
        version: '$Latest',
      },
      instanceRefresh: {
        strategy: 'Rolling',
        preferences: {
          minHealthyPercentage: 0,
          instanceWarmup: '60',
          skipMatching: false,
        },
        triggers: ['tag'],
      },
      defaultCooldown: 60,
      terminationPolicies: ['OldestInstance'],
      tag: [
        {
          key: 'Name',
          value: createTags(props.tagConfig, 'asg').Name,
          propagateAtLaunch: false,
        },
        {
          key: 'Environment',
          value: props.tagConfig.env,
          propagateAtLaunch: true,
        },
        {
          key: 'Project',
          value: props.tagConfig.project,
          propagateAtLaunch: true,
        },
        {
          key: 'ManagedBy',
          value: 'terraform',
          propagateAtLaunch: true,
        },
      ],
    });
  }
}

/**
 * ALB Module - Creates Application Load Balancer with target group and health checks
 */
export interface ALBModuleProps {
  vpc: Vpc;
  publicSubnets: Subnet[];
  securityGroup: SecurityGroup;
  autoScalingGroup: AutoscalingGroup;
  tagConfig: TagConfig;
}

export class ALBModule extends Construct {
  public readonly alb: Alb;
  public readonly targetGroup: AlbTargetGroup;

  constructor(scope: Construct, id: string, props: ALBModuleProps) {
    super(scope, id);

    // Application Load Balancer
    this.alb = new Alb(this, 'alb', {
      name: `${props.tagConfig.project}-${props.tagConfig.env}-alb`,
      loadBalancerType: 'application',
      subnets: props.publicSubnets.map(subnet => subnet.id),
      securityGroups: [props.securityGroup.id],
      enableDeletionProtection: false,
      enableHttp2: true,
      idleTimeout: 60,
      tags: createTags(props.tagConfig, 'application-load-balancer'),
    });

    // Target Group
    this.targetGroup = new AlbTargetGroup(this, 'target-group', {
      name: `${props.tagConfig.project}-${props.tagConfig.env}-tg`,
      port: 80,
      protocol: 'HTTP',
      vpcId: props.vpc.id,
      targetType: 'instance',
      tags: createTags(props.tagConfig, 'target-group'),
    });

    // ALB Listener
    new AlbListener(this, 'alb-listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
      tags: createTags(props.tagConfig, 'alb-listener'),
    });

    // Attach Auto Scaling Group to Target Group using AutoscalingAttachment
    new AutoscalingAttachment(this, 'asg-attachment', {
      autoscalingGroupName: props.autoScalingGroup.name,
      lbTargetGroupArn: this.targetGroup.arn,
    });
  }
}

/**
 * CloudWatch Module - Creates monitoring and alarms for EC2 and ALB
 */
export interface CloudWatchModuleProps {
  autoScalingGroup: AutoscalingGroup;
  alb: Alb;
  targetGroup: AlbTargetGroup;
  tagConfig: TagConfig;
}

export class CloudWatchModule extends Construct {
  public readonly logGroup: CloudwatchLogGroup;

  constructor(scope: Construct, id: string, props: CloudWatchModuleProps) {
    super(scope, id);

    // CloudWatch Log Group
    this.logGroup = new CloudwatchLogGroup(this, 'app-log-group', {
      name: `/aws/ec2/${props.tagConfig.project}-${props.tagConfig.env}`,
      retentionInDays: 30,
      tags: createTags(props.tagConfig, 'cloudwatch-log-group'),
    });

    // CPU Utilization Alarm for ASG
    new CloudwatchMetricAlarm(this, 'high-cpu-alarm', {
      alarmName: `${props.tagConfig.project}-${props.tagConfig.env}-high-cpu`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'This metric monitors EC2 CPU utilization',
      dimensions: {
        AutoScalingGroupName: props.autoScalingGroup.name,
      },
      tags: createTags(props.tagConfig, 'high-cpu-alarm'),
    });

    // Low CPU Alarm for scaling down
    new CloudwatchMetricAlarm(this, 'low-cpu-alarm', {
      alarmName: `${props.tagConfig.project}-${props.tagConfig.env}-low-cpu`,
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: 10,
      alarmDescription: 'This metric monitors low EC2 CPU utilization',
      dimensions: {
        AutoScalingGroupName: props.autoScalingGroup.name,
      },
      tags: createTags(props.tagConfig, 'low-cpu-alarm'),
    });

    // ALB Target Response Time Alarm
    new CloudwatchMetricAlarm(this, 'alb-response-time-alarm', {
      alarmName: `${props.tagConfig.project}-${props.tagConfig.env}-alb-response-time`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'TargetResponseTime',
      namespace: 'AWS/ApplicationELB',
      period: 300,
      statistic: 'Average',
      threshold: 1,
      alarmDescription: 'This metric monitors ALB target response time',
      dimensions: {
        LoadBalancer: props.alb.arnSuffix,
        TargetGroup: props.targetGroup.arnSuffix,
      },
      tags: createTags(props.tagConfig, 'alb-response-time-alarm'),
    });

    // ALB Unhealthy Host Count Alarm
    new CloudwatchMetricAlarm(this, 'alb-unhealthy-hosts-alarm', {
      alarmName: `${props.tagConfig.project}-${props.tagConfig.env}-unhealthy-hosts`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'UnHealthyHostCount',
      namespace: 'AWS/ApplicationELB',
      period: 300,
      statistic: 'Average',
      threshold: 0,
      alarmDescription: 'This metric monitors unhealthy host count',
      dimensions: {
        TargetGroup: props.targetGroup.arnSuffix,
        LoadBalancer: props.alb.arnSuffix,
      },
      tags: createTags(props.tagConfig, 'unhealthy-hosts-alarm'),
    });
  }
}

/**
 * EBS Snapshot Module - Creates automated EBS snapshots using Data Lifecycle Manager
 */
export interface EBSSnapshotModuleProps {
  tagConfig: TagConfig;
}

export class EBSSnapshotModule extends Construct {
  public readonly lifecyclePolicy: DlmLifecyclePolicy;

  constructor(scope: Construct, id: string, props: EBSSnapshotModuleProps) {
    super(scope, id);

    // IAM role for Data Lifecycle Manager
    const dlmRole = new IamRole(this, 'dlm-role', {
      name: `${props.tagConfig.project}-${props.tagConfig.env}-dlm-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'dlm.amazonaws.com',
            },
          },
        ],
      }),
      tags: createTags(props.tagConfig, 'dlm-role'),
    });

    // Attach DLM service role policy
    new IamRolePolicyAttachment(this, 'dlm-policy-attachment', {
      role: dlmRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSDataLifecycleManagerServiceRole',
    });

    // Data Lifecycle Manager Policy for EBS snapshots
    this.lifecyclePolicy = new DlmLifecyclePolicy(this, 'ebs-snapshot-policy', {
      description: `EBS snapshot lifecycle policy for ${props.tagConfig.project}-${props.tagConfig.env}`,
      executionRoleArn: dlmRole.arn,
      state: 'ENABLED',
      policyDetails: {
        resourceTypes: ['VOLUME'],
        schedule: [
          {
            name: 'daily-snapshots',
            createRule: {
              interval: 24,
              intervalUnit: 'HOURS',
              times: ['03:00'], // 3 AM UTC
            },
            retainRule: {
              count: 7, // Keep 7 daily snapshots
            },
            copyTags: true,
            tagsToAdd: createTags(props.tagConfig, 'automated-snapshot'),
          },
        ],
        targetTags: {
          Environment: props.tagConfig.env,
          Project: props.tagConfig.project,
        },
      },
      tags: createTags(props.tagConfig, 'ebs-lifecycle-policy'),
    });
  }
}
