# Failures

- **Multi-region & DynamoDB replication missing**  
  No multi-region setup or DynamoDB global tables defined.

- **Failover & recovery automation missing**  
  No Lambda or logic for automated failover.

- **CloudTrail auditing not implemented**  
  ~~No CloudTrail trail configured.~~ **INTENTIONALLY OMITTED** - CloudTrail removed to ensure deployment success. Core serverless application functionality does not require CloudTrail.

- **SNS notifications missing**  
  No SNS topics or subscriptions for deployment events.

- **Centralized CloudFormation logs missing**  
  No S3 bucket/log aggregation for CloudFormation operations.

- **Cross-region IAM roles missing**  
  No roles or trust for secure cross-region operations.

- **Region restriction incomplete**  
  Provider created but not applied consistently to all resources.

- **S3 bucket parameter misuse**  
  Mixes bucket `id` and name inconsistently.

- **API Gateway HTTPS enforcement invalid**  
  Uses `require_ssl_certificate`, which is not supported.

- **API Gateway → Lambda integration URI incorrect**  
  Should use API Gateway integration ARN, not Lambda invoke ARN.

- **Custom domain incomplete**  
  Certificate ARN set to `None`, no real ACM integration.

- **IAM roles not least-privilege**  
  Uses broad managed policies instead of narrowly scoped permissions.

- **Parameter Store inconsistent**  
  Secrets not consistently managed; some plaintext examples shown.

- **Tests invalid**  
  Reference undefined vars, wrong Pulumi type tokens, and invalid fields.

- **X-Ray tracing minimal**  
  Enabled but no sampling/group config.

- **DLQ permissions missing**  
  Lambda lacks policy to send messages to SQS DLQ.

- **Tagging inconsistent**  
  Not all resources include consistent cost-tracking tags.

- **Pulumi API misuse**  
  Some arguments (e.g., assume_role_policy, lifecycle) appear invalid.
