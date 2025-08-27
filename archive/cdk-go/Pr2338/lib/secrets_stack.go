package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssecretsmanager"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type SecretsStackProps struct {
	*awscdk.StackProps
	Vpc             awsec2.IVpc
	EnvironmentName string
}

type SecretsStack struct {
	awscdk.Stack
	DatabaseSecret            awssecretsmanager.Secret
	AppConfigSecret           awssecretsmanager.Secret
	SecretsManagerVpcEndpoint awsec2.IVpcEndpoint
}

func NewSecretsStack(scope constructs.Construct, id *string, props *SecretsStackProps) *SecretsStack {
	var sprops awscdk.StackProps
	if props.StackProps != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	// Create VPC Endpoint for Secrets Manager for enhanced security
	vpcEndpoint := awsec2.NewInterfaceVpcEndpoint(stack, jsii.String("SecretsManagerVpcEndpoint"), &awsec2.InterfaceVpcEndpointProps{
		Vpc:               props.Vpc,
		Service:           awsec2.InterfaceVpcEndpointAwsService_SECRETS_MANAGER(),
		PrivateDnsEnabled: jsii.Bool(true),
	})

	// Create secret for database credentials
	dbSecret := awssecretsmanager.NewSecret(stack, jsii.String("DatabaseCredentials"), &awssecretsmanager.SecretProps{
		SecretName:  jsii.String("prod/database/credentials"),
		Description: jsii.String("Database credentials for production environment"),
		GenerateSecretString: &awssecretsmanager.SecretStringGenerator{
			SecretStringTemplate: jsii.String(`{"username": "admin"}`),
			GenerateStringKey:    jsii.String("password"),
			PasswordLength:       jsii.Number(32),
			ExcludeCharacters:    jsii.String(`"@/\`),
		},
	})

	// Create secret for application configuration
	appSecret := awssecretsmanager.NewSecret(stack, jsii.String("ApplicationConfig"), &awssecretsmanager.SecretProps{
		SecretName:  jsii.String("prod/app/config"),
		Description: jsii.String("Application configuration secrets"),
		SecretStringValue: awscdk.SecretValue_UnsafePlainText(jsii.String(`{
			"api_key": "change-me",
			"jwt_secret": "change-me-jwt-secret",
			"encryption_key": "change-me-encryption"
		}`)),
	})

	// Tag secrets
	awscdk.Tags_Of(dbSecret).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(dbSecret).Add(jsii.String("Component"), jsii.String("Database"), nil)
	awscdk.Tags_Of(appSecret).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(appSecret).Add(jsii.String("Component"), jsii.String("Application"), nil)
	awscdk.Tags_Of(vpcEndpoint).Add(jsii.String("Environment"), jsii.String("Production"), nil)

	return &SecretsStack{
		Stack:                     stack,
		DatabaseSecret:            dbSecret,
		AppConfigSecret:           appSecret,
		SecretsManagerVpcEndpoint: vpcEndpoint,
	}
}
