"""
Unit tests for Base Payment Stack Abstract Methods - Coverage focused
"""
import pytest
from lib.payment_stacks.base_payment_stack import BasePaymentStack


class TestBasePaymentStackCoverage:
    """Test base stack abstract methods for coverage"""

    def test_base_stack_abstract_methods_defined(self):
        """Test that abstract methods are defined in base class"""
        # Verify abstract methods exist
        assert hasattr(BasePaymentStack, 'get_environment_name')
        assert hasattr(BasePaymentStack, 'get_vpc_cidr')
        assert hasattr(BasePaymentStack, 'get_db_instance_type')
        assert hasattr(BasePaymentStack, 'get_min_capacity')
        assert hasattr(BasePaymentStack, 'get_max_capacity')
        assert hasattr(BasePaymentStack, 'get_alarm_thresholds')

    def test_base_stack_is_base_class(self):
        """Test BasePaymentStack is properly defined as base class"""
        assert BasePaymentStack.__name__ == 'BasePaymentStack'
        assert 'Stack' in [base.__name__ for base in BasePaymentStack.__mro__]
