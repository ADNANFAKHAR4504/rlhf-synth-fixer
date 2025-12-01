# Provisioning of Infrastructure Environments

> **CRITICAL REQUIREMENT: This task MUST be implemented using CloudFormation with JSON**
>
> Platform: **cfn**  
> Language: **json**  
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Problem Statement

Create a CloudFormation JSON template to deploy a production-ready AWS environment for a Task Assignment Platform (TAP Stack). The infrastructure must support multi-environment deployments with proper isolation and be fully destroyable for test environments.

### Core Requirements

1. **DynamoDB Table**
   - Create a DynamoDB table with on-demand billing mode (PAY_PER_REQUEST)
   - Single partition key: `id` (String type)
   - Table name must include environment suffix for multi-environment support
   - Deletion protection disabled (for test environments)
   - Point-in-time recovery not required (for cost efficiency in test environments)

2. **Environment Configuration**
   - Single parameter: `EnvironmentSuffix` (default: "dev")
   - Parameter validation: alphanumeric characters only
   - All resource names must include the environment suffix

3. **Stack Outputs**
   - Table name for application configuration
   - Table ARN for IAM policy references
   - Stack name for cross-stack references
   - Environment suffix for validation

4. **Resource Naming**
   - Follow pattern: `{ResourceName}${EnvironmentSuffix}`
   - Example: `TurnAroundPromptTabledev`

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use `AWS::DynamoDB::Table` for table creation
- Use `DeletionPolicy: Delete` and `UpdateReplacePolicy: Delete` for cleanup
- Resource names must include `environmentSuffix` parameter
- Deploy to us-east-1 region
- All resources must be destroyable with no Retain policies
- No deletion protection enabled (suitable for test environments)

### Constraints

- Table must use on-demand billing (no reserved capacity)
- Single partition key only (no sort key required)
- No global secondary indexes required
- No streams required
- All resources must be destroyable (no Retain policies)
- Include proper parameter validation and constraints

## Success Criteria

- Functionality: DynamoDB table created with correct configuration
- Environment Isolation: Resources isolated by environment suffix
- Resource Naming: All resources include environmentSuffix parameter
- Destroyability: All resources can be deleted without manual intervention
- Integration: Stack exports all necessary outputs for application configuration
- Code Quality: Clean JSON, well-structured, properly formatted

## What to deliver

- Complete CloudFormation JSON template (`TapStack.json`)
- DynamoDB table with on-demand billing
- Single parameter for environment configuration
- Comprehensive stack outputs
- Proper resource naming with environment suffix
- All resources destroyable (no Retain policies)

