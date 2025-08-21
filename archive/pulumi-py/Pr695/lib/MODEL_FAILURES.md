# Model Failures Analysis - IAC-1062-1: Nova Model Breaker

## Task Overview
**Project**: IaC - AWS Nova Model Breaking  
**Requirement**: Serverless infrastructure with DynamoDB streams, dual Lambda functions, IAM roles, monitoring, and error handling  
**Target**: Single TapStack file using Pulumi Python SDK  

---

## Model Failures & Hallucinations

### 1. **CRITICAL: Invalid SNS Topic for Lambda DLQ**
**Issue**: SNS topic used as Dead Letter Queue without FIFO configuration
```python
# Model's incorrect implementation:
dlq_topic = aws.sns.Topic("nova-dlq-topic", name=f"{environment}-nova-dlq-topic")
```
**Problem**: Lambda DLQs only support:
- SQS queues
- SNS **FIFO** topics (with `fifo_topic=True`)

**Impact**: Deployment will fail when Lambda tries to use non-FIFO SNS topic as DLQ
**Fix Required**: Either use SQS queue or convert SNS topic to FIFO with `.fifo` suffix

### 2. **CRITICAL: Pre-created CloudWatch Log Groups**
**Issue**: Manually creating log groups that AWS automatically manages
```python
processor_log_group = aws.cloudwatch.LogGroup(
    "processor-log-group",
    name=f"/aws/lambda/{environment}-processor-{team}",
)
```
**Problem**: AWS automatically creates `/aws/lambda/<function_name>` log groups
**Impact**: `ResourceAlreadyExistsException` on subsequent deployments
**Fix Required**: Remove manual log group creation or use conditional logic

### 3. **CRITICAL: Invalid Log Group ARN Construction**
**Issue**: Incorrect ARN reference in IAM policy
```python
policy=pulumi.Output.all(dynamodb_table.stream_arn, processor_log_group.arn, dlq_topic.arn)
.apply(lambda args: json.dumps({
    "Resource": f"{args[1]}:*"  # processor_log_group.arn doesn't provide valid ARN
}))
```
**Problem**: `LogGroup.arn` doesn't expose valid ARN format in Pulumi
**Impact**: IAM policy will have invalid ARN, causing permission errors
**Fix Required**: Manually construct ARN: `f"arn:aws:logs:{region}:{{account_id}}:log-group:/aws/lambda/{function_name}:*"`

### 4. **CRITICAL: Incomplete IAM Policies**
**Issue**: Missing required IAM actions and incomplete policy statements
```python
# Missing "Effect", "Action" fields in policy statements
{
    "Effect": "Allow",
    "Resource": args[0]  # Missing "Action" field
}
```
**Fix Required**: Complete IAM policies with all required actions

### 5. **CRITICAL: Incomplete IAM Role Trust Policies**
**Issue**: Malformed assume role policy documents
```python
assume_role_policy=json.dumps({
    "Version": "2012-10-17",
    "Statement": [{
        "Action": "sts:AssumeRole",
        # Missing "Effect" and "Principal" fields
    }]
})
```
**Problem**: Trust policy is incomplete - missing `"Effect": "Allow"` and `"Principal": {"Service": "lambda.amazonaws.com"}`
**Impact**: Lambda functions cannot assume their roles, causing deployment failure
**Fix Required**: Complete trust policy with proper Effect and Principal

### 6. **LOGIC ERROR: Invalid DLQ ARN Construction in Lambda Code**
**Issue**: Incorrect SNS topic ARN derivation in Lambda handlers
```python
# Incorrect logic in Lambda code:
TopicArn=context.invoked_function_arn.replace(':function:', ':sns:').replace(context.function_name, 'dev-nova-dlq-topic')
```
**Problem**: Lambda function ARN format cannot be transformed into valid SNS topic ARN
**Impact**: DLQ publishing will fail with invalid topic ARN
**Fix Required**: Use environment variable `DLQ_TOPIC_ARN` (already provided) instead of string manipulation

### 7. **DEPLOYMENT RISK: Duplicate Lambda Function Files**
**Issue**: Both Lambda functions use same filename in AssetArchive
```python
processor_lambda = aws.lambda_.Function(
    code=pulumi.AssetArchive({"lambda_function.py": pulumi.StringAsset(processor_code)})
)
analyzer_lambda = aws.lambda_.Function(
    code=pulumi.AssetArchive({"lambda_function.py": pulumi.StringAsset(analyzer_code)})
)
```
**Problem**: Same filename `lambda_function.py` used for both functions
**Impact**: Potential file conflicts during deployment
**Fix Required**: Use distinct filenames or separate directories

### 8. **CODE QUALITY: Incomplete Lambda Handler Logic**
**Issue**: Incomplete if-else logic in analyzer Lambda
```python
# Incomplete code in analyzer_code:
if event_name == 'INSERT':
    # Missing increment logic
else:
    logger.info(f"Skipping {event_name} event from analysis")
```
**Problem**: Logic for incrementing counters is incomplete
**Impact**: Analyzer function won't count events properly
**Fix Required**: Complete the increment logic for both INSERT and MODIFY events

### 9. **CONFIGURATION: Unnecessary Batching Window**
**Issue**: `maximum_batching_window_in_seconds` used with DynamoDB streams
```python
maximum_batching_window_in_seconds=5,
```
**Problem**: This parameter is primarily for Kinesis streams, not DynamoDB
**Impact**: No functional impact, but unnecessary configuration
**Fix Required**: Remove parameter or clarify its usage

### 10. **FILTER CRITERIA: Empty Filter Configuration**
**Issue**: Empty filter criteria defined but not implemented
```python
filter_criteria=aws.lambda_.EventSourceMappingFilterCriteriaArgs(
    filters=[aws.lambda_.EventSourceMappingFilterCriteriaFilterArgs()]  # Empty filter
)
```
**Problem**: Filter criteria defined but no actual filtering rules specified
**Impact**: Filters serve no purpose as currently implemented
**Fix Required**: Either remove filter criteria or implement proper filtering logic

### 11. **CRITICAL: Missing Lambda Permissions for SNS**
**Issue**: Lambda functions attempt to publish to SNS but lack IAM permissions
```python
# Missing SNS permissions in IAM policies
sns.publish(TopicArn=context.invoked_function_arn.replace(...))
```
**Problem**: IAM policies don't include `sns:Publish` action
**Impact**: Lambda functions will fail with AccessDenied when trying to send DLQ messages
**Fix Required**: Add `sns:Publish` permission to IAM policies

### 12. **CRITICAL: Missing Account ID for ARN Construction**
**Issue**: Cannot construct valid ARNs without AWS account ID
```python
# ARN construction requires account ID
f"arn:aws:logs:{region}:{account_id}:log-group:/aws/lambda/{function_name}:*"
```
**Problem**: No mechanism to get AWS account ID for ARN construction
**Impact**: IAM policies will have malformed ARNs
**Fix Required**: Use `aws.get_caller_identity()` to fetch account ID

### 13. **CRITICAL: Lambda Code Syntax Error**
**Issue**: Incomplete if-statement in analyzer Lambda code
```python
# In analyzer_code:
if event_name == 'INSERT':
    insert_count += 1
elif event_name == 'MODIFY':
    modify_count += 1  # This line is missing from model response
```
**Problem**: Incomplete conditional logic will cause syntax errors
**Impact**: Lambda function deployment will fail due to invalid Python code
**Fix Required**: Complete the if-elif-else logic properly

### 14. **LOGIC ERROR: Incorrect Environment Variable Usage**
**Issue**: Lambda code doesn't use provided environment variables
```python
# Environment variables are set but not used:
environment=aws.lambda_.FunctionEnvironmentArgs(
    variables={"DLQ_TOPIC_ARN": dlq_topic.arn}  # Set but unused
)
# Instead, hardcoded ARN manipulation is attempted
```
**Problem**: Code ignores proper DLQ_TOPIC_ARN environment variable
**Impact**: DLQ functionality will fail with invalid ARN
**Fix Required**: Use `os.environ.get('DLQ_TOPIC_ARN')` in Lambda code

### 15. **CRITICAL: Missing Exception Details in DLQ Messages**
**Issue**: SNS messages lack error context and details
```python
sns.publish(
    TopicArn=invalid_arn,
    Subject='Lambda Processing Error'  # Missing Message body with error details
)
```
**Problem**: DLQ messages provide no context about the actual error
**Impact**: Error debugging and monitoring will be ineffective
**Fix Required**: Include exception details, record info, and timestamp in message

### 16. **ARCHITECTURE: Missing Dead Letter Queue Resource**
**Issue**: SNS topic configured as DLQ but not actually used as SQS dead letter queue
```python
dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
    target_arn=dlq_topic.arn  # SNS topic instead of SQS queue
)
```
**Problem**: Lambda DLQ should typically be an SQS queue, not SNS topic
**Impact**: AWS may reject the configuration or it won't function as expected
**Fix Required**: Create proper SQS dead letter queue

### 17. **SECURITY: Overly Permissive Resource Access**
**Issue**: IAM policies grant access to entire stream ARN without specific conditions
```python
"Resource": dynamodb_table.stream_arn  # Too broad
```
**Problem**: No conditions limiting access to specific event types or time ranges
**Impact**: Functions have broader access than needed, violating least privilege
**Fix Required**: Add condition statements to limit access scope

### 18. **CRITICAL: Missing Required Lambda Environment Variables**
**Issue**: Lambda functions reference undefined variables
```python
# Lambda code references variables that aren't set:
logger.info(f"Processing {event_name} for team {team}")  # 'team' undefined
```
**Problem**: Lambda code assumes variables exist that aren't in environment or context
**Impact**: Runtime errors when Lambda functions execute
**Fix Required**: Either remove references or add missing environment variables

### 19. **DEPLOYMENT: Resource Dependency Issues**
**Issue**: Lambda functions depend on log groups but dependency not explicit
```python
opts=pulumi.ResourceOptions(
    depends_on=[processor_policy, processor_log_group]  # Circular dependency risk
)
```
**Problem**: Creating log groups manually creates potential dependency conflicts
**Impact**: Deployment order issues and potential race conditions
**Fix Required**: Remove manual log group creation to eliminate dependency issues

### 20. **CRITICAL: Invalid Python Code Structure**
**Issue**: Lambda code strings contain indentation and syntax issues
```python
analyzer_code = """
import json
# ... code with potential indentation issues when deployed
"""
```
**Problem**: Multi-line string indentation may not match Python requirements when deployed
**Impact**: Lambda deployment will fail due to invalid Python syntax
**Fix Required**: Ensure proper indentation and syntax in embedded code strings

---

## Additional Architecture Issues

### 21. **MONITORING: No Error Rate Alarms**
**Issue**: No CloudWatch alarms for Lambda function error rates or DLQ depth
**Impact**: No automated alerting for system failures
**Fix Required**: Add CloudWatch alarms for error monitoring

### 22. **SCALABILITY: No Concurrent Execution Limits**
**Issue**: No reserved concurrency limits on Lambda functions
**Impact**: Functions could consume all available Lambda concurrency
**Fix Required**: Set appropriate reserved_concurrent_executions

### 23. **COST OPTIMIZATION: No Provisioned Concurrency Management**
**Issue**: Using on-demand Lambda without cost optimization considerations
**Impact**: Higher cold start times and potential cost inefficiencies
**Fix Required**: Consider provisioned concurrency for production workloads

### 24. **COMPLIANCE: Missing Resource Tags**
**Issue**: Not all resources have consistent tagging for governance
**Impact**: Difficult to track costs and manage resources
**Fix Required**: Apply consistent tagging strategy across all resources

---

## Updated Failure Summary

| Category | Critical | Warning | Total |
|----------|----------|---------|-------|
| **Infrastructure** | 8 | 4 | 12 |
| **Security (IAM)** | 3 | 2 | 5 |
| **Code Quality** | 3 | 2 | 5 |
| **Configuration** | 0 | 2 | 2 |
| **Total Issues** | **14** | **10** | **24** |

**Deployment Success Probability**: **0%** - Multiple critical failures will prevent successful deployment

---

## Next Steps
1. Fix critical IAM policy and role issues
2. Resolve SNS/SQS DLQ configuration
3. Remove manual log group creation
4. Complete Lambda handler logic
5. Implement proper error handling
6. Add comprehensive testing
7. Validate pylint compliance (target: >7.0/10)