# Multi-Region Disaster Recovery Migration

Hey team,

We have a critical business need to migrate our transaction processing system from us-west-1 to us-west-2. The executive team wants a complete disaster recovery solution that maintains business continuity during the migration. I've been asked to create this using **Terraform with HCL**.

The current application is running production workloads in us-west-1, and we need to establish it in us-west-2 while preserving all configurations, security groups, network topology, and maintaining the same logical identities (names, tags, relationships). This isn't a simple lift-and-shift - we need to handle the complexities of AWS resource IDs being region-scoped and ensure our Terraform state migrates cleanly without data loss.

The business is particularly concerned about downtime. We need a solid cutover strategy with DNS routing that minimizes disruption to our customers. They're expecting a comprehensive runbook that covers not just the happy path, but also rollback procedures if something goes wrong.

## What we need to build

Create a multi-region disaster recovery solution using **Terraform with HCL** that migrates an AWS transaction processing application from us-west-1 to us-west-2 with zero data loss and minimal downtime.

### Core Requirements

1. **Infrastructure Migration**
   - Preserve logical identity: keep the same resource names, tags, and network topology
   - Handle region-scoped resource IDs properly using terraform import
   - Do NOT recreate resources - provide mapping plan from old IDs to new IDs
   - Maintain all security group rules and network configuration semantics
   - Ensure all IAM roles, policies, and permissions transfer correctly

2. **State Management**
   - Migrate Terraform state from us-west-1 workspace to us-west-2 workspace
   - Zero data loss during state migration
   - Preserve all resource relationships and dependencies
   - Document exact Terraform CLI commands for state operations
   - Handle state locking and prevent concurrent modifications

3. **DNS and Traffic Cutover**
   - Propose DNS cutover steps with proper TTL strategy
   - Minimize customer-facing downtime
   - Support gradual traffic shifting if possible
   - Include health check validation before full cutover
   - Plan for DNS propagation delays

4. **Documentation and Runbooks**
   - Provide step-by-step cutover procedures
   - Include validation checks at each stage
   - Document rollback procedures
   - Create resource ID mapping reference
   - Include troubleshooting guide for common issues

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Support both source region (us-west-1) and target region (us-west-2)
- Use Terraform workspaces or separate state files for region isolation
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment}-suffix`
- Include proper error handling and validation checks
- All resources must be destroyable (no Retain policies on deletion)
- Use Terraform modules for reusable components
- Backend configuration with S3 and DynamoDB for state locking

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** parameter for unique naming
- Resources must be fully destroyable - use appropriate lifecycle policies
- No RemovalPolicy RETAIN - all resources should allow clean deletion
- State files must be backed up before migration operations
- Include pre-flight checks before each major operation
- DNS changes must be reversible
- All migrations must be idempotent

### Constraints

- Must maintain production SLA during migration
- Zero data loss requirement - all application data must transfer
- Security posture must not degrade during migration
- Compliance requirements must be maintained across both regions
- Cost optimization - avoid running duplicate infrastructure longer than necessary
- Must support rollback within 1 hour if issues detected
- No breaking changes to application configuration

## Success Criteria

- Functionality: Application runs identically in us-west-2 as in us-west-1
- Performance: No degradation in response times or throughput
- Reliability: All health checks pass in target region before cutover
- Security: All security groups, NACLs, and IAM policies preserved
- State Management: Terraform state cleanly migrated with all resources tracked
- Documentation: Complete runbooks that operations team can execute
- Rollback: Proven rollback procedure tested and documented

## What to deliver

- Complete Terraform HCL implementation with modules
- main.tf with provider configurations for both regions
- variables.tf with all configurable parameters
- backend.tf for state management (use placeholders for secrets)
- state-migration.md with exact Terraform CLI commands for state operations
- id-mapping.csv sample showing old resource IDs to new resource IDs
- runbook.md with detailed cutover plan, validation steps, and rollback procedures
- outputs.tf with critical resource information
- Documentation covering DNS strategy, TTL recommendations, and traffic routing
