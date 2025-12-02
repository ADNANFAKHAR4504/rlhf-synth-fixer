# Infrastructure Compliance Analysis Script

Hey team,

We need to build an infrastructure compliance analysis tool for our AWS environments. The business has been asking for better visibility into our security and compliance posture, and manual audits are taking too long. I've been asked to create this using **Pulumi with TypeScript** to integrate with our existing automation platform.

The goal is to create a comprehensive compliance scanner that can analyze deployed AWS resources across multiple accounts and regions. The compliance team needs to track things like EC2 instance tagging standards, S3 bucket security configurations, deprecated instance types, security group rules, CloudWatch Logs retention policies, and IAM MFA enforcement. Right now, they're doing this manually through the console, which is error-prone and doesn't scale.

We need an automated solution that can scan infrastructure daily, generate detailed compliance reports in JSON format, and push compliance metrics to CloudWatch so we can set up alerts and dashboards.

## What we need to build

Create an infrastructure compliance analysis script using **Pulumi with TypeScript** for automated AWS resource scanning and compliance reporting.

### Core Requirements

1. **EC2 Instance Tag Compliance**
   - Scan all EC2 instances in the target region
   - Check if each instance has required tags: Environment, Owner, CostCenter
   - Report instances missing any required tags with instance IDs and current tag sets

2. **S3 Bucket Security Checks**
   - Verify all S3 buckets have encryption enabled
   - Verify all S3 buckets have versioning configured
   - Report non-compliant buckets with specific violations

3. **Deprecated Instance Type Detection**
   - Check that no EC2 instances use deprecated instance types
   - Flagged types: t2.micro, t2.small
   - Report instances using deprecated types with recommendations for modern alternatives

4. **Security Group Rule Validation**
   - Scan all security groups for overly permissive rules
   - Ensure no security groups allow inbound traffic from 0.0.0.0/0 on port 22 (SSH)
   - Ensure no security groups allow inbound traffic from 0.0.0.0/0 on port 3389 (RDP)
   - Report security groups with violations including rule details

5. **CloudWatch Logs Retention Policy**
   - Validate that all CloudWatch log groups have retention set to at least 30 days
   - Report log groups with shorter retention or no retention policy
   - Include log group names and current retention settings

6. **IAM MFA Enforcement**
   - Check that all IAM users have MFA (Multi-Factor Authentication) enabled
   - Report users without MFA including username and account details
   - Include last login information if available

7. **Compliance Report Generation**
   - Generate comprehensive JSON report listing all non-compliant resources
   - Include violation details, severity levels, and remediation guidance
   - Structure report by service category with summary statistics
   - Save report to local file and optionally to S3

8. **CloudWatch Custom Metrics**
   - Create CloudWatch custom metrics for compliance score per service
   - Calculate compliance percentage (compliant resources / total resources)
   - Push metrics for: EC2 compliance, S3 compliance, IAM compliance, Network compliance
   - Include overall infrastructure compliance score

### Technical Requirements

- All analysis code implemented using **Pulumi with TypeScript**
- Use AWS SDK for JavaScript v3 for resource scanning
- Use AWS SDK clients: EC2, S3, CloudWatch, CloudWatch Logs, IAM, SecurityGroups
- Resource naming must include **environmentSuffix** for multi-environment support
- Follow naming convention: `compliance-scanner-{environmentSuffix}`
- Deploy to **us-east-1** region (configurable)
- Support dry-run mode for testing without publishing metrics
- Include proper error handling for API throttling and missing permissions
- Generate human-readable console output and JSON file output

### Constraints

- Must handle AWS API pagination for large resource sets
- Must handle rate limiting with exponential backoff
- Must run without requiring infrastructure deployment (analysis only)
- Must support multiple AWS accounts via role assumption
- Must complete scan within 5 minutes for typical environments
- All resources scanned must respect AWS service quotas
- Include proper IAM permission requirements documentation
- Error handling for missing permissions should be graceful (skip service, log warning)

### Success Criteria

- **Functionality**: Successfully scans all specified AWS services and generates accurate compliance reports
- **Performance**: Completes full compliance scan in under 5 minutes for environments with up to 100 resources
- **Reliability**: Handles API failures gracefully with retries and clear error messages
- **Security**: Uses read-only AWS permissions, no resource modifications
- **Reporting**: Generates comprehensive JSON report with all required fields
- **Metrics**: Successfully publishes CloudWatch custom metrics with compliance scores
- **Resource Naming**: Uses environmentSuffix for metric namespaces and report file names
- **Code Quality**: TypeScript, well-tested, documented with usage examples

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- AWS SDK integration for EC2, S3, IAM, Security Groups, CloudWatch Logs, CloudWatch
- Compliance analysis logic for all 8 requirement categories
- JSON report generation with structured violation data
- CloudWatch custom metrics publishing
- Unit tests for compliance check functions
- Integration tests for AWS SDK interactions (with mocked responses)
- Documentation including required IAM permissions and usage examples
- README.md with setup instructions and example reports
