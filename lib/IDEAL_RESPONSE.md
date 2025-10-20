# Ideal Response for Multi-Tenant SaaS Infrastructure

## Overview
The ideal response should provide a complete, production-ready Pulumi infrastructure implementation in **TypeScript** (not Python as provided) that addresses all requirements from the prompt with proper tenant isolation mechanisms.

## Key Requirements Met

### 1. Correct Language and Framework
The implementation should use:
- **Pulumi with TypeScript** (the actual file is `tap-stack.ts`, not Python)
- AWS CDK patterns where appropriate
- Proper TypeScript type definitions

### 2. Infrastructure Components Required

#### Network Layer
// VPC with proper CIDR allocation
const vpc = new aws.ec2.Vpc("tap-vpc", {
cidrBlock: "10.18.0.0/16",
enableDnsHostnames: true,
enableDnsSupport: true
});

// Multi-AZ subnets
const publicSubnets = availabilityZones.map((az, idx) =>
new aws.ec2.Subnet(public-subnet-${idx}, {
vpcId: vpc.id,
cidrBlock: 10.18.${idx}.0/24,
availabilityZone: az,
mapPublicIpOnLaunch: true
})
);

 

#### Aurora PostgreSQL with Row-Level Security
// RLS-enabled parameter group
const parameterGroup = new aws.rds.ClusterParameterGroup("aurora-params", {
family: "aurora-postgresql14",
parameters: [
{ name: "row_security", value: "on" },
{ name: "shared_preload_libraries", value: "pg_stat_statements" }
]
});

// Aurora cluster with encryption
const auroraCluster = new aws.rds.Cluster("aurora", {
engine: "aurora-postgresql",
engineVersion: "14.6",
dbClusterParameterGroupName: parameterGroup.name,
storageEncrypted: true,
backupRetentionPeriod: 30
});

 

#### ALB with Host-Based Routing
// HTTPS listener with host-based rules
const httpsListener = new aws.lb.Listener("https", {
loadBalancerArn: alb.arn,
port: 443,
protocol: "HTTPS",
certificateArn: certificate.arn,
defaultActions: [{
type: "fixed-response",
fixedResponse: {
contentType: " /plain",
statusCode: "404",
messageBody: "Tenant not found"
}
}]
});

// Per-tenant routing rules
new aws.lb.ListenerRule("tenant-rule", {
listenerArn: httpsListener.arn,
conditions: [{
hostHeader: { values: ["tenant1.example.com"] }
}],
actions: [{
type: "forward",
targetGroupArn: targetGroup.arn
}]
});

 

#### ElastiCache Redis with Tier Separation
// Premium tier - dedicated cluster
const premiumRedis = new aws.elasticache.ReplicationGroup("premium-redis", {
replicationGroupDescription: "Dedicated Redis for premium tenants",
nodeType: "cache.r6g.large",
numCacheClusters: 2,
automaticFailoverEnabled: true,
atRestEncryptionEnabled: true,
transitEncryptionEnabled: true
});

// Standard tier - shared with key prefixing
const standardRedis = new aws.elasticache.ReplicationGroup("standard-redis", {
replicationGroupDescription: "Shared Redis with tenant key prefixes",
nodeType: "cache.r6g.xlarge",
numCacheClusters: 3
});

 

#### S3 with Tenant Isolation Policies
const tenantBucket = new aws.s3.Bucket("tenant-data", {
versioning: { enabled: true },
serverSideEncryptionConfiguration: {
rules: [{
applyServerSideEncryptionByDefault: {
sseAlgorithm: "AES256"
}
}]
}
});

// Tenant isolation policy
new aws.s3.BucketPolicy("tenant-policy", {
bucket: tenantBucket.id,
policy: pulumi.interpolate{ "Version": "2012-10-17", "Statement": [{ "Effect": "Allow", "Principal": {"AWS": "*"}, "Action": ["s3:GetObject", "s3:PutObject"], "Resource": "${tenantBucket.arn}/*", "Condition": { "StringEquals": { "s3:ExistingObjectTag/TenantId": "\${aws:PrincipalTag/TenantId}" } } }] }
});

 

#### Lambda Provisioning Function
const provisioningLambda = new aws.lambda.Function("tenant-provisioning", {
runtime: "nodejs18.x",
handler: "index.handler",
role: lambdaRole.arn,
code: new pulumi.asset.AssetArchive({
"index.js": new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
const { tenantId, domain, tier } = JSON.parse(event.body);

 
            // Create Cognito user pool
            const userPool = await createUserPool(tenantId);
            
            // Create ALB listener rule
            await createListenerRule(domain);
            
            // Initialize RLS policies
            await initializeDatabaseSchema(tenantId);
            
            // Store in DynamoDB
            await storeTenantMetadata(tenantId, domain, tier);
            
            return { statusCode: 201, body: JSON.stringify({ tenantId }) };
        };
    `)
}),
environment: {
    variables: {
        AURORA_ENDPOINT: auroraCluster.endpoint,
        TENANT_TABLE: tenantRegistry.name
    }
}
});

 

#### Cognito with Custom Domains
const userPool = new aws.cognito.UserPool("tenant-pool", {
name: "tenant-user-pool",
autoVerifiedAttributes: ["email"],
passwordPolicy: {
minimumLength: 12,
requireLowercase: true,
requireUppercase: true,
requireNumbers: true,
requireSymbols: true
},
schema: [{
name: "tenant_id",
attributeDataType: "String",
developerOnlyAttribute: true,
mutable: false
}]
});

const userPoolDomain = new aws.cognito.UserPoolDomain("custom-domain", {
domain: "tenant1.auth.example.com",
userPoolId: userPool.id,
certificateArn: certificate.arn
});

 

### 3. Comprehensive Testing

#### Unit Tests
describe("TapStack Unit Tests", () => {
it("should create VPC with correct CIDR", async () => {
const resources = await pulumi.runtime.invoke("test:index:TestStack", {});
expect(resources.vpcCidr).toBe("10.18.0.0/16");
});

 
it("should enable RLS on Aurora parameter group", async () => {
    const resources = await pulumi.runtime.invoke("test:index:TestStack", {});
    const rlsParam = resources.parameters.find(p => p.name === "row_security");
    expect(rlsParam.value).toBe("on");
});

it("should create separate Redis clusters for premium and standard tiers", async () => {
    const resources = await pulumi.runtime.invoke("test:index:TestStack", {});
    expect(resources.premiumRedis).toBeDefined();
    expect(resources.standardRedis).toBeDefined();
});
});

 

#### Integration Tests
describe("TapStack Integration Tests", () => {
it("should provision tenant end-to-end", async () => {
const lambda = await testHarness.invokeLambda("tenant-provisioning", {
body: JSON.stringify({
tenantId: "test-tenant-001",
domain: "test.example.com",
tier: "premium"
})
});

 
    expect(lambda.statusCode).toBe(201);
    
    // Verify DynamoDB entry
    const tenant = await getTenantMetadata("test-tenant-001");
    expect(tenant.domain).toBe("test.example.com");
    
    // Verify ALB rule created
    const rules = await getListenerRules();
    expect(rules).toContainRule({ domain: "test.example.com" });
});

it("should enforce tenant isolation in database", async () => {
    // Attempt cross-tenant query
    const result = await queryWithTenantContext("tenant1", "SELECT * FROM data");
    expect(result.rows.every(r => r.tenant_id === "tenant1")).toBe(true);
});
});

 

### 4. Proper Resource Connections

The infrastructure must demonstrate proper resource dependencies:

- ALB → Target Groups → Auto Scaling Group
- Lambda → DynamoDB + Cognito + Route53 + ALB
- Aurora → Security Groups → Private Subnets
- CloudFront → S3 + OAI + ACM
- ECS/EC2 → IAM Roles → S3 + SSM + Aurora

### 5. Documentation and Comments

Code should include:
- Inline comments explaining tenant isolation mechanisms
- RLS policy examples
- Security group rule rationale
- Scaling considerations
- Architecture diagrams in comments

## Architecture Summary

The ideal solution creates a production-grade multi-tenant SaaS infrastructure with:

1. **Network Isolation**: VPC with multi-AZ deployment
2. **Database Isolation**: Aurora PostgreSQL with Row-Level Security policies
3. **Cache Isolation**: Separate Redis clusters for premium, shared for standard
4. **Storage Isolation**: S3 bucket policies based on IAM principal tags
5. **Authentication Isolation**: Separate Cognito user pools per tenant
6. **Routing Isolation**: ALB host-based routing to tenant-specific targets
7. **Logging Isolation**: Separate CloudWatch log groups per tenant
8. **Automated Provisioning**: Lambda function orchestrating tenant creation

## Security Best Practices Implemented

- Encryption at rest (Aurora, ElastiCache, S3)
- Encryption in transit (TLS for all connections)
- Least-privilege IAM policies
- Security group rules with specific port restrictions
- IMDSv2 enforcement on EC2
- KMS key rotation enabled
- VPC endpoints for AWS services
- CloudWatch Logs encryption

## Scaling Considerations

- Auto Scaling Groups with target tracking
- Aurora read replicas
- ElastiCache replication
- CloudFront for static content distribution
- DynamoDB on-demand billing
- Multi-AZ deployments for high availability
