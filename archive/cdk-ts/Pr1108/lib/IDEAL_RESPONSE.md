# Project File/Folder Structure

```
.
├── bin/
│   └── tap.ts
├── lib/
│   ├── constructs/
│   │   ├── iam-mfa-policy.ts
│   │   ├── kms-key.ts
│   │   ├── rds-postgres.ts
│   │   ├── secure-bucket.ts
│   │   └── vpc.ts
│   ├── stacks/
│   │   ├── iam-stack.ts
│   │   ├── kms-stack.ts
│   │   ├── mfa-scp-stack.ts
│   │   ├── rds-stack.ts
│   │   ├── s3-stack.ts
│   │   └── vpc-stack.ts
│   └── IDEAL_RESPONSE.md
├── test/
│   └── ... (unit/integration tests)
└── ... (other project files)
```

# Source Code Snapshots

## bin/tap.ts

```typescript
import * as cdk from 'aws-cdk-lib';

import { IamStack } from '../lib/stacks/iam-stack';
import { KmsStack } from '../lib/stacks/kms-stack';
import { MfaEnforcementScpStack } from '../lib/stacks/mfa-scp-stack';
import { RdsStack } from '../lib/stacks/rds-stack';
import { S3Stack } from '../lib/stacks/s3-stack';
import { VpcStack } from '../lib/stacks/vpc-stack';

export function main(app?: cdk.App) {
  const appInstance = app ?? new cdk.App();
  const dept = (appInstance.node.tryGetContext('dept') as string) ?? 'hr';
  const envSuffix =
    (appInstance.node.tryGetContext('environmentSuffix') as string) ?? 'dev';
  const purpose =
    (appInstance.node.tryGetContext('purpose') as string) ?? 'security';
  const enableOrgScp =
    (appInstance.node.tryGetContext('enableOrgScp') as boolean) ?? false;
  const orgTargetId = appInstance.node.tryGetContext('orgTargetId') as
    | string
    | undefined;

  ['us-east-2', 'us-west-2'].forEach(region => {
    new KmsStack(appInstance, `${dept}-${envSuffix}-${purpose}-kms-${region}`, {
      env: { account: process.env.CDK_DEFAULT_ACCOUNT, region },
      dept,
      envName: envSuffix,
      purpose,
    });
    new S3Stack(appInstance, `${dept}-${envSuffix}-${purpose}-s3-${region}`, {
      env: { account: process.env.CDK_DEFAULT_ACCOUNT, region },
      dept,
      envName: envSuffix,
      purpose,
    });
    const vpc = new VpcStack(
      appInstance,
      `${dept}-${envSuffix}-${purpose}-vpc-${region}`,
      {
        env: { account: process.env.CDK_DEFAULT_ACCOUNT, region },
        dept,
        envName: envSuffix,
        purpose,
      }
    );
    new RdsStack(appInstance, `${dept}-${envSuffix}-${purpose}-rds-${region}`, {
      env: { account: process.env.CDK_DEFAULT_ACCOUNT, region },
      dept,
      envName: envSuffix,
      purpose,
      vpc: vpc.vpc,
    });
    new IamStack(appInstance, `${dept}-${envSuffix}-${purpose}-iam-${region}`, {
      env: { account: process.env.CDK_DEFAULT_ACCOUNT, region },
      dept,
      envName: envSuffix,
      purpose,
    });
  });

  if (enableOrgScp && orgTargetId) {
    new MfaEnforcementScpStack(
      appInstance,
      `${dept}-${envSuffix}-${purpose}-mfa-scp`,
      {
        env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-2' },
        dept,
        envName: envSuffix,
        purpose,
        orgTargetId,
      }
    );
  }
}

if (require.main === module) {
  main();
}
```

## lib/constructs/iam-mfa-policy.ts

```typescript
import { aws_iam as iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MfaManagedPolicy extends Construct {
  public readonly policy: iam.ManagedPolicy;
  constructor(scope: Construct, id: string) {
    super(scope, id);
    this.policy = new iam.ManagedPolicy(this, 'MfaRequired', {
      description: 'Deny if MFA not present (fallback when no SCP)',
      statements: [
        new iam.PolicyStatement({
          sid: 'DenyAllIfNoMFA',
          effect: iam.Effect.DENY,
          notActions: [
            'iam:CreateVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:ListMFADevices',
            'iam:ListVirtualMFADevices',
            'iam:ListUsers',
            'iam:ListAccountAliases',
            'iam:GetAccountSummary',
            'sts:GetSessionToken',
            'sts:AssumeRole',
          ],
          resources: ['*'],
          conditions: {
            BoolIfExists: { 'aws:MultiFactorAuthPresent': 'false' },
          },
        }),
      ],
    });
  }
}
```

## lib/constructs/kms-key.ts

```typescript
import { aws_kms as kms, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface DataKmsKeyProps {
  alias: string;
  description?: string;
  removalPolicy?: RemovalPolicy;
}

export class DataKmsKey extends Construct {
  public readonly key: kms.Key;
  constructor(scope: Construct, id: string, props: DataKmsKeyProps) {
    super(scope, id);
    if (!props.alias) {
      throw new Error('alias is required for DataKmsKey');
    }
    this.key = new kms.Key(this, 'Key', {
      alias: props.alias,
      description: props.description ?? 'CMK for data-at-rest encryption',
      enableKeyRotation: true,
      removalPolicy: props.removalPolicy ?? RemovalPolicy.RETAIN,
    });
  }
}
```

## lib/constructs/rds-postgres.ts

```typescript
import {
  Duration,
  aws_ec2 as ec2,
  aws_kms as kms,
  aws_rds as rds,
  RemovalPolicy,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface PostgresProps {
  vpc: ec2.IVpc;
  kmsKey: kms.IKey;
  idSuffix: string;
}

export class PostgresRds extends Construct {
  public readonly instance: rds.DatabaseInstance;
  constructor(scope: Construct, id: string, props: PostgresProps) {
    super(scope, id);

    if (
      !props.idSuffix ||
      typeof props.idSuffix !== 'string' ||
      props.idSuffix.trim() === ''
    ) {
      throw new Error('idSuffix is required for PostgresRds');
    }
    const dbSg = new ec2.SecurityGroup(this, 'DbSg', {
      vpc: props.vpc,
      description: 'RDS SG',
      allowAllOutbound: true,
    }); // no inbound rules by default

    const subnetGroup = new rds.SubnetGroup(this, 'DbSubnets', {
      vpc: props.vpc,
      description: 'DB Isolated Subnets',
      removalPolicy: RemovalPolicy.DESTROY,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    this.instance = new rds.DatabaseInstance(this, 'Db', {
      instanceIdentifier: `pg-${props.idSuffix}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      subnetGroup,
      securityGroups: [dbSg],
      allocatedStorage: 20,
      storageEncrypted: true,
      storageEncryptionKey: props.kmsKey,
      publiclyAccessible: false,
      removalPolicy: RemovalPolicy.RETAIN,
      deleteAutomatedBackups: false,
      autoMinorVersionUpgrade: true,
      backupRetention: Duration.days(7),
      multiAz: true,
    });
  }
```

## lib/constructs/secure-bucket.ts

```typescript
import { aws_iam as iam, aws_kms as kms, aws_s3 as s3 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface SecureBucketProps {
  bucketName?: string;
  encryptionKey: kms.IKey;
}

export class SecureBucket extends Construct {
  public readonly bucket: s3.Bucket;
  constructor(scope: Construct, id: string, props: SecureBucketProps) {
    super(scope, id);
    if (!props.encryptionKey) {
      throw new Error('encryptionKey is required for SecureBucket');
    }
    this.bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: props.bucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.encryptionKey,
      enforceSSL: true,
      bucketKeyEnabled: true,
    });

    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyIncorrectEncryptionHeader',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [this.bucket.arnForObjects('*')],
        conditions: {
          StringNotEquals: { 's3:x-amz-server-side-encryption': 'aws:kms' },
        },
      })
    );

    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyUnEncryptedOrWrongKey',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [this.bucket.arnForObjects('*')],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption-aws-kms-key-id':
              props.encryptionKey.keyArn,
          },
        },
      })
    );
  }
}
```

## lib/constructs/vpc.ts

```typescript
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class AppVpc extends Construct {
  public readonly vpc: ec2.Vpc;
  constructor(scope: Construct, id: string, name: string) {
    super(scope, id);
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('VPC name is required for AppVpc');
    }
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: name,
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'isolated-a',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
        {
          name: 'isolated-b',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });
  }
}
```

## lib/stacks/iam-stack.ts

```typescript
import { Stack, StackProps, aws_iam as iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MfaManagedPolicy } from '../constructs/iam-mfa-policy';
import { name } from '../naming';

export interface IamProps extends StackProps {
  dept: string;
  envName: string;
  purpose: string;
}

export class IamStack extends Stack {
  public readonly roleDev: iam.Role;
  public readonly roleProd: iam.Role;

  constructor(scope: Construct, id: string, props: IamProps) {
    super(scope, id, props);
    if (!props || typeof props !== 'object') {
      throw new Error('Props are required for IamStack');
    }
    if (
      !props.dept ||
      typeof props.dept !== 'string' ||
      props.dept.trim() === ''
    ) {
      throw new Error('dept is required for IamStack');
    }
    if (
      !props.envName ||
      typeof props.envName !== 'string' ||
      props.envName.trim() === ''
    ) {
      throw new Error('envName is required for IamStack');
    }
    if (
      !props.purpose ||
      typeof props.purpose !== 'string' ||
      props.purpose.trim() === ''
    ) {
      throw new Error('purpose is required for IamStack');
    }
    // Minimal roles (no wildcards). Add fine-grained policies later if desired by reading SSM ARNs.
    this.roleDev = new iam.Role(this, 'DevRole', {
      roleName: name(props.dept, 'dev', `${props.purpose}-app-role`),
      assumedBy: new iam.AccountPrincipal(this.account),
    });
    this.roleProd = new iam.Role(this, 'ProdRole', {
      roleName: name(props.dept, 'prod', `${props.purpose}-app-role`),
      assumedBy: new iam.AccountPrincipal(this.account),
    });
    // Attach MFA fallback managed policy (SCP recommended if using Organizations)
    const mfaPolicy = new MfaManagedPolicy(this, 'MfaFallback').policy;
    this.roleDev.addManagedPolicy(mfaPolicy);
    this.roleProd.addManagedPolicy(mfaPolicy);
  }
}
```

## lib/stacks/kms-stack.ts

```typescript
import {
  Stack,
  StackProps,
  aws_iam as iam,
  aws_kms as kms,
  aws_ssm as ssm,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DataKmsKey } from '../constructs/kms-key';

export interface BaseProps extends StackProps {
  dept: string;
  envName: string;
  purpose: string;
  regionOverride?: string;
}

export class KmsStack extends Stack {
  public readonly key: kms.Key;
  constructor(scope: Construct, id: string, props: BaseProps) {
    super(scope, id, props);

    const alias = `alias/${props.dept}-${props.envName}-${props.purpose}-data`;
    this.key = new DataKmsKey(this, 'DataKey', { alias }).key;

    // allow S3 and RDS via service in this account/region
    this.key.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowUseViaS3',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
        ],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'kms:CallerAccount': this.account,
            'kms:ViaService': `s3.${this.region}.amazonaws.com`,
          },
        },
      })
    );
    this.key.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowUseViaRds',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('rds.amazonaws.com')],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
        ],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'kms:CallerAccount': this.account,
            'kms:ViaService': `rds.${this.region}.amazonaws.com`,
          },
        },
      })
    );
  }
}
```

## lib/stacks/mfa-scp-stack.ts

```typescript
import { Stack, StackProps, aws_organizations as org } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { name } from '../naming';

export interface MfaScpProps extends StackProps {
  dept: string;
  envName: string;
  purpose: string;
  orgTargetId: string;
}

export class MfaEnforcementScpStack extends Stack {
  constructor(scope: Construct, id: string, props: MfaScpProps) {
    super(scope, id, props);
    if (!props || typeof props !== 'object') {
      throw new Error('Props are required for MfaEnforcementScpStack');
    }
    if (
      !props.dept ||
      typeof props.dept !== 'string' ||
      props.dept.trim() === ''
    ) {
      throw new Error('dept is required for MfaEnforcementScpStack');
    }
    if (
      !props.envName ||
      typeof props.envName !== 'string' ||
      props.envName.trim() === ''
    ) {
      throw new Error('envName is required for MfaEnforcementScpStack');
    }
    if (
      !props.purpose ||
      typeof props.purpose !== 'string' ||
      props.purpose.trim() === ''
    ) {
      throw new Error('purpose is required for MfaEnforcementScpStack');
    }
    if (
      !props.orgTargetId ||
      typeof props.orgTargetId !== 'string' ||
      props.orgTargetId.trim() === ''
    ) {
      throw new Error('orgTargetId is required for MfaEnforcementScpStack');
    }
    new org.CfnPolicy(this, 'MfaScp', {
      name: name(props.dept, props.envName, `${props.purpose}-mfa-scp`),
      type: 'SERVICE_CONTROL_POLICY',
      targetIds: [props.orgTargetId],
      content: {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'DenyIfNoMFA',
            Effect: 'Deny',
            NotAction: [
              'iam:CreateVirtualMFADevice',
              'iam:EnableMFADevice',
              'iam:ListMFADevices',
              'iam:ListVirtualMFADevices',
              'iam:ListUsers',
              'iam:ListAccountAliases',
              'iam:GetAccountSummary',
              'sts:GetSessionToken',
              'sts:AssumeRole',
            ],
            Resource: '*',
            Condition: {
              BoolIfExists: { 'aws:MultiFactorAuthPresent': 'false' },
            },
          },
        ],
      },
    });
  }
}
```

## lib/stacks/rds-stack.ts

```typescript
import {
  Stack,
  StackProps,
  aws_kms as kms,
  aws_rds as rds,
  aws_ssm as ssm,
} from 'aws-cdk-lib';
import type { IVpc } from 'aws-cdk-lib/aws-ec2';
import type { IKey } from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
import { PostgresRds } from '../constructs/rds-postgres';

export interface RdsProps extends StackProps {
  dept: string;
  envName: string;
  purpose: string;
  vpc: IVpc;
  kmsKey?: IKey;
  regionOverride?: string;
}

export class RdsStack extends Stack {
  public readonly instance: rds.DatabaseInstance;
  constructor(scope: Construct, id: string, props: RdsProps) {
    super(scope, id, props);

    let key: kms.IKey;
    if (props.kmsKey) {
      key = props.kmsKey;
    } else {
      const keyArn = ssm.StringParameter.valueForStringParameter(
        this,
        `/${props.dept}-${props.envName}-${props.purpose}/kms/key-arn/${this.region}`
      );
      key = kms.Key.fromKeyArn(this, 'DataKey', keyArn);
    }

    this.instance = new PostgresRds(this, 'Pg', {
      vpc: props.vpc,
      kmsKey: key,
      idSuffix: `${props.dept}-${props.envName}-${props.purpose}-${this.region}`,
    }).instance;

    const region = props.regionOverride ?? this.region;
    new ssm.StringParameter(this, 'DbArnParam', {
      parameterName: `/${props.dept}-${props.envName}-${props.purpose}/rds/db-arn/${region}`,
      stringValue: this.instance.instanceArn,
    });
  }
}
```

## lib/stacks/s3-stack.ts

```typescript
import {
  Stack,
  StackProps,
  aws_kms as kms,
  aws_s3 as s3,
  aws_ssm as ssm,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecureBucket } from '../constructs/secure-bucket';

export interface BaseProps extends StackProps {
  dept: string;
  envName: string;
  purpose: string;
  regionOverride?: string;
  accountOverride?: string;
}

export class S3Stack extends Stack {
  public readonly bucket: s3.Bucket;
  constructor(scope: Construct, id: string, props: BaseProps) {
    super(scope, id, props);
    if (!props || typeof props !== 'object') {
      throw new Error('Props are required for S3Stack');
    }
    if (
      !props.dept ||
      typeof props.dept !== 'string' ||
      props.dept.trim() === ''
    ) {
      throw new Error('dept is required for S3Stack');
    }
    if (
      !props.envName ||
      typeof props.envName !== 'string' ||
      props.envName.trim() === ''
    ) {
      throw new Error('envName is required for S3Stack');
    }
    if (
      !props.purpose ||
      typeof props.purpose !== 'string' ||
      props.purpose.trim() === ''
    ) {
      throw new Error('purpose is required for S3Stack');
    }
    const region = props.regionOverride ?? this.region;
    const account = props.accountOverride ?? this.account;
    const keyArn = ssm.StringParameter.valueForStringParameter(
      this,
      `/${props.dept}-${props.envName}-${props.purpose}/kms/key-arn/${region}`
    );
    if (!keyArn || typeof keyArn !== 'string' || keyArn.trim() === '') {
      throw new Error(
        'encryptionKey (keyArn) is required for SecureBucket in S3Stack'
      );
    }
    const key = kms.Key.fromKeyArn(this, 'DataKey', keyArn);
    const bucketName =
      `${props.dept}-${props.envName}-${props.purpose}-${account}-${region}`.toLowerCase();
```

## lib/stacks/vpc-stack.ts

```typescript
import { aws_ec2 as ec2, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AppVpc } from '../constructs/vpc';
import { name } from '../naming';

export interface VpcProps extends StackProps {
  dept: string;
  envName: string;
  purpose: string;
}

export class VpcStack extends Stack {
  public readonly vpc: ec2.Vpc;
  constructor(scope: Construct, id: string, props: VpcProps) {
    super(scope, id, props);
    if (!props || typeof props !== 'object') {
      throw new Error('Props are required for VpcStack');
    }
    if (
      !props.dept ||
      typeof props.dept !== 'string' ||
      props.dept.trim() === ''
    ) {
      throw new Error('dept is required for VpcStack');
    }
    if (
      !props.envName ||
      typeof props.envName !== 'string' ||
      props.envName.trim() === ''
    ) {
      throw new Error('envName is required for VpcStack');
    }
    if (
      !props.purpose ||
      typeof props.purpose !== 'string' ||
      props.purpose.trim() === ''
    ) {
      throw new Error('purpose is required for VpcStack');
    }
    this.vpc = new AppVpc(
      this,
      'Vpc',
      name(props.dept, props.envName, `${props.purpose}-vpc`)
    ).vpc;
  }
}
```
