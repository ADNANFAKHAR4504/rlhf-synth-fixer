I'll create a comprehensive CDKTF TypeScript template that provisions a highly available web application environment in AWS. This template will include all the components you specified with proper configuration for production use.

```typescript
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
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { ElasticBeanstalkApplication } from '@cdktf/provider-aws/lib/elastic-beanstalk-application';
import { ElasticBeanstalkEnvironment } from '@cdktf/provider-aws/lib/elastic-beanstalk-environment';
import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
import { Route53HealthCheck } from '@cdktf/provider-aws/lib/route53-health-check';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

class HighlyAvailableWebAppStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: 'us-east-1',
    });

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'available', {
      state: 'available',
    });

    // VPC Configuration
    const vpc = new Vpc(this, 'main-vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: 'ha-webapp-vpc',
        Environment: 'production',
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'main-igw', {
      vpcId: vpc.id,
      tags: {
        Name: 'ha-webapp-igw',
      },
    });

    // Public Subnets
    const publicSubnet1 = new Subnet(this, 'public-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `\${${azs.fqn}.names[0]}`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: 'ha-webapp-public-subnet-1',
        Type: 'Public',
      },
    });

    const publicSubnet2 = new Subnet(this, 'public-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `\${${azs.fqn}.names[1]}`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: 'ha-webapp-public-subnet-2',
        Type: 'Public',
      },
    });

    // Private Subnets
    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.3.0/24',
      availabilityZone: `\${${azs.fqn}.names[0]}`,
      tags: {
        Name: 'ha-webapp-private-subnet-1',
        Type: 'Private',
      },
    });

    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.4.0/24',
      availabilityZone: `\${${azs.fqn}.names[1]}`,
      tags: {
        Name: 'ha-webapp-private-subnet-2',
        Type: 'Private',
      },
    });

    // Elastic IPs for NAT Gateways
    const eip1 = new Eip(this, 'nat-eip-1', {
      domain: 'vpc',
      tags: {
        Name: 'ha-webapp-nat-eip-1',
      },
    });

    const eip2 = new Eip(this, 'nat-eip-2', {
      domain: 'vpc',
      tags: {
        Name: 'ha-webapp-nat-eip-2',
      },
    });

    // NAT Gateways
    const natGw1 = new NatGateway(this, 'nat-gw-1', {
      allocationId: eip1.id,
      subnetId: publicSubnet1.id,
      tags: {
        Name: 'ha-webapp-nat-gw-1',
      },
    });

    const natGw2 = new NatGateway(this, 'nat-gw-2', {
      allocationId: eip2.id,
      subnetId: publicSubnet2.id,
      tags: {
        Name: 'ha-webapp-nat-gw-2',
      },
    });

    // Route Tables
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      tags: {
        Name: 'ha-webapp-public-rt',
      },
    });

    const privateRouteTable1 = new RouteTable(this, 'private-rt-1', {
      vpcId: vpc.id,
      tags: {
        Name: 'ha-webapp-private-rt-1',
      },
    });

    const privateRouteTable2 = new RouteTable(this, 'private-rt-2', {
      vpcId: vpc.id,
      tags: {
        Name: 'ha-webapp-private-rt-2',
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
      name: 'ha-webapp-alb-sg',
      description: 'Security group for Application Load Balancer',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTP traffic',
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTPS traffic',
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
        Name: 'ha-webapp-alb-sg',
      },
    });

    const webSecurityGroup = new SecurityGroup(this, 'web-sg', {
      name: 'ha-webapp-web-sg',
      description: 'Security group for web servers',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          securityGroups: [albSecurityGroup.id],
          description: 'HTTP from ALB',
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
        Name: 'ha-webapp-web-sg',
      },
    });

    const dbSecurityGroup = new SecurityGroup(this, 'db-sg', {
      name: 'ha-webapp-db-sg',
      description: 'Security group for RDS database',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          securityGroups: [webSecurityGroup.id],
          description: 'MySQL from web servers',
        },
      ],
      tags: {
        Name: 'ha-webapp-db-sg',
      },
    });

    // RDS Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: 'ha-webapp-db-subnet-group',
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: {
        Name: 'ha-webapp-db-subnet-group',
      },
    });

    // RDS Instance with Multi-AZ
    const rdsInstance = new DbInstance(this, 'main-database', {
      identifier: 'ha-webapp-db',
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp2',
      storageEncrypted: true,
      dbName: 'webapp',
      username: 'admin',
      password: 'ChangeMe123!',
      vpcSecurityGroupIds: [dbSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      multiAz: true,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: true,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: 'ha-webapp-db-final-snapshot',
      tags: {
        Name: 'ha-webapp-database',
        Environment: 'production',
      },
    });

    // IAM Role for Elastic Beanstalk EC2 instances
    const ebEc2Role = new IamRole(this, 'eb-ec2-role', {
      name: 'ha-webapp-eb-ec2-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: 'ha-webapp-eb-ec2-role',
      },
    });

    // Custom policy for EC2 instances
    const ebEc2Policy = new IamPolicy(this, 'eb-ec2-policy', {
      name: 'ha-webapp-eb-ec2-policy',
      description: 'Policy for Elastic Beanstalk EC2 instances',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData',
              'ec2:DescribeVolumes',
              'ec2:DescribeTags',
              'logs:PutLogEvents',
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:DescribeLogStreams',
              'logs:DescribeLogGroups',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    // Attach policies to EC2 role
    new IamRolePolicyAttachment(this, 'eb-ec2-web-tier-policy', {
      role: ebEc2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier',
    });

    new IamRolePolicyAttachment(this, 'eb-ec2-worker-tier-policy', {
      role: ebEc2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier',
    });

    new IamRolePolicyAttachment(this, 'eb-ec2-custom-policy', {
      role: ebEc2Role.name,
      policyArn: ebEc2Policy.arn,
    });

    // Instance profile for EC2 role
    const ebInstanceProfile = new IamInstanceProfile(
      this,
      'eb-instance-profile',
      {
        name: 'ha-webapp-eb-instance-profile',
        role: ebEc2Role.name,
      }
    );

    // IAM Role for Elastic Beanstalk Service
    const ebServiceRole = new IamRole(this, 'eb-service-role', {
      name: 'ha-webapp-eb-service-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'elasticbeanstalk.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: 'ha-webapp-eb-service-role',
      },
    });

    new IamRolePolicyAttachment(this, 'eb-service-policy', {
      role: ebServiceRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService',
    });

    new IamRolePolicyAttachment(this, 'eb-enhanced-health-policy', {
      role: ebServiceRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth',
    });

    // Elastic Beanstalk Application
    const ebApplication = new ElasticBeanstalkApplication(this, 'webapp', {
      name: 'ha-webapp',
      description: 'Highly Available Web Application',
      tags: {
        Name: 'ha-webapp',
        Environment: 'production',
      },
    });

    // Primary Elastic Beanstalk Environment
    const ebEnvironmentPrimary = new ElasticBeanstalkEnvironment(
      this,
      'webapp-env-primary',
      {
        name: 'ha-webapp-primary',
        application: ebApplication.name,
        solutionStackName: '64bit Amazon Linux 2 v3.4.0 running Node.js 16',
        setting: [
          {
            namespace: 'aws:ec2:vpc',
            name: 'VPCId',
            value: vpc.id,
          },
          {
            namespace: 'aws:ec2:vpc',
            name: 'Subnets',
            value: `${privateSubnet1.id},${privateSubnet2.id}`,
          },
          {
            namespace: 'aws:ec2:vpc',
            name: 'ELBSubnets',
            value: `${publicSubnet1.id},${publicSubnet2.id}`,
          },
          {
            namespace: 'aws:autoscaling:launchconfiguration',
            name: 'IamInstanceProfile',
            value: ebInstanceProfile.name,
          },
          {
            namespace: 'aws:autoscaling:launchconfiguration',
            name: 'SecurityGroups',
            value: webSecurityGroup.id,
          },
          {
            namespace: 'aws:autoscaling:launchconfiguration',
            name: 'InstanceType',
            value: 't3.micro',
          },
          {
            namespace: 'aws:elasticbeanstalk:environment',
            name: 'ServiceRole',
            value: ebServiceRole.arn,
          },
          {
            namespace: 'aws:elasticbeanstalk:environment',
            name: 'LoadBalancerType',
            value: 'application',
          },
          {
            namespace: 'aws:elbv2:loadbalancer',
            name: 'SecurityGroups',
            value: albSecurityGroup.id,
          },
          {
            namespace: 'aws:autoscaling:asg',
            name: 'MinSize',
            value: '2',
          },
          {
            namespace: 'aws:autoscaling:asg',
            name: 'MaxSize',
            value: '6',
          },
          {
            namespace: 'aws:elasticbeanstalk:healthreporting:system',
            name: 'SystemType',
            value: 'enhanced',
          },
          {
            namespace: 'aws:elasticbeanstalk:application:environment',
            name: 'DB_HOST',
            value: rdsInstance.endpoint,
          },
          {
            namespace: 'aws:elasticbeanstalk:application:environment',
            name: 'DB_NAME',
            value: 'webapp',
          },
          {
            namespace: 'aws:elasticbeanstalk:application:environment',
            name: 'DB_USER',
            value: 'admin',
          },
        ],
        tags: {
          Name: 'ha-webapp-primary',
          Environment: 'production',
        },
      }
    );

    // Secondary Elastic Beanstalk Environment (for failover)
    const ebEnvironmentSecondary = new ElasticBeanstalkEnvironment(
      this,
      'webapp-env-secondary',
      {
        name: 'ha-webapp-secondary',
        application: ebApplication.name,
        solutionStackName: '64bit Amazon Linux 2 v3.4.0 running Node.js 16',
        setting: [
          {
            namespace: 'aws:ec2:vpc',
            name: 'VPCId',
            value: vpc.id,
          },
          {
            namespace: 'aws:ec2:vpc',
            name: 'Subnets',
            value: `${privateSubnet1.id},${privateSubnet2.id}`,
          },
          {
            namespace: 'aws:ec2:vpc',
            name: 'ELBSubnets',
            value: `${publicSubnet1.id},${publicSubnet2.id}`,
          },
          {
            namespace: 'aws:autoscaling:launchconfiguration',
            name: 'IamInstanceProfile',
            value: ebInstanceProfile.name,
          },
          {
            namespace: 'aws:autoscaling:launchconfiguration',
            name: 'SecurityGroups',
            value: webSecurityGroup.id,
          },
          {
            namespace: 'aws:autoscaling:launchconfiguration',
            name: 'InstanceType',
            value: 't3.micro',
          },
          {
            namespace: 'aws:elasticbeanstalk:environment',
            name: 'ServiceRole',
            value: ebServiceRole.arn,
          },
          {
            namespace: 'aws:elasticbeanstalk:environment',
            name: 'LoadBalancerType',
            value: 'application',
          },
          {
            namespace: 'aws:elbv2:loadbalancer',
            name: 'SecurityGroups',
            value: albSecurityGroup.id,
          },
          {
            namespace: 'aws:autoscaling:asg',
            name: 'MinSize',
            value: '1',
          },
          {
            namespace: 'aws:autoscaling:asg',
            name: 'MaxSize',
            value: '3',
          },
          {
            namespace: 'aws:elasticbeanstalk:healthreporting:system',
            name: 'SystemType',
            value: 'enhanced',
          },
          {
            namespace: 'aws:elasticbeanstalk:application:environment',
            name: 'DB_HOST',
            value: rdsInstance.endpoint,
          },
          {
            namespace: 'aws:elasticbeanstalk:application:environment',
            name: 'DB_NAME',
            value: 'webapp',
          },
          {
            namespace: 'aws:elasticbeanstalk:application:environment',
            name: 'DB_USER',
            value: 'admin',
          },
        ],
        tags: {
          Name: 'ha-webapp-secondary',
          Environment: 'production',
        },
      }
    );

    // Route 53 Hosted Zone
    const hostedZone = new Route53Zone(this, 'main-zone', {
      name: 'example.com',
      comment: 'Hosted zone for highly available web application',
      tags: {
        Name: 'ha-webapp-zone',
      },
    });

    // Health Checks
    const primaryHealthCheck = new Route53HealthCheck(
      this,
      'primary-health-check',
      {
        fqdn: ebEnvironmentPrimary.cname,
        port: 80,
        type: 'HTTP',
        resourcePath: '/health',
        failureThreshold: 3,
        requestInterval: 30,
        tags: {
          Name: 'ha-webapp-primary-health-check',
        },
      }
    );

    const secondaryHealthCheck = new Route53HealthCheck(
      this,
      'secondary-health-check',
      {
        fqdn: ebEnvironmentSecondary.cname,
        port: 80,
        type: 'HTTP',
        resourcePath: '/health',
        failureThreshold: 3,
        requestInterval: 30,
        tags: {
          Name: 'ha-webapp-secondary-health-check',
        },
      }
    );

    // Route 53 Records with Failover Routing
    new Route53Record(this, 'primary-record', {
      zoneId: hostedZone.zoneId,
      name: 'app.example.com',
      type: 'CNAME',
      ttl: 60,
      records: [ebEnvironmentPrimary.cname],
      setIdentifier: 'primary',
      failoverRoutingPolicy: {
        type: 'PRIMARY',
      },
      healthCheckId: primaryHealthCheck.id,
    });

    new Route53Record(this, 'secondary-record', {
      zoneId: hostedZone.zoneId,
      name: 'app.example.com',
      type: 'CNAME',
      ttl: 60,
      records: [ebEnvironmentSecondary.cname],
      setIdentifier: 'secondary',
      failoverRoutingPolicy: {
        type: 'SECONDARY',
      },
      healthCheckId: secondaryHealthCheck.id,
    });

    // SNS Topic for Notifications
    const alertsTopic = new SnsTopic(this, 'alerts-topic', {
      name: 'ha-webapp-alerts',
      displayName: 'HA WebApp Alerts',
      tags: {
        Name: 'ha-webapp-alerts',
      },
    });

    // SNS Subscription (replace with your email)
    new SnsTopicSubscription(this, 'email-notification', {
      topicArn: alertsTopic.arn,
      protocol: 'email',
      endpoint: 'admin@example.com',
    });

    // CloudWatch Alarms
    new CloudwatchMetricAlarm(this, 'high-cpu-alarm', {
      alarmName: 'ha-webapp-high-cpu',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'This metric monitors ec2 cpu utilization',
      alarmActions: [alertsTopic.arn],
      dimensions: {
        AutoScalingGroupName: `${ebEnvironmentPrimary.autoscalingGroups}`,
      },
      tags: {
        Name: 'ha-webapp-high-cpu-alarm',
      },
    });

    new CloudwatchMetricAlarm(this, 'application-health-alarm', {
      alarmName: 'ha-webapp-application-health',
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'ApplicationRequests2xx',
      namespace: 'AWS/ELB',
      period: 300,
      statistic: 'Sum',
      threshold: 10,
      alarmDescription: 'This metric monitors application health',
      alarmActions: [alertsTopic.arn],
      treatMissingData: 'breaching',
      tags: {
        Name: 'ha-webapp-application-health-alarm',
      },
    });

    new CloudwatchMetricAlarm(this, 'database-cpu-alarm', {
      alarmName: 'ha-webapp-database-cpu',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 75,
      alarmDescription: 'This metric monitors RDS CPU utilization',
      alarmActions: [alertsTopic.arn],
      dimensions: {
        DBInstanceIdentifier: rdsInstance.id,
      },
      tags: {
        Name: 'ha-webapp-database-cpu-alarm',
      },
    });

    // Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'primary-environment-url', {
      value: `http://${ebEnvironmentPrimary.cname}`,
      description: 'Primary Environment URL',
    });

    new TerraformOutput(this, 'secondary-environment-url', {
      value: `http://${ebEnvironmentSecondary.cname}`,
      description: 'Secondary Environment URL',
    });

    new TerraformOutput(this, 'database-endpoint', {
      value: rdsInstance.endpoint,
      description: 'RDS Database Endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'route53-zone-id', {
      value: hostedZone.zoneId,
      description: 'Route 53 Hosted Zone ID',
    });

    new TerraformOutput(this, 'application-url', {
      value: 'http://app.example.com',
      description: 'Application URL with failover routing',
    });
  }
}

const app = new App();
new HighlyAvailableWebAppStack(app, 'ha-webapp-stack');
app.synth();
```

## Key Features Implemented

### 1. **Network Architecture**

- **VPC** with public and private subnets across 2 AZs
- **Internet Gateway** for public internet access
- **NAT Gateways** in each AZ for private subnet internet access
- **Route tables** properly configured for traffic routing

### 2. **High Availability**

- **Multi-AZ RDS** with automated backups and maintenance windows
- **Auto Scaling Groups** with minimum 2 instances in primary environment
- **Application Load Balancer** distributing traffic across AZs
- **Route 53 failover routing** between primary and secondary environments

### 3. **Security (Least Privilege)**

- **Security Groups** with specific port access only
- **IAM roles** with minimal required permissions
- **VPC isolation** with private subnets for application and database tiers
- **Database encryption** enabled

### 4. **Monitoring & Alerting**

- **CloudWatch alarms** for CPU utilization, application health, and database performance
- **SNS notifications** for alert delivery
- **Route 53 health checks** for automatic failover

### 5. **Elastic Beanstalk Configuration**

- **Primary and secondary environments** for failover capability
- **Enhanced health reporting** enabled
- **Auto scaling** configured with appropriate min/max instances
- **Environment variables** for database connection

## Deployment Instructions

1. **Install Dependencies**:

```bash
npm install @cdktf/provider-aws cdktf constructs
```

2. **Initialize CDKTF**:

```bash
cdktf init --template=typescript
```

3. **Replace the main.ts file** with the provided code

4. **Configure AWS credentials**:

```bash
aws configure
```

5. **Deploy**:

```bash
cdktf deploy
```

## Important Notes

1. **Domain Configuration**: Update `example.com` to your actual domain name
2. **Email Notifications**: Replace `admin@example.com` with your actual email address
3. **Database Password**: Change the default password in production
4. **SSL/TLS**: Consider adding SSL certificates for HTTPS
5. **Application Code**: Deploy your actual application code to the Elastic Beanstalk environments

This template creates a production-ready, highly available web application infrastructure that automatically handles failover, scaling, and monitoring while maintaining security best practices.
