# Web Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **ap-northeast-2**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A fintech startup needs to deploy their payment processing web application on AWS. The application consists of a Node.js API backend and requires high availability with automated deployments. The team has chosen Pulumi for infrastructure management to benefit from TypeScript's type safety.

## Problem Statement
Create a Pulumi TypeScript program to deploy a containerized web application with load balancing and database connectivity. The configuration must:

1. Create a VPC with public and private subnets across 2 availability zones.
2. Deploy an Application Load Balancer (ALB) in public subnets with HTTPS listener on port 443.
3. Set up an ECS cluster using Fargate for container orchestration.
4. Configure an ECS service running 3 tasks of the containerized application from ECR.
5. Create an RDS PostgreSQL instance in private subnets with Multi-AZ enabled.
6. Configure security groups allowing ALB to ECS communication on port 3000.
7. Set up auto-scaling for ECS tasks (min: 3, max: 10) based on CPU utilization.
8. Create a Route53 hosted zone and alias record pointing to the ALB.
9. Output the ALB DNS name and database endpoint for application configuration.

Expected output: A fully functional web application infrastructure with the API accessible via HTTPS through the load balancer, automatic scaling based on load, and database connectivity established through secure private networking.

## Constraints and Requirements
- Use Pulumi's @pulumi/aws package version 5.x or higher
- Container image must be pulled from a private ECR repository
- RDS instance must use db.t3.micro instance class for cost optimization
- Enable deletion protection on the RDS instance
- ALB must have at least one SSL certificate attached from ACM
- ECS tasks must use 512 CPU units and 1024 MiB memory
- Configure CloudWatch log groups with 7-day retention for ECS tasks
- Use AWS Secrets Manager to store database credentials
- Enable ECS task definition network mode as 'awsvpc'
- Tag all resources with Environment='production' and ManagedBy='pulumi'

## Environment Setup
AWS infrastructure in ap-northeast-2 region deploying containerized Node.js application using ECS Fargate behind an Application Load Balancer. RDS PostgreSQL Multi-AZ database in private subnets. Requires Pulumi CLI 3.x, Node.js 16+, TypeScript 4.x, and AWS CLI configured with appropriate credentials. VPC spans 2 AZs with public subnets for ALB and private subnets for ECS tasks and RDS.

---

## Implementation Guidelines

### Platform Requirements
- Use pulumi as the IaC framework
- All code must be written in ts
- Follow pulumi best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

## Target Region
Deploy all resources to: **ap-northeast-2**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
