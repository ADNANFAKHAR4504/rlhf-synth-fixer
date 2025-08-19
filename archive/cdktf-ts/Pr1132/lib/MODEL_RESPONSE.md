## lib/modules.ts

```typescript
/**
 * Reusable module classes for AWS infrastructure deployment.
 * Contains all modular components: VPC, S3, IAM, Security, and EC2 modules.
 * Each module accepts typed constructor arguments and exposes necessary outputs.
 */

import { Construct } from "constructs";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { Route } from "@cdktf/provider-aws/lib/route";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketVersioning } from "@cdktf/provider-aws/lib/s3-bucket-versioning";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamInstanceProfile } from "@cdktf/provider-aws/lib/iam-instance-profile";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { DataAwsAmi } from "@cdktf/provider-aws/lib/data-aws-ami";
import { Instance } from "@cdktf/provider-aws/lib/instance";

export interface VpcModuleProps {
  vpcCidr: string;
  subnetCidr: string;
  availabilityZone: string;
  tags: { [key: string]: string };
}

export interface S3ModuleProps {
  bucketName: string;
  tags: { [key: string]: string };
}

export interface IamModuleProps {
  roleName: string;
  s3BucketArn: string;
  tags: { [key: string]: string };
}

export interface SecurityModuleProps {
  securityGroupName: string;
  vpcId: string;
  sshCidr: string;
  tags: { [key: string]: string };
}

export interface Ec2ModuleProps {
  instanceName: string;
  instanceType: string;
  keyName?: string;
  subnetId: string;
  securityGroupIds: string[];
  iamInstanceProfile: string;
  tags: { [key: string]: string };
}

export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly subnet: Subnet;
  public readonly internetGateway: InternetGateway;
  public readonly routeTable: RouteTable;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    // Create VPC
    this.vpc = new Vpc(this, "vpc", {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${props.tags.Environment}-vpc`,
        ...props.tags,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.tags.Environment}-igw`,
        ...props.tags,
      },
    });

    // Create public subnet
    this.subnet = new Subnet(this, "public-subnet", {
      vpcId: this.vpc.id,
      cidrBlock: props.subnetCidr,
      availabilityZone: props.availabilityZone,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `${props.tags.Environment}-public-subnet`,
        ...props.tags,
      },
    });

    // Create route table
    this.routeTable = new RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.tags.Environment}-public-rt`,
        ...props.tags,
      },
    });

    // Create route to internet gateway
    new Route(this, "public-route", {
      routeTableId: this.routeTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id,
    });

    // Associate route table with subnet
    new RouteTableAssociation(this, "public-rt-association", {
      subnetId: this.subnet.id,
      routeTableId: this.routeTable.id,
    });
  }
}

export class S3Module extends Construct {
  public readonly bucket: S3Bucket;
  public readonly bucketVersioning: S3BucketVersioning;

  constructor(scope: Construct, id: string, props: S3ModuleProps) {
    super(scope, id);

    // Create S3 bucket
    this.bucket = new S3Bucket(this, "bucket", {
      bucket: props.bucketName,
      tags: {
        Name: props.bucketName,
        ...props.tags,
      },
    });

    // Enable versioning on the bucket
    this.bucketVersioning = new S3BucketVersioning(this, "bucket-versioning", {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    });
  }
}

export class IamModule extends Construct {
  public readonly role: IamRole;
  public readonly policy: IamPolicy;
  public readonly instanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, props: IamModuleProps) {
    super(scope, id);

    // Create IAM role for EC2
    this.role = new IamRole(this, "ec2-role", {
      name: props.roleName,
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
      tags: props.tags,
    });

    // Create IAM policy for S3 access
    this.policy = new IamPolicy(this, "s3-policy", {
      name: `${props.roleName}-s3-policy`,
      description: "Policy for EC2 to access S3 bucket",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:GetObject",
              "s3:PutObject",
              "s3:ListBucket",
            ],
            Resource: [
              props.s3BucketArn,
              `${props.s3BucketArn}/*`,
            ],
          },
        ],
      }),
      tags: props.tags,
    });

    // Attach policy to role
    new IamRolePolicyAttachment(this, "policy-attachment", {
      role: this.role.name,
      policyArn: this.policy.arn,
    });

    // Create instance profile
    this.instanceProfile = new IamInstanceProfile(this, "instance-profile", {
      name: `${props.roleName}-instance-profile`,
      role: this.role.name,
      tags: props.tags,
    });
  }
}

export class SecurityModule extends Construct {
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityModuleProps) {
    super(scope, id);

    this.securityGroup = new SecurityGroup(this, "security-group", {
      name: props.securityGroupName,
      description: "Security group for EC2 instance",
      vpcId: props.vpcId,
      ingress: [
        {
          description: "SSH access",
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: [props.sshCidr],
        },
      ],
      egress: [
        {
          description: "All outbound traffic",
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      tags: {
        Name: props.securityGroupName,
        ...props.tags,
      },
    });
  }
}

export class Ec2Module extends Construct {
  public readonly instance: Instance;
  public readonly ami: DataAwsAmi;

  constructor(scope: Construct, id: string, props: Ec2ModuleProps) {
    super(scope, id);

    // Look up the latest Amazon Linux 2 AMI
    this.ami = new DataAwsAmi(this, "amazon-linux-2", {
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
    this.instance = new Instance(this, "instance", {
      ami: this.ami.id,
      instanceType: props.instanceType,
      keyName: props.keyName,
      subnetId: props.subnetId,
      vpcSecurityGroupIds: props.securityGroupIds,
      iamInstanceProfile: props.iamInstanceProfile,
      associatePublicIpAddress: true,
      tags: {
        Name: props.instanceName,
        ...props.tags,
      },
    });
  }
}
```

## lib/tap-stack.ts

```typescript
/**
 * Root CDKTF stack that composes all infrastructure modules.
 * Defines input variables, instantiates modules from lib/modules.ts,
 * wires dependencies, and exposes outputs.
 * Configures S3 remote backend with DynamoDB state locking.
 */

import { Construct } from "constructs";
import { TerraformStack, TerraformVariable, TerraformOutput, S3Backend } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import {
  VpcModule,
  S3Module,
  IamModule,
  SecurityModule,
  Ec2Module,
} from "./modules";

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Input Variables
    const region = new TerraformVariable(this, "region", {
      type: "string",
      default: "us-west-2",
      description: "AWS region for resources",
    });

    const environment = new TerraformVariable(this, "environment", {
      type: "string",
      default: "dev",
      description: "Environment name (dev, staging, prod)",
    });

    const owner = new TerraformVariable(this, "owner", {
      type: "string",
      default: "terraform-user",
      description: "Owner of the resources",
    });

    const sshCidr = new TerraformVariable(this, "ssh_cidr", {
      type: "string",
      default: "0.0.0.0/0", // WARNING: This is dangerously open! Use a specific CIDR in production
      description: "CIDR block allowed for SSH access (WARNING: 0.0.0.0/0 is insecure)",
    });

    const instanceType = new TerraformVariable(this, "instance_type", {
      type: "string",
      default: "t2.micro",
      description: "EC2 instance type",
    });

    const instanceKeyName = new TerraformVariable(this, "instance_key_name", {
      type: "string",
      default: null,
      description: "EC2 Key Pair name for SSH access (optional)",
    });

    const s3BucketName = new TerraformVariable(this, "s3_bucket_name", {
      type: "string",
      default: "tap-app-data-bucket-${random_id}",
      description: "Name for the S3 bucket (must be globally unique)",
    });

    const vpcCidr = new TerraformVariable(this, "vpc_cidr", {
      type: "string",
      default: "10.0.0.0/16",
      description: "CIDR block for VPC",
    });

    const subnetCidr = new TerraformVariable(this, "subnet_cidr", {
      type: "string",
      default: "10.0.0.0/24",
      description: "CIDR block for public subnet",
    });

    const availabilityZone = new TerraformVariable(this, "availability_zone", {
      type: "string",
      default: "us-west-2a",
      description: "Availability zone for subnet",
    });

    const additionalTags = new TerraformVariable(this, "additional_tags", {
      type: "map(string)",
      default: {},
      description: "Additional tags to apply to all resources",
    });

    // State backend variables
    const stateBucket = new TerraformVariable(this, "state_bucket", {
      type: "string",
      default: "terraform-state-bucket-example",
      description: "S3 bucket name for Terraform state",
    });

    const stateKey = new TerraformVariable(this, "state_key", {
      type: "string",
      default: "tap-infrastructure/terraform.tfstate",
      description: "S3 key path for Terraform state file",
    });

    const dynamodbTable = new TerraformVariable(this, "dynamodb_table", {
      type: "string",
      default: "terraform-state-lock",
      description: "DynamoDB table name for state locking",
    });

    // Configure S3 remote backend with DynamoDB locking
    new S3Backend(this, {
      bucket: stateBucket.stringValue,
      key: stateKey.stringValue,
      region: region.stringValue,
      dynamodbTable: dynamodbTable.stringValue,
      encrypt: true,
    });

    // Configure AWS Provider
    new AwsProvider(this, "aws", {
      region: region.stringValue,
    });

    // Merge required tags with additional tags
    const baseTags = {
      Environment: environment.stringValue,
      Owner: owner.stringValue,
    };

    // Create VPC Module
    const vpcModule = new VpcModule(this, "vpc", {
      vpcCidr: vpcCidr.stringValue,
      subnetCidr: subnetCidr.stringValue,
      availabilityZone: availabilityZone.stringValue,
      tags: {
        ...baseTags,
        ...additionalTags.value as { [key: string]: string },
      },
    });

    // Create S3 Module
    const s3Module = new S3Module(this, "s3", {
      bucketName: s3BucketName.stringValue,
      tags: {
        ...baseTags,
        ...additionalTags.value as { [key: string]: string },
      },
    });

    // Create IAM Module
    const iamModule = new IamModule(this, "iam", {
      roleName: `${environment.stringValue}-ec2-role`,
      s3BucketArn: s3Module.bucket.arn,
      tags: {
        ...baseTags,
        ...additionalTags.value as { [key: string]: string },
      },
    });

    // Create Security Module
    const securityModule = new SecurityModule(this, "security", {
      securityGroupName: `${environment.stringValue}-ec2-sg`,
      vpcId: vpcModule.vpc.id,
      sshCidr: sshCidr.stringValue,
      tags: {
        ...baseTags,
        ...additionalTags.value as { [key: string]: string },
      },
    });

    // Create EC2 Module
    const ec2Module = new Ec2Module(this, "ec2", {
      instanceName: `${environment.stringValue}-app-server`,
      instanceType: instanceType.stringValue,
      keyName: instanceKeyName.value as string | undefined,
      subnetId: vpcModule.subnet.id,
      securityGroupIds: [securityModule.securityGroup.id],
      iamInstanceProfile: iamModule.instanceProfile.name,
      tags: {
        ...baseTags,
        ...additionalTags.value as { [key: string]: string },
      },
    });

    // Outputs
    new TerraformOutput(this, "ec2_public_ip", {
      value: ec2Module.instance.publicIp,
      description: "Public IP address of the EC2 instance",
    });

    new TerraformOutput(this, "ec2_instance_id", {
      value: ec2Module.instance.id,
      description: "ID of the EC2 instance",
    });

    new TerraformOutput(this, "s3_bucket_name", {
      value: s3Module.bucket.bucket,
      description: "Name of the S3 bucket",
    });

    new TerraformOutput(this, "vpc_id", {
      value: vpcModule.vpc.id,
      description: "ID of the VPC",
    });

    new TerraformOutput(this, "subnet_id", {
      value: vpcModule.subnet.id,
      description: "ID of the public subnet",
    });
  }
}
```