# LocalStack Deployment Test

**Date:** $(date)
**Task:** /home/ubuntu/iac-test-automations/worktree/github-fetch-649
**Platform:** cdk
**Language:** ts
**PR ID:** Pr649

---


## Dependencies Installation

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
added 1977 packages, and audited 2321 packages in 3m

307 packages are looking for funding
  run `npm fund` for details

17 vulnerabilities (5 low, 1 moderate, 11 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
```


## Build

```

> tap@0.1.0 build
> tsc --skipLibCheck

```


## Bootstrap

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


## Bootstrap (Retry with AWS_ENDPOINT_URL_S3)

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

[WARNING] aws-cdk-lib.aws_ec2.InstanceProps#keyName is deprecated.
  - Use `keyPair` instead - https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2-readme.html#using-an-existing-ec2-key-pair
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_ec2.InstanceProps#keyName is deprecated.
  - Use `keyPair` instead - https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2-readme.html#using-an-existing-ec2-key-pair
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_ec2.InstanceProps#keyName is deprecated.
  - Use `keyPair` instead - https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2-readme.html#using-an-existing-ec2-key-pair
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_ec2.InstanceProps#keyName is deprecated.
  - Use `keyPair` instead - https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2-readme.html#using-an-existing-ec2-key-pair
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


## Deployment

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

[WARNING] aws-cdk-lib.aws_ec2.InstanceProps#keyName is deprecated.
  - Use `keyPair` instead - https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2-readme.html#using-an-existing-ec2-key-pair
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_ec2.InstanceProps#keyName is deprecated.
  - Use `keyPair` instead - https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2-readme.html#using-an-existing-ec2-key-pair
  This API will be removed in the next major release.

✨  Synthesis time: 5.3s

TapStackPr649: start: Building TapStackPr649/Custom::VpcRestrictDefaultSGCustomResourceProvider Code
TapStackPr649: success: Built TapStackPr649/Custom::VpcRestrictDefaultSGCustomResourceProvider Code
TapStackPr649: start: Building TapStackPr649 Template
TapStackPr649: success: Built TapStackPr649 Template
TapStackPr649: start: Publishing TapStackPr649/Custom::VpcRestrictDefaultSGCustomResourceProvider Code (000000000000-us-east-1-fa324105)
TapStackPr649: start: Publishing TapStackPr649 Template (000000000000-us-east-1-edd6dd51)
TapStackPr649: fail: exception while calling s3 with unknown operation: Unable to parse request (not well-formed (invalid token): line 1, column 2), invalid XML received:
b'PK\x03\x04\x14\x00\x08\x00\x08\x00\x00\x00!\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\x00\x00\x00index.js\xa5TKo\xdb8\x10\xbe\xef\xaf\x90y0H\x80Q\xb3=\xca`\xda"\xe9\x06:lc$\xdbS\x10\x14,5\xb2\xb9\x969\xea\x90\x8c\xd7+\xeb\xbf/(\xd9Nb\x18\xdbC!\xe8\xa0y\xf0{pF,z\xc8| k\x02\x9b=k\xcaJu\xf7\xfdo0!7\x04:\x80\x0c\x87\xef\nj\xeb`N\xd8\x02\x85\xad\xdc\x1e\xe2\x0b\x08w\x1bw\x88\xdf\x807d\xdb\x80$\xe7\xe7+\xbe\xe85x\xb9x\x95\x9c\x13\x06\x0c\xdb\x16\xeej\xd9\x1c\xe2\xed!\x98/\xb5\x7f\x05 o\x15\'\tB]u5\x12O\x941\xb3.\x03\x118I\x94\xdd\x02B\x01\x8f\xf8$\xc1\xc55\x90\xfe\xde@1\xb9\xecE/\xdd\xd0)Q\xda\xd4mk\x0e\xd3i\x82\xc5:\x03\xa5\x18\x0e\xba\xd9n\xf7*VGg\x82E\xc7D\x02k d>\xc3:\x9bs\x10b\xd2\xe4F7\r\'\xe9\xc5t\xea\'J\xe1t\x9aH\xf8\x91\x04\x17\xea\n\x1e\xfd["\xdc\xaa-\x07\xe9\x85\xd8\xedl\xfeB\xb1\x173\x82\x10\xc9e\xd4\xcb\xfb=Q\xa1\xae8*\x9a(\x17\x9b\xe6C\xc9\x17\x9c\x84(\xba^:\x0e\xbb\xdd\x84\xd2\x9b\x7f\xfb\x06\xfeO\xacb\x03\x1f\x02G\xc9*\xa8ul\x02\x93\xdd\xb3n"\x14tjD\x81\x92\x84\x90\x0f\x8a\xd4\x95\xe3\x81w\xbdd/\x87\x1c\xfb\x92g\x92\x84\\\xa9\xae\x9f\xdd\xf2\x95\xec\x96\xdaU\rP\x91\x84\xd5\xbd\x90\xeb\x015\x87\x7fZ\xa4\xe0\xd5\x03_\x89a\x84\xb4\xba\xe7\x04?\xa2%\xe0\xec\xa3\xde\xf8\x0b_\xad\xde\x99\xc6\x82\x0b\x17`\xde3!dT\x0e6\x99\xce?_\xbf\xe7]/f\x07\xa333\xdcn7\x9a\xd1\xdd\x12\xc6\xb6\xac\n\x92e;\x07Z[\xef-:_<v_=PY\r\xf9\xb9\xb6\x94B/\xc5c\xb2\x80\xfe)\xf5\xa5I2\xd8\x14\xec\xe2w\xd6?\xf5\xfd\x11\xab\xe2$~\x8eT\xb6\xf7\xda- !\\\xdb\x8a\xca\xb6`\x97\xf9\xf0\xbc\xbbd\xe7\x11\xb4\xdf:\x93\x1dq\xea\x84\x93\x86\x07\x14\xe5\xf7\xe01\x929l\x92\x05\x9f\xdf\x8cW\xf6\x00&\x92\r\xdb\xbd\x0e\x89\xe7\xab?\x19\x83\xd1\x85\x99\xdf\xd8`\x96<\x9d\xf8#\x82\x0f\x7fm[\x10\x9d\xd1\x1e\xd8\xf5\xb0\xbb\xac\xd8\x8fT\xcbA\xa2\x98\r\xa9\xafm\xa5\x03\x1cSKN\xfb\xc4\r4\xf0*\xb1\x1ez\xfa\xfeDJ\xaa?J\xb9k\xaa_Vs^\xfb\x0c\xc6u\xe2z\xa3m\xc8\x12\x99\xb3\xce\xed\xbd\x10r\xack9\xfe\x7f\x9d8\xd5\xd3\x8e\xe3\x16h\xdb\x8dG\xc4\x9c\xe0\x19W\xf0\xe62>/\x08\xbc\xe7i^Dot\xb2\x1dE\xfa\x83`\xee\xf4:qe\xa5{\xd6\x8d\xad^\x864\xff\x82\xe1\x0f\x8c\xaeb",\t7\x19\xf6?A)\xdd\x083\xae\xc0\xaf\x00\x9d\xaa\\\x8f*\x0f\nu\x0cK$\xfb\xef[\x91\'\xf0{Kc~\xbe\xfa\x8d%\xbf\xfd\x07PK\x07\x08b{\xda*\xce\x02\x00\x00G\x06\x00\x00PK\x03\x04\x14\x00\x08\x00\x08\x00\x00\x00!\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x11\x00\x00\x00__entrypoint__.js\xa5Vmo\xdb6\x10\xfe\xbe_\xc1\x12E!\x06,\x9bu\x1b0\xc8S\x8c4q\x17\xafN\x1b\xd8\x0e\x86}J\x18\xe9di\x91H\x87\xa4\x92x\x8a\xfe\xfb@\x91\x92_\xbb|\xd8\'\x89G\xf2x/\xcf=w\xb8\xd2\x80\xb4Qyl\xf0\xe0\xdb\xdd\xdf\x10\x1b\x96@\x9a\x0b\xb8Rr\t\xca\xac\x02x^Je4\xc577\xa0/eR\x15\x80i\xfd\xc8\x8b\n\xc27\xc7\r\xa1\xfe\x00\x83g\x03J\xf0"z\x94y\x82\x8e{y\xc6ER\x80\x8a\xfc\xb7\x97?\xe5&\x9b\x82Q9\xe8h\xe3\x7f\x10K\xa1\r\xca\x8cY\xeaH\xc1C\x95+\x08p\xbb\xc4\x84V\xaaX\x0b+U`2\xd8{\xbf\xd6 \x92\x0bc\x96Sx\xa8@\x9b0\x81\x94W\x85\x99m\x8bi!\x17\xdd\xd6D.h.\xe2\xa2J`fx|?W<\x06\x1d\xbe9\xa6\x95\x06u\xe1<\x18\x8b\x04\x9eC\xcc>\xe4\xf6\x077\xde\xd2\xb3\xe9\xe8t>\xba\xf9|:\x9e\x8c\xceo\xae.\xfe\x9a\x8d\xcfN\'7\xe3\xf3\x9b\xcb\xd3\xe9\x97\xd14\xc2\xa7\x7f\xce\xce\xce\xbf\x84\xe1Y\xa5\x8d,\xa7\xa0e\xa5b\x1b\xe1\xc7<\x01\xf5Y\xf1\x12\x9e\xa4\xba\x0f\xc3-U\x98^\x8eg\xb3\xf1\xd7\xdf\xff\x9f\xce\x03J\xf0\x80\xeb\x95\x88QZ\x89\xd8\xe4R \x9f\x9a\x00\x1eA\x18\x1aKa\xe0\xd9\x90\xdaeBs\x91\x9b\xfc\x1fHFv7\xaa\x19c\xee\xdc\x14\xf4R\n\r\xd7\xd3I\x88\x19c\xb8\x19\xe4i\x87\x97\x1e\x0e\xac\x90\x8b\xe0\x8f\xd9\xb7\xaf\xcc\xe2L,\xf2t\x15l\xab\xa4\x1e0\x1f\t\xa1\xadf\xe6\x137_-!\x8a"|\x0e\x05\x18\xc0\xef\xde\xb9\xdd\xabl\xa5\xf3\x98\x17] \xc7I\x14E[\xa1;\x101R\xef\xe2\xa45\x0c\xe7\x0b!\xadY\xe8|4\x19\xcdG\xa8}\x02\xc5\xbc\xd2\x90\xa0\xbb\x15\xe2(\xe5y\x01\tr\x0f\xb8}L(\x7f\xe2\xb9A\xba\xba+s\xd3\x05"\xc0\xb3\xeb\xb3\xb3\xd1l\x86\x9d\x1fd\xa0\xc0TJ4F\xad|07\xe0\xd4\xe3x\xcf\xb0\x8dC-\xe6\x08\xebjG\x81\xae\n\x13\xb9\xc77\x8e\xedF\xb4K!U>G.w\nD\x02\xaa7\xd7\xa5\xd1\xe9$\x83W<\xda\xd2D\x9a\x98\x9b8\x0b\xa0\x03\x89\xdd\xdd\x82\x06\xd7R\x84{\x9e\xed\xd7\xd8\x10\x98\xb6\x15\x17\x02+Ak\xbe\x80f`\x95\xb1\xfd,\xbf\xbc8\x80\xee\xc2\xe3L\x017\x80\x87\x87\xa1\x87}\xe2\\\x1a)r~$6\xe5\x96u\x10G%W\xf7\xa0\xd0\xd2\xc3\xca\x9eh\x0b\x14\xe5\t\xd2\x12\x99\x8c\x1bd2\xb0\xc9\xd6\x96Q\x84\xe9\xc0\xf2\x94\x17\x05\xba\x03\xd4\x82\x08\x12L\xdax\x1f0\xfdux\xee\xc7\xca\xd6\xcd\xedh:\xfd6\r\xd1%/R\xa9JH\x1c\xfe\x18\xc2\xfb\xe1\xc1(\xd7\xc8\x13f\x12\xa2\xb7\xf5N\xd1\xb5\xd9&\xcd-\xf9\x1ex\x1d\x83\xe1\xd6\x07\xd24=;\xec\xa0&N\x85\xafO\xeaa\xd9\x01*\xaa\x9b\x0e\x0f]07jt\xe7\xf0\x81(\r\x87k\xdd\xafm{\x13\xc6\x89\xe5\x9c\x8dk\xdf\xa3\x8e}\x83\xdeD\xd1\xc6\xbd\xfdx\x12\x93)\xf9\x84\x04<\xa1\x91RR\x05\xb7\x8e"B\x14s!\xa4Aq\xc6\xc5\x02Zht\xda\xd7\xd8\x19\x9f\xa3T\xc9\x12\xe1\xb7\xf5\x7f\xbe\xd2`d\xa4=\xf5zx\x1a\x8c\x92\xaa\xe5\xaa\xc4\x12b.\xc5m\xc70\x96\x94\xd7\xcfP\xc6:\xc6\xe8RC\xf7\xfd\x0b;\xa3\xd79j\x9a\x9d\xc6\xb0\xc3o\xdapSiOn\x9e\xd1\xfe\xd6RD\xf5\xac\xdd\t\xfd\x81)\xb8\xf2\xb7\r\x83\xb9\xc5p\xe8\xf7\xda\xfe:NB\xc7\xe5~E\xfbtzy\xbf>d\xb8\xbb\xba\xef\xd1\xcb\xcb\x81f\xe7\xbb0\x9d\xc8\xc5v\xd3\xf0/\xed\xc9\xe9W9\x8a3\xe9\xb7\xdd\x82\x9es\xc3\xbd\xc4\xfe6t\xc9\x95\x86\xe4Z\x15Q\xa5\n\xd6\xaezv\xea\xdb"\xb13\xc6"\x17\x8b\x19O\xc1\x9e\xbd}[\xf7\x17\xd9RI#cY4\x1f>l\x8a3\xa9\x8d\xe0%4[\xd2%7Y+\x1d\x1e\x1d\x1d\xdd\xee\r=\xae\x99\xb9ty\x8a\xd3`\x91\x15\x17\xb2J,wp\x0b\x18\xbcc\x10\xb5\xd9#~\x90\xe9\x18\xfe\x93LV\xd1\x0ey\xb4\xe7\xa8\x82\x87\xa8\xee\xec\x0b\xd7\x9et"j\xad\xdc\x90\xdb%-\xc1d2\t\xf1\xd5\xf5\x1c\xd3\x0cx\x02J\x875n[\x940\xef\xcdj\t8\xc4\x98\xf6\x92\x02\xc4\xc2d8\xfcT\xa5)(v\xb720iE\xc1\xa6\x85\x14W&\xfd\x15\x93\xa6\xf1\x9dkc\x86\x0cjn\x0c\x94K\xa3\xc3_\xa8.\x00\x96\xe1\x8f\xf0S\xd3\x8f\x9e\xdd\xa8\xcav&E\x12(x\xe8{\xa6\x8d\x03\xd9\xad\x88\xc3\xb3d \x976\xbc\xdaF\xc8\x8e\x9c\xed\xd5\xdau\xff\x96A\xae\x94,s\r\x81uA\x16\x8f@\x15\xd8a\x9bD\'\xf5z8\xf0\x97\xa3v\xd8e~\xb5\xa1\xda\xe1*:\xa9\xbb80\xdb\xbbK\x08\x08}\xd3\x8b\\\x99\x9d\xc9\x04^^\x0e\x08O\xa2\x9f\x8f\x8f\x87\xee\xf5`\x83\xdb\xae\x85\xae\xe2\x18\xb4N\xab\x02]\xcc\xe7W=\x8al+9\xa0\xc86\x92\xd0{\x13\x90\xc62Q\xeb:\x93"\xc0`\t\xd3v\x92\xd6\xc9.*\xecI\xe5\x06l\x8c\xfb\x18\xf5[ \x92`c\xaa\xf0\x06\x02i\x1a\xb2\xeeD>\xf8\x13\xb9\x08\xd2\xd2X\x9a[r\xc5K\xed\xba\x8e,\xa0-\x83\xed\xad\xf5\xedM\x80t\xf9J\x05\xe9\xd2\xd4R_\xc0\x18{\xd66-\x05\x18\xd4\xa1(\xf2\xc7Y\'\xa0\xa5\xeee-\xbe\x06\xa9T\xc1`@l2}\xda\xdd<\x95\n\xafr=1\xe5i\xd0\xe9y\xff\xfe\xb7\xe8\xd87\x1a\xe8&0\x8b\xd7\xe0\x92\x9b\x8c\xa5\x85\x94\xca\xfd*.\x12Y\x06\xe4\xa8\xd4\x84\xd0R\x1fE\x1f\x9b}\xban\xaf\xdax\x1c\x80\x9e\xbc\x8fN4\x98y^\x82\xacL \xef\xa9U\xd5\xfc\xf0/PK\x07\x08\x18-\x91\xa0\xa6\x05\x00\x00\x04\x0e\x00\x00PK\x01\x02-\x03\x14\x00\x08\x00\x08\x00\x00\x00!\x00b{\xda*\xce\x02\x00\x00G\x06\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00\x00 \x00\xb4\x81\x00\x00\x00\x00index.jsPK\x01\x02-\x03\x14\x00\x08\x00\x08\x00\x00\x00!\x00\x18-\x91\xa0\xa6\x05\x00\x00\x04\x0e\x00\x00\x11\x00\x00\x00\x00\x00\x00\x00\x00\x00 \x00\xb4\x81\x04\x03\x00\x00__entrypoint__.jsPK\x05\x06\x00\x00\x00\x00\x02\x00\x02\x00u\x00\x00\x00\xe9\x08\x00\x00\x00\x00'
TapStackPr649: fail: exception while calling s3 with unknown operation: Unable to parse request (not well-formed (invalid token): line 1, column 0), invalid XML received:
b'{\n "Resources": {\n  "TapVpc8B8CDDDF": {\n   "Type": "AWS::EC2::VPC",\n   "Properties": {\n    "CidrBlock": "10.0.0.0/16",\n    "EnableDnsHostnames": true,\n    "EnableDnsSupport": true,\n    "InstanceTenancy": "default",\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr649/TapVpc"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/Resource"\n   }\n  },\n  "TapVpcPublicSubnetSubnet1Subnet839F1108": {\n   "Type": "AWS::EC2::Subnet",\n   "Properties": {\n    "AvailabilityZone": "us-east-1a",\n    "CidrBlock": "10.0.0.0/24",\n    "MapPublicIpOnLaunch": true,\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "aws-cdk:subnet-name",\n      "Value": "PublicSubnet"\n     },\n     {\n      "Key": "aws-cdk:subnet-type",\n      "Value": "Public"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr649/TapVpc/PublicSubnetSubnet1"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/PublicSubnetSubnet1/Subnet"\n   }\n  },\n  "TapVpcPublicSubnetSubnet1RouteTable56219C1D": {\n   "Type": "AWS::EC2::RouteTable",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr649/TapVpc/PublicSubnetSubnet1"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/PublicSubnetSubnet1/RouteTable"\n   }\n  },\n  "TapVpcPublicSubnetSubnet1RouteTableAssociation6D2E9993": {\n   "Type": "AWS::EC2::SubnetRouteTableAssociation",\n   "Properties": {\n    "RouteTableId": {\n     "Ref": "TapVpcPublicSubnetSubnet1RouteTable56219C1D"\n    },\n    "SubnetId": {\n     "Ref": "TapVpcPublicSubnetSubnet1Subnet839F1108"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/PublicSubnetSubnet1/RouteTableAssociation"\n   }\n  },\n  "TapVpcPublicSubnetSubnet1DefaultRoute473E1753": {\n   "Type": "AWS::EC2::Route",\n   "Properties": {\n    "DestinationCidrBlock": "0.0.0.0/0",\n    "GatewayId": {\n     "Ref": "TapVpcIGWD6C67C56"\n    },\n    "RouteTableId": {\n     "Ref": "TapVpcPublicSubnetSubnet1RouteTable56219C1D"\n    }\n   },\n   "DependsOn": [\n    "TapVpcVPCGWDFDBCCBD"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/PublicSubnetSubnet1/DefaultRoute"\n   }\n  },\n  "TapVpcPublicSubnetSubnet1EIP82661ABE": {\n   "Type": "AWS::EC2::EIP",\n   "Properties": {\n    "Domain": "vpc",\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr649/TapVpc/PublicSubnetSubnet1"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/PublicSubnetSubnet1/EIP"\n   }\n  },\n  "TapVpcPublicSubnetSubnet1NATGateway8BFCA3D1": {\n   "Type": "AWS::EC2::NatGateway",\n   "Properties": {\n    "AllocationId": {\n     "Fn::GetAtt": [\n      "TapVpcPublicSubnetSubnet1EIP82661ABE",\n      "AllocationId"\n     ]\n    },\n    "SubnetId": {\n     "Ref": "TapVpcPublicSubnetSubnet1Subnet839F1108"\n    },\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr649/TapVpc/PublicSubnetSubnet1"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "DependsOn": [\n    "TapVpcPublicSubnetSubnet1DefaultRoute473E1753",\n    "TapVpcPublicSubnetSubnet1RouteTableAssociation6D2E9993"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/PublicSubnetSubnet1/NATGateway"\n   }\n  },\n  "TapVpcPublicSubnetSubnet2Subnet09E451CD": {\n   "Type": "AWS::EC2::Subnet",\n   "Properties": {\n    "AvailabilityZone": "us-east-1b",\n    "CidrBlock": "10.0.1.0/24",\n    "MapPublicIpOnLaunch": true,\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "aws-cdk:subnet-name",\n      "Value": "PublicSubnet"\n     },\n     {\n      "Key": "aws-cdk:subnet-type",\n      "Value": "Public"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr649/TapVpc/PublicSubnetSubnet2"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/PublicSubnetSubnet2/Subnet"\n   }\n  },\n  "TapVpcPublicSubnetSubnet2RouteTableD816495B": {\n   "Type": "AWS::EC2::RouteTable",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr649/TapVpc/PublicSubnetSubnet2"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/PublicSubnetSubnet2/RouteTable"\n   }\n  },\n  "TapVpcPublicSubnetSubnet2RouteTableAssociation4BD40041": {\n   "Type": "AWS::EC2::SubnetRouteTableAssociation",\n   "Properties": {\n    "RouteTableId": {\n     "Ref": "TapVpcPublicSubnetSubnet2RouteTableD816495B"\n    },\n    "SubnetId": {\n     "Ref": "TapVpcPublicSubnetSubnet2Subnet09E451CD"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/PublicSubnetSubnet2/RouteTableAssociation"\n   }\n  },\n  "TapVpcPublicSubnetSubnet2DefaultRoute6153DB67": {\n   "Type": "AWS::EC2::Route",\n   "Properties": {\n    "DestinationCidrBlock": "0.0.0.0/0",\n    "GatewayId": {\n     "Ref": "TapVpcIGWD6C67C56"\n    },\n    "RouteTableId": {\n     "Ref": "TapVpcPublicSubnetSubnet2RouteTableD816495B"\n    }\n   },\n   "DependsOn": [\n    "TapVpcVPCGWDFDBCCBD"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/PublicSubnetSubnet2/DefaultRoute"\n   }\n  },\n  "TapVpcPrivateSubnetSubnet1SubnetF697953F": {\n   "Type": "AWS::EC2::Subnet",\n   "Properties": {\n    "AvailabilityZone": "us-east-1a",\n    "CidrBlock": "10.0.2.0/24",\n    "MapPublicIpOnLaunch": false,\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "aws-cdk:subnet-name",\n      "Value": "PrivateSubnet"\n     },\n     {\n      "Key": "aws-cdk:subnet-type",\n      "Value": "Private"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr649/TapVpc/PrivateSubnetSubnet1"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/PrivateSubnetSubnet1/Subnet"\n   }\n  },\n  "TapVpcPrivateSubnetSubnet1RouteTableDF52FE56": {\n   "Type": "AWS::EC2::RouteTable",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr649/TapVpc/PrivateSubnetSubnet1"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/PrivateSubnetSubnet1/RouteTable"\n   }\n  },\n  "TapVpcPrivateSubnetSubnet1RouteTableAssociation1BF8FEC4": {\n   "Type": "AWS::EC2::SubnetRouteTableAssociation",\n   "Properties": {\n    "RouteTableId": {\n     "Ref": "TapVpcPrivateSubnetSubnet1RouteTableDF52FE56"\n    },\n    "SubnetId": {\n     "Ref": "TapVpcPrivateSubnetSubnet1SubnetF697953F"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/PrivateSubnetSubnet1/RouteTableAssociation"\n   }\n  },\n  "TapVpcPrivateSubnetSubnet1DefaultRoute931A4A79": {\n   "Type": "AWS::EC2::Route",\n   "Properties": {\n    "DestinationCidrBlock": "0.0.0.0/0",\n    "NatGatewayId": {\n     "Ref": "TapVpcPublicSubnetSubnet1NATGateway8BFCA3D1"\n    },\n    "RouteTableId": {\n     "Ref": "TapVpcPrivateSubnetSubnet1RouteTableDF52FE56"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/PrivateSubnetSubnet1/DefaultRoute"\n   }\n  },\n  "TapVpcPrivateSubnetSubnet2Subnet1C3B5DAD": {\n   "Type": "AWS::EC2::Subnet",\n   "Properties": {\n    "AvailabilityZone": "us-east-1b",\n    "CidrBlock": "10.0.3.0/24",\n    "MapPublicIpOnLaunch": false,\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "aws-cdk:subnet-name",\n      "Value": "PrivateSubnet"\n     },\n     {\n      "Key": "aws-cdk:subnet-type",\n      "Value": "Private"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr649/TapVpc/PrivateSubnetSubnet2"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/PrivateSubnetSubnet2/Subnet"\n   }\n  },\n  "TapVpcPrivateSubnetSubnet2RouteTableCF6A3995": {\n   "Type": "AWS::EC2::RouteTable",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr649/TapVpc/PrivateSubnetSubnet2"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/PrivateSubnetSubnet2/RouteTable"\n   }\n  },\n  "TapVpcPrivateSubnetSubnet2RouteTableAssociation163E2590": {\n   "Type": "AWS::EC2::SubnetRouteTableAssociation",\n   "Properties": {\n    "RouteTableId": {\n     "Ref": "TapVpcPrivateSubnetSubnet2RouteTableCF6A3995"\n    },\n    "SubnetId": {\n     "Ref": "TapVpcPrivateSubnetSubnet2Subnet1C3B5DAD"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/PrivateSubnetSubnet2/RouteTableAssociation"\n   }\n  },\n  "TapVpcPrivateSubnetSubnet2DefaultRoute88EA838A": {\n   "Type": "AWS::EC2::Route",\n   "Properties": {\n    "DestinationCidrBlock": "0.0.0.0/0",\n    "NatGatewayId": {\n     "Ref": "TapVpcPublicSubnetSubnet1NATGateway8BFCA3D1"\n    },\n    "RouteTableId": {\n     "Ref": "TapVpcPrivateSubnetSubnet2RouteTableCF6A3995"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/PrivateSubnetSubnet2/DefaultRoute"\n   }\n  },\n  "TapVpcIGWD6C67C56": {\n   "Type": "AWS::EC2::InternetGateway",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackPr649/TapVpc"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/IGW"\n   }\n  },\n  "TapVpcVPCGWDFDBCCBD": {\n   "Type": "AWS::EC2::VPCGatewayAttachment",\n   "Properties": {\n    "InternetGatewayId": {\n     "Ref": "TapVpcIGWD6C67C56"\n    },\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/VPCGW"\n   }\n  },\n  "TapVpcRestrictDefaultSecurityGroupCustomResource2332DAD5": {\n   "Type": "Custom::VpcRestrictDefaultSG",\n   "Properties": {\n    "ServiceToken": {\n     "Fn::GetAtt": [\n      "CustomVpcRestrictDefaultSGCustomResourceProviderHandlerDC833E5E",\n      "Arn"\n     ]\n    },\n    "DefaultSecurityGroupId": {\n     "Fn::GetAtt": [\n      "TapVpc8B8CDDDF",\n      "DefaultSecurityGroup"\n     ]\n    },\n    "Account": "000000000000"\n   },\n   "UpdateReplacePolicy": "Delete",\n   "DeletionPolicy": "Delete",\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapVpc/RestrictDefaultSecurityGroupCustomResource/Default"\n   }\n  },\n  "CustomVpcRestrictDefaultSGCustomResourceProviderRole26592FE0": {\n   "Type": "AWS::IAM::Role",\n   "Properties": {\n    "AssumeRolePolicyDocument": {\n     "Version": "2012-10-17",\n     "Statement": [\n      {\n       "Action": "sts:AssumeRole",\n       "Effect": "Allow",\n       "Principal": {\n        "Service": "lambda.amazonaws.com"\n       }\n      }\n     ]\n    },\n    "ManagedPolicyArns": [\n     {\n      "Fn::Sub": "arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"\n     }\n    ],\n    "Policies": [\n     {\n      "PolicyName": "Inline",\n      "PolicyDocument": {\n       "Version": "2012-10-17",\n       "Statement": [\n        {\n         "Effect": "Allow",\n         "Action": [\n          "ec2:AuthorizeSecurityGroupIngress",\n          "ec2:AuthorizeSecurityGroupEgress",\n          "ec2:RevokeSecurityGroupIngress",\n          "ec2:RevokeSecurityGroupEgress"\n         ],\n         "Resource": [\n          {\n           "Fn::Join": [\n            "",\n            [\n             "arn:aws:ec2:us-east-1:000000000000:security-group/",\n             {\n              "Fn::GetAtt": [\n               "TapVpc8B8CDDDF",\n               "DefaultSecurityGroup"\n              ]\n             }\n            ]\n           ]\n          }\n         ]\n        }\n       ]\n      }\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/Custom::VpcRestrictDefaultSGCustomResourceProvider/Role"\n   }\n  },\n  "CustomVpcRestrictDefaultSGCustomResourceProviderHandlerDC833E5E": {\n   "Type": "AWS::Lambda::Function",\n   "Properties": {\n    "Code": {\n     "S3Bucket": "cdk-hnb659fds-assets-000000000000-us-east-1",\n     "S3Key": "7fa1e366ee8a9ded01fc355f704cff92bfd179574e6f9cfee800a3541df1b200.zip"\n    },\n    "Timeout": 900,\n    "MemorySize": 128,\n    "Handler": "__entrypoint__.handler",\n    "Role": {\n     "Fn::GetAtt": [\n      "CustomVpcRestrictDefaultSGCustomResourceProviderRole26592FE0",\n      "Arn"\n     ]\n    },\n    "Runtime": "nodejs22.x",\n    "Description": "Lambda function for removing all inbound/outbound rules from the VPC default security group"\n   },\n   "DependsOn": [\n    "CustomVpcRestrictDefaultSGCustomResourceProviderRole26592FE0"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/Custom::VpcRestrictDefaultSGCustomResourceProvider/Handler",\n    "aws:asset:path": "asset.7fa1e366ee8a9ded01fc355f704cff92bfd179574e6f9cfee800a3541df1b200",\n    "aws:asset:property": "Code"\n   }\n  },\n  "SshSecurityGroup4CD4C749": {\n   "Type": "AWS::EC2::SecurityGroup",\n   "Properties": {\n    "GroupDescription": "Security group for SSH access from specific IP range",\n    "SecurityGroupEgress": [\n     {\n      "CidrIp": "0.0.0.0/0",\n      "Description": "Allow all outbound traffic by default",\n      "IpProtocol": "-1"\n     }\n    ],\n    "SecurityGroupIngress": [\n     {\n      "CidrIp": "203.0.113.0/24",\n      "Description": "Allow SSH access from specific IP range 203.0.113.0/24",\n      "FromPort": 22,\n      "IpProtocol": "tcp",\n      "ToPort": 22\n     }\n    ],\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/SshSecurityGroup/Resource"\n   }\n  },\n  "TapKeyPair": {\n   "Type": "AWS::EC2::KeyPair",\n   "Properties": {\n    "KeyName": "tap-key-Pr649",\n    "KeyType": "rsa",\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/TapKeyPair"\n   }\n  },\n  "PublicInstanceInstanceRole84D04CB8": {\n   "Type": "AWS::IAM::Role",\n   "Properties": {\n    "AssumeRolePolicyDocument": {\n     "Statement": [\n      {\n       "Action": "sts:AssumeRole",\n       "Effect": "Allow",\n       "Principal": {\n        "Service": "ec2.amazonaws.com"\n       }\n      }\n     ],\n     "Version": "2012-10-17"\n    },\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "tap-public-instance-Pr649"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/PublicInstance/InstanceRole/Resource"\n   }\n  },\n  "PublicInstanceInstanceProfile4800222F": {\n   "Type": "AWS::IAM::InstanceProfile",\n   "Properties": {\n    "Roles": [\n     {\n      "Ref": "PublicInstanceInstanceRole84D04CB8"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/PublicInstance/InstanceProfile"\n   }\n  },\n  "PublicInstance54C2518A": {\n   "Type": "AWS::EC2::Instance",\n   "Properties": {\n    "AvailabilityZone": "us-east-1a",\n    "IamInstanceProfile": {\n     "Ref": "PublicInstanceInstanceProfile4800222F"\n    },\n    "ImageId": {\n     "Ref": "SsmParameterValueawsserviceamiamazonlinuxlatestal2023amikernel61x8664C96584B6F00A464EAD1953AFF4B05118Parameter"\n    },\n    "InstanceType": "t3.micro",\n    "KeyName": "tap-key-Pr649",\n    "SecurityGroupIds": [\n     {\n      "Fn::GetAtt": [\n       "SshSecurityGroup4CD4C749",\n       "GroupId"\n      ]\n     }\n    ],\n    "SubnetId": {\n     "Ref": "TapVpcPublicSubnetSubnet1Subnet839F1108"\n    },\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "tap-public-instance-Pr649"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "UserData": {\n     "Fn::Base64": "#!/bin/bash"\n    }\n   },\n   "DependsOn": [\n    "PublicInstanceInstanceRole84D04CB8"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/PublicInstance/Resource"\n   }\n  },\n  "PrivateInstanceInstanceRoleFB750974": {\n   "Type": "AWS::IAM::Role",\n   "Properties": {\n    "AssumeRolePolicyDocument": {\n     "Statement": [\n      {\n       "Action": "sts:AssumeRole",\n       "Effect": "Allow",\n       "Principal": {\n        "Service": "ec2.amazonaws.com"\n       }\n      }\n     ],\n     "Version": "2012-10-17"\n    },\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "tap-private-instance-Pr649"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/PrivateInstance/InstanceRole/Resource"\n   }\n  },\n  "PrivateInstanceInstanceProfile81FB7A0C": {\n   "Type": "AWS::IAM::InstanceProfile",\n   "Properties": {\n    "Roles": [\n     {\n      "Ref": "PrivateInstanceInstanceRoleFB750974"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/PrivateInstance/InstanceProfile"\n   }\n  },\n  "PrivateInstance5CA423EB": {\n   "Type": "AWS::EC2::Instance",\n   "Properties": {\n    "AvailabilityZone": "us-east-1a",\n    "IamInstanceProfile": {\n     "Ref": "PrivateInstanceInstanceProfile81FB7A0C"\n    },\n    "ImageId": {\n     "Ref": "SsmParameterValueawsserviceamiamazonlinuxlatestal2023amikernel61x8664C96584B6F00A464EAD1953AFF4B05118Parameter"\n    },\n    "InstanceType": "t3.micro",\n    "KeyName": "tap-key-Pr649",\n    "SecurityGroupIds": [\n     {\n      "Fn::GetAtt": [\n       "SshSecurityGroup4CD4C749",\n       "GroupId"\n      ]\n     }\n    ],\n    "SubnetId": {\n     "Ref": "TapVpcPrivateSubnetSubnet1SubnetF697953F"\n    },\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "tap-private-instance-Pr649"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "UserData": {\n     "Fn::Base64": "#!/bin/bash"\n    }\n   },\n   "DependsOn": [\n    "PrivateInstanceInstanceRoleFB750974"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/PrivateInstance/Resource"\n   }\n  },\n  "CDKMetadata": {\n   "Type": "AWS::CDK::Metadata",\n   "Properties": {\n    "Analytics": "v2:deflate64:H4sIAAAAAAAA/82VXW/aMBSGf0t9idKs5aLTuAts6qJtBUHViyE0HZwDdXGOPX+EsYj/PjlOgFaaVO1D4ir2sc/xo9dvjvtp//pdenUBW3vJi82lFMu0njngmwS29luNvJ/WD5rPayZ0VhQGrUXLBqzHElbCj+xnN7F+SehGilZi7Q04oYgN5jXjojBfwG7abQQlPsu43+kQmPilFJztk9dnGFGBQ7ZfhD3uFhxuYdfhIMFS4nuyH5V1oYRlA2c8nqzMvNbKuBjfL5LRih4moySSzJqj5jWDCoSEpZDC7b4q6lAqzfOiHQfgoVR8c9BFxyK5HtNn8MQfu8OFrm5GL7aDtWJNua5uWoHHNDLYKsh6jSZnQdGAFMXdQWw2mLMeW5wN4HlQRCtFA4XRVHmH98F0x/gxllmruGgKHDaHwYd8Ej5HsZPW8P/cmSuQ9gw0/zuM8yE5E4zowpwcGsKDh2KPa2eZc8AfSySXzJB7I9zu1iiv53WAbY8q0HIj9KF0wkBKtc2kHHu3VJ6KtoHG5pDTOvBMvcTY/oFykoIwRuKPxRUR8lCya9eexHePrT7NdTaNJf5Jp2wh8Al3ExAmyck6II7PeCvd9m7LBvVv3hgm2sx2IV4BfxSEeQnrw3NzenAb6zLvjq/SBneHWVDhdSzd6/U/YVoLxE37RECZ1lMlg2BgrS+xGO4CmTaCuNAgM86VJ3d0mS8xJGT8aK3mov88exG7XGyGHdvEqJWQuN8nU7TKG47zpkaPLZKRt06Vp/FYog28WJ8YVYkCzRAsJpm16GYO1oLWIWcCBkp0aMJk7J32bp+QKjB9sm+qfj+9fpteXTxZIS6NJydKTKfx+wt2cS6AKAkAAA=="\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackPr649/CDKMetadata/Default"\n   }\n  }\n },\n "Parameters": {\n  "SsmParameterValueawsserviceamiamazonlinuxlatestal2023amikernel61x8664C96584B6F00A464EAD1953AFF4B05118Parameter": {\n   "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",\n   "Default": "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"\n  },\n  "BootstrapVersion": {\n   "Type": "AWS::SSM::Parameter::Value<String>",\n   "Default": "/cdk-bootstrap/hnb659fds/version",\n   "Description": "Version of the CDK Bootstrap resources in this environment, automatically retrieved from SSM Parameter Store. [cdk:skip]"\n  }\n },\n "Outputs": {\n  "VpcId": {\n   "Description": "VPC ID",\n   "Value": {\n    "Ref": "TapVpc8B8CDDDF"\n   },\n   "Export": {\n    "Name": "TapStackPr649-VpcId"\n   }\n  },\n  "VpcCidr": {\n   "Description": "VPC CIDR Block",\n   "Value": {\n    "Fn::GetAtt": [\n     "TapVpc8B8CDDDF",\n     "CidrBlock"\n    ]\n   },\n   "Export": {\n    "Name": "TapStackPr649-VpcCidr"\n   }\n  },\n  "PublicSubnetIds": {\n   "Description": "Public Subnet IDs",\n   "Value": {\n    "Fn::Join": [\n     "",\n     [\n      {\n       "Ref": "TapVpcPublicSubnetSubnet1Subnet839F1108"\n      },\n      ",",\n      {\n       "Ref": "TapVpcPublicSubnetSubnet2Subnet09E451CD"\n      }\n     ]\n    ]\n   },\n   "Export": {\n    "Name": "TapStackPr649-PublicSubnetIds"\n   }\n  },\n  "PrivateSubnetIds": {\n   "Description": "Private Subnet IDs",\n   "Value": {\n    "Fn::Join": [\n     "",\n     [\n      {\n       "Ref": "TapVpcPrivateSubnetSubnet1SubnetF697953F"\n      },\n      ",",\n      {\n       "Ref": "TapVpcPrivateSubnetSubnet2Subnet1C3B5DAD"\n      }\n     ]\n    ]\n   },\n   "Export": {\n    "Name": "TapStackPr649-PrivateSubnetIds"\n   }\n  },\n  "NatGatewayIds": {\n   "Description": "NAT Gateway ID",\n   "Value": {\n    "Ref": "TapVpcPublicSubnetSubnet1NATGateway8BFCA3D1"\n   },\n   "Export": {\n    "Name": "TapStackPr649-NatGatewayId"\n   }\n  },\n  "InternetGatewayId": {\n   "Description": "Internet Gateway ID",\n   "Value": {\n    "Ref": "TapVpcIGWD6C67C56"\n   },\n   "Export": {\n    "Name": "TapStackPr649-InternetGatewayId"\n   }\n  },\n  "PublicInstanceId": {\n   "Description": "Public EC2 Instance ID",\n   "Value": {\n    "Ref": "PublicInstance54C2518A"\n   },\n   "Export": {\n    "Name": "TapStackPr649-PublicInstanceId"\n   }\n  },\n  "PrivateInstanceId": {\n   "Description": "Private EC2 Instance ID",\n   "Value": {\n    "Ref": "PrivateInstance5CA423EB"\n   },\n   "Export": {\n    "Name": "TapStackPr649-PrivateInstanceId"\n   }\n  },\n  "PublicInstancePublicIp": {\n   "Description": "Public EC2 Instance Public IP",\n   "Value": {\n    "Fn::GetAtt": [\n     "PublicInstance54C2518A",\n     "PublicIp"\n    ]\n   },\n   "Export": {\n    "Name": "TapStackPr649-PublicInstancePublicIp"\n   }\n  },\n  "PublicInstancePrivateIp": {\n   "Description": "Public EC2 Instance Private IP",\n   "Value": {\n    "Fn::GetAtt": [\n     "PublicInstance54C2518A",\n     "PrivateIp"\n    ]\n   },\n   "Export": {\n    "Name": "TapStackPr649-PublicInstancePrivateIp"\n   }\n  },\n  "PrivateInstancePrivateIp": {\n   "Description": "Private EC2 Instance Private IP",\n   "Value": {\n    "Fn::GetAtt": [\n     "PrivateInstance5CA423EB",\n     "PrivateIp"\n    ]\n   },\n   "Export": {\n    "Name": "TapStackPr649-PrivateInstancePrivateIp"\n   }\n  },\n  "SecurityGroupId": {\n   "Description": "SSH Security Group ID",\n   "Value": {\n    "Fn::GetAtt": [\n     "SshSecurityGroup4CD4C749",\n     "GroupId"\n    ]\n   },\n   "Export": {\n    "Name": "TapStackPr649-SecurityGroupId"\n   }\n  },\n  "KeyPairName": {\n   "Description": "EC2 Key Pair Name",\n   "Value": "tap-key-Pr649",\n   "Export": {\n    "Name": "TapStackPr649-KeyPairName"\n   }\n  },\n  "KeyPairId": {\n   "Description": "EC2 Key Pair ID",\n   "Value": {\n    "Fn::GetAtt": [\n     "TapKeyPair",\n     "KeyPairId"\n    ]\n   },\n   "Export": {\n    "Name": "TapStackPr649-KeyPairId"\n   }\n  },\n  "EnvironmentSuffix": {\n   "Description": "Environment Suffix",\n   "Value": "Pr649",\n   "Export": {\n    "Name": "TapStackPr649-EnvironmentSuffix"\n   }\n  }\n },\n "Rules": {\n  "CheckBootstrapVersion": {\n   "Assertions": [\n    {\n     "Assert": {\n      "Fn::Not": [\n       {\n        "Fn::Contains": [\n         [\n          "1",\n          "2",\n          "3",\n          "4",\n          "5"\n         ],\n         {\n          "Ref": "BootstrapVersion"\n         }\n        ]\n       }\n      ]\n     },\n     "AssertDescription": "CDK bootstrap stack version 6 required. Please run \'cdk bootstrap\' with a recent version of the CDK CLI."\n    }\n   ]\n  }\n }\n}'

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
Failed to publish asset TapStackPr649 Template (000000000000-us-east-1-edd6dd51)
```

**Deployment Duration:** 44s

**Deployment Status:** FAILED

**Error:** CDK deployment failed during asset publishing to S3. LocalStack returned "Unable to parse request (not well-formed (invalid token))" errors when trying to upload Lambda function code and CloudFormation template to the CDK asset bucket.

**Root Cause:** The cdklocal tool attempted to publish CDK assets (Lambda code for Custom::VpcRestrictDefaultSGCustomResourceProvider and CloudFormation template) to S3, but LocalStack's S3 implementation returned XML parsing errors. This appears to be an incompatibility between:
1. The CDK asset publishing mechanism (which uploads zip files)
2. LocalStack's S3 implementation expecting XML-formatted requests

**Specific Failures:**
1. Publishing Custom::VpcRestrictDefaultSGCustomResourceProvider Code failed with "invalid XML received" containing binary zip file data
2. Publishing CloudFormation template failed with similar XML parsing error

**LocalStack Compatibility Issues:**
- EC2 instances: Limited support in LocalStack Community edition (instances may not fully start)
- VPC resources: Basic support but with limitations
- NAT Gateway: May not function correctly
- Custom Resources: Lambda-backed custom resources require proper S3 asset handling


---

## Summary

### NEEDS FIXES

**Issues Found:**

1. **Deployment Failure:** CDK asset publishing failed when uploading to LocalStack S3
   - Error: "Unable to parse request (not well-formed (invalid token): line 1, column 2), invalid XML received"
   - Assets that failed: Lambda function code (Custom::VpcRestrictDefaultSGCustomResourceProvider) and CloudFormation template
   - Root cause: LocalStack S3 implementation received binary zip file data but expected XML-formatted requests

2. **LocalStack Compatibility Concerns:**
   - EC2 instances have limited support in LocalStack Community edition
   - NAT Gateway functionality may be limited or non-functional
   - Custom Lambda-backed resources (VPC default security group restriction) require proper S3 asset handling
   - VPC with complex networking (IGW, NAT, multiple subnets) may have incomplete support

**Resources Attempted:**
- VPC with CIDR 10.0.0.0/16
- 2 Public subnets (10.0.0.0/24, 10.0.1.0/24)
- 2 Private subnets (10.0.2.0/24, 10.0.3.0/24)
- 1 NAT Gateway
- 1 Internet Gateway
- 2 EC2 instances (t3.micro, Amazon Linux 2023)
- 1 Security Group (SSH access from 203.0.113.0/24)
- 1 EC2 Key Pair
- Custom Lambda resource for VPC default security group restriction

**Recommendations for Migration:**
1. Consider alternative deployment approach that doesn't rely on S3 asset upload (direct CloudFormation template deployment)
2. Simplify stack by removing Custom Lambda resources if possible
3. Test with LocalStack Pro if EC2 instance functionality is critical
4. Mock or stub EC2 instance creation for testing purposes
5. Consider using simpler networking setup without NAT Gateway for LocalStack testing

**Next Steps:**
- Fix S3 asset publishing issue (may require LocalStack Pro or alternative deployment method)
- Verify EC2 instance support in target LocalStack edition
- Test NAT Gateway functionality in LocalStack
- Consider removing Custom Lambda resources or using alternative approaches


---

## LocalStack Fixer - Iteration 1

**Date:** $(date)

### Fixes Applied (BATCH MODE)

1. **Metadata Sanitization**
   - Removed invalid fields: `coverage`, `author`, `dockerS3Location`
   - Added required fields: `subtask`, `provider`, `subject_labels`, `aws_services`
   - Status: COMPLETED

2. **Disabled Custom Lambda Resource**
   - Set `@aws-cdk/aws-ec2:restrictDefaultSecurityGroup` to `false` in cdk.json
   - This eliminates the Custom::VpcRestrictDefaultSGCustomResourceProvider
   - Prevents S3 asset upload issues with Lambda function code
   - Status: COMPLETED

3. **Simplified EC2 Instances**
   - Changed from high-level `ec2.Instance` to `ec2.CfnInstance`
   - Better LocalStack compatibility with CfnInstance
   - Added SSM parameter for AMI ID
   - Updated outputs to use CfnInstance attributes (.ref, .attrPublicIp, .attrPrivateIp)
   - Status: COMPLETED

4. **Added LocalStack Endpoint Configuration**
   - Updated test file to use AWS_ENDPOINT_URL environment variable
   - Added forcePathStyle: true for S3 compatibility
   - Status: COMPLETED

### Key Changes Made

**lib/tap-stack.ts:**
- Switched from ec2.Instance to ec2.CfnInstance for better LocalStack support
- Added CfnParameter for AMI ID lookup
- Updated outputs to use CfnInstance attributes

**cdk.json:**
- Disabled restrictDefaultSecurityGroup feature flag

**test/tap-stack.int.test.ts:**
- Added endpoint configuration from AWS_ENDPOINT_URL
- Added forcePathStyle for S3 compatibility

**metadata.json:**
- Removed non-schema fields
- Added required LocalStack fields

### Next Step

Re-building and re-deploying with all fixes applied...

Thu Dec 18 10:20:54 UTC 2025

✨  Synthesis time: 5.09s

TapStackdev: start: Building TapStackdev Template
TapStackdev: success: Built TapStackdev Template
TapStackdev: start: Publishing TapStackdev Template (000000000000-us-east-1-5b51534a)
TapStackdev: fail: exception while calling s3 with unknown operation: Unable to parse request (not well-formed (invalid token): line 1, column 0), invalid XML received:
b'{\n "Parameters": {\n  "SsmParameterValueawsserviceamiamazonlinuxlatestal2023amikernel61x8664C96584B6F00A464EAD1953AFF4B05118Parameter": {\n   "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",\n   "Default": "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"\n  },\n  "BootstrapVersion": {\n   "Type": "AWS::SSM::Parameter::Value<String>",\n   "Default": "/cdk-bootstrap/hnb659fds/version",\n   "Description": "Version of the CDK Bootstrap resources in this environment, automatically retrieved from SSM Parameter Store. [cdk:skip]"\n  }\n },\n "Resources": {\n  "TapVpc8B8CDDDF": {\n   "Type": "AWS::EC2::VPC",\n   "Properties": {\n    "CidrBlock": "10.0.0.0/16",\n    "EnableDnsHostnames": true,\n    "EnableDnsSupport": true,\n    "InstanceTenancy": "default",\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/TapVpc"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/Resource"\n   }\n  },\n  "TapVpcPublicSubnetSubnet1Subnet839F1108": {\n   "Type": "AWS::EC2::Subnet",\n   "Properties": {\n    "AvailabilityZone": "us-east-1a",\n    "CidrBlock": "10.0.0.0/24",\n    "MapPublicIpOnLaunch": true,\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "aws-cdk:subnet-name",\n      "Value": "PublicSubnet"\n     },\n     {\n      "Key": "aws-cdk:subnet-type",\n      "Value": "Public"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/TapVpc/PublicSubnetSubnet1"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/PublicSubnetSubnet1/Subnet"\n   }\n  },\n  "TapVpcPublicSubnetSubnet1RouteTable56219C1D": {\n   "Type": "AWS::EC2::RouteTable",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/TapVpc/PublicSubnetSubnet1"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/PublicSubnetSubnet1/RouteTable"\n   }\n  },\n  "TapVpcPublicSubnetSubnet1RouteTableAssociation6D2E9993": {\n   "Type": "AWS::EC2::SubnetRouteTableAssociation",\n   "Properties": {\n    "RouteTableId": {\n     "Ref": "TapVpcPublicSubnetSubnet1RouteTable56219C1D"\n    },\n    "SubnetId": {\n     "Ref": "TapVpcPublicSubnetSubnet1Subnet839F1108"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/PublicSubnetSubnet1/RouteTableAssociation"\n   }\n  },\n  "TapVpcPublicSubnetSubnet1DefaultRoute473E1753": {\n   "Type": "AWS::EC2::Route",\n   "Properties": {\n    "DestinationCidrBlock": "0.0.0.0/0",\n    "GatewayId": {\n     "Ref": "TapVpcIGWD6C67C56"\n    },\n    "RouteTableId": {\n     "Ref": "TapVpcPublicSubnetSubnet1RouteTable56219C1D"\n    }\n   },\n   "DependsOn": [\n    "TapVpcVPCGWDFDBCCBD"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/PublicSubnetSubnet1/DefaultRoute"\n   }\n  },\n  "TapVpcPublicSubnetSubnet1EIP82661ABE": {\n   "Type": "AWS::EC2::EIP",\n   "Properties": {\n    "Domain": "vpc",\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/TapVpc/PublicSubnetSubnet1"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/PublicSubnetSubnet1/EIP"\n   }\n  },\n  "TapVpcPublicSubnetSubnet1NATGateway8BFCA3D1": {\n   "Type": "AWS::EC2::NatGateway",\n   "Properties": {\n    "AllocationId": {\n     "Fn::GetAtt": [\n      "TapVpcPublicSubnetSubnet1EIP82661ABE",\n      "AllocationId"\n     ]\n    },\n    "SubnetId": {\n     "Ref": "TapVpcPublicSubnetSubnet1Subnet839F1108"\n    },\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/TapVpc/PublicSubnetSubnet1"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "DependsOn": [\n    "TapVpcPublicSubnetSubnet1DefaultRoute473E1753",\n    "TapVpcPublicSubnetSubnet1RouteTableAssociation6D2E9993"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/PublicSubnetSubnet1/NATGateway"\n   }\n  },\n  "TapVpcPublicSubnetSubnet2Subnet09E451CD": {\n   "Type": "AWS::EC2::Subnet",\n   "Properties": {\n    "AvailabilityZone": "us-east-1b",\n    "CidrBlock": "10.0.1.0/24",\n    "MapPublicIpOnLaunch": true,\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "aws-cdk:subnet-name",\n      "Value": "PublicSubnet"\n     },\n     {\n      "Key": "aws-cdk:subnet-type",\n      "Value": "Public"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/TapVpc/PublicSubnetSubnet2"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/PublicSubnetSubnet2/Subnet"\n   }\n  },\n  "TapVpcPublicSubnetSubnet2RouteTableD816495B": {\n   "Type": "AWS::EC2::RouteTable",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/TapVpc/PublicSubnetSubnet2"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/PublicSubnetSubnet2/RouteTable"\n   }\n  },\n  "TapVpcPublicSubnetSubnet2RouteTableAssociation4BD40041": {\n   "Type": "AWS::EC2::SubnetRouteTableAssociation",\n   "Properties": {\n    "RouteTableId": {\n     "Ref": "TapVpcPublicSubnetSubnet2RouteTableD816495B"\n    },\n    "SubnetId": {\n     "Ref": "TapVpcPublicSubnetSubnet2Subnet09E451CD"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/PublicSubnetSubnet2/RouteTableAssociation"\n   }\n  },\n  "TapVpcPublicSubnetSubnet2DefaultRoute6153DB67": {\n   "Type": "AWS::EC2::Route",\n   "Properties": {\n    "DestinationCidrBlock": "0.0.0.0/0",\n    "GatewayId": {\n     "Ref": "TapVpcIGWD6C67C56"\n    },\n    "RouteTableId": {\n     "Ref": "TapVpcPublicSubnetSubnet2RouteTableD816495B"\n    }\n   },\n   "DependsOn": [\n    "TapVpcVPCGWDFDBCCBD"\n   ],\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/PublicSubnetSubnet2/DefaultRoute"\n   }\n  },\n  "TapVpcPrivateSubnetSubnet1SubnetF697953F": {\n   "Type": "AWS::EC2::Subnet",\n   "Properties": {\n    "AvailabilityZone": "us-east-1a",\n    "CidrBlock": "10.0.2.0/24",\n    "MapPublicIpOnLaunch": false,\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "aws-cdk:subnet-name",\n      "Value": "PrivateSubnet"\n     },\n     {\n      "Key": "aws-cdk:subnet-type",\n      "Value": "Private"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/TapVpc/PrivateSubnetSubnet1"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/PrivateSubnetSubnet1/Subnet"\n   }\n  },\n  "TapVpcPrivateSubnetSubnet1RouteTableDF52FE56": {\n   "Type": "AWS::EC2::RouteTable",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/TapVpc/PrivateSubnetSubnet1"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/PrivateSubnetSubnet1/RouteTable"\n   }\n  },\n  "TapVpcPrivateSubnetSubnet1RouteTableAssociation1BF8FEC4": {\n   "Type": "AWS::EC2::SubnetRouteTableAssociation",\n   "Properties": {\n    "RouteTableId": {\n     "Ref": "TapVpcPrivateSubnetSubnet1RouteTableDF52FE56"\n    },\n    "SubnetId": {\n     "Ref": "TapVpcPrivateSubnetSubnet1SubnetF697953F"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/PrivateSubnetSubnet1/RouteTableAssociation"\n   }\n  },\n  "TapVpcPrivateSubnetSubnet1DefaultRoute931A4A79": {\n   "Type": "AWS::EC2::Route",\n   "Properties": {\n    "DestinationCidrBlock": "0.0.0.0/0",\n    "NatGatewayId": {\n     "Ref": "TapVpcPublicSubnetSubnet1NATGateway8BFCA3D1"\n    },\n    "RouteTableId": {\n     "Ref": "TapVpcPrivateSubnetSubnet1RouteTableDF52FE56"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/PrivateSubnetSubnet1/DefaultRoute"\n   }\n  },\n  "TapVpcPrivateSubnetSubnet2Subnet1C3B5DAD": {\n   "Type": "AWS::EC2::Subnet",\n   "Properties": {\n    "AvailabilityZone": "us-east-1b",\n    "CidrBlock": "10.0.3.0/24",\n    "MapPublicIpOnLaunch": false,\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "aws-cdk:subnet-name",\n      "Value": "PrivateSubnet"\n     },\n     {\n      "Key": "aws-cdk:subnet-type",\n      "Value": "Private"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/TapVpc/PrivateSubnetSubnet2"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/PrivateSubnetSubnet2/Subnet"\n   }\n  },\n  "TapVpcPrivateSubnetSubnet2RouteTableCF6A3995": {\n   "Type": "AWS::EC2::RouteTable",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/TapVpc/PrivateSubnetSubnet2"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/PrivateSubnetSubnet2/RouteTable"\n   }\n  },\n  "TapVpcPrivateSubnetSubnet2RouteTableAssociation163E2590": {\n   "Type": "AWS::EC2::SubnetRouteTableAssociation",\n   "Properties": {\n    "RouteTableId": {\n     "Ref": "TapVpcPrivateSubnetSubnet2RouteTableCF6A3995"\n    },\n    "SubnetId": {\n     "Ref": "TapVpcPrivateSubnetSubnet2Subnet1C3B5DAD"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/PrivateSubnetSubnet2/RouteTableAssociation"\n   }\n  },\n  "TapVpcPrivateSubnetSubnet2DefaultRoute88EA838A": {\n   "Type": "AWS::EC2::Route",\n   "Properties": {\n    "DestinationCidrBlock": "0.0.0.0/0",\n    "NatGatewayId": {\n     "Ref": "TapVpcPublicSubnetSubnet1NATGateway8BFCA3D1"\n    },\n    "RouteTableId": {\n     "Ref": "TapVpcPrivateSubnetSubnet2RouteTableCF6A3995"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/PrivateSubnetSubnet2/DefaultRoute"\n   }\n  },\n  "TapVpcIGWD6C67C56": {\n   "Type": "AWS::EC2::InternetGateway",\n   "Properties": {\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "TapStackdev/TapVpc"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/IGW"\n   }\n  },\n  "TapVpcVPCGWDFDBCCBD": {\n   "Type": "AWS::EC2::VPCGatewayAttachment",\n   "Properties": {\n    "InternetGatewayId": {\n     "Ref": "TapVpcIGWD6C67C56"\n    },\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapVpc/VPCGW"\n   }\n  },\n  "SshSecurityGroup4CD4C749": {\n   "Type": "AWS::EC2::SecurityGroup",\n   "Properties": {\n    "GroupDescription": "Security group for SSH access from specific IP range",\n    "SecurityGroupEgress": [\n     {\n      "CidrIp": "0.0.0.0/0",\n      "Description": "Allow all outbound traffic by default",\n      "IpProtocol": "-1"\n     }\n    ],\n    "SecurityGroupIngress": [\n     {\n      "CidrIp": "203.0.113.0/24",\n      "Description": "Allow SSH access from specific IP range 203.0.113.0/24",\n      "FromPort": 22,\n      "IpProtocol": "tcp",\n      "ToPort": 22\n     }\n    ],\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ],\n    "VpcId": {\n     "Ref": "TapVpc8B8CDDDF"\n    }\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/SshSecurityGroup/Resource"\n   }\n  },\n  "TapKeyPair": {\n   "Type": "AWS::EC2::KeyPair",\n   "Properties": {\n    "KeyName": "tap-key-dev",\n    "KeyType": "rsa",\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/TapKeyPair"\n   }\n  },\n  "PublicInstance": {\n   "Type": "AWS::EC2::Instance",\n   "Properties": {\n    "ImageId": {\n     "Ref": "SsmParameterValueawsserviceamiamazonlinuxlatestal2023amikernel61x8664C96584B6F00A464EAD1953AFF4B05118Parameter"\n    },\n    "InstanceType": "t3.micro",\n    "KeyName": "tap-key-dev",\n    "SecurityGroupIds": [\n     {\n      "Fn::GetAtt": [\n       "SshSecurityGroup4CD4C749",\n       "GroupId"\n      ]\n     }\n    ],\n    "SubnetId": {\n     "Ref": "TapVpcPublicSubnetSubnet1Subnet839F1108"\n    },\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "tap-public-instance-dev"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/PublicInstance"\n   }\n  },\n  "PrivateInstance": {\n   "Type": "AWS::EC2::Instance",\n   "Properties": {\n    "ImageId": {\n     "Ref": "SsmParameterValueawsserviceamiamazonlinuxlatestal2023amikernel61x8664C96584B6F00A464EAD1953AFF4B05118Parameter"\n    },\n    "InstanceType": "t3.micro",\n    "KeyName": "tap-key-dev",\n    "SecurityGroupIds": [\n     {\n      "Fn::GetAtt": [\n       "SshSecurityGroup4CD4C749",\n       "GroupId"\n      ]\n     }\n    ],\n    "SubnetId": {\n     "Ref": "TapVpcPrivateSubnetSubnet1SubnetF697953F"\n    },\n    "Tags": [\n     {\n      "Key": "Author",\n      "Value": "unknown"\n     },\n     {\n      "Key": "Environment",\n      "Value": "Development"\n     },\n     {\n      "Key": "Name",\n      "Value": "tap-private-instance-dev"\n     },\n     {\n      "Key": "Repository",\n      "Value": "unknown"\n     }\n    ]\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/PrivateInstance"\n   }\n  },\n  "CDKMetadata": {\n   "Type": "AWS::CDK::Metadata",\n   "Properties": {\n    "Analytics": "v2:deflate64:H4sIAAAAAAAA/82UTY/aMBCGf8v6uArpLoetyo3Sahv1AwSrPTRC1cQZWC9m7NpjKI3475XjANueKrWHnGxPxuPHb17PMB/evslvrmDvB7LeDLSq8mbBIDfZZEUzcLBFRpfB3n9DOcybRyvLRig7rmuH3qMXI3EtMrGFH+Ofp4UPFSFPDK3UOjhgZUiMykZIVbvP4DddGsEWf9vxcLAxMAuVVlIcs7/f4dQOGMVxGXP4Hhj3cDjhIEGl8R35D8ZzLOHFiF3AF18WwVrjOMWPy3j5x9kkSySL9qiyEbADpaFSWvHhq6ETys7Kou7mEfitNnJz1sWmIoWd0icIJJ9Ohyu7u5v8kQ7eqzUVdnfXCTylicNOQXHdatILihakrr+cxRajUlyLZW8A+0GRrJQMFGdzExgfouku8Uts7L2Rqi1wTo6T98UsDhexs87w/92ZK9C+B5r/G0Z/SHqCkVxYEKMjPHso9bhuNWYG+bRF4myBMjjFh3tngi2bCNsdVaOXTtlz6UyA1mY/1noauDKB6q6BpuZQ0DryzIPG1P6BCtKKMEXSw5KGCGUseWrXgdT3gJ0+7e9sG0t6SS/ZYuAjHmagXLqfZyCJx2yO3gQnsWz3TAPbwMeMTI35s3+1Gw7z29f5zdWzV2rgArHaYj5P4y+ej3BTEQcAAA=="\n   },\n   "Metadata": {\n    "aws:cdk:path": "TapStackdev/CDKMetadata/Default"\n   }\n  }\n },\n "Outputs": {\n  "VpcId": {\n   "Description": "VPC ID",\n   "Value": {\n    "Ref": "TapVpc8B8CDDDF"\n   },\n   "Export": {\n    "Name": "TapStackdev-VpcId"\n   }\n  },\n  "VpcCidr": {\n   "Description": "VPC CIDR Block",\n   "Value": {\n    "Fn::GetAtt": [\n     "TapVpc8B8CDDDF",\n     "CidrBlock"\n    ]\n   },\n   "Export": {\n    "Name": "TapStackdev-VpcCidr"\n   }\n  },\n  "PublicSubnetIds": {\n   "Description": "Public Subnet IDs",\n   "Value": {\n    "Fn::Join": [\n     "",\n     [\n      {\n       "Ref": "TapVpcPublicSubnetSubnet1Subnet839F1108"\n      },\n      ",",\n      {\n       "Ref": "TapVpcPublicSubnetSubnet2Subnet09E451CD"\n      }\n     ]\n    ]\n   },\n   "Export": {\n    "Name": "TapStackdev-PublicSubnetIds"\n   }\n  },\n  "PrivateSubnetIds": {\n   "Description": "Private Subnet IDs",\n   "Value": {\n    "Fn::Join": [\n     "",\n     [\n      {\n       "Ref": "TapVpcPrivateSubnetSubnet1SubnetF697953F"\n      },\n      ",",\n      {\n       "Ref": "TapVpcPrivateSubnetSubnet2Subnet1C3B5DAD"\n      }\n     ]\n    ]\n   },\n   "Export": {\n    "Name": "TapStackdev-PrivateSubnetIds"\n   }\n  },\n  "NatGatewayIds": {\n   "Description": "NAT Gateway ID",\n   "Value": {\n    "Ref": "TapVpcPublicSubnetSubnet1NATGateway8BFCA3D1"\n   },\n   "Export": {\n    "Name": "TapStackdev-NatGatewayId"\n   }\n  },\n  "InternetGatewayId": {\n   "Description": "Internet Gateway ID",\n   "Value": {\n    "Ref": "TapVpcIGWD6C67C56"\n   },\n   "Export": {\n    "Name": "TapStackdev-InternetGatewayId"\n   }\n  },\n  "PublicInstanceId": {\n   "Description": "Public EC2 Instance ID",\n   "Value": {\n    "Ref": "PublicInstance"\n   },\n   "Export": {\n    "Name": "TapStackdev-PublicInstanceId"\n   }\n  },\n  "PrivateInstanceId": {\n   "Description": "Private EC2 Instance ID",\n   "Value": {\n    "Ref": "PrivateInstance"\n   },\n   "Export": {\n    "Name": "TapStackdev-PrivateInstanceId"\n   }\n  },\n  "PublicInstancePublicIp": {\n   "Description": "Public EC2 Instance Public IP",\n   "Value": {\n    "Fn::GetAtt": [\n     "PublicInstance",\n     "PublicIp"\n    ]\n   },\n   "Export": {\n    "Name": "TapStackdev-PublicInstancePublicIp"\n   }\n  },\n  "PublicInstancePrivateIp": {\n   "Description": "Public EC2 Instance Private IP",\n   "Value": {\n    "Fn::GetAtt": [\n     "PublicInstance",\n     "PrivateIp"\n    ]\n   },\n   "Export": {\n    "Name": "TapStackdev-PublicInstancePrivateIp"\n   }\n  },\n  "PrivateInstancePrivateIp": {\n   "Description": "Private EC2 Instance Private IP",\n   "Value": {\n    "Fn::GetAtt": [\n     "PrivateInstance",\n     "PrivateIp"\n    ]\n   },\n   "Export": {\n    "Name": "TapStackdev-PrivateInstancePrivateIp"\n   }\n  },\n  "SecurityGroupId": {\n   "Description": "SSH Security Group ID",\n   "Value": {\n    "Fn::GetAtt": [\n     "SshSecurityGroup4CD4C749",\n     "GroupId"\n    ]\n   },\n   "Export": {\n    "Name": "TapStackdev-SecurityGroupId"\n   }\n  },\n  "KeyPairName": {\n   "Description": "EC2 Key Pair Name",\n   "Value": "tap-key-dev",\n   "Export": {\n    "Name": "TapStackdev-KeyPairName"\n   }\n  },\n  "KeyPairId": {\n   "Description": "EC2 Key Pair ID",\n   "Value": {\n    "Fn::GetAtt": [\n     "TapKeyPair",\n     "KeyPairId"\n    ]\n   },\n   "Export": {\n    "Name": "TapStackdev-KeyPairId"\n   }\n  },\n  "EnvironmentSuffix": {\n   "Description": "Environment Suffix",\n   "Value": "dev",\n   "Export": {\n    "Name": "TapStackdev-EnvironmentSuffix"\n   }\n  }\n },\n "Rules": {\n  "CheckBootstrapVersion": {\n   "Assertions": [\n    {\n     "Assert": {\n      "Fn::Not": [\n       {\n        "Fn::Contains": [\n         [\n          "1",\n          "2",\n          "3",\n          "4",\n          "5"\n         ],\n         {\n          "Ref": "BootstrapVersion"\n         }\n        ]\n       }\n      ]\n     },\n     "AssertDescription": "CDK bootstrap stack version 6 required. Please run \'cdk bootstrap\' with a recent version of the CDK CLI."\n    }\n   ]\n  }\n }\n}'

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
Failed to publish asset TapStackdev Template (000000000000-us-east-1-5b51534a)

### Deployment Attempt 1: FAILED

The S3 asset publishing still fails even after disabling the custom Lambda resource. The issue is with cdklocal's asset publishing mechanism - it tries to upload the CloudFormation template as JSON to S3, but LocalStack expects XML-formatted requests.

Error: "Unable to parse request (not well-formed (invalid token): line 1, column 0), invalid XML received"

This is a known compatibility issue between cdklocal and LocalStack Community edition.

### Alternative Approach: Direct CloudFormation Deployment

Since CDK asset publishing fails, let me try deploying the synthesized CloudFormation template directly to LocalStack using awslocal CLI instead of cdklocal.


An error occurred (ValidationError) when calling the CreateChangeSet operation: Parameter SsmParameterValueawsserviceamiamazonlinuxlatestal2023amikernel61x8664C96584B6F00A464EAD1953AFF4B05118Parameter should either have input value or default value

An error occurred (AlreadyExistsException) when calling the CreateStack operation: Stack [TapStackPr649] already exists

An error occurred (ValidationError) when calling the CreateStack operation: Parameter SsmParameterValueawsserviceamiamazonlinuxlatestal2023amikernel61x8664C96584B6F00A464EAD1953AFF4B05118Parameter should either have input value or default value

An error occurred (AlreadyExistsException) when calling the CreateStack operation: Stack [TapStackPr649] already exists
{
    "StackId": "arn:aws:cloudformation:us-east-1:000000000000:stack/TapStackPr649/3dc9344e-3705-420d-b76a-c540382154b0"
}

Waiter StackCreateComplete failed: Waiter encountered a terminal failure state: For expression "Stacks[].StackStatus" we matched expected path: "CREATE_FAILED" at least once
2025-12-18T10:23:41.016165Z - AWS::CloudFormation::Stack - CREATE_FAILED - No reason
2025-12-18T10:23:41.016125Z - AWS::CloudFormation::Stack - CREATE_FAILED - No reason
2025-12-18T10:23:41.016117Z - AWS::EC2::Route - CREATE_FAILED - No reason
2025-12-18T10:23:41.016082Z - AWS::CloudFormation::Stack - CREATE_FAILED - No reason
2025-12-18T10:23:41.016068Z - AWS::EC2::NatGateway - CREATE_FAILED - Resource provider operation failed: An error occurred (InvalidAllocationID.NotFound) when calling the CreateNatGateway operation: Allocation ID '['unknown']' not found.
{
    "StackId": "arn:aws:cloudformation:us-east-1:000000000000:stack/TapStackPr649/7767fafe-20c0-4335-b9d8-85927592c8f6"
}
Stack status: CREATE_COMPLETE
Stack created successfully\!

---

## Deployment Success - Iteration 1

### Deployment Approach: Direct CloudFormation

Since cdklocal's asset publishing mechanism failed (S3 XML parsing error), we deployed the synthesized CloudFormation template directly using awslocal CLI.

**Key Changes:**

1. **Disabled NAT Gateway**
   - NAT Gateway has limited support in LocalStack Community
   - Changed private subnets from PRIVATE_WITH_EGRESS to PRIVATE_ISOLATED
   - Set natGateways: 0 when LocalStack endpoint is detected

2. **Fixed Template Parameters**
   - Converted AWS::SSM::Parameter::Value types to String with hardcoded defaults
   - LocalStack doesn't support SSM parameter lookups during deployment

3. **Used CfnInstance Instead of Instance**
   - Better LocalStack compatibility with lower-level CloudFormation constructs

### Deployment Result: SUCCESS

Stack TapStackPr649 deployed successfully to LocalStack!

**Resources Created:**
- VPC (vpc-623d1a9be985bf951) with CIDR 10.0.0.0/16
- 2 Public Subnets
- 2 Private Subnets (ISOLATED mode - no NAT Gateway)
- Internet Gateway (igw-ec37e7e8dd6c43bc0)
- Security Group (sg-2aacefe729725fc48)
- EC2 Key Pair (tap-key-dev)
- Public EC2 Instance (i-c2362e50b14e85163) with public IP 54.214.220.69
- Private EC2 Instance (i-8dd4d0f43856abbfc) with private IP 10.145.206.173

### Fixes Summary

**Iteration 1:**
1. Sanitized metadata.json - COMPLETED
2. Disabled Custom Lambda resource (restrictDefaultSecurityGroup) - COMPLETED
3. Simplified EC2 instances (CfnInstance) - COMPLETED
4. Added LocalStack endpoint configuration to tests - COMPLETED
5. Disabled NAT Gateway for LocalStack - COMPLETED
6. Fixed template parameters for LocalStack - COMPLETED

**Final Status:** DEPLOYMENT SUCCESSFUL

Thu Dec 18 10:26:49 UTC 2025
