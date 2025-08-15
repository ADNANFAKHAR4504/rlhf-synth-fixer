I'll provide you with a complete CDKTF TypeScript project that meets all your requirements. This will be organized into multiple files for better maintainability and reusability.

## Project Structure

```
production-infrastructure/
├── main.ts
├── package.json
├── tsconfig.json
├── cdktf.json
├── constructs/
│   ├── vpc-construct.ts
│   ├── security-construct.ts
│   ├── compute-construct.ts
│   ├── storage-construct.ts
│   └── database-construct.ts
└── stacks/
    └── production-stack.ts
```

## Core Configuration Files

### `package.json`

```json
{
  "name": "production-infrastructure",
  "version": "1.0.0",
  "description": "Production AWS Infrastructure using CDKTF",
  "main": "main.ts",
  "scripts": {
    "build": "tsc",
    "synth": "cdktf synth",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy",
    "get": "cdktf get"
  },
  "dependencies": {
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.20.0",
    "constructs": "^10.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
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
    "outDir": "./dist",
    "rootDir": "./",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist", ".gen"]
}
```

### `cdktf.json`

```json
{
  "language": "typescript",
  "app": "npx ts-node main.ts",
  "projectId": "production-infrastructure",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## Main Entry Point

### `main.ts`

```typescript
import { App } from "cdktf";
import { ProductionStack } from "./stacks/production-stack";

const app = new App();
new ProductionStack(app, "production-infrastructure");
app.synth();
```

## Stack Definition

### `stacks/production-stack.ts`

```typescript
import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { VpcConstruct } from "../constructs/vpc-construct";
import { SecurityConstruct } from "../constructs/security-construct";
import { ComputeConstruct } from "../constructs/compute-construct";
import { StorageConstruct } from "../constructs/storage-construct";
import { DatabaseConstruct } from "../constructs/database-construct";

export class ProductionStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);


    // AWS Provider configuration
    new AwsProvider(this, "aws", {
      region: "us-west-2",
      defaultTags: [
        {
          tags: {
            Environment: "production",
            Project: "production-infrastructure",
            ManagedBy: "cdktf"
          }
        }
      ]
    });

    // VPC Infrastructure
    const vpc = new VpcConstruct(this, "vpc");

    // Security Infrastructure
    const security = new SecurityConstruct(this, "security", {
      vpcId: vpc.vpcId,
      publicSubnetIds: vpc.publicSubnetIds,
      privateSubnetIds: vpc.privateSubnetIds
    });

    // Storage Infrastructure
    const storage = new StorageConstruct(this, "storage");

    // Database Infrastructure
    const database = new DatabaseConstruct(this, "database", {
      vpcId: vpc.vpcId,
      privateSubnetIds: vpc.privateSubnetIds,
      securityGroupId: security.rdsSecurityGroupId
    });

    // Compute Infrastructure
    new ComputeConstruct(this, "compute", {
      vpcId: vpc.vpcId,
      publicSubnetIds: vpc.publicSubnetIds,
      privateSubnetIds: vpc.privateSubnetIds,
      securityGroupId: security.ec2SecurityGroupId,
      instanceProfile: security.instanceProfile,
      loadBalancerSecurityGroupId: security.loadBalancerSecurityGroupId
    });
  }
}
```

## Construct Definitions

### `constructs/vpc-construct.ts`

```typescript
import { Construct } from "constructs";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { Route } from "@cdktf/provider-aws/lib/route";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { NetworkAcl } from "@cdktf/provider-aws/lib/network-acl";
import { NetworkAclRule } from "@cdktf/provider-aws/lib/network-acl-rule";
import { NetworkAclAssociation } from "@cdktf/provider-aws/lib/network-acl-association";

export class VpcConstruct extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // VPC
    const vpc = new Vpc(this, "vpc", {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: "production-vpc",
        Environment: "production"
      }
    });

    this.vpcId = vpc.id;

    // Internet Gateway
    const igw = new InternetGateway(this, "igw", {
      vpcId: vpc.id,
      tags: {
        Name: "production-igw",
        Environment: "production"
      }
    });

    // Public Subnets
    const publicSubnets = [
      new Subnet(this, "public-subnet-1", {
        vpcId: vpc.id,
        cidrBlock: "10.0.1.0/24",
        availabilityZone: "us-west-2a",
        mapPublicIpOnLaunch: true,
        tags: {
          Name: "production-public-subnet-1",
          Environment: "production",
          Type: "public"
        }
      }),
      new Subnet(this, "public-subnet-2", {
        vpcId: vpc.id,
        cidrBlock: "10.0.2.0/24",
        availabilityZone: "us-west-2b",
        mapPublicIpOnLaunch: true,
        tags: {
          Name: "production-public-subnet-2",
          Environment: "production",
          Type: "public"
        }
      }),
      new Subnet(this, "public-subnet-3", {
        vpcId: vpc.id,
        cidrBlock: "10.0.3.0/24",
        availabilityZone: "us-west-2c",
        mapPublicIpOnLaunch: true,
        tags: {
          Name: "production-public-subnet-3",
          Environment: "production",
          Type: "public"
        }
      })
    ];

    // Private Subnets
    const privateSubnets = [
      new Subnet(this, "private-subnet-1", {
        vpcId: vpc.id,
        cidrBlock: "10.0.11.0/24",
        availabilityZone: "us-west-2a",
        tags: {
          Name: "production-private-subnet-1",
          Environment: "production",
          Type: "private"
        }
      }),
      new Subnet(this, "private-subnet-2", {
        vpcId: vpc.id,
        cidrBlock: "10.0.12.0/24",
        availabilityZone: "us-west-2b",
        tags: {
          Name: "production-private-subnet-2",
          Environment: "production",
          Type: "private"
        }
      }),
      new Subnet(this, "private-subnet-3", {
        vpcId: vpc.id,
        cidrBlock: "10.0.13.0/24",
        availabilityZone: "us-west-2c",
        tags: {
          Name: "production-private-subnet-3",
          Environment: "production",
          Type: "private"
        }
      })
    ];

    this.publicSubnetIds = publicSubnets.map(subnet => subnet.id);
    this.privateSubnetIds = privateSubnets.map(subnet => subnet.id);

    // NAT Gateways
    const natEips = publicSubnets.map((subnet, index) => 
      new Eip(this, `nat-eip-${index + 1}`, {
        domain: "vpc",
        tags: {
          Name: `production-nat-eip-${index + 1}`,
          Environment: "production"
        }
      })
    );

    const natGateways = publicSubnets.map((subnet, index) =>
      new NatGateway(this, `nat-gateway-${index + 1}`, {
        allocationId: natEips[index].id,
        subnetId: subnet.id,
        tags: {
          Name: `production-nat-gateway-${index + 1}`,
          Environment: "production"
        }
      })
    );

    // Public Route Table
    const publicRouteTable = new RouteTable(this, "public-route-table", {
      vpcId: vpc.id,
      tags: {
        Name: "production-public-route-table",
        Environment: "production"
      }
    });

    new Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-route-association-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id
      });
    });

    // Private Route Tables
    privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-route-table-${index + 1}`, {
        vpcId: vpc.id,
        tags: {
          Name: `production-private-route-table-${index + 1}`,
          Environment: "production"
        }
      });

      new Route(this, `private-route-${index + 1}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: natGateways[index].id
      });

      new RouteTableAssociation(this, `private-route-association-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id
      });
    });

    // Network ACLs - Only allow ports 443 and 22
    const networkAcl = new NetworkAcl(this, "production-nacl", {
      vpcId: vpc.id,
      tags: {
        Name: "production-nacl",
        Environment: "production"
      }
    });

    // Inbound rules
    new NetworkAclRule(this, "nacl-inbound-ssh", {
      networkAclId: networkAcl.id,
      ruleNumber: 100,
      protocol: "tcp",
      ruleAction: "allow",
      fromPort: 22,
      toPort: 22,
      cidrBlock: "0.0.0.0/0"
    });

    new NetworkAclRule(this, "nacl-inbound-https", {
      networkAclId: networkAcl.id,
      ruleNumber: 110,
      protocol: "tcp",
      ruleAction: "allow",
      fromPort: 443,
      toPort: 443,
      cidrBlock: "0.0.0.0/0"
    });

    // Outbound rules
    new NetworkAclRule(this, "nacl-outbound-ssh", {
      networkAclId: networkAcl.id,
      ruleNumber: 100,
      protocol: "tcp",
      ruleAction: "allow",
      fromPort: 22,
      toPort: 22,
      cidrBlock: "0.0.0.0/0",
      egress: true
    });

    new NetworkAclRule(this, "nacl-outbound-https", {
      networkAclId: networkAcl.id,
      ruleNumber: 110,
      protocol: "tcp",
      ruleAction: "allow",
      fromPort: 443,
      toPort: 443,
      cidrBlock: "0.0.0.0/0",
      egress: true
    });

    // Associate Network ACL with subnets
    [...publicSubnets, ...privateSubnets].forEach((subnet, index) => {
      new NetworkAclAssociation(this, `nacl-association-${index + 1}`, {
        networkAclId: networkAcl.id,
        subnetId: subnet.id
      });
    });
  }
}
```

### `constructs/security-construct.ts`

```typescript
import { Construct } from "constructs";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { SecurityGroupRule } from "@cdktf/provider-aws/lib/security-group-rule";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamInstanceProfile } from "@cdktf/provider-aws/lib/iam-instance-profile";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";

interface SecurityConstructProps {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
}

export class SecurityConstruct extends Construct {
  public readonly ec2SecurityGroupId: string;
  public readonly rdsSecurityGroupId: string;
  public readonly loadBalancerSecurityGroupId: string;
  public readonly instanceProfile: string;

  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    // Load Balancer Security Group
    const lbSecurityGroup = new SecurityGroup(this, "lb-security-group", {
      name: "production-lb-sg",
      description: "Security group for production load balancer",
      vpcId: props.vpcId,
      tags: {
        Name: "production-lb-sg",
        Environment: "production"
      }
    });

    new SecurityGroupRule(this, "lb-ingress-https", {
      type: "ingress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: lbSecurityGroup.id
    });

    new SecurityGroupRule(this, "lb-egress-all", {
      type: "egress",
      fromPort: 0,
      toPort: 65535,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: lbSecurityGroup.id
    });

    this.loadBalancerSecurityGroupId = lbSecurityGroup.id;

    // EC2 Security Group
    const ec2SecurityGroup = new SecurityGroup(this, "ec2-security-group", {
      name: "production-ec2-sg",
      description: "Security group for production EC2 instances",
      vpcId: props.vpcId,
      tags: {
        Name: "production-ec2-sg",
        Environment: "production"
      }
    });

    new SecurityGroupRule(this, "ec2-ingress-ssh", {
      type: "ingress",
      fromPort: 22,
      toPort: 22,
      protocol: "tcp",
      cidrBlocks: ["10.0.0.0/16"],
      securityGroupId: ec2SecurityGroup.id
    });

    new SecurityGroupRule(this, "ec2-ingress-https", {
      type: "ingress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      sourceSecurityGroupId: lbSecurityGroup.id,
      securityGroupId: ec2SecurityGroup.id
    });

    new SecurityGroupRule(this, "ec2-egress-all", {
      type: "egress",
      fromPort: 0,
      toPort: 65535,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: ec2SecurityGroup.id
    });

    this.ec2SecurityGroupId = ec2SecurityGroup.id;

    // RDS Security Group
    const rdsSecurityGroup = new SecurityGroup(this, "rds-security-group", {
      name: "production-rds-sg",
      description: "Security group for production RDS instances",
      vpcId: props.vpcId,
      tags: {
        Name: "production-rds-sg",
        Environment: "production"
      }
    });

    new SecurityGroupRule(this, "rds-ingress-mysql", {
      type: "ingress",
      fromPort: 3306,
      toPort: 3306,
      protocol: "tcp",
      sourceSecurityGroupId: ec2SecurityGroup.id,
      securityGroupId: rdsSecurityGroup.id
    });

    this.rdsSecurityGroupId = rdsSecurityGroup.id;

    // IAM Role for EC2 instances
    const ec2Role = new IamRole(this, "ec2-role", {
      name: "production-ec2-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "ec2.amazonaws.com"
            }
          }
        ]
      }),
      tags: {
        Name: "production-ec2-role",
        Environment: "production"
      }
    });

    // CloudWatch Logs Policy
    const cloudWatchLogsPolicy = new IamPolicy(this, "cloudwatch-logs-policy", {
      name: "production-cloudwatch-logs-policy",
      description: "Policy for EC2 instances to write to CloudWatch Logs",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "logs:DescribeLogStreams"
            ],
            Resource: "arn:aws:logs:us-west-2:*:*"
          },
          {
            Effect: "Allow",
            Action: [
              "cloudwatch:PutMetricData",
              "ec2:DescribeVolumes",
              "ec2:DescribeTags"
            ],
            Resource: "*"
          }
        ]
      }),
      tags: {
        Name: "production-cloudwatch-logs-policy",
        Environment: "production"
      }
    });

    // Attach policies to role
    new IamRolePolicyAttachment(this, "ec2-ssm-policy", {
      role: ec2Role.name,
      policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
    });

    new IamRolePolicyAttachment(this, "ec2-cloudwatch-policy", {
      role: ec2Role.name,
      policyArn: cloudWatchLogsPolicy.arn
    });

    // Instance Profile
    const instanceProfile = new IamInstanceProfile(this, "ec2-instance-profile", {
      name: "production-ec2-instance-profile",
      role: ec2Role.name,
      tags: {
        Name: "production-ec2-instance-profile",
        Environment: "production"
      }
    });

    this.instanceProfile = instanceProfile.name;
  }
}
```

### `constructs/compute-construct.ts`

```typescript
import { Construct } from "constructs";
import { LaunchTemplate } from "@cdktf/provider-aws/lib/launch-template";
import { AutoscalingGroup } from "@cdktf/provider-aws/lib/autoscaling-group";
import { Lb } from "@cdktf/provider-aws/lib/lb";
import { LbTargetGroup } from "@cdktf/provider-aws/lib/lb-target-group";
import { LbListener } from "@cdktf/provider-aws/lib/lb-listener";
import { AutoscalingAttachment } from "@cdktf/provider-aws/lib/autoscaling-attachment";
import { DataAwsAmi } from "@cdktf/provider-aws/lib/data-aws-ami";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";

interface ComputeConstructProps {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  securityGroupId: string;
  instanceProfile: string;
  loadBalancerSecurityGroupId: string;
}

export class ComputeConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    // CloudWatch Log Group for user data logs
    const logGroup = new CloudwatchLogGroup(this, "user-data-logs", {
      name: "/aws/ec2/production/user-data",
      retentionInDays: 30,
      tags: {
        Name: "production-user-data-logs",
        Environment: "production"
      }
    });

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, "amazon-linux", {
      mostRecent: true,
      owners: ["amazon"],
      filter: [
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-gp2"]
        },
        {
          name: "virtualization-type",
          values: ["hvm"]
        }
      ]
    });

    // User data script that logs to CloudWatch
    const userData = `#!/bin/bash
yum update -y
yum install -y awslogs

# Configure CloudWatch Logs agent
cat > /etc/awslogs/awslogs.conf << EOF
[general]
state_file = /var/lib/awslogs/agent-state

[/var/log/user-data.log]
file = /var/log/user-data.log
log_group_name = ${logGroup.name}
log_stream_name = {instance_id}/user-data
datetime_format = %b %d %H:%M:%S

[/var/log/messages]
file = /var/log/messages
log_group_name = ${logGroup.name}
log_stream_name = {instance_id}/messages
datetime_format = %b %d %H:%M:%S
EOF

# Configure CloudWatch Logs region
sed -i 's/us-east-1/us-west-2/g' /etc/awslogs/awscli.conf

# Start CloudWatch Logs agent
systemctl start awslogsd
systemctl enable awslogsd

# Log user data execution
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
echo "$(date): Starting user data script execution"

# Install and configure nginx
yum install -y nginx
systemctl start nginx
systemctl enable nginx

# Create a simple index page
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Production Server</title>
</head>
<body>
    <h1>Production Environment</h1>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
</body>
</html>
EOF

echo "$(date): User data script execution completed"
`;

    // Launch Template
    const launchTemplate = new LaunchTemplate(this, "launch-template", {
      name: "production-launch-template",
      description: "Launch template for production EC2 instances",
      imageId: ami.id,
      instanceType: "t3.micro",
      keyName: undefined, // No key pair for production security
      vpcSecurityGroupIds: [props.securityGroupId],
      userData: Buffer.from(userData).toString('base64'),
      iamInstanceProfile: {
        name: props.instanceProfile
      },
      monitoring: {
        enabled: true // Enable detailed CloudWatch monitoring
      },
      blockDeviceMappings: [
        {
          deviceName: "/dev/xvda",
          ebs: {
            volumeSize: 20,
            volumeType: "gp3",
            encrypted: true,
            deleteOnTermination: true
          }
        }
      ],
      tagSpecifications: [
        {
          resourceType: "instance",
          tags: {
            Name: "production-instance",
            Environment: "production",
            LaunchedBy: "autoscaling-group"
          }
        },
        {
          resourceType: "volume",
          tags: {
            Name: "production-instance-volume",
            Environment: "production"
          }
        }
      ],
      tags: {
        Name: "production-launch-template",
        Environment: "production"
      }
    });

    // Application Load Balancer
    const loadBalancer = new Lb(this, "load-balancer", {
      name: "production-alb",
      loadBalancerType: "application",
      internal: false,
      securityGroups: [props.loadBalancerSecurityGroupId],
      subnets: props.publicSubnetIds,
      enableDeletionProtection: false, // Set to true for production
      tags: {
        Name: "production-alb",
        Environment: "production"
      }
    });

    // Target Group
    const targetGroup = new LbTargetGroup(this, "target-group", {
      name: "production-tg",
      port: 80,
      protocol: "HTTP",
      vpcId: props.vpcId,
      targetType: "instance",
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        path: "/",
        matcher: "200",
        port: "traffic-port",
        protocol: "HTTP"
      },
      tags: {
        Name: "production-tg",
        Environment: "production"
      }
    });

    // Load Balancer Listener
    new LbListener(this, "lb-listener", {
      loadBalancerArn: loadBalancer.arn,
      port: "443",
      protocol: "HTTPS",
      sslPolicy: "ELBSecurityPolicy-TLS-1-2-2017-01",
      certificateArn: "arn:aws:acm:us-west-2:ACCOUNT_ID:certificate/CERTIFICATE_ID", // Replace with actual certificate ARN
      defaultAction: [
        {
          type: "forward",
          targetGroupArn: targetGroup.arn
        }
      ],
      tags: {
        Name: "production-lb-listener",
        Environment: "production"
      }
    });

    // Auto Scaling Group
    const autoScalingGroup = new AutoscalingGroup(this, "autoscaling-group", {
      name: "production-asg",
      minSize: 3,
      maxSize: 10,
      desiredCapacity: 3,
      vpcZoneIdentifier: props.privateSubnetIds,
      launchTemplate: {
        id: launchTemplate.id,
        version: "$Latest"
      },
      healthCheckType: "ELB",
      healthCheckGracePeriod: 300,
      defaultCooldown: 300,
      enabledMetrics: [
        "GroupMinSize",
        "GroupMaxSize",
        "GroupDesiredCapacity",
        "GroupInServiceInstances",
        "GroupTotalInstances"
      ],
      tag: [
        {
          key: "Name",
          value: "production-asg-instance",
          propagateAtLaunch: true
        },
        {
          key: "Environment",
          value: "production",
          propagateAtLaunch: true
        }
      ]
    });

    // Attach Auto Scaling Group to Target Group
    new AutoscalingAttachment(this, "asg-attachment", {
      autoscalingGroupName: autoScalingGroup.id,
      lbTargetGroupArn: targetGroup.arn
    });
  }
}
```

### `constructs/storage-construct.ts`

```typescript
import { Construct } from "constructs";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketServerSideEncryptionConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { S3BucketVersioning } from "@cdktf/provider-aws/lib/s3-bucket-versioning";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";

export class StorageConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Application Data Bucket
    const appDataBucket = new S3Bucket(this, "app-data-bucket", {
      bucket: "production-app-data-bucket",
      acl: "private",
      versioning: {
        enabled: true
      },
      serverSideEncryptionConfiguration: [
        {
          rule: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: "AES256"
              }
            }
          ]
        }
      ],
      tags: {
        Name: "production-app-data-bucket",
        Environment: "production"
      }
    });

    // Public Access Block
    new S3BucketPublicAccessBlock(this, "app-data-bucket-public-access-block", {
      bucket: appDataBucket.id,
      blockPublicAcls: true,
      ignorePublicAcls: true,
      blockPublicPolicy: true,
      restrictPublicBuckets: true
    });

    // Output the bucket name
    new TerraformOutput(this, "appDataBucketName", {
      value: appDataBucket.bucket,
      description: "The name of the application data S3 bucket"
    });
  }
}
```

### `constructs/database-construct.ts`

```typescript
import { Construct } from "constructs";
import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";

interface DatabaseConstructProps {
  vpcId: string;
  privateSubnetIds: string[];
  securityGroupId: string;
}

export class DatabaseConstruct extends Construct {
  public readonly dbInstanceId: string;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    const dbInstance = new DbInstance(this, "db-instance", {
      identifier: "production-db",
      engine: "mysql",
      instanceClass: "db.t3.micro",
      allocatedStorage: 20,
      username: "admin",
      password: "changeMe123!",
      dbName: "productiondb",
      vpcSecurityGroupIds: [props.securityGroupId],
      // dbSubnetGroupName: "your-subnet-group", // Add subnet group if needed
      skipFinalSnapshot: true,
      tags: {
        Name: "production-db",
        Environment: "production"
      }
    });

    this.dbInstanceId = dbInstance.id;
  }
}
```