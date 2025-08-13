import pytest
from aws_cdk import App
from aws_cdk.assertions import Template
from lib.tap_stack import WebApplicationStack

@pytest.fixture(scope="module")
def template():
    app = App()
    stack = WebApplicationStack(app, "MyTestStack")
    return Template.from_stack(stack)

def test_vpc_created_with_correct_subnets(template):
    # Verifies that a VPC with 2 public and 2 private subnets is created.
    # The default behavior of max_azs=2 creates 2 subnets of each type.
    template.resource_count_is("AWS::EC2::VPC", 1)
    template.resource_count_is("AWS::EC2::Subnet", 4)
    template.has_resource_properties("AWS::EC2::Subnet", {
        "MapPublicIpOnLaunch": True
    })
    template.has_resource_properties("AWS::EC2::Subnet", {
        "MapPublicIpOnLaunch": False
    })

def test_alb_created(template):
    # Checks for the existence of an Application Load Balancer with the specified name.
    template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
    template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
        "Name": "MyWebApplicationALB",
        "Scheme": "internet-facing"
    })

def test_asg_created_and_configured(template):
    # Ensures the Auto Scaling Group exists with the correct instance type and scaling policy.
    template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
    template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
        "DesiredCapacity": "1",
        "MinSize": "1",
        "MaxSize": "3",
        "LaunchConfigurationName": pytest.anything()
    })
    
    # Check for the CPU scaling policy
    template.has_resource_properties("AWS::AutoScaling::ScalingPolicy", {
        "PolicyType": "TargetTrackingScaling",
        "TargetTrackingConfiguration": {
            "PredefinedMetricSpecification": {
                "PredefinedMetricType": "ASGAverageCPUUtilization"
            },
            "TargetValue": 50.0
        }
    })

def test_cloudwatch_alarm_created(template):
    # Validates the CloudWatch alarm for high CPU utilization and its SNS topic action.
    template.resource_count_is("AWS::CloudWatch::Alarm", 1)
    template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Threshold": 70.0,
        "ComparisonOperator": "GreaterThanThreshold",
        "EvaluationPeriods": 2,
        "DatapointsToAlarm": 2,
        "AlarmActions": pytest.anything()
    })

def test_cloudfront_distribution_created(template):
    # Confirms the CloudFront distribution is configured with both ALB and S3 origins.
    template.resource_count_is("AWS::CloudFront::Distribution", 1)
    template.has_resource_properties("AWS::CloudFront::Distribution", {
        "DistributionConfig": {
            "Origins": [
                pytest.anything(),  # ALB origin
                pytest.anything()   # S3 origin
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

def test_s3_bucket_created_with_correct_removal_policy(template):
    # Verifies the S3 bucket for static assets exists and is configured for auto-deletion.
    template.has_resource_properties("AWS::S3::Bucket", {
        "BucketEncryption": pytest.anything(),
        "PublicAccessBlockConfiguration": pytest.anything()
    })

    # Check for the DeletionPolicy
    s3_bucket = template.find_resources("AWS::S3::Bucket")
    assert "DeletionPolicy" in list(s3_bucket.values())[0]
    assert s3_bucket[list(s3_bucket.keys())[0]]["DeletionPolicy"] == "Delete"

def test_outputs_are_created(template):
    # Ensures the necessary CloudFormation outputs are defined.
    template.has_output("AlbDnsName", {
        "Export": {
            "Name": "MyTestStack-AlbDnsName"
        }
    })
    template.has_output("CloudFrontDistributionDomainName", {
        "Export": {
            "Name": "MyTestStack-CloudFrontDistributionDomainName"
        }
    })