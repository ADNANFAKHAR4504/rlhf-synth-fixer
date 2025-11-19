Hey team,

We've got a critical refactoring project that needs our attention. Our fintech startup's Terraform codebase has evolved organically over the past two years, and we're now facing some serious technical debt. Deploy times have ballooned to 45 minutes, we've got duplicate resources scattered everywhere, and hardcoded values are making it a nightmare to maintain. The infrastructure team has asked us to modernize this configuration and bring deployment times down to under 15 minutes.

The current setup spans two AWS regions (us-east-1 and us-west-2) with over 20 EC2 instances across three Auto Scaling groups, two RDS Aurora clusters with read replicas, and Application Load Balancers in each region. We're using Terraform 1.5+ with S3 backend for state storage, and we need to maintain compatibility with our existing CI/CD pipelines that use Terraform Cloud for plan and apply operations. The VPC infrastructure is already established with public and private subnets across three availability zones per region, and VPC peering between regions is in place.

This is a high-stakes refactoring where we cannot afford any downtime. State file migration must not trigger resource recreation, and we need to follow strict naming conventions and performance targets.

## What we need to build

Refactor and optimize our AWS infrastructure using **Terraform with HCL** to eliminate technical debt, improve maintainability, and reduce deployment times from 45 minutes to under 15 minutes.

### Core Requirements

1. **Consolidate EC2 Modules**
   - Merge three separate EC2 module definitions into a single reusable module
   - Support variable-driven instance types for flexibility
   - Implement proper parameterization for different use cases

2. **Parameterized RDS Module**
   - Replace hardcoded RDS instance configurations with a flexible module
   - Support both MySQL and PostgreSQL Aurora engines
   - Configure read replicas dynamically

3. **Dynamic Provider Aliases**
   - Implement provider aliases to manage resources across us-east-1 and us-west-2
   - Enable multi-region deployment from a single configuration

4. **for_each Instead of count**
   - Replace all count-based resource creation with for_each loops
   - Prevent resource recreation when scaling operations occur
   - Use map-based resource definitions for better state management

5. **Centralized Tags with locals**
   - Create a locals block with common tags used across all resources
   - Reduce tag repetition across 50+ resources
   - Ensure consistent tagging for cost tracking and compliance

6. **Lifecycle Rules**
   - Add create_before_destroy lifecycle rules for zero-downtime deployments
   - Ensure smooth resource updates without service interruption

7. **Structured Outputs**
   - Organize outputs using nested maps for improved readability
   - Enable easy consumption by downstream systems and modules
   - Provide clear resource references for CI/CD integration

### Optional Enhancements

- **DynamoDB State Locking**: Implement remote state locking to prevent concurrent modifications
- **AWS Systems Manager Parameter Store**: Store secrets and configuration parameters securely
- **CloudFront Distribution**: Add CDN for static assets to reduce global latency

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **EC2** for compute instances (primary focus for module consolidation)
- Use **RDS Aurora** for database clusters with multi-engine support
- Reference existing **VPC**, **ALB**, and **Auto Scaling Groups** via data sources
- Use **S3** for Terraform state backend
- Optionally use **DynamoDB** for state locking
- Optionally use **SSM Parameter Store** for secrets management
- Optionally use **CloudFront** for content delivery
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{env}-{region}-{service}-{identifier}`
- Deploy to **us-east-1** (primary) and **us-west-2** (secondary) regions
- All resources must be destroyable (no Retain deletion policies)
- Terraform version 1.5 or higher required
- Must pass terraform fmt and terraform validate in strict mode

### Constraints

- Zero downtime: State file migration cannot trigger resource recreation
- Module versioning: Follow semantic versioning with backward compatibility
- Input validation: All variables must include validation rules to prevent misconfigurations
- Code quality: Must pass terraform fmt and validate without warnings
- Performance: Terraform plan execution under 2 minutes, apply under 15 minutes
- Security: No hardcoded credentials, use secure parameter patterns
- Compliance: Maintain existing security group rules and network configurations

## Success Criteria

- **Functionality**: All 8 mandatory requirements fully implemented
- **Performance**: Terraform plan under 2 minutes, apply reduced from 45 to under 15 minutes
- **Reliability**: Zero-downtime deployment with create_before_destroy lifecycle rules
- **Security**: No hardcoded values, optional SSM Parameter Store integration
- **Resource Naming**: All resources include environmentSuffix following company convention
- **Code Quality**: Clean terraform fmt and validate output, comprehensive variable validation
- **Modularity**: Reusable EC2 and RDS modules with proper parameterization
- **Maintainability**: Centralized tags, data sources for VPC, for_each loops throughout

## What to deliver

- Complete Terraform HCL implementation with modular structure
- Reusable EC2 module in modules/ec2/ supporting variable instance types
- Reusable RDS module in modules/rds/ supporting MySQL and PostgreSQL
- Multi-region provider configuration with aliases for us-east-1 and us-west-2
- Main configuration using for_each, locals for tags, and data sources for VPC
- Comprehensive variables.tf with validation rules for all inputs
- Structured outputs.tf with nested maps for downstream consumption
- Optional DynamoDB state locking table
- Optional SSM Parameter Store integration
- Optional CloudFront distribution
- Backend configuration for S3 state storage
- Documentation on module usage and deployment instructions
- All code formatted with terraform fmt and validated