Hey team,

We recently acquired a company and inherited their AWS infrastructure, and the DevOps team needs a way to validate all these resources against our compliance standards. The acquired infrastructure includes EC2 instances, RDS databases, S3 buckets, and various networking components, but we have no idea if they follow our security policies, tagging requirements, or cost optimization practices.

I've been asked to create an infrastructure analysis tool using **Terraform with HCL**. The goal is to scan existing AWS resources without modifying them and generate detailed compliance reports that we can feed into our CI/CD pipeline and monitoring systems.

The business wants to ensure that every resource meets our standards before we fully integrate this infrastructure into our operations. They're particularly concerned about security groups that might allow unrestricted access, missing backups on databases, unencrypted S3 buckets, and resources that lack proper cost center tags for billing.

## What we need to build

Create an infrastructure analysis and validation tool using **Terraform with HCL** that performs comprehensive compliance checks on existing AWS resources.

**IMPORTANT**: This task is about analyzing infrastructure, NOT deploying it. The solution should use Terraform data sources to query existing resources and perform validation checks without creating or modifying anything.

### Core Requirements

1. **Module Structure**
   - Create a reusable Terraform module that accepts resource ARNs or IDs as input
   - Module should work across different environments using environment_suffix parameter
   - Support analysis of multiple resource types in a single run

2. **EC2 Instance Validation**
   - Check that instances use only approved types: t3.micro, t3.small, t3.medium
   - Flag instances using unapproved instance types
   - Calculate estimated monthly costs based on instance type
   - Generate warnings for instances exceeding $100/month estimated cost

3. **RDS Database Validation**
   - Verify automated backups are enabled
   - Check backup retention period is at least 7 days
   - Report databases failing backup requirements

4. **S3 Bucket Security Validation**
   - Verify versioning is enabled on all buckets
   - Check server-side encryption is configured
   - Report non-compliant buckets

5. **Security Group Analysis**
   - Scan security group rules for unrestricted inbound access (0.0.0.0/0)
   - Allow port 80 and 443 from anywhere (standard web traffic)
   - Flag any other ports with unrestricted access as violations

6. **Tagging Compliance**
   - Verify all resources have mandatory tags: Environment, Owner, CostCenter, Project
   - Report resources with missing required tags
   - Calculate compliance percentage

7. **Cost Analysis**
   - Calculate estimated monthly costs for EC2 instances
   - Sum total estimated monthly infrastructure costs
   - Break down costs by resource type

8. **Compliance Reporting**
   - Generate structured output showing pass/fail for each check
   - Provide detailed violation lists with resource identifiers
   - Include summary metrics: total resources analyzed, compliance percentage
   - Output must be machine-readable for CI/CD integration

9. **Data Sources**
   - Use Terraform data sources to query existing infrastructure
   - Read from existing state files or directly query AWS
   - Perform non-destructive validation only

10. **Terraform Best Practices**
    - Use for_each loops to analyze multiple resources efficiently
    - Implement local values for cost calculations
    - Use validation blocks and precondition/postcondition checks where appropriate
    - Create structured output variables for all compliance metrics

### Technical Requirements

- Analysis module built using **Terraform with HCL**
- Target region: us-east-1
- Terraform version: 1.5 or higher
- AWS provider version: 5.x
- Use data sources exclusively (no resource creation)
- Module should accept environment_suffix variable for resource discovery
- Resource naming pattern for discovery: {resource-name}-{environment_suffix}
- Read-only IAM permissions assumed
- All outputs must be structured JSON-compatible formats

### Constraints

- Module must be reusable across different infrastructure configurations
- Use only Terraform built-in functions and data sources for analysis
- Use for_each loops to handle multiple resource configurations
- No resources should be created or modified during analysis
- All cost estimates should use current AWS pricing for us-east-1
- Validation checks must be implemented using Terraform's native capabilities

## Success Criteria

- Analysis module successfully queries existing AWS infrastructure
- All validation checks (EC2, RDS, S3, security groups, tags) execute correctly
- Compliance reports generated with pass/fail status for each check
- Cost estimates calculated accurately for EC2 instances
- Summary metrics show total resources analyzed and compliance percentage
- Outputs are structured and machine-readable
- Module works with environment_suffix pattern for resource discovery
- No infrastructure created or modified during analysis
- Proper error handling for missing or inaccessible resources

## What to deliver

- Complete Terraform HCL module for infrastructure analysis
- Main module file with data sources and validation logic
- Variables file defining input parameters
- Outputs file with structured compliance reports and metrics
- Local values for cost calculations and intermediate processing
- Documentation explaining how to use the analysis module
- Example usage showing how to run analysis against existing infrastructure