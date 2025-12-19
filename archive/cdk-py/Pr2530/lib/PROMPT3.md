lint passed but synth and unit tests are failing.
synth logs:


The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "/home/runner/work/iac-test-automations/iac-test-automations/tap.py", line 12, in <module>
    TapStack(
  File "/home/runner/work/iac-test-automations/iac-test-automations/.venv/lib/python3.12/site-packages/jsii/_runtime.py", line 118, in __call__
    inst = super(JSIIMeta, cast(JSIIMeta, cls)).__call__(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/runner/work/iac-test-automations/iac-test-automations/lib/tap_stack.py", line 29, in __init__
    self.upload_lambda = self._create_lambda_function()
                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/runner/work/iac-test-automations/iac-test-automations/lib/tap_stack.py", line 127, in _create_lambda_function
    upload_function = _lambda.Function(
                      ^^^^^^^^^^^^^^^^^
  File "/home/runner/work/iac-test-automations/iac-test-automations/.venv/lib/python3.12/site-packages/jsii/_runtime.py", line 118, in __call__
    inst = super(JSIIMeta, cast(JSIIMeta, cls)).__call__(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/runner/work/iac-test-automations/iac-test-automations/.venv/lib/python3.12/site-packages/aws_cdk/aws_lambda/__init__.py", line 29372, in __init__
    jsii.create(self.__class__, self, [scope, id, props])
  File "/home/runner/work/iac-test-automations/iac-test-automations/.venv/lib/python3.12/site-packages/jsii/_kernel/__init__.py", line 334, in create
    response = self.provider.create(
               ^^^^^^^^^^^^^^^^^^^^^
  File "/home/runner/work/iac-test-automations/iac-test-automations/.venv/lib/python3.12/site-packages/jsii/_kernel/providers/process.py", line 365, in create
    return self._process.send(request, CreateResponse)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/runner/work/iac-test-automations/iac-test-automations/.venv/lib/python3.12/site-packages/jsii/_kernel/providers/process.py", line 342, in send
    raise RuntimeError(resp.error) from JavaScriptError(resp.stack)
RuntimeError: AWS_REGION environment variable is reserved by the lambda runtime and can not be set manually. See https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html

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



Unit tests logs:

                                     'description': None,
                                     'environment': {'$jsii.map': {'AWS_REGION': '${Token[AWS.Region.9]}',
                                                                   'BUCKET_NAME': '${Token[TOKEN.194]}',
                                                                   'SECRETS_ARN': '${Token[TOKEN.205]}'}},
                                     'environmentEncryption': None,
                                     'ephemeralStorageSize': None,
                                     'events': None,
                                     'filesystem': None,
                                     'functionName': None,
                                     'handler': 'upload_handler.lambda_handler',
                                     'initialPolicy': None,
                                     'insightsVersion': None,
                                     'ipv6AllowedForDualStack': None,
                                     'layers': None,
                                     'logFormat': None,
                                     'logGroup': None,
                                     'logRetention': {'$jsii.enum': 'aws-cdk-lib.aws_logs.RetentionDays/ONE_WEEK'},
                                     'logRetentionRetryOptions': None,
                                     'logRetentionRole': None,
                                     'loggingFormat': None,
                                     'maxEventAge': None,
                                     'memorySize': 256,
                                     'onFailure': None,
                                     'onSuccess': None,
                                     'paramsAndSecrets': None,
                                     'profiling': None,
                                     'profilingGroup': None,
                                     'recursiveLoop': None,
                                     'reservedConcurrentExecutions': 100,
                                     'retryAttempts': None,
                                     'role': <aws_cdk.aws_iam.Role object at 0x7fcecc0ca270>,
                                     'runtime': <aws_cdk.aws_lambda.Runtime object at 0x7fcecc039ac0>,
                                     'runtimeManagementMode': None,
                                     'securityGroups': None,
                                     'snapStart': None,
                                     'systemLogLevel': None,
                                     'systemLogLevelV2': None,
                                     'timeout': <aws_cdk.Duration object at 0x7fcecc0c8b30>,
                                     'tracing': None,
                                     'vpc': None,
                                     'vpcSubnets': None},
                            'fqn': 'aws-cdk-lib.aws_lambda.FunctionProps'}}],
 'fqn': 'aws-cdk-lib.aws_lambda.Function',
 'interfaces': ['constructs.IConstruct',
                'aws-cdk-lib.IResource',
                'aws-cdk-lib.aws_lambda.IFunction',
                'aws-cdk-lib.aws_ec2.IClientVpnConnectionHandler'],
 'overrides': []}
request    = CreateRequest(fqn='aws-cdk-lib.aws_lambda.Function', args=[<lib.tap_stack.TapStack object at 0x7fcecbd5ae10>, 'TapUploadFunction', {'$jsii.struct': {'fqn': 'aws-cdk-lib.aws_lambda.FunctionProps', 'data': {'maxEventAge': None, 'onFailure': None, 'onSuccess': None, 'retryAttempts': None, 'adotInstrumentation': None, 'allowAllIpv6Outbound': None, 'allowAllOutbound': None, 'allowPublicSubnet': None, 'applicationLogLevel': None, 'applicationLogLevelV2': None, 'architecture': None, 'codeSigningConfig': None, 'currentVersionOptions': None, 'deadLetterQueue': None, 'deadLetterQueueEnabled': None, 'deadLetterTopic': None, 'description': None, 'environment': {'$jsii.map': {'BUCKET_NAME': '${Token[TOKEN.194]}', 'SECRETS_ARN': '${Token[TOKEN.205]}', 'AWS_REGION': '${Token[AWS.Region.9]}'}}, 'environmentEncryption': None, 'ephemeralStorageSize': None, 'events': None, 'filesystem': None, 'functionName': None, 'initialPolicy': None, 'insightsVersion': None, 'ipv6AllowedForDualStack': None, 'layers': None, 'logFormat': None, 'loggingFormat': None, 'logGroup': None, 'logRetention': {'$jsii.enum': 'aws-cdk-lib.aws_logs.RetentionDays/ONE_WEEK'}, 'logRetentionRetryOptions': None, 'logRetentionRole': None, 'memorySize': 256, 'paramsAndSecrets': None, 'profiling': None, 'profilingGroup': None, 'recursiveLoop': None, 'reservedConcurrentExecutions': 100, 'role': <aws_cdk.aws_iam.Role object at 0x7fcecc0ca270>, 'runtimeManagementMode': None, 'securityGroups': None, 'snapStart': None, 'systemLogLevel': None, 'systemLogLevelV2': None, 'timeout': <aws_cdk.Duration object at 0x7fcecc0c8b30>, 'tracing': None, 'vpc': None, 'vpcSubnets': None, 'code': <aws_cdk.aws_lambda.AssetCode object at 0x7fcecc0389e0>, 'handler': 'upload_handler.lambda_handler', 'runtime': <aws_cdk.aws_lambda.Runtime object at 0x7fcecc039ac0>}}}], overrides=[], interfaces=['constructs.IConstruct', 'aws-cdk-lib.IResource', 'aws-cdk-lib.aws_lambda.IFunction', 'aws-cdk-lib.aws_ec2.IClientVpnConnectionHandler'])
resp       = _ErrorResponse(error='AWS_REGION environment variable is reserved by the lambda runtime and can not be set manually. See https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html', stack='ValidationError: AWS_REGION environment variable is reserved by the lambda runtime and can not be set manually. See https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html\n    at path [tap-test/TapUploadFunction] in aws-cdk-lib.aws_lambda.Function\n\n    at Kernel._Kernel_create (/tmp/tmpvdtdg5gy/lib/program.js:548:25)\n    at Kernel.create (/tmp/tmpvdtdg5gy/lib/program.js:218:93)\n    at KernelHost.processRequest (/tmp/tmpvdtdg5gy/lib/program.js:15464:36)\n    at KernelHost.run (/tmp/tmpvdtdg5gy/lib/program.js:15424:22)\n    at Immediate._onImmediate (/tmp/tmpvdtdg5gy/lib/program.js:15425:45)\n    at process.processImmediate (node:internal/timers:485:21)', name='ValidationError')
response_type = <class 'jsii._kernel.types.CreateResponse'>
self       = <jsii._kernel.providers.process._NodeProcess object at 0x7fcedfc07230>

.venv/lib/python3.12/site-packages/jsii/_kernel/providers/process.py:342: RuntimeError
================================ tests coverage ================================
_______________ coverage: platform linux, python 3.12.11-final-0 _______________

Name               Stmts   Miss Branch BrPart  Cover   Missing
--------------------------------------------------------------
lib/__init__.py        0      0      0      0   100%
lib/tap_stack.py      38     14      0      0    63%   32-35, 145, 151-247, 251-263
--------------------------------------------------------------
TOTAL                 38     14      0      0    63%
Coverage JSON written to file cov.json
Required test coverage of 20% reached. Total coverage: 63.16%
=========================== short test summary info ============================
FAILED tests/unit/test_tap_stack.py::test_s3_bucket_created - RuntimeError: AWS_REGION environment variable is reserved by the lambda runtime and can not be set manually. See https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html
FAILED tests/unit/test_tap_stack.py::test_lambda_function_created - RuntimeError: AWS_REGION environment variable is reserved by the lambda runtime and can not be set manually. See https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html
FAILED tests/unit/test_tap_stack.py::test_api_gateway_created - RuntimeError: AWS_REGION environment variable is reserved by the lambda runtime and can not be set manually. See https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html
FAILED tests/unit/test_tap_stack.py::test_secrets_manager_created - RuntimeError: AWS_REGION environment variable is reserved by the lambda runtime and can not be set manually. See https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html
========================= 4 failed in 61.37s (0:01:01) =========================
Error: Process completed with exit code 1.