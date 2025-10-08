## Mission Statement

Your mission is to act as an **expert AWS DevOps engineer** and generate a TypeScript-based IaC solution for an automated CloudFormation stack failure recovery system. All requirements and constraints provided **must remain intact and unchanged**. Ensure a **string suffix is appended to resource names where needed** to guarantee uniqueness and avoid naming collisions.

## Instructions

### 1. Analyze the Requirements
Thoroughly review all requirements, environment details, and constraints. Do **not** change, omit, or alter any provided data.

### 2. Write the Architecture in CloudFormation TypeScript Format
Use AWS CDK and AWS SDK for TypeScript to define all resources and recovery logic. Employ modular design for scalability and maintainability.

### 3. Specify AWS Services
Explicitly name and configure each AWS service required: CloudFormation, CloudWatch, Lambda, IAM, S3, SNS, Step Functions, VPC, and others as needed.

### 4. Emphasize Resource Uniqueness, Security, Tagging, and Isolation
- **Resource Naming**: All resources must follow the `'app-purpose-environment-stringSuffix'` naming convention, **appending a string suffix** where required for uniqueness.
- **Security**: IAM roles for recovery must have minimum required permissions and support cross-account access where necessary.
- **Tagging**: Apply consistent, standardized tags for cost management and auditing across all resources.
- **Isolation**: Ensure recovery operations do not impact other operational environments; restrict actions to the affected stack.

### 5. Output Format
**AWS CloudFormation + TypeScript (AWS CDK & AWS SDK)**

## Task Requirements

Design an automated failure recovery system using **AWS CDK and TypeScript** for the **"IaC - AWS Nova Model Breaking"** project.

### Core Requirements

1. **Rollback & Recovery**
   - Support rollback of failed resources in CloudFormation stacks.
   - Handle resource dependencies during recovery.

2. **Cross-Region Redundancy**
   - Implement redundancy for critical resources in multiple regions for high availability.

3. **Monitoring & Automation**
   - Monitor stack status via CloudWatch.
   - Trigger automatic recovery using Lambda functions and CloudWatch alarms.
   - Orchestrate recovery workflow using AWS Step Functions.

4. **Security & Permissions**
   - Use IAM roles with minimum required permissions for recovery.
   - Support cross-account access for multi-account environments.

5. **Logging & Backups**
   - Store CloudFormation template backups and logs in S3.
   - Provide consistent logging and monitoring throughout the recovery process.

6. **Notifications**
   - Use AWS SNS to notify administrators of ongoing recovery operations.

7. **Tagging**
   - Apply standardized tagging for cost management and auditing.

8. **Cost Optimization**
   - Confirm the system operates within predefined AWS cost limits.

9. **Code Quality & Testing**
   - Write all code in TypeScript, adhering to clean coding practices.
   - Implement modular design for scalability.
   - Include unit tests for Lambda functions using a suitable testing framework.
   - Document the recovery process, including architecture diagrams and runbook procedures.

### Constraints

- All resources and interactions must be defined and managed via **AWS CDK and AWS SDK for TypeScript**.
- Resource names must include a **string suffix** to ensure uniqueness and avoid naming collisions.
- All code must use modular patterns and be well-documented.
- Recovery logic must be isolated to the affected stack only.
- Provide outputs and documentation confirming the recovery system configuration and operation.

## Success Criteria

- **Reliability**: Effective automated rollback and recovery, minimal downtime
- **Security**: Least-privilege IAM roles, cross-account support, isolated recovery actions
- **Operational Excellence**: Complete logging, monitoring, and notifications
- **Uniqueness**: All resource names include a string suffix
- **Compliance**: All requirements and constraints are implemented exactly as specified
- **Code Quality**: TypeScript, modular, maintainable, and well-tested
- **Documentation**: Architecture diagrams, runbook, deployment and operation instructions

## Expected Deliverables

- Complete AWS CDK TypeScript stack implementation (recovery Lambda, Step Functions, CloudWatch, IAM, S3, SNS, etc.)
- Modular, well-tested code with unit tests for Lambda functions
- Resource naming with a string suffix for uniqueness
- Consistent tagging for all resources
- Documentation and architecture diagrams
- Outputs confirming system setup and readiness

---