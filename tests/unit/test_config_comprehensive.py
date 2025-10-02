"""
Comprehensive tests for the config module to increase coverage.
"""
import unittest
from unittest.mock import MagicMock, Mock, patch

import pulumi

from lib.infrastructure.config import (ServerlessConfig,
                                       normalize_s3_bucket_name,
                                       validate_s3_bucket_name)


class TestConfigComprehensive(unittest.TestCase):
    """Comprehensive tests for ServerlessConfig class."""

    def setUp(self):
        """Set up test fixtures."""
        # Mock Pulumi before importing our modules
        pulumi.Config = Mock
        pulumi.ResourceOptions = Mock
        
        # Create a proper mock for ResourceOptions with merge method
        class MockResourceOptions:
            def __init__(self, **kwargs):
                # Initialize all the attributes that ResourceOptions expects
                self.id = kwargs.get('id', None)
                self.parent = kwargs.get('parent', None)
                self.depends_on = kwargs.get('depends_on', None)
                self.protect = kwargs.get('protect', None)
                self.retain_on_delete = kwargs.get('retain_on_delete', None)
                self.ignore_changes = kwargs.get('ignore_changes', None)
                self.aliases = kwargs.get('aliases', None)
                self.additional_secret_outputs = kwargs.get('additional_secret_outputs', None)
                self.custom_timeouts = kwargs.get('custom_timeouts', None)
                self.deleted_with = kwargs.get('deleted_with', None)
                self.replace_on_changes = kwargs.get('replace_on_changes', None)
                self.version = kwargs.get('version', None)
                self.providers = kwargs.get('providers', None)
                self.provider = kwargs.get('provider', None)
                self.urn = kwargs.get('urn', None)
                self.kwargs = kwargs
            
            def merge(self, other):
                if other is None:
                    return self
                if hasattr(other, 'kwargs'):
                    merged = {**self.kwargs, **other.kwargs}
                elif isinstance(other, dict):
                    merged = {**self.kwargs, **other}
                else:
                    merged = {**self.kwargs}
                return MockResourceOptions(**merged)

        pulumi.ResourceOptions = MockResourceOptions

    @patch('lib.infrastructure.config.aws.Provider')
    def test_config_default_initialization(self, mock_provider):
        """Test default configuration initialization."""
        with patch('lib.infrastructure.config.pulumi.Config') as mock_config:
            mock_config_instance = Mock()
            mock_config_instance.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'dev',
                'lambda_timeout': 300,
                'lambda_memory': 128,
                'log_level': 'INFO'
            }.get(key, default)
            mock_config_instance.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 300,
                'lambda_memory': 128
            }.get(key, default)
            mock_config_instance.get_object.side_effect = lambda key, default=None: {
                'allowed_ip_ranges': ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
            }.get(key, default)
            mock_config.return_value = mock_config_instance
            
            config = ServerlessConfig()
            
            # Test basic attributes
            self.assertEqual(config.environment_suffix, 'dev')
            self.assertEqual(config.region, 'us-east-1')
            self.assertEqual(config.lambda_timeout, 300)
            self.assertEqual(config.lambda_memory, 128)
            
            # Test bucket names are normalized
            self.assertTrue(config.input_bucket_name.startswith('clean-s3-lambda-input-useast1-dev'))
            self.assertTrue(config.output_bucket_name.startswith('clean-s3-lambda-output-useast1-dev'))
            
            # Test environment variables
            env_vars = config.lambda_environment_vars
            self.assertEqual(env_vars['ENVIRONMENT'], 'dev')
            self.assertEqual(env_vars['REGION'], 'us-east-1')
            self.assertEqual(env_vars['LOG_LEVEL'], 'INFO')

    @patch('lib.infrastructure.config.aws.Provider')
    def test_config_custom_environment_suffix(self, mock_provider):
        """Test configuration with custom environment suffix."""
        with patch('lib.infrastructure.config.pulumi.Config') as mock_config:
            mock_config_instance = Mock()
            mock_config_instance.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'prod',
                'lambda_timeout': 600,
                'lambda_memory': 256
            }.get(key, default)
            mock_config_instance.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 600,
                'lambda_memory': 256
            }.get(key, default)
            mock_config_instance.get_object.side_effect = lambda key, default=None: {
                'allowed_ip_ranges': ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
            }.get(key, default)
            mock_config.return_value = mock_config_instance
            
            config = ServerlessConfig()
            
            self.assertEqual(config.environment_suffix, 'prod')
            self.assertEqual(config.lambda_timeout, 600)
            self.assertEqual(config.lambda_memory, 256)
            
            # Test bucket names include custom environment
            self.assertIn('prod', config.input_bucket_name)
            self.assertIn('prod', config.output_bucket_name)

    @patch('lib.infrastructure.config.aws.Provider')
    def test_config_custom_bucket_names(self, mock_provider):
        """Test configuration with custom bucket names."""
        with patch('lib.infrastructure.config.pulumi.Config') as mock_config:
            mock_config.return_value.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'test',
                'input_bucket_name': 'my-custom-input-bucket',
                'output_bucket_name': 'my-custom-output-bucket'
            }.get(key, default)
            
            config = ServerlessConfig()
            
            # Test custom bucket names are normalized
            self.assertIn('my-custom-input-bucket', config.input_bucket_name)
            self.assertIn('my-custom-output-bucket', config.output_bucket_name)

    @patch('lib.infrastructure.config.aws.Provider')
    def test_config_custom_ip_ranges(self, mock_provider):
        """Test configuration with custom IP ranges."""
        with patch('lib.infrastructure.config.pulumi.Config') as mock_config:
            custom_ip_ranges = ["192.168.1.0/24", "10.0.0.0/8"]
            mock_config_instance = Mock()
            mock_config_instance.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'dev',
                'allowed_ip_ranges': custom_ip_ranges
            }.get(key, default)
            mock_config_instance.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 300,
                'lambda_memory': 128
            }.get(key, default)
            mock_config_instance.get_object.side_effect = lambda key, default=None: {
                'allowed_ip_ranges': custom_ip_ranges
            }.get(key, default)
            mock_config.return_value = mock_config_instance
            
            config = ServerlessConfig()
            
            self.assertEqual(config.allowed_ip_ranges, custom_ip_ranges)

    @patch('lib.infrastructure.config.aws.Provider')
    def test_config_with_allowed_account_id(self, mock_provider):
        """Test configuration with allowed account ID."""
        with patch('lib.infrastructure.config.pulumi.Config') as mock_config:
            mock_config.return_value.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'dev',
                'allowed_account_id': '123456789012'
            }.get(key, default)
            
            config = ServerlessConfig()
            
            # Verify provider was created with allowed_account_ids
            mock_provider.assert_called_once()
            call_args = mock_provider.call_args
            self.assertEqual(call_args[1]['allowed_account_ids'], ['123456789012'])

    @patch('lib.infrastructure.config.aws.Provider')
    def test_get_tags(self, mock_provider):
        """Test get_tags method."""
        with patch('lib.infrastructure.config.pulumi.Config') as mock_config:
            mock_config_instance = Mock()
            mock_config_instance.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'dev'
            }.get(key, default)
            mock_config_instance.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 300,
                'lambda_memory': 128
            }.get(key, default)
            mock_config_instance.get_object.side_effect = lambda key, default=None: {
                'allowed_ip_ranges': ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
            }.get(key, default)
            mock_config.return_value = mock_config_instance
            
            config = ServerlessConfig()
            tags = config.get_tags()
            
            self.assertIn('Environment', tags)
            self.assertEqual(tags['Environment'], 'dev')
            self.assertIn('Project', tags)
            self.assertIn('ManagedBy', tags)

    @patch('lib.infrastructure.config.aws.Provider')
    def test_get_environment_variables(self, mock_provider):
        """Test get_environment_variables method."""
        with patch('lib.infrastructure.config.pulumi.Config') as mock_config:
            mock_config_instance = Mock()
            mock_config_instance.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'dev'
            }.get(key, default)
            mock_config_instance.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 300,
                'lambda_memory': 128
            }.get(key, default)
            mock_config_instance.get_object.side_effect = lambda key, default=None: {
                'allowed_ip_ranges': ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
            }.get(key, default)
            mock_config.return_value = mock_config_instance
            
            config = ServerlessConfig()
            env_vars = config.get_environment_variables()
            
            self.assertIn('ENVIRONMENT', env_vars)
            self.assertIn('REGION', env_vars)
            self.assertIn('INPUT_BUCKET', env_vars)
            self.assertIn('OUTPUT_BUCKET', env_vars)
            self.assertIn('LOG_LEVEL', env_vars)

    @patch('lib.infrastructure.config.aws.Provider')
    def test_get_allowed_ip_ranges(self, mock_provider):
        """Test get_allowed_ip_ranges method."""
        with patch('lib.infrastructure.config.pulumi.Config') as mock_config:
            mock_config_instance = Mock()
            mock_config_instance.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'dev'
            }.get(key, default)
            mock_config_instance.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 300,
                'lambda_memory': 128
            }.get(key, default)
            mock_config_instance.get_object.side_effect = lambda key, default=None: {
                'allowed_ip_ranges': ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
            }.get(key, default)
            mock_config.return_value = mock_config_instance
            
            config = ServerlessConfig()
            ip_ranges = config.get_allowed_ip_ranges()
            
            self.assertIsInstance(ip_ranges, list)
            self.assertGreater(len(ip_ranges), 0)

    @patch('lib.infrastructure.config.aws.Provider')
    def test_validate_configuration_success(self, mock_provider):
        """Test successful configuration validation."""
        with patch('lib.infrastructure.config.pulumi.Config') as mock_config:
            mock_config_instance = Mock()
            mock_config_instance.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'dev'
            }.get(key, default)
            mock_config_instance.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 300,
                'lambda_memory': 128
            }.get(key, default)
            mock_config_instance.get_object.side_effect = lambda key, default=None: {
                'allowed_ip_ranges': ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
            }.get(key, default)
            mock_config.return_value = mock_config_instance
            
            config = ServerlessConfig()
            result = config.validate_configuration()
            
            self.assertTrue(result)

    @patch('lib.infrastructure.config.aws.Provider')
    def test_validate_configuration_invalid_region(self, mock_provider):
        """Test configuration validation with invalid region."""
        with patch('lib.infrastructure.config.pulumi.Config') as mock_config:
            mock_config_instance = Mock()
            mock_config_instance.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'dev'
            }.get(key, default)
            mock_config_instance.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 300,
                'lambda_memory': 128
            }.get(key, default)
            mock_config_instance.get_object.side_effect = lambda key, default=None: {
                'allowed_ip_ranges': ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
            }.get(key, default)
            mock_config.return_value = mock_config_instance
            
            config = ServerlessConfig()
            config.region = "invalid-region"
            
            with self.assertRaises(ValueError) as context:
                config.validate_configuration()
            
            self.assertIn("Deployment must be restricted to us-east-1 region", str(context.exception))

    @patch('lib.infrastructure.config.aws.Provider')
    def test_validate_configuration_invalid_ip_range(self, mock_provider):
        """Test configuration validation with invalid IP range."""
        with patch('lib.infrastructure.config.pulumi.Config') as mock_config:
            mock_config_instance = Mock()
            mock_config_instance.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'dev'
            }.get(key, default)
            mock_config_instance.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 300,
                'lambda_memory': 128
            }.get(key, default)
            mock_config_instance.get_object.side_effect = lambda key, default=None: {
                'allowed_ip_ranges': ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
            }.get(key, default)
            mock_config.return_value = mock_config_instance
            
            config = ServerlessConfig()
            config.allowed_ip_ranges = ["0.0.0.0/0"]  # This should trigger the validation error
            
            with self.assertRaises(ValueError) as context:
                config.validate_configuration()
            
            self.assertIn("IP range 0.0.0.0/0 is not allowed for security reasons", str(context.exception))

    @patch('lib.infrastructure.config.aws.Provider')
    def test_validate_configuration_invalid_timeout(self, mock_provider):
        """Test configuration validation with invalid timeout."""
        with patch('lib.infrastructure.config.pulumi.Config') as mock_config:
            mock_config_instance = Mock()
            mock_config_instance.get.side_effect = lambda key, default=None: {
                'environment_suffix': 'dev'
            }.get(key, default)
            mock_config_instance.get_int.side_effect = lambda key, default=None: {
                'lambda_timeout': 300,
                'lambda_memory': 128
            }.get(key, default)
            mock_config_instance.get_object.side_effect = lambda key, default=None: {
                'allowed_ip_ranges': ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
            }.get(key, default)
            mock_config.return_value = mock_config_instance
            
            config = ServerlessConfig()
            config.lambda_timeout = 600  # Invalid timeout > 300
            
            with self.assertRaises(ValueError) as context:
                config.validate_configuration()
            
            self.assertIn("Lambda timeout cannot exceed 5 minutes (300 seconds)", str(context.exception))


class TestBucketNameNormalization(unittest.TestCase):
    """Tests for bucket name normalization functions."""

    def test_normalize_s3_bucket_name_basic(self):
        """Test basic bucket name normalization."""
        result = normalize_s3_bucket_name("My-Bucket-Name")
        self.assertEqual(result, "my-bucket-name")

    def test_normalize_s3_bucket_name_with_special_chars(self):
        """Test bucket name normalization with special characters."""
        result = normalize_s3_bucket_name("My_Bucket.Name-123")
        self.assertEqual(result, "my-bucket.name-123")

    def test_normalize_s3_bucket_name_consecutive_dots(self):
        """Test bucket name normalization with consecutive dots."""
        result = normalize_s3_bucket_name("my..bucket...name")
        self.assertEqual(result, "my.bucket.name")

    def test_normalize_s3_bucket_name_consecutive_hyphens(self):
        """Test bucket name normalization with consecutive hyphens."""
        result = normalize_s3_bucket_name("my--bucket---name")
        self.assertEqual(result, "my-bucket-name")

    def test_normalize_s3_bucket_name_starts_with_number(self):
        """Test bucket name normalization starting with number."""
        result = normalize_s3_bucket_name("123bucket")
        self.assertEqual(result, "123bucket")

    def test_normalize_s3_bucket_name_ends_with_hyphen(self):
        """Test bucket name normalization ending with hyphen."""
        result = normalize_s3_bucket_name("bucket-name-")
        self.assertEqual(result, "bucket-name")

    def test_normalize_s3_bucket_name_too_long(self):
        """Test bucket name normalization with too long name."""
        long_name = "a" * 100
        result = normalize_s3_bucket_name(long_name)
        self.assertLessEqual(len(result), 63)

    def test_normalize_s3_bucket_name_ip_like(self):
        """Test bucket name normalization with IP-like address."""
        result = normalize_s3_bucket_name("192.168.1.1")
        self.assertEqual(result, "a-192.168.1.1-a")

    def test_validate_s3_bucket_name_valid(self):
        """Test validation of valid bucket names."""
        valid_names = [
            "my-bucket",
            "my-bucket-123",
            "my.bucket.name",
            "mybucket123"
        ]
        
        for name in valid_names:
            with self.subTest(name=name):
                self.assertTrue(validate_s3_bucket_name(name))

    def test_validate_s3_bucket_name_invalid(self):
        """Test validation of invalid bucket names."""
        invalid_names = [
            "",  # Empty
            "a",  # Too short
            "a" * 64,  # Too long
            "My-Bucket",  # Invalid characters
            "-bucket",  # Starts with hyphen
            "bucket-",  # Ends with hyphen
            "192.168.1.1",  # IP-like
            "my..bucket"  # Consecutive dots
        ]
        
        for name in invalid_names:
            with self.subTest(name=name):
                self.assertFalse(validate_s3_bucket_name(name))

    def test_validate_s3_bucket_name_edge_cases(self):
        """Test validation of edge case bucket names."""
        # Minimum length
        self.assertTrue(validate_s3_bucket_name("abc"))
        
        # Maximum length
        self.assertTrue(validate_s3_bucket_name("a" * 63))
        
        # Just under minimum
        self.assertFalse(validate_s3_bucket_name("ab"))
        
        # Just over maximum
        self.assertFalse(validate_s3_bucket_name("a" * 64))


if __name__ == '__main__':
    unittest.main()
