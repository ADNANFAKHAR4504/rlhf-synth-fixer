You are an expert AWS Solutions Architect and DevOps engineer specializing in CI/CD automation and CloudFormation.
Your task is to create a production-ready AWS CloudFormation YAML template that sets up a fully automated CI/CD pipeline meeting the following exact specifications:

Requirements:

CI/CD Tool: Use AWS CodePipeline as the primary orchestrator.

Build: Integrate AWS CodeBuild to handle the build process.

Deployment: Use AWS CodeDeploy for application deployment.


Source Control: Store project source code in an Amazon S3 bucket with versioning enabled.

IAM: Implement IAM roles with the least privilege principle for each AWS service (CodePipeline, CodeBuild, CodeDeploy, Lambda, S3 access).

Monitoring: Create a CloudWatch alarm that triggers on CodePipeline failures.

Auditing: Enable logging for all stages and actions in the pipeline.

Maintainability: Keep the YAML template under 1500 lines.

Triggering: Ensure the pipeline automatically triggers on new code commits.

Custom Validation: Implement a custom AWS Lambda function that runs after deployment to validate deployment success.

Region: All AWS resources should be deployed in us-east-1.

Best Practices: All IAM roles and policies should follow AWS best practices, especially the principle of least privilege.

Output Format:

Provide a complete, functional CloudFormation YAML template that can be deployed without modification.

Include inline comments explaining each major section of the template.

Use logical and descriptive resource names for maintainability.

Follow AWS CloudFormation YAML syntax and indentation rules precisely.