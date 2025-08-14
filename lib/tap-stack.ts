import { Construct } from 'constructs';
import { TerraformStack, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { Password } from '@cdktf/provider-random/lib/password';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { VpcEndpoint } from '@cdktf/provider-aws/lib/vpc-endpoint';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';

export interface RegionConfig {
  readonly region: string;
  readonly vpcCidr: string;
  readonly privateSubnetACidr: string;
  readonly privateSubnetBCidr: string;
  readonly azA: string;
  readonly azB: string;
}

export interface StackConfig {
  readonly commonTags: { [key: string]: string };
  readonly regions: RegionConfig[];
}

export class DualRegionHardenedStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: StackConfig) {
    super(scope, id);

    new RandomProvider(this, 'random');

    const providers = new Map<string, AwsProvider>();
    for (const regionConfig of config.regions) {
      providers.set(
        regionConfig.region,
        new AwsProvider(this, `aws-provider-${regionConfig.region}`, {
          region: regionConfig.region,
          alias: regionConfig.region,
        })
      );
    }

    const primaryProvider = providers.get('us-east-1')!;
    if (!primaryProvider) {
      throw new Error('A provider for the us-east-1 region is required.');
    }
    const uniqueSuffix = Fn.substr(Fn.uuid(), 0, 8);
    const callerIdentity = new DataAwsCallerIdentity(this, 'CallerIdentity', {
      provider: primaryProvider,
    });

    const appServiceRole = new IamRole(this, 'AppServiceRole', {
      provider: primaryProvider,
      name: `hardened-app-service-role-${uniqueSuffix}`,
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

    const kmsKeys = new Map<string, KmsKey>();
    for (const regionConfig of config.regions) {
      const key = new KmsKey(this, `KmsKey-${regionConfig.region}`, {
        provider: providers.get(regionConfig.region)!,
        description: `KMS key for hardened resources in ${regionConfig.region}`,
        enableKeyRotation: true,
        // FIX: Added a statement to allow the CloudWatch Logs service to use the key.
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Principal: {
                AWS: `arn:aws:iam::${callerIdentity.accountId}:root`,
              },
              Action: 'kms:*',
              Resource: '*',
            },
            {
              Sid: 'Allow AppServiceRole to use the key',
              Effect: 'Allow',
              Principal: { AWS: appServiceRole.arn },
              Action: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              Resource: '*',
            },
            {
              Sid: 'Allow CloudWatch Logs to use the key',
              Effect: 'Allow',
              Principal: {
                Service: `logs.${regionConfig.region}.amazonaws.com`,
              },
              Action: [
                'kms:Encrypt*',
                'kms:Decrypt*',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:Describe*',
              ],
              Resource: '*',
            },
          ],
        }),
        tags: { ...config.commonTags, Region: regionConfig.region },
      });
      kmsKeys.set(regionConfig.region, key);
    }

    for (const regionConfig of config.regions) {
      const regionProvider = providers.get(regionConfig.region)!;
      const regionKmsKey = kmsKeys.get(regionConfig.region)!;
      const tags = { ...config.commonTags, Region: regionConfig.region };

      const logGroup = new CloudwatchLogGroup(
        this,
        `LogGroup-${regionConfig.region}`,
        {
          provider: regionProvider,
          name: `/aws/secure-stack/${regionConfig.region}-${uniqueSuffix}`,
          retentionInDays: 30,
          kmsKeyId: regionKmsKey.arn,
          tags,
        }
      );

      const vpc = new Vpc(this, `VPC-${regionConfig.region}`, {
        provider: regionProvider,
        cidrBlock: regionConfig.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...tags, Name: `vpc-main-${regionConfig.region}` },
      });

      const vpcSg = new SecurityGroup(
        this,
        `VpcDefaultSG-${regionConfig.region}`,
        {
          provider: regionProvider,
          vpcId: vpc.id,
          name: `vpc-default-sg-${regionConfig.region}-${uniqueSuffix}`,
          description: 'Default SG to allow all traffic within the VPC.',
          tags: { ...tags, Name: `sg-default-${regionConfig.region}` },
          ingress: [
            { fromPort: 0, toPort: 0, protocol: '-1', selfAttribute: true },
          ],
          egress: [
            {
              fromPort: 0,
              toPort: 0,
              protocol: '-1',
              cidrBlocks: ['0.0.0.0/0'],
            },
          ],
        }
      );

      const servicesToEndpoint = [
        's3',
        'kms',
        'logs',
        'ec2messages',
        'ssmmessages',
        'secretsmanager',
      ];
      for (const service of servicesToEndpoint) {
        const isGateway = service === 's3';
        new VpcEndpoint(this, `VpcEndpoint-${service}-${regionConfig.region}`, {
          provider: regionProvider,
          vpcId: vpc.id,
          serviceName: `com.amazonaws.${regionConfig.region}.${service}`,
          vpcEndpointType: isGateway ? 'Gateway' : 'Interface',
          // FIX: Only enable Private DNS for Interface endpoints.
          privateDnsEnabled: !isGateway,
          securityGroupIds: !isGateway ? [vpcSg.id] : undefined,
          tags: { ...tags, Name: `vpce-${service}-${regionConfig.region}` },
        });
      }

      const privateSubnetA = new Subnet(
        this,
        `PrivateSubnetA-${regionConfig.region}`,
        {
          provider: regionProvider,
          vpcId: vpc.id,
          cidrBlock: regionConfig.privateSubnetACidr,
          availabilityZone: regionConfig.azA,
          mapPublicIpOnLaunch: false,
          tags: { ...tags, Name: `private-subnet-a-${regionConfig.region}` },
        }
      );
      const privateSubnetB = new Subnet(
        this,
        `PrivateSubnetB-${regionConfig.region}`,
        {
          provider: regionProvider,
          vpcId: vpc.id,
          cidrBlock: regionConfig.privateSubnetBCidr,
          availabilityZone: regionConfig.azB,
          mapPublicIpOnLaunch: false,
          tags: { ...tags, Name: `private-subnet-b-${regionConfig.region}` },
        }
      );

      const dbSg = new SecurityGroup(this, `DbSG-${regionConfig.region}`, {
        provider: regionProvider,
        vpcId: vpc.id,
        name: `db-sg-${regionConfig.region}-${uniqueSuffix}`,
        description: 'Allows PostgreSQL traffic from within the VPC.',
        tags: { ...tags, Name: `sg-db-${regionConfig.region}` },
        ingress: [
          {
            fromPort: 5432,
            toPort: 5432,
            protocol: 'tcp',
            cidrBlocks: [vpc.cidrBlock],
          },
        ],
      });

      const appServicePolicy = new IamPolicy(
        this,
        `AppServicePolicy-${regionConfig.region}`,
        {
          provider: regionProvider,
          name: `hardened-app-service-policy-${regionConfig.region}-${uniqueSuffix}`,
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
                Resource: [logGroup.arn],
              },
              {
                Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
                Effect: 'Allow',
                Resource: [regionKmsKey.arn],
              },
            ],
          }),
        }
      );

      new IamRolePolicyAttachment(
        this,
        `AppServicePolicyAttachment-${regionConfig.region}`,
        {
          provider: regionProvider,
          role: appServiceRole.name,
          policyArn: appServicePolicy.arn,
        }
      );

      const dbPassword = new Password(
        this,
        `DBPassword-${regionConfig.region}`,
        { length: 16, special: true, overrideSpecial: '_-.' }
      );
      const dbSecret = new SecretsmanagerSecret(
        this,
        `DBSecret-${regionConfig.region}`,
        {
          provider: regionProvider,
          name: `hardened/rds/creds/${regionConfig.region}-${uniqueSuffix}`,
          kmsKeyId: regionKmsKey.id,
          tags: { ...tags, Name: `secret-db-${regionConfig.region}` },
        }
      );
      new SecretsmanagerSecretVersion(
        this,
        `DBSecretVersion-${regionConfig.region}`,
        {
          provider: regionProvider,
          secretId: dbSecret.id,
          secretString: JSON.stringify({
            username: 'dbadmin',
            password: dbPassword.result,
          }),
        }
      );
      const dbSubnetGroup = new DbSubnetGroup(
        this,
        `DbSubnetGroup-${regionConfig.region}`,
        {
          provider: regionProvider,
          name: `db-subnet-group-${regionConfig.region}-${uniqueSuffix}`,
          subnetIds: [privateSubnetA.id, privateSubnetB.id],
          tags: { ...tags, Name: `dbsubnetgroup-main-${regionConfig.region}` },
        }
      );
      new DbInstance(this, `DB-${regionConfig.region}`, {
        provider: regionProvider,
        identifier: `app-db-${regionConfig.region}-${uniqueSuffix}`,
        engine: 'postgres',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        multiAz: true,
        storageEncrypted: true,
        kmsKeyId: regionKmsKey.arn,
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [dbSg.id],
        username: 'dbadmin',
        password: dbPassword.result,
        skipFinalSnapshot: true,
        enabledCloudwatchLogsExports: ['postgresql', 'upgrade'],
        tags: { ...tags, Name: `db-main-${regionConfig.region}` },
      });
    }
  }
}
