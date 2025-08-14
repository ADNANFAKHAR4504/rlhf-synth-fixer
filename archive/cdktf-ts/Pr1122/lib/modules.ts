import { Construct } from 'constructs';

// =======================
// VPC-related resources
// =======================
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';

// =======================
// EC2-related resources
// =======================
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { Instance } from '@cdktf/provider-aws/lib/instance';

// =======================
// S3-related resources
// =======================
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';

// =======================
// IAM-related resources
// =======================
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

// =============================================================================
// VPC Module
// =============================================================================

export interface VpcModuleProps {
  readonly cidrBlock: string;
  readonly publicSubnetCidr: string;
  readonly privateSubnetCidr: string;
  readonly availabilityZone: string;
}

export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnet: Subnet;
  public readonly privateSubnet: Subnet;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    this.vpc = new Vpc(this, 'CustomVpc', {
      cidrBlock: props.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { Name: 'tap-vpc' },
    });

    const internetGateway = new InternetGateway(this, 'Igw', {
      vpcId: this.vpc.id,
      tags: { Name: 'tap-igw' },
    });

    this.publicSubnet = new Subnet(this, 'PublicSubnet', {
      vpcId: this.vpc.id,
      cidrBlock: props.publicSubnetCidr,
      availabilityZone: props.availabilityZone,
      mapPublicIpOnLaunch: true,
      tags: { Name: 'tap-public-subnet' },
    });

    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      vpcId: this.vpc.id,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: internetGateway.id,
        },
      ],
      tags: { Name: 'tap-public-rt' },
    });

    new RouteTableAssociation(this, 'PublicSubnetAssociation', {
      subnetId: this.publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    this.privateSubnet = new Subnet(this, 'PrivateSubnet', {
      vpcId: this.vpc.id,
      cidrBlock: props.privateSubnetCidr,
      availabilityZone: props.availabilityZone,
      tags: { Name: 'tap-private-subnet' },
    });

    const eip = new Eip(this, 'NatGatewayEip', {
      // FIX: Changed 'domain' to 'vpc' for clarity and reliability
      domain: 'vpc',
    });

    const natGateway = new NatGateway(this, 'NatGateway', {
      allocationId: eip.id,
      subnetId: this.publicSubnet.id,
      // FIX: Ensure NAT Gateway is created after the Internet Gateway is attached
      dependsOn: [internetGateway],
      tags: { Name: 'tap-nat-gw' },
    });

    const privateRouteTable = new RouteTable(this, 'PrivateRouteTable', {
      vpcId: this.vpc.id,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          natGatewayId: natGateway.id,
        },
      ],
      tags: { Name: 'tap-private-rt' },
    });

    new RouteTableAssociation(this, 'PrivateSubnetAssociation', {
      subnetId: this.privateSubnet.id,
      routeTableId: privateRouteTable.id,
    });
  }
}

// =============================================================================
// S3 Bucket Module
// =============================================================================

export interface S3BucketModuleProps {
  readonly bucketName: string;
}

export class S3BucketModule extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, id: string, props: S3BucketModuleProps) {
    super(scope, id);

    this.bucket = new S3Bucket(this, 'PrivateBucket', {
      bucket: props.bucketName,
    });

    new S3BucketServerSideEncryptionConfigurationA(this, 'BucketEncryption', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });

    new S3BucketPublicAccessBlock(this, 'BucketPublicAccessBlock', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}

// =============================================================================
// EC2 Instance Module
// =============================================================================

export interface Ec2InstanceModuleProps {
  readonly subnetId: string;
  readonly ami: string;
  readonly vpcId: string;
}

export class Ec2InstanceModule extends Construct {
  public readonly instance: Instance;

  constructor(scope: Construct, id: string, props: Ec2InstanceModuleProps) {
    super(scope, id);

    const ec2Role = new IamRole(this, 'Ec2Role', {
      name: 'ec2-ssm-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'SsmPolicyAttachment', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    const instanceProfile = new IamInstanceProfile(this, 'InstanceProfile', {
      name: 'ec2-ssm-instance-profile',
      role: ec2Role.name,
    });

    const securityGroup = new SecurityGroup(this, 'Ec2Sg', {
      name: 'ec2-sg',
      vpcId: props.vpcId,
      description: 'Allow outbound traffic only',
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: { Name: 'tap-ec2-sg' },
    });

    this.instance = new Instance(this, 'AppInstance', {
      ami: props.ami,
      instanceType: 't3.micro',
      subnetId: props.subnetId,
      vpcSecurityGroupIds: [securityGroup.id],
      iamInstanceProfile: instanceProfile.name,
      tags: { Name: 'tap-ec2-instance' },
    });
  }
}
