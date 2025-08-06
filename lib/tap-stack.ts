import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3Backend, TerraformStack, Fn, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

// AWS Resource Imports for internal constructs
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { Route } from '@cdktf/provider-aws/lib/route'; // Import Route for explicit route creation

// Import common types
import { CommonTags, BaseConstructProps } from './types/common';

/**
 * Defines the input properties for the NetworkingConstruct.
 */
interface NetworkingProps extends BaseConstructProps {
  /**
   * The CIDR block for the VPC.
   */
  vpcCidr: string;
  /**
   * A list of Availability Zone names to span the subnets across.
   * This list is expected to be a concrete array during synthesis/testing.
   */
  azs: string[];
}

/**
 * Defines the output properties from the NetworkingConstruct.
 */
interface NetworkingOutput {
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
class NetworkingConstruct extends Construct {
  public readonly outputs: NetworkingOutput;

  constructor(scope: Construct, id: string, props: NetworkingProps) {
    super(scope, id);

    // The validation check for AZs is now handled in TapStack before passing to NetworkingProps.
    // This construct can now assume it receives at least 3 AZs.

    // Create a new VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${id}-vpc`,
        ...props.tags, // Merge common tags
      },
    });

    // Create an Internet Gateway and attach it to the VPC
    const internetGateway = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `${id}-igw`,
        ...props.tags, // Merge common tags
      },
    });

    // Create an Elastic IP for the NAT Gateway
    // Removed 'vpc: true' as it's not a valid configurable property for Eip creation.
    const natEip = new Eip(this, 'nat_eip', {
      tags: {
        Name: `${id}-nat-eip`,
        ...props.tags, // Merge common tags
      },
    });

    const publicSubnetIds: string[] = [];
    const privateSubnetIds: string[] = [];
    let natGateway: NatGateway;

    // Iterate over the provided Availability Zones to create subnets
    props.azs.forEach((az, index) => {
      const publicSubnetCidr = Fn.cidrsubnet(props.vpcCidr, 8, index);
      const privateSubnetCidr = Fn.cidrsubnet(props.vpcCidr, 8, index + 10);

      // Create Public Subnet
      const publicSubnet = new Subnet(this, `public_subnet_${index}`, {
        vpcId: vpc.id,
        cidrBlock: publicSubnetCidr,
        availabilityZone: az,
        mapPublicIpOnLaunch: true, // Instances launched here get public IPs
        tags: {
          Name: `${id}-public-subnet-${az}`,
          ...props.tags, // Merge common tags
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
          ...props.tags, // Merge common tags
        },
      });
      privateSubnetIds.push(privateSubnet.id);

      // Create Route Table for Public Subnet
      const publicRouteTable = new RouteTable(
        this,
        `public_route_table_${index}`,
        {
          vpcId: vpc.id,
          tags: {
            Name: `${id}-public-rt-${az}`,
            ...props.tags, // Merge common tags
          },
        }
      );

      // Explicitly create Route for Internet Gateway for Public Route Table
      new Route(this, `public_internet_route_${index}`, {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
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
            ...props.tags, // Merge common tags
          },
        });
      }

      // Create Route Table for Private Subnet
      const privateRouteTable = new RouteTable(
        this,
        `private_route_table_${index}`,
        {
          vpcId: vpc.id,
          tags: {
            Name: `${id}-private-rt-${az}`,
            ...props.tags, // Merge common tags
          },
        }
      );

      // Explicitly create Route for NAT Gateway for Private Route Table
      // Ensure natGateway is defined before creating the route
      if (natGateway!) {
        new Route(this, `private_nat_route_${index}`, {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
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
      natGatewayId: natGateway!.id,
    };
  }
}

/**
 * Defines the input properties for the SecurityConstruct.
 */
interface SecurityProps extends BaseConstructProps {
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
interface SecurityOutput {
  /**
   * The ID of the security group allowing web and SSH access.
   */
  webSecurityGroupId: string;
}

/**
 * SecurityConstruct defines and provisions AWS Security Groups.
 */
class SecurityConstruct extends Construct {
  public readonly outputs: SecurityOutput;

  constructor(scope: Construct, id: string, props: SecurityProps) {
    super(scope, id);

    // Security Group for web servers (HTTP & SSH access)
    const webSecurityGroup = new SecurityGroup(this, 'web_sg', {
      name: `${id}-web-sg`,
      description: 'Allow HTTP and SSH ingress from specific IP range',
      vpcId: props.vpcId,
      ingress: [], // Ingress rules will be added via SecurityGroupRule
      // Single, comprehensive egress rule for all outbound traffic
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
        ...props.tags, // Merge common tags
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

/**
 * Defines the input properties for the IamConstruct.
 */
interface IamProps extends BaseConstructProps {
  // No specific inputs needed for this basic IAM setup, but kept for consistency.
}

/**
 * Defines the output properties from the IamConstruct.
 */
interface IamOutput {
  /**
   * The ARN of the created EC2 instance profile.
   */
  ec2InstanceProfileArn: string;
  /**
   * The name of the created EC2 instance profile.
   */
  ec2InstanceProfileName: string; // Added to expose the name for ComputeConstruct
}

/**
 * IamConstruct defines IAM roles, policies, and instance profiles
 * for EC2 instances to securely access AWS services.
 */
class IamConstruct extends Construct {
  public readonly outputs: IamOutput;

  constructor(scope: Construct, id: string, props: IamProps) {
    super(scope, id);

    // IAM Role for EC2 instances
    const ec2Role = new IamRole(this, 'ec2_role', {
      name: `${id}-ec2-role`, // Explicitly setting name
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
        ...props.tags, // Merge common tags
      },
    });

    // IAM Policy for S3 Read-Only Access
    const s3ReadOnlyPolicy = new IamPolicy(this, 's3_read_only_policy', {
      name: `${id}-s3-read-only-policy`, // Explicitly setting name
      description: 'Allows EC2 instances to read from S3 buckets',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:ListBucket'],
            Resource: [
              'arn:aws:s3:::*', // Grants access to all S3 buckets.
              'arn:aws:s3:::*/*',
            ],
          },
        ],
      }),
      tags: {
        Name: `${id}-s3-read-only-policy`,
        ...props.tags, // Merge common tags
      },
    });

    // IMPORTANT: For production, narrow down the 'Resource' in the S3 policy
    // to specific bucket ARNs (e.g., 'arn:aws:s3:::your-specific-bucket-name/*')
    // to adhere to the principle of least privilege.

    // Attach the S3 Read-Only Policy to the EC2 Role
    new IamRolePolicyAttachment(this, 'ec2_s3_policy_attachment', {
      role: ec2Role.name,
      policyArn: s3ReadOnlyPolicy.arn,
    });

    // IAM Instance Profile for EC2 instances
    const ec2InstanceProfile = new IamInstanceProfile(
      this,
      'ec2_instance_profile',
      {
        name: `${id}-ec2-instance-profile`, // Explicitly setting name
        role: ec2Role.name,
        tags: {
          Name: `${id}-ec2-instance-profile`,
          ...props.tags, // Merge common tags
        },
      }
    );

    this.outputs = {
      ec2InstanceProfileArn: ec2InstanceProfile.arn,
      ec2InstanceProfileName: ec2InstanceProfile.name, // Expose name
    };
  }
}

/**
 * Defines the input properties for the ComputeConstruct.
 */
interface ComputeProps extends BaseConstructProps {
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
   * The Name of the IAM instance profile to attach to the EC2 instance.
   */
  instanceProfileName: string; // Changed from instanceProfileArn to instanceProfileName
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
class ComputeConstruct extends Construct {
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
      iamInstanceProfile: props.instanceProfileName, // Corrected property name and value
      associatePublicIpAddress: false, // Ensure it's in the private subnet
      tags: {
        Name: `${id}-test-instance`,
        ...props.tags, // Merge common tags
      },
    });
  }
}

/**
 * Props for MyStack.
 * @interface MyStackProps
 * @property {string} bucketName - The name for the S3 bucket.
 * @property {{ [key: string]: string }} tags - Tags to apply to the S3 bucket.
 */
interface MyStackProps {
  bucketName: string;
  tags: { [key: string]: string };
}

/**
 * MyStack is a reusable Construct that provisions a simple S3 bucket.
 * It is designed to be instantiated within another TerraformStack (like TapStack)
 * so its resources are directly included in the parent stack's synthesis.
 */
class MyStack extends Construct {
  // Note: Not exported as it's used internally by TapStack
  constructor(scope: Construct, id: string, props: MyStackProps) {
    super(scope, id);

    // Create an S3 bucket within the scope of the parent stack (TapStack in this case)
    new S3Bucket(this, 'my_example_bucket', {
      bucket: props.bucketName,
      acl: 'private', // Access Control List set to private
      tags: props.tags, // Apply provided tags
      /**
       * WARNING: forceDestroy is set to true for development and testing purposes only.
       * This allows non-empty buckets to be destroyed when `cdktf destroy` is run.
       * In a production environment, this should typically be set to `false`
       * to prevent accidental data loss, or managed through lifecycle policies.
       */
      forceDestroy: true,
    });
  }
}

/**
 * Props for the TapStack.
 * @interface TapStackProps
 * @property {string} [environmentSuffix='dev'] - Suffix for environment-specific naming (e.g., 'dev', 'prod').
 * @property {string} [stateBucket='iac-rlhf-tf-states'] - S3 bucket name for Terraform state.
 * @property {string} [stateBucketRegion='us-east-1'] - AWS region for the S3 state bucket.
 * @property {string} [awsRegion='us-east-1'] - AWS region for provisioning resources.
 * @property { { [key: string]: string } } [defaultTags] - Default tags to apply to all AWS resources.
 * @property {boolean} [createMyStack=false] - Flag to conditionally instantiate MyStack for testing purposes.
 * @property {string} [vpcCidr='10.0.0.0/16'] - The CIDR block for the Virtual Private Cloud (VPC).
 * @property {string} [allowedIngressIpRange='203.0.113.0/24'] - The IP range allowed for SSH and HTTP ingress.
 */
interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  // This is the correct type: a direct map of string to string
  defaultTags?: { [key: string]: string };
  createMyStack?: boolean; // Prop to control MyStack instantiation for testing
  vpcCidr?: string; // Added for NetworkingConstruct
  allowedIngressIpRange?: string; // Added for SecurityConstruct
}

/**
 * AWS_REGION_OVERRIDE:
 * This constant can be used to explicitly override the AWS Region for the Terraform provider globally.
 * If set to a non-empty string, it will take precedence over `props?.awsRegion`.
 * Keep it empty if you intend to use `props?.awsRegion` or the default 'us-east-1'.
 * Consider removing this constant if no global override functionality is desired.
 */
const AWS_REGION_OVERRIDE = '';

/**
 * TapStack is the main CDKTF stack for provisioning AWS infrastructure.
 * It configures the AWS provider, S3 backend for state management,
 * and acts as a orchestrator for other modular constructs (like MyStack, now internal).
 */
export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    // Set default values for properties if not provided
    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const vpcCidr = props?.vpcCidr || '10.0.0.0/16'; // Default VPC CIDR
    const allowedIngressIpRange =
      props?.allowedIngressIpRange || '203.0.113.0/24'; // Default allowed IP range

    // Define default tags as required by the prompt
    const requiredDefaultTags: CommonTags = {
      Project: 'MyProject',
      Environment: 'Dev',
      Owner: 'Akshat Jain',
    };

    // Use provided defaultTags if available, otherwise use the required default tags
    const effectiveDefaultTags: CommonTags = props?.defaultTags
      ? { ...requiredDefaultTags, ...props.defaultTags } // Merge, with props.defaultTags overriding
      : requiredDefaultTags;

    // Corrected: defaultTags needs to be wrapped in an object with a 'tags' key
    // when passed to the AwsProvider constructor.
    const awsProviderDefaultTags: AwsProviderDefaultTags[] = [
      { tags: effectiveDefaultTags },
    ];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: awsProviderDefaultTags, // Apply default tags to all resources created by this provider
    });

    // Configure S3 Backend for Terraform state management
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`, // Unique state key per environment and stack ID
      region: stateBucketRegion,
      encrypt: true, // Encrypt state file at rest
    });

    // Using an escape hatch to enable S3 state locking natively.
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Fetch available Availability Zones for the specified region.
    const azs = new DataAwsAvailabilityZones(this, 'available_azs', {
      state: 'available',
    });

    // Provide a fallback for AZs if the data source doesn't return enough.
    // This ensures the NetworkingConstruct always gets at least 3 AZs for synthesis.
    const networkAzs =
      azs.names.length >= 3
        ? (azs.names as string[])
        : ['us-east-1a', 'us-east-1b', 'us-east-1c']; // Fallback to common AZs

    // Instantiate NetworkingConstruct
    const networking = new NetworkingConstruct(this, 'networking', {
      vpcCidr: vpcCidr,
      azs: networkAzs, // Use the potentially fallback AZs
      tags: effectiveDefaultTags, // Pass common tags
    });

    // Instantiate SecurityConstruct
    const security = new SecurityConstruct(this, 'security', {
      vpcId: networking.outputs.vpcId,
      allowedIngressIpRange: allowedIngressIpRange,
      tags: effectiveDefaultTags, // Pass common tags
    });

    // Instantiate IamConstruct
    const iam = new IamConstruct(this, 'iam', {
      tags: effectiveDefaultTags, // Pass common tags
    });

    // Instantiate ComputeConstruct (optional EC2 instance for testing)
    new ComputeConstruct(this, 'compute', {
      subnetId: networking.outputs.privateSubnetIds[0], // Place in the first private subnet
      securityGroupId: security.outputs.webSecurityGroupId,
      instanceProfileName: iam.outputs.ec2InstanceProfileName, // Pass the name
      tags: effectiveDefaultTags, // Pass common tags
    });

    // Conditionally instantiate MyStack (simple S3 bucket, now defined internally)
    if (props?.createMyStack) {
      new MyStack(this, 'MyModularStack', {
        bucketName: `${environmentSuffix}-my-example-bucket`, // Example bucket name
        tags: {
          Project: 'MyProject',
          Environment: environmentSuffix,
          Owner: 'Akshat Jain',
        },
      });
    }

    // Output key infrastructure identifiers for external reference
    new TerraformOutput(this, 'vpc_id_output', {
      value: networking.outputs.vpcId,
      description: 'The ID of the created VPC',
    });

    new TerraformOutput(this, 'public_subnet_ids_output', {
      value: networking.outputs.publicSubnetIds,
      description: 'IDs of the public subnets',
    });

    new TerraformOutput(this, 'private_subnet_ids_output', {
      value: networking.outputs.privateSubnetIds,
      description: 'IDs of the private subnets',
    });

    new TerraformOutput(this, 'web_security_group_id_output', {
      value: security.outputs.webSecurityGroupId,
      description: 'ID of the security group allowing web and SSH access',
    });

    new TerraformOutput(this, 'ec2_instance_profile_arn_output', {
      value: iam.outputs.ec2InstanceProfileArn,
      description: 'ARN of the EC2 instance profile for S3 access',
    });
  }
}
