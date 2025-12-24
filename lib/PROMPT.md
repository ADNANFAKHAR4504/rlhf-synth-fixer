# CloudFormation-Based DynamoDB Multi-Region Deployment

I need help creating CloudFormation templates to deploy DynamoDB tables across multiple AWS regions. The templates should handle cross-region resource referencing and use CloudFormation intrinsic functions properly.

## What I Need

Create CloudFormation YAML templates that deploy Amazon DynamoDB tables in two AWS regions. The templates need to be reusable, parameterized, and follow best practices for cross-region and intra-stack resource referencing.

## Requirements

### 1. Multi-Region Deployment

- Define two separate CloudFormation stacks, one for us-west-1 and one for us-west-2
- Each template creates one DynamoDB table in its respective region
- Stacks should be able to reference each other using CloudFormation exports and imports
- The us-west-1 stack exports table attributes that the us-west-2 stack imports using Fn::ImportValue
- Applications connect to DynamoDB tables through IAM roles with specific table permissions

### 2. Region-Specific Capacity Settings

- Configure DynamoDB table read and write capacity values differently per region
- For us-west-1: Hardcode ReadCapacityUnits to 5 and WriteCapacityUnits to 5
- For us-west-2: Make ReadCapacityUnits and WriteCapacityUnits configurable using CloudFormation Parameters

### 3. CloudFormation Intrinsic Functions

- Use intrinsic functions like Fn::GetAtt, Fn::ImportValue, Ref, Fn::Sub, and Fn::Join where appropriate
- If exporting outputs for inter-stack use, use Export and Fn::ImportValue for referencing across stacks
- Maintain logical dependencies and referential integrity using these functions
- One stack exports table names or ARNs that the other stack imports using Fn::ImportValue

### 4. Template Validation and Execution

- CloudFormation YAML templates must be syntactically and semantically valid
- When deployed, the stacks should launch successfully without errors
- DynamoDB tables should be created in the specified regions
- Read and write capacity configurations should be properly reflected per region
- IAM roles need specific permissions for stack creation and DynamoDB provisioning
- IAM roles grant access to specific DynamoDB table ARNs, not wildcard resources
- Applications use IAM roles to access DynamoDB tables in each region

### 5. Reusability and Modularity

- Structure templates to promote modularity
- Allow future extension or reusability across environments
- Document parameters, resource definitions, and outputs clearly

## Deliverables

- One YAML CloudFormation template for us-west-1 with fixed capacity
- One YAML CloudFormation template for us-west-2 with parameterized capacity
- Use Outputs section in both templates to export table names or ARNs
- Demonstrate usage of Fn::GetAtt, Fn::ImportValue, or Ref in a meaningful way
- All templates must pass CloudFormation Linter validation
- Include inline comments or explanations where appropriate

## Important Notes

- No need to implement replication or global tables unless explicitly stated
- Avoid use of deprecated resource types or syntax
- If exporting any value in one stack, demonstrate how it would be consumed in the other using Fn::ImportValue

## Optional Advanced Features

- Add Tags to the DynamoDB tables using Fn::Sub for dynamic values
- Include a basic Outputs block to expose useful resource attributes like the table ARN
