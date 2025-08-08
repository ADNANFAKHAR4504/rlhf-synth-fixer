import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Password as RandomPassword } from '@cdktf/provider-random/lib/password';
import { Fn } from 'cdktf';
import { Construct } from 'constructs';

// --- Project Constants ---
const projectName = 'aurora';
const environment = 'prod';
const commonTags = {
  Owner: 'CloudEngineering',
  Environment: environment,
};

// --- VPC Module ---
export interface VpcModuleProps {
  cidrBlock: string;
  availabilityZones: string[];
}

export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly natGateway: NatGateway;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);
    const resourceName = `${projectName}-${environment}`;

    this.vpc = new Vpc(this, 'main_vpc', {
      cidrBlock: props.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...commonTags, Name: `${resourceName}-main-vpc` },
    });

    const igw = new InternetGateway(this, 'internet_gateway', {
      vpcId: this.vpc.id,
      tags: { ...commonTags, Name: `${resourceName}-igw` },
    });

    const publicRouteTable = new RouteTable(this, 'public_route_table', {
      vpcId: this.vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
      tags: { ...commonTags, Name: `${resourceName}-public-rt` },
    });

    this.publicSubnets = props.availabilityZones.map((az, index) => {
      const subnet = new Subnet(this, `public_subnet_${az}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${10 + index}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: { ...commonTags, Name: `${resourceName}-public-subnet-${az}` },
      });
      new RouteTableAssociation(this, `public_rta_${az}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
      return subnet;
    });

    const eip = new Eip(this, 'nat_eip', {
      tags: { ...commonTags, Name: `${resourceName}-nat-eip` },
    });

    this.natGateway = new NatGateway(this, 'nat_gateway', {
      allocationId: eip.id,
      subnetId: this.publicSubnets[0].id,
      tags: { ...commonTags, Name: `${resourceName}-nat-gw` },
      dependsOn: [igw],
    });

    this.privateSubnets = props.availabilityZones.map((az, index) => {
      const privateRouteTable = new RouteTable(
        this,
        `private_route_table_${az}`,
        {
          vpcId: this.vpc.id,
          route: [{ cidrBlock: '0.0.0.0/0', natGatewayId: this.natGateway.id }],
          tags: { ...commonTags, Name: `${resourceName}-private-rt-${az}` },
        }
      );
      const subnet = new Subnet(this, `private_subnet_${az}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${20 + index}.0/24`,
        availabilityZone: az,
        tags: { ...commonTags, Name: `${resourceName}-private-subnet-${az}` },
      });
      new RouteTableAssociation(this, `private_rta_${az}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
      return subnet;
    });
  }
}

// --- Security Group Modules ---
interface SecurityGroupProps {
  vpcId: string;
}

export class BastionSgModule extends Construct {
  public readonly securityGroup: SecurityGroup;
  constructor(scope: Construct, id: string, props: SecurityGroupProps) {
    super(scope, id);
    this.securityGroup = new SecurityGroup(this, 'bastion_sg', {
      name: `${projectName}-${environment}-bastion-sg`,
      description: 'Allow SSH from trusted IP for Bastion Host',
      vpcId: props.vpcId,
      ingress: [
        {
          description: 'SSH from Bastion',
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['203.0.113.0/24'],
        },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: { ...commonTags, Name: `${projectName}-${environment}-bastion-sg` },
    });
  }
}

export class RdsSgModule extends Construct {
  public readonly securityGroup: SecurityGroup;
  constructor(scope: Construct, id: string, props: SecurityGroupProps) {
    super(scope, id);
    this.securityGroup = new SecurityGroup(this, 'rds_sg', {
      name: `${projectName}-${environment}-rds-sg`,
      description: 'Allow PostgreSQL traffic from within the VPC',
      vpcId: props.vpcId,
      ingress: [
        {
          description: 'PostgreSQL from VPC',
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/16'],
        },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: { ...commonTags, Name: `${projectName}-${environment}-rds-sg` },
    });
  }
}

// --- Secrets Manager Module ---
export class SecretsManagerModule extends Construct {
  public readonly secret: SecretsmanagerSecret;
  public readonly password: RandomPassword;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    const resourceName = `${projectName}-${environment}`;

    this.password = new RandomPassword(this, 'db_password', {
      length: 16,
      special: true,
      overrideSpecial: '_%@',
    });

    this.secret = new SecretsmanagerSecret(this, 'db_secret', {
      name: `${resourceName}/rds-db-credentials`,
      description: `Credentials for the ${resourceName} RDS database.`,
      tags: { ...commonTags, Name: `${resourceName}-rds-secret` },
    });

    new SecretsmanagerSecretVersion(this, 'db_secret_version', {
      secretId: this.secret.id,
      secretString: Fn.jsonencode({
        username: 'auroraadmin',
        password: this.password.result,
      }),
    });
  }
}

// --- RDS Module ---
interface RdsModuleProps {
  privateSubnetIds: string[];
  vpcSecurityGroupIds: string[];
  dbUsername: string;
  dbPassword: string;
  // FIX: Add natGateway as a required property to make the dependency explicit.
  natGateway: NatGateway;
}

export class RdsModule extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly endpoint: string;
  constructor(scope: Construct, id: string, props: RdsModuleProps) {
    super(scope, id);
    const resourceName = `${projectName}-${environment}`;

    const dbSubnetGroup = new DbSubnetGroup(this, 'rds_sng', {
      name: `${resourceName}-rds-sng`,
      subnetIds: props.privateSubnetIds,
      tags: { ...commonTags, Name: `${resourceName}-rds-sng` },
    });

    this.dbInstance = new DbInstance(this, 'rds_instance', {
      identifier: `${resourceName}-rds-db`,
      allocatedStorage: 20,
      engine: 'postgres',
      instanceClass: 'db.t3.micro',
      username: props.dbUsername,
      password: props.dbPassword,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: props.vpcSecurityGroupIds,
      storageEncrypted: true,
      publiclyAccessible: false,
      skipFinalSnapshot: true,
      tags: { ...commonTags, Name: `${resourceName}-rds-instance` },
      // FIX: Set the dependency directly on the resource during creation.
      dependsOn: [props.natGateway],
    });
    this.endpoint = this.dbInstance.endpoint;
  }
}

// --- S3 Logging Bucket Module ---
export class S3LoggingBucketModule extends Construct {
  public readonly bucket: S3Bucket;
  constructor(scope: Construct, id: string) {
    super(scope, id);
    const resourceName = `${projectName}-${environment}`;
    const bucketName = `${resourceName}-logs-${Fn.substr(Fn.uuid(), 0, 8)}`;

    this.bucket = new S3Bucket(this, 'log_bucket', {
      bucket: bucketName,
      tags: { ...commonTags, Name: `${resourceName}-log-bucket` },
    });

    new S3BucketVersioningA(this, 'log_bucket_versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: { status: 'Enabled' },
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'log_bucket_encryption',
      {
        bucket: this.bucket.id,
        rule: [
          { applyServerSideEncryptionByDefault: { sseAlgorithm: 'AES256' } },
        ],
      }
    );

    new S3BucketPublicAccessBlock(this, 'log_bucket_public_access', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}
