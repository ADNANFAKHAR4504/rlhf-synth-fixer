Explain precisely why the MODEL_RESPONSE deviates from the IDEAL_RESPONSE and how to correct it, keeping the deployed behavior intact and without introducing new files or renaming any paths.

1. **Scope & file discipline**
   You did not keep everything in a single stack file at `lib/tap-stack.ts`. Do not create extra files or change filenames/paths. All logic must live in `lib/tap-stack.ts` exactly as referenced by tests and docs.

2. **Environment suffix contract**
   You used `environment` or omitted suffixes. Every name that is externally visible must consistently include `environmentSuffix` (default `dev`): S3 buckets, DynamoDB tables, SQS queues, EventBridge bus and rule names, Lambda function names, API stage name, CloudWatch dashboard, and the Step Functions log group.

3. **Outputs contract**
   Returned the wrong keys (e.g., `ApiKeyId`) or missed required ones. You must expose exactly these outputs and nothing else: `ApiEndpoint`, `ApiKeyValue`, `StateMachineArn`, `TransactionsTableName`, `InboundQueueUrl`, `DLQUrl`, `EventBusName`, `ArchiveBucketName`, `DashboardUrl`. Their values must match the shapes used by tests (URL/ARN/Name patterns).

4. **S3 access logging & security**
   The access-logs bucket must set `objectOwnership = OBJECT_WRITER` when `accessControl = LOG_DELIVERY_WRITE`, with `blockPublicAccess = BLOCK_ALL`, `enforceSSL = true`, and encryption enabled. The archive bucket must be private, versioned, encrypted, SSL-enforced, log to the access-logs bucket with a prefix, and have the Glacier transition (90 days) and 365-day expiration. Use retention, not destroy.

5. **DynamoDB retention & indexes**
   You used `DESTROY`. Tests require retention: enable PITR, contributor insights, stream on the transactions table, and the three GSIs exactly as in the IDEAL_RESPONSE naming and keys.

6. **SQS & queue policies**
   EventBridge rule DLQs must be a **STANDARD** SQS queue (not FIFO). The inbound queue must be **FIFO** with content-based dedup and DLQ redrive. Be aware CDK may synthesize more than one `QueuePolicy`; tests must not hard-fail on a fixed count—assert presence and correctness instead of exact cardinality.

7. **EventBridge rules & targets**
   Rule names and patterns must be exact:
   • `tap-high-amount-<suffix>` with `source: tap.compliance`, `detail-type: High Amount Transaction` → Lambda target with DLQ and retries.
   • `tap-high-fraud-<suffix>` with `source: tap.fraud`, `detail-type: High Fraud Score` → Lambda target with DLQ and retries.
   • `tap-failure-spike-<suffix>` with `source: tap.compensation`, `detail-type: transaction.rolled_back` → **SQS queue target**. Do not expect DeadLetterConfig/RetryPolicy on the SQS target; those apply to Lambda targets.

8. **API Gateway integration & authorizer**
   Stage must have tracing, metrics, and data tracing enabled. The `POST /transactions` method must require a TOKEN authorizer, require an API key, and attach the request model. The integration must invoke Step Functions `StartExecution` with a role whose policy uses `Action` as an array and `Resource` set to the state machine ARN. Tests must not assert a brittle `Uri` literal; they should validate intent (service/action, method, credentials).

9. **Lambda configuration & env vars**
   All functions must be Node.js 18, ARM64, tracing active, and share expected environment keys. Environment values resolve to CloudFormation `Ref`/`GetAtt` (objects), not string literals—tests must assert presence (keys) rather than literal strings to avoid false failures.

10. **Provisioned concurrency & state machine logging**
    Provide the two required aliases with provisioned concurrency. State machine must have tracing and logs in the expected log group path including `environmentSuffix`.

11. **CloudWatch alarms and dashboard**
    Create the four alarms called out in the IDEAL_RESPONSE and the dashboard with the same high-level widgets and naming. Use retention patterns that match tests.

12. **Testing contract vs production**
    Do not change the already-running production stack to satisfy tests. Instead, adjust over-constrained tests (e.g., fixed `QueuePolicy` counts, DLQ expectations on SQS targets, literal env var strings, brittle API `Uri` matches) so they validate behavior and contracts, not internal synthesis artifacts.

**Deliverable**
Produce a corrected response that:
• Keeps all logic in `lib/tap-stack.ts`, preserves deployed semantics, and adheres to the exact naming/outputs contract.
• Aligns EventBridge, SQS, API Gateway, Step Functions, and S3 settings with the IDEAL_RESPONSE.
• Calls out any test adjustments needed where the prior tests asserted synthesis internals instead of externally observable behavior.
• Contains no additional files, no renames, and no code that would force resource replacement unnecessarily.
