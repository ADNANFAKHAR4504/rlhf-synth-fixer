Failed at deployment stage with below error

[resource plugin aws-6.83.0] installing
@ previewing update..................................

@ previewing update...........
    pulumi:pulumi:Stack TapStack-TapStackpr2129  tap_stack.go:11:2: no required module provides package github.com/pulumi/pulumi-aws/sdk/v6/go/aws/elbv2; to add it:
    pulumi:pulumi:Stack TapStack-TapStackpr2129  	go get github.com/pulumi/pulumi-aws/sdk/v6/go/aws/elbv2
    pulumi:pulumi:Stack TapStack-TapStackpr2129  error: error in compiling Go: unable to run `go build`: exit status 1
    pulumi:pulumi:Stack TapStack-TapStackpr2129  1 error; 2 messages
Diagnostics:
  pulumi:pulumi:Stack (TapStack-TapStackpr2129):
    tap_stack.go:11:2: no required module provides package github.com/pulumi/pulumi-aws/sdk/v6/go/aws/elbv2; to add it:
    	go get github.com/pulumi/pulumi-aws/sdk/v6/go/aws/elbv2

    error: error in compiling Go: unable to run `go build`: exit status 1