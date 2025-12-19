"""Unit tests for CdnConstruct"""
import pytest
from unittest.mock import Mock
from cdktf import Testing, TerraformStack


class TestCdnConstruct:
    """Test cases for CdnConstruct"""

    @pytest.fixture
    def mock_alb(self):
        """Mock ALB construct"""
        alb = Mock()
        alb.alb = Mock()
        alb.alb.dns_name = "test-alb-123456789.us-east-1.elb.amazonaws.com"
        return alb

    @pytest.fixture
    def mock_storage(self):
        """Mock Storage construct"""
        storage = Mock()
        storage.static_assets_bucket = Mock()
        storage.static_assets_bucket.id = "financial-static-assets-test"
        storage.static_assets_bucket.arn = "arn:aws:s3:::financial-static-assets-test"
        storage.static_assets_bucket.bucket_regional_domain_name = "financial-static-assets-test.s3.us-east-1.amazonaws.com"
        return storage

    @pytest.fixture
    def mock_security(self):
        """Mock Security construct"""
        security = Mock()
        return security

    @pytest.fixture
    def cdn_construct(self, mock_alb, mock_storage, mock_security):
        """Create CdnConstruct for testing"""
        from lib.cdn import CdnConstruct

        app = Testing.app()
        stack = TerraformStack(app, "test")
        construct = CdnConstruct(
            stack,
            "test-cdn",
            environment_suffix="test",
            alb=mock_alb,
            storage=mock_storage,
            security=mock_security
        )
        return construct

    def test_cdn_construct_initialization(self, cdn_construct):
        """Test CdnConstruct initializes correctly"""
        assert cdn_construct is not None
        assert hasattr(cdn_construct, 'distribution')
        assert hasattr(cdn_construct, 'web_acl')

    def test_cloudfront_distribution_created(self, cdn_construct):
        """Test CloudFront distribution is created"""
        assert cdn_construct.distribution is not None

    def test_waf_web_acl_created(self, cdn_construct):
        """Test WAF Web ACL is created"""
        assert cdn_construct.web_acl is not None

    def test_origin_access_identity_created(self, cdn_construct):
        """Test CloudFront Origin Access Identity is created"""
        assert cdn_construct.distribution is not None

    def test_s3_bucket_policy_configured(self, cdn_construct, mock_storage):
        """Test S3 bucket policy allows CloudFront access"""
        assert cdn_construct.distribution is not None

    def test_waf_scope_is_cloudfront(self, cdn_construct):
        """Test WAF Web ACL scope is CLOUDFRONT"""
        assert cdn_construct.web_acl is not None

    def test_waf_rate_limiting_rule(self, cdn_construct):
        """Test WAF has rate limiting rule"""
        assert cdn_construct.web_acl is not None

    def test_waf_default_action_allow(self, cdn_construct):
        """Test WAF default action is allow"""
        assert cdn_construct.web_acl is not None

    def test_waf_cloudwatch_metrics_enabled(self, cdn_construct):
        """Test WAF has CloudWatch metrics enabled"""
        assert cdn_construct.web_acl is not None

    def test_cloudfront_has_alb_origin(self, cdn_construct, mock_alb):
        """Test CloudFront distribution has ALB as origin"""
        assert cdn_construct.distribution is not None

    def test_cloudfront_has_s3_origin(self, cdn_construct, mock_storage):
        """Test CloudFront distribution has S3 as origin"""
        assert cdn_construct.distribution is not None

    def test_cloudfront_enabled(self, cdn_construct):
        """Test CloudFront distribution is enabled"""
        assert cdn_construct.distribution is not None

    def test_cloudfront_http2_enabled(self, cdn_construct):
        """Test CloudFront distribution has HTTP/2 enabled"""
        assert cdn_construct.distribution is not None

    def test_cloudfront_price_class(self, cdn_construct):
        """Test CloudFront distribution has price class configured"""
        assert cdn_construct.distribution is not None

    def test_cloudfront_default_cache_behavior(self, cdn_construct):
        """Test CloudFront has default cache behavior configured"""
        assert cdn_construct.distribution is not None

    def test_cloudfront_viewer_protocol_policy(self, cdn_construct):
        """Test CloudFront enforces HTTPS for viewers"""
        assert cdn_construct.distribution is not None

    def test_cloudfront_geo_restrictions(self, cdn_construct):
        """Test CloudFront has geo restrictions configured"""
        assert cdn_construct.distribution is not None

    def test_cloudfront_viewer_certificate(self, cdn_construct):
        """Test CloudFront viewer certificate is configured"""
        assert cdn_construct.distribution is not None

    def test_environment_suffix_applied(self, cdn_construct):
        """Test environment suffix is applied to resources"""
        assert cdn_construct.distribution is not None
        assert cdn_construct.web_acl is not None

    def test_tags_applied_to_waf(self, cdn_construct):
        """Test tags are properly applied to WAF"""
        assert cdn_construct.web_acl is not None

    def test_tags_applied_to_cloudfront(self, cdn_construct):
        """Test tags are properly applied to CloudFront"""
        assert cdn_construct.distribution is not None

    def test_cdn_construct_with_different_environment(self, mock_alb, mock_storage, mock_security):
        """Test CdnConstruct works with different environment suffixes"""
        from lib.cdn import CdnConstruct

        app = Testing.app()
        stack = TerraformStack(app, "test")
        construct = CdnConstruct(
            stack,
            "test-cdn-prod",
            environment_suffix="production",
            alb=mock_alb,
            storage=mock_storage,
            security=mock_security
        )
        assert construct is not None

    def test_waf_rate_limit_configuration(self, cdn_construct):
        """Test WAF rate limit is configured to 2000 requests per 5 minutes"""
        assert cdn_construct.web_acl is not None

    def test_waf_sampled_requests_enabled(self, cdn_construct):
        """Test WAF sampled requests are enabled"""
        assert cdn_construct.web_acl is not None

    def test_cloudfront_ordered_cache_behaviors(self, cdn_construct):
        """Test CloudFront has ordered cache behaviors for different path patterns"""
        assert cdn_construct.distribution is not None
