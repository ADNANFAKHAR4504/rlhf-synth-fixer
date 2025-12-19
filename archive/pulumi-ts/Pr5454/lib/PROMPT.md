Hey,

We need to set up a complete CI/CD pipeline for our containerized application. Right now we're manually building and deploying Docker images, and it's getting messy. Every time someone pushes to the main branch, we want the whole build-test-deploy cycle to run automatically.

I've been tasked with building this using Pulumi with TypeScript, and we need to deploy everything to the ap-southeast-1 region where our production environment runs.

## What we need

The pipeline should pull code from GitHub, build a Docker image, push it to our container registry, and have a manual approval step before anything goes live. We also want proper monitoring so we can see when builds fail or when pipelines get stuck.

Here's what the architecture should look like:

**Source Control**
- Connect to our GitHub repository using CodeStar Connections
- Automatically trigger builds when code is pushed to the main branch
- Pull the source code as a zip file

**Container Registry**
- Set up ECR to store our Docker images
- Enable image scanning on push to catch vulnerabilities early
- Keep only the last 10 images to save storage costs
- Set image tag mutability to mutable so we can overwrite tags if needed

**Build Process**
- Use CodeBuild with the standard Amazon Linux image
- Build needs privileged mode because we're running Docker inside Docker
- Use a small instance type to keep costs down
- Store build artifacts in S3 with versioning enabled
- Build should create a Docker image and push it to ECR with two tags: latest and the commit hash
- Generate an imagedefinitions.json file for deployments

**Pipeline Orchestration**
- Three stages: Source, Build, and Manual Approval
- Source stage pulls from GitHub
- Build stage runs CodeBuild and outputs artifacts
- Approval stage requires manual sign-off before deployment
- Store all artifacts in S3 with encryption

**Security**
- All S3 buckets need public access completely blocked
- Use SSE-S3 encryption for artifact storage
- IAM roles should follow least privilege - only grant the exact permissions needed
- CodeBuild needs access to ECR for pushing images
- CodePipeline needs access to S3, CodeBuild, and the GitHub connection

**Monitoring**
- Set up CloudWatch Events to capture all pipeline state changes
- Log all events to CloudWatch Logs with 7-day retention
- We need to know when pipelines succeed or fail

**Resource Naming**
- Everything must include the environmentSuffix in the name for uniqueness
- Follow the pattern: resource-type-environmentSuffix
- This is important because we have multiple environments and need to avoid naming conflicts

## Technical specs

Use these AWS services:
- S3 for storing build artifacts
- ECR for Docker image registry
- CodeBuild for building Docker images
- CodePipeline to orchestrate the whole workflow
- IAM for roles and permissions
- CloudWatch for monitoring and logging

Everything should be built with Pulumi using TypeScript. Deploy to ap-southeast-1 region.

The buildspec should:
- Login to ECR
- Build the Docker image
- Tag it with both latest and the short commit hash
- Push both tags to ECR
- Create imagedefinitions.json as the output artifact

Make sure the infrastructure can be torn down cleanly for testing - don't use any retain policies.

## What success looks like

When this is done, a developer should be able to push code to GitHub and automatically see:
1. CodePipeline triggered
2. Source pulled from GitHub
3. CodeBuild running and creating a Docker image
4. Image pushed to ECR with vulnerability scanning
5. Manual approval step waiting for sign-off
6. All events logged to CloudWatch
7. Artifacts stored in encrypted S3 bucket

The infrastructure should be fully reproducible and include proper TypeScript types throughout.
