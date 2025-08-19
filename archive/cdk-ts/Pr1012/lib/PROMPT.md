Please generate an AWS CDK TypeScript project that sets up a CI/CD pipeline for a Node.js web application hosted on EC2 instances. The pipeline should include the following stages:

1. **Source Stage**: Use Amazon S3 to store the application code. The pipeline should trigger automatically when new code is pushed to the repository.
2. **Build Stage**: Use AWS CodeBuild to compile the application and run unit tests. Ensure that CodeBuild uses a standard Node.js base image.
3. **Deploy Stage**: Use AWS CodeDeploy to deploy the artifacts to an EC2 instance running Amazon Linux 2. The deployment should support rolling updates to ensure zero downtime during deployment.

Provide the full CDK TypeScript code for all infrastructure components in a single file (`lib/<project-name>-stack.ts`), including:

* Amazon S3 as repository setup
* EC2 instance configuration
* CodeBuild project setup
* CodeDeploy application and deployment group
* CodePipeline definition with the necessary source, build, and deploy stages

Please ensure all components are well-commented for clarity and maintainability.