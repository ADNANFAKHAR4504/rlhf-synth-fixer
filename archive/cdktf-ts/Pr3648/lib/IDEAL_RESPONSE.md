
## lib/modules.ts

```typescrip// --- modules.ts ---

// Core Libraries
import { Construct } from 'constructs';

// Networking
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Instance } from '@cdktf/provider-aws/lib/instance';

// IAM
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

// Secrets Manager
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';

// Data Sources
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

interface NetworkingConstructProps {
  tags: { [key: string]: string };
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnet: Subnet;
  public readonly privateSubnet: Subnet;
  public readonly internetGateway: InternetGateway;
  public readonly natGateway: NatGateway;

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...props.tags,
        Name: 'production-vpc',
      },
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: 'production-igw',
      },
    });

    // Create public subnet
    this.publicSubnet = new Subnet(this, 'public-subnet', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-east-1a',
      mapPublicIpOnLaunch: true,
      tags: {
        ...props.tags,
        Name: 'production-public-subnet',
        Type: 'public',
      },
    });

    // Create private subnet
    this.privateSubnet = new Subnet(this, 'private-subnet', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: 'us-east-1a',
      tags: {
        ...props.tags,
        Name: 'production-private-subnet',
        Type: 'private',
      },
    });

    // Create Elastic IP for NAT Gateway
    const natEip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        ...props.tags,
        Name: 'production-nat-eip',
      },
    });

    // Create NAT Gateway in public subnet
    this.natGateway = new NatGateway(this, 'nat-gateway', {
      subnetId: this.publicSubnet.id,
      allocationId: natEip.id,
      tags: {
        ...props.tags,
        Name: 'production-nat-gateway',
      },
    });

    // Create route table for public subnet
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: 'production-public-rt',
      },
    });

    // Add route to Internet Gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnet with public route table
    new RouteTableAssociation(this, 'public-subnet-association', {
      subnetId: this.publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    // Create route table for private subnet
    const privateRouteTable = new RouteTable(this, 'private-route-table', {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: 'production-private-rt',
      },
    });

    // Add route to NAT Gateway for private subnet
    new Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    });

    // Associate private subnet with private route table
    new RouteTableAssociation(this, 'private-subnet-association', {
      subnetId: this.privateSubnet.id,
      routeTableId: privateRouteTable.id,
    });
  }
}

interface SecureComputeConstructProps {
  instanceType: string;
  subnetId: string;
  vpcId: string;
  secretArn: string;
  tags: { [key: string]: string };
}

export class SecureComputeConstruct extends Construct {
  public readonly instance: Instance;
  public readonly role: IamRole;
  public readonly securityGroup: SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    props: SecureComputeConstructProps
  ) {
    super(scope, id);

    // Create IAM role with least privilege for EC2
    const assumeRolePolicy = {
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
    };

    this.role = new IamRole(this, 'ec2-role', {
      name: 'production-ec2-role',
      assumeRolePolicy: JSON.stringify(assumeRolePolicy),
      tags: props.tags,
    });

    // Create IAM policy for Secrets Manager access (least privilege)
    const secretsPolicy = new IamPolicy(this, 'secrets-policy', {
      name: 'production-ec2-secrets-policy',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: props.secretArn,
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt'],
            Resource: '*',
            Condition: {
              StringEquals: {
                'kms:ViaService': 'secretsmanager.us-east-1.amazonaws.com',
              },
            },
          },
        ],
      }),
      tags: props.tags,
    });

    // Attach policy to role
    new IamRolePolicyAttachment(this, 'ec2-secrets-policy-attachment', {
      role: this.role.name,
      policyArn: secretsPolicy.arn,
    });

    // Attach AWS managed SSM policy for Session Manager access
    new IamRolePolicyAttachment(this, 'ec2-ssm-policy-attachment', {
      role: this.role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    // Create instance profile
    const instanceProfile = new IamInstanceProfile(this, 'instance-profile', {
      name: 'production-ec2-instance-profile',
      role: this.role.name,
      tags: props.tags,
    });

    // Create security group with restrictive rules
    this.securityGroup = new SecurityGroup(this, 'security-group', {
      name: 'production-ec2-sg',
      description: 'Security group for production EC2 instance',
      vpcId: props.vpcId,
      tags: {
        ...props.tags,
        Name: 'production-ec2-sg',
      },
    });

    // Allow outbound HTTPS traffic for AWS service communication
    new SecurityGroupRule(this, 'sg-egress-https', {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
      description: 'Allow HTTPS outbound for AWS services',
    });

    // Allow outbound HTTP traffic for package updates
    new SecurityGroupRule(this, 'sg-egress-http', {
      type: 'egress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
      description: 'Allow HTTP outbound for package updates',
    });

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'amazon-linux-2', {
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
    this.instance = new Instance(this, 'instance', {
      ami: ami.id,
      instanceType: props.instanceType,
      subnetId: props.subnetId,
      iamInstanceProfile: instanceProfile.name,
      vpcSecurityGroupIds: [this.securityGroup.id],
      monitoring: true,
      userData: Buffer.from(
        `#!/bin/bash
# Install CloudWatch agent and SSM agent
yum update -y
yum install -y amazon-cloudwatch-agent
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent
`
      ).toString('base64'),
      rootBlockDevice: {
        volumeType: 'gp3',
        volumeSize: 20,
        encrypted: true,
        deleteOnTermination: true,
      },
      metadataOptions: {
        httpTokens: 'required',
        httpPutResponseHopLimit: 1,
        httpEndpoint: 'enabled',
      },
      tags: {
        ...props.tags,
        Name: 'production-compute-instance',
      },
    });
  }
}

interface SecretsConstructProps {
  tags: { [key: string]: string };
}

export class SecretsConstruct extends Construct {
  public readonly secret: SecretsmanagerSecret;
  public readonly secretVersion: SecretsmanagerSecretVersion;

  constructor(scope: Construct, id: string, props: SecretsConstructProps) {
    super(scope, id);

    // Create the secret
    this.secret = new SecretsmanagerSecret(this, 'secret', {
      name: 'production/database/credentials',
      description: 'Production database credentials',
      recoveryWindowInDays: 7,
      tags: {
        ...props.tags,
        Name: 'production-database-secret',
      },
    });

    // Create secret version with dummy data
    this.secretVersion = new SecretsmanagerSecretVersion(
      this,
      'secret-version',
      {
        secretId: this.secret.id,
        secretString: JSON.stringify({
          username: 'admin',
          password: 'ChangeMe123!@#$',
          engine: 'postgres',
          host: 'db.production.internal',
          port: 5432,
        }),
      }
    );
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
import { TerraformOutput } from 'cdktf';
import { TerraformVariable } from 'cdktf';
import {
  NetworkingConstruct,
  SecureComputeConstruct,
  SecretsConstruct,
} from './modules';

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

    // Define common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      ManagedBy: 'CDKTF',
      Project: 'Production-Infrastructure',
      Owner: 'Platform-Team',
    };

    // Create Networking Infrastructure
    const networkingModule = new NetworkingConstruct(this, 'networking', {
      tags: commonTags,
    });

    // Create Secrets Management
    const secretsModule = new SecretsConstruct(this, 'secrets', {
      tags: commonTags,
    });

    const instanceTypeVariable = new TerraformVariable(
      this,
      'ec2_instance_type',
      {
        type: 'string',
        default: 't3.medium',
        description: 'EC2 instance type for the compute instance',
      }
    );

    // Create Secure Compute Instance in Private Subnet
    const secureComputeModule = new SecureComputeConstruct(
      this,
      'secure-compute',
      {
        instanceType: instanceTypeVariable.stringValue,
        subnetId: networkingModule.privateSubnet.id,
        vpcId: networkingModule.vpc.id,
        secretArn: secretsModule.secret.arn,
        tags: commonTags,
      }
    );

    // Terraform Outputs - 10 outputs as requested
    new TerraformOutput(this, 'vpc-id', {
      value: networkingModule.vpc.id,
      description: 'Production VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-id', {
      value: networkingModule.publicSubnet.id,
      description: 'Public subnet ID',
    });

    new TerraformOutput(this, 'private-subnet-id', {
      value: networkingModule.privateSubnet.id,
      description: 'Private subnet ID',
    });

    new TerraformOutput(this, 'internet-gateway-id', {
      value: networkingModule.internetGateway.id,
      description: 'Internet Gateway ID',
    });

    new TerraformOutput(this, 'nat-gateway-id', {
      value: networkingModule.natGateway.id,
      description: 'NAT Gateway ID for private subnet connectivity',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: secureComputeModule.instance.id,
      description: 'Secure EC2 instance ID',
    });

    new TerraformOutput(this, 'ec2-instance-private-ip', {
      value: secureComputeModule.instance.privateIp,
      description: 'EC2 instance private IP address',
    });

    new TerraformOutput(this, 'ec2-security-group-id', {
      value: secureComputeModule.securityGroup.id,
      description: 'EC2 instance security group ID',
    });

    new TerraformOutput(this, 'iam-role-arn', {
      value: secureComputeModule.role.arn,
      description: 'IAM role ARN for EC2 instance',
    });

    new TerraformOutput(this, 'secret-arn', {
      value: secretsModule.secret.arn,
      description: 'Secrets Manager secret ARN for database credentials',
    });
  }
}

```