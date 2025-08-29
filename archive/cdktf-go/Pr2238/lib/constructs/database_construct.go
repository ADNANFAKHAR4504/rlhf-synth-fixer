package constructs

import (
	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
	"github.com/aws/constructs-go/constructs/v10"
)

type DatabaseConstructProps struct {
	Environment string
}

type DatabaseConstruct struct {
	constructs.Construct
	DynamoTable awsdynamodb.ITable
}

func NewDatabaseConstruct(scope constructs.Construct, id string, props *DatabaseConstructProps) *DatabaseConstruct {
	construct := constructs.NewConstruct(scope, &id)
	return &DatabaseConstruct{
		Construct: construct,
	}
}
