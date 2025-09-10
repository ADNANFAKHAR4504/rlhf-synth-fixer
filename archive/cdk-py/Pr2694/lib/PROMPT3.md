Synth and unit tests are still failing with below error logs:
synth logs:

Project: platform=cdk, language=py
✅ CDK project detected, running CDK synth...

> tap@0.1.0 cdk:synth
> npx cdk synth --context environmentSuffix=${ENVIRONMENT_SUFFIX:-dev}

[Error at /TapStack] Could not assume role in target account using current credentials (which are for account ***) User: *** is not authorized to perform: sts:AssumeRole on resource: arn:aws:iam::123456789012:role/cdk-hnb659fds-lookup-role-123456789012-us-east-1 . Please make sure that this role exists in the account. If it doesn't exist, (re)-bootstrap the environment with the right '--trust', using the latest version of the CDK CLI.

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
Found errors
Error: Process completed with exit code 1.


Unit test logs:
Run ./scripts/unit-tests.sh
  ./scripts/unit-tests.sh
  shell: /usr/bin/bash -e {0}
  env:
    NODE_VERSION: 22.17.0
    GO_VERSION: 1.23.12
    ENVIRONMENT_SUFFIX: pr2694
    S3_RELEASE_BUCKET_NAME: iac-rlhf-aws-release
    TERRAFORM_STATE_BUCKET: iac-rlhf-tf-states
    TERRAFORM_STATE_BUCKET_REGION: us-east-1
    TERRAFORM_STATE_BUCKET_KEY: 2694
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
Project: platform=cdk, language=py
✅ Python project detected, running pytest unit tests...
============================= test session starts ==============================
platform linux -- Python 3.12.11, pytest-8.4.1, pluggy-1.6.0 -- /home/runner/work/iac-test-automations/iac-test-automations/.venv/bin/python
cachedir: .pytest_cache
rootdir: /home/runner/work/iac-test-automations/iac-test-automations
configfile: pytest.ini
plugins: testdox-3.1.0, typeguard-2.13.3, env-1.1.5, cov-6.2.1
collecting ... collected 5 items

tests/unit/test_tap_stack.py::TestTapStack::test_lambda_function_creation FAILED
tests/unit/test_tap_stack.py::TestTapStack::test_rds_instance_creation FAILED
tests/unit/test_tap_stack.py::TestTapStack::test_s3_bucket_creation FAILED
tests/unit/test_tap_stack.py::TestTapStack::test_stack_creation PASSED
tests/unit/test_tap_stack.py::TestTapStack::test_vpc_creation FAILED

=================================== FAILURES ===================================
__________________ TestTapStack.test_lambda_function_creation __________________
jsii.errors.JavaScriptError: 
  @jsii/kernel.RuntimeError: AssertionError: Template is undeployable, these resources have a dependency cycle: TapRDSSecurityGroup658D899C -> TapLambdaSecurityGroup0CA577B5 -> TapRDSSecurityGroup658D899C:
  
  {
    "TapRDSSecurityGroup658D899C": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS MySQL instance",
        "SecurityGroupEgress": [
          {
            "CidrIp": "255.255.255.255/32",
            "Description": "Disallow all traffic",
            "FromPort": 252,
            "IpProtocol": "icmp",
            "ToPort": 86
          }
        ],
        "SecurityGroupIngress": [
          {
            "Description": "Allow Lambda to connect to MySQL",
            "FromPort": 3306,
            "IpProtocol": "tcp",
            "SourceSecurityGroupId": {
              "Fn::GetAtt": [
                "TapLambdaSecurityGroup0CA577B5",
                "GroupId"
              ]
            },
            "ToPort": 3306
          }
        ],
        "VpcId": {
          "Ref": "TapVPC2E14FA7B"
        }
      }
    },
    "TapLambdaSecurityGroup0CA577B5": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Lambda functions",
        "SecurityGroupEgress": [
          {
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS for AWS API calls",
            "FromPort": 443,
            "IpProtocol": "tcp",
            "ToPort": 443
          },
          {
            "Description": "Allow MySQL connection to RDS",
            "DestinationSecurityGroupId": {
              "Fn::GetAtt": [
                "TapRDSSecurityGroup658D899C",
                "GroupId"
              ]
            },
            "FromPort": 3306,
            "IpProtocol": "tcp",
            "ToPort": 3306
          }
        ],
        "VpcId": {
          "Ref": "TapVPC2E14FA7B"
        }
      }
    }
  }
      at Kernel._Kernel_ensureSync (/tmp/tmp_xvrjzrk/lib/program.js:927:23)
      at Kernel.sinvoke (/tmp/tmp_xvrjzrk/lib/program.js:315:102)
      at KernelHost.processRequest (/tmp/tmp_xvrjzrk/lib/program.js:15464:36)
      at KernelHost.run (/tmp/tmp_xvrjzrk/lib/program.js:15424:22)
      at Immediate._onImmediate (/tmp/tmp_xvrjzrk/lib/program.js:15425:45)
      at process.processImmediate (node:internal/timers:485:21)

The above exception was the direct cause of the following exception:

self = <tests.unit.test_tap_stack.TestTapStack testMethod=test_lambda_function_creation>

    def test_lambda_function_creation(self):
        """Test Lambda function creation."""
        stack = TapStack(self.app, "TestStack", env=self.env)
>       template = cdk.assertions.Template.from_stack(stack)
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

self       = <tests.unit.test_tap_stack.TestTapStack testMethod=test_lambda_function_creation>
stack      = <lib.tap_stack.TapStack object at 0x7ffb4cc1de80>

tests/unit/test_tap_stack.py:70: 
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 
.venv/lib/python3.12/site-packages/aws_cdk/assertions/__init__.py:1568: in from_stack
    return typing.cast("Template", jsii.sinvoke(cls, "fromStack", [stack, template_parsing_options]))
                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        cls        = <class 'aws_cdk.assertions.Template'>
        skip_cyclical_dependencies_check = None
        stack      = <lib.tap_stack.TapStack object at 0x7ffb4cc1de80>
        template_parsing_options = TemplateParsingOptions()
        type_hints = {'return': <class 'NoneType'>,
 'skip_cyclical_dependencies_check': typing.Optional[bool],
 'stack': <class 'aws_cdk.Stack'>}
.venv/lib/python3.12/site-packages/jsii/_kernel/__init__.py:149: in wrapped
    return _recursize_dereference(kernel, fn(kernel, *args, **kwargs))
                                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^
        args       = (<class 'aws_cdk.assertions.Template'>,
 'fromStack',
 [<lib.tap_stack.TapStack object at 0x7ffb4cc1de80>, TemplateParsingOptions()])
        fn         = <function Kernel.sinvoke at 0x7ffb5f5639c0>
        kernel     = <jsii._kernel.Kernel object at 0x7ffb5f8679b0>
        kwargs     = {}
.venv/lib/python3.12/site-packages/jsii/_kernel/__init__.py:418: in sinvoke
    response = self.provider.sinvoke(
        args       = [<lib.tap_stack.TapStack object at 0x7ffb4cc1de80>, TemplateParsingOptions()]
        klass      = <class 'aws_cdk.assertions.Template'>
        method     = 'fromStack'
        self       = <jsii._kernel.Kernel object at 0x7ffb5f8679b0>
.venv/lib/python3.12/site-packages/jsii/_kernel/providers/process.py:383: in sinvoke
    return self._process.send(request, InvokeResponse)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        request    = StaticInvokeRequest(fqn='aws-cdk-lib.assertions.Template', method='fromStack', args=[<lib.tap_stack.TapStack object at 0x7ffb4cc1de80>, {'$jsii.struct': {'fqn': 'aws-cdk-lib.assertions.TemplateParsingOptions', 'data': {'skipCyclicalDependenciesCheck': None}}}])
        self       = <jsii._kernel.providers.process.ProcessProvider object at 0x7ffb5f867e30>
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 

self = <jsii._kernel.providers.process._NodeProcess object at 0x7ffb5f55cfb0>
request = StaticInvokeRequest(fqn='aws-cdk-lib.assertions.Template', method='fromStack', args=[<lib.tap_stack.TapStack object at...i.struct': {'fqn': 'aws-cdk-lib.assertions.TemplateParsingOptions', 'data': {'skipCyclicalDependenciesCheck': None}}}])
response_type = <class 'jsii._kernel.types.InvokeResponse'>

    def send(
        self, request: KernelRequest, response_type: Type[KernelResponse]
    ) -> KernelResponse:
        req_dict = self._serializer.unstructure(request)
        data = json.dumps(req_dict, default=jdefault).encode("utf8")
    
        # Send our data, ensure that it is framed with a trailing \n
        assert self._process.stdin is not None
        self._process.stdin.write(b"%b\n" % (data,))
        self._process.stdin.flush()
    
        resp: _ProcessResponse = self._serializer.structure(
            self._next_message(), _ProcessResponse
        )
    
        if isinstance(resp, _OkayResponse):
            return self._serializer.structure(resp.ok, response_type)
        elif isinstance(resp, _CallbackResponse):
            return resp.callback
        else:
            if resp.name == ErrorType.JSII_FAULT.value:
                raise JSIIError(resp.error) from JavaScriptError(resp.stack)
>           raise RuntimeError(resp.error) from JavaScriptError(resp.stack)
E           RuntimeError: AssertionError: Template is undeployable, these resources have a dependency cycle: TapRDSSecurityGroup658D899C -> TapLambdaSecurityGroup0CA577B5 -> TapRDSSecurityGroup658D899C:
E           
E           {
E             "TapRDSSecurityGroup658D899C": {
E               "Type": "AWS::EC2::SecurityGroup",
E               "Properties": {
E                 "GroupDescription": "Security group for RDS MySQL instance",
E                 "SecurityGroupEgress": [
E                   {
E                     "CidrIp": "255.255.255.255/32",
E                     "Description": "Disallow all traffic",
E                     "FromPort": 252,
E                     "IpProtocol": "icmp",
E                     "ToPort": 86
E                   }
E                 ],
E                 "SecurityGroupIngress": [
E                   {
E                     "Description": "Allow Lambda to connect to MySQL",
E                     "FromPort": 3306,
E                     "IpProtocol": "tcp",
E                     "SourceSecurityGroupId": {
E                       "Fn::GetAtt": [
E                         "TapLambdaSecurityGroup0CA577B5",
E                         "GroupId"
E                       ]
E                     },
E                     "ToPort": 3306
E                   }
E                 ],
E                 "VpcId": {
E                   "Ref": "TapVPC2E14FA7B"
E                 }
E               }
E             },
E             "TapLambdaSecurityGroup0CA577B5": {
E               "Type": "AWS::EC2::SecurityGroup",
E               "Properties": {
E                 "GroupDescription": "Security group for Lambda functions",
E                 "SecurityGroupEgress": [
E                   {
E                     "CidrIp": "0.0.0.0/0",
E                     "Description": "Allow HTTPS for AWS API calls",
E                     "FromPort": 443,
E                     "IpProtocol": "tcp",
E                     "ToPort": 443
E                   },
E                   {
E                     "Description": "Allow MySQL connection to RDS",
E                     "DestinationSecurityGroupId": {
E                       "Fn::GetAtt": [
E                         "TapRDSSecurityGroup658D899C",
E                         "GroupId"
E                       ]
E                     },
E                     "FromPort": 3306,
E                     "IpProtocol": "tcp",
E                     "ToPort": 3306
E                   }
E                 ],
E                 "VpcId": {
E                   "Ref": "TapVPC2E14FA7B"
E                 }
E               }
E             }
E           }

data       = (b'{"fqn": "aws-cdk-lib.assertions.Template", "method": "fromStack", "args": [{'
 b'"$jsii.byref": "aws-cdk-lib.Stack@10001"}, {"$jsii.struct": {"fqn": "aws-cdk'
 b'-lib.assertions.TemplateParsingOptions", "data": {"skipCyclicalDependenciesC'
 b'heck": null}}}], "api": "sinvoke"}')
req_dict   = {'api': 'sinvoke',
 'args': [<lib.tap_stack.TapStack object at 0x7ffb4cc1de80>,
          {'$jsii.struct': {'data': {'skipCyclicalDependenciesCheck': None},
                            'fqn': 'aws-cdk-lib.assertions.TemplateParsingOptions'}}],
 'fqn': 'aws-cdk-lib.assertions.Template',
 'method': 'fromStack'}
request    = StaticInvokeRequest(fqn='aws-cdk-lib.assertions.Template', method='fromStack', args=[<lib.tap_stack.TapStack object at 0x7ffb4cc1de80>, {'$jsii.struct': {'fqn': 'aws-cdk-lib.assertions.TemplateParsingOptions', 'data': {'skipCyclicalDependenciesCheck': None}}}])
resp       = _ErrorResponse(error='AssertionError: Template is undeployable, these resources have a dependency cycle: TapRDSSecurityGroup658D899C -> TapLambdaSecurityGroup0CA577B5 -> TapRDSSecurityGroup658D899C:\n\n{\n  "TapRDSSecurityGroup658D899C": {\n    "Type": "AWS::EC2::SecurityGroup",\n    "Properties": {\n      "GroupDescription": "Security group for RDS MySQL instance",\n      "SecurityGroupEgress": [\n        {\n          "CidrIp": "255.255.255.255/32",\n          "Description": "Disallow all traffic",\n          "FromPort": 252,\n          "IpProtocol": "icmp",\n          "ToPort": 86\n        }\n      ],\n      "SecurityGroupIngress": [\n        {\n          "Description": "Allow Lambda to connect to MySQL",\n          "FromPort": 3306,\n          "IpProtocol": "tcp",\n          "SourceSecurityGroupId": {\n            "Fn::GetAtt": [\n              "TapLambdaSecurityGroup0CA577B5",\n              "GroupId"\n            ]\n          },\n          "ToPort": 3306\n        }\n      ],\n      "VpcId": {\n        "Ref": "TapVPC2E14FA7B"\n      }\n    }\n  },\n  "TapLambdaSecurityGroup0CA577B5": {\n    "Type": "AWS::EC2::SecurityGroup",\n    "Properties": {\n      "GroupDescription": "Security group for Lambda functions",\n      "SecurityGroupEgress": [\n        {\n          "CidrIp": "0.0.0.0/0",\n          "Description": "Allow HTTPS for AWS API calls",\n          "FromPort": 443,\n          "IpProtocol": "tcp",\n          "ToPort": 443\n        },\n        {\n          "Description": "Allow MySQL connection to RDS",\n          "DestinationSecurityGroupId": {\n            "Fn::GetAtt": [\n              "TapRDSSecurityGroup658D899C",\n              "GroupId"\n            ]\n          },\n          "FromPort": 3306,\n          "IpProtocol": "tcp",\n          "ToPort": 3306\n        }\n      ],\n      "VpcId": {\n        "Ref": "TapVPC2E14FA7B"\n      }\n    }\n  }\n}', stack='@jsii/kernel.RuntimeError: AssertionError: Template is undeployable, these resources have a dependency cycle: TapRDSSecurityGroup658D899C -> TapLambdaSecurityGroup0CA577B5 -> TapRDSSecurityGroup658D899C:\n\n{\n  "TapRDSSecurityGroup658D899C": {\n    "Type": "AWS::EC2::SecurityGroup",\n    "Properties": {\n      "GroupDescription": "Security group for RDS MySQL instance",\n      "SecurityGroupEgress": [\n        {\n          "CidrIp": "255.255.255.255/32",\n          "Description": "Disallow all traffic",\n          "FromPort": 252,\n          "IpProtocol": "icmp",\n          "ToPort": 86\n        }\n      ],\n      "SecurityGroupIngress": [\n        {\n          "Description": "Allow Lambda to connect to MySQL",\n          "FromPort": 3306,\n          "IpProtocol": "tcp",\n          "SourceSecurityGroupId": {\n            "Fn::GetAtt": [\n              "TapLambdaSecurityGroup0CA577B5",\n              "GroupId"\n            ]\n          },\n          "ToPort": 3306\n        }\n      ],\n      "VpcId": {\n        "Ref": "TapVPC2E14FA7B"\n      }\n    }\n  },\n  "TapLambdaSecurityGroup0CA577B5": {\n    "Type": "AWS::EC2::SecurityGroup",\n    "Properties": {\n      "GroupDescription": "Security group for Lambda functions",\n      "SecurityGroupEgress": [\n        {\n          "CidrIp": "0.0.0.0/0",\n          "Description": "Allow HTTPS for AWS API calls",\n          "FromPort": 443,\n          "IpProtocol": "tcp",\n          "ToPort": 443\n        },\n        {\n          "Description": "Allow MySQL connection to RDS",\n          "DestinationSecurityGroupId": {\n            "Fn::GetAtt": [\n              "TapRDSSecurityGroup658D899C",\n              "GroupId"\n            ]\n          },\n          "FromPort": 3306,\n          "IpProtocol": "tcp",\n          "ToPort": 3306\n        }\n      ],\n      "VpcId": {\n        "Ref": "TapVPC2E14FA7B"\n      }\n    }\n  }\n}\n    at Kernel._Kernel_ensureSync (/tmp/tmp_xvrjzrk/lib/program.js:927:23)\n    at Kernel.sinvoke (/tmp/tmp_xvrjzrk/lib/program.js:315:102)\n    at KernelHost.processRequest (/tmp/tmp_xvrjzrk/lib/program.js:15464:36)\n    at KernelHost.run (/tmp/tmp_xvrjzrk/lib/program.js:15424:22)\n    at Immediate._onImmediate (/tmp/tmp_xvrjzrk/lib/program.js:15425:45)\n    at process.processImmediate (node:internal/timers:485:21)', name='@jsii/kernel.RuntimeError')
response_type = <class 'jsii._kernel.types.InvokeResponse'>
self       = <jsii._kernel.providers.process._NodeProcess object at 0x7ffb5f55cfb0>

.venv/lib/python3.12/site-packages/jsii/_kernel/providers/process.py:342: RuntimeError
___________________ TestTapStack.test_rds_instance_creation ____________________
jsii.errors.JavaScriptError: 
  @jsii/kernel.RuntimeError: AssertionError: Template is undeployable, these resources have a dependency cycle: TapRDSSecurityGroup658D899C -> TapLambdaSecurityGroup0CA577B5 -> TapRDSSecurityGroup658D899C:
  
  {
    "TapRDSSecurityGroup658D899C": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS MySQL instance",
        "SecurityGroupEgress": [
          {
            "CidrIp": "255.255.255.255/32",
            "Description": "Disallow all traffic",
            "FromPort": 252,
            "IpProtocol": "icmp",
            "ToPort": 86
          }
        ],
        "SecurityGroupIngress": [
          {
            "Description": "Allow Lambda to connect to MySQL",
            "FromPort": 3306,
            "IpProtocol": "tcp",
            "SourceSecurityGroupId": {
              "Fn::GetAtt": [
                "TapLambdaSecurityGroup0CA577B5",
                "GroupId"
              ]
            },
            "ToPort": 3306
          }
        ],
        "VpcId": {
          "Ref": "TapVPC2E14FA7B"
        }
      }
    },
    "TapLambdaSecurityGroup0CA577B5": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Lambda functions",
        "SecurityGroupEgress": [
          {
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS for AWS API calls",
            "FromPort": 443,
            "IpProtocol": "tcp",
            "ToPort": 443
          },
          {
            "Description": "Allow MySQL connection to RDS",
            "DestinationSecurityGroupId": {
              "Fn::GetAtt": [
                "TapRDSSecurityGroup658D899C",
                "GroupId"
              ]
            },
            "FromPort": 3306,
            "IpProtocol": "tcp",
            "ToPort": 3306
          }
        ],
        "VpcId": {
          "Ref": "TapVPC2E14FA7B"
        }
      }
    }
  }
      at Kernel._Kernel_ensureSync (/tmp/tmp_xvrjzrk/lib/program.js:927:23)
      at Kernel.sinvoke (/tmp/tmp_xvrjzrk/lib/program.js:315:102)
      at KernelHost.processRequest (/tmp/tmp_xvrjzrk/lib/program.js:15464:36)
      at KernelHost.run (/tmp/tmp_xvrjzrk/lib/program.js:15424:22)
      at Immediate._onImmediate (/tmp/tmp_xvrjzrk/lib/program.js:15425:45)
      at process.processImmediate (node:internal/timers:485:21)

The above exception was the direct cause of the following exception:

self = <tests.unit.test_tap_stack.TestTapStack testMethod=test_rds_instance_creation>

    def test_rds_instance_creation(self):
        """Test RDS instance creation."""
        stack = TapStack(self.app, "TestStack", env=self.env)
>       template = cdk.assertions.Template.from_stack(stack)
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

self       = <tests.unit.test_tap_stack.TestTapStack testMethod=test_rds_instance_creation>
stack      = <lib.tap_stack.TapStack object at 0x7ffb4cac4530>

tests/unit/test_tap_stack.py:57: 
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 
.venv/lib/python3.12/site-packages/aws_cdk/assertions/__init__.py:1568: in from_stack
    return typing.cast("Template", jsii.sinvoke(cls, "fromStack", [stack, template_parsing_options]))
                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        cls        = <class 'aws_cdk.assertions.Template'>
        skip_cyclical_dependencies_check = None
        stack      = <lib.tap_stack.TapStack object at 0x7ffb4cac4530>
        template_parsing_options = TemplateParsingOptions()
        type_hints = {'return': <class 'NoneType'>,
 'skip_cyclical_dependencies_check': typing.Optional[bool],
 'stack': <class 'aws_cdk.Stack'>}
.venv/lib/python3.12/site-packages/jsii/_kernel/__init__.py:149: in wrapped
    return _recursize_dereference(kernel, fn(kernel, *args, **kwargs))
                                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^
        args       = (<class 'aws_cdk.assertions.Template'>,
 'fromStack',
 [<lib.tap_stack.TapStack object at 0x7ffb4cac4530>, TemplateParsingOptions()])
        fn         = <function Kernel.sinvoke at 0x7ffb5f5639c0>
        kernel     = <jsii._kernel.Kernel object at 0x7ffb5f8679b0>
        kwargs     = {}
.venv/lib/python3.12/site-packages/jsii/_kernel/__init__.py:418: in sinvoke
    response = self.provider.sinvoke(
        args       = [<lib.tap_stack.TapStack object at 0x7ffb4cac4530>, TemplateParsingOptions()]
        klass      = <class 'aws_cdk.assertions.Template'>
        method     = 'fromStack'
        self       = <jsii._kernel.Kernel object at 0x7ffb5f8679b0>
.venv/lib/python3.12/site-packages/jsii/_kernel/providers/process.py:383: in sinvoke
    return self._process.send(request, InvokeResponse)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        request    = StaticInvokeRequest(fqn='aws-cdk-lib.assertions.Template', method='fromStack', args=[<lib.tap_stack.TapStack object at 0x7ffb4cac4530>, {'$jsii.struct': {'fqn': 'aws-cdk-lib.assertions.TemplateParsingOptions', 'data': {'skipCyclicalDependenciesCheck': None}}}])
        self       = <jsii._kernel.providers.process.ProcessProvider object at 0x7ffb5f867e30>
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 

self = <jsii._kernel.providers.process._NodeProcess object at 0x7ffb5f55cfb0>
request = StaticInvokeRequest(fqn='aws-cdk-lib.assertions.Template', method='fromStack', args=[<lib.tap_stack.TapStack object at...i.struct': {'fqn': 'aws-cdk-lib.assertions.TemplateParsingOptions', 'data': {'skipCyclicalDependenciesCheck': None}}}])
response_type = <class 'jsii._kernel.types.InvokeResponse'>

    def send(
        self, request: KernelRequest, response_type: Type[KernelResponse]
    ) -> KernelResponse:
        req_dict = self._serializer.unstructure(request)
        data = json.dumps(req_dict, default=jdefault).encode("utf8")
    
        # Send our data, ensure that it is framed with a trailing \n
        assert self._process.stdin is not None
        self._process.stdin.write(b"%b\n" % (data,))
        self._process.stdin.flush()
    
        resp: _ProcessResponse = self._serializer.structure(
            self._next_message(), _ProcessResponse
        )
    
        if isinstance(resp, _OkayResponse):
            return self._serializer.structure(resp.ok, response_type)
        elif isinstance(resp, _CallbackResponse):
            return resp.callback
        else:
            if resp.name == ErrorType.JSII_FAULT.value:
                raise JSIIError(resp.error) from JavaScriptError(resp.stack)
>           raise RuntimeError(resp.error) from JavaScriptError(resp.stack)
E           RuntimeError: AssertionError: Template is undeployable, these resources have a dependency cycle: TapRDSSecurityGroup658D899C -> TapLambdaSecurityGroup0CA577B5 -> TapRDSSecurityGroup658D899C:
E           
E           {
E             "TapRDSSecurityGroup658D899C": {
E               "Type": "AWS::EC2::SecurityGroup",
E               "Properties": {
E                 "GroupDescription": "Security group for RDS MySQL instance",
E                 "SecurityGroupEgress": [
E                   {
E                     "CidrIp": "255.255.255.255/32",
E                     "Description": "Disallow all traffic",
E                     "FromPort": 252,
E                     "IpProtocol": "icmp",
E                     "ToPort": 86
E                   }
E                 ],
E                 "SecurityGroupIngress": [
E                   {
E                     "Description": "Allow Lambda to connect to MySQL",
E                     "FromPort": 3306,
E                     "IpProtocol": "tcp",
E                     "SourceSecurityGroupId": {
E                       "Fn::GetAtt": [
E                         "TapLambdaSecurityGroup0CA577B5",
E                         "GroupId"
E                       ]
E                     },
E                     "ToPort": 3306
E                   }
E                 ],
E                 "VpcId": {
E                   "Ref": "TapVPC2E14FA7B"
E                 }
E               }
E             },
E             "TapLambdaSecurityGroup0CA577B5": {
E               "Type": "AWS::EC2::SecurityGroup",
E               "Properties": {
E                 "GroupDescription": "Security group for Lambda functions",
E                 "SecurityGroupEgress": [
E                   {
E                     "CidrIp": "0.0.0.0/0",
E                     "Description": "Allow HTTPS for AWS API calls",
E                     "FromPort": 443,
E                     "IpProtocol": "tcp",
E                     "ToPort": 443
E                   },
E                   {
E                     "Description": "Allow MySQL connection to RDS",
E                     "DestinationSecurityGroupId": {
E                       "Fn::GetAtt": [
E                         "TapRDSSecurityGroup658D899C",
E                         "GroupId"
E                       ]
E                     },
E                     "FromPort": 3306,
E                     "IpProtocol": "tcp",
E                     "ToPort": 3306
E                   }
E                 ],
E                 "VpcId": {
E                   "Ref": "TapVPC2E14FA7B"
E                 }
E               }
E             }
E           }

data       = (b'{"fqn": "aws-cdk-lib.assertions.Template", "method": "fromStack", "args": [{'
 b'"$jsii.byref": "aws-cdk-lib.Stack@10050"}, {"$jsii.struct": {"fqn": "aws-cdk'
 b'-lib.assertions.TemplateParsingOptions", "data": {"skipCyclicalDependenciesC'
 b'heck": null}}}], "api": "sinvoke"}')
req_dict   = {'api': 'sinvoke',
 'args': [<lib.tap_stack.TapStack object at 0x7ffb4cac4530>,
          {'$jsii.struct': {'data': {'skipCyclicalDependenciesCheck': None},
                            'fqn': 'aws-cdk-lib.assertions.TemplateParsingOptions'}}],
 'fqn': 'aws-cdk-lib.assertions.Template',
 'method': 'fromStack'}
request    = StaticInvokeRequest(fqn='aws-cdk-lib.assertions.Template', method='fromStack', args=[<lib.tap_stack.TapStack object at 0x7ffb4cac4530>, {'$jsii.struct': {'fqn': 'aws-cdk-lib.assertions.TemplateParsingOptions', 'data': {'skipCyclicalDependenciesCheck': None}}}])
resp       = _ErrorResponse(error='AssertionError: Template is undeployable, these resources have a dependency cycle: TapRDSSecurityGroup658D899C -> TapLambdaSecurityGroup0CA577B5 -> TapRDSSecurityGroup658D899C:\n\n{\n  "TapRDSSecurityGroup658D899C": {\n    "Type": "AWS::EC2::SecurityGroup",\n    "Properties": {\n      "GroupDescription": "Security group for RDS MySQL instance",\n      "SecurityGroupEgress": [\n        {\n          "CidrIp": "255.255.255.255/32",\n          "Description": "Disallow all traffic",\n          "FromPort": 252,\n          "IpProtocol": "icmp",\n          "ToPort": 86\n        }\n      ],\n      "SecurityGroupIngress": [\n        {\n          "Description": "Allow Lambda to connect to MySQL",\n          "FromPort": 3306,\n          "IpProtocol": "tcp",\n          "SourceSecurityGroupId": {\n            "Fn::GetAtt": [\n              "TapLambdaSecurityGroup0CA577B5",\n              "GroupId"\n            ]\n          },\n          "ToPort": 3306\n        }\n      ],\n      "VpcId": {\n        "Ref": "TapVPC2E14FA7B"\n      }\n    }\n  },\n  "TapLambdaSecurityGroup0CA577B5": {\n    "Type": "AWS::EC2::SecurityGroup",\n    "Properties": {\n      "GroupDescription": "Security group for Lambda functions",\n      "SecurityGroupEgress": [\n        {\n          "CidrIp": "0.0.0.0/0",\n          "Description": "Allow HTTPS for AWS API calls",\n          "FromPort": 443,\n          "IpProtocol": "tcp",\n          "ToPort": 443\n        },\n        {\n          "Description": "Allow MySQL connection to RDS",\n          "DestinationSecurityGroupId": {\n            "Fn::GetAtt": [\n              "TapRDSSecurityGroup658D899C",\n              "GroupId"\n            ]\n          },\n          "FromPort": 3306,\n          "IpProtocol": "tcp",\n          "ToPort": 3306\n        }\n      ],\n      "VpcId": {\n        "Ref": "TapVPC2E14FA7B"\n      }\n    }\n  }\n}', stack='@jsii/kernel.RuntimeError: AssertionError: Template is undeployable, these resources have a dependency cycle: TapRDSSecurityGroup658D899C -> TapLambdaSecurityGroup0CA577B5 -> TapRDSSecurityGroup658D899C:\n\n{\n  "TapRDSSecurityGroup658D899C": {\n    "Type": "AWS::EC2::SecurityGroup",\n    "Properties": {\n      "GroupDescription": "Security group for RDS MySQL instance",\n      "SecurityGroupEgress": [\n        {\n          "CidrIp": "255.255.255.255/32",\n          "Description": "Disallow all traffic",\n          "FromPort": 252,\n          "IpProtocol": "icmp",\n          "ToPort": 86\n        }\n      ],\n      "SecurityGroupIngress": [\n        {\n          "Description": "Allow Lambda to connect to MySQL",\n          "FromPort": 3306,\n          "IpProtocol": "tcp",\n          "SourceSecurityGroupId": {\n            "Fn::GetAtt": [\n              "TapLambdaSecurityGroup0CA577B5",\n              "GroupId"\n            ]\n          },\n          "ToPort": 3306\n        }\n      ],\n      "VpcId": {\n        "Ref": "TapVPC2E14FA7B"\n      }\n    }\n  },\n  "TapLambdaSecurityGroup0CA577B5": {\n    "Type": "AWS::EC2::SecurityGroup",\n    "Properties": {\n      "GroupDescription": "Security group for Lambda functions",\n      "SecurityGroupEgress": [\n        {\n          "CidrIp": "0.0.0.0/0",\n          "Description": "Allow HTTPS for AWS API calls",\n          "FromPort": 443,\n          "IpProtocol": "tcp",\n          "ToPort": 443\n        },\n        {\n          "Description": "Allow MySQL connection to RDS",\n          "DestinationSecurityGroupId": {\n            "Fn::GetAtt": [\n              "TapRDSSecurityGroup658D899C",\n              "GroupId"\n            ]\n          },\n          "FromPort": 3306,\n          "IpProtocol": "tcp",\n          "ToPort": 3306\n        }\n      ],\n      "VpcId": {\n        "Ref": "TapVPC2E14FA7B"\n      }\n    }\n  }\n}\n    at Kernel._Kernel_ensureSync (/tmp/tmp_xvrjzrk/lib/program.js:927:23)\n    at Kernel.sinvoke (/tmp/tmp_xvrjzrk/lib/program.js:315:102)\n    at KernelHost.processRequest (/tmp/tmp_xvrjzrk/lib/program.js:15464:36)\n    at KernelHost.run (/tmp/tmp_xvrjzrk/lib/program.js:15424:22)\n    at Immediate._onImmediate (/tmp/tmp_xvrjzrk/lib/program.js:15425:45)\n    at process.processImmediate (node:internal/timers:485:21)', name='@jsii/kernel.RuntimeError')
response_type = <class 'jsii._kernel.types.InvokeResponse'>
self       = <jsii._kernel.providers.process._NodeProcess object at 0x7ffb5f55cfb0>

.venv/lib/python3.12/site-packages/jsii/_kernel/providers/process.py:342: RuntimeError
_____________________ TestTapStack.test_s3_bucket_creation _____________________
jsii.errors.JavaScriptError: 
  @jsii/kernel.RuntimeError: AssertionError: Template is undeployable, these resources have a dependency cycle: TapRDSSecurityGroup658D899C -> TapLambdaSecurityGroup0CA577B5 -> TapRDSSecurityGroup658D899C:
  
  {
    "TapRDSSecurityGroup658D899C": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS MySQL instance",
        "SecurityGroupEgress": [
          {
            "CidrIp": "255.255.255.255/32",
            "Description": "Disallow all traffic",
            "FromPort": 252,
            "IpProtocol": "icmp",
            "ToPort": 86
          }
        ],
        "SecurityGroupIngress": [
          {
            "Description": "Allow Lambda to connect to MySQL",
            "FromPort": 3306,
            "IpProtocol": "tcp",
            "SourceSecurityGroupId": {
              "Fn::GetAtt": [
                "TapLambdaSecurityGroup0CA577B5",
                "GroupId"
              ]
            },
            "ToPort": 3306
          }
        ],
        "VpcId": {
          "Ref": "TapVPC2E14FA7B"
        }
      }
    },
    "TapLambdaSecurityGroup0CA577B5": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Lambda functions",
        "SecurityGroupEgress": [
          {
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS for AWS API calls",
            "FromPort": 443,
            "IpProtocol": "tcp",
            "ToPort": 443
          },
          {
            "Description": "Allow MySQL connection to RDS",
            "DestinationSecurityGroupId": {
              "Fn::GetAtt": [
                "TapRDSSecurityGroup658D899C",
                "GroupId"
              ]
            },
            "FromPort": 3306,
            "IpProtocol": "tcp",
            "ToPort": 3306
          }
        ],
        "VpcId": {
          "Ref": "TapVPC2E14FA7B"
        }
      }
    }
  }
      at Kernel._Kernel_ensureSync (/tmp/tmp_xvrjzrk/lib/program.js:927:23)
      at Kernel.sinvoke (/tmp/tmp_xvrjzrk/lib/program.js:315:102)
      at KernelHost.processRequest (/tmp/tmp_xvrjzrk/lib/program.js:15464:36)
      at KernelHost.run (/tmp/tmp_xvrjzrk/lib/program.js:15424:22)
      at Immediate._onImmediate (/tmp/tmp_xvrjzrk/lib/program.js:15425:45)
      at process.processImmediate (node:internal/timers:485:21)

The above exception was the direct cause of the following exception:

self = <tests.unit.test_tap_stack.TestTapStack testMethod=test_s3_bucket_creation>

    def test_s3_bucket_creation(self):
        """Test S3 bucket creation with proper configuration."""
        stack = TapStack(self.app, "TestStack", env=self.env)
>       template = cdk.assertions.Template.from_stack(stack)
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

self       = <tests.unit.test_tap_stack.TestTapStack testMethod=test_s3_bucket_creation>
stack      = <lib.tap_stack.TapStack object at 0x7ffb4cac6e10>

tests/unit/test_tap_stack.py:36: 
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 
.venv/lib/python3.12/site-packages/aws_cdk/assertions/__init__.py:1568: in from_stack
    return typing.cast("Template", jsii.sinvoke(cls, "fromStack", [stack, template_parsing_options]))
                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        cls        = <class 'aws_cdk.assertions.Template'>
        skip_cyclical_dependencies_check = None
        stack      = <lib.tap_stack.TapStack object at 0x7ffb4cac6e10>
        template_parsing_options = TemplateParsingOptions()
        type_hints = {'return': <class 'NoneType'>,
 'skip_cyclical_dependencies_check': typing.Optional[bool],
 'stack': <class 'aws_cdk.Stack'>}
.venv/lib/python3.12/site-packages/jsii/_kernel/__init__.py:149: in wrapped
    return _recursize_dereference(kernel, fn(kernel, *args, **kwargs))
                                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^
        args       = (<class 'aws_cdk.assertions.Template'>,
 'fromStack',
 [<lib.tap_stack.TapStack object at 0x7ffb4cac6e10>, TemplateParsingOptions()])
        fn         = <function Kernel.sinvoke at 0x7ffb5f5639c0>
        kernel     = <jsii._kernel.Kernel object at 0x7ffb5f8679b0>
        kwargs     = {}
.venv/lib/python3.12/site-packages/jsii/_kernel/__init__.py:418: in sinvoke
    response = self.provider.sinvoke(
        args       = [<lib.tap_stack.TapStack object at 0x7ffb4cac6e10>, TemplateParsingOptions()]
        klass      = <class 'aws_cdk.assertions.Template'>
        method     = 'fromStack'
        self       = <jsii._kernel.Kernel object at 0x7ffb5f8679b0>
.venv/lib/python3.12/site-packages/jsii/_kernel/providers/process.py:383: in sinvoke
    return self._process.send(request, InvokeResponse)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        request    = StaticInvokeRequest(fqn='aws-cdk-lib.assertions.Template', method='fromStack', args=[<lib.tap_stack.TapStack object at 0x7ffb4cac6e10>, {'$jsii.struct': {'fqn': 'aws-cdk-lib.assertions.TemplateParsingOptions', 'data': {'skipCyclicalDependenciesCheck': None}}}])
        self       = <jsii._kernel.providers.process.ProcessProvider object at 0x7ffb5f867e30>
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 

self = <jsii._kernel.providers.process._NodeProcess object at 0x7ffb5f55cfb0>
request = StaticInvokeRequest(fqn='aws-cdk-lib.assertions.Template', method='fromStack', args=[<lib.tap_stack.TapStack object at...i.struct': {'fqn': 'aws-cdk-lib.assertions.TemplateParsingOptions', 'data': {'skipCyclicalDependenciesCheck': None}}}])
response_type = <class 'jsii._kernel.types.InvokeResponse'>

    def send(
        self, request: KernelRequest, response_type: Type[KernelResponse]
    ) -> KernelResponse:
        req_dict = self._serializer.unstructure(request)
        data = json.dumps(req_dict, default=jdefault).encode("utf8")
    
        # Send our data, ensure that it is framed with a trailing \n
        assert self._process.stdin is not None
        self._process.stdin.write(b"%b\n" % (data,))
        self._process.stdin.flush()
    
        resp: _ProcessResponse = self._serializer.structure(
            self._next_message(), _ProcessResponse
        )
    
        if isinstance(resp, _OkayResponse):
            return self._serializer.structure(resp.ok, response_type)
        elif isinstance(resp, _CallbackResponse):
            return resp.callback
        else:
            if resp.name == ErrorType.JSII_FAULT.value:
                raise JSIIError(resp.error) from JavaScriptError(resp.stack)
>           raise RuntimeError(resp.error) from JavaScriptError(resp.stack)
E           RuntimeError: AssertionError: Template is undeployable, these resources have a dependency cycle: TapRDSSecurityGroup658D899C -> TapLambdaSecurityGroup0CA577B5 -> TapRDSSecurityGroup658D899C:
E           
E           {
E             "TapRDSSecurityGroup658D899C": {
E               "Type": "AWS::EC2::SecurityGroup",
E               "Properties": {
E                 "GroupDescription": "Security group for RDS MySQL instance",
E                 "SecurityGroupEgress": [
E                   {
E                     "CidrIp": "255.255.255.255/32",
E                     "Description": "Disallow all traffic",
E                     "FromPort": 252,
E                     "IpProtocol": "icmp",
E                     "ToPort": 86
E                   }
E                 ],
E                 "SecurityGroupIngress": [
E                   {
E                     "Description": "Allow Lambda to connect to MySQL",
E                     "FromPort": 3306,
E                     "IpProtocol": "tcp",
E                     "SourceSecurityGroupId": {
E                       "Fn::GetAtt": [
E                         "TapLambdaSecurityGroup0CA577B5",
E                         "GroupId"
E                       ]
E                     },
E                     "ToPort": 3306
E                   }
E                 ],
E                 "VpcId": {
E                   "Ref": "TapVPC2E14FA7B"
E                 }
E               }
E             },
E             "TapLambdaSecurityGroup0CA577B5": {
E               "Type": "AWS::EC2::SecurityGroup",
E               "Properties": {
E                 "GroupDescription": "Security group for Lambda functions",
E                 "SecurityGroupEgress": [
E                   {
E                     "CidrIp": "0.0.0.0/0",
E                     "Description": "Allow HTTPS for AWS API calls",
E                     "FromPort": 443,
E                     "IpProtocol": "tcp",
E                     "ToPort": 443
E                   },
E                   {
E                     "Description": "Allow MySQL connection to RDS",
E                     "DestinationSecurityGroupId": {
E                       "Fn::GetAtt": [
E                         "TapRDSSecurityGroup658D899C",
E                         "GroupId"
E                       ]
E                     },
E                     "FromPort": 3306,
E                     "IpProtocol": "tcp",
E                     "ToPort": 3306
E                   }
E                 ],
E                 "VpcId": {
E                   "Ref": "TapVPC2E14FA7B"
E                 }
E               }
E             }
E           }

data       = (b'{"fqn": "aws-cdk-lib.assertions.Template", "method": "fromStack", "args": [{'
 b'"$jsii.byref": "aws-cdk-lib.Stack@10095"}, {"$jsii.struct": {"fqn": "aws-cdk'
 b'-lib.assertions.TemplateParsingOptions", "data": {"skipCyclicalDependenciesC'
 b'heck": null}}}], "api": "sinvoke"}')
req_dict   = {'api': 'sinvoke',
 'args': [<lib.tap_stack.TapStack object at 0x7ffb4cac6e10>,
          {'$jsii.struct': {'data': {'skipCyclicalDependenciesCheck': None},
                            'fqn': 'aws-cdk-lib.assertions.TemplateParsingOptions'}}],
 'fqn': 'aws-cdk-lib.assertions.Template',
 'method': 'fromStack'}
request    = StaticInvokeRequest(fqn='aws-cdk-lib.assertions.Template', method='fromStack', args=[<lib.tap_stack.TapStack object at 0x7ffb4cac6e10>, {'$jsii.struct': {'fqn': 'aws-cdk-lib.assertions.TemplateParsingOptions', 'data': {'skipCyclicalDependenciesCheck': None}}}])
resp       = _ErrorResponse(error='AssertionError: Template is undeployable, these resources have a dependency cycle: TapRDSSecurityGroup658D899C -> TapLambdaSecurityGroup0CA577B5 -> TapRDSSecurityGroup658D899C:\n\n{\n  "TapRDSSecurityGroup658D899C": {\n    "Type": "AWS::EC2::SecurityGroup",\n    "Properties": {\n      "GroupDescription": "Security group for RDS MySQL instance",\n      "SecurityGroupEgress": [\n        {\n          "CidrIp": "255.255.255.255/32",\n          "Description": "Disallow all traffic",\n          "FromPort": 252,\n          "IpProtocol": "icmp",\n          "ToPort": 86\n        }\n      ],\n      "SecurityGroupIngress": [\n        {\n          "Description": "Allow Lambda to connect to MySQL",\n          "FromPort": 3306,\n          "IpProtocol": "tcp",\n          "SourceSecurityGroupId": {\n            "Fn::GetAtt": [\n              "TapLambdaSecurityGroup0CA577B5",\n              "GroupId"\n            ]\n          },\n          "ToPort": 3306\n        }\n      ],\n      "VpcId": {\n        "Ref": "TapVPC2E14FA7B"\n      }\n    }\n  },\n  "TapLambdaSecurityGroup0CA577B5": {\n    "Type": "AWS::EC2::SecurityGroup",\n    "Properties": {\n      "GroupDescription": "Security group for Lambda functions",\n      "SecurityGroupEgress": [\n        {\n          "CidrIp": "0.0.0.0/0",\n          "Description": "Allow HTTPS for AWS API calls",\n          "FromPort": 443,\n          "IpProtocol": "tcp",\n          "ToPort": 443\n        },\n        {\n          "Description": "Allow MySQL connection to RDS",\n          "DestinationSecurityGroupId": {\n            "Fn::GetAtt": [\n              "TapRDSSecurityGroup658D899C",\n              "GroupId"\n            ]\n          },\n          "FromPort": 3306,\n          "IpProtocol": "tcp",\n          "ToPort": 3306\n        }\n      ],\n      "VpcId": {\n        "Ref": "TapVPC2E14FA7B"\n      }\n    }\n  }\n}', stack='@jsii/kernel.RuntimeError: AssertionError: Template is undeployable, these resources have a dependency cycle: TapRDSSecurityGroup658D899C -> TapLambdaSecurityGroup0CA577B5 -> TapRDSSecurityGroup658D899C:\n\n{\n  "TapRDSSecurityGroup658D899C": {\n    "Type": "AWS::EC2::SecurityGroup",\n    "Properties": {\n      "GroupDescription": "Security group for RDS MySQL instance",\n      "SecurityGroupEgress": [\n        {\n          "CidrIp": "255.255.255.255/32",\n          "Description": "Disallow all traffic",\n          "FromPort": 252,\n          "IpProtocol": "icmp",\n          "ToPort": 86\n        }\n      ],\n      "SecurityGroupIngress": [\n        {\n          "Description": "Allow Lambda to connect to MySQL",\n          "FromPort": 3306,\n          "IpProtocol": "tcp",\n          "SourceSecurityGroupId": {\n            "Fn::GetAtt": [\n              "TapLambdaSecurityGroup0CA577B5",\n              "GroupId"\n            ]\n          },\n          "ToPort": 3306\n        }\n      ],\n      "VpcId": {\n        "Ref": "TapVPC2E14FA7B"\n      }\n    }\n  },\n  "TapLambdaSecurityGroup0CA577B5": {\n    "Type": "AWS::EC2::SecurityGroup",\n    "Properties": {\n      "GroupDescription": "Security group for Lambda functions",\n      "SecurityGroupEgress": [\n        {\n          "CidrIp": "0.0.0.0/0",\n          "Description": "Allow HTTPS for AWS API calls",\n          "FromPort": 443,\n          "IpProtocol": "tcp",\n          "ToPort": 443\n        },\n        {\n          "Description": "Allow MySQL connection to RDS",\n          "DestinationSecurityGroupId": {\n            "Fn::GetAtt": [\n              "TapRDSSecurityGroup658D899C",\n              "GroupId"\n            ]\n          },\n          "FromPort": 3306,\n          "IpProtocol": "tcp",\n          "ToPort": 3306\n        }\n      ],\n      "VpcId": {\n        "Ref": "TapVPC2E14FA7B"\n      }\n    }\n  }\n}\n    at Kernel._Kernel_ensureSync (/tmp/tmp_xvrjzrk/lib/program.js:927:23)\n    at Kernel.sinvoke (/tmp/tmp_xvrjzrk/lib/program.js:315:102)\n    at KernelHost.processRequest (/tmp/tmp_xvrjzrk/lib/program.js:15464:36)\n    at KernelHost.run (/tmp/tmp_xvrjzrk/lib/program.js:15424:22)\n    at Immediate._onImmediate (/tmp/tmp_xvrjzrk/lib/program.js:15425:45)\n    at process.processImmediate (node:internal/timers:485:21)', name='@jsii/kernel.RuntimeError')
response_type = <class 'jsii._kernel.types.InvokeResponse'>
self       = <jsii._kernel.providers.process._NodeProcess object at 0x7ffb5f55cfb0>

.venv/lib/python3.12/site-packages/jsii/_kernel/providers/process.py:342: RuntimeError
________________________ TestTapStack.test_vpc_creation ________________________
jsii.errors.JavaScriptError: 
  @jsii/kernel.RuntimeError: AssertionError: Template is undeployable, these resources have a dependency cycle: TapRDSSecurityGroup658D899C -> TapLambdaSecurityGroup0CA577B5 -> TapRDSSecurityGroup658D899C:
  
  {
    "TapRDSSecurityGroup658D899C": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS MySQL instance",
        "SecurityGroupEgress": [
          {
            "CidrIp": "255.255.255.255/32",
            "Description": "Disallow all traffic",
            "FromPort": 252,
            "IpProtocol": "icmp",
            "ToPort": 86
          }
        ],
        "SecurityGroupIngress": [
          {
            "Description": "Allow Lambda to connect to MySQL",
            "FromPort": 3306,
            "IpProtocol": "tcp",
            "SourceSecurityGroupId": {
              "Fn::GetAtt": [
                "TapLambdaSecurityGroup0CA577B5",
                "GroupId"
              ]
            },
            "ToPort": 3306
          }
        ],
        "VpcId": {
          "Ref": "TapVPC2E14FA7B"
        }
      }
    },
    "TapLambdaSecurityGroup0CA577B5": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Lambda functions",
        "SecurityGroupEgress": [
          {
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS for AWS API calls",
            "FromPort": 443,
            "IpProtocol": "tcp",
            "ToPort": 443
          },
          {
            "Description": "Allow MySQL connection to RDS",
            "DestinationSecurityGroupId": {
              "Fn::GetAtt": [
                "TapRDSSecurityGroup658D899C",
                "GroupId"
              ]
            },
            "FromPort": 3306,
            "IpProtocol": "tcp",
            "ToPort": 3306
          }
        ],
        "VpcId": {
          "Ref": "TapVPC2E14FA7B"
        }
      }
    }
  }
      at Kernel._Kernel_ensureSync (/tmp/tmp_xvrjzrk/lib/program.js:927:23)
      at Kernel.sinvoke (/tmp/tmp_xvrjzrk/lib/program.js:315:102)
      at KernelHost.processRequest (/tmp/tmp_xvrjzrk/lib/program.js:15464:36)
      at KernelHost.run (/tmp/tmp_xvrjzrk/lib/program.js:15424:22)
      at Immediate._onImmediate (/tmp/tmp_xvrjzrk/lib/program.js:15425:45)
      at process.processImmediate (node:internal/timers:485:21)

The above exception was the direct cause of the following exception:

self = <tests.unit.test_tap_stack.TestTapStack testMethod=test_vpc_creation>

    def test_vpc_creation(self):
        """Test VPC creation."""
        stack = TapStack(self.app, "TestStack", env=self.env)
>       template = cdk.assertions.Template.from_stack(stack)
                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

self       = <tests.unit.test_tap_stack.TestTapStack testMethod=test_vpc_creation>
stack      = <lib.tap_stack.TapStack object at 0x7ffb4cacc5f0>

tests/unit/test_tap_stack.py:24: 
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 
.venv/lib/python3.12/site-packages/aws_cdk/assertions/__init__.py:1568: in from_stack
    return typing.cast("Template", jsii.sinvoke(cls, "fromStack", [stack, template_parsing_options]))
                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        cls        = <class 'aws_cdk.assertions.Template'>
        skip_cyclical_dependencies_check = None
        stack      = <lib.tap_stack.TapStack object at 0x7ffb4cacc5f0>
        template_parsing_options = TemplateParsingOptions()
        type_hints = {'return': <class 'NoneType'>,
 'skip_cyclical_dependencies_check': typing.Optional[bool],
 'stack': <class 'aws_cdk.Stack'>}
.venv/lib/python3.12/site-packages/jsii/_kernel/__init__.py:149: in wrapped
    return _recursize_dereference(kernel, fn(kernel, *args, **kwargs))
                                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^
        args       = (<class 'aws_cdk.assertions.Template'>,
 'fromStack',
 [<lib.tap_stack.TapStack object at 0x7ffb4cacc5f0>, TemplateParsingOptions()])
        fn         = <function Kernel.sinvoke at 0x7ffb5f5639c0>
        kernel     = <jsii._kernel.Kernel object at 0x7ffb5f8679b0>
        kwargs     = {}
.venv/lib/python3.12/site-packages/jsii/_kernel/__init__.py:418: in sinvoke
    response = self.provider.sinvoke(
        args       = [<lib.tap_stack.TapStack object at 0x7ffb4cacc5f0>, TemplateParsingOptions()]
        klass      = <class 'aws_cdk.assertions.Template'>
        method     = 'fromStack'
        self       = <jsii._kernel.Kernel object at 0x7ffb5f8679b0>
.venv/lib/python3.12/site-packages/jsii/_kernel/providers/process.py:383: in sinvoke
    return self._process.send(request, InvokeResponse)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        request    = StaticInvokeRequest(fqn='aws-cdk-lib.assertions.Template', method='fromStack', args=[<lib.tap_stack.TapStack object at 0x7ffb4cacc5f0>, {'$jsii.struct': {'fqn': 'aws-cdk-lib.assertions.TemplateParsingOptions', 'data': {'skipCyclicalDependenciesCheck': None}}}])
        self       = <jsii._kernel.providers.process.ProcessProvider object at 0x7ffb5f867e30>
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 

self = <jsii._kernel.providers.process._NodeProcess object at 0x7ffb5f55cfb0>
request = StaticInvokeRequest(fqn='aws-cdk-lib.assertions.Template', method='fromStack', args=[<lib.tap_stack.TapStack object at...i.struct': {'fqn': 'aws-cdk-lib.assertions.TemplateParsingOptions', 'data': {'skipCyclicalDependenciesCheck': None}}}])
response_type = <class 'jsii._kernel.types.InvokeResponse'>

    def send(
        self, request: KernelRequest, response_type: Type[KernelResponse]
    ) -> KernelResponse:
        req_dict = self._serializer.unstructure(request)
        data = json.dumps(req_dict, default=jdefault).encode("utf8")
    
        # Send our data, ensure that it is framed with a trailing \n
        assert self._process.stdin is not None
        self._process.stdin.write(b"%b\n" % (data,))
        self._process.stdin.flush()
    
        resp: _ProcessResponse = self._serializer.structure(
            self._next_message(), _ProcessResponse
        )
    
        if isinstance(resp, _OkayResponse):
            return self._serializer.structure(resp.ok, response_type)
        elif isinstance(resp, _CallbackResponse):
            return resp.callback
        else:
            if resp.name == ErrorType.JSII_FAULT.value:
                raise JSIIError(resp.error) from JavaScriptError(resp.stack)
>           raise RuntimeError(resp.error) from JavaScriptError(resp.stack)
E           RuntimeError: AssertionError: Template is undeployable, these resources have a dependency cycle: TapRDSSecurityGroup658D899C -> TapLambdaSecurityGroup0CA577B5 -> TapRDSSecurityGroup658D899C:
E           
E           {
E             "TapRDSSecurityGroup658D899C": {
E               "Type": "AWS::EC2::SecurityGroup",
E               "Properties": {
E                 "GroupDescription": "Security group for RDS MySQL instance",
E                 "SecurityGroupEgress": [
E                   {
E                     "CidrIp": "255.255.255.255/32",
E                     "Description": "Disallow all traffic",
E                     "FromPort": 252,
E                     "IpProtocol": "icmp",
E                     "ToPort": 86
E                   }
E                 ],
E                 "SecurityGroupIngress": [
E                   {
E                     "Description": "Allow Lambda to connect to MySQL",
E                     "FromPort": 3306,
E                     "IpProtocol": "tcp",
E                     "SourceSecurityGroupId": {
E                       "Fn::GetAtt": [
E                         "TapLambdaSecurityGroup0CA577B5",
E                         "GroupId"
E                       ]
E                     },
E                     "ToPort": 3306
E                   }
E                 ],
E                 "VpcId": {
E                   "Ref": "TapVPC2E14FA7B"
E                 }
E               }
E             },
E             "TapLambdaSecurityGroup0CA577B5": {
E               "Type": "AWS::EC2::SecurityGroup",
E               "Properties": {
E                 "GroupDescription": "Security group for Lambda functions",
E                 "SecurityGroupEgress": [
E                   {
E                     "CidrIp": "0.0.0.0/0",
E                     "Description": "Allow HTTPS for AWS API calls",
E                     "FromPort": 443,
E                     "IpProtocol": "tcp",
E                     "ToPort": 443
E                   },
E                   {
E                     "Description": "Allow MySQL connection to RDS",
E                     "DestinationSecurityGroupId": {
E                       "Fn::GetAtt": [
E                         "TapRDSSecurityGroup658D899C",
E                         "GroupId"
E                       ]
E                     },
E                     "FromPort": 3306,
E                     "IpProtocol": "tcp",
E                     "ToPort": 3306
E                   }
E                 ],
E                 "VpcId": {
E                   "Ref": "TapVPC2E14FA7B"
E                 }
E               }
E             }
E           }

data       = (b'{"fqn": "aws-cdk-lib.assertions.Template", "method": "fromStack", "args": [{'
 b'"$jsii.byref": "aws-cdk-lib.Stack@10185"}, {"$jsii.struct": {"fqn": "aws-cdk'
 b'-lib.assertions.TemplateParsingOptions", "data": {"skipCyclicalDependenciesC'
 b'heck": null}}}], "api": "sinvoke"}')
req_dict   = {'api': 'sinvoke',
 'args': [<lib.tap_stack.TapStack object at 0x7ffb4cacc5f0>,
          {'$jsii.struct': {'data': {'skipCyclicalDependenciesCheck': None},
                            'fqn': 'aws-cdk-lib.assertions.TemplateParsingOptions'}}],
 'fqn': 'aws-cdk-lib.assertions.Template',
 'method': 'fromStack'}
request    = StaticInvokeRequest(fqn='aws-cdk-lib.assertions.Template', method='fromStack', args=[<lib.tap_stack.TapStack object at 0x7ffb4cacc5f0>, {'$jsii.struct': {'fqn': 'aws-cdk-lib.assertions.TemplateParsingOptions', 'data': {'skipCyclicalDependenciesCheck': None}}}])
resp       = _ErrorResponse(error='AssertionError: Template is undeployable, these resources have a dependency cycle: TapRDSSecurityGroup658D899C -> TapLambdaSecurityGroup0CA577B5 -> TapRDSSecurityGroup658D899C:\n\n{\n  "TapRDSSecurityGroup658D899C": {\n    "Type": "AWS::EC2::SecurityGroup",\n    "Properties": {\n      "GroupDescription": "Security group for RDS MySQL instance",\n      "SecurityGroupEgress": [\n        {\n          "CidrIp": "255.255.255.255/32",\n          "Description": "Disallow all traffic",\n          "FromPort": 252,\n          "IpProtocol": "icmp",\n          "ToPort": 86\n        }\n      ],\n      "SecurityGroupIngress": [\n        {\n          "Description": "Allow Lambda to connect to MySQL",\n          "FromPort": 3306,\n          "IpProtocol": "tcp",\n          "SourceSecurityGroupId": {\n            "Fn::GetAtt": [\n              "TapLambdaSecurityGroup0CA577B5",\n              "GroupId"\n            ]\n          },\n          "ToPort": 3306\n        }\n      ],\n      "VpcId": {\n        "Ref": "TapVPC2E14FA7B"\n      }\n    }\n  },\n  "TapLambdaSecurityGroup0CA577B5": {\n    "Type": "AWS::EC2::SecurityGroup",\n    "Properties": {\n      "GroupDescription": "Security group for Lambda functions",\n      "SecurityGroupEgress": [\n        {\n          "CidrIp": "0.0.0.0/0",\n          "Description": "Allow HTTPS for AWS API calls",\n          "FromPort": 443,\n          "IpProtocol": "tcp",\n          "ToPort": 443\n        },\n        {\n          "Description": "Allow MySQL connection to RDS",\n          "DestinationSecurityGroupId": {\n            "Fn::GetAtt": [\n              "TapRDSSecurityGroup658D899C",\n              "GroupId"\n            ]\n          },\n          "FromPort": 3306,\n          "IpProtocol": "tcp",\n          "ToPort": 3306\n        }\n      ],\n      "VpcId": {\n        "Ref": "TapVPC2E14FA7B"\n      }\n    }\n  }\n}', stack='@jsii/kernel.RuntimeError: AssertionError: Template is undeployable, these resources have a dependency cycle: TapRDSSecurityGroup658D899C -> TapLambdaSecurityGroup0CA577B5 -> TapRDSSecurityGroup658D899C:\n\n{\n  "TapRDSSecurityGroup658D899C": {\n    "Type": "AWS::EC2::SecurityGroup",\n    "Properties": {\n      "GroupDescription": "Security group for RDS MySQL instance",\n      "SecurityGroupEgress": [\n        {\n          "CidrIp": "255.255.255.255/32",\n          "Description": "Disallow all traffic",\n          "FromPort": 252,\n          "IpProtocol": "icmp",\n          "ToPort": 86\n        }\n      ],\n      "SecurityGroupIngress": [\n        {\n          "Description": "Allow Lambda to connect to MySQL",\n          "FromPort": 3306,\n          "IpProtocol": "tcp",\n          "SourceSecurityGroupId": {\n            "Fn::GetAtt": [\n              "TapLambdaSecurityGroup0CA577B5",\n              "GroupId"\n            ]\n          },\n          "ToPort": 3306\n        }\n      ],\n      "VpcId": {\n        "Ref": "TapVPC2E14FA7B"\n      }\n    }\n  },\n  "TapLambdaSecurityGroup0CA577B5": {\n    "Type": "AWS::EC2::SecurityGroup",\n    "Properties": {\n      "GroupDescription": "Security group for Lambda functions",\n      "SecurityGroupEgress": [\n        {\n          "CidrIp": "0.0.0.0/0",\n          "Description": "Allow HTTPS for AWS API calls",\n          "FromPort": 443,\n          "IpProtocol": "tcp",\n          "ToPort": 443\n        },\n        {\n          "Description": "Allow MySQL connection to RDS",\n          "DestinationSecurityGroupId": {\n            "Fn::GetAtt": [\n              "TapRDSSecurityGroup658D899C",\n              "GroupId"\n            ]\n          },\n          "FromPort": 3306,\n          "IpProtocol": "tcp",\n          "ToPort": 3306\n        }\n      ],\n      "VpcId": {\n        "Ref": "TapVPC2E14FA7B"\n      }\n    }\n  }\n}\n    at Kernel._Kernel_ensureSync (/tmp/tmp_xvrjzrk/lib/program.js:927:23)\n    at Kernel.sinvoke (/tmp/tmp_xvrjzrk/lib/program.js:315:102)\n    at KernelHost.processRequest (/tmp/tmp_xvrjzrk/lib/program.js:15464:36)\n    at KernelHost.run (/tmp/tmp_xvrjzrk/lib/program.js:15424:22)\n    at Immediate._onImmediate (/tmp/tmp_xvrjzrk/lib/program.js:15425:45)\n    at process.processImmediate (node:internal/timers:485:21)', name='@jsii/kernel.RuntimeError')
response_type = <class 'jsii._kernel.types.InvokeResponse'>
self       = <jsii._kernel.providers.process._NodeProcess object at 0x7ffb5f55cfb0>

.venv/lib/python3.12/site-packages/jsii/_kernel/providers/process.py:342: RuntimeError
================================ tests coverage ================================
_______________ coverage: platform linux, python 3.12.11-final-0 _______________

Name               Stmts   Miss Branch BrPart  Cover   Missing
--------------------------------------------------------------
lib/__init__.py        0      0      0      0   100%
lib/tap_stack.py      55      0      0      0   100%
--------------------------------------------------------------
TOTAL                 55      0      0      0   100%
Coverage JSON written to file cov.json
Required test coverage of 20% reached. Total coverage: 100.00%
=========================== short test summary info ============================
FAILED tests/unit/test_tap_stack.py::TestTapStack::test_lambda_function_creation - RuntimeError: AssertionError: Template is undeployable, these resources have a dependency cycle: TapRDSSecurityGroup658D899C -> TapLambdaSecurityGroup0CA577B5 -> TapRDSSecurityGroup658D899C:

{
  "TapRDSSecurityGroup658D899C": {
    "Type": "AWS::EC2::SecurityGroup",
    "Properties": {
      "GroupDescription": "Security group for RDS MySQL instance",
      "SecurityGroupEgress": [
        {
          "CidrIp": "255.255.255.255/32",
          "Description": "Disallow all traffic",
          "FromPort": 252,
          "IpProtocol": "icmp",
          "ToPort": 86
        }
      ],
      "SecurityGroupIngress": [
        {
          "Description": "Allow Lambda to connect to MySQL",
          "FromPort": 3306,
          "IpProtocol": "tcp",
          "SourceSecurityGroupId": {
            "Fn::GetAtt": [
              "TapLambdaSecurityGroup0CA577B5",
              "GroupId"
            ]
          },
          "ToPort": 3306
        }
      ],
      "VpcId": {
        "Ref": "TapVPC2E14FA7B"
      }
    }
  },
  "TapLambdaSecurityGroup0CA577B5": {
    "Type": "AWS::EC2::SecurityGroup",
    "Properties": {
      "GroupDescription": "Security group for Lambda functions",
      "SecurityGroupEgress": [
        {
          "CidrIp": "0.0.0.0/0",
          "Description": "Allow HTTPS for AWS API calls",
          "FromPort": 443,
          "IpProtocol": "tcp",
          "ToPort": 443
        },
        {
          "Description": "Allow MySQL connection to RDS",
          "DestinationSecurityGroupId": {
            "Fn::GetAtt": [
              "TapRDSSecurityGroup658D899C",
              "GroupId"
            ]
          },
          "FromPort": 3306,
          "IpProtocol": "tcp",
          "ToPort": 3306
        }
      ],
      "VpcId": {
        "Ref": "TapVPC2E14FA7B"
      }
    }
  }
}
FAILED tests/unit/test_tap_stack.py::TestTapStack::test_rds_instance_creation - RuntimeError: AssertionError: Template is undeployable, these resources have a dependency cycle: TapRDSSecurityGroup658D899C -> TapLambdaSecurityGroup0CA577B5 -> TapRDSSecurityGroup658D899C:

{
  "TapRDSSecurityGroup658D899C": {
    "Type": "AWS::EC2::SecurityGroup",
    "Properties": {
      "GroupDescription": "Security group for RDS MySQL instance",
      "SecurityGroupEgress": [
        {
          "CidrIp": "255.255.255.255/32",
          "Description": "Disallow all traffic",
          "FromPort": 252,
          "IpProtocol": "icmp",
          "ToPort": 86
        }
      ],
      "SecurityGroupIngress": [
        {
          "Description": "Allow Lambda to connect to MySQL",
          "FromPort": 3306,
          "IpProtocol": "tcp",
          "SourceSecurityGroupId": {
            "Fn::GetAtt": [
              "TapLambdaSecurityGroup0CA577B5",
              "GroupId"
            ]
          },
          "ToPort": 3306
        }
      ],
      "VpcId": {
        "Ref": "TapVPC2E14FA7B"
      }
    }
  },
  "TapLambdaSecurityGroup0CA577B5": {
    "Type": "AWS::EC2::SecurityGroup",
    "Properties": {
      "GroupDescription": "Security group for Lambda functions",
      "SecurityGroupEgress": [
        {
          "CidrIp": "0.0.0.0/0",
          "Description": "Allow HTTPS for AWS API calls",
          "FromPort": 443,
          "IpProtocol": "tcp",
          "ToPort": 443
        },
        {
          "Description": "Allow MySQL connection to RDS",
          "DestinationSecurityGroupId": {
            "Fn::GetAtt": [
              "TapRDSSecurityGroup658D899C",
              "GroupId"
            ]
          },
          "FromPort": 3306,
          "IpProtocol": "tcp",
          "ToPort": 3306
        }
      ],
      "VpcId": {
        "Ref": "TapVPC2E14FA7B"
      }
    }
  }
}
FAILED tests/unit/test_tap_stack.py::TestTapStack::test_s3_bucket_creation - RuntimeError: AssertionError: Template is undeployable, these resources have a dependency cycle: TapRDSSecurityGroup658D899C -> TapLambdaSecurityGroup0CA577B5 -> TapRDSSecurityGroup658D899C:

{
  "TapRDSSecurityGroup658D899C": {
    "Type": "AWS::EC2::SecurityGroup",
    "Properties": {
      "GroupDescription": "Security group for RDS MySQL instance",
      "SecurityGroupEgress": [
        {
          "CidrIp": "255.255.255.255/32",
          "Description": "Disallow all traffic",
          "FromPort": 252,
          "IpProtocol": "icmp",
          "ToPort": 86
        }
      ],
      "SecurityGroupIngress": [
        {
          "Description": "Allow Lambda to connect to MySQL",
          "FromPort": 3306,
          "IpProtocol": "tcp",
          "SourceSecurityGroupId": {
            "Fn::GetAtt": [
              "TapLambdaSecurityGroup0CA577B5",
              "GroupId"
            ]
          },
          "ToPort": 3306
        }
      ],
      "VpcId": {
        "Ref": "TapVPC2E14FA7B"
      }
    }
  },
  "TapLambdaSecurityGroup0CA577B5": {
    "Type": "AWS::EC2::SecurityGroup",
    "Properties": {
      "GroupDescription": "Security group for Lambda functions",
      "SecurityGroupEgress": [
        {
          "CidrIp": "0.0.0.0/0",
          "Description": "Allow HTTPS for AWS API calls",
          "FromPort": 443,
          "IpProtocol": "tcp",
          "ToPort": 443
        },
        {
          "Description": "Allow MySQL connection to RDS",
          "DestinationSecurityGroupId": {
            "Fn::GetAtt": [
              "TapRDSSecurityGroup658D899C",
              "GroupId"
            ]
          },
          "FromPort": 3306,
          "IpProtocol": "tcp",
          "ToPort": 3306
        }
      ],
      "VpcId": {
        "Ref": "TapVPC2E14FA7B"
      }
    }
  }
}
FAILED tests/unit/test_tap_stack.py::TestTapStack::test_vpc_creation - RuntimeError: AssertionError: Template is undeployable, these resources have a dependency cycle: TapRDSSecurityGroup658D899C -> TapLambdaSecurityGroup0CA577B5 -> TapRDSSecurityGroup658D899C:

{
  "TapRDSSecurityGroup658D899C": {
    "Type": "AWS::EC2::SecurityGroup",
    "Properties": {
      "GroupDescription": "Security group for RDS MySQL instance",
      "SecurityGroupEgress": [
        {
          "CidrIp": "255.255.255.255/32",
          "Description": "Disallow all traffic",
          "FromPort": 252,
          "IpProtocol": "icmp",
          "ToPort": 86
        }
      ],
      "SecurityGroupIngress": [
        {
          "Description": "Allow Lambda to connect to MySQL",
          "FromPort": 3306,
          "IpProtocol": "tcp",
          "SourceSecurityGroupId": {
            "Fn::GetAtt": [
              "TapLambdaSecurityGroup0CA577B5",
              "GroupId"
            ]
          },
          "ToPort": 3306
        }
      ],
      "VpcId": {
        "Ref": "TapVPC2E14FA7B"
      }
    }
  },
  "TapLambdaSecurityGroup0CA577B5": {
    "Type": "AWS::EC2::SecurityGroup",
    "Properties": {
      "GroupDescription": "Security group for Lambda functions",
      "SecurityGroupEgress": [
        {
          "CidrIp": "0.0.0.0/0",
          "Description": "Allow HTTPS for AWS API calls",
          "FromPort": 443,
          "IpProtocol": "tcp",
          "ToPort": 443
        },
        {
          "Description": "Allow MySQL connection to RDS",
          "DestinationSecurityGroupId": {
            "Fn::GetAtt": [
              "TapRDSSecurityGroup658D899C",
              "GroupId"
            ]
          },
          "FromPort": 3306,
          "IpProtocol": "tcp",
          "ToPort": 3306
        }
      ],
      "VpcId": {
        "Ref": "TapVPC2E14FA7B"
      }
    }
  }
}
==================== 4 failed, 1 passed in 60.37s (0:01:00) ====================


Fix the issues.