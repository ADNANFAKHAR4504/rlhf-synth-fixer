# Terraform Multi-Environment Infrastructure Setup

## Project Overview
**Project Name:** IaC - AWS Nova Model Breaking  
**Objective:** Create a scalable and flexible infrastructure supporting multiple environments (Dev, Staging, and Prod) using Terraform with AWS as the cloud provider.

## Context
You are tasked with designing and implementing a comprehensive Terraform-based infrastructure solution that supports multiple environments while maintaining consistency, security, and cost optimization. The solution must be production-ready, well-documented, and follow industry best practices.

## Critical Requirements

### 1. Environment Management
- **Multi-Environment Support:** Implement separate environments for Development, Staging, and Production
- **Environment Isolation:** Use Terraform workspaces to ensure complete separation of environment states
- **Environment-Specific Variables:** All variables must be defined at the environment level to allow easy overrides
- **Consistent Architecture:** Maintain architectural consistency across all environments while allowing environment-specific customizations

### 2. Terraform Configuration Standards
- **Version Compliance:** Ensure Terraform version 1.0.0 or newer is used
- **Provider Compliance:** Use only legal, officially supported Terraform providers, modules, and functions
- **Modular Design:** Implement a modular Terraform architecture with well-defined inputs and outputs between modules
- **State Management:** Utilize AWS S3 for remote state management and DynamoDB for state locking

### 3. Naming and Organization
- **Naming Convention:** All resources must follow the pattern: `<env>-<service>-<component>`
  - Examples: `dev-web-alb`, `staging-db-rds`, `prod-cache-redis`
- **Resource Tagging:** Implement comprehensive tagging strategy for all resources to aid in cost tracking and management
- **Documentation:** Document all module interfaces comprehensively in README.md files

### 4. AWS Infrastructure
- **Primary Region:** Use `us-east-1` as the primary AWS region
- **Failover Strategy:** Implement failover capabilities to `us-west-2` region
- **Security:** Security groups must adhere to the principle of least privilege
- **Cost Optimization:** Apply Terraform best practices for cost optimization across all environments

## Technical Constraints

### Infrastructure Components
- **Compute Resources:** EC2 instances, Auto Scaling Groups, Load Balancers
- **Storage:** S3 buckets, EBS volumes, EFS file systems
- **Database:** RDS instances with appropriate backup and monitoring
- **Networking:** VPC, subnets, security groups, NAT gateways
- **Monitoring:** CloudWatch, CloudTrail, and logging infrastructure

### Security Requirements
- **Network Security:** Implement proper network segmentation and security group rules
- **Access Control:** Use IAM roles and policies following least privilege principle
- **Encryption:** Enable encryption at rest and in transit for all applicable resources
- **Compliance:** Ensure infrastructure meets security best practices

### Operational Requirements
- **Monitoring:** Implement comprehensive monitoring and alerting
- **Backup:** Configure automated backups for critical resources
- **Disaster Recovery:** Implement failover mechanisms and backup strategies
- **Scalability:** Design for horizontal and vertical scaling capabilities

## Expected Deliverables

### 1. Terraform Configuration Files
- **Root Module:** Main Terraform configuration with environment-specific variable files
- **Child Modules:** Well-structured modules for different infrastructure components
- **Variable Definitions:** Environment-specific variable files (`dev.tfvars`, `staging.tfvars`, `prod.tfvars`)
- **Output Definitions:** Clear output variables for each module and environment

### 2. State Management Setup
- **S3 Backend Configuration:** Remote state storage configuration
- **DynamoDB Lock Table:** State locking mechanism setup
- **Workspace Configuration:** Terraform workspace management for environment separation

### 3. Documentation
- **README.md Files:** Comprehensive documentation for each module
- **Setup Instructions:** Clear setup and deployment workflow documentation
- **Architecture Diagrams:** Visual representation of the infrastructure design
- **Cost Analysis:** Documentation of cost optimization strategies and expected costs

### 4. Testing and Validation
- **Unit Tests:** Terraform validation tests for each module
- **Integration Tests:** End-to-end testing for each environment
- **Security Tests:** Security scanning and compliance validation
- **Performance Tests:** Load testing and performance validation

## Implementation Approach

### Phase 1: Foundation Setup
1. **Terraform Backend Configuration:** Set up S3 bucket and DynamoDB table for state management
2. **Workspace Creation:** Create separate workspaces for dev, staging, and prod
3. **Module Structure:** Design and implement the modular architecture
4. **Variable Definitions:** Create environment-specific variable files

### Phase 2: Core Infrastructure
1. **Networking Module:** VPC, subnets, security groups, and routing
2. **Compute Module:** EC2 instances, Auto Scaling Groups, and Load Balancers
3. **Storage Module:** S3 buckets, EBS volumes, and backup configurations
4. **Database Module:** RDS instances with appropriate configurations

### Phase 3: Advanced Features
1. **Monitoring Setup:** CloudWatch dashboards and alarms
2. **Security Hardening:** IAM policies, encryption, and compliance
3. **Cost Optimization:** Resource optimization and cost monitoring
4. **Documentation:** Complete documentation and handoff materials

## Success Criteria

### Functional Requirements
- All three environments (dev, staging, prod) deploy successfully
- Resources follow the specified naming convention
- State management works correctly with S3 and DynamoDB
- Workspaces provide proper environment isolation
- All modules have clear inputs and outputs

### Non-Functional Requirements
- Infrastructure is cost-optimized across all environments
- Security groups follow least privilege principle
- All resources are properly tagged for cost tracking
- Documentation is comprehensive and clear
- Tests and validations pass for each environment

### Operational Requirements
- Setup and deployment workflows are documented
- Infrastructure supports scaling requirements
- Monitoring and alerting are properly configured
- Backup and disaster recovery mechanisms are in place

## Risk Mitigation

### Technical Risks
- **State Corruption:** Implement proper state locking and backup strategies
- **Resource Conflicts:** Use consistent naming and workspace separation
- **Cost Overruns:** Implement cost monitoring and resource optimization
- **Security Vulnerabilities:** Regular security scanning and compliance checks

### Operational Risks
- **Deployment Failures:** Implement proper testing and validation procedures
- **Knowledge Transfer:** Maintain comprehensive documentation and runbooks
- **Environment Drift:** Use infrastructure as code best practices and regular audits

## Validation Criteria

### Pre-Deployment Validation
- Terraform plan executes without errors for all environments
- All modules validate successfully with `terraform validate`
- Security scanning passes without critical issues
- Cost estimates are within acceptable ranges

### Post-Deployment Validation
- All resources are created with correct naming conventions
- Security groups allow only necessary traffic
- Monitoring and alerting are functional
- Documentation is accurate and up-to-date

## Next Steps

1. **Review and Approve:** Review this prompt and confirm all requirements are understood
2. **Environment Setup:** Set up the Terraform backend and workspace configuration
3. **Module Development:** Begin developing the core infrastructure modules
4. **Testing:** Implement and run comprehensive tests for each environment
5. **Documentation:** Create detailed documentation and handoff materials
6. **Deployment:** Deploy and validate all three environments
7. **Handoff:** Provide complete documentation and training for ongoing maintenance

---

**Note:** This infrastructure solution should be production-ready, scalable, and maintainable. All code should follow Terraform best practices and be thoroughly tested before deployment to any environment.