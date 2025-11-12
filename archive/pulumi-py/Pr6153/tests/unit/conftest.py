"""Conftest file for shared test fixtures"""
from unittest.mock import Mock

import pulumi
import pytest


@pytest.fixture(autouse=True)
def mock_pulumi():
    """Mock Pulumi's runtime environment"""
    # Create a new mock provider with proper resource handling
    class MockMonitor:
        def register_resource(self, name, resource_type, props, deps=None):
            # Create a mock resource ID
            resource_id = f"mock-{resource_type}-{name}"
            # Create output properties
            outputs = dict(props.items())
            outputs["id"] = resource_id
            # Return the resource ID, state, and dependencies
            return (resource_id, outputs, deps or [])
        
        def register_resource_outputs(self, urn, outputs):
            pass

    class MockResourceTransformations:
        def __init__(self):
            self._transformations = []

    class MockProviderResource(pulumi.ProviderResource, MockResourceTransformations):
        def __init__(self, name, provider_type, opts=None):
            super().__init__(provider_type, name, {}, opts)
            self.name = name
            self.provider_type = provider_type
            self.opts = opts
            MockResourceTransformations.__init__(self)

    class MockComponentResource(pulumi.ComponentResource, MockResourceTransformations):
        def __init__(self, resource_type, name, opts=None):
            super().__init__(resource_type, name, opts)
            MockResourceTransformations.__init__(self)

    # Patch the base ComponentResource
    original_component = pulumi.ComponentResource
    pulumi.ComponentResource = MockComponentResource

    mock_resource = Mock()
    mock_resource.state = {}
    
    pulumi.runtime.set_mocks(MockMonitor())
    yield
