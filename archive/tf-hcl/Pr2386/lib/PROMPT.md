Generate a _complete, production-grade Terraform configuration_ for AWS that lives _entirely in a single file named lib/tap_stack.tf. \*\*Do not include any provider configuration_ (a separate provider.tf already exists). The code must be valid HCL, apply cleanly, and meet every requirement below.

# Terraform Multi-Environment AWS Infrastructure

## Project Overview

The organization operates both a staging and production environment on AWS. Resources must be deployed and managed using Terraform with HCL syntax. Both environments need to be consistent in structure but isolated from each other.

**Project Name**: IaC - AWS Nova Model Breaking

## Infrastructure Requirements

### Multi-Environment Architecture

- **Staging Environment**: Development and testing environment
- **Production Environment**: Live production environment
- **Environment Isolation**: Complete separation between environments
- **Consistent Structure**: Same resource types across environments with environment-specific configurations

### Core Infrastructure Components

#### 1. Provider Configuration

- Use Terraform's `provider` block to specify distinct configurations for both environments
- Separate AWS provider configurations for staging and production
- Environment-specific region and account configurations

#### 2. Remote State Management

- Use Terraform Cloud for remote state management
- Separate state files for each environment
- Secure state storage with proper access controls
- State locking to prevent concurrent modifications

#### 3. S3 Storage Layer

- S3 bucket with versioning enabled for each environment
- Environment-specific bucket naming: `myapp-staging` and `myapp-production`
- Proper bucket policies and access controls
- Server-side encryption enabled

#### 4. Security Implementation

- Security groups allowing inbound traffic only on port 443 (HTTPS)
- Environment-specific security group configurations
- Network ACLs for additional network security
- VPC configuration with proper subnet isolation

#### 5. IAM and Access Control

- Environment-specific IAM roles and policies
- Least privilege principle implementation
- Separate IAM users/groups for each environment
- Cross-account access policies where needed

#### 6. Modular Architecture

- Use submodules for resources common to both environments
- Reusable modules for:
  - VPC and networking
  - Security groups
  - IAM roles and policies
  - S3 bucket configurations
- Environment-specific variable overrides

## Technical Constraints

### File Structure

- **Main Configuration**: `tap_stack.tf` (all infrastructure code in one file)
- **Provider Configuration**: `provider.tf` (already exists, contains AWS provider + S3 backend)
- **Variables**: Environment-specific variables defined in main configuration
- **Outputs**: Environment-specific outputs for resource references

### Naming Conventions

- **Staging Resources**: `myapp-staging-{resource-type}-{identifier}`
- **Production Resources**: `myapp-production-{resource-type}-{identifier}`
- **Consistent naming across all resource types**
- **Random suffixes to prevent naming conflicts**

### Resource Tagging

- All resources must be tagged with `environment` key set to `staging` or `production`
- Additional tags for:
  - `Project`: Project identifier
  - `ManagedBy`: Terraform
  - `CostCenter`: Environment-specific cost allocation
  - `Owner`: Team or department responsible

### Security Requirements

- **Network Security**: HTTPS-only access (port 443)
- **Data Encryption**: Server-side encryption for all data at rest
- **Access Control**: Least privilege IAM policies
- **Audit Logging**: CloudTrail enabled for both environments
- **Compliance**: SOC 2, PCI DSS, or industry-specific compliance standards

### Scalability and Performance

- **Auto Scaling**: Environment-appropriate scaling policies
- **Load Balancing**: Application Load Balancers for traffic distribution
- **Monitoring**: CloudWatch metrics and alarms
- **Backup and Recovery**: Automated backup strategies

## Environment-Specific Configurations

### Staging Environment

- **Purpose**: Development, testing, and pre-production validation
- **Resource Sizing**: Smaller instance types and storage
- **Scaling**: Conservative auto-scaling policies
- **Cost Optimization**: Spot instances where appropriate
- **Access**: Broader developer access for testing

### Production Environment

- **Purpose**: Live production workloads
- **Resource Sizing**: Production-grade instance types and storage
- **Scaling**: Aggressive auto-scaling for high availability
- **Reliability**: Reserved instances for cost predictability
- **Access**: Restricted access with approval workflows

## Implementation Guidelines

### Terraform Best Practices

- **State Management**: Use Terraform Cloud workspaces for environment separation
- **Variable Validation**: Input validation for all variables
- **Output Documentation**: Clear output descriptions and usage examples
- **Error Handling**: Proper error messages and rollback procedures
- **Testing**: Unit and integration tests for all configurations

### Code Quality Standards

- **Modularity**: Reusable modules for common resources
- **Documentation**: Inline comments explaining complex configurations
- **Version Control**: Semantic versioning for infrastructure changes
- **Code Review**: Mandatory peer review for all changes
- **Testing**: Automated testing in CI/CD pipeline

### Deployment Strategy

- **Staging First**: All changes deployed to staging before production
- **Blue-Green Deployment**: Zero-downtime deployment capability
- **Rollback Plan**: Automated rollback procedures
- **Monitoring**: Real-time monitoring during deployments
- **Approval Gates**: Manual approval for production deployments

## Success Criteria

### Functional Requirements

- ✅ Multi-environment setup with complete isolation
- ✅ Environment-specific resource configurations
- ✅ Proper security implementation (HTTPS-only, least privilege)
- ✅ Modular architecture with reusable components
- ✅ Remote state management via Terraform Cloud
- ✅ Consistent naming conventions across environments

### Non-Functional Requirements

- ✅ High availability and fault tolerance
- ✅ Scalability for future growth
- ✅ Cost optimization and monitoring
- ✅ Security compliance and audit readiness
- ✅ Operational excellence and monitoring
- ✅ Disaster recovery and backup strategies

### Quality Assurance

- ✅ All resources properly tagged and documented
- ✅ Comprehensive testing coverage
- ✅ Code review and approval processes
- ✅ Automated deployment pipelines
- ✅ Monitoring and alerting systems
- ✅ Documentation and runbooks

## Deliverables

### Required Files

1. **`tap_stack.tf`**: Complete Terraform configuration for both environments
2. **`provider.tf`**: Provider configuration (already exists)
3. **Documentation**: Implementation guide and operational procedures
4. **Tests**: Unit and integration tests for validation

### Expected Output

- Terraform configuration that successfully creates necessary resources in AWS
- Environment-specific resource isolation and security
- Modular, maintainable, and scalable infrastructure code
- Comprehensive documentation and operational procedures

## Constraints and Limitations

### Technical Constraints

- All infrastructure code must live in `tap_stack.tf`
- `provider.tf` already exists and should not be modified unless necessary
- Must use Terraform Cloud for remote state management
- Environment-specific configurations must be clearly separated

### Operational Constraints

- Zero-downtime deployment requirements
- Compliance with security and audit requirements
- Cost optimization and budget constraints
- Team skill level and training requirements

### Timeline and Resources

- Implementation timeline: 2-4 weeks
- Team size: 2-3 infrastructure engineers
- Budget: Environment-appropriate resource allocation
- Stakeholder approval required for production changes

## Risk Mitigation

### Technical Risks

- **State Corruption**: Regular state backups and validation
- **Configuration Drift**: Automated drift detection and remediation
- **Security Vulnerabilities**: Regular security scanning and updates
- **Performance Issues**: Continuous monitoring and optimization

### Operational Risks

- **Human Error**: Automated testing and approval workflows
- **Resource Exhaustion**: Proper resource limits and monitoring
- **Compliance Violations**: Regular audit and compliance checks
- **Cost Overruns**: Budget monitoring and alerting

## Future Considerations

### Scalability

- Multi-region deployment capability
- Global load balancing and CDN integration
- Container orchestration platform integration
- Serverless architecture adoption

### Innovation

- Infrastructure as Code best practices evolution
- New AWS service adoption
- Automation and AI/ML integration
- Advanced monitoring and observability

### Compliance and Governance

- Enhanced security controls and monitoring
- Regulatory compliance automation
- Governance and policy enforcement
- Audit and reporting automation
  Please use cfn-output to test live resources in integration tests

Deliverable Format

Return _only_ a single fenced code block with the complete HCL for lib/tap_stack.tf. No prose outside the code block.
\hcl

# lib/tap_stack.tf

Make sure the code is ready to paste into lib/main.tf and run with terraform apply -var-file=... using the variables described above.
