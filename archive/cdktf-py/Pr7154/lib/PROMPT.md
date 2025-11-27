# Task: Security Configuration as Code

## Problem Statement

Create a CDKTF Python program to implement infrastructure analysis and compliance validation for multi-environment deployments. MANDATORY REQUIREMENTS (Must complete): 1. Create Python classes that analyze synthesized CDKTF stacks for security group rules allowing 0.0.0.0/0 inbound access (CORE: EC2/VPC analysis) 2. Implement IAM policy analyzer that detects wildcard (*) permissions and reports violations (CORE: IAM analysis) 3. Build tag compliance validator ensuring all resources have Environment, Owner, and CostCenter tags 4. Create network analyzer that validates VPC CIDR ranges don't overlap across environments 5. Implement encryption validator checking S3 buckets and RDS instances have encryption enabled 6. Generate detailed JSON report with pass/fail status, violation details, and remediation suggestions 7. Use CDKTF testing framework with pytest to validate infrastructure before synthesis 8. Return appropriate exit codes (0 for pass, 1 for fail) for CI/CD integration OPTIONAL ENHANCEMENTS (If time permits): • Add Config Rules synthesis for continuous compliance (OPTIONAL: AWS Config) - enables real-time monitoring • Implement Guard policy validation (OPTIONAL: Guard) - adds policy-as-code compliance • Create Lambda function for post-deployment validation (OPTIONAL: Lambda) - enables runtime verification Expected output: CDKTF Python application with comprehensive infrastructure analysis capabilities that validates security, compliance, and best practices across multiple AWS environments, generating actionable reports for DevOps teams.

## Scenario

A financial services company has deployed multiple CDKTF stacks across development, staging, and production environments. Recent production incidents revealed configuration drift and compliance violations that weren't caught during deployment. The DevOps team needs automated infrastructure analysis to validate configurations before and after deployment.

## Infrastructure Context

Multi-account AWS infrastructure deployed across us-east-1 and eu-west-1 regions using CDKTF with Python 3.9+. Infrastructure includes VPCs with public/private subnets, ECS Fargate clusters running microservices, RDS Aurora PostgreSQL clusters, and Application Load Balancers. Each environment (dev/staging/prod) has isolated AWS accounts. Requires CDKTF 0.20+, AWS CDK 2.x, boto3 for runtime validation, and pytest for test execution. Security policies enforce mandatory encryption, specific tagging standards, and restricted security group rules.

## Constraints

- Must use CDKTF assertions and testing framework for infrastructure validation
- Analysis must run as part of CI/CD pipeline with exit codes for pass/fail
- All IAM policies must be analyzed for least privilege violations
- Resource tagging compliance must be verified against company standards
- Network security groups must be validated for overly permissive rules
- Analysis results must be exported as JSON for integration with compliance tools

## Technical Requirements

- Platform: CDKTF
- Language: Python
- Difficulty: expert
- Category: Security, Compliance, and Governance
