Hey team,

We need to build out infrastructure for our new B2B SaaS platform that will serve multiple customer tenants. The business has been asking for a way to give each customer their own isolated environment while still sharing core platform services. I've been tasked with creating this in Python using Pulumi. The key challenge here is maintaining strict isolation between tenants while keeping operational complexity manageable.

Right now, we're onboarding enterprise customers who need guarantees about data isolation and security boundaries. Each tenant needs their own compute resources, isolated data storage, and dedicated API endpoints. However, we want to share authentication, monitoring, and logging infrastructure across all tenants to reduce costs and operational overhead.

The plan is to deploy everything in us-east-1 and start with 5 tenants initially, but the architecture needs to scale easily as we onboard more customers. Security and compliance teams have been very clear that we need proper encryption, least-privilege IAM, and complete resource tagging for cost allocation.

## What we need to build

Create a multi-tenant SaaS infrastructure using **Pulumi with Python** for customer isolation and resource management.

### Core Requirements

1. **Network Isolation**
   - Create shared VPC with CIDR 10.0.0.0/16
   - Provision isolated /24 subnets for each tenant across 2 availability zones
   - Each tenant gets dedicated subnet within shared VPC

2. **Data Storage**
   - Deploy tenant-specific DynamoDB tables with naming pattern: tenant-{id}-users and tenant-{id}-data
   - Use on-demand billing mode for cost optimization
   - Encrypt all tables with tenant-specific KMS keys

3. **Encryption**
   - Create KMS customer-managed keys for each tenant
   - Use alias format: tenant/{id}/data-key
   - Apply KMS encryption to DynamoDB tables

4. **Compute Layer**
   - Deploy shared Lambda functions that serve all tenants
   - Lambda environment variables must include TENANT_ID and TENANT_SUBNET
   - Functions enforce tenant isolation through environment variable validation

5. **API Layer**
   - Configure API Gateway REST API with tenant-scoped resources
   - Implement endpoint pattern: /tenants/{tenantId}/users
   - Protect endpoints with Lambda authorizer for JWT token validation
   - Authorizer validates tenant JWT tokens before allowing access

6. **Logging and Monitoring**
   - Create CloudWatch Log Groups per tenant: /aws/lambda/tenant-{id}
   - Configure 30-day retention for all log groups
   - Segregate logs by tenant for compliance requirements

7. **Security and IAM**
   - Implement IAM roles following principle of least privilege
   - Scope all policies to tenant-specific resources only
   - No wildcard actions allowed in IAM policies

8. **Resource Management**
   - Apply consistent tagging to all resources: tenant_id, environment='production', cost_center='platform'
   - Use Pulumi stack outputs to export tenant API endpoints and subnet IDs
   - Support initial deployment of 5 tenants: tenant-001 through tenant-005

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use VPC with subnets, route tables, and Internet Gateway
- Use DynamoDB for tenant data storage
- Use KMS for encryption key management
- Use Lambda for compute layer
- Use API Gateway REST API with custom authorizers
- Use CloudWatch Logs for centralized logging
- Use IAM roles and policies for access control
- Resource names must include environmentSuffix parameter for uniqueness
- Follow naming convention: {resource-type}-{environment-suffix}
- Deploy to us-east-1 region
- All resources must be destroyable (no Retain deletion policies)

### Deployment Requirements (CRITICAL)

- All resources must include environmentSuffix in their names for multi-environment support
- No RemovalPolicy.RETAIN or DeletionProtection on any resources
- Resources must be fully destroyable after testing completes
- Lambda functions must use Node.js 18+ runtime (AWS SDK v3 is built-in, do not bundle aws-sdk)
- IAM roles must use service-specific managed policies where available

### Constraints

1. Each tenant must have isolated VPC subnets within a shared VPC
2. Tenant data in DynamoDB must use tenant-specific table prefixes and encryption keys
3. Lambda functions must enforce tenant isolation through environment variables
4. API Gateway must use custom authorizers to validate tenant JWT tokens
5. CloudWatch Log Groups must be segregated by tenant with 30-day retention
6. All IAM roles must follow principle of least privilege with no wildcard actions
7. Resource tags must include tenant_id, environment, and cost_center
8. Stack must support deploying 5 initial tenants with ability to add more

## Success Criteria

- Functionality: Complete tenant isolation with dedicated subnets, tables, and KMS keys per tenant
- Security: KMS encryption for all data at rest, least-privilege IAM, JWT validation on API Gateway
- Performance: On-demand DynamoDB billing, Lambda-based compute for scalability
- Reliability: Multi-AZ subnet deployment, proper error handling and logging
- Resource Naming: All resources include environmentSuffix for uniqueness
- Code Quality: Well-structured Python code, properly documented, follows Pulumi best practices
- Compliance: Proper tagging for cost allocation, segregated logging, audit trail

## What to deliver

- Complete Pulumi Python implementation in lib/tap_stack.py and supporting modules
- VPC with subnets across 2 AZs
- DynamoDB tables for 5 tenants with KMS encryption
- KMS keys per tenant
- Lambda functions with tenant isolation
- API Gateway REST API with Lambda authorizer
- CloudWatch Log Groups per tenant
- IAM roles and policies
- Pulumi stack outputs for API endpoints and subnet IDs
- Unit tests for all components
- Documentation and deployment instructions
