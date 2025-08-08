'll create a comprehensive CDKTF configuration that meets all your requirements. Here's the complete solution with modular constructs:

Project Structure
├── main.ts
├── constructs/
│   ├── networking-construct.ts
│   ├── security-construct.ts
│   ├── iam-construct.ts
│   └── compute-construct.ts
└── types/
    └── common.ts
1. Common Types (types/common.ts)
export interface CommonTags {
  Project: string;
  Environment: string;
  Owner: string;
  [key: string]: string;
}

export interface BaseConstructProps {
  tags: CommonTags;
}
2. Networking Construct (constructs/networking-construct.ts)
import { Construct } from "constructs";
import {
  Vpc,
  Subnet,
  InternetGateway,
  RouteTable,
  Route,
  RouteTableAssociation,
  NatGateway,
  Eip,
} from "@cdktf/provider-aws/lib/vpc";
import { BaseConstructProps } from "../types/common";

export interface NetworkingConstructProps extends BaseConstructProps {
  vpcCidr?: string;
  availabilityZones?: string[];
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly natGateway: NatGateway;
  public readonly publicRouteTable: RouteTable;
  public readonly privateRouteTables: RouteTable[];

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    const vpcCidr = props.vpcCidr || "10.0.0.0/16";
    const availabilityZones = props.availabilityZones || [
      "us-east-1a",
      "us-east-1b",
      "us-east-1c",
    ];

    // Create VPC
    this.vpc = new Vpc(this, "vpc", {
      cidrBlock: vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: "main-vpc",
        ...props.tags,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        Name: "main-igw",
        ...props.tags,
      },
    });

    // Create public subnets
    this.publicSubnets = availabilityZones.map((az, index) => {
      return new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${index + 1}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-${az}`,
          Type: "Public",
          ...props.tags,
        },
      });
    });

    // Create private subnets
    this.privateSubnets = availabilityZones.map((az, index) => {
      return new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${index + 10}.0/24`,
        availabilityZone: az,
        tags: {
          Name: `private-subnet-${az}`,
          Type: "Private",
          ...props.tags,
        },
      });
    });

    // Create Elastic IP for NAT Gateway
    const natEip = new Eip(this, "nat-eip", {
      domain: "vpc",
      tags: {
        Name: "nat-gateway-eip",
        ...props.tags,
      },
    });

    // Create NAT Gateway in the first public subnet
    this.natGateway = new NatGateway(this, "nat-gateway", {
      allocationId: natEip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        Name: "main-nat-gateway",
        ...props.tags,
      },
    });

    // Create public route table
    this.publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        Name: "public-route-table",
        ...props.tags,
      },
    });

    // Create route to internet gateway for public subnets
    new Route(this, "public-route", {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: this.publicRouteTable.id,
      });
    });

    // Create private route tables (one per AZ for high availability)
    this.privateRouteTables = availabilityZones.map((az, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          Name: `private-route-table-${az}`,
          ...props.tags,
        },
      });

      // Create route to NAT gateway for private subnets
      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: this.natGateway.id,
      });

      // Associate private subnet with its route table
      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: this.privateSubnets[index].id,
        routeTableId: privateRouteTable.id,
      });

      return privateRouteTable;
    });
  }
}
3. Security Construct (constructs/security-construct.ts)
import { Construct } from "constructs";
import { SecurityGroup, SecurityGroupRule } from "@cdktf/provider-aws/lib/vpc";
import { BaseConstructProps } from "../types/common";

export interface SecurityConstructProps extends BaseConstructProps {
  vpcId: string;
  allowedCidrBlocks?: string[];
}

export class SecurityConstruct extends Construct {
  public readonly webSecurityGroup: SecurityGroup;
  public readonly sshSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    const allowedCidrBlocks = props.allowedCidrBlocks || ["203.0.113.0/24"];

    // Web Security Group (HTTP access)
    this.webSecurityGroup = new SecurityGroup(this, "web-sg", {
      name: "web-security-group",
      description: "Security group for web servers",
      vpcId: props.vpcId,
      tags: {
        Name: "web-security-group",
        ...props.tags,
      },
    });

    // SSH Security Group
    this.sshSecurityGroup = new SecurityGroup(this, "ssh-sg", {
      name: "ssh-security-group",
      description: "Security group for SSH access",
      vpcId: props.vpcId,
      tags: {
        Name: "ssh-security-group",
        ...props.tags,
      },
    });

    // HTTP ingress rules
    allowedCidrBlocks.forEach((cidr, index) => {
      new SecurityGroupRule(this, `web-ingress-http-${index}`, {
        type: "ingress",
        fromPort: 80,
        toPort: 80,
        protocol: "tcp",
        cidrBlocks: [cidr],
        securityGroupId: this.webSecurityGroup.id,
        description: `HTTP access from ${cidr}`,
      });
    });

    // SSH ingress rules
    allowedCidrBlocks.forEach((cidr, index) => {
      new SecurityGroupRule(this, `ssh-ingress-${index}`, {
        type: "ingress",
        fromPort: 22,
        toPort: 22,
        protocol: "tcp",
        cidrBlocks: [cidr],
        securityGroupId: this.sshSecurityGroup.id,
        description: `SSH access from ${cidr}`,
      });
    });

    // Egress rules (allow all outbound traffic)
    new SecurityGroupRule(this, "web-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 65535,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.webSecurityGroup.id,
      description: "All outbound traffic",
    });

    new SecurityGroupRule(this, "ssh-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 65535,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.sshSecurityGroup.id,
      description: "All outbound traffic",
    });

    // Allow HTTPS egress for package updates, etc.
    new SecurityGroupRule(this, "web-egress-https", {
      type: "egress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.webSecurityGroup.id,
      description: "HTTPS outbound traffic",
    });

    new SecurityGroupRule(this, "ssh-egress-https", {
      type: "egress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.sshSecurityGroup.id,
      description: "HTTPS outbound traffic",
    });
  }
}
4. IAM Construct (constructs/iam-construct.ts)
import { Construct } from "constructs";
import {
  IamRole,
  IamRolePolicyAttachment,
  IamInstanceProfile,
  IamPolicy,
} from "@cdktf/provider-aws/lib/iam";
import { BaseConstructProps } from "../types/common";

export interface IamConstructProps extends BaseConstructProps {
  s3BucketArns?: string[];
}

export class IamConstruct extends Construct {
  public readonly ec2Role: IamRole;
  public readonly ec2InstanceProfile: IamInstanceProfile;
  public readonly s3AccessPolicy: IamPolicy;

  constructor(scope: Construct, id: string, props: IamConstructProps) {
    super(scope, id);

    const s3BucketArns = props.s3BucketArns || ["arn:aws:s3:::*"];

    // EC2 assume role policy document
    const assumeRolePolicyDocument = JSON.stringify({
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
    });

    // Create EC2 IAM Role
    this.ec2Role = new IamRole(this, "ec2-role", {
      name: "ec2-s3-access-role",
      assumeRolePolicy: assumeRolePolicyDocument,
      description: "IAM role for EC2 instances to access S3",
      tags: {
        Name: "ec2-s3-access-role",
        ...props.tags,
      },
    });

    // S3 access policy document
    const s3PolicyDocument = JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:ListBucket",
          ],
          Resource: [
            ...s3BucketArns,
            ...s3BucketArns.map(arn => `${arn}/*`),
          ],
        },
        {
          Effect: "Allow",
          Action: ["s3:ListAllMyBuckets"],
          Resource: "*",
        },
      ],
    });

    // Create S3 access policy
    this.s3AccessPolicy = new IamPolicy(this, "s3-access-policy", {
      name: "ec2-s3-access-policy",
      description: "Policy for EC2 instances to access S3 buckets",
      policy: s3PolicyDocument,
      tags: {
        Name: "ec2-s3-access-policy",
        ...props.tags,
      },
    });

    // Attach S3 access policy to EC2 role
    new IamRolePolicyAttachment(this, "ec2-s3-policy-attachment", {
      role: this.ec2Role.name,
      policyArn: this.s3AccessPolicy.arn,
    });

    // Attach AWS managed policy for SSM (optional, for better management)
    new IamRolePolicyAttachment(this, "ec2-ssm-policy-attachment", {
      role: this.ec2Role.name,
      policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
    });

    // Create instance profile
    this.ec2InstanceProfile = new IamInstanceProfile(this, "ec2-instance-profile", {
      name: "ec2-s3-access-profile",
      role: this.ec2Role.name,
      tags: {
        Name: "ec2-s3-access-profile",
        ...props.tags,
      },
    });
  }
}
5. Compute Construct (constructs/compute-construct.ts)
import { Construct } from "constructs";
import { Instance, KeyPair } from "@cdktf/provider-aws/lib/ec2";
import { DataAwsAmi } from "@cdktf/provider-aws/lib/data-aws-ami";
import { BaseConstructProps } from "../types/common";

export interface ComputeConstructProps extends BaseConstructProps {
  subnetId: string;
  securityGroupIds: string[];
  iamInstanceProfile: string;
  instanceType?: string;
  keyName?: string;
}

export class ComputeConstruct extends Construct {
  public readonly instance: Instance;
  public readonly keyPair?: KeyPair;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    const instanceType = props.instanceType || "t3.micro";

    // Get latest Amazon Linux 2 AMI
    const amazonLinuxAmi = new DataAwsAmi(this, "amazon-linux-ami", {
      mostRecent: true,
      owners: ["amazon"],
      filter: [
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-gp2"],
        },
        {
          name: "virtualization-type",
          values: ["hvm"],
        },
      ],
    });

    // Create key pair if keyName is not provided
    if (!props.keyName) {
      this.keyPair = new KeyPair(this, "ec2-key-pair", {
        keyName: "ec2-test-key",
        tags: {
          Name: "ec2-test-key",
          ...props.tags,
        },
      });
    }

    // User data script for basic setup
    const userData = `#!/bin/bash
yum update -y
yum install -y aws-cli
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Create a simple web server for testing
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from EC2 Instance</h1>" > /var/www/html/index.html
echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
`;

    // Create EC2 instance
    this.instance = new Instance(this, "test-instance", {
      ami: amazonLinuxAmi.id,
      instanceType: instanceType,
      keyName: props.keyName || this.keyPair?.keyName,
      subnetId: props.subnetId,
      vpcSecurityGroupIds: props.securityGroupIds,
      iamInstanceProfile: props.iamInstanceProfile,
      userData: Buffer.from(userData).toString('base64'),
      
      // Enable detailed monitoring
      monitoring: true,
      
      // EBS optimization for better performance
      ebsOptimized: true,
      
      // Root block device configuration
      rootBlockDevice: {
        volumeType: "gp3",
        volumeSize: 20,
        encrypted: true,
        deleteOnTermination: true,
        tags: {
          Name: "test-instance-root-volume",
          ...props.tags,
        },
      },

      tags: {
        Name: "test-ec2-instance",
        ...props.tags,
      },
    });
  }
}
6. Main Stack (main.ts)
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { NetworkingConstruct } from "./constructs/networking-construct";
import { SecurityConstruct } from "./constructs/security-construct";
import { IamConstruct } from "./constructs/iam-construct";
import { ComputeConstruct } from "./constructs/compute-construct";
import { CommonTags } from "./types/common";

class MyInfrastructureStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS Provider
    new AwsProvider(this, "aws", {
      region: "us-east-1",
      defaultTags: {
        tags: {
          ManagedBy: "CDKTF",
          Project: "MyProject",
          Environment: "Dev",
          Owner: "Akshat Jain",
        },
      },
    });

    // Common tags for all resources
    const commonTags: CommonTags = {
      Project: "MyProject",
      Environment: "Dev",
      Owner: "Akshat Jain",
    };

    // Create networking infrastructure
    const networking = new NetworkingConstruct(this, "networking", {
      tags: commonTags,
      vpcCidr: "10.0.0.0/16",
      availabilityZones: ["us-east-1a", "us-east-1b", "us-east-1c"],
    });

    // Create security groups
    const security = new SecurityConstruct(this, "security", {
      tags: commonTags,
      vpcId: networking.vpc.id,
      allowedCidrBlocks: ["203.0.113.0/24"], // Replace with your actual IP range
    });

    // Create IAM roles and policies
    const iam = new IamConstruct(this, "iam", {
      tags: commonTags,
      s3BucketArns: ["arn:aws:s3:::your-bucket-name"], // Replace with actual bucket ARNs
    });

    // Create compute resources (optional - for testing)
    const compute = new ComputeConstruct(this, "compute", {
      tags: commonTags,
      subnetId: networking.publicSubnets[0].id, // Deploy in first public subnet
      securityGroupIds: [
        security.webSecurityGroup.id,
        security.sshSecurityGroup.id,
      ],
      iamInstanceProfile: iam.ec2InstanceProfile.name,
      instanceType: "t3.micro",
    });

    // Outputs
    new TerraformOutput(this, "vpc-id", {
      value: networking.vpc.id,
      description: "VPC ID",
    });

    new TerraformOutput(this, "public-subnet-ids", {
      value: networking.publicSubnets.map(subnet => subnet.id),
      description: "Public subnet IDs",
    });

    new TerraformOutput(this, "private-subnet-ids", {
      value: networking.privateSubnets.map(subnet => subnet.id),
      description: "Private subnet IDs",
    });

    new TerraformOutput(this, "nat-gateway-id", {
      value: networking.natGateway.id,
      description: "NAT Gateway ID",
    });

    new TerraformOutput(this, "web-security-group-id", {
      value: security.webSecurityGroup.id,
      description: "Web Security Group ID",
    });

    new TerraformOutput(this, "ssh-security-group-id", {
      value: security.sshSecurityGroup.id,
      description: "SSH Security Group ID",
    });

    new TerraformOutput(this, "ec2-role-arn", {
      value: iam.ec2Role.arn,
      description: "EC2 IAM Role ARN",
    });

    new TerraformOutput(this, "instance-id", {
      value: compute.instance.id,
      description: "EC2 Instance ID",
    });

    new TerraformOutput(this, "instance-public-ip", {
      value: compute.instance.publicIp,
      description: "EC2 Instance Public IP",
    });

    new TerraformOutput(this, "instance-private-ip", {
      value: compute.instance.privateIp,
      description: "EC2 Instance Private IP",
    });
  }
}

const app = new App();
new MyInfrastructureStack(app, "my-infrastructure");
app.synth();
Package.json Dependencies
{
  "name": "cdktf-aws-infrastructure",
  "version": "1.0.0",
  "main": "main.ts",
  "scripts": {
    "get": "cdktf get",
    "build": "tsc",
    "synth": "cdktf synth",
    "plan": "cdktf plan",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^4.7.0"
  },
  "dependencies": {
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.20.0",
    "constructs": "^10.0.0"
  }
}
Usage Instructions
Initialize the project:
npm install
cdktf get
Configure AWS credentials:
aws configure
# or set environment variables
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
Customize the configuration:
Update the allowedCidrBlocks in main.ts with your actual IP ranges
Update the s3BucketArns with your actual S3 bucket ARNs
Modify any other parameters as needed
Deploy the infrastructure:
cdktf plan    # Review the plan
cdktf deploy  # Deploy the infrastructure
Clean up:
cdktf destroy
Key Features
✅ Modular Design: Separate constructs for networking, security, IAM, and compute
✅ Multi-AZ Setup: 3 availability zones with public and private subnets
✅ NAT Gateway: Enables outbound internet access for private subnets
✅ Security Groups: Restricted access on ports 80 and 22 from specified CIDR blocks
✅ IAM Integration: EC2 instances can access S3 without hardcoded credentials
✅ Consistent Tagging: All resources tagged with project, environment, and owner information
✅ Production Ready: Includes monitoring, encryption, and best practices
✅ TypeScript Interfaces: Proper typing for all configuration options
This configuration provides a solid foundation for a secure, scalable AWS infrastructure using CDKTF with TypeScript.
