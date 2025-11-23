Hey team,

We're working with a fintech startup that's launching their first payment processing application in AWS. They need a solid foundation with proper network segmentation and security controls to meet financial services compliance. This is their production environment, so we need to get it right from the start.

The business requirements are pretty clear: they want a three-tier architecture with proper isolation between the web layer, application layer, and database layer. Everything needs to be deployed across multiple availability zones for high availability, and they need visibility into network traffic for compliance audits.

I've been asked to create this infrastructure using **Pulumi with TypeScript**. We'll be deploying to the us-east-1 region and need to make sure all resources can be easily identified and torn down when needed.

## What we need to build

Create a production-ready three-tier AWS environment using **Pulumi with TypeScript** for a payment processing application.

### Core Requirements

1. **VPC Infrastructure**
   - VPC with CIDR block for the fintech application
   - Public subnets across 2 availability zones for the web tier
   - Private subnets across 2 availability zones for the application tier
   - Database subnets across 2 availability zones for the data tier
   - Proper routing tables configured for each subnet type

2. **Connectivity Components**
   - Internet Gateway attached to VPC for public subnet internet access
   - NAT Gateways deployed in public subnets for private subnet outbound connectivity
   - Route configurations directing traffic appropriately for each tier

3. **Security Groups**
   - Web tier security group allowing HTTP/HTTPS traffic from the internet
   - Application tier security group allowing traffic only from the web tier
   - Database tier security group allowing traffic only from the application tier
   - All security group rules must include descriptions for compliance

4. **Compute Resources**
   - EC2 instances deployed in the public subnets
   - IMDSv2 required for all EC2 instances for enhanced security

5. **Database Preparation**
   - RDS subnet group configured for the database tier subnets

6. **Storage**
   - S3 bucket with versioning enabled for data retention

7. **Monitoring and Compliance**
   - VPC flow logs configured to send network traffic logs to CloudWatch
   - Proper IAM roles and policies for flow logs

8. **Resource Tagging**
   - Environment=Production tag on all resources
   - Project=PaymentApp tag on all resources

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Pulumi AWS Classic provider v6.x or higher**
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness and environment isolation
- Follow naming convention: `{resource-type}-{tier}-{environmentSuffix}` where applicable
- High availability across minimum 2 availability zones
- All resources must be fully destroyable with no deletion protection or retain policies

### Constraints

- EC2 instances MUST enforce IMDSv2 (no IMDSv1 allowed)
- All security group rules MUST include description fields
- RDS subnet group must be configured but no RDS instances should be publicly accessible
- No hardcoded resource names - all names must include the environmentSuffix parameter
- S3 bucket must have versioning enabled for compliance
- VPC flow logs are required for network traffic auditing
- Proper IAM least privilege policies for all service interactions
- Include appropriate error handling and logging configurations

## Success Criteria

- **Functionality**: Complete three-tier network architecture with proper segmentation and routing
- **Performance**: Resources deployed across multiple availability zones for resilience
- **Reliability**: Proper connectivity between tiers with appropriate security controls
- **Security**: IMDSv2 enforcement, security group descriptions, isolated database tier
- **Compliance**: VPC flow logs enabled, comprehensive resource tagging
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: Clean TypeScript code, well-structured, properly typed

## What to deliver

- Complete **Pulumi TypeScript** implementation
- VPC with public, private, and database subnets across 2 AZs
- Internet Gateway and NAT Gateways for connectivity
- Security groups for web, application, and database tiers
- EC2 instances with IMDSv2 enforcement
- RDS subnet group for database tier
- S3 bucket with versioning enabled
- VPC flow logs with CloudWatch integration
- Proper IAM roles and policies
- Stack exports for VPC ID, subnet IDs, security group IDs, and S3 bucket name
- Resource tagging with Environment and Project tags
