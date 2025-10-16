# AWS CDK CI/CD Pipeline Implementation Prompt

## Context & Objective

You are an expert AWS Solutions Architect tasked with building a comprehensive CI/CD pipeline infrastructure using AWS CDK in TypeScript. Your goal is to create a production-ready deployment pipeline that automates the entire application lifecycle from code commit to production deployment.

## Core Requirements

### Primary Infrastructure Components
Build a complete CI/CD pipeline that includes:

1. **AWS CodePipeline** - Main orchestration service for the deployment pipeline
2. **AWS CodeBuild** - Build service with custom buildspec.yml configuration
3. **AWS CodeDeploy** - Application deployment service for EC2 instances
4. **AWS S3** - Secure artifact storage with encryption
5. **AWS Secrets Manager** - Database credentials management
6. **AWS Lambda** - Custom notification functions for deployment milestones
7. **Amazon SNS** - Team notification system for pipeline status changes
8. **AWS CloudWatch Logs** - Comprehensive logging for all pipeline stages
9. **VPC & Security Groups** - Network isolation and traffic control

### Critical Features
- **Manual Approval Gates** - Required before production deployments
- **Rollback Mechanisms** - Automatic rollback on deployment failures
- **Dual Trigger Support** - Manual and automatic (code commit) triggers
- **Least Privilege IAM** - Minimal required permissions for all roles
- **Security Best Practices** - Encryption, network restrictions, and compliance

## Technical Specifications

### File Structure
Create exactly two files:
- `main.ts` - CDK application entry point and initialization
- `tapstack.ts` - Complete infrastructure stack with all resources

### Resource Connections
Focus on creating proper resource relationships:
- **Pipeline → Build → Deploy** - Seamless flow between services
- **S3 ↔ CodeBuild** - Artifact storage and retrieval
- **Secrets Manager ↔ CodeDeploy** - Secure credential access
- **Lambda ↔ SNS** - Notification integration
- **CloudWatch ↔ All Services** - Centralized logging
- **VPC ↔ EC2/CodeDeploy** - Network isolation

### Naming Convention
Use consistent naming pattern: `{service}-{environment}-{purpose}`
Example: `pipeline-prod-webapp`, `build-staging-artifacts`

## Implementation Guidelines

### Code Quality Standards
- **Inline Comments** - Document all architectural decisions and configurations
- **TypeScript Best Practices** - Proper typing, interfaces, and error handling
- **Resource Tagging** - Consistent tags for cost tracking and management
- **Environment Variables** - Externalize configuration where appropriate

### Security Requirements
- **IAM Roles** - Least privilege access with specific service permissions
- **Network Security** - VPC with private subnets, restrictive security groups
- **Encryption** - S3 server-side encryption, Secrets Manager encryption
- **Access Control** - Proper resource policies and bucket policies

### Operational Excellence
- **Monitoring** - CloudWatch alarms for pipeline failures
- **Logging** - Structured logging across all pipeline stages
- **Error Handling** - Graceful failure handling and notifications
- **Scalability** - Design for future growth and multiple environments

## Expected Deliverables

### Code Structure
```typescript
// main.ts - Application entry point
import * as cdk from 'aws-cdk-lib';
import { TapStack } from './tapstack';

const app = new cdk.App();
new TapStack(app, 'CICDPipelineStack', {
  // Configuration parameters
});
```

### Key Resources to Implement
1. **CodePipeline** with source, build, and deploy stages
2. **CodeBuild Project** with custom buildspec configuration
3. **CodeDeploy Application** with EC2 deployment groups
4. **S3 Buckets** for artifacts with lifecycle policies
5. **Lambda Functions** for notifications and custom logic
6. **SNS Topics** with email subscriptions
7. **IAM Roles** with minimal required permissions
8. **VPC Configuration** with public/private subnets
9. **Security Groups** with restrictive rules
10. **CloudWatch Log Groups** for all services

## Success Criteria

The implementation should:
- ✅ Deploy successfully without errors
- ✅ Include all required AWS services with proper connections
- ✅ Follow security best practices and least privilege access
- ✅ Support both manual and automatic pipeline triggers
- ✅ Include comprehensive logging and monitoring
- ✅ Implement proper rollback mechanisms
- ✅ Use consistent naming conventions throughout
- ✅ Include detailed inline documentation

## Additional Considerations

- **Cost Optimization** - Use appropriate instance types and storage classes
- **High Availability** - Design for multi-AZ deployment where applicable
- **Backup & Recovery** - Include backup strategies for critical data
- **Compliance** - Ensure adherence to common security frameworks
- **Testing** - Include validation steps in the pipeline

Remember: Focus on creating a robust, secure, and maintainable CI/CD pipeline that can handle real-world production workloads while following AWS best practices.