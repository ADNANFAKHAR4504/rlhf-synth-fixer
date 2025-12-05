# Infrastructure Compliance Analysis System

Hey team,

We need to build a compliance analysis system for our AWS infrastructure. The business has been asking for better visibility into security misconfigurations and compliance violations across our resources, and we've been manually checking these things which is error-prone and time-consuming. I've been asked to create this in TypeScript using Pulumi to automate the whole process.

The regulatory team is particularly concerned about encryption compliance, overly permissive security groups, IAM least-privilege violations, and missing tags that we need for cost allocation. They want a systematic way to scan our existing infrastructure and generate reports that show exactly what's wrong and where. We also need to track these violations over time using CloudWatch metrics so we can spot trends and respond quickly.

This isn't about deploying new application infrastructure - it's about analyzing what we already have running and making sure it meets our security and compliance standards. The compliance team needs both a detailed JSON report for their audit trail and CloudWatch metrics for ongoing monitoring and alerting.

## What we need to build

Create an infrastructure compliance scanner using **Pulumi with TypeScript** that analyzes existing AWS resources and reports violations.

### Core Requirements

1. **EC2 Instance Analysis**
   - Scan all EC2 instances in the account
   - Identify instances with unencrypted EBS volumes
   - Check for missing required tags: Environment, Owner, CostCenter
   - Report instance IDs and violation details

2. **Security Group Analysis**
   - Examine all VPC security groups
   - Flag overly permissive inbound rules (0.0.0.0/0 access on non-standard ports)
   - Allow 0.0.0.0/0 only for ports 80 and 443 (standard HTTP/HTTPS)
   - Verify all security groups have descriptions
   - Report security group IDs and specific rule violations

3. **IAM Role Compliance**
   - Review all IAM roles in the account
   - Verify each role has at least one policy attached
   - Check for least-privilege principles (roles with overly broad permissions)
   - Identify unused or dormant roles

4. **VPC Flow Logs Verification**
   - Check all VPCs in the region
   - Verify CloudWatch logging is enabled for VPC flow logs
   - Report VPCs missing flow log configuration

5. **Compliance Reporting**
   - Generate a comprehensive JSON report containing all violations found
   - Structure report by violation type with resource details
   - Include timestamp, region, and summary statistics
   - Store report in S3 bucket for audit trail

6. **CloudWatch Metrics Integration**
   - Create custom CloudWatch metrics for each violation type
   - Track metrics: UnencryptedVolumes, PermissiveSecurityGroups, MissingTags, IAMViolations, MissingFlowLogs
   - Enable trending and alerting capabilities
   - Use appropriate metric dimensions for filtering

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS SDK for JavaScript v3** for resource discovery and analysis
- Use **EC2** API for instance and volume inspection
- Use **VPC** API for security group and flow log analysis
- Use **IAM** API for role and policy inspection
- Use **CloudWatch** API for custom metrics
- Use **S3** for compliance report storage
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- Use Lambda function for analysis logic (can be scheduled)

### Constraints

- Must analyze existing resources, not deploy new application infrastructure
- Security group analysis: only flag 0.0.0.0/0 on ports OTHER than 80/443
- IAM analysis must respect AWS managed policies vs customer managed policies
- All resources must be destroyable (no Retain policies)
- Include proper error handling for API rate limits and permissions
- Efficient scanning (paginate large result sets properly)
- Report generation must handle zero violations gracefully

### Deployment Requirements (CRITICAL)

- All resource names MUST include environmentSuffix parameter for uniqueness
- Use RemovalPolicy.DESTROY or equivalent (FORBIDDEN to use RETAIN)
- Lambda functions must properly handle AWS SDK v3 imports
- S3 buckets must have appropriate lifecycle policies

## Success Criteria

- **Functionality**: System successfully scans all specified AWS resource types
- **Accuracy**: Correctly identifies violations based on defined rules
- **Performance**: Completes full account scan within reasonable time (under 5 minutes)
- **Reporting**: Generates valid JSON report with all violation details
- **Metrics**: CloudWatch custom metrics properly recorded with correct values
- **Resource Naming**: All Pulumi-managed resources include environmentSuffix
- **Code Quality**: TypeScript code, well-structured, includes error handling
- **Documentation**: Clear deployment instructions and usage guide

## What to deliver

- Complete Pulumi TypeScript implementation in lib/
- Lambda function code for compliance analysis logic
- S3 bucket for report storage with appropriate permissions
- CloudWatch Logs configuration for Lambda execution logs
- IAM roles and policies for Lambda execution
- CloudWatch custom metrics namespace configuration
- Unit tests covering analysis logic
- Integration tests validating actual AWS resource scanning
- Documentation: deployment steps, configuration options, report format
