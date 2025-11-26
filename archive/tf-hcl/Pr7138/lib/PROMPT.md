# Multi-Account AWS Security Framework

Hey team,

We need to build a comprehensive security and compliance framework across multiple AWS accounts for our organization. I've been asked to create this in HCL using Terraform. The business requires a robust, auditable, and enforceable security posture across our entire AWS infrastructure with strict compliance controls.

Our organization is growing across different business units and we need to isolate workloads while maintaining centralized security governance. We need to enforce encryption standards, manage cross-account access securely, and maintain audit trails for all compliance activities. This framework will be the foundation for our multi-account strategy.

## What we need to build

Create a multi-account AWS security framework using **Terraform with HCL** for centralized security governance and compliance enforcement.

### Core Requirements

1. **AWS Organizations Setup**
   - Create organization with 3 organizational units (OUs): Security, Production, Development
   - Configure organizational structure with proper nesting
   - Enable CloudTrail at the organization level for audit logging
   - Set up organization-level tags for resource tracking

2. **KMS Multi-Region Key Management**
   - Create primary KMS keys in us-east-1 region
   - Configure automatic key rotation (annual rotation enabled)
   - Set up key policies for cross-account access
   - Create replica keys in secondary region (us-west-2) for disaster recovery
   - Implement key grants for service-specific access

3. **Cross-Account IAM Roles with MFA Enforcement**
   - Create IAM roles in member accounts for cross-account access
   - Implement trust policies that require MFA token for assume role
   - Define separate roles for security, operations, and development teams
   - Set up role session policies with time-bound permissions
   - Create identity provider (SAML 2.0) for federated access

4. **Service Control Policies (SCPs) for Encryption**
   - Enforce S3 bucket encryption (SSE-S3 or SSE-KMS only)
   - Mandate EBS volume encryption at account level
   - Require RDS encryption for all database instances
   - Prevent unencrypted snapshots from being shared
   - Restrict key deletion across accounts

5. **CloudWatch Logs Configuration**
   - Create centralized CloudWatch Logs group in security account
   - Set 90-day retention policy for all log groups
   - Configure log group subscriptions for aggregation
   - Set up metric filters for security events
   - Enable encryption of logs using KMS keys

6. **AWS Config Compliance Rules**
   - s3-bucket-server-side-encryption-enabled
   - encrypted-volumes
   - rds-encryption-enabled
   - root-account-mfa-enabled
   - iam-policy-no-statements-with-admin-access
   - cloudtrail-enabled
   - config-enabled

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Deploy to us-east-1 region (primary)
- Use us-west-2 for KMS replica key
- Resource names must include **environment_suffix** variable for uniqueness
- Follow naming convention: {resource-type}-{environment_suffix}
- Implement S3 backend configuration in providers.tf for state management
- Configure backend bucket with versioning and encryption enabled
- Use Terraform workspaces for different AWS accounts
- Implement remote state with state locking via DynamoDB
- Enable CloudTrail in organization trail mode
- Use SSM Parameter Store for sensitive configuration data

### Deployment Requirements (CRITICAL)

- All resources must include the environment_suffix variable in their names
- All resources must be completely destroyable with no Retain policies
- Backend S3 bucket must exist before Terraform initialization
- MFA device ARN must be provided via tfvars for cross-account roles
- AWS Organizations must be created before member accounts can be invited
- SCPs must be attached after organization is fully configured
- Key rotation must be enabled on all KMS keys at creation
- Implement proper IAM permissions for state file access in backend
- Configure S3 backend with DynamoDB for locking to prevent concurrent modifications
- Test cross-account IAM role assumption with MFA before production deployment
- Validate all SCPs do not block required services for compliance operations
- All Lambda functions (if needed) must use Node.js 18+ with aws-sdk v3

### Constraints

- All encryption keys must be customer-managed KMS keys
- No root account access for daily operations
- MFA enforcement is mandatory for all cross-account access
- CloudWatch Logs retention cannot exceed 90 days
- SCPs cannot be attached to root OU without explicit override
- Cross-account roles must have explicit deny for dangerous actions
- All audit logs must be immutable (CloudTrail with S3 object lock)
- Compliance rules must be evaluated in Organization Conformance Packs
- No unencrypted snapshots allowed across organization
- Lambda execution roles must be scoped to specific resources

## Success Criteria

- **Functionality**: All 7 AWS Config rules deployed and compliant, all SCPs enforced
- **Security**: Cross-account access requires MFA, KMS keys rotated annually, audit trails captured
- **Compliance**: CloudWatch Logs retention enforced at 90 days, all snapshots encrypted
- **Organization**: 3 OUs created and operational, member accounts linked
- **Resource Naming**: All resources include environment_suffix, properly tracked
- **Infrastructure Reliability**: Remote state configured with locking, automatic backups enabled
- **Code Quality**: HCL properly formatted, validated with terraform validate, comprehensive test coverage

## What to deliver

- Complete Terraform HCL implementation with all infrastructure components
- providers.tf with S3 backend configuration and DynamoDB state locking
- variables.tf defining all required inputs including environment_suffix
- outputs.tf exposing organizational IDs, KMS key ARNs, role ARNs
- main.tf for Organizations setup (3 OUs, organization trail)
- kms.tf for multi-region KMS keys with rotation and cross-account access
- iam.tf for cross-account roles with MFA enforcement
- scp.tf for Service Control Policies enforcing encryption standards
- cloudwatch.tf for centralized logging with 90-day retention
- config.tf for 7 compliance rules and conformance packs
- tests/ directory with comprehensive test cases
- README.md with deployment instructions and architecture documentation
