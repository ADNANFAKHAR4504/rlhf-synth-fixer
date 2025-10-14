# Failures

- Region enforcement missing  
  Previous Code :

  ```python
  # Provider created but not passed to resources
  aws_provider = aws.Provider("aws", region=AWS_REGION)

  # Resources created without provider
  vpc = aws.ec2.Vpc(f"{app_name}-vpc", ...)
  logs_bucket = aws.s3.Bucket(f"{app_name}-logs", ...)
  ```

  Fixed Code (aws_provider.py):

  ```python
  class AWSProviderStack:
      def _create_aws_provider(self) -> aws.Provider:
          return aws.Provider(
              f"aws-provider-{timestamp}-{random_suffix}",
              region=self.config.region
          )

  # All resources now use provider
  return aws.s3.Bucket(
      "logs-bucket",
      bucket=self.config.s3_bucket_name,
      opts=pulumi.ResourceOptions(provider=self.provider)
  )
  ```

- S3 public-access block used incorrectly  
  Previous Code :

  ```python
  # Invalid - these args don't exist on Bucket
  logs_bucket = aws.s3.Bucket(
      f"{app_name}-logs",
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      ...
  )
  ```

  Fixed Code (s3.py):

  ```python
  def _create_public_access_block(self) -> aws.s3.BucketPublicAccessBlock:
      return aws.s3.BucketPublicAccessBlock(
          "logs-bucket-pab",
          bucket=self.bucket.id,
          block_public_acls=True,
          block_public_policy=True,
          ignore_public_acls=True,
          restrict_public_buckets=True,
          opts=pulumi.ResourceOptions(provider=self.provider)
      )
  ```

- S3 bucket name uniqueness risk  
  Previous Code :

  ```python
  # Static naming - collision risk
  logs_bucket = aws.s3.Bucket(f"{app_name}-logs", ...)
  ```

  Fixed Code (config.py):

  ```python
  # Unique naming with environment + region + environment
  self.s3_bucket_name = f"{project_name_normalized}-{app_name_normalized}-logs-{environment_normalized}-{region_normalized}-{environment_normalized}"
  # Result: web-app-webapp-logs-dev-uswest2-dev
  ```

- IAM least-privilege claim is weak / incomplete  
  Previous Code :

  ```python
  # Basic S3 policy only
  ec2_s3_policy = aws.iam.Policy(
      f"{app_name}-ec2-s3-policy",
      policy=pulumi.Output.all(bucket_name=f"{app_name}-logs").apply(
          lambda args: json.dumps({
              "Version": "2012-10-17",
              "Statement": [{
                  "Effect": "Allow",
                  "Action": ["s3:PutObject", "s3:GetObject"],
                  "Resource": [f"arn:aws:s3:::{args['bucket_name']}/*"]
              }]
          })
      )
  )
  ```

  Fixed Code (iam.py):

  ```python
  def _create_s3_policy(self, bucket_name: pulumi.Output[str]) -> aws.iam.Policy:
      return aws.iam.Policy(
          "ec2-s3-policy",
          name=f"{self.config.get_tag_name('s3-policy')}",
          description="Least privilege S3 access for application logs",
          policy=bucket_name.apply(
              lambda name: {
                  "Version": "2012-10-17",
                  "Statement": [{
                      "Effect": "Allow",
                      "Action": ["s3:PutObject", "s3:PutObjectAcl"],
                      "Resource": f"arn:aws:s3:::{name}/logs/*"
                  }, {
                      "Effect": "Allow",
                      "Action": ["s3:ListBucket"],
                      "Resource": f"arn:aws:s3:::{name}"
                  }]
              }
          ),
          tags=self.config.get_common_tags(),
          opts=pulumi.ResourceOptions(provider=self.provider)
      )

  def _create_cloudwatch_policy(self) -> aws.iam.Policy:
      return aws.iam.Policy(
          "ec2-cloudwatch-policy",
          name=f"{self.config.get_tag_name('cloudwatch-policy')}",
          description="CloudWatch logs access for EC2 instances",
          policy=pulumi.Output.from_input({
              "Version": "2012-10-17",
              "Statement": [{
                  "Effect": "Allow",
                  "Action": [
                      "logs:CreateLogGroup",
                      "logs:CreateLogStream",
                      "logs:PutLogEvents",
                      "logs:DescribeLogStreams"
                  ],
                  "Resource": f"arn:aws:logs:{self.config.region}:*:log-group:{self.config.log_group_name}*"
              }]
          }),
          tags=self.config.get_common_tags(),
          opts=pulumi.ResourceOptions(provider=self.provider)
      )
  ```

- Provider not applied to modules/resources  
  Previous Code :

  ```python
  # Modules don't accept or use provider
  def create_vpc():
      return aws.ec2.Vpc(...)  # No provider passed
  ```

  Fixed Code (All modules):

  ```python
  class S3Stack:
      def __init__(self, config: WebAppConfig, provider: aws.Provider):
          self.provider = provider
          # All resources use provider
          return aws.s3.Bucket(
              "logs-bucket",
              opts=pulumi.ResourceOptions(provider=self.provider)
          )
  ```

- LaunchTemplate user_data handling ambiguous  
  Previous Code :

  ```python
  # Manual base64 encoding - potential double encoding
  user_data=pulumi.Output.from_input(user_data).apply(
      lambda ud: ud.encode("utf-8").encode("base64").decode("utf-8")
  ),
  ```

  Fixed Code (ec2.py):

  ```python
  def _create_launch_template(self) -> aws.ec2.LaunchTemplate:
      return aws.ec2.LaunchTemplate(
          "launch-template",
          name=self.config.launch_template_name,
          image_id=self.ami_id,
          instance_type=self.config.instance_type,
          vpc_security_group_ids=[self.security_group_id],
          iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
              name=self.config.iam_role_name
          ),
          user_data=self.user_data,  # Plain text - Pulumi handles encoding
          tag_specifications=[
              aws.ec2.LaunchTemplateTagSpecificationArgs(
                  resource_type="instance",
                  tags=self.config.get_common_tags()
              )
          ],
          tags=self.config.get_common_tags(),
          opts=pulumi.ResourceOptions(provider=self.provider)
      )
  ```

- ASG tag propagation duplication/ambiguity  
  Previous Code :

  ```python
  # Duplicate tags - Name tag added twice
  tags=[
      aws.autoscaling.GroupTagArgs(
          key="Name",
          value=f"{app_name}-instance",
          propagate_at_launch=True
      ),
      *[
          aws.autoscaling.GroupTagArgs(
              key=k,
              value=v,
              propagate_at_launch=True
          ) for k, v in common_tags.items()  # common_tags also has "Name"
      ]
  ]
  ```

  Fixed Code (autoscaling.py):

  ```python
  def _create_auto_scaling_group(self, launch_template_id: pulumi.Output[str]) -> aws.autoscaling.Group:
      return aws.autoscaling.Group(
          "auto-scaling-group",
          name=self.config.asg_name,
          launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
              id=launch_template_id,
              version="$Latest"
          ),
          min_size=self.config.min_size,
          max_size=self.config.max_size,
          desired_capacity=self.config.desired_capacity,
          vpc_zone_identifiers=[self.subnet1.id, self.subnet2.id],
          target_group_arns=[self.target_group.arn],
          health_check_type="ELB",
          health_check_grace_period=300,
          tags=[
              aws.autoscaling.GroupTagArgs(
                  key=k,
                  value=v,
                  propagate_at_launch=True
              ) for k, v in self.config.get_common_tags().items()
          ],
          opts=pulumi.ResourceOptions(provider=self.provider)
      )
  ```

- No explicit CloudWatch LogGroup/retention for instances  
  Previous Code :

  ```python
  # No CloudWatch LogGroup created
  # Only basic CloudWatch alarms for scaling
  ```

  Fixed Code (cloudwatch.py):

  ```python
  class CloudWatchStack:
      def _create_log_group(self) -> aws.cloudwatch.LogGroup:
          return aws.cloudwatch.LogGroup(
              "webapp-log-group",
              name=self.config.log_group_name,
              retention_in_days=self.config.log_retention_days,
              tags=self.config.get_common_tags(),
              opts=pulumi.ResourceOptions(provider=self.provider)
          )

      def _create_log_stream(self) -> aws.cloudwatch.LogStream:
          return aws.cloudwatch.LogStream(
              "webapp-log-stream",
              name="main-stream",
              log_group_name=self.log_group.name,
              opts=pulumi.ResourceOptions(provider=self.provider)
          )
  ```

- Resource naming/ID usage inconsistencies  
  Previous Code :

  ```python
  # Inconsistent usage of .id vs .arn vs .name
  pulumi.export("logs_bucket_name", logs_bucket.id)  # Should be .bucket
  pulumi.export("logs_bucket_arn", logs_bucket.arn)
  ```

  Fixed Code (All modules):

  ```python
  # Consistent getter methods
  def get_bucket_name(self) -> pulumi.Output[str]:
      return self.bucket.id

  def get_bucket_arn(self) -> pulumi.Output[str]:
      return self.bucket.arn

  # Consistent usage in exports
  pulumi.export("s3_bucket_name", s3_stack.get_bucket_name())
  pulumi.export("s3_bucket_arn", s3_stack.get_bucket_arn())
  ```

- Modularity mismatch  
  Previous Code :

  ```python
  # Global constants, no parameter passing
  app_name = config.get("appName") or "web-app"
  env = config.get("environment") or "dev"

  # Modules use global variables
  def create_vpc():
      return aws.ec2.Vpc(f"{app_name}-vpc", ...)
  ```

  Fixed Code (All modules):

  ```python
  # Centralized configuration class
  class WebAppConfig:
      def __init__(self):
          self.environment = os.getenv('ENVIRONMENT', 'dev')
          self.region = os.getenv('AWS_REGION', 'us-west-2')
          self.project_name = os.getenv('PROJECT_NAME', 'web-app')
          # ... centralized naming and configuration

  # All modules accept explicit parameters
  class S3Stack:
      def __init__(self, config: WebAppConfig, provider: aws.Provider):
          self.config = config
          self.provider = provider
          # All resources use self.config and self.provider
  ```
