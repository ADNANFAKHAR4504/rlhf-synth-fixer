# Task: Provisioning of Infrastructure Environments

Hey! We need to build a migration orchestration framework using **Pulumi with TypeScript** for a fintech company that's moving from a single AWS account to a multi-account AWS Organizations setup.

## Background

Our fintech client runs payment processing infrastructure in a single AWS account in us-east-1. They need to migrate to a multi-account organization spanning us-east-1 and us-east-2 regions while maintaining zero downtime for their critical payment APIs.

The legacy infrastructure includes VPCs with private subnets, RDS MySQL clusters, ECS services, and Application Load Balancers. The new target uses AWS Control Tower with Transit Gateway for inter-region connectivity.

## What We Need

Build a Pulumi TypeScript program that creates a reusable migration framework with these capabilities:

### 1. Custom ComponentResource for Migration State Machine
Create a Pulumi ComponentResource that encapsulates the migration logic for each service tier. This component should manage the lifecycle and dependencies of migrated resources.

### 2. Cross-Account IAM Roles
Set up IAM roles that support cross-account operations between the legacy account and three new accounts (production, staging, development). All operations must use temporary STS credentials with maximum 1-hour session duration.

### 3. Transit Gateway with AWS RAM Sharing
Configure Transit Gateway attachments and use AWS Resource Access Manager to share them across accounts during the migration phase. This enables connectivity between old and new environments.

### 4. Migration Orchestrator with Step Functions
Build an AWS Step Functions state machine that coordinates service migrations in dependency order. It should handle success/failure states and trigger appropriate rollback actions.

### 5. EventBridge Monitoring
Set up EventBridge rules to track migration progress across accounts with centralized monitoring. All events should flow to a central account for visibility.

### 6. Systems Manager Parameter Store
Create Parameter Store hierarchies for sharing migration metadata between accounts. This allows coordination without tight coupling.

### 7. Route 53 Traffic Shifting
Implement gradual traffic shifting using Route 53 weighted routing policies with health checks. Start at 10% new environment, gradually increase to 100% based on health check success.

### 8. AWS Config Aggregator
Configure an AWS Config aggregator to validate compliance across all accounts post-migration. This ensures consistent security posture.

### 9. Rollback Automation
Implement automated rollback capabilities using Pulumi stack outputs and AWS APIs. If health checks fail, automatically shift traffic back to the legacy environment.

### 10. Migration Progress Tracking
Provide a custom Pulumi stack output that returns the current migration percentage completion. This should query the Step Functions execution status.

### 11. Dry-Run Mode Support
Support dry-run mode that simulates the migration without making actual resource changes. Use Pulumi preview mode and conditional resource creation.

## Key Requirements

- The migration must support incremental rollout with the ability to migrate individual services independently
- All cross-account operations must use temporary STS credentials with maximum 1-hour session duration
- Migration progress must be queryable via a custom Pulumi stack output that returns percentage completion
- The program must detect and prevent circular dependencies during cross-account resource migrations
- All migrated resources must retain their original tags plus new migration metadata tags
- The solution must support dry-run mode that simulates the migration without making actual changes
- Use `environmentSuffix` for ALL resource names to enable parallel testing
- All resources must be destroyable (no RETAIN policies)
- Include comprehensive error handling and logging with CloudWatch

## Testing Strategy

Since this requires multiple AWS accounts, the implementation should:
- Use Pulumi configuration for account IDs (not hard-coded values)
- Support running with a single account by using the same account ID for all roles
- Include comprehensive unit tests with 100% coverage using mocking
- Provide example configuration showing the multi-account setup
- Document the simplified single-account test mode

## Expected Deliverables

1. Complete Pulumi TypeScript infrastructure code in `lib/`
2. Comprehensive unit tests achieving 100% coverage
3. README.md with setup and deployment instructions
4. Example Pulumi stack configuration
5. All resources using `environmentSuffix` for naming
