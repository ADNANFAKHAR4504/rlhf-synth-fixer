package main

import (
	"os"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/jsii-runtime-go"
)

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	// Get environment suffix from context or environment variable
	var envSuffixStr string
	envSuffix := app.Node().TryGetContext(jsii.String("environmentSuffix"))
	if envSuffix == nil {
		envSuffixStr = os.Getenv("ENVIRONMENT_SUFFIX")
		if envSuffixStr == "" {
			envSuffixStr = "dev"
		}
	} else {
		envSuffixStr = envSuffix.(string)
	}

	lib.NewTapStack(app, jsii.String("TapStack"), &lib.TapStackProps{
		StackProps: awscdk.StackProps{
			Env: &awscdk.Environment{
				Region: jsii.String("us-east-1"),
			},
			Description: jsii.String("CI/CD Pipeline Infrastructure Stack"),
		},
		EnvironmentSuffix: jsii.String(envSuffixStr),
	})

	app.Synth(nil)
}
