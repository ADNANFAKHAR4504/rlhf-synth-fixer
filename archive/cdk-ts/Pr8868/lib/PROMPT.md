I need to set up a complete CI/CD pipeline infrastructure on AWS using CDK with TypeScript that handles the full deployment flow from source to production.

The pipeline should work like this:
1. GitHub Actions workflows trigger on push to main branch and pull requests, then assume an IAM role via OIDC to interact with AWS services securely
2. S3 buckets receive and store build artifacts uploaded by GitHub Actions during the build process, with versioning enabled so previous artifacts can be retrieved if rollback is needed. The S3 bucket uses KMS encryption keys that the IAM deployment role can access
3. An RDS PostgreSQL database that deployed applications connect to, with security groups allowing access from the deployment role and application instances. The database connection details are stored in SSM Parameter Store so the pipeline can inject them during deployment
4. IAM roles enable GitHub Actions to assume AWS privileges for uploading artifacts to S3, reading/writing CloudWatch logs, and deploying CloudFormation stacks. The policies follow least privilege - S3 access scoped to specific bucket ARNs, CloudFormation operations scoped to stack name patterns
5. CloudWatch log groups receive logs from the deployment process, with the IAM role granted permissions to create log streams and put log events. The logs help debug deployment failures
6. Integration with AWS CodeCatalyst where the pipeline triggers CodeCatalyst workflows for enhanced developer productivity and modern CI/CD features
7. AWS Application Composer integration patterns for visual infrastructure management, using SSM parameters to store configuration that Application Composer can read

The infrastructure should support automated testing where test results flow back to GitHub Actions, secure deployments where credentials are never hardcoded (using IAM role assumption), and proper monitoring where CloudWatch metrics track deployment success/failure rates and feed into dashboards.

Make sure all resources are properly tagged with environment and project identifiers, and follow AWS security best practices like blocking public S3 access and using KMS encryption.

Please provide the complete infrastructure code with one code block per file.