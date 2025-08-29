Fix errors and update the stack :

Warning: aws-cdk-lib.aws_dynamodb.TableOptions#pointInTimeRecovery is deprecated.
use `pointInTimeRecoverySpecification` instead
This API will be removed in the next major release.
jsii.errors.JavaScriptError:
ValidationError: AWS_REGION environment variable is reserved by the lambda runtime and can not be set manually. See https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html
at path [TapStackpr2475/FileProcessorLambda] in aws-cdk-lib.aws_lambda.Function

      at Kernel._Kernel_create (/tmp/tmpn9q7ln0q/lib/program.js:548:25)
      at Kernel.create (/tmp/tmpn9q7ln0q/lib/program.js:218:93)
      at KernelHost.processRequest (/tmp/tmpn9q7ln0q/lib/program.js:15464:36)
      at KernelHost.run (/tmp/tmpn9q7ln0q/lib/program.js:15424:22)
      at Immediate._onImmediate (/tmp/tmpn9q7ln0q/lib/program.js:15425:45)
      at process.processImmediate (node:internal/timers:485:21)
