# model_failure

Common ways this task can fail and how to avoid them:

1. Circular dependencies between S3 and Lambda
   Direct S3 bucket notifications to a Lambda target can create a dependency cycle when the Lambda role or policy references the bucket. Use EventBridge to subscribe to S3 “Object Created” events and invoke the Lambda, then grant `events.amazonaws.com` permission to call the function.

2. Missing required properties in Auto Scaling policies
   Target tracking policies must include `PolicyType: TargetTrackingScaling` and reference `ScalingTargetId`. Do not supply both `ScalingTargetId` and `ResourceId` in the same policy. Ensure corresponding `ScalableTarget` resources are defined with correct dimensions for DynamoDB read/write capacity.

3. Parameters without default values
   If the deployment path does not supply parameter overrides, parameters like environment suffix or alert email must include defaults. Always provide defaults for essential parameters to prevent `ValidationError` at change set creation.

4. Over-permissive IAM roles
   Broad wildcards break the principle of least privilege and can trigger security reviews. Scope S3 permissions to the specific bucket and its objects, DynamoDB permissions to the target table ARN, and KMS actions to the CMK. Keep CloudWatch Logs actions minimal and resource-scoped where feasible.

5. S3 bucket policy misconfiguration
   Failing to enforce TLS or SSE-S3 allows noncompliant uploads. Include statements to deny insecure transport and deny `PutObject` without `x-amz-server-side-encryption: AES256`. To restrict to VPC, check `aws:SourceVpce` against the S3 Gateway Endpoint.

6. API Gateway logging gaps
   Without a CloudWatch role/account association and a dedicated log group, execution logs may be missing. Create the API Gateway Account resource tied to an execution role with the push-to-CWLogs managed policy, and define a log group with retention.

7. Lambda and VPC endpoint access
   If interface endpoints are created, ensure a security group allows inbound 443 from the Lambda security group. Confirm Lambda subnets are private and have either NAT (for public services) or VPC endpoints for required services.

8. KMS usage mismatches
   Using CMK without proper key policy grants can block DynamoDB or Logs encryption. Include service principals for DynamoDB and Logs with the minimal actions required. Reference the CMK ARN in DynamoDB SSE and Lambda `KmsKeyArn` settings as needed.

9. Cognito role attachment issues
   The Identity Pool Role Attachment must map the authenticated role properly. Ensure the role trust policy includes the Identity Pool audience condition and the `amr` claim for `authenticated`.

10. Incomplete observability and alerts
    Missing alarms on Lambda errors/throttles, API 5XX, or DynamoDB throttles reduces operational visibility. Define alarms with actionable thresholds and wire them to an SNS Topic with an email subscription.

11. Naming collisions across environments
    If resource names omit `ENVIRONMENTSUFFIX`, deployments in parallel environments can fail. Always suffix names and outputs to segregate resources and exports.

Avoiding the above pitfalls ensures the template validates cleanly, passes linting, and deploys a secure, highly available, fully managed serverless stack that satisfies the specified constraints.
