# Ideal Response - Cross-Region Migration Infrastructure

## Task Overview
Implement zero-downtime cross-region migration for payment processing infrastructure from us-east-1 to eu-west-1 using cdktf (Terraform CDK) with Python and correct dictionary-based API patterns.

## Key Success Factors

### 1. Correct CDKTF API Pattern Usage
All resources must use dictionary-based configuration (NOT class-based) in Python code:
- Security Groups: `ingress=[{dict}]` not `ingress=[Class()]`
- Route Tables: Inline `route=[{dict}]` not separate `aws_route` resources
- Launch Templates: `iam_instance_profile={dict}` not `IamInstanceProfile()` class
- Auto Scaling Groups: `tag=[{dict}]` not `Tag()` class
- Load Balancers: `health_check={dict}` and `default_action=[{dict}]`
- Route 53: `weighted_routing_policy={dict}` and `alias={dict}`
- CloudWatch: `dimensions={dict}` not `Dimensions()` class
- VPC Peering: Use `VpcPeeringConnectionAccepterA` (with 'A' suffix)

Example Python code structure:
```python
from cdktf import TerraformStack
from cdktf_cdktf_provider_aws.vpc import Vpc
```

### 2. Complete Infrastructure Implementation
All 10 requirements must be implemented:
1. VPC infrastructure in eu-west-1 (3 AZs, 6 subnets, IGW, 3 NAT gateways, route tables)
2. Aurora Global Database Cluster (MySQL 8.0, primary in us-east-1, secondary in eu-west-1, 2 instances)
3. EC2 Auto Scaling groups (t3.medium, 2-6 instances, containerized payment processor)
4. Application Load Balancer (internet-facing, health checks, HTTPS listener)
5. Route 53 weighted routing (100% us-east-1, 0% eu-west-1 initially)
6. CloudWatch alarms (replication lag, EC2 health)
7. Step Functions state machine (migration workflow with 25/50/75/100% phases)
8. Migration runbook as output (AWS CLI commands for weight adjustments)
9. VPC peering (us-east-1 <-> eu-west-1 with route table updates)
10. KMS key (encryption at rest, cross-region policy, key rotation)

### 3. Comprehensive Testing
- 100% test coverage (statements, functions, lines)
- Unit tests validating:
  - All resources created correctly
  - Dictionary-based API patterns used
  - No class-based constructs
  - Inline routes (no separate aws_route)
  - Correct resource counts
  - All outputs defined
- Integration tests validating:
  - Deployment success
  - All outputs present and valid format
  - Resource naming consistency
  - Migration runbook completeness

### 4. Proper Resource Configuration
- All resources include `environment_suffix` in names
- All resources are destroyable (no retention policies):
  - RDS: `skip_final_snapshot=True`
  - ALB: `enable_deletion_protection=False`
  - KMS: `deletion_window_in_days=7`
  - Route53: `force_destroy=True`
- Security groups with proper ingress/egress rules
- IAM roles with correct policies
- Proper depends_on relationships

### 5. Complete Documentation
- **PROMPT.md**: Clear task description with all requirements and API pattern examples
- **MODEL_FAILURES.md**: Detailed analysis of previous failures and root causes
- **IDEAL_RESPONSE.md**: Success criteria and quality standards
- **MODEL_RESPONSE.md**: Current implementation with resource summaries
- Migration runbook with:
  - Pre-migration checklist
  - 4-phase traffic shift commands
  - Monitoring commands
  - Rollback procedures
  - Database failover steps

## Expected Outputs

### Infrastructure Outputs (14 total)
1. `vpc_id`: VPC identifier in eu-west-1
2. `vpc_cidr`: VPC CIDR block (10.1.0.0/16)
3. `public_subnet_ids`: List of 3 public subnet IDs
4. `private_subnet_ids`: List of 3 private subnet IDs
5. `aurora_cluster_endpoint`: Aurora writer endpoint
6. `aurora_cluster_reader_endpoint`: Aurora reader endpoint
7. `alb_dns_name`: ALB DNS name
8. `asg_name`: Auto Scaling Group name
9. `route53_zone_id`: Hosted zone ID
10. `state_machine_arn`: Step Functions state machine ARN
11. `vpc_peering_id`: VPC peering connection ID
12. `kms_key_id`: KMS key ID
13. `kms_key_arn`: KMS key ARN
14. `migration_runbook`: Complete migration guide with CLI commands

### Code Quality Metrics
- Lint score: >= 9.0/10
- Test coverage: 100% (statements, functions, lines)
- Build: Success (no errors)
- Synth: Success (generates valid Terraform JSON)
- All tests passing: 0 failures

### Deployment Success
- All resources created successfully
- No deployment errors
- All outputs populated with valid values
- Resources accessible and configured correctly

## Quality Standards

### Code Organization
- Clear separation of concerns
- Logical resource grouping
- Proper import statements
- Clean, readable code with comments

### Testing Standards
- Each major resource has dedicated tests
- API pattern correctness tests
- Resource count validation tests
- Output validation tests
- Integration tests using real deployment outputs

### Documentation Standards
- Complete PROMPT.md with all requirements
- Detailed MODEL_FAILURES.md with root cause analysis
- Comprehensive IDEAL_RESPONSE.md with success criteria
- Accurate MODEL_RESPONSE.md reflecting implementation

## Training Quality Requirements

For training_quality >= 8, the response must demonstrate:

1. **Correct API Understanding**: 100% dictionary-based patterns, zero class-based errors
2. **Complete Requirements**: All 10 infrastructure requirements implemented
3. **Production Readiness**: Deployable, testable, destroyable
4. **Best Practices**: Security groups, IAM policies, encryption, monitoring
5. **Operational Excellence**: Migration runbook, rollback procedures, monitoring commands
6. **Testing Rigor**: 100% coverage, comprehensive test suites
7. **Documentation Quality**: Clear, detailed, actionable documentation

## What Makes This Response "Ideal"

1. **No API Pattern Errors**: Zero CDKTF vs CDK confusion
2. **Complete Feature Set**: Every requirement implemented, not just partial
3. **Testable Design**: Unit + integration tests with full coverage
4. **Deployable Code**: Works on first deployment attempt
5. **Maintainable Structure**: Clear organization, good naming, proper comments
6. **Operational Readiness**: Migration runbook, monitoring, rollback procedures
7. **Learning Artifacts**: Detailed documentation for future training

## Common Pitfalls to Avoid

1. Using class-based constructs for configuration
2. Creating separate aws_route resources instead of inline routes
3. Missing environment_suffix in resource names
4. Retention policies that prevent resource deletion
5. Incomplete test coverage
6. Missing integration tests
7. Incomplete migration runbook
8. Wrong VPC Peering Accepter class name (without 'A')
9. Missing cross-region KMS policy
10. Not validating dictionary-based API patterns in tests

## Validation Checklist

Before considering the task complete, verify:
- [ ] All 10 infrastructure requirements implemented
- [ ] All dictionary-based API patterns used correctly
- [ ] No class-based constructs in configuration
- [ ] Inline routes in route tables
- [ ] VpcPeeringConnectionAccepterA (with 'A')
- [ ] 100% test coverage achieved
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Deployment successful
- [ ] All 14 outputs present
- [ ] Migration runbook complete
- [ ] Documentation complete (PROMPT, FAILURES, IDEAL, RESPONSE)
- [ ] Lint score >= 9.0
- [ ] Training quality >= 8