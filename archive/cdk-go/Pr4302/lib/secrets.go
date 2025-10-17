package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssecretsmanager"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// SecretsConstructProps defines properties for the secrets construct.
type SecretsConstructProps struct {
	EnvironmentSuffix *string
}

// SecretsConstruct represents the secrets management infrastructure.
type SecretsConstruct struct {
	constructs.Construct
	DatabaseSecret awssecretsmanager.Secret
	ApiKeySecret   awssecretsmanager.Secret
}

// NewSecretsConstruct creates secrets for database credentials and API keys.
func NewSecretsConstruct(scope constructs.Construct, id *string, props *SecretsConstructProps) *SecretsConstruct {
	construct := constructs.NewConstruct(scope, id)

	environmentSuffix := *props.EnvironmentSuffix

	// Create secret for database credentials
	databaseSecret := awssecretsmanager.NewSecret(construct, jsii.String("DatabaseSecret"), &awssecretsmanager.SecretProps{
		SecretName:  jsii.String(fmt.Sprintf("globalstream-db-credentials-%s", environmentSuffix)),
		Description: jsii.String("Database credentials for Aurora Serverless cluster"),
		GenerateSecretString: &awssecretsmanager.SecretStringGenerator{
			SecretStringTemplate: jsii.String(`{"username":"globalstream_admin"}`),
			GenerateStringKey:    jsii.String("password"),
			ExcludeCharacters:    jsii.String("/@\"'\\"),
			PasswordLength:       jsii.Number(32),
		},
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
		// Enable cross-region replication to DR region (sa-east-1)
		ReplicaRegions: &[]*awssecretsmanager.ReplicaRegion{
			{
				Region: jsii.String("sa-east-1"),
			},
		},
	})

	// Create secret for API keys
	apiKeySecret := awssecretsmanager.NewSecret(construct, jsii.String("ApiKeySecret"), &awssecretsmanager.SecretProps{
		SecretName:  jsii.String(fmt.Sprintf("globalstream-api-keys-%s", environmentSuffix)),
		Description: jsii.String("API keys for content delivery and third-party integrations"),
		GenerateSecretString: &awssecretsmanager.SecretStringGenerator{
			SecretStringTemplate: jsii.String(`{"apiKeyName":"globalstream-api"}`),
			GenerateStringKey:    jsii.String("apiKey"),
			ExcludeCharacters:    jsii.String("/@\"'\\"),
			PasswordLength:       jsii.Number(64),
		},
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
		// Enable cross-region replication to DR region
		ReplicaRegions: &[]*awssecretsmanager.ReplicaRegion{
			{
				Region: jsii.String("sa-east-1"),
			},
		},
	})

	// Tag secrets for compliance and identification
	awscdk.Tags_Of(databaseSecret).Add(jsii.String("Purpose"), jsii.String("Database Credentials"), nil)
	awscdk.Tags_Of(databaseSecret).Add(jsii.String("Compliance"), jsii.String("LGPD"), nil)
	awscdk.Tags_Of(apiKeySecret).Add(jsii.String("Purpose"), jsii.String("API Keys"), nil)
	awscdk.Tags_Of(apiKeySecret).Add(jsii.String("Compliance"), jsii.String("LGPD"), nil)

	return &SecretsConstruct{
		Construct:      construct,
		DatabaseSecret: databaseSecret,
		ApiKeySecret:   apiKeySecret,
	}
}
