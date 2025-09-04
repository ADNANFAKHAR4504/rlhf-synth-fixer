Lint and synth both phases are failing in my pipeline here are the logs:
lint logs:

./scripts/lint.sh
  shell: /usr/bin/bash -e {0}
  env:
    NODE_VERSION: 22.17.0
    GO_VERSION: 1.23.12
    ENVIRONMENT_SUFFIX: pr2530
    S3_RELEASE_BUCKET_NAME: iac-rlhf-aws-release
    TERRAFORM_STATE_BUCKET: iac-rlhf-tf-states
    TERRAFORM_STATE_BUCKET_REGION: us-east-1
    TERRAFORM_STATE_BUCKET_KEY: 2530
    S3_PRODUCTION_BUCKET_NAME: iac-rlhf-production
    PULUMI_STATE_BUCKET: iac-rlhf-pulumi-states
    PULUMI_BUCKET_REGION: us-east-1
    PULUMI_CONFIG_PASSPHRASE: ***
    PULUMI_ORG: organization
    AWS_REGION: us-east-1
    GOCACHE: /home/runner/work/iac-test-automations/iac-test-automations/.cache/go-build
    GOMODCACHE: /home/runner/work/iac-test-automations/iac-test-automations/.cache/go-mod
    ARTIFACTS_FOUND: true
    pythonLocation: /opt/hostedtoolcache/Python/3.12.11/x64
    PKG_CONFIG_PATH: /opt/hostedtoolcache/Python/3.12.11/x64/lib/pkgconfig
    Python_ROOT_DIR: /opt/hostedtoolcache/Python/3.12.11/x64
    Python2_ROOT_DIR: /opt/hostedtoolcache/Python/3.12.11/x64
    Python3_ROOT_DIR: /opt/hostedtoolcache/Python/3.12.11/x64
    LD_LIBRARY_PATH: /opt/hostedtoolcache/Python/3.12.11/x64/lib
    PIPENV_VENV_IN_PROJECT: 1
🔍 Running Lint checks...
Running linting for platform: cdk, language: py
--- START PYLINT OUTPUT (Raw) ---
************* Module lib.tap_stack
lib/tap_stack.py:263:0: C0304: Final newline missing (missing-final-newline)
lib/tap_stack.py:263:0: C0328: Unexpected line ending format. There is 'CRLF' while it should be 'LF'. (unexpected-line-ending-format)
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
Your code has been rated at 5.07/10
--- END PYLINT OUTPUT (Raw) ---
Pylint command raw exit code: 0
Detected Pylint Score: 5.07/10
❌ Linting score 5.07/10 is less than 7.0. Linting failed.
Error: Process completed with exit code 1.

Synth Log:

                  │      '5242880'
                  ╰── 🔍 Failure reason(s):
                      ╰─ Value does not have the "$jsii.byref" key
      at Object.process (/tmp/tmpt3dqc6qg/lib/program.js:3949:19)
      at Kernel._Kernel_toSandbox (/tmp/tmpt3dqc6qg/lib/program.js:880:25)
      at /tmp/tmpt3dqc6qg/lib/program.js:896:37
      at Array.map (<anonymous>)
      at Kernel._Kernel_boxUnboxParameters (/tmp/tmpt3dqc6qg/lib/program.js:896:23)
      at Kernel._Kernel_toSandboxValues (/tmp/tmpt3dqc6qg/lib/program.js:884:101)
      at Kernel._Kernel_create (/tmp/tmpt3dqc6qg/lib/program.js:548:115)
      at Kernel.create (/tmp/tmpt3dqc6qg/lib/program.js:218:93)
      at KernelHost.processRequest (/tmp/tmpt3dqc6qg/lib/program.js:15464:36)
      at KernelHost.run (/tmp/tmpt3dqc6qg/lib/program.js:15424:22)

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "/home/runner/work/iac-test-automations/iac-test-automations/tap.py", line 12, in <module>
    TapStack(
  File "/home/runner/work/iac-test-automations/iac-test-automations/.venv/lib/python3.12/site-packages/jsii/_runtime.py", line 118, in __call__
    inst = super(JSIIMeta, cast(JSIIMeta, cls)).__call__(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/runner/work/iac-test-automations/iac-test-automations/lib/tap_stack.py", line 25, in __init__
    self.secrets = self._create_secrets()
                   ^^^^^^^^^^^^^^^^^^^^^^
  File "/home/runner/work/iac-test-automations/iac-test-automations/lib/tap_stack.py", line 72, in _create_secrets
    secrets = secretsmanager.Secret(
              ^^^^^^^^^^^^^^^^^^^^^^
  File "/home/runner/work/iac-test-automations/iac-test-automations/.venv/lib/python3.12/site-packages/jsii/_runtime.py", line 118, in __call__
    inst = super(JSIIMeta, cast(JSIIMeta, cls)).__call__(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/runner/work/iac-test-automations/iac-test-automations/.venv/lib/python3.12/site-packages/aws_cdk/aws_secretsmanager/__init__.py", line 4047, in __init__
    jsii.create(self.__class__, self, [scope, id, props])
  File "/home/runner/work/iac-test-automations/iac-test-automations/.venv/lib/python3.12/site-packages/jsii/_kernel/__init__.py", line 334, in create
    response = self.provider.create(
               ^^^^^^^^^^^^^^^^^^^^^
  File "/home/runner/work/iac-test-automations/iac-test-automations/.venv/lib/python3.12/site-packages/jsii/_kernel/providers/process.py", line 365, in create
    return self._process.send(request, CreateResponse)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/runner/work/iac-test-automations/iac-test-automations/.venv/lib/python3.12/site-packages/jsii/_kernel/providers/process.py", line 342, in send
    raise RuntimeError(resp.error) from JavaScriptError(resp.stack)
RuntimeError: Passed to parameter props of new aws-cdk-lib.aws_secretsmanager.Secret: Unable to deserialize value as aws-cdk-lib.aws_secretsmanager.SecretProps | undefined
├── 🛑 Failing value is an object
│      { '$jsii.struct': [Object] }
╰── 🔍 Failure reason(s):
    ╰─ Key 'secretObjectValue': Unable to deserialize value as map<aws-cdk-lib.SecretValue> | undefined
        ├── 🛑 Failing value is an object
        │      { '$jsii.map': [Object] }
        ╰── 🔍 Failure reason(s):
            ╰─ Key 'max_file_size': Unable to deserialize value as aws-cdk-lib.SecretValue
                ├── 🛑 Failing value is a string
                │      '5242880'
                ╰── 🔍 Failure reason(s):
                    ╰─ Value does not have the "$jsii.byref" key

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