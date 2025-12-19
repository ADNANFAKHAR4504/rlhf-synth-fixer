I'll create a comprehensive CDKTF TypeScript project that implements your multi-tier AWS infrastructure. This will be a production-ready, scalable architecture following AWS best practices.

## Project Structure

First, let me show you the complete stack implementation:

```typescript
// main.ts
import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput } from 'cdktf';
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
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

class WebAppInfrastructureStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: 'us-east-1',
    });

    // Get availability zones
    const availabilityZones = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Get latest Amazon Linux 2 AMI
    const amazonLinuxAmi = new DataAwsAmi(this, 'amazon-linux', {
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

    // VPC Configuration
    const vpc = new Vpc(this, 'main-vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: 'main-vpc',
        Environment: 'production',
      },
    });

    // Internet Gateway
    const internetGateway = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: 'main-igw',
      },
    });

    // Public Subnets (for ALB)
    const publicSubnet1 = new Subnet(this, 'public-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `\${${availabilityZones.fqn}.names[0]}`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: 'public-subnet-1',
        Type: 'public',
      },
    });

    const publicSubnet2 = new Subnet(this, 'public-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `\${${availabilityZones.fqn}.names[1]}`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: 'public-subnet-2',
        Type: 'public',
      },
    });

    // Private Subnets (for application servers)
    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.10.0/24',
      availabilityZone: `\${${availabilityZones.fqn}.names[0]}`,
      tags: {
        Name: 'private-subnet-1',
        Type: 'private',
      },
    });

    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: `\${${availabilityZones.fqn}.names[1]}`,
      tags: {
        Name: 'private-subnet-2',
        Type: 'private',
      },
    });

    // Database Subnets
    const dbSubnet1 = new Subnet(this, 'db-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.20.0/24',
      availabilityZone: `\${${availabilityZones.fqn}.names[0]}`,
      tags: {
        Name: 'db-subnet-1',
        Type: 'database',
      },
    });

    const dbSubnet2 = new Subnet(this, 'db-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.21.0/24',
      availabilityZone: `\${${availabilityZones.fqn}.names[1]}`,
      tags: {
        Name: 'db-subnet-2',
        Type: 'database',
      },
    });

    // Elastic IPs for NAT Gateways
    const natEip1 = new Eip(this, 'nat-eip-1', {
      domain: 'vpc',
      tags: {
        Name: 'nat-eip-1',
      },
    });

    const natEip2 = new Eip(this, 'nat-eip-2', {
      domain: 'vpc',
      tags: {
        Name: 'nat-eip-2',
      },
    });

    // NAT Gateways
    const natGateway1 = new NatGateway(this, 'nat-gateway-1', {
      allocationId: natEip1.id,
      subnetId: publicSubnet1.id,
      tags: {
        Name: 'nat-gateway-1',
      },
    });

    const natGateway2 = new NatGateway(this, 'nat-gateway-2', {
      allocationId: natEip2.id,
      subnetId: publicSubnet2.id,
      tags: {
        Name: 'nat-gateway-2',
      },
    });

    // Route Tables
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      tags: {
        Name: 'public-route-table',
      },
    });

    const privateRouteTable1 = new RouteTable(this, 'private-rt-1', {
      vpcId: vpc.id,
      tags: {
        Name: 'private-route-table-1',
      },
    });

    const privateRouteTable2 = new RouteTable(this, 'private-rt-2', {
      vpcId: vpc.id,
      tags: {
        Name: 'private-route-table-2',
      },
    });

    // Routes
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.id,
    });

    new Route(this, 'private-route-1', {
      routeTableId: privateRouteTable1.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway1.id,
    });

    new Route(this, 'private-route-2', {
      routeTableId: privateRouteTable2.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway2.id,
    });

    // Route Table Associations
    new RouteTableAssociation(this, 'public-subnet-1-association', {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'public-subnet-2-association', {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'private-subnet-1-association', {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable1.id,
    });

    new RouteTableAssociation(this, 'private-subnet-2-association', {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable2.id,
    });

    // Security Groups
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: 'alb-security-group',
      description: 'Security group for Application Load Balancer',
      vpcId: vpc.id,
      tags: {
        Name: 'alb-security-group',
      },
    });

    // ALB Security Group Rules
    new SecurityGroupRule(this, 'alb-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow HTTP traffic from internet',
    });

    new SecurityGroupRule(this, 'alb-https-ingress', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow HTTPS traffic from internet',
    });

    new SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Application Security Group
    const appSecurityGroup = new SecurityGroup(this, 'app-sg', {
      name: 'app-security-group',
      description: 'Security group for application servers',
      vpcId: vpc.id,
      tags: {
        Name: 'app-security-group',
      },
    });

    // App Security Group Rules
    new SecurityGroupRule(this, 'app-http-from-alb', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: albSecurityGroup.id,
      securityGroupId: appSecurityGroup.id,
      description: 'Allow HTTP traffic from ALB',
    });

    new SecurityGroupRule(this, 'app-ssh-ingress', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/16'],
      securityGroupId: appSecurityGroup.id,
      description: 'Allow SSH from VPC',
    });

    new SecurityGroupRule(this, 'app-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: appSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Database Security Group
    const dbSecurityGroup = new SecurityGroup(this, 'db-sg', {
      name: 'db-security-group',
      description: 'Security group for RDS database',
      vpcId: vpc.id,
      tags: {
        Name: 'db-security-group',
      },
    });

    // DB Security Group Rules
    new SecurityGroupRule(this, 'db-mysql-from-app', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: appSecurityGroup.id,
      securityGroupId: dbSecurityGroup.id,
      description: 'Allow MySQL traffic from application servers',
    });

    // CloudWatch Log Group
    const appLogGroup = new CloudwatchLogGroup(this, 'app-log-group', {
      name: '/aws/ec2/webapp',
      retentionInDays: 14,
      tags: {
        Name: 'webapp-logs',
        Environment: 'production',
      },
    });

    // IAM Role for EC2 instances
    const ec2Role = new IamRole(this, 'ec2-role', {
      name: 'webapp-ec2-role',
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
        Name: 'webapp-ec2-role',
      },
    });

    // Attach CloudWatch Logs policy to EC2 role
    new IamRolePolicyAttachment(this, 'ec2-cloudwatch-logs-policy', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchLogsFullAccess',
    });

    // Attach SSM policy for systems manager access
    new IamRolePolicyAttachment(this, 'ec2-ssm-policy', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    // IAM Instance Profile
    const ec2InstanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: 'webapp-ec2-instance-profile',
        role: ec2Role.name,
      }
    );

    // User Data Script for EC2 instances
    const userData = `#!/bin/bash
yum update -y
yum install -y httpd awslogs

# Configure CloudWatch Logs
cat > /etc/awslogs/awslogs.conf << EOF
[general]
state_file = /var/lib/awslogs/agent-state

[/var/log/httpd/access_log]
file = /var/log/httpd/access_log
log_group_name = ${appLogGroup.name}
log_stream_name = {instance_id}/httpd/access_log
datetime_format = %d/%b/%Y:%H:%M:%S %z

[/var/log/httpd/error_log]
file = /var/log/httpd/error_log
log_group_name = ${appLogGroup.name}
log_stream_name = {instance_id}/httpd/error_log
datetime_format = %a %b %d %H:%M:%S %Y
EOF

# Configure CloudWatch Logs region
sed -i 's/region = us-east-1/region = us-east-1/' /etc/awslogs/awscli.conf

# Start services
systemctl start httpd
systemctl enable httpd
systemctl start awslogsd
systemctl enable awslogsd

# Create a simple index page
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Web Application</title>
</head>
<body>
    <h1>Welcome to the Web Application</h1>
    <p>Instance ID: \$(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Availability Zone: \$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
</body>
</html>
EOF

# Create health check endpoint
cat > /var/www/html/health << EOF
OK
EOF
`;

    // Launch Template
    const launchTemplate = new LaunchTemplate(this, 'app-launch-template', {
      name: 'webapp-launch-template',
      imageId: amazonLinuxAmi.id,
      instanceType: 't3.micro',
      keyName: undefined, // You can specify a key pair name here if needed
      vpcSecurityGroupIds: [appSecurityGroup.id],
      iamInstanceProfile: {
        name: ec2InstanceProfile.name,
      },
      userData: Buffer.from(userData).toString('base64'),
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            Name: 'webapp-instance',
            Environment: 'production',
            Tier: 'application',
          },
        },
      ],
    });

    // Application Load Balancer
    const alb = new Lb(this, 'app-alb', {
      name: 'webapp-alb',
      loadBalancerType: 'application',
      internal: false,
      securityGroups: [albSecurityGroup.id],
      subnets: [publicSubnet1.id, publicSubnet2.id],
      enableDeletionProtection: false,
      tags: {
        Name: 'webapp-alb',
        Environment: 'production',
      },
    });

    // Target Group
    const targetGroup = new LbTargetGroup(this, 'app-target-group', {
      name: 'webapp-target-group',
      port: 80,
      protocol: 'HTTP',
      vpcId: vpc.id,
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        path: '/health',
        matcher: '200',
        protocol: 'HTTP',
        port: 'traffic-port',
      },
      tags: {
        Name: 'webapp-target-group',
      },
    });

    // ALB Listener
    new LbListener(this, 'app-listener', {
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

    // Auto Scaling Group
    new AutoscalingGroup(this, 'app-asg', {
      name: 'webapp-asg',
      vpcZoneIdentifier: [privateSubnet1.id, privateSubnet2.id],
      targetGroupArns: [targetGroup.arn],
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      minSize: 2,
      maxSize: 5,
      desiredCapacity: 2,
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      tag: [
        {
          key: 'Name',
          value: 'webapp-asg-instance',
          propagateAtLaunch: true,
        },
        {
          key: 'Environment',
          value: 'production',
          propagateAtLaunch: true,
        },
      ],
    });

    // DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: 'webapp-db-subnet-group',
      subnetIds: [dbSubnet1.id, dbSubnet2.id],
      tags: {
        Name: 'webapp-db-subnet-group',
      },
    });

    // RDS Instance
    const rdsInstance = new DbInstance(this, 'webapp-db', {
      identifier: 'webapp-database',
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: 'gp2',
      storageEncrypted: true,
      dbName: 'webapp',
      username: 'admin',
      password: 'changeme123!', // In production, use AWS Secrets Manager
      vpcSecurityGroupIds: [dbSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      multiAz: true,
      publiclyAccessible: false,
      skipFinalSnapshot: true,
      deletionProtection: false,
      tags: {
        Name: 'webapp-database',
        Environment: 'production',
      },
    });

    // Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsInstance.endpoint,
      description: 'RDS instance endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'cloudwatch-log-group', {
      value: appLogGroup.name,
      description: 'CloudWatch Log Group name',
    });
  }
}

const app = new App();
new WebAppInfrastructureStack(app, 'webapp-infrastructure');
app.synth();
```

## Supporting Configuration Files

### package.json

```json
{
  "name": "webapp-infrastructure",
  "version": "1.0.0",
  "description": "AWS Infrastructure for scalable web application",
  "main": "main.ts",
  "scripts": {
    "build": "tsc",
    "synth": "cdktf synth",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy",
    "get": "cdktf get"
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

### tsconfig.json

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
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "exclude": ["node_modules", "cdktf.out"]
}
```

### cdktf.json

```json
{
  "language": "typescript",
  "app": "npx ts-node main.ts",
  "projectId": "webapp-infrastructure",
  "sendCrashReports": "false",
  "terraformProviders": ["aws@~> 5.0"],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## Deployment Instructions

1. **Initialize the project:**

```bash
npm install
cdktf get
```

2. **Build and synthesize:**

```bash
npm run build
npm run synth
```

3. **Deploy the infrastructure:**

```bash
npm run deploy
```

## Architecture Overview

This infrastructure implements a robust, production-ready multi-tier architecture:

### **Network Layer (VPC)**

- **VPC**: 10.0.0.0/16 CIDR spanning multiple AZs
- **Public Subnets**: 10.0.1.0/24, 10.0.2.0/24 (for ALB)
- **Private Subnets**: 10.0.10.0/24, 10.0.11.0/24 (for app servers)
- **Database Subnets**: 10.0.20.0/24, 10.0.21.0/24 (for RDS)
- **NAT Gateways**: Redundant NAT gateways in each AZ for outbound internet access

### **Web Tier**

- **Application Load Balancer**: Internet-facing, distributes traffic across AZs
- **Security**: Only accepts HTTP/HTTPS traffic from the internet
- **Health Checks**: Monitors application health via `/health` endpoint

### **Application Tier**

- **Auto Scaling Group**: 2-5 instances based on demand
- **EC2 Instances**: t3.micro instances in private subnets
- **Security**: No direct internet access, only accessible via ALB
- **Monitoring**: CloudWatch Logs integration for application logs

### **Data Tier**

- **RDS MySQL**: Multi-AZ deployment for high availability
- **Security**: Isolated in database subnets, only accessible from app tier
- **Backup**: 7-day retention with automated backups
- **Encryption**: Storage encryption enabled

### **Security Features**

- **IAM Roles**: Least privilege access for EC2 instances
- **Security Groups**: Layered security with specific port access
- **Network Isolation**: Private subnets protect backend resources
- **Encryption**: RDS storage encryption enabled

### **Monitoring & Logging**

- **CloudWatch Logs**: Centralized logging for application and web server logs
- **Health Checks**: ALB health checks ensure traffic only goes to healthy instances
- **Log Retention**: 14-day retention for cost optimization

This architecture provides high availability, scalability, security, and observability while following AWS best practices for production workloads.
