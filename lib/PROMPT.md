# Document Automation System - CloudFormation

Need to build a document automation system using CloudFormation. Currently have a basic DynamoDB table for storing prompts, but need to expand this into a full document generation and processing platform.

## What I'm Building

A document automation system that generates documents from templates, routes them through approval workflows, analyzes content, and tracks everything for compliance. Should handle multi-language documents and provide analytics on usage patterns.

The system will work like this:
- Users request documents via API Gateway which triggers Lambda
- Lambda pulls templates from S3 and generates documents
- Generated docs go through Step Functions for multi-party approval
- Approved docs get analyzed by Textract and Comprehend for compliance
- Everything gets logged to DynamoDB with full audit trail
- EventBridge watches for compliance deadlines and sends reminders via SNS

## Services Needed

**Document Storage and Processing:**
- S3 buckets connected to Lambda - one for templates with versioning, another for generated documents
- Lambda functions that read from S3 template bucket, merge data, write to generated docs bucket
- All buckets encrypted with KMS keys shared across Lambda and S3

**Workflow and Approval:**
- API Gateway REST API that triggers the document generation Lambda
- Step Functions state machine orchestrating multi-party approval, calling SNS for notifications
- SNS topics that Lambda can publish to for approval requests

**AI Analysis Services:**
- Textract integration in Lambda to verify document structure
- Comprehend analyzing extracted text for clause detection
- Translate generating multi-language versions

**Data and Monitoring:**
- DynamoDB tables storing document metadata and complete audit trail, encrypted with KMS
- EventBridge rules triggering Lambda on schedule to check compliance deadlines
- CloudWatch logging all Lambda executions and alarms on errors
- Athena workgroup querying document usage from S3 logs
- Glue catalog organizing metadata for Athena queries

**Security:**
- IAM roles for each Lambda with least-privilege access to just their required buckets and tables
- KMS encryption key shared across S3, DynamoDB, and SNS
- Proper trust relationships between services

## Current Setup

Already have a CloudFormation stack with:
- DynamoDB table called TurnAroundPromptTable with basic config
- EnvironmentSuffix parameter for multi-environment deployment
- Uses standard CloudFormation JSON format

The table has partition key 'id' and uses PAY_PER_REQUEST billing. Need to keep this table and add everything else around it.

## Key Requirements

All S3 buckets need versioning enabled. Lambda functions should use Node.js 22 runtime with inline code for now. Step Functions needs error handling for failed approvals. EventBridge should run daily checks for overdue documents. Make sure IAM policies are specific - no wildcard permissions.

The template should support deploying dev, staging, and prod environments using the EnvironmentSuffix parameter. All resource names should include the suffix so they don't collide.

Need outputs for all major resources so other stacks can reference them. Make sure DependsOn is set correctly so services deploy in the right order - KMS before DynamoDB, buckets before Lambda, etc.

Would be great to have CloudWatch alarms on Lambda errors and DynamoDB throttling. Also need proper tags on everything for cost tracking.

Deploy to us-east-1 region.
