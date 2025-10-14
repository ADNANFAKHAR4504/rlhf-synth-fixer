# Task: HIPAA-Compliant Healthcare Data Processing API

## Background
MedTech Solutions needs a HIPAA-compliant infrastructure to handle patient record processing. The system must securely process sensitive healthcare data, cache frequently accessed records, and maintain strict audit logging for compliance.

## Problem Statement
Create a HIPAA-compliant healthcare data processing API infrastructure using CDKTF that processes patient records through a secure API gateway and stores them in an encrypted RDS instance. The system should include caching for frequently accessed data and secure credential management.

## Environment/Setup Requirements
A healthcare data processing system with these core components: 
1. API Gateway for secure endpoint access 
2. RDS Aurora for HIPAA-compliant data storage 
3. ElastiCache for response caching 
4. SecretsManager for credential management

## Constraints
All data must be encrypted at rest and in transit using AWS KMS keys; API Gateway must implement OAuth2 authentication and rate limiting; RDS instance must be in private subnets with no direct internet access

## Subject Labels
- Failure Recovery Automation
- Security Configuration as Code

## Additional Requirements
- Platform: CDKTF
- Language: TypeScript
- Difficulty: medium
- Subtask: Failure Recovery and High Availability
