Hey team,

We've got a situation with our CloudFormation templates that's causing real pain. Our financial services infrastructure team has been struggling with a legacy three-tier web application template that's been failing deployments and racking up costs. The template was originally written a few years back and has accumulated technical debt - hardcoded values, circular dependencies, security vulnerabilities, and deprecated runtimes. Every time we try to deploy, something breaks.

The business needs this refactored urgently because deployment failures are blocking critical updates, and we're bleeding money on resources that shouldn't exist. The current template violates AWS limits in several places and contains anti-patterns that make it nearly impossible to maintain. We need to modernize this while ensuring it follows current AWS best practices and security standards.

I've been asked to create a refactored version that actually works on the first deployment attempt, passes all validation checks, and eliminates the security issues. This needs to be production-ready for our us-east-1 environment with high availability across three availability zones.

## What we need to build

Create a refactored CloudFormation template using **CloudFormation with JSON** for a three-tier web application infrastructure that fixes all deployment failures and security vulnerabilities in the legacy template.

### Core Requirements

1. **VPC and Network Configuration**
   - Refactor hardcoded CIDR blocks into parameterized template with Fn::Cidr for subnet calculations
   - Deploy across 3 availability zones with public and private subnets
   - Remove all hardcoded resource names and use generated names with environmentSuffix

2. **Compute Layer Fixes**
   - Fix Auto Scaling Group configuration that references non-existent launch templates
   - Implement proper health check grace periods for ASG
   - Resolve circular dependency between ALB target groups and Auto Scaling Group
   - Update EC2 instances to use Amazon Linux 2 with proper IAM roles

3. **Database Layer Corrections**
   - Fix RDS Aurora MySQL cluster where reader endpoints are referenced before cluster creation
   - Implement Secrets Manager integration for database credentials instead of plain text parameters
   - Add proper DeletionPolicy and UpdateReplacePolicy to all stateful resources
   - Enable Multi-AZ deployment for high availability

4. **Serverless Components**
   - Replace Lambda functions using deprecated Node.js 12.x runtime with Node.js 18.x
   - Add proper error handling for all Lambda functions
   - Fix IAM roles with overly permissive wildcard policies
   - Implement least-privilege access patterns

5. **Storage and Security**
   - Fix S3 bucket policies that allow public access
   - Ensure all S3 buckets have encryption and versioning enabled
   - Implement proper access controls and least-privilege patterns
   - Add KMS encryption where applicable

6. **Monitoring and Alerting**
   - Add CloudWatch alarms for all critical metrics
   - Implement SNS topic integration for alerts
   - Add proper logging for all components
   - Monitor ASG scaling, RDS performance, and Lambda errors

7. **Template Best Practices**
   - Remove circular dependencies between Security Groups and EC2 instances
   - Implement proper parameter constraints with AllowedValues
   - Replace inline IAM policies with managed policies or policy documents
   - Use Fn::Sub instead of multiple nested Fn::Join operations
   - Remove duplicate resource definitions using mappings

8. **Cross-Stack Integration**
   - Implement proper stack outputs with exports for cross-stack references
   - Add cost allocation tags to all resources following company naming conventions
   - Ensure template supports CloudFormation StackSets for multi-account deployment

9. **Deployment Support**
   - Ensure all resources support blue-green deployments through proper logical ID management
   - Reduce deployment time by 40% through optimized dependencies
   - Pass cfn-lint validation without errors or warnings
   - Deploy successfully on first attempt

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **VPC** with proper subnet design and routing
- Use **Auto Scaling Group** with Application Load Balancer for compute tier
- Use **RDS Aurora MySQL** cluster for database layer with Multi-AZ
- Use **Lambda** with Node.js 18.x runtime for data processing
- Use **S3** with encryption and versioning for static assets
- Use **Secrets Manager** for credential management
- Use **CloudWatch** and **SNS** for monitoring and alerting
- Use **IAM** with least-privilege policies
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region across 3 availability zones
- Comply with CIS AWS Foundations Benchmark v1.4.0

### Deployment Requirements (CRITICAL)

- All resources MUST include **environmentSuffix** parameter in names for uniqueness
- NO DeletionPolicy: Retain or UpdateReplacePolicy: Retain - all resources must be destroyable
- All Lambda functions MUST use Node.js 18.x or later runtime (NOT Node.js 12.x)
- S3 buckets MUST have encryption enabled and proper access controls
- RDS MUST use Secrets Manager for credentials (NOT plain text parameters)
- IAM policies MUST follow least-privilege principle (NO wildcard * permissions)
- Security Groups MUST NOT have circular dependencies
- Template MUST pass cfn-lint validation before deployment
- All stateful resources MUST have proper DeletionPolicy and UpdateReplacePolicy set to Delete or Snapshot

### Constraints

- Must comply with CIS AWS Foundations Benchmark v1.4.0
- Must pass cfn-lint validation without errors
- Must deploy successfully in us-east-1 on first attempt
- Must reduce deployment time by at least 40% compared to legacy template
- All resources must be tagged with cost allocation tags
- No hardcoded values - all configurable via parameters
- No circular dependencies between resources
- No deprecated runtime versions or API calls
- Template must support StackSets for multi-account deployment
- Must work with AWS CLI 2.x
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging throughout

## Success Criteria

- Functionality: Template deploys successfully on first attempt without manual intervention
- Performance: Deployment completes 40% faster than legacy template (target under 20 minutes)
- Reliability: Supports blue-green deployments and graceful rollbacks
- Security: Passes cfn-lint security checks, implements least-privilege IAM, encrypts all data at rest and in transit
- Resource Naming: All resources include environmentSuffix for unique identification
- Compliance: Meets CIS AWS Foundations Benchmark v1.4.0 requirements
- Code Quality: JSON formatted, well-structured, documented with comments
- Validation: Passes cfn-lint validation with zero errors or warnings
- Cost Optimization: Eliminates wasteful resources identified in original template

## What to deliver

- Complete CloudFormation JSON template implementation
- VPC with parameterized CIDR blocks using Fn::Cidr
- Auto Scaling Group with proper launch template and health checks
- Application Load Balancer with target group integration
- RDS Aurora MySQL cluster with Secrets Manager integration
- Lambda functions with Node.js 18.x runtime and error handling
- S3 buckets with encryption, versioning, and secure policies
- CloudWatch alarms and SNS topics for monitoring
- IAM roles and policies following least-privilege principle
- Proper parameters, mappings, conditions, and outputs
- Stack exports for cross-stack references
- Cost allocation tags on all resources
- Documentation explaining all fixes applied to legacy template
