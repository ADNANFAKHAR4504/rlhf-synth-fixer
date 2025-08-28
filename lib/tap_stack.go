package integration

import (
	"github.com/TuringGpt/iac-test-automations/lib/stack"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// Run starts the Pulumi program for integration purposes.
func Run() {
	pulumi.Run(stack.CreateTapStack)
}
