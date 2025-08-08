I'll create a comprehensive CDKTF configuration that meets all your requirements. Here's the complete modular infrastructure setup:

## Project Structure

```
├── main.ts
├── constructs/
│   ├── networking-construct.ts
│   ├── security-construct.ts
│   ├── iam-construct.ts
│   ├── storage-construct.ts
│   ├── compute-construct.ts
│   └── monitoring-construct.ts
└── types/
    └── common.ts
```

## 1. Common Types (`types/common.ts`)

```typescript
export interface CommonTags {
  Project: string;
  Environment: string;
  Owner: string;
}

export interface BaseConstructProps {
  tags: CommonTags;
  region: string;
}

export interface AllowedIpRange {
  cidr: string;
  description: string;
}
```

## 2. Networking Construct (`constructs/networking-construct.ts`)

```typescript
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { BaseConstructProps } from '../types/common';

export interface NetworkingConstructProps extends BaseConstructProps {
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly natGateway: NatGateway;
  public readonly internetGateway: InternetGateway;

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    // Get available AZs
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...props.tags,
        Name: `${props.tags.Project}-vpc`,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: `${props.tags.Project}-igw`,
      },
    });

    // Create Public Subnets
    this.publicSubnets = props.publicSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${azs.fqn}.names[${index}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          ...props.tags,
          Name: `${props.tags.Project}-public-subnet-${index + 1}`,
          Type: 'Public',
        },
      });
    });

    // Create Private Subnets
    this.privateSubnets = props.privateSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${azs.fqn}.names[${index}]}`,
        tags: {
          ...props.tags,
          Name: `${props.tags.Project}-private-subnet-${index + 1}`,
          Type: 'Private',
        },
      });
    });

    // Create EIP for NAT Gateway
    const natEip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        ...props.tags,
        Name: `${props.tags.Project}-nat-eip`,
      },
    });

    // Create NAT Gateway (in first public subnet)
    this.natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        ...props.tags,
        Name: `${props.tags.Project}-nat-gateway`,
      },
    });

    // Create Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: `${props.tags.Project}-public-rt`,
      },
    });

    // Create route to Internet Gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create Private Route Table
    const privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: `${props.tags.Project}-private-rt`,
      },
    });

    // Create route to NAT Gateway
    new Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    });

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `private-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });
  }
}
```

## 3. Security Construct (`constructs/security-construct.ts`)

```typescript
import { Construct } from 'constructs';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { BaseConstructProps, AllowedIpRange } from '../types/common';

export interface SecurityConstructProps extends BaseConstructProps {
  vpcId: string;
  allowedIpRanges: AllowedIpRange[];
}

export class SecurityConstruct extends Construct {
  public readonly webSecurityGroup: SecurityGroup;
  public readonly sshSecurityGroup: SecurityGroup;
  public readonly databaseSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    // Web Security Group (HTTP/HTTPS)
    this.webSecurityGroup = new SecurityGroup(this, 'web-sg', {
      name: `${props.tags.Project}-web-sg`,
      description: 'Security group for web servers',
      vpcId: props.vpcId,
      tags: {
        ...props.tags,
        Name: `${props.tags.Project}-web-sg`,
      },
    });

    // SSH Security Group
    this.sshSecurityGroup = new SecurityGroup(this, 'ssh-sg', {
      name: `${props.tags.Project}-ssh-sg`,
      description: 'Security group for SSH access',
      vpcId: props.vpcId,
      tags: {
        ...props.tags,
        Name: `${props.tags.Project}-ssh-sg`,
      },
    });

    // Database Security Group
    this.databaseSecurityGroup = new SecurityGroup(this, 'db-sg', {
      name: `${props.tags.Project}-db-sg`,
      description: 'Security group for database servers',
      vpcId: props.vpcId,
      tags: {
        ...props.tags,
        Name: `${props.tags.Project}-db-sg`,
      },
    });

    // Create rules for allowed IP ranges
    props.allowedIpRanges.forEach((ipRange, index) => {
      // HTTP access
      new SecurityGroupRule(this, `web-http-rule-${index}`, {
        type: 'ingress',
        fromPort: 80,
        toPort: 80,
        protocol: 'tcp',
        cidrBlocks: [ipRange.cidr],
        securityGroupId: this.webSecurityGroup.id,
        description: `HTTP access from ${ipRange.description}`,
      });

      // HTTPS access
      new SecurityGroupRule(this, `web-https-rule-${index}`, {
        type: 'ingress',
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        cidrBlocks: [ipRange.cidr],
        securityGroupId: this.webSecurityGroup.id,
        description: `HTTPS access from ${ipRange.description}`,
      });

      // SSH access
      new SecurityGroupRule(this, `ssh-rule-${index}`, {
        type: 'ingress',
        fromPort: 22,
        toPort: 22,
        protocol: 'tcp',
        cidrBlocks: [ipRange.cidr],
        securityGroupId: this.sshSecurityGroup.id,
        description: `SSH access from ${ipRange.description}`,
      });
    });

    // Database access from web security group
    new SecurityGroupRule(this, 'db-from-web-rule', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: this.webSecurityGroup.id,
      securityGroupId: this.databaseSecurityGroup.id,
      description: 'MySQL access from web servers',
    });

    // Egress rules (allow all outbound)
    [
      this.webSecurityGroup,
      this.sshSecurityGroup,
      this.databaseSecurityGroup,
    ].forEach((sg, index) => {
      new SecurityGroupRule(this, `egress-rule-${index}`, {
        type: 'egress',
        fromPort: 0,
        toPort: 65535,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
        securityGroupId: sg.id,
        description: 'All outbound traffic',
      });
    });
  }
}
```

## 4. IAM Construct (`constructs/iam-construct.ts`)

```typescript
import { Construct } from 'constructs';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { BaseConstructProps } from '../types/common';

export interface IamConstructProps extends BaseConstructProps {
  s3BucketArns: string[];
}

export class IamConstruct extends Construct {
  public readonly ec2Role: IamRole;
  public readonly ec2InstanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, props: IamConstructProps) {
    super(scope, id);

    // EC2 Instance Role
    this.ec2Role = new IamRole(this, 'ec2-role', {
      name: `${props.tags.Project}-ec2-role`,
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
      tags: props.tags,
    });

    // Custom S3 Policy
    const s3Policy = new IamPolicy(this, 's3-policy', {
      name: `${props.tags.Project}-s3-policy`,
      description: 'Policy for S3 access',
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
            ],
            Resource: [
              ...props.s3BucketArns,
              ...props.s3BucketArns.map(arn => `${arn}/*`),
            ],
          },
        ],
      }),
      tags: props.tags,
    });

    // CloudWatch Logs Policy
    const cloudWatchLogsPolicy = new IamPolicy(this, 'cloudwatch-logs-policy', {
      name: `${props.tags.Project}-cloudwatch-logs-policy`,
      description: 'Policy for CloudWatch Logs access',
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
            Resource: `arn:aws:logs:${props.region}:*:*`,
          },
        ],
      }),
      tags: props.tags,
    });

    // CloudWatch Metrics Policy
    const cloudWatchMetricsPolicy = new IamPolicy(
      this,
      'cloudwatch-metrics-policy',
      {
        name: `${props.tags.Project}-cloudwatch-metrics-policy`,
        description: 'Policy for CloudWatch Metrics access',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'cloudwatch:PutMetricData',
                'cloudwatch:GetMetricStatistics',
                'cloudwatch:ListMetrics',
              ],
              Resource: '*',
            },
          ],
        }),
        tags: props.tags,
      }
    );

    // Attach policies to role
    new IamRolePolicyAttachment(this, 's3-policy-attachment', {
      role: this.ec2Role.name,
      policyArn: s3Policy.arn,
    });

    new IamRolePolicyAttachment(this, 'cloudwatch-logs-policy-attachment', {
      role: this.ec2Role.name,
      policyArn: cloudWatchLogsPolicy.arn,
    });

    new IamRolePolicyAttachment(this, 'cloudwatch-metrics-policy-attachment', {
      role: this.ec2Role.name,
      policyArn: cloudWatchMetricsPolicy.arn,
    });

    // Attach AWS managed policies
    new IamRolePolicyAttachment(this, 'ssm-managed-instance-core', {
      role: this.ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    // Create Instance Profile
    this.ec2InstanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${props.tags.Project}-ec2-instance-profile`,
        role: this.ec2Role.name,
        tags: props.tags,
      }
    );
  }
}
```

## 5. Storage Construct (`constructs/storage-construct.ts`)

```typescript
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioning } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { BaseConstructProps } from '../types/common';

export interface StorageConstructProps extends BaseConstructProps {
  bucketNames: string[];
}

export class StorageConstruct extends Construct {
  public readonly buckets: S3Bucket[];
  public readonly kmsKey: KmsKey;
  public readonly bucketArns: string[];

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    // Create KMS Key for S3 encryption
    this.kmsKey = new KmsKey(this, 's3-kms-key', {
      description: `KMS key for ${props.tags.Project} S3 buckets`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: '*',
            },
            Action: 'kms:*',
            Resource: '*',
          },
        ],
      }),
      tags: props.tags,
    });

    // Create KMS Alias
    new KmsAlias(this, 's3-kms-alias', {
      name: `alias/${props.tags.Project}-s3-key`,
      targetKeyId: this.kmsKey.keyId,
    });

    // Create S3 Buckets
    this.buckets = props.bucketNames.map((bucketName, index) => {
      const bucket = new S3Bucket(this, `bucket-${index}`, {
        bucket: `${props.tags.Project.toLowerCase()}-${bucketName}-${props.tags.Environment.toLowerCase()}`,
        tags: {
          ...props.tags,
          Name: `${props.tags.Project}-${bucketName}`,
        },
      });

      // Enable versioning
      new S3BucketVersioning(this, `bucket-versioning-${index}`, {
        bucket: bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      });

      // Configure server-side encryption
      new S3BucketServerSideEncryptionConfiguration(
        this,
        `bucket-encryption-${index}`,
        {
          bucket: bucket.id,
          rule: [
            {
              applyServerSideEncryptionByDefault: {
                kmsKeyId: this.kmsKey.arn,
                sseAlgorithm: 'aws:kms',
              },
              bucketKeyEnabled: true,
            },
          ],
        }
      );

      // Configure lifecycle policy
      new S3BucketLifecycleConfiguration(this, `bucket-lifecycle-${index}`, {
        bucket: bucket.id,
        rule: [
          {
            id: 'transition-to-glacier',
            status: 'Enabled',
            transition: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
            noncurrentVersionTransition: [
              {
                noncurrentDays: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                noncurrentDays: 90,
                storageClass: 'GLACIER',
              },
            ],
            noncurrentVersionExpiration: {
              noncurrentDays: 365,
            },
          },
        ],
      });

      // Block public access
      new S3BucketPublicAccessBlock(
        this,
        `bucket-public-access-block-${index}`,
        {
          bucket: bucket.id,
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        }
      );

      return bucket;
    });

    this.bucketArns = this.buckets.map(bucket => bucket.arn);
  }
}
```

## 6. Compute Construct (`constructs/compute-construct.ts`)

```typescript
import { Construct } from 'constructs';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { AutoscalingPolicy } from '@cdktf/provider-aws/lib/autoscaling-policy';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { BaseConstructProps } from '../types/common';

export interface ComputeConstructProps extends BaseConstructProps {
  subnetIds: string[];
  securityGroupIds: string[];
  iamInstanceProfile: string;
  instanceType?: string;
  minSize?: number;
  maxSize?: number;
  desiredCapacity?: number;
}

export class ComputeConstruct extends Construct {
  public readonly launchTemplate: LaunchTemplate;
  public readonly autoScalingGroup: AutoscalingGroup;
  public readonly scaleUpPolicy: AutoscalingPolicy;
  public readonly scaleDownPolicy: AutoscalingPolicy;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
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

    // User data script for CloudWatch agent
    const userData = `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "cwagent"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "${props.tags.Project}-system-logs",
            "log_stream_name": "{instance_id}/messages"
          },
          {
            "file_path": "/var/log/secure",
            "log_group_name": "${props.tags.Project}-security-logs",
            "log_stream_name": "{instance_id}/secure"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "${props.tags.Project}/EC2",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          "cpu_usage_idle",
          "cpu_usage_iowait",
          "cpu_usage_user",
          "cpu_usage_system"
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          "used_percent"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "diskio": {
        "measurement": [
          "io_time"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          "mem_used_percent"
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\
  -a fetch-config \\
  -m ec2 \\
  -s \\
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Install and start a simple web server for testing
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from \$(hostname -f)</h1>" > /var/www/html/index.html
`;

    // Create Launch Template
    this.launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: `${props.tags.Project}-launch-template`,
      imageId: ami.id,
      instanceType: props.instanceType || 't3.micro',
      keyName: undefined, // Use SSM Session Manager instead
      vpcSecurityGroupIds: props.securityGroupIds,
      userData: Buffer.from(userData).toString('base64'),
      iamInstanceProfile: {
        name: props.iamInstanceProfile,
      },
      blockDeviceMapping: [
        {
          deviceName: '/dev/xvda',
          ebs: {
            volumeSize: 20,
            volumeType: 'gp3',
            encrypted: true,
            deleteOnTermination: true,
          },
        },
      ],
      monitoring: {
        enabled: true,
      },
      tagSpecification: [
        {
          resourceType: 'instance',
          tags: {
            ...props.tags,
            Name: `${props.tags.Project}-instance`,
          },
        },
        {
          resourceType: 'volume',
          tags: {
            ...props.tags,
            Name: `${props.tags.Project}-volume`,
          },
        },
      ],
    });

    // Create Auto Scaling Group
    this.autoScalingGroup = new AutoscalingGroup(this, 'asg', {
      name: `${props.tags.Project}-asg`,
      vpcZoneIdentifier: props.subnetIds,
      launchTemplate: {
        id: this.launchTemplate.id,
        version: '$Latest',
      },
      minSize: props.minSize || 1,
      maxSize: props.maxSize || 6,
      desiredCapacity: props.desiredCapacity || 2,
      healthCheckType: 'EC2',
      healthCheckGracePeriod: 300,
      defaultCooldown: 300,
      tag: [
        {
          key: 'Name',
          value: `${props.tags.Project}-asg-instance`,
          propagateAtLaunch: true,
        },
        ...Object.entries(props.tags).map(([key, value]) => ({
          key,
          value,
          propagateAtLaunch: true,
        })),
      ],
    });

    // Scale Up Policy
    this.scaleUpPolicy = new AutoscalingPolicy(this, 'scale-up-policy', {
      name: `${props.tags.Project}-scale-up-policy`,
      scalingAdjustment: 1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: this.autoScalingGroup.name,
      policyType: 'SimpleScaling',
    });

    // Scale Down Policy
    this.scaleDownPolicy = new AutoscalingPolicy(this, 'scale-down-policy', {
      name: `${props.tags.Project}-scale-down-policy`,
      scalingAdjustment: -1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: this.autoScalingGroup.name,
      policyType: 'SimpleScaling',
    });
  }
}
```

## 7. Monitoring Construct (`constructs/monitoring-construct.ts`)

```typescript
import { Construct } from "constructs";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { CloudwatchMetricAlarm } from "@cdktf/provider-aws/lib/cloudwatch-metric-alarm";
import { CloudwatchDashboard } from "@cdktf/provider-aws/lib/cloudwatch-dashboard";
import { BaseConstructProps } from "../types/common";

export interface MonitoringConstructProps extends BaseConstructProps {
  autoScalingGroupName: string;
  scaleUpPolicyArn: string;
  scaleDownPolicyArn: string;
}

export class MonitoringConstruct extends Construct {
  public readonly systemLogGroup: CloudwatchLogGroup;
  public readonly securityLogGroup: CloudwatchLogGroup;
  public readonly cpuHighAlarm: CloudwatchMetricAlarm;
  public readonly cpuLowAlarm: CloudwatchMetricAlarm;
  public readonly dashboard: CloudwatchDashboard;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    // Create Log Groups
    this.systemLogGroup = new CloudwatchLogGroup(this, "system-log-group", {
      name: `${props.tags.Project}-system-logs`,
      retentionInDays: 30,
      tags: props.tags,
    });

    this.securityLogGroup = new CloudwatchLogGroup(this, "security-log-group", {
      name: `${props.tags.Project}-security-logs`,
      retentionInDays: 90,
      tags: props.tags,
    });

    // CPU High Alarm (Scale Up)
    this.cpuHighAlarm = new CloudwatchMetricAlarm(this, "cpu-high-alarm", {
      alarmName: `${props.tags.Project}-cpu-high`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      period: 300,
      statistic: "Average",
      threshold: 70,
      alarmDescription: "This metric monitors ec2 cpu utilization",
      dimensions: {
        AutoScalingGroupName: props.autoScalingGroupName,
      },
      alarmActions: [props.scaleUpPolicyArn],
      tags: props.tags,
    });

    // CPU Low Alarm (Scale Down)
    this.cpuLowAlarm = new CloudwatchMetricAlarm(this, "cpu-low-alarm", {
      alarmName: `${props.tags.Project}-cpu-low`,
      comparisonOperator: "LessThanThreshold",
      evaluationPeriods: 2,
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      period: 300,
      statistic: "Average",
      threshold: 20,
      alarmDescription: "This metric monitors ec2 cpu utilization for scale down",
      dimensions: {
        AutoScalingGroupName: props.autoScalingGroupName,
      },
```
