# TAP Stack Infrastructure Implementation Prompt

## Task Overview

Implement a community discussion forum using AWS services through a CloudFormation YAML template. The forum needs to support 4.5k monthly active users, with moderation and search capabilities.

## Requirements Specification

### Infrastructure Components Required:

1. **Network/Compute Infrastructure**:
   - VPC with CIDR 10.27.0.0/16
   - Application Load Balancer for traffic distribution
   - EC2 t3.medium instances for web servers

2. **Database & Caching Layer**:
   - RDS MySQL (db.t3.small) for persistent data storage
   - ElastiCache Redis for session and query caching

3. **Storage & Content Delivery**:
   - S3 for user uploads with lifecycle policies
   - CloudFront for asset delivery and performance optimization

4. **Search & Security Services**:
   - Amazon Elasticsearch Service for full-text search capabilities
   - AWS WAF for spam protection and security filtering

5. **Monitoring & Operations**:
   - CloudWatch for application health monitoring
   - Automated scaling based on performance metrics

### Technical Constraints:

- **Region**: us-east-1
- **Template Format**: Single CloudFormation YAML file (TapStack.yml)
- **Environment**: Development environment setup
- **Security**: Implement proper security groups and access controls
- **Scalability**: Support for 4.5k monthly active users
- **High Availability**: Multi-AZ deployment where applicable

### Deliverable Requirements:

- Complete CloudFormation template with all specified services
- Proper parameter definitions for environment customization
- Comprehensive outputs for integration with other systems
- Security best practices implementation
- Cost optimization considerations
- Documentation of architecture decisions

### Success Criteria:

1. Template deploys successfully without validation errors
2. All AWS services properly configured and interconnected
3. Security groups allow necessary traffic while maintaining security
4. Resources properly tagged and named for identification
5. Template follows CloudFormation best practices
6. Infrastructure supports the specified user load (4.5k MAU)

This infrastructure should provide a robust, scalable foundation for a community discussion forum with comprehensive functionality including user management, content moderation, search capabilities, and performance optimization.