package imports.aws.iot_topic_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.416Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotTopicRule.IotTopicRuleErrorActionOutputReference")
public class IotTopicRuleErrorActionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected IotTopicRuleErrorActionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IotTopicRuleErrorActionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public IotTopicRuleErrorActionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCloudwatchAlarm(final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchAlarm value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchAlarm", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCloudwatchLogs(final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchLogs value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchLogs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCloudwatchMetric(final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchMetric value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchMetric", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDynamodb(final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodb value) {
        software.amazon.jsii.Kernel.call(this, "putDynamodb", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDynamodbv2(final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodbv2 value) {
        software.amazon.jsii.Kernel.call(this, "putDynamodbv2", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putElasticsearch(final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionElasticsearch value) {
        software.amazon.jsii.Kernel.call(this, "putElasticsearch", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFirehose(final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionFirehose value) {
        software.amazon.jsii.Kernel.call(this, "putFirehose", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHttp(final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionHttp value) {
        software.amazon.jsii.Kernel.call(this, "putHttp", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putIotAnalytics(final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotAnalytics value) {
        software.amazon.jsii.Kernel.call(this, "putIotAnalytics", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putIotEvents(final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotEvents value) {
        software.amazon.jsii.Kernel.call(this, "putIotEvents", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKafka(final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionKafka value) {
        software.amazon.jsii.Kernel.call(this, "putKafka", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKinesis(final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionKinesis value) {
        software.amazon.jsii.Kernel.call(this, "putKinesis", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLambda(final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionLambda value) {
        software.amazon.jsii.Kernel.call(this, "putLambda", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRepublish(final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionRepublish value) {
        software.amazon.jsii.Kernel.call(this, "putRepublish", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3(final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionS3 value) {
        software.amazon.jsii.Kernel.call(this, "putS3", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSns(final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionSns value) {
        software.amazon.jsii.Kernel.call(this, "putSns", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSqs(final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionSqs value) {
        software.amazon.jsii.Kernel.call(this, "putSqs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStepFunctions(final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionStepFunctions value) {
        software.amazon.jsii.Kernel.call(this, "putStepFunctions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimestream(final @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionTimestream value) {
        software.amazon.jsii.Kernel.call(this, "putTimestream", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCloudwatchAlarm() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchAlarm", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCloudwatchLogs() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchLogs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCloudwatchMetric() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchMetric", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDynamodb() {
        software.amazon.jsii.Kernel.call(this, "resetDynamodb", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDynamodbv2() {
        software.amazon.jsii.Kernel.call(this, "resetDynamodbv2", software.amazon.jsii.NativeType.VOID);
    }

    public void resetElasticsearch() {
        software.amazon.jsii.Kernel.call(this, "resetElasticsearch", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFirehose() {
        software.amazon.jsii.Kernel.call(this, "resetFirehose", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHttp() {
        software.amazon.jsii.Kernel.call(this, "resetHttp", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIotAnalytics() {
        software.amazon.jsii.Kernel.call(this, "resetIotAnalytics", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIotEvents() {
        software.amazon.jsii.Kernel.call(this, "resetIotEvents", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKafka() {
        software.amazon.jsii.Kernel.call(this, "resetKafka", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKinesis() {
        software.amazon.jsii.Kernel.call(this, "resetKinesis", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambda() {
        software.amazon.jsii.Kernel.call(this, "resetLambda", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRepublish() {
        software.amazon.jsii.Kernel.call(this, "resetRepublish", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3() {
        software.amazon.jsii.Kernel.call(this, "resetS3", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSns() {
        software.amazon.jsii.Kernel.call(this, "resetSns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSqs() {
        software.amazon.jsii.Kernel.call(this, "resetSqs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStepFunctions() {
        software.amazon.jsii.Kernel.call(this, "resetStepFunctions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimestream() {
        software.amazon.jsii.Kernel.call(this, "resetTimestream", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchAlarmOutputReference getCloudwatchAlarm() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchAlarm", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchAlarmOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchLogsOutputReference getCloudwatchLogs() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogs", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchLogsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchMetricOutputReference getCloudwatchMetric() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchMetric", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchMetricOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodbOutputReference getDynamodb() {
        return software.amazon.jsii.Kernel.get(this, "dynamodb", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodbOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodbv2OutputReference getDynamodbv2() {
        return software.amazon.jsii.Kernel.get(this, "dynamodbv2", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodbv2OutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionElasticsearchOutputReference getElasticsearch() {
        return software.amazon.jsii.Kernel.get(this, "elasticsearch", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionElasticsearchOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionFirehoseOutputReference getFirehose() {
        return software.amazon.jsii.Kernel.get(this, "firehose", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionFirehoseOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionHttpOutputReference getHttp() {
        return software.amazon.jsii.Kernel.get(this, "http", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionHttpOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotAnalyticsOutputReference getIotAnalytics() {
        return software.amazon.jsii.Kernel.get(this, "iotAnalytics", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotAnalyticsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotEventsOutputReference getIotEvents() {
        return software.amazon.jsii.Kernel.get(this, "iotEvents", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotEventsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionKafkaOutputReference getKafka() {
        return software.amazon.jsii.Kernel.get(this, "kafka", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionKafkaOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionKinesisOutputReference getKinesis() {
        return software.amazon.jsii.Kernel.get(this, "kinesis", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionKinesisOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionLambdaOutputReference getLambda() {
        return software.amazon.jsii.Kernel.get(this, "lambda", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionLambdaOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionRepublishOutputReference getRepublish() {
        return software.amazon.jsii.Kernel.get(this, "republish", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionRepublishOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionS3OutputReference getS3() {
        return software.amazon.jsii.Kernel.get(this, "s3", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionS3OutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionSnsOutputReference getSns() {
        return software.amazon.jsii.Kernel.get(this, "sns", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionSnsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionSqsOutputReference getSqs() {
        return software.amazon.jsii.Kernel.get(this, "sqs", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionSqsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionStepFunctionsOutputReference getStepFunctions() {
        return software.amazon.jsii.Kernel.get(this, "stepFunctions", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionStepFunctionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_topic_rule.IotTopicRuleErrorActionTimestreamOutputReference getTimestream() {
        return software.amazon.jsii.Kernel.get(this, "timestream", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionTimestreamOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchAlarm getCloudwatchAlarmInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchAlarmInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchAlarm.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchLogs getCloudwatchLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchLogs.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchMetric getCloudwatchMetricInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchMetricInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchMetric.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodb getDynamodbInput() {
        return software.amazon.jsii.Kernel.get(this, "dynamodbInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodb.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodbv2 getDynamodbv2Input() {
        return software.amazon.jsii.Kernel.get(this, "dynamodbv2Input", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodbv2.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionElasticsearch getElasticsearchInput() {
        return software.amazon.jsii.Kernel.get(this, "elasticsearchInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionElasticsearch.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionFirehose getFirehoseInput() {
        return software.amazon.jsii.Kernel.get(this, "firehoseInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionFirehose.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionHttp getHttpInput() {
        return software.amazon.jsii.Kernel.get(this, "httpInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionHttp.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotAnalytics getIotAnalyticsInput() {
        return software.amazon.jsii.Kernel.get(this, "iotAnalyticsInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotAnalytics.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotEvents getIotEventsInput() {
        return software.amazon.jsii.Kernel.get(this, "iotEventsInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotEvents.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionKafka getKafkaInput() {
        return software.amazon.jsii.Kernel.get(this, "kafkaInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionKafka.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionKinesis getKinesisInput() {
        return software.amazon.jsii.Kernel.get(this, "kinesisInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionKinesis.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionLambda getLambdaInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionLambda.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionRepublish getRepublishInput() {
        return software.amazon.jsii.Kernel.get(this, "republishInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionRepublish.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionS3 getS3Input() {
        return software.amazon.jsii.Kernel.get(this, "s3Input", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionS3.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionSns getSnsInput() {
        return software.amazon.jsii.Kernel.get(this, "snsInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionSns.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionSqs getSqsInput() {
        return software.amazon.jsii.Kernel.get(this, "sqsInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionSqs.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionStepFunctions getStepFunctionsInput() {
        return software.amazon.jsii.Kernel.get(this, "stepFunctionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionStepFunctions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionTimestream getTimestreamInput() {
        return software.amazon.jsii.Kernel.get(this, "timestreamInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionTimestream.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorAction getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorAction.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorAction value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
