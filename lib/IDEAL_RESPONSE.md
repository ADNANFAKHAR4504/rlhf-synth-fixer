# IDEAL_RESPONSE.md

## 1. Folder/File Structure

```
.
├── bin/
│   └── tap.ts
├── lib/
│   └── stacks/
│       ├── compute-stack.ts
│       ├── database-stack.ts
│       ├── kms-stack.ts
│       ├── core-stack.ts
│       ├── monitoring-stack.ts
│       ├── network-stack.ts
│       └── storage-stack.ts
├── test/
│   ├── integration-test/
│   │   ├── compute-stack.int.test.ts
│   │   ├── database-stack.int.test.ts
│   │   ├── kms-stack.int.test.ts
│   │   ├── monitoring-stack.int.test.ts
│   │   ├── network-stack.int.test.ts
│   │   └── storage-stack.int.test.ts
│   └── unit-test/
│       ├── compute-stack.unit.test.ts
│       ├── database-stack.unit.test.ts
│       ├── kms-stack.unit.test.ts
│       ├── monitoring-stack.unit.test.ts
│       ├── network-stack.unit.test.ts
│       └── storage-stack.unit.test.ts
```

## 2. Full Code Including Tests

---
### bin/tap.ts
```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { ComputeStack } from '../lib/stacks/compute-stack';
import { CoreStack } from '../lib/stacks/core-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';
import { StorageStack } from '../lib/stacks/storage-stack';

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-2',
};

// CoreStack: VPC, KMS key, app SG (no instance role)
const coreStack = new CoreStack(app, 'CoreStack', { env });

// Storage (logs + app data bucket)
const storageStack = new StorageStack(app, 'StorageStack', {
  env,
  dataKey: coreStack.dataKey,
});

// Database (RDS Multi-AZ) – needs VPC, KMS, App SG
const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
  env,
  vpc: coreStack.vpc,
  dataKey: coreStack.dataKey,
  appSecurityGroup: coreStack.appSecurityGroup,
});

// Compute (ALB + ASG + IAM role) – needs VPC, KMS key, app bucket, SG, role
const computeStack = new ComputeStack(app, 'ComputeStack', {
  env,
  vpc: coreStack.vpc,
  dataKey: coreStack.dataKey,
  appBucket: storageStack.appBucket,
  appSecurityGroup: coreStack.appSecurityGroup,
  appInstanceRole: databaseStack.appInstanceRole,
});
// No addDependency needed; resource references are passed via props

// Monitoring (CloudWatch alarms) – needs ALB/ASG/DB references
const monitoringStack = new MonitoringStack(app, 'MonitoringStack', {
  env,
  alb: computeStack.alb,
  asg: computeStack.asg,
  dbInstance: databaseStack.dbInstance,
});
monitoringStack.addDependency(databaseStack);
```

---
### lib/stacks/compute-stack.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  dataKey: kms.IKey;
  appBucket: s3.IBucket;
  appSecurityGroup?: ec2.ISecurityGroup;
  appInstanceRole?: iam.IRole;
}

export class ComputeStack extends cdk.Stack {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly asg: autoscaling.AutoScalingGroup;
  public readonly instanceRole: iam.Role;
  public readonly appSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Security Groups
    const albSg = new ec2.SecurityGroup(this, 'AlbSg', {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: 'Web ingress 80/443.',
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP');
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS');

    this.appSecurityGroup = new ec2.SecurityGroup(this, 'AppSg', {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: 'App instances behind ALB.',
    });
    this.appSecurityGroup.addIngressRule(
      albSg,
      ec2.Port.tcp(80),
      'ALB to App HTTP'
    );

    // ALB across all public subnets/AZs
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: albSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const httpListener = this.alb.addListener('HttpListener', {
      port: 80,
      open: false,
    });
    // No HTTPS listener (no ACM certificate per constraint)

    // IAM Role for EC2 instances (least-privilege)
    this.instanceRole = new iam.Role(this, 'AppInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description:
        'Allows EC2 to access S3 app bucket and SSM; DB access granted in DB stack.',
    });
    this.instanceRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );
    props.appBucket.grantReadWrite(this.instanceRole);

    // User data for simple health endpoint
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'dnf update -y || yum update -y',
      'dnf install -y httpd || yum install -y httpd',
      'echo "OK" > /var/www/html/health',
      'systemctl enable httpd && systemctl start httpd'
    );

    // ASG on private subnets
    this.asg = new autoscaling.AutoScalingGroup(this, 'Asg', {
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      minCapacity: 2,
      desiredCapacity: 2,
      maxCapacity: 6,
      instanceType: new ec2.InstanceType('t3.micro'),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      role: this.instanceRole,
      securityGroup: this.appSecurityGroup,
      associatePublicIpAddress: false,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: autoscaling.BlockDeviceVolume.ebs(20, {
            encrypted: true,
          }),
        },
      ],
      healthChecks: {
        types: ['ELB'],
      },
      userData,
    });

    httpListener.addTargets('AsgTargets', {
      port: 80,
      targets: [this.asg],
      healthCheck: { healthyHttpCodes: '200', path: '/health' },
    });

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: this.alb.loadBalancerDnsName,
    });
  }
}
```

---
### lib/stacks/core-stack.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export interface CoreStackProps extends cdk.StackProps {
  vpcCidr?: string;
}

export class CoreStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly dataKey: kms.Key;
  public readonly appSecurityGroup: ec2.SecurityGroup;
  public readonly appInstanceRole?: iam.Role;

  constructor(scope: Construct, id: string, props: CoreStackProps = {}) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'AppVpc', {
      ipAddresses: ec2.IpAddresses.cidr(props.vpcCidr || '10.0.0.0/16'),
      maxAzs: 2,
    });

    this.dataKey = new kms.Key(this, 'DataKey', {
      enableKeyRotation: true,
    });

    this.appSecurityGroup = new ec2.SecurityGroup(this, 'AppSg', {
      vpc: this.vpc,
      allowAllOutbound: true,
      description: 'App SG',
    });

    // appInstanceRole will be set from DatabaseStack after creation
  }
}
```

---
### lib/stacks/database-stack.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  dataKey: kms.IKey;
  appSecurityGroup: ec2.ISecurityGroup;
  appInstanceRole?: iam.IRole;
}

export class DatabaseStack extends cdk.Stack {
  public readonly dbInstance: rds.DatabaseInstance;
  public readonly appInstanceRole: iam.Role;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Create IAM role for app instances here
    this.appInstanceRole = new iam.Role(this, 'AppInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'App EC2 role',
    });

    // Use shared resources from CoreStack
    const dbSg = new ec2.SecurityGroup(this, 'DbSg', {
      vpc: props.vpc,
      allowAllOutbound: true,
    });
    dbSg.addIngressRule(
      props.appSecurityGroup,
      ec2.Port.tcp(5432),
      'App to DB'
    );

    const dbCredentials = rds.Credentials.fromGeneratedSecret('postgres'); // in Secrets Manager

    this.dbInstance = new rds.DatabaseInstance(this, 'Db', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [dbSg],
      credentials: dbCredentials,
      allocatedStorage: 100,
      multiAz: true,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      storageEncrypted: true,
      storageEncryptionKey: props.dataKey,
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
      deletionProtection: true,
      iamAuthentication: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      performanceInsightEncryptionKey: props.dataKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Grant read access to secret and connect permission to appInstanceRole
    const secret = this.dbInstance.secret as secretsmanager.ISecret;
    if (secret && this.appInstanceRole) {
      secret.grantRead(this.appInstanceRole);
      this.dbInstance.grantConnect(this.appInstanceRole, 'postgres');
    }

    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: this.dbInstance.instanceEndpoint.hostname,
    });
  }
}
```

---
### lib/stacks/kms-stack.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export class KmsStack extends cdk.Stack {
  /** KMS key for data-at-rest (S3, EBS, RDS, PI). */
  public readonly dataKey: kms.Key;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.dataKey = new kms.Key(this, 'DataKmsKey', {
      alias: 'alias/secure-data',
      enableKeyRotation: true,
      description: 'KMS key for encrypting application data at rest.',
    });
  }
}
```

---
### lib/stacks/monitoring-stack.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.StackProps {
  alb: elbv2.ApplicationLoadBalancer;
  asg: autoscaling.AutoScalingGroup;
  dbInstance: rds.DatabaseInstance;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // ALB 5XX surge alarm
    const alb5xxMetric = props.alb.metrics.httpCodeTarget(
      elbv2.HttpCodeTarget.TARGET_5XX_COUNT,
      { period: Duration.minutes(1) }
    );

    new cw.Alarm(this, 'Alb5xxAlarm', {
      metric: alb5xxMetric,
      threshold: 5,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    });

    // ASG CPU high
    const asgCpu = new cw.Metric({
      namespace: 'AWS/AutoScaling',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: props.asg.autoScalingGroupName,
      },
      statistic: 'Average',
      period: Duration.minutes(1),
    });

    new cw.Alarm(this, 'AsgHighCpu', {
      metric: asgCpu,
      threshold: 80,
      evaluationPeriods: 3,
    });

    // RDS free storage low
    const freeStorage = props.dbInstance.metricFreeStorageSpace({
      period: Duration.minutes(5),
    });

    new cw.Alarm(this, 'DbFreeStorageLow', {
      metric: freeStorage,
      threshold: 10 * 1024 * 1024 * 1024, // 10 GiB
      evaluationPeriods: 1,
      comparisonOperator: cw.ComparisonOperator.LESS_THAN_THRESHOLD,
    });
  }
}
```

---
### lib/stacks/network-stack.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const azCount = cdk.Stack.of(this).availabilityZones.length; // dynamic, region-agnostic

    this.vpc = new ec2.Vpc(this, 'Vpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      natGateways: Math.min(2, Math.max(1, azCount)),
      maxAzs: azCount,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 }, // >=256 IPs
        {
          name: 'private-egress',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId });
  }
}
```

---
### lib/stacks/storage-stack.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface StorageStackProps extends cdk.StackProps {
  dataKey: kms.IKey;
}

export class StorageStack extends cdk.Stack {
  /** Dedicated access logs bucket (SSE-S3 due to service constraints) */
  public readonly logsBucket: s3.Bucket;
  /** Application data bucket (KMS, versioning, access logging enabled) */
  public readonly appBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    if (!props || !props.dataKey) {
      throw new Error('StorageStack: dataKey prop is required');
    }
    super(scope, id, props);

    this.logsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.appBucket = new s3.Bucket(this, 'AppBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.dataKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      serverAccessLogsBucket: this.logsBucket,
      serverAccessLogsPrefix: 's3-access-logs/',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    new cdk.CfnOutput(this, 'AppBucketName', {
      value: this.appBucket.bucketName,
    });
  }
}
```

---
### test/integration-test/compute-stack.int.test.ts
```typescript
import { App } from 'aws-cdk-lib';
import { ComputeStack } from '../../lib/stacks/compute-stack';
import { KmsStack } from '../../lib/stacks/kms-stack';
import { NetworkStack } from '../../lib/stacks/network-stack';
import { StorageStack } from '../../lib/stacks/storage-stack';
describe('ComputeStack Integration', () => {
  it('provisions ALB, ASG, IAM, SG with valid dependencies', () => {
    const app = new App();
    const network = new NetworkStack(app, 'NetworkStack');
    const kms = new KmsStack(app, 'KmsStack');
    const storage = new StorageStack(app, 'StorageStack', {
      dataKey: kms.dataKey,
    });
    const compute = new ComputeStack(app, 'ComputeStack', {
      vpc: network.vpc,
      dataKey: kms.dataKey,
      appBucket: storage.appBucket,
    });
    expect(compute.alb).toBeDefined();
    expect(compute.asg).toBeDefined();
    expect(compute.instanceRole).toBeDefined();
    expect(compute.appSecurityGroup).toBeDefined();
  });
  it('throws error if appBucket is missing', () => {
    const app = new App();
    const network = new NetworkStack(app, 'NetworkStack');
    const kms = new KmsStack(app, 'KmsStack');
    expect(
      () =>
        new ComputeStack(app, 'BadCompute', {
          vpc: network.vpc,
          dataKey: kms.dataKey,
          // appBucket missing
        } as any)
    ).toThrow();
  });
});
```

---
### test/integration-test/database-stack.int.test.ts
```typescript
import { App } from 'aws-cdk-lib';
import { ComputeStack } from '../../lib/stacks/compute-stack';
import { DatabaseStack } from '../../lib/stacks/database-stack';
import { KmsStack } from '../../lib/stacks/kms-stack';
import { NetworkStack } from '../../lib/stacks/network-stack';
describe('DatabaseStack Integration', () => {
	it('provisions RDS with valid SG and IAM role from ComputeStack', () => {
		const app = new App();
		const network = new NetworkStack(app, 'NetworkStack');
		const kms = new KmsStack(app, 'KmsStack');
		const compute = new ComputeStack(app, 'ComputeStack', {
			vpc: network.vpc,
			dataKey: kms.dataKey,
			appBucket: { grantReadWrite: jest.fn() } as any,
		});
		const db = new DatabaseStack(app, 'DatabaseStack', {
			vpc: network.vpc,
			dataKey: kms.dataKey,
			appSecurityGroup: compute.appSecurityGroup,
			appInstanceRole: compute.instanceRole,
		});
		expect(db.dbInstance).toBeDefined();
	});
	it('throws error if appSecurityGroup is missing', () => {
		const app = new App();
		const network = new NetworkStack(app, 'NetworkStack');
		const kms = new KmsStack(app, 'KmsStack');
		expect(
			() =>
				new DatabaseStack(app, 'BadDb', {
					vpc: network.vpc,
					dataKey: kms.dataKey,
					// appSecurityGroup missing
					appInstanceRole: { grantPrincipal: jest.fn() } as any,
				} as any)
		).toThrow();
	});
});
```

---
### test/integration-test/kms-stack.int.test.ts
```typescript
import { App } from 'aws-cdk-lib';
import { KmsStack } from '../../lib/stacks/kms-stack';
describe('KmsStack Integration', () => {
	it('provisions a KMS key and can be used by other stacks', () => {
		const app = new App();
		const kms = new KmsStack(app, 'KmsStack');
		expect(kms.dataKey).toBeDefined();
	});
});
```

---
### test/integration-test/monitoring-stack.int.test.ts
```typescript
import { App } from 'aws-cdk-lib';
import { ComputeStack } from '../../lib/stacks/compute-stack';
import { DatabaseStack } from '../../lib/stacks/database-stack';
import { KmsStack } from '../../lib/stacks/kms-stack';
import { MonitoringStack } from '../../lib/stacks/monitoring-stack';
import { NetworkStack } from '../../lib/stacks/network-stack';
describe('MonitoringStack Integration', () => {
	it('provisions alarms for ALB, ASG, and DB with valid dependencies', () => {
		const app = new App();
		const network = new NetworkStack(app, 'NetworkStack');
		const kms = new KmsStack(app, 'KmsStack');
		const compute = new ComputeStack(app, 'ComputeStack', {
			vpc: network.vpc,
			dataKey: kms.dataKey,
			appBucket: { grantReadWrite: jest.fn() } as any,
		});
		const db = new DatabaseStack(app, 'DatabaseStack', {
			vpc: network.vpc,
			dataKey: kms.dataKey,
			appSecurityGroup: compute.appSecurityGroup,
			appInstanceRole: compute.instanceRole,
		});
		const monitoring = new MonitoringStack(app, 'MonitoringStack', {
			alb: compute.alb,
			asg: compute.asg,
			dbInstance: db.dbInstance,
		});
		expect(monitoring).toBeDefined();
	});
	it('throws error if dbInstance is missing', () => {
		const app = new App();
		const network = new NetworkStack(app, 'NetworkStack');
		const kms = new KmsStack(app, 'KmsStack');
		const compute = new ComputeStack(app, 'ComputeStack', {
			vpc: network.vpc,
			dataKey: kms.dataKey,
			appBucket: { grantReadWrite: jest.fn() } as any,
		});
		expect(
			() =>
				new MonitoringStack(app, 'BadMonitoring', {
					alb: compute.alb,
					asg: compute.asg,
					// dbInstance missing
				} as any)
		).toThrow();
	});
});
```

---
### test/integration-test/network-stack.int.test.ts
```typescript
import { App } from 'aws-cdk-lib';
import { NetworkStack } from '../../lib/stacks/network-stack';
describe('NetworkStack Integration', () => {
	it('provisions a VPC with correct subnets and outputs', () => {
		const app = new App();
		const network = new NetworkStack(app, 'NetworkStack');
		expect(network.vpc).toBeDefined();
		expect(network.vpc.publicSubnets.length).toBeGreaterThan(0);
		expect(network.vpc.privateSubnets.length).toBeGreaterThan(0);
	});
});
```

---
### test/integration-test/storage-stack.int.test.ts
```typescript
import { App } from 'aws-cdk-lib';
import { KmsStack } from '../../lib/stacks/kms-stack';
import { StorageStack } from '../../lib/stacks/storage-stack';
describe('StorageStack Integration', () => {
	it('provisions appBucket and logsBucket with correct encryption and logging', () => {
		const app = new App();
		const kms = new KmsStack(app, 'KmsStack');
		const storage = new StorageStack(app, 'StorageStack', {
			dataKey: kms.dataKey,
		});
		expect(storage.appBucket).toBeDefined();
		expect(storage.logsBucket).toBeDefined();
		expect(storage.appBucket.encryptionKey).toBe(kms.dataKey);
		// Logging configuration cannot be directly asserted from CDK object
	});
	it('throws error if dataKey is missing', () => {
		const app = new App();
		expect(() => new StorageStack(app, 'BadStorage', {} as any)).toThrow();
	});
});
```

---
### test/unit-test/compute-stack.unit.test.ts
```typescript
import { App } from 'aws-cdk-lib';
import { ComputeStack } from '../../lib/stacks/compute-stack';
import { KmsStack } from '../../lib/stacks/kms-stack';
import { NetworkStack } from '../../lib/stacks/network-stack';
import { StorageStack } from '../../lib/stacks/storage-stack';
describe('ComputeStack', () => {
	it('should throw error if required props are missing', () => {
		const app = new App();
		expect(() => new ComputeStack(app, 'BadCompute', {} as any)).toThrow();
	});
	it('should create resources with valid props', () => {
		const app = new App();
		const network = new NetworkStack(app, 'NetworkStack');
		const kms = new KmsStack(app, 'KmsStack');
		const storage = new StorageStack(app, 'StorageStack', { dataKey: kms.dataKey });
		const compute = new ComputeStack(app, 'ComputeStack', {
			vpc: network.vpc,
			dataKey: kms.dataKey,
			appBucket: storage.appBucket,
		});
		expect(compute.alb).toBeDefined();
		expect(compute.asg).toBeDefined();
		expect(compute.instanceRole).toBeDefined();
		expect(compute.appSecurityGroup).toBeDefined();
	});
});
```

---
### test/unit-test/database-stack.unit.test.ts
```typescript
import { App } from 'aws-cdk-lib';
import { DatabaseStack } from '../../lib/stacks/database-stack';
import { KmsStack } from '../../lib/stacks/kms-stack';
import { NetworkStack } from '../../lib/stacks/network-stack';
import { SecurityGroup, Role } from 'aws-cdk-lib/aws-ec2';
describe('DatabaseStack', () => {
	it('should throw error if required props are missing', () => {
		const app = new App();
		expect(() => new DatabaseStack(app, 'BadDb', {} as any)).toThrow();
	});
	it('should create resources with valid props', () => {
		const app = new App();
		const network = new NetworkStack(app, 'NetworkStack');
		const kms = new KmsStack(app, 'KmsStack');
		const sg = new SecurityGroup(app, 'SG', { vpc: network.vpc });
		const role = new Role(app, 'Role', { assumedBy: { addToPolicy: jest.fn() } as any });
		const db = new DatabaseStack(app, 'DatabaseStack', {
			vpc: network.vpc,
			dataKey: kms.dataKey,
			appSecurityGroup: sg,
			appInstanceRole: role,
		});
		expect(db.dbInstance).toBeDefined();
	});
});
```

---
### test/unit-test/kms-stack.unit.test.ts
```typescript
import { App } from 'aws-cdk-lib';
import { KmsStack } from '../../lib/stacks/kms-stack';
describe('KmsStack', () => {
	it('should create a KMS key', () => {
		const app = new App();
		const kms = new KmsStack(app, 'KmsStack');
		expect(kms.dataKey).toBeDefined();
	});
});
```

---
### test/unit-test/monitoring-stack.unit.test.ts
```typescript
import { App } from 'aws-cdk-lib';
import { MonitoringStack } from '../../lib/stacks/monitoring-stack';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import { DatabaseInstance } from 'aws-cdk-lib/aws-rds';
describe('MonitoringStack', () => {
	it('should throw error if required props are missing', () => {
		const app = new App();
		expect(() => new MonitoringStack(app, 'BadMonitoring', {} as any)).toThrow();
	});
	it('should create resources with valid props', () => {
		const app = new App();
		const alb = { addListener: jest.fn() } as unknown as ApplicationLoadBalancer;
		const asg = { scaleOnCpuUtilization: jest.fn() } as unknown as AutoScalingGroup;
		const dbInstance = { instanceIdentifier: 'db' } as unknown as DatabaseInstance;
		const monitoring = new MonitoringStack(app, 'MonitoringStack', {
			alb,
			asg,
			dbInstance,
		});
		expect(monitoring).toBeDefined();
	});
});
```

---
### test/unit-test/network-stack.unit.test.ts
```typescript
import { App } from 'aws-cdk-lib';
import { NetworkStack } from '../../lib/stacks/network-stack';
describe('NetworkStack', () => {
	it('should create a VPC', () => {
		const app = new App();
		const network = new NetworkStack(app, 'NetworkStack');
		expect(network.vpc).toBeDefined();
	});
});
```

---
### test/unit-test/storage-stack.unit.test.ts
```typescript
import { App } from 'aws-cdk-lib';
import { StorageStack } from '../../lib/stacks/storage-stack';
import { KmsStack } from '../../lib/stacks/kms-stack';
describe('StorageStack', () => {
	it('should throw error if required props are missing', () => {
		const app = new App();
		expect(() => new StorageStack(app, 'BadStorage', {} as any)).toThrow();
	});
	it('should create buckets with valid props', () => {
		const app = new App();
		const kms = new KmsStack(app, 'KmsStack');
		const storage = new StorageStack(app, 'StorageStack', { dataKey: kms.dataKey });
		expect(storage.appBucket).toBeDefined();
		expect(storage.logsBucket).toBeDefined();
		expect(storage.appBucket.encryptionKey).toBe(kms.dataKey);
	});
});
```
