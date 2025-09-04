package constructs

import (
	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssns"
	"github.com/aws/constructs-go/constructs/v10"
)

type ComputeConstructProps struct {
	Environment   string
	VPC           awsec2.IVpc
	LambdaRole    awsiam.IRole
	ImageBucket   awss3.IBucket
	ResultsBucket awss3.IBucket
	DynamoTable   awsdynamodb.ITable
	AlertingTopic awssns.ITopic
}

type ComputeConstruct struct {
	constructs.Construct
	ProcessingFunction awslambda.IFunction
	APIFunction        awslambda.IFunction
}

func NewComputeConstruct(scope constructs.Construct, id string, props *ComputeConstructProps) *ComputeConstruct {
	construct := constructs.NewConstruct(scope, &id)
	return &ComputeConstruct{
		Construct: construct,
	}
}
