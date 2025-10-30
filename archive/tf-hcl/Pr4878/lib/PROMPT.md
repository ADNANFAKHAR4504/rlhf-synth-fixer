You’re a seasoned Terraform engineer who writes clean, production-ready HCL without over-engineering. I’m going to describe what I need, and I’d like you to generate the complete Terraform project I can drop into a repo and run with `terraform init/plan/apply`. Keep comments friendly and human, keep code concise, and if you need to assume anything, pick safe defaults and mention them near the variables.

I want a practical, multi-stage CI/CD pipeline on AWS that starts when an object (zip) lands in S3, builds a Docker image, pushes it to ECR with scanning on push, and then deploys that image to ECS. Think three simple pipeline stages—Source, Build, Deploy to the ECS. I want CodeBuild to handle the image build and push; Codedeploy to handle the deploy, CodePipeline to orchestrate; S3 for artifacts with encryption on; IAM roles trimmed to least privilege; notifications via SNS for both failures and successful deploys; and an ECS cluster (Fargate) to actually run the container once it’s built.

Please output a working Terraform project as inline files I can copy-paste in one go. Use AWS provider ~> 5.x and Terraform >= 1.5. Include minimal but helpful comments and tags (Project, Environment, Owner). Keep it straightforward—no unnecessary modules unless they clearly help.

What I need you to print as files, with clear headers like `// === file: main.tf ===`:
- providers/versions and an example backend (commented if not essential right now)
- main resources: S3 artifact bucket (SSE), ECR repo (immutable tags + scan on push), CodePipeline with three stages (Source from S3 object change, Build with CodeBuild, Deploy to ECS), CodeBuild project for image build+push (include a `buildspec.yml`), IAM roles and policies for CodePipeline and CodeBuild (least privilege), SNS topic and an example subscription, ECS cluster + task definition + service (Fargate) wired to pull from ECR, and whatever trigger wiring is needed so an S3 zip update kicks the pipeline
- variables with sensible defaults for region, app/project name, S3 source bucket/key prefix, artifact bucket name, ECR repo name, VPC/subnet IDs (placeholders are fine), desired count, cpu/memory, environment, and notification emails
- outputs for the pipeline name/arn, ECR repo URL, ECS service/cluster names, and the SNS topic ARN
- a tiny `README.md` that explains how to set the variables, how the S3 trigger works, how to approve the prod step, and the usual init/plan/apply commands

A couple of preferences so nothing surprises me:
- please keep the Deploy stage simple (CodePipeline ECS deploy action is fine), and note in a one-liner how rollback would be handled in a real setup
- artifact buckets should be encrypted (SSE-S3 is fine; if you want to show KMS, keep it simple and explain the key assumption)
- least privilege really matters here—CodeBuild needs only enough to pull base images, push to ECR, read the S3 source, and write artifacts; CodePipeline should only orchestrate
- ECS should run in private subnets with outbound egress, no public ingress exposed by this code
- include a basic CloudWatch Logs setup for the build and service so I’m not flying blind

Finally, make sure the pipeline actually wires together: S3 object update → CodePipeline Source → CodeBuild builds and pushes → Codedeploy deploys to ECS. Print everything as plain text files with those header lines so I can copy them straight into a repo and go.