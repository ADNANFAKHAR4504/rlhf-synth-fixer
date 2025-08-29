package constructs

import (
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssns"
	"github.com/aws/constructs-go/constructs/v10"
)

type SecurityConstructProps struct {
	Environment string
}

type SecurityConstruct struct {
	constructs.Construct
	LambdaRole    awsiam.IRole
	AlertingTopic awssns.ITopic
	VPC           awsec2.IVpc
	VPCEndpoints  map[string]awsec2.IVpcEndpoint
}

func NewSecurityConstruct(scope constructs.Construct, id string, props *SecurityConstructProps) *SecurityConstruct {
	construct := constructs.NewConstruct(scope, &id)
	return &SecurityConstruct{
		Construct: construct,
	}
}
