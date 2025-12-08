# Infrastructure Compliance Analyzer for EC2 Instances

Hey team,

We've got a financial services client dealing with a serious problem. Their security team keeps finding EC2 instances running without proper encryption, launched from unapproved AMIs, or missing critical tags like Owner and CostCenter. These policy violations are creating audit issues and potential security risks. They need an automated compliance monitoring system that runs continuously and alerts them immediately when instances drift out of compliance.

The goal here is to build a comprehensive compliance analyzer that scans all their EC2 instances every 6 hours, checks them against defined policies, logs everything for audit purposes, and sends alerts when violations are found. This needs to be production-ready infrastructure using **Pulumi with TypeScript** that can handle hundreds of instances without breaking a sweat.

The business is particularly concerned about three areas: encryption of EBS volumes, ensuring instances only use approved AMIs from a whitelist, and enforcing their tagging standards. They also want all compliance data exported to S3 for long-term retention and a CloudWatch dashboard so leadership can see compliance status at a glance.

## What we need to build

Create an infrastructure compliance monitoring system using **Pulumi with TypeScript** for continuous EC2 instance compliance validation.

### Core Requirements

1. **Policy Definition**
   - Define compliance policies for EC2 instances
   - Cover encryption requirements for EBS volumes
   - Specify approved instance types
   - Define required IAM role configurations

2. **Automated Scanning Lambda**
   - Create Lambda function that scans ALL EC2 instances
   - Use AWS SDK to check compliance status
   - Schedule execution every 6 hours via EventBridge
   - Process all instances in the region efficiently

3. **Encryption Validation**
   - Verify all EC2 instances have encrypted EBS volumes
   - Check encryption configuration is proper
   - Flag instances with unencrypted volumes as violations

4. **AMI Whitelisting**
   - Maintain whitelist of approved AMI IDs
   - Validate instances launched from approved AMIs only
   - Report violations for unauthorized AMIs

5. **Tag Enforcement**
   - Check all instances have exactly three required tags
   - Required tags: Owner, Environment, CostCenter
   - Report missing or incomplete tagging as violations

6. **Structured Logging**
   - Store compliance results in CloudWatch Logs
   - Use structured JSON format for queries
   - Enable easy analysis and filtering
   - Set retention period to 7 days for cost optimization

7. **Alert Mechanism**
   - Send SNS notifications for non-compliant resources
   - Include detailed violation reports in alerts
   - Support email subscriptions for security team
   - Provide actionable information for remediation

8. **IAM Security Best Practices**
   - Create Lambda IAM role with least-privilege permissions
   - Grant only: EC2:DescribeInstances, EC2:DescribeVolumes
   - Grant CloudWatch Logs write permissions
   - Grant SNS:Publish for alerts
   - Grant S3:PutObject for compliance exports
   - Avoid wildcards in resource ARNs where possible

9. **Compliance Dashboard**
   - Generate CloudWatch dashboard for visualization
   - Show compliance vs non-compliance ratio
   - Display violation trends over time
   - Provide real-time compliance metrics

10. **Long-term Storage**
    - Export compliance scan results to S3 bucket
    - Store as JSON for long-term analysis
    - Enable audit trail capabilities
    - Implement S3 lifecycle policies for cost optimization

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS Lambda** for compliance scanner (Node.js 18.x runtime)
- Use **Amazon EventBridge** for 6-hour scheduling
- Use **AWS IAM** for roles and policies
- Use **Amazon CloudWatch Logs** for structured logging
- Use **Amazon SNS** for alerting mechanism
- Use **Amazon S3** for long-term compliance data storage
- Use **Amazon CloudWatch Dashboard** for metrics visualization
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- Lambda timeout: 300 seconds (5 minutes)
- Lambda memory: 512 MB

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain deletion policies)
- Every resource name must include environmentSuffix parameter
- S3 bucket must have encryption enabled
- CloudWatch log retention: 7 days
- Include proper error handling in Lambda function
- Lambda must handle AWS SDK v3 for Node.js 18+ runtimes
- No GuardDuty detector creation (account-level service limitation)

### Constraints

- Security: Follow least-privilege IAM principles
- Compliance: All data must be encrypted at rest
- Performance: Lambda must complete within timeout
- Reliability: Handle API rate limiting and retries
- Cost: Use serverless services to minimize costs
- Tagging: Enforce three specific tags on all instances
- Logging: Structured JSON format for CloudWatch Logs
- Alerting: Include detailed violation context in SNS messages

## Success Criteria

- **Functionality**: Lambda successfully scans all EC2 instances and identifies violations
- **Performance**: Compliance scan completes within 5-minute timeout
- **Reliability**: EventBridge triggers Lambda every 6 hours consistently
- **Security**: IAM role follows least-privilege with no unnecessary permissions
- **Logging**: CloudWatch Logs contain structured JSON compliance results
- **Alerting**: SNS sends email notifications with violation details
- **Storage**: Compliance data exported to S3 in JSON format
- **Visibility**: CloudWatch dashboard displays compliance metrics
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: TypeScript code, well-tested, fully documented
- **Destroyability**: All resources can be destroyed without retention policies

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- Lambda function code for compliance scanning (inline or separate file)
- EventBridge rule for 6-hour scheduling
- IAM role and policies with least-privilege permissions
- CloudWatch log group with 7-day retention
- SNS topic with email subscription capability
- S3 bucket with encryption and lifecycle policies
- CloudWatch dashboard with compliance metrics
- Unit tests for all infrastructure components
- Integration tests validating compliance scanning workflow
- Documentation with deployment instructions and compliance policy details
