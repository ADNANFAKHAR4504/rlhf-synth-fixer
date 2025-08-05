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
    # vpc_id: Output[str],
    # public_subnet_ids: List[Output[str]],
    # private_subnet_ids: List[Output[str]],
    eb_service_role_arn: Output[str],
    eb_instance_profile_name: Output[str],
    tags: dict,
    opts: Optional[ResourceOptions] = None
  ):
    super().__init__('nova:infrastructure:ElasticBeanstalk', name, None, opts)

    self.region = region
    self.is_primary = is_primary
    self.environment = environment
    # self.vpc_id = vpc_id
    # self.public_subnet_ids = public_subnet_ids
    # self.private_subnet_ids = private_subnet_ids
    self.eb_service_role_arn = eb_service_role_arn
    self.eb_instance_profile_name = eb_instance_profile_name
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
    # Use the Output.apply() method directly on individual outputs
    # This is more reliable than Output.all() in some Pulumi versions
    
    def create_subnet_setting(namespace: str, name: str, subnet_output: Output[str]):
      return subnet_output.apply(
        lambda subnet_id: aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
          namespace=namespace,
          name=name,
          value=subnet_id
        )
      )

    def create_vpc_setting(vpc_output: Output[str]):
      return vpc_output.apply(
        lambda vpc_id: aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
          namespace="aws:ec2:vpc",
          name="VPCId",
          value=vpc_id
        )
      )

    def create_role_setting(role_output: Output[str]):
      return role_output.apply(
        lambda role_arn: aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
          namespace="aws:elasticbeanstalk:environment",
          name="ServiceRole",
          value=role_arn
        )
      )

    def create_instance_profile_setting(profile_output: Output[str]):
      return profile_output.apply(
        lambda profile_name: aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
          namespace="aws:autoscaling:launchconfiguration",
          name="IamInstanceProfile",
          value=profile_name
        )
      )

    # Create dynamic settings using apply()
    # vpc_setting = create_vpc_setting(self.vpc_id)
    subnet_setting = create_subnet_setting("aws:ec2:vpc", "Subnets", self.private_subnet_ids[0])
    elb_subnet_setting = create_subnet_setting("aws:ec2:vpc", "ELBSubnets", self.public_subnet_ids[0])
    service_role_setting = create_role_setting(self.eb_service_role_arn)
    instance_profile_setting = create_instance_profile_setting(self.eb_instance_profile_name)

    # Static settings that don't depend on outputs
    static_settings = [
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:ec2:vpc",
        name="AssociatePublicIpAddress",
        value="false"
      ),
      aws.elasticbeanstalk.ConfigurationTemplateSettingArgs(
        namespace="aws:elasticbeanstalk:environment",
        name="LoadBalancerType",
        value="classic"
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
        namespace="aws:autoscaling:asg",
        name="Availability Zones",
        value="Any 1"
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

    # Combine all settings using Output.all() to properly resolve dynamic settings
    all_settings = Output.all(
      vpc_setting,
      subnet_setting,
      elb_subnet_setting,
      service_role_setting,
      instance_profile_setting
    ).apply(lambda dynamic_settings: dynamic_settings + static_settings)

    self.config_template = aws.elasticbeanstalk.ConfigurationTemplate(
      f"eb-config-template-{self.region_suffix}",
      name=f"nova-config-{self.region_suffix}",
      application=self.application.name,
      solution_stack_name="64bit Amazon Linux 2023 v6.6.2 running Node.js 18",
      settings=all_settings,
      opts=ResourceOptions(parent=self)
    )

  def _create_environment(self):
    self.eb_environment = aws.elasticbeanstalk.Environment(
      f"eb-env-{self.region_suffix}",
      name=f"nova-env-{self.region_suffix}-{self.environment_suffix}",
      application=self.application.name,
      template_name=self.config_template.name,
      tier="WebServer",
      tags=self.tags,
      opts=ResourceOptions(parent=self)
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