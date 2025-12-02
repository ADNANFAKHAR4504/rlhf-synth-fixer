# CI/CD Pipeline Integration

Create a Pulumi TypeScript program to deploy AWS CodeBuild projects for a microservices CI/CD pipeline. The configuration must:

1. Create an S3 bucket for storing build artifacts with versioning enabled.
2. Define a CodeBuild project that builds Node.js applications from GitHub source.
3. Configure the build environment to use the standard AWS Linux 2 image with Node.js 18 runtime.
4. Set up IAM roles and policies allowing CodeBuild to access the S3 bucket and CloudWatch Logs.
5. Enable build logs to be sent to CloudWatch with a retention period of 7 days.
6. Configure webhook integration to trigger builds on GitHub push events to the main branch.
7. Set build timeout to 15 minutes and use SMALL compute type for cost efficiency.
8. Tag all resources with Environment=Production and ManagedBy=Pulumi tags.
9. Export the CodeBuild project name and S3 bucket ARN as stack outputs.