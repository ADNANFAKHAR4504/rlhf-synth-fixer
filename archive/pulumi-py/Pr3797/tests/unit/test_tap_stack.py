import pytest
import pulumi
from lib.tap_stack import TapStack, TapStackArgs

class MyMocks(pulumi.runtime.Mocks):
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        return [args.name + '_id', args.inputs]
    def call(self, args: pulumi.runtime.MockCallArgs):
        return {}

pulumi.runtime.set_mocks(MyMocks())

def test_tap_stack():
    @pulumi.runtime.test
    def check_tap_stack():
        name = "test-tap-stack"
        args = TapStackArgs(
            environment_suffix="test",
            tags={"environment": "test"}
        )

        tap_stack = TapStack(
            name,
            args
        )

        assert tap_stack is not None
        assert tap_stack.environment_suffix == 'test'
        return {}

    check_tap_stack()