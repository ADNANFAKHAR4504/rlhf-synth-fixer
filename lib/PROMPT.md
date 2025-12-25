Need help refactoring our transaction processing CloudFormation template. Current stack has circular dependencies causing deployment failures. Lambda role depends on DynamoDB, but DynamoDB permissions also depend on the role. Plus we have hardcoded ARNs everywhere.

Business needs this for payment processing so reliability is critical. Must use CloudFormation JSON format.

## Current Issues

- Circular dependencies between Lambda execution role and DynamoDB permissions  
- Hardcoded ARNs instead of CloudFormation references
- IAM policies scattered across multiple resources
- Deployment failures due to improper resource ordering

## What I Need

Transaction processing infrastructure using CloudFormation JSON that actually deploys without dependency errors.

### Core Components

1. DynamoDB Transaction Table
   - PAY_PER_REQUEST billing (no provisioned capacity)
   - Must be destroyable for testing (no deletion protection)
   - Parameterized table name

2. Lambda Payment Processor  
   - 256MB memory for transaction processing
   - Parameterized function name
   - Proper IAM role with minimal permissions

3. Fix the Circular Dependencies
   - Break dependency cycle between Lambda role and DynamoDB
   - Use CloudFormation intrinsic functions (!Ref, !GetAtt) instead of hardcoded values
   - Add DependsOn where needed to force correct creation order
   - Consolidate IAM policies

4. Parameters and Outputs
   - Parameters for table name, function name, environment suffix
   - Outputs with Lambda ARN and DynamoDB table name
   - Export outputs for cross-stack references

### Technical Details

- CloudFormation JSON format (not YAML)
- DynamoDB for transaction storage
- Lambda for payment processing
- IAM for access control
- Resources must include environment suffix for uniqueness  
- Deploy to us-east-1
- Everything must be destroyable (no Retain policies)

### Requirements

- No hardcoded ARNs
- Use !Ref and !GetAtt for all resource references
- Least-privilege IAM policies
- No circular dependencies
- All resources destroyable
- Proper error handling

### Nice to Have (if easy to add)

- API Gateway REST endpoint for webhooks
- CloudWatch alarm for DynamoDB throttling
- Lambda reserved concurrency

## Success Criteria

- Template deploys without circular dependency errors
- All resources created with proper parameters
- IAM policies consolidated with minimal permissions
- Resources named with environment suffix
- Valid CloudFormation JSON

## Deliverables

- CloudFormation JSON template
- DynamoDB table with PAY_PER_REQUEST billing
- Lambda function with execution role
- IAM managed policy with required permissions
- Parameters section for configuration
- Outputs section with exported values
- Brief explanation of dependency resolution approach
