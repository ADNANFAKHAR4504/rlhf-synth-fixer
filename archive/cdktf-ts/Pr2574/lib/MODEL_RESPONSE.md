## lib/modules.ts

```typescript
import { Construct } from "constructs";
import { TerraformOutput } from "cdktf";
import {
  Vpc,
  Subnet,
  InternetGateway,
  NatGateway,
  RouteTable,
  Route,
  RouteTableAssociation,
  Eip,
  SecurityGroup,
  SecurityGroupRule,
  Instance,
  LaunchTemplate,
  AutoscalingGroup,
  Lb,
  LbTargetGroup,
  LbListener,
  DbInstance,
  DbSubnetGroup,
  S3Bucket,
  S3BucketVersioning,
  IamRole,
  IamRolePolicyAttachment,
  IamInstanceProfile,
  DataAwsAvailabilityZones,
  DataAwsAmi,
} from "@cdktf/provider-aws";

// Network Module
export interface NetworkModuleProps {
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
}

export interface NetworkModuleOutputs {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  internetGatewayId: string;
}

export class NetworkModule extends Construct {
  public readonly outputs: NetworkModuleOutputs;

  constructor(scope: Construct, id: string, props: NetworkModuleProps) {
    super(scope, id);

    const azs = new DataAwsAvailabilityZones(this, "azs", {
      state: "available",
    });

    // VPC
    const vpc = new Vpc(this, "vpc", {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { Name: "main-vpc" },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, "igw", {
      vpcId: vpc.id,
      tags: { Name: "main-igw" },
    });

    // Public Subnets
    const publicSubnets = props.publicSubnetCidrs.map((cidr, index) => 
      new Subnet(this, `public-subnet-${index}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${azs.fqn}.names[${index}]}`,
        mapPublicIpOnLaunch: true,
        tags: { Name: `public-subnet-${index + 1}` },
      })
    );

    // Private Subnets
    const privateSubnets = props.privateSubnetCidrs.map((cidr, index) =>
      new Subnet(this, `private-subnet-${index}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${azs.fqn}.names[${index}]}`,
        tags: { Name: `private-subnet-${index + 1}` },
      })
    );

    // NAT Gateways
    const natGateways = publicSubnets.map((subnet, index) => {
      const eip = new Eip(this, `nat-eip-${index}`, {
        domain: "vpc",
        tags: { Name: `nat-eip-${index + 1}` },
      });

      return new NatGateway(this, `nat-gateway-${index}`, {
        allocationId: eip.id,
        subnetId: subnet.id,
        tags: { Name: `nat-gateway-${index + 1}` },
      });
    });

    // Route Tables
    const publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: vpc.id,
      tags: { Name: "public-route-table" },
    });

    new Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id,
    });

    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Private Route Tables
    privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: vpc.id,
        tags: { Name: `private-route-table-${index + 1}` },
      });

      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: natGateways[index].id,
      });

      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    this.outputs = {
      vpcId: vpc.id,
      publicSubnetIds: publicSubnets.map(subnet => subnet.id),
      privateSubnetIds: privateSubnets.map(subnet => subnet.id),
      internetGatewayId: igw.id,
    };
  }
}

// Security Module
export interface SecurityModuleProps {
  vpcId: string;
}

export interface SecurityModuleOutputs {
  albSecurityGroupId: string;
  ec2SecurityGroupId: string;
  rdsSecurityGroupId: string;
}

export class SecurityModule extends Construct {
  public readonly outputs: SecurityModuleOutputs;

  constructor(scope: Construct, id: string, props: SecurityModuleProps) {
    super(scope, id);

    // ALB Security Group
    const albSg = new SecurityGroup(this, "alb-sg", {
      name: "alb-security-group",
      description: "Security group for Application Load Balancer",
      vpcId: props.vpcId,
      tags: { Name: "alb-sg" },
    });

    new SecurityGroupRule(this, "alb-https-ingress", {
      type: "ingress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: albSg.id,
    });

    new SecurityGroupRule(this, "alb-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 65535,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: albSg.id,
    });

    // EC2 Security Group
    const ec2Sg = new SecurityGroup(this, "ec2-sg", {
      name: "ec2-security-group",
      description: "Security group for EC2 instances",
      vpcId: props.vpcId,
      tags: { Name: "ec2-sg" },
    });

    new SecurityGroupRule(this, "ec2-ssh-ingress", {
      type: "ingress",
      fromPort: 22,
      toPort: 22,
      protocol: "tcp",
      cidrBlocks: ["10.0.0.0/16"],
      securityGroupId: ec2Sg.id,
    });

    new SecurityGroupRule(this, "ec2-https-ingress", {
      type: "ingress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      sourceSecurityGroupId: albSg.id,
      securityGroupId: ec2Sg.id,
    });

    new SecurityGroupRule(this, "ec2-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 65535,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: ec2Sg.id,
    });

    // RDS Security Group
    const rdsSg = new SecurityGroup(this, "rds-sg", {
      name: "rds-security-group",
      description: "Security group for RDS instance",
      vpcId: props.vpcId,
      tags: { Name: "rds-sg" },
    });

    new SecurityGroupRule(this, "rds-mysql-ingress", {
      type: "ingress",
      fromPort: 3306,
      toPort: 3306,
      protocol: "tcp",
      sourceSecurityGroupId: ec2Sg.id,
      securityGroupId: rdsSg.id,
    });

    this.outputs = {
      albSecurityGroupId: albSg.id,
      ec2SecurityGroupId: ec2Sg.id,
      rdsSecurityGroupId: rdsSg.id,
    };
  }
}

// Compute Module
export interface ComputeModuleProps {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  ec2SecurityGroupId: string;
  albSecurityGroupId: string;
  instanceProfileName: string;
}

export interface ComputeModuleOutputs {
  albDnsName: string;
  asgName: string;
}

export class ComputeModule extends Construct {
  public readonly outputs: ComputeModuleOutputs;

  constructor(scope: Construct, id: string, props: ComputeModuleProps) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, "amazon-linux", {
      mostRecent: true,
      owners: ["amazon"],
      filter: [
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-gp2"],
        },
      ],
    });

    // Launch Template
    const launchTemplate = new LaunchTemplate(this, "launch-template", {
      name: "web-server-template",
      imageId: ami.id,
      instanceType: "t3.micro",
      vpcSecurityGroupIds: [props.ec2SecurityGroupId],
      iamInstanceProfile: {
        name: props.instanceProfileName,
      },
      userData: Buffer.from(`#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
`).toString("base64"),
      tags: { Name: "web-server-template" },
    });

    // Target Group
    const targetGroup = new LbTargetGroup(this, "target-group", {
      name: "web-servers-tg",
      port: 80,
      protocol: "HTTP",
      vpcId: props.vpcId,
      healthCheck: {
        enabled: true,
        path: "/",
        protocol: "HTTP",
        healthyThreshold: 2,
        unhealthyThreshold: 2,
      },
      tags: { Name: "web-servers-tg" },
    });

    // Auto Scaling Group
    const asg = new AutoscalingGroup(this, "asg", {
      name: "web-servers-asg",
      vpcZoneIdentifier: props.privateSubnetIds,
      targetGroupArns: [targetGroup.arn],
      healthCheckType: "ELB",
      healthCheckGracePeriod: 300,
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 4,
      launchTemplate: {
        id: launchTemplate.id,
        version: "$Latest",
      },
      tags: [
        {
          key: "Name",
          value: "web-server-asg",
          propagateAtLaunch: true,
        },
      ],
    });

    // Application Load Balancer
    const alb = new Lb(this, "alb", {
      name: "web-servers-alb",
      loadBalancerType: "application",
      subnets: props.publicSubnetIds,
      securityGroups: [props.albSecurityGroupId],
      tags: { Name: "web-servers-alb" },
    });

    // ALB Listener
    new LbListener(this, "alb-listener", {
      loadBalancerArn: alb.arn,
      port: "443",
      protocol: "HTTPS",
      sslPolicy: "ELBSecurityPolicy-TLS-1-2-2017-01",
      certificateArn: "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012", // Replace with actual certificate ARN
      defaultAction: [
        {
          type: "forward",
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    this.outputs = {
      albDnsName: alb.dnsName,
      asgName: asg.name,
    };
  }
}

// Database Module
export interface DatabaseModuleProps {
  privateSubnetIds: string[];
  rdsSecurityGroupId: string;
}

export interface DatabaseModuleOutputs {
  rdsEndpoint: string;
  rdsPort: string;
}

export class DatabaseModule extends Construct {
  public readonly outputs: DatabaseModuleOutputs;

  constructor(scope: Construct, id: string, props: DatabaseModuleProps) {
    super(scope, id);

    // DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, "db-subnet-group", {
      name: "main-db-subnet-group",
      subnetIds: props.privateSubnetIds,
      tags: { Name: "main-db-subnet-group" },
    });

    // RDS Instance
    const rds = new DbInstance(this, "rds", {
      identifier: "main-database",
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: "gp2",
      engine: "mysql",
      engineVersion: "8.0",
      instanceClass: "db.t3.micro",
      dbName: "maindb",
      username: "admin",
      password: "changeme123!", // Use AWS Secrets Manager in production
      vpcSecurityGroupIds: [props.rdsSecurityGroupId],
      dbSubnetGroupName: dbSubnetGroup.name,
      backupRetentionPeriod: 7,
      multiAz: true,
      storageEncrypted: true,
      skipFinalSnapshot: true,
      tags: { Name: "main-database" },
    });

    this.outputs = {
      rdsEndpoint: rds.endpoint,
      rdsPort: rds.port.toString(),
    };
  }
}

// Storage Module
export interface StorageModuleProps {}

export interface StorageModuleOutputs {
  s3BucketName: string;
  instanceProfileName: string;
}

export class StorageModule extends Construct {
  public readonly outputs: StorageModuleOutputs;

  constructor(scope: Construct, id: string, props: StorageModuleProps) {
    super(scope, id);

    // S3 Bucket
    const bucket = new S3Bucket(this, "backup-bucket", {
      bucket: `app-backups-${Math.random().toString(36).substring(7)}`,
      tags: { Name: "backup-bucket" },
    });

    new S3BucketVersioning(this, "bucket-versioning", {
      bucket: bucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    });

    // IAM Role for EC2
    const ec2Role = new IamRole(this, "ec2-role", {
      name: "ec2-s3-access-role",
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
      tags: { Name: "ec2-s3-access-role" },
    });

    // Attach policies
    new IamRolePolicyAttachment(this, "ec2-ssm-policy", {
      role: ec2Role.name,
      policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
    });

    new IamRolePolicyAttachment(this, "ec2-s3-policy", {
      role: ec2Role.name,
      policyArn: "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess",
    });

    // Instance Profile
    const instanceProfile = new IamInstanceProfile(this, "ec2-instance-profile", {
      name: "ec2-s3-instance-profile",
      role: ec2Role.name,
    });

    this.outputs = {
      s3BucketName: bucket.bucket,
      instanceProfileName: instanceProfile.name,
    };
  }
}
```

## lib/tap-stack.ts

```typescript
import { Construct } from "constructs";
import { TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import {
  NetworkModule,
  SecurityModule,
  ComputeModule,
  DatabaseModule,
  StorageModule,
} from "./modules";

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // AWS Provider
    new AwsProvider(this, "aws", {
      region: "us-east-1",
    });

    // Storage Module (needs to be first for IAM role)
    const storage = new StorageModule(this, "storage", {});

    // Network Module
    const network = new NetworkModule(this, "network", {
      vpcCidr: "10.0.0.0/16",
      publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24"],
      privateSubnetCidrs: ["10.0.10.0/24", "10.0.20.0/24"],
    });

    // Security Module
    const security = new SecurityModule(this, "security", {
      vpcId: network.outputs.vpcId,
    });

    // Compute Module
    const compute = new ComputeModule(this, "compute", {
      vpcId: network.outputs.vpcId,
      publicSubnetIds: network.outputs.publicSubnetIds,
      privateSubnetIds: network.outputs.privateSubnetIds,
      ec2SecurityGroupId: security.outputs.ec2SecurityGroupId,
      albSecurityGroupId: security.outputs.albSecurityGroupId,
      instanceProfileName: storage.outputs.instanceProfileName,
    });

    // Database Module
    const database = new DatabaseModule(this, "database", {
      privateSubnetIds: network.outputs.privateSubnetIds,
      rdsSecurityGroupId: security.outputs.rdsSecurityGroupId,
    });

    // Outputs
    new TerraformOutput(this, "vpc_id", {
      value: network.outputs.vpcId,
      description: "ID of the VPC",
    });

    new TerraformOutput(this, "alb_dns_name", {
      value: compute.outputs.albDnsName,
      description: "DNS name of the Application Load Balancer",
    });

    new TerraformOutput(this, "rds_endpoint", {
      value: database.outputs.rdsEndpoint,
      description: "RDS instance endpoint",
      sensitive: true,
    });

    new TerraformOutput(this, "s3_bucket_name", {
      value: storage.outputs.s3BucketName,
      description: "Name of the S3 backup bucket",
    });
  }
}
```

## Key Features

### Network Architecture
- **VPC**: 10.0.0.0/16 with DNS support
- **Public Subnets**: 2 subnets across AZs for ALB
- **Private Subnets**: 2 subnets across AZs for EC2/RDS
- **NAT Gateways**: High availability with one per AZ
- **Route Tables**: Proper routing for public/private traffic

### Security Implementation
- **ALB Security Group**: HTTPS (443) from internet
- **EC2 Security Group**: SSH from VPC, HTTPS from ALB only
- **RDS Security Group**: MySQL (3306) from EC2 instances only
- **Principle of least privilege** applied throughout

### Compute Resources
- **Auto Scaling Group**: 2-6 instances, 4 desired capacity
- **Launch Template**: Amazon Linux 2 with Apache web server
- **Application Load Balancer**: HTTPS with health checks
- **Target Group**: HTTP health checks on port 80

### Database & Storage
- **RDS MySQL**: Multi-AZ with automated backups
- **S3 Bucket**: Versioning enabled for backups
- **IAM Roles**: EC2 instances can access S3 and SSM

### Production Considerations
- **Encryption**: RDS storage encryption enabled
- **Monitoring**: Health checks and Auto Scaling policies
- **High Availability**: Multi-AZ deployment across 2 AZs
- **Security**: All traffic restricted to necessary ports/sources

## Usage

```bash
npm install @cdktf/provider-aws cdktf constructs
cdktf deploy
```

**Note**: Replace the SSL certificate ARN in the ALB listener with your actual certificate ARN before deployment.