# Ideal Response for TapStack Implementation

The ideal response should be a complete, production-ready multi-region AWS VPC infrastructure using Pulumi with the following key features:

## High-Level Requirements:

1. **Multi-region support** with explicit AWS providers for each region
2. **Non-overlapping CIDR blocks** for each region (10.0.0.0/16, 10.1.0.0/16, etc.)
3. **VPC with DNS enabled** (hostnames and support)
4. **4 subnets per AZ** (2 public + 2 private) across 2 AZs
5. **Internet Gateway** for public subnets
6. **NAT Gateway** with Elastic IP for private subnets
7. **Route tables** with proper routing configuration
8. **Tiered security groups** (web, app, db) with environment-aware SSH access
9. **Comprehensive tagging strategy** with Environment, Team, and Project tags
10. **Cost optimization** with configurable HA NAT Gateway option
11. **Security hardening** with production environment restrictions
12. **Proper resource dependencies** and provider management
13. **Comprehensive exports** for testing and verification
14. **Environment-aware configuration** with secure defaults
15. **Production-ready security validation** and audit logging
16. **Clean code organization** with helper functions and proper documentation

## Key Implementation Patterns:

### Multi-Region Provider Configuration
- Explicit AWS providers for each region
- Proper resource tagging with region information
- Non-overlapping CIDR blocks per region

### Environment-Aware Security Controls
- Production: VPC CIDR only for SSH access
- Development: 0.0.0.0/0 allowed for convenience
- Automatic production override protection
- Security validation with audit logging

### Proper Subnet CIDR Calculation
- Dynamic subnet CIDR calculation using ipaddress library
- /24 subnets (256 IPs each) for proper sizing
- Non-overlapping subnet ranges within VPC

### Configurable HA NAT Gateway
- Single NAT Gateway for cost optimization (default)
- Optional HA NAT Gateway per AZ for high availability
- Proper Elastic IP allocation and tagging

### Tiered Security Groups with Proper Restrictions
- Web tier: HTTP/HTTPS from anywhere, SSH from allowed CIDRs
- App tier: HTTP/HTTPS from web tier, SSH from allowed CIDRs
- Database tier: Database ports from app tier, minimal egress

### Conditional Output Exports
- VPC IDs and CIDR blocks for all regions
- Public and private subnet IDs
- Security group IDs for all tiers
- NAT Gateway IDs
- Configuration and summary information

### Proper Resource Dependencies and Provider Usage
- Explicit provider assignment for all resources
- Proper dependency management between resources
- Resource naming with environment and region context

### Comprehensive Tagging Strategy
- Environment, Team, and Project tags on all resources
- Purpose and SecurityLevel tags for better organization
- Region and AZ information for multi-region deployments

### Regional Infrastructure Organization
- Modular function structure for VPC creation
- Helper functions for NAT Gateway and subnet creation
- Clean separation of concerns and maintainable code

## Expected Outputs:

The implementation should export:
- VPC information for all regions
- Subnet IDs (public and private)
- Security group IDs (web, app, db)
- NAT Gateway IDs
- Configuration parameters
- Infrastructure summary with resource counts

## Security Requirements:

- Environment-aware SSH access control
- Production security hardening
- Least-privilege security group rules
- Proper network segmentation between tiers
- DNS resolution enabled for VPC
- Comprehensive security validation

## Code Quality Standards:

- Follow AWS best practices
- Proper error handling and validation
- Comprehensive documentation and comments
- Clean code organization with helper functions
- Production-ready configuration management
- Environment-specific security policies