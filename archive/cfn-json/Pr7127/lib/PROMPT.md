Hey team,

We're launching a new data analytics platform that needs to run across development, staging, and production environments in separate AWS accounts. The business analysts will be uploading large CSV files that need processing, and we need real-time dashboards showing the results. The challenge here is that security and cost optimization are non-negotiable requirements, and we need a rock-solid multi-environment setup that can scale.

I've been asked to build this infrastructure using **CloudFormation with JSON**. The platform needs to handle everything from file storage and processing to metadata tracking and analytics dashboards. We're talking about a complete multi-account deployment with proper isolation between environments, automated drift detection, and self-service capabilities for developers.

The tricky part is that each environment has different requirements. Production needs snapshot policies and tighter security controls, while dev and staging need faster iteration cycles. We also need to implement custom validation logic post-deployment to ensure bucket policies are compliant, plus we need macros to automatically tag everything based on the account ID.

## What we need to build

Create a complete multi-environment data analytics platform using **CloudFormation with JSON** for infrastructure provisioning across multiple AWS accounts.

### Core Requirements

1. **Multi-Account Infrastructure Deployment**
   - Separate deployments to development (eu-west-1), staging (us-west-2), and production (us-east-1) accounts
   - Environment-specific configurations managed through CloudFormation Conditions

2. **Data Storage Infrastructure**
   - Environment-specific S3 buckets with server-side encryption enabled
   - S3 versioning enabled on all buckets
   - Lifecycle policies to transition objects to Glacier storage class after 90 days
   - Explicit deny statements in bucket policies for security compliance
   - Resource names must include environmentSuffix parameter for uniqueness

3. **Data Processing Layer**
   - Lambda functions with Python 3.9 runtime and 3GB memory allocation
   - CSV file processing logic with error handling
   - Environment-specific configurations stored in AWS Systems Manager Parameter Store
   - S3 event notifications configured to automatically trigger Lambda on CSV file uploads
   - CloudWatch Logs integration for Lambda execution tracking

4. **Metadata and State Management**
   - DynamoDB tables with on-demand billing mode for cost optimization
   - File metadata storage including upload timestamps, processing status, file size
   - Processing status tracking with state machine integration
   - Point-in-time recovery enabled for production environment tables

5. **Security and Access Control**
   - IAM roles following least-privilege access principles
   - CloudFormation Conditions to vary permissions by environment
   - Separate execution roles for Lambda functions per environment
   - Service-linked roles for AWS Config and other AWS services
   - Cross-account access roles for StackSets deployment

6. **Post-Deployment Validation**
   - CloudFormation Custom Resources using Lambda for validation logic
   - S3 bucket policy compliance checks after stack creation
   - SNS notifications on policy non-compliance detection
   - Automated remediation triggers for common misconfigurations

7. **Self-Service Provisioning**
   - AWS Service Catalog portfolio creation for test instance provisioning
   - Product definitions for common infrastructure patterns
   - Launch constraints and user permissions for controlled self-service
   - Version control for Service Catalog products

8. **Drift Detection and Monitoring**
   - SNS topic for drift detection notifications
   - Integration with CloudWatch Events for real-time alerting

9. **Network Architecture**
   - VPC with 2 availability zones per environment
   - Public and private subnet configuration
   - Security groups for Lambda, DynamoDB access
   - VPC endpoints for S3 and DynamoDB to reduce data transfer costs

10. **Infrastructure Automation**
    - CloudFormation macro to inject environment tags automatically based on account ID
    - Tag-based resource organization for cost allocation
    - Macro transformation logic for template sections
    - Lambda-backed macro implementation

11. **Observability and Analytics**
    - CloudWatch dashboards with environment-specific metrics
    - Metrics for S3 bucket operations, Lambda invocations, DynamoDB read/write capacity
    - QuickSight integration for business analytics dashboards
    - Custom metrics for data processing throughput

12. **Data Protection Policies**
    - DeletionPolicy set to Snapshot for databases in production environment
    - DeletionPolicy set to Retain for production S3 buckets
    - Delete policy for non-production resources to enable quick cleanup
    - UpdateReplacePolicy configuration for stateful resources

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON** format (not YAML)
- Use AWS Systems Manager Parameter Store for environment-specific configuration values
- Use CloudFormation Conditions for environment-specific resource configurations
- Use CloudFormation Custom Resources backed by Lambda for post-deployment validation
- Implement CloudFormation macros using Lambda for template transformation
- Create AWS Service Catalog portfolio with launch constraints
- Resource names must include environmentSuffix parameter for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- Deploy to us-east-1 region for production, us-west-2 for staging, eu-west-1 for development
- All resources must be destroyable with no Retain policies in non-production environments
- Production resources must have appropriate Snapshot or Retain policies
- Configure S3 event notifications to trigger Lambda functions on CSV file uploads

### Deployment Requirements (CRITICAL)

- All resources MUST include environmentSuffix parameter in names for multi-environment deployment
- Resource naming format: resource-type-environmentSuffix (example: analytics-bucket-prod)
- Non-production resources MUST be destroyable (DeletionPolicy: Delete)
- Production resources MUST have DeletionPolicy set to Snapshot or Retain for data protection
- All Lambda functions MUST use explicit IAM role definitions (no implicit roles)
- S3 bucket policies MUST include explicit deny statements for security compliance
- S3 buckets MUST have NotificationConfiguration to trigger Lambda on CSV file uploads
- DynamoDB tables MUST use on-demand billing to avoid capacity planning
- CloudFormation Custom Resources MUST include proper error handling and timeout configuration
- Parameter Store values MUST be created before stack deployment (not as part of stack)

### Constraints

- Multi-account deployment requires AWS Organizations setup with cross-account roles
- Service Catalog requires proper IAM permissions for end users to launch products
- QuickSight requires separate subscription and user management outside CloudFormation
- Lambda functions with 3GB memory allocation will incur higher costs per invocation
- DynamoDB on-demand billing is cost-effective only for unpredictable workloads
- All resources must be destroyable in non-production to enable quick iteration
- Include proper error handling and logging for all Lambda functions
- CloudFormation macros must be deployed before referencing them in templates
- VPC endpoints for S3 and DynamoDB reduce data transfer costs and eliminate need for NAT Gateways

### Success Criteria

- Functionality: Complete multi-environment deployment across three AWS accounts
- Functionality: S3 buckets with lifecycle policies automatically transition objects to Glacier after 90 days
- Functionality: S3 event notifications automatically trigger Lambda functions on CSV file uploads
- Functionality: Lambda functions successfully process CSV files and store metadata in DynamoDB
- Functionality: Custom Resources validate S3 bucket policies and trigger SNS notifications on violations
- Functionality: Service Catalog portfolio allows developers to self-provision test instances
- Performance: Lambda functions complete CSV processing within 5 minutes for files up to 100MB
- Performance: DynamoDB queries return file metadata within 100ms for dashboard display
- Reliability: SNS notifications delivered within 1 minute of policy violations or drift detection
- Security: IAM roles follow least-privilege with environment-specific permission variations
- Security: S3 bucket policies include explicit deny statements for unauthorized access patterns
- Resource Naming: All resources include environmentSuffix for uniqueness across environments
- Resource Naming: Naming convention follows resource-type-environmentSuffix pattern
- Code Quality: CloudFormation JSON templates are valid and well-structured
- Code Quality: Lambda functions include comprehensive error handling and logging
- Code Quality: Inline comments explain complex conditions and macro transformations

## What to deliver

- Complete CloudFormation JSON template (template.json)
- Lambda function code for Custom Resource validation (lib/lambda/custom-resource-validator.py)
- Lambda function code for CSV processing (lib/lambda/csv-processor.py)
- Lambda function code for CloudFormation macro (lib/lambda/tag-macro.py)
- CloudWatch dashboard configuration for environment-specific metrics
- Service Catalog product definitions for self-service provisioning
- Comprehensive documentation including deployment instructions (lib/README.md)
- Architecture diagram showing multi-account setup and data flow
- Parameter Store key-value pairs for environment-specific configurations
- IAM role definitions with least-privilege access policies
