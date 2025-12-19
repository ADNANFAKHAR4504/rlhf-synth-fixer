Hey team,

We have a financial services company that needs to maintain compliance with security standards across their AWS infrastructure. They're getting hit with audit requirements and manual compliance checks are eating up way too much time. We need to build an automated compliance monitoring system that continuously watches their infrastructure and alerts the security team when anything falls out of compliance.

The business wants this deployed in eu-central-1 and they're pretty specific about what they need. They want AWS Config to monitor for unencrypted S3 buckets and public RDS instances, Lambda functions to analyze compliance data daily, CloudWatch metrics to track compliance percentages over time, and SNS topics for multi-level alerting. They also need dashboards for visibility and comprehensive audit logs for regulatory requirements.

I've been asked to create this infrastructure using **Terraform with HCL**. The system needs to be fully automated - no manual intervention for routine compliance checks. Everything should flow from Config rules detecting issues, through Lambda analysis, to CloudWatch metrics and SNS alerts.

## What we need to build

Create a compliance monitoring infrastructure using **Terraform with HCL** for automated security and configuration compliance tracking in AWS.

### Core Requirements

1. **AWS Config Rules**
   - Deploy Config rule to detect unencrypted S3 buckets
   - Deploy Config rule to check for public RDS instances
   - Evaluate resources at least every 6 hours
   - Configure Config recorder for continuous resource tracking

2. **Lambda Functions for Compliance Analysis**
   - Create Lambda function to analyze Config rule compliance results daily
   - Create Lambda function to automatically tag non-compliant resources
   - Lambda functions must complete within 3 minutes (timeout constraint)
   - Use Node.js 18.x runtime for all Lambda functions

3. **CloudWatch Monitoring and Dashboards**
   - Set up CloudWatch metrics to track compliance percentage over time
   - Deploy CloudWatch dashboard showing compliance status by resource type
   - Dashboard must auto-refresh every 5 minutes during business hours
   - Create CloudWatch Logs for detailed audit trails of all compliance checks

4. **SNS Alerting**
   - Configure SNS topics for critical-level compliance alerts
   - Configure SNS topics for warning-level compliance alerts
   - SNS topics must support both email and SMS subscription protocols
   - Set up SNS subscriptions to send alerts to security team email addresses

5. **CloudWatch Events Integration**
   - Set up CloudWatch Events (EventBridge) to trigger compliance checks on resource changes
   - Trigger Lambda functions when Config rules detect non-compliant resources
   - Schedule daily compliance analysis runs

6. **IAM Security**
   - Implement IAM roles with least-privilege access for all components
   - Separate roles for Config service, Lambda functions, and EventBridge
   - No overly broad permissions (no wildcards on resources)

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **AWS Config** for continuous resource evaluation and compliance monitoring
- Use **Lambda** functions for compliance analysis and automated resource tagging
- Use **CloudWatch** for metrics, dashboards, logs, and event triggering
- Use **SNS** for multi-channel alerting with email and SMS support
- Use **IAM** for least-privilege access control
- Deploy to **eu-central-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${var.environment_suffix}`
- All resources must be destroyable (no deletion protection, no retain policies)

### Constraints

- Lambda execution timeout: 3 minutes maximum
- Lambda runtime: Node.js 18.x (consistent across all functions)
- SNS topics: Must support both email and SMS protocols
- CloudWatch dashboard: Auto-refresh every 5 minutes
- Config rules: Evaluate resources minimum every 6 hours
- Region: eu-central-1 only
- No manual compliance checks - fully automated workflow
- Include proper error handling and logging in all Lambda functions

### Success Criteria

- **Functionality**: AWS Config continuously monitors S3 encryption and RDS public access, Lambda analyzes compliance daily and tags non-compliant resources, SNS sends alerts to security team
- **Performance**: Lambda functions complete under 3 minutes, Config evaluates resources every 6 hours or less, dashboard refreshes every 5 minutes
- **Reliability**: All compliance checks logged to CloudWatch Logs for audit trail, EventBridge triggers compliance checks on resource changes
- **Security**: IAM roles follow least-privilege principle, no overly permissive policies, all components properly isolated
- **Resource Naming**: All resources include environmentSuffix parameter for parallel deployment support
- **Code Quality**: Clean HCL code, well-structured modules, documented variables and outputs

## What to deliver

- Complete Terraform HCL implementation
- AWS Config service configuration with rules for S3 encryption and RDS public access
- Lambda functions for compliance analysis and automated tagging (Node.js 18.x)
- CloudWatch configuration including metrics, logs, dashboard, and events
- SNS topics with email and SMS subscription support
- IAM roles and policies with least-privilege access
- Terraform variables file including environment_suffix parameter
- Documentation with deployment instructions and architecture overview