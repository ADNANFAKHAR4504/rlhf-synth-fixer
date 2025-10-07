# Failures

- **Invalid use of block*public*\* as Bucket args**  
  The code passes block_public_acls , block_public_policy , ignore_public_acls , restrict_public_buckets directly to aws.s3.Bucket . In Pulumi/AWS these are usually provided via aws.s3.BucketPublicAccessBlock (separate resource) — this will error or be ignored.

  **Model Response (WRONG):**

  ```python
  source_bucket = aws.s3.Bucket(
      f"{name_prefix}-source-bucket",
      acl="private",
      tags=tags,
      # Block public access - WRONG: These args don't exist on Bucket
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
  )
  ```

  **Our Fix:**

  ```python
  # Create the bucket first
  bucket = aws.s3.Bucket(f"img-proc-source-bucket-{environment_suffix}", ...)

  # Block all public access using separate resource
  aws.s3.BucketPublicAccessBlock(
      f"img-proc-source-pab-{environment_suffix}",
      bucket=bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=pulumi.ResourceOptions(parent=bucket)
  )
  ```

- **Packaging run at Pulumi runtime (non-reproducible build)**  
  The Lambda packaging uses local subprocess / pip install and filesystem operations inside the Pulumi program. That requires a specific local environment and makes deployments non-reproducible in CI. Packaging should be done outside the Pulumi program or via AssetArchive built deterministically.

  **Model Response (WRONG):**

  ```python
  # Create a directory for the deployment package
  deployment_dir = "lambda_deployment_package"
  if os.path.exists(deployment_dir):
      shutil.rmtree(deployment_dir)
  os.makedirs(deployment_dir)

  # Install dependencies at runtime - WRONG!
  subprocess.run([
      "pip", "install",
      "--target", deployment_dir,
      "-r", "lambda_code/requirements.txt"
  ], check=True)
  ```

  **Our Fix:**

  ```python
  # Use AssetArchive with pre-built code directory
  code=pulumi.AssetArchive({
      ".": pulumi.FileArchive(os.path.join(os.path.dirname(__file__), "..", "lambda_code"))
  })
  ```

- **No automated validation / readiness checks**  
  The prompt asked the solution be "validated successfully and ready for deployment." The response contains **no validation tests, Pulumi policy checks, or CloudFormation-style validation steps**.

  **Model Response (WRONG):**

  ```python
  # No validation or readiness checks - just exports
  pulumi.export("source_bucket_name", source_bucket.id)
  pulumi.export("destination_bucket_name", destination_bucket.id)
  ```

  **Our Fix:**

  ```python
  # Create validation checks
  from lib.infrastructure import validation
  self.validations = validation.create_validation_checks(
      source_bucket=self.source_bucket,
      destination_bucket=self.destination_bucket,
      lambda_function=self.lambda_function,
      kms_key=self.kms_key,
      environment_suffix=self.environment_suffix
  )

  # Create readiness tests
  self.readiness_tests = validation.create_readiness_tests(
      source_bucket=self.source_bucket,
      destination_bucket=self.destination_bucket,
      lambda_function=self.lambda_function,
      environment_suffix=self.environment_suffix
  )
  ```

- **S3 notification shape inconsistent**  
   aws.s3.BucketNotification is created with plain dicts for lambda_functions instead of typed BucketNotificationLambdaFunctionArgs or consistent Pulumi patterns — this may still work but is inconsistent and error-prone.

  **Model Response (WRONG):**

  ```python
  bucket_notification = aws.s3.BucketNotification(
      f"{name_prefix}-bucket-notification",
      bucket=source_bucket_name,
      lambda_functions=[{  # WRONG: Plain dict instead of typed args
          "lambda_function_arn": lambda_function_arn,
          "events": ["s3:ObjectCreated:*"],
          "filter_prefix": "",
          "filter_suffix": ""
      }],
  )
  ```

  **Our Fix:**

  ```python
  notification = aws.s3.BucketNotification(
      f"img-proc-s3-notification-{environment_suffix}",
      bucket=source_bucket.id,
      lambda_functions=[aws.s3.BucketNotificationLambdaFunctionArgs(  # CORRECT: Typed args
          lambda_function_arn=lambda_function.arn,
          events=["s3:ObjectCreated:*"],
          filter_prefix="uploads/",
          filter_suffix=".jpg"
      )],
      opts=pulumi.ResourceOptions(
          parent=source_bucket,
          depends_on=[lambda_permission]
      )
  )
  ```

- **Handler uploads BytesIO directly to put_object without .read() **  
  The Lambda uploads Body=buffer (BytesIO). While boto3 accepts file-like objects, the code should use buffer.getvalue() or ensure the file pointer is reset — this is fragile and may cause subtle runtime issues.

  **Model Response (WRONG):**

  ```python
  # Save thumbnail to memory
  buffer = BytesIO()
  image.save(buffer, format='JPEG')
  buffer.seek(0)

  # Upload thumbnail to destination bucket - WRONG: Direct BytesIO usage
  s3.put_object(
      Bucket=DESTINATION_BUCKET,
      Key=thumbnail_key,
      Body=buffer,  # WRONG: Should use buffer.getvalue()
      ContentType='image/jpeg'
  )
  ```

  **Our Fix:**

  ```python
  # Save thumbnail to BytesIO
  thumbnail_buffer = io.BytesIO()
  thumbnail.save(thumbnail_buffer, format='JPEG', quality=85, optimize=True)
  thumbnail_buffer.seek(0)

  # Upload thumbnail to destination bucket - CORRECT: Use getvalue()
  s3_client.put_object(
      Bucket=destination_bucket,
      Key=thumbnail_key,
      Body=thumbnail_buffer.getvalue(),  # CORRECT: Use getvalue()
      ContentType='image/jpeg',
      ServerSideEncryption='aws:kms'
  )
  ```

- **No explicit failure/retry/DLQ or monitoring for failed invocations**  
  The prompt emphasizes operational monitoring and security; the solution has no DLQ, SNS alarms, or explicit retry/error handling configuration for failed processing.

  **Model Response (WRONG):**

  ```python
  # No DLQ, monitoring, or error handling
  lambda_function = aws.lambda_.Function(
      f"{name_prefix}-image-processor",
      role=role_arn,
      runtime="python3.9",
      handler="index.handler",
      # No dead letter queue or monitoring
  )
  ```

  **Our Fix:**

  ```python
  # Create Dead Letter Queue
  self.dlq = lambda_function.create_dead_letter_queue(
      name_prefix="img-proc",
      environment_suffix=self.environment_suffix,
      tags=self.tags
  )

  # Lambda with DLQ configuration
  lambda_function = aws.lambda_.Function(
      function_name,
      dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
          target_arn=dlq_arn
      ),
      # ... other config
  )

  # Create comprehensive CloudWatch alarms
  self.alarms = monitoring.create_cloudwatch_alarms(
      function_name=self.lambda_function.name,
      function_arn=self.lambda_function.arn,
      environment_suffix=self.environment_suffix,
      tags=self.tags
  )
  ```

- **Bucket naming risks (no uniqueness/safety)**  
  Buckets are named from name_prefix without account/stack uniqueness — this risks name collisions across accounts/regions and violates best-practice for production-ready automation.

  **Model Response (WRONG):**

  ```python
  # Simple naming without uniqueness - WRONG!
  source_bucket = aws.s3.Bucket(
      f"{name_prefix}-source-bucket",  # WRONG: No uniqueness
      # ...
  )
  ```

  **Our Fix:**

  ```python
  # Generate unique bucket name with org/project
  bucket_name = pulumi.Output.all(
      pulumi.get_organization(),
      pulumi.get_project()
  ).apply(lambda args: f"img-proc-source-{environment_suffix}-{args[0]}-{args[1]}".lower().replace('_', '-'))

  # Create the bucket with unique name
  bucket = aws.s3.Bucket(
      f"img-proc-source-bucket-{environment_suffix}",
      bucket=bucket_name,  # CORRECT: Unique name
      # ...
  )
  ```
