panic: Error: Found an encoded list token string in a scalar string context.

        In CDKTF, we represent lists, with values unknown until after runtime, as arrays with a single element— a string token (["Token.1"]).

        We do this because CDKTF does not know the length of the list at compile time, meaning CDKTF has yet to invoke Terraform to communicate with the cloud provider.

        Because we don't know the length of the list, we can not differentiate if the list was accessed at the first or last index, or as part of a loop. To avoid this ambiguity:

        - If you want to access a singular item, use 'Fn.element(list, 0)'. Do not use 'list[0]'.

goroutine 1 [running]:
github.com/aws/jsii-runtime-go/runtime.InvokeVoid
        /go/pkg/mod/github.com/aws/jsii-runtime-go@v1.113.0/runtime/runtime.go:253 +0x158

could you please fix the above errors while deploying