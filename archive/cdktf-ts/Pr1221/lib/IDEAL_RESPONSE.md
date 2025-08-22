lib/tap-stack.ts
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { dataAwsAmi } from '@cdktf/provider-aws';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// FIX: Import the new consolidated VpcModule and the S3BucketModule
import { VpcModule, S3BucketModule } from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

const AWS_REGION_OVERRIDE = 'us-west-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    
    // FIX: Add Environment: Production tag to meet compliance requirements
    const defaultTags = {
        tags: {
            Environment: 'Production',
            ...props?.defaultTags?.tags,
        }
    };

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [defaultTags],
    });

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    const amzLinux2Ami = new dataAwsAmi.DataAwsAmi(this, 'AmzLinux2', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'virtualization-type', values: ['hvm'] },
      ],
    });

    // --- Instantiate Consolidated VPC and EC2 Module ---
    // FIX: Instantiate the single VpcModule as required by the review
    const vpcModule = new VpcModule(this, 'VpcAndCompute', {
      cidrBlock: '10.0.0.0/16',
      ami: amzLinux2Ami.id,
      tags: defaultTags.tags, // Pass tags down to the module
    });

    // --- Instantiate S3 Bucket Module ---
    const s3Module = new S3BucketModule(this, 'S3Bucket', {
      bucketName: `tap-secure-bucket-${this.node.addr}`,
      tags: defaultTags.tags, // Pass tags down to the module
    });

    // --- Outputs ---
    // FIX: Update outputs to reflect the new architecture with multiple subnets
    new TerraformOutput(this, 'VpcId', {
      description: 'ID of the provisioned VPC',
      value: vpcModule.vpc.id,
    });

    new TerraformOutput(this, 'PublicSubnetIds', {
      description: 'IDs of the public subnets',
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
    });

    new TerraformOutput(this, 'PrivateSubnetIds', {
      description: 'IDs of the private subnets',
      value: vpcModule.privateSubnets.map(subnet => subnet.id),
    });

    new TerraformOutput(this, 'S3BucketName', {
      description: 'Name of the secure S3 bucket',
      value: s3Module.bucket.bucket,
    });

    new TerraformOutput(this, 'Ec2InstanceId', {
      description: 'ID of the EC2 instance',
      value: vpcModule.instance.id,
    });
  }
}

lib/modules.ts
import { Construct } from 'constructs';

// =======================
// AWS Provider resources
// =======================
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

// =============================================================================
// Consolidated VPC Module
// =============================================================================

export interface VpcModuleProps {
  readonly cidrBlock: string;
  readonly ami: string;
  readonly tags: { [key: string]: string };
}

export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[] = [];
  public readonly privateSubnets: Subnet[] = [];
  public readonly instance: Instance;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    const mergedTags = { ...props.tags, Name: 'tap-vpc' };

    this.vpc = new Vpc(this, 'CustomVpc', {
      cidrBlock: props.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: mergedTags,
    });

    const internetGateway = new InternetGateway(this, 'Igw', {
      vpcId: this.vpc.id,
      tags: { ...props.tags, Name: 'tap-igw' },
    });

    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      vpcId: this.vpc.id,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: internetGateway.id,
        },
      ],
      tags: { ...props.tags, Name: 'tap-public-rt' },
    });
    
    // FIX: Create 2 Public and 2 Private Subnets across two AZs
    const availabilityZones = ['us-west-2a', 'us-west-2b'];
    const publicSubnetCidrs = ['10.0.1.0/24', '10.0.2.0/24'];
    const privateSubnetCidrs = ['10.0.101.0/24', '10.0.102.0/24'];

    for (let i = 0; i < availabilityZones.length; i++) {
        const az = availabilityZones[i];
        
        // --- Public Subnet ---
        const publicSubnet = new Subnet(this, `PublicSubnet-${i}`, {
            vpcId: this.vpc.id,
            cidrBlock: publicSubnetCidrs[i],
            availabilityZone: az,
            mapPublicIpOnLaunch: true,
            tags: { ...props.tags, Name: `tap-public-subnet-${az}` },
        });
        this.publicSubnets.push(publicSubnet);

        new RouteTableAssociation(this, `PublicSubnetAssociation-${i}`, {
            subnetId: publicSubnet.id,
            routeTableId: publicRouteTable.id,
        });

        // --- NAT Gateway for Private Subnet ---
        const eip = new Eip(this, `NatGatewayEip-${i}`, {
            domain: 'vpc',
            tags: { ...props.tags, Name: `tap-nat-eip-${az}` },
        });

        const natGateway = new NatGateway(this, `NatGateway-${i}`, {
            allocationId: eip.id,
            subnetId: publicSubnet.id,
            dependsOn: [internetGateway],
            tags: { ...props.tags, Name: `tap-nat-gw-${az}` },
        });
        
        // --- Private Subnet ---
        const privateSubnet = new Subnet(this, `PrivateSubnet-${i}`, {
            vpcId: this.vpc.id,
            cidrBlock: privateSubnetCidrs[i],
            availabilityZone: az,
            tags: { ...props.tags, Name: `tap-private-subnet-${az}` },
        });
        this.privateSubnets.push(privateSubnet);

        const privateRouteTable = new RouteTable(this, `PrivateRouteTable-${i}`, {
            vpcId: this.vpc.id,
            route: [{
                cidrBlock: '0.0.0.0/0',
                natGatewayId: natGateway.id,
            }],
            tags: { ...props.tags, Name: `tap-private-rt-${az}` },
        });

        new RouteTableAssociation(this, `PrivateSubnetAssociation-${i}`, {
            subnetId: privateSubnet.id,
            routeTableId: privateRouteTable.id,
        });
    }

    // --- Security Group ---
    // FIX: Added required ingress rules for SSH, HTTP, and HTTPS
    const webSecurityGroup = new SecurityGroup(this, 'WebSg', {
      name: 'tap-web-sg',
      vpcId: this.vpc.id,
      description: 'Allow web and restricted SSH traffic',
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP traffic',
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTPS traffic',
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['203.0.113.0/24'], // FIX: Restricted SSH access
          description: 'Allow SSH from specific CIDR',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: { ...props.tags, Name: 'tap-web-sg' },
    });

    // --- IAM Role and Instance Profile ---
    const ec2Role = new IamRole(this, 'Ec2Role', {
      name: 'ec2-ssm-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{ Action: 'sts:AssumeRole', Effect: 'Allow', Principal: { Service: 'ec2.amazonaws.com' }}],
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
    
    // --- EC2 Instance ---
    this.instance = new Instance(this, 'AppInstance', {
      ami: props.ami,
      instanceType: 't3.micro',
      subnetId: this.privateSubnets[0].id, // Place instance in the first private subnet
      vpcSecurityGroupIds: [webSecurityGroup.id],
      iamInstanceProfile: instanceProfile.name,
      // FIX: Enable EBS encryption for better security
      rootBlockDevice: {
          encrypted: true,
      },
      tags: { ...props.tags, Name: 'tap-ec2-instance' },
    });
  }
}

// =============================================================================
// S3 Bucket Module (Unchanged)
// =============================================================================

export interface S3BucketModuleProps {
  readonly bucketName: string;
  readonly tags: { [key: string]: string };
}

export class S3BucketModule extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, id: string, props: S3BucketModuleProps) {
    super(scope, id);

    this.bucket = new S3Bucket(this, 'PrivateBucket', {
      bucket: props.bucketName,
      tags: { ...props.tags, Name: 'tap-secure-bucket' },
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