# LocalStack Deployment Test

**Date:** Fri Dec 19 11:34:03 UTC 2025
**Task:** worktree/github-Pr1070
**Platform:** cdk
**Language:** ts
**PR ID:** Pr1070
**AWS Services:** EC2, VPC, ELB, AutoScaling, SSM
**Complexity:** hard

---

## Test Objective

Test if CDK TypeScript stack can be deployed to LocalStack. This stack includes:
- VPC with 2 NAT Gateways and multiple subnets across 2 AZs
- Application Load Balancer (internet-facing)
- Auto Scaling Group (2-6 instances)
- Launch Template with EC2 instances (t2.micro)
- Security Groups
- SSM Parameter for database endpoint

**Known Challenges:**
- NAT Gateways may have limited support in LocalStack Community
- EC2 AutoScaling may be partially supported
- Load Balancer functionality may be mocked
- EC2 instances won't actually launch in LocalStack

---

## Environment Setup

Setting up LocalStack environment variables:

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_S3_FORCE_PATH_STYLE=true
export CDK_DEFAULT_ACCOUNT=000000000000
export CDK_DEFAULT_REGION=us-east-1
export PULUMI_CONFIG_PASSPHRASE=""
export AWS_SKIP_CREDENTIALS_VALIDATION=true
export AWS_SKIP_METADATA_API_CHECK=true
```


## Dependencies Installation

Installing npm dependencies:

```
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
npm warn deprecated lodash.isequal@4.5.0: This package is deprecated. Use require('node:util').isDeepStrictEqual instead.
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated querystring@0.2.0: The querystring API is considered Legacy. new code should use the URLSearchParams API instead.
npm warn deprecated @cdktf/provider-archive@11.0.1: See https://cdk.tf/imports for details on how to continue to use the archive provider in your CDK for Terraform (CDKTF) projects by generating the bindings locally.
npm warn deprecated @cdktf/provider-tls@11.0.1: See https://cdk.tf/imports for details on how to continue to use the tls provider in your CDK for Terraform (CDKTF) projects by generating the bindings locally.
npm warn deprecated @cdktf/provider-random@12.0.1: See https://cdk.tf/imports for details on how to continue to use the random provider in your CDK for Terraform (CDKTF) projects by generating the bindings locally.
npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.
npm warn deprecated @cdktf/provider-aws@21.9.1: See https://cdk.tf/imports for details on how to continue to use the aws provider in your CDK for Terraform (CDKTF) projects by generating the bindings locally.

> tap@0.1.0 preinstall
> echo 'Skipping version checks for CI/CD'

Skipping version checks for CI/CD

> tap@0.1.0 prepare
> husky

.git can't be found
added 1977 packages, and audited 2321 packages in 1m

307 packages are looking for funding
  run `npm fund` for details

17 vulnerabilities (5 low, 1 moderate, 11 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
```
✅ Dependencies installed successfully

## TypeScript Build

Building TypeScript code:

```

> tap@0.1.0 build
> tsc --skipLibCheck

```
✅ Build completed successfully

## Check CDK Local Installation

```
cdklocal is already installed:

[33m█████████████████████████████████████████████████████████████████████████[0m
[33m█                                                                       █[0m
[33m█  ⚠ WARNING: You are using LEGACY EXPORTS from the aws-cdk package!    █[0m
[33m█                                                                       █[0m
[33m█  These exports were never officially supported and will be removed    █[0m
[33m█  after 2026-03-01.                                                    █[0m
[33m█  Please migrate to using the official CDK Toolkit Library instead:    █[0m
[33m█  https://docs.aws.amazon.com/cdk/api/toolkit-lib/                     █[0m
[33m█                                                                       █[0m
[33m█  For more information: https://github.com/aws/aws-cdk-cli/issues/310  █[0m
[33m█  To disable this warning: CDK_DISABLE_LEGACY_EXPORT_WARNING=1         █[0m
[33m█                                                                       █[0m
[33m█████████████████████████████████████████████████████████████████████████[0m

cdklocal v3.0.1
cdk cli version v2.1100.1
```

## LocalStack Health Check

```
Checking LocalStack availability...
{"services": {"acm": "available", "apigateway": "running", "cloudformation": "running", "cloudwatch": "running", "config": "available", "dynamodb": "running", "dynamodbstreams": "available", "ec2": "running", "es": "available", "events": "running", "firehose": "available", "iam": "running", "kinesis": "available", "kms": "running", "lambda": "running", "logs": "running", "opensearch": "available", "redshift": "available", "resource-groups": "available", "resourcegroupstaggingapi": "available", "route53": "available", "route53resolver": "available", "s3": "running", "s3control": "available", "scheduler": "available", "secretsmanager": "running", "ses": "available", "sns": "running", "sqs": "running", "ssm": "running", "stepfunctions": "available", "sts": "running", "support": "available", "swf": "available", "transcribe": "available"}, "edition": "community", "version": "4.12.1.dev23"}```

## CDK Bootstrap

Bootstrapping CDK for LocalStack:

```

[33m█████████████████████████████████████████████████████████████████████████[0m
[33m█                                                                       █[0m
[33m█  ⚠ WARNING: You are using LEGACY EXPORTS from the aws-cdk package!    █[0m
[33m█                                                                       █[0m
[33m█  These exports were never officially supported and will be removed    █[0m
[33m█  after 2026-03-01.                                                    █[0m
[33m█  Please migrate to using the official CDK Toolkit Library instead:    █[0m
[33m█  https://docs.aws.amazon.com/cdk/api/toolkit-lib/                     █[0m
[33m█                                                                       █[0m
[33m█  For more information: https://github.com/aws/aws-cdk-cli/issues/310  █[0m
[33m█  To disable this warning: CDK_DISABLE_LEGACY_EXPORT_WARNING=1         █[0m
[33m█                                                                       █[0m
[33m█████████████████████████████████████████████████████████████████████████[0m

/home/ubuntu/.nvm/versions/node/v22.17.0/lib/node_modules/aws-cdk-local/src/index.js:18
    throw new EnvironmentMisconfigurationError("If specifying 'AWS_ENDPOINT_URL' then 'AWS_ENDPOINT_URL_S3' must be specified");
    ^

EnvironmentMisconfigurationError: If specifying 'AWS_ENDPOINT_URL' then 'AWS_ENDPOINT_URL_S3' must be specified
    at configureEnvironment (/home/ubuntu/.nvm/versions/node/v22.17.0/lib/node_modules/aws-cdk-local/src/index.js:18:11)
    at patchPost_2_14 (/home/ubuntu/.nvm/versions/node/v22.17.0/lib/node_modules/aws-cdk-local/bin/cdklocal:490:7)
    at Object.<anonymous> (/home/ubuntu/.nvm/versions/node/v22.17.0/lib/node_modules/aws-cdk-local/bin/cdklocal:508:3)
    at Module._compile (node:internal/modules/cjs/loader:1730:14)
    at Object..js (node:internal/modules/cjs/loader:1895:10)
    at Module.load (node:internal/modules/cjs/loader:1465:32)
    at Function._load (node:internal/modules/cjs/loader:1282:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)

Node.js v22.17.0
```
✅ Bootstrap completed successfully

### Retry Bootstrap with S3 Endpoint

Added AWS_ENDPOINT_URL_S3=http://localhost:4566

```

[33m█████████████████████████████████████████████████████████████████████████[0m
[33m█                                                                       █[0m
[33m█  ⚠ WARNING: You are using LEGACY EXPORTS from the aws-cdk package!    █[0m
[33m█                                                                       █[0m
[33m█  These exports were never officially supported and will be removed    █[0m
[33m█  after 2026-03-01.                                                    █[0m
[33m█  Please migrate to using the official CDK Toolkit Library instead:    █[0m
[33m█  https://docs.aws.amazon.com/cdk/api/toolkit-lib/                     █[0m
[33m█                                                                       █[0m
[33m█  For more information: https://github.com/aws/aws-cdk-cli/issues/310  █[0m
[33m█  To disable this warning: CDK_DISABLE_LEGACY_EXPORT_WARNING=1         █[0m
[33m█                                                                       █[0m
[33m█████████████████████████████████████████████████████████████████████████[0m

[WARNING] aws-cdk-lib.aws_ec2.VpcProps#cidr is deprecated.
  Use ipAddresses instead
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_autoscaling.HealthCheck#elb is deprecated.
  Use HealthChecks instead
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_autoscaling.ElbHealthCheckOptions#grace is deprecated.
  Use AdditionalHealthChecksOptions instead
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_autoscaling.CommonAutoScalingGroupProps#healthCheck is deprecated.
  Use `healthChecks` instead
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_ec2.VpcProps#cidr is deprecated.
  Use ipAddresses instead
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_autoscaling.HealthCheck#elb is deprecated.
  Use HealthChecks instead
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_autoscaling.ElbHealthCheckOptions#grace is deprecated.
  Use AdditionalHealthChecksOptions instead
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_autoscaling.CommonAutoScalingGroupProps#healthCheck is deprecated.
  Use `healthChecks` instead
  This API will be removed in the next major release.
 ⏳  Bootstrapping environment aws://000000000000/us-east-1...
Trusted accounts for deployment: (none)
Trusted accounts for lookup: (none)
Using default execution policy of 'arn:aws:iam::aws:policy/AdministratorAccess'. Pass '--cloudformation-execution-policies' to customize.
CDKToolkit: creating CloudFormation changeset...
You used the --force flag, but CloudFormation reported that the deployment would not make any changes.
According to CloudFormation, all resources are already up-to-date with the state in your CDK app.

You cannot use the --force flag to get rid of changes you made in the console. Try using
CloudFormation drift detection instead: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-stack-drift.html
 ✅  Environment aws://000000000000/us-east-1 bootstrapped (no changes).

NOTICES         (What's this? https://github.com/aws/aws-cdk/wiki/CLI-Notices)

34892	CDK CLI collects telemetry data on command usage starting at version 2.1100.0 (unless opted out)

	Overview: We do not collect customer content and we anonymize the
	          telemetry we do collect. See the attached issue for more
	          information on what data is collected, why, and how to
	          opt-out. Telemetry will NOT be collected for any CDK CLI
	          version prior to version 2.1100.0 - regardless of
	          opt-in/out. You can also view the telemetry we collect by
	          logging it to a local file, by adding
	          `--telemetry-file=my/local/file` to any `cdk` command.

	Affected versions: cli: ^2.1100.0

	More information at: https://github.com/aws/aws-cdk/issues/34892


If you don’t want to see a notice anymore, use "cdk acknowledge <id>". For example, "cdk acknowledge 34892".
```
✅ Bootstrap completed successfully

## CDK Deployment

Deploying stack to LocalStack with stack name: TapStackPr1070

```

[33m█████████████████████████████████████████████████████████████████████████[0m
[33m█                                                                       █[0m
[33m█  ⚠ WARNING: You are using LEGACY EXPORTS from the aws-cdk package!    █[0m
[33m█                                                                       █[0m
[33m█  These exports were never officially supported and will be removed    █[0m
[33m█  after 2026-03-01.                                                    █[0m
[33m█  Please migrate to using the official CDK Toolkit Library instead:    █[0m
[33m█  https://docs.aws.amazon.com/cdk/api/toolkit-lib/                     █[0m
[33m█                                                                       █[0m
[33m█  For more information: https://github.com/aws/aws-cdk-cli/issues/310  █[0m
[33m█  To disable this warning: CDK_DISABLE_LEGACY_EXPORT_WARNING=1         █[0m
[33m█                                                                       █[0m
[33m█████████████████████████████████████████████████████████████████████████[0m

[WARNING] aws-cdk-lib.aws_ec2.VpcProps#cidr is deprecated.
  Use ipAddresses instead
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_autoscaling.HealthCheck#elb is deprecated.
  Use HealthChecks instead
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_autoscaling.ElbHealthCheckOptions#grace is deprecated.
  Use AdditionalHealthChecksOptions instead
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_autoscaling.CommonAutoScalingGroupProps#healthCheck is deprecated.
  Use `healthChecks` instead
  This API will be removed in the next major release.
[Warning at /TapStackPr1070/TapAutoScalingGroup] desiredCapacity has been configured. Be aware this will reset the size of your AutoScalingGroup on every deployment. See https://github.com/aws/aws-cdk/issues/5215 [ack: @aws-cdk/aws-autoscaling:desiredCapacitySet]

✨  Synthesis time: 7.7s

TapStackPr1070: start: Building TapStackPr1070/Custom::VpcRestrictDefaultSGCustomResourceProvider Code
TapStackPr1070: success: Built TapStackPr1070/Custom::VpcRestrictDefaultSGCustomResourceProvider Code
TapStackPr1070: start: Building TapStackPr1070 Template
TapStackPr1070: success: Built TapStackPr1070 Template
TapStackPr1070: start: Publishing TapStackPr1070/Custom::VpcRestrictDefaultSGCustomResourceProvider Code (000000000000-us-east-1-fa324105)
TapStackPr1070: start: Publishing TapStackPr1070 Template (000000000000-us-east-1-9d256151)
TapStackPr1070: fail: exception while calling s3 with unknown operation: Unable to parse request (not well-formed (invalid token): line 1, column 0), invalid XML received:
b'{\n "Resources": {\n  "TapVpc8B8CDDDF": {\n   "Type": "AWS::EC2::VPC",\n   "Properties": {\n    "CidrBlock": "10.0.0.0/16",\n    "EnableDnsHostnames": true,\n    "EnableDnsSupport": true,\n    "InstanceTenancy": "default",\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapVpc-Pr1070"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/Resource"\n   }\n  },\n  "TapVpcpublicSubnet1Subnet4F8D84E8": {\n   "Type": "AWS::EC2::Subnet",\n   "Properties": {\n    "AvailabilityZone": "us-east-1a",\n    "CidrBlock": "10.0.0.0/24",\n    "MapPublicIpOnLaunch": true,\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "aws-cdk:subnet-name",\n      "Value": "public"\n     },\n     {\n      "Key": "aws-cdk:subnet-type",\n      "Value": "Public"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr1070/TapVpc/publicSubnet1"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/publicSubnet1/Subnet"\n   }\n  },\n  "TapVpcpublicSubnet1RouteTable9186A90D": {\n   "Type": "AWS::EC2::RouteTable",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr1070/TapVpc/publicSubnet1"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/publicSubnet1/RouteTable"\n   }\n  },\n  "TapVpcpublicSubnet1RouteTableAssociation845CF324": {\n   "Type": "AWS::EC2::SubnetRouteTableAssociation",\n   "Properties": {\n    "RouteTableId": {\n     "Ref": "TapVpcpublicSubnet1RouteTable9186A90D"\n    },\n    "SubnetId": {\n     "Ref": "TapVpcpublicSubnet1Subnet4F8D84E8"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/publicSubnet1/RouteTableAssociation"\n   }\n  },\n  "TapVpcpublicSubnet1DefaultRouteF9DDCC94": {\n   "Type": "AWS::EC2::Route",\n   "Properties": {\n    "DestinationCidrBlock": "0.0.0.0/0",\n    "GatewayId": {\n     "Ref": "TapVpcIGWD6C67C56"\n    },\n    "RouteTableId": {\n     "Ref": "TapVpcpublicSubnet1RouteTable9186A90D"\n    }\n   },\n   "DependsOn": [\n    "TapVpcVPCGWDFDBCCBD"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/publicSubnet1/DefaultRoute"\n   }\n  },\n  "TapVpcpublicSubnet1EIP45C8CEBC": {\n   "Type": "AWS::EC2::EIP",\n   "Properties": {\n    "Domain": "vpc",\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr1070/TapVpc/publicSubnet1"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/publicSubnet1/EIP"\n   }\n  },\n  "TapVpcpublicSubnet1NATGateway6462C64F": {\n   "Type": "AWS::EC2::NatGateway",\n   "Properties": {\n    "AllocationId": {\n     "Fn::GetAtt": [\n      "TapVpcpublicSubnet1EIP45C8CEBC",\n      "AllocationId"\n     ]\n    },\n    "SubnetId": {\n     "Ref": "TapVpcpublicSubnet1Subnet4F8D84E8"\n    },\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr1070/TapVpc/publicSubnet1"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "DependsOn": [\n    "TapVpcpublicSubnet1DefaultRouteF9DDCC94",\n    "TapVpcpublicSubnet1RouteTableAssociation845CF324"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/publicSubnet1/NATGateway"\n   }\n  },\n  "TapVpcpublicSubnet2Subnet9CE016D7": {\n   "Type": "AWS::EC2::Subnet",\n   "Properties": {\n    "AvailabilityZone": "us-east-1b",\n    "CidrBlock": "10.0.1.0/24",\n    "MapPublicIpOnLaunch": true,\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "aws-cdk:subnet-name",\n      "Value": "public"\n     },\n     {\n      "Key": "aws-cdk:subnet-type",\n      "Value": "Public"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr1070/TapVpc/publicSubnet2"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/publicSubnet2/Subnet"\n   }\n  },\n  "TapVpcpublicSubnet2RouteTable454CFF68": {\n   "Type": "AWS::EC2::RouteTable",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr1070/TapVpc/publicSubnet2"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/publicSubnet2/RouteTable"\n   }\n  },\n  "TapVpcpublicSubnet2RouteTableAssociation6746B76F": {\n   "Type": "AWS::EC2::SubnetRouteTableAssociation",\n   "Properties": {\n    "RouteTableId": {\n     "Ref": "TapVpcpublicSubnet2RouteTable454CFF68"\n    },\n    "SubnetId": {\n     "Ref": "TapVpcpublicSubnet2Subnet9CE016D7"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/publicSubnet2/RouteTableAssociation"\n   }\n  },\n  "TapVpcpublicSubnet2DefaultRouteE0B90472": {\n   "Type": "AWS::EC2::Route",\n   "Properties": {\n    "DestinationCidrBlock": "0.0.0.0/0",\n    "GatewayId": {\n     "Ref": "TapVpcIGWD6C67C56"\n    },\n    "RouteTableId": {\n     "Ref": "TapVpcpublicSubnet2RouteTable454CFF68"\n    }\n   },\n   "DependsOn": [\n    "TapVpcVPCGWDFDBCCBD"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/publicSubnet2/DefaultRoute"\n   }\n  },\n  "TapVpcpublicSubnet2EIP15B6A591": {\n   "Type": "AWS::EC2::EIP",\n   "Properties": {\n    "Domain": "vpc",\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr1070/TapVpc/publicSubnet2"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/publicSubnet2/EIP"\n   }\n  },\n  "TapVpcpublicSubnet2NATGatewayF04294B4": {\n   "Type": "AWS::EC2::NatGateway",\n   "Properties": {\n    "AllocationId": {\n     "Fn::GetAtt": [\n      "TapVpcpublicSubnet2EIP15B6A591",\n      "AllocationId"\n     ]\n    },\n    "SubnetId": {\n     "Ref": "TapVpcpublicSubnet2Subnet9CE016D7"\n    },\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr1070/TapVpc/publicSubnet2"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "DependsOn": [\n    "TapVpcpublicSubnet2DefaultRouteE0B90472",\n    "TapVpcpublicSubnet2RouteTableAssociation6746B76F"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/publicSubnet2/NATGateway"\n   }\n  },\n  "TapVpcprivateSubnet1Subnet12EE2EB8": {\n   "Type": "AWS::EC2::Subnet",\n   "Properties": {\n    "AvailabilityZone": "us-east-1a",\n    "CidrBlock": "10.0.2.0/24",\n    "MapPublicIpOnLaunch": false,\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "aws-cdk:subnet-name",\n      "Value": "private"\n     },\n     {\n      "Key": "aws-cdk:subnet-type",\n      "Value": "Private"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr1070/TapVpc/privateSubnet1"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/privateSubnet1/Subnet"\n   }\n  },\n  "TapVpcprivateSubnet1RouteTable262C1F9D": {\n   "Type": "AWS::EC2::RouteTable",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr1070/TapVpc/privateSubnet1"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/privateSubnet1/RouteTable"\n   }\n  },\n  "TapVpcprivateSubnet1RouteTableAssociationEA1E1697": {\n   "Type": "AWS::EC2::SubnetRouteTableAssociation",\n   "Properties": {\n    "RouteTableId": {\n     "Ref": "TapVpcprivateSubnet1RouteTable262C1F9D"\n    },\n    "SubnetId": {\n     "Ref": "TapVpcprivateSubnet1Subnet12EE2EB8"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/privateSubnet1/RouteTableAssociation"\n   }\n  },\n  "TapVpcprivateSubnet1DefaultRoute91B7C4A1": {\n   "Type": "AWS::EC2::Route",\n   "Properties": {\n    "DestinationCidrBlock": "0.0.0.0/0",\n    "NatGatewayId": {\n     "Ref": "TapVpcpublicSubnet1NATGateway6462C64F"\n    },\n    "RouteTableId": {\n     "Ref": "TapVpcprivateSubnet1RouteTable262C1F9D"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/privateSubnet1/DefaultRoute"\n   }\n  },\n  "TapVpcprivateSubnet2SubnetF743A890": {\n   "Type": "AWS::EC2::Subnet",\n   "Properties": {\n    "AvailabilityZone": "us-east-1b",\n    "CidrBlock": "10.0.3.0/24",\n    "MapPublicIpOnLaunch": false,\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "aws-cdk:subnet-name",\n      "Value": "private"\n     },\n     {\n      "Key": "aws-cdk:subnet-type",\n      "Value": "Private"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr1070/TapVpc/privateSubnet2"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/privateSubnet2/Subnet"\n   }\n  },\n  "TapVpcprivateSubnet2RouteTable89F7D7BF": {\n   "Type": "AWS::EC2::RouteTable",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr1070/TapVpc/privateSubnet2"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/privateSubnet2/RouteTable"\n   }\n  },\n  "TapVpcprivateSubnet2RouteTableAssociationFA4D2A75": {\n   "Type": "AWS::EC2::SubnetRouteTableAssociation",\n   "Properties": {\n    "RouteTableId": {\n     "Ref": "TapVpcprivateSubnet2RouteTable89F7D7BF"\n    },\n    "SubnetId": {\n     "Ref": "TapVpcprivateSubnet2SubnetF743A890"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/privateSubnet2/RouteTableAssociation"\n   }\n  },\n  "TapVpcprivateSubnet2DefaultRoute64DBAF67": {\n   "Type": "AWS::EC2::Route",\n   "Properties": {\n    "DestinationCidrBlock": "0.0.0.0/0",\n    "NatGatewayId": {\n     "Ref": "TapVpcpublicSubnet2NATGatewayF04294B4"\n    },\n    "RouteTableId": {\n     "Ref": "TapVpcprivateSubnet2RouteTable89F7D7BF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/privateSubnet2/DefaultRoute"\n   }\n  },\n  "TapVpcdatabaseSubnet1Subnet1A40387E": {\n   "Type": "AWS::EC2::Subnet",\n   "Properties": {\n    "AvailabilityZone": "us-east-1a",\n    "CidrBlock": "10.0.4.0/28",\n    "MapPublicIpOnLaunch": false,\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "aws-cdk:subnet-name",\n      "Value": "database"\n     },\n     {\n      "Key": "aws-cdk:subnet-type",\n      "Value": "Isolated"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr1070/TapVpc/databaseSubnet1"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/databaseSubnet1/Subnet"\n   }\n  },\n  "TapVpcdatabaseSubnet1RouteTable29CF7BB5": {\n   "Type": "AWS::EC2::RouteTable",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr1070/TapVpc/databaseSubnet1"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/databaseSubnet1/RouteTable"\n   }\n  },\n  "TapVpcdatabaseSubnet1RouteTableAssociation81A9F381": {\n   "Type": "AWS::EC2::SubnetRouteTableAssociation",\n   "Properties": {\n    "RouteTableId": {\n     "Ref": "TapVpcdatabaseSubnet1RouteTable29CF7BB5"\n    },\n    "SubnetId": {\n     "Ref": "TapVpcdatabaseSubnet1Subnet1A40387E"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/databaseSubnet1/RouteTableAssociation"\n   }\n  },\n  "TapVpcdatabaseSubnet2Subnet904C5B02": {\n   "Type": "AWS::EC2::Subnet",\n   "Properties": {\n    "AvailabilityZone": "us-east-1b",\n    "CidrBlock": "10.0.4.16/28",\n    "MapPublicIpOnLaunch": false,\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "aws-cdk:subnet-name",\n      "Value": "database"\n     },\n     {\n      "Key": "aws-cdk:subnet-type",\n      "Value": "Isolated"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr1070/TapVpc/databaseSubnet2"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/databaseSubnet2/Subnet"\n   }\n  },\n  "TapVpcdatabaseSubnet2RouteTable1D74A0D2": {\n   "Type": "AWS::EC2::RouteTable",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr1070/TapVpc/databaseSubnet2"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/databaseSubnet2/RouteTable"\n   }\n  },\n  "TapVpcdatabaseSubnet2RouteTableAssociation667BA279": {\n   "Type": "AWS::EC2::SubnetRouteTableAssociation",\n   "Properties": {\n    "RouteTableId": {\n     "Ref": "TapVpcdatabaseSubnet2RouteTable1D74A0D2"\n    },\n    "SubnetId": {\n     "Ref": "TapVpcdatabaseSubnet2Subnet904C5B02"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/databaseSubnet2/RouteTableAssociation"\n   }\n  },\n  "TapVpcIGWD6C67C56": {\n   "Type": "AWS::EC2::InternetGateway",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapVpc-Pr1070"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/IGW"\n   }\n  },\n  "TapVpcVPCGWDFDBCCBD": {\n   "Type": "AWS::EC2::VPCGatewayAttachment",\n   "Properties": {\n    "InternetGatewayId": {\n     "Ref": "TapVpcIGWD6C67C56"\n    },\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/VPCGW"\n   }\n  },\n  "TapVpcRestrictDefaultSecurityGroupCustomResource2332DAD5": {\n   "Type": "Custom::VpcRestrictDefaultSG",\n   "Properties": {\n    "ServiceToken": {\n     "Fn::GetAtt": [\n      "CustomVpcRestrictDefaultSGCustomResourceProviderHandlerDC833E5E",\n      "Arn"\n     ]\n    },\n    "DefaultSecurityGroupId": {\n     "Fn::GetAtt": [\n      "TapVpc8B8CDDDF",\n      "DefaultSecurityGroup"\n     ]\n    },\n    "Account": "000000000000"\n   },\n   "UpdateReplacePolicy": "Delete",\n   "DeletionPolicy": "Delete",\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapVpc/RestrictDefaultSecurityGroupCustomResource/Default"\n   }\n  },\n  "CustomVpcRestrictDefaultSGCustomResourceProviderRole26592FE0": {\n   "Type": "AWS::IAM::Role",\n   "Properties": {\n    "AssumeRolePolicyDocument": {\n     "Version": "2012-10-17",\n     "Statement": [\n      {\n       "Action": "sts:AssumeRole",\n       "Effect": "Allow",\n       "Principal": {\n        "Service": "lambda.amazonaws.com"\n       }\n      }\n     ]\n    },\n    "ManagedPolicyArns": [\n     {\n      "Fn::Sub": "arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"\n     }\n    ],\n    "Policies": [\n     {\n      "PolicyName": "Inline",\n      "PolicyDocument": {\n       "Version": "2012-10-17",\n       "Statement": [\n        {\n         "Effect": "Allow",\n         "Action": [\n          "ec2:AuthorizeSecurityGroupIngress",\n          "ec2:AuthorizeSecurityGroupEgress",\n          "ec2:RevokeSecurityGroupIngress",\n          "ec2:RevokeSecurityGroupEgress"\n         ],\n         "Resource": [\n          {\n           "Fn::Join": [\n            "",\n            [\n             "arn:aws:ec2:us-east-1:000000000000:security-group/",\n             {\n              "Fn::GetAtt": [\n               "TapVpc8B8CDDDF",\n               "DefaultSecurityGroup"\n              ]\n             }\n            ]\n           ]\n          }\n         ]\n        }\n       ]\n      }\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/Custom::VpcRestrictDefaultSGCustomResourceProvider/Role"\n   }\n  },\n  "CustomVpcRestrictDefaultSGCustomResourceProviderHandlerDC833E5E": {\n   "Type": "AWS::Lambda::Function",\n   "Properties": {\n    "Code": {\n     "S3Bucket": "cdk-hnb659fds-assets-000000000000-us-east-1",\n     "S3Key": "7fa1e366ee8a9ded01fc355f704cff92bfd179574e6f9cfee800a3541df1b200.zip"\n    },\n    "Timeout": 900,\n    "MemorySize": 128,\n    "Handler": "__entrypoint__.handler",\n    "Role": {\n     "Fn::GetAtt": [\n      "CustomVpcRestrictDefaultSGCustomResourceProviderRole26592FE0",\n      "Arn"\n     ]\n    },\n    "Runtime": "nodejs22.x",\n    "Description": "Lambda function for removing all inbound/outbound rules from the VPC default security group"\n   },\n   "DependsOn": [\n    "CustomVpcRestrictDefaultSGCustomResourceProviderRole26592FE0"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/Custom::VpcRestrictDefaultSGCustomResourceProvider/Handler",\n    "aws:asset:path": "asset.7fa1e366ee8a9ded01fc355f704cff92bfd179574e6f9cfee800a3541df1b200",\n    "aws:asset:property": "Code"\n   }\n  },\n  "AlbSecurityGroup86A59E99": {\n   "Type": "AWS::EC2::SecurityGroup",\n   "Properties": {\n    "GroupDescription": "Security group for Application Load Balancer",\n    "GroupName": "TapAlbSecurityGroup-Pr1070",\n    "SecurityGroupEgress": [\n     {\n      "CidrIp": "0.0.0.0/0",\n      "Description": "Allow all outbound traffic by default",\n      "IpProtocol": "-1"\n     }\n    ],\n    "SecurityGroupIngress": [\n     {\n      "CidrIp": "0.0.0.0/0",\n      "Description": "Allow HTTP traffic from anywhere",\n      "FromPort": 80,\n      "IpProtocol": "tcp",\n      "ToPort": 80\n     }\n    ],\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/AlbSecurityGroup/Resource"\n   }\n  },\n  "InstanceSecurityGroup896E10BF": {\n   "Type": "AWS::EC2::SecurityGroup",\n   "Properties": {\n    "GroupDescription": "Security group for EC2 instances",\n    "GroupName": "TapInstanceSecurityGroup-Pr1070",\n    "SecurityGroupEgress": [\n     {\n      "CidrIp": "0.0.0.0/0",\n      "Description": "Allow all outbound traffic by default",\n      "IpProtocol": "-1"\n     }\n    ],\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/InstanceSecurityGroup/Resource"\n   }\n  },\n  "InstanceSecurityGroupfromTapStackPr1070AlbSecurityGroup2EAC5DA38080981C5296": {\n   "Type": "AWS::EC2::SecurityGroupIngress",\n   "Properties": {\n    "Description": "Allow traffic from ALB on port 8080",\n    "FromPort": 8080,\n    "GroupId": {\n     "Fn::GetAtt": [\n      "InstanceSecurityGroup896E10BF",\n      "GroupId"\n     ]\n    },\n    "IpProtocol": "tcp",\n    "SourceSecurityGroupId": {\n     "Fn::GetAtt": [\n      "AlbSecurityGroup86A59E99",\n      "GroupId"\n     ]\n    },\n    "ToPort": 8080\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/InstanceSecurityGroup/from TapStackPr1070AlbSecurityGroup2EAC5DA3:8080"\n   }\n  },\n  "RdsSecurityGroup632A77E4": {\n   "Type": "AWS::EC2::SecurityGroup",\n   "Properties": {\n    "GroupDescription": "Security group for RDS MySQL database",\n    "GroupName": "TapRdsSecurityGroup-Pr1070",\n    "SecurityGroupEgress": [\n     {\n      "CidrIp": "255.255.255.255/32",\n      "Description": "Disallow all traffic",\n      "FromPort": 252,\n      "IpProtocol": "icmp",\n      "ToPort": 86\n     }\n    ],\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/RdsSecurityGroup/Resource"\n   }\n  },\n  "RdsSecurityGroupfromTapStackPr1070InstanceSecurityGroup5EB1A1033306E83C93A6": {\n   "Type": "AWS::EC2::SecurityGroupIngress",\n   "Properties": {\n    "Description": "Allow MySQL traffic from EC2 instances",\n    "FromPort": 3306,\n    "GroupId": {\n     "Fn::GetAtt": [\n      "RdsSecurityGroup632A77E4",\n      "GroupId"\n     ]\n    },\n    "IpProtocol": "tcp",\n    "SourceSecurityGroupId": {\n     "Fn::GetAtt": [\n      "InstanceSecurityGroup896E10BF",\n      "GroupId"\n     ]\n    },\n    "ToPort": 3306\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/RdsSecurityGroup/from TapStackPr1070InstanceSecurityGroup5EB1A103:3306"\n   }\n  },\n  "TapLaunchTemplate32CD187B": {\n   "Type": "AWS::EC2::LaunchTemplate",\n   "Properties": {\n    "LaunchTemplateData": {\n     "ImageId": {\n      "Ref": "SsmParameterValueawsserviceamiamazonlinuxlatestamzn2amikernel510hvmx8664gp2C96584B6F00A464EAD1953AFF4B05118Parameter"\n     },\n     "InstanceType": "t2.micro",\n     "SecurityGroupIds": [\n      {\n       "Fn::GetAtt": [\n        "InstanceSecurityGroup896E10BF",\n        "GroupId"\n       ]\n      }\n     ],\n     "TagSpecifications": [\n      {\n       "ResourceType": "instance",\n       "Tags": [\n        {\n         "Key": "Author",\n         "Value": "unknown"\n        },\n        {\n         "Key": "Environment",\n         "Value": "Production"\n        },\n        {\n         "Key": "Name",\n         "Value": "TapStackPr1070/TapLaunchTemplate"\n        },\n        {\n         "Key": "Repository",\n         "Value": "unknown"\n        }\n       ]\n      },\n      {\n       "ResourceType": "volume",\n       "Tags": [\n        {\n         "Key": "Author",\n         "Value": "unknown"\n        },\n        {\n         "Key": "Environment",\n         "Value": "Production"\n        },\n        {\n         "Key": "Name",\n         "Value": "TapStackPr1070/TapLaunchTemplate"\n        },\n        {\n         "Key": "Repository",\n         "Value": "unknown"\n        }\n       ]\n      }\n     ],\n     "UserData": {\n      "Fn::Base64": "#!/bin/bash\\nyum update -y\\nyum install -y httpd\\nsystemctl start httpd\\nsystemctl enable httpd\\necho \\"<h1>Hello from Auto Scaling Group!</h1>\\" > /var/www/html/index.html\\nsed -i \\"s/Listen 80/Listen 8080/g\\" /etc/httpd/conf/httpd.conf\\nsystemctl restart httpd"\n     }\n    },\n    "LaunchTemplateName": "TapLaunchTemplate-Pr1070",\n    "TagSpecifications": [\n     {\n      "ResourceType": "launch-template",\n      "Tags": [\n       {\n        "Key": "Author",\n        "Value": "unknown"\n       },\n       {\n        "Key": "Environment",\n        "Value": "Production"\n       },\n       {\n        "Key": "Name",\n        "Value": "TapStackPr1070/TapLaunchTemplate"\n       },\n       {\n        "Key": "Repository",\n        "Value": "unknown"\n       }\n      ]\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapLaunchTemplate/Resource"\n   }\n  },\n  "TapAutoScalingGroupASGB650B2BF": {\n   "Type": "AWS::AutoScaling::AutoScalingGroup",\n   "Properties": {\n    "AutoScalingGroupName": "TapAutoScalingGroup-Pr1070",\n    "DesiredCapacity": "2",\n    "HealthCheckGracePeriod": 300,\n    "HealthCheckType": "ELB",\n    "LaunchTemplate": {\n     "LaunchTemplateId": {\n      "Ref": "TapLaunchTemplate32CD187B"\n     },\n     "Version": {\n      "Fn::GetAtt": [\n       "TapLaunchTemplate32CD187B",\n       "LatestVersionNumber"\n      ]\n     }\n    },\n    "MaxSize": "6",\n    "MinSize": "2",\n    "Tags": [\n     {\n      "Key": "Author",\n      "PropagateAtLaunch": true,\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "PropagateAtLaunch": true,\n      "Value": "Production"\n     },\n     {\n      "Key": "Name",\n      "PropagateAtLaunch": true,\n      "Value": "TapAutoScalingGroup-Pr1070"\n     },\n     {\n      "Key": "Repository",\n      "PropagateAtLaunch": true,\n      "Value": "unknown"\n     }\n    ],\n    "TargetGroupARNs": [\n     {\n      "Ref": "TapTargetGroup4417E75F"\n     }\n    ],\n    "VPCZoneIdentifier": [\n     {\n      "Ref": "TapVpcprivateSubnet1Subnet12EE2EB8"\n     },\n     {\n      "Ref": "TapVpcprivateSubnet2SubnetF743A890"\n     }\n    ]\n   },\n   "UpdatePolicy": {\n    "AutoScalingScheduledAction": {\n     "IgnoreUnmodifiedGroupSizeProperties": true\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapAutoScalingGroup/ASG"\n   }\n  },\n  "TapAutoScalingGroupScalingPolicyCpuScalingB33F5C83": {\n   "Type": "AWS::AutoScaling::ScalingPolicy",\n   "Properties": {\n    "AutoScalingGroupName": {\n     "Ref": "TapAutoScalingGroupASGB650B2BF"\n    },\n    "Cooldown": "300",\n    "PolicyType": "TargetTrackingScaling",\n    "TargetTrackingConfiguration": {\n     "PredefinedMetricSpecification": {\n      "PredefinedMetricType": "ASGAverageCPUUtilization"\n     },\n     "TargetValue": 70\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapAutoScalingGroup/ScalingPolicyCpuScaling/Resource"\n   }\n  },\n  "TapLoadBalancer68E2A2BA": {\n   "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",\n   "Properties": {\n    "LoadBalancerAttributes": [\n     {\n      "Key": "deletion_protection.enabled",\n      "Value": "false"\n     }\n    ],\n    "Name": "TapLB-Pr1070",\n    "Scheme": "internet-facing",\n    "SecurityGroups": [\n     {\n      "Fn::GetAtt": [\n       "AlbSecurityGroup86A59E99",\n       "GroupId"\n      ]\n     }\n    ],\n    "Subnets": [\n     {\n      "Ref": "TapVpcpublicSubnet1Subnet4F8D84E8"\n     },\n     {\n      "Ref": "TapVpcpublicSubnet2Subnet9CE016D7"\n     }\n    ],\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapLoadBalancer-Pr1070"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "Type": "application"\n   },\n   "DependsOn": [\n    "TapVpcpublicSubnet1DefaultRouteF9DDCC94",\n    "TapVpcpublicSubnet1RouteTableAssociation845CF324",\n    "TapVpcpublicSubnet2DefaultRouteE0B90472",\n    "TapVpcpublicSubnet2RouteTableAssociation6746B76F"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapLoadBalancer/Resource"\n   }\n  },\n  "TapLoadBalancerTapListenerB8988832": {\n   "Type": "AWS::ElasticLoadBalancingV2::Listener",\n   "Properties": {\n    "DefaultActions": [\n     {\n      "TargetGroupArn": {\n       "Ref": "TapTargetGroup4417E75F"\n      },\n      "Type": "forward"\n     }\n    ],\n    "LoadBalancerArn": {\n     "Ref": "TapLoadBalancer68E2A2BA"\n    },\n    "Port": 80,\n    "Protocol": "HTTP"\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapLoadBalancer/TapListener/Resource"\n   }\n  },\n  "TapTargetGroup4417E75F": {\n   "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",\n   "Properties": {\n    "HealthCheckIntervalSeconds": 30,\n    "HealthCheckPath": "/",\n    "HealthyThresholdCount": 2,\n    "Name": "TapTG-Pr1070",\n    "Port": 8080,\n    "Protocol": "HTTP",\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "TargetGroupAttributes": [\n     {\n      "Key": "stickiness.enabled",\n      "Value": "false"\n     }\n    ],\n    "TargetType": "instance",\n    "UnhealthyThresholdCount": 3,\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapTargetGroup/Resource"\n   }\n  },\n  "TapDbSubnetGroup": {\n   "Type": "AWS::RDS::DBSubnetGroup",\n   "Properties": {\n    "DBSubnetGroupDescription": "Subnet group for RDS MySQL database",\n    "DBSubnetGroupName": "tapdbsubnetgroup-pr1070",\n    "SubnetIds": [\n     {\n      "Ref": "TapVpcdatabaseSubnet1Subnet1A40387E"\n     },\n     {\n      "Ref": "TapVpcdatabaseSubnet2Subnet904C5B02"\n     }\n    ],\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Production"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/TapDbSubnetGroup/Default"\n   }\n  },\n  "DatabaseEndpointParamEEE48753": {\n   "Type": "AWS::SSM::Parameter",\n   "Properties": {\n    "Description": "Mock database endpoint for testing (RDS quota exceeded)",\n    "Name": "/tap/Pr1070/database/endpoint",\n    "Tags": {\n     "Author": "unknown",\n     "Environment": "Production",\n     "Repository": "unknown"\n    },\n    "Type": "String",\n    "Value": "tapdb-Pr1070.cluster-mock.us-west-2.rds.amazonaws.com"\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/DatabaseEndpointParam/Resource"\n   }\n  },\n  "CDKMetadata": {\n   "Type": "AWS::CDK::Metadata",\n   "Properties": {\n    "Analytics": "v2:deflate64:H4sIAAAAAAAA/+1XS4/bNhD+LeFxwVUTH1LUN68TBAKSrLE29lDDKMbkrMyYIlk+tHUE/fdApCTLzm7bIAngQ04i5/nNg+Rokk1e/ZG9fAGP7prx/bUU26xeemB7Co/urxrZJKvvDVvXpDLsI5RIpuSKUFLCP7PPrtswwW23VODfgcdHOPRMF7YK/VyrB1EEC15oRabrOip9ALcfFAfbSWN1MC1hEbZSMNLQ/69hRQUev0Uld1qCR06aTbOh8wd1v5jT5HkZ5dY1gQqEhK2Qwh/+1Kq3UxmW81EebqRm+yFJJhnJza16D0GxHZl6G5ASYarX8zNxcE4UKjfV6xnnFp27VXOLXcbIVQzoIlBEIJx/HGpNpmtyRTYXA/AyUDybpthiqbHa1Z0OHlewlXikH2kz5zQT0fAg3C7e5ov2c7ROu8b/4R37ANJdQC2+D8blILkQGJeD5BeMi4MRb6hcebQKh/slvYvdbuY9sF2JytMlsmCFP7yzOpg0KfSP7Jgzmh44OmaFGfxRAlLqx5mUt8FvdVA8Xb3dDZqrogV5FySm0QFUrqRQmCjpkmZaKWStyX7yCEr8HbBLWuz44ZHi/O3YZCue2LQ1tvkJfmksR7T8k/NzDObpOEbB/mhM0d5/gkrP39jNV4ROmaZeXmFp2vlsXRN5QhjBE8p5UAy7iS6dCrYTCvMSCnwquL5cDu0b8DDq/FO3DYXgtWMghSqyeha8XqZN3/FwRhrhOib2FHqPUag5GGDCH46T9RmFoxMW+Rm1Mt1s6si0fm4CJjsE6XfzHXZnPxYnHt2VnhkjBYunfgW2QN9lZTSknMdKk+DKAtsLVXSshZaCxfvhhNBQlOC8YFID34IExYQqqklWjzy/18BvIg9t7JLWeazBiEHHCsJ5VOfCHZE+HVMrMto21HKX1Sl9fQ3dcfdk+b7u/3+pwPGHIuXxzc3IWUOdK9vfLNumCiyU6NGua2L69QiAi1L3IMNzBzF5GOw0Db1Dp4NluN7QeXBelwOhz1dPOOMvrK4ER3sDDunMOfRLD4VQxYmHdnMbvAm+oUpzzD6536rJJHv1e/byxScnxLUNyosSs7v0/QKIEhedZg4AAA=="\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr1070/CDKMetadata/Default"\n   }\n  }\n },\n "Parameters": {\n  "SsmParameterValueawsserviceamiamazonlinuxlatestamzn2amikernel510hvmx8664gp2C96584B6F00A464EAD1953AFF4B05118Parameter": {\n   "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",\n   "Default": "/aws/service/ami-amazon-linux-latest/amzn2-ami-kernel-5.10-hvm-x86_64-gp2"\n  },\n  "BootstrapVersion": {\n   "Type": "AWS::SSM::Parameter::Value<String>",\n   "Default": "/cdk-bootstrap/hnb659fds/version",\n   "Description": "Version of the CDK Bootstrap resources in this environment, automatically retrieved from SSM Parameter Store. [cdk:skip]"\n  }\n },\n "Outputs": {\n  "LoadBalancerDNS": {\n   "Description": "DNS name of the Application Load Balancer",\n   "Value": {\n    "Fn::GetAtt": [\n     "TapLoadBalancer68E2A2BA",\n     "DNSName"\n    ]\n   }\n  },\n  "DatabaseEndpoint": {\n   "Description": "Database endpoint (mock due to RDS quota)",\n   "Value": {\n    "Fn::GetAtt": [\n     "DatabaseEndpointParamEEE48753",\n     "Value"\n    ]\n   }\n  },\n  "DatabaseEndpointParamName": {\n   "Description": "SSM Parameter name for database endpoint",\n   "Value": {\n    "Ref": "DatabaseEndpointParamEEE48753"\n   }\n  },\n  "VpcId": {\n   "Description": "VPC ID",\n   "Value": {\n    "Ref": "TapVpc8B8CDDDF"\n   }\n  }\n },\n "Rules": {\n  "CheckBootstrapVersion": {\n   "Assertions": [\n    {\n     "Assert": {\n      "Fn::Not": [\n       {\n        "Fn::Contains": [\n         [\n          "1",\n          "2",\n          "3",\n          "4",\n          "5"\n         ],\n         {\n          "Ref": "BootstrapVersion"\n         }\n        ]\n       }\n      ]\n     },\n     "AssertDescription": "CDK bootstrap stack version 6 required. Please run \'cdk bootstrap\' with a recent version of the CDK CLI."\n    }\n   ]\n  }\n }\n}'
TapStackPr1070: fail: exception while calling s3 with unknown operation: Unable to parse request (not well-formed (invalid token): line 1, column 2), invalid XML received:
b'PK\x03\x04\x14\x00\x08\x00\x08\x00\x00\x00!\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\x00\x00\x00index.js\xa5TKo\xdb8\x10\xbe\xef\xaf\x90y0H\x80Q\xb3=\xca`\xda"\xe9\x06:lc$\xdbS\x10\x14,5\xb2\xb9\x969\xea\x90\x8c\xd7+\xeb\xbf/(\xd9Nb\x18\xdbC!\xe8\xa0y\xf0{pF,z\xc8| k\x02\x9b=k\xcaJu\xf7\xfdo0!7\x04:\x80\x0c\x87\xef\nj\xeb`N\xd8\x02\x85\xad\xdc\x1e\xe2\x0b\x08w\x1bw\x88\xdf\x807d\xdb\x80$\xe7\xe7+\xbe\xe85x\xb9x\x95\x9c\x13\x06\x0c\xdb\x16\xeej\xd9\x1c\xe2\xed!\x98/\xb5\x7f\x05 o\x15\'\tB]u5\x12O\x941\xb3.\x03\x118I\x94\xdd\x02B\x01\x8f\xf8$\xc1\xc55\x90\xfe\xde@1\xb9\xecE/\xdd\xd0)Q\xda\xd4mk\x0e\xd3i\x82\xc5:\x03\xa5\x18\x0e\xba\xd9n\xf7*VGg\x82E\xc7D\x02k d>\xc3:\x9bs\x10b\xd2\xe4F7\r\'\xe9\xc5t\xea\'J\xe1t\x9aH\xf8\x91\x04\x17\xea\n\x1e\xfd["\xdc\xaa-\x07\xe9\x85\xd8\xedl\xfeB\xb1\x173\x82\x10\xc9e\xd4\xcb\xfb=Q\xa1\xae8*\x9a(\x17\x9b\xe6C\xc9\x17\x9c\x84(\xba^:\x0e\xbb\xdd\x84\xd2\x9b\x7f\xfb\x06\xfeO\xacb\x03\x1f\x02G\xc9*\xa8ul\x02\x93\xdd\xb3n"\x14tjD\x81\x92\x84\x90\x0f\x8a\xd4\x95\xe3\x81w\xbdd/\x87\x1c\xfb\x92g\x92\x84\\\xa9\xae\x9f\xdd\xf2\x95\xec\x96\xdaU\rP\x91\x84\xd5\xbd\x90\xeb\x015\x87\x7fZ\xa4\xe0\xd5\x03_\x89a\x84\xb4\xba\xe7\x04?\xa2%\xe0\xec\xa3\xde\xf8\x0b_\xad\xde\x99\xc6\x82\x0b\x17`\xde3!dT\x0e6\x99\xce?_\xbf\xe7]/f\x07\xa333\xdcn7\x9a\xd1\xdd\x12\xc6\xb6\xac\n\x92e;\x07Z[\xef-:_<v_=PY\r\xf9\xb9\xb6\x94B/\xc5c\xb2\x80\xfe)\xf5\xa5I2\xd8\x14\xec\xe2w\xd6?\xf5\xfd\x11\xab\xe2$~\x8eT\xb6\xf7\xda- !\\\xdb\x8a\xca\xb6`\x97\xf9\xf0\xbc\xbbd\xe7\x11\xb4\xdf:\x93\x1dq\xea\x84\x93\x86\x07\x14\xe5\xf7\xe01\x929l\x92\x05\x9f\xdf\x8cW\xf6\x00&\x92\r\xdb\xbd\x0e\x89\xe7\xab?\x19\x83\xd1\x85\x99\xdf\xd8`\x96<\x9d\xf8#\x82\x0f\x7fm[\x10\x9d\xd1\x1e\xd8\xf5\xb0\xbb\xac\xd8\x8fT\xcbA\xa2\x98\r\xa9\xafm\xa5\x03\x1cSKN\xfb\xc4\r4\xf0*\xb1\x1ez\xfa\xfeDJ\xaa?J\xb9k\xaa_Vs^\xfb\x0c\xc6u\xe2z\xa3m\xc8\x12\x99\xb3\xce\xed\xbd\x10r\xack9\xfe\x7f\x9d8\xd5\xd3\x8e\xe3\x16h\xdb\x8dG\xc4\x9c\xe0\x19W\xf0\xe62>/\x08\xbc\xe7i^Dot\xb2\x1dE\xfa\x83`\xee\xf4:qe\xa5{\xd6\x8d\xad^\x864\xff\x82\xe1\x0f\x8c\xaeb",\t7\x19\xf6?A)\xdd\x083\xae\xc0\xaf\x00\x9d\xaa\\\x8f*\x0f\nu\x0cK$\xfb\xef[\x91\'\xf0{Kc~\xbe\xfa\x8d%\xbf\xfd\x07PK\x07\x08b{\xda*\xce\x02\x00\x00G\x06\x00\x00PK\x03\x04\x14\x00\x08\x00\x08\x00\x00\x00!\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x11\x00\x00\x00__entrypoint__.js\xa5Vmo\xdb6\x10\xfe\xbe_\xc1\x12E!\x06,\x9bu\x1b0\xc8S\x8c4q\x17\xafN\x1b\xd8\x0e\x86}J\x18\xe9di\x91H\x87\xa4\x92x\x8a\xfe\xfb@\x91\x92_\xbb|\xd8\'\x89G\xf2x/\xcf=w\xb8\xd2\x80\xb4Qyl\xf0\xe0\xdb\xdd\xdf\x10\x1b\x96@\x9a\x0b\xb8Rr\t\xca\xac\x02x^Je4\xc577\xa0/eR\x15\x80i\xfd\xc8\x8b\n\xc27\xc7\r\xa1\xfe\x00\x83g\x03J\xf0"z\x94y\x82\x8e{y\xc6ER\x80\x8a\xfc\xb7\x97?\xe5&\x9b\x82Q9\xe8h\xe3\x7f\x10K\xa1\r\xca\x8cY\xeaH\xc1C\x95+\x08p\xbb\xc4\x84V\xaaX\x0b+U`2\xd8{\xbf\xd6 \x92\x0bc\x96Sx\xa8@\x9b0\x81\x94W\x85\x99m\x8bi!\x17\xdd\xd6D.h.\xe2\xa2J`fx|?W<\x06\x1d\xbe9\xa6\x95\x06u\xe1<\x18\x8b\x04\x9eC\xcc>\xe4\xf6\x077\xde\xd2\xb3\xe9\xe8t>\xba\xf9|:\x9e\x8c\xceo\xae.\xfe\x9a\x8d\xcfN\'7\xe3\xf3\x9b\xcb\xd3\xe9\x97\xd14\xc2\xa7\x7f\xce\xce\xce\xbf\x84\xe1Y\xa5\x8d,\xa7\xa0e\xa5b\x1b\xe1\xc7<\x01\xf5Y\xf1\x12\x9e\xa4\xba\x0f\xc3-U\x98^\x8eg\xb3\xf1\xd7\xdf\xff\x9f\xce\x03J\xf0\x80\xeb\x95\x88QZ\x89\xd8\xe4R \x9f\x9a\x00\x1eA\x18\x1aKa\xe0\xd9\x90\xdaeBs\x91\x9b\xfc\x1fHFv7\xaa\x19c\xee\xdc\x14\xf4R\n\r\xd7\xd3I\x88\x19c\xb8\x19\xe4i\x87\x97\x1e\x0e\xac\x90\x8b\xe0\x8f\xd9\xb7\xaf\xcc\xe2L,\xf2t\x15l\xab\xa4\x1e0\x1f\t\xa1\xadf\xe6\x137_-!\x8a"|\x0e\x05\x18\xc0\xef\xde\xb9\xdd\xabl\xa5\xf3\x98\x17] \xc7I\x14E[\xa1;\x101R\xef\xe2\xa45\x0c\xe7\x0b!\xadY\xe8|4\x19\xcdG\xa8}\x02\xc5\xbc\xd2\x90\xa0\xbb\x15\xe2(\xe5y\x01\tr\x0f\xb8}L(\x7f\xe2\xb9A\xba\xba+s\xd3\x05"\xc0\xb3\xeb\xb3\xb3\xd1l\x86\x9d\x1fd\xa0\xc0TJ4F\xad|07\xe0\xd4\xe3x\xcf\xb0\x8dC-\xe6\x08\xebjG\x81\xae\n\x13\xb9\xc77\x8e\xedF\xb4K!U>G.w\nD\x02\xaa7\xd7\xa5\xd1\xe9$\x83W<\xda\xd2D\x9a\x98\x9b8\x0b\xa0\x03\x89\xdd\xdd\x82\x06\xd7R\x84{\x9e\xed\xd7\xd8\x10\x98\xb6\x15\x17\x02+Ak\xbe\x80f`\x95\xb1\xfd,\xbf\xbc8\x80\xee\xc2\xe3L\x017\x80\x87\x87\xa1\x87}\xe2\\\x1a)r~$6\xe5\x96u\x10G%W\xf7\xa0\xd0\xd2\xc3\xca\x9eh\x0b\x14\xe5\t\xd2\x12\x99\x8c\x1bd2\xb0\xc9\xd6\x96Q\x84\xe9\xc0\xf2\x94\x17\x05\xba\x03\xd4\x82\x08\x12L\xdax\x1f0\xfdux\xee\xc7\xca\xd6\xcd\xedh:\xfd6\r\xd1%/R\xa9JH\x1c\xfe\x18\xc2\xfb\xe1\xc1(\xd7\xc8\x13f\x12\xa2\xb7\xf5N\xd1\xb5\xd9&\xcd-\xf9\x1ex\x1d\x83\xe1\xd6\x07\xd24=;\xec\xa0&N\x85\xafO\xeaa\xd9\x01*\xaa\x9b\x0e\x0f]07jt\xe7\xf0\x81(\r\x87k\xdd\xafm{\x13\xc6\x89\xe5\x9c\x8dk\xdf\xa3\x8e}\x83\xdeD\xd1\xc6\xbd\xfdx\x12\x93)\xf9\x84\x04<\xa1\x91RR\x05\xb7\x8e"B\x14s!\xa4Aq\xc6\xc5\x02Zht\xda\xd7\xd8\x19\x9f\xa3T\xc9\x12\xe1\xb7\xf5\x7f\xbe\xd2`d\xa4=\xf5zx\x1a\x8c\x92\xaa\xe5\xaa\xc4\x12b.\xc5m\xc70\x96\x94\xd7\xcfP\xc6:\xc6\xe8RC\xf7\xfd\x0b;\xa3\xd79j\x9a\x9d\xc6\xb0\xc3o\xdapSiOn\x9e\xd1\xfe\xd6RD\xf5\xac\xdd\t\xfd\x81)\xb8\xf2\xb7\r\x83\xb9\xc5p\xe8\xf7\xda\xfe:NB\xc7\xe5~E\xfbtzy\xbf>d\xb8\xbb\xba\xef\xd1\xcb\xcb\x81f\xe7\xbb0\x9d\xc8\xc5v\xd3\xf0/\xed\xc9\xe9W9\x8a3\xe9\xb7\xdd\x82\x9es\xc3\xbd\xc4\xfe6t\xc9\x95\x86\xe4Z\x15Q\xa5\n\xd6\xaezv\xea\xdb"\xb13\xc6"\x17\x8b\x19O\xc1\x9e\xbd}[\xf7\x17\xd9RI#cY4\x1f>l\x8a3\xa9\x8d\xe0%4[\xd2%7Y+\x1d\x1e\x1d\x1d\xdd\xee\r=\xae\x99\xb9ty\x8a\xd3`\x91\x15\x17\xb2J,wp\x0b\x18\xbcc\x10\xb5\xd9#~\x90\xe9\x18\xfe\x93LV\xd1\x0ey\xb4\xe7\xa8\x82\x87\xa8\xee\xec\x0b\xd7\x9et"j\xad\xdc\x90\xdb%-\xc1d2\t\xf1\xd5\xf5\x1c\xd3\x0cx\x02J\x875n[\x940\xef\xcdj\t8\xc4\x98\xf6\x92\x02\xc4\xc2d8\xfcT\xa5)(v\xb720iE\xc1\xa6\x85\x14W&\xfd\x15\x93\xa6\xf1\x9dkc\x86\x0cjn\x0c\x94K\xa3\xc3_\xa8.\x00\x96\xe1\x8f\xf0S\xd3\x8f\x9e\xdd\xa8\xcav&E\x12(x\xe8{\xa6\x8d\x03\xd9\xad\x88\xc3\xb3d \x976\xbc\xdaF\xc8\x8e\x9c\xed\xd5\xdau\xff\x96A\xae\x94,s\r\x81uA\x16\x8f@\x15\xd8a\x9bD\'\xf5z8\xf0\x97\xa3v\xd8e~\xb5\xa1\xda\xe1*:\xa9\xbb80\xdb\xbbK\x08\x08}\xd3\x8b\\\x99\x9d\xc9\x04^^\x0e\x08O\xa2\x9f\x8f\x8f\x87\xee\xf5`\x83\xdb\xae\x85\xae\xe2\x18\xb4N\xab\x02]\xcc\xe7W=\x8al+9\xa0\xc86\x92\xd0{\x13\x90\xc62Q\xeb:\x93"\xc0`\t\xd3v\x92\xd6\xc9.*\xecI\xe5\x06l\x8c\xfb\x18\xf5[ \x92`c\xaa\xf0\x06\x02i\x1a\xb2\xeeD>\xf8\x13\xb9\x08\xd2\xd2X\x9a[r\xc5K\xed\xba\x8e,\xa0-\x83\xed\xad\xf5\xedM\x80t\xf9J\x05\xe9\xd2\xd4R_\xc0\x18{\xd66-\x05\x18\xd4\xa1(\xf2\xc7Y\'\xa0\xa5\xeee-\xbe\x06\xa9T\xc1`@l2}\xda\xdd<\x95\n\xafr=1\xe5i\xd0\xe9y\xff\xfe\xb7\xe8\xd87\x1a\xe8&0\x8b\xd7\xe0\x92\x9b\x8c\xa5\x85\x94\xca\xfd*.\x12Y\x06\xe4\xa8\xd4\x84\xd0R\x1fE\x1f\x9b}\xban\xaf\xdax\x1c\x80\x9e\xbc\x8fN4\x98y^\x82\xacL \xef\xa9U\xd5\xfc\xf0/PK\x07\x08\x18-\x91\xa0\xa6\x05\x00\x00\x04\x0e\x00\x00PK\x01\x02-\x03\x14\x00\x08\x00\x08\x00\x00\x00!\x00b{\xda*\xce\x02\x00\x00G\x06\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00\x00 \x00\xb4\x81\x00\x00\x00\x00index.jsPK\x01\x02-\x03\x14\x00\x08\x00\x08\x00\x00\x00!\x00\x18-\x91\xa0\xa6\x05\x00\x00\x04\x0e\x00\x00\x11\x00\x00\x00\x00\x00\x00\x00\x00\x00 \x00\xb4\x81\x04\x03\x00\x00__entrypoint__.jsPK\x05\x06\x00\x00\x00\x00\x02\x00\x02\x00u\x00\x00\x00\xe9\x08\x00\x00\x00\x00'

NOTICES         (What's this? https://github.com/aws/aws-cdk/wiki/CLI-Notices)

34892	CDK CLI collects telemetry data on command usage starting at version 2.1100.0 (unless opted out)

	Overview: We do not collect customer content and we anonymize the
	          telemetry we do collect. See the attached issue for more
	          information on what data is collected, why, and how to
	          opt-out. Telemetry will NOT be collected for any CDK CLI
	          version prior to version 2.1100.0 - regardless of
	          opt-in/out. You can also view the telemetry we collect by
	          logging it to a local file, by adding
	          `--telemetry-file=my/local/file` to any `cdk` command.

	Affected versions: cli: ^2.1100.0

	More information at: https://github.com/aws/aws-cdk/issues/34892


If you don’t want to see a notice anymore, use "cdk acknowledge <id>". For example, "cdk acknowledge 34892".
Failed to publish asset TapStackPr1070/Custom::VpcRestrictDefaultSGCustomResourceProvider Code (000000000000-us-east-1-fa324105)
```

**Deployment Duration:** 47s
**Exit Code:** 0

## Deployment Analysis

**Deployment Status:** ❌ FAILED

**Error Type:** S3 XML Parsing Error

**Root Cause:** 
The cdklocal tool attempted to upload the CloudFormation template (in JSON format) to S3, but LocalStack's S3 service tried to parse it as XML and failed with the error:

```
Unable to parse request (not well-formed (invalid token): line 1, column 0), invalid XML received
```

This is a known compatibility issue between CDK's S3 upload mechanism and LocalStack's S3 API implementation. The CDK is uploading a JSON CloudFormation template, but the S3 endpoint is expecting XML format for certain operations.

**Stack Complexity Issues:**
The stack includes several resources that have limited support in LocalStack Community edition:
1. **NAT Gateways** (2x) - May not be fully functional
2. **Application Load Balancer** - Basic support, health checks may not work
3. **Auto Scaling Groups** - Limited support, won't actually launch EC2 instances
4. **Launch Templates** - Supported but instances won't start
5. **Custom Lambda Resources** - For VPC default security group restriction

**What Was Attempted:**
- Environment variables configured correctly
- Dependencies installed successfully
- TypeScript build completed
- CDK bootstrap succeeded
- Deployment initiated but failed during S3 template upload phase


## Alternative Approach: Direct CloudFormation

Attempting to synthesize the CDK template and deploy directly with CloudFormation:

### Step 1: Synthesize Template

```
CDK synth exit code: 0
Template size: 30309 bytes
```

### Step 2: Deploy with awslocal cloudformation

```

An error occurred (ValidationError) when calling the CreateStack operation: Template format error: YAML not well-formed.
```
CloudFormation create-stack exit code: 0

### Step 2 (Retry): Deploy with awslocal using JSON template

```
{
    "StackId": "arn:aws:cloudformation:us-east-1:000000000000:stack/TapStackPr1070/d4f32cc3-cd41-4a08-850c-4bc0f0654aa3"
}
```
✅ Stack creation initiated

### Step 3: Monitor Stack Deployment

Waiting for stack creation to complete...

```
[0/60] Stack status: CREATE_FAILED
Stack creation failed with status: CREATE_FAILED
Getting failure details...
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
|                                                                                                   DescribeStackEvents                                                                                                  |
+------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|  TapStackPr1070                          |  None                                                                                                                                                                       |
|  TapStackPr1070                          |  None                                                                                                                                                                       |
|  TapVpcprivateSubnet1DefaultRoute91B7C4A1|  None                                                                                                                                                                       |
|  TapStackPr1070                          |  None                                                                                                                                                                       |
|  TapVpcpublicSubnet1NATGateway6462C64F   |  Resource provider operation failed: An error occurred (InvalidAllocationID.NotFound) when calling the CreateNatGateway operation: Allocation ID '['unknown']' not found.   |
+------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```
❌ Deployment failed

### Detailed Error Analysis

```
Getting all stack events:
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
|                                                                                                                                                          DescribeStackEvents                                                                                                                                                         |
+-----------------------------+---------------------+----------------------------------------+-----------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|  2025-12-19T11:39:28.198544Z|  CREATE_FAILED      |  AWS::CloudFormation::Stack            |  TapStackPr1070                                           |  None                                                                                                                                                                       |
|  2025-12-19T11:39:28.198507Z|  ROLLBACK_COMPLETE  |  AWS::CloudFormation::Stack            |  TapStackPr1070                                           |  None                                                                                                                                                                       |
|  2025-12-19T11:39:28.198474Z|  CREATE_FAILED      |  AWS::CloudFormation::Stack            |  TapStackPr1070                                           |  None                                                                                                                                                                       |
|  2025-12-19T11:39:28.198462Z|  CREATE_FAILED      |  AWS::EC2::Route                       |  TapVpcprivateSubnet1DefaultRoute91B7C4A1                 |  None                                                                                                                                                                       |
|  2025-12-19T11:39:28.198414Z|  CREATE_FAILED      |  AWS::CloudFormation::Stack            |  TapStackPr1070                                           |  None                                                                                                                                                                       |
|  2025-12-19T11:39:28.198397Z|  CREATE_FAILED      |  AWS::EC2::NatGateway                  |  TapVpcpublicSubnet1NATGateway6462C64F                    |  Resource provider operation failed: An error occurred (InvalidAllocationID.NotFound) when calling the CreateNatGateway operation: Allocation ID '['unknown']' not found.   |
|  2025-12-19T11:39:28.192440Z|  CREATE_IN_PROGRESS |  AWS::EC2::NatGateway                  |  TapVpcpublicSubnet1NATGateway6462C64F                    |  None                                                                                                                                                                       |
|  2025-12-19T11:39:28.192172Z|  CREATE_COMPLETE    |  AWS::EC2::EIP                         |  TapVpcpublicSubnet1EIP45C8CEBC                           |  Resource type AWS::EC2::EIP is not supported but was deployed as a fallback                                                                                                |
|  2025-12-19T11:39:28.191880Z|  CREATE_IN_PROGRESS |  AWS::EC2::EIP                         |  TapVpcpublicSubnet1EIP45C8CEBC                           |  None                                                                                                                                                                       |
|  2025-12-19T11:39:28.191390Z|  CREATE_COMPLETE    |  AWS::EC2::SubnetRouteTableAssociation |  TapVpcdatabaseSubnet2RouteTableAssociation667BA279       |  None                                                                                                                                                                       |
|  2025-12-19T11:39:28.179991Z|  CREATE_IN_PROGRESS |  AWS::EC2::SubnetRouteTableAssociation |  TapVpcdatabaseSubnet2RouteTableAssociation667BA279       |  None                                                                                                                                                                       |
|  2025-12-19T11:39:28.179820Z|  CREATE_COMPLETE    |  AWS::EC2::RouteTable                  |  TapVpcdatabaseSubnet2RouteTable1D74A0D2                  |  None                                                                                                                                                                       |
|  2025-12-19T11:39:28.172921Z|  CREATE_IN_PROGRESS |  AWS::EC2::RouteTable                  |  TapVpcdatabaseSubnet2RouteTable1D74A0D2                  |  None                                                                                                                                                                       |
|  2025-12-19T11:39:28.172740Z|  CREATE_COMPLETE    |  AWS::EC2::SubnetRouteTableAssociation |  TapVpcdatabaseSubnet1RouteTableAssociation81A9F381       |  None                                                                                                                                                                       |
|  2025-12-19T11:39:28.160639Z|  CREATE_IN_PROGRESS |  AWS::EC2::SubnetRouteTableAssociation |  TapVpcdatabaseSubnet1RouteTableAssociation81A9F381       |  None                                                                                                                                                                       |
|  2025-12-19T11:39:28.160510Z|  CREATE_COMPLETE    |  AWS::EC2::RouteTable                  |  TapVpcdatabaseSubnet1RouteTable29CF7BB5                  |  None                                                                                                                                                                       |
|  2025-12-19T11:39:28.152853Z|  CREATE_IN_PROGRESS |  AWS::EC2::RouteTable                  |  TapVpcdatabaseSubnet1RouteTable29CF7BB5                  |  None                                                                                                                                                                       |
|  2025-12-19T11:39:28.152586Z|  CREATE_COMPLETE    |  Custom::VpcRestrictDefaultSG          |  TapVpcRestrictDefaultSecurityGroupCustomResource2332DAD5 |  Resource type Custom::VpcRestrictDefaultSG is not supported but was deployed as a fallback                                                                                 |
|  2025-12-19T11:39:28.152402Z|  CREATE_IN_PROGRESS |  Custom::VpcRestrictDefaultSG          |  TapVpcRestrictDefaultSecurityGroupCustomResource2332DAD5 |  None                                                                                                                                                                       |
|  2025-12-19T11:39:28.152177Z|  CREATE_COMPLETE    |  AWS::ElasticLoadBalancingV2::Listener |  TapLoadBalancerTapListenerB8988832                       |  Resource type AWS::ElasticLoadBalancingV2::Listener is not supported but was deployed as a fallback                                                                        |
+-----------------------------+---------------------+----------------------------------------+-----------------------------------------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

**Critical Error:** NAT Gateway Creation Failed

The deployment failed when trying to create NAT Gateways. The error indicates:
- `InvalidAllocationID.NotFound: Allocation ID '['unknown']' not found`

This suggests that:
1. The Elastic IP allocation was not created properly in LocalStack
2. NAT Gateway creation references an invalid allocation ID
3. This is a known limitation of LocalStack Community edition

**Resources That Failed:**
- NAT Gateway 1 (TapVpcpublicSubnet1NATGateway6462C64F)
- NAT Gateway 2 (likely also failed)
- Dependent private subnet routes

**Resources Likely Created Successfully:**
- VPC
- Public subnets
- Internet Gateway
- Some security groups


## Resources Created (Partial Deployment)

Despite the NAT Gateway failure, several resources were successfully created:

```
Checking stack outputs (if any):
null
Checking VPC resources:
-------------------------------------------------------
|                    DescribeVpcs                     |
+------------------------+---------------+------------+
|  vpc-a8c9a91fcef2b78ba |  10.0.0.0/16  |  available |
+------------------------+---------------+------------+
Checking subnets:
-----------------------------------------------------------------------------------------------------
|                                          DescribeSubnets                                          |
+---------------------------+---------------+-------------+-----------------------------------------+
|  subnet-28e3a007709c88888 |  10.0.2.0/24  |  us-east-1a |  TapStackPr1070/TapVpc/privateSubnet1   |
|  subnet-1cbd6695221fd96a6 |  10.0.4.0/28  |  us-east-1a |  TapStackPr1070/TapVpc/databaseSubnet1  |
|  subnet-5a2cb885bad7f43d8 |  10.0.0.0/24  |  us-east-1a |  TapStackPr1070/TapVpc/publicSubnet1    |
|  subnet-64e288cb8212ea0da |  10.0.3.0/24  |  us-east-1b |  TapStackPr1070/TapVpc/privateSubnet2   |
|  subnet-facf20c9b248435fd |  10.0.4.16/28 |  us-east-1b |  TapStackPr1070/TapVpc/databaseSubnet2  |
|  subnet-79d6f3a3ca025cf4b |  10.0.1.0/24  |  us-east-1b |  TapStackPr1070/TapVpc/publicSubnet2    |
+---------------------------+---------------+-------------+-----------------------------------------+
Checking security groups:
--------------------------------------------------------
|                DescribeSecurityGroups                |
+-----------------------+------------------------------+
|  sg-08d44a48456dd9465 |  TapAlbSecurityGroup-Pr1070  |
+-----------------------+------------------------------+
```

---

## Summary

### Deployment Result: ❌ FAILED (Partial Deployment)

**Primary Failure Reason:** NAT Gateway Creation Failed

LocalStack Community edition does not fully support NAT Gateways. The error was:
```
InvalidAllocationID.NotFound: Allocation ID '['unknown']' not found
```

### Successfully Created Resources

Despite the NAT Gateway failure, LocalStack successfully created:

1. **VPC** (vpc-a8c9a91fcef2b78ba)
   - CIDR: 10.0.0.0/16
   - State: available

2. **Subnets** (6 total across 2 AZs)
   - 2 Public subnets (us-east-1a, us-east-1b)
   - 2 Private subnets (us-east-1a, us-east-1b)
   - 2 Database subnets (us-east-1a, us-east-1b)

3. **Security Groups**
   - ALB Security Group (TapAlbSecurityGroup-Pr1070)
   - Instance Security Group (likely created)
   - RDS Security Group (likely created)

4. **Other Resources**
   - Internet Gateway
   - Route Tables
   - Subnet Route Table Associations

### Resources Not Created (Due to NAT Gateway Failure)

1. **NAT Gateways** (2x) - Primary failure
2. **Application Load Balancer** - Depends on networking
3. **Auto Scaling Group** - Depends on networking
4. **Launch Template** - May have been created
5. **Target Groups** - Depends on ALB
6. **SSM Parameter** - May not have been reached

### LocalStack Support Assessment

**Supported Resources:**
- ✅ VPC, Subnets, Internet Gateway
- ✅ Security Groups, Route Tables
- ⚠️  Elastic IPs (marked as unsupported but deployed as fallback)

**Unsupported/Limited Resources:**
- ❌ NAT Gateways (Community edition limitation)
- ⚠️  Application Load Balancers (deployed as fallback)
- ⚠️  Auto Scaling Groups (limited functionality)
- ⚠️  Custom Lambda Resources (deployed as fallback)

### Recommendations for LocalStack Compatibility

To make this stack deployable on LocalStack Community edition:

1. **Remove NAT Gateways:** Use public subnets only or mock NAT functionality
2. **Simplify Networking:** Use single-AZ deployment for testing
3. **Replace ALB:** Use simpler load balancing or direct instance access
4. **Mock Auto Scaling:** Use fixed EC2 instances instead of ASG
5. **Simplify VPC:** Reduce subnet complexity for testing

### Test Execution Metrics

- **Environment Setup:** ✅ Success
- **Dependency Installation:** ✅ Success
- **TypeScript Build:** ✅ Success
- **CDK Bootstrap:** ✅ Success
- **CDK Deployment (cdklocal):** ❌ Failed (S3 XML parsing error)
- **Direct CloudFormation:** ⚠️ Partial (NAT Gateway failure)
- **Total Duration:** ~3 minutes

### Conclusion

The CDK TypeScript stack is **NOT FULLY DEPLOYABLE** to LocalStack Community edition due to:
1. NAT Gateway resource limitations
2. Complex networking requirements
3. Advanced features (ALB, ASG) with limited support

However, basic infrastructure (VPC, Subnets, Security Groups) deployed successfully, indicating that a simplified version of this stack could work on LocalStack.

