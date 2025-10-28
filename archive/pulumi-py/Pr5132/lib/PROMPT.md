# Healthcare Analytics Platform Infrastructure

## Task Description

Create infrastructure using **Pulumi with Python** for a containerized SaaS healthcare analytics platform. HealthTech Analytics Corp needs to deploy their new healthcare analytics platform in South America. The platform processes anonymized healthcare data and requires high availability, secure session management, and efficient caching for API responses.

## Background Context

Create a containerized environment for a SaaS healthcare analytics platform using Amazon ECS with ElastiCache Redis for session management and caching. The system must be compliant with healthcare data regulations.

## Requirements

The infrastructure should be deployed in eu-west-1 region and include:
- ECS Fargate cluster for containerized applications
- ElastiCache Redis cluster for session management
- ECS Task Definitions with appropriate security configurations
- Network configuration with proper isolation
- Secrets management for Redis credentials

## Constraints

- **Region: eu-west-1** (MANDATORY - All resources must be deployed in eu-west-1 region)
- All Redis connections must be encrypted in-transit using TLS
- ECS tasks must run in private subnets with outbound internet access via NAT Gateway
- Redis authentication must be managed through AWS Secrets Manager

## AWS Services Required

- Amazon ECS (Fargate)
- Amazon ElastiCache (Redis)
- AWS Secrets Manager
- Amazon VPC (with private subnets and NAT Gateway)
- IAM (for ECS task execution and task roles)

## Platform & Language (MANDATORY)

- **Platform**: Pulumi
- **Language**: Python (py)
- **Complexity**: medium

These are non-negotiable constraints from metadata.json. All generated code must use Pulumi with Python.

## Subject Labels

- Cloud Environment Setup
- Failure Recovery Automation
- Infrastructure Analysis/Monitoring
- Security Configuration as Code
