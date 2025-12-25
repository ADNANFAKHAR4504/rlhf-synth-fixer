# Route 53 Failover Infrastructure - Ideal Implementation

This CloudFormation template provides a production-ready implementation of an EC2-based web application infrastructure with automated Route 53 failover capabilities.

## Architecture Overview

The solution implements a highly available web application infrastructure using:

- **VPC Infrastructure**: Custom VPC with public subnets in multiple Availability Zones
- **EC2 Instances**: Primary and standby web servers in different AZs
- **Route 53 Failover**: DNS-based automatic failover using health checks
- **Security**: Parameterized security groups with controlled access
- **Monitoring**: CloudWatch alarms for instance status monitoring

## Key Features

### 1. Multi-AZ Deployment
- Primary EC2 instance in first Availability Zone
- Standby EC2 instance in second Availability Zone
- Automatic AZ selection using `!GetAZs` function

### 2. Route 53 Health Checks
- HTTP health check monitoring primary instance `/health` endpoint
- 30-second interval with 3-failure threshold
- Automatic failover when primary becomes unhealthy
- Automatic failback when primary recovers

### 3. Security Configuration
- Parameterized SSH access control via `AllowedSSHCIDR`
- Web traffic allowed from anywhere (HTTP/HTTPS)
- IAM roles with minimal required permissions
- Security groups with explicit ingress/egress rules

### 4. Web Server Setup
- Apache HTTP server with custom landing pages
- Health check endpoints at `/health`
- CloudWatch agent for metrics collection
- Differentiated content for primary vs standby servers

### 5. Infrastructure as Code Best Practices
- Comprehensive parameter validation with constraints
- Resource tagging for organization and billing
- Proper resource naming conventions
- Export values for cross-stack references

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `KeyPairName` | AWS::EC2::KeyPair::KeyName | Required | EC2 Key Pair for SSH access |
| `InstanceType` | String | t3.micro | EC2 instance type |
| `HostedZoneId` | AWS::Route53::HostedZone::Id | Required | Route 53 Hosted Zone |
| `DomainName` | String | Required | Domain name for failover |
| `AllowedSSHCIDR` | String | 0.0.0.0/0 | CIDR block for SSH access |

## Resources Created

### Networking (7 resources)
- VPC with DNS support
- Internet Gateway and attachment
- Two public subnets in different AZs
- Route table with internet route
- Subnet route table associations

### Compute (2 resources)
- Primary EC2 instance with web server
- Standby EC2 instance with web server

### Security (3 resources)
- IAM role for EC2 instances
- IAM instance profile
- Security group for web servers

### DNS & Monitoring (5 resources)
- Route 53 health check for primary instance
- Primary DNS record with failover routing
- Standby DNS record with failover routing
- CloudWatch alarms for both instances

## Outputs

The template provides 12 comprehensive outputs covering:
- Instance IDs and availability zones
- Public IP addresses and DNS names
- Route 53 health check ID
- VPC and security group IDs
- Domain name configuration

## Testing Coverage

### Unit Tests (36 tests)
- Template structure validation
- Parameter configuration testing
- Resource property verification
- Output format validation
- Tagging consistency checks
- Security configuration validation

### Integration Tests (12 tests)
- Deployment output validation
- Web server accessibility testing
- Health check endpoint verification
- Infrastructure component validation
- End-to-end functionality testing

## Security Considerations

1. **Network Security**: Web servers in public subnets with controlled security group rules
2. **Access Control**: SSH access parameterized for environment-specific restrictions
3. **IAM Permissions**: Minimal required permissions for CloudWatch and Route 53
4. **Health Monitoring**: Automated health checks with appropriate thresholds

## Operational Excellence

1. **Monitoring**: CloudWatch alarms for instance status
2. **Logging**: CloudWatch agent configuration included
3. **Tagging**: Consistent resource tagging for organization
4. **Documentation**: Comprehensive metadata and descriptions

## Best Practices Implemented

-  Multi-AZ deployment for high availability
-  Automated failover with health checks
-  Parameterized configuration for flexibility
-  Comprehensive testing coverage
-  Security groups with explicit rules
-  Resource tagging for management
-  CloudFormation linting compliance
-  Infrastructure as Code principles

This implementation provides a robust, scalable, and maintainable solution for web application failover requirements.