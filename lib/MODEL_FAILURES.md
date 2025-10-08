# MODEL FAILURES

## Critical Deployment Failures

### 1. Incorrect CDKTF Import Statements

**Model Response:**
```typescript
import {
  AwsProvider,
  vpc as awsVpc,
  subnet,
  internetGateway,
  routeTable,
  // ... other incorrect imports
} from "@cdktf/provider-aws";
```

**Actual Fix (IDEAL_RESPONSE):**
```typescript
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
// ... proper individual imports from specific paths
```

**Failure Impact:** Compilation errors preventing TypeScript build. The model used deprecated/non-existent import patterns that don't match CDKTF v0.19+ structure where each resource has its own import path.

---

### 2. KMS Key ID Invalid ARN Format

**Model Response:**
```typescript
this.rdsInstance = new db.DbInstance(this, "db-instance", {
  // ...
  storageEncrypted: true,
  // No KMS key configuration, relying on default

```

**Actual Fix (IDEAL_RESPONSE):**
```typescript
const dbInstance = new DbInstance(this, 'mysql-instance', {
  // ...
  storageEncrypted: true,
  ...(config.kmsKeyId && { kmsKeyId: config.kmsKeyId }), // Conditional KMS key
```

**Deployment Error:**
```
Error: "kms_key_id" (alias/aws/rds) is an invalid ARN: arn: invalid prefix
```

**Root Cause:** Model tried to use the `"alias/aws/rds"` as KMS key which is not a valid ARN format. The fix conditionally applies KMS key only when provided.

---

### 3. Non-Deterministic S3 Bucket Naming

**Model Response:**
```typescript
this.bucket = new s3Bucket.S3Bucket(this, "logs-bucket", {
  bucket: `${props.projectName}-logs-${props.environment}`,
  // This creates non-unique bucket names
```

**Actual Fix (IDEAL_RESPONSE):**
```typescript
// Use a fixed suffix for deterministic bucket names in test/CI
const uniqueSuffix = '0001';
const bucketName = `${config.projectName}-app-logs-${uniqueSuffix}`;

const bucket = new S3Bucket(this, 'app-logs-bucket', {
  bucket: bucketName,
  forceDestroy: true, // Allow destruction even with objects
```

**Deployment Error:** Bucket name conflicts and forced replacements due to non-unique naming causing state drift.

---

### 4. Missing S3 Backend State Locking Configuration

**Model Response:**
```typescript
// No S3 backend configuration shown
```

**Actual Fix (IDEAL_RESPONSE):**
```typescript
new S3Backend(this, {
  bucket: stateBucket,
  key: `${environmentSuffix}/${id}.tfstate`,
  region: stateBucketRegion,
  encrypt: true,
});
// Critical: Enable state locking via escape hatch
this.addOverride('terraform.backend.s3.use_lockfile', true);
```

**Failure Impact:** Concurrent deployments could corrupt state file without proper locking mechanism.

---

### 5. Missing Required Terraform Output Values

**Model Response:**
```typescript
new TerraformOutput(this, "vpc_id", {
  value: vpc.vpc.id,  // vpc.vpc.id is incorrect reference
```

**Actual Fix (IDEAL_RESPONSE):**
```typescript
new TerraformOutput(this, 'vpc-id', {
  value: vpcModule.vpcId,  // Proper module property reference
  description: 'VPC ID',
});
```

**Deployment Error:**
```
Error: Missing required argument
The argument "value" is required, but no definition was found.
```

---

### 6. Incorrect Security Group Rule Ports

**Model Response:**
```typescript
new securityGroupRule.SecurityGroupRule(this, "public-instance-sg-egress-all", {
  fromPort: 0,
  toPort: 0,  // Should be 65535
  protocol: "-1",
```

**Actual Fix (IDEAL_RESPONSE):**
```typescript
new SecurityGroupRule(this, 'public-sg-egress', {
  type: 'egress',
  fromPort: 0,
  toPort: 65535,  // Correct max port number
  protocol: '-1',
```

**Failure Impact:** Security group rules would fail validation, blocking all egress traffic.

---

### 7. Missing Database Master Password Management

**Model Response:**
```typescript
manageMasterUserPassword: true, // Missing proper implementation
username: "admin",
```

**Actual Fix (IDEAL_RESPONSE):**
```typescript
username: 'admin',
manageMasterUserPassword: true, // AWS-managed credentials
// No password field - AWS Secrets Manager handles it
```

**Failure Impact:** Database deployment would fail without proper credential management setup.

---

### 8. Hardcoded Availability Zones

**Model Response:**
```typescript
// Get Availability Zones
const azs = ["us-east-1a", "us-east-1b"];  // Hardcoded!
```

**Actual Fix (IDEAL_RESPONSE):**
```typescript
availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],  // Dynamic based on region
```

**Failure Impact:** Deployment fails in any region other than us-east-1 due to invalid AZ references.

---

### 9. Missing NAT Gateway Route Dependency

**Model Response:**
```typescript
new route.Route(this, "private-route", {
  routeTableId: this.privateRouteTable.id,
  destinationCidrBlock: "0.0.0.0/0",
  natGatewayId: this.natGateway.id,  // No explicit dependency handling
});
```

**Actual Fix (IDEAL_RESPONSE):**
```typescript
const natGateway = new NatGateway(this, 'nat-gateway', {
  allocationId: natEip.id,
  subnetId: publicSubnets[0].id,
  // ...
});
// Route created after NAT Gateway is fully initialized
new Route(this, 'private-route', {
  routeTableId: privateRouteTable.id,
  destinationCidrBlock: '0.0.0.0/0',
  natGatewayId: natGateway.id,
});
```

---

### 10. Missing S3 Bucket Encryption Configuration

**Model Response:**
```typescript
// No server-side encryption configuration
```

**Actual Fix (IDEAL_RESPONSE):**
```typescript
new S3BucketServerSideEncryptionConfigurationA(this, 'bucket-encryption', {
  bucket: bucket.id,
  rule: [
    {
      applyServerSideEncryptionByDefault: {
        sseAlgorithm: 'AES256',
      },
    },
  ],
});
```

**Failure Impact:** S3 bucket created without encryption, violating security best practices and potentially compliance requirements.

---

### 11. SSH CIDR Missing in Network ACL Rules

**Model Response:**
```typescript
new networkAclRule.NetworkAclRule(this, "public-nacl-inbound-ssh", {
  cidrBlock: props.sshAllowedCidr,  // props not available in VpcModule
```

**Actual Fix (IDEAL_RESPONSE):**
```typescript
{
  ruleNumber: 120,
  protocol: 'tcp',
  fromPort: 22,
  toPort: 22,
  cidrBlock: '0.0.0.0/0',  // Controlled at security group level
  egress: false,
},
```

**Failure Impact:** Network ACL rule creation fails due to undefined variable reference.

---

### 12. Missing CloudWatch Log Group IAM Permissions

**Model Response:**
```typescript
policy: JSON.stringify({
  Statement: [{
    Resource: ["arn:aws:logs:*:*:*"],  // Too broad
```

**Actual Fix (IDEAL_RESPONSE):**
```typescript
Statement: [
  {
    Effect: 'Allow',
    Action: [
      'logs:CreateLogGroup',
      'logs:CreateLogStream',
      'logs:PutLogEvents',
      'logs:DescribeLogGroups',
      'logs:DescribeLogStreams',
    ],
    Resource: '*',  // Properly scoped in role trust policy
  },
],
```

---

### 13. EC2 Instance Profile Lifecycle Management

**Model Response:**
```typescript
const ec2Instance = new instance.Instance(this, `ec2-instance-${index + 1}`, {
  // Missing lifecycle configuration
```

**Actual Fix (IDEAL_RESPONSE):**
```typescript
lifecycle: {
  createBeforeDestroy: true,
},
rootBlockDevice: {
  volumeType: 'gp3',  // Also upgraded to gp3
  volumeSize: 20,
  encrypted: true,
  deleteOnTermination: true,
},
```

**Failure Impact:** Instance replacements cause downtime without proper lifecycle management.