# Payment Processing Infrastructure - Deployment Guide

## Overview

This deployment guide covers the CloudFormation StackSet deployment for multi-account payment processing infrastructure.

## Prerequisites

1. AWS CLI 2.x installed and configured
2. Access to management account (456789012345) with StackSet permissions
3. OrganizationAccountAccessRole configured in target accounts
4. S3 bucket for storing nested stack templates

## Preparation Steps

### 1. Upload Nested Stack Templates

Upload all nested stack templates to an S3 bucket accessible from all target accounts:

```bash
aws s3 cp lib/nested/NetworkStack.json s3://your-bucket/nested/NetworkStack.json
aws s3 cp lib/nested/ComputeStack.json s3://your-bucket/nested/ComputeStack.json
aws s3 cp lib/nested/StorageStack.json s3://your-bucket/nested/StorageStack.json
aws s3 cp lib/nested/MonitoringStack.json s3://your-bucket/nested/MonitoringStack.json
```

### 2. Update Parameter Files

Update the template URLs in all parameter files (dev-params.json, staging-params.json, prod-params.json) with your actual S3 bucket name.

## StackSet Deployment

### Create StackSet

```bash
aws cloudformation create-stack-set \
  --stack-set-name payment-processing-infrastructure \
  --template-body file://lib/PaymentProcessingStack.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --permission-model SERVICE_MANAGED \
  --auto-deployment Enabled=true,RetainStacksOnAccountRemoval=false \
  --description "Multi-account payment processing infrastructure" \
  --region us-east-1
```

### Deploy to Development Account

```bash
aws cloudformation create-stack-instances \
  --stack-set-name payment-processing-infrastructure \
  --accounts 123456789012 \
  --regions us-east-1 \
  --parameter-overrides file://lib/parameters/dev-params.json \
  --operation-preferences FailureToleranceCount=0,MaxConcurrentCount=1
```

### Deploy to Staging Account

```bash
aws cloudformation create-stack-instances \
  --stack-set-name payment-processing-infrastructure \
  --accounts 234567890123 \
  --regions us-east-1 \
  --parameter-overrides file://lib/parameters/staging-params.json \
  --operation-preferences FailureToleranceCount=0,MaxConcurrentCount=1
```

### Deploy to Production Account

```bash
aws cloudformation create-stack-instances \
  --stack-set-name payment-processing-infrastructure \
  --accounts 345678901234 \
  --regions us-east-1 \
  --parameter-overrides file://lib/parameters/prod-params.json \
  --operation-preferences FailureToleranceCount=0,MaxConcurrentCount=1
```

## Drift Detection

### Detect Drift on StackSet

```bash
aws cloudformation detect-stack-set-drift \
  --stack-set-name payment-processing-infrastructure \
  --region us-east-1
```

### Check Drift Status

```bash
aws cloudformation describe-stack-set-drift-detection-status \
  --operation-id <operation-id-from-detect-command> \
  --region us-east-1
```

### View Drift Results

```bash
aws cloudformation describe-stack-instance \
  --stack-set-name payment-processing-infrastructure \
  --stack-instance-account 123456789012 \
  --stack-instance-region us-east-1
```

## Stack Updates

### Update StackSet Template

```bash
aws cloudformation update-stack-set \
  --stack-set-name payment-processing-infrastructure \
  --template-body file://lib/PaymentProcessingStack.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --operation-preferences FailureToleranceCount=0,MaxConcurrentCount=1,RegionConcurrencyType=SEQUENTIAL
```

### Update Stack Instances with New Parameters

```bash
aws cloudformation update-stack-instances \
  --stack-set-name payment-processing-infrastructure \
  --accounts 123456789012 \
  --regions us-east-1 \
  --parameter-overrides file://lib/parameters/dev-params.json \
  --operation-preferences FailureToleranceCount=0,MaxConcurrentCount=1
```

## Validation

### Validate Consistency Across Environments

```bash
# Check Lambda runtime versions
for account in 123456789012 234567890123 345678901234; do
  echo "Checking account $account"
  aws lambda get-function --function-name payment-validation-dev --query 'Configuration.Runtime' --profile account-$account
done

# Check DynamoDB billing mode
for account in 123456789012 234567890123 345678901234; do
  echo "Checking account $account"
  aws dynamodb describe-table --table-name payment-transactions-dev --query 'Table.BillingModeSummary.BillingMode' --profile account-$account
done
```

## Cleanup

### Delete Stack Instances

```bash
aws cloudformation delete-stack-instances \
  --stack-set-name payment-processing-infrastructure \
  --accounts 123456789012 234567890123 345678901234 \
  --regions us-east-1 \
  --no-retain-stacks
```

### Delete StackSet

```bash
aws cloudformation delete-stack-set \
  --stack-set-name payment-processing-infrastructure
```

## Monitoring

Monitor stack operations:

```bash
aws cloudformation list-stack-set-operations \
  --stack-set-name payment-processing-infrastructure \
  --region us-east-1
```

Check specific operation:

```bash
aws cloudformation describe-stack-set-operation \
  --stack-set-name payment-processing-infrastructure \
  --operation-id <operation-id> \
  --region us-east-1
```
```
