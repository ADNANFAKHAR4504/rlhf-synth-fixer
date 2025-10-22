# Task: HIPAA-Compliant Data Processing Infrastructure

## Task ID
7492345100

## Platform & Language
- Platform: CDKTF
- Language: TypeScript
- Complexity: medium

## Subtask
Application Deployment

## Background
MedTech Solutions needs to modernize their patient records system. They require a secure infrastructure that processes sensitive healthcare data while maintaining HIPAA compliance. The system should handle patient data ingestion, secure storage, and controlled API access for authorized healthcare professionals.

## Problem Statement
Create a HIPAA-compliant data processing infrastructure for a healthcare provider using CDKTF. The system needs to securely store patient records in RDS, with data processing through ECS, and API access through API Gateway.

## Environment Requirements
- Node.js >= 14.x
- CDKTF CLI installed
- AWS Account with appropriate permissions
- TypeScript development environment

## Core Components Required
- Amazon RDS with encryption at rest
- Amazon ECS for data processing
- API Gateway with OAuth2 authentication
- AWS Secrets Manager for credentials

## Constraints
All data must be encrypted at rest and in transit using AWS KMS keys; API access must implement OAuth2 authentication and maintain detailed access logs

## Subject Labels
- Security Configuration as Code
