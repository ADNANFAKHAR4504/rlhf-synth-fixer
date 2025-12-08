Hey team,

We need to build an infrastructure compliance scanner that analyzes our existing AWS resources in production. The security and compliance teams have been asking for automated visibility into our EC2 infrastructure, and we need something that can run regularly to catch issues before they become problems. I've been asked to create this using TypeScript with Pulumi, leveraging the AWS SDK to scan existing resources rather than creating new ones.

The goal is to identify common compliance violations across our EC2 fleet - things like unencrypted volumes, overly permissive security groups, missing mandatory tags, unapproved AMIs, and disabled monitoring. We also need to track compliance metrics in CloudWatch so the operations team can set up dashboards and alerts.

This is essentially a read-only infrastructure scanner that generates comprehensive compliance reports. It needs to be thorough but also fast enough to run in CI/CD pipelines or as scheduled Lambda functions.

## What we need to build

Create an AWS infrastructure compliance scanner using **Pulumi with TypeScript** that analyzes existing resources and identifies violations.

### Core Requirements

1. **EBS Volume Encryption Analysis**
   - Scan all EC2 instances in the specified region
   - Identify any instances with unencrypted EBS volumes
   - Report volume IDs and associated instance details

2. **Security Group Validation**
   - Examine all security groups attached to EC2 instances
   - Flag groups with unrestricted inbound rules (0.0.0.0/0) on sensitive ports
   - Specifically check ports 22 (SSH), 3389 (RDP), and 3306 (MySQL)
   - Include rule details in violation reports

3. **Tag Compliance Checking**
   - Verify all EC2 instances have required tags: Environment, Owner, and CostCenter
   - Report instances missing any of these mandatory tags
   - List which tags are missing for each non-compliant instance

4. **AMI Approval Validation**
   - Check if EC2 instances are using approved AMIs from a predefined list
   - Flag instances running unapproved or outdated AMIs
   - Report both the current AMI and instance details

5. **Systems Manager Agent Status**
   - Validate that all EC2 instances have SSM agent installed and running
   - Check agent connectivity and online status
   - Report instances with disconnected or missing agents

6. **VPC Flow Logs Monitoring**
   - Verify that VPC flow logs are enabled for all VPCs in the region
   - Identify VPCs without flow logging configured
   - Include VPC IDs and configuration status

7. **Compliance Report Generation**
   - Generate a structured JSON report with all findings
   - Include violation details: resource IDs, violation type, severity, timestamp
   - Organize by resource type and compliance check category
   - Output to S3 bucket or local file system

8. **CloudWatch Metrics Export**
   - Calculate compliance percentage by resource type
   - Export custom metrics to CloudWatch for monitoring
   - Track metrics like total resources scanned, violations found, compliance rate
   - Enable dashboard creation and alerting

### Technical Requirements

- All scanning logic implemented using **Pulumi with TypeScript**
- Use AWS SDK v3 for reading existing resource configurations
- Deploy to **us-east-1** region (or configurable region)
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `compliance-scanner-{environmentSuffix}`
- All resources must be destroyable (no Retain policies)
- Include proper error handling for API rate limits and permissions
- Support for pagination when scanning large resource sets

### Deployment Requirements (CRITICAL)

- **environmentSuffix Requirement**: All created resources (if any) must include environmentSuffix parameter for unique naming
- **Destroyability**: No DeletionPolicy=Retain or RemovalPolicy=RETAIN - all resources must be fully destroyable
- **Read-Only Focus**: This is primarily a scanning tool - minimize infrastructure creation
- **IAM Permissions**: Ensure proper read-only IAM permissions for EC2, SSM, VPC, CloudWatch
- **Rate Limiting**: Handle AWS API throttling gracefully with exponential backoff

### AWS Services to Use

- **EC2**: Instance and EBS volume scanning
- **Security Groups**: Ingress rule analysis
- **Systems Manager**: SSM agent status checking
- **VPC**: Flow logs validation
- **CloudWatch**: Metrics publishing for compliance tracking

### Constraints

- Read-only operations on existing infrastructure (no modifications)
- Must handle large fleets efficiently (hundreds of instances)
- Graceful error handling for missing permissions or unavailable resources
- JSON report must be valid and parseable by downstream tools
- CloudWatch metrics must follow proper namespace conventions
- Execution time under 5 minutes for typical environments

## Success Criteria

- **Functionality**: Successfully scans all EC2 instances and identifies violations across all 8 compliance checks
- **Performance**: Completes full scan in under 5 minutes for environments with up to 100 instances
- **Reliability**: Handles API errors gracefully without crashing, continues scanning remaining resources
- **Security**: Uses least-privilege IAM permissions, no hardcoded credentials
- **Resource Naming**: All created resources include environmentSuffix parameter
- **Code Quality**: TypeScript code with proper typing, well-tested, documented
- **Reporting**: Generates valid JSON reports with detailed violation information
- **Monitoring**: Exports compliance metrics to CloudWatch successfully

## What to deliver

- Complete Pulumi TypeScript implementation with AWS SDK integration
- EC2 instance scanning with EBS encryption validation
- Security group analysis for unrestricted inbound rules
- Tag compliance verification logic
- AMI approval checking against predefined list
- SSM agent connectivity validation
- VPC flow logs verification
- JSON report generation with structured violation data
- CloudWatch metrics export for compliance tracking
- Unit tests for all scanning logic
- Documentation covering deployment and usage instructions
