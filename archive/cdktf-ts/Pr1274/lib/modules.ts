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

// Random password generator
import { Password as RandomPassword } from '@cdktf/provider-random/lib/password';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';

// ---------------- Network Module ----------------
export interface NetworkModuleProps {
  awsProvider: AwsProvider;
  tags: { [key: string]: string };
  vpcCidrBlock?: string;
}

export class NetworkModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnet: Subnet;
  public readonly privateSubnet: Subnet;
  public readonly privateSubnet2: Subnet; // Added second private subnet
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

    // Private subnet 1
    this.privateSubnet = new Subnet(this, 'PrivateSubnet', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: 'us-west-2b',
      tags: { ...props.tags, Name: 'tap-private-subnet-1' },
    });

    // FIX: Add a second private subnet in a different AZ for RDS high availability
    this.privateSubnet2 = new Subnet(this, 'PrivateSubnet2', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.3.0/24',
      availabilityZone: 'us-west-2c',
      tags: { ...props.tags, Name: 'tap-private-subnet-2' },
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

    // Associate both private subnets with the private route table
    new RouteTableAssociation(this, 'PrivateSubnet1RouteTableAssociation', {
      subnetId: this.privateSubnet.id,
      routeTableId: privateRouteTable.id,
    });

    new RouteTableAssociation(this, 'PrivateSubnet2RouteTableAssociation', {
      subnetId: this.privateSubnet2.id,
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
          cidrBlocks: ['106.213.80.43/32'],
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
      ami: 'ami-04e08e36e17a21b56', // Note: This AMI ID is for us-west-2
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
  subnetIds: string[]; // Expects an array of subnet IDs
  securityGroupId: string;
  tags: { [key: string]: string };
}

export class DatabaseModule extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly dbSecret: SecretsmanagerSecret;

  constructor(scope: Construct, id: string, props: DatabaseModuleProps) {
    super(scope, id);

    // Add Random provider to the construct scope
    new RandomProvider(this, 'random');

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
      secretString: dbPasswordRandom.result,
    });

    // Create DB subnet group
    const dbSubnetGroup = new DbSubnetGroup(this, 'DbSubnetGroup', {
      name: `tap-db-subnet-group-${id.toLowerCase()}`,
      subnetIds: props.subnetIds, // Use the provided array of subnet IDs
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
