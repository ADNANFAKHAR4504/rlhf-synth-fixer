Create a CI/CD pipeline using AWS CDK with TypeScript to automate the deployment and testing of a web application. The system needs to demonstrate how multiple AWS services connect and work together in a real pipeline workflow.

Here's how the services should integrate:

1. **Source to Pipeline Flow**: CodePipeline monitors the source repository and automatically triggers when commits are pushed to the 'main' branch. The pipeline uses V2 trigger filters to detect branch changes and kicks off the deployment process.

2. **Artifact Storage and Access**: S3 buckets store deployment artifacts with versioning enabled. CodePipeline writes build outputs to S3, and CodeBuild reads from S3 to access source code and dependencies. The artifacts flow from build stage to deployment stage through these S3 buckets.

3. **Build Orchestration**: CodePipeline invokes CodeBuild for the build and test stages. When CodeBuild completes, it publishes build results back to CodePipeline to determine whether to proceed to the next stage or halt on failure.

4. **Event-Driven Notifications**: EventBridge Pipes connect the pipeline events to downstream systems. When CodePipeline stage transitions occur (start, success, failure), EventBridge captures these state changes and routes notifications to monitoring systems or triggers follow-up automation.

5. **Monitoring Integration**: CloudWatch Application Signals receive metrics and logs from both CodeBuild and CodePipeline. Build duration, error rates, and pipeline execution times flow into CloudWatch for real-time dashboards and alerting. CloudWatch alarms can trigger when builds fail or execution times exceed thresholds.

6. **IAM Permission Flow**: IAM roles grant CodePipeline permission to invoke CodeBuild, read/write to S3 buckets, and publish events to EventBridge. CodeBuild gets separate IAM permissions to access S3 artifacts and send logs to CloudWatch. This creates a secure trust chain where each service can only access what it needs.

Target the us-east-1 region and tag all resources with Environment: Production and Project: CI_CD_Pipeline for proper resource organization.

The key is showing how data and events flow between services: commits trigger the pipeline, pipeline invokes builds, builds write to S3, results publish to CloudWatch, state changes route through EventBridge. This creates a complete automated workflow where services communicate and coordinate.

Generate the complete infrastructure code with one code block per file. Include all necessary imports, constructs, and configurations needed for a fully functional CI/CD pipeline with modern observability and event-driven capabilities.