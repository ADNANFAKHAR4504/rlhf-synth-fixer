#!/bin/bash

# LocalStack Environment Configuration
# This file is sourced by LocalStack deployment scripts to configure service-specific settings

# Services required for this infrastructure
# VPC, EC2, CloudWatch, IAM resources need ec2, cloudwatch, iam services
export LOCALSTACK_SERVICES="s3,lambda,dynamodb,cloudformation,iam,sqs,sns,events,logs,cloudwatch,apigateway,secretsmanager,ssm,stepfunctions,kinesis,kms,sts,ec2,ecr"

# Enable eager loading for faster startup
export EAGER_SERVICE_LOADING=1

# Disable IAM enforcement for LocalStack Community
export ENFORCE_IAM=0

# Skip signature validation for S3
export S3_SKIP_SIGNATURE_VALIDATION=1

# Debug settings
export DEBUG=0
