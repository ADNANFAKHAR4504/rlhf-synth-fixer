# CI/CD Pipeline Integration - Task 291351

Create a complete CI/CD pipeline using Pulumi with Python to automate the deployment and testing of a web application. The system should include the following components:

1. Automated triggering on commits to the 'main' branch
2. Infrastructure as Code using Pulumi targeting AWS
3. Configuration of S3 buckets for storing deployment artifacts with versioning
4. Build and test stages executed on AWS CodeBuild
5. End-to-end orchestration using AWS CodePipeline
6. Tagging of all resources as per company policy
7. Proper IAM policies to restrict access

Expected output: Python scripts and Pulumi configurations that set up the required CI/CD pipeline and infrastructure, passing all specified requirements.

The infrastructure will be deployed in the us-east-1 AWS region. All AWS services must be provisioned within the same region. Use a standard VPC setup with public and private subnets.
