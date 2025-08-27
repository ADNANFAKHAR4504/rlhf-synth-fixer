## The Prompt
The objective of this project is to build a fully automated Continuous Integration and Continuous Deployment (CI/CD) pipeline on AWS. We will define the entire infrastructure as code using a single AWS CloudFormation template. This will allow us to create, manage, and replicate our deployment pipeline in a reliable, repeatable, and secure manner.

The pipeline will be designed as a seamless workflow, orchestrating several key AWS services. The entire process will be managed by a central AWS CodePipeline. This pipeline will define the sequence of stages our code must pass through, from source to deployment. The pipeline will start automatically when new application code (packaged as a .zip file) is uploaded to a dedicated S3 bucket. We will also use a separate S3 bucket to store any temporary files or build artifacts generated during the process. Once new code is detected, CodePipeline will trigger a build process using AWS CodeBuild. This stage is responsible for compiling the code, running tests, and packaging the application for the next step.After a successful build, the pipeline will invoke a custom AWS Lambda function. This function will act as an automated check to validate the deployment or the environment, ensuring everything is correct before proceeding. It's a critical quality gate in our process.

Security (AWS IAM): Security is a top priority. We must follow the principle of least privilege. This means we will create highly specific IAM roles for each service (CodePipeline, CodeBuild, Lambda). Each role will only have the exact permissions it needs to perform its function and nothing more, minimizing our security exposure.
Monitoring & Auditing (AWS CloudWatch Logs): To ensure we have full visibility into the pipeline's operations, all logs from the CodeBuild process must be captured and stored in AWS CloudWatch Logs. This is essential for troubleshooting issues, auditing changes, and monitoring performance.

Deployment Region: The entire setup must be configured for deployment in the us-west-2 (Oregon) region.
Deliverable Format: The final output must be a single, clean, and well-commented YAML file for CloudFormation.
Best Practices: The solution should align with AWS best practices for building CI/CD pipelines, focusing on security, scalability, and reusability. The template should use parameters for customizable values (like bucket names) to make it easy to reuse.


Expected Outpt:
The project is complete when we have a validated CloudFormation YAML file that successfully creates the entire CI/CD pipeline described above when deployed through the AWS Management Console or AWS CLI. The resulting pipeline should run from start to finish without errors.