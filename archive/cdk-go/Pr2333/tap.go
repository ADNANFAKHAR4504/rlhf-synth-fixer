package main

import (
	"os"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/jsii-runtime-go"

	"github.com/TuringGpt/iac-test-automations/lib"
)

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	lib.NewTapStack(app, "TapStack", &lib.TapStackProps{
		StackProps: awscdk.StackProps{
			Env: env(),
		},
	})

	app.Synth(nil)
}

// env determines the AWS environment (account+region) in which our stack is
// to be deployed. For more information see: https://docs.aws.amazon.com/cdk/latest/guide/environments.html
func env() *awscdk.Environment {
	// For synthesis, we can skip account ID if not available
	account := os.Getenv("CDK_DEFAULT_ACCOUNT")
	if account == "" {
		return nil // CDK will use default environment for synthesis
	}
	return &awscdk.Environment{
		Account: jsii.String(account),
		Region:  jsii.String("us-west-2"), // Fixed region as per requirements
	}
}
