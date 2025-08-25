package main

import (
	"os"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/provider"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	jsii "github.com/aws/jsii-runtime-go"
)

type TapStackConfig struct {
	Region      string
	Environment string
	AppName     string
}

type TapStack struct {
	Stack      cdktf.TerraformStack
	Config     *TapStackConfig
	Networking *NetworkingResources
	Security   *SecurityResources
	Lambda     *LambdaResources
	Monitoring *MonitoringResources
}

func NewTapStack(scope constructs.Construct, id string, config *TapStackConfig) *TapStack {
	tfStack := cdktf.NewTerraformStack(scope, &id)
	
	stack := &TapStack{
		Stack:  tfStack,
		Config: config,
	}

	// AWS Provider
	provider.NewAwsProvider(stack.Stack, jsii.String("aws"), &provider.AwsProviderConfig{
		Region: jsii.String(config.Region),
		DefaultTags: &[]*provider.AwsProviderDefaultTags{{
			Tags: &map[string]*string{
				"Environment": jsii.String(config.Environment),
				"Application": jsii.String(config.AppName),
				"ManagedBy":   jsii.String("cdktf"),
			},
		}},
	})

	// Initialize components in order
	stack.Networking = NewNetworkingResources(stack)
	stack.Security = NewSecurityResources(stack)
	stack.Lambda = NewLambdaResources(stack)
	stack.Monitoring = NewMonitoringResources(stack)

	// Create outputs
	stack.createOutputs()

	return stack
}

func main() {
	app := cdktf.NewApp(nil)

	// Get environment suffix
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "synthtrainr963"
	}

	config := &TapStackConfig{
		Region:      "us-east-1",
		Environment: "production",
		AppName:     "trainr963-" + environmentSuffix,
	}

	NewTapStack(app, "TapStack"+environmentSuffix, config)

	app.Synth()
}

func (stack *TapStack) createOutputs() {
	// VPC outputs
	cdktf.NewTerraformOutput(stack.Stack, str("vpc-id"), &cdktf.TerraformOutputConfig{
		Value: stack.Networking.VPC.Id(),
	})

	// API Gateway output
	if stack.Lambda != nil && stack.Lambda.APIGateway != nil {
		cdktf.NewTerraformOutput(stack.Stack, str("api-gateway-url"), &cdktf.TerraformOutputConfig{
			Value: stack.Lambda.APIGateway.Id(),
		})
	}

	// DynamoDB table output
	if stack.Lambda != nil && stack.Lambda.DynamoDBTable != nil {
		cdktf.NewTerraformOutput(stack.Stack, str("dynamodb-table-name"), &cdktf.TerraformOutputConfig{
			Value: stack.Lambda.DynamoDBTable.Name(),
		})
	}

	// S3 bucket output
	if stack.Lambda != nil && stack.Lambda.S3Bucket != nil {
		cdktf.NewTerraformOutput(stack.Stack, str("s3-bucket-name"), &cdktf.TerraformOutputConfig{
			Value: stack.Lambda.S3Bucket.Id(),
		})
	}
}

func str(v string) *string { return &v }
func num(v float64) *float64 { return &v }
func boolPtr(v bool) *bool { return &v }
