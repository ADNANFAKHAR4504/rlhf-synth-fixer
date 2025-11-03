I need to build a multi-environment feature flag connector using Terraform (HCL) in production.
This system needs to support 156 microservices deployed across 12 AWS regions, and all feature flag changes must propagate instantly and stay consistent.

Here’s what I need:
1. DynamoDB global tables
- Store all feature flags.
- Updates should replicate across all regions.
- DynamoDB Streams must fire within 500ms of any update.

2. DynamoDB Streams → Lambda validation
- Stream events should trigger Lambda functions.
- Each Lambda should validate 234 business rules within 2 seconds.
- If validation fails, exit and do not propagate.

3. SNS fan-out
- Each region should have an SNS topic.
- The topic must fan out to 156 SQS queues (one per microservice).
- Delivery must complete within 1 second.

4. SQS → Lambda → ElastiCache
- Each SQS queue triggers a Lambda function.
- It must update the ElastiCache Redis cache for that specific microservice.
- All cache updates must finish within 3 seconds globally.

5. EventBridge → Step Functions verification
- EventBridge rules should trigger Step Functions workflows.
- Each workflow asks CloudWatch Logs Insights to confirm the new flag is active.
- It must scan 156 services within 15 seconds.

6. Consistency checking
- Another Lambda must compare CloudWatch responses.
- It must detect any inconsistency within 5 seconds.

7. Automatic rollback
- If inconsistencies are found:
- Revert the DynamoDB entry to the previous known-good state.
- Rollback must finish within 8 seconds.

8. Auditing
- Every flag change and rollback should be written to OpenSearch.

9. Deployment
- Everything must be defined in Terraform.
- It should be safe to deploy in multiple regions.
- The final result should support:
- Instant feature flag changes
-Verified state correctness
- Automatic rollback if anything breaks
- Full audit history

When building this infrastructure, I can only make changes in the lib/ and test/ directories. I should never touch deployment scripts, configuration files, or anything else in the repository. All environments must be parameterised, so I shouldn't hardcode names like “dev” or “prod.” Test environments must be fully destructible by avoiding things like irreversible S3 compliance mode and long retention settings. Every resource needs complete metadata, including tags for cost, ownership, and environment, and I have to enable encryption at rest and in transit while blocking public access by default. IAM should follow least-privilege rules, and databases and compute must run in private subnets—with Multi-AZ enabled for production. I must respect AWS service limits rather than trying to bypass them. After every change, I need to run linting, build, unit tests, and integration tests, and fix any issues immediately. Resource names should follow a consistent pattern based on environment and purpose. Whenever I add or modify infrastructure, I must update or remove matching tests. Any fixes should be documented in lib/MODEL_FAILURES.md to explain what was broken and how I solved it. Configuration differences belong in variables, not separate templates. If something fails, I should solve the root cause instead of adding workarounds, and if my design conflicts with deployment processes or tooling, I must adapt my code rather than modifying the system around it.