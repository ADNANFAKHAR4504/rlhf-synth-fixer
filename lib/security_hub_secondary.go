package main

import (
	"fmt"
	"os"

	"github.com/aws/jsii-runtime-go"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securityhubaccount"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

type SecurityHubSecondaryStackConfig struct {
	Region      *string
	Environment *string
	Project     *string
}

func NewSecurityHubSecondaryStack(scope cdktf.App, id *string, config *SecurityHubSecondaryStackConfig) cdktf.TerraformStack {
	stack := cdktf.NewTerraformStack(scope, id)

	// Get environment suffix
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = fmt.Sprintf("synthtrainr961")
	}

	// AWS Provider for us-east-1
	awsEast := provider.NewAwsProvider(stack, jsii.String("aws-east"), &provider.AwsProviderConfig{
		Region: config.Region,
		Alias:  jsii.String("east"),
		DefaultTags: &[]*provider.AwsProviderDefaultTags{
			{
				Tags: &map[string]*string{
					"Environment": config.Environment,
					"Project":     config.Project,
					"Region":      jsii.String("secondary"),
					"ManagedBy":   jsii.String("cdktf"),
				},
			},
		},
	})

	// Security Hub in us-east-1
	securityhubaccount.NewSecurityhubAccount(stack, jsii.String("security-hub-east"), &securityhubaccount.SecurityhubAccountConfig{
		Provider:               awsEast,
		EnableDefaultStandards: jsii.Bool(true),
	})

	return stack
}
