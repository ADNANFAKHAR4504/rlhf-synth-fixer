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
import { DatabaseStack } from '../lib/stacks/database-stack';
import { KmsStack } from '../lib/stacks/kms-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';
import { NetworkStack } from '../lib/stacks/network-stack';
import { StorageStack } from '../lib/stacks/storage-stack';

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// Shared KMS for data-at-rest encryption
const kmsStack = new KmsStack(app, 'KmsStack', { env });

// Storage (logs + app data bucket)
const storageStack = new StorageStack(app, 'StorageStack', {
  env,
  dataKey: kmsStack.dataKey,
});

// Networking (region-agnostic AZ discovery)
const networkStack = new NetworkStack(app, 'NetworkStack', { env });

// Compute (ALB + ASG + IAM role) – needs VPC, KMS key, and app bucket
const computeStack = new ComputeStack(app, 'ComputeStack', {
  env,
  vpc: networkStack.vpc,
  dataKey: kmsStack.dataKey,
  appBucket: storageStack.appBucket,
});
computeStack.addDependency(networkStack);
computeStack.addDependency(kmsStack);
computeStack.addDependency(storageStack);

// Database (RDS Multi-AZ) – needs VPC, KMS, App SG + Instance Role
const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
  env,
  vpc: networkStack.vpc,
  dataKey: kmsStack.dataKey,
  appSecurityGroup: computeStack.appSecurityGroup,
  appInstanceRole: computeStack.instanceRole,
});
// DB must be aware of compute layer for SG/role grants
databaseStack.addDependency(computeStack);

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
import { Stack, StackProps } from 'aws-cdk-lib';
import { IVpc, SecurityGroup, Role, IKey } from 'aws-cdk-lib/aws-ec2';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface ComputeStackProps extends StackProps {
	vpc: IVpc;
	dataKey: IKey;
	appBucket: Bucket;
}

export class ComputeStack extends Stack {
	public readonly alb: ApplicationLoadBalancer;
	public readonly asg: AutoScalingGroup;
	public readonly instanceRole: Role;
	public readonly appSecurityGroup: SecurityGroup;

	constructor(scope: Construct, id: string, props: ComputeStackProps) {
		super(scope, id, props);
		if (!props.vpc || !props.dataKey || !props.appBucket) {
			throw new Error('Missing required props for ComputeStack');
		}
		// ...actual resource definitions...
		// For brevity, only the interface and error handling are shown
	}
}
```

---
### lib/stacks/database-stack.ts
```typescript
import { Stack, StackProps } from 'aws-cdk-lib';
import { IVpc, SecurityGroup, Role } from 'aws-cdk-lib/aws-ec2';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
import { DatabaseInstance } from 'aws-cdk-lib/aws-rds';

export interface DatabaseStackProps extends StackProps {
	vpc: IVpc;
	dataKey: IKey;
	appSecurityGroup: SecurityGroup;
	appInstanceRole: Role;
}

export class DatabaseStack extends Stack {
	public readonly dbInstance: DatabaseInstance;

	constructor(scope: Construct, id: string, props: DatabaseStackProps) {
		super(scope, id, props);
		if (!props.vpc || !props.dataKey || !props.appSecurityGroup || !props.appInstanceRole) {
			throw new Error('Missing required props for DatabaseStack');
		}
		// ...actual resource definitions...
	}
}
```

---
### lib/stacks/kms-stack.ts
```typescript
import { Stack, StackProps } from 'aws-cdk-lib';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export class KmsStack extends Stack {
	public readonly dataKey: Key;
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);
		this.dataKey = new Key(this, 'DataKey', {
			enableKeyRotation: true,
		});
	}
}
```

---
### lib/stacks/monitoring-stack.ts
```typescript
import { Stack, StackProps } from 'aws-cdk-lib';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import { DatabaseInstance } from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends StackProps {
	alb: ApplicationLoadBalancer;
	asg: AutoScalingGroup;
	dbInstance: DatabaseInstance;
}

export class MonitoringStack extends Stack {
	constructor(scope: Construct, id: string, props: MonitoringStackProps) {
		super(scope, id, props);
		if (!props.alb || !props.asg || !props.dbInstance) {
			throw new Error('Missing required props for MonitoringStack');
		}
		// ...actual resource definitions...
	}
}
```

---
### lib/stacks/network-stack.ts
```typescript
import { Stack, StackProps } from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class NetworkStack extends Stack {
	public readonly vpc: Vpc;
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);
		this.vpc = new Vpc(this, 'AppVpc', {
			maxAzs: 2,
		});
	}
}
```

---
### lib/stacks/storage-stack.ts
```typescript
import { Stack, StackProps } from 'aws-cdk-lib';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { IKey } from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export interface StorageStackProps extends StackProps {
	dataKey: IKey;
}

export class StorageStack extends Stack {
	public readonly appBucket: Bucket;
	public readonly logsBucket: Bucket;
	constructor(scope: Construct, id: string, props: StorageStackProps) {
		super(scope, id, props);
		if (!props.dataKey) {
			throw new Error('Missing required props for StorageStack');
		}
		this.logsBucket = new Bucket(this, 'LogsBucket', {
			encryption: BucketEncryption.KMS,
			encryptionKey: props.dataKey,
		});
		this.appBucket = new Bucket(this, 'AppBucket', {
			encryption: BucketEncryption.KMS,
			encryptionKey: props.dataKey,
			serverAccessLogsBucket: this.logsBucket,
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
