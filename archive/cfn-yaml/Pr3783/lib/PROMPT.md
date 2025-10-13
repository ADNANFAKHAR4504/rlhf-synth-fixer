Create a CloudFormation YAML template to set up a CI/CD pipeline for deploying a web application on Amazon Elastic Beanstalk. The pipeline must integrate AWS CodePipeline, CodeBuild, and CodeDeploy, adhering to best practices for security, automation, and reliability.

Key Requirements:

1. Pipeline Structure: Create an AWS CodePipeline that automatically triggers on code pushes to the main branch of a GitHub repository. The pipeline stages must include: source (GitHub), build (CodeBuild), a manual approval stage, and deploy (CodeDeploy to Elastic Beanstalk).
2. IAM Roles: Define IAM roles with least privilege permissions for CodePipeline, CodeBuild, and CodeDeploy. Ensure these roles are narrowly scoped to necessary actions.
Application Details: The Elastic Beanstalk application must be named 'MyWebApp' and use t3.medium instances. Configure environment variables for the application within the buildspec.
3. Artifact Storage: Use Amazon S3 to store build artifacts with server-side encryption using KMS.
4. Notifications: Set up an SNS topic to send deployment notifications for successes or failures.
5. Tagging: Tag all resources based on the environment (e.g., Development, Production) for cost tracking and management.
6. Error Handling: Implement error handling in the pipeline for failed builds or deployments, including retry logic or failure notifications.
7. Branch Naming: Incorporate company-standard branch naming conventions for GitHub feature branches (e.g., feature/, bugfix/).
8. Parameters and Outputs: Use CloudFormation parameters for configurable values like Elastic Beanstalk environment name. Define outputs for the SNS topic ARN and Elastic Beanstalk application URL.
9. Region: Deploy in us-east-1 region.

Constraints:

- The YAML template must be valid and pass AWS CloudFormation validation.
- Include all necessary resources: CodePipeline, CodeBuild project, CodeDeploy deployment group, IAM roles, S3 bucket, SNS topic, and Elastic Beanstalk environment.
- Ensure the pipeline sequence is: Source -> Build -> Manual Approval -> Deploy.
- Follow AWS best practices for resource naming, security, and efficiency.

Provide a single CloudFormation YAML file named cicd_pipeline.yaml that meets all requirements and is ready for deployment.