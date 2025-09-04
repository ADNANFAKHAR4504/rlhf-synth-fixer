package main

import (
	"github.com/TuringGpt/iac-test-automations/lib"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/jsii-runtime-go"
)

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	// Create the main infrastructure stack
	lib.NewTapStack(app, "TapProductionStack", &lib.TapStackProps{
		StackProps: awscdk.StackProps{
			Env: env(),
		},
	})

	app.Synth(nil)
}

// env determines the AWS environment (account+region) in which our stack is deployed.
func env() *awscdk.Environment {
	return &awscdk.Environment{
		Region: jsii.String("us-east-1"),
	}
}