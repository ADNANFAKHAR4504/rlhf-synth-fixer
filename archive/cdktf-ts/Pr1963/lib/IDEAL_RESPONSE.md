## lib/modules.ts

```typescript
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

export interface VpcModuleConfig {
  name: string;
  cidrBlock: string;
  tags: { [key: string]: string };
}

export interface VpcModuleOutputs {
  vpc: Vpc;
  publicSubnets: Subnet[];
  privateSubnets: Subnet[];
  internetGateway: InternetGateway;
  natGateway: NatGateway;
}

export class VpcModule extends Construct {
  public readonly outputs: VpcModuleOutputs;

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Create VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.name}-vpc`,
        ...config.tags,
      },
    });

    // Create Internet Gateway
    const internetGateway = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `${config.name}-igw`,
        ...config.tags,
      },
    });

    // Create public and private subnets across 3 AZs
    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];

    for (let i = 0; i < 3; i++) {
      // Public subnet
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${config.name}-public-subnet-${i + 1}`,
          Type: 'Public',
          ...config.tags,
        },
      });
      publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        tags: {
          Name: `${config.name}-private-subnet-${i + 1}`,
          Type: 'Private',
          ...config.tags,
        },
      });
      privateSubnets.push(privateSubnet);
    }

    // Create Elastic IP for NAT Gateway
    const natEip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: `${config.name}-nat-eip`,
        ...config.tags,
      },
    });

    // Create NAT Gateway in first public subnet
    const natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: publicSubnets[0].id,
      tags: {
        Name: `${config.name}-nat-gateway`,
        ...config.tags,
      },
    });

    // Create route table for public subnets
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      tags: {
        Name: `${config.name}-public-rt`,
        ...config.tags,
      },
    });

    // Route to Internet Gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create route table for private subnets
    const privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: vpc.id,
      tags: {
        Name: `${config.name}-private-rt`,
        ...config.tags,
      },
    });

    // Route to NAT Gateway
    new Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    });

    // Associate private subnets with private route table
    privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    this.outputs = {
      vpc,
      publicSubnets,
      privateSubnets,
      internetGateway,
      natGateway,
    };
  }
}

export interface IamModuleConfig {
  name: string;
  tags: { [key: string]: string };
}

export interface IamModuleOutputs {
  role: IamRole;
  instanceProfile: IamInstanceProfile;
}

export class IamModule extends Construct {
  public readonly outputs: IamModuleOutputs;

  constructor(scope: Construct, id: string, config: IamModuleConfig) {
    super(scope, id);

    // Create IAM role for EC2 instances
    const role = new IamRole(this, 'ec2-role', {
      name: `${config.name}-ec2-role`,
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
        Name: `${config.name}-ec2-role`,
        ...config.tags,
      },
    });

    // Attach S3 read-only policy
    new IamRolePolicyAttachment(this, 's3-readonly-policy', {
      role: role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
    });

    // Create instance profile
    const instanceProfile = new IamInstanceProfile(this, 'instance-profile', {
      name: `${config.name}-instance-profile`,
      role: role.name,
      tags: {
        Name: `${config.name}-instance-profile`,
        ...config.tags,
      },
    });

    this.outputs = {
      role,
      instanceProfile,
    };
  }
}

export interface Ec2AsgModuleConfig {
  name: string;
  vpcId: string;
  privateSubnetIds: string[];
  instanceProfile: IamInstanceProfile;
  tags: { [key: string]: string };
}

export interface Ec2AsgModuleOutputs {
  securityGroup: SecurityGroup;
  launchTemplate: LaunchTemplate;
  autoScalingGroup: AutoscalingGroup;
}

export class Ec2AsgModule extends Construct {
  public readonly outputs: Ec2AsgModuleOutputs;

  constructor(scope: Construct, id: string, config: Ec2AsgModuleConfig) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'amazon-linux', {
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

    // Create security group for EC2 instances
    const securityGroup = new SecurityGroup(this, 'ec2-sg', {
      name: `${config.name}-ec2-sg-new`,
      description: 'Security group for EC2 instances',
      vpcId: config.vpcId,
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic',
        },
      ],
      ingress: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/16'],
          description: 'SSH from VPC',
        },
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/16'],
          description: 'HTTP from VPC',
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/16'],
          description: 'HTTPS from VPC',
        },
      ],
      tags: {
        Name: `${config.name}-ec2-sg`,
        ...config.tags,
      },
    });

    // Create launch template
    const launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: `${config.name}-launch-template`,
      imageId: ami.id,
      instanceType: 't3.micro',
      vpcSecurityGroupIds: [securityGroup.id],
      iamInstanceProfile: {
        name: config.instanceProfile.name,
      },
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            Name: `${config.name}-instance`,
            ...config.tags,
          },
        },
        {
          resourceType: 'volume',
          tags: {
            Name: `${config.name}-volume`,
            ...config.tags,
          },
        },
      ],
      tags: {
        Name: `${config.name}-launch-template`,
        ...config.tags,
      },
    });

    // Create Auto Scaling Group
    const autoScalingGroup = new AutoscalingGroup(this, 'asg', {
      name: `${config.name}-asg`,
      vpcZoneIdentifier: config.privateSubnetIds,
      minSize: 1,
      maxSize: 6,
      desiredCapacity: 3,
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      tag: [
        {
          key: 'Name',
          value: `${config.name}-asg`,
          propagateAtLaunch: false,
        },
        ...Object.entries(config.tags).map(([key, value]) => ({
          key,
          value,
          propagateAtLaunch: false,
        })),
      ],

      dependsOn: [
        launchTemplate, // ensures ASG waits for Launch Template
      ],
    });

    this.outputs = {
      securityGroup,
      launchTemplate,
      autoScalingGroup,
    };
  }
}

```

## lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { VpcModule, IamModule, Ec2AsgModule } from '../lib/modules';
import { TerraformOutput } from 'cdktf';
// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Common configuration
    const namePrefix = 'MyApp';
    const projectTags = {
      Project: 'MyApp',
    };

    // Create VPC with public and private subnets across 3 AZs
    const vpcModule = new VpcModule(this, 'vpc', {
      name: namePrefix,
      cidrBlock: '10.0.0.0/16',
      tags: projectTags,
    });

    // Create IAM roles and instance profile
    const iamModule = new IamModule(this, 'iam', {
      name: namePrefix,
      tags: projectTags,
    });

    // Create EC2 instances with Auto Scaling
    const ec2AsgModule = new Ec2AsgModule(this, 'ec2-asg', {
      name: namePrefix,
      vpcId: vpcModule.outputs.vpc.id,
      privateSubnetIds: vpcModule.outputs.privateSubnets.map(
        subnet => subnet.id
      ),
      instanceProfile: iamModule.outputs.instanceProfile,
      tags: projectTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    // VPC Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.outputs.vpc.id,
      description: 'ID of the VPC',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.outputs.publicSubnets.map(subnet => subnet.id),
      description: 'IDs of the public subnets',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.outputs.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of the private subnets',
    });

    // IAM Outputs
    new TerraformOutput(this, 'instance-profile-name', {
      value: iamModule.outputs.instanceProfile.name,
      description: 'Name of the EC2 Instance Profile',
    });

    new TerraformOutput(this, 'iam-role-name', {
      value: iamModule.outputs.role.name,
      description: 'Name of the IAM Role',
    });

    // EC2 Auto Scaling Outputs
    new TerraformOutput(this, 'auto-scaling-group-name', {
      value: ec2AsgModule.outputs.autoScalingGroup.name,
      description: 'Name of the Auto Scaling Group',
    });

    new TerraformOutput(this, 'launch-template-id', {
      value: ec2AsgModule.outputs.launchTemplate.id,
      description: 'ID of the Launch Template',
    });

    new TerraformOutput(this, 'ec2-security-group-id', {
      value: ec2AsgModule.outputs.securityGroup.id,
      description: 'ID of the EC2 Security Group',
    });

    // Internet Gateway Output
    new TerraformOutput(this, 'internet-gateway-id', {
      value: vpcModule.outputs.internetGateway.id,
      description: 'ID of the Internet Gateway',
    });

    // NAT Gateway Output
    new TerraformOutput(this, 'nat-gateway-id', {
      value: vpcModule.outputs.natGateway.id,
      description: 'ID of the NAT Gateway',
    });
  }
}

```