# AWS Web Application Infrastructure with Pulumi Java - Production Solution

## Overview
This solution provides a production-ready, highly available web application infrastructure using Pulumi and Java, implementing AWS best practices for scalability, security, and maintainability.

## Key Files Structure

### pom.xml - Maven Configuration
Includes Pulumi AWS provider v6.63.0, JUnit for testing, and JaCoCo for code coverage.

### src/main/java/com/pulumi/WebAppStackConfig.java - Configuration Management
Centralized configuration class with all infrastructure constants and helper methods for improved testability and maintainability.

### src/main/java/com/pulumi/WebAppStack.java - Main Infrastructure
Complete Pulumi stack implementation with VPC, ALB, Auto Scaling Group, Security Groups, IAM roles, and S3 bucket.

## Key Infrastructure Components

### 1. Network Architecture
- **VPC**: 10.0.0.0/16 CIDR block with DNS support
- **Public Subnets**: Two subnets (10.0.1.0/24, 10.0.2.0/24) across different AZs
- **Internet Gateway**: Provides internet connectivity
- **Route Tables**: Proper routing configuration for public subnets

### 2. Load Balancing
- **Application Load Balancer**: Distributes traffic across instances
- **Target Group**: HTTP health checks on port 80 with "/" path
- **Listeners**: Both HTTP (80) and HTTPS (443) configured

### 3. Auto Scaling
- **Launch Template**: Uses Amazon Linux 2 AMI with t3.micro instances
- **Auto Scaling Group**: Min 2, Max 4, Desired 2 instances
- **Health Checks**: ELB-based with 300-second grace period
- **User Data**: Automated Apache installation and configuration

### 4. Security
- **ALB Security Group**: Allows HTTP/HTTPS from internet (0.0.0.0/0)
- **Instance Security Group**: Only accepts traffic from ALB
- **IAM Role**: EC2 instances with minimal S3 read permissions
- **Instance Profile**: Proper IAM role attachment for EC2 instances

### 5. Storage
- **S3 Bucket**: Private bucket for application code storage
- **Naming Convention**: Includes environment suffix for uniqueness

## Critical Improvements Made

### 1. Environment Suffix Implementation
- All resources include environment suffix to prevent naming conflicts
- Supports multiple deployments to same AWS account
- Configurable via ENVIRONMENT_SUFFIX environment variable
- Default suffix: "synthtrainr347"

### 2. Configuration Externalization
- Created WebAppStackConfig class for centralized configuration
- All constants defined in one place for easy modification
- Helper methods for resource naming and policy generation
- Improved testability through separation of concerns

### 3. Resource Naming Strategy
- Consistent naming pattern: `resource-type-environmentSuffix`
- S3 bucket names properly lowercase for compliance
- Launch template with proper prefix generation

### 4. Security Enhancements
- Security groups use Output.applyValue for proper Pulumi handling
- IAM policies defined as JSON strings for clarity
- No hardcoded credentials or secrets
- Principle of least privilege applied to all IAM roles

### 5. Testability Improvements
- Configuration logic separated from infrastructure code
- Unit tests for all configuration methods
- Integration test structure prepared
- 38 comprehensive unit tests covering configuration

## Production-Ready Features

### 1. High Availability
- Multi-AZ deployment across two availability zones
- Auto Scaling for automatic capacity adjustment
- Load balancer health checks for instance monitoring

### 2. Scalability
- Auto Scaling Group handles 2-4 instances
- Application Load Balancer for efficient traffic distribution
- Launch Templates for consistent instance configuration

### 3. Monitoring & Observability
- 9 infrastructure outputs exported for monitoring
- Health checks configured with appropriate thresholds
- ELB health check type for better instance replacement

### 4. Cost Optimization
- t3.micro instances for cost-effective compute
- Auto Scaling ensures optimal resource utilization
- Private S3 bucket with ACL for storage efficiency

### 5. Deployment Safety
- No deletion protection on resources
- All resources properly tagged
- Environment suffix prevents resource conflicts
- Clean resource dependencies

## Testing Strategy

### Unit Tests (38 tests)
- Configuration validation
- Resource naming conventions
- Policy structure verification
- Environment suffix handling
- Port and protocol validation
- Auto Scaling configuration checks

### Integration Tests (Planned)
- End-to-end deployment validation
- Load balancer connectivity
- Auto Scaling behavior
- Health check verification

## Deployment Process

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX=synthtrainr347

# Build the project
mvn clean compile

# Run tests
mvn test

# Initialize Pulumi stack
export PULUMI_CONFIG_PASSPHRASE=your-passphrase
pulumi stack init TapStack${ENVIRONMENT_SUFFIX}

# Configure AWS region
pulumi config set aws:region us-west-2

# Deploy infrastructure
pulumi up --yes --stack TapStack${ENVIRONMENT_SUFFIX}

# Get outputs
pulumi stack output --json

# Destroy infrastructure
pulumi destroy --yes --stack TapStack${ENVIRONMENT_SUFFIX}
```

## Resource Outputs

The stack exports 9 critical outputs:
1. **loadBalancerDnsName**: ALB DNS endpoint
2. **applicationUrl**: HTTP application URL
3. **applicationUrlHttps**: HTTPS application URL
4. **vpcId**: VPC identifier
5. **publicSubnet1Id**: First subnet ID
6. **publicSubnet2Id**: Second subnet ID
7. **autoScalingGroupName**: ASG name
8. **targetGroupArn**: Target group ARN
9. **codeBucketName**: S3 bucket name

## Best Practices Implemented

1. **Infrastructure as Code**: Complete infrastructure defined in code
2. **Immutable Infrastructure**: Launch Templates ensure consistency
3. **Security by Design**: Layered security with proper access controls
4. **Automation**: User data scripts automate server configuration
5. **Version Control**: All infrastructure code version controlled
6. **Testing**: Comprehensive test coverage for configuration
7. **Documentation**: Clear documentation and code comments
8. **Modularity**: Separated configuration from infrastructure logic

## Compliance & Governance

- All resources tagged with Environment, Project, ManagedBy, and EnvironmentSuffix
- IAM roles follow least privilege principle
- Security groups restrict access appropriately
- S3 bucket configured as private with proper ACLs
- No hardcoded values or secrets in code

This solution provides a robust, scalable, and maintainable web application infrastructure that follows AWS best practices and Pulumi patterns for production deployments.