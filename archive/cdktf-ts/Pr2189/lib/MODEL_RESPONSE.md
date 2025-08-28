## Project Structure

```
├── cdktf.json
├── package.json
├── tsconfig.json
├── main.ts
└── lib/
    ├── tap-stack.ts
    └── modules.ts
```

## Configuration Files

### `package.json`
```json
{
  "name": "scalable-web-app-cdktf",
  "version": "1.0.0",
  "main": "main.js",
  "types": "main.ts",
  "scripts": {
    "get": "cdktf get",
    "build": "tsc",
    "synth": "cdktf synth",
    "compile": "tsc --pretty",
    "watch": "tsc -w",
    "test": "jest",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy"
  },
  "devDependencies": {
    "@types/jest": "^29.5.5",
    "@types/node": "^20.6.2",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "typescript": "^5.2.2"
  },
  "dependencies": {
    "@cdktf/aws-cdk": "^19.0.0",
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.19.0",
    "constructs": "^10.3.0"
  }
}
```

### `cdktf.json`
```json
{
  "language": "typescript",
  "app": "npx ts-node main.ts",
  "projectId": "scalable-web-app",
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

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "alwaysStrict": true,
    "declaration": true,
    "experimentalDecorators": true,
    "inlineSourceMap": true,
    "inlineSources": true,
    "lib": ["es2020"],
    "module": "CommonJS",
    "moduleResolution": "node",
    "noEmitOnError": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "resolveJsonModule": true,
    "strict": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,
    "stripInternal": true,
    "target": "ES2020",
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

### `main.ts`
```typescript
import { App } from "cdktf";
import { TapStack } from "./lib/tap-stack";

const app = new App();
new TapStack(app, "scalable-web-app-stack");
app.synth();
```

## Core Implementation Files

### `lib/modules.ts`
```typescript
import { Construct } from "constructs";
import {
  AwsProvider,
  Vpc,
  Subnet,
  InternetGateway,
  RouteTable,
  Route,
  RouteTableAssociation,
  NatGateway,
  Eip,
  SecurityGroup,
  S3Bucket,
  S3BucketWebsiteConfiguration,
  S3BucketPublicAccessBlock,
  S3BucketPolicy,
  IamRole,
  IamRolePolicyAttachment,
  IamInstanceProfile,
  LaunchTemplate,
  AutoscalingGroup,
  ApplicationLoadBalancer,
  LbTargetGroup,
  LbListener,
  DataAwsAvailabilityZones,
  DataAwsAmiIds,
  DataAwsIamPolicyDocument
} from "@cdktf/provider-aws";

export interface VpcModuleProps {
  cidrBlock: string;
  availabilityZones: string[];
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
}

export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly natGateways: NatGateway[];

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    // Create VPC
    this.vpc = new Vpc(this, "vpc", {
      cidrBlock: props.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${id}-vpc`,
        Environment: "production"
      }
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${id}-igw`
      }
    });

    // Create public subnets
    this.publicSubnets = props.publicSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: props.availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${id}-public-subnet-${index + 1}`,
          Type: "public"
        }
      });
    });

    // Create private subnets
    this.privateSubnets = props.privateSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: props.availabilityZones[index],
        tags: {
          Name: `${id}-private-subnet-${index + 1}`,
          Type: "private"
        }
      });
    });

    // Create Elastic IPs for NAT Gateways
    const eips = this.publicSubnets.map((_, index) => {
      return new Eip(this, `nat-eip-${index}`, {
        domain: "vpc",
        tags: {
          Name: `${id}-nat-eip-${index + 1}`
        }
      });
    });

    // Create NAT Gateways
    this.natGateways = this.publicSubnets.map((subnet, index) => {
      return new NatGateway(this, `nat-gateway-${index}`, {
        allocationId: eips[index].id,
        subnetId: subnet.id,
        tags: {
          Name: `${id}-nat-gateway-${index + 1}`
        }
      });
    });

    // Create public route table
    const publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${id}-public-rt`
      }
    });

    // Add route to internet gateway
    new Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id
      });
    });

    // Create private route tables and associate with NAT gateways
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          Name: `${id}-private-rt-${index + 1}`
        }
      });

      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: this.natGateways[index].id
      });

      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id
      });
    });
  }
}

export interface S3ModuleProps {
  bucketName: string;
}

export class S3Module extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, id: string, props: S3ModuleProps) {
    super(scope, id);

    // Create S3 bucket
    this.bucket = new S3Bucket(this, "bucket", {
      bucket: props.bucketName,
      tags: {
        Name: props.bucketName,
        Purpose: "static-website-hosting"
      }
    });

    // Configure bucket for static website hosting
    new S3BucketWebsiteConfiguration(this, "website-config", {
      bucket: this.bucket.id,
      indexDocument: {
        suffix: "index.html"
      },
      errorDocument: {
        key: "error.html"
      }
    });

    // Configure public access block (allow public read for static website)
    new S3BucketPublicAccessBlock(this, "public-access-block", {
      bucket: this.bucket.id,
      blockPublicAcls: false,
      blockPublicPolicy: false,
      ignorePublicAcls: false,
      restrictPublicBuckets: false
    });

    // Create bucket policy for public read access
    const bucketPolicyDocument = new DataAwsIamPolicyDocument(this, "bucket-policy-document", {
      statement: [
        {
          sid: "PublicReadGetObject",
          effect: "Allow",
          principals: [
            {
              type: "*",
              identifiers: ["*"]
            }
          ],
          actions: ["s3:GetObject"],
          resources: [`${this.bucket.arn}/*`]
        }
      ]
    });

    new S3BucketPolicy(this, "bucket-policy", {
      bucket: this.bucket.id,
      policy: bucketPolicyDocument.json
    });
  }
}

export interface IamModuleProps {
  roleName: string;
}

export class IamModule extends Construct {
  public readonly instanceRole: IamRole;
  public readonly instanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, props: IamModuleProps) {
    super(scope, id);

    // Create assume role policy document
    const assumeRolePolicyDocument = new DataAwsIamPolicyDocument(this, "assume-role-policy", {
      statement: [
        {
          actions: ["sts:AssumeRole"],
          effect: "Allow",
          principals: [
            {
              type: "Service",
              identifiers: ["ec2.amazonaws.com"]
            }
          ]
        }
      ]
    });

    // Create IAM role for EC2 instances
    this.instanceRole = new IamRole(this, "instance-role", {
      name: props.roleName,
      assumeRolePolicy: assumeRolePolicyDocument.json,
      tags: {
        Name: props.roleName,
        Purpose: "ec2-web-server-role"
      }
    });

    // Attach necessary policies
    new IamRolePolicyAttachment(this, "ssm-policy-attachment", {
      role: this.instanceRole.name,
      policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
    });

    new IamRolePolicyAttachment(this, "cloudwatch-policy-attachment", {
      role: this.instanceRole.name,
      policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
    });

    // Create instance profile
    this.instanceProfile = new IamInstanceProfile(this, "instance-profile", {
      name: `${props.roleName}-profile`,
      role: this.instanceRole.name
    });
  }
}

export interface AutoScalingModuleProps {
  vpcId: string;
  privateSubnetIds: string[];
  publicSubnetIds: string[];
  instanceProfile: IamInstanceProfile;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
}

export class AutoScalingModule extends Construct {
  public readonly loadBalancer: ApplicationLoadBalancer;
  public readonly autoScalingGroup: AutoscalingGroup;

  constructor(scope: Construct, id: string, props: AutoScalingModuleProps) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const amiData = new DataAwsAmiIds(this, "amazon-linux-ami", {
      owners: ["amazon"],
      filters: [
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-gp2"]
        },
        {
          name: "state",
          values: ["available"]
        }
      ],
      sortAscending: false
    });

    // Create security group for ALB
    const albSecurityGroup = new SecurityGroup(this, "alb-sg", {
      name: `${id}-alb-sg`,
      description: "Security group for Application Load Balancer",
      vpcId: props.vpcId,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"]
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"]
        }
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"]
        }
      ],
      tags: {
        Name: `${id}-alb-sg`
      }
    });

    // Create security group for EC2 instances
    const instanceSecurityGroup = new SecurityGroup(this, "instance-sg", {
      name: `${id}-instance-sg`,
      description: "Security group for EC2 instances",
      vpcId: props.vpcId,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          securityGroups: [albSecurityGroup.id]
        }
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"]
        }
      ],
      tags: {
        Name: `${id}-instance-sg`
      }
    });

    // User data script for web server setup
    const userData = `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
echo "<h1>Error Page</h1>" > /var/www/html/error.html
`;

    // Create launch template
    const launchTemplate = new LaunchTemplate(this, "launch-template", {
      name: `${id}-launch-template`,
      imageId: amiData.ids.get(0),
      instanceType: "t3.micro",
      iamInstanceProfile: {
        name: props.instanceProfile.name
      },
      vpcSecurityGroupIds: [instanceSecurityGroup.id],
      userData: Buffer.from(userData).toString('base64'),
      tagSpecifications: [
        {
          resourceType: "instance",
          tags: {
            Name: `${id}-web-server`,
            Environment: "production"
          }
        }
      ]
    });

    // Create Application Load Balancer
    this.loadBalancer = new ApplicationLoadBalancer(this, "alb", {
      name: `${id}-alb`,
      loadBalancerType: "application",
      securityGroups: [albSecurityGroup.id],
      subnets: props.publicSubnetIds,
      enableDeletionProtection: false,
      tags: {
        Name: `${id}-alb`
      }
    });

    // Create target group
    const targetGroup = new LbTargetGroup(this, "target-group", {
      name: `${id}-tg`,
      port: 80,
      protocol: "HTTP",
      vpcId: props.vpcId,
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        path: "/",
        matcher: "200"
      },
      tags: {
        Name: `${id}-target-group`
      }
    });

    // Create ALB listener
    new LbListener(this, "alb-listener", {
      loadBalancerArn: this.loadBalancer.arn,
      port: "80",
      protocol: "HTTP",
      defaultAction: [
        {
          type: "forward",
          targetGroupArn: targetGroup.arn
        }
      ]
    });

    // Create Auto Scaling Group
    this.autoScalingGroup = new AutoscalingGroup(this, "asg", {
      name: `${id}-asg`,
      minSize: props.minSize,
      maxSize: props.maxSize,
      desiredCapacity: props.desiredCapacity,
      vpcZoneIdentifier: props.privateSubnetIds,
      targetGroupArns: [targetGroup.arn],
      healthCheckType: "ELB",
      healthCheckGracePeriod: 300,
      launchTemplate: {
        id: launchTemplate.id,
        version: "$Latest"
      },
      tag: [
        {
          key: "Name",
          value: `${id}-asg`,
          propagateAtLaunch: false
        }
      ]
    });
  }
}
```

### `lib/tap-stack.ts`
```typescript
import { Construct } from "constructs";
import { TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider, DataAwsAvailabilityZones } from "@cdktf/provider-aws";
import { VpcModule, S3Module, IamModule, AutoScalingModule } from "./modules";

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS Provider
    new AwsProvider(this, "aws", {
      region: "us-west-2",
      defaultTags: [
        {
          tags: {
            Project: "ScalableWebApp",
            ManagedBy: "CDKTF",
            Environment: "production"
          }
        }
      ]
    });

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, "azs", {
      state: "available"
    });

    // Define the availability zones to use (first 3 available)
    const availabilityZones = [
      azs.names.get(0),
      azs.names.get(1),
      azs.names.get(2)
    ];

    // Create VPC with public and private subnets
    const vpc = new VpcModule(this, "main-vpc", {
      cidrBlock: "10.0.0.0/16",
      availabilityZones,
      publicSubnetCidrs: [
        "10.0.1.0/24",
        "10.0.2.0/24",
        "10.0.3.0/24"
      ],
      privateSubnetCidrs: [
        "10.0.11.0/24",
        "10.0.12.0/24",
        "10.0.13.0/24"
      ]
    });

    // Create S3 bucket for static website hosting
    const s3 = new S3Module(this, "static-assets", {
      bucketName: `scalable-web-app-assets-${Date.now()}`
    });

    // Create IAM roles and policies
    const iam = new IamModule(this, "web-app-iam", {
      roleName: "WebAppInstanceRole"
    });

    // Create Auto Scaling Group with Load Balancer
    const autoScaling = new AutoScalingModule(this, "web-app-asg", {
      vpcId: vpc.vpc.id,
      privateSubnetIds: vpc.privateSubnets.map(subnet => subnet.id),
      publicSubnetIds: vpc.publicSubnets.map(subnet => subnet.id),
      instanceProfile: iam.instanceProfile,
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 3
    });

    // Outputs
    new TerraformOutput(this, "vpc-id", {
      value: vpc.vpc.id,
      description: "ID of the VPC"
    });

    new TerraformOutput(this, "s3-bucket-name", {
      value: s3.bucket.id,
      description: "Name of the S3 bucket for static assets"
    });

    new TerraformOutput(this, "s3-website-endpoint", {
      value: s3.bucket.websiteEndpoint,
      description: "S3 static website endpoint"
    });

    new TerraformOutput(this, "load-balancer-dns", {
      value: autoScaling.loadBalancer.dnsName,
      description: "DNS name of the Application Load Balancer"
    });

    new TerraformOutput(this, "load-balancer-url", {
      value: `http://${autoScaling.loadBalancer.dnsName}`,
      description: "URL of the web application"
    });

    new TerraformOutput(this, "auto-scaling-group-arn", {
      value: autoScaling.autoScalingGroup.arn,
      description: "ARN of the Auto Scaling Group"
    });
  }
}
```

## Deployment Instructions

1. **Initialize the project:**
```bash
npm install
cdktf get
```

2. **Build the project:**
```bash
npm run build
```

3. **Synthesize the Terraform configuration:**
```bash
cdktf synth
```

4. **Deploy the infrastructure:**
```bash
cdktf deploy
```

5. **Clean up (when needed):**
```bash
cdktf destroy
```

## Architecture Overview

This CDKTF project creates a highly available and scalable web application infrastructure with the following components:

### **VPC Module (`VpcModule`)**
- Creates a VPC with DNS support enabled
- Provisions 3 public and 3 private subnets across multiple AZs
- Sets up Internet Gateway for public internet access
- Creates NAT Gateways in each public subnet for private subnet internet access
- Configures route tables and associations

### **S3 Module (`S3Module`)**
- Creates an S3 bucket configured for static website hosting
- Sets up bucket policy for public read access
- Configures index and error documents

### **IAM Module (`IamModule`)**
- Creates IAM role for EC2 instances with necessary permissions
- Attaches AWS managed policies for SSM and CloudWatch
- Creates instance profile for EC2 instances

### **Auto Scaling Module (`AutoScalingModule`)**
- Creates Application Load Balancer in public subnets
- Sets up security groups for ALB and EC2 instances
- Creates launch template with Amazon Linux 2 AMI
- Configures Auto Scaling Group with health checks
- Sets up target group and listener for load balancing

### **Key Features:**
- **High Availability**: Resources deployed across multiple AZs
- **Scalability**: Auto Scaling Group automatically adjusts capacity (2-6 instances)
- **Security**: IAM roles, security groups, and private subnets
- **Monitoring**: CloudWatch integration through IAM policies
- **Load Balancing**: Application Load Balancer distributes traffic

The infrastructure follows AWS best practices and provides a solid foundation for a production web application.