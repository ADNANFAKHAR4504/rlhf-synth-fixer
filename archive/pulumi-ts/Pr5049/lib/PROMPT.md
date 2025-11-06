# Role
You are an expert AWS infrastructure engineer specializing in Pulumi TypeScript implementations for cross-region migrations. You write production-grade, type-safe infrastructure code with comprehensive testing.

# Task
Build a Pulumi TypeScript program to orchestrate a complete AWS environment migration from us-east-1 to eu-central-1 for a media streaming company's staging environment.

## Business Context
- **Driver**: Data residency compliance requirements
- **Downtime Constraint**: Maximum 15 minutes for database cutover
- **Criticality**: Production-like staging environment serving media content

## Infrastructure Requirements

### Source Region (us-east-1) - Existing
- 3 EC2 t3.medium instances behind Application Load Balancer
- RDS PostgreSQL 13.7 db.t3.medium Multi-AZ
- S3 buckets for static media content
- VPC with public/private subnets across 2 AZs

### Target Region (eu-central-1) - To Build
- Identical infrastructure matching source region
- Cross-region RDS read replica (to be promoted)
- S3 cross-region replication with versioning
- CloudFront distributions with new origins
- Route53 weighted routing for blue-green cutover

### Migration Components
1. **VPC Peering**: Temporary secure connection between regions
2. **Database Migration**: RDS read replica → promotion to primary
3. **Storage Migration**: S3 cross-region replication preserving metadata/ACLs
4. **Traffic Cutover**: Route53 weighted routing + CloudFront origin switching
5. **State Management**: S3 backend + DynamoDB locking
6. **Validation**: Pre/post-migration health checks
7. **Safety Net**: Automated rollback on validation failure
8. **Monitoring**: CloudWatch alarms + SNS notifications

## Technical Constraints
- VPC CIDR ranges must NOT overlap
- RDS snapshots encrypted with KMS CMKs in both regions
- Identical AMI IDs must be available in both regions
- S3 metadata and ACLs must be preserved
- CloudFront cache invalidation before DNS cutover
- DynamoDB point-in-time recovery enabled
- All resources tagged with migration metadata and timestamps

## Code Structure Requirements

### File: `lib/tap-stack.ts`
Create a modular Pulumi stack with these components:

export class TapStack extends pulumi.ComponentResource {
// Properties to expose
public readonly targetVpc: aws.ec2.Vpc;
public readonly targetAlb: aws.lb.LoadBalancer;
public readonly targetRds: aws.rds.Instance;
public readonly migrationStatus: pulumi.Output<string>;
public readonly endpoints: pulumi.Output<Endpoints>;

constructor(name: string, args: TapStackArgs, opts?: pulumi.ComponentResourceOptions) {
// Implementation here
}
}



**Required Resource Groups:**
1. **Network Layer**: Target VPC, subnets, security groups, VPC peering
2. **Compute Layer**: 3 EC2 instances, ALB, target groups
3. **Database Layer**: RDS read replica, promotion logic, KMS keys
4. **Storage Layer**: S3 buckets with replication, versioning
5. **CDN Layer**: CloudFront distributions
6. **DNS Layer**: Route53 weighted records, health checks
7. **Monitoring Layer**: CloudWatch alarms, SNS topics
8. **State Layer**: DynamoDB table for migration tracking

**Key Implementation Details:**
- Use `dependsOn` to enforce proper resource creation order
- Implement `apply()` for cross-resource references
- Export migration status, new endpoints, validation results
- Tag all resources with: `MigrationPhase`, `SourceRegion`, `TargetRegion`, `Timestamp`

### File: `tests/tap-stack.unit.test.ts`
Unit tests validating:
- Stack instantiation without errors
- Correct resource counts (3 EC2s, 1 ALB, 1 RDS, etc.)
- CIDR range non-overlap validation
- Security group rule correctness
- KMS key configuration
- Tag presence and values
- Output types and structure

**Test Structure:**
describe('TapStack Unit Tests', () => {
let stack: TapStack;

beforeEach(() => {
// Mock setup
});

it('should create VPC with non-overlapping CIDR', () => {});
it('should create exactly 3 EC2 instances', () => {});
it('should configure RDS with Multi-AZ', () => {});
it('should set up S3 replication rules', () => {});
it('should apply required tags to all resources', () => {});
});



### File: `tests/tap-stack.int.test.ts`
Integration tests validating:
- Actual AWS resource creation (use test AWS account)
- VPC peering connectivity
- RDS replica lag monitoring
- S3 replication verification
- Route53 health check responses
- CloudWatch alarm triggering
- End-to-end migration workflow
- Rollback mechanism

**Test Structure:**
describe('TapStack Integration Tests', () => {
it('should establish VPC peering between regions', async () => {});
it('should replicate S3 objects with metadata', async () => {});
it('should promote RDS replica within 15 minutes', async () => {});
it('should switch traffic via Route53', async () => {});
it('should rollback on validation failure', async () => {});
});



## Output Requirements
The stack must export:
{
migrationStatus: "completed" | "in-progress" | "rolled-back" | "failed",
targetEndpoints: {
albDnsName: string,
rdsEndpoint: string,
cloudfrontDomain: string,
route53Record: string
},
validationResults: {
preCheck: { passed: boolean, details: string },
postCheck: { passed: boolean, details: string },
healthChecks: { passed: boolean, endpoints: string[] }
},
rollbackAvailable: boolean
}



## Success Criteria
- All resources created in eu-central-1
- Database cutover completed in <15 minutes
- S3 objects replicated with preserved metadata
- Traffic successfully routed to new region
- Health checks passing
- Rollback tested and functional
- All tests passing (unit + integration)

# Constraints
- **ONLY modify**: `lib/tap-stack.ts`, `tests/tap-stack.unit.test.ts`, `tests/tap-stack.int.test.ts`
- Use Pulumi 3.x APIs
- TypeScript strict mode enabled
- Follow AWS Well-Architected Framework
- Implement proper error handling
- Use async/await patterns
- Include JSDoc comments for public methods

# Output Format
Provide complete, runnable code for each of the three files with:
1. Proper imports and dependencies
2. Type definitions
3. Inline comments explaining resource connections
4. Error handling
5. Comprehensive tests

Begin with `lib/tap-stack.ts`, then unit tests, then integration tests.