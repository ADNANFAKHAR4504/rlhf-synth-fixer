Fix following errors :
Traceback (most recent call last):
File "/home/runner/work/iac-test-automations/iac-test-automations/tap.py", line 43, in <module>
TapStack(app, STACK_NAME, props=props)
File "/home/runner/work/iac-test-automations/iac-test-automations/.venv/lib/python3.12/site-packages/jsii/\_runtime.py", line 118, in **call**
inst = super(JSIIMeta, cast(JSIIMeta, cls)).**call**(\*args, \*\*kwargs)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
File "/home/runner/work/iac-test-automations/iac-test-automations/lib/tap_stack.py", line 70, in **init**
billing_mode=dynamodb.BillingMode.ON_DEMAND,
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AttributeError: type object 'BillingMode' has no attribute 'ON_DEMAND'
