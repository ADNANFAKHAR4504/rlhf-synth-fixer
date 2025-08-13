```yaml
# CloudFormation Infrastructure Design Challenge

## Problem Statement
Design and implement a production-ready CloudFormation template that creates a secure, scalable web application infrastructure in AWS. The solution must demonstrate enterprise-grade security practices while meeting specific compliance and operational requirements.

## Infrastructure Requirements

### Core Components
- **Web Application Infrastructure**: Deploy a complete web application stack with proper load balancing and auto-scaling capabilities
- **Security-First Design**: Implement comprehensive security controls following AWS Well-Architected Framework principles
- **Compliance Ready**: Ensure all components meet enterprise security standards and audit requirements

### Technical Specifications

#### 1. Regional Configuration
- **AWS Region**: Deploy exclusively in `us-east-1` region
- **Multi-AZ Setup**: Ensure high availability across multiple availability zones

#### 2. Security & Compliance Requirements
- **CloudTrail Integration**: Enable comprehensive logging of all S3 bucket access and API calls
- **IAM Security**: Implement least-privilege access controls with properly scoped IAM roles and policies
- **Data Encryption**: Ensure all RDS databases use AWS KMS for encryption at rest
- **Resource Tagging**: Apply consistent tagging strategy with `Environment:Production` for all EC2 instances

#### 3. Application Architecture
- **Load Balancing**: Implement Application Load Balancer (ALB) for traffic distribution and health monitoring
- **Auto Scaling**: Configure auto-scaling groups for EC2 instances with proper scaling policies
- **Database Layer**: Deploy RDS instances with encryption, backup, and monitoring capabilities

## Success Criteria

### Functional Requirements
- [ ] Template deploys successfully in us-east-1 region
- [ ] All S3 bucket access is logged via CloudTrail
- [ ] IAM roles follow least privilege principle
- [ ] All EC2 instances tagged with `Environment:Production`
- [ ] RDS instances encrypted at rest using AWS KMS
- [ ] Application Load Balancer properly configured and functional

### Quality Standards
- [ ] CloudFormation template passes AWS CloudFormation linter validation
- [ ] All resources follow AWS security best practices
- [ ] Template includes proper error handling and rollback capabilities
- [ ] Documentation and comments are comprehensive and clear
- [ ] Resource naming follows consistent conventions

### Security Validation
- [ ] No hardcoded credentials or sensitive information
- [ ] All security groups and NACLs properly configured
- [ ] Encryption enabled for data in transit and at rest
- [ ] Proper logging and monitoring infrastructure in place

## Deliverables

1. **CloudFormation YAML Template**: Complete, production-ready template that meets all requirements
2. **Documentation**: Clear explanation of the architecture and security measures implemented
3. **Validation**: Proof that the template passes CloudFormation linter tests
4. **Security Review**: Documentation of security controls and compliance measures

## Evaluation Criteria

The solution will be evaluated based on:
- **Completeness**: All requirements are met and functional
- **Security**: Implementation of security best practices and compliance measures
- **Quality**: Clean, maintainable code with proper error handling
- **Performance**: Efficient resource utilization and scalability considerations
- **Documentation**: Clear, comprehensive documentation of the solution

## Additional Considerations

- Consider cost optimization strategies while maintaining security requirements
- Implement proper monitoring and alerting for the infrastructure
- Plan for disaster recovery and backup strategies
- Ensure the solution is maintainable and follows infrastructure-as-code best practices
- Consider future scalability and expansion requirements
```
