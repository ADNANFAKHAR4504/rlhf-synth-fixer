package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awskinesis"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// AnalyticsConstructProps defines properties for the analytics construct.
type AnalyticsConstructProps struct {
	EnvironmentSuffix *string
}

// AnalyticsConstruct represents the Kinesis Data Stream infrastructure.
type AnalyticsConstruct struct {
	constructs.Construct
	Stream awskinesis.Stream
}

// NewAnalyticsConstruct creates Kinesis Data Stream for real-time analytics.
func NewAnalyticsConstruct(scope constructs.Construct, id *string, props *AnalyticsConstructProps) *AnalyticsConstruct {
	construct := constructs.NewConstruct(scope, id)

	environmentSuffix := *props.EnvironmentSuffix

	// Create Kinesis Data Stream for viewing metrics and user interactions
	stream := awskinesis.NewStream(construct, jsii.String("AnalyticsStream"), &awskinesis.StreamProps{
		StreamName: jsii.String(fmt.Sprintf("globalstream-analytics-%s", environmentSuffix)),
		// Use on-demand mode for automatic scaling
		StreamMode: awskinesis.StreamMode_ON_DEMAND,
		// Enable encryption at rest (LGPD compliance)
		Encryption: awskinesis.StreamEncryption_MANAGED,
		// Set retention period to 24 hours
		RetentionPeriod: awscdk.Duration_Hours(jsii.Number(24)),
		RemovalPolicy:   awscdk.RemovalPolicy_DESTROY,
	})

	// Tag stream for identification
	awscdk.Tags_Of(stream).Add(jsii.String("Purpose"), jsii.String("Real-time Analytics"), nil)
	awscdk.Tags_Of(stream).Add(jsii.String("DataType"), jsii.String("Viewing Metrics and User Interactions"), nil)
	awscdk.Tags_Of(stream).Add(jsii.String("Compliance"), jsii.String("LGPD"), nil)

	return &AnalyticsConstruct{
		Construct: construct,
		Stream:    stream,
	}
}
