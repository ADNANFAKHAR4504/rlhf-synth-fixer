package constructs

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type DatabaseConstructProps struct {
	Environment string
}

type DatabaseConstruct struct {
	constructs.Construct
	Table awsdynamodb.ITable
}

func NewDatabaseConstruct(scope constructs.Construct, id string, props *DatabaseConstructProps) *DatabaseConstruct {
	construct := constructs.NewConstruct(scope, &id)

	// Create DynamoDB table with partition key, sort key, encryption, and point-in-time recovery
	table := awsdynamodb.NewTable(construct, jsii.String("MainTable"), &awsdynamodb.TableProps{
		TableName: jsii.String("proj-dynamodb-" + props.Environment),
		// Partition key
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("pk"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		// Sort key
		SortKey: &awsdynamodb.Attribute{
			Name: jsii.String("sk"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		// Enable encryption at rest
		Encryption: awsdynamodb.TableEncryption_AWS_MANAGED,
		// Enable point-in-time recovery
		PointInTimeRecovery: jsii.Bool(true),
		// Billing mode
		BillingMode: awsdynamodb.BillingMode_PAY_PER_REQUEST,
		// Enable deletion protection for production
		DeletionProtection: jsii.Bool(true),
		// Enable CloudWatch Contributor Insights
		ContributorInsightsEnabled: jsii.Bool(true),
	})

	// Add tags for better resource management
	awscdk.Tags_Of(table).Add(jsii.String("Environment"), jsii.String(props.Environment), nil)
	awscdk.Tags_Of(table).Add(jsii.String("Project"), jsii.String("tap-infrastructure"), nil)

	return &DatabaseConstruct{
		Construct: construct,
		Table:     table,
	}
}
