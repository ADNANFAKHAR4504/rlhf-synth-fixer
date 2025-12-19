Hey team,

We've got a transaction processing infrastructure that's been causing deployment headaches due to circular dependencies and poor resource ordering. The current CloudFormation template has several issues: hardcoded ARNs, Lambda execution role that depends on DynamoDB while DynamoDB permissions depend on the role, and scattered IAM policies that make it hard to maintain.

I need to refactor this infrastructure to eliminate these circular dependencies and make it deployable reliably. The business relies on this for processing payment transactions, so we need to get this right. I've been asked to create this using CloudFormation with JSON format.

The current setup has a DynamoDB table for transaction records and a Lambda function for payment processing, but the deployment order is broken. CloudFormation keeps failing because resources reference each other in ways that create dependency cycles.

## What we need to build

Create a transaction processing infrastructure using **CloudFormation with JSON** that eliminates circular dependencies and improves deployment reliability.

### Core Requirements

1. DynamoDB Transaction Table
   - Table for storing transaction records with PAY_PER_REQUEST billing mode
   - Must include proper deletion policies (no Retain policies)
   - Use Parameters for table name configuration

2. Lambda Payment Processor
   - Function with 256MB memory allocation for payment processing logic
   - Use Parameters for function name configuration
   - Proper IAM execution role with minimal required permissions

3. Circular Dependency Resolution
   - Fix circular dependency between Lambda execution role and DynamoDB table permissions
   - Use proper CloudFormation intrinsic functions (!Ref, !GetAtt) instead of hardcoded ARNs
   - Add explicit DependsOn attributes to enforce correct resource creation order
   - Consolidate IAM policies into single managed policy document

4. Parameterization and Outputs
   - Use Parameters section for table name, function name, and environment tag
   - Include Outputs section with Lambda function ARN and DynamoDB table name
   - Export output values for cross-stack integration

### Technical Requirements

- All infrastructure defined using CloudFormation with JSON
- Use DynamoDB for transaction storage
- Use Lambda for payment processing logic
- Use IAM for access management and least-privilege policies
- Resource names must include EnvironmentSuffix parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 region
- All resources must be destroyable (no DeletionProtectionEnabled)

### Constraints

- No hardcoded ARNs or resource names in IAM policies
- All resource references must use !Ref or !GetAtt intrinsic functions
- IAM policies must follow least-privilege principle
- No circular dependencies in resource creation order
- All resources must be destroyable after testing (no Retain policies)
- Include proper error handling and resource dependencies

### Optional Enhancements (if time permits)

- API Gateway REST API for webhook endpoint to enable external integration testing
- CloudWatch alarm for DynamoDB throttling to improve monitoring
- Lambda reserved concurrent executions to prevent throttling

## Success Criteria

- Functionality: Template deploys without circular dependency errors
- Resource Configuration: All MANDATORY requirements implemented with proper parameters
- Dependency Management: Correct use of !Ref, !GetAtt, and DependsOn attributes
- IAM Best Practices: Consolidated policies with minimal required permissions
- Resource Naming: All resources include EnvironmentSuffix parameter
- Code Quality: Valid CloudFormation JSON, properly structured, well-documented

## What to deliver

- Complete CloudFormation JSON template implementation
- DynamoDB table for transaction records with PAY_PER_REQUEST billing
- Lambda function with execution role and proper permissions
- IAM managed policy consolidating all required permissions
- Parameters section for table name, function name, and environment suffix
- Outputs section exporting Lambda ARN and DynamoDB table name
- Documentation of dependency resolution strategy
