# CI/CD Pipeline Integration

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
> 
> Platform: **pulumi**  
> Language: **ts**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to deploy a CI/CD pipeline for containerized applications. The configuration must: 1. Create an S3 bucket for storing pipeline artifacts with versioning enabled. 2. Set up an ECR repository for storing Docker images with lifecycle policies to keep only the last 10 images. 3. Configure a CodeBuild project that builds Docker images from a GitHub repository and pushes them to ECR. 4. Create necessary IAM roles and policies for CodeBuild to access ECR and S3. 5. Set up a CodePipeline with three stages: Source (GitHub), Build (CodeBuild), and Manual Approval. 6. Configure the pipeline to trigger on pushes to the main branch. 7. Add CloudWatch event rules to notify on pipeline state changes. 8. Implement proper tagging for all resources with Environment, Project, and ManagedBy tags. 9. Export the pipeline URL and ECR repository URI as stack outputs. Expected output: A fully functional CI/CD pipeline that automatically builds and stores Docker images when code is pushed to GitHub, with manual approval gates before deployment.

---

## Additional Context

### Background
A software development team needs to automate their container deployment workflow using AWS native CI/CD services. The pipeline should build Docker images from source code, store them in ECR, and trigger deployments when code is pushed to the main branch.

### Constraints and Requirements
- [CodeBuild compute type must be BUILD_GENERAL1_SMALL for cost efficiency, Pipeline artifact encryption must use AWS managed S3 key (SSE-S3), ECR repository must have image scanning on push enabled, All IAM policies must follow least privilege principle with no wildcard actions, Pipeline must use GitHub version 2 source action (not webhook), Build timeout must be set to 20 minutes maximum]

### Environment Setup
AWS eu-west-2 region deployment using CodePipeline for orchestration, CodeBuild for Docker image builds, ECR for container registry, and S3 for artifact storage. Requires Pulumi CLI 3.x with TypeScript/Node.js 16+, AWS CLI configured with appropriate permissions. GitHub personal access token needed for source integration. Infrastructure spans single region with CodeBuild running in default VPC.

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` variable in their names to support multiple PR environments
- Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix

### Testing Integration  
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Target Region
All resources should be deployed to: **ap-southeast-1**
