# CodeBuild Compliance and Testing Infrastructure

Hey team,

We need to build a compliance monitoring and testing system for our AWS CodeBuild projects. I've been asked to create this using **CDK with TypeScript**. The operations team wants automated scanning and remediation for all CodeBuild projects in our account to ensure they meet our compliance standards.

Right now we have no visibility into whether our build projects follow security best practices, use current runtime versions, or have proper tagging. This system will continuously monitor all CodeBuild projects, generate compliance reports, and automatically fix common issues.

The compliance scanner will check things like environment variable configurations, runtime versions, IAM permissions, and tagging standards. We need real-time alerting when critical violations are found and weekly reports showing trends across all projects.

## What we need to build

Create a compliance monitoring and automated testing infrastructure using **CDK with TypeScript** for AWS CodeBuild projects in us-east-1.

### Core Requirements

1. **CodeBuild Compliance Scanner**
   - CodeBuild project that scans other CodeBuild projects in the account
   - Checks for compliance issues like missing environment variables, outdated runtimes, and overly broad IAM roles
   - Runs analysis scripts to validate configurations
   - Writes scan reports to S3 for reporting

2. **S3 Storage for Reports**
   - Buckets for storing analysis reports and compliance data
   - Versioning enabled on all buckets
   - Lifecycle policies to transition old reports to cheaper storage classes
   - Server-side encryption with KMS

3. **IAM Roles and Permissions**
   - Least-privilege role for scanner CodeBuild project
   - Permissions to list and describe all CodeBuild projects
   - Read-only access to CodeBuild configurations
   - Permissions to write reports to S3
   - Lambda execution roles for compliance functions

4. **CloudWatch Alarms**
   - Alarms for detecting non-compliant configurations
   - Monitor missing required environment variables
   - Alert on outdated runtime versions
   - Track failed compliance scans

5. **Compliance Reports Lambda**
   - Lambda function to generate weekly compliance reports
   - Compare build projects against predefined compliance templates
   - Aggregate compliance scores across all projects
   - Calculate trends and identify problematic patterns
   - Publishes reports to S3 and sends notifications to SNS

6. **EventBridge Automation**
   - Rules to trigger analysis when CodeBuild projects are created
   - Rules to trigger analysis when CodeBuild projects are updated
   - Schedule compliance scans to run daily
   - EventBridge triggers Lambda functions for report generation

7. **SNS Alerting**
   - Topics for critical compliance violations
   - Topics for weekly report distribution
   - Email subscriptions for operations team
   - Filter patterns for different severity levels

8. **Tagging Validation**
   - Validate all CodeBuild projects have required tags Environment, Owner, and Project
   - Check tag values match allowed patterns
   - Report projects with missing or invalid tags
   - Include tag compliance in overall score

9. **CloudWatch Dashboards**
   - Display build performance metrics across all projects
   - Show compliance scores and trends over time
   - Widget for projects with critical violations
   - Charts for tag compliance percentages
   - Build success rates and duration metrics

10. **Automated Remediation**
    - Lambda functions to fix common compliance issues
    - Automatically add missing required tags
    - Update outdated runtime versions where safe
    - Apply standard environment variables
    - Log all remediation actions for audit trail

### Technical Requirements

- All infrastructure defined using **CDK with TypeScript**
- Use **CodeBuild** for compliance scanning project
- Use **S3** for report storage with versioning and lifecycle policies
- Use **Lambda** for report generation and remediation functions using Node.js 20.x runtime
- Use **EventBridge** for event-driven automation and scheduling
- Use **CloudWatch** for alarms, dashboards, and logs
- Use **SNS** for notifications and alerting
- Use **IAM** for all security policies and roles
- All service names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-purpose-environmentSuffix
- Deploy to **us-east-1** region
- All Lambda functions must include error handling and logging

### Deployment Requirements - CRITICAL

- **environmentSuffix**: ALL resources MUST accept and use environmentSuffix parameter in their names
- **Destroyability**: ALL resources must be destroyable and must not use RETAIN removal policies
- **RemovalPolicy**: Set to DESTROY for S3 buckets, log groups, and all stateful resources
- **autoDeleteObjects**: Set to true for S3 buckets to allow deletion
- **Security**: Enable encryption at rest using KMS and in transit using HTTPS for all data stores
- **Monitoring**: Enable logging for all Lambda functions and CodeBuild projects

### Constraints

- Use least-privilege IAM policies and avoid wildcards unless truly needed
- Enable versioning on all S3 buckets for audit trail
- All data must be encrypted at rest with KMS
- CloudWatch Logs retention should be 7 days for cost efficiency
- Lambda functions should have timeout of 300 seconds maximum
- CodeBuild project should use managed image aws/codebuild/standard:7.0
- All resources must support environment-specific deployment via environmentSuffix
- Include proper error handling and retry logic in Lambda functions
- Use X-Ray tracing for Lambda functions to aid debugging

## Success Criteria

- **Functionality**: Scanner can list and analyze all CodeBuild projects in account
- **Reporting**: Weekly reports generated showing compliance status and trends
- **Alerting**: SNS notifications sent when critical violations detected
- **Remediation**: Automated fixes applied to common issues without manual intervention
- **Monitoring**: Dashboard provides real-time view of compliance across all projects
- **Tagging**: All resources include required tags and environmentSuffix in names
- **Security**: All IAM roles follow least-privilege principle
- **Destroyability**: Complete stack can be deleted cleanly without manual resource cleanup
- **Code Quality**: TypeScript code is well-structured, typed, and includes proper error handling

## What to deliver

- Complete CDK TypeScript implementation in lib/
- Lambda function code for compliance reporting in lib/lambda/compliance-reporter/
- Lambda function code for automated remediation in lib/lambda/auto-remediation/
- CodeBuild buildspec.yaml for compliance scanner
- IAM policies for all roles
- CloudWatch dashboard configuration
- EventBridge rule definitions
- Unit tests for all Lambda functions
- Integration tests validating end-to-end compliance workflow
- Documentation on compliance checks performed and remediation actions
