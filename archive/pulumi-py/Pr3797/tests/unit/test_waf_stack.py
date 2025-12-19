import pytest
import pulumi
from typing import Dict
from lib.waf_stack import WAFStack

def test_waf_stack():
    name = "test-waf-stack"
    environment_suffix = "test"
    tags: Dict[str, str] = {"environment": "test"}

    waf_stack = WAFStack(
        name,
        environment_suffix,
        tags
    )

    assert waf_stack is not None
    assert hasattr(waf_stack, 'web_acl')
    assert hasattr(waf_stack, 'web_acl_id')