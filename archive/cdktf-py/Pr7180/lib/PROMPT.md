Hey team,

We're building a multi-tenant SaaS infrastructure platform that needs complete tenant isolation. A startup has approached us with an urgent requirement - they need to provision isolated cloud environments for each of their customers, with strict security boundaries and zero cross-tenant access. The business is growing fast and they're manually provisioning resources right now, which is error-prone and doesn't scale.

The problem they're facing is real - their existing single-tenant architecture can't handle rapid customer onboarding, and they're losing deals because it takes days to set up new customers. They need automation that can spin up a complete isolated environment for each tenant on demand, with all the security guardrails in place from day one. We've been specifically asked to implement this using **CDKTF with Python** since their platform team is heavily invested in Python tooling and they want the Terraform state management capabilities.

The business requirements are crystal clear - every tenant needs their own VPC with completely isolated networking, dedicated compute resources that can't steal capacity from other tenants, encrypted storage with tenant-specific keys, and centralized logging that maintains tenant boundaries. The compliance team has mandated that cross-tenant data access must be technically impossible, not just prevented by policy.

## What we need to build

Create a multi-tenant infrastructure provisioning system using **CDKTF with Python** that automatically creates isolated cloud environments for SaaS tenants.

### Core Requirements

1. **Tenant Isolation Architecture**
   - Define a TenantStack class that encapsulates all tenant-specific resources
   - Each tenant gets a dedicated VPC with non-overlapping CIDR blocks starting from 10.0.0.0/16
   - Create isolated subnets and security groups per tenant
   - Implement resource naming with environmentSuffix for uniqueness: use format like tenant-{tenant_id}-{resource}-{environmentSuffix}

2. **Compute Layer**
   - Deploy Lambda functions for tenant API endpoints
   - Configure 256MB memory allocation and 60-second timeout
   - Set reserved concurrency to 10 per tenant to prevent noisy neighbor issues
   - Lambda functions must log to tenant-specific log streams

3. **Data Storage**
   - Provision DynamoDB tables for tenant metadata with partition key 'tenant_id' and sort key 'resource_type'
   - Use on-demand billing mode with contributor insights enabled
   - Create S3 buckets with intelligent tiering for cost optimization
   - Enable versioning on all S3 buckets
   - Implement 90-day lifecycle policies for object expiration

4. **Encryption and Key Management**
   - Create tenant-specific KMS Customer Managed Keys (CMKs)
   - Configure S3 buckets to use server-side encryption with tenant CMKs
   - Ensure DynamoDB tables are encrypted at rest
   - KMS keys must have proper key policies for tenant-scoped access

5. **Identity and Access Management**
   - Implement IAM roles with tenant-scoped permissions
   - Use principalTag conditions to enforce tenant boundaries
   - Lambda execution roles must only access their tenant's resources
   - No cross-tenant IAM permissions

6. **Logging and Monitoring**
   - Set up CloudWatch Log groups with 30-day retention policy
   - Use centralized log group with tenant-prefixed log streams
   - Configure subscription filters for central monitoring aggregation
   - Implement IAM policies preventing cross-tenant log access

7. **Event-Driven Automation**
   - Configure EventBridge rules to trigger tenant provisioning workflows
   - Set up rules to capture signup events and initiate tenant stack deployment
   - EventBridge must route events to appropriate tenant handlers

8. **Infrastructure Outputs**
   - Use CDKTF outputs to export tenant API endpoints
   - Export S3 bucket names for each tenant
   - Export DynamoDB table ARNs
   - All outputs must be accessible for downstream automation

9. **Resource Tagging**
   - Tag all resources with 'TenantId' identifying the tenant
   - Add 'Environment' tag for lifecycle management
   - Include 'ManagedBy' tag set to 'CDKTF'
   - Tags must be consistent across all resource types

10. **Multi-Tenant Deployment**
    - Create main application that synthesizes stacks for 3 example tenants
    - Example tenants: 'acme-corp', 'tech-startup', 'retail-co'
    - Each tenant stack must be independently deployable
    - Stacks must support parallel deployment

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **AWS Lambda** for tenant API compute layer (256MB, 60s timeout, reserved concurrency 10)
- Use **Amazon DynamoDB** for tenant metadata (partition key: tenant_id, sort key: resource_type, on-demand billing)
- Use **Amazon S3** with intelligent tiering and versioning for tenant data storage
- Use **AWS KMS** for tenant-specific Customer Managed Keys
- Use **Amazon VPC** with isolated networks per tenant (no NAT gateways for cost savings)
- Use **Amazon CloudWatch Logs** with 30-day retention for centralized logging
- Use **Amazon EventBridge** for tenant provisioning workflow triggers
- Use **AWS IAM** with principalTag conditions for tenant-scoped permissions
- Target deployment region: **us-east-1**
- Requires CDKTF version 0.15 or higher
- Requires Python 3.9 or higher
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: tenant-{tenant-id}-{resource-type}-{environmentSuffix}
- All resources must be destroyable (no Retain policies or DeletionProtection)
- Include proper error handling for resource provisioning failures

### Network Architecture Constraints

- Each tenant VPC must use non-overlapping CIDR blocks
- Start CIDR allocation from 10.0.0.0/16 and increment by /16 for each tenant
- Deploy private subnets across 2 availability zones per tenant
- No NAT gateways to minimize costs (use VPC endpoints if needed)
- Cross-tenant network traffic must be explicitly blocked
- Do not create VPC peering connections between tenants
- Security groups must restrict traffic to tenant-specific resources only

### Security and Compliance Constraints

- All tenant resources must use KMS encryption with tenant-specific CMKs
- KMS key policies must prevent key usage by other tenants
- Lambda functions must use reserved concurrent executions to prevent resource exhaustion
- IAM policies must use principalTag conditions to enforce tenant boundaries
- CloudWatch Logs must implement strict IAM policies preventing cross-tenant log access
- S3 buckets must have versioning enabled for audit compliance
- DynamoDB contributor insights must be enabled for access pattern monitoring

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** in their names for test isolation
- Do NOT use RemovalPolicy.RETAIN or set DeletionProtection: true
- Resources must be fully destroyable after testing
- CDKTF stacks must support clean `cdktf destroy` operations
- KMS keys should use a short deletion window (7 days) for faster cleanup in test environments

## Success Criteria

- **Functionality**: Successfully provisions isolated environments for all 3 example tenants
- **Network Isolation**: Each tenant VPC has unique CIDR block with no overlapping addresses
- **Security**: All data encrypted with tenant-specific KMS keys, IAM policies enforce tenant boundaries
- **Compute**: Lambda functions deployed with correct memory, timeout, and reserved concurrency settings
- **Storage**: DynamoDB tables and S3 buckets created with proper configuration for each tenant
- **Logging**: Centralized CloudWatch Logs with tenant-prefixed streams and cross-tenant access prevention
- **Automation**: EventBridge rules configured to trigger tenant provisioning workflows
- **Resource Naming**: All resources include environmentSuffix and follow tenant-{id}-{type}-{suffix} pattern
- **Tagging**: All resources tagged with TenantId, Environment, and ManagedBy
- **Outputs**: CDKTF outputs correctly export endpoints, bucket names, and table ARNs for each tenant
- **Deployability**: Successfully deploys with `cdktf deploy` and destroys cleanly with `cdktf destroy`
- **Code Quality**: Python code is well-structured, follows PEP 8 guidelines, and includes proper type hints

## What to deliver

- Complete CDKTF Python implementation with modular TenantStack class
- Main application file that instantiates stacks for all 3 tenants (acme-corp, tech-startup, retail-co)
- Lambda function code for tenant API endpoints
- Proper CDKTF configuration in cdktf.json
- DynamoDB table definitions with correct keys and billing mode
- S3 bucket configurations with intelligent tiering and lifecycle policies
- KMS key resources with tenant-scoped key policies
- VPC and networking resources with proper CIDR allocation
- IAM roles and policies with principalTag conditions
- CloudWatch Logs configuration with retention and subscription filters
- EventBridge rules for tenant provisioning automation
- Comprehensive resource tagging implementation
- CDKTF output definitions for tenant endpoints and resource identifiers
- Unit tests validating tenant isolation and resource configuration
- Documentation explaining the architecture and deployment process
