# Complete CI/CD Pipeline for Microservices Deployment

This CloudFormation template creates a production-ready CI/CD pipeline for deploying microservices in AWS, following enterprise-grade architectural standards.

## Architecture Overview

The solution implements a comprehensive CI/CD pipeline with the following components:

### Infrastructure Components

1. **VPC and Networking**
   - VPC spanning two Availability Zones in us-east-1
   - Public and private subnets in each AZ
   - Internet Gateway and NAT Gateway for connectivity
   - Route tables and security groups

2. **Compute Resources**
   - Auto Scaling Group with EC2 instances across both AZs
   - Application Load Balancer for high availability
   - Security groups for proper access control

3. **CI/CD Pipeline**
   - **CodePipeline**: Orchestrates the entire deployment process
   - **CodeBuild**: Builds application artifacts from source
   - **CodeDeploy**: Deploys applications to EC2 instances
   - **S3**: Stores pipeline artifacts securely

4. **IAM Roles and Policies**
   - CodePipeline service role with necessary permissions
   - CodeBuild service role for build operations
   - CodeDeploy service role for deployment operations
   - EC2 instance profile for CodeDeploy agent

### Key Features

- **Corp- Naming Convention**: All resources follow the company standard with "Corp-" prefix
- **Multi-AZ Deployment**: High availability across two availability zones
- **Security Best Practices**: Proper IAM roles, encrypted S3 bucket, security groups
- **Parameterized Template**: Configurable for different environments
- **Complete Outputs**: All important resource references exported

### Deployment Parameters

Required parameters for deployment:
- `ProjectName`: Name prefix for resources (default: Corp-MicroservicesPipeline)
- `GitHubRepoOwner`: GitHub organization/owner name
- `GitHubRepoName`: Repository name containing the application code
- `GitHubBranch`: Branch to monitor for changes (default: main)
- `GitHubToken`: Personal access token for GitHub integration
- `InstanceType`: EC2 instance type (default: t3.medium)
- `KeyPairName`: EC2 Key Pair for SSH access
- `MinInstances`: Minimum instances in Auto Scaling Group (default: 2)
- `MaxInstances`: Maximum instances in Auto Scaling Group (default: 6)

### Pipeline Triggers

The pipeline supports both manual and automated triggers:

**Automated Triggers:**
- Automatically triggered on commits to the specified GitHub branch
- Uses GitHub webhook integration through CodePipeline

**Manual Triggers:**
- Can be manually triggered through AWS Console
- AWS CLI: `aws codepipeline start-pipeline-execution --name <pipeline-name>`

### Deployment Steps

1. **Prepare Prerequisites:**
   - Create GitHub personal access token with repo permissions
   - Create EC2 Key Pair in us-east-1 region
   - Ensure CodeDeploy agent is installed on target instances

2. **Deploy Template:**
   ```bash
   aws cloudformation deploy \
     --template-file lib/TapStack.json \
     --stack-name Corp-MicroservicesPipeline \
     --capabilities CAPABILITY_IAM \
     --parameter-overrides \
       GitHubRepoOwner=your-org \
       GitHubRepoName=your-app \
       GitHubToken=your-token \
       KeyPairName=your-keypair
   ```

3. **Verify Deployment:**
   - Check VPC and subnets are created
   - Verify EC2 instances are running
   - Confirm CodePipeline is configured
   - Test application deployment

### Post-Deployment Configuration

After successful deployment:
1. Configure application source code with buildspec.yml for CodeBuild
2. Set up appspec.yml for CodeDeploy configuration
3. Test pipeline by pushing code changes to the monitored branch
4. Monitor pipeline execution through AWS CodePipeline console

### Security Considerations

- S3 bucket uses AES256 encryption for artifact storage
- All security groups follow principle of least privilege
- IAM roles have minimal required permissions
- VPC provides network isolation
- NAT Gateway enables secure outbound internet access for private instances

This template provides a robust, scalable, and secure foundation for microservices deployment with full CI/CD automation.