# Failures

1. **Per-environment provider / cross-account scoping not applied**

   Problem in Model Response:

   ```python
   # Provider created but never used
   if role_arn:
       provider = aws.Provider(f"{env_name}-provider",
           assume_role=aws.ProviderAssumeRoleArgs(
               role_arn=role_arn,
               session_name=f"pulumi-{env_name}-deployment"
           ),
           region=config.get("region") or "us-east-1"
       )
   # Resources created without provider parameter
   bucket = aws.s3.Bucket("my-bucket", ...)  # No opts=ResourceOptions(provider=provider)
   ```

   How We Fixed It:

   ```python
   # lib/infrastructure/aws_provider.py - Singleton provider manager
   class AWSProviderManager:
       _instance = None
       def get_provider(self) -> Optional[aws.Provider]:
           if self._provider is None and self.config.role_arn:
               self._provider = aws.Provider(
                   self.provider_name,
                   assume_role=aws.ProviderAssumeRoleArgs(...),
                   region=self.config.primary_region
               )
           return self._provider

   # All resources use the provider consistently
   opts = ResourceOptions(provider=self.provider) if self.provider else None
   bucket = aws.s3.Bucket("bucket", ..., opts=opts)
   ```

2. **S3 bucket name is constructed incorrectly (duplication / naming bug)**

   Problem in Model Response:

   ```python
   # resources/storage.py
   class S3Bucket:
       def __init__(self, name: str, config: Dict[str, Any], ...):
           # name already includes prefix like "my-project-dev-data"
           bucket = f"{config['bucket_prefix']}-{name}"
           # Results in: "my-project-dev-my-project-dev-data"
           self.bucket = aws.s3.Bucket(name, bucket=bucket, ...)
   ```

   How We Fixed It:

   ```python
   # lib/infrastructure/storage.py
   class StorageStack:
       def __init__(self, config: MultiEnvConfig, ...):
           # Use centralized naming with normalization
           bucket_name = config.get_normalized_resource_name('data')
           # Produces: "tap-data-dev-useast1" (no duplication)
           self.buckets['data'] = aws.s3.Bucket(
               f"bucket-data",
               bucket=bucket_name,
               ...
           )
   ```

3. **EventBridge / S3 event wiring is incorrect (wrong event schema and approach)**

   Problem in Model Response:

   ```python
   # resources/events.py
   rule = aws.cloudwatch.EventRule(
       "s3-object-created",
       event_pattern=pulumi.Output.json_dumps({
           "source": ["aws.s3"],
           "detail-type": ["Object Created"],  # Wrong: S3 doesn't emit this
           "detail": {
               "bucket": {"name": [bucket_name]}  # Wrong schema
           }
       })
   )
   ```

   How We Fixed It:

   ```python
   # lib/infrastructure/eventbridge.py
   # Enable S3 EventBridge notifications first
   aws.s3.BucketNotification(
       f"bucket-{bucket_key}-eventbridge",
       bucket=bucket_id,
       eventbridge=True,  # Critical: Enable EventBridge for S3
       opts=opts
   )

   # Correct EventBridge pattern for S3 events
   event_pattern = {
       "source": ["aws.s3"],
       "detail-type": ["Object Created"],
       "detail": {
           "bucket": {"name": [bucket_name]},
           "object": {"key": [{"exists": True}]}
       }
   }
   ```

4. **Lambda permission `source_arn` and principal mismatches**

   Problem in Model Response:

   ```python
   # Brittle string concatenation for source_arn
   permission = aws.lambda_.Permission(
       "lambda-permission",
       action="lambda:InvokeFunction",
       function=lambda_function.name,
       principal="events.amazonaws.com",
       source_arn=f"arn:aws:events:{region}:{account_id}:rule/{rule_name}"
       # Manually constructed ARN prone to errors
   )
   ```

   How We Fixed It:

   ```python
   # lib/infrastructure/eventbridge.py
   # Use actual rule ARN from resource
   aws.lambda_.Permission(
       f"eventbridge-invoke-{function_key}",
       action="lambda:InvokeFunction",
       function=function_name,
       principal="events.amazonaws.com",
       source_arn=rule.arn,  # Use rule.arn directly, not string concat
       opts=opts
   )
   ```

5. **IAM policy documents built from Pulumi Outputs produce invalid JSON or shapes**

   Problem in Model Response:

   ```python
   # resources/iam.py
   policy = pulumi.Output.all(bucket_arns).apply(
       lambda arns: pulumi.json.dumps({
           "Version": "2012-10-17",
           "Statement": [{
               "Resource": arns  # Output not resolved, produces invalid JSON
           }]
       })
   )
   ```

   How We Fixed It:

   ```python
   # lib/infrastructure/iam.py
   # Resolve all Outputs first, then build policy inside apply
   Output.all(
       s3_arns=s3_bucket_arns,
       dynamodb_arns=dynamodb_table_arns,
       sqs_arns=sqs_queue_arns
   ).apply(lambda args: self._attach_lambda_policies(
       role, role_name,
       args['s3_arns'],      # Fully resolved strings
       args['dynamodb_arns'], # Fully resolved strings
       args['sqs_arns'],      # Fully resolved strings
       opts
   ))

   # Inside _attach_lambda_policies, all ARNs are plain strings
   s3_policy = {
       "Version": "2012-10-17",
       "Statement": [{
           "Resource": s3_resources  # Plain list of strings
       }]
   }
   aws.iam.RolePolicy(..., policy=pulumi.Output.json_dumps(s3_policy))
   ```

6. **IAM role S3/Dynamo/SQS resource lists misuse Outputs (iteration/time-of-eval issues)**

   Problem in Model Response:

   ```python
   # Attempting to iterate over Outputs as if they were lists
   s3_bucket_arns = [bucket1.arn, bucket2.arn]  # These are Output[str]
   s3_resources = s3_bucket_arns + [f"{arn}/*" for arn in s3_bucket_arns]
   # ERROR: Can't iterate Output[str] with f-string
   ```

   How We Fixed It:

   ```python
   # lib/infrastructure/iam.py
   # Method called INSIDE apply() where ARNs are resolved strings
   def _attach_lambda_policies(
       self,
       role: aws.iam.Role,
       role_name: str,
       s3_arns: List[str],      # Plain strings, not Outputs
       dynamodb_arns: List[str], # Plain strings, not Outputs
       sqs_arns: List[str],      # Plain strings, not Outputs
       opts: ResourceOptions
   ) -> None:
       # Now safe to iterate and format
       s3_resources = s3_arns + [f"{arn}/*" for arn in s3_arns]
       # Works because s3_arns is List[str], not List[Output[str]]
   ```

7. **DynamoDB global-replication implementation is incorrect / logically wrong**

   Problem in Model Response:

   ```python
   # resources/database.py
   def _configure_global_tables(self, replica_regions: List[Dict[str, str]]):
       for replica in replica_regions:
           aws.dynamodb.TableReplica(
               f"{self.name}-replica-{replica['region_name']}",
               global_table_arn=self.table.arn,
               region_name=replica['region_name']  # Same region as primary!
           )

   # Config returns same region
   def _get_replica_regions(self) -> List[Dict[str, str]]:
       if self.env_name == "prod":
           return [{"region_name": self.aws_region}]  # Same region!
   ```

   How We Fixed It:

   ```python
   # lib/infrastructure/dynamodb.py
   def setup_prod_to_staging_replication(
       prod_table: aws.dynamodb.Table,
       staging_table: aws.dynamodb.Table,
       staging_region: str,
       opts: Optional[ResourceOptions] = None
   ):
       # Create replica in DIFFERENT region (staging)
       replica = aws.dynamodb.TableReplica(
           "items-prod-to-staging-replica",
           global_table_arn=prod_table.arn,
           region_name=staging_region,  # Different region
           opts=opts
       )
       return replica

   # Called with actual different regions
   if prod_config.dynamodb_enable_global_tables:
       setup_prod_to_staging_replication(
           prod_table,
           staging_table,
           staging_config.primary_region  # Different region
       )
   ```

8. **EventBridge targets lack the required delivery/assume-role permissions**

   Problem in Model Response:

   ```python
   # resources/events.py
   target = aws.cloudwatch.EventTarget(
       "event-target",
       rule=rule.name,
       arn=lambda_function.arn
       # Missing: role_arn for EventBridge to invoke Lambda
       # Missing: IAM role with invoke permissions
   )
   ```

   How We Fixed It:

   ```python
   # lib/infrastructure/eventbridge.py
   # Create IAM role for EventBridge
   eventbridge_role = self.iam_stack.create_eventbridge_role(
       f"eventbridge-{rule_key}",
       target_arns=[function_arn, dlq_arn]
   )

   # lib/infrastructure/iam.py
   def create_eventbridge_role(self, name: str, target_arns: List[Output[str]]):
       # Role with proper trust policy
       role = aws.iam.Role(
           f"{role_name}-role",
           assume_role_policy={
               "Version": "2012-10-17",
               "Statement": [{
                   "Effect": "Allow",
                   "Principal": {"Service": "events.amazonaws.com"},
                   "Action": "sts:AssumeRole"
               }]
           }
       )
       # Attach invoke policy
       Output.all(target_arns=target_arns).apply(
           lambda args: self._attach_eventbridge_invoke_policy(role, args['target_arns'])
       )
       return role
   ```

9. **S3 vs EventBridge contract mismatch — Lambda handler expects S3 records**

   Problem in Model Response:

   ```python
   # lambda_code/handler.py
   def lambda_handler(event, context):
       # Expects S3 notification format
       for record in event['Records']:  # ERROR: EventBridge has no 'Records'
           bucket = record['s3']['bucket']['name']
           key = record['s3']['object']['key']
   ```

   How We Fixed It:

   ```python
   # lib/infrastructure/lambda_code/process_handler.py
   def lambda_handler(event, context):
       # Handle EventBridge S3 event format
       if event.get('source') == 'aws.s3' and event.get('detail-type') == 'Object Created':
           detail = event.get('detail', {})
           bucket_info = detail.get('bucket', {})
           object_info = detail.get('object', {})

           bucket = bucket_info.get('name')
           key = object_info.get('key')
           size = object_info.get('size', 0)

           # Convert to Decimal for DynamoDB
           item = {
               'id': str(uuid.uuid4()),
               'timestamp': datetime.utcnow().isoformat(),
               'bucket': bucket,
               'key': key,
               'size': Decimal(str(size)),  # Decimal, not int/float
               'environment': os.environ['ENVIRONMENT']
           }
           table.put_item(Item=item)
   ```

10. **Use of bucket.id instead of bucket.name/ARN in places that expect a name or ARN**

    Problem in Model Response:

    ```python
    # Passing bucket.id where bucket name is expected
    def create_s3_event_rule(self, bucket_id, ...):
        event_pattern = {
            "detail": {
                "bucket": {"name": [bucket_id]}  # bucket.id is not the name!
            }
        }
    ```

    How We Fixed It:

    ```python
    # lib/infrastructure/eventbridge.py
    # Use bucket name, not ID
    bucket_name = self.storage_stack.get_bucket_name(bucket_key)

    event_pattern = {
        "source": ["aws.s3"],
        "detail-type": ["Object Created"],
        "detail": {
            "bucket": {"name": [bucket_name]},  # Use bucket.bucket (name)
            "object": {"key": [{"exists": True}]}
        }
    }

    # lib/infrastructure/storage.py
    def get_bucket_name(self, bucket_key: str) -> Output[str]:
        return self.buckets[bucket_key].bucket  # Returns bucket name, not id
    ```

11. **Config validation approach is fragile and can give false negatives**

    Problem in Model Response:

    ```python
    # config.py
    def validate_environment_configs(configs: Dict[str, EnvironmentConfig]):
        # Brittle JSON string comparison
        lifecycle_json_1 = json.dumps(config1.s3_config['lifecycle_rules'])
        lifecycle_json_2 = json.dumps(config2.s3_config['lifecycle_rules'])
        if lifecycle_json_1 != lifecycle_json_2:  # Order-sensitive!
            raise ValueError("Lifecycle rules mismatch")
    ```

    How We Fixed It:

    ```python
    # lib/infrastructure/config.py
    def validate_environment_configs(configs: Dict[str, MultiEnvConfig]):
        # Structural comparison, not string comparison
        if len(configs) <= 1:
            return  # Skip validation for single environment

        env_names = list(configs.keys())
        reference_env = configs[env_names[0]]

        for env_name, env_config in configs.items():
            if env_name == env_names[0]:
                continue

            # Compare actual values, not JSON strings
            if reference_env.s3_versioning_enabled != env_config.s3_versioning_enabled:
                raise ValueError(f"S3 versioning mismatch: {env_name}")

            if reference_env.s3_encryption_algorithm != env_config.s3_encryption_algorithm:
                raise ValueError(f"S3 encryption algorithm mismatch: {env_name}")

            # Validate prod-specific requirements
            if 'prod' in configs and 'staging' in configs:
                prod_config = configs['prod']
                staging_config = configs['staging']

                if prod_config.dynamodb_enable_global_tables:
                    if not staging_config.dynamodb_enable_global_tables:
                        raise ValueError(
                            "Staging must have global tables enabled for prod replication"
                        )
    ```

12. **Packaging / deployment and runtime mismatches left unaddressed**

    Problem in Model Response:

    ```python
    # Assumes pre-built zip exists
    lambda_function = aws.lambda_.Function(
        "processor",
        code=pulumi.AssetArchive({
            '.': pulumi.FileArchive('./lambda_code/dist/lambda_package.zip')
            # No cross-account artifact distribution
            # No build process
            # No version management
        })
    )
    ```

    How We Fixed It:

    ```python
    # lib/infrastructure/lambda_functions.py
    class LambdaStack:
        def __init__(self, ...):
            # Build Lambda package dynamically
            self.lambda_package_path = self._build_lambda_package()

        def _build_lambda_package(self) -> str:
            # Create temporary directory for packaging
            package_dir = tempfile.mkdtemp()

            # Copy handler code
            handler_source = os.path.join(
                os.path.dirname(__file__),
                'lambda_code',
                'process_handler.py'
            )
            shutil.copy(handler_source, os.path.join(package_dir, 'process_handler.py'))

            # Create zip archive
            zip_path = os.path.join(tempfile.gettempdir(), 'lambda_package.zip')
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(package_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, package_dir)
                        zipf.write(file_path, arcname)

            return zip_path

        def create_function(self, ...):
            # Use dynamically built package
            function = aws.lambda_.Function(
                function_name,
                code=pulumi.FileArchive(self.lambda_package_path),
                runtime=self.config.lambda_runtime,  # python3.11
                handler="process_handler.lambda_handler",
                ...
            )
    ```
