Traceback (most recent call last):
  File "/home/rajendra/turing/iac-test-automations/tap.py", line 17, in <module>
    from lib.tap_stack import TapStack, TapStackProps
  File "/home/rajendra/turing/iac-test-automations/lib/tap_stack.py", line 15, in <module>
    from .metadata_stack import SecureInfrastructureStack
  File "/home/rajendra/turing/iac-test-automations/lib/metadata_stack.py", line 1, in <module>
    from aws_cdk import (
ImportError: cannot import name 'core' from 'aws_cdk' (/home/rajendra/.local/share/virtualenvs/iac-test-automations-DWKZ7rLf/lib/python3.12/site-packages/aws_cdk/__init__.py)
pipenv run python3 tap.py: Subprocess exited with error 1
rajendra@LAPTOP-0I9DS1G4:~/turing/iac-test-automations$ 

  self.metadata_stack = SecureInfrastructureStack(self, "SecureInfrastructureStack", env={'region': 'us-west-2'})
                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/rajendra/.local/share/virtualenvs/iac-test-automations-DWKZ7rLf/lib/python3.12/site-packages/jsii/_runtime.py", line 118, in __call__
    inst = super(JSIIMeta, cast(JSIIMeta, cls)).__call__(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/rajendra/turing/iac-test-automations/lib/metadata_stack.py", line 35, in __init__
    environment_encryption=_lambda.EnvironmentEncryption.KMS,
                           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AttributeError: module 'aws_cdk.aws_lambda' has no attribute 'EnvironmentEncryption'. Did you mean: 'EnvironmentOptions'?



ntimeError: Lambda Functions in a public subnet can NOT access the internet. If you are aware of this limitation and would still like to place the function in a public subnet, set `allowPublicSubnet` to true


  File "/home/runner/.local/share/virtualenvs/iac-test-automations-fMzROnXE/lib/python3.12/site-packages/jsii/_kernel/providers/process.py", line 342, in send
    raise RuntimeError(resp.error) from JavaScriptError(resp.stack)
RuntimeError: There are no 'Private' subnet groups in this VPC. Available types: Public
pipenv run python3 tap.py: Subprocess exited with error 1: no 