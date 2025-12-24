# Optimizing CloudFormation Template for Multi-Tier Financial Application

Hey team,

We have a critical issue with our production CloudFormation stack for a financial services application. The current template has significant technical debt and maintenance issues. Management needs us to optimize this immediately to reduce costs and improve reliability. I need to create an optimized version using **CloudFormation with JSON** that addresses all the structural problems while maintaining full functionality.

The existing stack has been running for six months and powers our three-tier web application in us-east-1. It works, but it's become a maintenance nightmare. Deployments take 45+ minutes, we have circular dependencies, hardcoded values everywhere, and it's violating several AWS best practices. The template needs refactoring but we cannot break any existing functionality or require infrastructure replacement.

## What we need to build

Create an optimized CloudFormation template using **CloudFormation with JSON** that refactors the poorly-structured baseline template for a three-tier web application while fixing all architectural issues and reducing complexity.

### Architecture Overview

The application follows a three-tier architecture with clear service connectivity:

**Web Tier**: Application Load Balancer distributes incoming HTTPS traffic to EC2 instances in the Auto Scaling Group across multiple availability zones. The ALB performs health checks on backend instances and routes traffic only to healthy targets.

**Application Tier**: EC2 instances in the Auto Scaling Group run the application code and connect to both the database and cache layers. Instances communicate with RDS Aurora through the database cluster endpoint and access ElastiCache Redis through the cache cluster endpoint. Security groups control which ports and protocols can flow between tiers.

**Data Tier**: RDS Aurora MySQL cluster stores persistent data with automatic failover between primary and read replica instances. ElastiCache Redis cluster provides session storage and caching, reducing database load. Both data services sit in private subnets accessible only from the application tier.

**Network Flow**: Internet traffic flows through the Internet Gateway to the ALB in public subnets. The ALB forwards requests to application instances in private subnets. Application instances query the database and cache in isolated data subnets. NAT Gateways in public subnets allow outbound internet access from private resources for updates and external API calls.

### Core Requirements

1. **Template Optimization**
   - Create a well-structured, maintainable template
   - Preserve all existing functionality completely
   - Maintain backward compatibility with current deployment
   - Support multi-environment deployments for dev, staging, and prod

2. **Extract Hardcoded Parameters**
   - Pull out all hardcoded values like AMI IDs, instance types, and CIDR blocks
   - Add AllowedValues constraints for validation
   - Create proper parameter descriptions and defaults
   - Use parameter types appropriately like String or Number types

3. **Mappings Section**
   - Create environment-specific configurations for dev, staging, and prod
   - Map instance types, RDS sizes, and cache node counts by environment
   - Include region-specific AMI mappings
   - Consolidate duplicate configuration values

4. **Dependency Resolution**
   - Fix circular dependency between RDS DBInstance and DBParameterGroup
   - Use DependsOn only where absolutely necessary
   - Properly order resource creation
   - Validate dependency graph has no cycles

5. **Security Group Consolidation**
   - Consolidate separate security group resources into 3 logical groups
   - Use dynamic rule generation patterns
   - Group by function: web tier, app tier, data tier
   - Eliminate duplicate rules

6. **Intrinsic Function Modernization**
   - Replace all Fn::Join usage with Fn::Sub
   - Use exclamation mark shorthand syntax
   - Improve readability with cleaner syntax
   - Maintain exact functionality

7. **Add Conditional Logic**
   - Implement Conditions based on Environment parameter
   - Control creation of environment-specific resources
   - Use conditions for cost optimization in non-prod
   - Apply conditions consistently

8. **Deletion and Update Policies**
   - Add DeletionPolicy: Snapshot for RDS instances
   - Add DeletionPolicy: Retain for S3 buckets
   - Include UpdateReplacePolicy where appropriate
   - Protect critical data resources

9. **Pseudo Parameters**
   - Replace hardcoded region values with dynamic region references
   - Replace hardcoded account IDs with account ID references
   - Use stack name and stack ID references where applicable
   - Eliminate region-specific hardcoding

10. **IMDSv2 Configuration**
    - Ensure all EC2 instances use IMDSv2
    - Set MetadataOptions with HttpTokens: required
    - Apply to launch configurations and templates
    - Meet security compliance requirements

11. **CloudFormation Designer Metadata**
    - Add Metadata sections with Designer information
    - Include layout coordinates for visual representation
    - Support CloudFormation Designer compatibility
    - Maintain template readability

12. **Validation**
    - Template must pass cfn-lint with zero errors
    - Validate against CloudFormation schema
    - Test multi-environment deployments
    - Verify no breaking changes

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **VPC** with public and private subnets across 3 AZs
- Use **Application Load Balancer** for traffic distribution
- Use **Auto Scaling Group** with EC2 instances for application tier
- Use **RDS Aurora MySQL** cluster for database
- Use **ElastiCache Redis** cluster for caching
- All names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- Support deployment from AWS CLI 2.x with CloudFormation permissions

### Constraints

- No breaking changes to existing infrastructure
- Must support rolling updates without downtime
- Maintain all current security configurations
- All resources must be destroyable by using appropriate DeletionPolicy
- Include proper error handling and validation
- Support multi-AZ deployment across 3 availability zones
- Meet financial services security compliance requirements

## Success Criteria

- **Functionality**: All 12 optimization requirements implemented correctly
- **Validation**: Passes cfn-lint with zero errors
- **Dependencies**: No circular dependencies, proper DependsOn usage
- **Security**: IMDSv2 enabled, security groups consolidated
- **Maintainability**: Clear parameter structure, proper mappings
- **Multi-environment**: Single template supports dev/staging/prod
- **Naming Convention**: All resources include environmentSuffix parameter
- **Code Quality**: Clean JSON syntax, well-documented, follows CloudFormation best practices

## Deployment Requirements - CRITICAL

- All resources MUST include environmentSuffix parameter in their names
- Use appropriate DeletionPolicy to allow clean teardown
- RDS resources: DeletionPolicy Snapshot, can be changed to Delete for testing
- S3 buckets: DeletionPolicy Retain to protect data
- Other resources: DeletionPolicy Delete to allow cleanup
- No hardcoded region or account values - use pseudo parameters
- All EC2 instances must enforce IMDSv2 via MetadataOptions configuration

## What to deliver

- Complete CloudFormation JSON implementation
- Optimized template TapStack.json
- VPC with multi-AZ networking
- Application Load Balancer configuration
- Auto Scaling Group with launch configuration
- RDS Aurora MySQL cluster
- ElastiCache Redis cluster
- Consolidated security groups with 3 groups total
- Parameters section with all extracted values
- Mappings section for environment configurations
- Conditions section for environment-specific resources
- Outputs section with key resource identifiers
- Unit tests validating template structure
- Integration tests with deployment validation

## File Structure

```
lib/
├── TapStack.json           # Optimized CloudFormation template
├── PROMPT.md               # This task description
├── IDEAL_RESPONSE.md       # Documentation of ideal solution
├── MODEL_FAILURES.md       # Analysis of optimization requirements
├── MODEL_RESPONSE.md       # Initial implementation example
└── README.md               # Project documentation
```
