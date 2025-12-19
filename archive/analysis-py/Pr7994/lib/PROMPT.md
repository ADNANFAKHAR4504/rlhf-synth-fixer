Hey team,

We just acquired another company and inherited their AWS infrastructure. The problem is we have no clear picture of what's actually running across multiple accounts and regions. We need to audit everything for security issues, compliance violations, and get visibility into costs before we can make any changes.

The infrastructure is spread across development, staging, and production accounts in us-east-1. We're talking EC2 instances, RDS databases, S3 buckets, IAM roles, security groups, and multiple VPCs. Some of this stuff has been running for years with no oversight. We need a comprehensive analysis tool that can scan everything and generate detailed reports without touching the actual infrastructure.

I've been asked to build this using **Terraform with HCL** to leverage our existing Terraform tooling and state management. The goal is to create a read-only analysis system that produces actionable reports in JSON format.

## What we need to build

Create an infrastructure analysis tool using **Terraform with HCL** that audits existing AWS resources for security and compliance issues.

**IMPORTANT**: This task does NOT deploy new infrastructure. The Terraform configuration should use data sources to read existing resources and generate analysis reports as local JSON files.

### Analysis Requirements

1. **EC2 Instance Analysis**:
   - Identify all EC2 instances without required tags (Environment, Owner, CostCenter)
   - Calculate estimated monthly costs based on instance types
   - Flag instances in stopped state
   - Report instance distribution across availability zones

2. **Security Group Analysis**:
   - Scan all security groups for unrestricted inbound rules (0.0.0.0/0)
   - Identify security groups allowing SSH (port 22) or RDP (port 3389) from anywhere
   - Flag unused security groups not attached to any resources
   - Check for overly permissive outbound rules

3. **S3 Bucket Analysis**:
   - Check all buckets for missing encryption configuration
   - Verify versioning is enabled
   - Identify public buckets or buckets with public access
   - Check for lifecycle policies and retention settings

4. **IAM Role Analysis**:
   - Identify roles with policies containing wildcard (*) permissions on resources
   - Flag roles with AdministratorAccess or overly broad permissions
   - Check for roles that haven't been used recently
   - Analyze trust relationships for security issues

5. **VPC Analysis**:
   - Generate report showing all subnets with their CIDR blocks
   - Identify unused subnets with no resources attached
   - Check for VPCs without flow logs enabled
   - Analyze route tables for internet gateway exposure

6. **RDS Analysis**:
   - Validate that all RDS instances have automated backups enabled
   - Check backup retention periods (minimum 7 days)
   - Verify encryption at rest is enabled
   - Check for publicly accessible RDS instances

7. **Cost Estimation**:
   - Calculate estimated monthly costs for all EC2 instances
   - Provide cost breakdown by instance type and size
   - Identify top 10 most expensive resources
   - Include recommendations for cost optimization

8. **Report Generation**:
   - Create separate JSON reports for each analysis category
   - Generate a main summary.json with total resource counts
   - Include compliance violations count and severity
   - Provide actionable recommendations for remediation

### Technical Requirements

- All analysis implemented using **Terraform with HCL**
- Use Terraform data sources to query existing AWS resources
- Generate reports as local_file resources in JSON format
- No resources should be created or modified in AWS
- Support for multi-account analysis via assume role
- Reports must be written to an outputs directory
- Use Terraform's built-in JSON encoding functions
- Include timestamps in all reports

### Deployment Requirements (CRITICAL)

- Resource names must include **environmentSuffix** for uniqueness across environments
- All generated files must be destroyable (terraform destroy should clean up all local files)
- Use **RemovalPolicy: DESTROY** equivalent for all local files
- FORBIDDEN: Do NOT use any retention policies that prevent cleanup
- Reports should include environment suffix in filenames

### Environment Variables

- ENVIRONMENT_SUFFIX: Environment identifier (default: dev)
- AWS_REGION: Target AWS region (default: us-east-1)

### Constraints

- Use only Terraform data sources (no external scripts in main logic)
- All reports must be valid JSON format
- Security group analysis must validate against company policy
- Tag compliance must check for Environment, Owner, and CostCenter tags
- IAM analysis must flag wildcard resource permissions
- Analysis must complete without modifying existing infrastructure
- Support for Terraform 1.5+ with AWS provider 5.x

## Success Criteria

- Terraform configuration successfully queries all required AWS services
- Data sources retrieve EC2, S3, IAM, VPC, RDS, and security group information
- JSON reports generated for each analysis category
- summary.json includes total resources analyzed and critical findings
- No AWS resources created or modified during analysis
- Cost estimation calculations accurate for standard instance types
- Tag compliance violations correctly identified
- Security group rules validated against policy
- All reports include actionable remediation recommendations
- Configuration works across multiple accounts with assume role

## What to deliver

- Complete Terraform HCL configuration files
- Data sources for EC2, S3, IAM, VPC, RDS, Security Groups
- Local file resources for JSON report generation
- Variables for environment suffix and configuration
- Outputs displaying analysis summary
- README with usage instructions and report descriptions
