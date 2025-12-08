Hey team,

We need to build infrastructure for an educational content delivery platform that integrates with a complete CI/CD pipeline. I've been looking at how we can create a secure, compliant system for delivering educational materials to students using **CDKTF with TypeScript**. The business wants infrastructure that deploys automatically through a multi-stage pipeline with proper security controls and approval gates.

The platform will serve educational content to students, track their progress, and ensure compliance with data protection regulations. We need this to work seamlessly with automated deployments across development, staging, and production environments.

## What we need to build

Create an educational content delivery infrastructure using **CDKTF with TypeScript** that integrates with a CI/CD pipeline.

### Core Requirements

1. **Content Storage and Delivery**
   - S3 buckets for storing course materials, videos, and documents
   - CloudFront distribution for fast, global content delivery
   - Origin Access Identity for secure S3 access
   - Support for different content types (videos, PDFs, interactive content)

2. **User and Progress Tracking**
   - DynamoDB tables for user profiles and course progress
   - Point-in-time recovery enabled for data protection
   - Global secondary indexes for efficient querying
   - Encryption at rest for sensitive student data

3. **Authentication and Authorization**
   - Cognito User Pool for student authentication
   - Email and SMS verification for account security
   - Password policies meeting compliance requirements
   - User groups for students, instructors, and administrators

4. **Serverless API Layer**
   - Lambda functions for course enrollment and progress updates
   - API Gateway REST API for frontend integration
   - Lambda execution roles with least privilege
   - Environment variables for configuration

5. **Monitoring and Compliance**
   - CloudWatch log groups for application logs
   - Log retention policies for compliance
   - CloudWatch alarms for critical metrics
   - SNS topics for alerting administrators

### CI/CD Integration Requirements

Reference the provided `lib/ci-cd.yml` for:

1. **GitHub Actions Workflow**
   - GitHub OIDC authentication (no long-lived credentials)
   - Automated deployment to dev on commits
   - Manual approval gates for staging and production
   - Security scanning and compliance checks

2. **Multi-Stage Pipeline**
   - Build stage: Install dependencies, run cdktf synth
   - Security stage: Run security scanning and validation
   - Deploy stages: dev (auto) → staging (approval) → prod (approval)
   - Notification hooks for deployment status

3. **Environment Configuration**
   - Support for environment-specific parameters
   - Integration with GitHub Actions contexts
   - Encrypted secrets management
   - Cross-account role assumptions for production

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- All resources must be destroyable (no Retain removal policies)
- Use proper CDKTF imports from `@cdktf/provider-aws`
- Support environment parameters from CI/CD pipeline
- Include IAM roles for cross-account deployments
- Proper error handling and logging throughout

### Deployment Requirements (CRITICAL)

- **environmentSuffix Requirement**: ALL named resources must include the environmentSuffix parameter to ensure uniqueness across environments
- **Destroyability**: All resources must be fully destroyable. Do NOT use any Retain or Snapshot removal policies
- **Multi-Environment Support**: Infrastructure must work across dev, staging, and prod environments with different configurations
- **CI/CD Compatible**: Resources must support automated deployment through GitHub Actions
- **Region Specific**: All resources deployed to us-east-1

### Constraints

- Student data must be encrypted at rest and in transit
- Authentication must support MFA for administrative access
- Logs must be retained for minimum 30 days for compliance
- API endpoints must use HTTPS only
- Content delivery must use signed URLs for premium content
- Infrastructure must support automated testing and validation
- All IAM roles must follow principle of least privilege
- CloudWatch metrics must be exported for compliance reporting

## Success Criteria

- **Functionality**: Complete educational platform infrastructure with content delivery, user management, and progress tracking
- **Performance**: CloudFront provides low-latency content delivery globally
- **Reliability**: DynamoDB point-in-time recovery, Lambda retry policies
- **Security**: Encryption at rest/transit, Cognito authentication, secure API access
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: TypeScript with proper types, comprehensive error handling, well-documented
- **CI/CD Integration**: Infrastructure deploys successfully through multi-stage pipeline with approval gates
- **Compliance**: Logging, encryption, and data retention meet educational compliance requirements

## What to deliver

- Complete CDKTF TypeScript implementation in lib/
- S3 buckets with proper bucket policies and encryption
- CloudFront distribution with Origin Access Identity
- DynamoDB tables with encryption and backup enabled
- Cognito User Pool with proper password policies
- Lambda functions with execution roles
- API Gateway with Lambda integration
- CloudWatch log groups and alarms
- SNS topics for notifications
- IAM roles for CI/CD cross-account access
- Support for environment-specific configuration
- Unit tests for all components
- Documentation and deployment instructions
