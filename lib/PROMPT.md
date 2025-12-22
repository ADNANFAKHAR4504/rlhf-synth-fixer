# Infrastructure QA and Management

> **CRITICAL REQUIREMENT: This task MUST be implemented using analysis with py**
>
> Platform: **analysis**
> Language: **py**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure analysis code must be written using the specified platform and language combination.

---

## Background
A fintech startup needs centralized monitoring for their payment processing infrastructure. They require real-time alerts, custom metrics tracking, and dashboard visualization to ensure transaction reliability and performance SLA compliance. The infrastructure team needs an analysis tool to validate that all monitoring resources are properly deployed and configured.

## Problem Statement
Create a Python analysis script called analyse.py to validate and report on CloudWatch monitoring infrastructure for payment processing services. The script must analyze:

1. CloudWatch Log Groups for payment-api, transaction-processor, and fraud-detector services - verify they exist with KMS encryption and 7-day retention
2. Metric Filters - verify they are configured to extract error rates, response times, and transaction amounts from JSON logs
3. CloudWatch Alarms - verify alarms exist for API error rate over 1%, response time over 500ms, and failed transactions over 5 per minute
4. Composite Alarm - verify it triggers when 2 or more service alarms are in ALARM state
5. SNS Topic - verify it exists with email subscription for alert notifications
6. CloudWatch Dashboard - verify it has widgets showing service health, transaction volume trends, and error distribution with 9 widgets in 3-column layout
7. Custom Metrics - verify namespaces follow pattern FinTech/Service/Environment
8. CloudWatch Logs Insights queries - verify saved searches exist for incident investigation

Expected output: A Python analysis script that connects to AWS using boto3, validates all monitoring resources, generates recommendations for missing or misconfigured resources, calculates a compliance score from 0-100%, and outputs a detailed report.

## Constraints and Requirements
- Analysis script must use boto3 for AWS API calls
- All CloudWatch alarms must be checked for SNS topic notification routing
- Custom metrics namespaces must follow pattern FinTech/Service/Environment
- Dashboard widgets must be verified to be in a 3-column layout with 9 widgets
- Log groups must be verified to have 7-day retention and KMS encryption
- Composite alarm must be verified to combine at least 3 individual alarm states
- All resources must be checked for consistent tagging with Cost Center and Environment tags
- Analysis must generate actionable recommendations for any missing or misconfigured resources

## Environment Setup
Production monitoring infrastructure deployed in us-east-1 for a payment processing system. The analysis script will connect to AWS using boto3 and validate the deployed CloudWatch monitoring resources. The script must support environment suffix configuration via ENVIRONMENT_SUFFIX environment variable.

---

## Implementation Guidelines

### Platform Requirements
- Use Python 3.12+ as the analysis platform
- All code must be written in Python
- Use boto3 for AWS SDK interactions
- Ensure all resource name lookups use the environment_suffix variable for naming

### Security and Compliance
- Analysis script must verify KMS encryption is enabled for all log groups
- Verify SNS topics use encryption
- Check that all resources have proper tagging

### Testing
- Write unit tests with good coverage, target 90%+
- Unit tests must use mocking for AWS API calls
- Integration tests must validate against deployed resources using Moto or real AWS
- Analysis tests run against mocked AWS services

### Script Requirements
- Analysis script must be named analyse.py in the lib/ directory
- Script must use boto3 for all AWS interactions
- Script must accept ENVIRONMENT_SUFFIX from environment variable
- Script must output a compliance score from 0 to 100%
- Script must generate recommendations for non-compliant resources
- Script must support JSON report export

## Analysis Script Requirements

### Resource Naming Validation
All resource lookups MUST include environment_suffix in their names. The pattern should be resource-name-environment_suffix. For example:
- Log Group: /aws/payment-api-pr8478
- Alarm: payment-api-error-rate-pr8478
- Dashboard: payment-monitoring-pr8478

The script must check resources using this environment suffix pattern.

### Expected Resources to Validate

#### CloudWatch Log Groups - expect 3 total
- /aws/payment-api-SUFFIX
- /aws/transaction-processor-SUFFIX
- /aws/fraud-detector-SUFFIX

#### CloudWatch Alarms - expect 6 total
- payment-api-error-rate-SUFFIX
- payment-api-response-time-SUFFIX
- failed-transactions-SUFFIX
- transaction-processor-errors-SUFFIX
- fraud-detector-errors-SUFFIX
- payment-high-load-SUFFIX

#### Composite Alarm - expect 1
- multi-service-failure-SUFFIX

#### CloudWatch Dashboard - expect 1
- payment-monitoring-SUFFIX with 9 widgets

Note: SUFFIX represents the environment suffix from the ENVIRONMENT_SUFFIX variable.

### Compliance Scoring
- Each resource type contributes to overall score
- Missing resources reduce score
- Misconfigured resources like wrong retention or missing encryption also reduce score
- Score ranges: 80-100% means compliant, 50-79% means warnings, 0-49% means non-compliant

## Target Region
All analysis must target the us-east-1 region

## Success Criteria
- Analysis script runs successfully against deployed resources
- All expected resources are validated
- Compliance score is calculated correctly
- Recommendations are generated for missing/misconfigured resources
- Unit tests pass with 90%+ coverage
- Integration tests validate end-to-end analysis workflow
