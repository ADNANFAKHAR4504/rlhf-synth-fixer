You are an expert AWS infrastructure engineer specializing in Pulumi with TypeScript. Your task is to implement a production-grade CI/CD pipeline that deploys a containerized application to Amazon ECS in us-east-1 using AWS CodePipeline, with optional multi-region bucket support.

Infrastructure Components to Implement
1. Security & Encryption
Create KMS key in us-east-1 with key rotation enabled

Configure KMS key policy for CloudWatch Logs, SNS, CodeBuild, and CodePipeline services

Create KMS alias for easier key reference

Enable encryption for all S3 buckets, SNS topics, and CloudWatch logs

2. Artifact Storage
Create primary S3 bucket in us-east-1 with versioning enabled

Enable server-side encryption with KMS

Configure bucket public access block (block all public access)

Set up lifecycle policies for old version expiration (30 days)

Optionally create regional artifact buckets based on regions array parameter

3. Notifications
Create SNS topic with KMS encryption

Subscribe email endpoint for notifications

Configure topic for pipeline and deployment notifications

4. Logging
Create CloudWatch Log Group for ECS tasks at /aws/ecs/{stackName}

Set retention period to 30 days

Enable KMS encryption for log group

5. Networking (us-east-1)
Create VPC with CIDR block 10.0.0.0/16

Enable DNS hostnames and DNS support

Create Internet Gateway attached to VPC

Create 2 public subnets in different availability zones (10.0.1.0/24, 10.0.2.0/24)

Create public route table with route to Internet Gateway

Associate both subnets with public route table

Create security group for ECS tasks (allow HTTP from anywhere)

Create security group for ALB (allow HTTP/HTTPS from anywhere)

6. Load Balancing (us-east-1)
Create Application Load Balancer (internet-facing)

Attach ALB to both public subnets with ALB security group

Create Blue target group (port 80, HTTP, IP target type)

Create Green target group (port 80, HTTP, IP target type)

Configure health checks for both target groups (path: /, interval: 30s, timeout: 5s, healthy threshold: 2, unhealthy threshold: 2)

Create ALB listener on port 80 forwarding to Blue target group

7. Container Orchestration (us-east-1)
Create ECS Cluster with Container Insights enabled

Create ECS Task Execution IAM role with AmazonECSTaskExecutionRolePolicy

Create ECS Task IAM role for application permissions

Create ECS Task Definition:

Family: {stackName}-task

Network mode: awsvpc

Requires compatibilities: FARGATE

CPU: 256, Memory: 512

Container: nginx:latest (placeholder image)

Port mapping: 80

Log driver: awslogs with CloudWatch log group

Create ECS Service:

Launch type: FARGATE

Desired count: 2

Network configuration: awsvpc with public subnets and ECS security group

Assign public IP: enabled

Load balancer: Blue target group on container port 80

Deployment controller: CODE_DEPLOY

8. CI/CD Pipeline (Placeholder Structure)
Create CodeBuild IAM role with permissions for:

CloudWatch Logs (create/write)

S3 artifact buckets (read/write)

KMS keys (decrypt/encrypt)

Create CodeBuild project with:

Service role from above

Artifacts type: CODEPIPELINE

Environment: BUILD_GENERAL1_SMALL, aws/codebuild/standard:5.0, Linux container, privileged mode

Source type: CODEPIPELINE

CloudWatch logs configuration

KMS encryption

9. Deployment Automation
Create CodeDeploy Application (compute platform: ECS)

Create CodeDeploy IAM role with AWSCodeDeployRoleForECS policy

Create CodeDeploy Deployment Group:

Blue/Green deployment configuration

ECS service reference

Blue and Green target groups

Deployment config: CodeDeployDefault.ECSAllAtOnce

Auto rollback on deployment failure

10. Pipeline Orchestration
Create CodePipeline IAM role (placeholder - not fully configured in current implementation)

Create CodePipeline resource (structure exists but stages not fully configured)

Expected stages: Source (GitHub) → Build → Deploy

Technical Requirements
Props Interface
typescript
export interface TapStackProps {
  environmentSuffix: string;        // Required: Environment identifier (dev/staging/prod)
  githubOwner?: string;              // Optional: GitHub repository owner
  githubRepo?: string;               // Optional: GitHub repository name
  githubBranch?: string;             // Optional: Branch name (default: 'main')
  githubToken?: pulumi.Output<string>; // Optional: GitHub personal access token
  regions?: string[];                // Optional: Additional regions for artifact buckets
  enableApproval?: boolean;          // Optional: Enable manual approval (default: true)
  notificationEmail?: string;        // Optional: Email for SNS notifications
  tags?: { [key: string]: string };  // Optional: Additional resource tags
}
Resource Organization
Use ComponentResource pattern with parent-child relationships

Name all resources with pattern: {stackName}-{resource-type}

Apply consistent tagging: Name, Environment tags on all resources

Export key outputs: cluster ARN, service ARN, ALB DNS, pipeline ARN

Implementation Structure
Create private helper methods for each infrastructure component group

Initialize props with defaults in initializeProps() method

Follow dependency order: KMS → S3 → Networking → ECS → CI/CD

Use Pulumi's automatic dependency tracking with explicit dependsOn where needed

Handle Output types with pulumi.interpolate for string templates and .apply() for transformations

Outputs Management
Export stack outputs using registerOutputs() method

Optionally write outputs to JSON file in project directory (outputs.json)

Include: KMS key ARN, bucket names, ECS cluster/service details, ALB DNS, pipeline ARN

Key Constraints
Single Region Deployment: Primary deployment in us-east-1 only for ECS resources

GitHub Integration: Use githubToken parameter (not CodeStar connections)

Blue/Green Setup: Target groups created but CodeDeploy configuration is minimal

Pipeline Stages: CodePipeline resource created but stages array is incomplete/empty

No ECR Repositories: Docker images expected to be pre-built or use public images

No Test Stage: No separate CodeBuild project for testing

No Manual Approval: Pipeline approval gate not implemented

No CloudWatch Alarms: No monitoring alarms for automatic rollback

No CloudTrail: No audit logging for API calls

Minimal IAM Policies: Basic permissions only, not production-hardened

Expected Code Structure
typescript
export class TapStack extends pulumi.ComponentResource {
  // Public resource properties
  public readonly kmsKey: aws.kms.Key;
  public readonly artifactBucket: aws.s3.Bucket;
  public readonly snsTopic: aws.sns.Topic;
  public readonly ecsCluster: aws.ecs.Cluster;
  public readonly ecsTaskDefinition: aws.ecs.TaskDefinition;
  public readonly ecsService: aws.ecs.Service;
  public readonly codeBuildProject: aws.codebuild.Project;
  public readonly codeDeployApp: aws.codedeploy.Application;
  public readonly codeDeployGroup: aws.codedeploy.DeploymentGroup;
  public readonly codePipeline: aws.codepipeline.Pipeline;
  public readonly logGroup: aws.cloudwatch.LogGroup;
  
  // Private infrastructure components
  private listener: aws.lb.Listener;
  private blueTargetGroup: aws.lb.TargetGroup;
  private greenTargetGroup: aws.lb.TargetGroup;
  private alb: aws.lb.LoadBalancer;
  private vpc: aws.ec2.Vpc;
  private publicSubnet1: aws.ec2.Subnet;
  private publicSubnet2: aws.ec2.Subnet;
  private readonly regionalBuckets: Map<string, pulumi.Output<string>>;
  
  constructor(name: string, props: TapStackProps, opts?: pulumi.ComponentResourceOptions) {
    // Initialize component resource
    // Set default props
    // Create resources in sequence
    // Register outputs
    // Optionally write outputs to file
  }
  
  // Private helper methods for resource creation
  private initializeProps(props: TapStackProps): Required<TapStackProps>
  private createKmsKey(): aws.kms.Key
  private createArtifactBucket(): aws.s3.Bucket
  private createSnsTopic(): aws.sns.Topic
  private createLogGroup(): aws.cloudwatch.LogGroup
  private createEcsCluster(): aws.ecs.Cluster
  private createEcsTaskDefinition(): aws.ecs.TaskDefinition
  private createEcsService(): aws.ecs.Service
  private createCodeBuildProject(): aws.codebuild.Project
  private createCodeDeployApplication(): aws.codedeploy.Application
  private createCodeDeployGroup(): aws.codedeploy.DeploymentGroup
  private createCodePipeline(): aws.codepipeline.Pipeline
  private createOutputs(): Record<string, pulumi.Output<any>>
  private writeOutputsToFile(): void
}
Success Criteria
The implementation must:

Successfully run pulumi preview without errors

Deploy all infrastructure to us-east-1

Create functioning ECS cluster with Fargate tasks

Set up Application Load Balancer with target groups

Configure Blue/Green target groups for CodeDeploy

Enable KMS encryption on all supported resources

Block all public access to S3 buckets

Configure CloudWatch logging for ECS tasks

Create CodeBuild and CodeDeploy resources (pipeline stages can be incomplete)

Support optional multi-region artifact buckets

Export all key resource ARNs and identifiers

Follow TypeScript best practices with proper typing

Known Limitations
This implementation represents a foundation for a CI/CD pipeline with the following known gaps:

Pipeline stages not fully configured

No GitHub source stage integration

No automated testing stage

No manual approval gates

No CloudWatch alarms for monitoring

No automatic rollback configuration

Limited IAM permissions (not production-ready)

Single region ECS deployment only

No ECR repository management

No CloudTrail auditing

