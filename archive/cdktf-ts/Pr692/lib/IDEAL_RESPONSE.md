# IDEAL\_RESPONSE.md

**multi-environment AWS infrastructure** while honoring the original Terraform constraints: strict state separation, VPC with public/private/database subnets, modularization, least-privilege IAM, environment-aware EC2 + SGs, encrypted/versioned S3 with lifecycle, CloudWatch dashboards/alarms/logs, and consistent tagging.

This version uses **construct classes** (TypeScript) to keep things DRY and testable, and a single orchestrator stack (`TapStack`) to compose the modules per environment. It’s designed to work in local dev and CI without changing the code—just set env vars.

---

## What you get

* **Strict state isolation** using an S3 backend (keyed by `ENVIRONMENT`)
* **VPC**: 1 VPC per env, 3× public, 3× private, 3× database subnets, NAT strategy per env
* **IAM**: least-privilege roles and instance profile
* **EC2**: Amazon Linux 2 with CloudWatch agent and Apache, user data per env, env-aware SG
* **S3**: env bucket + access-logs bucket, **AES-256 SSE**, versioning, public access block, lifecycle (dev/staging)
* **CloudWatch**: dashboard, CPU + instance health alarms to SNS, log groups with retention
* **Tagging**: consistent `Environment`, `ManagedBy`, etc.
* **Tests**: fast **unit** and **integration** tests that parse `cdk.tf.json`
* **Safety**: unique name suffixing (CI SHA) to avoid collisions if state is missing

---

## Directory layout

```
.
├─ bin/
│  └─ tap.ts
├─ lib/
│  ├─ cloudwatch-construct.ts
│  ├─ ec2-construct.ts
│  ├─ iam-construct.ts
│  ├─ s3-construct.ts
│  ├─ tap-stack.ts
│  └─ vpc-construct.ts
├─ test/
│  ├─ tap-stack.unit.test.ts
│  └─ tap-stack.ts
├─ cdktf.json        # present in repo root (not repeated here)
├─ metadata.json     # present in repo root (not repeated here)
└─ README.md         # deployment guide (place at repo root)
```

> You already have `cdktf.json` and `metadata.json` in root—no need to change them.

---

## Prerequisites

* Node.js 18+ and npm
* Terraform CLI 1.5+ (recommended)
* AWS credentials configured (env vars or shared config)
* An **existing S3 bucket** for Terraform state (default: `iac-rlhf-tf-states`)
  Optionally an existing DynamoDB table for state locking.

---

## Environment variables

| Variable                        | Purpose                                              | Default                         |
| ------------------------------- | ---------------------------------------------------- | ------------------------------- |
| `AWS_REGION`                    | Deployment region                                    | `us-west-2`                     |
| `ENVIRONMENT`                   | `development` \| `staging` \| `production` \| custom | `development`                   |
| `ENVIRONMENT_SUFFIX`            | Suffix added to stack name, tags                     | `dev`                           |
| `TERRAFORM_STATE_BUCKET`        | S3 bucket for TF state                               | `iac-rlhf-tf-states`            |
| `TERRAFORM_STATE_BUCKET_REGION` | Region of state bucket                               | `us-east-1`                     |
| `ALLOWED_SSH_CIDRS`             | CSV list of SSH CIDRs; **required** for `production` | dev/staging default `0.0.0.0/0` |
| `EC2_KEY_NAME`                  | Optional EC2 key pair name                           | *(unset)*                       |
| `REPOSITORY`, `COMMIT_AUTHOR`   | Tagging metadata                                     | `unknown`                       |

**Production guard:** if `ENVIRONMENT=production`, you **must** set `ALLOWED_SSH_CIDRS` (e.g., `203.0.113.0/24`).

---

## Install, build, test, deploy

```bash
# install deps
npm install

# typecheck build
npm run build

# run unit tests
npm run test

# run integration tests (parse cdk.tf.json)
npm run test:integration-cdktf

# synth to cdk.tf.json
npx cdktf synth

# deploy via cdktf (standard CDKTF flow)
npx cdktf deploy

# or use raw terraform with the synthesized code
terraform init && terraform validate && terraform plan && terraform apply
```

> In CI, a short CI SHA is injected into resource names (via `TapStack`) to prevent collisions when state is empty or re-runs occur.

---

## Code

### `lib/cloudwatch-construct.ts`

```typescript
import * as aws from '@cdktf/provider-aws';
import { Construct } from 'constructs';

export interface CloudwatchConstructProps {
  environment: string;
  instanceId: string;
  commonTags: { [key: string]: string };
  logGroupName?: string; // <-- added so TapStack can inject unique name
}

export class CloudwatchConstruct extends Construct {
  public readonly dashboardUrl: string;
  public readonly snsTopicArn: string;

  constructor(scope: Construct, id: string, config: CloudwatchConstructProps) {
    super(scope, id);

    const topic = new aws.snsTopic.SnsTopic(this, 'AlertsTopic', {
      // CHANGED: add suffix-safe name to avoid collisions
      name: `${config.environment}-infrastructure-alerts-${id}`,
      tags: config.commonTags,
    });

    new aws.cloudwatchDashboard.CloudwatchDashboard(this, 'Dashboard', {
      // CHANGED: add suffix to dashboard name
      dashboardName: `${config.environment}-infrastructure-dashboard-${id}`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            x: 0,
            y: 0,
            width: 12,
            height: 6,
            properties: {
              metrics: [
                ['AWS/EC2', 'CPUUtilization', 'InstanceId', config.instanceId],
                ['.', 'NetworkIn', '.', '.'],
                ['.', 'NetworkOut', '.', '.'],
              ],
              view: 'timeSeries',
              stacked: false,
              region: 'us-west-2',
              title: 'EC2 Instance Metrics',
              period: 300,
            },
          },
        ],
      }),
    });

    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'HighCpuAlarm', {
      alarmName: `${config.environment}-high-cpu-utilization-${id}`, // CHANGED
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: config.environment === 'production' ? 80 : 90,
      alarmDescription: 'This metric monitors EC2 CPU utilization',
      alarmActions: [topic.arn],
      dimensions: {
        InstanceId: config.instanceId,
      },
      tags: config.commonTags,
    });

    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'InstanceHealthAlarm',
      {
        alarmName: `${config.environment}-instance-health-check-${id}`, // CHANGED
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'StatusCheckFailed',
        namespace: 'AWS/EC2',
        period: 300,
        statistic: 'Maximum',
        threshold: 0,
        alarmDescription: 'This metric monitors EC2 health check',
        alarmActions: [topic.arn],
        dimensions: {
          InstanceId: config.instanceId,
        },
        tags: config.commonTags,
      }
    );

    new aws.cloudwatchLogGroup.CloudwatchLogGroup(this, 'AppLogGroup', {
      // CHANGED: use unique log group name from props or fallback to env + id
      name:
        config.logGroupName || `/aws/application/${config.environment}-${id}`,
      retentionInDays: config.environment === 'production' ? 365 : 30,
      tags: config.commonTags,
    });

    // CHANGED: dashboard URL also needs the unique name
    this.dashboardUrl = `https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#dashboards:name=${config.environment}-infrastructure-dashboard-${id}`;
    this.snsTopicArn = topic.arn;
  }
}
```

---

### `lib/ec2-construct.ts`

```typescript
import * as aws from '@cdktf/provider-aws';
import { Fn } from 'cdktf';
import { Construct } from 'constructs';

export interface Ec2ConstructProps {
  environment: string;
  vpcId: string;
  subnetId: string;
  instanceType: string;
  keyName?: string;
  iamInstanceProfile: string;
  allowedCidrBlocks: string[];
  commonTags: { [key: string]: string };
  logGroupName?: string;
  resourceSuffix?: string; //  NEW: to ensure SG & EC2 uniqueness
}

export class Ec2Construct extends Construct {
  public readonly instanceId: string;
  public readonly privateIp: string;
  public readonly publicIp: string;
  public readonly securityGroupId: string;

  constructor(scope: Construct, id: string, config: Ec2ConstructProps) {
    super(scope, id);

    const suffix = config.resourceSuffix ? `-${config.resourceSuffix}` : '';

    const ami = new aws.dataAwsAmi.DataAwsAmi(this, 'AmazonLinuxAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    const sg = new aws.securityGroup.SecurityGroup(this, 'Ec2SG', {
      namePrefix: `${config.environment}-ec2-`,
      vpcId: config.vpcId,
      ingress: [
        // Always allow SSH from allowed CIDRs
        ...config.allowedCidrBlocks.map((cidr) => ({
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: [cidr],
        })),
        // HTTP/HTTPS rules vary per environment
        ...(config.environment === 'production'
          ? [
              {
                fromPort: 80,
                toPort: 80,
                protocol: 'tcp',
                cidrBlocks: config.allowedCidrBlocks, // restrictive
              },
              {
                fromPort: 443,
                toPort: 443,
                protocol: 'tcp',
                cidrBlocks: config.allowedCidrBlocks, // restrictive
              },
            ]
          : [
              {
                fromPort: 80,
                toPort: 80,
                protocol: 'tcp',
                cidrBlocks: ['0.0.0.0/0'], // dev/staging open
              },
              {
                fromPort: 443,
                toPort: 443,
                protocol: 'tcp',
                cidrBlocks: ['0.0.0.0/0'], // dev/staging open
              },
            ]),
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-ec2-sg${suffix}`,
      },
    });

    const ec2 = new aws.instance.Instance(this, 'WebServer', {
      ami: ami.id,
      instanceType: config.instanceType,
      subnetId: config.subnetId,
      vpcSecurityGroupIds: [sg.id],
      keyName: config.keyName || undefined,
      iamInstanceProfile: config.iamInstanceProfile,
      userData: Fn.base64encode(
        Fn.rawString(`#!/bin/bash
        yum update -y
        yum install -y amazon-cloudwatch-agent httpd
        systemctl start httpd
        systemctl enable httpd
        echo "<h1>${config.environment} server</h1>" > /var/www/html/index.html`)
      ),
      rootBlockDevice: {
        volumeType: 'gp3',
        volumeSize: config.environment === 'production' ? 20 : 10,
        deleteOnTermination: true,
        encrypted: true,
      },
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-web-server${suffix}`, //  CHANGED
        Type: 'WebServer',
      },
    });

    new aws.cloudwatchLogGroup.CloudwatchLogGroup(this, 'Ec2LogGroup', {
      name: config.logGroupName || `/aws/ec2/${config.environment}${suffix}`, //  CHANGED
      retentionInDays: config.environment === 'production' ? 365 : 30,
      tags: config.commonTags,
    });

    this.instanceId = ec2.id;
    this.privateIp = ec2.privateIp;
    this.publicIp = ec2.publicIp;
    this.securityGroupId = sg.id;
  }
}
```

---

### `lib/iam-construct.ts`

```typescript
import * as aws from '@cdktf/provider-aws';
import { Construct } from 'constructs';

export interface IamConstructProps {
  environment: string;
  commonTags: { [key: string]: string };
  roleNameSuffix?: string; // already here
}

export class IamConstruct extends Construct {
  public readonly ec2RoleArn: string;
  public readonly ec2ProfileName: string;
  public readonly s3ServiceRoleArn: string;
  public readonly cloudwatchRoleArn: string;

  constructor(scope: Construct, id: string, config: IamConstructProps) {
    super(scope, id);

    //  CHANGED: use suffix if provided, otherwise empty string
    const suffix = config.roleNameSuffix ? `-${config.roleNameSuffix}` : '';

    const ec2Role = new aws.iamRole.IamRole(this, 'Ec2Role', {
      name: `${config.environment}-ec2-role${suffix}`, //  CHANGED
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: config.commonTags,
    });

    const ec2Profile = new aws.iamInstanceProfile.IamInstanceProfile(
      this,
      'Ec2Profile',
      {
        name: `${config.environment}-ec2-profile${suffix}`, //   CHANGED
        role: ec2Role.name,
        tags: config.commonTags,
      }
    );

    new aws.iamRolePolicy.IamRolePolicy(this, 'Ec2Policy', {
      name: `${config.environment}-ec2-policy${suffix}`, //   CHANGED
      role: ec2Role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData',
              'ec2:DescribeVolumes',
              'ec2:DescribeTags',
              'logs:PutLogEvents',
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:DescribeLogStreams',
              'logs:DescribeLogGroups',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject'],
            Resource: `arn:aws:s3:::${config.environment}-*/*`,
          },
        ],
      }),
    });

    const s3ServiceRole = new aws.iamRole.IamRole(this, 'S3ServiceRole', {
      name: `${config.environment}-s3-service-role${suffix}`, //   CHANGED
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 's3.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: config.commonTags,
    });

    const cloudwatchRole = new aws.iamRole.IamRole(this, 'CloudWatchRole', {
      name: `${config.environment}-cloudwatch-role${suffix}`, //   CHANGED
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'logs.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: config.commonTags,
    });

    this.ec2RoleArn = ec2Role.arn;
    this.ec2ProfileName = ec2Profile.name;
    this.s3ServiceRoleArn = s3ServiceRole.arn;
    this.cloudwatchRoleArn = cloudwatchRole.arn;
  }
}
```

---

### `lib/s3-construct.ts`

```typescript
import * as aws from '@cdktf/provider-aws';
import { Construct } from 'constructs';

interface LifecycleRule {
  id: string;
  status: string;
  expiration: { days: number };
  noncurrent_version_expiration: { noncurrent_days: number };
}

export interface S3ConstructProps {
  environment: string;
  bucketName: string;
  enableVersioning?: boolean;
  lifecycleRules?: LifecycleRule[];
  commonTags: { [key: string]: string };
}

export class S3Construct extends Construct {
  public readonly bucketId: string;
  public readonly bucketArn: string;
  public readonly bucketDomainName: string;
  public readonly accessLogsBucketId: string;

  constructor(scope: Construct, id: string, config: S3ConstructProps) {
    super(scope, id);

    const mainBucket = new aws.s3Bucket.S3Bucket(this, 'MainBucket', {
      bucket: config.bucketName,
      tags: {
        ...config.commonTags,
        Name: config.bucketName,
        Type: 'Storage',
      },
    });

    new aws.s3BucketVersioning.S3BucketVersioningA(this, 'Versioning', {
      bucket: mainBucket.id,
      versioningConfiguration: {
        status: config.enableVersioning ? 'Enabled' : 'Disabled',
      },
    });

    new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      'Encryption',
      {
        bucket: mainBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      'PublicAccess',
      {
        bucket: mainBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    if (config.lifecycleRules && config.lifecycleRules.length > 0) {
      new aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(
        this,
        'Lifecycle',
        {
          bucket: mainBucket.id,
          rule: config.lifecycleRules.map((rule) => ({
            id: rule.id,
            status: rule.status,
            expiration: [{ days: rule.expiration.days }],
            noncurrentVersionExpiration: [
              {
                noncurrentDays:
                  rule.noncurrent_version_expiration.noncurrent_days,
              },
            ],
          })),
        }
      );
    }

    const accessLogBucket = new aws.s3Bucket.S3Bucket(
      this,
      'AccessLogsBucket',
      {
        bucket: `${config.bucketName}-access-logs`,
        tags: {
          ...config.commonTags,
          Name: `${config.bucketName}-access-logs`,
          Type: 'AccessLogs',
        },
      }
    );

    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      'AccessLogsPublicAccess',
      {
        bucket: accessLogBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      'AccessLogsEncryption',
      {
        bucket: accessLogBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    new aws.s3BucketLogging.S3BucketLoggingA(this, 'BucketLogging', {
      bucket: mainBucket.id,
      targetBucket: accessLogBucket.id,
      targetPrefix: 'access-logs/',
    });

    this.bucketId = mainBucket.id;
    this.bucketArn = mainBucket.arn;
    this.bucketDomainName = mainBucket.bucketDomainName;
    this.accessLogsBucketId = accessLogBucket.id;
  }
}
```

---

### `lib/vpc-construct.ts`

```typescript
import * as aws from '@cdktf/provider-aws';
import { Construct } from 'constructs';

export type NatMode = 'single' | 'per-az' | 'none';

export interface VpcConstructProps {
  environment: string;
  region: string;
  vpcCidr: string;
  azs: string[];
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  databaseSubnetCidrs: string[];
  commonTags: { [key: string]: string };
  /** Optional override. Defaults: production=per-az, others=single */
  natMode?: NatMode;
  resourceSuffix?: string;
}

export class VpcConstruct extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnets: string[];
  public readonly privateSubnets: string[];
  public readonly databaseSubnets: string[];
  public readonly internetGatewayId: string;
  public readonly natGatewayIds: string[];

  constructor(scope: Construct, id: string, config: VpcConstructProps) {
    super(scope, id);

    const suffix = config.resourceSuffix ? `-${config.resourceSuffix}` : '';

    new aws.dataAwsRegion.DataAwsRegion(this, 'current');

    const mainVpc = new aws.vpc.Vpc(this, 'MainVpc', {
      cidrBlock: config.vpcCidr,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { ...config.commonTags, Name: `${config.environment}-vpc` },
    });

    const igw = new aws.internetGateway.InternetGateway(this, 'IGW', {
      vpcId: mainVpc.id,
      tags: { ...config.commonTags, Name: `${config.environment}-igw` },
    });

    const publicSubnets = config.publicSubnetCidrs.map(
      (cidr, i) =>
        new aws.subnet.Subnet(this, `PublicSubnet${i}`, {
          vpcId: mainVpc.id,
          cidrBlock: cidr,
          availabilityZone: config.azs[i],
          mapPublicIpOnLaunch: true,
          tags: {
            ...config.commonTags,
            Name: `${config.environment}-public-subnet-${i + 1}`,
          },
        })
    );

    const privateSubnets = config.privateSubnetCidrs.map(
      (cidr, i) =>
        new aws.subnet.Subnet(this, `PrivateSubnet${i}`, {
          vpcId: mainVpc.id,
          cidrBlock: cidr,
          availabilityZone: config.azs[i],
          tags: {
            ...config.commonTags,
            Name: `${config.environment}-private-subnet-${i + 1}`,
          },
        })
    );

    const databaseSubnets = config.databaseSubnetCidrs.map(
      (cidr, i) =>
        new aws.subnet.Subnet(this, `DatabaseSubnet${i}`, {
          vpcId: mainVpc.id,
          cidrBlock: cidr,
          availabilityZone: config.azs[i],
          tags: {
            ...config.commonTags,
            Name: `${config.environment}-database-subnet-${i + 1}`,
          },
        })
    );

    // ── NAT strategy (quota-safe) ──────────────────────────────────────────────
    const natMode: NatMode =
      config.natMode ??
      (config.environment === 'production' ? 'per-az' : 'single');

    const natGatewayIds: string[] = [];

    if (natMode === 'single') {
      // One EIP + One NAT in first public subnet
      const eip = new aws.eip.Eip(this, 'NatEip0', {
        domain: 'vpc',
        tags: { ...config.commonTags, Name: `${config.environment}-nat-eip-1` },
      });

      const nat = new aws.natGateway.NatGateway(this, 'NatGateway0', {
        allocationId: eip.id,
        subnetId: publicSubnets[0].id,
        tags: {
          ...config.commonTags,
          Name: `${config.environment}-nat-gateway-1`,
        },
      });

      natGatewayIds.push(nat.id);
    } else if (natMode === 'per-az') {
      // One NAT per private subnet / AZ (will consume multiple EIPs)
      privateSubnets.forEach((_, i) => {
        const eip = new aws.eip.Eip(this, `NatEip${i}`, {
          domain: 'vpc',
          tags: {
            ...config.commonTags,
            Name: `${config.environment}-nat-eip-${i + 1}`,
          },
        });

        const nat = new aws.natGateway.NatGateway(this, `NatGateway${i}`, {
          allocationId: eip.id,
          subnetId: publicSubnets[i].id,
          tags: {
            ...config.commonTags,
            Name: `${config.environment}-nat-gateway-${i + 1}`,
          },
        });

        natGatewayIds.push(nat.id);
      });
    } else {
      // natMode === 'none' → no NAT/EIP
    }

    // ── Route tables ───────────────────────────────────────────────────────────
    // Public RT -> IGW
    const publicRt = new aws.routeTable.RouteTable(this, 'PublicRouteTable', {
      vpcId: mainVpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
      tags: { ...config.commonTags, Name: `${config.environment}-public-rt` },
    });

    publicSubnets.forEach((sub, i) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `PublicRTA${i}`,
        { routeTableId: publicRt.id, subnetId: sub.id }
      );
    });

    // Private RTs:
    if (natMode === 'per-az') {
      // One RT per private subnet to its NAT
      privateSubnets.forEach((sub, i) => {
        const rt = new aws.routeTable.RouteTable(
          this,
          `PrivateRouteTable${i}`,
          {
            vpcId: mainVpc.id,
            route: [
              { cidrBlock: '0.0.0.0/0', natGatewayId: natGatewayIds[i] ?? '' },
            ],
            tags: {
              ...config.commonTags,
              Name: `${config.environment}-private-rt-${i + 1}`,
            },
          }
        );

        new aws.routeTableAssociation.RouteTableAssociation(
          this,
          `PrivateRTA${i}`,
          { routeTableId: rt.id, subnetId: sub.id }
        );
      });
    } else if (natMode === 'single') {
      // One RT targeting the single NAT, associate to all private subnets
      const rt = new aws.routeTable.RouteTable(this, 'PrivateRouteTable', {
        vpcId: mainVpc.id,
        route:
          natGatewayIds.length > 0
            ? [{ cidrBlock: '0.0.0.0/0', natGatewayId: natGatewayIds[0] }]
            : [],
        tags: {
          ...config.commonTags,
          Name: `${config.environment}-private-rt`,
        },
      });

      privateSubnets.forEach((sub, i) => {
        new aws.routeTableAssociation.RouteTableAssociation(
          this,
          `PrivateRTA${i}`,
          { routeTableId: rt.id, subnetId: sub.id }
        );
      });
    } else {
      // natMode === 'none': create plain private RTs without 0.0.0.0/0
      privateSubnets.forEach((sub, i) => {
        const rt = new aws.routeTable.RouteTable(
          this,
          `PrivateRouteTable${i}`,
          {
            vpcId: mainVpc.id,
            tags: {
              ...config.commonTags,
              Name: `${config.environment}-private-rt-${i + 1}`,
            },
          }
        );
        new aws.routeTableAssociation.RouteTableAssociation(
          this,
          `PrivateRTA${i}`,
          { routeTableId: rt.id, subnetId: sub.id }
        );
      });
    }

    // ── VPC Flow Logs ──────────────────────────────────────────────────────────
    const flowLogGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'VpcFlowLogsGroup',
      {
        name: `/aws/vpc/${config.environment}-${id}-flow-logs${suffix}`,
        retentionInDays: config.environment === 'production' ? 365 : 30,
        tags: config.commonTags,
      }
    );

    const flowLogsRole = new aws.iamRole.IamRole(this, 'VpcFlowLogsRole', {
      name: `${config.environment}-${id}-vpc-flow-logs-role${suffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'vpc-flow-logs.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: config.commonTags,
    });

    new aws.iamRolePolicy.IamRolePolicy(this, 'VpcFlowLogsPolicy', {
      name: `${config.environment}-vpc-flow-logs-policy`,
      role: flowLogsRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    new aws.flowLog.FlowLog(this, 'VpcFlowLog', {
      logDestination: flowLogGroup.arn,
      iamRoleArn: flowLogsRole.arn,
      trafficType: 'ALL',
      vpcId: mainVpc.id,
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-vpc-flow-logs`,
      },
    } as aws.flowLog.FlowLogConfig);

    // Outputs
    this.vpcId = mainVpc.id;
    this.publicSubnets = publicSubnets.map((s) => s.id);
    this.privateSubnets = privateSubnets.map((s) => s.id);
    this.databaseSubnets = databaseSubnets.map((s) => s.id);
    this.internetGatewayId = igw.id;
    this.natGatewayIds = natGatewayIds;
  }
}
```

---

### `lib/tap-stack.ts`

```typescript
import * as aws from '@cdktf/provider-aws';
import { Fn, S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { CloudwatchConstruct } from './cloudwatch-construct';
import { Ec2Construct } from './ec2-construct';
import { IamConstruct } from './iam-construct';
import { S3Construct } from './s3-construct';
import { VpcConstruct } from './vpc-construct';

export interface TapStackProps {
  environmentSuffix?: string;
  awsRegion?: string;
  // keep these so bin/tap.ts compiles and we can persist state
  stateBucket?: string;
  stateBucketRegion?: string;
  defaultTags?: {
    tags: {
      Environment?: string;
      Owner?: string;
      Service?: string;
      Repository?: string;
      CommitAuthor?: string;
    };
  };
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, name: string, props?: TapStackProps) {
    super(scope, name);

    const region = process.env.AWS_REGION || props?.awsRegion || 'us-west-2';

    // ── 1) Persist Terraform state in S3 so future runs reuse it ───────────────
    const stateBucket =
      props?.stateBucket ||
      process.env.TERRAFORM_STATE_BUCKET ||
      'iac-rlhf-tf-states';
    const stateBucketRegion =
      props?.stateBucketRegion ||
      process.env.TERRAFORM_STATE_BUCKET_REGION ||
      region;

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${process.env.ENVIRONMENT || props?.environmentSuffix || 'development'}/${name}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
      // dynamodbTable: process.env.TERRAFORM_STATE_LOCK_TABLE, // optional
    });

    new aws.provider.AwsProvider(this, 'aws', { region });

    const environment =
      process.env.ENVIRONMENT || props?.environmentSuffix || 'development';

    // Allowed SSH CIDRs (comma-separated). Prod requires explicit restrictive list.
    const sshCidrsEnv = (process.env.ALLOWED_SSH_CIDRS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const allowedSshCidrs =
      environment === 'production'
        ? sshCidrsEnv.length
          ? sshCidrsEnv
          : (() => {
              throw new Error(
                'In production, set ALLOWED_SSH_CIDRS with restrictive CIDRs for SSH (e.g., 203.0.113.0/24)'
              );
            })()
        : sshCidrsEnv.length
          ? sshCidrsEnv
          : ['0.0.0.0/0'];

    // ── 2) Per-commit suffix: avoids "already exists" if last run had no state ─
    const ciSha =
      (process.env.GITHUB_SHA ||
        process.env.CI_COMMIT_SHA ||
        process.env.COMMIT_SHA ||
        '') + '';
    const ciSuffix = ciSha ? ciSha.substring(0, 6) : '';

    // Fallback to deterministic hash if no CI SHA is available
    const uniqueSuffix = ciSuffix || Fn.substr(Fn.sha1(name), 0, 6);

    const commonTags = {
      Environment: environment,
      Owner: 'team-infra',
      Service: 'core',
      ManagedBy: 'Terraform',
      ...props?.defaultTags?.tags,
    };

    const azs = [`${region}a`, `${region}b`, `${region}c`];

    const vpc = new VpcConstruct(this, `Vpc-${uniqueSuffix}`, {
      environment,
      region,
      vpcCidr: '10.0.0.0/16',
      azs,
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
      privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'],
      databaseSubnetCidrs: ['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24'],
      commonTags,
      resourceSuffix: uniqueSuffix,
    });

    const iam = new IamConstruct(this, `Iam-${uniqueSuffix}`, {
      environment,
      roleNameSuffix: uniqueSuffix as unknown as string, // CDKTF tokens are fine
      commonTags,
    });

    const ec2 = new Ec2Construct(this, `Ec2-${uniqueSuffix}`, {
      environment,
      vpcId: vpc.vpcId,
      subnetId: vpc.publicSubnets[0],
      instanceType: 't3.micro',
      keyName: process.env.EC2_KEY_NAME || '',
      iamInstanceProfile: iam.ec2ProfileName,
      allowedCidrBlocks: allowedSshCidrs,
      logGroupName: `/aws/ec2/${environment}-${uniqueSuffix}`,
      resourceSuffix: uniqueSuffix as unknown as string,
      commonTags,
    });

    const s3 = new S3Construct(this, `S3-${uniqueSuffix}`, {
      environment,
      // S3 bucket names must be globally unique; include suffix
      bucketName: `${environment}-assets-${uniqueSuffix}`,
      enableVersioning: true,
      lifecycleRules:
        environment === 'production'
          ? []
          : [
              {
                id: 'expire-old-objects',
                status: 'Enabled',
                expiration: { days: 14 }, // tightened from 30
                noncurrent_version_expiration: { noncurrent_days: 7 }, // tightened from 15
              },
            ],
      commonTags,
    });

    new CloudwatchConstruct(this, `Cloudwatch-${uniqueSuffix}`, {
      environment,
      instanceId: ec2.instanceId,
      logGroupName: `/aws/application/${environment}-${uniqueSuffix}`,
      commonTags,
    });

    // ── Integration test expects these outputs ──────────────────────────────────
    new TerraformOutput(this, 'vpc_id', { value: vpc.vpcId });
    new TerraformOutput(this, 'public_subnet_ids', {
      value: vpc.publicSubnets,
    });
    new TerraformOutput(this, 'private_subnet_ids', {
      value: vpc.privateSubnets,
    });
    new TerraformOutput(this, 'database_subnet_ids', {
      value: vpc.databaseSubnets,
    });
    new TerraformOutput(this, 'internet_gateway_id', {
      value: vpc.internetGatewayId,
    });
    new TerraformOutput(this, 'nat_gateway_ids', { value: vpc.natGatewayIds });

    // use strong types (no `any`)
    new TerraformOutput(this, 'bucket_id', { value: s3.bucketId });
    new TerraformOutput(this, 'bucket_arn', { value: s3.bucketArn });
    new TerraformOutput(this, 'bucket_domain_name', {
      value: s3.bucketDomainName,
    });
    new TerraformOutput(this, 'access_logs_bucket_id', {
      value: s3.accessLogsBucketId,
    });

    // still useful for other checks
    new TerraformOutput(this, 'instance_id', { value: ec2.instanceId });
  }
}
```

---

### `test/tap-stack.ts` (integration-style)

```typescript
import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

/**
 * Helpers to parse the actual cdk.tf.json emitted by CDKTF synth.
 * Using a parser keeps this stable across CDKTF versions.
 */
function parseSynth(stack: any): any {
  const out = Testing.synth(stack);
  const jsonStr = Array.isArray(out) ? out[0] : out;
  return JSON.parse(jsonStr);
}

type ResourceBlock = Record<string, Record<string, any>>;

function resourceMap(parsed: any): ResourceBlock {
  return (parsed && parsed.resource) || {};
}

function listResourcesOfType(res: ResourceBlock, type: string): Record<string, any> {
  return res[type] || {};
}

function countOfType(res: ResourceBlock, type: string): number {
  return Object.keys(res[type] || {}).length;
}

describe('TapStack End-to-End Infrastructure Tests', () => {
  let app: App;
  let stack: TapStack;
  let parsed: any;
  let res: ResourceBlock;
  let outputs: Record<string, { value: unknown }>;
  const ENV = 'staging'; // pick non-prod to avoid prod-only guards

  beforeAll(() => {
    // Make SSH CIDRs deterministic for tests (and not 0.0.0.0/0)
    process.env.ALLOWED_SSH_CIDRS = '203.0.113.0/24';
    process.env.ENVIRONMENT = ENV;
    process.env.AWS_REGION = 'us-west-2';

    app = new App();
    stack = new TapStack(app, 'IntegrationTestStack');
    parsed = parseSynth(stack);
    res = resourceMap(parsed);

    // Normalize outputs for both local & CI shapes
    outputs = parsed.output || parsed.outputs || {};
  });

  afterAll(() => {
    // clean up env for any other tests
    delete process.env.ALLOWED_SSH_CIDRS;
    delete process.env.ENVIRONMENT;
    delete process.env.AWS_REGION;
  });

  // ---- Keep your existing output-based assertions (stable and valuable) ----
  test('Synth contains all key outputs from VPC and S3', () => {
    const outputKeys = Object.keys(outputs);
    expect(outputKeys).toEqual(
      expect.arrayContaining([
        'vpc_id',
        'public_subnet_ids',
        'private_subnet_ids',
        'database_subnet_ids',
        'internet_gateway_id',
        'nat_gateway_ids',
        'bucket_id',
        'bucket_arn',
        'bucket_domain_name',
        'access_logs_bucket_id',
        'instance_id',
      ])
    );
  });

  test('VPC ID output is a Terraform reference or token string', () => {
      const vpcId = outputs['vpc_id']?.value;
      expect(typeof vpcId === 'string' || typeof vpcId === 'object').toBeTruthy();
    });

  test('S3 bucket domain name output is present (token or literal)', () => {
    const raw = outputs['bucket_domain_name']?.value;
    const str = String(raw ?? '');

    // Accept Terraform tokens like ${aws_s3_bucket...} OR a resolved literal containing amazonaws.com.
    const looksLikeToken = /^\$\{.*\}$/.test(str);
    const looksLikeLiteral = str.includes('amazonaws.com');

    expect(looksLikeToken || looksLikeLiteral).toBe(true);
  });

  // ------------------------- E2E-style assertions ----------------------------

  test('All taggable resources include the Environment tag', () => {
    // Check a representative set of taggable resource types we create
    const taggableTypes = [
      'aws_vpc',
      'aws_subnet',
      'aws_internet_gateway',
      'aws_eip',
      'aws_nat_gateway',
      'aws_iam_role',
      'aws_iam_instance_profile',
      'aws_instance',
      'aws_security_group',
      'aws_s3_bucket',
      'aws_cloudwatch_dashboard',
      'aws_cloudwatch_metric_alarm',
      'aws_cloudwatch_log_group',
      'aws_sns_topic',
    ];

    for (const type of taggableTypes) {
      const instances = listResourcesOfType(res, type);
      for (const [, cfg] of Object.entries(instances)) {
        // Many AWS resources expose 'tags' (string map). Some dashboards/alarms also support tags.
        if (cfg && typeof cfg === 'object' && 'tags' in cfg) {
          const tags = (cfg as any)['tags'] || {};
          expect(tags).toBeDefined();
          expect(tags['Environment']).toBe(ENV);
        }
      }
    }
  });

  test('EC2 Security Group allows SSH from the configured CIDR', () => {
    const sgs = listResourcesOfType(res, 'aws_security_group');
    const sgList = Object.values(sgs);
    expect(sgList.length).toBeGreaterThan(0);

    const hasSshIngress = sgList.some((sg: any) => {
      const ingress = sg.ingress || [];
      return ingress.some(
        (rule: any) =>
          rule.from_port === 22 &&
          rule.to_port === 22 &&
          rule.protocol === 'tcp' &&
          Array.isArray(rule.cidr_blocks) &&
          rule.cidr_blocks.includes('203.0.113.0/24')
      );
    });

    expect(hasSshIngress).toBe(true);
  });

  test('S3 bucket enforces encryption and public access blocking', () => {
    // Encryption
    const enc = listResourcesOfType(
      res,
      'aws_s3_bucket_server_side_encryption_configuration'
    );
    const encCfgs = Object.values(enc);
    expect(encCfgs.length).toBeGreaterThan(0);

    const usesAES256 = encCfgs.some((c: any) => {
      const rules = c.rule || [];
      return rules.some(
        (r: any) =>
          r.apply_server_side_encryption_by_default &&
          r.apply_server_side_encryption_by_default.sse_algorithm === 'AES256'
      );
    });
    expect(usesAES256).toBe(true);

    // Public Access Block for main and access-logs buckets
    const pab = listResourcesOfType(res, 'aws_s3_bucket_public_access_block');
    const pabs = Object.values(pab);
    expect(pabs.length).toBeGreaterThan(0);

    const allBlockFlagsTrue = pabs.every((b: any) => {
      return (
        b.block_public_acls === true &&
        b.block_public_policy === true &&
        b.ignore_public_acls === true &&
        b.restrict_public_buckets === true
      );
    });
    expect(allBlockFlagsTrue).toBe(true);
  });

  test('Public + Private + Database subnets are created (total 9)', () => {
    // VpcConstruct creates 3 public, 3 private, 3 database = 9
    const subnetCount = countOfType(res, 'aws_subnet');
    expect(subnetCount).toBe(9);
  });
});
```

---

### `test/tap-stack.unit.test.ts` (unit-style)

```typescript
import { App, Testing } from "cdktf";
import { TapStack } from "../lib/tap-stack";

/**
 * Parse the actual cdk.tf.json string emitted by CDKTF synth.
 * Works across CDKTF versions and avoids flaky fullSynth shapes.
 */
function parseSynth(stack: any): any {
  const out = Testing.synth(stack);
  const jsonStr = Array.isArray(out) ? out[0] : out;
  return JSON.parse(jsonStr);
}

function resourceMap(parsed: any): Record<string, Record<string, any>> {
  return (parsed && parsed.resource) || {};
}

function flattenTypes(resBlock: Record<string, Record<string, any>>): string[] {
  const types: string[] = [];
  Object.entries(resBlock).forEach(([type, instances]) => {
    if (instances && typeof instances === "object") {
      Object.keys(instances).forEach(() => types.push(type));
    }
  });
  return types;
}

function hasType(types: string[], needle: string): boolean {
  return types.some((t) => t.includes(needle));
}

describe("TapStack (unit)", () => {
  afterEach(() => {
    // clean env between tests so branches execute as intended
    delete process.env.AWS_REGION;
    delete process.env.ENVIRONMENT;
    delete process.env.ENVIRONMENT_SUFFIX;
    delete process.env.ALLOWED_SSH_CIDRS; // <-- ensure we don't leak this across tests
  });

  it("synthesizes and contains core resources (dev path)", () => {
    process.env.AWS_REGION = "us-west-2";
    process.env.ENVIRONMENT = "dev";
    process.env.ENVIRONMENT_SUFFIX = "devtest";
    // optional: set a safe CIDR to keep behavior consistent
    process.env.ALLOWED_SSH_CIDRS = "203.0.113.0/24";

    const app = new App();
    const stack = new TapStack(app, "TestStackDev");
    const parsed = parseSynth(stack);
    const res = resourceMap(parsed);
    const types = flattenTypes(res);

    expect(types.length).toBeGreaterThan(0);

    // minimal, stable checks
    expect(hasType(types, "aws_vpc")).toBeTruthy();
    expect(types.filter((t) => t.includes("aws_subnet")).length).toBeGreaterThanOrEqual(3);

    expect(hasType(types, "aws_iam_role")).toBeTruthy();
    expect(hasType(types, "aws_iam_instance_profile")).toBeTruthy();

    expect(hasType(types, "aws_instance")).toBeTruthy();
    expect(hasType(types, "aws_security_group")).toBeTruthy();

    expect(hasType(types, "aws_s3_bucket")).toBeTruthy();
    expect(hasType(types, "aws_s3_bucket_server_side_encryption_configuration")).toBeTruthy();

    expect(hasType(types, "aws_cloudwatch_dashboard")).toBeTruthy();
    expect(hasType(types, "aws_cloudwatch_metric_alarm")).toBeTruthy();
    expect(hasType(types, "aws_cloudwatch_log_group")).toBeTruthy();
    expect(hasType(types, "aws_sns_topic")).toBeTruthy();
  });

  it("synthesizes and contains core resources (production path)", () => {
    process.env.AWS_REGION = "us-west-2";
    process.env.ENVIRONMENT = "production";
    process.env.ENVIRONMENT_SUFFIX = "prodtest";

    //   REQUIRED by TapStack for production: provide restrictive SSH CIDR(s)
    process.env.ALLOWED_SSH_CIDRS = "203.0.113.0/24";

    const app = new App();
    const stack = new TapStack(app, "TestStackProd");
    const parsed = parseSynth(stack);
    const res = resourceMap(parsed);
    const types = flattenTypes(res);

    expect(types.length).toBeGreaterThan(0);

    // same minimal checks as dev
    expect(hasType(types, "aws_vpc")).toBeTruthy();
    expect(types.filter((t) => t.includes("aws_subnet")).length).toBeGreaterThanOrEqual(3);

    expect(hasType(types, "aws_iam_role")).toBeTruthy();
    expect(hasType(types, "aws_iam_instance_profile")).toBeTruthy();

    expect(hasType(types, "aws_instance")).toBeTruthy();
    expect(hasType(types, "aws_security_group")).toBeTruthy();

    expect(hasType(types, "aws_s3_bucket")).toBeTruthy();
    expect(hasType(types, "aws_s3_bucket_server_side_encryption_configuration")).toBeTruthy();

    expect(hasType(types, "aws_cloudwatch_dashboard")).toBeTruthy();
    expect(hasType(types, "aws_cloudwatch_metric_alarm")).toBeTruthy();
    expect(hasType(types, "aws_cloudwatch_log_group")).toBeTruthy();
    expect(hasType(types, "aws_sns_topic")).toBeTruthy();
  });

  it("synthesizes with defaults when no env vars are set (default branch path)", () => {
    // intentionally leave AWS_REGION / ENVIRONMENT / ENVIRONMENT_SUFFIX undefined
    const app = new App();
    const stack = new TapStack(app, "TestStackDefault");
    const parsed = parseSynth(stack);
    const res = resourceMap(parsed);
    const types = flattenTypes(res);

    expect(types.length).toBeGreaterThan(0);

    // minimal checks to assert resources exist on the default path
    expect(hasType(types, "aws_vpc")).toBeTruthy();
    expect(types.filter((t) => t.includes("aws_subnet")).length).toBeGreaterThanOrEqual(3);

    // a couple of core services to keep it stable
    expect(hasType(types, "aws_iam_role")).toBeTruthy();
    expect(hasType(types, "aws_s3_bucket")).toBeTruthy();
    expect(hasType(types, "aws_cloudwatch_log_group")).toBeTruthy();
  });

  it("synthesizes for a non-standard env (staging) to hit else branches", () => {
    process.env.AWS_REGION = "us-east-1";
    process.env.ENVIRONMENT = "staging"; // exercise non-dev/non-production branch
    process.env.ENVIRONMENT_SUFFIX = "stagetest";
    process.env.ALLOWED_SSH_CIDRS = "203.0.113.0/24"; // keep consistent

    const app = new App();
    const stack = new TapStack(app, "TestStackStaging");
    const parsed = parseSynth(stack);
    const res = resourceMap(parsed);
    const types = flattenTypes(res);

    expect(types.length).toBeGreaterThan(0);

    // same minimal existence checks
    expect(hasType(types, "aws_vpc")).toBeTruthy();
    expect(types.filter((t) => t.includes("aws_subnet")).length).toBeGreaterThanOrEqual(3);

    expect(hasType(types, "aws_iam_role")).toBeTruthy();
    expect(hasType(types, "aws_iam_instance_profile")).toBeTruthy();

    expect(hasType(types, "aws_instance")).toBeTruthy();
    expect(hasType(types, "aws_security_group")).toBeTruthy();

    expect(hasType(types, "aws_s3_bucket")).toBeTruthy();
    expect(hasType(types, "aws_cloudwatch_dashboard")).toBeTruthy();
  });
});
```

---

### `bin/tap.ts`

```typescript
#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

// env + defaults
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stateBucket = process.env.TERRAFORM_STATE_BUCKET || 'iac-rlhf-tf-states';
const stateBucketRegion =
  process.env.TERRAFORM_STATE_BUCKET_REGION || 'us-east-1';
const awsRegion = process.env.AWS_REGION || 'us-west-2';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// stack name
const stackName = `TapStack${environmentSuffix}`;

// default tags (matches TapStackProps.defaultTags shape)
const defaultTags = {
  tags: {
    Environment: environmentSuffix,
    Repository: repositoryName,
    CommitAuthor: commitAuthor,
  },
};

// create stack
new TapStack(app, stackName, {
  environmentSuffix,
  awsRegion,
  stateBucket,
  stateBucketRegion,
  defaultTags,
});

// synth
app.synth();
```

---

## How this maps to the original constraints

* **State separation**: S3 backend key includes `ENVIRONMENT`, ensuring no leakage.
* **VPC**: 1 VPC per env; 3× public/private/database subnets; **NAT** is `per-az` for prod, `single` elsewhere; route tables wired correctly.
* **Modularization**: VPC / IAM / EC2 / S3 / CloudWatch implemented as **constructs** and composed in `TapStack`.
* **IAM**: minimal policies for EC2 & logs/S3 usage; independent per env (names prefixed by env + suffix).
* **EC2**: env-specific SG rules (prod restrictive), user data sets up CloudWatch + Apache; instance profile attached.
* **Security Groups**: SSH sourced from `ALLOWED_SSH_CIDRS`; HTTP/HTTPS open in non-prod but restrictive in prod.
* **S3**: env bucket + access-logs bucket; **AES-256 SSE**, versioning; lifecycle for **dev/staging**; public access block on both.
* **Logging/Monitoring**: EC2 and VPC flow logs → CloudWatch; dashboard + CPU/health alarms + SNS topic; log retention based on env.
* **Tagging**: Every resource attaches `Environment` and other tags via `commonTags`.
* **Validation**: Tests parse the synthesized Terraform JSON to verify structure, tags, encryption, and outputs. No hardcoded resource IDs.

---

## Deploy tips

* Make sure the **state bucket** exists and your AWS creds can read/write it.
* For **production**, set `ALLOWED_SSH_CIDRS` to locked-down ranges:

  ```bash
  export ENVIRONMENT=production
  export ALLOWED_SSH_CIDRS="203.0.113.0/24,198.51.100.0/24"
  ```
* To keep names unique when state isn’t present (e.g., preview runs), we suffix with the first 6 chars of `GITHUB_SHA`/`CI_COMMIT_SHA`. Locally, we fall back to a deterministic hash of the stack name.

---
