<role>
You are an expert AWS Solutions Architect and Infrastructure as Code specialist with deep expertise in Pulumi TypeScript, zero-downtime migrations, and PCI-compliant fintech systems.
</role>

<project_context>
We are migrating a production payment processing system from an existing VPC (10.10.0.0/16) to a new VPC (10.20.0.0/16) in us-east-1 with zero downtime. The system currently runs:
- Node.js microservices on EC2 instances
- RDS PostgreSQL 13.7 Multi-AZ database
- S3 buckets with payment transaction logs

The migration requires PCI compliance throughout the transition and must complete with less than 15 minutes total downtime.
</project_context>

<technical_requirements>
- Pulumi 3.x with TypeScript
- AWS CLI v2, Node.js 18+
- Target VPC: 10.20.0.0/16 across 3 availability zones
- VPC peering between source and target VPCs
- Blue-green deployment for microservices
- Route53 weighted routing: 0% → 10% → 50% → 100%
- CloudWatch monitoring with automatic rollback
- Resource naming: {environment}-{service}-{component}-{random-suffix}
</technical_requirements>

<critical_constraints>
1. Maximum downtime: 15 minutes total across all services
2. RDS read replica lag: Must stay under 1 second during migration
3. All traffic encrypted with TLS 1.2 or higher
4. Security groups deny all except specific application ports
5. Rollback capability: Restore original state within 5 minutes
</critical_constraints>

<task>
Create a complete Pulumi TypeScript program that orchestrates this zero-downtime VPC migration. Implement the following components with proper resource connections:

**Infrastructure Setup:**
- New target VPC with 10.20.0.0/16 CIDR across 3 AZs (us-east-1a, us-east-1b, us-east-1c)
- Private subnets for compute tier (10.20.1.0/24, 10.20.2.0/24, 10.20.3.0/24)
- Private subnets for database tier (10.20.11.0/24, 10.20.12.0/24, 10.20.13.0/24)
- VPC peering connection between 10.10.0.0/16 (existing) and 10.20.0.0/16 (new)
- Route table updates for bi-directional traffic flow

**Database Migration:**
- RDS PostgreSQL read replica in target VPC subnets
- Cross-VPC security group rules for replication traffic
- Automated promotion mechanism with lag monitoring
- Connection string updates for application switchover

**Application Migration:**
- New Auto Scaling Groups in target VPC private subnets
- Application Load Balancers with target groups (blue and green)
- Security groups preserving existing rules from source VPC
- NACLs replicated to maintain security posture

**Traffic Management:**
- Route53 weighted routing policy with phase-based traffic shifting
- Health checks for automated rollback trigger
- CloudWatch alarms for connection counts, error rates, and latency

**Monitoring & Rollback:**
- CloudWatch dashboard with migration metrics
- Automatic rollback logic when error thresholds exceeded
- Pulumi stack exports for each migration phase state
</task>

<file_structure>
You must modify and output code ONLY for these three files:

1. **lib/tap-stack.ts**
   - Main stack implementation with all AWS resources
   - Resource dependency management and proper connections
   - Stack outputs including dashboard URL and rollback command

2. **tests/tap-stack.unit.test.ts**
   - Unit tests for resource configuration validation
   - Security group rule verification
   - Naming convention compliance tests
   - CIDR block and subnet allocation tests

3. **tests/tap-stack.int.test.ts**
   - Integration tests for VPC peering connectivity
   - Database replication lag validation
   - Traffic routing verification across phases
   - Rollback mechanism testing
</file_structure>

<implementation_guidelines>
1. Use Pulumi's `pulumi.ComponentResource` for logical grouping (VPC module, RDS module, compute module)
2. Implement explicit `dependsOn` relationships to ensure proper provisioning order
3. Use `pulumi.Output.all()` to connect resources that depend on multiple outputs
4. Create custom resources for migration phases (Phase 0: Setup, Phase 1: Peering, Phase 2: Database, Phase 3: Compute, Phase 4: Cutover)
5. Export stack outputs using `pulumi.export()` for rollback commands and dashboard URLs
6. Tag all resources with: Environment, Service, MigrationPhase, and PCI-Compliance tags
7. Use AWS SDK calls within custom Pulumi dynamic providers for Route53 weight updates
8. Implement CloudWatch composite alarms that trigger rollback automation
</implementation_guidelines>

<resource_connection_focus>
Show explicit connections between:
- VPC Peering Connection → Route Table entries in both VPCs
- Source RDS Instance → Read Replica (cross-VPC replication)
- Security Groups → Allow replication traffic (port 5432) between VPCs
- ALB Target Groups → Auto Scaling Groups in new VPC
- Route53 Record Set → Multiple ALB endpoints with weights
- CloudWatch Alarms → SNS Topics → Lambda for automated rollback
- S3 Bucket Policy → Cross-account access for transaction logs
- IAM Roles → EC2 Instance Profiles → S3 and RDS permissions
</resource_connection_focus>

<output_format>
Provide three complete, production-ready code files:

// lib/tap-stack.ts
[Full stack implementation with detailed comments explaining resource connections]


undefined
// tests/tap-stack.unit.test.ts
[Comprehensive unit tests covering all constraints]


undefined
// tests/tap-stack.int.test.ts
[Integration tests validating end-to-end migration flow]



Each file should include:
- Proper TypeScript types and interfaces
- Inline comments explaining critical connection points
- Error handling for migration failures
- Compliance with all naming conventions and constraints
</output_format>

<example_resource_connection>
Example of explicit resource connection pattern to follow:

// Create VPC peering connection
const peeringConnection = new aws.ec2.VpcPeeringConnection("vpc-peering", {
vpcId: targetVpc.id,
peerVpcId: sourceVpcId, // existing 10.10.0.0/16
autoAccept: true,
});

// Update target VPC route table to route to source VPC through peering
const targetRoute = new aws.ec2.Route("target-to-source-route", {
routeTableId: targetRouteTable.id,
destinationCidrBlock: "10.10.0.0/16",
vpcPeeringConnectionId: peeringConnection.id,
});

// Update source VPC route table (requires route table ID from existing VPC)
const sourceRoute = new aws.ec2.Route("source-to-target-route", {
routeTableId: sourceRouteTableId,
destinationCidrBlock: "10.20.0.0/16",
vpcPeeringConnectionId: peeringConnection.id,
});


</example_resource_connection>

<validation_checklist>
Before outputting code, ensure:
✓ All 10 requirements from the original specification are addressed
✓ Resource naming follows {environment}-{service}-{component}-{random-suffix}
✓ VPC CIDR blocks and subnet allocations are correct
✓ Security group rules maintain least-privilege access
✓ RDS replication lag monitoring is implemented
✓ Route53 weight progression (0%→10%→50%→100%) is configurable
✓ CloudWatch alarms exist for all critical metrics
✓ Rollback mechanism uses stack exports and is testable
✓ All resources have proper tags for compliance tracking
✓ Tests cover both happy path and failure scenarios
</validation_checklist>

Begin implementation focusing on creating well-connected infrastructure resources that work together seamlessly for zero-downtime migration.
