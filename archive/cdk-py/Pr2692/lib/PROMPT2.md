Synth and lint are failing:

Synth logs:
Project: platform=cdk, language=py
✅ CDK project detected, running CDK synth...

> tap@0.1.0 cdk:synth
> npx cdk synth --context environmentSuffix=${ENVIRONMENT_SUFFIX:-dev}

Warning:  aws-cdk-lib.aws_ec2.InstanceProps#keyName is deprecated.
  - Use `keyPair` instead - https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2-readme.html#using-an-existing-ec2-key-pair
  This API will be removed in the next major release.
Warning:  aws-cdk-lib.aws_ec2.InstanceProps#keyName is deprecated.
  - Use `keyPair` instead - https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2-readme.html#using-an-existing-ec2-key-pair
  This API will be removed in the next major release.
Warning:  aws-cdk-lib.aws_ec2.InstanceProps#keyName is deprecated.
  - Use `keyPair` instead - https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2-readme.html#using-an-existing-ec2-key-pair
  This API will be removed in the next major release.
Traceback (most recent call last):
  File "/home/runner/work/iac-test-automations/iac-test-automations/tap.py", line 15, in <module>
    TapStack(
  File "/home/runner/work/iac-test-automations/iac-test-automations/.venv/lib/python3.12/site-packages/jsii/_runtime.py", line 118, in __call__
    inst = super(JSIIMeta, cast(JSIIMeta, cls)).__call__(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/runner/work/iac-test-automations/iac-test-automations/lib/tap_stack.py", line 51, in __init__
    self.create_alb()
  File "/home/runner/work/iac-test-automations/iac-test-automations/lib/tap_stack.py", line 384, in create_alb
    elbv2.InstanceTarget(server.instance_id, 80)
    ^^^^^^^^^^^^^^^^^^^^
AttributeError: module 'aws_cdk.aws_elasticloadbalancingv2' has no attribute 'InstanceTarget'

NOTICES         (What's this? https://github.com/aws/aws-cdk/wiki/CLI-Notices)

34892	CDK CLI will collect telemetry data on command usage starting at version 2.1100.0 (unless opted out)

	Overview: We do not collect customer content and we anonymize the
	          telemetry we do collect. See the attached issue for more
	          information on what data is collected, why, and how to
	          opt-out. Telemetry will NOT be collected for any CDK CLI
	          version prior to version 2.1100.0 - regardless of
	          opt-in/out. You can also preview the telemetry we will start
	          collecting by logging it to a local file, by adding
	          `--unstable=telemetry --telemetry-file=my/local/file` to any
	          `cdk` command.

	Affected versions: cli: ^2.0.0

	More information at: https://github.com/aws/aws-cdk/issues/34892


If you don’t want to see a notice anymore, use "cdk acknowledge <id>". For example, "cdk acknowledge 34892".
pipenv run python3 tap.py: Subprocess exited with error 1
Error: Process completed with exit code 1.

lint logs:
 Running Lint checks...
Running linting for platform: cdk, language: py
--- START PYLINT OUTPUT (Raw) ---
************* Module lib.tap_stack
lib/tap_stack.py:629:0: C0304: Final newline missing (missing-final-newline)
lib/tap_stack.py:629:0: C0328: Unexpected line ending format. There is 'CRLF' while it should be 'LF'. (unexpected-line-ending-format)
lib/tap_stack.py:384:16: E1101: Module 'aws_cdk.aws_elasticloadbalancingv2' has no 'InstanceTarget' member (no-member)
************* Module tests.integration.test_tap_stack
tests/integration/test_tap_stack.py:14:0: W0311: Bad indentation. Found 2 spaces, expected 4 (bad-indentation)
tests/integration/test_tap_stack.py:15:0: W0311: Bad indentation. Found 4 spaces, expected 8 (bad-indentation)
tests/integration/test_tap_stack.py:17:0: W0311: Bad indentation. Found 2 spaces, expected 4 (bad-indentation)
tests/integration/test_tap_stack.py:24:0: W0311: Bad indentation. Found 2 spaces, expected 4 (bad-indentation)
tests/integration/test_tap_stack.py:26:0: W0311: Bad indentation. Found 2 spaces, expected 4 (bad-indentation)
tests/integration/test_tap_stack.py:27:0: W0311: Bad indentation. Found 4 spaces, expected 8 (bad-indentation)
tests/integration/test_tap_stack.py:29:0: W0311: Bad indentation. Found 2 spaces, expected 4 (bad-indentation)
tests/integration/test_tap_stack.py:30:0: W0311: Bad indentation. Found 2 spaces, expected 4 (bad-indentation)
tests/integration/test_tap_stack.py:32:0: W0311: Bad indentation. Found 4 spaces, expected 8 (bad-indentation)
************* Module tests.unit.test_tap_stack
tests/unit/test_tap_stack.py:16:0: W0311: Bad indentation. Found 2 spaces, expected 4 (bad-indentation)
tests/unit/test_tap_stack.py:18:0: W0311: Bad indentation. Found 2 spaces, expected 4 (bad-indentation)
tests/unit/test_tap_stack.py:19:0: W0311: Bad indentation. Found 4 spaces, expected 8 (bad-indentation)
tests/unit/test_tap_stack.py:20:0: W0311: Bad indentation. Found 4 spaces, expected 8 (bad-indentation)
tests/unit/test_tap_stack.py:22:0: W0311: Bad indentation. Found 2 spaces, expected 4 (bad-indentation)
tests/unit/test_tap_stack.py:23:0: W0311: Bad indentation. Found 2 spaces, expected 4 (bad-indentation)
tests/unit/test_tap_stack.py:25:0: W0311: Bad indentation. Found 4 spaces, expected 8 (bad-indentation)
tests/unit/test_tap_stack.py:26:0: W0311: Bad indentation. Found 4 spaces, expected 8 (bad-indentation)
tests/unit/test_tap_stack.py:28:0: W0311: Bad indentation. Found 4 spaces, expected 8 (bad-indentation)
tests/unit/test_tap_stack.py:31:0: W0311: Bad indentation. Found 4 spaces, expected 8 (bad-indentation)
tests/unit/test_tap_stack.py:32:0: W0311: Bad indentation. Found 4 spaces, expected 8 (bad-indentation)
tests/unit/test_tap_stack.py:36:0: W0311: Bad indentation. Found 2 spaces, expected 4 (bad-indentation)
tests/unit/test_tap_stack.py:37:0: W0311: Bad indentation. Found 2 spaces, expected 4 (bad-indentation)
tests/unit/test_tap_stack.py:39:0: W0311: Bad indentation. Found 4 spaces, expected 8 (bad-indentation)
tests/unit/test_tap_stack.py:40:0: W0311: Bad indentation. Found 4 spaces, expected 8 (bad-indentation)
tests/unit/test_tap_stack.py:43:0: W0311: Bad indentation. Found 4 spaces, expected 8 (bad-indentation)
tests/unit/test_tap_stack.py:44:0: W0311: Bad indentation. Found 4 spaces, expected 8 (bad-indentation)
tests/unit/test_tap_stack.py:48:0: W0311: Bad indentation. Found 2 spaces, expected 4 (bad-indentation)
tests/unit/test_tap_stack.py:49:0: W0311: Bad indentation. Found 2 spaces, expected 4 (bad-indentation)
tests/unit/test_tap_stack.py:51:0: W0311: Bad indentation. Found 4 spaces, expected 8 (bad-indentation)
tests/unit/test_tap_stack.py:26:12: E1121: Too many positional arguments for constructor call (too-many-function-args)

-----------------------------------
Your code has been rated at 6.55/10
--- END PYLINT OUTPUT (Raw) ---
Pylint command raw exit code: 0
Detected Pylint Score: 6.55/10
❌ Linting score 6.55/10 is less than 7.0. Linting failed.
Error: Process completed with exit code 1.

Fix these issues.