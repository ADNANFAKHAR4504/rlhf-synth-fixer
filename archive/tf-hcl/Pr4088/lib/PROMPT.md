Hey, I need help building a production CI/CD pipeline using Terraform for deploying containerized apps to ECS. Can you help me set this up? I want everything in a single file called tap_stack.tf and I need it to follow AWS best practices.

Here's what I'm trying to build:

I need a complete automated pipeline that takes containerized applications from source all the way to production with zero downtime. The deployment should be able to automatically rollback if something goes wrong.

For the networking side, I need a VPC with both public and private subnets spread across two availability zones. Include NAT gateways for the private subnets to access the internet, an internet gateway for the public ones, and set up the route tables properly. For security groups, the ALB should allow ports 80 and 443, and the ECS tasks should only accept traffic from the ALB on the container port.

For containers, set up an ECR repository with KMS encryption and turn on automatic image scanning. I need an ECS Fargate cluster with Container Insights enabled. For the load balancer, create an Application Load Balancer with two target groups - one blue and one green - for the zero-downtime deployments. The ALB should listen on port 80 for normal traffic and port 8080 for test traffic during deployments.

The pipeline should use AWS CodePipeline with these stages:

First, a source stage using S3 (I heard CodeCommit isn't always available in all accounts, so S3 seems safer). The source code should be uploaded as source.zip to the artifacts bucket.

Then a build stage with CodeBuild that compiles the code, runs tests, builds the Docker image, pushes to ECR, and generates the deployment files (taskdef.json and appspec.yml). Make sure the build runs in privileged mode so it can do Docker stuff. Pass in environment variables for AWS account ID, region, repo name, image tag, and container name.

Add a validation stage with a Lambda function that can run custom checks on the build artifacts - like security scans or config validation.

Before deploying to production, I need a manual approval stage. Send notifications via SNS to an email address so the team can review changes first.

Finally, the deploy stage should use CodeDeploy for blue/green deployment to ECS. Use CodeDeployDefault.ECSAllAtOnce as the deployment config. After the health checks pass, automatically shift traffic from blue to green and then terminate the old environment after 5 minutes.

Security is really important. Use KMS to encrypt everything at rest - ECR images, S3 artifacts (enable versioning too), CloudWatch logs, Secrets Manager secrets, and SNS topics. Enable automatic key rotation on the KMS key. Also make sure the KMS key policy allows CloudWatch Logs to use it.

For IAM, create least-privilege roles for everything:
- ECS Task Execution Role needs access to ECR, Secrets Manager, CloudWatch Logs
- ECS Task Role for runtime permissions
- CodeBuild Role needs ECR, S3, CloudWatch Logs, Secrets Manager, KMS
- CodeDeploy Role should use the AWSCodeDeployRoleForECS managed policy
- CodePipeline Role needs S3, CodeBuild, CodeDeploy, ECS, SNS, Lambda, KMS
- Lambda Execution Role needs CodePipeline callbacks, S3, KMS

Store application config in Secrets Manager encrypted with KMS. The ECS tasks should reference these secrets by ARN.

For monitoring, set up CloudWatch log groups with 30-day retention for both ECS containers and CodeBuild, encrypted with KMS. Create alarms for:
- High CPU (over 80% for 2 periods)
- High memory (over 80% for 2 periods)
- Unhealthy ALB targets (any unhealthy target triggers alert)

Send all alarm notifications to the SNS topic. Also create a CloudWatch dashboard showing ECS resource usage and ALB metrics.

For the blue/green deployment, configure CodeDeploy to automatically rollback on deployment failure or if alarms trigger. Use traffic control to shift from blue to green. If health checks fail or alarms fire, it should rollback automatically.

The ECS service needs to use the CODE_DEPLOY deployment controller so CodeDeploy handles the traffic shifting. Keep 100% minimum healthy tasks during deployment with 200% maximum for zero downtime. Deploy tasks in the private subnets without public IPs.

For naming, use the pattern {CompanyName}-{Environment}-{ResourceName} for everything. Some resources like ECR and S3 need lowercase names, so create both regular and lowercase versions of the naming prefix. Tag all resources with: Company, Environment, ManagedBy (Terraform), and Pipeline.

Everything should be in us-east-1.

Can you set up variables for:
- company_name, environment, app_name
- container_port (default 8080)
- task_cpu (default 256), task_memory (default 512)
- desired_count (default 2)
- approval_email
- aws_region

For the ECS task definition, use Fargate with awsvpc network mode. The container should expose the configured port, include environment variables, reference Secrets Manager for sensitive stuff, log to CloudWatch, and include a health check at /health.

The Lambda function should be Python 3.9 and validate pipeline artifacts. It receives CodePipeline job events and reports back using put_job_success_result or put_job_failure_result.

For the S3 bucket, enable versioning, KMS encryption, and block all public access. Add the account ID to the bucket name for global uniqueness.

Finally, output the ALB DNS name, ECR repository URL, pipeline name, ECS cluster name, and ECS service name.

Everything needs to be in Terraform HCL in a single tap_stack.tf file. It should pass terraform validate without errors. The infrastructure must support blue/green deployments with automatic rollback. Follow all AWS best practices for security and compliance. This needs to be production-ready and maintainable.

Thanks!
