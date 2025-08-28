package constructs

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssns"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssqs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type StorageConstructProps struct {
	Environment string
	Region      string
}

type StorageConstruct struct {
	constructs.Construct
	deadLetterQueue  awssqs.Queue
	crossRegionTopic awssns.Topic
}

func NewStorageConstruct(scope constructs.Construct, id *string, props *StorageConstructProps) *StorageConstruct {
	construct := constructs.NewConstruct(scope, id)

	envSuffix := fmt.Sprintf("-%s-%s", props.Environment, props.Region)

	// Dead Letter Queue for failed Lambda invocations
	deadLetterQueue := awssqs.NewQueue(construct, jsii.String("DeadLetterQueue"), &awssqs.QueueProps{
		QueueName:         jsii.String(fmt.Sprintf("tap-dlq%s", envSuffix)),
		RetentionPeriod:   awscdk.Duration_Days(jsii.Number(14)),
		VisibilityTimeout: awscdk.Duration_Seconds(jsii.Number(300)),
		Encryption:        awssqs.QueueEncryption_KMS_MANAGED,
	})

	// SNS Topic for cross-region communication
	crossRegionTopic := awssns.NewTopic(construct, jsii.String("CrossRegionTopic"), &awssns.TopicProps{
		TopicName:   jsii.String(fmt.Sprintf("tap-cross-region%s", envSuffix)),
		DisplayName: jsii.String(fmt.Sprintf("TAP Cross-Region Communication %s", envSuffix)),
	})

	return &StorageConstruct{
		Construct:        construct,
		deadLetterQueue:  deadLetterQueue,
		crossRegionTopic: crossRegionTopic,
	}
}

func (s *StorageConstruct) DeadLetterQueue() awssqs.Queue {
	return s.deadLetterQueue
}

func (s *StorageConstruct) CrossRegionTopic() awssns.Topic {
	return s.crossRegionTopic
}
