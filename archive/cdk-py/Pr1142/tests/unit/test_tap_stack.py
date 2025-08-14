import pytest
from aws_cdk import App
from aws_cdk.assertions import Template, Match
from lib.tap_stack import WebApplicationStack

@pytest.fixture(scope="module")
def stack_template():
  app = App()
  stack = WebApplicationStack(app, "MyTestStack")
  return Template.from_stack(stack)

def test_vpc_created_with_correct_subnets(stack_template):
  stack_template.resource_count_is("AWS::EC2::VPC", 1)
  stack_template.resource_count_is("AWS::EC2::Subnet", 4)
  stack_template.has_resource_properties("AWS::EC2::Subnet", {
    "MapPublicIpOnLaunch": True
  })
  stack_template.has_resource_properties("AWS::EC2::Subnet", {
    "MapPublicIpOnLaunch": False
  })

def test_alb_created(stack_template):
  stack_template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
  stack_template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
    "Name": "MyWebApplicationALB1",
    "Scheme": "internet-facing"
  })

def test_cloudwatch_alarm_created(stack_template):
  stack_template.resource_count_is("AWS::CloudWatch::Alarm", 1)
  stack_template.has_resource_properties("AWS::CloudWatch::Alarm", {
    "MetricName": "CPUUtilization",
    "Namespace": "AWS/EC2",
    "Threshold": 70.0,
    "ComparisonOperator": "GreaterThanThreshold",
    "EvaluationPeriods": 2,
    "DatapointsToAlarm": 2,
    "AlarmActions": Match.any_value()
  })

def test_cloudfront_distribution_created(stack_template):
  stack_template.resource_count_is("AWS::CloudFront::Distribution", 1)
  stack_template.has_resource_properties("AWS::CloudFront::Distribution", {
    "DistributionConfig": {
      "Origins": [
        Match.any_value(),
        Match.any_value()
      ],
      "DefaultCacheBehavior": {
        "ViewerProtocolPolicy": "redirect-to-https"
      },
      "CacheBehaviors": [{
        "PathPattern": "/static/*",
        "ViewerProtocolPolicy": "redirect-to-https"
      }]
    }
  })

def test_rds_database_instance_created(stack_template):
  """Verifies that the RDS database instance is created with correct properties."""
  stack_template.resource_count_is("AWS::RDS::DBInstance", 1)
  stack_template.has_resource_properties("AWS::RDS::DBInstance", {
      "Engine": "mysql",
      "EngineVersion": "8.0.42",
      "MultiAZ": True,
      "PubliclyAccessible": False,
      "DBInstanceClass": "db.t3.micro"
  })


def test_db_subnet_group_created(stack_template):
  """Verifies that the database subnet group is created and configured for private subnets."""
  stack_template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)
  stack_template.has_resource_properties("AWS::RDS::DBSubnetGroup", {
      "SubnetIds": Match.any_value()
  })
  
def test_asg_created_and_configured(stack_template):
  """Verifies the Auto Scaling Group and its Launch Configuration have the correct configuration."""
  
  # Check for the ASG itself
  stack_template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
  stack_template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
    "DesiredCapacity": "1",
    "MinSize": "1",
    "MaxSize": "3",
    "VPCZoneIdentifier": Match.any_value(),
    "LaunchConfigurationName": Match.any_value()
  })

  # Check for the Launch Configuration and ensure it has a security group
  stack_template.resource_count_is("AWS::AutoScaling::LaunchConfiguration", 1)
  stack_template.has_resource_properties("AWS::AutoScaling::LaunchConfiguration", {
      "SecurityGroups": [Match.any_value()]
  })
  
  # Check for the scaling policy
  stack_template.has_resource_properties("AWS::AutoScaling::ScalingPolicy", {
    "PolicyType": "TargetTrackingScaling",
    "TargetTrackingConfiguration": {
      "PredefinedMetricSpecification": {
        "PredefinedMetricType": "ASGAverageCPUUtilization"
      },
      "TargetValue": 50.0
    }
  })

def test_s3_bucket_created_with_correct_removal_policy(stack_template):
  # Verifies the S3 bucket exists.
  stack_template.resource_count_is("AWS::S3::Bucket", 1)

  s3_bucket_resources = stack_template.find_resources("AWS::S3::Bucket")
  
  # Assert that there is exactly one S3 bucket resource.
  assert len(s3_bucket_resources) == 1, "Expected exactly one S3 bucket resource"
  
  # Get the logical ID of the S3 bucket.
  s3_bucket_logical_id = list(s3_bucket_resources.keys())[0]
  s3_bucket_resource = s3_bucket_resources[s3_bucket_logical_id]

  # Check for the DeletionPolicy and its value.
  assert "DeletionPolicy" in s3_bucket_resource, "DeletionPolicy not found on the S3 bucket resource"
  assert s3_bucket_resource["DeletionPolicy"] == "Delete", "DeletionPolicy is not set to 'Delete'"

def test_outputs_are_created(stack_template):
  stack_template.has_output("AlbDnsName", {
    "Export": {
      "Name": "MyTestStack-AlbDnsName"
    }
  })
  stack_template.has_output("CloudFrontDistributionDomainName", {
    "Export": {
      "Name": "MyTestStack-CloudFrontDistributionDomainName"
    }
  })
