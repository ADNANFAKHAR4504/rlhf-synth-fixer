package stack

import (
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudtrail"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudwatch"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/sns"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func createMonitoring(ctx *pulumi.Context, usEast1Provider, euWest1Provider pulumi.ProviderResource, projectName, environment, notificationEmail string, tags pulumi.StringMap, accountId string) error {
	snsTopic, err := sns.NewTopic(ctx, "alerts", &sns.TopicArgs{Name: pulumi.Sprintf("%s-%s-alerts", projectName, environment), Tags: tags}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}
	_, err = sns.NewTopicSubscription(ctx, "email-alert", &sns.TopicSubscriptionArgs{Topic: snsTopic.Arn, Protocol: pulumi.String("email"), Endpoint: pulumi.String(notificationEmail)}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	cloudtrailBucket, err := s3.NewBucketV2(ctx, "cloudtrail-bucket", &s3.BucketV2Args{Tags: tags}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}
	_, err = s3.NewBucketServerSideEncryptionConfigurationV2(ctx, "cloudtrail-bucket-encryption", &s3.BucketServerSideEncryptionConfigurationV2Args{Bucket: cloudtrailBucket.ID(), Rules: s3.BucketServerSideEncryptionConfigurationV2RuleArray{&s3.BucketServerSideEncryptionConfigurationV2RuleArgs{ApplyServerSideEncryptionByDefault: &s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs{SseAlgorithm: pulumi.String("aws:kms")}}}}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}
	_, err = s3.NewBucketPublicAccessBlock(ctx, "cloudtrail-pab", &s3.BucketPublicAccessBlockArgs{Bucket: cloudtrailBucket.ID(), BlockPublicAcls: pulumi.Bool(true), BlockPublicPolicy: pulumi.Bool(true), IgnorePublicAcls: pulumi.Bool(true), RestrictPublicBuckets: pulumi.Bool(true)}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	cloudtrailLogGroup, err := cloudwatch.NewLogGroup(ctx, "cloudtrail-logs", &cloudwatch.LogGroupArgs{Name: pulumi.Sprintf("/aws/cloudtrail/%s-%s", projectName, environment)}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}
	cloudtrailRole, err := cloudtrail.NewTrail(ctx, "cloudtrail", &cloudtrail.TrailArgs{S3BucketName: cloudtrailBucket.Bucket, IncludeGlobalServiceEvents: pulumi.Bool(true), IsMultiRegionTrail: pulumi.Bool(true), EnableLogFileValidation: pulumi.Bool(true), CloudWatchLogsGroupArn: pulumi.All(cloudtrailLogGroup.Arn).ApplyT(func(args []interface{}) string { return args[0].(string) + ":*" }).(pulumi.StringOutput), CloudWatchLogsRoleArn: pulumi.String("arn:aws:iam::" + accountId + ":role/service-role/CloudTrail_CloudWatchLogs_Role")}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}
	_ = cloudtrailRole

	_, err = cloudwatch.NewLogMetricFilter(ctx, "unauthorized-api-calls", &cloudwatch.LogMetricFilterArgs{Name: pulumi.String("UnauthorizedAPICalls"), LogGroupName: cloudtrailLogGroup.Name, Pattern: pulumi.String(`{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }`), MetricTransformation: &cloudwatch.LogMetricFilterMetricTransformationArgs{Name: pulumi.String("UnauthorizedAPICalls"), Namespace: pulumi.String("CloudTrailMetrics"), Value: pulumi.String("1")}}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}
	_, err = cloudwatch.NewMetricAlarm(ctx, "unauthorized-api-calls-alarm", &cloudwatch.MetricAlarmArgs{Name: pulumi.String("UnauthorizedAPICalls"), ComparisonOperator: pulumi.String("GreaterThanOrEqualToThreshold"), EvaluationPeriods: pulumi.Int(1), MetricName: pulumi.String("UnauthorizedAPICalls"), Namespace: pulumi.String("CloudTrailMetrics"), Period: pulumi.Int(60), Statistic: pulumi.String("Sum"), Threshold: pulumi.Float64(1), AlarmActions: pulumi.Array{snsTopic.Arn}}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}
	return nil
}
