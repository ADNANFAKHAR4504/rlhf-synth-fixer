```typescript
import { Construct } from "constructs";
import { TerraformVariable, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { Route } from "@cdktf/provider-aws/lib/route";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamInstanceProfile } from "@cdktf/provider-aws/lib/iam-instance-profile";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";
import { LaunchTemplate } from "@cdktf/provider-aws/lib/launch-template";
import { AutoscalingGroup } from "@cdktf/provider-aws/lib/autoscaling-group";
import { Lb } from "@cdktf/provider-aws/lib/lb";
import { LbTargetGroup } from "@cdktf/provider-aws/lib/lb-target-group";
import { LbListener } from "@cdktf/provider-aws/lib/lb-listener";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketServerSideEncryptionConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { S3BucketPolicy } from "@cdktf/provider-aws/lib/s3-bucket-policy";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb-table";
import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";
import { DbSubnetGroup } from "@cdktf/provider-aws/lib/db-subnet-group";
import { FlowLog } from "@cdktf/provider-aws/lib/flow-log";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { DataAwsAvailabilityZones } from "@cdktf/provider-aws/lib/data-aws-availability-zones";
import { DataAwsAmi } from "@cdktf/provider-aws/lib/data-aws-ami";

export interface ScalableInfrastructureProps {
  region: string;
  allowedCidr: string;
  dbUsername: string;
  dbPassword: string;
}

export class ScalableInfrastructure extends Construct {
  constructor(scope: Construct, id: string, props: ScalableInfrastructureProps) {
    super(scope, id);

    // AWS Provider configuration
    new AwsProvider(this, "aws", {
      region: props.region,
    });

    // Common tags applied to all resources
    const commonTags = {
      Environment: "Production",
      ManagedBy: "Terraform-CDK",
      Region: props.region,
    };

    // Data sources for AZs and AMI
    const availabilityZones = new DataAwsAvailabilityZones(this, "available", {
      state: "available",
    });

    const amazonLinuxAmi = new DataAwsAmi(this, "amazon-linux", {
      mostRecent: true,
      owners: ["amazon"],
      filter: [
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-gp2"],
        },
      ],
    });

    // VPC Configuration
    const vpc = new Vpc(this, "main-vpc", {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...commonTags,
        Name: `${id}-vpc`,
      },
    });

    // Internet Gateway for public subnet internet access
    const internetGateway = new InternetGateway(this, "igw", {
      vpcId: vpc.id,
      tags: {
        ...commonTags,
        Name: `${id}-igw`,
      },
    });

    // Public Subnets across multiple AZs for high availability
    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];
    const natGateways: NatGateway[] = [];

    for (let i = 0; i < 3; i++) {
      // Public subnet for each AZ
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: `\${${availabilityZones.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: `${id}-public-subnet-${i + 1}`,
          Type: "Public",
        },
      });
      publicSubnets.push(publicSubnet);

      // Private subnet for each AZ
      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: `\${${availabilityZones.fqn}.names[${i}]}`,
        tags: {
          ...commonTags,
          Name: `${id}-private-subnet-${i + 1}`,
          Type: "Private",
        },
      });
      privateSubnets.push(privateSubnet);

      // Elastic IP for NAT Gateway
      const natEip = new Eip(this, `nat-eip-${i}`, {
        domain: "vpc",
        tags: {
          ...commonTags,
          Name: `${id}-nat-eip-${i + 1}`,
        },
      });

      // NAT Gateway for private subnet internet access
      const natGateway = new NatGateway(this, `nat-gateway-${i}`, {
        allocationId: natEip.id,
        subnetId: publicSubnet.id,
        tags: {
          ...commonTags,
          Name: `${id}-nat-gateway-${i + 1}`,
        },
      });
      natGateways.push(natGateway);
    }

    // Route table for public subnets
    const publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: vpc.id,
      tags: {
        ...commonTags,
        Name: `${id}-public-rt`,
      },
    });

    // Route to internet gateway for public subnets
    new Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: internetGateway.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Route tables and routes for private subnets
    privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: vpc.id,
        tags: {
          ...commonTags,
          Name: `${id}-private-rt-${index + 1}`,
        },
      });

      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: natGateways[index].id,
      });

      new RouteTableAssociation(this, `private-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Security Groups
    // ALB Security Group - allows HTTP traffic from specified CIDR
    const albSecurityGroup = new SecurityGroup(this, "alb-sg", {
      name: `${id}-alb-sg`,
      description: "Security group for Application Load Balancer",
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: [props.allowedCidr],
          description: "HTTP access from allowed CIDR",
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
          description: "All outbound traffic",
        },
      ],
      tags: {
        ...commonTags,
        Name: `${id}-alb-sg`,
      },
    });

    // EC2 Security Group - allows traffic from ALB and SSH from specified CIDR
    const ec2SecurityGroup = new SecurityGroup(this, "ec2-sg", {
      name: `${id}-ec2-sg`,
      description: "Security group for EC2 instances",
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          securityGroups: [albSecurityGroup.id],
          description: "HTTP from ALB",
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: [props.allowedCidr],
          description: "SSH access from allowed CIDR",
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
          description: "All outbound traffic",
        },
      ],
      tags: {
        ...commonTags,
        Name: `${id}-ec2-sg`,
      },
    });

    // RDS Security Group - allows MySQL access from EC2 instances
    const rdsSecurityGroup = new SecurityGroup(this, "rds-sg", {
      name: `${id}-rds-sg`,
      description: "Security group for RDS MySQL instance",
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: "tcp",
          securityGroups: [ec2SecurityGroup.id],
          description: "MySQL access from EC2 instances",
        },
      ],
      tags: {
        ...commonTags,
        Name: `${id}-rds-sg`,
      },
    });

    // S3 Bucket with server-side encryption
    const s3Bucket = new S3Bucket(this, "app-bucket", {
      bucket: `${id}-app-bucket-${props.region}-${Date.now()}`,
      tags: commonTags,
    });

    // Enable server-side encryption for S3 bucket
    new S3BucketServerSideEncryptionConfiguration(this, "bucket-encryption", {
      bucket: s3Bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256",
          },
        },
      ],
    });

    // Block public access to S3 bucket
    new S3BucketPublicAccessBlock(this, "bucket-pab", {
      bucket: s3Bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // DynamoDB Table with primary key
    const dynamoTable = new DynamodbTable(this, "app-table", {
      name: `${id}-app-table`,
      billingMode: "PAY_PER_REQUEST",
      hashKey: "id",
      attribute: [
        {
          name: "id",
          type: "S",
        },
      ],
      tags: commonTags,
    });

    // IAM Role for EC2 instances with least privilege access
    const ec2Role = new IamRole(this, "ec2-role", {
      name: `${id}-ec2-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "ec2.amazonaws.com",
            },
          },
        ],
      }),
      tags: commonTags,
    });

    // IAM Policy for S3 access (scoped to specific bucket)
    const s3Policy = new IamPolicy(this, "s3-policy", {
      name: `${id}-s3-policy`,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:GetObject",
              "s3:PutObject",
              "s3:DeleteObject",
            ],
            Resource: `${s3Bucket.arn}/*`,
          },
          {
            Effect: "Allow",
            Action: ["s3:ListBucket"],
            Resource: s3Bucket.arn,
          },
        ],
      }),
      tags: commonTags,
    });

    // IAM Policy for DynamoDB access (scoped to specific table)
    const dynamoPolicy = new IamPolicy(this, "dynamo-policy", {
      name: `${id}-dynamo-policy`,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:UpdateItem",
              "dynamodb:DeleteItem",
              "dynamodb:Query",
              "dynamodb:Scan",
            ],
            Resource: dynamoTable.arn,
          },
        ],
      }),
      tags: commonTags,
    });

    // IAM Policy for CloudWatch logging
    const cloudwatchPolicy = new IamPolicy(this, "cloudwatch-policy", {
      name: `${id}-cloudwatch-policy`,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "logs:DescribeLogStreams",
            ],
            Resource: "*",
          },
          {
            Effect: "Allow",
            Action: [
              "cloudwatch:PutMetricData",
              "cloudwatch:GetMetricStatistics",
              "cloudwatch:ListMetrics",
            ],
            Resource: "*",
          },
        ],
      }),
      tags: commonTags,
    });

    // Attach policies to EC2 role
    new IamRolePolicyAttachment(this, "ec2-s3-policy-attachment", {
      role: ec2Role.name,
      policyArn: s3Policy.arn,
    });

    new IamRolePolicyAttachment(this, "ec2-dynamo-policy-attachment", {
      role: ec2Role.name,
      policyArn: dynamoPolicy.arn,
    });

    new IamRolePolicyAttachment(this, "ec2-cloudwatch-policy-attachment", {
      role: ec2Role.name,
      policyArn: cloudwatchPolicy.arn,
    });

    // Instance profile for EC2 instances
    const instanceProfile = new IamInstanceProfile(this, "ec2-instance-profile", {
      name: `${id}-ec2-instance-profile`,
      role: ec2Role.name,
      tags: commonTags,
    });

    // S3 Bucket Policy - restrict access to EC2 role only
    new S3BucketPolicy(this, "bucket-policy", {
      bucket: s3Bucket.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "AllowEC2RoleAccess",
            Effect: "Allow",
            Principal: {
              AWS: ec2Role.arn,
            },
            Action: [
              "s3:GetObject",
              "s3:PutObject",
              "s3:DeleteObject",
            ],
            Resource: `${s3Bucket.arn}/*`,
          },
          {
            Sid: "AllowEC2RoleListBucket",
            Effect: "Allow",
            Principal: {
              AWS: ec2Role.arn,
            },
            Action: "s3:ListBucket",
            Resource: s3Bucket.arn,
          },
        ],
      }),
    });

    // CloudWatch Log Group for VPC Flow Logs
    const vpcLogGroup = new CloudwatchLogGroup(this, "vpc-flow-logs", {
      name: `/aws/vpc/flowlogs/${id}`,
      retentionInDays: 14,
      tags: commonTags,
    });

    // IAM Role for VPC Flow Logs
    const flowLogRole = new IamRole(this, "flow-log-role", {
      name: `${id}-flow-log-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "vpc-flow-logs.amazonaws.com",
            },
          },
        ],
      }),
      tags: commonTags,
    });

    // IAM Policy for VPC Flow Logs
    const flowLogPolicy = new IamPolicy(this, "flow-log-policy", {
      name: `${id}-flow-log-policy`,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "logs:DescribeLogGroups",
              "logs:DescribeLogStreams",
            ],
            Resource: "*",
          },
        ],
      }),
      tags: commonTags,
    });

    new IamRolePolicyAttachment(this, "flow-log-policy-attachment", {
      role: flowLogRole.name,
      policyArn: flowLogPolicy.arn,
    });

    // VPC Flow Logs to capture all IP traffic
    new FlowLog(this, "vpc-flow-log", {
      iamRoleArn: flowLogRole.arn,
      logDestination: vpcLogGroup.arn,
      resourceId: vpc.id,
      resourceType: "VPC",
      trafficType: "ALL",
      tags: commonTags,
    });

    // Launch Template for Auto Scaling Group
    const launchTemplate = new LaunchTemplate(this, "launch-template", {
      name: `${id}-launch-template`,
      imageId: amazonLinuxAmi.id,
      instanceType: "t3.micro",
      vpcSecurityGroupIds: [ec2SecurityGroup.id],
      iamInstanceProfile: {
        name: instanceProfile.name,
      },
      userData: Buffer.from(`#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c default
`).toString('base64'),
      tagSpecifications: [
        {
          resourceType: "instance",
          tags: {
            ...commonTags,
            Name: `${id}-instance`,
          },
        },
      ],
      tags: commonTags,
    });

    // Application Load Balancer
    const alb = new Lb(this, "alb", {
      name: `${id}-alb`,
      loadBalancerType: "application",
      subnets: publicSubnets.map(subnet => subnet.id),
      securityGroups: [albSecurityGroup.id],
      tags: commonTags,
    });

    // ALB Target Group
    const targetGroup = new LbTargetGroup(this, "tg", {
      name: `${id}-tg`,
      port: 80,
      protocol: "HTTP",
      vpcId: vpc.id,
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        interval: 30,
        matcher: "200",
        path: "/",
        port: "traffic-port",
        protocol: "HTTP",
        timeout: 5,
        unhealthyThreshold: 2,
      },
      tags: commonTags,
    });

    // ALB Listener
    new LbListener(this, "alb-listener", {
      loadBalancerArn: alb.arn,
      port: "80",
      protocol: "HTTP",
      defaultAction: [
        {
          type: "forward",
          targetGroupArn: targetGroup.arn,
        },
      ],
      tags: commonTags,
    });

    // Auto Scaling Group with minimum 3 instances across AZs
    new AutoscalingGroup(this, "asg", {
      name: `${id}-asg`,
      vpcZoneIdentifier: privateSubnets.map(subnet => subnet.id),
      targetGroupArns: [targetGroup.arn],
      healthCheckType: "ELB",
      healthCheckGracePeriod: 300,
      minSize: 3,
      maxSize: 9,
      desiredCapacity: 3,
      launchTemplate: {
        id: launchTemplate.id,
        version: "$Latest",
      },
      tag: [
        {
          key: "Name",
          value: `${id}-asg-instance`,
          propagateAtLaunch: true,
        },
        {
          key: "Environment",
          value: "Production",
          propagateAtLaunch: true,
        },
        {
          key: "ManagedBy",
          value: "Terraform-CDK",
          propagateAtLaunch: true,
        },
      ],
    });

    // RDS Subnet Group for multi-AZ deployment
    const dbSubnetGroup = new DbSubnetGroup(this, "db-subnet-group", {
      name: `${id}-db-subnet-group`,
      subnetIds: privateSubnets.map(subnet => subnet.id),
      tags: {
        ...commonTags,
        Name: `${id}-db-subnet-group`,
      },
    });

    // RDS MySQL Instance with Multi-AZ and encryption
    const rdsInstance = new DbInstance(this, "rds-mysql", {
      identifier: `${id}-mysql`,
      engine: "mysql",
      engineVersion: "8.0",
      instanceClass: "db.t3.micro",
      allocatedStorage: 20,
      storageType: "gp2",
      storageEncrypted: true,
      dbName: "appdb",
      username: props.dbUsername,
      password: props.dbPassword,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      multiAz: true,
      backupRetentionPeriod: 7,
      backupWindow: "03:00-04:00",
      maintenanceWindow: "sun:04:00-sun:05:00",
      skipFinalSnapshot: true,
      tags: commonTags,
    });

    // Outputs for important resource information
    new TerraformOutput(this, "vpc-id", {
      value: vpc.id,
      description: "VPC ID",
    });

    new TerraformOutput(this, "alb-dns-name", {
      value: alb.dnsName,
      description: "Application Load Balancer DNS name",
    });

    new TerraformOutput(this, "s3-bucket-name", {
      value: s3Bucket.bucket,
      description: "S3 Bucket name",
    });

    new TerraformOutput(this, "dynamodb-table-name", {
      value: dynamoTable.name,
      description: "DynamoDB table name",
    });

    new TerraformOutput(this, "rds-endpoint", {
      value: rdsInstance.endpoint,
      description: "RDS MySQL endpoint",
    });
  }
}
```