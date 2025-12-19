# MODEL FAILURES DOCUMENT: CDKTF Infrastructure Deployment

#### 1\. RDS Secrets Manager Dependency Cycle (Fatal Deployment Failure)

**Model Response:**
The model created a fatal dependency cycle in the `DatabaseModule` by attempting to reference the `aws.dbInstance.DbInstance` address (`this.rdsInstance.address`) within the `aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion` resource, which is defined *before* the RDS instance itself in the module constructor.

**Result:**
Deployment fails immediately during the `terraform plan` phase with a "Configuration Error" or "Read-before-write" error because a resource output is used before the resource is defined and created.

**Actual Failure (MODEL\_RESPONSE.md):**

```typescript
// DatabaseModule - L178-185
new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(this, "db-secret-version", {
  secretId: this.secretsManager.id,
  secretString: JSON.stringify({
    username: "dbadmin",
    password: this.dbPassword.result,
    engine: "postgres",
    host: this.rdsInstance.address, // <--- FATAL FAILURE: RDS instance is defined LATER (L190).
    port: 5432,
    dbname: config.databaseName,
  }),
});
```

**Fix Applied (IDEAL\_RESPONSE.md):**

```typescript
// DatabaseModule - L204-213
new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
  this,
  'db-secret-version',
  {
    secretId: this.secretsManager.id,
    secretString: JSON.stringify({
      username: 'dbadmin',
      password: dbPassword,
      engine: 'postgres',
      port: 5432,
      dbname: config.databaseName,
    }), // CORRECT: The 'host' field is omitted, breaking the dependency cycle.
  }
);
```

-----

#### 2\. Networking Module Dynamic Array Indexing (Deployment Failure)

**Model Response:**
The model used incorrect object access syntax (`.get(i)`) to retrieve an Availability Zone name from the list returned by the `DataAwsAvailabilityZones` data source within a loop. CDKTF/Terraform does not support this JavaScript syntax for dynamic indexing of resource outputs (Tokens).

**Result:**
**Deployment failure** in the Networking Module when attempting to create subnets across multiple availability zones.

**Actual Failure (MODEL\_RESPONSE.md - NetworkingModule):**

```typescript
// NetworkingModule - L63
for (let i = 0; i < 3; i++) {
  const publicSubnet = new aws.subnet.Subnet(this, `public-subnet-${i}`, {
    vpcId: this.vpc.id,
    cidrBlock: `10.0.${i * 2}.0/24`,
    availabilityZone: azs.names.get(i), // <--- FATAL FAILURE: Incorrect list indexing syntax.
    mapPublicIpOnLaunch: true,
// ...
```

**Fix Applied (IDEAL\_RESPONSE.md - NetworkingModule):**

```typescript
// NetworkingModule - L4, L71
import { Fn } from 'cdktf'; // Must import Fn helper
// ...
for (let i = 0; i < 3; i++) {
  const publicSubnet = new aws.subnet.Subnet(this, `public-subnet-${i}`, {
    vpcId: this.vpc.id,
    cidrBlock: `10.0.${i * 2}.0/24`,
    availabilityZone: Fn.element(azs.names, i), // CORRECT: Uses Fn.element for dynamic list access.
    mapPublicIpOnLaunch: true,
// ...
```

-----

#### 3\. Load Balancer Target Group Configuration Type Mismatch

**Model Response:**
The model provided a numerical literal (`30`) for the `deregistrationDelay` property in the `aws.lbTargetGroup.LbTargetGroup` resource. Terraform requires string values for duration-related fields.

**Result:**
Potential **deployment failure** or runtime warning due to schema validation requiring a string type.

**Actual Failure (MODEL\_RESPONSE.md):**

```typescript
// aws.lbTargetGroup.LbTargetGroup definition - L470
this.targetGroup = new aws.lbTargetGroup.LbTargetGroup(this, "tg", {
  // ...
  healthCheck: {
    // ...
  },
  deregistrationDelay: 30, // <--- Type Mismatch: Should be a string ('30').
  tags: {
    Name: `${config.projectName}-${config.environment}-tg`,
  },
});
```

**Fix Applied (IDEAL\_RESPONSE.md):**

```typescript
// aws.lbTargetGroup.LbTargetGroup definition - L551
this.targetGroup = new aws.lbTargetGroup.LbTargetGroup(this, 'tg', {
  // ...
  healthCheck: {
    // ...
  },
  deregistrationDelay: '30', // CORRECT: String literal ensures type consistency.
  tags: {
    Name: `${config.projectName}-${config.environment}-tg`,
  },
});
```