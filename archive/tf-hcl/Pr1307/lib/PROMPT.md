You are an AWS Solution Architect tasked with designing and implementing a CI/CD pipeline for a serverless application using Terraform (HCL). The goal is to fully automate the build, test, and deploy process while keeping it reusable and maintainable across environments.
Heres what you need to deliver:
Core AWS Services:
AWS CodePipeline to orchestrate the stages.
AWS CodeBuild to run builds and tests.
AWS Lambda as the deployment target for the serverless app.
Pipeline Workflow:
Build Stage Package the Lambda code.
Test Stage Run automated tests on the build output.
Deploy Stage Deploy to Lambda with automatic rollback to the last good version if the deployment fails.
Terraform Requirements:
Use Terraform modules for Lambda, CodeBuild, and CodePipeline so the setup is modular and reusable.
Resource naming must follow a prefix pattern based on environment (dev-, prod-).
Variables for environment, region, and repo configuration should make it easy to switch contexts.
Outputs should include:
Pipeline ARN
Build Project ARN
Lambda function name
Deployment status
Multi-Region Support:
Must deploy in us-east-1 and us-west-2 by just changing variables no code changes.
IAM & Security:
Use least-privilege IAM roles and policies for each component. No overly permissive access.
Terraform Standards:
Pass terraform validate with no errors.
Code should be structured with main.tf, variables.tf, outputs.tf in the root, and a modules/ directory for reusable components.
Include comments explaining the purpose of each resource.
When youre done, I should be able to run terraform apply, pick my environment and region, and end up with a working pipeline that builds, tests, deploys, and rolls back automatically if something breaks.
