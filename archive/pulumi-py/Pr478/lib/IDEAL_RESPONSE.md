# Infrastructure as Code - Pulumi Python Implementation

## __init__.py

```python

```

## components/__init__.py

```python

```

## components/elastic_beanstalk.py

```python
"""
Elastic Beanstalk Infrastructure Component
Handles application deployment, auto-scaling, and load balancing
"""

from typing import Optional, List
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import random
import string

class ElasticBeanstalkInfrastructure(pulumi.ComponentResource):
  def __init__(
    self,
    name: str,
    region: str,
    is_primary: bool,
    environment: str,
    environment_suffix: str,
    vpc_id: Output[str],
    public_subnet_ids: List[Output[str]],
    private_subnet_ids: List[Output[str]],
    eb_service_role_arn: Output[str],
    eb_instance_profile_name: Output[str],
    alb_security_group_id: Output[str],
    eb_security_group_id: Output[str],
    tags: dict,
    opts: Optional[ResourceOptions] = None
  ):
    super().__init__('nova:infrastructure:ElasticBeanstalk', name, None, opts)

    self.region = region
    self.is_primary = is_primary
    self.environment = environment
    self.vpc_id = vpc_id
    self.public_subnet_ids = public_subnet_ids
    self.private_subnet_ids = private_subnet_ids
    self.eb_service_role_arn = eb_service_role_arn
    self.eb_instance_profile_name = eb_instance_profile_name
    self.alb_security_group_id = alb_security_group_id
    self.eb_security_group_id = eb_security_group_id
    self.tags = tags
    self.region_suffix = region.replace('-', '').replace('gov', '')
    self.environment_suffix = f"{environment_suffix}-{self._random_suffix()}"

    self._create_application()
    self._create_configuration_template()
    self._create_environment()

    self.register_outputs({
      'application_name': self.application.name,
      'environment_name': self.eb_environment.name,
      'environment_url': self.eb_environment.endpoint_url,
      'environment_cname': self.eb_environment.cname
    })

  def _random_suffix(self, length: int = 6) -> str:
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

  def _create_application(self):
    self.application = aws.elasticbeanstalk.Application(
      f"eb-app-{self.region_suffix}",
      name=f"nova-app-{self.region_suffix}",
      description=f"Nova Web Application - {self.region_suffix.title()} Region",
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

  def _create_configuration_template(self):
    # Helper function to join a list of Output[str] into a comma-separated string
    def create_subnet_setting(namespace: str, name: str, subnet_outputs: List[Output[str]]):
      subnets_output = Output.all(*subnet_outputs).apply(lambda s: ','.join(s))
      return subnets_output.apply(
        lambda subnets: aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
          namespace=namespace,
          name=name,
          value=subnets
        )
      )

    # Helper function for ServiceRole
    def create_role_setting(role_output: Output[str]):
      return role_output.apply(
        lambda role_arn: aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
          namespace="aws:elasticbeanstalk:environment",
          name="ServiceRole",
          value=role_arn
        )
      )

    # Helper function for IamInstanceProfile
    def create_instance_profile_setting(profile_output: Output[str]):
      return profile_output.apply(
        lambda profile_name: aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
          namespace="aws:autoscaling:launchconfiguration",
          name="IamInstanceProfile",
          value=profile_name
        )
      )

    # New helper function for SecurityGroups
    def create_security_group_setting(namespace: str, name: str, sg_id_output: Output[str]):
      return sg_id_output.apply(
        lambda sg_id: aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
          namespace=namespace,
          name=name,
          value=sg_id
        )
      )

    # Dynamic settings that depend on Outputs from other resources
    vpc_setting = self.vpc_id.apply(
      lambda vpc_id: aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:ec2:vpc",
        name="VPCId",
        value=vpc_id
      )
    )
    
    # Elastic Beanstalk instances should be placed in private subnets
    instance_subnet_setting = create_subnet_setting("aws:ec2:vpc", "Subnets", self.private_subnet_ids)
    
    # The Application Load Balancer should be placed in public subnets
    elb_subnet_setting = create_subnet_setting("aws:ec2:vpc", "ELBSubnets", self.public_subnet_ids)
    
    service_role_setting = create_role_setting(self.eb_service_role_arn)
    instance_profile_setting = create_instance_profile_setting(self.eb_instance_profile_name)

    # Security Group settings for instances and ALB
    # For EC2 instances managed by Elastic Beanstalk
    instance_sg_setting = create_security_group_setting(
      "aws:autoscaling:launchconfiguration",
      "SecurityGroups",
      self.eb_security_group_id
    )
    # For the Application Load Balancer (using the elbv2 namespace)
    alb_sg_setting = create_security_group_setting(
      "aws:elbv2:loadbalancer",
      "SecurityGroups",
      self.alb_security_group_id
    )

    # Static settings that do not depend on outputs
    static_settings = [
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:ec2:vpc",
        name="AssociatePublicIpAddress",
        value="false"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:elasticbeanstalk:environment",
        name="LoadBalancerType",
        value="application"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:elasticbeanstalk:environment",
        name="EnvironmentType",
        value="LoadBalanced"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:autoscaling:asg",
        name="MinSize",
        value="2"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:autoscaling:asg",
        name="MaxSize",
        value="10"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:autoscaling:trigger",
        name="MeasureName",
        value="CPUUtilization"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:autoscaling:trigger",
        name="Statistic",
        value="Average"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:autoscaling:trigger",
        name="Unit",
        value="Percent"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:autoscaling:trigger",
        name="LowerThreshold",
        value="20"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:autoscaling:trigger",
        name="UpperThreshold",
        value="70"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:autoscaling:trigger",
        name="Period",
        value="5"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:autoscaling:trigger",
        name="EvaluationPeriods",
        value="1"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:autoscaling:launchconfiguration",
        name="InstanceType",
        value="t3.medium"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:autoscaling:launchconfiguration",
        name="RootVolumeType",
        value="gp3"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:autoscaling:launchconfiguration",
        name="RootVolumeSize",
        value="20"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:elasticbeanstalk:healthreporting:system",
        name="SystemType",
        value="enhanced"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:elasticbeanstalk:healthreporting:system",
        name="HealthCheckSuccessThreshold",
        value="Ok"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:elasticbeanstalk:command",
        name="DeploymentPolicy",
        value="RollingWithAdditionalBatch"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:elasticbeanstalk:command",
        name="BatchSizeType",
        value="Fixed"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:elasticbeanstalk:command",
        name="BatchSize",
        value="2"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:autoscaling:updatepolicy:rollingupdate",
        name="RollingUpdateEnabled",
        value="true"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:autoscaling:updatepolicy:rollingupdate",
        name="MaxBatchSize",
        value="2"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:autoscaling:updatepolicy:rollingupdate",
        name="MinInstancesInService",
        value="1"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:autoscaling:updatepolicy:rollingupdate",
        name="RollingUpdateType",
        value="Health"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:elasticbeanstalk:application:environment",
        name="NODE_ENV",
        value="production"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:elasticbeanstalk:application:environment",
        name="ENVIRONMENT",
        value=self.environment
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:elasticbeanstalk:application:environment",
        name="REGION",
        value=self.region
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:elasticbeanstalk:cloudwatch:logs",
        name="StreamLogs",
        value="true"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:elasticbeanstalk:cloudwatch:logs",
        name="DeleteOnTerminate",
        value="false"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:elasticbeanstalk:cloudwatch:logs",
        name="RetentionInDays",
        value="30"
      ),
    ]

    # Combine all dynamic and static settings
    all_settings = Output.all(
      vpc_setting,
      instance_subnet_setting,
      elb_subnet_setting,
      service_role_setting,
      instance_profile_setting,
      instance_sg_setting,
      alb_sg_setting
    ).apply(lambda dynamic_settings: dynamic_settings + static_settings)

    # FIX: Add a random suffix to the template name to force a new template to be created on every change.
    template_name = pulumi.Output.concat(f"nova-config-{self.region_suffix}-{self._random_suffix()}")

    self.config_template = aws.elasticbeanstalk.ConfigurationTemplate(
      f"eb-config-template-{self.region_suffix}",
      name=template_name,
      application=self.application.name,
      solution_stack_name="64bit Amazon Linux 2023 v6.6.2 running Node.js 18",
      settings=all_settings,
      # FIX: This option is now redundant, but kept for clarity.
      opts=ResourceOptions(parent=self, delete_before_replace=True)
    )

  def _create_environment(self):
    self.eb_environment = aws.elasticbeanstalk.Environment(
      f"eb-env-{self.region_suffix}",
      name=f"nova-env-{self.region_suffix}-{self.environment_suffix}",
      application=self.application.name,
      template_name=self.config_template.name,
      tier="WebServer",
      tags=self.tags,
      # This option is still needed to break the dependency cycle with the subnets.
      opts=ResourceOptions(parent=self, delete_before_replace=True)
    )

  @property
  def application_name(self):
    return self.application.name

  @property
  def environment_name(self):
    return self.eb_environment.name

  @property
  def environment_url(self):
    return self.eb_environment.endpoint_url

  @property
  def environment_cname(self):
    return self.eb_environment.cname
```

## components/identity.py

```python
"""
Identity and Access Management Infrastructure Component
Handles IAM roles, policies, and instance profiles for AWS Elastic Beanstalk
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
import json

class IdentityInfrastructure(pulumi.ComponentResource):
  def __init__(self, 
               name: str,
               tags: dict,
               opts: Optional[ResourceOptions] = None):
    super().__init__('nova:infrastructure:Identity', name, None, opts)

    self.tags = tags
    self.stack = pulumi.get_stack()

    self._create_eb_service_role()
    self._create_eb_instance_role()
    self._create_eb_instance_profile()
    self._create_autoscaling_role()

    self.register_outputs({
      'eb_service_role_arn': self.eb_service_role.arn,
      'eb_instance_role_arn': self.eb_instance_role.arn,
      'eb_instance_profile_name': self.eb_instance_profile.name,
      'autoscaling_role_arn': self.autoscaling_role.arn
    })

  def _create_eb_service_role(self):
    """Create Elastic Beanstalk service role"""
    self.eb_service_role = aws.iam.Role(
      "eb-service-role",
      name=f"nova-eb-service-role-{self.stack}",
      description="Service role for Elastic Beanstalk",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Principal": {"Service": "elasticbeanstalk.amazonaws.com"},
          "Action": "sts:AssumeRole",
          "Condition": {
            "StringEquals": {
              "sts:ExternalId": "elasticbeanstalk"
            }
          }
        }]
      }),
      managed_policy_arns=[
        "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth",
        "arn:aws:iam::aws:policy/AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy",
        "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkService"
      ],
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

  def _create_eb_instance_role(self):
    """Create EC2 instance role for Elastic Beanstalk instances"""
    self.eb_instance_role = aws.iam.Role(
      "eb-instance-role",
      name=f"nova-eb-instance-role-{self.stack}",
      description="Instance role for Elastic Beanstalk EC2 instances",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Principal": {"Service": "ec2.amazonaws.com"},
          "Action": "sts:AssumeRole"
        }]
      }),
      managed_policy_arns=[
        "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier",
        "arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker",
        "arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier"
      ],
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    self.eb_instance_policy = aws.iam.RolePolicy(
      "eb-instance-additional-policy",
      role=self.eb_instance_role.id,
      name=f"NovaEBInstanceAdditionalPolicy-{self.stack}",
      policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "cloudwatch:PutMetricData",
              "cloudwatch:GetMetricStatistics",
              "cloudwatch:ListMetrics",
              "ec2:DescribeInstanceStatus",
              "ec2:DescribeInstances",
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "logs:DescribeLogStreams",
              "logs:DescribeLogGroups"
            ],
            "Resource": "*"
          },
          {
            "Effect": "Allow",
            "Action": [
              "s3:GetObject",
              "s3:PutObject",
              "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::elasticbeanstalk-*/*"
          },
          {
            "Effect": "Allow",
            "Action": [
              "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::elasticbeanstalk-*"
          }
        ]
      }),
      opts=ResourceOptions(parent=self)
    )

  def _create_eb_instance_profile(self):
    """Create instance profile for Elastic Beanstalk instances"""
    self.eb_instance_profile = aws.iam.InstanceProfile(
      "eb-instance-profile",
      name=f"nova-eb-instance-profile-{self.stack}",
      role=self.eb_instance_role.name,
      opts=ResourceOptions(parent=self)
    )

  def _create_autoscaling_role(self):
    """Create Auto Scaling service role"""
    self.autoscaling_role = aws.iam.Role(
      "autoscaling-role",
      name=f"nova-autoscaling-role-{self.stack}",
      description="Service role for Auto Scaling",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Principal": {"Service": "autoscaling.amazonaws.com"},
          "Action": "sts:AssumeRole"
        }]
      }),
      managed_policy_arns=[
        "arn:aws:iam::aws:policy/service-role/AutoScalingNotificationAccessRole"
      ],
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    self.autoscaling_policy = aws.iam.RolePolicy(
      "autoscaling-additional-policy",
      role=self.autoscaling_role.id,
      name=f"NovaAutoScalingAdditionalPolicy-{self.stack}",
      policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "ec2:DescribeInstances",
              "ec2:DescribeInstanceAttribute",
              "ec2:DescribeKeyPairs",
              "ec2:DescribeSecurityGroups",
              "ec2:DescribeSpotInstanceRequests",
              "ec2:DescribeSpotPriceHistory",
              "ec2:DescribeVpcClassicLink",
              "ec2:DescribeVpcs",
              "ec2:CreateTags",
              "elasticloadbalancing:DescribeLoadBalancers",
              "elasticloadbalancing:DescribeInstanceHealth",
              "elasticloadbalancing:RegisterInstancesWithLoadBalancer",
              "elasticloadbalancing:DeregisterInstancesFromLoadBalancer",
              "elasticloadbalancing:DescribeTargetGroups",
              "elasticloadbalancing:DescribeTargetHealth",
              "elasticloadbalancing:RegisterTargets",
              "elasticloadbalancing:DeregisterTargets"
            ],
            "Resource": "*"
          }
        ]
      }),
      opts=ResourceOptions(parent=self)
    )
```

## components/monitoring.py

```python
"""
Monitoring Infrastructure Component
Handles CloudWatch dashboards, alarms, and SNS notifications
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import json

class MonitoringInfrastructure(pulumi.ComponentResource):
  def __init__(self, 
               name: str,
               region: str,
               environment: str,
               tags: dict,
               opts: Optional[ResourceOptions] = None):
    super().__init__('nova:infrastructure:Monitoring', name, None, opts)

    self.region = region
    self.environment = environment
    self.tags = tags
    self.region_suffix = region.replace('-', '').replace('gov', '')

    self._create_sns_topic()
    self._create_cloudwatch_dashboard()
    
    # Register outputs
    self.register_outputs({
      'dashboard_name': self.dashboard.dashboard_name,
      'sns_topic_arn': self.sns_topic.arn
    })

  def _create_sns_topic(self):
    """Create SNS topic for alerts"""
    self.sns_topic = aws.sns.Topic(
      f"alerts-topic-{self.region_suffix}",
      name=f"nova-alerts-{self.region_suffix}",
      display_name=f"Nova Application Alerts - {self.region_suffix.title()}",
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    # SNS topic policy for CloudWatch alarms
    self.sns_topic_policy = aws.sns.TopicPolicy(
      f"alerts-topic-policy-{self.region_suffix}",
      arn=self.sns_topic.arn,
      policy=self.sns_topic.arn.apply(lambda topic_arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {"Service": "cloudwatch.amazonaws.com"},
            "Action": [
              "SNS:Publish"
            ],
            "Resource": topic_arn,
            "Condition": {
              "StringEquals": {
                "aws:SourceAccount": aws.get_caller_identity().account_id
              }
            }
          }
        ]
      })),
      opts=ResourceOptions(parent=self)
    )

  def _create_cloudwatch_dashboard(self):
    """Create CloudWatch dashboard for monitoring"""
    self.dashboard = aws.cloudwatch.Dashboard(
      f"dashboard-{self.region_suffix}",
      dashboard_name=f"nova-dashboard-{self.region_suffix}",
      dashboard_body=json.dumps({
        "widgets": [
          {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
              "metrics": [
                ["AWS/ElasticBeanstalk", "EnvironmentHealth", "EnvironmentName", f"nova-env-{self.region_suffix}"],
                [".", "ApplicationRequests2xx", ".", "."],
                [".", "ApplicationRequests4xx", ".", "."],
                [".", "ApplicationRequests5xx", ".", "."]
              ],
              "view": "timeSeries",
              "stacked": False,
              "region": self.region,
              "title": "Application Health Metrics",
              "period": 300,
              "stat": "Sum",
              "yAxis": {
                "left": {
                  "min": 0
                }
              }
            }
          },
          {
            "type": "metric",
            "x": 12,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
              "metrics": [
                ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", f"app/awseb-AWSEB-{self.region_suffix}"],
                [".", "TargetResponseTime", ".", "."],
                [".", "HTTPCode_Target_2XX_Count", ".", "."],
                [".", "HTTPCode_Target_4XX_Count", ".", "."],
                [".", "HTTPCode_Target_5XX_Count", ".", "."]
              ],
              "view": "timeSeries",
              "stacked": False,
              "region": self.region,
              "title": "Load Balancer Metrics",
              "period": 300,
              "stat": "Sum"
            }
          },
          {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
              "metrics": [
                ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", f"nova-env-{self.region_suffix}"]
              ],
              "view": "timeSeries",
              "stacked": False,
              "region": self.region,
              "title": "CPU Utilization",
              "period": 300,
              "stat": "Average",
              "yAxis": {
                "left": {
                  "min": 0,
                  "max": 100
                }
              }
            }
          },
          {
            "type": "metric",
            "x": 12,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
              "metrics": [
                ["AWS/AutoScaling", "GroupDesiredCapacity", "AutoScalingGroupName", f"nova-env-{self.region_suffix}"],
                [".", "GroupInServiceInstances", ".", "."],
                [".", "GroupTotalInstances", ".", "."]
              ],
              "view": "timeSeries",
              "stacked": False,
              "region": self.region,
              "title": "Auto Scaling Metrics",
              "period": 300,
              "stat": "Average"
            }
          },
          {
            "type": "log",
            "x": 0,
            "y": 12,
            "width": 24,
            "height": 6,
            "properties": {
              "query": f"SOURCE '/aws/elasticbeanstalk/nova-env-{self.region_suffix}/var/log/eb-docker/containers/eb-current-app'\n| fields @timestamp, @message\n| sort @timestamp desc\n| limit 100",
              "region": self.region,
              "title": "Application Logs",
              "view": "table"
            }
          }
        ]
      }),
      opts=ResourceOptions(parent=self)
    )

  def create_cpu_alarm(self, environment_name: Output[str], autoscaling_group_name: Output[str]):
    """Create CPU utilization alarm"""
    return aws.cloudwatch.MetricAlarm(
      f"cpu-high-alarm-{self.region_suffix}",
      alarm_name=f"nova-cpu-high-{self.region_suffix}",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="CPUUtilization",
      namespace="AWS/EC2",
      period=300,
      statistic="Average",
      threshold=80,
      alarm_description=f"High CPU utilization in {self.region}",
      alarm_actions=[self.sns_topic.arn],
      ok_actions=[self.sns_topic.arn],
      dimensions={
        "AutoScalingGroupName": autoscaling_group_name
      },
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

  def create_error_alarm(self, environment_name: Output[str]):
    """Create application error alarm"""
    return aws.cloudwatch.MetricAlarm(
      f"error-alarm-{self.region_suffix}",
      alarm_name=f"nova-5xx-errors-{self.region_suffix}",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="ApplicationRequests5xx",
      namespace="AWS/ElasticBeanstalk",
      period=300,
      statistic="Sum",
      threshold=10,
      alarm_description=f"High number of 5xx errors in {self.region}",
      alarm_actions=[self.sns_topic.arn],
      ok_actions=[self.sns_topic.arn],
      dimensions={
        "EnvironmentName": environment_name
      },
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

  def create_health_alarm(self, environment_name: Output[str]):
    """Create environment health alarm"""
    return aws.cloudwatch.MetricAlarm(
      f"health-alarm-{self.region_suffix}",
      alarm_name=f"nova-env-health-{self.region_suffix}",
      comparison_operator="LessThanThreshold",
      evaluation_periods=2,
      metric_name="EnvironmentHealth",
      namespace="AWS/ElasticBeanstalk",
      period=300,
      statistic="Average",
      threshold=15,  # Below "Ok" health status
      alarm_description=f"Environment health degraded in {self.region}",
      alarm_actions=[self.sns_topic.arn],
      ok_actions=[self.sns_topic.arn],
      dimensions={
        "EnvironmentName": environment_name
      },
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

  def create_response_time_alarm(self, load_balancer_full_name: Output[str]):
    """Create response time alarm for ALB"""
    return aws.cloudwatch.MetricAlarm(
      f"response-time-alarm-{self.region_suffix}",
      alarm_name=f"nova-response-time-{self.region_suffix}",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="TargetResponseTime",
      namespace="AWS/ApplicationELB",
      period=300,
      statistic="Average",
      threshold=5.0,  # 5 seconds
      alarm_description=f"High response time in {self.region}",
      alarm_actions=[self.sns_topic.arn],
      ok_actions=[self.sns_topic.arn],
      dimensions={
        "LoadBalancer": load_balancer_full_name
      },
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

  # Properties for easy access
  @property
  def dashboard_name(self):
    return self.dashboard.dashboard_name

  @property
  def sns_topic_arn(self):
    return self.sns_topic.arn
```

## components/networking.py

```python
"""
Networking Infrastructure Component
Handles VPC, subnets, security groups, and network-related resources
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, InvokeOptions

class NetworkingInfrastructure(pulumi.ComponentResource):
  def __init__(self, 
               name: str,
               region: str,
               is_primary: bool,
               environment: str,
               tags: dict,
               opts: Optional[ResourceOptions] = None):
    super().__init__('nova:infrastructure:Networking', name, None, opts)

    self.region = region
    self.is_primary = is_primary
    self.environment = environment
    self.tags = tags
    self.region_suffix = region.replace('-', '').replace('gov', '')

    self.provider = opts.provider if opts else None
    self.vpc_cidr = "10.0.0.0/16" if is_primary else "10.1.0.0/16"

    self.public_subnets = []
    self.private_subnets = []
    self.nat_gateways = []
    self.private_rts = []
    
    self._create_vpc()
    self._create_subnets()
    self._create_internet_gateway()
    self._create_nat_gateways()
    self._create_route_tables()
    self._create_security_groups()

    self.register_outputs({
      'vpc_id': self.vpc.id,
      'vpc_cidr': self.vpc.cidr_block,
      'public_subnet_ids': [subnet.id for subnet in self.public_subnets],
      'private_subnet_ids': [subnet.id for subnet in self.private_subnets],
      'alb_security_group_id': self.alb_security_group.id,
      'eb_security_group_id': self.eb_security_group.id
    })

  def _create_vpc(self):
    """Create VPC with DNS support"""
    self.vpc = aws.ec2.Vpc(
      f"vpc-{self.region_suffix}",
      cidr_block=self.vpc_cidr,
      enable_dns_hostnames=True,
      enable_dns_support=True,
      tags={**self.tags, "Name": f"nova-vpc-{self.region_suffix}"},
      opts=ResourceOptions(parent=self)
    )

  def _create_subnets(self):
    """Create public and private subnets across multiple AZs"""
    # FIX: Correctly get availability zones. The function returns a standard object.
    azs = aws.get_availability_zones(
      state="available",
      opts=InvokeOptions(provider=self.provider)
    )

    # Use min(2, len(azs.names)) to handle regions with fewer than 2 AZs.
    num_azs_to_use = min(2, len(azs.names))
    
    base = 0 if self.is_primary else 1
    public_base = 100
    private_base = 120

    for i in range(num_azs_to_use):
      az_name = azs.names[i]
      public_cidr = f"10.{base}.{public_base + i}.0/24"
      private_cidr = f"10.{base}.{private_base + i}.0/24"

      public_subnet = aws.ec2.Subnet(
        f"public-subnet-{i}-{self.region_suffix}",
        vpc_id=self.vpc.id,
        cidr_block=public_cidr,
        availability_zone=az_name,
        map_public_ip_on_launch=True,
        tags={**self.tags, "Name": f"nova-public-{i}-{self.region_suffix}"},
        # FIX: Add this option to correctly handle replacing the subnet
        opts=ResourceOptions(parent=self, provider=self.provider, delete_before_replace=True)
      )
      self.public_subnets.append(public_subnet)

      private_subnet = aws.ec2.Subnet(
        f"private-subnet-{i}-{self.region_suffix}",
        vpc_id=self.vpc.id,
        cidr_block=private_cidr,
        availability_zone=az_name,
        tags={**self.tags, "Name": f"nova-private-{i}-{self.region_suffix}"},
        # FIX: Add this option to correctly handle replacing the subnet
        opts=ResourceOptions(parent=self, provider=self.provider, delete_before_replace=True)
      )
      self.private_subnets.append(private_subnet)

  def _create_internet_gateway(self):
    """Create Internet Gateway for public internet access"""
    self.igw = aws.ec2.InternetGateway(
      f"igw-{self.region_suffix}",
      vpc_id=self.vpc.id,
      tags={**self.tags, "Name": f"nova-igw-{self.region_suffix}"},
      opts=ResourceOptions(parent=self, provider=self.provider)
    )

  def _create_nat_gateways(self):
    """Create NAT Gateways for private subnet internet access"""
    # Create one NAT Gateway per public subnet
    for i, public_subnet in enumerate(self.public_subnets):
      eip = aws.ec2.Eip(
        f"nat-eip-{i}-{self.region_suffix}",
        domain="vpc",
        tags={**self.tags, "Name": f"nova-nat-eip-{i}-{self.region_suffix}"},
        opts=ResourceOptions(
          parent=self,
          provider=self.provider,
          delete_before_replace=True  
        )
      )

      nat_gw = aws.ec2.NatGateway(
        f"nat-gw-{i}-{self.region_suffix}",
        allocation_id=eip.id,
        subnet_id=public_subnet.id,
        tags={**self.tags, "Name": f"nova-nat-gw-{i}-{self.region_suffix}"},
        opts=ResourceOptions(
          parent=self,
          provider=self.provider,
          delete_before_replace=True
        )
      )
      self.nat_gateways.append(nat_gw)

  def _create_route_tables(self):
    """Create and configure route tables"""
    self.public_rt = aws.ec2.RouteTable(
      f"public-rt-{self.region_suffix}",
      vpc_id=self.vpc.id,
      routes=[
        aws.ec2.RouteTableRouteArgs(
          cidr_block="0.0.0.0/0",
          gateway_id=self.igw.id
        )
      ],
      tags={**self.tags, "Name": f"nova-public-rt-{self.region_suffix}"},
      opts=ResourceOptions(parent=self, provider=self.provider)
    )

    for i, subnet in enumerate(self.public_subnets):
      aws.ec2.RouteTableAssociation(
        f"public-rt-assoc-{i}-{self.region_suffix}",
        subnet_id=subnet.id,
        route_table_id=self.public_rt.id,
        opts=ResourceOptions(parent=self, provider=self.provider)
      )

    self.private_rts = []
    for i, (subnet, nat_gw) in enumerate(zip(self.private_subnets, self.nat_gateways)):
      private_rt = aws.ec2.RouteTable(
        f"private-rt-{i}-{self.region_suffix}",
        vpc_id=self.vpc.id,
        routes=[
          aws.ec2.RouteTableRouteArgs(
            cidr_block="0.0.0.0/0",
            nat_gateway_id=nat_gw.id
          )
        ],
        tags={**self.tags, "Name": f"nova-private-rt-{i}-{self.region_suffix}"},
        opts=ResourceOptions(parent=self)
      )
      self.private_rts.append(private_rt)

      aws.ec2.RouteTableAssociation(
        f"private-rt-assoc-{i}-{self.region_suffix}",
        subnet_id=subnet.id,
        route_table_id=private_rt.id,
        opts=ResourceOptions(parent=self)
      )

  def _create_security_groups(self):
    """Create security groups for ALB and Elastic Beanstalk"""
    self.alb_security_group = aws.ec2.SecurityGroup(
      f"alb-sg-{self.region_suffix}",
      description="Security group for Application Load Balancer",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=80,
          to_port=80,
          cidr_blocks=["0.0.0.0/0"],
          description="HTTP from anywhere"
        ),
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=443,
          to_port=443,
          cidr_blocks=["0.0.0.0/0"],
          description="HTTPS from anywhere"
        )
      ],
      egress=[
        aws.ec2.SecurityGroupEgressArgs(
          protocol="-1",
          from_port=0,
          to_port=0,
          cidr_blocks=["0.0.0.0/0"],
          description="All outbound traffic"
        )
      ],
      tags={**self.tags, "Name": f"nova-alb-sg-{self.region_suffix}"},
      opts=ResourceOptions(parent=self)
    )

    self.eb_security_group = aws.ec2.SecurityGroup(
      f"eb-sg-{self.region_suffix}",
      description="Security group for Elastic Beanstalk instances",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=80,
          to_port=80,
          security_groups=[self.alb_security_group.id],
          description="HTTP from ALB"
        ),
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=22,
          to_port=22,
          cidr_blocks=[self.vpc_cidr],
          description="SSH from VPC"
        )
      ],
      egress=[
        aws.ec2.SecurityGroupEgressArgs(
          protocol="-1",
          from_port=0,
          to_port=0,
          cidr_blocks=["0.0.0.0/0"],
          description="All outbound traffic"
        )
      ],
      tags={**self.tags, "Name": f"nova-eb-sg-{self.region_suffix}"},
      opts=ResourceOptions(parent=self)
    )

  @property
  def vpc_id(self):
    return self.vpc.id

  @property
  def public_subnet_ids(self):
    return [subnet.id for subnet in self.public_subnets]

  @property
  def private_subnet_ids(self):
    return [subnet.id for subnet in self.private_subnets]

  @property
  def alb_security_group_id(self):
    return self.alb_security_group.id

  @property
  def eb_security_group_id(self):
    return self.eb_security_group.id
```

## tap_stack.py

```python
"""
AWS Multi-Region GovCloud Web Application Deployment
IaC - AWS Nova Model Breaking - Main Stack

This is the main Pulumi Python program that orchestrates the deployment
of a web application across multiple AWS GovCloud regions.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from lib.components.networking import NetworkingInfrastructure
from lib.components.identity import IdentityInfrastructure
from lib.components.elastic_beanstalk import ElasticBeanstalkInfrastructure
from lib.components.monitoring import MonitoringInfrastructure

class TapStackArgs:
  def __init__(self,
               environment_suffix: Optional[str] = None,
               regions: Optional[list] = None,
               tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'prod'
    self.regions = ['us-east-1', 'us-west-1']
    self.tags = tags or {
      'Project': 'IaC-AWS-Nova-Model-Breaking',
      'Environment': self.environment_suffix,
      'Application': 'nova-web-app',
      'ManagedBy': 'Pulumi',
      'Classification': 'CUI',
      'Compliance': 'FedRAMP-High'
    }

class TapStack(pulumi.ComponentResource):
  def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
    super().__init__('tap:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.regions = args.regions
    self.tags = args.tags

    # Initialize component storage
    self.regional_networks = {}
    self.regional_monitoring = {}
    self.regional_elastic_beanstalk = {}
    self.providers = {}

    print("🔐 Creating Identity and Access Infrastructure...")
    self.identity = IdentityInfrastructure(
      name=f"nova-identity-{self.environment_suffix}",
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    # Deploy to each region with proper multi-region setup
    for i, region in enumerate(self.regions):
      region_suffix = region.replace('-', '').replace('gov', '')
      is_primary = i == 0

      print(f"🌍 Setting up AWS provider for region: {region} ({'PRIMARY' if is_primary else 'SECONDARY'})")
      self.providers[region] = aws.Provider(
        f"aws-provider-{region_suffix}-{self.environment_suffix}",
        region=region,
        opts=ResourceOptions(parent=self)
      )

      def provider_opts(deps=None):
        return ResourceOptions(
          parent=self,
          provider=self.providers[region],
          depends_on=deps or []
        )

      print(f"🌐 Creating Networking Infrastructure for {region}...")
      self.regional_networks[region] = NetworkingInfrastructure(
        name=f"nova-network-{region_suffix}-{self.environment_suffix}",
        region=region,
        is_primary=is_primary,
        environment=self.environment_suffix,
        tags=self.tags,
        opts=provider_opts([self.identity])
      )

      print(f"📱 Creating Monitoring Infrastructure for {region}...")
      self.regional_monitoring[region] = MonitoringInfrastructure(
        name=f"nova-monitoring-{region_suffix}-{self.environment_suffix}",
        region=region,
        environment=self.environment_suffix,
        tags=self.tags,
        opts=provider_opts([
          self.identity,
          self.regional_networks[region]
        ])
      )

      print(f"🚀 Creating Elastic Beanstalk Infrastructure for {region}...")
      self.regional_elastic_beanstalk[region] = ElasticBeanstalkInfrastructure(
        name=f"nova-eb-{region_suffix}-{self.environment_suffix}",
        region=region,
        is_primary=is_primary,
        environment=self.environment_suffix,
        environment_suffix=f"{region_suffix}-{self.environment_suffix}",
        vpc_id=self.regional_networks[region].vpc_id,
        public_subnet_ids=self.regional_networks[region].public_subnet_ids,
        private_subnet_ids=self.regional_networks[region].private_subnet_ids,
        alb_security_group_id=self.regional_networks[region].alb_security_group_id, # FIX: Added this line
        eb_security_group_id=self.regional_networks[region].eb_security_group_id,   # FIX: Added this line
        eb_service_role_arn=self.identity.eb_service_role.arn,
        eb_instance_profile_name=self.identity.eb_instance_profile.name,
        tags=self.tags,
        opts=provider_opts([
          self.regional_networks[region],
          self.regional_monitoring[region],
          self.identity
        ])
      )

    print("📤 Exporting Outputs for Multi-Region Deployment...")
    
    # Multi-region summary
    pulumi.export("deployed_regions", self.regions)
    pulumi.export("total_regions", len(self.regions))
    pulumi.export("environment", self.environment_suffix)
    pulumi.export("compliance_tags", self.tags)

    # Primary region outputs (us-gov-west-1)
    primary_region = self.regions[0]
    pulumi.export("primary_region", primary_region)
    pulumi.export("primary_vpc_id", self.regional_networks[primary_region].vpc_id)
    pulumi.export("primary_vpc_cidr", self.regional_networks[primary_region].vpc_cidr)
    pulumi.export("primary_public_subnet_ids", self.regional_networks[primary_region].public_subnet_ids)
    pulumi.export("primary_private_subnet_ids", self.regional_networks[primary_region].private_subnet_ids)
    pulumi.export("primary_eb_application_name", self.regional_elastic_beanstalk[primary_region].application_name)
    pulumi.export("primary_eb_environment_name", self.regional_elastic_beanstalk[primary_region].environment_name)
    pulumi.export("primary_eb_environment_url", self.regional_elastic_beanstalk[primary_region].environment_url)
    pulumi.export("primary_eb_environment_cname", self.regional_elastic_beanstalk[primary_region].environment_cname)
    pulumi.export("primary_dashboard_name", self.regional_monitoring[primary_region].dashboard_name)
    pulumi.export("primary_sns_topic_arn", self.regional_monitoring[primary_region].sns_topic_arn)

    # Secondary region outputs (us-gov-east-1) if deployed
    if len(self.regions) > 1:
      secondary_region = self.regions[1]
      pulumi.export("secondary_region", secondary_region)
      pulumi.export("secondary_vpc_id", self.regional_networks[secondary_region].vpc_id)
      pulumi.export("secondary_vpc_cidr", self.regional_networks[secondary_region].vpc_cidr)
      pulumi.export("secondary_public_subnet_ids", self.regional_networks[secondary_region].public_subnet_ids)
      pulumi.export("secondary_private_subnet_ids", self.regional_networks[secondary_region].private_subnet_ids)
      pulumi.export("secondary_eb_application_name", self.regional_elastic_beanstalk[secondary_region].application_name)
      pulumi.export("secondary_eb_environment_name", self.regional_elastic_beanstalk[secondary_region].environment_name)
      pulumi.export("secondary_eb_environment_url", self.regional_elastic_beanstalk[secondary_region].environment_url)
      pulumi.export("secondary_eb_environment_cname", self.regional_elastic_beanstalk[secondary_region].environment_cname)
      pulumi.export("secondary_dashboard_name", self.regional_monitoring[secondary_region].dashboard_name)
      pulumi.export("secondary_sns_topic_arn", self.regional_monitoring[secondary_region].sns_topic_arn)

    # All regions data for reference
    all_regions_data = {}
    for region in self.regions:
      region_suffix = region.replace('-', '').replace('gov', '')
      all_regions_data[region] = {
        "vpc_id": self.regional_networks[region].vpc_id,
        "vpc_cidr": self.regional_networks[region].vpc_cidr,
        "eb_environment_url": self.regional_elastic_beanstalk[region].environment_url,
        "eb_environment_name": self.regional_elastic_beanstalk[region].environment_name,
        "dashboard_name": self.regional_monitoring[region].dashboard_name,
        "sns_topic_arn": self.regional_monitoring[region].sns_topic_arn
      }
    
    pulumi.export("all_regions_data", all_regions_data)

    # Security and Identity outputs (global resources)
    pulumi.export("eb_service_role_arn", self.identity.eb_service_role.arn)
    pulumi.export("eb_instance_role_arn", self.identity.eb_instance_role.arn)
    pulumi.export("eb_instance_profile_name", self.identity.eb_instance_profile.name)

    # Auto-scaling configuration
    pulumi.export("autoscaling_config", {
      "min_size": 2,
      "max_size": 10,
      "cpu_scale_up_threshold": 70,
      "cpu_scale_down_threshold": 20,
      "instance_type": "t3.medium"
    })
```
