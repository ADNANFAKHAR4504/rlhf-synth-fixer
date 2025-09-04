You're absolutely right! Let me provide the complete, corrected code. I notice I was missing some key parts. Here's the full implementation:

## Complete main.ts

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
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
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

    // IAM Policy for CloudWatch Logs (Least Privilege)
    const cloudWatchLogsPolicy = new IamPolicy(this, 'cloudwatch-logs-policy', {
      name: 'webapp-cloudwatch-logs-policy',
      description: 'Policy for EC2 instances to write to CloudWatch Logs',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
            ],
            Resource: [`${appLogGroup.arn}`, `${appLogGroup.arn}:*`],
          },
        ],
      }),
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

    // Attach custom CloudWatch Logs policy to EC2 role
    new IamRolePolicyAttachment(this, 'ec2-cloudwatch-logs-policy-attachment', {
      role: ec2Role.name,
      policyArn: cloudWatchLogsPolicy.arn,
    });

    // Attach SSM policy for systems manager access (least privilege)
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
yum install -y httpd amazon-cloudwatch-agent

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "${appLogGroup.name}",
            "log_stream_name": "{instance_id}/httpd/access_log",
            "timestamp_format": "%d/%b/%Y:%H:%M:%S %z"
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "${appLogGroup.name}",
            "log_stream_name": "{instance_id}/httpd/error_log",
            "timestamp_format": "%a %b %d %H:%M:%S %Y"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "WebApp/EC2",
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
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Start and enable httpd
systemctl start httpd
systemctl enable httpd

# Create a simple index page
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Web Application</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .info { background: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to the Multi-Tier Web Application</h1>
        <div class="info">
            <h3>Instance Information:</h3>
            <p><strong>Instance ID:</strong> <span id="instance-id">Loading...</span></p>
            <p><strong>Availability Zone:</strong> <span id="az">Loading...</span></p>
            <p><strong>Region:</strong> us-east-1</p>
            <p><strong>Tier:</strong> Application Server</p>
        </div>
        <div class="info">
            <h3>Architecture Features:</h3>
            <ul>
                <li>Multi-AZ deployment for high availability</li>
                <li>Auto Scaling (2-5 instances)</li>
                <li>Application Load Balancer</li>
                <li>Private subnets for security</li>
                <li>RDS MySQL with Multi-AZ</li>
                <li>CloudWatch monitoring and logging</li>
            </ul>
        </div>
    </div>
    
    <script>
        fetch('http://169.254.169.254/latest/meta-data/instance-id')
            .then(response => response.text())
            .then(data => document.getElementById('instance-id').textContent = data)
            .catch(error => document.getElementById('instance-id').textContent = 'Unable to fetch');
            
        fetch('http://169.254.169.254/latest/meta-data/placement/availability-zone')
            .then(response => response.text())
            .then(data => document.getElementById('az').textContent = data)
            .catch(error => document.getElementById('az').textContent = 'Unable to fetch');
    </script>
</body>
</html>
EOF

# Create health check endpoint
echo "OK" > /var/www/html/health

# Set proper permissions
chown -R apache:apache /var/www/html
chmod -R 755 /var/www/html

# Configure httpd to start on boot
systemctl enable httpd
systemctl restart httpd
`;

    // Launch Template
    const launchTemplate = new LaunchTemplate(this, 'app-launch-template', {
      name: 'webapp-launch-template',
      imageId: amazonLinuxAmi.id,
      instanceType: 't3.micro',
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
      monitoring: {
        enabled: true,
      },
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
        {
          key: 'Tier',
          value: 'application',
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
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
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

    new TerraformOutput(this, 'alb-zone-id', {
      value: alb.zoneId,
      description: 'Application Load Balancer Zone ID',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsInstance.endpoint,
      description: 'RDS instance endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'rds-port', {
      value: rdsInstance.port.toString(),
      description: 'RDS instance port',
    });

    new TerraformOutput(this, 'cloudwatch-log-group', {
      value: appLogGroup.name,
      description: 'CloudWatch Log Group name',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: [privateSubnet1.id, privateSubnet2.id],
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: [publicSubnet1.id, publicSubnet2.id],
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'security-group-alb', {
      value: albSecurityGroup.id,
      description: 'ALB Security Group ID',
    });

    new TerraformOutput(this, 'security-group-app', {
      value: appSecurityGroup.id,
      description: 'Application Security Group ID',
    });

    new TerraformOutput(this, 'security-group-db', {
      value: dbSecurityGroup.id,
      description: 'Database Security Group ID',
    });
  }
}

// Create and instantiate the app
const app = new App();
new WebAppInfrastructureStack(app, 'webapp-infrastructure');
app.synth();
```

## Complete package.json

```json
{
  "name": "webapp-infrastructure",
  "version": "1.0.0",
  "description": "AWS Infrastructure for scalable web application using CDKTF",
  "main": "main.ts",
  "scripts": {
    "build": "tsc",
    "synth": "cdktf synth",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy",
    "get": "cdktf get",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "watch": "tsc -w",
    "test": "echo \"No tests specified\" && exit 0"
  },
  "keywords": ["aws", "cdktf", "terraform", "infrastructure", "typescript"],
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^18.19.0",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0",
    "eslint": "^8.57.0",
    "typescript": "^5.5.4"
  },
  "dependencies": {
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.20.0",
    "constructs": "^10.3.0"
  }
}
```

## Complete tsconfig.json

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
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "outDir": "./dist"
  },
  "include": ["main.ts", "**/*.ts"],
  "exclude": ["node_modules", "cdktf.out", "dist", "**/*.d.ts"]
}
```

## Complete .eslintrc.js

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'esl
```
