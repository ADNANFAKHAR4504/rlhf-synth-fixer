import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { Fn } from 'cdktf';

// ? Import your stacks here
import * as aws from '@cdktf/provider-aws';
import {
  VPCModule,
  IAMModule,
  EC2Module,
  RDSModule,
  S3Module,
  CommonTags,
} from './modules';
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

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            ManagedBy: 'CDKTF',
            Project: 'TAP-Infrastructure',
          },
        },
      ],
    });

    // Define common tags
    const tags: CommonTags = {
      Environment: environmentSuffix,
      Department: 'DevOqps',
    };

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
    // Define availability zones using the region
    const availabilityZones = [`${awsRegion}a`, `${awsRegion}b`];

    // Get latest Amazon Linux 2 AMI
    const ami = new aws.dataAwsAmi.DataAwsAmi(this, 'ami', {
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
        {
          name: 'architecture',
          values: ['x86_64'],
        },
        {
          name: 'root-device-type',
          values: ['ebs'],
        },
      ],
    });

    // Deploy VPC Module
    const vpcModule = new VPCModule(this, 'vpc', {
      vpcCidr: '10.0.0.0/16',
      availabilityZones: availabilityZones,
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.11.0/24'],
      tags,
    });

    // Deploy IAM Module
    const iamModule = new IAMModule(this, 'iam', {
      tags,
    });

    // Deploy EC2 Module
    const ec2Module = new EC2Module(this, 'ec2', {
      vpcId: vpcModule.vpc.id,
      subnetId: vpcModule.privateSubnets[0].id,
      instanceType: 't3.micro',
      amiId: ami.id,
      sshAllowedCidr: process.env.SSH_ALLOWED_CIDR || '10.0.0.0/8',
      iamInstanceProfile: iamModule.ec2InstanceProfile.name,
      useKeyPair: false, // Default to Session Manager access
      tags,
    });

    // Deploy RDS Module
    const rdsModule = new RDSModule(this, 'rds', {
      vpcId: vpcModule.vpc.id,
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      ec2SecurityGroupId: ec2Module.securityGroup.id,
      dbName: 'tapdb',
      dbUsername: process.env.DB_USERNAME || 'tap_admin',
      dbPassword: process.env.DB_PASSWORD || 'ChangeMePlease123!',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      tags,
    });

    // Deploy S3 Module
    const s3Module = new S3Module(this, 's3', {
      bucketPrefix: `tap-secure-bucket-${environmentSuffix}`,
      vpcId: vpcModule.vpc.id,
      tags,
    });

    // Associate VPC endpoint with route tables
    const routeTables = new aws.dataAwsRouteTables.DataAwsRouteTables(
      this,
      'route-tables',
      {
        vpcId: vpcModule.vpc.id,
      }
    );

    new aws.vpcEndpointRouteTableAssociation.VpcEndpointRouteTableAssociation(
      this,
      's3-endpoint-association',
      {
        vpcEndpointId: s3Module.vpcEndpoint.id,
        routeTableId: Fn.element(routeTables.ids, 0), // ✅ Use Fn.element instead
      }
    );

    // Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'availability-zones', {
      value: availabilityZones.join(','),
      description: 'Availability Zones used',
    });

    new TerraformOutput(this, 'ami-id', {
      value: ami.id,
      description: 'AMI ID used for EC2 instance',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
      description: 'Public Subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id),
      description: 'Private Subnet IDs',
    });

    new TerraformOutput(this, 'ec2-security-group-id', {
      value: ec2Module.securityGroup.id,
      description: 'EC2 Security Group ID',
    });

    new TerraformOutput(this, 'rds-security-group-id', {
      value: rdsModule.dbSecurityGroup.id,
      description: 'RDS Security Group ID',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: ec2Module.instance.id,
      description: 'EC2 Instance ID',
    });

    new TerraformOutput(this, 'ec2-private-ip', {
      value: ec2Module.instance.privateIp,
      description: 'EC2 Instance Private IP',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS PostgreSQL Endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.id,
      description: 'S3 Bucket Name',
    });

    new TerraformOutput(this, 'nat-gateway-id', {
      value: vpcModule.natGateway.id,
      description: 'NAT Gateway ID',
    });

    new TerraformOutput(this, 'internet-gateway-id', {
      value: vpcModule.internetGateway.id,
      description: 'Internet Gateway ID',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
