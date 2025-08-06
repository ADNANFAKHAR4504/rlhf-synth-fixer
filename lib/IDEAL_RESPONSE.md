// main.ts
import { Construct } from 'constructs';
import { App, TerraformStack, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

import { NetworkingConstruct, NetworkingOutput } from './networking-construct';
import { SecurityConstruct, SecurityOutput } from './security-construct';
import { IamConstruct, IamOutput } from './iam-construct';
import { ComputeConstruct } from './compute-construct';

/**
 * Defines the properties for the main AWS infrastructure stack.
 */
interface MyStackProps {
  /**
   * The AWS region where resources will be provisioned.
   */
  region: string;
  /**
   * The CIDR block for the Virtual Private Cloud (VPC).
   */
  vpcCidr: string;
  /**
   * The IP range allowed for SSH and HTTP ingress.
   */
  allowedIngressIpRange: string;
  /**
   * Common tags to apply to all resources.
   */
  commonTags: { [key: string]: string };
}

/**
 * MyStack class represents the main CDKTF stack for the AWS infrastructure.
 * It orchestrates the creation of all major components using modular constructs.
 */
class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: MyStackProps) {
    super(scope, id);

    // Configure the AWS provider with the specified region and default tags.
    // Default tags are automatically applied to all resources managed by this provider.
    new AwsProvider(this, 'aws', {
      region: props.region,
      defaultTags: [{
        tags: props.commonTags,
      }],
    });

    // Fetch available Availability Zones for the specified region.
    // We'll use the first 3 AZs for our subnets.
    const azs = new DataAwsAvailabilityZones(this, 'available_azs', {
      state: 'available',
      // Filter for us-east-1 specific zones if needed, though 'available' should suffice.
      // E.g., filter: [{ name: 'zone-id', values: ['use1-az1', 'use1-az2', 'use1-az4'] }]
    });

    // 1. Networking Construct
    // Provisions VPC, public/private subnets, Internet Gateway, and NAT Gateway.
    const networking = new NetworkingConstruct(this, 'networking', {
      vpcCidr: props.vpcCidr,
      azs: Fn.slice(azs.names, 0, 3) as string[], // Use the first 3 available AZs
    });

    // 2. Security Construct
    // Defines Security Groups for ingress control.
    const security = new SecurityConstruct(this, 'security', {
      vpcId: networking.outputs.vpcId,
      allowedIngressIpRange: props.allowedIngressIpRange,
    });

    // 3. IAM Construct
    // Defines IAM Role and Instance Profile for EC2 instances.
    const iam = new IamConstruct(this, 'iam', {});

    // 4. Compute Construct (Optional for testing)
    // Provisions an EC2 instance in a private subnet with the defined security group and IAM role.
    new ComputeConstruct(this, 'compute', {
      subnetId: networking.outputs.privateSubnetIds[0], // Place in the first private subnet
      securityGroupId: security.outputs.webSecurityGroupId,
      instanceProfileArn: iam.outputs.ec2InstanceProfileArn,
    });
  }
}

// networking-construct.ts
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Fn } from 'cdktf';

/**
 * Defines the input properties for the NetworkingConstruct.
 */
export interface NetworkingProps {
  /**
   * The CIDR block for the VPC.
   */
  vpcCidr: string;
  /**
   * A list of Availability Zone names to span the subnets across.
   * Must contain at least 3 AZs.
   */
  azs: string[];
}

/**
 * Defines the output properties from the NetworkingConstruct.
 */
export interface NetworkingOutput {
  /**
   * The ID of the created VPC.
   */
  vpcId: string;
  /**
   * A list of IDs for the public subnets.
   */
  publicSubnetIds: string[];
  /**
   * A list of IDs for the private subnets.
   */
  privateSubnetIds: string[];
  /**
   * The ID of the NAT Gateway.
   */
  natGatewayId: string;
}

/**
 * NetworkingConstruct provisions the VPC, subnets (public/private),
 * Internet Gateway, and NAT Gateway.
 */
export class NetworkingConstruct extends Construct {
  public readonly outputs: NetworkingOutput;

  constructor(scope: Construct, id: string, props: NetworkingProps) {
    super(scope, id);

    if (props.azs.length < 3) {
      throw new Error('NetworkingConstruct requires at least 3 Availability Zones.');
    }

    // Create a new VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${id}-vpc`,
      },
    });

    // Create an Internet Gateway and attach it to the VPC
    const internetGateway = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `${id}-igw`,
      },
    });

    // Create an Elastic IP for the NAT Gateway
    const natEip = new Eip(this, 'nat_eip', {
      vpc: true, // Associate with VPC
      tags: {
        Name: `${id}-nat-eip`,
      },
    });

    const publicSubnetIds: string[] = [];
    const privateSubnetIds: string[] = [];
    let natGateway: NatGateway;

    // Iterate over the provided Availability Zones to create subnets
    props.azs.forEach((az, index) => {
      // Calculate CIDR blocks for subnets
      // Example: If VPC is 10.0.0.0/16, public subnets could be 10.0.0.0/24, 10.0.1.0/24, etc.
      // Private subnets could be 10.0.10.0/24, 10.0.11.0/24, etc.
      const publicSubnetCidr = Fn.cidrsubnet(props.vpcCidr, 8, index); // /24 from /16
      const privateSubnetCidr = Fn.cidrsubnet(props.vpcCidr, 8, index + 10); // /24 from /16, offset for private

      // Create Public Subnet
      const publicSubnet = new Subnet(this, `public_subnet_${index}`, {
        vpcId: vpc.id,
        cidrBlock: publicSubnetCidr,
        availabilityZone: az,
        mapPublicIpOnLaunch: true, // Instances launched here get public IPs
        tags: {
          Name: `${id}-public-subnet-${az}`,
        },
      });
      publicSubnetIds.push(publicSubnet.id);

      // Create Private Subnet
      const privateSubnet = new Subnet(this, `private_subnet_${index}`, {
        vpcId: vpc.id,
        cidrBlock: privateSubnetCidr,
        availabilityZone: az,
        tags: {
          Name: `${id}-private-subnet-${az}`,
        },
      });
      privateSubnetIds.push(privateSubnet.id);

      // Create Route Table for Public Subnet
      const publicRouteTable = new RouteTable(this, `public_route_table_${index}`, {
        vpcId: vpc.id,
        tags: {
          Name: `${id}-public-rt-${az}`,
        },
      });

      // Add route to Internet Gateway for Public Route Table
      publicRouteTable.addRoute('internet_route', {
        cidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      });

      // Associate Public Subnet with Public Route Table
      new RouteTableAssociation(this, `public_rt_assoc_${index}`, {
        subnetId: publicSubnet.id,
        routeTableId: publicRouteTable.id,
      });

      // The NAT Gateway only needs to be created once in one of the public subnets.
      // We'll create it in the first public subnet.
      if (index === 0) {
        natGateway = new NatGateway(this, 'nat_gateway', {
          allocationId: natEip.id,
          subnetId: publicSubnet.id, // NAT Gateway must be in a public subnet
          tags: {
            Name: `${id}-nat-gateway`,
          },
        });
      }

      // Create Route Table for Private Subnet
      const privateRouteTable = new RouteTable(this, `private_route_table_${index}`, {
        vpcId: vpc.id,
        tags: {
          Name: `${id}-private-rt-${az}`,
        },
      });

      // Add route to NAT Gateway for Private Route Table
      // Ensure natGateway is defined before adding the route
      if (natGateway!) {
        privateRouteTable.addRoute('nat_route', {
          cidrBlock: '0.0.0.0/0',
          natGatewayId: natGateway.id,
        });
      }


      // Associate Private Subnet with Private Route Table
      new RouteTableAssociation(this, `private_rt_assoc_${index}`, {
        subnetId: privateSubnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    this.outputs = {
      vpcId: vpc.id,
      publicSubnetIds: publicSubnetIds,
      privateSubnetIds: privateSubnetIds,
      natGatewayId: natGateway!.id, // Ensure natGateway is assigned
    };
  }
}

// security-construct.ts
import { Construct } from 'constructs';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

/**
 * Defines the input properties for the SecurityConstruct.
 */
export interface SecurityProps {
  /**
   * The ID of the VPC to associate the security groups with.
   */
  vpcId: string;
  /**
   * The IP range allowed for SSH and HTTP ingress.
   * E.g., '203.0.113.0/24'
   */
  allowedIngressIpRange: string;
}

/**
 * Defines the output properties from the SecurityConstruct.
 */
export interface SecurityOutput {
  /**
   * The ID of the security group allowing web and SSH access.
   */
  webSecurityGroupId: string;
}

/**
 * SecurityConstruct defines and provisions AWS Security Groups.
 */
export class SecurityConstruct extends Construct {
  public readonly outputs: SecurityOutput;

  constructor(scope: Construct, id: string, props: SecurityProps) {
    super(scope, id);

    // Security Group for web servers (HTTP & SSH access)
    const webSecurityGroup = new SecurityGroup(this, 'web_sg', {
      name: `${id}-web-sg`,
      description: 'Allow HTTP and SSH ingress from specific IP range',
      vpcId: props.vpcId,
      ingress: [], // Ingress rules will be added via SecurityGroupRule
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1', // All protocols
          cidrBlocks: ['0.0.0.0/0'], // Allow all outbound traffic
          description: 'Allow all outbound traffic',
        },
      ],
      tags: {
        Name: `${id}-web-sg`,
      },
    });

    // Ingress rule for HTTP (Port 80)
    new SecurityGroupRule(this, 'web_sg_http_ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: [props.allowedIngressIpRange],
      securityGroupId: webSecurityGroup.id,
      description: 'Allow HTTP from specified IP range',
    });

    // Ingress rule for SSH (Port 22)
    new SecurityGroupRule(this, 'web_sg_ssh_ingress', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: [props.allowedIngressIpRange],
      securityGroupId: webSecurityGroup.id,
      description: 'Allow SSH from specified IP range',
    });

    this.outputs = {
      webSecurityGroupId: webSecurityGroup.id,
    };
  }
}

// iam-construct.ts
import { Construct } from 'constructs';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

/**
 * Defines the input properties for the IamConstruct.
 */
export interface IamProps {
  // No specific inputs needed for this basic IAM setup, but kept for consistency.
}

/**
 * Defines the output properties from the IamConstruct.
 */
export interface IamOutput {
  /**
   * The ARN of the created EC2 instance profile.
   */
  ec2InstanceProfileArn: string;
}

/**
 * IamConstruct defines IAM roles, policies, and instance profiles
 * for EC2 instances to securely access AWS services.
 */
export class IamConstruct extends Construct {
  public readonly outputs: IamOutput;

  constructor(scope: Construct, id: string, props: IamProps) {
    super(scope, id);

    // IAM Role for EC2 instances
    const ec2Role = new IamRole(this, 'ec2_role', {
      name: `${id}-ec2-role`,
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
        Name: `${id}-ec2-role`,
      },
    });

    // IAM Policy for S3 Read-Only Access
    const s3ReadOnlyPolicy = new IamPolicy(this, 's3_read_only_policy', {
      name: `${id}-s3-read-only-policy`,
      description: 'Allows EC2 instances to read from S3 buckets',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:ListBucket',
            ],
            Resource: [
              'arn:aws:s3:::*', // Grants access to all S3 buckets. Refine as needed for production.
              'arn:aws:s3:::*/*',
            ],
          },
        ],
      }),
      tags: {
        Name: `${id}-s3-read-only-policy`,
      },
    });

    // Attach the S3 Read-Only Policy to the EC2 Role
    new IamRolePolicyAttachment(this, 'ec2_s3_policy_attachment', {
      role: ec2Role.name,
      policyArn: s3ReadOnlyPolicy.arn,
    });

    // IAM Instance Profile for EC2 instances
    const ec2InstanceProfile = new IamInstanceProfile(this, 'ec2_instance_profile', {
      name: `${id}-ec2-instance-profile`,
      role: ec2Role.name,
      tags: {
        Name: `${id}-ec2-instance-profile`,
      },
    });

    this.outputs = {
      ec2InstanceProfileArn: ec2InstanceProfile.arn,
    };
  }
}

// compute-construct.ts
import { Construct } from 'constructs';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

/**
 * Defines the input properties for the ComputeConstruct.
 */
export interface ComputeProps {
  /**
   * The ID of the subnet where the EC2 instance will be launched.
   * This should typically be a private subnet.
   */
  subnetId: string;
  /**
   * The ID of the security group to associate with the EC2 instance.
   */
  securityGroupId: string;
  /**
   * The ARN of the IAM instance profile to attach to the EC2 instance.
   */
  instanceProfileArn: string;
  /**
   * (Optional) The instance type for the EC2 instance. Defaults to 't3.micro'.
   */
  instanceType?: string;
  /**
   * (Optional) The AMI ID for the EC2 instance. If not provided,
   * the latest Amazon Linux 2 AMI will be used.
   */
  amiId?: string;
}

/**
 * ComputeConstruct provisions an optional EC2 instance for testing
 * within the defined infrastructure.
 */
export class ComputeConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ComputeProps) {
    super(scope, id);

    let amiIdToUse: string;

    if (props.amiId) {
      amiIdToUse = props.amiId;
    } else {
      // Data source to get the latest Amazon Linux 2 AMI
      const ami = new DataAwsAmi(this, 'amazon_linux_ami', {
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
      amiIdToUse = ami.id;
    }

    // EC2 Instance for testing
    new Instance(this, 'test_instance', {
      ami: amiIdToUse,
      instanceType: props.instanceType || 't3.micro', // Default to t3.micro
      subnetId: props.subnetId,
      vpcSecurityGroupIds: [props.securityGroupId],
      iamInstanceProfileArn: props.instanceProfileArn,
      associatePublicIpAddress: false, // Ensure it's in the private subnet
      tags: {
        Name: `${id}-test-instance`,
      },
    });
  }
}

// app.ts (This file is typically generated by `cdktf init` and orchestrates the stack)
// You would run `cdktf synth` from the directory containing this file.

const app = new App();
new MyStack(app, 'aws-secure-infra', {
  region: 'us-east-1',
  vpcCidr: '10.0.0.0/16',
  allowedIngressIpRange: '203.0.113.0/24', // Example IP range
  commonTags: {
    Project: 'MyProject',
    Environment: 'Dev',
    Owner: 'Akshat Jain',
  },
});
app.synth();
