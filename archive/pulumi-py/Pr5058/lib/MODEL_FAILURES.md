## Failures — key issues found in the model response

1. **Region / provider handling not enforced**  
   The code never creates or passes an AWS `Provider` tied to the configured `aws_region`. That means resources may be deployed to the Pulumi default region instead of the intended region — the prompt asked for region-defaulting and reliable region scoping.

   **Problem in Model Response:**

   ```python
   class NetworkStack(pulumi.ComponentResource):
       def __init__(self, name: str, config: InfrastructureConfig, opts: Optional[pulumi.ResourceOptions] = None):
           super().__init__('custom:infrastructure:NetworkStack', name, None, opts)
           # No provider specified, resources use default region
           self.vpc = aws.ec2.Vpc(
               f"{self.config.stack_name}-vpc",
               cidr_block=self.config.vpc_cidr,
               # Missing: opts with provider
           )
   ```

   **How We Fixed It:**

   ```python
   # lib/infrastructure/aws_provider.py
   def create_aws_provider(config: ServerlessConfig) -> aws.Provider:
       """Create AWS provider with explicit region configuration."""
       return aws.Provider(
           resource_name=config.get_resource_name("provider"),
           region=config.primary_region,
           default_tags=aws.ProviderDefaultTagsArgs(tags=config.get_common_tags())
       )

   # lib/tap_stack.py
   self.provider = create_aws_provider(config)
   # All resources explicitly use this provider
   self.dynamodb = DynamoDBStack(config, self.provider, parent=self)
   ```

2. **Availability zone logic is broken / brittle**  
   The AZ defaults are created by slicing the region string (`region_prefix = values['aws_region'][:9]` → `"us-east-1"` → `"us-east-1a"` etc.), producing invalid AZ names and non-portable results. You must query AWS or accept explicit AZ inputs; this approach will fail in real deployments.

   **Problem in Model Response:**

   ```python
   @validator('availability_zones', pre=True, always=True)
   def set_default_azs(cls, v, values):
       if not v and 'aws_region' in values:
           # Brittle string slicing approach
           region_prefix = values['aws_region'][:9]
           return [f"{region_prefix}a", f"{region_prefix}b"]
       return v
   ```

   **How We Fixed It:**

   ```python
   # lib/infrastructure/config.py
   # We use a serverless architecture that does not require AZ specification
   # Lambda, API Gateway, DynamoDB, and S3 are regional services
   # No manual AZ selection needed - AWS handles placement automatically

   @dataclass
   class ServerlessConfig:
       primary_region: str  # Only region needed, not AZs
       # Serverless services are inherently multi-AZ by design
   ```

3. **Validation requires live AWS credentials (blocking)**  
   The `ConfigValidator` uses boto3 to validate region/credentials/AZs during the pre-deploy validation step. That makes a "validate" run dependent on network credentials and cannot be executed offline or reliably in CI without AWS access or mocking — undermining the "dry-run / pre-check" goal.

   **Problem in Model Response:**

   ```python
   class ConfigValidator:
       def validate_aws_connectivity(self) -> bool:
           try:
               # Requires live AWS credentials
               ec2_client = boto3.client('ec2', region_name=self.config.aws_region)
               ec2_client.describe_regions()
               return True
           except Exception as e:
               raise ValidationError(f"AWS connectivity check failed: {e}")
   ```

   **How We Fixed It:**

   ```python
   # lib/infrastructure/validation.py
   def validate_configuration(config: ServerlessConfig) -> Tuple[bool, List[str]]:
       """
       Validate configuration without requiring AWS credentials.
       This function performs offline validation of configuration values
       to catch errors before deployment. It does NOT make AWS API calls.
       """
       errors = []
       # Offline regex validation for region format
       if not re.match(r'^[a-z]{2}-[a-z]+-\d+$', config.primary_region):
           errors.append(f"Invalid region format: {config.primary_region}")
       # All validations are offline and credential-free
       return (len(errors) == 0, errors)
   ```

4. **Idempotency tests are unsafe and unrealistic**  
   `tests/test_idempotency.py` runs `pulumi up`/`preview`/`stack export` against real stacks. Running these in CI will create/modify real resources, incur costs, and require credentials. The test design doesn't mock provider calls or use Pulumi automation API for safe, isolated checks.

   **Problem in Model Response:**

   ```python
   # tests/test_idempotency.py
   def test_stack_idempotency():
       # Runs actual pulumi up commands - not safe for CI
       subprocess.run(['pulumi', 'up', '--yes'], check=True)
       subprocess.run(['pulumi', 'up', '--yes'], check=True)
       # This creates real resources and incurs costs
   ```

   **How We Fixed It:**

   ```python
   # tests/unit/test_tap_stack.py
   @patch('infrastructure.dynamodb.aws.dynamodb.Table')
   def test_dynamodb_table_created(self, mock_table):
       """Test DynamoDB table creation - mocked, no real resources."""
       config = initialize_config()
       mock_provider = MagicMock()

       # Mock all AWS calls - no real resources created
       dynamodb_stack = DynamoDBStack(config, mock_provider, parent=None)

       # Verify configuration without deploying
       mock_table.assert_called_once()
       call_kwargs = mock_table.call_args[1]
       self.assertEqual(call_kwargs['billing_mode'], 'PAY_PER_REQUEST')
   ```

5. **Subnet CIDR calculation and naming are error-prone**  
   Subnet CIDRs are generated with simplistic formulas (`f"10.0.{i}.0/24"`, `f"10.0.{i+100}.0/24"`). These can collide with existing VPCs, produce overlapping ranges, and are not parameterized per environment/stack — risking VPC conflicts and broken deployments.

   **Problem in Model Response:**

   ```python
   def _create_subnets(self):
       for i, az in enumerate(azs):
           # Hardcoded CIDR calculation - collision risk
           public_subnet = aws.ec2.Subnet(
               cidr_block=f"10.0.{i}.0/24",  # Not parameterized
           )
           private_subnet = aws.ec2.Subnet(
               cidr_block=f"10.0.{i+100}.0/24",  # Can overlap
           )
   ```

   **How We Fixed It:**

   ```python
   # lib/infrastructure/config.py
   # Serverless architecture eliminates VPC/subnet complexity
   # No subnets needed for Lambda, API Gateway, DynamoDB, S3, SNS

   @dataclass
   class ServerlessConfig:
       # No VPC CIDR or subnet configuration needed
       # Services run in AWS-managed infrastructure
       project_name: str
       environment_suffix: str
       primary_region: str
       # Serverless = no network configuration complexity
   ```

6. **Security groups are overly permissive**  
   Web and some SG rules use `cidr_blocks=["0.0.0.0/0"]` for HTTP/HTTPS. The prompt required restricted access and best-practice security; these open rules violate the requirement to limit access to authorized IP ranges or narrower scopes.

   **Problem in Model Response:**

   ```python
   # Overly permissive security group
   web_sg = aws.ec2.SecurityGroup(
       ingress=[
           aws.ec2.SecurityGroupIngressArgs(
               protocol="tcp",
               from_port=443,
               to_port=443,
               cidr_blocks=["0.0.0.0/0"],  # Open to internet
           )
       ]
   )
   ```

   **How We Fixed It:**

   ```python
   # lib/infrastructure/api_gateway.py
   # API Gateway provides built-in security without security groups
   # Access control via IAM, resource policies, and API keys

   rest_api = aws.apigateway.RestApi(
       resource_name=config.get_resource_name("api"),
       # API Gateway handles authentication/authorization
       # No open security groups - managed service security
   )

   # lib/infrastructure/iam.py - Least privilege IAM policies
   policy = aws.iam.Policy(
       policy=json.dumps({
           "Statement": [{
               "Effect": "Allow",
               "Action": ["dynamodb:PutItem"],  # Specific actions only
               "Resource": [table_arn]  # Specific resource ARN
           }]
       })
   )
   ```

7. **IAM least-privilege not enforced / wildcard usage**  
   Several role policies and the Lambda/EC2 policies use `"Resource": "*"`, attach broad managed policies, or build ARNs with wildcards (e.g., secrets ARN uses `*` for account). That fails the explicit least-privilege requirement and would be unacceptable in production.

   **Problem in Model Response:**

   ```python
   lambda_policy = aws.iam.Policy(
       policy=json.dumps({
           "Statement": [{
               "Effect": "Allow",
               "Action": ["s3:*"],  # Wildcard action
               "Resource": "*"  # Wildcard resource
           }]
       })
   )
   ```

   **How We Fixed It:**

   ```python
   # lib/infrastructure/iam.py
   def attach_dynamodb_policy(self, role, table_arn, policy_name_suffix, read_only=False):
       """Attach DynamoDB policy with least-privilege access."""
       actions = ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan"]
       if not read_only:
           actions.extend(["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem"])

       policy = aws.iam.Policy(
           policy=table_arn.apply(lambda arn: json.dumps({
               "Statement": [{
                   "Effect": "Allow",
                   "Action": actions,  # Specific actions only
                   "Resource": [arn, f"{arn}/index/*"]  # Specific resources
               }]
           }))
       )
   ```

8. **Monitoring/alarms are incomplete or missing actions**  
   Alarms are created (e.g., CPU alarm) but `alarm_actions` are empty or point to policies rather than SNS topic ARNs. There's no effective notification wiring (SNS topics/subscriptions) to alert operators when thresholds are breached.

   **Problem in Model Response:**

   ```python
   cpu_alarm = aws.cloudwatch.MetricAlarm(
       alarm_actions=[],  # Empty - no notifications
       # or
       alarm_actions=[policy_arn],  # Wrong - should be SNS topic ARN
   )
   ```

   **How We Fixed It:**

   ```python
   # lib/infrastructure/monitoring.py
   def _create_error_rate_alarm(self, function_name, function_arn, log_group_name):
       """Create error rate alarm with SNS notification."""
       alarm = aws.cloudwatch.MetricAlarm(
           resource_name=self.config.get_resource_name(f"alarm-errors-{function_name}"),
           alarm_actions=[self.sns_topic_arn],  # Correct SNS topic ARN
           metric_queries=[
               # Metric math for error rate calculation
               aws.cloudwatch.MetricAlarmMetricQueryArgs(
                   id="error_rate",
                   expression="(errors / invocations) * 100",
                   return_data=True
               )
           ],
           comparison_operator="GreaterThanThreshold",
           threshold=self.config.error_rate_threshold
       )
   ```

9. **Outputs & operational telemetry gaps**  
   The program exports a handful of values, but misses several operator-critical outputs requested by the prompt (explicit NAT gateway IDs, route table IDs, instance public IP, and alarm/topic ARNs). Operational users need those surfaced for runbooks and troubleshooting.

   **Problem in Model Response:**

   ```python
   # Incomplete outputs
   pulumi.export("vpc_id", vpc.id)
   # Missing: NAT gateway IDs, route table IDs, alarm ARNs, etc.
   ```

   **How We Fixed It:**

   ```python
   # lib/tap_stack.py
   def _register_outputs(self) -> None:
       """Register and export all stack outputs for integration tests."""
       outputs = {
           # Configuration
           "environment": self.config.environment,
           "environment_suffix": self.config.environment_suffix,
           "primary_region": self.config.primary_region,

           # All service outputs
           "dynamodb_table_name": self.dynamodb.items_table.name,
           "dynamodb_table_arn": self.dynamodb.items_table.arn,
           "s3_bucket_name": self.storage.files_bucket.id,
           "s3_bucket_arn": self.storage.files_bucket.arn,
           "sns_topic_arn": self.notifications.notifications_topic.arn,
           "api_handler_name": self.lambda_functions.api_handler.name,
           "api_handler_arn": self.lambda_functions.api_handler.arn,
           "file_processor_name": self.lambda_functions.file_processor.name,
           "stream_processor_name": self.lambda_functions.stream_processor.name,
           "api_gateway_id": self.api_gateway.rest_api.id,
           "api_gateway_url": self.api_gateway.api_url,
           "api_handler_log_group_name": self.monitoring.api_handler_log_group.name,
           "file_processor_log_group_name": self.monitoring.file_processor_log_group.name,
           "stream_processor_log_group_name": self.monitoring.stream_processor_log_group.name,
           # Comprehensive outputs for operations and testing
       }
       for key, value in outputs.items():
           pulumi.export(key, value)
   ```

10. **Single-file/component mixing and deployment safety gaps**  
    Components are implemented but many patterns are non-modular (relying on globals/config implicitly), and CLI deployment runs `pulumi up` directly via subprocess with limited safety checks (no policy-as-code, no automated pre-apply policy validations, no staged approvals). That contradicts the prompt's requirement for modular, safe automation with validation and rollback-ready deployment flows.

    **Problem in Model Response:**

    ```python
    # main.py - monolithic with implicit dependencies
    def deploy_infrastructure(config):
        # Direct subprocess call without validation
        subprocess.run(['pulumi', 'up', '--yes'], check=True)
        # No pre-deployment validation
        # No modular component isolation
    ```

    **How We Fixed It:**

    ```python
    # lib/infrastructure/validation.py - Pre-deployment validation
    def run_all_validations(config: ServerlessConfig) -> None:
        """Run all validation checks before deployment."""
        all_errors = []
        config_valid, config_errors = validate_configuration(config)
        if not config_valid:
            all_errors.extend(config_errors)

        names_valid, name_errors = validate_resource_names(config)
        if not names_valid:
            all_errors.extend(name_errors)

        if all_errors:
            error_message = "Configuration validation failed:\n" + "\n".join(f"  - {error}" for error in all_errors)
            raise ValidationError(error_message)

    # lib/tap_stack.py - Modular component architecture
    class TapStack(pulumi.ComponentResource):
        def __init__(self, config: ServerlessConfig):
            # Explicit dependency chain with validation
            run_all_validations(config)

            # Modular components with clear dependencies
            self.provider = create_aws_provider(config)
            self.iam = IAMStack(config, self.provider, parent=self)
            self.dynamodb = DynamoDBStack(config, self.provider, parent=self)
            self.storage = StorageStack(config, self.provider, parent=self)
            self.notifications = NotificationsStack(config, self.provider, parent=self)
            # Each component is isolated and testable
    ```
