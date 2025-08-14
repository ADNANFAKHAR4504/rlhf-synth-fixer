lib/modules.ts
import { Construct } from 'constructs';

// AWS Provider
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';

// RDS
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';

// EC2
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';

// Secrets Manager
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';

// Random password generator
import { Password as RandomPassword } from '@cdktf/provider-random/lib/password';

// ---------------- Network Module ----------------
export interface NetworkModuleProps {
  awsProvider: AwsProvider;
  tags: { [key: string]: string };
  vpcCidrBlock?: string; //
}

export class NetworkModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnet: Subnet;
  public readonly privateSubnet: Subnet;
  public readonly ec2SecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkModuleProps) {
    super(scope, id);

    // VPC
    this.vpc = new Vpc(this, 'Vpc', {
      cidrBlock: props.vpcCidrBlock || '10.0.0.0/16',
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { ...props.tags, Name: 'tap-vpc' },
    });

    // Public subnet
    this.publicSubnet = new Subnet(this, 'PublicSubnet', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-west-2a',
      mapPublicIpOnLaunch: true,
      tags: { ...props.tags, Name: 'tap-public-subnet' },
    });

    // Private subnet
    this.privateSubnet = new Subnet(this, 'PrivateSubnet', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: 'us-west-2b',
      tags: { ...props.tags, Name: 'tap-private-subnet' },
    });

    // Internet Gateway
    const internetGateway = new InternetGateway(this, 'InternetGateway', {
      vpcId: this.vpc.id,
      tags: { ...props.tags, Name: 'tap-igw' },
    });

    // Public Route Table
    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      vpcId: this.vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: internetGateway.id }],
      tags: { ...props.tags, Name: 'tap-public-rt' },
    });

    new RouteTableAssociation(this, 'PublicSubnetRouteTableAssociation', {
      subnetId: this.publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    // NAT Gateway
    const eip = new Eip(this, 'NatGatewayEip', {
      domain: 'vpc',
      tags: { ...props.tags, Name: 'tap-nat-eip' },
    });

    const natGateway = new NatGateway(this, 'NatGateway', {
      allocationId: eip.id,
      subnetId: this.publicSubnet.id,
      tags: { ...props.tags, Name: 'tap-nat-gw' },
      dependsOn: [internetGateway],
    });

    // Private Route Table
    const privateRouteTable = new RouteTable(this, 'PrivateRouteTable', {
      vpcId: this.vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', natGatewayId: natGateway.id }],
      tags: { ...props.tags, Name: 'tap-private-rt' },
    });

    new RouteTableAssociation(this, 'PrivateSubnetRouteTableAssociation', {
      subnetId: this.privateSubnet.id,
      routeTableId: privateRouteTable.id,
    });

    // EC2 Security Group
    this.ec2SecurityGroup = new SecurityGroup(this, 'Ec2SecurityGroup', {
      name: 'tap-ec2-sg',
      vpcId: this.vpc.id,
      description: 'Allow SSH from office IP only',
      ingress: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['YOUR_OFFICE_IP/32'],
        },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: { ...props.tags, Name: 'tap-ec2-sg' },
    });

    // RDS Security Group
    this.rdsSecurityGroup = new SecurityGroup(this, 'RdsSecurityGroup', {
      name: 'tap-rds-sg',
      vpcId: this.vpc.id,
      description: 'Allow PostgreSQL traffic from EC2',
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          securityGroups: [this.ec2SecurityGroup.id],
        },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: { ...props.tags, Name: 'tap-rds-sg' },
    });
  }
}

// ---------------- Compute Module ----------------
export interface ComputeModuleProps {
  awsProvider: AwsProvider;
  subnetId: string;
  securityGroupId: string;
  keyName: string;
  tags: { [key: string]: string };
}

export class ComputeModule extends Construct {
  public readonly instance: Instance;

  constructor(scope: Construct, id: string, props: ComputeModuleProps) {
    super(scope, id);

    this.instance = new Instance(this, 'Ec2Instance', {
      ami: 'ami-04e08e36e17a21b56',
      instanceType: 't3.medium',
      subnetId: props.subnetId,
      vpcSecurityGroupIds: [props.securityGroupId],
      keyName: props.keyName,
      ebsBlockDevice: [
        {
          deviceName: '/dev/sda1',
          volumeSize: 20,
          volumeType: 'gp2',
          encrypted: true,
        },
      ],
      tags: { ...props.tags, Name: 'tap-ec2-instance' },
    });
  }
}

// ---------------- Database Module ----------------
export interface DatabaseModuleProps {
  awsProvider: AwsProvider;
  subnetIds: string[];
  securityGroupId: string;
  tags: { [key: string]: string };
}

export class DatabaseModule extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly dbSecret: SecretsmanagerSecret;

  constructor(scope: Construct, id: string, props: DatabaseModuleProps) {
    super(scope, id);

    // Create Secrets Manager secret
    this.dbSecret = new SecretsmanagerSecret(this, 'DbSecret', {
      namePrefix: `tap-rds-password-secret-${id}`,
      description: 'Password for the TAP RDS database',
      tags: props.tags,
    });

    // Generate random password
    const dbPasswordRandom = new RandomPassword(this, 'DbRandomPassword', {
      length: 16,
      special: true,
    });

    // Store password in Secrets Manager
    new SecretsmanagerSecretVersion(this, 'DbSecretVersion', {
      secretId: this.dbSecret.id,
      secretString: JSON.stringify({ password: dbPasswordRandom.result }),
    });

    // Optional data source (read back secret)
    new DataAwsSecretsmanagerSecretVersion(this, 'DbPasswordValue', {
      secretId: this.dbSecret.id,
    });

    // Create DB subnet group
    const dbSubnetGroup = new DbSubnetGroup(this, 'DbSubnetGroup', {
      name: `tap-db-subnet-group-${id}`,
      subnetIds: props.subnetIds,
      tags: { ...props.tags, Name: 'tap-db-subnet-group' },
    });

    // Create RDS instance
    this.dbInstance = new DbInstance(this, 'PostgresInstance', {
      engine: 'postgres',
      engineVersion: '12',
      instanceClass: 'db.t3.medium',
      allocatedStorage: 20,
      storageType: 'gp2',
      storageEncrypted: true,
      username: 'postgres',
      password: dbPasswordRandom.result,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [props.securityGroupId],
      backupRetentionPeriod: 7,
      skipFinalSnapshot: false,
      tags: { ...props.tags, Name: 'tap-rds-instance' },
    });
  }
}


lib/tap-stack.ts
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { NetworkModule, ComputeModule, DatabaseModule } from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

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
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    const awsProvider = new AwsProvider(this, 'aws', {
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

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    const tags = {
      Environment: 'Production',
      Owner: 'DevOpsTeam',
    };

    const network = new NetworkModule(this, 'Network', {
      awsProvider: awsProvider,
      vpcCidrBlock: '10.0.0.0/16',
      tags: tags,
    });

    const compute = new ComputeModule(this, 'Compute', {
      awsProvider: awsProvider,
      subnetId: network.publicSubnet.id,
      securityGroupId: network.ec2SecurityGroup.id,
      keyName: 'my-dev-keypair', // <-- Replace with your key pair name
      tags: tags,
    });

    const database = new DatabaseModule(this, 'Database', {
      awsProvider: awsProvider,
      subnetIds: [network.privateSubnet.id],
      securityGroupId: network.rdsSecurityGroup.id,
      tags: tags,
    });

    // --- Stack Outputs ---
    new TerraformOutput(this, 'vpcId', {
      value: network.vpc.id,
      description: 'The ID of the main VPC.',
    });

    new TerraformOutput(this, 'publicSubnetId', {
      value: network.publicSubnet.id,
      description: 'The ID of the public subnet.',
    });

    new TerraformOutput(this, 'privateSubnetId', {
      value: network.privateSubnet.id,
      description: 'The ID of the private subnet.',
    });

    new TerraformOutput(this, 'ec2InstanceId', {
      value: compute.instance.id,
      description: 'The ID of the EC2 instance.',
    });

    new TerraformOutput(this, 'ec2PublicIp', {
      value: compute.instance.publicIp,
      description: 'The public IP address of the EC2 instance.',
    });

    new TerraformOutput(this, 'rdsInstanceEndpoint', {
      value: database.dbInstance.endpoint,
      description: 'The connection endpoint for the RDS database instance.',
      sensitive: true,
    });

    new TerraformOutput(this, 'databaseSecretArn', {
      value: database.dbSecret.arn,
      description: 'The ARN of the secret containing the RDS password.',
      sensitive: true,
    });
  }
}
