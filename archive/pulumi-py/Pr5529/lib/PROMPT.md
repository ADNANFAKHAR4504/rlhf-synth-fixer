Hey man, we’d like you to refactor and optimize a serverless payment processing system using Pulumi + python.
The goal is to make it faster, cheaper, and more secure while keeping all existing functionality intact.
Now, Please implement the following:

- Consolidate the existing Lambda functions (validation, processing, and notification) into one optimized function that includes proper error handling and DLQ for failed invocations.  
  Configure the Lambda with 512MB memory, 30-second timeout, reserved concurrency of 100, and enable AWS X-Ray tracing.
- Update the DynamoDB table from on-demand billing to provisioned capacity with auto-scaling between 5 and 50 RCU/WCU.  
  Ensure no data loss or downtime occurs during this migration.
- Optimize IAM roles by removing AdministratorAccess and replacing it with least-privilege policies.  
  All IAM configurations must pass AWS Access Analyzer validation.
- Configure CloudWatch Logs retention to 7 days for all functions and services.  
  Add CloudWatch alarms to trigger when Lambda error rates exceed 1%.
- Enable API Gateway caching for GET requests with a 300-second TTL, and apply X-Ray tracing to all API Gateway stages.  
  Maintain all existing endpoints and ensure response times remain under 500ms at p99.
- Apply cost allocation tags (`Environment`, `Application`, and `CostCenter`) to all resources.  
  Target a total cost reduction of at least 40%, with monthly AWS spend capped at $500.
- The deployment must support zero-downtime rollout and include an automated rollback mechanism if any deployment stage fails.

Keep the setup modular, production-grade, and focused on real-world optimization, offcourse with minimal noise, clear Pulumi constructs, and maintainable Python code that achieves both performance and cost efficiency.
