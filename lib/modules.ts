import { Construct } from 'constructs';
import { Fn } from 'cdktf';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { Password } from '@cdktf/provider-random/lib/password';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';

// A base interface for props that all our modules will use.
interface BaseModuleProps {
  envPrefix: string;
}

// =============================================================================
// VPC Network Construct
// =============================================================================
interface VpcNetworkProps extends BaseModuleProps {
  vpcCidr: string;
}

export class VpcNetwork extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];

  constructor(scope: Construct, id: string, props: VpcNetworkProps) {
    super(scope, id);

    const { envPrefix, vpcCidr } = props;

    const vpc = new Vpc(this, 'main-vpc', {
      cidrBlock: vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { Name: `${envPrefix}-main-vpc` },
    });
    this.vpcId = vpc.id;

    const azs = ['us-east-1a', 'us-east-1b'];
    const publicSubnets = azs.map(
      (az, i) =>
        new Subnet(this, `public-subnet-${i}`, {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i * 2}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: { Name: `${envPrefix}-public-subnet-${az}` },
        })
    );
    this.publicSubnetIds = publicSubnets.map(subnet => subnet.id);

    const privateSubnets = azs.map(
      (az, i) =>
        new Subnet(this, `private-subnet-${i}`, {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i * 2 + 1}.0/24`,
          availabilityZone: az,
          tags: { Name: `${envPrefix}-private-subnet-${az}` },
        })
    );
    this.privateSubnetIds = privateSubnets.map(subnet => subnet.id);

    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: { Name: `${envPrefix}-igw` },
    });

    const eip = new Eip(this, 'nat-eip', {
      tags: { Name: `${envPrefix}-nat-eip` },
    });
    const natGw = new NatGateway(this, 'nat-gw', {
      allocationId: eip.id,
      subnetId: publicSubnets[0].id,
      tags: { Name: `${envPrefix}-nat-gw` },
      dependsOn: [igw],
    });

    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      tags: { Name: `${envPrefix}-public-rt` },
    });
    new Route(this, 'public-igw-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });
    publicSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `public-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    const privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: vpc.id,
      tags: { Name: `${envPrefix}-private-rt` },
    });
    new Route(this, 'private-nat-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGw.id,
    });
    privateSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `private-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });
  }
}

// =============================================================================
// Bastion Host Construct
// =============================================================================
interface BastionHostProps extends BaseModuleProps {
  vpcId: string;
  publicSubnetId: string;
  allowedSshIp: string;
}

export class BastionHost extends Construct {
  public readonly instancePublicIp: string;
  public readonly securityGroupId: string;

  constructor(scope: Construct, id: string, props: BastionHostProps) {
    super(scope, id);

    const { envPrefix, vpcId, publicSubnetId, allowedSshIp } = props;

    const bastionSg = new SecurityGroup(this, 'bastion-sg', {
      name: `${envPrefix}-bastion-sg`,
      vpcId: vpcId,
      description: 'Allow SSH from my IP',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 22,
          toPort: 22,
          cidrBlocks: [allowedSshIp],
        },
      ],
      egress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: { Name: `${envPrefix}-bastion-sg` },
    });
    this.securityGroupId = bastionSg.id;

    const amznLinuxAmi = new DataAwsAmi(this, 'amzn-linux-ami', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'virtualization-type', values: ['hvm'] },
      ],
    });

    const instance = new Instance(this, 'bastion-instance', {
      ami: amznLinuxAmi.id,
      instanceType: 't2.micro',
      subnetId: publicSubnetId,
      vpcSecurityGroupIds: [bastionSg.id],
      tags: { Name: `${envPrefix}-bastion-host` },
    });
    this.instancePublicIp = instance.publicIp;
  }
}

// =============================================================================
// RDS Database Construct
// =============================================================================
interface RdsDatabaseProps extends BaseModuleProps {
  vpcId: string;
  privateSubnetIds: string[];
  sourceSecurityGroupId: string;
}

export class RdsDatabase extends Construct {
  public readonly rdsEndpoint: string;
  public readonly rdsPort: string;
  public readonly secretArn: string;

  constructor(scope: Construct, id: string, props: RdsDatabaseProps) {
    super(scope, id);

    const { envPrefix, vpcId, privateSubnetIds, sourceSecurityGroupId } = props;

    // --- Step 1: Initialize the Random Provider ---
    new RandomProvider(this, 'random');

    // --- Step 2: Generate a Secure, Random Password ---
    const dbPassword = new Password(this, 'db-password', {
      length: 16,
      special: true,
      overrideSpecial: '_%@/',
    });

    // --- Step 3: Create a Secret in AWS Secrets Manager ---
    const dbSecret = new SecretsmanagerSecret(this, 'db-secret', {
      name: `${envPrefix}/rds/postgres-creds`,
      description: 'Credentials for the RDS PostgreSQL instance',
      tags: { Name: `${envPrefix}-rds-secret` },
    });
    this.secretArn = dbSecret.arn;

    // --- Step 4: Inject the Random Password into the Secret ---
    const dbSecretVersion = new SecretsmanagerSecretVersion(
      this,
      'db-secret-version',
      {
        secretId: dbSecret.id,
        secretString: Fn.jsonencode({
          username: 'postgresadmin',
          password: dbPassword.result,
        }),
      }
    );

    // --- DB Subnet Group ---
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${envPrefix}-db-subnet-group`,
      subnetIds: privateSubnetIds,
      tags: { Name: `${envPrefix}-db-subnet-group` },
    });

    // --- Security Group for RDS ---
    const rdsSg = new SecurityGroup(this, 'rds-sg', {
      name: `${envPrefix}-rds-sg`,
      vpcId: vpcId,
      description: 'Allow PostgreSQL traffic from Bastion SG',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 5432,
          toPort: 5432,
          securityGroups: [sourceSecurityGroupId],
        },
      ],
      tags: { Name: `${envPrefix}-rds-sg` },
    });

    // --- Step 5: Create the RDS Instance Using the Secret ---
    const dbInstance = new DbInstance(this, 'postgres-db', {
      engine: 'postgres',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      dbName: 'appdb',
      username: 'postgresadmin',
      password: dbPassword.result,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSg.id],
      publiclyAccessible: false,
      skipFinalSnapshot: true,
      tags: { Name: `${envPrefix}-postgres-db` },
      dependsOn: [dbSecretVersion], // Add this line
    });

    this.rdsEndpoint = dbInstance.endpoint;
    this.rdsPort = Fn.tostring(dbInstance.port);
  }
}
