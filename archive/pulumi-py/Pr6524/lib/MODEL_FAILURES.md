# MODEL_FAILURES Documentation

This document catalogs the intentional errors in MODEL_RESPONSE.md for training purposes. Each error represents a common mistake that LLMs make when generating infrastructure code.

## Summary

Total Errors: 36

Categories:
- Missing Required Components: 8 errors
- Configuration Errors: 10 errors
- Security Issues: 6 errors
- Architecture/Design Flaws: 8 errors
- Missing Features: 4 errors

## Detailed Error Catalog

### Category 1: Missing Required Components (Critical)

**ERROR 1: Missing Required Tags**
- Location: `TapStack.__init__`
- Issue: Default tags don't include required fields
- Current: `self.default_tags = args.tags`
- Required: Must include 'Environment', 'CostCenter', 'MigrationPhase'
- Impact: Fails compliance requirements, difficult to track costs
- Fix: Add required tags to default_tags dictionary

**ERROR 2: No KMS Key Created**
- Location: `TapStack.__init__`
- Issue: KMS customer-managed key not created
- Requirement: "All data must be encrypted at rest using AWS KMS customer-managed keys"
- Impact: Fails PCI DSS compliance, security requirement violation
- Fix: Call `self.kms_key = self._create_kms_key()` and use in all encrypted resources

**ERROR 3: No VPC Endpoints**
- Location: `TapStack.__init__`
- Issue: VPC endpoints for S3 and DynamoDB not created
- Requirement: "Network traffic must use VPC endpoints to avoid internet exposure"
- Impact: Traffic goes through internet, fails security requirement
- Fix: Create Gateway endpoints for S3 and DynamoDB

**ERROR 4: No Secrets Manager**
- Location: `TapStack.__init__`
- Issue: Database credentials not stored in Secrets Manager
- Requirement: "Database credentials must be stored in AWS Secrets Manager with automatic rotation enabled"
- Impact: Hardcoded passwords, no rotation, fails security requirement
- Fix: Create Secrets Manager secrets with rotation for blue and green databases

**ERROR 5: No CloudWatch Alarms**
- Location: `TapStack.__init__`
- Issue: CloudWatch alarms not created
- Requirement: "Set up CloudWatch alarms for database connection counts and response times"
- Impact: No monitoring, can't detect issues
- Fix: Create alarms for DB connections, ALB response time, DynamoDB throttling

**ERROR 6: No AWS Backup Plan**
- Location: `TapStack.__init__`
- Issue: AWS Backup plan not configured
- Requirement: "Configure AWS Backup plans with 7-day retention for both environments"
- Impact: No disaster recovery capability
- Fix: Create backup vault, plan with 7-day retention, and selections for blue/green clusters

**ERROR 7: No SSM Parameter**
- Location: `TapStack.__init__`
- Issue: No tracking of active environment
- Requirement: "Implement stack outputs that display current active environment and migration status"
- Impact: Can't determine which environment is active
- Fix: Create SSM parameter to store active environment state

**ERROR 8: Single AZ Instead of Three**
- Location: `_create_vpc`
- Issue: `azs = ['us-east-1a']` - only 1 AZ
- Requirement: "Deployed in us-east-1 across 3 availability zones"
- Current: Only creating resources in 1 AZ
- Impact: No high availability, single point of failure
- Fix: Use `azs = ['us-east-1a', 'us-east-1b', 'us-east-1c']`

### Category 2: Configuration Errors

**ERROR 9: Missing Elastic IP**
- Location: `_create_vpc`
- Issue: NAT Gateway created without Elastic IP allocation
- Current: Missing `aws.ec2.Eip` resource
- Impact: NAT Gateway creation will fail
- Fix: Create EIP before NAT Gateway and use allocation_id

**ERROR 10: Missing allocation_id Parameter**
- Location: `_create_vpc`
- Issue: NAT Gateway missing required `allocation_id` parameter
- Current: `aws.ec2.NatGateway(...)` without allocation_id
- Impact: Resource creation fails
- Fix: Add `allocation_id=eip.id`

**ERROR 11: Index Out of Bounds**
- Location: `_create_vpc`
- Issue: Trying to access `nat_gateways[i]` when only 1 NAT gateway exists
- Current: Loop creates 1 NAT but tries to use index 0, 1, 2
- Impact: Runtime error when deploying with proper 3 AZs
- Fix: Create NAT gateway for each AZ (3 total)

**ERROR 12: Missing Point-in-Time Recovery**
- Location: `_create_dynamodb_table`
- Issue: DynamoDB table created without PITR
- Requirement: "Configure DynamoDB tables with point-in-time recovery for session data"
- Current: No `point_in_time_recovery` parameter
- Impact: No disaster recovery for session data
- Fix: Add `point_in_time_recovery={'enabled': True}`

**ERROR 13: DynamoDB Missing KMS Encryption**
- Location: `_create_dynamodb_table`
- Issue: Table not encrypted with KMS customer-managed key
- Requirement: "All data must be encrypted at rest using AWS KMS customer-managed keys"
- Current: No `server_side_encryption` parameter
- Impact: Fails security compliance
- Fix: Add `server_side_encryption={'enabled': True, 'kms_key_arn': self.kms_key.arn}`

**ERROR 15: Using MySQL Instead of Aurora MySQL**
- Location: `_create_environment`
- Issue: `engine='mysql'` instead of `'aurora-mysql'`
- Requirement: "RDS Aurora MySQL 8.0 for transaction data"
- Current: Regular MySQL RDS (different service)
- Impact: Wrong database engine, different performance/pricing
- Fix: Change to `engine='aurora-mysql'`

**ERROR 16: Wrong Engine Version Format**
- Location: `_create_environment`
- Issue: `engine_version='8.0'` - wrong format for Aurora
- Current: Simplified version number
- Correct: `'8.0.mysql_aurora.3.02.0'` (Aurora-specific version)
- Impact: Deployment may fail or use wrong version
- Fix: Use proper Aurora MySQL version string

**ERROR 20: Insufficient Backup Retention**
- Location: `_create_environment`
- Issue: `backup_retention_period=3` - only 3 days
- Requirement: "AWS Backup plans with 7-day retention"
- Current: 3 days retention
- Impact: Doesn't meet requirement
- Fix: Change to `backup_retention_period=7`

**ERROR 21: Missing CloudWatch Logs Exports**
- Location: `_create_environment`
- Issue: No `enabled_cloudwatch_logs_exports` parameter
- Requirement: Audit logging for PCI DSS compliance
- Current: No log exports configured
- Impact: Missing audit trail, fails compliance
- Fix: Add `enabled_cloudwatch_logs_exports=['audit', 'error', 'general', 'slowquery']`

**ERROR 22: Only One Database Instance**
- Location: `_create_environment`
- Issue: Creating 1 instance instead of 2
- Requirement: High availability for payment processing
- Current: Single instance - single point of failure
- Impact: No redundancy, downtime if instance fails
- Fix: Create 2 instances in loop: `for i in range(2)`

### Category 3: Security Issues (Critical)

**ERROR 14: Overly Permissive Security Group**
- Location: `_create_environment`
- Issue: Database security group allows `0.0.0.0/0`
- Current: `'cidr_blocks': ['0.0.0.0/0']`
- Correct: `'cidr_blocks': ['10.0.0.0/16']` (VPC only)
- Impact: Database accessible from internet - major security risk!
- Severity: CRITICAL
- Fix: Restrict to VPC CIDR block only

**ERROR 17: Hardcoded Password**
- Location: `_create_environment`
- Issue: `master_password='SimplePassword123'` - plaintext, hardcoded
- Requirement: "Database credentials must be stored in AWS Secrets Manager"
- Current: Weak password in code
- Impact: Security vulnerability, credentials in source control
- Severity: CRITICAL
- Fix: Use `pulumi.Output.secret()` and reference Secrets Manager

**ERROR 18: Missing Storage Encryption**
- Location: `_create_environment`
- Issue: No `storage_encrypted=True` parameter
- Requirement: "All data must be encrypted at rest"
- Current: Unencrypted database storage
- Impact: Fails PCI DSS compliance, security violation
- Severity: CRITICAL
- Fix: Add `storage_encrypted=True`

**ERROR 19: Missing KMS Key for RDS**
- Location: `_create_environment`
- Issue: No `kms_key_id` parameter
- Requirement: "All data must be encrypted at rest using AWS KMS customer-managed keys"
- Current: Would use AWS managed key if encrypted
- Impact: Not using customer-managed keys as required
- Fix: Add `kms_key_id=self.kms_key.arn`

**ERROR 23: Wrong Instance Class**
- Location: `_create_environment`
- Issue: Using `db.t3.medium` instead of `db.r6g.large`
- Requirement: Memory-optimized instances for payment processing
- Current: General purpose, insufficient for production
- Impact: Poor performance, potential service degradation
- Fix: Change to `instance_class='db.r6g.large'`

**ERROR 24: Database Publicly Accessible**
- Location: `_create_environment`
- Issue: `publicly_accessible=True`
- Requirement: Databases must be in private subnets, not public
- Current: Database has public IP
- Impact: CRITICAL security vulnerability
- Severity: CRITICAL
- Fix: Change to `publicly_accessible=False`

### Category 4: Architecture/Design Flaws

**ERROR 25: Missing Health Check Configuration**
- Location: `_create_alb` (blue target group)
- Issue: No health_check parameter
- Current: Uses default health check (may not work)
- Impact: ALB can't determine target health, routes to failed targets
- Fix: Add comprehensive health_check configuration with /health endpoint

**ERROR 26: Missing Health Check Configuration**
- Location: `_create_alb` (green target group)
- Issue: No health_check parameter
- Current: Uses default health check
- Impact: Same as ERROR 25
- Fix: Add comprehensive health_check configuration

**ERROR 27: Simple Forward Instead of Weighted Routing**
- Location: `_create_alb`
- Issue: Listener uses simple forward action, not weighted
- Requirement: "Application Load Balancer with weighted target groups for traffic shifting"
- Current: `'type': 'forward', 'target_group_arn': blue_tg.arn`
- Correct: Should use weighted forward with both target groups
- Impact: Can't do blue-green deployments, can't shift traffic
- Severity: HIGH - breaks core requirement
- Fix: Use forward action with ForwardConfig containing both target groups with weights

**ERROR 28: Missing IAM Policy Attachments**
- Location: `_create_switch_lambda`
- Issue: Lambda role created but no policies attached
- Current: Only basic role, no permissions for ELB operations
- Impact: Lambda can't modify listener, switching fails
- Fix: Attach policies for elasticloadbalancing:ModifyListener, SSM, CloudWatch

**ERROR 29: Incomplete Lambda Code**
- Location: `_create_switch_lambda`
- Issue: Lambda returns "Hello from Lambda!" - no actual switching logic
- Requirement: "Lambda functions to handle environment switching logic"
- Current: Stub code, doesn't implement switching
- Impact: No way to switch environments, core feature missing
- Fix: Implement full switching logic with ALB listener modification

**ERROR 30: Older Python Runtime**
- Location: `_create_switch_lambda`
- Issue: Using `runtime='python3.9'`
- Current: Python 3.9 (older version)
- Best Practice: Use latest supported version (`python3.11`)
- Impact: Missing newer features, potential deprecation warnings
- Fix: Change to `runtime='python3.11'`

**ERROR 31: Lambda Timeout Too Short**
- Location: `_create_switch_lambda`
- Issue: `timeout=30` - only 30 seconds
- Requirement: Must complete switching and validation
- Current: May timeout during operations
- Impact: Incomplete switches, failed operations
- Fix: Increase to `timeout=60` or more

**ERROR 32: Lambda Memory Too Low**
- Location: `_create_switch_lambda`
- Issue: `memory_size=128` - minimum memory
- Current: May be insufficient for boto3 operations
- Impact: Slow performance, potential memory errors
- Fix: Increase to `memory_size=256` or more

**ERROR 33: Missing Environment Variables**
- Location: `_create_switch_lambda`
- Issue: No environment variables passed to Lambda
- Required: LISTENER_ARN, BLUE_TG_ARN, GREEN_TG_ARN, SSM_PARAM_NAME
- Current: Lambda has no way to know what resources to modify
- Impact: Lambda can't function, no resource references
- Fix: Add environment dict with all required ARNs and names

### Category 5: Missing Features

**ERROR 34: Missing Default Tags in Entry Point**
- Location: `tap.py`
- Issue: TapStackArgs created without tags parameter
- Requirement: All resources must have Environment, CostCenter, MigrationPhase tags
- Current: No tags passed from entry point
- Impact: Resources lack required tags
- Fix: Create default_tags dict and pass to TapStackArgs

**ERROR 35: Missing Required Outputs**
- Location: `tap.py`
- Issue: Only exporting alb_dns_name
- Requirement: "Implement stack outputs that display current active environment and migration status"
- Required Outputs:
  - vpc_id
  - blue_cluster_endpoint
  - green_cluster_endpoint
  - dynamodb_table_name
  - switch_lambda_name/arn
  - active_environment_parameter
  - kms_key_id
  - backup_vault_name
  - connection_info (composite)
- Current: Only 1 output
- Impact: Missing visibility into infrastructure
- Fix: Export all required outputs

**ERROR 36: Missing AWS Region Configuration**
- Location: `Pulumi.yaml`
- Issue: No AWS region specified in configuration
- Requirement: "Deployed in us-east-1"
- Current: No config section
- Impact: May deploy to wrong region or fail
- Fix: Add config section with `aws:region: us-east-1`

## Impact Analysis

### Critical Errors (Must Fix):
- ERROR 2: No KMS encryption
- ERROR 4: No Secrets Manager
- ERROR 14: Overly permissive security group
- ERROR 17: Hardcoded passwords
- ERROR 18: Missing storage encryption
- ERROR 24: Database publicly accessible
- ERROR 27: No weighted routing (breaks blue-green deployment)

### High Priority Errors:
- ERROR 1: Missing required tags
- ERROR 3: No VPC endpoints
- ERROR 5: No CloudWatch alarms
- ERROR 6: No backup plan
- ERROR 8: Single AZ (no HA)
- ERROR 29: No switching logic in Lambda

### Medium Priority Errors:
- ERROR 15-16: Wrong database engine/version
- ERROR 22: Only one database instance
- ERROR 25-26: Missing health checks
- ERROR 28: Missing Lambda permissions
- ERROR 33: Missing Lambda environment variables

### Low Priority Errors:
- ERROR 30: Older Python version
- ERROR 31-32: Lambda resource limits
- ERROR 34-36: Missing tags and outputs

## Compliance Violations

### PCI DSS Requirements Failed:
1. ERROR 2, 13, 18, 19: Encryption at rest not properly configured
2. ERROR 4, 17: Credentials not properly managed
3. ERROR 14, 24: Network security violations
4. ERROR 21: Missing audit logging

### Architectural Requirements Failed:
1. ERROR 8: Single AZ instead of 3
2. ERROR 22: Single database instance
3. ERROR 27: No traffic shifting capability
4. ERROR 29: No environment switching logic

### Operational Requirements Failed:
1. ERROR 5: No monitoring/alerting
2. ERROR 6: No backup/disaster recovery
3. ERROR 7, 35: No visibility into system state

## Testing Implications

This MODEL_RESPONSE with errors should:
1. Generate detailed error messages during validation
2. Fail security checks (encryption, network isolation)
3. Fail compliance checks (PCI DSS requirements)
4. Fail functional tests (blue-green switching)
5. Fail availability tests (single AZ, single instance)

The IDEAL_RESPONSE correctly implements all requirements and should pass all tests.

## Training Value

These errors represent common LLM mistakes:
1. Forgetting required security features (encryption, secrets management)
2. Incomplete implementations (missing components)
3. Wrong configuration values (security groups, versions)
4. Simplified architecture (fewer AZs, instances)
5. Missing monitoring and operational features
6. Hardcoded values instead of proper secret management
7. Not implementing core functionality (Lambda switching logic)

By comparing MODEL_RESPONSE and IDEAL_RESPONSE, the training system can learn to:
- Always include required security features
- Implement complete architectures, not simplified versions
- Use proper secret management
- Include monitoring and backup
- Implement all functional requirements
- Follow AWS best practices
