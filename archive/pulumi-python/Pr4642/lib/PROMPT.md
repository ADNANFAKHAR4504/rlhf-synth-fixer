# Application Deployment

IMPORTANT: You need to use Pulumi with Python for this task. Make sure you deploy everything to sa-east-1.

## Background

MedTech Solutions needs to deploy a containerized application that processes patient healthcare records. The system must maintain HIPAA compliance while providing efficient data processing capabilities. The application will receive patient data, process it, and store it in an encrypted database.

## Problem Statement

Create a secure container infrastructure for a healthcare data processing application that handles sensitive patient records. The solution must use ECS for container orchestration and include proper data encryption and storage components.

## What you need to do

Build out the infrastructure with these requirements:
- All data must be encrypted at rest and in transit using AWS KMS keys
- Database backups must be retained for at least 30 days

## Before you start

Make sure you have:
- AWS Account with appropriate permissions
- Pulumi CLI installed
- Python 3.8 or higher
- AWS credentials configured
- Access to sa-east-1 region

## How to implement this

You should use Pulumi as the IaC framework and write everything in Python. Follow Pulumi best practices for organizing resources. Make sure all resources use the environmentSuffix variable for naming so we can deploy multiple environments.

For security and compliance:
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately

For testing:
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from cfn-outputs/flat-outputs.json

Some things to keep in mind:
- Infrastructure should be fully destroyable for CI/CD workflows
- Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

Deploy everything to sa-east-1.

## What success looks like

- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
