The model failed at deploy response

@ previewing update.............................................................................................................................................................................
    pulumi:pulumi:Stack TapStack-TapStackpr2516  panic: Missing required configuration variable 'TapStack:projectName'
    pulumi:pulumi:Stack TapStack-TapStackpr2516  		please set a value using the command `pulumi config set TapStack:projectName <value>`
    pulumi:pulumi:Stack TapStack-TapStackpr2516  goroutine 1 [running]:
    pulumi:pulumi:Stack TapStack-TapStackpr2516  github.com/pulumi/pulumi/sdk/v3/go/pulumi/config.failf(...)
    pulumi:pulumi:Stack TapStack-TapStackpr2516  	/home/runner/work/iac-test-automations/iac-test-automations/.cache/go-mod/github.com/pulumi/pulumi/sdk/v3@v3.191.0/go/pulumi/config/require.go:29
    pulumi:pulumi:Stack TapStack-TapStackpr2516  github.com/pulumi/pulumi/sdk/v3/go/pulumi/config.requireConfig(0x65?, {0xc000330048, 0x14}, 0x0, {0x285eb28?, 0x285d0cb?}, {0x285902a?, 0x83?})
    pulumi:pulumi:Stack TapStack-TapStackpr2516  	/home/runner/work/iac-test-automations/iac-test-automations/.cache/go-mod/github.com/pulumi/pulumi/sdk/v3@v3.191.0/go/pulumi/config/require.go:41 +0x138
    pulumi:pulumi:Stack TapStack-TapStackpr2516  github.com/pulumi/pulumi/sdk/v3/go/pulumi/config.Require(...)
    pulumi:pulumi:Stack TapStack-TapStackpr2516  	/home/runner/work/iac-test-automations/iac-test-automations/.cache/go-mod/github.com/pulumi/pulumi/sdk/v3@v3.191.0/go/pulumi/config/require.go:50
    pulumi:pulumi:Stack TapStack-TapStackpr2516  github.com/pulumi/pulumi/sdk/v3/go/pulumi/config.(*Config).Require(...)
    pulumi:pulumi:Stack TapStack-TapStackpr2516  	/home/runner/work/iac-test-automations/iac-test-automations/.cache/go-mod/github.com/pulumi/pulumi/sdk/v3@v3.191.0/go/pulumi/config/config.go:73
    pulumi:pulumi:Stack TapStack-TapStackpr2516  main.main.func1(0xc00045a480)
    pulumi:pulumi:Stack TapStack-TapStackpr2516  	/home/runner/work/iac-test-automations/iac-test-automations/lib/tap_stack.go:24 +0x9c
    pulumi:pulumi:Stack TapStack-TapStackpr2516  github.com/pulumi/pulumi/sdk/v3/go/pulumi.RunWithContext(0xc00045a480, 0x28c3db8)
    pulumi:pulumi:Stack TapStack-TapStackpr2516  	/home/runner/work/iac-test-automations/iac-test-automations/.cache/go-mod/github.com/pulumi/pulumi/sdk/v3@v3.191.0/go/pulumi/run.go:141 +0x1b1
    pulumi:pulumi:Stack TapStack-TapStackpr2516  github.com/pulumi/pulumi/sdk/v3/go/pulumi.runErrInner(0x28c3db8, 0x28fc400, {0x0, 0x0, 0x0?})
    pulumi:pulumi:Stack TapStack-TapStackpr2516  	/home/runner/work/iac-test-automations/iac-test-automations/.cache/go-mod/github.com/pulumi/pulumi/sdk/v3@v3.191.0/go/pulumi/run.go:101 +0x2c5
    pulumi:pulumi:Stack TapStack-TapStackpr2516  github.com/pulumi/pulumi/sdk/v3/go/pulumi.Run(0xc000100060?, {0x0?, 0x540c028?, 0xc000002380?})
    pulumi:pulumi:Stack TapStack-TapStackpr2516  	/home/runner/work/iac-test-automations/iac-test-automations/.cache/go-mod/github.com/pulumi/pulumi/sdk/v3@v3.191.0/go/pulumi/run.go:53 +0x28
    pulumi:pulumi:Stack TapStack-TapStackpr2516  main.main()
    pulumi:pulumi:Stack TapStack-TapStackpr2516  	/home/runner/work/iac-test-automations/iac-test-automations/lib/tap_stack.go:21 +0x25
    pulumi:pulumi:Stack TapStack-TapStackpr2516  error: an unhandled error occurred: program exited with non-zero exit code: 2
    pulumi:pulumi:Stack TapStack-TapStackpr2516  1 error; 21 messages
Diagnostics:
  pulumi:pulumi:Stack (TapStack-TapStackpr2516):
    panic: Missing required configuration variable 'TapStack:projectName'
    		please set a value using the command `pulumi config set TapStack:projectName <value>`
    goroutine 1 [running]:
    github.com/pulumi/pulumi/sdk/v3/go/pulumi/config.failf(...)
    	/home/runner/work/iac-test-automations/iac-test-automations/.cache/go-mod/github.com/pulumi/pulumi/sdk/v3@v3.191.0/go/pulumi/config/require.go:29
    github.com/pulumi/pulumi/sdk/v3/go/pulumi/config.requireConfig(0x65?, {0xc000330048, 0x14}, 0x0, {0x285eb28?, 0x285d0cb?}, {0x285902a?, 0x83?})
    	/home/runner/work/iac-test-automations/iac-test-automations/.cache/go-mod/github.com/pulumi/pulumi/sdk/v3@v3.191.0/go/pulumi/config/require.go:41 +0x138
    github.com/pulumi/pulumi/sdk/v3/go/pulumi/config.Require(...)
    	/home/runner/work/iac-test-automations/iac-test-automations/.cache/go-mod/github.com/pulumi/pulumi/sdk/v3@v3.191.0/go/pulumi/config/require.go:50
    github.com/pulumi/pulumi/sdk/v3/go/pulumi/config.(*Config).Require(...)
    	/home/runner/work/iac-test-automations/iac-test-automations/.cache/go-mod/github.com/pulumi/pulumi/sdk/v3@v3.191.0/go/pulumi/config/config.go:73
    main.main.func1(0xc00045a480)
    	/home/runner/work/iac-test-automations/iac-test-automations/lib/tap_stack.go:24 +0x9c
    github.com/pulumi/pulumi/sdk/v3/go/pulumi.RunWithContext(0xc00045a480, 0x28c3db8)
    	/home/runner/work/iac-test-automations/iac-test-automations/.cache/go-mod/github.com/pulumi/pulumi/sdk/v3@v3.191.0/go/pulumi/run.go:141 +0x1b1
    github.com/pulumi/pulumi/sdk/v3/go/pulumi.runErrInner(0x28c3db8, 0x28fc400, {0x0, 0x0, 0x0?})
    	/home/runner/work/iac-test-automations/iac-test-automations/.cache/go-mod/github.com/pulumi/pulumi/sdk/v3@v3.191.0/go/pulumi/run.go:101 +0x2c5
    github.com/pulumi/pulumi/sdk/v3/go/pulumi.Run(0xc000100060?, {0x0?, 0x540c028?, 0xc000002380?})
    	/home/runner/work/iac-test-automations/iac-test-automations/.cache/go-mod/github.com/pulumi/pulumi/sdk/v3@v3.191.0/go/pulumi/run.go:53 +0x28
    main.main()
    	/home/runner/work/iac-test-automations/iac-test-automations/lib/tap_stack.go:21 +0x25

    error: an unhandled error occurred: program exited with non-zero exit code: 2
