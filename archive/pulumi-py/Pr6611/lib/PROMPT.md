# Secure AWS Foundation for Financial Services Startup

Hey team,

We need to build a production-grade AWS foundation for a financial services startup that's launching their first trading platform. They're concerned about security, compliance, and automation right from day one. I've been asked to create this infrastructure using **Pulumi with Python** to give us the flexibility and type safety we need.

The startup needs a secure environment with proper network isolation, automated secret rotation for their trading platform API keys, centralized logging, and compliance monitoring. They're specifically asking for private subnets only, no public-facing infrastructure, and everything needs to be auditable for their regulatory requirements.

This is an expert-level task because we're bringing together VPC networking, Systems Manager Parameter Store with KMS encryption, Lambda-based automation, EventBridge orchestration, and comprehensive logging - all with proper tagging and stack dependency management.

## What we need to build

Create a secure AWS foundation using **Pulumi with Python** for a financial services trading platform. The infrastructure must span 3 availability zones in the us-east-2 region with comprehensive security, monitoring, and automation capabilities.

### Core Requirements

1. **Network Foundation**
   - VPC with CIDR 10.0.0.0/16 across 3 availability zones
   - Private subnets only: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - NAT instances (not NAT Gateways) in each AZ using latest Amazon Linux 2 AMI
   - Configure route tables for outbound internet access through NAT instances

2. **Secrets Management and Rotation**
   - AWS Systems Manager Parameter Store with SecureString parameters for API keys
   - KMS encryption for all Parameter Store values
   - Lambda functions to rotate Parameter Store values automatically
   - EventBridge scheduled rules triggering rotation every 30 days

3. **Network Visibility**
   - VPC Flow Logs capturing ALL traffic (accept, reject, and all)
   - Dedicated S3 bucket for VPC Flow Logs storage
   - 90-day retention lifecycle policy on Flow Logs bucket

4. **Event-Driven Architecture**
   - EventBridge custom event bus for application events
   - EventBridge rules forwarding events to CloudWatch Logs
   - Proper IAM permissions for event delivery

5. **Resource Organization**
   - Consistent tagging schema: Environment, Owner, CostCenter on all resources
   - Use environmentSuffix variable in all resource names
   - Naming convention: resource-type-environment-suffix
   - Pulumi stack exports for VPC ID, subnet IDs, NAT IPs, Parameter Store ARNs

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Deploy to **us-east-2** region across 3 availability zones
- Use Pulumi ComponentResource pattern for modular organization
- Create separate logical groupings: networking, security, monitoring
- Resource names must include **environmentSuffix** for PR environment isolation
- Use Pulumi ResourceOptions for explicit parent-child dependencies
- All resources must be destroyable (no DeletionPolicy: Retain)
- Include proper error handling and type hints throughout
- Export stack outputs for downstream consumption

### AWS Services Integration

- VPC with private subnets and route tables
- EC2 NAT instances with security groups and Elastic IPs
- Systems Manager Parameter Store (SecureString)
- KMS for encryption keys
- Lambda functions with execution roles
- EventBridge custom event bus and rules
- S3 buckets with lifecycle policies and encryption
- CloudWatch Log Groups for centralized logging
- IAM roles and policies following least privilege

### Constraints

- Private subnets only - no public subnets or internet gateways
- Use NAT instances instead of NAT Gateways for cost optimization
- Parameter Store rotation must occur every 30 days via EventBridge
- VPC Flow Logs must capture all traffic types
- All secrets stored in Parameter Store, not Secrets Manager
- Tagging must include Environment, Owner, CostCenter on every resource
- Stack must support explicit dependencies for multi-stack deployments

## Success Criteria

- **Functionality**: All core requirements fully implemented and operational
- **Network Isolation**: Private subnets with NAT instances providing controlled outbound access
- **Secret Rotation**: Lambda functions triggered every 30 days to rotate API keys in Parameter Store
- **Logging**: VPC Flow Logs capturing all traffic with 90-day retention
- **Event Processing**: EventBridge custom bus forwarding application events to CloudWatch Logs
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: Python 3.9+, type hints, 90%+ test coverage, passes pylint
- **Stack Exports**: VPC ID, private subnet IDs, NAT instance IPs, and Parameter Store ARNs exported
- **Destroyability**: Complete infrastructure teardown without manual intervention

## What to deliver

- Complete Pulumi Python implementation in lib/ directory
- Networking module: VPC, subnets, NAT instances, route tables, security groups
- Security module: KMS keys, Parameter Store parameters, IAM roles
- Monitoring module: VPC Flow Logs, CloudWatch Log Groups
- Automation module: Lambda functions for secret rotation
- EventBridge configuration: custom event bus and rules
- Updated tap_stack.py orchestrating all components
- Comprehensive Pulumi stack outputs for cross-stack references
- Unit tests validating resource configurations
- Documentation explaining the architecture and deployment process
