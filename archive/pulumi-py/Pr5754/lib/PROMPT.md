Hey man, we’d like you to create a Python-Pulumi solution that sets up a secure and reliable CI/CD pipeline for a Python application.
The pipeline should be fully automated, cross-regional, and follow best practices for security, observability, and compliance.
We would like you to Please implement:

- Use AWS CodePipeline to manage the full CI/CD process, deploying the application across any 2 regions.  
  The pipeline should automatically handle build, test, approval, and deployment stages.

- Integrate AWS CodeBuild for build automation using a Python environment.  
  Include a dedicated build stage for security vulnerability scanning before deployment.

- Store all build and deployment artifacts in an Amazon S3 bucket with encryption enabled for data at rest and in transit.

- Trigger AWS Lambda functions after successful deployments to log custom metrics or deployment summaries.  
  These Lambdas should operate with least privilege permissions and write logs to Amazon CloudWatch Logs.

- Define IAM roles for CodePipeline, CodeBuild, and Lambda using least privilege access policies.  
  Ensure all service roles are scoped specifically to required actions only.

- Implement CloudWatch Alarms to detect and alert on any pipeline or build stage failures. s
  Alarms should publish notifications to an SNS topic that alerts the DevOps team.

- Store all operational and build logs centrally in Amazon CloudWatch Logs for auditing and troubleshooting.

- Use environment variables within the pipeline to differentiate between stacks or environments (e.g., staging vs production).  
  The same Python-based CloudFormation script should handle these variations gracefully.

- Ensure that all sensitive data (e.g., environment variables, credentials, artifacts) is encrypted both in transit and at rest.

Remember, we need your solution to be clean, modular, and a maintainable solution that defines this CI/CD pipeline end to end.
