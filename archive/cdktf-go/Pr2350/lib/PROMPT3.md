Hey synth is faling please fix this

```
> tap@0.1.0 cdktf:synth
> cdktf synth


⠋  Synthesizing
[2025-08-27T17:23:33.522] [ERROR] default - lib/tap_stack.go:26:2: no required module provides package github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketencryption; to add it:
ERROR: cdktf encountered an error while synthesizing

Synth command: go run ./lib
Error:         non-zero exit code 1

Command output on stderr:

    lib/tap_stack.go:26:2: no required module provides package github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketencryption; to add it:
        go get github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketencryption
```