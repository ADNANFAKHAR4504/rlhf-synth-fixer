I'll provide you with a production-grade Pulumi TypeScript infrastructure deployment for AWS. This implementation follows AWS best practices for security, scalability, and monitoring.

## Infrastructure Code

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Configuration
const config = new pulumi.Config();
const minCapacity = config.getNumber('minCapacity') || 2;
const maxCapacity = config.getNumber('maxCapacity') || 10;
const desiredCapacity = config.getNumber('desiredCapacity') || 3;
const dbUsername = config.require('dbUsername');
const dbPassword = config.requireSecret('dbPassword');

// AWS Provider with explicit region
const provider = new aws.Provider('aws-provider', {
  region: 'ap-south-1',
});

// Get availability zones
const availabilityZones = aws.getAvailabilityZones(
  {
    state: 'available',
  },
  { provider }
);

// Get latest Amazon Linux 2 AMI
const amazonLinuxAmi = aws.ec2.getAmi(
  {
    mostRecent: true,
    owners: ['amazon'],
    filters: [
      { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
      { name: 'virtualization-type', values: ['hvm'] },
    ],
  },
  { provider }
);

// VPC and Networking
const vpc = new aws.ec2.Vpc(
  'main-vpc',
  {
    cidrBlock: '10.0.0.0/16',
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      Name: 'main-vpc',
      Environment: 'production',
    },
  },
  { provider }
);

// Internet Gateway
const igw = new aws.ec2.InternetGateway(
  'main-igw',
  {
    vpcId: vpc.id,
    tags: {
      Name: 'main-igw',
    },
  },
  { provider }
);

// Public Subnets for ALB and EC2
const publicSubnets = availabilityZones.then(azs =>
  azs.names.slice(0, 2).map(
    (az, index) =>
      new aws.ec2.Subnet(
        `public-subnet-${index + 1}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${index + 1}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `public-subnet-${index + 1}`,
            Type: 'public',
          },
        },
        { provider }
      )
  )
);

// Private Subnets for RDS
const privateSubnets = availabilityZones.then(azs =>
  azs.names.slice(0, 2).map(
    (az, index) =>
      new aws.ec2.Subnet(
        `private-subnet-${index + 1}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${index + 10}.0/24`,
          availabilityZone: az,
          tags: {
            Name: `private-subnet-${index + 1}`,
            Type: 'private',
          },
        },
        { provider }
      )
  )
);

// NAT Gateway for private subnet internet access
const natEip = new aws.ec2.Eip(
  'nat-eip',
  {
    domain: 'vpc',
    tags: {
      Name: 'nat-eip',
    },
  },
  { provider }
);

const natGateway = new aws.ec2.NatGateway(
  'nat-gateway',
  {
    allocationId: natEip.id,
    subnetId: publicSubnets.then(subnets => subnets[0].id),
    tags: {
      Name: 'nat-gateway',
    },
  },
  { provider }
);

// Route Tables
const publicRouteTable = new aws.ec2.RouteTable(
  'public-rt',
  {
    vpcId: vpc.id,
    routes: [
      {
        cidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
    ],
    tags: {
      Name: 'public-rt',
    },
  },
  { provider }
);

const privateRouteTable = new aws.ec2.RouteTable(
  'private-rt',
  {
    vpcId: vpc.id,
    routes: [
      {
        cidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      },
    ],
    tags: {
      Name: 'private-rt',
    },
  },
  { provider }
);

// Route Table Associations
const publicRtAssociations = publicSubnets.then(subnets =>
  subnets.map(
    (subnet, index) =>
      new aws.ec2.RouteTableAssociation(
        `public-rta-${index + 1}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { provider }
      )
  )
);

const privateRtAssociations = privateSubnets.then(subnets =>
  subnets.map(
    (subnet, index) =>
      new aws.ec2.RouteTableAssociation(
        `private-rta-${index + 1}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { provider }
      )
  )
);

// Security Groups
const albSecurityGroup = new aws.ec2.SecurityGroup(
  'alb-sg',
  {
    name: 'alb-security-group',
    description: 'Security group for Application Load Balancer',
    vpcId: vpc.id,
    ingress: [
      {
        description: 'HTTP',
        fromPort: 80,
        toPort: 80,
        protocol: 'tcp',
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        description: 'HTTPS',
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    egress: [
      {
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    tags: {
      Name: 'alb-sg',
    },
  },
  { provider }
);

const ec2SecurityGroup = new aws.ec2.SecurityGroup(
  'ec2-sg',
  {
    name: 'ec2-security-group',
    description: 'Security group for EC2 instances',
    vpcId: vpc.id,
    ingress: [
      {
        description: 'HTTP from ALB',
        fromPort: 80,
        toPort: 80,
        protocol: 'tcp',
        securityGroups: [albSecurityGroup.id],
      },
      {
        description: 'SSH',
        fromPort: 22,
        toPort: 22,
        protocol: 'tcp',
        cidrBlocks: ['10.0.0.0/16'],
      },
    ],
    egress: [
      {
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    tags: {
      Name: 'ec2-sg',
    },
  },
  { provider }
);

const rdsSecurityGroup = new aws.ec2.SecurityGroup(
  'rds-sg',
  {
    name: 'rds-security-group',
    description: 'Security group for RDS database',
    vpcId: vpc.id,
    ingress: [
      {
        description: 'MySQL/Aurora from EC2',
        fromPort: 3306,
        toPort: 3306,
        protocol: 'tcp',
        securityGroups: [ec2SecurityGroup.id],
      },
    ],
    tags: {
      Name: 'rds-sg',
    },
  },
  { provider }
);

// IAM Role for EC2 instances
const ec2Role = new aws.iam.Role(
  'ec2-role',
  {
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
    tags: {
      Name: 'ec2-role',
    },
  },
  { provider }
);

// IAM Policy for CloudWatch Logs
const cloudWatchLogsPolicy = new aws.iam.Policy(
  'cloudwatch-logs-policy',
  {
    description: 'Policy for EC2 instances to write to CloudWatch Logs',
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
          ],
          Resource: 'arn:aws:logs:ap-south-1:*:log-group:/aws/ec2/*',
        },
        {
          Effect: 'Allow',
          Action: ['cloudwatch:PutMetricData'],
          Resource: '*',
        },
      ],
    }),
  },
  { provider }
);

// Attach policy to role
const rolePolicyAttachment = new aws.iam.RolePolicyAttachment(
  'ec2-role-policy-attachment',
  {
    role: ec2Role.name,
    policyArn: cloudWatchLogsPolicy.arn,
  },
  { provider }
);

// Instance Profile
const instanceProfile = new aws.iam.InstanceProfile(
  'ec2-instance-profile',
  {
    role: ec2Role.name,
  },
  { provider }
);

// CloudWatch Log Groups
const ec2LogGroup = new aws.cloudwatch.LogGroup(
  'ec2-log-group',
  {
    name: '/aws/ec2/application',
    retentionInDays: 14,
    tags: {
      Environment: 'production',
    },
  },
  { provider }
);

const albLogGroup = new aws.cloudwatch.LogGroup(
  'alb-log-group',
  {
    name: '/aws/alb/access-logs',
    retentionInDays: 7,
    tags: {
      Environment: 'production',
    },
  },
  { provider }
);

// User Data Script for EC2 instances
const userData = pulumi.interpolate`#!/bin/bash
yum update -y
yum install -y httpd amazon-cloudwatch-agent
systemctl start httpd
systemctl enable httpd

# Simple web page
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Production Web App</title>
</head>
<body>
    <h1>Welcome to Production Web Application</h1>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
</body>
</html>
EOF

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/ec2/application",
                        "log_stream_name": "{instance_id}/httpd/access.log"
                    },
                    {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/ec2/application",
                        "log_stream_name": "{instance_id}/httpd/error.log"
                    }
                ]
            }
        }
    },
    "metrics": {
        "namespace": "CustomApp/EC2",
        "metrics_collected": {
            "cpu": {
                "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": ["used_percent"],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            },
            "mem": {
                "measurement": ["mem_used_percent"],
                "metrics_collection_interval": 60
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
`;

// Launch Template
const launchTemplate = new aws.ec2.LaunchTemplate(
  'app-launch-template',
  {
    name: 'app-launch-template',
    imageId: amazonLinuxAmi.then(ami => ami.id),
    instanceType: 't3.micro',
    keyName: 'your-key-pair', // Replace with your key pair name
    vpcSecurityGroupIds: [ec2SecurityGroup.id],
    iamInstanceProfile: {
      name: instanceProfile.name,
    },
    userData: pulumi
      .output(userData)
      .apply(ud => Buffer.from(ud).toString('base64')),
    tagSpecifications: [
      {
        resourceType: 'instance',
        tags: {
          Name: 'app-server',
          Environment: 'production',
        },
      },
    ],
  },
  { provider }
);

// Application Load Balancer
const alb = new aws.lb.LoadBalancer(
  'app-alb',
  {
    name: 'app-alb',
    loadBalancerType: 'application',
    scheme: 'internet-facing',
    securityGroups: [albSecurityGroup.id],
    subnets: publicSubnets.then(subnets => subnets.map(subnet => subnet.id)),
    enableDeletionProtection: false,
    accessLogs: {
      bucket: 'your-alb-logs-bucket', // Replace with your S3 bucket for ALB logs
      enabled: true,
      prefix: 'alb-logs',
    },
    tags: {
      Name: 'app-alb',
      Environment: 'production',
    },
  },
  { provider }
);

// Target Group
const targetGroup = new aws.lb.TargetGroup(
  'app-target-group',
  {
    name: 'app-target-group',
    port: 80,
    protocol: 'HTTP',
    vpcId: vpc.id,
    targetType: 'instance',
    healthCheck: {
      enabled: true,
      healthyThreshold: 2,
      unhealthyThreshold: 2,
      timeout: 5,
      interval: 30,
      path: '/',
      matcher: '200',
      port: 'traffic-port',
      protocol: 'HTTP',
    },
    tags: {
      Name: 'app-target-group',
    },
  },
  { provider }
);

// ALB Listener
const albListener = new aws.lb.Listener(
  'app-alb-listener',
  {
    loadBalancerArn: alb.arn,
    port: '80',
    protocol: 'HTTP',
    defaultActions: [
      {
        type: 'forward',
        targetGroupArn: targetGroup.arn,
      },
    ],
  },
  { provider }
);

// Auto Scaling Group
const autoScalingGroup = new aws.autoscaling.Group(
  'app-asg',
  {
    name: 'app-asg',
    vpcZoneIdentifiers: publicSubnets.then(subnets =>
      subnets.map(subnet => subnet.id)
    ),
    targetGroupArns: [targetGroup.arn],
    healthCheckType: 'ELB',
    healthCheckGracePeriod: 300,
    launchTemplate: {
      id: launchTemplate.id,
      version: '$Latest',
    },
    minSize: minCapacity,
    maxSize: maxCapacity,
    desiredCapacity: desiredCapacity,
    tags: [
      {
        key: 'Name',
        value: 'app-asg-instance',
        propagateAtLaunch: true,
      },
      {
        key: 'Environment',
        value: 'production',
        propagateAtLaunch: true,
      },
    ],
  },
  { provider }
);

// Auto Scaling Policies
const scaleUpPolicy = new aws.autoscaling.Policy(
  'scale-up-policy',
  {
    name: 'scale-up-policy',
    scalingAdjustment: 1,
    adjustmentType: 'ChangeInCapacity',
    cooldown: 300,
    autoscalingGroupName: autoScalingGroup.name,
    policyType: 'SimpleScaling',
  },
  { provider }
);

const scaleDownPolicy = new aws.autoscaling.Policy(
  'scale-down-policy',
  {
    name: 'scale-down-policy',
    scalingAdjustment: -1,
    adjustmentType: 'ChangeInCapacity',
    cooldown: 300,
    autoscalingGroupName: autoScalingGroup.name,
    policyType: 'SimpleScaling',
  },
  { provider }
);

// CloudWatch Alarms
const cpuHighAlarm = new aws.cloudwatch.MetricAlarm(
  'cpu-high-alarm',
  {
    name: 'cpu-high-alarm',
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: '2',
    metricName: 'CPUUtilization',
    namespace: 'AWS/EC2',
    period: '120',
    statistic: 'Average',
    threshold: '80',
    alarmDescription: 'This metric monitors ec2 cpu utilization',
    dimensions: {
      AutoScalingGroupName: autoScalingGroup.name,
    },
    alarmActions: [scaleUpPolicy.arn],
  },
  { provider }
);

const cpuLowAlarm = new aws.cloudwatch.MetricAlarm(
  'cpu-low-alarm',
  {
    name: 'cpu-low-alarm',
    comparisonOperator: 'LessThanThreshold',
    evaluationPeriods: '2',
    metricName: 'CPUUtilization',
    namespace: 'AWS/EC2',
    period: '120',
    statistic: 'Average',
    threshold: '10',
    alarmDescription: 'This metric monitors ec2 cpu utilization',
    dimensions: {
      AutoScalingGroupName: autoScalingGroup.name,
    },
    alarmActions: [scaleDownPolicy.arn],
  },
  { provider }
);

// RDS Subnet Group
const rdsSubnetGroup = new aws.rds.SubnetGroup(
  'rds-subnet-group',
  {
    name: 'rds-subnet-group',
    subnetIds: privateSubnets.then(subnets => subnets.map(subnet => subnet.id)),
    tags: {
      Name: 'rds-subnet-group',
    },
  },
  { provider }
);

// RDS Instance
const rdsInstance = new aws.rds.Instance(
  'app-database',
  {
    identifier: 'app-database',
    allocatedStorage: 20,
    maxAllocatedStorage: 100,
    storageType: 'gp2',
    storageEncrypted: true,
    engine: 'mysql',
    engineVersion: '8.0',
    instanceClass: 'db.t3.micro',
    dbName: 'appdb',
    username: dbUsername,
    password: dbPassword,
    vpcSecurityGroupIds: [rdsSecurityGroup.id],
    dbSubnetGroupName: rdsSubnetGroup.name,
    backupRetentionPeriod: 7,
    backupWindow: '03:00-04:00',
    maintenanceWindow: 'sun:04:00-sun:05:00',
    multiAz: true,
    skipFinalSnapshot: false,
    finalSnapshotIdentifier: 'app-database-final-snapshot',
    deletionProtection: true,
    enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
    tags: {
      Name: 'app-database',
      Environment: 'production',
    },
  },
  { provider }
);

// RDS CloudWatch Alarms
const rdsConnectionsAlarm = new aws.cloudwatch.MetricAlarm(
  'rds-connections-alarm',
  {
    name: 'rds-connections-alarm',
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: '2',
    metricName: 'DatabaseConnections',
    namespace: 'AWS/RDS',
    period: '300',
    statistic: 'Average',
    threshold: '15',
    alarmDescription: 'This metric monitors RDS connections',
    dimensions: {
      DBInstanceIdentifier: rdsInstance.id,
    },
  },
  { provider }
);

const rdsCpuAlarm = new aws.cloudwatch.MetricAlarm(
  'rds-cpu-alarm',
  {
    name: 'rds-cpu-alarm',
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: '2',
    metricName: 'CPUUtilization',
    namespace: 'AWS/RDS',
    period: '300',
    statistic: 'Average',
    threshold: '80',
    alarmDescription: 'This metric monitors RDS CPU utilization',
    dimensions: {
      DBInstanceIdentifier: rdsInstance.id,
    },
  },
  { provider }
);

// ALB Health Check Alarm
const albHealthyHostsAlarm = new aws.cloudwatch.MetricAlarm(
  'alb-healthy-hosts-alarm',
  {
    name: 'alb-healthy-hosts-alarm',
    comparisonOperator: 'LessThanThreshold',
    evaluationPeriods: '2',
    metricName: 'HealthyHostCount',
    namespace: 'AWS/ApplicationELB',
    period: '60',
    statistic: 'Average',
    threshold: '1',
    alarmDescription: 'This metric monitors ALB healthy hosts',
    dimensions: {
      TargetGroup: targetGroup.arnSuffix,
      LoadBalancer: alb.arnSuffix,
    },
  },
  { provider }
);

// Outputs
export const albDnsName = alb.dnsName;
export const vpcId = vpc.id;
export const rdsEndpoint = rdsInstance.endpoint;
export const autoScalingGroupName = autoScalingGroup.name;
```

## Configuration File (Pulumi.production.yaml)

```yaml
config:
  aws:region: ap-south-1
  your-project:minCapacity: 2
  your-project:maxCapacity: 10
  your-project:desiredCapacity: 3
  your-project:dbUsername: admin
  your-project:dbPassword:
    secure: your-encrypted-password-here
```

## Key Features Implemented

### 1. **Auto Scaling Group with Launch Template**

- Uses latest Amazon Linux 2 AMI
- Configurable capacity via Pulumi config
- Health checks integrated with ALB
- Auto scaling policies based on CPU utilization

### 2. **Application Load Balancer**

- Internet-facing ALB in public subnets
- Target group with health checks
- Security group allowing HTTP/HTTPS traffic

### 3. **RDS Multi-AZ Database**

- MySQL 8.0 with encryption at rest
- Multi-AZ deployment for high availability
- Automated backups with 7-day retention
- CloudWatch logs export enabled

### 4. **CloudWatch Integration**

- Log groups for EC2 and ALB
- Metric alarms for CPU, connections, and health
- Custom metrics from CloudWatch agent

### 5. **IAM Security**

- Least privilege EC2 role
- Specific resource ARNs where possible
- Instance profile for EC2 instances

### 6. **Network Security**

- VPC with public and private subnets
- Security groups with minimal required access
- NAT Gateway for private subnet internet access
- ALB in public, RDS in private subnets

### 7. **Production Best Practices**

- Explicit AWS provider with region
- Resource tagging for organization
- Deletion protection on critical resources
- Encrypted storage and secure networking

## Deployment Instructions

1. **Install Dependencies**:

   ```bash
   npm install @pulumi/pulumi @pulumi/aws
   ```

2. **Configure Pulumi**:

   ```bash
   pulumi config set aws:region ap-south-1
   pulumi config set minCapacity 2
   pulumi config set maxCapacity 10
   pulumi config set desiredCapacity 3
   pulumi config set dbUsername admin
   pulumi config set --secret dbPassword your-secure-password
   ```

3. **Deploy**:

   ```bash
   pulumi up
   ```

4. **Access Application**:
   Use the exported ALB DNS name to access your application.

This infrastructure provides a robust, scalable, and secure foundation for a production web application with proper monitoring, logging, and security controls in place.
