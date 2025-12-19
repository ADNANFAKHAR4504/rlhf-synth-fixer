Can you re-write the code to remove the dependency on the bellow errored package
```
@ previewing update.............................

@ previewing update........
    pulumi:pulumi:Stack TapStack-TapStackpr2329  ../.cache/go-mod/github.com/pulumi/pulumi/sdk/v3@v3.191.0/go/pulumi/config/get.go:23:2: missing go.sum entry for module providing package github.com/spf13/cast (imported by github.com/pulumi/pulumi/sdk/v3/go/pulumi/config); to add:
    pulumi:pulumi:Stack TapStack-TapStackpr2329  	go get github.com/pulumi/pulumi/sdk/v3/go/pulumi/config@v3.191.0
    pulumi:pulumi:Stack TapStack-TapStackpr2329  error: error in compiling Go: unable to run `go build`: exit status 1
    pulumi:pulumi:Stack TapStack-TapStackpr2329  1 error; 2 messages
Diagnostics:
  pulumi:pulumi:Stack (TapStack-TapStackpr2329):
    ../.cache/go-mod/github.com/pulumi/pulumi/sdk/v3@v3.191.0/go/pulumi/config/get.go:23:2: missing go.sum entry for module providing package github.com/spf13/cast (imported by github.com/pulumi/pulumi/sdk/v3/go/pulumi/config); to add:
    	go get github.com/pulumi/pulumi/sdk/v3/go/pulumi/config@v3.191.0

    error: error in compiling Go: unable to run `go build`: exit status 1
```
