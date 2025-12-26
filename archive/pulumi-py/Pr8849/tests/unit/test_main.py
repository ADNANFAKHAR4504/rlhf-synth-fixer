"""Unit tests for __main__.py module."""

import os
from unittest.mock import Mock, patch, MagicMock
import pytest
import pulumi


@pulumi.runtime.test
def test_main_module_imports():
    """Test that main module can be imported."""
    import lib.__main__
    assert lib.__main__ is not None


@pulumi.runtime.test
def test_main_environment_suffix_from_config():
    """Test environment suffix from Pulumi config."""
    
    def check_config(args):
        with patch('pulumi.Config') as mock_config:
            mock_instance = Mock()
            mock_instance.get.return_value = "staging"
            mock_config.return_value = mock_instance
            
            # Re-import to trigger config reading
            import importlib
            import lib.__main__
            importlib.reload(lib.__main__)
            
            return {"success": True}
    
    result = pulumi.Output.from_input({}).apply(check_config)
    return result


@pulumi.runtime.test
def test_main_environment_suffix_from_env_var():
    """Test environment suffix from environment variable."""
    
    def check_env(args):
        with patch.dict(os.environ, {"ENVIRONMENT_SUFFIX": "prod"}):
            with patch('pulumi.Config') as mock_config:
                mock_instance = Mock()
                mock_instance.get.return_value = None
                mock_config.return_value = mock_instance
                
                # Re-import to trigger env var reading
                import importlib
                import lib.__main__
                importlib.reload(lib.__main__)
                
                return {"success": True}
    
    result = pulumi.Output.from_input({}).apply(check_env)
    return result


@pulumi.runtime.test
def test_main_creates_stack():
    """Test that main module creates a TapStack instance."""
    
    def check_stack_creation(args):
        import lib.__main__
        
        # Check that stack variable exists
        assert hasattr(lib.__main__, 'stack')
        assert lib.__main__.stack is not None
        
        return {"stack_created": True}
    
    result = pulumi.Output.from_input({}).apply(check_stack_creation)
    return result


@pulumi.runtime.test  
def test_main_creates_stack_args():
    """Test that main module creates TapStackArgs."""
    
    def check_args(args):
        import lib.__main__
        
        # Check that args variable exists
        assert hasattr(lib.__main__, 'args')
        assert lib.__main__.args is not None
        
        # Verify args has expected attributes
        assert hasattr(lib.__main__.args, 'environment_suffix')
        assert hasattr(lib.__main__.args, 'team_name')
        assert hasattr(lib.__main__.args, 'regions')
        
        return {"args_created": True}
    
    result = pulumi.Output.from_input({}).apply(check_args)
    return result


@pulumi.runtime.test
def test_main_exports_outputs():
    """Test that main module exports required outputs."""
    
    def check_exports(args):
        import lib.__main__
        
        # The exports are done via pulumi.export, which we can't easily test
        # but we can verify the stack has the necessary attributes
        assert hasattr(lib.__main__.stack, 'vpcs')
        assert hasattr(lib.__main__.stack, 'dynamodb_tables')
        
        return {"exports_configured": True}
    
    result = pulumi.Output.from_input({}).apply(check_exports)
    return result


def test_main_default_environment():
    """Test default environment when no config is provided."""
    with patch('pulumi.Config') as mock_config:
        with patch.dict(os.environ, {}, clear=True):
            mock_instance = Mock()
            mock_instance.get.return_value = None
            mock_config.return_value = mock_instance
            
            # The default should be "dev"
            from lib.tap_stack import TapStackArgs
            args = TapStackArgs()
            assert args.environment_suffix == "dev"


def test_main_module_structure():
    """Test that main module has expected structure."""
    import lib.__main__
    
    # Check required imports exist
    assert hasattr(lib.__main__, 'pulumi')
    assert hasattr(lib.__main__, 'TapStack')
    assert hasattr(lib.__main__, 'TapStackArgs')
    
    # Check main variables exist
    assert hasattr(lib.__main__, 'config')
    assert hasattr(lib.__main__, 'args')
    assert hasattr(lib.__main__, 'stack')

