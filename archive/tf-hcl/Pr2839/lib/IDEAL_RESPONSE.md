# IDEAL RESPONSE

## Terraform Best Practices Implementation

### 1. Resource Organization
- Logical separation of resources across files
- Consistent naming conventions
- Proper resource dependencies
- Modular architecture when appropriate
- Clear resource hierarchy

### 2. Security Implementation
- Least privilege access principles
- Network segmentation with public/private subnets
- Security groups with specific port/protocol rules
- Encrypted storage for sensitive data
- IMDSv2 enforcement on EC2 instances
- KMS encryption for secrets

### 3. Network Architecture
- VPC with proper CIDR planning
- Multi-AZ deployment for high availability
- Internet Gateway for public connectivity
- Separate route tables for network isolation
- Security group rules based on source groups
- Private subnets for sensitive workloads

### 4. IAM Best Practices
- Service-specific IAM roles
- Condition-based policies
- Minimal required permissions
- Proper trust relationships
- Resource-specific ARN restrictions
- Secure transport enforcement

### 5. Variable Management
- Type-safe variable definitions
- Sensible default values
- Sensitive variable handling
- Comprehensive descriptions
- Validation rules where applicable

### 6. Tagging Strategy
- Consistent tagging across all resources
- Environment identification
- Owner and purpose tracking
- Cost allocation tags
- Compliance requirement tags

### 7. Output Standards
- Comprehensive resource references
- Clear output descriptions
- Proper sensitive data handling
- Cross-stack integration support
- Meaningful naming conventions

### 8. Error Prevention
- Data source validation
- Resource availability checks
- Dependency management
- State consistency measures
- Rollback capabilities

### 9. Monitoring Readiness
- CloudWatch integration points
- Logging configuration
- Metrics collection setup
- Alerting hook preparation
- Performance monitoring tags

### 10. Compliance Features
- Encryption at rest and in transit
- Access logging capabilities
- Audit trail preparation
- Backup and recovery planning
- Disaster recovery considerations

## Expected Behaviors

### Successful Deployment
- All resources created without errors
- Proper resource relationships established
- Network connectivity verified
- Security policies enforced
- Outputs generated correctly

### Security Validation
- No publicly accessible private resources
- Encrypted data storage confirmed
- Minimal IAM permissions verified
- Network isolation tested
- Secret access restricted

### Operational Readiness
- Instance health checks passing
- Service connectivity confirmed
- Logging mechanisms active
- Monitoring data flowing
- Backup procedures functional