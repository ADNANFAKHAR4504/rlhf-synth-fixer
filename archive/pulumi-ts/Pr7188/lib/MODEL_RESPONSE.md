# Model Response: Secure Secrets Vault with Automated Rotation

This document contains the initial code generation output (with known bugs).

## File: lib/index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "./tap-stack";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

const stack = new TapStack("tap-stack", { environmentSuffix });

export const secretArn = stack.secretArn;
export const vpcId = stack.vpcId;
export const clusterEndpoint = stack.clusterEndpoint;
```

## File: lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface TapStackArgs {
  environmentSuffix: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly secretArn: pulumi.Output<string>;
  public readonly vpcId: pulumi.Output<string>;
  public readonly clusterEndpoint: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:resource:TapStack", name, {}, opts);

    const { environmentSuffix } = args;

    const tags = {
      Environment: environmentSuffix,
      CostCenter: "security-operations",
      Compliance: "required",
    };

    const current = aws.getCallerIdentityOutput({});
    const accountId = current.accountId;
    const region = aws.getRegionOutput({}).name;

    // BUG #1: KMS key policy missing CloudWatch Logs service principal
    const logsKmsKey = new aws.kms.Key(
      `logs-kms-key-${environmentSuffix}`,
      {
        description: `KMS key for CloudWatch Logs encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        policy: pulumi.interpolate`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${accountId}:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    }
  ]
}`,
        tags,
      },
      { parent: this }
    );

    // VPC and networking...
    const vpc = new aws.ec2.Vpc(
      `vpc-${environmentSuffix}`,
      {
        cidrBlock: "10.0.0.0/16",
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...tags, Name: `vpc-${environmentSuffix}` },
      },
      { parent: this }
    );

    const azs = aws.getAvailabilityZonesOutput({ state: "available" });

    const privateSubnets = [0, 1].map((i) => {
      return new aws.ec2.Subnet(
        `private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 1}.0/24`,
          availabilityZone: azs.names.apply((names) => names[i]),
          tags: { ...tags, Name: `private-subnet-${i}-${environmentSuffix}` },
        },
        { parent: this }
      );
    });

    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: privateSubnets.map((s) => s.id),
        tags: { ...tags, Name: `db-subnet-group-${environmentSuffix}` },
      },
      { parent: this }
    );

    // BUG #2: Using incompatible instance class db.t3.small
    const dbCluster = new aws.rds.Cluster(
      `aurora-cluster-${environmentSuffix}`,
      {
        engine: "aurora-mysql",
        engineVersion: "8.0.mysql_aurora.3.04.0",
        databaseName: "secretsdb",
        masterUsername: "admin",
        masterPassword: pulumi.secret("ChangeMe123!"),
        dbSubnetGroupName: dbSubnetGroup.name,
        storageEncrypted: true,
        skipFinalSnapshot: true,
        tags: { ...tags, Name: `aurora-cluster-${environmentSuffix}` },
      },
      { parent: this }
    );

    const dbInstance = new aws.rds.ClusterInstance(
      `aurora-instance-${environmentSuffix}`,
      {
        clusterIdentifier: dbCluster.id,
        instanceClass: "db.t3.small", // BUG: Incompatible with Aurora MySQL 8.0
        engine: "aurora-mysql",
        engineVersion: "8.0.mysql_aurora.3.04.0",
        publiclyAccessible: false,
        tags: { ...tags, Name: `aurora-instance-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Outputs
    this.secretArn = pulumi.output("arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret");
    this.vpcId = vpc.id;
    this.clusterEndpoint = dbCluster.endpoint;

    this.registerOutputs({
      secretArn: this.secretArn,
      vpcId: this.vpcId,
      clusterEndpoint: this.clusterEndpoint,
    });
  }
}
```

## File: Pulumi.yaml

```yaml
name: tap
runtime: nodejs
description: Secure secrets vault with automated rotation using Pulumi TypeScript
config:
  aws:region: us-east-1
```

## Known Issues in This Response

1. **KMS Key Policy Incomplete**: The CloudWatch Logs KMS key policy is missing the service principal for `logs.{region}.amazonaws.com` and lacks the encryption context condition. This will cause deployment failure when creating encrypted log groups.

2. **Wrong Aurora Instance Class**: Using `db.t3.small` which is NOT compatible with Aurora MySQL engine version 8.0.mysql_aurora.3.04.0. Must use `db.t3.medium` or larger.

These bugs are documented in MODEL_FAILURES.md and fixed in IDEAL_RESPONSE.md.
