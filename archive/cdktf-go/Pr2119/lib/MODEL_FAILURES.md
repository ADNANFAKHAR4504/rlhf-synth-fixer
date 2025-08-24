## Issues in MODEL_RESPONSE.md (why it failed)

- **Missing jsii import**: Uses `jsii.String(...)` and `jsii.Strings(...)` without importing `github.com/aws/jsii-runtime-go`, causing compile errors.
- **Unused variables (compile error)**: `awsProvider` and `logGroup` are created but never used, which fails Go compilation.
- **Wrong Lambda permission approach**: Calls `lambdaFunc.AddPermission(...)`. In CDKTF, permissions must be a separate `aws_lambda_permission` resource; there is no `AddPermission` method on the function construct.
- **Malformed S3 ARN in IAM policy**: Uses `arn:aws:s3::::image-bucket-cdktf/*` (four colons). Correct format is `arn:aws:s3:::bucket-name/*`.
- **IAM not least-privilege for writes**: Grants `s3:PutObject` on the whole bucket instead of restricting to the `thumbnails/` prefix as required.
- **Runtime/handler mismatch**: Sets `runtime = go1.x` with `handler = index.handler`, which is a Node.js-style handler, leading to a non-working Lambda at runtime.
- **Bucket notification config fragile/incorrect**: Uses typed `LambdaFunction` block directly and only depends on the function, not the invoke permission; this often fails. A robust setup requires an explicit `aws_lambda_permission` and correct `lambda_function` block wiring.
- **Hard-coded bucket name**: Uses a fixed `image-bucket-cdktf` which can collide globally and fail creation. A safer approach is prefix/suffix-based naming.
- **Log group name may not match function**: Creates `/aws/lambda/thumbnail-generator` but the function name is not set to match; this can create unused log groups and confusing permissions.
- **No source code hash for Lambda**: Omits `source_code_hash`, leading to unreliable updates and drift detection issues.

These issues are addressed in `lib/tap_stack.go` by importing `jsii`, removing unused vars, using `aws_lambda_permission`, fixing S3 ARNs and least-privilege scoping, aligning runtime/handler, ensuring proper S3→Lambda notification setup, collision-resistant bucket naming, consistent log group naming, and providing a real ZIP with `source_code_hash`.
