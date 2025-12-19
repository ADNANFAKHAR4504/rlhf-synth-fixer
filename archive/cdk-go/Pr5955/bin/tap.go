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

	// Get environment from context (defaults to dev)
	environment := app.Node().TryGetContext(jsii.String("environment"))
	var env string
	if environment != nil {
		env = environment.(string)
	} else {
		env = "dev"
	}

	// Get environment suffix from context (defaults to random)
	envSuffix := app.Node().TryGetContext(jsii.String("environmentSuffix"))
	var suffix string
	if envSuffix != nil {
		suffix = envSuffix.(string)
	} else {
		suffix = env + "-default"
	}

	// Get AWS account and region from environment variables
	account := os.Getenv("CDK_DEFAULT_ACCOUNT")
	region := os.Getenv("CDK_DEFAULT_REGION")
	if region == "" {
		region = "us-east-1"
	}

	// Create payment stack
	lib.NewPaymentStack(app, "PaymentStack-"+env, &lib.PaymentStackProps{
		StackProps: awscdk.StackProps{
			Env: &awscdk.Environment{
				Account: jsii.String(account),
				Region:  jsii.String(region),
			},
			Description: jsii.String("Payment Processing Infrastructure Stack - " + env),
		},
		EnvironmentSuffix: suffix,
		Environment:       env,
	})

	// Create pipeline stack (optional, only if repository is configured)
	repoName := app.Node().TryGetContext(jsii.String("repositoryName"))
	if repoName != nil {
		branchName := "main"
		if env == "dev" {
			branchName = "develop"
		}

		lib.NewPipelineStack(app, "PipelineStack-"+env, &lib.PipelineStackProps{
			StackProps: awscdk.StackProps{
				Env: &awscdk.Environment{
					Account: jsii.String(account),
					Region:  jsii.String(region),
				},
				Description: jsii.String("Deployment Pipeline Stack - " + env),
			},
			EnvironmentSuffix: suffix,
			Environment:       env,
			RepositoryName:    repoName.(string),
			BranchName:        branchName,
		})
	}

	app.Synth(nil)
}
