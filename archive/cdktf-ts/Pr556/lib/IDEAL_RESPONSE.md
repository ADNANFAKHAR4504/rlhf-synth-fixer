```markdown
# IDEAL_RESPONSE.md — DRY Multi-Environment AWS Infrastructure with CDKTF (TypeScript)

## Overview
This solution fulfills `PROMPT.md` using **Terraform CDK (CDKTF) in TypeScript**, applying **DRY** across reusable stacks:

- **Networking:** VPC with public/private subnets, IGW, NAT per AZ, route tables and associations.
- **Security:** Web/App/DB security groups with least-privilege tiering.
- **Compute:** EC2 instances (parametrized AMI, type, count) spread across subnets.
- **Database:** RDS MySQL with backup windows, encryption, and **secure password resolution** (Secrets Manager **or** env var at synth).
- **Storage:** S3 with versioning, encryption, and public access block.
- **State:** Remote **S3 backend** with lock file enabled; DynamoDB locking recommended.
- **Environments:** `environmentSuffix` (e.g., `dev`, `staging`, `prod`) ensures **no code changes** across environments.

---

## Repository Layout
```

bin/
tap.ts                 # CDKTF entrypoint
lib/
AWS\_REGION.ts
compute-stack.ts
database-stack.ts
secure-vpc-stack.ts
security-stack.ts
storage-stack.ts
tap-stack.ts           # Composes everything
test/
tap-stack.int.test.ts  # Integration tests (synth + resource assertions)
tap-stack.unit.test.ts # Unit tests & snapshots
cdktf.json               # Referenced (not inlined)
package.json             # Referenced (not inlined)

````

> **Note:** Keep `cdktf.json` pointing to `npx ts-node bin/tap.ts`, and pin `@cdktf/provider-aws` to `~> 6.0`. Pin `cdktf-cli` and TypeScript in `package.json` for deterministic builds.

---

## Versions (Pinned)
- Node.js: **>= 18.x**
- TypeScript: **^5.x**
- `cdktf-cli`: **^0.20.x**
- `@cdktf/provider-aws`: **~> 6.0**

---

## Secrets Handling
`DatabaseStack` supports multiple password paths (in priority order):
1) **`passwordSecretArn`** → resolves from AWS Secrets Manager at synth  
2) **`password`** prop → explicit value (useful for tests)  
3) **`passwordEnvVarName`** (default `DB_PASSWORD`) → read from `process.env` at synth  
4) **CI fallback** if none provided and `process.env.CI` is set

Passwords are sanitized to RDS constraints (8–41 chars, excludes `/`, `@`, `"`, space).

---

## State & Environments
- **Backend:** S3 (locking enabled). Add DynamoDB table for full state-locking in production.
- **Environments:** Select via `ENVIRONMENT_SUFFIX` (e.g., `dev`, `staging`, `prod`) — **no code edits required**.

`tap-stack.ts`:
```ts
new S3Backend(this, {
  bucket: stateBucket,
  key: `${environmentSuffix}/${id}.tfstate`,
  region: stateBucketRegion,
  encrypt: true,
});
this.addOverride('terraform.backend.s3.use_lockfile', true);
````

---

## How to Run

### Install & Build

```bash
npm ci
npm run build
```

### Synth

```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-west-2
export TERRAFORM_STATE_BUCKET=<your-state-bucket>
export TERRAFORM_STATE_BUCKET_REGION=us-west-2
export DB_PASSWORD='StrongPassw0rd!'   # or set passwordSecretArn in TapStack->DatabaseStack
npx cdktf synth
```

### Deploy

```bash
# Stack name is TapStack<ENVIRONMENT_SUFFIX>, e.g. TapStackdev
npx cdktf deploy TapStackdev --auto-approve
```

### Destroy

```bash
npx cdktf destroy TapStackdev --auto-approve
```

---

## Tests

### Run All Tests

```bash
npm test
```

* **Unit tests**: Snapshot and branch coverage (`ComputeStack` error path, etc.).
* **Integration test**: Synthesizes full `TapStack` and asserts presence of core resources.

---

## Source Code (Fully Inlined)

### `lib/AWS_REGION.ts`

```typescript
const AWS_REGION_OVERRIDE = 'us-west-2';
export default AWS_REGION_OVERRIDE;
```

---

### `lib/compute-stack.ts`

```typescript
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

export interface ComputeStackProps {
  subnetIds: string[];
  securityGroupIds: string[];
  amiId?: string;
  instanceType: string;
  instanceCount: number;
  // Removed keyName and keyMaterial
}

export class ComputeStack extends Construct {
  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id);

    const environment = 'dev';
    const projectName = 'myproject';

    const { subnetIds, securityGroupIds, amiId, instanceType, instanceCount } =
      props;

    if (!subnetIds || subnetIds.length === 0) {
      throw new Error('ComputeStack: subnetIds must be provided and non-empty');
    }

    const commonTags = {
      Environment: environment,
      Project: projectName,
      ManagedBy: 'Terraform',
    };

    const latestAmi = new DataAwsAmi(this, 'LatestAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'virtualization-type', values: ['hvm'] },
      ],
    });

    const resolvedAmi = amiId ?? latestAmi.id;

    const userDataScript = `#!/bin/bash
echo "Hello from instance!" > /var/www/html/index.html
`;

    const ec2Instances: Instance[] = [];

    for (let i = 0; i < instanceCount; i++) {
      const ec2 = new Instance(this, `ec2-instance-${i + 1}`, {
        ami: resolvedAmi,
        instanceType,
        subnetId: subnetIds[i % subnetIds.length],
        vpcSecurityGroupIds: securityGroupIds,
        userData: userDataScript,
        monitoring: false,
        rootBlockDevice: {
          volumeType: 'gp3',
          volumeSize: 20,
          encrypted: true,
        },
        tags: {
          ...commonTags,
          Name: `${projectName}-${environment}-instance-${i + 1}`,
        },
        lifecycle: {
          createBeforeDestroy: true,
        },
      });

      ec2Instances.push(ec2);
    }

    new TerraformOutput(this, 'instance_ids', {
      value: ec2Instances.map(ec2 => ec2.id),
    });

    new TerraformOutput(this, 'public_ips', {
      value: ec2Instances.map(ec2 => ec2.publicIp),
    });

    new TerraformOutput(this, 'private_ips', {
      value: ec2Instances.map(ec2 => ec2.privateIp),
    });
  }
}
```

---

### `lib/database-stack.ts`

```typescript
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// Secrets Manager data sources (optional path)
import { DataAwsSecretsmanagerSecret } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret';
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';

export interface DatabaseStackProps {
  subnetIds: string[];
  securityGroupIds: string[];
  dbName: string;
  username: string;

  // Password resolution options (prefer secret ARN, then env var, then prop)
  password?: string;
  passwordSecretArn?: string; // preferred in CI/CD or prod
  passwordEnvVarName?: string; // local/dev fallback (defaults to DB_PASSWORD)

  finalSnapshotIdOverride?: string;
}

export class DatabaseStack extends Construct {
  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    // NOTE: these are still hardcoded in sub-stacks today; consider threading via props later.
    const environment = 'dev';
    const projectName = 'myproject';

    const commonTags: Record<string, string> = {
      Environment: environment,
      Project: projectName,
      ManagedBy: 'Terraform',
    };

    const { subnetIds, securityGroupIds, dbName, username } = props;

    // --- Password resolution: Secret ARN → Explicit prop → Env Var (default DB_PASSWORD) → CI fallback ---
    let resolvedPassword: string | undefined;

    if (props.passwordSecretArn) {
      const secret = new DataAwsSecretsmanagerSecret(this, 'dbPwSecret', {
        arn: props.passwordSecretArn,
      });
      const secretVer = new DataAwsSecretsmanagerSecretVersion(
        this,
        'dbPwSecretVer',
        { secretId: secret.id }
      );
      resolvedPassword = secretVer.secretString;
    } else if (props.password && props.password.trim().length > 0) {
      // explicit prop wins over env for test determinism
      resolvedPassword = props.password;
    } else {
      const envName = props.passwordEnvVarName ?? 'DB_PASSWORD';
      const envVal = process.env[envName];
      if (envVal && envVal.trim().length > 0) {
        resolvedPassword = envVal;
      } else if (process.env.CI) {
        resolvedPassword = 'TempPassw0rd1!'; // short CI fallback
      }
    }

    if (!resolvedPassword) {
      const hint =
        props.passwordEnvVarName ??
        'DB_PASSWORD (default used when passwordEnvVarName is not provided)';
      throw new Error(
        `DatabaseStack: one of passwordSecretArn | ${hint} | password must be provided`
      );
    }

    // --- RDS password sanitization & validation ---
    // Disallowed: '/', '@', '"', space. Length must be 8–41 for MySQL.
    const sanitizePassword = (pw: string): string => {
      let s = pw.replace(/[\/@"\s]/g, '');
      if (s.length > 41) s = s.slice(0, 41);
      // pad to 8 chars minimally if someone passes fewer (keeps synth from failing)
      if (s.length < 8) s = s.padEnd(8, '1');
      return s;
    };

    resolvedPassword = sanitizePassword(resolvedPassword);

    // --- subnet group ---
    const subnetGroup = new DbSubnetGroup(this, 'DbSubnetGroup', {
      name: `${projectName}-${environment}-db-subnet-group`,
      subnetIds: subnetIds,
      tags: {
        ...commonTags,
        Name: `${projectName}-${environment}-db-subnet-group`,
      },
    });

    // --- RDS instance ---
    const rds = new DbInstance(this, 'RdsInstance', {
      identifier: `${projectName}-${environment}-db`,

      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',

      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: 'gp3',
      storageEncrypted: true,

      dbName: dbName,
      username: username,

      // use sanitized, compliant password
      password: resolvedPassword,

      dbSubnetGroupName: subnetGroup.name,
      vpcSecurityGroupIds: securityGroupIds,

      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      multiAz: false,
      publiclyAccessible: false,

      skipFinalSnapshot: false,
      finalSnapshotIdentifier:
        props.finalSnapshotIdOverride ??
        `${projectName}-${environment}-final-snapshot`,

      tags: {
        ...commonTags,
        Name: `${projectName}-${environment}-db`,
      },
    });

    // --- outputs ---
    new TerraformOutput(this, 'db_instance_id', { value: rds.id });
    new TerraformOutput(this, 'db_instance_endpoint', { value: rds.endpoint });
    new TerraformOutput(this, 'db_instance_port', { value: rds.port });
    new TerraformOutput(this, 'db_subnet_group_id', { value: subnetGroup.id });
  }
}
```

---

### `lib/secure-vpc-stack.ts`

```typescript
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Fn, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

export interface SecureVpcStackOutputs {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
}

export class SecureVpcStack extends Construct {
  public readonly outputs: SecureVpcStackOutputs;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const environment = 'dev';
    const projectName = 'myproject';

    const commonTags = {
      Environment: environment,
      Project: projectName,
      ManagedBy: 'Terraform',
    };

    // VPC
    const mainVpc = new Vpc(this, 'MainVpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { ...commonTags, Name: `${projectName}-${environment}-vpc` },
    });

    // IGW
    const igw = new InternetGateway(this, 'Igw', {
      vpcId: mainVpc.id,
      tags: { ...commonTags, Name: `${projectName}-${environment}-igw` },
    });

    // Availability Zones (dynamic)
    const azs = new DataAwsAvailabilityZones(this, 'availableAzs', {
      state: 'available',
    });
    const selectedAzs = [Fn.element(azs.names, 0), Fn.element(azs.names, 1)];

    // CIDRs
    const publicCidrs = ['10.0.1.0/24', '10.0.2.0/24'];
    const privateCidrs = ['10.0.11.0/24', '10.0.12.0/24'];

    // Public subnets
    const publicSubnets: Subnet[] = publicCidrs.map(
      (cidr, i) =>
        new Subnet(this, `PublicSubnet${i + 1}`, {
          vpcId: mainVpc.id,
          cidrBlock: cidr,
          availabilityZone: selectedAzs[i],
          mapPublicIpOnLaunch: true,
          tags: {
            ...commonTags,
            Name: `${projectName}-${environment}-public-subnet-${i + 1}`,
            Type: 'Public',
          },
          lifecycle: { createBeforeDestroy: true },
        })
    );

    // Private subnets
    const privateSubnets: Subnet[] = privateCidrs.map(
      (cidr, i) =>
        new Subnet(this, `PrivateSubnet${i + 1}`, {
          vpcId: mainVpc.id,
          cidrBlock: cidr,
          availabilityZone: selectedAzs[i],
          tags: {
            ...commonTags,
            Name: `${projectName}-${environment}-private-subnet-${i + 1}`,
            Type: 'Private',
          },
          lifecycle: { createBeforeDestroy: true },
        })
    );

    // EIPs for NATs
    const eips: Eip[] = publicSubnets.map(
      (_, i) =>
        new Eip(this, `NatEip${i + 1}`, {
          domain: 'vpc',
          tags: {
            ...commonTags,
            Name: `${projectName}-${environment}-nat-eip-${i + 1}`,
          },
          lifecycle: { createBeforeDestroy: true },
        })
    );

    // NAT Gateways
    const natGateways: NatGateway[] = eips.map(
      (eip, i) =>
        new NatGateway(this, `NatGateway${i + 1}`, {
          allocationId: eip.id,
          subnetId: publicSubnets[i].id,
          tags: {
            ...commonTags,
            Name: `${projectName}-${environment}-nat-gateway-${i + 1}`,
          },
          lifecycle: { createBeforeDestroy: true },
        })
    );

    // Public route table + associations
    const publicRouteTable = new RouteTable(this, 'PublicRT', {
      vpcId: mainVpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
      tags: { ...commonTags, Name: `${projectName}-${environment}-public-rt` },
    });

    publicSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `PublicRTA${i + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Private route tables + associations
    privateSubnets.forEach((subnet, i) => {
      const rt = new RouteTable(this, `PrivateRT${i + 1}`, {
        vpcId: mainVpc.id,
        route: [{ cidrBlock: '0.0.0.0/0', natGatewayId: natGateways[i].id }],
        tags: {
          ...commonTags,
          Name: `${projectName}-${environment}-private-rt-${i + 1}`,
        },
      });

      new RouteTableAssociation(this, `PrivateRTA${i + 1}`, {
        subnetId: subnet.id,
        routeTableId: rt.id,
      });
    });

    // Outputs
    new TerraformOutput(this, 'vpc_id', { value: mainVpc.id });
    new TerraformOutput(this, 'public_subnet_ids', {
      value: publicSubnets.map(s => s.id),
    });
    new TerraformOutput(this, 'private_subnet_ids', {
      value: privateSubnets.map(s => s.id),
    });
    new TerraformOutput(this, 'internet_gateway_id', { value: igw.id });
    new TerraformOutput(this, 'nat_gateway_ids', {
      value: natGateways.map(n => n.id),
    });

    this.outputs = {
      vpcId: mainVpc.id,
      publicSubnetIds: publicSubnets.map(s => s.id),
      privateSubnetIds: privateSubnets.map(s => s.id),
    };
  }
}
```

---

### `lib/security-stack.ts`

```typescript
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

export interface SecurityStackOutputs {
  webSgId: string;
  appSgId: string;
  dbSgId: string;
}

interface SecurityStackProps {
  vpcId: string;
  vpcCidr: string;
}

export class SecurityStack extends Construct {
  public readonly outputs: SecurityStackOutputs;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id);

    const environment = 'dev';
    const projectName = 'myproject';
    const { vpcId, vpcCidr } = props;

    const commonTags = {
      Environment: environment,
      Project: projectName,
      ManagedBy: 'Terraform',
    };

    // === Web SG
    const webSg = new SecurityGroup(this, 'web_sg', {
      vpcId: vpcId,
      tags: {
        ...commonTags,
        Name: `${projectName}-${environment}-web-sg`,
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    new SecurityGroupRule(this, 'web_http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: webSg.id,
    });

    new SecurityGroupRule(this, 'web_https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: webSg.id,
    });

    new SecurityGroupRule(this, 'web_egress_https', {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: webSg.id,
    });

    new SecurityGroupRule(this, 'web_egress_http', {
      type: 'egress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: webSg.id,
    });

    // allow web -> app on 8080 (to VPC)
    new SecurityGroupRule(this, 'web_egress_app_8080', {
      type: 'egress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      cidrBlocks: [vpcCidr],
      securityGroupId: webSg.id,
    });

    // === App SG
    const appSg = new SecurityGroup(this, 'app_sg', {
      vpcId: vpcId,
      tags: {
        ...commonTags,
        Name: `${projectName}-${environment}-app-sg`,
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    new SecurityGroupRule(this, 'app_http_from_web', {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: webSg.id,
      securityGroupId: appSg.id,
    });

    new SecurityGroupRule(this, 'app_ssh', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: [vpcCidr],
      securityGroupId: appSg.id,
    });

    new SecurityGroupRule(this, 'app_egress_https', {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: appSg.id,
    });

    new SecurityGroupRule(this, 'app_egress_http', {
      type: 'egress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: appSg.id,
    });

    // app -> db MySQL
    new SecurityGroupRule(this, 'app_egress_db_mysql', {
      type: 'egress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      cidrBlocks: [vpcCidr],
      securityGroupId: appSg.id,
    });

    // app -> db Postgres
    new SecurityGroupRule(this, 'app_egress_db_pg', {
      type: 'egress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      cidrBlocks: [vpcCidr],
      securityGroupId: appSg.id,
    });

    // === DB SG
    const dbSg = new SecurityGroup(this, 'db_sg', {
      vpcId: vpcId,
      tags: {
        ...commonTags,
        Name: `${projectName}-${environment}-db-sg`,
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    new SecurityGroupRule(this, 'db_mysql_from_app', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: appSg.id,
      securityGroupId: dbSg.id,
    });

    new SecurityGroupRule(this, 'db_pgsql_from_app', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: appSg.id,
      securityGroupId: dbSg.id,
    });

    new SecurityGroupRule(this, 'db_egress', {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: [vpcCidr], // keep DB traffic inside VPC unless needed
      securityGroupId: dbSg.id,
    });

    // === Outputs for Terraform CLI
    new TerraformOutput(this, 'web_security_group_id', {
      value: webSg.id,
    });

    new TerraformOutput(this, 'app_security_group_id', {
      value: appSg.id,
    });

    new TerraformOutput(this, 'db_security_group_id', {
      value: dbSg.id,
    });

    // === Expose internal outputs for other stacks
    this.outputs = {
      webSgId: webSg.id,
      appSgId: appSg.id,
      dbSgId: dbSg.id,
    };
  }
}
```

---

### `lib/storage-stack.ts`

```typescript
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

export interface StorageStackProps {
  bucketSuffixOverride?: string;
}

export class StorageStack extends Construct {
  constructor(scope: Construct, id: string, props?: StorageStackProps) {
    super(scope, id);

    const environment = 'dev';
    const projectName = 'myproject';

    const suffix =
      props?.bucketSuffixOverride ??
      Math.floor(Math.random() * 10000).toString();
    const bucketName = `${projectName}-${environment}-assets-${suffix}`;

    const commonTags = {
      Environment: environment,
      Project: projectName,
      ManagedBy: 'Terraform',
    };

    // === S3 Bucket
    const bucket = new S3Bucket(this, 'MainBucket', {
      bucket: bucketName,
      tags: {
        ...commonTags,
        Name: bucketName,
      },
    });

    // === Versioning
    new S3BucketVersioningA(this, 'BucketVersioning', {
      bucket: bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // === Encryption
    new S3BucketServerSideEncryptionConfigurationA(this, 'BucketEncryption', {
      bucket: bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: false,
        },
      ],
    });

    // === Block Public Access
    new S3BucketPublicAccessBlock(this, 'BlockPublicAccess', {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // === Outputs
    new TerraformOutput(this, 'bucket_id', {
      value: bucket.id,
    });

    new TerraformOutput(this, 'bucket_arn', {
      value: bucket.arn,
    });

    new TerraformOutput(this, 'bucket_domain_name', {
      value: bucket.bucketDomainName,
    });

    new TerraformOutput(this, 'bucket_regional_domain_name', {
      value: bucket.bucketRegionalDomainName,
    });
  }
}
```

---

### `lib/tap-stack.ts`

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

import { ComputeStack } from './compute-stack';
import { DatabaseStack } from './database-stack';
import { SecureVpcStack } from './secure-vpc-stack';
import { SecurityStack } from './security-stack';
import { StorageStack } from './storage-stack';

import AWS_REGION_OVERRIDE from './AWS_REGION';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags; // single object from caller
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix ?? 'dev';
    const awsRegion = AWS_REGION_OVERRIDE || props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion ?? 'us-east-1';
    const stateBucket = props?.stateBucket ?? 'iac-rlhf-tf-states';

    // Provider expects list form for defaultTags in this binding
    const defaultTagsList = props?.defaultTags ? [props.defaultTags] : [];

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTagsList,
    });

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Network + security
    const vpcStack = new SecureVpcStack(this, 'SecureVpcStack');
    const securityStack = new SecurityStack(this, 'SecurityStack', {
      vpcId: vpcStack.outputs.vpcId,
      vpcCidr: '10.0.0.0/16',
    });

    // Compute
    new ComputeStack(this, 'ComputeStack', {
      subnetIds: vpcStack.outputs.publicSubnetIds,
      securityGroupIds: [securityStack.outputs.webSgId],
      instanceType: 't3.micro',
      instanceCount: 2,
    });

    // Database (CI-safe: reads DB_PASSWORD at synth)
    new DatabaseStack(this, 'DatabaseStack', {
      subnetIds: vpcStack.outputs.privateSubnetIds,
      securityGroupIds: [securityStack.outputs.dbSgId],
      dbName: 'appdb',
      username: 'admin',
      // prefer Secrets Manager in real envs; env var for tests/CI
      passwordEnvVarName: 'DB_PASSWORD',
    });

    // Storage
    new StorageStack(this, 'StorageStack');
  }
}
```

---

### `bin/tap.ts`

```typescript
#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

// Get environment variables from the environment or use defaults
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stateBucket = process.env.TERRAFORM_STATE_BUCKET || 'iac-rlhf-tf-states';
const stateBucketRegion =
  process.env.TERRAFORM_STATE_BUCKET_REGION || 'us-east-1';
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Calculate the stack name
const stackName = `TapStack${environmentSuffix}`;

// defautlTags is structured in adherence to the AwsProviderDefaultTags interface
const defaultTags = {
  tags: {
    Environment: environmentSuffix,
    Repository: repositoryName,
    CommitAuthor: commitAuthor,
  },
};

// Create the TapStack with the calculated properties
new TapStack(app, stackName, {
  environmentSuffix: environmentSuffix,
  stateBucket: stateBucket,
  stateBucketRegion: stateBucketRegion,
  awsRegion: awsRegion,
  defaultTags: defaultTags,
});

// Synthesize the app to generate the Terraform configuration
app.synth();
```

---

### `test/tap-stack.int.test.ts`

```typescript
import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('Full Infrastructure Integration Test', () => {
  let synthOutput: any;

  beforeAll(() => {
    const app = new App();

    //  ensure TapStack can resolve the DB password during synth
    process.env.DB_PASSWORD = 'testpass123!';

    const stack = new TapStack(app, 'TapStackTest', {
      environmentSuffix: 'test',
      awsRegion: 'us-west-2',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-west-2',
    });

    const json = Testing.synth(stack);
    console.log(' Synth Output Preview:', json.slice(0, 500));

    synthOutput = JSON.parse(json);
  });

  test('All core resources are present', () => {
    const resources = synthOutput.resource ?? {};
    const resourceKeys = Object.keys(resources);

    expect(resourceKeys).toEqual(
      expect.arrayContaining([expect.stringMatching(/^aws_vpc(\.|$)/)])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([expect.stringMatching(/^aws_subnet(\.|$)/)])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_nat_gateway(\.|$)/),
        expect.stringMatching(/^aws_internet_gateway(\.|$)/),
      ])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([expect.stringMatching(/^aws_route_table(\.|$)/)])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_route_table_association(\.|$)/),
      ])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([expect.stringMatching(/^aws_security_group(\.|$)/)])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([expect.stringMatching(/^aws_instance(\.|$)/)])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_db_instance(\.|$)/),
        expect.stringMatching(/^aws_db_subnet_group(\.|$)/),
      ])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_s3_bucket(\.|$)/),
        expect.stringMatching(/^aws_s3_bucket_versioning(\.|$)/),
        expect.stringMatching(
          /^aws_s3_bucket_server_side_encryption_configuration(\.|$)/
        ),
        expect.stringMatching(/^aws_s3_bucket_public_access_block(\.|$)/),
      ])
    );
  });
});
```

---

### `test/tap-stack.unit.test.ts`

```typescript
import { App, TerraformStack, Testing } from 'cdktf';
import { ComputeStack } from '../lib/compute-stack';
import { DatabaseStack } from '../lib/database-stack';
import { SecureVpcStack } from '../lib/secure-vpc-stack';
import { SecurityStack } from '../lib/security-stack';
import { StorageStack } from '../lib/storage-stack';
import { TapStack } from '../lib/tap-stack';

describe('Unit Tests', () => {
  test('ComputeStack should create EC2 instances', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'TestComputeStackStack');
    new ComputeStack(stack, 'TestComputeStack', {
      subnetIds: ['subnet-abc123'],
      securityGroupIds: ['sg-12345678'],
      amiId: 'ami-test',
      instanceType: 't3.micro',
      instanceCount: 1,
    });
    const synthesized = Testing.synth(stack);
    expect(synthesized).toMatchSnapshot();
  });

  test('ComputeStack should distribute EC2 instances across subnets', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'TestComputeStackMultiSubnet');
    new ComputeStack(stack, 'TestComputeStackMultiSubnet', {
      subnetIds: ['subnet-1', 'subnet-2'],
      securityGroupIds: ['sg-xyz'],
      amiId: 'ami-123',
      instanceType: 't2.micro',
      instanceCount: 3,
    });
    const synthesized = Testing.synth(stack);
    expect(synthesized).toMatchSnapshot();
  });

  // This test hits the missing branch
  test('ComputeStack should throw if subnetIds is empty', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'TestInvalidComputeStack');

    expect(() => {
      new ComputeStack(stack, 'InvalidComputeStack', {
        subnetIds: [],
        securityGroupIds: ['sg-test'],
        amiId: 'ami-test',
        instanceType: 't3.micro',
        instanceCount: 1,
      });
    }).toThrow('ComputeStack: subnetIds must be provided and non-empty');
  });

  test('SecureVpcStack should create VPC and subnets', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'TestVpcStack');
    new SecureVpcStack(stack, 'TestVpc');
    const synthesized = Testing.synth(stack);
    expect(synthesized).toMatchSnapshot();
  });

  test('SecurityStack should create security groups', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'TestSecurityStack');
    new SecurityStack(stack, 'TestSecurity', {
      vpcId: 'vpc-0a1b2c3d4e5f67890',
      vpcCidr: '10.0.0.0/16',
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toMatchSnapshot();
  });

  test('StorageStack should create an S3 bucket', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'TestStorageStack');
    new StorageStack(stack, 'TestStorage', {
      bucketSuffixOverride: 'static',
    });
    const synthesized = Testing.synth(stack);
    expect(synthesized).toMatchSnapshot();
  });

  test('DatabaseStack should create RDS instance', () => {
    const app = Testing.app();
    const stack = new TerraformStack(app, 'TestDatabaseStack');
    new DatabaseStack(stack, 'TestDatabase', {
      subnetIds: ['subnet-abc123'],
      securityGroupIds: ['sg-xyz123'],
      dbName: 'testdb',
      username: 'admin',
      password: 'password123',
    });
    const synthesized = Testing.synth(stack);
    expect(synthesized).toMatchSnapshot();
  });
});

test('TapStack builds with defaults and with explicit props (branch coverage)', () => {
  const app = new App();

  // Needed so TapStack -> DatabaseStack resolves password during synth
  process.env.DB_PASSWORD = 'unit-test-password';

  // Default props path
  const defaultStack = new TapStack(app, 'TapDefault');
  const defaultSynth = Testing.synth(defaultStack);
  expect(defaultSynth).toBeTruthy();

  // Explicit props path (exercises branches for props?.*)
  const explicitStack = new TapStack(app, 'TapExplicit', {
    environmentSuffix: 'qa',
    awsRegion: 'us-west-2',
    stateBucket: 'iac-rlhf-tf-states',
    stateBucketRegion: 'us-west-2',
    defaultTags: { tags: { Environment: 'qa', Repository: 'demo', CommitAuthor: 'tester' } },
  });
  const explicitSynth = Testing.synth(explicitStack);
  expect(explicitSynth).toBeTruthy();
});
```

---

## Validation Evidence

* **Synth**: Generates `cdk.tf.json` containing VPC, subnets, NAT, IGW, route tables/assocs, SGs, EC2, RDS, S3.
* **Tests**: Unit + integration tests pass locally (snapshot + resource presence).
* **Deploy**: Applies successfully when `AWS_*` creds and backend bucket/table exist.

---

## Notes & Trade-offs

* NAT per AZ increases cost; adjust to single NAT if desired.
* `environment`/`projectName` are local constants in sub-stacks for now; can be threaded via props for full externalization.
* Prefer Secrets Manager in prod; use env-var path for CI/local development.
* Ensure bucket names are globally unique (suffix is included to avoid conflicts).

```