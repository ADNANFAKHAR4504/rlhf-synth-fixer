# MODEL_FAILURES.md

## Common Failures in AWS CDK TypeScript Infrastructure Implementation

This document outlines the most frequent mistakes and failures observed when implementing AWS CDK TypeScript stacks for secure application infrastructure.

### 1. **Networking Configuration Failures**

#### 1.1 Incorrect VPC Configuration
```typescript
// FAILURE: Missing proper subnet configuration
const vpc = new ec2.Vpc(this, 'VPC', {
  cidr: '10.0.0.0/16',
  maxAzs: 2,
  // Missing subnetConfiguration - creates default subnets only
});

// FAILURE: Using deprecated cidr property
const vpc = new ec2.Vpc(this, 'VPC', {
  cidr: '10.0.0.0/16', // Deprecated - should use ipAddresses
  maxAzs: 2,
});
```

#### 1.2 Security Group Misconfigurations
```typescript
// FAILURE: Overly permissive security groups
const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SG', {
  vpc,
  allowAllOutbound: true,
  allowAllInbound: true, // DANGEROUS - allows all inbound traffic
});

// FAILURE: Missing database connectivity
const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSG', {
  vpc,
  allowAllOutbound: false,
  // Missing ingress rule for EC2 to RDS communication
});
```

#### 1.3 Subnet Type Confusion
```typescript
// FAILURE: Database in public subnets
const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
  vpc,
  subnets: {
    subnetType: ec2.SubnetType.PUBLIC, // WRONG - database should be private
  },
});
```

### 2. **Database Configuration Failures**

#### 2.1 RDS Engine Version Issues
```typescript
// FAILURE: Using outdated PostgreSQL version
const database = new rds.DatabaseInstance(this, 'Database', {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_12_8, // Below required version 13
  }),
});

// FAILURE: Missing Multi-AZ configuration
const database = new rds.DatabaseInstance(this, 'Database', {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_15_4,
  }),
  multiAz: false, // Missing high availability
});
```

#### 2.2 Security and Encryption Failures
```typescript
// FAILURE: Disabled storage encryption
const database = new rds.DatabaseInstance(this, 'Database', {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_15_4,
  }),
  storageEncrypted: false, // Security risk
});

// FAILURE: Weak credential management
const database = new rds.DatabaseInstance(this, 'Database', {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_15_4,
  }),
  credentials: rds.Credentials.fromPassword('admin', 'password123'), // Hardcoded credentials
});
```

### 3. **IAM and Security Failures**

#### 3.1 Overly Permissive IAM Policies
```typescript
// FAILURE: Wildcard permissions
const s3AccessPolicy = new iam.Policy(this, 'S3Policy', {
  statements: [
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:*'], // Too permissive
      resources: ['*'], // Too broad
    }),
  ],
});
```

#### 3.2 Missing IAM Role Configuration
```typescript
// FAILURE: EC2 instances without IAM role
const instance = new ec2.Instance(this, 'Instance', {
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
  machineImage: ec2.MachineImage.latestAmazonLinux2(),
  vpc,
  // Missing role property - no S3 access
});
```

#### 3.3 Incorrect Instance Profile Setup
```typescript
// FAILURE: Manual instance profile creation when using role property
const instanceProfile = new iam.CfnInstanceProfile(this, 'Profile', {
  roles: [ec2Role.roleName],
});

const instance = new ec2.Instance(this, 'Instance', {
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
  machineImage: ec2.MachineImage.latestAmazonLinux2(),
  vpc,
  role: ec2Role, // CDK automatically creates instance profile
  // Redundant instanceProfile property
});
```

### 4. **S3 Configuration Failures**

#### 4.1 Missing Encryption
```typescript
// FAILURE: S3 bucket without encryption
const s3Bucket = new s3.Bucket(this, 'Bucket', {
  encryption: s3.BucketEncryption.UNENCRYPTED, // Security risk
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
});
```

#### 4.2 Public Access Configuration
```typescript
// FAILURE: Allowing public access
const s3Bucket = new s3.Bucket(this, 'Bucket', {
  encryption: s3.BucketEncryption.S3_MANAGED,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_NONE, // Allows public access
});
```

### 5. **EC2 Configuration Failures**

#### 5.1 Missing User Data or Initialization
```typescript
// FAILURE: EC2 instances without proper initialization
const instance = new ec2.Instance(this, 'Instance', {
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
  machineImage: ec2.MachineImage.latestAmazonLinux2(),
  vpc,
  // Missing userData - instances won't have required software
});
```

#### 5.2 Incorrect AMI Selection
```typescript
// FAILURE: Using deprecated AMI methods
const instance = new ec2.Instance(this, 'Instance', {
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
  machineImage: ec2.MachineImage.latestAmazonLinux({
    generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX, // Deprecated
  }),
  vpc,
});
```

### 6. **CloudTrail Configuration Failures**

#### 6.1 Missing CloudTrail Configuration
```typescript
// FAILURE: No CloudTrail implementation
// Missing entire CloudTrail section - no audit logging
```

#### 6.2 Incomplete CloudTrail Setup
```typescript
// FAILURE: CloudTrail without proper S3 bucket
const cloudTrail = new cloudtrail.Trail(this, 'Trail', {
  trailName: 'application-trail',
  // Missing bucket property - uses default bucket
  // Missing proper event configuration
});
```

### 7. **Tagging and Organization Failures**

#### 7.1 Missing Resource Tagging
```typescript
// FAILURE: Resources without required tags
const vpc = new ec2.Vpc(this, 'VPC', {
  // Missing cdk.Tags.of(vpc).add('Environment', 'Production')
});

const database = new rds.DatabaseInstance(this, 'Database', {
  // Missing tags
});
```

#### 7.2 Inconsistent Tagging Strategy
```typescript
// FAILURE: Inconsistent tag values
const commonTags = {
  Environment: 'Production',
};

cdk.Tags.of(vpc).add('Environment', 'PROD'); // Inconsistent with commonTags
cdk.Tags.of(database).add('environment', 'production'); // Wrong case
```

### 8. **Output and Documentation Failures**

#### 8.1 Missing Critical Outputs
```typescript
// FAILURE: No outputs for important connection information
// Missing DatabaseEndpoint, DatabasePort, S3BucketName outputs
```

#### 8.2 Incomplete Comments
```typescript
// FAILURE: Code without proper documentation
const vpc = new ec2.Vpc(this, 'VPC', {
  // No comments explaining the purpose or configuration
});
```

### 9. **Resource Communication Flow Failures**

#### 9.1 Missing Security Group Rules
```typescript
// FAILURE: No communication path between EC2 and RDS
const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SG', {
  vpc,
  allowAllOutbound: true,
});

const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSG', {
  vpc,
  allowAllOutbound: false,
  // Missing ingress rule for EC2 to RDS communication
});
```

#### 9.2 Incorrect Resource References
```typescript
// FAILURE: Wrong security group reference
rdsSecurityGroup.addIngressRule(
  ec2.Peer.anyIpv4(), // WRONG - should be ec2SecurityGroup
  ec2.Port.tcp(5432),
  'Allow database access'
);
```

### 10. **Deployment and Runtime Failures**

#### 10.1 Missing Dependencies
```typescript
// FAILURE: Missing required imports
// Missing: import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
```

#### 10.2 Incorrect Constructor Parameters
```typescript
// FAILURE: Wrong constructor signature
export class SecureApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    // Missing optional parameters for environment configuration
  }
}
```

### 11. **Cost and Performance Failures**

#### 11.1 Over-provisioned Resources
```typescript
// FAILURE: Using expensive instance types for development
const database = new rds.DatabaseInstance(this, 'Database', {
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.R5, ec2.InstanceSize.XLARGE), // Overkill
});

const instance = new ec2.Instance(this, 'Instance', {
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.C5, ec2.InstanceSize.LARGE), // Overkill
});
```

#### 11.2 Missing Lifecycle Management
```typescript
// FAILURE: S3 bucket without lifecycle rules
const s3Bucket = new s3.Bucket(this, 'Bucket', {
  encryption: s3.BucketEncryption.S3_MANAGED,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  // Missing lifecycleRules for cost optimization
});
```

### 12. **Security Best Practice Failures**

#### 12.1 Hardcoded Values
```typescript
// FAILURE: Hardcoded database name and credentials
const database = new rds.DatabaseInstance(this, 'Database', {
  databaseName: 'myappdb', // Should be parameterized
  credentials: rds.Credentials.fromPassword('admin', 'password123'), // Security risk
});
```

#### 12.2 Missing Deletion Protection
```typescript
// FAILURE: No deletion protection for critical resources
const database = new rds.DatabaseInstance(this, 'Database', {
  deletionProtection: false, // Allows accidental deletion
});
```

### Prevention Strategies

1. **Use CDK Constructs**: Leverage high-level constructs instead of low-level resources
2. **Implement Security-First Design**: Start with restrictive permissions and open as needed
3. **Add Comprehensive Testing**: Use CDK assertions to validate configurations
4. **Follow AWS Well-Architected Framework**: Implement all pillars (security, reliability, performance, cost optimization)
5. **Use Parameter Store**: Store sensitive values in AWS Systems Manager Parameter Store
6. **Implement Proper Error Handling**: Add try-catch blocks and validation
7. **Regular Security Reviews**: Conduct periodic security assessments of infrastructure code
8. **Documentation**: Maintain comprehensive documentation for all resources and their purposes