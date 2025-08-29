import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

/**
 * Properties for VpcModule
 */
export interface VpcModuleProps {
  vpcCidr: string;
  publicSubnetCidr: string;
  privateSubnetCidr: string;
  availabilityZone: string;
}

/**
 * VPC Module - Creates VPC with public and private subnets, IGW, NAT Gateway
 */
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnet: Subnet;
  public readonly privateSubnet: Subnet;
  public readonly internetGateway: InternetGateway;
  public readonly natGateway: NatGateway;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    // Create VPC
    this.vpc = new Vpc(this, 'SecureAppVpc', {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: 'SecureAppVpc',
        Environment: 'production',
      },
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, 'SecureAppIgw', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'SecureAppIgw',
      },
    });

    // Create Public Subnet
    this.publicSubnet = new Subnet(this, 'SecureAppPublicSubnet', {
      vpcId: this.vpc.id,
      cidrBlock: props.publicSubnetCidr,
      availabilityZone: props.availabilityZone,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: 'SecureAppPublicSubnet',
        Type: 'Public',
      },
    });

    // Create Private Subnet
    this.privateSubnet = new Subnet(this, 'SecureAppPrivateSubnet', {
      vpcId: this.vpc.id,
      cidrBlock: props.privateSubnetCidr,
      availabilityZone: props.availabilityZone,
      tags: {
        Name: 'SecureAppPrivateSubnet',
        Type: 'Private',
      },
    });

    // Create Elastic IP for NAT Gateway
    const natEip = new Eip(this, 'SecureAppNatEip', {
      domain: 'vpc',
      tags: {
        Name: 'SecureAppNatEip',
      },
    });

    // Create NAT Gateway
    this.natGateway = new NatGateway(this, 'SecureAppNatGateway', {
      allocationId: natEip.id,
      subnetId: this.publicSubnet.id,
      tags: {
        Name: 'SecureAppNatGateway',
      },
    });

    // Create Route Table for Public Subnet
    const publicRouteTable = new RouteTable(this, 'SecureAppPublicRouteTable', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'SecureAppPublicRouteTable',
      },
    });

    // Create Route for Public Subnet to Internet Gateway
    new Route(this, 'SecureAppPublicRoute', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate Public Route Table with Public Subnet
    new RouteTableAssociation(this, 'SecureAppPublicRouteTableAssociation', {
      subnetId: this.publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    // Create Route Table for Private Subnet
    const privateRouteTable = new RouteTable(
      this,
      'SecureAppPrivateRouteTable',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: 'SecureAppPrivateRouteTable',
        },
      }
    );

    // Create Route for Private Subnet to NAT Gateway
    new Route(this, 'SecureAppPrivateRoute', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    });

    // Associate Private Route Table with Private Subnet
    new RouteTableAssociation(this, 'SecureAppPrivateRouteTableAssociation', {
      subnetId: this.privateSubnet.id,
      routeTableId: privateRouteTable.id,
    });
  }
}

/**
 * Properties for SecurityGroupModule
 */
export interface SecurityGroupModuleProps {
  vpcId: string;
}

/**
 * Security Group Module - Creates security group for EC2 instance
 */
export class SecurityGroupModule extends Construct {
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityGroupModuleProps) {
    super(scope, id);

    this.securityGroup = new SecurityGroup(this, 'SecureAppSecurityGroup', {
      name: 'SecureAppSecurityGroup',
      description: 'Security group for SecureApp EC2 instance',
      vpcId: props.vpcId,

      // SSH access only from specific IP range
      ingress: [
        {
          description: 'SSH access from specific IP range',
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['203.0.113.0/24'],
        },
      ],

      // Allow all outbound traffic
      egress: [
        {
          description: 'All outbound traffic',
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],

      tags: {
        Name: 'SecureAppSecurityGroup',
      },
    });
  }
}

/**
 * S3 Module - Creates encrypted S3 bucket for logging
 */
export class S3Module extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create S3 bucket for logs
    this.bucket = new S3Bucket(this, 'SecureAppLogsBucket', {
      bucket: `secureapp-logs-bucket-${Date.now()}`, // Ensure unique bucket name
      tags: {
        Name: 'SecureAppLogsBucket',
        Purpose: 'Application Logs',
      },
    });

    // Configure server-side encryption
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'SecureAppLogsBucketEncryption',
      {
        bucket: this.bucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Block all public access
    new S3BucketPublicAccessBlock(
      this,
      'SecureAppLogsBucketPublicAccessBlock',
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );
  }
}

/**
 * Properties for IamModule
 */
export interface IamModuleProps {
  bucketArn: string;
}

/**
 * IAM Module - Creates IAM role and policy for EC2 instance
 */
export class IamModule extends Construct {
  public readonly instanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, props: IamModuleProps) {
    super(scope, id);

    // Create IAM role for EC2 instance
    const ec2Role = new IamRole(this, 'SecureAppEc2Role', {
      name: 'SecureAppEc2Role',
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
        Name: 'SecureAppEc2Role',
      },
    });

    // Create custom policy for S3 access (least privilege)
    const s3Policy = new IamPolicy(this, 'SecureAppS3Policy', {
      name: 'SecureAppS3Policy',
      description:
        'Policy allowing EC2 instance to write to SecureApp logs bucket',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:PutObjectAcl'],
            Resource: `${props.bucketArn}/*`,
          },
        ],
      }),
    });

    // Attach custom S3 policy to role
    new IamRolePolicyAttachment(this, 'SecureAppS3PolicyAttachment', {
      role: ec2Role.name,
      policyArn: s3Policy.arn,
    });

    // Attach AWS managed policy for SSM (Systems Manager)
    new IamRolePolicyAttachment(this, 'SecureAppSsmPolicyAttachment', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    // Create instance profile
    this.instanceProfile = new IamInstanceProfile(
      this,
      'SecureAppInstanceProfile',
      {
        name: 'SecureAppInstanceProfile',
        role: ec2Role.name,
      }
    );
  }
}

/**
 * Properties for Ec2Module
 */
export interface Ec2ModuleProps {
  subnetId: string;
  securityGroupIds: string[];
  instanceProfileName: string;
}

/**
 * EC2 Module - Creates EC2 instance in private subnet
 */
export class Ec2Module extends Construct {
  public readonly instance: Instance;

  constructor(scope: Construct, id: string, props: Ec2ModuleProps) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const amazonLinux2Ami = new DataAwsAmi(this, 'SecureAppAmazonLinux2Ami', {
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

    // Create EC2 instance
    this.instance = new Instance(this, 'SecureAppInstance', {
      ami: amazonLinux2Ami.id,
      instanceType: 't3.micro',
      subnetId: props.subnetId,
      vpcSecurityGroupIds: props.securityGroupIds,
      iamInstanceProfile: props.instanceProfileName,

      // User data script to install SSM agent and configure logging
      userData: `#!/bin/bash
yum update -y
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent
# Create application directory
mkdir -p /opt/secureapp/logs
chown ec2-user:ec2-user /opt/secureapp/logs
# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip
`,

      tags: {
        Name: 'SecureAppInstance',
        Environment: 'production',
      },
    });
  }
}
