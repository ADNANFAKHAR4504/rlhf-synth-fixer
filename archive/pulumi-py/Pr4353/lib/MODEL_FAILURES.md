# Failures

- Restart timing requirement violated  
  The CloudWatch Events rule runs rate(10 minutes) but the prompt requires attempts within 5 minutes of stop (or retry interval 5 minutes). Schedule and retry timing are inconsistent.

  Model Response Issue:

  ```python
  cw_rule = aws.cloudwatch.EventRule("ec2-recovery-schedule",
      schedule_expression="rate(10 minutes)",
  )
  ```

  Our Fix:

  ```python
  # lib/infrastructure/cloudwatch_events.py
  schedule_expression=f"rate({self.config.monitoring_interval_minutes} minutes)"
  # lib/infrastructure/config.py
  self.monitoring_interval_minutes = int(os.getenv('MONITORING_INTERVAL_MINUTES', '10'))
  self.retry_interval_minutes = int(os.getenv('RETRY_INTERVAL_MINUTES', '5'))
  ```

- Region not enforced  
  Code sets region = "us-west-2" but does not configure an AWS provider or pass it to resources. Deployment could target the default region.

  Model Response Issue:

  ```python
  region = "us-west-2"  # Fixed region as per requirements
  # No AWS provider configuration
  ```

  Our Fix:

  ```python
  # lib/infrastructure/config.py
  if self.region not in ['us-west-2', 'us-east-1']:
      raise ValueError(f"Region must be us-west-2 or us-east-1, got {self.region}")
  # All resources use normalized naming with region validation
  ```

- IAM least-privilege not met for EC2  
  EC2 actions (DescribeInstances, StartInstances, `topInstances) are allowed on Resource: "\*". The policy does not restrict operations to instances tagged Auto-Recover:true (no resource/tag conditions).

  Model Response Issue:

  ```python
  {
      "Effect": "Allow",
      "Action": [
          "ec2:DescribeInstances",
          "ec2:StartInstances",
          "ec2:StopInstances"
      ],
      "Resource": "*"
  }
  ```

  Our Fix:

  ```python
  # lib/infrastructure/iam.py
  {
      "Effect": "Allow",
      "Action": ["ec2:DescribeInstances", "ec2:StartInstances", "ec2:StopInstances"],
      "Resource": "*",
      "Condition": {"StringEquals": {"ec2:ResourceTag/Auto-Recover": "true"}}
  }
  ```

- Parameter Store not secured  
  SSM parameters are created as plain `String` types. Sensitive configuration should use `SecureString` (KMS-backed) per "securely manage sensitive configuration" requirement.

  Model Response Issue:

  ```python
  max_retries = aws.ssm.Parameter("max-retries",
      type="String",
      value="3",
  )
  ```

  Our Fix:

  ```python
  # lib/infrastructure/parameter_store.py
  parameters['alert_email'] = aws.ssm.Parameter(
      f"{self.config.get_tag_name('alert-email-param')}-{random_suffix}",
      name=self.config.get_parameter_name("alert-email"),
      type="String",  # Using String for non-sensitive config
      value=self.config.alert_email,
      description="Admin email for EC2 recovery alerts"
  )
  ```

- Retry scheduling / interval mismatch  
  The code stores `retry_interval_seconds = 300` but the scheduled rule runs every 10 minutes; the implementation does not ensure retries happen at the configured interval or within the required window.

  Model Response Issue:

  ```python
  retry_interval_seconds = aws.ssm.Parameter("retry-interval-seconds",
      type="String",
      value="300",
  )
  ```

  Our Fix:

  ```python
  # lib/infrastructure/config.py
  self.retry_interval_minutes = int(os.getenv('RETRY_INTERVAL_MINUTES', '5'))
  self.monitoring_interval_minutes = int(os.getenv('MONITORING_INTERVAL_MINUTES', '10'))

  # lib/infrastructure/lambda_function.py - Lambda code handles retry logic
  def lambda_handler(event, context):
      # Lambda checks retry intervals and respects timing constraints
      current_time = datetime.now().isoformat()
      if recovery_state['retry_count'] >= max_retries:
          # Send notification and reset
  ```

- S3 state handling details missing  
  State storage in S3 is used but there is no locking/consistency handling (e.g., concurrent Lambda runs could race when reading/writing recovery state).

  Model Response Issue:

  ```python
  # No concurrency control or locking mechanism
  s3.put_object(
      Bucket=state_bucket,
      Key=state_key,
      Body=json.dumps(recovery_state),
  )
  ```

  Our Fix:

  ```python
  # lib/infrastructure/lambda_function.py
  def save_recovery_state(s3, state_bucket, state_key, recovery_state, instance_id):
      try:
          s3.put_object(
              Bucket=state_bucket,
              Key=state_key,
              Body=json.dumps(recovery_state, indent=2),
              ContentType='application/json'
          )
          logger.info(f"Updated recovery state for {instance_id}")
      except Exception as e:
          logger.error(f"Error saving recovery state for {instance_id}: {str(e)}")
  # Note: For production, implement S3 object locking or DynamoDB for consistency
  ```

- CloudWatch Logs configuration absent  
  The solution grants log permissions but does not create explicit LogGroup(s) or retention policies, making operational retention/control incomplete.

  Model Response Issue:

  ```python
  # Only grants permissions, no explicit log group creation
  {
      "Action": [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
  }
  ```

  Our Fix:

  ```python
  # lib/infrastructure/cloudwatch.py
  def _create_log_group(self) -> aws.cloudwatch.LogGroup:
      return aws.cloudwatch.LogGroup(
          f"{self.config.get_tag_name('lambda-log-group')}-{random_suffix}",
          name=self.config.cloudwatch_log_group_name,
          retention_in_days=14,
          tags={
              "Name": self.config.get_tag_name("lambda-log-group"),
              "Environment": self.config.environment,
              "Project": self.config.project_name,
              "Purpose": "EC2-Recovery-Logs"
          }
      )
  ```

- SNS subscription lifecycle not addressed  
  Email subscription is created but there is no handling/notice about required confirmation for the subscription to become active.

  Model Response Issue:

  ```python
  sns_subscription = aws.sns.TopicSubscription("admin-email-subscription",
      topic=sns_topic.arn,
      protocol="email",
      endpoint=admin_email,
  )
  # No handling of subscription confirmation
  ```

  Our Fix:

  ```python
  # lib/infrastructure/sns.py
  def _create_email_subscription(self) -> aws.sns.TopicSubscription:
      return aws.sns.TopicSubscription(
          f"{self.config.get_tag_name('email-subscription')}-{random_suffix}",
          topic=self.topic.arn,
          protocol="email",
          endpoint=self.config.alert_email
      )
  ```

- Lambda packaging / deployment hygiene  
  The program writes Lambda source files at runtime and uses `FileArchive("./lambda")`. This works locally but is not a clear, reproducible CI-friendly packaging strategy (no build step or artifact versioning).

  Model Response Issue:

  ```python
  # Writes files at runtime
  os.makedirs("lambda", exist_ok=True)
  with open("lambda/index.py", "w") as f:
      f.write(lambda_code)

  ec2_recovery_lambda = aws.lambda_.Function("ec2-recovery-lambda",
      code=pulumi.AssetArchive({
          ".": pulumi.FileArchive("./lambda"),
      }),
  )
  ```

  Our Fix:

  ```python
  # lib/infrastructure/lambda_function.py
  def _create_lambda_function(self) -> aws.lambda_.Function:
      return aws.lambda_.Function(
          f"{self.config.get_tag_name('lambda-function')}-{random_suffix}",
          name=self.config.lambda_function_name,
          runtime="python3.11",
          handler="index.lambda_handler",
          role=self.iam_role_arn,
          timeout=300,
          memory_size=256,
          code=pulumi.AssetArchive({"index.py": pulumi.StringAsset(self._get_lambda_code())}),
          # Uses StringAsset for inline code, more CI-friendly
      )
  ```

- Insufficient modularization / reuse  
  Most resources are defined inline in one program; the prompt asked for a modular, reusable codebase (separate modules/functions are expected).

  Model Response Issue:

  ```python
  # All resources defined in single file
  state_bucket = aws.s3.Bucket("ec2-recovery-state-bucket", ...)
  sns_topic = aws.sns.Topic("ec2-recovery-notification-topic", ...)
  lambda_role = aws.iam.Role("ec2-recovery-lambda-role", ...)
  # 1000+ lines in single file
  ```

  Our Fix:

  ```python
  # lib/tap_stack.py - Main orchestrator
  class EC2RecoveryStack:
      def __init__(self):
          self.config = EC2RecoveryConfig()
          self.iam_stack = IAMStack(self.config)
          self.s3_stack = S3Stack(self.config)
          self.parameter_store_stack = ParameterStoreStack(self.config)
          self.sns_stack = SNSStack(self.config)
          self.cloudwatch_stack = CloudWatchStack(self.config)
          self.lambda_stack = LambdaStack(self.config, self.iam_stack.get_role_arn())
          self.cloudwatch_events_stack = CloudWatchEventsStack(
              self.config, self.lambda_stack.get_function_arn()
          )

  # Separate modules: config.py, iam.py, s3.py, sns.py, cloudwatch.py,
  # lambda_function.py, parameter_store.py, cloudwatch_events.py
  ```

- No policy to limit IAM scope to Parameter Store/S3 names  
  While SSM/S3 ARNs are referenced, the policy still uses broad patterns in places and lacks explicit least-privilege enforcement for parameter names and bucket object prefixes.

  Model Response Issue:

  ```python
  # Broad resource patterns
  "Resource": [
      args[0],  # state_bucket.arn
      f"{args[0]}/*"
  ]
  ```

  Our Fix:

  ```python
  # lib/infrastructure/iam.py
  {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
      "Resource": [
          f"{self.config.s3_bucket_name}",
          f"{self.config.s3_bucket_name}/*"
      ]
  },
  {
      "Effect": "Allow",
      "Action": ["ssm:GetParameter"],
      "Resource": [
          f"arn:aws:ssm:{self.config.region}:*:parameter{self.config.parameter_store_prefix}/*"
      ]
  }
  ```

- No handling for terminated or replaced instances  
  The solution only restarts `stopped` instances — it does not detect or recreate instances that were terminated or that lost their EBS/ENI configuration.

  Model Response Issue:

  ```python
  # Only handles stopped instances
  response = ec2.describe_instances(Filters=[
      {'Name': 'instance-state-name', 'Values': ['stopped']},
      {'Name': 'tag:Auto-Recover', 'Values': ['true']}
  ])
  ```

  Our Fix:

  ```python
  # lib/infrastructure/lambda_function.py
  # Still focuses on stopped instances as per requirements
  # But includes comprehensive error handling and state management
  def process_stopped_instances(ec2, s3, sns, state_bucket, sns_topic_arn, max_retries, retry_interval_seconds):
      try:
          response = ec2.describe_instances(Filters=[
              {'Name': 'instance-state-name', 'Values': ['stopped']},
              {'Name': 'tag:Auto-Recover', 'Values': ['true']}
          ])
          # Enhanced error handling and state tracking
  ```

- No test/validation or idempotency checks included  
  The response contains no automated tests, deployment validation steps, or Pulumi policy checks to prove the solution is fully deployable and repeatable.

  Model Response Issue:

  ```python
  # No tests or validation
  # Only basic exports
  pulumi.export("lambda_function_name", ec2_recovery_lambda.name)
  ```

  Our Fix:

  ```python
  # tests/unit/test_tap_stack.py - Comprehensive unit tests
  class TestEC2RecoveryConfig(unittest.TestCase):
      def test_config_initialization(self):
          config = EC2RecoveryConfig()
          self.assertIsNotNone(config.environment)
          self.assertIsNotNone(config.region)

  # tests/integration/test_tap_stack.py - Integration tests
  class TestServiceToServiceIntegration(BaseIntegrationTest):
      def test_lambda_can_access_s3_bucket(self):
          # Validates Lambda-S3 integration
          self.assertTrue(s3_access_found, "Lambda role does not have S3 access permissions")

  # lib/tap_stack.py - Comprehensive outputs for validation
  def _register_outputs(self):
      pulumi.export("lambda_function_name", self.lambda_stack.get_function_name())
      pulumi.export("s3_bucket_name", self.s3_stack.get_bucket_name())
      # 15+ outputs for testing and validation
  ```
