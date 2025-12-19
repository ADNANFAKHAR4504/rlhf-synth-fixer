# MODEL FAILURES

## Critical Deployment-Breaking Issues

### 1. **Security Group Circular Dependency**

**Model Response (BROKEN):**
```typescript
// In SecurityGroupsConstruct constructor
this.ec2SecurityGroup = new aws.securityGroup.SecurityGroup(
  this,
  "ec2-sg",
  {
    ingress: [
      {
        fromPort: 3000,
        toPort: 3000,
        protocol: "tcp",
        securityGroups: [this.albSecurityGroup.id], // ❌ Circular dependency!
        description: "Node.js app from ALB",
      },
    ],
    // ...
  }
);
```

**Why it breaks deployment:**
Creates a circular dependency where `ec2SecurityGroup` references `albSecurityGroup.id` in its constructor, but both are being created simultaneously. Terraform cannot resolve the dependency order, causing deployment failure: `Error: Cycle: aws_security_group.ec2-sg, aws_security_group.alb-sg`

**Actual Implementation (FIXED):**
```typescript
// Create security groups WITHOUT inline ingress rules
this.appSecurityGroup = new aws.securityGroup.SecurityGroup(
  this,
  'app-sg',
  {
    name: `${config.projectName}-app-sg-${config.environment}`,
    description: 'Security group for application servers',
    vpcId: config.vpcId,
    egress: [/* ... */],
    tags: {/* ... */},
  }
);

// Add ingress rules AFTER creation using separate SecurityGroupRule resources
new aws.securityGroupRule.SecurityGroupRule(this, 'app-from-alb', {
  type: 'ingress',
  securityGroupId: this.appSecurityGroup.id,
  protocol: 'tcp',
  fromPort: 3000,
  toPort: 3000,
  sourceSecurityGroupId: this.albSecurityGroup.id, // ✅ No circular dependency
  description: 'Allow traffic from ALB',
});
```

---

### 2. **RDS Secret Version Created Before Database Instance**

**Model Response (BROKEN):**
```typescript
// In RDSConstruct
this.dbSecretVersion = new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
  this,
  "db-secret-version",
  {
    secretId: this.dbSecret.id,
    secretString: Fn.jsonencode({
      username: "dbadmin",
      password: dbPassword.randomPassword,
      engine: "postgres",
      host: Token.asString(Fn.lookup(this.dbInstance, "address", "")), // ❌ Instance doesn't exist yet!
      port: 5432,
      dbname: config.dbName,
    }),
  }
);

// Create RDS instance AFTER trying to reference its address
this.dbInstance = new aws.dbInstance.DbInstance(this, "db", {
  // ...
});
```

**Why it breaks deployment:**
The secret version tries to reference `this.dbInstance.address` before the database instance is created, resulting in: `Error: Reference to undeclared resource: The resource "aws_db_instance.db" has not been declared in the root module.`

**Actual Implementation (FIXED):**
```typescript
// Create RDS instance FIRST
this.dbInstance = new aws.dbInstance.DbInstance(this, 'db', {
  identifier: `${config.projectName}-db-${config.environment}`,
  engine: 'postgres',
  // ... all configuration
});

// Now create secret version AFTER database exists
this.dbSecretVersion = new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
  this,
  'db-secret-version',
  {
    secretId: this.dbSecret.id,
    secretString: Fn.jsonencode({
      username: 'dbadmin',
      password: password.randomPassword,
      engine: 'postgres',
      host: this.dbInstance.address, // ✅ Instance exists now
      port: 5432,
      dbname: config.dbName,
    }),
  }
);
```

---

### 3. **Incorrect AWS Resource Class Names**

**Model Response (BROKEN):**
```typescript
// Using non-existent class names
this.internetGateway = new aws.ec2.InternetGateway(this, "igw", { // ❌ Wrong namespace
  vpcId: this.vpc.id,
  // ...
});

const eip = new aws.ec2.Eip(this, `nat-eip-${index}`, { // ❌ Wrong class
  domain: "vpc",
  // ...
});

const publicRouteTable = new aws.ec2.RouteTable(this, "public-route-table", { // ❌ Wrong namespace
  vpcId: this.vpc.id,
  // ...
});

this.publicSubnets = this.availabilityZones.map((az, index) => {
  return new aws.vpc.Subnet(this, `public-subnet-${index}`, { // ❌ Wrong namespace
    // ...
  });
});
```

**Why it breaks deployment:**
These classes don't exist in the CDKTF AWS provider. Results in TypeScript compilation errors: `Property 'InternetGateway' does not exist on type 'typeof ec2'` and similar errors for `Eip`, `RouteTable`, and `Subnet`.

**Actual Implementation (FIXED):**
```typescript
// Correct class imports and usage
this.internetGateway = new aws.internetGateway.InternetGateway(this, 'igw', { // ✅ Correct
  vpcId: this.vpc.id,
  tags: {/* ... */},
});

const eip = new aws.eip.Eip(this, 'nat-eip', { // ✅ Correct
  domain: 'vpc',
  tags: {/* ... */},
});

const publicRouteTable = new aws.routeTable.RouteTable(this, 'public-rt', { // ✅ Correct
  vpcId: this.vpc.id,
  tags: {/* ... */},
});

this.publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
  return new aws.subnet.Subnet(this, `public-subnet-${index}`, { // ✅ Correct
    vpcId: this.vpc.id,
    cidrBlock: cidr,
    // ...
  });
});
```

---

### 4. **Invalid ALB Resource Class Usage**

**Model Response (BROKEN):**
```typescript
// Using wrong class name
this.alb = new aws.alb.Alb(this, "alb", { // ❌ Wrong class name
  name: `${config.tags.Project}-alb`,
  loadBalancerType: "application",
  // ...
});

this.targetGroup = new aws.albTargetGroup.AlbTargetGroup(this, "tg", { // ❌ Wrong class name
  // ...
  healthCheck: {
    healthy_threshold: 2, // ❌ Wrong property name (snake_case)
    unhealthy_threshold: 2, // ❌ Wrong property name
    // ...
  },
});

this.httpsListener = new aws.albListener.AlbListener(this, "https-listener", { // ❌ Wrong class name
  // ...
});
```

**Why it breaks deployment:**
CDKTF uses `Lb` not `Alb` for Application Load Balancers. Also uses camelCase for properties, not snake_case. Results in: `Module '"@cdktf/provider-aws"' has no exported member 'alb'` and `Property 'healthy_threshold' does not exist`.

**Actual Implementation (FIXED):**
```typescript
// Correct ALB classes and property names
this.alb = new aws.lb.Lb(this, 'alb', { // ✅ Correct class: lb.Lb
  name: `${config.projectName}-alb-${config.environment}`,
  loadBalancerType: 'application',
  subnets: config.subnetIds,
  // ...
});

this.targetGroup = new aws.lbTargetGroup.LbTargetGroup(this, 'tg', { // ✅ Correct: lbTargetGroup
  name: `${config.projectName}-tg-${config.environment}`,
  port: 3000,
  protocol: 'HTTP',
  vpcId: config.vpcId,
  targetType: 'instance',
  healthCheck: {
    enabled: true,
    path: config.healthCheckPath,
    protocol: 'HTTP',
    healthyThreshold: 2, // ✅ Correct: camelCase
    unhealthyThreshold: 3,
    timeout: 5,
    interval: 30,
    matcher: '200',
  },
  // ...
});

this.httpListener = new aws.lbListener.LbListener(this, 'http-listener', { // ✅ Correct: lbListener
  loadBalancerArn: this.alb.arn,
  port: 80,
  protocol: 'HTTP',
  // ...
});
```

---

### 5. **Missing TLS Provider for Key Pair Generation**

**Model Response (BROKEN):**
The model response completely omits the key pair infrastructure. When instances try to launch without a key pair:
```
Error: creating Auto Scaling Group: ValidationError: The key pair 'tap-ecommerce-keypair' does not exist
```

**Actual Implementation (FIXED):**
```typescript
// In main.ts
import { TlsProvider } from '@cdktf/provider-tls/lib/provider';
import { privateKey } from '@cdktf/provider-tls';

// In TapStack constructor
new TlsProvider(this, 'tls', {}); // ✅ Register TLS provider

// In KeyPairConstruct
export class KeyPairConstruct extends Construct {
  public readonly keyPair: aws.keyPair.KeyPair;
  public readonly keyPairName: string;

  constructor(scope: Construct, id: string, config: KeyPairConfig) {
    super(scope, id);

    this.keyPairName = `${config.projectName}-keypair-${config.environment}`;

    if (config.publicKey) {
      this.keyPair = new aws.keyPair.KeyPair(this, 'keypair', {
        keyName: this.keyPairName,
        publicKey: config.publicKey,
        tags: config.tags,
      });
    } else {
      // Generate key pair using TLS provider
      const tlsPrivateKey = new privateKey.PrivateKey(this, 'private-key', {
        algorithm: 'RSA',
        rsaBits: 4096,
      });

      this.keyPair = new aws.keyPair.KeyPair(this, 'keypair', {
        keyName: this.keyPairName,
        publicKey: tlsPrivateKey.publicKeyOpenssh, // ✅ Use generated public key
        tags: config.tags,
      });

      // Store private key securely
      const keypairSecret = new aws.secretsmanagerSecret.SecretsmanagerSecret(
        this,
        'keypair-secret',
        {
          name: `${this.keyPairName}-private`,
          description: 'Private key for EC2 instances',
          tags: config.tags,
        }
      );

      new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
        this,
        'keypair-secret-version',
        {
          secretId: keypairSecret.id,
          secretString: tlsPrivateKey.privateKeyPem,
        }
      );
    }
  }
}
```

---

### 6. **Dynamic Availability Zone Lookup Instead of Hardcoded Values**

**Model Response (BROKEN):**
```typescript
// Uses Fn.element with DataAwsAvailabilityZones
const azs = new aws.dataAwsAvailabilityZones.DataAwsAvailabilityZones(
  this,
  "azs",
  { state: "available" }
);

this.availabilityZones = [
  Fn.element(azs.names, 0), // ❌ Returns a Terraform token, not a resolved string
  Fn.element(azs.names, 1),
];

// Later tries to use these tokens in map operations
this.publicSubnets = this.availabilityZones.map((az, index) => {
  return new aws.vpc.Subnet(this, `public-subnet-${index}`, {
    availabilityZone: az, // ❌ Token can't be used directly in some contexts
    cidrBlock: Fn.cidrsubnet(config.cidrBlock, 8, index), // ❌ Dynamic CIDR calculation
    // ...
  });
});
```

**Why it breaks deployment:**
Using `Fn.element()` returns Terraform tokens that aren't fully resolved at synthesis time, causing issues with resource naming and dependencies. Also, `Fn.cidrsubnet()` calculates CIDRs dynamically, making it harder to predict and manage network layout.

**Actual Implementation (FIXED):**
```typescript
// In TapStack constructor - explicitly define AZs based on region
const availabilityZones = [`${awsRegion}a`, `${awsRegion}b`]; // ✅ Explicit, predictable

const networkingConfig: NetworkingConfig = {
  region: awsRegion,
  environment: environment,
  projectName: projectName,
  tags: commonTags,
  vpcCidr: '10.0.0.0/16',
  availabilityZones: availabilityZones, // ✅ Pass explicit values
  publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'], // ✅ Explicit CIDRs
  privateSubnetCidrs: ['10.0.10.0/24', '10.0.11.0/24'],
};

// In NetworkingConstruct - use provided values directly
this.publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
  return new aws.subnet.Subnet(this, `public-subnet-${index}`, {
    vpcId: this.vpc.id,
    cidrBlock: cidr, // ✅ Use explicit CIDR, not dynamic calculation
    availabilityZone: config.availabilityZones[index], // ✅ Use explicit AZ
    mapPublicIpOnLaunch: true,
    tags: {/* ... */},
  });
});
```

---

### 7. **Missing S3 Backend Configuration with State Locking**

**Model Response (BROKEN):**
No backend configuration at all. State is stored locally, which breaks in CI/CD and team environments:
```
Error: Error acquiring the state lock
Error: state file locked by another process
```

**Actual Implementation (FIXED):**
```typescript
// In TapStack constructor
new S3Backend(this, {
  bucket: stateBucket,
  key: `${environmentSuffix}/${id}.tfstate`,
  region: stateBucketRegion,
  encrypt: true,
});

// Using escape hatch for native S3 state locking
this.addOverride('terraform.backend.s3.use_lockfile', true);
```

**Why this matters:**
- Enables team collaboration without state conflicts
- Prevents concurrent deployments from corrupting state
- Provides state encryption and versioning
- Essential for production deployments

---

### 8. **Incorrect IAM Policy Attachment for Secrets Access**

**Model Response (BROKEN):**
```typescript
// Uses inline policy with wrong structure
new aws.iamRolePolicy.IamRolePolicy(this, "secrets-policy", {
  role: instanceRole.id,
  policy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
        ],
        Resource: config.dbSecretArn, // ❌ Single string, should support multiple secrets
      },
    ],
  }),
});
```

**Why it breaks deployment:**
Inline policies are less maintainable and the structure doesn't support multiple secret ARNs properly.

**Actual Implementation (FIXED):**
```typescript
// Create separate policy resource
const secretsPolicy = new aws.iamPolicy.IamPolicy(this, 'secrets-policy', {
  name: `${config.projectName}-secrets-policy-${config.environment}`,
  policy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        Resource: config.dbSecretArn, // ✅ Properly scoped to specific secret
      },
    ],
  }),
});

// Attach as managed policy
new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
  this,
  'secrets-policy-attachment',
  {
    role: instanceRole.name,
    policyArn: secretsPolicy.arn, // ✅ Use policy ARN for attachment
  }
);
```

---

### 9. **User Data Encoding and Raw String Handling**

**Model Response (BROKEN):**
No user data implementation at all, meaning instances launch without application setup.

**Actual Implementation (FIXED):**
```typescript
// In ComputeConstruct
const userData = config.userData
  ? Fn.base64encode(Fn.rawString(config.userData)) // ✅ Proper encoding with rawString
  : '';

this.launchTemplate = new aws.launchTemplate.LaunchTemplate(this, 'lt', {
  name: `${config.projectName}-lt-${config.environment}`,
  imageId: ami.id,
  instanceType: config.instanceType,
  keyName: config.keyName,
  vpcSecurityGroupIds: [config.securityGroupId],
  iamInstanceProfile: {
    arn: instanceProfile.arn,
  },
  userData: userData, // ✅ Properly encoded user data
  // ...
});
```

**Why Fn.rawString matters:**
Without `Fn.rawString()`, Terraform treats the user data as a Terraform expression and tries to interpolate variables, which breaks shell scripts. `Fn.rawString()` ensures the script is treated as literal text.

---

### 10. **Missing Environment-Specific Configuration Logic**

**Model Response (BROKEN):**
Uses `TerraformVariable` for everything, making it impossible to have environment-specific defaults:
```typescript
const dbInstanceClass = new TerraformVariable(this, "db_instance_class", {
  type: "string",
  default: "db.t3.medium", // ❌ Same for all environments
  description: "RDS instance class",
});
```

**Actual Implementation (FIXED):**
```typescript
// In DatabaseConfig
instanceClass: environment === 'production' ? 'db.t3.medium' : 'db.t3.micro', // ✅ Environment-aware
allocatedStorage: environment === 'production' ? 100 : 20,
backupRetentionPeriod: environment === 'production' ? 7 : 1,

// In LoadBalancerConfig
enableDeletionProtection: config.environment === 'production', // ✅ Protect production

// In ComputeConfig
minSize: environment === 'production' ? 2 : 1,
maxSize: environment === 'production' ? 6 : 3,
desiredCapacity: environment === 'production' ? 3 : 2,

// In database instance
deletionProtection: config.environment === 'production',
skipFinalSnapshot: config.environment !== 'production',
finalSnapshotIdentifier: config.environment === 'production'
  ? `${config.projectName}-db-final-${config.environment}-${Date.now()}`
  : undefined,
```
