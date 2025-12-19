Hey team,

We need to build an infrastructure compliance validation system that can analyze existing AWS infrastructure and generate comprehensive compliance reports. The business wants this to be a read-only analysis tool that doesn't modify anything but gives us complete visibility into what's misconfigured or non-compliant across our AWS accounts.

This is for our security and governance team who needs to audit AWS resources across multiple accounts. They want automated checks for best practices around EC2, RDS, S3, VPC, and IAM configurations. The key challenge here is that Terraform's data sources have limitations - we can't just query all resources of a type automatically. Instead, we need users to provide lists of resource identifiers they want to analyze.

The previous attempt at this failed because it tried to use non-existent data sources like `data "aws_s3_buckets"` and `data "aws_iam_role_policy"` which don't exist in the AWS provider. We need to be extremely careful to only use valid data sources and work within Terraform's constraints.

## What we need to build

Create an infrastructure compliance validation system using **Terraform with HCL** that performs read-only analysis of existing AWS resources and generates detailed compliance reports.

### Core Requirements

1. **EC2 Instance Validation**
   - Query EC2 instances using data sources with user-provided instance IDs or filters
   - Validate instances use approved AMIs from a predefined allow-list
   - Check for required tags on production instances
   - Report instances that don't meet compliance standards

2. **RDS Database Compliance**
   - Analyze RDS instances specified by user-provided identifiers
   - Ensure automated backups are enabled with retention period of at least 7 days
   - Verify encryption at rest is enabled
   - Check for proper backup windows and maintenance windows
   - Validate multi-AZ deployment for production databases

3. **S3 Bucket Security Analysis**
   - Query S3 buckets using user-provided bucket names
   - Verify server-side encryption is enabled on all buckets
   - Check versioning is enabled on production buckets
   - Validate bucket policies don't allow public access
   - Ensure logging is configured appropriately

4. **VPC Security Validation**
   - Query VPC configurations and security groups
   - Ensure default security groups are not in use
   - Validate no security groups have overly permissive rules (0.0.0.0/0 on sensitive ports)
   - Check for proper network segmentation

5. **IAM Security Checks**
   - Analyze IAM roles provided by user input
   - Validate no policies contain wildcard actions on production resources
   - Check for overly permissive assume role policies
   - Ensure least privilege principles are followed

6. **Compliance Reporting**
   - Generate structured JSON output with all findings
   - Categorize issues by severity: critical, high, medium, low
   - Include resource details, issue description, and remediation guidance
   - Create summary statistics for dashboard integration

7. **Validation Module Design**
   - Create reusable validation module that works across AWS accounts
   - Use lifecycle preconditions to prevent apply if critical misconfigurations found
   - Make module configurable with different compliance standards

8. **Terraform Plan Integration**
   - Generate terraform plan output that shows what would need fixing
   - Use check blocks for validation (Terraform 1.5+)
   - Ensure no resources are created or modified - read-only analysis only

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **EC2** data sources for instance analysis
- Use **RDS** data sources for database validation
- Use **S3** data sources for bucket security checks
- Use **VPC** data sources for network configuration validation
- Use **IAM** data sources for permissions analysis
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`

### Critical Terraform Constraints

CRITICAL: This task requires careful handling of Terraform data sources. You MUST follow these constraints:

1. **Invalid Data Sources - DO NOT USE**:
   - `data "aws_s3_buckets"` - DOES NOT EXIST
   - `data "aws_iam_role_policy"` as data source - IT'S A RESOURCE, NOT DATA SOURCE

2. **Valid Approaches**:
   - Accept resource identifiers via input variables (bucket names, instance IDs, role names)
   - Use `for_each` with user-provided lists to query individual resources
   - Use `data "aws_instances"` for EC2 discovery (this exists)
   - Use `data "aws_security_groups"` with filters
   - Use `data "aws_vpcs"` for VPC discovery
   - Query individual resources using their specific data sources

3. **Input Variable Pattern**:
   ```hcl
   variable "s3_bucket_names" {
     type        = list(string)
     description = "List of S3 bucket names to analyze"
     default     = []
   }

   data "aws_s3_bucket" "analysis" {
     for_each = toset(var.s3_bucket_names)
     bucket   = each.value
   }
   ```

4. **Alternative Discovery Pattern**:
   - Use `data "external"` with AWS CLI for resource discovery
   - Parse JSON output and iterate over results
   - Document this approach requires AWS CLI installed

### Deployment Requirements (CRITICAL)

1. **Environment Suffix**: All named resources, modules, and outputs must include the environmentSuffix parameter for uniqueness across deployments
2. **Destroyability**: All resources must be destroyable - NO RemovalPolicy: RETAIN or DeletionPolicy: Retain policies allowed
3. **Read-Only Analysis**: This is a validation tool - it should NOT create or modify any AWS resources
4. **Input Variables Required**: Users MUST provide resource identifiers via terraform.tfvars

### Constraints

- All analysis must be read-only - no resource creation or modification
- Must work with Terraform 1.5+ for check blocks
- Validation logic must be deterministic and repeatable
- Report generation must be automated via outputs
- Module must be reusable across different AWS accounts
- Must handle missing resources gracefully without failing
- All resources must be destroyable (no Retain policies)
- Performance: Analysis should complete in under 5 minutes for typical workloads

## Success Criteria

- **Functionality**: Successfully analyzes all specified AWS resources (EC2, RDS, S3, VPC, IAM)
- **Accuracy**: Correctly identifies compliance violations based on defined standards
- **Reporting**: Generates structured JSON report with findings categorized by severity
- **Validation**: Uses lifecycle preconditions to prevent apply on critical issues
- **Modularity**: Reusable validation module that works across accounts
- **Documentation**: Clear instructions on how to provide resource identifiers
- **Resource Naming**: All outputs and modules include environmentSuffix
- **Code Quality**: Clean HCL code, well-structured, properly commented
- **No Modifications**: Terraform plan shows zero resources to create/modify/destroy

## What to deliver

- Complete Terraform HCL implementation with validation logic
- Variables.tf with all required input variable definitions
- Outputs.tf generating structured JSON compliance report
- Main.tf orchestrating all data source queries and validations
- Validation module in modules/compliance-validator/
- README.md with setup instructions and variable documentation
- Example terraform.tfvars showing how to provide resource identifiers
- Documentation explaining the input variable requirement and why it's necessary
