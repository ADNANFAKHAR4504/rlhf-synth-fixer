## lib/modules.ts

```typescript
import { Construct } from 'constructs';

import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';

import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';

import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

import { Instance } from '@cdktf/provider-aws/lib/instance';

import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';

import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';

export interface NetworkingModuleProps {
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  projectName: string;
}

export class NetworkingModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly natGateway: NatGateway;
  public readonly publicRouteTable: RouteTable;
  public readonly privateRouteTable: RouteTable;

  constructor(scope: Construct, id: string, props: NetworkingModuleProps) {
    super(scope, id);

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${props.projectName}-VPC`,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.projectName}-IGW`,
      },
    });

    // Create public subnets
    this.publicSubnets = props.publicSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `public-subnet-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${azs.fqn}.names[${index}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${props.projectName}-PublicSubnet-${index + 1}`,
          Type: 'Public',
        },
      });
    });

    // Create private subnets
    this.privateSubnets = props.privateSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `private-subnet-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${azs.fqn}.names[${index}]}`,
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `${props.projectName}-PrivateSubnet-${index + 1}`,
          Type: 'Private',
        },
      });
    });

    // Create Elastic IP for NAT Gateway
    const natEip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: `${props.projectName}-NAT-EIP`,
      },
    });

    // Create NAT Gateway in first public subnet
    this.natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        Name: `${props.projectName}-NAT-Gateway`,
      },
    });

    // Create public route table
    this.publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.projectName}-PublicRouteTable`,
      },
    });

    // Create route to Internet Gateway
    new Route(this, 'public-route', {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: this.publicRouteTable.id,
      });
    });

    // Create private route table
    this.privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.projectName}-PrivateRouteTable`,
      },
    });

    // Create route to NAT Gateway
    new Route(this, 'private-route', {
      routeTableId: this.privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    });

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `private-rta-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: this.privateRouteTable.id,
      });
    });

    // Create VPC Flow Logs
    this.createVpcFlowLogs(props.projectName);
  }

  private createVpcFlowLogs(projectName: string) {
    // Create CloudWatch Log Group for VPC Flow Logs
    const logGroup = new CloudwatchLogGroup(this, 'vpc-flow-logs-group', {
      name: `/aws/vpc/flowlogs/${projectName}`,
      retentionInDays: 14,
      tags: {
        Name: `${projectName}-VPCFlowLogs`,
      },
    });

    // Get current AWS account ID
    const currentAccount = new DataAwsCallerIdentity(this, 'current', {});

    // Create IAM role for VPC Flow Logs
    const flowLogsRole = new IamRole(this, 'vpc-flow-logs-role', {
      name: `${projectName}-VPCFlowLogsRole`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `${projectName}-VPCFlowLogsRole`,
      },
    });

    // Create IAM policy for VPC Flow Logs
    new IamRolePolicy(this, 'vpc-flow-logs-policy', {
      name: `${projectName}-VPCFlowLogsPolicy`,
      role: flowLogsRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
            ],
            Resource: `arn:aws:logs:us-west-1:${currentAccount.accountId}:log-group:/aws/vpc/flowlogs/${projectName}*`,
          },
        ],
      }),
    });

    // Create VPC Flow Logs
    new FlowLog(this, 'vpc-flow-logs', {
      iamRoleArn: flowLogsRole.arn,
      logDestination: logGroup.arn,
      logDestinationType: 'cloud-watch-logs',
      vpcId: this.vpc.id, // ✅ use vpcId instead of resourceId/resourceType
      trafficType: 'ALL',
      tags: {
        Name: `${projectName}-VPCFlowLogs`,
      },
    });
  }
}

export interface SecurityModuleProps {
  vpcId: string;
  projectName: string;
}

export class SecurityModule extends Construct {
  public readonly ec2SecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityModuleProps) {
    super(scope, id);

    // Create Security Group for EC2 instance
    this.ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      name: `${props.projectName}-EC2-SecurityGroup`,
      description:
        'Security group for EC2 instance with minimal required access',
      vpcId: props.vpcId,
      tags: {
        Name: `${props.projectName}-EC2-SecurityGroup`,
      },
    });

    // Allow SSH access from specific IP ranges (replace with your actual IP range)
    new SecurityGroupRule(this, 'ssh-ingress', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: ['106.213.84.109/32'], // Replace with your specific IP range in production
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'SSH access',
    });

    // Allow HTTP access for application
    new SecurityGroupRule(this, 'http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'HTTP access',
    });

    // Allow HTTPS access for application
    new SecurityGroupRule(this, 'https-ingress', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'HTTPS access',
    });

    // Allow all outbound traffic
    new SecurityGroupRule(this, 'all-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'All outbound traffic',
    });

    // Allow HTTPS outbound for S3 access
    new SecurityGroupRule(this, 'https-egress', {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'HTTPS outbound for AWS services',
    });
  }
}

export interface StorageModuleProps {
  projectName: string;
}

export class StorageModule extends Construct {
  public readonly s3Bucket: S3Bucket;

  constructor(scope: Construct, id: string, props: StorageModuleProps) {
    super(scope, id);

    // Create S3 bucket with encryption
    this.s3Bucket = new S3Bucket(this, 'app-bucket', {
      bucket: `${props.projectName.toLowerCase()}-app-data-${Date.now()}`,
      tags: {
        Name: `${props.projectName}-AppBucket`,
      },
    });

    // Enable versioning
    new S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: this.s3Bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Configure server-side encryption
    new S3BucketServerSideEncryptionConfigurationA(this, 'bucket-encryption', {
      bucket: this.s3Bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Block public access
    new S3BucketPublicAccessBlock(this, 'bucket-pab', {
      bucket: this.s3Bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}

export interface ComputeModuleProps {
  subnetId: string;
  securityGroupIds: string[];
  s3BucketArn: string;
  projectName: string;
}

export class ComputeModule extends Construct {
  public readonly ec2Instance: Instance;
  public readonly iamRole: IamRole;

  constructor(scope: Construct, id: string, props: ComputeModuleProps) {
    super(scope, id);

    // Create IAM role for EC2 instance
    this.iamRole = new IamRole(this, 'ec2-role', {
      name: `${props.projectName}-EC2Role`,
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
        Name: `${props.projectName}-EC2Role`,
      },
    });

    // Create IAM policy with least privilege access to specific S3 bucket
    new IamRolePolicy(this, 'ec2-s3-policy', {
      name: `${props.projectName}-EC2S3Policy`,
      role: this.iamRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
            ],
            Resource: [props.s3BucketArn, `${props.s3BucketArn}/*`],
          },
          {
            Effect: 'Allow',
            Action: ['s3:GetBucketLocation'],
            Resource: props.s3BucketArn,
          },
        ],
      }),
    });

    // Create instance profile
    const instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${props.projectName}-EC2InstanceProfile`,
        role: this.iamRole.name,
      }
    );

    // Create EC2 instance
    this.ec2Instance = new Instance(this, 'ec2-instance', {
      ami: 'ami-00202c81ad9ce0b39', // Amazon Linux 2023 AMI in us-west-1
      instanceType: 't3.micro',
      subnetId: props.subnetId,
      vpcSecurityGroupIds: props.securityGroupIds,
      iamInstanceProfile: instanceProfile.name,
      associatePublicIpAddress: true,

      // Enable encryption for EBS volumes
      rootBlockDevice: {
        volumeType: 'gp3',
        volumeSize: 20,
        encrypted: true,
        deleteOnTermination: true,
      },

      // User data script for initial setup
      userData: Buffer.from(
        `#!/bin/bash
        yum update -y
        yum install -y aws-cli
        
        # Install CloudWatch agent for monitoring
        wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
        rpm -U ./amazon-cloudwatch-agent.rpm
        
        # Configure automatic security updates
        yum install -y yum-cron
        systemctl enable yum-cron
        systemctl start yum-cron
      `
      ).toString('base64'),

      tags: {
        Name: `${props.projectName}-EC2Instance`,
      },
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// Import your stacks here
import {
  NetworkingModule,
  SecurityModule,
  StorageModule,
  ComputeModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = 'us-west-1';

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

    // Add your stack instantiations here
    // Do NOT create resources directly in this stack.
    // Instead, create separate stacks for each resource type.

    const projectName = `tap-${environmentSuffix}`;

    // Create Networking Module
    const networkingModule = new NetworkingModule(this, 'networking', {
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
      projectName: projectName,
    });

    // Create Security Module
    const securityModule = new SecurityModule(this, 'security', {
      vpcId: networkingModule.vpc.id,
      projectName: projectName,
    });

    // Create Storage Module
    const storageModule = new StorageModule(this, 'storage', {
      projectName: projectName,
    });

    // Create Compute Module
    const computeModule = new ComputeModule(this, 'compute', {
      subnetId: networkingModule.publicSubnets[0].id, // Deploy in first public subnet
      securityGroupIds: [securityModule.ec2SecurityGroup.id],
      s3BucketArn: storageModule.s3Bucket.arn,
      projectName: projectName,
    });

    // Terraform Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: networkingModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: networkingModule.publicSubnets.map(subnet => subnet.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: networkingModule.privateSubnets.map(subnet => subnet.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'internet-gateway-id', {
      value: networkingModule.internetGateway.id,
      description: 'Internet Gateway ID',
    });

    new TerraformOutput(this, 'nat-gateway-id', {
      value: networkingModule.natGateway.id,
      description: 'NAT Gateway ID',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: computeModule.ec2Instance.id,
      description: 'EC2 instance ID',
    });

    new TerraformOutput(this, 'ec2-public-ip', {
      value: computeModule.ec2Instance.publicIp,
      description: 'EC2 instance public IP address',
    });

    new TerraformOutput(this, 'ec2-private-ip', {
      value: computeModule.ec2Instance.privateIp,
      description: 'EC2 instance private IP address',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: storageModule.s3Bucket.bucket,
      description: 'S3 bucket name for application data',
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: storageModule.s3Bucket.arn,
      description: 'S3 bucket ARN',
    });

    new TerraformOutput(this, 'ec2-security-group-id', {
      value: securityModule.ec2SecurityGroup.id,
      description: 'EC2 Security Group ID',
    });

    new TerraformOutput(this, 'ec2-iam-role-arn', {
      value: computeModule.iamRole.arn,
      description: 'EC2 IAM Role ARN',
    });
  }
}
```
