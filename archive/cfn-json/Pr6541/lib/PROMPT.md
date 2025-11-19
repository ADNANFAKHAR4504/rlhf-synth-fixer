# Automated Infrastructure Compliance System

Hey team,

We've got a financial services company struggling with infrastructure compliance. They're spending 8 hours every week doing manual audits, and they're still missing critical configuration drift issues. We need to automate their compliance checking to catch security and regulatory problems before they become incidents.

The business wants a system that automatically validates deployed resources against their security policies, detects non-compliant configurations, and triggers remediation workflows. Right now they're reactive - finding issues days or weeks after deployment. We need to make them proactive with real-time detection.

I've been asked to build this solution using **CloudFormation with JSON** for the us-east-1 region. The compliance team has specific requirements around what needs to be checked, how alerts should flow, and what metrics they need to track.

## What we need to build

Create an automated infrastructure compliance validation and remediation system using **CloudFormation with JSON** that monitors AWS resources, validates configurations, generates reports, and alerts on non-compliance issues.

### Core Requirements

1. **Systems Manager Automation**
   - Deploy SSM automation documents that validate EC2 instance configurations
   - Must check for at least 3 specific compliance criteria:
     - IMDSv2 enforcement on EC2 instances
     - Approved AMI usage from company-approved list
     - Required tags present on all instances
   - Automation documents should be reusable and parameterized

2. **Event-Driven Compliance Checks**
   - Create EventBridge rules to trigger compliance checks on resource changes
   - Must capture EC2 state changes (running, stopped, terminated)
   - Must monitor security group modifications
   - Must track IAM role updates
   - Automatically trigger validation when these events occur

3. **Compliance Report Generation**
   - Implement Lambda function to parse compliance check results
   - Must output compliance reports in JSON format
   - Each report must include pass/fail status for each check
   - Include timestamp, resource ID, check type, and remediation recommendations
   - Store reports in S3 for audit trail

4. **Report Storage and Archival**
   - Store compliance reports in S3 bucket with versioning enabled
   - Must have lifecycle policy to transition reports older than 90 days to Glacier
   - Enable S3 bucket encryption (SSE-S3 or SSE-KMS)
   - Organize reports by date and compliance status

5. **Non-Compliance Alerting**
   - Configure SNS topic for non-compliance alerts
   - Include email subscription for compliance team
   - Alerts should include resource details and failed checks
   - Enable message filtering if possible

6. **Compliance Metrics Dashboard**
   - Set up CloudWatch dashboard displaying compliance metrics
   - Must display at least 4 custom metrics:
     - Overall compliance percentage
     - Check execution count (successful runs)
     - Failed checks count
     - Last check timestamp
   - Dashboard should update in real-time

7. **Security and Access Control**
   - Create IAM roles with least-privilege access for all components
   - SSM automation role for executing compliance checks
   - Lambda execution role for report processing
   - EventBridge role for triggering Lambda and SSM
   - No wildcards in IAM policies unless absolutely necessary

8. **Logging and Monitoring**
   - Enable CloudWatch Logs for all Lambda functions
   - Set log retention to 30 days
   - Enable log encryption where supported
   - Log group naming: /aws/lambda/function-name-environmentSuffix

9. **Resource Tagging**
   - Tag all resources with Environment=qa
   - Tag all resources with Project=compliance-checker
   - Apply tags to every resource that supports tagging

10. **Resource Lifecycle Management**
    - Ensure all resources support proper deletion
    - DeletionPolicy for S3 buckets: Retain (preserve audit data)
    - DeletionPolicy for CloudWatch Log Groups: Delete
    - DeletionPolicy for all other resources: Delete
    - No resources should block stack deletion

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use Systems Manager for compliance automation documents
- Use EventBridge for event-driven rule triggers
- Use Lambda for report parsing and generation
- Use S3 for report storage with versioning and lifecycle policies
- Use SNS for alerting and notifications
- Use CloudWatch for metrics dashboard and logging
- Use IAM for security and access control
- Resource names must include environmentSuffix parameter for uniqueness
- Follow naming convention: resource-name-environmentSuffix
- Deploy to us-east-1 region
- All resources must be destroyable for testing purposes

### Constraints

- SSM automation documents must be comprehensive and production-ready
- EventBridge rules must not create infinite loops
- Lambda function must handle errors gracefully
- S3 lifecycle transitions must preserve data integrity
- CloudWatch dashboard must be readable and actionable
- IAM policies must follow principle of least privilege
- All sensitive data must be encrypted at rest and in transit
- No hardcoded credentials or secrets in templates

## Success Criteria

- Functionality: All compliance checks execute successfully and detect violations
- Performance: Compliance checks complete within 5 minutes of trigger event
- Reliability: System handles failures gracefully with proper error logging
- Security: All IAM roles follow least-privilege, all data encrypted
- Resource Naming: All resources include environmentSuffix in names
- Code Quality: JSON CloudFormation template, well-structured, documented
- Metrics: Dashboard displays accurate real-time compliance data
- Alerting: SNS notifications sent immediately for non-compliance
- Testability: Template can be deployed and destroyed cleanly
- Coverage: 90%+ test coverage for all components

## What to deliver

- Complete CloudFormation JSON implementation in lib/template.json
- SSM automation documents for IMDSv2, AMI validation, and tag checking
- EventBridge rules for EC2, security group, and IAM monitoring
- Lambda function code for compliance report generation
- S3 bucket with versioning and lifecycle configuration
- SNS topic with email subscription
- CloudWatch dashboard with 4+ metrics
- IAM roles for all components with least-privilege policies
- CloudWatch Logs configuration with 30-day retention
- Unit tests validating template structure
- Integration tests verifying deployed resources
- Documentation and deployment instructions
