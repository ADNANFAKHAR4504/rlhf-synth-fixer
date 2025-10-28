package main

import (
	"os"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/jsii-runtime-go"

	"tap/lib"
)

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}

	lib.NewTapStack(app, "TapStack", &lib.TapStackProps{
		StackProps: awscdk.StackProps{
			Env: &awscdk.Environment{
				Region: jsii.String("eu-south-1"),
			},
		},
		EnvironmentSuffix: jsii.String(environmentSuffix),
	})

	app.Synth(nil)
}
