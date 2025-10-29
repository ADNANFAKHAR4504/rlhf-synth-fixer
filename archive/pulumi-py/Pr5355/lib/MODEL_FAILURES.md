# Failures

1. **API Gateway → Lambda integration URI is incorrect**

   Problem in Model Response:

   ```python
   upload_integration = aws.apigateway.Integration(
       "upload-integration",
       rest_api=api_gateway.id,
       resource_id=upload_resource.id,
       http_method=upload_method.http_method,
       integration_http_method="POST",
       type="AWS_PROXY",
       uri=lambda_resources["upload"].invoke_arn  # INCORRECT
   )
   ```

   Our Fix:

   ```python
   upload_integration_uri = Output.all(
       self.config.primary_region,
       upload_function.arn
   ).apply(
       lambda args: (
           f"arn:aws:apigateway:{args[0]}:lambda:path/2015-03-31/"
           f"functions/{args[1]}/invocations"
       )
   )

   self.upload_integration = aws.apigateway.Integration(
       "upload-integration",
       rest_api=self.api.id,
       resource_id=self.upload_resource.id,
       http_method=self.upload_method.http_method,
       integration_http_method="POST",
       type="AWS_PROXY",
       uri=upload_integration_uri  # CORRECT service integration path
   )
   ```

2. **API Gateway permission `source_arn` / invoke permission is brittle/invalid**

   Problem in Model Response:

   ```python
   aws.lambda_.Permission(
       f"api-lambda-permission-{name}",
       action="lambda:InvokeFunction",
       function=lambda_func.name,
       principal="apigateway.amazonaws.com",
       source_arn=pulumi.Output.concat(
           api_gateway.execution_arn, "/*/*"  # FRAGILE
       )
   )
   ```

   Our Fix:

   ```python
   upload_source_arn = Output.all(
       self.api.execution_arn
   ).apply(lambda args: f"{args[0]}/*/*/*")  # Proper execute-api ARN pattern

   aws.lambda_.Permission(
       "api-upload-permission",
       action="lambda:InvokeFunction",
       function=upload_function.arn,  # Use ARN not name
       principal="apigateway.amazonaws.com",
       source_arn=upload_source_arn,
       opts=ResourceOptions(
           provider=self.provider_manager.get_provider()
       )
   )
   ```

3. **Invalid `retry_attempts` argument on aws.lambda.Function**

   Problem in Model Response:

   ```python
   upload_lambda = aws.lambda_.Function(
       "upload-lambda",
       name=f"upload-{environment}-{region}",
       role=upload_role.arn,
       handler="index.handler",
       dead_letter_config={
           "targetArn": dlq_upload.arn
       },
       retry_attempts=2,  # INVALID - not a valid Lambda Function argument
       **lambda_config
   )
   ```

   Our Fix:

   ```python
   function = aws.lambda_.Function(
       f"{function_name}-function",
       name=resource_name,
       runtime=self.config.lambda_runtime,
       handler="upload_handler.handler",
       role=role.arn,
       dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
           target_arn=self.sqs_stack.get_dlq_arn(function_name)  # DLQ handles retries
       ),
       # Removed retry_attempts - handled by DLQ with maxReceiveCount=2
       tracing_config=aws.lambda_.FunctionTracingConfigArgs(
           mode="Active" if self.config.enable_xray_tracing else "PassThrough"
       ),
       opts=ResourceOptions(
           provider=self.provider_manager.get_provider(),
           depends_on=[role]
       )
   )
   ```

4. **IAM policy JSON built from Pulumi Outputs — invalid serialization**

   Problem in Model Response:

   ```python
   if s3_bucket_arn:
       s3_statement = {
           "Effect": "Allow",
           "Action": ["s3:GetObject", "s3:ListBucket", "s3:PutObject"],
           "Resource": [
               s3_bucket_arn,  # This is a Pulumi Output[str]
               f"{s3_bucket_arn}/*"  # Cannot concatenate Output directly
           ]
       }
       basic_policy_document["Statement"].append(s3_statement)

   policy = aws.iam.Policy(
       f"{function_name}-policy",
       name=f"{function_name}-policy-{environment}-{region}",
       policy=json.dumps(basic_policy_document)  # INVALID - dumps unresolved Outputs
   )
   ```

   Our Fix:

   ```python
   def _attach_s3_policy(
       self,
       role: aws.iam.Role,
       role_name: str,
       s3_bucket_arn: Output[str]
   ):
       policy_doc = s3_bucket_arn.apply(lambda arn: pulumi.Output.json_dumps({
           "Version": "2012-10-17",
           "Statement": [{
               "Effect": "Allow",
               "Action": [
                   "s3:GetObject",
                   "s3:PutObject",
                   "s3:DeleteObject",
                   "s3:ListBucket"
               ],
               "Resource": [
                   arn,
                   f"{arn}/*"
               ]
           }]
       }))  # Proper Output handling with pulumi.Output.json_dumps

       policy = aws.iam.RolePolicy(
           f"lambda-role-{role_name}-s3-policy",
           role=role.id,
           policy=policy_doc,
           opts=ResourceOptions(
               provider=self.provider_manager.get_provider(),
               parent=role
           )
       )
   ```

5. **S3 lifecycle rule mismatch for processed-file expiry**

   Problem in Model Response:

   ```python
   s3_bucket = aws.s3.Bucket(
       "financial-data-bucket",
       bucket=s3_bucket_name,
       lifecycle_rules=[
           {
               "id": "cleanup-processed-files",
               "prefix": "incoming/",  # WRONG - files moved to processed/
               "enabled": True,
               "expiration": {
                   "days": 30
               }
           }
       ]
   )
   ```

   Our Fix:

   ```python
   aws.s3.BucketLifecycleConfigurationV2(
       "bucket-lifecycle",
       bucket=self.bucket.id,
       rules=[
           aws.s3.BucketLifecycleConfigurationV2RuleArgs(
               id="delete-processed-files",
               status="Enabled",
               filter=aws.s3.BucketLifecycleConfigurationV2RuleFilterArgs(
                   prefix="processed/"  # CORRECT - matches where files are moved
               ),
               expiration=aws.s3.BucketLifecycleConfigurationV2RuleExpirationArgs(
                   days=30
               )
           )
       ],
       opts=ResourceOptions(
           provider=self.provider_manager.get_provider(),
           parent=self.bucket
       )
   )
   ```

6. **Server-side encryption type mismatch**

   Problem in Model Response:

   ```python
   s3_bucket = aws.s3.Bucket(
       "financial-data-bucket",
       bucket=s3_bucket_name,
       server_side_encryption_configuration={
           "rule": {
               "applyServerSideEncryptionByDefault": {
                   "sseAlgorithm": "AES256"  # S3-managed, not AWS-managed
               }
           }
       }
   )
   ```

   Our Fix:

   ```python
   aws.s3.BucketServerSideEncryptionConfigurationV2(
       "bucket-encryption",
       bucket=self.bucket.id,
       rules=[
           aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
               apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                   sse_algorithm="aws:kms"  # AWS-managed KMS encryption
               ),
               bucket_key_enabled=True
           )
       ],
       opts=ResourceOptions(
           provider=self.provider_manager.get_provider(),
           parent=self.bucket
       )
   )
   ```

7. **CloudWatch alarm semantics incorrect for ">1% errors"**

   Problem in Model Response:

   ```python
   lambda_error_alarm = aws.cloudwatch.MetricAlarm(
       f"{name}-lambda-errors-alarm",
       alarm_name=f"{name}-lambda-errors-{environment}-{region}",
       comparison_operator="GreaterThanOrEqualToThreshold",
       evaluation_periods=1,
       metric_name="Errors",
       namespace="AWS/Lambda",
       period=60,
       statistic="Sum",
       threshold=1,  # WRONG - absolute count, not percentage
       alarm_description=f"Alarm for {name} Lambda errors exceeding 1%"
   )
   ```

   Our Fix:

   ```python
   error_rate_expression = (
       f"(m1 / m2) * 100 > 1 ? 1 : 0"
   )

   alarm = aws.cloudwatch.MetricAlarm(
       f"{function_name}-error-rate-alarm",
       alarm_name=alarm_name,
       comparison_operator="GreaterThanThreshold",
       evaluation_periods=2,
       threshold=0,
       treat_missing_data="notBreaching",
       metrics=[
           aws.cloudwatch.MetricAlarmMetricArgs(
               id="m1",
               metric=aws.cloudwatch.MetricAlarmMetricMetricArgs(
                   metric_name="Errors",
                   namespace="AWS/Lambda",
                   period=300,
                   stat="Sum",
                   dimensions={"FunctionName": function_name}
               ),
               return_data=False
           ),
           aws.cloudwatch.MetricAlarmMetricArgs(
               id="m2",
               metric=aws.cloudwatch.MetricAlarmMetricMetricArgs(
                   metric_name="Invocations",
                   namespace="AWS/Lambda",
                   period=300,
                   stat="Sum",
                   dimensions={"FunctionName": function_name}
               ),
               return_data=False
           ),
           aws.cloudwatch.MetricAlarmMetricArgs(
               id="e1",
               expression=error_rate_expression,  # CORRECT - calculates percentage
               return_data=True
           )
       ]
   )
   ```

8. **EventBridge / Event routing & SQS permissions omissions (where applicable)**

   Problem in Model Response:
   The model response did not include explicit IAM permissions for Lambda functions to send messages to their DLQs.

   Our Fix:

   ```python
   def _attach_sqs_policy(
       self,
       role: aws.iam.Role,
       role_name: str,
       dlq_arn: Output[str]
   ):
       policy_doc = dlq_arn.apply(lambda arn: pulumi.Output.json_dumps({
           "Version": "2012-10-17",
           "Statement": [{
               "Effect": "Allow",
               "Action": ["sqs:SendMessage"],  # Explicit DLQ permission
               "Resource": arn
           }]
       }))

       policy = aws.iam.RolePolicy(
           f"lambda-role-{role_name}-sqs-policy",
           role=role.id,
           policy=policy_doc,
           opts=ResourceOptions(
               provider=self.provider_manager.get_provider(),
               parent=role
           )
       )
   ```

9. **Lambda permissions for S3 invoke use `function=name` instead of stable ARN reference**

   Problem in Model Response:

   ```python
   lambda_permission = aws.lambda_.Permission(
       "s3-lambda-permission",
       action="lambda:InvokeFunction",
       function=processor_lambda.name,  # WRONG - uses name
       principal="s3.amazonaws.com",
       source_arn=s3_bucket.arn
   )
   ```

   Our Fix:

   ```python
   permission = aws.lambda_.Permission(
       "s3-processor-permission",
       action="lambda:InvokeFunction",
       function=self.processor_function.arn,  # CORRECT - uses ARN
       principal="s3.amazonaws.com",
       source_arn=self.storage_stack.get_bucket_arn(),
       opts=ResourceOptions(
           provider=self.provider_manager.get_provider()
       )
   )
   ```

10. **Invalid export / missing API URL property**

    Problem in Model Response:

    ```python
    pulumi.export('api_url', api_resources["api_gateway"].url)  # INVALID - no .url attribute
    ```

    Our Fix:

    ```python
    def get_api_url(self) -> Output[str]:
        return Output.all(
            self.api.id,
            self.stage.stage_name,
            self.config.primary_region
        ).apply(
            lambda args: (
                f"https://{args[0]}.execute-api.{args[2]}.amazonaws.com/{args[1]}"
            )
        )

    outputs['api_endpoint_url'] = self.api_gateway_stack.get_api_url()
    pulumi.export('api_endpoint_url', outputs['api_endpoint_url'])
    ```

11. **IAM least-privilege gaps (wildcards & X-Ray/log resource scopes)**

    Problem in Model Response:

    ```python
    basic_policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
                "Resource": f"arn:aws:logs:{region}:*:log-group:/aws/lambda/{function_name}-*"
            },
            {
                "Effect": "Allow",
                "Action": ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
                "Resource": "*"  # TOO BROAD
            }
        ]
    }
    ```

    Our Fix:

    ```python
    def _attach_cloudwatch_logs_policy(self, role: aws.iam.Role, role_name: str):
        log_group_arn = (
            f"arn:aws:logs:{self.config.primary_region}:"
            f"{self.config.account_id}:log-group:/aws/lambda/*"
        )

        policy_doc = pulumi.Output.json_dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": [
                    log_group_arn,
                    f"{log_group_arn}:*"  # Scoped to account and log groups
                ]
            }]
        })

    def _attach_xray_policy(self, role: aws.iam.Role, role_name: str):
        policy_doc = pulumi.Output.json_dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "xray:PutTraceSegments",
                    "xray:PutTelemetryRecords"
                ],
                "Resource": "*"  # X-Ray requires wildcard per AWS documentation
            }]
        })
    ```

12. **Packaging / deployment assumptions and missing CI guidance**

    Problem in Model Response:

    ```python
    code=pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lambda/upload")  # No build process or dependency management
    })
    ```

    Our Fix:
    We created a structured Lambda code directory with proper handler files and clear separation:

    ```
    lib/infrastructure/lambda_code/
    ├── upload_handler.py
    ├── status_handler.py
    ├── results_handler.py
    └── processor_handler.py
    ```

    Each handler includes structured JSON logging, proper error handling, and environment variable configuration:

    ```python
    code=AssetArchive({
        ".": FileArchive("./lib/infrastructure/lambda_code")
    })
    ```

    Additionally, we use consistent naming and environment variables for configuration, making the deployment deterministic and CI-friendly.
