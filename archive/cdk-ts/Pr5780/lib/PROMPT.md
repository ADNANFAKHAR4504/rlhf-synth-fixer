# AI Tool Prompt: Create CI/CD Pipeline with AWS CDK (TypeScript)

  ## Task Overview
  You are required to create a complete CI/CD pipeline using AWS CDK with TypeScript that implements AWS CloudFormation resources. This pipeline is designed for web application deployment with comprehensive automation, security, and monitoring capabilities.

  ## Technology Stack
  - **Platform**: AWS CDK (Cloud Development Kit)
  - **Language**: TypeScript
  - **Infrastructure as Code**: AWS CloudFormation (via CDK)

  ## Architecture Approach
  - **Single File Implementation**: Create ONE main stack file that handles both development and production environments
  - **Environment-Based Deployment**: Use environment variables or context parameters to determine which environment to deploy
  - **Dynamic Configuration**: The same code should create appropriate resources based on the environment specified (dev or prod)

  ## Hard Requirements

  ### 1. Blue/Green Deployment
  - Implement blue/green deployment strategy for zero-downtime updates
  - Use AWS CodeDeploy with blue/green deployment configuration
  - Ensure traffic shifting is automated and safe

  ### 2. Environment-Based Deployment (Dev/Prod)
  - Support deployment to both development and production environments using the same code
  - Use environment variables or CDK context to differentiate environments
  - Configure environment-specific settings (instance sizes, alarm thresholds, etc.)
  - When user specifies "dev", deploy development environment
  - When user specifies "prod", deploy production environment

  ### 3. Automatic Rollback
  - Configure automatic rollback on deployment failures
  - Implement rollback mechanisms for both development and production environments
  - Use CloudWatch alarms to trigger rollbacks when necessary

  ### 4. AWS CodeBuild Integration
  - Integrate AWS CodeBuild for source code compilation
  - Define buildspec.yml or inline build specifications
  - Configure build artifacts properly

  ### 5. AWS CodePipeline Management
  - Use AWS CodePipeline to manage all stages of the deployment
  - Define stages: Source (S3), Build, Deploy
  - For production: Add manual approval stage before deployment
  - Ensure proper stage transitions and dependencies

  ### 6. SNS Notifications
  - Send notifications via SNS on deployment success or failure
  - Configure SNS topics based on environment
  - Implement proper notification rules for pipeline events

  ### 7. IAM Security (Least Privilege)
  - Authenticate using IAM roles with least privilege access
  - Create specific roles for each pipeline stage
  - Follow AWS security best practices

  ### 8. Environment Variables
  - Use environment variables to differentiate between deployments
  - Implement environment-specific configurations
  - Support DEV and PROD environment distinctions
  - Make all environment-specific settings configurable

  ### 9. CloudWatch Monitoring
  - Implement comprehensive monitoring using AWS CloudWatch
  - Create metrics and alarms for pipeline health
  - Track deployment success/failure rates
  - Adjust alarm thresholds based on environment

  ### 10. AWS CodeDeploy for EC2
  - Configure AWS CodeDeploy for automated application deployments to EC2 instances
  - Define deployment groups for different environments
  - Implement proper deployment configurations with blue/green strategy

  ### 11. Parameterized Builds via SSM Parameter Store
  - Support parameterized build and deployment configurations
  - Use AWS Systems Manager Parameter Store for configuration management
  - Allow dynamic configuration retrieval during pipeline execution

  ### 12. Detailed Logging to S3
  - Enable detailed logging for all pipeline stages
  - Store logs in S3 buckets with appropriate lifecycle policies
  - Implement log retention policies (e.g., transition to Glacier, deletion after X days)

  ### 13. S3 as Source Repository
  - **Use S3 bucket as the source for the pipeline** (NOT CodeCommit)
  - Configure source stage to trigger on S3 object uploads
  - Implement versioning on the source S3 bucket
  - Pipeline should detect when new application code is uploaded to S3

  ### 14. Manual Approval for Production Only
  - Set up manual approval stage ONLY for production deployments
  - Development deployments should proceed automatically
  - Configure approval actions with proper IAM permissions
  - Ensure production releases require human authorization

  ## Expected Output

  ### File Structure
  The project already has the following TypeScript CDK structure. Work with existing files, do NOT create new ones:
  ```
  bin/
    tap.ts                      # CDK app entry point
  lib/
    tap-stack.ts                # Main pipeline stack (handles both dev and prod)
  test/
    tap-stack.unit.test.ts      # Unit tests
    tap-stack.int.test.ts       # Integration tests
  cdk.json                      # CDK configuration with environment context
  package.json                  # Node.js dependencies
  tsconfig.json                 # TypeScript configuration
  ```

  **IMPORTANT**: These files already exist in the project. Update `lib/tap-stack.ts` with your implementation. Do NOT create new files.

  ### Main Deliverable
  Update the existing `lib/tap-stack.ts` file to implement:
  1. **S3 Source Bucket**: Source repository configuration with versioning
  2. **CodeBuild Project**: Build specifications and environment
  3. **CodeDeploy Application**: Deployment groups and configurations for blue/green
  4. **CodePipeline**: Complete pipeline with stages (Source from S3, Build, Deploy)
  5. **IAM Roles and Policies**: Least privilege access controls
  6. **SNS Topics**: Notification configurations
  7. **CloudWatch Alarms**: Monitoring and alerting
  8. **S3 Buckets**: Artifact storage and logging with lifecycle policies
  9. **SSM Parameters**: Configuration management setup
  10. **EC2 Resources**: Target deployment infrastructure (Auto Scaling Groups, Load Balancers)
  11. **Environment Logic**: Conditional resources based on dev/prod environment

  ### Environment Differentiation Example
  ```typescript
  // In the stack constructor
  const environment = this.node.tryGetContext('environment') || 'dev';
  const isProd = environment === 'prod';

  // Conditional logic
  const instanceType = isProd ? 't3.large' : 't3.micro';
  const minCapacity = isProd ? 2 : 1;
  const approvalRequired = isProd; // Only prod needs approval
  ```

  ### Deployment Commands
  ```bash
  # Deploy to development
  cdk deploy -c environment=dev

  # Deploy to production
  cdk deploy -c environment=prod
  ```

  ### Testing Requirements
  The solution must be:
  - Deployable using `cdk deploy -c environment=dev` or `cdk deploy -c environment=prod`
  - Testable using AWS CLI and AWS Console
  - Verifiable for compliance with all 14 constraints
  - Executable end-to-end with actual AWS resources
  - Reusable for both environments without code changes

  ## Success Criteria
  1. All 14 hard requirements are fully implemented
  2. Single stack file handles both dev and prod environments
  3. S3 is used as the source (not CodeCommit)
  4. Code follows TypeScript and CDK best practices
  5. Infrastructure is fully automated and reproducible
  6. Security follows least privilege principle
  7. Pipeline can successfully deploy a sample application from S3
  8. Automatic rollback works on failure scenarios
  9. Notifications are sent correctly for all events
  10. Logs are properly stored and managed
  11. Manual approval gates function correctly for production only
  12. Blue/green deployment executes without downtime

  ## Additional Considerations
  - Use CDK constructs efficiently (L2/L3 constructs where available)
  - Add proper error handling and validation
  - Include comments and documentation in code
  - Consider cost optimization (smaller resources for dev)
  - Ensure idempotent deployments
  - Environment-specific naming conventions (e.g., `myapp-dev-pipeline`, `myapp-prod-pipeline`)

  ## Constraints Summary
  - Blue/green deployments for zero downtime ✓
  - Environment-based deployment (dev/prod via context) ✓
  - Automatic rollback on failure ✓
  - AWS CodeBuild integration ✓
  - AWS CodePipeline stage management ✓
  - SNS notifications on success/failure ✓
  - IAM least privilege authentication ✓
  - Environment variable differentiation ✓
  - CloudWatch monitoring ✓
  - CodeDeploy for EC2 deployments ✓
  - SSM Parameter Store for configs ✓
  - S3 logging with lifecycle policies ✓
  - **S3 as source (NOT CodeCommit)** ✓
  - Manual approval before production only ✓

  Please generate a complete, production-ready CDK TypeScript solution using a SINGLE stack file that implements this CI/CD pipeline meeting all requirements, with S3 as the source and environment-based deployment support.
