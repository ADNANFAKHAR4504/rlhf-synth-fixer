### Reasoning Trace
---

Let me design a production-ready CDKTF configuration in TypeScript for AWS that meets all the requirements. I'll create two files:

1. `modules.ts` - containing reusable infrastructure constructs
2. `taps-stack.ts` - the main stack definition

Requirements checklist:
1. AWS Region: us-east-1 ✓
2. TfVariable for EC2 instance type ✓
3. IAM roles with least privilege ✓
4. AWS Secrets Manager for sensitive data ✓
5. VPC with public and private subnets, IGW, NAT Gateway ✓
6. Environment: Production tag on all resources ✓

Let me structure this properly:

modules.ts will contain:
- NetworkingConstruct (VPC, subnets, IGW, NAT)
- SecureComputeConstruct (EC2 with IAM role)
- SecretsConstruct (Secrets Manager)

taps-stack.ts will contain:
- Main stack definition
- Variable for EC2 instance type
- Instantiation of all constructs
- Provider configuration

I need to ensure all resources have the Environment: Production tag and follow best practices.
### Answer 
---

```typescript
// --- modules.ts ---

import { Construct } from "constructs";
import {
  ec2,
  iam,
  secretsmanager,
  dataAwsAmi,
} from "@cdktf/provider-aws";

interface NetworkingConstructProps {
  tags: { [key: string]: string };
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnet: ec2.Subnet;
  public readonly privateSubnet: ec2.Subnet;
  public readonly internetGateway: ec2.InternetGateway;
  public readonly natGateway: ec2.NatGateway;

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    // Create VPC
    this.vpc = new ec2.Vpc(this, "vpc", {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...props.tags,
        Name: "production-vpc",
      },
    });

    // Create Internet Gateway
    this.internetGateway = new ec2.InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: "production-igw",
      },
    });

    // Create public subnet
    this.publicSubnet = new ec2.Subnet(this, "public-subnet", {
      vpcId: this.vpc.id,
      cidrBlock: "10.0.1.0/24",
      availabilityZone: "us-east-1a",
      mapPublicIpOnLaunch: true,
      tags: {
        ...props.tags,
        Name: "production-public-subnet",
        Type: "public",
      },
    });

    // Create private subnet
    this.privateSubnet = new ec2.Subnet(this, "private-subnet", {
      vpcId: this.vpc.id,
      cidrBlock: "10.0.2.0/24",
      availabilityZone: "us-east-1a",
      tags: {
        ...props.tags,
        Name: "production-private-subnet",
        Type: "private",
      },
    });

    // Create Elastic IP for NAT Gateway
    const natEip = new ec2.Eip(this, "nat-eip", {
      domain: "vpc",
      tags: {
        ...props.tags,
        Name: "production-nat-eip",
      },
    });

    // Create NAT Gateway in public subnet
    this.natGateway = new ec2.NatGateway(this, "nat-gateway", {
      subnetId: this.publicSubnet.id,
      allocationId: natEip.id,
      tags: {
        ...props.tags,
        Name: "production-nat-gateway",
      },
    });

    // Create route table for public subnet
    const publicRouteTable = new ec2.RouteTable(this, "public-route-table", {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: "production-public-rt",
      },
    });

    // Add route to Internet Gateway
    new ec2.Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnet with public route table
    new ec2.RouteTableAssociation(this, "public-subnet-association", {
      subnetId: this.publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    // Create route table for private subnet
    const privateRouteTable = new ec2.RouteTable(this, "private-route-table", {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: "production-private-rt",
      },
    });

    // Add route to NAT Gateway for private subnet
    new ec2.Route(this, "private-route", {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: this.natGateway.id,
    });

    // Associate private subnet with private route table
    new ec2.RouteTableAssociation(this, "private-subnet-association", {
      subnetId: this.privateSubnet.id,
      routeTableId: privateRouteTable.id,
    });
  }
}

interface SecureComputeConstructProps {
  instanceType: string;
  subnetId: string;
  vpcId: string;
  secretArn: string;
  tags: { [key: string]: string };
}

export class SecureComputeConstruct extends Construct {
  public readonly instance: ec2.Instance;
  public readonly role: iam.IamRole;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecureComputeConstructProps) {
    super(scope, id);

    // Create IAM role with least privilege for EC2
    const assumeRolePolicy = {
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
    };

    this.role = new iam.IamRole(this, "ec2-role", {
      name: "production-ec2-role",
      assumeRolePolicy: JSON.stringify(assumeRolePolicy),
      tags: props.tags,
    });

    // Create IAM policy for Secrets Manager access (least privilege)
    const secretsPolicy = new iam.IamPolicy(this, "secrets-policy", {
      name: "production-ec2-secrets-policy",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "secretsmanager:GetSecretValue",
              "secretsmanager:DescribeSecret",
            ],
            Resource: props.secretArn,
          },
          {
            Effect: "Allow",
            Action: ["kms:Decrypt"],
            Resource: "*",
            Condition: {
              StringEquals: {
                "kms:ViaService": `secretsmanager.us-east-1.amazonaws.com`,
              },
            },
          },
        ],
      }),
      tags: props.tags,
    });

    // Attach policy to role
    new iam.IamRolePolicyAttachment(this, "ec2-secrets-policy-attachment", {
      role: this.role.name,
      policyArn: secretsPolicy.arn,
    });

    // Attach AWS managed SSM policy for Session Manager access
    new iam.IamRolePolicyAttachment(this, "ec2-ssm-policy-attachment", {
      role: this.role.name,
      policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
    });

    // Create instance profile
    const instanceProfile = new iam.IamInstanceProfile(this, "instance-profile", {
      name: "production-ec2-instance-profile",
      role: this.role.name,
      tags: props.tags,
    });

    // Create security group with restrictive rules
    this.securityGroup = new ec2.SecurityGroup(this, "security-group", {
      name: "production-ec2-sg",
      description: "Security group for production EC2 instance",
      vpcId: props.vpcId,
      tags: {
        ...props.tags,
        Name: "production-ec2-sg",
      },
    });

    // Allow outbound HTTPS traffic for AWS service communication
    new ec2.SecurityGroupRule(this, "sg-egress-https", {
      type: "egress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.securityGroup.id,
      description: "Allow HTTPS outbound for AWS services",
    });

    // Allow outbound HTTP traffic for package updates
    new ec2.SecurityGroupRule(this, "sg-egress-http", {
      type: "egress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.securityGroup.id,
      description: "Allow HTTP outbound for package updates",
    });

    // Get latest Amazon Linux 2 AMI
    const ami = new dataAwsAmi.DataAwsAmi(this, "amazon-linux-2", {
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

    // Create EC2 instance
    this.instance = new ec2.Instance(this, "instance", {
      ami: ami.id,
      instanceType: props.instanceType,
      subnetId: props.subnetId,
      iamInstanceProfile: instanceProfile.name,
      vpcSecurityGroupIds: [this.securityGroup.id],
      monitoring: true,
      userData: Buffer.from(`#!/bin/bash
# Install CloudWatch agent and SSM agent
yum update -y
yum install -y amazon-cloudwatch-agent
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent
`).toString("base64"),
      rootBlockDevice: {
        volumeType: "gp3",
        volumeSize: 20,
        encrypted: true,
        deleteOnTermination: true,
      },
      metadataOptions: {
        httpTokens: "required",
        httpPutResponseHopLimit: 1,
        httpEndpoint: "enabled",
      },
      tags: {
        ...props.tags,
        Name: "production-compute-instance",
      },
    });
  }
}

interface SecretsConstructProps {
  tags: { [key: string]: string };
}

export class SecretsConstruct extends Construct {
  public readonly secret: secretsmanager.SecretsmanagerSecret;
  public readonly secretVersion: secretsmanager.SecretsmanagerSecretVersion;

  constructor(scope: Construct, id: string, props: SecretsConstructProps) {
    super(scope, id);

    // Create the secret
    this.secret = new secretsmanager.SecretsmanagerSecret(this, "secret", {
      name: "production/database/credentials",
      description: "Production database credentials",
      recoveryWindowInDays: 7,
      tags: {
        ...props.tags,
        Name: "production-database-secret",
      },
    });

    // Create secret version with dummy data
    this.secretVersion = new secretsmanager.SecretsmanagerSecretVersion(
      this,
      "secret-version",
      {
        secretId: this.secret.id,
        secretString: JSON.stringify({
          username: "admin",
          password: "ChangeMe123!@#$",
          engine: "postgres",
          host: "db.production.internal",
          port: 5432,
        }),
      }
    );
  }
}
```

```typescript
// --- taps-stack.ts ---

import { Construct } from "constructs";
import { App, TerraformStack, TerraformVariable, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import {
  NetworkingConstruct,
  SecureComputeConstruct,
  SecretsConstruct,
} from "./modules";

export class TapsStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS Provider for us-east-1
    new AwsProvider(this, "aws", {
      region: "us-east-1",
      defaultTags: [
        {
          tags: {
            Environment: "Production",
            ManagedBy: "CDKTF",
            Stack: "TapsStack",
          },
        },
      ],
    });

    // Define variable for EC2 instance type
    const instanceTypeVariable = new TerraformVariable(this, "ec2_instance_type", {
      type: "string",
      description: "The EC2 instance type for the compute resource",
      default: "t3.micro",
      validation: [
        {
          condition: `contains(["t3.micro", "t3.small", "t3.medium", "t3.large", "m5.large", "m5.xlarge"], var.ec2_instance_type)`,
          errorMessage: "Instance type must be one of: t3.micro, t3.small, t3.medium, t3.large, m5.large, m5.xlarge",
        },
      ],
    });

    // Common tags for all resources
    const commonTags = {
      Environment: "Production",
    };

    // Deploy Networking Infrastructure
    const networking = new NetworkingConstruct(this, "networking", {
      tags: commonTags,
    });

    // Deploy Secrets Manager Secret
    const secrets = new SecretsConstruct(this, "secrets", {
      tags: commonTags,
    });

    // Deploy Secure Compute Instance
    const compute = new SecureComputeConstruct(this, "compute", {
      instanceType: instanceTypeVariable.stringValue,
      subnetId: networking.privateSubnet.id,
      vpcId: networking.vpc.id,
      secretArn: secrets.secret.arn,
      tags: commonTags,
    });

    // Outputs
    new TerraformOutput(this, "vpc_id", {
      value: networking.vpc.id,
      description: "ID of the production VPC",
    });

    new TerraformOutput(this, "public_subnet_id", {
      value: networking.publicSubnet.id,
      description: "ID of the public subnet",
    });

    new TerraformOutput(this, "private_subnet_id", {
      value: networking.privateSubnet.id,
      description: "ID of the private subnet",
    });

    new TerraformOutput(this, "ec2_instance_id", {
      value: compute.instance.id,
      description: "ID of the EC2 instance",
    });

    new TerraformOutput(this, "ec2_instance_private_ip", {
      value: compute.instance.privateIp,
      description: "Private IP address of the EC2 instance",
    });

    new TerraformOutput(this, "secret_arn", {
      value: secrets.secret.arn,
      description: "ARN of the Secrets Manager secret",
      sensitive: true,
    });

    new TerraformOutput(this, "iam_role_arn", {
      value: compute.role.arn,
      description: "ARN of the EC2 IAM role",
    });
  }
}

// Main application entry point
const app = new App();
new TapsStack(app, "taps-stack");
app.synth();
```