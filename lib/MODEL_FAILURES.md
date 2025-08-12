# Nova Model – A2 Prompt Gaps & Failures

## 1. Single-File Requirement

- Did not meet the explicit requirement for all code to be contained within a **single file**.
- Referenced an external `lambda_function.zip` file instead of embedding Lambda code inline.

## 2. Missing API Gateway Integration

- No creation or configuration of an **API Gateway** to expose the Lambda function.
- No method, resource, or deployment stage setup for REST or HTTP API.

## 3. No Scaling Configuration

- Did not implement scaling to handle **1000 requests per minute**.
- No usage of **Reserved Concurrency** or **Provisioned Concurrency** settings in Lambda.
- Lacked autoscaling policies or request throttling configuration.

## 4. Missing CloudWatch Alarms

- Did not set up **CloudWatch alarms** for:
  - Function errors
  - Throttles
  - Latency
- No SNS topic or notification mechanism for alerts.

## 5. Absent Tagging

- No application of **resource tags** for cost allocation, ownership tracking, or environment labeling.

## 6. Weak IAM Security Practices

- Used a generic `AWSLambdaBasicExecutionRole` without least-privilege permissions.
- Did not restrict IAM policies to only the needed AWS services and actions.

## 7. Lack of Inline Documentation

- Minimal or no code comments explaining:
  - Resource purposes
  - Configuration choices
  - Potential impact of parameters

## 8. Missing Context Features

- Did not handle **environment variables** for runtime customization.
- No mention of logging configuration for debugging and monitoring.

---

**Summary:**  
Nova produced a partially functional Pulumi + Python script that creates a Lambda function but fails to satisfy the majority of the A2 prompt’s functional and structural requirements. Significant additions and modifications are necessary to meet the full deployment specification.
