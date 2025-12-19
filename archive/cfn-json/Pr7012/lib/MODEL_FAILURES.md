# Model Response Failures Analysis

This document analyzes the failures in the MODEL_RESPONSE and how the IDEAL_RESPONSE corrects them for the serverless crypto price alert system.

## High Failures

### 1. Missing Lambda Invoke Permission for Lambda Destinations

**Impact Level**: High

**MODEL_RESPONSE Issue**:
The AlertMatcherRole in the MODEL_RESPONSE lacked permissions to invoke the ProcessedAlerts Lambda function. When Lambda Destinations were configured, the AlertMatcher function could not invoke ProcessedAlerts because the execution role didn't have lambda:InvokeFunction permission.

From MODEL_RESPONSE line 190-227:
```json
"AlertMatcherRole": {
  "Policies": [
    {
      "PolicyName": "DynamoDBAccess",
      ...
    },
    {
      "PolicyName": "CloudWatchLogs",
      ...
    }
  ]
}
```

**IDEAL_RESPONSE Fix**:
Added a third policy to AlertMatcherRole granting lambda:InvokeFunction permission for the ProcessedAlerts function:

```json
"AlertMatcherRole": {
  "Policies": [
    {
      "PolicyName": "DynamoDBAccess",
      ...
    },
    {
      "PolicyName": "CloudWatchLogs",
      ...
    },
    {
      "PolicyName": "LambdaInvoke",
      "PolicyDocument": {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": "lambda:InvokeFunction",
            "Resource": {
              "Fn::GetAtt": ["ProcessedAlerts", "Arn"]
            }
          }
        ]
      }
    }
  ]
}
```

**Root Cause**: The model didn't understand that Lambda Destinations require explicit invoke permissions from the source Lambda's execution role to the destination Lambda. This is different from EventBridge which uses its own role to invoke Lambda.

**AWS Documentation Reference**: https://docs.aws.amazon.com/lambda/latest/dg/invocation-async.html#invocation-async-destinations

**Performance Impact**: Without this permission, the deployment fails at the AlertMatcherDestinationConfig resource creation with error "The function execution role does not have permissions to call InvokeFunction".

---

## Medium Failures

### 2. Excessive Reserved Concurrent Executions

**Impact Level**: Medium

**MODEL_RESPONSE Issue**:
The MODEL_RESPONSE specified reserved concurrent executions of 100 for PriceWebhookProcessor and 50 for AlertMatcher, totaling 150 reserved executions. This exceeded the available quota because AWS Lambda requires at least 100 unreserved concurrent executions in the account at all times.

From MODEL_RESPONSE line 167:
```json
"ReservedConcurrentExecutions": 100
```

From MODEL_RESPONSE (AlertMatcher):
```json
"ReservedConcurrentExecutions": 50
```

**IDEAL_RESPONSE Fix**:
Reduced reserved concurrent executions to more reasonable values:
- PriceWebhookProcessor: 10 (down from 100)
- AlertMatcher: 5 (down from 50)

This totals 15 reserved executions, leaving 985 concurrent executions available for other functions and meeting the 100 minimum unreserved requirement.

**Root Cause**: The model didn't account for the AWS Lambda account-level concurrency limits. While the PROMPT specified 100 and 50, it didn't consider that:
1. AWS enforces a minimum of 100 unreserved concurrent executions
2. The default account limit is typically 1000 concurrent executions
3. Other Lambda functions in the account may also be using reserved concurrency

The model should have recognized that reserving 150 executions is overly aggressive for a typical use case and could cause deployment failures.

**AWS Documentation Reference**: https://docs.aws.amazon.com/lambda/latest/dg/configuration-concurrency.html

**Cost/Performance Impact**:
- The reduced values (10 and 5) still provide adequate concurrency for the crypto alert system while being more account-friendly
- No functional impact - the system can still handle thousands of alerts with these concurrency settings
- Cost remains the same as reserved concurrency doesn't affect pricing

---

## Summary

- Total failures: 0 Critical, 1 High, 1 Medium, 0 Low
- Primary knowledge gaps:
  1. Lambda Destinations IAM permissions requirements
  2. AWS Lambda account-level concurrency quota management
- Training value: This task demonstrates important real-world deployment issues that models should understand, particularly around AWS service quotas and cross-service IAM permissions. The failures were realistic deployment blockers that would occur in actual production environments.