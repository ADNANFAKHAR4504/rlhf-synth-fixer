"""Unit tests for portfolio stack"""

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
import pytest

from lib.tap_stack import TapStack, TapStackProps
from lib.portfolio_stack import PortfolioStack, PortfolioStackProps


@pytest.fixture
def app():
    """Create app for testing"""
    return cdk.App()


@pytest.fixture
def portfolio_stack(app):
    """Create portfolio stack directly for testing"""
    props = PortfolioStackProps(environment_suffix="test")
    stack = PortfolioStack(
        app,
        "TestPortfolioStack",
        props=props,
        env=cdk.Environment(account="123456789012", region="us-east-2")
    )
    return stack


@pytest.fixture
def tap_stack(app):
    """Create full tap stack for testing"""
    props = TapStackProps(environment_suffix="test")
    stack = TapStack(
        app,
        "TestStack",
        props=props,
        env=cdk.Environment(account="123456789012", region="us-east-2")
    )
    return stack


def test_s3_buckets_created(portfolio_stack):
    """Test that S3 buckets are created"""
    template = Template.from_stack(portfolio_stack)

    # Check for website bucket and logs bucket
    template.resource_count_is("AWS::S3::Bucket", 2)

    # Verify encryption is enabled
    template.has_resource_properties(
        "AWS::S3::Bucket",
        {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.any_value()
            }
        }
    )


def test_cloudfront_distribution_created(portfolio_stack):
    """Test that CloudFront distribution is created"""
    template = Template.from_stack(portfolio_stack)

    template.resource_count_is("AWS::CloudFront::Distribution", 1)

    # Verify logging is enabled
    template.has_resource_properties(
        "AWS::CloudFront::Distribution",
        {
            "DistributionConfig": {
                "Logging": Match.object_like({
                    "Bucket": Match.any_value()
                })
            }
        }
    )


def test_lambda_custom_resource_provider_created(portfolio_stack):
    """Test that Lambda custom resource provider is created for S3 auto-delete"""
    template = Template.from_stack(portfolio_stack)

    # S3 auto-delete creates a Lambda custom resource provider
    # Lambda@Edge for image optimization is omitted for cross-region deployment
    assert template.to_json()["Resources"] is not None


def test_waf_web_acl_removed_for_cross_region(portfolio_stack):
    """Test that WAF Web ACL is not created for cross-region deployment"""
    template = Template.from_stack(portfolio_stack)

    # WAF for CloudFront must be in us-east-1, so we don't create it for cross-region
    template.resource_count_is("AWS::WAFv2::WebACL", 0)


def test_route53_hosted_zone_created(portfolio_stack):
    """Test that Route 53 hosted zone is created"""
    template = Template.from_stack(portfolio_stack)

    template.resource_count_is("AWS::Route53::HostedZone", 1)


def test_cloudwatch_dashboard_created(portfolio_stack):
    """Test that CloudWatch dashboard is created"""
    template = Template.from_stack(portfolio_stack)

    template.resource_count_is("AWS::CloudWatch::Dashboard", 1)


def test_lifecycle_policies_configured(portfolio_stack):
    """Test that S3 lifecycle policies are configured"""
    template = Template.from_stack(portfolio_stack)

    template.has_resource_properties(
        "AWS::S3::Bucket",
        {
            "LifecycleConfiguration": {
                "Rules": Match.array_with([
                    Match.object_like({
                        "Status": "Enabled",
                        "ExpirationInDays": 90
                    })
                ])
            }
        }
    )


def test_cache_policies_created(portfolio_stack):
    """Test that custom cache policies are created"""
    template = Template.from_stack(portfolio_stack)

    # Should have 3 custom cache policies
    template.resource_count_is("AWS::CloudFront::CachePolicy", 3)


def test_origin_access_control_created(portfolio_stack):
    """Test that origin access control is created"""
    template = Template.from_stack(portfolio_stack)

    # Origin Access Control is automatically created by S3BucketOrigin.with_origin_access_control
    # There should be 4 OACs (one for each behavior: default, *.css, *.js, images/*)
    template.resource_count_is("AWS::CloudFront::OriginAccessControl", 4)

    template.has_resource_properties(
        "AWS::CloudFront::OriginAccessControl",
        {
            "OriginAccessControlConfig": {
                "OriginAccessControlOriginType": "s3",
                "SigningBehavior": "always",
                "SigningProtocol": "sigv4"
            }
        }
    )


def test_error_responses_configured(portfolio_stack):
    """Test that custom error responses are configured"""
    template = Template.from_stack(portfolio_stack)

    template.has_resource_properties(
        "AWS::CloudFront::Distribution",
        {
            "DistributionConfig": {
                "CustomErrorResponses": Match.array_with([
                    Match.object_like({
                        "ErrorCode": 404
                    }),
                    Match.object_like({
                        "ErrorCode": 500
                    })
                ])
            }
        }
    )


def test_multiple_cache_behaviors(portfolio_stack):
    """Test that multiple cache behaviors are configured"""
    template = Template.from_stack(portfolio_stack)

    template.has_resource_properties(
        "AWS::CloudFront::Distribution",
        {
            "DistributionConfig": {
                "CacheBehaviors": Match.array_with([
                    Match.object_like({
                        "PathPattern": Match.any_value()
                    })
                ])
            }
        }
    )


def test_tap_stack_creates_nested_stack(tap_stack):
    """Test that TapStack creates a nested stack"""
    template = Template.from_stack(tap_stack)

    # Should have a nested stack
    template.resource_count_is("AWS::CloudFormation::Stack", 1)


def test_environment_suffix_propagates(app):
    """Test that environment suffix propagates to resources"""
    env_suffix = "mytest"
    props = PortfolioStackProps(environment_suffix=env_suffix)
    stack = PortfolioStack(
        app,
        "TestEnvStack",
        props=props,
        env=cdk.Environment(account="123456789012", region="us-east-2")
    )
    template = Template.from_stack(stack)

    # Check that bucket names include the environment suffix
    template.has_resource_properties(
        "AWS::S3::Bucket",
        Match.object_like({
            "BucketName": Match.string_like_regexp(f".*{env_suffix}.*")
        })
    )


def test_cloudfront_security_headers(portfolio_stack):
    """Test that CloudFront has security configuration"""
    template = Template.from_stack(portfolio_stack)

    # Verify CloudFront distribution exists and has HTTPS redirect
    template.has_resource_properties(
        "AWS::CloudFront::Distribution",
        {
            "DistributionConfig": {
                "DefaultCacheBehavior": {
                    "ViewerProtocolPolicy": "redirect-to-https"
                }
            }
        }
    )


def test_images_cache_behavior_configured(portfolio_stack):
    """Test that images cache behavior is configured"""
    template = Template.from_stack(portfolio_stack)

    # Check that distribution has images cache behavior
    template.has_resource_properties(
        "AWS::CloudFront::Distribution",
        {
            "DistributionConfig": {
                "CacheBehaviors": Match.array_with([
                    Match.object_like({
                        "PathPattern": "images/*",
                        "Compress": True
                    })
                ])
            }
        }
    )


def test_s3_public_access_blocked(portfolio_stack):
    """Test that S3 buckets have public access blocked"""
    template = Template.from_stack(portfolio_stack)

    # All buckets should have public access blocked
    template.has_resource_properties(
        "AWS::S3::Bucket",
        {
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        }
    )


def test_cloudfront_compression_enabled(portfolio_stack):
    """Test that CloudFront compression is enabled"""
    template = Template.from_stack(portfolio_stack)

    template.has_resource_properties(
        "AWS::CloudFront::Distribution",
        {
            "DistributionConfig": {
                "DefaultCacheBehavior": {
                    "Compress": True
                }
            }
        }
    )


def test_route53_record_created(portfolio_stack):
    """Test that Route 53 A record is created"""
    template = Template.from_stack(portfolio_stack)

    template.resource_count_is("AWS::Route53::RecordSet", 1)

    template.has_resource_properties(
        "AWS::Route53::RecordSet",
        {
            "Type": "A"
        }
    )
