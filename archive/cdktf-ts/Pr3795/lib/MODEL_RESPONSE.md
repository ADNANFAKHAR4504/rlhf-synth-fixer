`lib/modules.ts`:

```typescript
import { Construct } from "constructs";
import {
  AwsProvider,
  vpc as awsVpc,
  subnet,
  internetGateway,
  routeTable,
  routeTableAssociation,
  route,
  natGateway,
  eip,
  securityGroup,
  securityGroupRule,
  instance,
  iamRole,
  iamRolePolicy,
  iamInstanceProfile,
  networkAcl,
  networkAclRule,
  db,
  flowLog,
  cloudwatchLogGroup,
  s3Bucket,
  s3BucketPublicAccessBlock,
  s3BucketVersioning,
  ssmParameter,
  dataAwsAmi,
  Tag,
} from "@cdktf/provider-aws";

// Interface for VPC Module
export interface VpcProps {
  projectName: string;
  environment: string;
  cidrBlock: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  region: string;
}

// Interface for Security Group Module
export interface SecurityGroupProps {
  projectName: string;
  environment: string;
  vpcId: string;
  sshAllowedCidr: string;
}

// Interface for EC2 Module
export interface Ec2Props {
  projectName: string;
  environment: string;
  subnetIds: string[];
  securityGroupId: string;
  instanceType: string;
  region: string;
}

// Interface for RDS Module
export interface RdsProps {
  projectName: string;
  environment: string;
  subnetIds: string[];
  securityGroupId: string;
  dbInstanceClass: string;
  dbStorageGb: number;
  backupRetentionDays: number;
  deletionProtection: boolean;
  region: string;
}

// Interface for S3 Module
export interface S3Props {
  projectName: string;
  environment: string;
}

// Interface for VPC Flow Logs Module
export interface FlowLogsProps {
  projectName: string;
  environment: string;
  vpcId: string;
}

// Interface for SSM Module
export interface SsmProps {
  projectName: string;
  environment: string;
  dbEndpoint: string;
  dbPort: number;
}

// VPC Module
export class VpcModule extends Construct {
  public vpc: awsVpc.Vpc;
  public publicSubnets: subnet.Subnet[];
  public privateSubnets: subnet.Subnet[];
  public internetGateway: internetGateway.InternetGateway;
  public natGateway: natGateway.NatGateway;
  public natEip: eip.Eip;
  public publicRouteTable: routeTable.RouteTable;
  public privateRouteTable: routeTable.RouteTable;
  public publicNetworkAcl: networkAcl.NetworkAcl;
  public privateNetworkAcl: networkAcl.NetworkAcl;

  constructor(scope: Construct, id: string, props: VpcProps) {
    super(scope, id);

    // Create VPC
    this.vpc = new awsVpc.Vpc(this, "vpc", {
      cidrBlock: props.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${props.projectName}-vpc`,
        Environment: props.environment,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new internetGateway.InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.projectName}-igw`,
        Environment: props.environment,
      },
    });

    // Create Elastic IP for NAT Gateway
    this.natEip = new eip.Eip(this, "nat-eip", {
      domain: "vpc",
      tags: {
        Name: `${props.projectName}-nat-eip`,
        Environment: props.environment,
      },
    });

    // Get Availability Zones
    const azs = ["us-east-1a", "us-east-1b"];

    // Create Public Subnets
    this.publicSubnets = [];
    props.publicSubnetCidrs.forEach((cidr, index) => {
      if (index < 2) { // Ensure we only create 2 subnets as specified
        const subnet = new subnet.Subnet(this, `public-subnet-${index + 1}`, {
          vpcId: this.vpc.id,
          cidrBlock: cidr,
          availabilityZone: azs[index],
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `${props.projectName}-public-subnet-${index + 1}`,
            Environment: props.environment,
          },
        });
        this.publicSubnets.push(subnet);
      }
    });

    // Create Private Subnets
    this.privateSubnets = [];
    props.privateSubnetCidrs.forEach((cidr, index) => {
      if (index < 2) { // Ensure we only create 2 subnets as specified
        const subnet = new subnet.Subnet(this, `private-subnet-${index + 1}`, {
          vpcId: this.vpc.id,
          cidrBlock: cidr,
          availabilityZone: azs[index],
          tags: {
            Name: `${props.projectName}-private-subnet-${index + 1}`,
            Environment: props.environment,
          },
        });
        this.privateSubnets.push(subnet);
      }
    });

    // Create NAT Gateway in first public subnet
    this.natGateway = new natGateway.NatGateway(this, "nat", {
      allocationId: this.natEip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        Name: `${props.projectName}-nat`,
        Environment: props.environment,
      },
    });

    // Create Route Tables
    this.publicRouteTable = new routeTable.RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.projectName}-public-rt`,
        Environment: props.environment,
      },
    });

    this.privateRouteTable = new routeTable.RouteTable(this, "private-rt", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.projectName}-private-rt`,
        Environment: props.environment,
      },
    });

    // Create Routes
    // Public route for Internet Gateway
    new route.Route(this, "public-route", {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id,
    });

    // Private route for NAT Gateway
    new route.Route(this, "private-route", {
      routeTableId: this.privateRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: this.natGateway.id,
    });

    // Associate Route Tables with Subnets
    this.publicSubnets.forEach((subnet, index) => {
      new routeTableAssociation.RouteTableAssociation(this, `public-rta-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: this.publicRouteTable.id,
      });
    });

    this.privateSubnets.forEach((subnet, index) => {
      new routeTableAssociation.RouteTableAssociation(this, `private-rta-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: this.privateRouteTable.id,
      });
    });

    // Create Network ACLs
    this.publicNetworkAcl = new networkAcl.NetworkAcl(this, "public-nacl", {
      vpcId: this.vpc.id,
      subnetIds: this.publicSubnets.map(subnet => subnet.id),
      tags: {
        Name: `${props.projectName}-public-nacl`,
        Environment: props.environment,
      },
    });

    this.privateNetworkAcl = new networkAcl.NetworkAcl(this, "private-nacl", {
      vpcId: this.vpc.id,
      subnetIds: this.privateSubnets.map(subnet => subnet.id),
      tags: {
        Name: `${props.projectName}-private-nacl`,
        Environment: props.environment,
      },
    });

    // Public NACL Rules
    // Inbound Rules
    new networkAclRule.NetworkAclRule(this, "public-nacl-inbound-http", {
      networkAclId: this.publicNetworkAcl.id,
      ruleNumber: 100,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      fromPort: 80,
      toPort: 80,
      egress: false,
    });

    new networkAclRule.NetworkAclRule(this, "public-nacl-inbound-https", {
      networkAclId: this.publicNetworkAcl.id,
      ruleNumber: 110,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      fromPort: 443,
      toPort: 443,
      egress: false,
    });

    new networkAclRule.NetworkAclRule(this, "public-nacl-inbound-ssh", {
      networkAclId: this.publicNetworkAcl.id,
      ruleNumber: 120,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: props.sshAllowedCidr,
      fromPort: 22,
      toPort: 22,
      egress: false,
    });

    new networkAclRule.NetworkAclRule(this, "public-nacl-inbound-ephemeral", {
      networkAclId: this.publicNetworkAcl.id,
      ruleNumber: 130,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      fromPort: 1024,
      toPort: 65535,
      egress: false,
    });

    // Outbound Rules
    new networkAclRule.NetworkAclRule(this, "public-nacl-outbound-http", {
      networkAclId: this.publicNetworkAcl.id,
      ruleNumber: 100,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      fromPort: 80,
      toPort: 80,
      egress: true,
    });

    new networkAclRule.NetworkAclRule(this, "public-nacl-outbound-https", {
      networkAclId: this.publicNetworkAcl.id,
      ruleNumber: 110,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      fromPort: 443,
      toPort: 443,
      egress: true,
    });

    new networkAclRule.NetworkAclRule(this, "public-nacl-outbound-ephemeral", {
      networkAclId: this.publicNetworkAcl.id,
      ruleNumber: 120,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      fromPort: 1024,
      toPort: 65535,
      egress: true,
    });

    // Private NACL Rules
    // Inbound Rules
    new networkAclRule.NetworkAclRule(this, "private-nacl-inbound-mysql", {
      networkAclId: this.privateNetworkAcl.id,
      ruleNumber: 100,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: props.cidrBlock,
      fromPort: 3306,
      toPort: 3306,
      egress: false,
    });

    new networkAclRule.NetworkAclRule(this, "private-nacl-inbound-ephemeral", {
      networkAclId: this.privateNetworkAcl.id,
      ruleNumber: 110,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      fromPort: 1024,
      toPort: 65535,
      egress: false,
    });

    // Outbound Rules
    new networkAclRule.NetworkAclRule(this, "private-nacl-outbound-http", {
      networkAclId: this.privateNetworkAcl.id,
      ruleNumber: 100,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      fromPort: 80,
      toPort: 80,
      egress: true,
    });

    new networkAclRule.NetworkAclRule(this, "private-nacl-outbound-https", {
      networkAclId: this.privateNetworkAcl.id,
      ruleNumber: 110,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      fromPort: 443,
      toPort: 443,
      egress: true,
    });

    new networkAclRule.NetworkAclRule(this, "private-nacl-outbound-mysql", {
      networkAclId: this.privateNetworkAcl.id,
      ruleNumber: 120,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: props.cidrBlock,
      fromPort: 3306,
      toPort: 3306,
      egress: true,
    });

    new networkAclRule.NetworkAclRule(this, "private-nacl-outbound-ephemeral", {
      networkAclId: this.privateNetworkAcl.id,
      ruleNumber: 130,
      protocol: "tcp",
      ruleAction: "allow",
      cidrBlock: "0.0.0.0/0",
      fromPort: 1024,
      toPort: 65535,
      egress: true,
    });
  }
}

// Security Groups Module
export class SecurityGroupModule extends Construct {
  public publicInstanceSg: securityGroup.SecurityGroup;
  public rdsInstanceSg: securityGroup.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityGroupProps) {
    super(scope, id);

    // Create Security Group for Public Instances
    this.publicInstanceSg = new securityGroup.SecurityGroup(this, "public-instance-sg", {
      name: `${props.projectName}-public-instance-sg`,
      vpcId: props.vpcId,
      description: "Security group for public instances",
      tags: {
        Name: `${props.projectName}-public-instance-sg`,
        Environment: props.environment,
      },
    });

    // Create Security Group for RDS Instances
    this.rdsInstanceSg = new securityGroup.SecurityGroup(this, "rds-instance-sg", {
      name: `${props.projectName}-rds-instance-sg`,
      vpcId: props.vpcId,
      description: "Security group for RDS instances",
      tags: {
        Name: `${props.projectName}-rds-instance-sg`,
        Environment: props.environment,
      },
    });

    // Add ingress rules to Public Instance SG
    new securityGroupRule.SecurityGroupRule(this, "public-instance-sg-ingress-http", {
      securityGroupId: this.publicInstanceSg.id,
      type: "ingress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      description: "Allow HTTP from anywhere",
    });

    new securityGroupRule.SecurityGroupRule(this, "public-instance-sg-ingress-https", {
      securityGroupId: this.publicInstanceSg.id,
      type: "ingress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      description: "Allow HTTPS from anywhere",
    });

    new securityGroupRule.SecurityGroupRule(this, "public-instance-sg-ingress-ssh", {
      securityGroupId: this.publicInstanceSg.id,
      type: "ingress",
      fromPort: 22,
      toPort: 22,
      protocol: "tcp",
      cidrBlocks: [props.sshAllowedCidr],
      description: "Allow SSH from allowed CIDR",
    });

    // Add egress rule to Public Instance SG
    new securityGroupRule.SecurityGroupRule(this, "public-instance-sg-egress-all", {
      securityGroupId: this.publicInstanceSg.id,
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      description: "Allow all outbound traffic",
    });

    // Add ingress rule to RDS Instance SG (only from Public Instance SG)
    new securityGroupRule.SecurityGroupRule(this, "rds-instance-sg-ingress-mysql", {
      securityGroupId: this.rdsInstanceSg.id,
      type: "ingress",
      fromPort: 3306,
      toPort: 3306,
      protocol: "tcp",
      sourceSecurityGroupId: this.publicInstanceSg.id,
      description: "Allow MySQL from public instances",
    });

    // Add egress rule to RDS Instance SG
    new securityGroupRule.SecurityGroupRule(this, "rds-instance-sg-egress-all", {
      securityGroupId: this.rdsInstanceSg.id,
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      description: "Allow all outbound traffic",
    });
  }
}

// EC2 Module
export class Ec2Module extends Construct {
  public instances: instance.Instance[];

  constructor(scope: Construct, id: string, props: Ec2Props) {
    super(scope, id);

    // Create IAM Role for EC2 instances
    const ec2Role = new iamRole.IamRole(this, "ec2-role", {
      name: `${props.projectName}-ec2-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Principal: {
              Service: "ec2.amazonaws.com",
            },
            Effect: "Allow",
          },
        ],
      }),
      tags: {
        Environment: props.environment,
      },
    });

    // Create IAM Policy for EC2 instances
    new iamRolePolicy.IamRolePolicy(this, "ec2-policy", {
      name: `${props.projectName}-ec2-policy`,
      role: ec2Role.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: [
              "ssm:GetParameter",
              "ssm:GetParameters",
              "ssm:GetParametersByPath",
            ],
            Resource: [
              `arn:aws:ssm:${props.region}:*:parameter/${props.projectName}/*`,
            ],
            Effect: "Allow",
          },
          {
            Action: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "logs:DescribeLogStreams",
            ],
            Resource: ["arn:aws:logs:*:*:*"],
            Effect: "Allow",
          },
          {
            Action: [
              "s3:PutObject",
              "s3:GetObject",
              "s3:ListBucket",
            ],
            Resource: [
              `arn:aws:s3:::${props.projectName}-logs-${props.environment}`,
              `arn:aws:s3:::${props.projectName}-logs-${props.environment}/*`,
            ],
            Effect: "Allow",
          },
        ],
      }),
    });

    // Create IAM Instance Profile
    const instanceProfile = new iamInstanceProfile.IamInstanceProfile(this, "instance-profile", {
      name: `${props.projectName}-instance-profile`,
      role: ec2Role.name,
    });

    // Get latest Amazon Linux 2 AMI
    const ami = new dataAwsAmi.DataAwsAmi(this, "amazon-linux-2", {
      mostRecent: true,
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
      owners: ["amazon"],
    });

    // Create EC2 instances in public subnets
    this.instances = [];
    props.subnetIds.forEach((subnetId, index) => {
      const ec2Instance = new instance.Instance(this, `ec2-instance-${index + 1}`, {
        ami: ami.id,
        instanceType: props.instanceType,
        subnetId: subnetId,
        vpcSecurityGroupIds: [props.securityGroupId],
        iamInstanceProfile: instanceProfile.name,
        associatePublicIpAddress: true,
        tags: {
          Name: `${props.projectName}-ec2-${index + 1}`,
          Environment: props.environment,
        },
        userData: `#!/bin/bash
          echo "EC2 instance initialization complete" > /var/log/user-data.log
        `,
      });
      this.instances.push(ec2Instance);
    });
  }
}

// RDS Module
export class RdsModule extends Construct {
  public rdsInstance: db.DbInstance;

  constructor(scope: Construct, id: string, props: RdsProps) {
    super(scope, id);

    // Create DB Subnet Group
    const dbSubnetGroup = new db.DbSubnetGroup(this, "db-subnet-group", {
      name: `${props.projectName}-db-subnet-group`,
      subnetIds: props.subnetIds,
      tags: {
        Name: `${props.projectName}-db-subnet-group`,
        Environment: props.environment,
      },
    });

    // Create RDS Instance
    this.rdsInstance = new db.DbInstance(this, "db-instance", {
      identifier: `${props.projectName}-db`,
      engine: "mysql",
      engineVersion: "8.0",
      instanceClass: props.dbInstanceClass,
      allocatedStorage: props.dbStorageGb,
      storageType: "gp2",
      storageEncrypted: true,
      manageMasterUserPassword: true, // Use AWS-managed credentials
      username: "admin",
      port: 3306,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [props.securityGroupId],
      multiAz: true,
      backupRetentionPeriod: props.backupRetentionDays,
      deletionProtection: props.deletionProtection,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${props.projectName}-db-final-snapshot`,
      applyImmediately: false,
      tags: {
        Name: `${props.projectName}-db`,
        Environment: props.environment,
      },
    });
  }
}

// S3 Bucket Module
export class S3Module extends Construct {
  public bucket: s3Bucket.S3Bucket;

  constructor(scope: Construct, id: string, props: S3Props) {
    super(scope, id);

    // Create S3 bucket for logs
    this.bucket = new s3Bucket.S3Bucket(this, "logs-bucket", {
      bucket: `${props.projectName}-logs-${props.environment}`,
      forceDestroy: false,
      tags: {
        Name: `${props.projectName}-logs-${props.environment}`,
        Environment: props.environment,
      },
    });

    // Enable versioning
    new s3BucketVersioning.S3BucketVersioning(this, "bucket-versioning", {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    });

    // Block public access
    new s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(this, "bucket-public-access-block", {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}

// VPC Flow Logs Module
export class FlowLogsModule extends Construct {
  public logGroup: cloudwatchLogGroup.CloudwatchLogGroup;
  public flowLog: flowLog.FlowLog;

  constructor(scope: Construct, id: string, props: FlowLogsProps) {
    super(scope, id);

    // Create CloudWatch Log Group for VPC Flow Logs
    this.logGroup = new cloudwatchLogGroup.CloudwatchLogGroup(this, "flow-logs-group", {
      name: `/aws/vpc/flowlogs/${props.projectName}-${props.environment}`,
      retentionInDays: 30,
      tags: {
        Name: `${props.projectName}-flow-logs`,
        Environment: props.environment,
      },
    });

    // Create IAM Role for VPC Flow Logs
    const flowLogsRole = new iamRole.IamRole(this, "flow-logs-role", {
      name: `${props.projectName}-flow-logs-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Principal: {
              Service: "vpc-flow-logs.amazonaws.com",
            },
            Effect: "Allow",
          },
        ],
      }),
      tags: {
        Environment: props.environment,
      },
    });

    // Create IAM Policy for VPC Flow Logs
    new iamRolePolicy.IamRolePolicy(this, "flow-logs-policy", {
      name: `${props.projectName}-flow-logs-policy`,
      role: flowLogsRole.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "logs:DescribeLogStreams",
            ],
            Resource: [
              this.logGroup.arn,
              `${this.logGroup.arn}:*`,
            ],
            Effect: "Allow",
          },
        ],
      }),
    });

    // Create VPC Flow Logs
    this.flowLog = new flowLog.FlowLog(this, "vpc-flow-log", {
      logDestination: this.logGroup.arn,
      logDestinationType: "cloud-watch-logs",
      trafficType: "ALL",
      vpcId: props.vpcId,
      iamRoleArn: flowLogsRole.arn,
      tags: {
        Name: `${props.projectName}-vpc-flow-log`,
        Environment: props.environment,
      },
    });
  }
}

// SSM Parameter Store Module
export class SsmModule extends Construct {
  public dbEndpointParam: ssmParameter.SsmParameter;
  public dbPortParam: ssmParameter.SsmParameter;
  public dbCredentialsParam: ssmParameter.SsmParameter;

  constructor(scope: Construct, id: string, props: SsmProps) {
    super(scope, id);

    // Store DB endpoint in SSM Parameter Store
    this.dbEndpointParam = new ssmParameter.SsmParameter(this, "db-endpoint-param", {
      name: `/${props.projectName}/${props.environment}/db/endpoint`,
      type: "String",
      value: props.dbEndpoint,
      tags: {
        Environment: props.environment,
      },
    });

    // Store DB port in SSM Parameter Store
    this.dbPortParam = new ssmParameter.SsmParameter(this, "db-port-param", {
      name: `/${props.projectName}/${props.environment}/db/port`,
      type: "String",
      value: props.dbPort.toString(),
      tags: {
        Environment: props.environment,
      },
    });

    // Store DB credentials placeholder in SSM Parameter Store
    this.dbCredentialsParam = new ssmParameter.SsmParameter(this, "db-credentials-param", {
      name: `/${props.projectName}/${props.environment}/db/credentials_placeholder`,
      type: "String",
      value: "Use AWS RDS master user credentials from AWS Secrets Manager",
      tags: {
        Environment: props.environment,
      },
    });
  }
}
```

`lib/tap-stack.ts`:

```typescript
import { Construct } from "constructs";
import { TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws";
import {
  VpcModule,
  SecurityGroupModule,
  Ec2Module,
  RdsModule,
  S3Module,
  FlowLogsModule,
  SsmModule,
} from "./modules";

interface TapStackProps {
  projectName: string;
  environment?: string;
  region?: string;
  sshAllowedCidr: string;
  instanceType?: string;
  dbInstanceClass?: string;
  dbStorageGb?: number;
  backupRetentionDays?: number;
  deletionProtection?: boolean;
  publicSubnetCidrs?: string[];
  privateSubnetCidrs?: string[];
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id);

    // Validate required parameters
    if (!props.sshAllowedCidr) {
      throw new Error("sshAllowedCidr parameter is required");
    }

    // Set defaults
    const environment = props.environment || "production";
    const region = props.region || "us-east-1";
    const instanceType = props.instanceType || "t3.micro";
    const dbInstanceClass = props.dbInstanceClass || "db.t3.medium";
    const dbStorageGb = props.dbStorageGb || 20;
    const backupRetentionDays = props.backupRetentionDays || 7;
    const deletionProtection = props.deletionProtection !== undefined ? props.deletionProtection : true;
    const publicSubnetCidrs = props.publicSubnetCidrs || ["10.0.1.0/24", "10.0.2.0/24"];
    const privateSubnetCidrs = props.privateSubnetCidrs || ["10.0.3.0/24", "10.0.4.0/24"];

    // Configure AWS Provider
    new AwsProvider(this, "aws", {
      region,
    });

    // Create VPC and networking resources
    const vpc = new VpcModule(this, "vpc", {
      projectName: props.projectName,
      environment,
      cidrBlock: "10.0.0.0/16",
      publicSubnetCidrs,
      privateSubnetCidrs,
      region,
    });

    // Create Security Groups
    const securityGroups = new SecurityGroupModule(this, "security-groups", {
      projectName: props.projectName,
      environment,
      vpcId: vpc.vpc.id,
      sshAllowedCidr: props.sshAllowedCidr,
    });

    // Create EC2 Instances in public subnets
    const ec2 = new Ec2Module(this, "ec2", {
      projectName: props.projectName,
      environment,
      subnetIds: vpc.publicSubnets.map(subnet => subnet.id),
      securityGroupId: securityGroups.publicInstanceSg.id,
      instanceType,
      region,
    });

    // Create RDS Instance in private subnets
    const rds = new RdsModule(this, "rds", {
      projectName: props.projectName,
      environment,
      subnetIds: vpc.privateSubnets.map(subnet => subnet.id),
      securityGroupId: securityGroups.rdsInstanceSg.id,
      dbInstanceClass,
      dbStorageGb,
      backupRetentionDays,
      deletionProtection,
      region,
    });

    // Create S3 Bucket for logs
    const s3 = new S3Module(this, "s3", {
      projectName: props.projectName,
      environment,
    });

    // Enable VPC Flow Logs
    const flowLogs = new FlowLogsModule(this, "flow-logs", {
      projectName: props.projectName,
      environment,
      vpcId: vpc.vpc.id,
    });

    // Store DB connection info in SSM Parameter Store
    const ssm = new SsmModule(this, "ssm", {
      projectName: props.projectName,
      environment,
      dbEndpoint: rds.rdsInstance.endpoint,
      dbPort: 3306,
    });

    // Outputs
    new TerraformOutput(this, "vpc_id", {
      value: vpc.vpc.id,
      description: "VPC ID",
    });

    new TerraformOutput(this, "public_subnet_ids", {
      value: vpc.publicSubnets.map(subnet => subnet.id),
      description: "Public Subnet IDs",
    });

    new TerraformOutput(this, "private_subnet_ids", {
      value: vpc.privateSubnets.map(subnet => subnet.id),
      description: "Private Subnet IDs",
    });

    new TerraformOutput(this, "nat_gateway_id", {
      value: vpc.natGateway.id,
      description: "NAT Gateway ID",
    });

    new TerraformOutput(this, "nat_eip", {
      value: vpc.natEip.publicIp,
      description: "NAT Gateway Elastic IP",
    });

    new TerraformOutput(this, "public_instance_ids", {
      value: ec2.instances.map(instance => instance.id),
      description: "Public EC2 Instance IDs",
    });

    new TerraformOutput(this, "public_security_group_id", {
      value: securityGroups.publicInstanceSg.id,
      description: "Public Security Group ID",
    });

    new TerraformOutput(this, "rds_security_group_id", {
      value: securityGroups.rdsInstanceSg.id,
      description: "RDS Security Group ID",
    });

    new TerraformOutput(this, "rds_endpoint", {
      value: rds.rdsInstance.endpoint,
      description: "RDS Endpoint",
    });

    new TerraformOutput(this, "rds_port", {
      value: rds.rdsInstance.port,
      description: "RDS Port",
    });

    new TerraformOutput(this, "s3_bucket_name", {
      value: s3.bucket.bucket,
      description: "S3 Bucket Name for Logs",
    });

    new TerraformOutput(this, "cloudwatch_log_group_name", {
      value: flowLogs.logGroup.name,
      description: "CloudWatch Log Group Name for VPC Flow Logs",
    });

    new TerraformOutput(this, "ssm_parameter_names", {
      value: [
        ssm.dbEndpointParam.name,
        ssm.dbPortParam.name,
        ssm.dbCredentialsParam.name,
      ],
      description: "SSM Parameter Names",
    });
  }
}
```
