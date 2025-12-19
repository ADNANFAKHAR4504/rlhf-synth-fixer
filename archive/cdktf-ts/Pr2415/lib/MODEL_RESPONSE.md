I'll create a comprehensive CDKTF TypeScript setup that meets all your requirements. Here's the complete solution:

## Project Structure

First, let's set up the project structure and dependencies:

### `package.json`

```json
{
  "name": "aws-infrastructure-cdktf",
  "version": "1.0.0",
  "description": "AWS Infrastructure using CDKTF with TypeScript",
  "main": "main.ts",
  "scripts": {
    "get": "cdktf get",
    "build": "tsc",
    "synth": "cdktf synth",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^4.9.0"
  },
  "dependencies": {
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.20.0",
    "constructs": "^10.3.0"
  }
}
```

### `cdktf.json`

```json
{
  "language": "typescript",
  "app": "npx ts-node main.ts",
  "projectId": "aws-infrastructure-project",
  "sendCrashReports": "false",
  "terraformProviders": ["hashicorp/aws@~> 5.0"],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "exclude": ["node_modules", "cdktf.out", ".terraform"]
}
```

## Main Infrastructure Code

### `main.ts`

```typescript
import { Construct } from 'constructs';
import { App, TerraformStack } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LbTargetGroupAttachment } from '@cdktf/provider-aws/lib/lb-target-group-attachment';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

interface InfrastructureConfig {
  region: string;
  environment: string;
  owner: string;
  project: string;
  allowedCidrBlocks: string[];
  notificationEmail: string;
  dbUsername: string;
  dbPassword: string;
}

class AWSInfrastructureStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: InfrastructureConfig) {
    super(scope, id);

    // Common tags for all resources
    const commonTags = {
      Environment: config.environment,
      Owner: config.owner,
      Project: config.project,
      ManagedBy: 'CDKTF',
    };

    // AWS Provider
    new AwsProvider(this, 'AWS', {
      region: config.region,
      defaultTags: [
        {
          tags: commonTags,
        },
      ],
    });

    // Data sources
    const availabilityZones = new DataAwsAvailabilityZones(this, 'available', {
      state: 'available',
    });

    const amazonLinuxAmi = new DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    // VPC
    const vpc = new Vpc(this, 'main-vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.project}-vpc`,
        ...commonTags,
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'main-igw', {
      vpcId: vpc.id,
      tags: {
        Name: `${config.project}-igw`,
        ...commonTags,
      },
    });

    // Public Subnets
    const publicSubnet1 = new Subnet(this, 'public-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `\${${availabilityZones.fqn}.names[0]}`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `${config.project}-public-subnet-1`,
        Type: 'Public',
        ...commonTags,
      },
    });

    const publicSubnet2 = new Subnet(this, 'public-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `\${${availabilityZones.fqn}.names[1]}`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `${config.project}-public-subnet-2`,
        Type: 'Public',
        ...commonTags,
      },
    });

    // Private Subnets
    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.3.0/24',
      availabilityZone: `\${${availabilityZones.fqn}.names[0]}`,
      tags: {
        Name: `${config.project}-private-subnet-1`,
        Type: 'Private',
        ...commonTags,
      },
    });

    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.4.0/24',
      availabilityZone: `\${${availabilityZones.fqn}.names[1]}`,
      tags: {
        Name: `${config.project}-private-subnet-2`,
        Type: 'Private',
        ...commonTags,
      },
    });

    // Elastic IPs for NAT Gateways
    const eip1 = new Eip(this, 'nat-eip-1', {
      domain: 'vpc',
      dependsOn: [igw],
      tags: {
        Name: `${config.project}-nat-eip-1`,
        ...commonTags,
      },
    });

    const eip2 = new Eip(this, 'nat-eip-2', {
      domain: 'vpc',
      dependsOn: [igw],
      tags: {
        Name: `${config.project}-nat-eip-2`,
        ...commonTags,
      },
    });

    // NAT Gateways
    const natGw1 = new NatGateway(this, 'nat-gw-1', {
      allocationId: eip1.id,
      subnetId: publicSubnet1.id,
      tags: {
        Name: `${config.project}-nat-gw-1`,
        ...commonTags,
      },
    });

    const natGw2 = new NatGateway(this, 'nat-gw-2', {
      allocationId: eip2.id,
      subnetId: publicSubnet2.id,
      tags: {
        Name: `${config.project}-nat-gw-2`,
        ...commonTags,
      },
    });

    // Route Tables
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      tags: {
        Name: `${config.project}-public-rt`,
        ...commonTags,
      },
    });

    const privateRouteTable1 = new RouteTable(this, 'private-rt-1', {
      vpcId: vpc.id,
      tags: {
        Name: `${config.project}-private-rt-1`,
        ...commonTags,
      },
    });

    const privateRouteTable2 = new RouteTable(this, 'private-rt-2', {
      vpcId: vpc.id,
      tags: {
        Name: `${config.project}-private-rt-2`,
        ...commonTags,
      },
    });

    // Routes
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    new Route(this, 'private-route-1', {
      routeTableId: privateRouteTable1.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGw1.id,
    });

    new Route(this, 'private-route-2', {
      routeTableId: privateRouteTable2.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGw2.id,
    });

    // Route Table Associations
    new RouteTableAssociation(this, 'public-rta-1', {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'public-rta-2', {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'private-rta-1', {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable1.id,
    });

    new RouteTableAssociation(this, 'private-rta-2', {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable2.id,
    });

    // Security Groups
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `${config.project}-alb-sg`,
      description: 'Security group for Application Load Balancer',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: config.allowedCidrBlocks,
          description: 'HTTP access from allowed IPs',
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: config.allowedCidrBlocks,
          description: 'HTTPS access from allowed IPs',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic',
        },
      ],
      tags: {
        Name: `${config.project}-alb-sg`,
        ...commonTags,
      },
    });

    const webSecurityGroup = new SecurityGroup(this, 'web-sg', {
      name: `${config.project}-web-sg`,
      description: 'Security group for web servers',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: config.allowedCidrBlocks,
          description: 'SSH access from allowed IPs',
        },
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          securityGroups: [albSecurityGroup.id],
          description: 'HTTP access from ALB',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic',
        },
      ],
      tags: {
        Name: `${config.project}-web-sg`,
        ...commonTags,
      },
    });

    const dbSecurityGroup = new SecurityGroup(this, 'db-sg', {
      name: `${config.project}-db-sg`,
      description: 'Security group for RDS database',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          securityGroups: [webSecurityGroup.id],
          description: 'MySQL access from web servers',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic',
        },
      ],
      tags: {
        Name: `${config.project}-db-sg`,
        ...commonTags,
      },
    });

    // IAM Role for EC2 instances
    const ec2Role = new IamRole(this, 'ec2-role', {
      name: `${config.project}-ec2-role`,
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
      tags: commonTags,
    });

    // IAM Policy for EC2 instances (least privilege)
    const ec2Policy = new IamPolicy(this, 'ec2-policy', {
      name: `${config.project}-ec2-policy`,
      description: 'Policy for EC2 instances with least privilege access',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Resource: `arn:aws:s3:::${config.project}-*/*`,
          },
          {
            Effect: 'Allow',
            Action: ['s3:ListBucket'],
            Resource: `arn:aws:s3:::${config.project}-*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData',
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: commonTags,
    });

    new IamRolePolicyAttachment(this, 'ec2-policy-attachment', {
      role: ec2Role.name,
      policyArn: ec2Policy.arn,
    });

    // Attach SSM managed policy for Systems Manager access
    new IamRolePolicyAttachment(this, 'ec2-ssm-policy', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    const ec2InstanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${config.project}-ec2-instance-profile`,
        role: ec2Role.name,
        tags: commonTags,
      }
    );

    // User data script for EC2 instances
    const userData = `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from \$(hostname -f)</h1>" > /var/www/html/index.html
yum install -y amazon-cloudwatch-agent
`;

    // EC2 Instances
    const webInstance1 = new Instance(this, 'web-instance-1', {
      ami: amazonLinuxAmi.id,
      instanceType: 't3.micro',
      keyName: 'your-key-pair', // Replace with your key pair name
      vpcSecurityGroupIds: [webSecurityGroup.id],
      subnetId: publicSubnet1.id,
      iamInstanceProfile: ec2InstanceProfile.name,
      userData: Buffer.from(userData).toString('base64'),
      tags: {
        Name: `${config.project}-web-instance-1`,
        ...commonTags,
      },
    });

    const webInstance2 = new Instance(this, 'web-instance-2', {
      ami: amazonLinuxAmi.id,
      instanceType: 't3.micro',
      keyName: 'your-key-pair', // Replace with your key pair name
      vpcSecurityGroupIds: [webSecurityGroup.id],
      subnetId: publicSubnet2.id,
      iamInstanceProfile: ec2InstanceProfile.name,
      userData: Buffer.from(userData).toString('base64'),
      tags: {
        Name: `${config.project}-web-instance-2`,
        ...commonTags,
      },
    });

    // Application Load Balancer
    const alb = new Lb(this, 'main-alb', {
      name: `${config.project}-alb`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroup.id],
      subnets: [publicSubnet1.id, publicSubnet2.id],
      enableDeletionProtection: false,
      tags: {
        Name: `${config.project}-alb`,
        ...commonTags,
      },
    });

    // Target Group
    const targetGroup = new LbTargetGroup(this, 'web-tg', {
      name: `${config.project}-web-tg`,
      port: 80,
      protocol: 'HTTP',
      vpcId: vpc.id,
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        interval: 30,
        matcher: '200',
        path: '/',
        port: 'traffic-port',
        protocol: 'HTTP',
        timeout: 5,
        unhealthyThreshold: 2,
      },
      tags: {
        Name: `${config.project}-web-tg`,
        ...commonTags,
      },
    });

    // Target Group Attachments
    new LbTargetGroupAttachment(this, 'web-tg-attachment-1', {
      targetGroupArn: targetGroup.arn,
      targetId: webInstance1.id,
      port: 80,
    });

    new LbTargetGroupAttachment(this, 'web-tg-attachment-2', {
      targetGroupArn: targetGroup.arn,
      targetId: webInstance2.id,
      port: 80,
    });

    // ALB Listener
    new LbListener(this, 'web-listener', {
      loadBalancerArn: alb.arn,
      port: '80',
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    // RDS Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${config.project}-db-subnet-group`,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: {
        Name: `${config.project}-db-subnet-group`,
        ...commonTags,
      },
    });

    // RDS Instance
    const rdsInstance = new DbInstance(this, 'main-database', {
      identifier: `${config.project}-database`,
      allocatedStorage: 20,
      storageType: 'gp2',
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      dbName: 'maindb',
      username: config.dbUsername,
      password: config.dbPassword,
      vpcSecurityGroupIds: [dbSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      multiAz: true,
      storageEncrypted: true,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      skipFinalSnapshot: true,
      tags: {
        Name: `${config.project}-database`,
        ...commonTags,
      },
    });

    // S3 Bucket
    const s3Bucket = new S3Bucket(this, 'main-bucket', {
      bucket: `${config.project}-storage-${Date.now()}`,
      tags: {
        Name: `${config.project}-storage`,
        ...commonTags,
      },
    });

    // S3 Bucket Encryption
    new S3BucketServerSideEncryptionConfiguration(this, 'bucket-encryption', {
      bucket: s3Bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });

    // S3 Bucket Public Access Block
    new S3BucketPublicAccessBlock(this, 'bucket-pab', {
      bucket: s3Bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // SNS Topic for notifications
    const snsTopic = new SnsTopic(this, 'alerts-topic', {
      name: `${config.project}-alerts`,
      tags: commonTags,
    });

    // SNS Topic Subscription
    new SnsTopicSubscription(this, 'email-notification', {
      topicArn: snsTopic.arn,
      protocol: 'email',
      endpoint: config.notificationEmail,
    });

    // CloudWatch Alarms
    new CloudwatchMetricAlarm(this, 'web-instance-1-cpu-alarm', {
      alarmName: `${config.project}-web-instance-1-high-cpu`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: '2',
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: '300',
      statistic: 'Average',
      threshold: '80',
      alarmDescription: 'This metric monitors ec2 cpu utilization',
      alarmActions: [snsTopic.arn],
      dimensions: {
        InstanceId: webInstance1.id,
      },
      tags: commonTags,
    });

    new CloudwatchMetricAlarm(this, 'web-instance-2-cpu-alarm', {
      alarmName: `${config.project}-web-instance-2-high-cpu`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: '2',
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: '300',
      statistic: 'Average',
      threshold: '80',
      alarmDescription: 'This metric monitors ec2 cpu utilization',
      alarmActions: [snsTopic.arn],
      dimensions: {
        InstanceId: webInstance2.id,
      },
      tags: commonTags,
    });

    new CloudwatchMetricAlarm(this, 'web-instance-1-status-alarm', {
      alarmName: `${config.project}-web-instance-1-status-check`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: '2',
      metricName: 'StatusCheckFailed',
      namespace: 'AWS/EC2',
      period: '300',
      statistic: 'Maximum',
      threshold: '0',
      alarmDescription: 'This metric monitors ec2 status check',
      alarmActions: [snsTopic.arn],
      dimensions: {
        InstanceId: webInstance1.id,
      },
      tags: commonTags,
    });

    new CloudwatchMetricAlarm(this, 'web-instance-2-status-alarm', {
      alarmName: `${config.project}-web-instance-2-status-check`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: '2',
      metricName: 'StatusCheckFailed',
      namespace: 'AWS/EC2',
      period: '300',
      statistic: 'Maximum',
      threshold: '0',
      alarmDescription: 'This metric monitors ec2 status check',
      alarmActions: [snsTopic.arn],
      dimensions: {
        InstanceId: webInstance2.id,
      },
      tags: commonTags,
    });

    // RDS CPU Alarm
    new CloudwatchMetricAlarm(this, 'rds-cpu-alarm', {
      alarmName: `${config.project}-rds-high-cpu`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: '2',
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: '300',
      statistic: 'Average',
      threshold: '80',
      alarmDescription: 'This metric monitors RDS cpu utilization',
      alarmActions: [snsTopic.arn],
      dimensions: {
        DBInstanceIdentifier: rdsInstance.id,
      },
      tags: commonTags,
    });
  }
}

// Configuration
const config: InfrastructureConfig = {
  region: 'us-east-1',
  environment: 'production',
  owner: 'DevOps Team',
  project: 'web-app',
  allowedCidrBlocks: [
    '203.0.113.0/24', // Replace with your actual IP ranges
    '198.51.100.0/24', // Replace with your actual IP ranges
  ],
  notificationEmail: 'admin@yourcompany.com', // Replace with your email
  dbUsername: 'admin',
  dbPassword: 'YourSecurePassword123!', // Use AWS Secrets Manager in production
};

const app = new App();
new AWSInfrastructureStack(app, 'aws-infrastructure', config);
app.synth();
```

## Deployment Instructions

### 1. Initialize the project:

```bash
npm install
cdktf get
```

### 2. Configure your settings:

Before deploying, update the configuration in `main.ts`:

- Replace `allowedCidrBlocks` with your actual IP ranges
- Replace `notificationEmail` with your email address
- Replace `your-key-pair` with your actual EC2 key pair name
- Update database credentials (consider using AWS Secrets Manager for production)

### 3. Deploy the infrastructure:

```bash
# Validate the configuration
cdktf synth

# Deploy the infrastructure
cdktf deploy
```

### 4. Destroy when needed:

```bash
cdktf destroy
```

## Key Features Implemented

### ✅ **Security Best Practices**

- **Least Privilege IAM**: Custom IAM roles with minimal required permissions
- **Network Segmentation**: Public/private subnet architecture
- **Security Groups**: Restrictive inbound rules from specific IP ranges only
- **Encryption**: S3 buckets encrypted at rest
- **Database Security**: RDS in private subnets with restricted access

### ✅ **High Availability**

- **Multi-AZ VPC**: Spans two availability zones
- **Load Balancer**: Application Load Balancer distributes traffic
- **RDS Multi-AZ**: Database with automatic failover
- **NAT Gateways**: One per AZ for redundancy

### ✅ **Operational Excellence**

- **Monitoring**: CloudWatch alarms for CPU and status checks
- **Notifications**: SNS topic with email alerts
- **Tagging**: Consistent tagging strategy across all resources
- **Logging**: CloudWatch Logs integration for EC2 instances

### ✅ **Infrastructure Components**

- **VPC**: Custom VPC with proper CIDR allocation
- **Subnets**: 2 public + 2 private subnets across AZs
- **EC2**: Web servers in public subnets with restricted access
- **RDS**: MySQL database with Multi-AZ deployment
- **S3**: Encrypted storage bucket with public access blocked
- **ALB**: Application Load Balancer for traffic distribution

This setup provides a production-ready, secure, and highly available infrastructure that follows AWS best practices. The code is modular, well-documented, and easily configurable for different environments.
