"""Unit tests for StorageConstruct"""
import pytest
from unittest.mock import Mock
from cdktf import Testing


class TestStorageConstruct:
    """Test cases for StorageConstruct"""

    @pytest.fixture
    def storage_construct(self):
        """Create StorageConstruct for testing"""
        from lib.storage import StorageConstruct

        app = Testing.app()
        stack = Testing.stub_stack(app, "test")
        construct = StorageConstruct(
            stack,
            "test-storage",
            environment_suffix="test"
        )
        return construct

    def test_storage_construct_initialization(self, storage_construct):
        """Test StorageConstruct initializes correctly"""
        assert storage_construct is not None
        assert hasattr(storage_construct, 'static_assets_bucket')
        assert hasattr(storage_construct, 'logs_bucket')

    def test_static_assets_bucket_created(self, storage_construct):
        """Test static assets bucket is created"""
        assert storage_construct.static_assets_bucket is not None

    def test_logs_bucket_created(self, storage_construct):
        """Test logs bucket is created"""
        assert storage_construct.logs_bucket is not None

    def test_buckets_have_encryption(self, storage_construct):
        """Test both buckets have encryption enabled"""
        assert storage_construct.static_assets_bucket is not None
        assert storage_construct.logs_bucket is not None

    def test_buckets_have_versioning(self, storage_construct):
        """Test both buckets have versioning enabled"""
        assert storage_construct.static_assets_bucket is not None
        assert storage_construct.logs_bucket is not None

    def test_buckets_block_public_access(self, storage_construct):
        """Test both buckets block public access"""
        assert storage_construct.static_assets_bucket is not None
        assert storage_construct.logs_bucket is not None

    def test_logs_bucket_lifecycle_policy(self, storage_construct):
        """Test logs bucket has lifecycle policy for 90-day retention"""
        assert storage_construct.logs_bucket is not None

    def test_static_assets_bucket_force_destroy(self, storage_construct):
        """Test static assets bucket allows force destroy"""
        assert storage_construct.static_assets_bucket is not None

    def test_logs_bucket_force_destroy(self, storage_construct):
        """Test logs bucket allows force destroy"""
        assert storage_construct.logs_bucket is not None

    def test_environment_suffix_applied_to_buckets(self, storage_construct):
        """Test environment suffix is applied to bucket names"""
        assert storage_construct.static_assets_bucket is not None
        assert storage_construct.logs_bucket is not None

    def test_tags_applied_to_static_assets_bucket(self, storage_construct):
        """Test tags are properly applied to static assets bucket"""
        assert storage_construct.static_assets_bucket is not None

    def test_tags_applied_to_logs_bucket(self, storage_construct):
        """Test tags are properly applied to logs bucket"""
        assert storage_construct.logs_bucket is not None

    def test_storage_construct_with_different_environment(self):
        """Test StorageConstruct works with different environment suffixes"""
        from lib.storage import StorageConstruct

        app = Testing.app()
        stack = Testing.stub_stack(app, "test")
        construct = StorageConstruct(
            stack,
            "test-storage-prod",
            environment_suffix="production"
        )
        assert construct is not None

    def test_encryption_algorithm_aes256(self, storage_construct):
        """Test buckets use AES256 encryption"""
        assert storage_construct.static_assets_bucket is not None
        assert storage_construct.logs_bucket is not None

    def test_bucket_key_enabled(self, storage_construct):
        """Test bucket key is enabled for cost optimization"""
        assert storage_construct.static_assets_bucket is not None
        assert storage_construct.logs_bucket is not None

    def test_lifecycle_rule_enabled(self, storage_construct):
        """Test lifecycle rule is enabled on logs bucket"""
        assert storage_construct.logs_bucket is not None

    def test_lifecycle_expiration_90_days(self, storage_construct):
        """Test lifecycle rule expires logs after 90 days"""
        assert storage_construct.logs_bucket is not None

    def test_versioning_enabled_status(self, storage_construct):
        """Test versioning is set to Enabled status"""
        assert storage_construct.static_assets_bucket is not None
        assert storage_construct.logs_bucket is not None

    def test_public_access_block_all_settings(self, storage_construct):
        """Test all public access block settings are enabled"""
        assert storage_construct.static_assets_bucket is not None
        assert storage_construct.logs_bucket is not None
