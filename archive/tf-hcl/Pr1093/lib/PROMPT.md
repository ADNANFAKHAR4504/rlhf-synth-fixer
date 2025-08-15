You are a senior DevOps engineer specializing in AWS infrastructure automation. Create a comprehensive Terraform infrastructure solution for a highly scalable web application with the following specific requirements:

## Core Infrastructure Requirements:
- **Platform**: AWS Cloud
- **IaC Tool**: Terraform with HCL configuration
- **Application Type**: Highly scalable web application
- **Environments**: staging and production with different sizing requirements
- **State Management**: Terraform Cloud for remote state
- **Security**: Secrets management system integration (no hardcoded sensitive data)

## Technical Implementation Requirements:

### 1. Terraform Modules Architecture:
- Create reusable Terraform modules for common components (VPC, EC2, ALB)
- Implement proper module versioning and documentation
- Design modules to accept environment-specific parameters
- Include input validation and output definitions for each module

### 2. Multi-Environment Support:
- Configure 'staging' and 'production' environments with different resource sizing:
  - Staging: Smaller EC2 instances (e.g., t3.small) for cost optimization
  - Production: Larger EC2 instances (e.g., t3.large) for performance
- Implement environment-specific configuration files
- Use Terraform workspaces for environment state isolation

### 3. Automated Rollback Strategy:
- Design infrastructure deployment pipeline with automated rollback capabilities
- Implement health checks and validation steps post-deployment
- Create rollback procedures for failed deployments
- Include monitoring and alerting for deployment failures

### 4. Resource Management Standards:
- Apply consistent environment-specific tags to all resources (Environment, Project, Owner, CostCenter)
- Implement uniform resource naming conventions following pattern: `{environment}-{service}-{component}-{identifier}`
- Ensure all resources support the tagging strategy

### 5. Terraform Cloud Integration:
- Configure Terraform Cloud workspaces for each environment
- Set up proper authentication and authorization
- Implement workspace-specific variables and environment configurations
- Configure automated triggers and notifications

### 6. Security and Secrets Management:
- Integrate with AWS Secrets Manager or Systems Manager Parameter Store
- Use Terraform data sources to retrieve sensitive information
- Implement least-privilege IAM policies
- Never store secrets in plain text within configuration files