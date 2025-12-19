# Task: HIPAA-compliant Monitoring System for Healthcare Data Pipeline

## Background
MedTech Solutions needs to implement a robust monitoring solution for their patient data processing pipeline. The system must track data flow, performance metrics, and maintain HIPAA compliance while processing thousands of patient records per hour.

## Problem Statement
Create a HIPAA-compliant monitoring system for a healthcare data pipeline using Pulumi that processes patient records through Kinesis and stores them in RDS, with performance metrics tracked in ElastiCache Redis.

## Environment Requirements
A healthcare data processing environment that requires:

## Constraints
All resources must be deployed in private subnets with no direct internet access; Database backups must be encrypted and retained for minimum 30 days

## Platform Requirements
- Platform: Pulumi (enforced)
- Language: Python (enforced)
- Region: us-east-1 (default)

## Expected AWS Services
- Amazon Kinesis (data streaming)
- Amazon RDS (database storage)
- Amazon ElastiCache Redis (performance metrics)
- AWS Secrets Manager (credential management)
- VPC with private subnets (network isolation)
- NAT Gateway (outbound internet access)

## Compliance Requirements
- HIPAA compliance
- All resources in private subnets
- No direct internet access
- Encrypted database backups
- Minimum 30-day backup retention
