import { Construct } from 'constructs';
// FIX: Removed 'App' as it was unused in this file.
import { TerraformStack, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { Password } from '@cdktf/provider-random/lib/password';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketLoggingA } from '@cdktf/provider-aws/lib/s3-bucket-logging';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';

interface RegionConfig {
  readonly region: string;
  readonly vpcCidr: string;
  readonly publicSubnetCidr: string;
  readonly privateSubnetCidr: string;
  readonly dbSubnetCidr: string;
  readonly az: string;
}

const REGION_CONFIGS: RegionConfig[] = [
  {
    region: 'us-east-1',
    vpcCidr: '10.1.0.0/16',
    publicSubnetCidr: '10.1.1.0/24',
    privateSubnetCidr: '10.1.2.0/24',
    dbSubnetCidr: '10.1.3.0/24',
    az: 'us-east-1a',
  },
  {
    region: 'us-west-2',
    vpcCidr: '10.2.0.0/16',
    publicSubnetCidr: '10.2.1.0/24',
    privateSubnetCidr: '10.2.2.0/24',
    dbSubnetCidr: '10.2.3.0/24',
    az: 'us-west-2a',
  },
  {
    region: 'eu-central-1',
    vpcCidr: '10.3.0.0/16',
    publicSubnetCidr: '10.3.1.0/24',
    privateSubnetCidr: '10.3.2.0/24',
    dbSubnetCidr: '10.3.3.0/24',
    az: 'eu-central-1a',
  },
];

const COMMON_TAGS = {
  Project: 'SecureCore',
  Owner: 'SRE-Team',
  Environment: 'Prod',
};

export class MultiRegionSecurityStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // --- Add Providers ---
    new RandomProvider(this, 'random');

    const providers = new Map<string, AwsProvider>();
    for (const config of REGION_CONFIGS) {
      providers.set(
        config.region,
        new AwsProvider(this, `aws-provider-${config.region}`, {
          region: config.region,
          alias: config.region,
        })
      );
    }

    const centralProvider = providers.get('us-east-1')!;

    // --- Centralized Logging S3 Bucket (in us-east-1) ---
    const centralLogBucket = new S3Bucket(this, 'CentralLogBucket', {
      provider: centralProvider,
      bucket: `securecore-central-logs-${Fn.substr(Fn.uuid(), 0, 8)}`,
      tags: { ...COMMON_TAGS, Region: 'us-east-1', Name: 'central-log-bucket' },
    });

    new S3BucketVersioningA(this, 'CentralLogBucketVersioning', {
      provider: centralProvider,
      bucket: centralLogBucket.id,
      versioningConfiguration: { status: 'Enabled' },
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'CentralLogBucketEncryption',
      {
        provider: centralProvider,
        bucket: centralLogBucket.id,
        rule: [
          { applyServerSideEncryptionByDefault: { sseAlgorithm: 'AES256' } },
        ],
      }
    );

    new S3BucketPublicAccessBlock(this, 'CentralLogBucketPublicAccess', {
      provider: centralProvider,
      bucket: centralLogBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketLoggingA(this, 'CentralLogBucketLogging', {
      provider: centralProvider,
      bucket: centralLogBucket.id,
      targetBucket: centralLogBucket.id,
      targetPrefix: 'log-bucket-access/',
    });

    // --- IAM Role for VPC Flow Logs ---
    const flowLogsRole = new IamRole(this, 'FlowLogsRole', {
      provider: centralProvider,
      name: 'vpc-flow-logs-s3-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'vpc-flow-logs.amazonaws.com' },
          },
        ],
      }),
    });

    const flowLogsPolicy = new IamPolicy(this, 'FlowLogsPolicy', {
      provider: centralProvider,
      name: 'vpc-flow-logs-s3-policy',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: [
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'FlowLogsRoleAttachment', {
      provider: centralProvider,
      role: flowLogsRole.name,
      policyArn: flowLogsPolicy.arn,
    });

    // --- Multi-Region Resource Loop ---
    for (const config of REGION_CONFIGS) {
      const regionProvider = providers.get(config.region)!;

      const tags = { ...COMMON_TAGS, Region: config.region };

      // --- Networking ---
      const vpc = new Vpc(this, `VPC-${config.region}`, {
        provider: regionProvider,
        cidrBlock: config.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...tags, Name: `vpc-${config.region}` },
      });

      const igw = new InternetGateway(this, `IGW-${config.region}`, {
        provider: regionProvider,
        vpcId: vpc.id,
        tags: { ...tags, Name: `igw-${config.region}` },
      });

      const publicSubnet = new Subnet(this, `PublicSubnet-${config.region}`, {
        provider: regionProvider,
        vpcId: vpc.id,
        cidrBlock: config.publicSubnetCidr,
        availabilityZone: config.az,
        mapPublicIpOnLaunch: true,
        tags: { ...tags, Name: `public-subnet-${config.region}` },
      });

      const eip = new Eip(this, `EIP-${config.region}`, {
        provider: regionProvider,
        domain: 'vpc',
      });

      const natGateway = new NatGateway(this, `NAT-${config.region}`, {
        provider: regionProvider,
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: { ...tags, Name: `nat-${config.region}` },
        dependsOn: [igw],
      });

      const privateSubnet = new Subnet(this, `PrivateSubnet-${config.region}`, {
        provider: regionProvider,
        vpcId: vpc.id,
        cidrBlock: config.privateSubnetCidr,
        availabilityZone: config.az,
        mapPublicIpOnLaunch: false,
        tags: { ...tags, Name: `private-subnet-${config.region}` },
      });

      const dbSubnet = new Subnet(this, `DbSubnet-${config.region}`, {
        provider: regionProvider,
        vpcId: vpc.id,
        cidrBlock: config.dbSubnetCidr,
        availabilityZone: config.az,
        mapPublicIpOnLaunch: false,
        tags: { ...tags, Name: `db-subnet-${config.region}` },
      });

      const publicRouteTable = new RouteTable(
        this,
        `PublicRT-${config.region}`,
        {
          provider: regionProvider,
          vpcId: vpc.id,
          tags: { ...tags, Name: `public-rt-${config.region}` },
        }
      );
      new Route(this, `PublicRoute-${config.region}`, {
        provider: regionProvider,
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      });
      new RouteTableAssociation(this, `PublicRTA-${config.region}`, {
        provider: regionProvider,
        subnetId: publicSubnet.id,
        routeTableId: publicRouteTable.id,
      });

      const privateRouteTable = new RouteTable(
        this,
        `PrivateRT-${config.region}`,
        {
          provider: regionProvider,
          vpcId: vpc.id,
          tags: { ...tags, Name: `private-rt-${config.region}` },
        }
      );
      new Route(this, `PrivateRoute-${config.region}`, {
        provider: regionProvider,
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      });
      new RouteTableAssociation(this, `PrivateRTA-${config.region}`, {
        provider: regionProvider,
        subnetId: privateSubnet.id,
        routeTableId: privateRouteTable.id,
      });

      const dbRouteTable = new RouteTable(this, `DbRT-${config.region}`, {
        provider: regionProvider,
        vpcId: vpc.id,
        tags: { ...tags, Name: `db-rt-${config.region}` },
      });
      new RouteTableAssociation(this, `DbRTA-${config.region}`, {
        provider: regionProvider,
        subnetId: dbSubnet.id,
        routeTableId: dbRouteTable.id,
      });

      const appSg = new SecurityGroup(this, `AppSG-${config.region}`, {
        provider: regionProvider,
        vpcId: vpc.id,
        name: `app-sg-${config.region}`,
        description: 'Allow traffic from ALB and to DB',
        tags: { ...tags, Name: `app-sg-${config.region}` },
        egress: [
          { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
        ],
      });

      const dbSg = new SecurityGroup(this, `DbSG-${config.region}`, {
        provider: regionProvider,
        vpcId: vpc.id,
        name: `db-sg-${config.region}`,
        description: 'Allow traffic only from app security group',
        tags: { ...tags, Name: `db-sg-${config.region}` },
        ingress: [
          {
            fromPort: 5432,
            toPort: 5432,
            protocol: 'tcp',
            securityGroups: [appSg.id],
          },
        ],
      });

      const publicNacl = new NetworkAcl(this, `PublicNACL-${config.region}`, {
        provider: regionProvider,
        vpcId: vpc.id,
        subnetIds: [publicSubnet.id],
        tags: { ...tags, Name: `public-nacl-${config.region}` },
      });
      new NetworkAclRule(this, `PublicNaclInbound-${config.region}`, {
        provider: regionProvider,
        networkAclId: publicNacl.id,
        ruleNumber: 100,
        egress: false,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: '0.0.0.0/0',
        fromPort: 443,
        toPort: 443,
      });
      new NetworkAclRule(this, `PublicNaclOutbound-${config.region}`, {
        provider: regionProvider,
        networkAclId: publicNacl.id,
        ruleNumber: 100,
        egress: true,
        protocol: '-1',
        ruleAction: 'allow',
        cidrBlock: '0.0.0.0/0',
        fromPort: 0,
        toPort: 0,
      });

      new FlowLog(this, `FlowLog-${config.region}`, {
        provider: regionProvider,
        vpcId: vpc.id,
        trafficType: 'ALL',
        logDestinationType: 's3',
        logDestination: centralLogBucket.arn,
        iamRoleArn: flowLogsRole.arn,
        tags: { ...tags, Name: `flow-log-${config.region}` },
      });

      const dbPassword = new Password(this, `DBPassword-${config.region}`, {
        length: 16,
        special: true,
        overrideSpecial: '_%@/',
      });

      const dbSecret = new SecretsmanagerSecret(
        this,
        `DBSecret-${config.region}`,
        {
          provider: regionProvider,
          name: `prod/rds/master_password/${config.region}`,
          tags: { ...tags, Name: `db-secret-${config.region}` },
        }
      );

      new SecretsmanagerSecretVersion(
        this,
        `DBSecretVersion-${config.region}`,
        {
          provider: regionProvider,
          secretId: dbSecret.id,
          secretString: dbPassword.result,
        }
      );

      const dbSubnetGroup = new DbSubnetGroup(
        this,
        `DbSubnetGroup-${config.region}`,
        {
          provider: regionProvider,
          name: `db-subnet-group-${config.region}`,
          subnetIds: [dbSubnet.id],
          tags: { ...tags, Name: `db-subnet-group-${config.region}` },
        }
      );

      new DbInstance(this, `DB-${config.region}`, {
        provider: regionProvider,
        identifier: `app-db-${config.region}`,
        engine: 'postgres',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        storageEncrypted: true,
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [dbSg.id],
        username: 'dbadmin',
        password: dbPassword.result,
        skipFinalSnapshot: true,
        tags: { ...tags, Name: `app-db-${config.region}` },
      });
    }
  }
}
