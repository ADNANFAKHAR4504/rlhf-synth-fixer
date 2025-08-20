# Infrastructure Solution for IAC-291555

## About This Solution

The CloudFormation template in `lib/TapStack.yml` creates a secure AWS infrastructure that goes well beyond the basic requirements. It includes around 25 AWS resources and implements enterprise-level security practices.

## What's Inside

### Random Naming for Global Uniqueness
We built a Lambda function that creates 8-character random strings to make sure resource names don't collide globally. The naming pattern follows `tapstack${EnvironmentSuffix}-${ResourceType}-${AccountId}-${RandomSuffix}` which works well across different environments and AWS accounts.

### Encryption Setup
All CloudWatch logs get encrypted using a customer-managed KMS key. The key policy is locked down to only allow CloudWatch Logs service access in the us-west-1 region. There's also a key alias that makes management easier.

### Storage Security
The main S3 bucket blocks all public access and enforces SSL connections through bucket policies. We also set up a separate bucket just for access logs with a 30-day lifecycle policy to keep storage costs reasonable. Both buckets use server-side encryption.

### Network Foundation
The VPC uses a 10.0.0.0/16 network with automatic availability zone selection. We included VPC Flow Logs that send all network traffic data to CloudWatch for monitoring. The security group only allows HTTPS traffic on port 443.

### Server Hardening
The EC2 instances get several security configurations applied automatically:
- Root SSH access gets disabled
- System firewall gets enabled
- IP forwarding gets turned off
- CloudWatch monitoring agent collects detailed metrics

### Logging Strategy
We capture logs from multiple sources - EC2 system logs, S3 access patterns, and network traffic. All logs get encrypted and stored for 7 days to balance compliance needs with cost management.

## Security Implementation

The infrastructure enforces several security controls. S3 bucket policies reject any non-SSL connections. IAM roles only work within the us-west-1 region. Security groups block everything except HTTPS traffic. EC2 instances run with minimal IAM permissions.

For encryption, we use KMS keys for CloudWatch logs and enable S3 server-side encryption. The network gets monitored through VPC Flow Logs. System hardening includes disabling root access, enabling firewalls, and blocking IP forwarding.

All resources get tagged with Environment: Production and follow consistent naming patterns. We avoid retention policies to ensure everything can be cleaned up properly. Log retention stays at 7 days for both compliance and cost control.

## Available Outputs

The template exports 19 different outputs that cover all the major infrastructure pieces. This includes resource identifiers, storage bucket names, compute instance details, networking components, IAM role information, logging destinations, encryption keys, and Lambda function references.

## Test Coverage

We built 40 unit tests that validate the template structure, parameters, resource properties, security policies, naming conventions, outputs, and tagging. The integration tests run 20 different scenarios against real AWS resources to verify deployment, security enforcement, infrastructure connectivity, logging integration, IAM security, Lambda functionality, encryption, and end-to-end workflows.

## Standards and Compliance

The solution aligns with AWS Well-Architected Framework principles for security, reliability, and performance. It implements production-grade security with SSL enforcement, encryption, and minimal privileges. Operational excellence comes through comprehensive logging, monitoring, and tagging. Cost optimization uses right-sized instances and appropriate log retention periods.

## Deployment Details

Everything gets deployed to us-west-1 with IAM conditions enforcing the region restriction. All resources get tagged as Environment: Production. The unique naming system prevents conflicts. The template includes 25 AWS resources with proper dependencies and 4 parameters for configuration flexibility.

This infrastructure provides enterprise-grade security and operational capabilities while maintaining cost efficiency and meeting all the original requirements.