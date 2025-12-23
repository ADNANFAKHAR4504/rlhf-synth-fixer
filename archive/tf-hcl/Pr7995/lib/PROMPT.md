Hey team,

We've got a challenging situation with a financial services client. They've discovered configuration drift between their Terraform state and actual AWS resources after several manual console changes were made during incident response. The compliance team is concerned about potential violations, and we need to implement comprehensive infrastructure validation checks.

The goal is to build validation infrastructure using **Terraform with HCL** that leverages Terraform 1.5+ native validation features. This isn't about deploying new infrastructure - it's about validating existing infrastructure against compliance requirements using preconditions, postconditions, checks, and data sources.

What makes this interesting is that we're dealing with a production environment in us-east-1 that has EC2 instances, S3 buckets, RDS databases, and load balancers. Some resources were deployed through Terraform, others manually through the console. The financial services compliance requirements are strict, and we need to catch drift before audits do.

## What we need to build

Create infrastructure validation configuration using **Terraform with HCL** that implements comprehensive compliance checks for existing AWS infrastructure.

### Core Requirements

1. **EC2 Instance Validation**
   - Validate EC2 instances use only approved AMI IDs from a variable list
   - Implement precondition checks to prevent deployments with unapproved AMIs
   - Query existing instances using data sources and validate against approved list

2. **S3 Bucket Compliance Checks**
   - Verify all S3 buckets have versioning enabled
   - Ensure lifecycle policies exist on all buckets
   - Use data sources to query existing S3 infrastructure
   - Compare actual configurations against expected compliance requirements

3. **Security Group Validation**
   - Create postcondition checks on security group resources
   - Ensure no ingress rules allow unrestricted access (0.0.0.0/0)
   - Validate security group configurations match security baseline

4. **Tag Compliance Validation**
   - Validate all resources have required tags: Environment, Owner, CostCenter, DataClassification
   - Implement checks that verify tag compliance patterns
   - Report missing or incorrect tags in validation output

5. **Validation Reporting**
   - Generate structured JSON-formatted validation report as Terraform output
   - Include pass/fail status for each validation check
   - Provide detailed error messages for failures
   - Make output consumable by CI/CD pipelines

6. **Reusable Validation Module**
   - Create modular validation configuration that can be reused across environments
   - Support different environment configurations through variables
   - Make validation checks environment-aware

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Must use Terraform 1.5+ features: preconditions, postconditions, checks blocks
- Use AWS provider 5.x
- Deploy to **us-east-1** region
- Use data sources to query existing infrastructure and compare against Terraform state
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: validation-checker-${var.environment_suffix}
- All resources must be destroyable (no deletion protection)
- NO external scripts or tools - pure Terraform native features only

### Deployment Requirements (CRITICAL)

- All resource names MUST include var.environment_suffix for multi-environment support
- Example: validation-checker-${var.environment_suffix}
- All resources MUST be destroyable: no retention policies, no deletion protection
- FORBIDDEN: Any retain_on_delete=true, prevent_destroy=true, or skip_final_snapshot=false
- Resources must be testable and fully removable for CI/CD cleanup

### Constraints

**Mandatory**:
- Ensure all S3 buckets have versioning enabled and lifecycle policies defined
- Use only Terraform native features without external tools or scripts
- Use data sources to compare existing infrastructure against Terraform state

**Additional validation requirements**:
- Check that security groups do not have unrestricted ingress rules (0.0.0.0/0)
- Implement validation rules that check for specific tag compliance patterns
- Verify that all EC2 instances are using approved AMI IDs from a predefined list
- Generate a validation report output that can be consumed by CI/CD pipelines
- Create postcondition checks to verify resource configurations after deployment

## Success Criteria

- Validation configuration successfully queries existing AWS infrastructure
- Preconditions prevent invalid configurations from being applied
- Postconditions verify resource compliance after operations
- Data sources accurately retrieve existing infrastructure state
- Validation report clearly indicates compliance status
- Tag compliance checks identify missing or incorrect tags
- S3 bucket validation confirms versioning and lifecycle policies
- Security group checks prevent unrestricted access rules
- EC2 AMI validation enforces approved image usage
- Modular design allows reuse across different environments
- All resources include environmentSuffix in naming
- Code quality: well-structured HCL, properly documented, testable

## What to deliver

- Complete Terraform HCL implementation with validation logic
- validation.tf with preconditions, postconditions, and checks
- variables.tf defining configurable validation parameters
- outputs.tf generating structured validation reports
- data.tf with data sources for querying existing infrastructure
- Documentation explaining validation approach and usage
- Support for multiple environments through variable configuration
