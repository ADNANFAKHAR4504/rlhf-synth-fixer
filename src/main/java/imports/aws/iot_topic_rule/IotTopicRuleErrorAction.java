package imports.aws.iot_topic_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.415Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotTopicRule.IotTopicRuleErrorAction")
@software.amazon.jsii.Jsii.Proxy(IotTopicRuleErrorAction.Jsii$Proxy.class)
public interface IotTopicRuleErrorAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * cloudwatch_alarm block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_alarm IotTopicRule#cloudwatch_alarm}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchAlarm getCloudwatchAlarm() {
        return null;
    }

    /**
     * cloudwatch_logs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_logs IotTopicRule#cloudwatch_logs}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchLogs getCloudwatchLogs() {
        return null;
    }

    /**
     * cloudwatch_metric block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_metric IotTopicRule#cloudwatch_metric}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchMetric getCloudwatchMetric() {
        return null;
    }

    /**
     * dynamodb block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#dynamodb IotTopicRule#dynamodb}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodb getDynamodb() {
        return null;
    }

    /**
     * dynamodbv2 block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#dynamodbv2 IotTopicRule#dynamodbv2}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodbv2 getDynamodbv2() {
        return null;
    }

    /**
     * elasticsearch block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#elasticsearch IotTopicRule#elasticsearch}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionElasticsearch getElasticsearch() {
        return null;
    }

    /**
     * firehose block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#firehose IotTopicRule#firehose}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionFirehose getFirehose() {
        return null;
    }

    /**
     * http block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#http IotTopicRule#http}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionHttp getHttp() {
        return null;
    }

    /**
     * iot_analytics block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#iot_analytics IotTopicRule#iot_analytics}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotAnalytics getIotAnalytics() {
        return null;
    }

    /**
     * iot_events block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#iot_events IotTopicRule#iot_events}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotEvents getIotEvents() {
        return null;
    }

    /**
     * kafka block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#kafka IotTopicRule#kafka}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionKafka getKafka() {
        return null;
    }

    /**
     * kinesis block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#kinesis IotTopicRule#kinesis}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionKinesis getKinesis() {
        return null;
    }

    /**
     * lambda block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#lambda IotTopicRule#lambda}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionLambda getLambda() {
        return null;
    }

    /**
     * republish block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#republish IotTopicRule#republish}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionRepublish getRepublish() {
        return null;
    }

    /**
     * s3 block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#s3 IotTopicRule#s3}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionS3 getS3() {
        return null;
    }

    /**
     * sns block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sns IotTopicRule#sns}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionSns getSns() {
        return null;
    }

    /**
     * sqs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sqs IotTopicRule#sqs}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionSqs getSqs() {
        return null;
    }

    /**
     * step_functions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#step_functions IotTopicRule#step_functions}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionStepFunctions getStepFunctions() {
        return null;
    }

    /**
     * timestream block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#timestream IotTopicRule#timestream}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorActionTimestream getTimestream() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IotTopicRuleErrorAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IotTopicRuleErrorAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IotTopicRuleErrorAction> {
        imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchAlarm cloudwatchAlarm;
        imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchLogs cloudwatchLogs;
        imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchMetric cloudwatchMetric;
        imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodb dynamodb;
        imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodbv2 dynamodbv2;
        imports.aws.iot_topic_rule.IotTopicRuleErrorActionElasticsearch elasticsearch;
        imports.aws.iot_topic_rule.IotTopicRuleErrorActionFirehose firehose;
        imports.aws.iot_topic_rule.IotTopicRuleErrorActionHttp http;
        imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotAnalytics iotAnalytics;
        imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotEvents iotEvents;
        imports.aws.iot_topic_rule.IotTopicRuleErrorActionKafka kafka;
        imports.aws.iot_topic_rule.IotTopicRuleErrorActionKinesis kinesis;
        imports.aws.iot_topic_rule.IotTopicRuleErrorActionLambda lambda;
        imports.aws.iot_topic_rule.IotTopicRuleErrorActionRepublish republish;
        imports.aws.iot_topic_rule.IotTopicRuleErrorActionS3 s3;
        imports.aws.iot_topic_rule.IotTopicRuleErrorActionSns sns;
        imports.aws.iot_topic_rule.IotTopicRuleErrorActionSqs sqs;
        imports.aws.iot_topic_rule.IotTopicRuleErrorActionStepFunctions stepFunctions;
        imports.aws.iot_topic_rule.IotTopicRuleErrorActionTimestream timestream;

        /**
         * Sets the value of {@link IotTopicRuleErrorAction#getCloudwatchAlarm}
         * @param cloudwatchAlarm cloudwatch_alarm block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_alarm IotTopicRule#cloudwatch_alarm}
         * @return {@code this}
         */
        public Builder cloudwatchAlarm(imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchAlarm cloudwatchAlarm) {
            this.cloudwatchAlarm = cloudwatchAlarm;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorAction#getCloudwatchLogs}
         * @param cloudwatchLogs cloudwatch_logs block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_logs IotTopicRule#cloudwatch_logs}
         * @return {@code this}
         */
        public Builder cloudwatchLogs(imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchLogs cloudwatchLogs) {
            this.cloudwatchLogs = cloudwatchLogs;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorAction#getCloudwatchMetric}
         * @param cloudwatchMetric cloudwatch_metric block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_metric IotTopicRule#cloudwatch_metric}
         * @return {@code this}
         */
        public Builder cloudwatchMetric(imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchMetric cloudwatchMetric) {
            this.cloudwatchMetric = cloudwatchMetric;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorAction#getDynamodb}
         * @param dynamodb dynamodb block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#dynamodb IotTopicRule#dynamodb}
         * @return {@code this}
         */
        public Builder dynamodb(imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodb dynamodb) {
            this.dynamodb = dynamodb;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorAction#getDynamodbv2}
         * @param dynamodbv2 dynamodbv2 block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#dynamodbv2 IotTopicRule#dynamodbv2}
         * @return {@code this}
         */
        public Builder dynamodbv2(imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodbv2 dynamodbv2) {
            this.dynamodbv2 = dynamodbv2;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorAction#getElasticsearch}
         * @param elasticsearch elasticsearch block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#elasticsearch IotTopicRule#elasticsearch}
         * @return {@code this}
         */
        public Builder elasticsearch(imports.aws.iot_topic_rule.IotTopicRuleErrorActionElasticsearch elasticsearch) {
            this.elasticsearch = elasticsearch;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorAction#getFirehose}
         * @param firehose firehose block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#firehose IotTopicRule#firehose}
         * @return {@code this}
         */
        public Builder firehose(imports.aws.iot_topic_rule.IotTopicRuleErrorActionFirehose firehose) {
            this.firehose = firehose;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorAction#getHttp}
         * @param http http block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#http IotTopicRule#http}
         * @return {@code this}
         */
        public Builder http(imports.aws.iot_topic_rule.IotTopicRuleErrorActionHttp http) {
            this.http = http;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorAction#getIotAnalytics}
         * @param iotAnalytics iot_analytics block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#iot_analytics IotTopicRule#iot_analytics}
         * @return {@code this}
         */
        public Builder iotAnalytics(imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotAnalytics iotAnalytics) {
            this.iotAnalytics = iotAnalytics;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorAction#getIotEvents}
         * @param iotEvents iot_events block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#iot_events IotTopicRule#iot_events}
         * @return {@code this}
         */
        public Builder iotEvents(imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotEvents iotEvents) {
            this.iotEvents = iotEvents;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorAction#getKafka}
         * @param kafka kafka block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#kafka IotTopicRule#kafka}
         * @return {@code this}
         */
        public Builder kafka(imports.aws.iot_topic_rule.IotTopicRuleErrorActionKafka kafka) {
            this.kafka = kafka;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorAction#getKinesis}
         * @param kinesis kinesis block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#kinesis IotTopicRule#kinesis}
         * @return {@code this}
         */
        public Builder kinesis(imports.aws.iot_topic_rule.IotTopicRuleErrorActionKinesis kinesis) {
            this.kinesis = kinesis;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorAction#getLambda}
         * @param lambda lambda block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#lambda IotTopicRule#lambda}
         * @return {@code this}
         */
        public Builder lambda(imports.aws.iot_topic_rule.IotTopicRuleErrorActionLambda lambda) {
            this.lambda = lambda;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorAction#getRepublish}
         * @param republish republish block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#republish IotTopicRule#republish}
         * @return {@code this}
         */
        public Builder republish(imports.aws.iot_topic_rule.IotTopicRuleErrorActionRepublish republish) {
            this.republish = republish;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorAction#getS3}
         * @param s3 s3 block.
         *           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#s3 IotTopicRule#s3}
         * @return {@code this}
         */
        public Builder s3(imports.aws.iot_topic_rule.IotTopicRuleErrorActionS3 s3) {
            this.s3 = s3;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorAction#getSns}
         * @param sns sns block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sns IotTopicRule#sns}
         * @return {@code this}
         */
        public Builder sns(imports.aws.iot_topic_rule.IotTopicRuleErrorActionSns sns) {
            this.sns = sns;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorAction#getSqs}
         * @param sqs sqs block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sqs IotTopicRule#sqs}
         * @return {@code this}
         */
        public Builder sqs(imports.aws.iot_topic_rule.IotTopicRuleErrorActionSqs sqs) {
            this.sqs = sqs;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorAction#getStepFunctions}
         * @param stepFunctions step_functions block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#step_functions IotTopicRule#step_functions}
         * @return {@code this}
         */
        public Builder stepFunctions(imports.aws.iot_topic_rule.IotTopicRuleErrorActionStepFunctions stepFunctions) {
            this.stepFunctions = stepFunctions;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorAction#getTimestream}
         * @param timestream timestream block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#timestream IotTopicRule#timestream}
         * @return {@code this}
         */
        public Builder timestream(imports.aws.iot_topic_rule.IotTopicRuleErrorActionTimestream timestream) {
            this.timestream = timestream;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IotTopicRuleErrorAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IotTopicRuleErrorAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IotTopicRuleErrorAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IotTopicRuleErrorAction {
        private final imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchAlarm cloudwatchAlarm;
        private final imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchLogs cloudwatchLogs;
        private final imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchMetric cloudwatchMetric;
        private final imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodb dynamodb;
        private final imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodbv2 dynamodbv2;
        private final imports.aws.iot_topic_rule.IotTopicRuleErrorActionElasticsearch elasticsearch;
        private final imports.aws.iot_topic_rule.IotTopicRuleErrorActionFirehose firehose;
        private final imports.aws.iot_topic_rule.IotTopicRuleErrorActionHttp http;
        private final imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotAnalytics iotAnalytics;
        private final imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotEvents iotEvents;
        private final imports.aws.iot_topic_rule.IotTopicRuleErrorActionKafka kafka;
        private final imports.aws.iot_topic_rule.IotTopicRuleErrorActionKinesis kinesis;
        private final imports.aws.iot_topic_rule.IotTopicRuleErrorActionLambda lambda;
        private final imports.aws.iot_topic_rule.IotTopicRuleErrorActionRepublish republish;
        private final imports.aws.iot_topic_rule.IotTopicRuleErrorActionS3 s3;
        private final imports.aws.iot_topic_rule.IotTopicRuleErrorActionSns sns;
        private final imports.aws.iot_topic_rule.IotTopicRuleErrorActionSqs sqs;
        private final imports.aws.iot_topic_rule.IotTopicRuleErrorActionStepFunctions stepFunctions;
        private final imports.aws.iot_topic_rule.IotTopicRuleErrorActionTimestream timestream;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cloudwatchAlarm = software.amazon.jsii.Kernel.get(this, "cloudwatchAlarm", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchAlarm.class));
            this.cloudwatchLogs = software.amazon.jsii.Kernel.get(this, "cloudwatchLogs", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchLogs.class));
            this.cloudwatchMetric = software.amazon.jsii.Kernel.get(this, "cloudwatchMetric", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchMetric.class));
            this.dynamodb = software.amazon.jsii.Kernel.get(this, "dynamodb", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodb.class));
            this.dynamodbv2 = software.amazon.jsii.Kernel.get(this, "dynamodbv2", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodbv2.class));
            this.elasticsearch = software.amazon.jsii.Kernel.get(this, "elasticsearch", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionElasticsearch.class));
            this.firehose = software.amazon.jsii.Kernel.get(this, "firehose", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionFirehose.class));
            this.http = software.amazon.jsii.Kernel.get(this, "http", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionHttp.class));
            this.iotAnalytics = software.amazon.jsii.Kernel.get(this, "iotAnalytics", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotAnalytics.class));
            this.iotEvents = software.amazon.jsii.Kernel.get(this, "iotEvents", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotEvents.class));
            this.kafka = software.amazon.jsii.Kernel.get(this, "kafka", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionKafka.class));
            this.kinesis = software.amazon.jsii.Kernel.get(this, "kinesis", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionKinesis.class));
            this.lambda = software.amazon.jsii.Kernel.get(this, "lambda", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionLambda.class));
            this.republish = software.amazon.jsii.Kernel.get(this, "republish", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionRepublish.class));
            this.s3 = software.amazon.jsii.Kernel.get(this, "s3", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionS3.class));
            this.sns = software.amazon.jsii.Kernel.get(this, "sns", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionSns.class));
            this.sqs = software.amazon.jsii.Kernel.get(this, "sqs", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionSqs.class));
            this.stepFunctions = software.amazon.jsii.Kernel.get(this, "stepFunctions", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionStepFunctions.class));
            this.timestream = software.amazon.jsii.Kernel.get(this, "timestream", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorActionTimestream.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cloudwatchAlarm = builder.cloudwatchAlarm;
            this.cloudwatchLogs = builder.cloudwatchLogs;
            this.cloudwatchMetric = builder.cloudwatchMetric;
            this.dynamodb = builder.dynamodb;
            this.dynamodbv2 = builder.dynamodbv2;
            this.elasticsearch = builder.elasticsearch;
            this.firehose = builder.firehose;
            this.http = builder.http;
            this.iotAnalytics = builder.iotAnalytics;
            this.iotEvents = builder.iotEvents;
            this.kafka = builder.kafka;
            this.kinesis = builder.kinesis;
            this.lambda = builder.lambda;
            this.republish = builder.republish;
            this.s3 = builder.s3;
            this.sns = builder.sns;
            this.sqs = builder.sqs;
            this.stepFunctions = builder.stepFunctions;
            this.timestream = builder.timestream;
        }

        @Override
        public final imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchAlarm getCloudwatchAlarm() {
            return this.cloudwatchAlarm;
        }

        @Override
        public final imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchLogs getCloudwatchLogs() {
            return this.cloudwatchLogs;
        }

        @Override
        public final imports.aws.iot_topic_rule.IotTopicRuleErrorActionCloudwatchMetric getCloudwatchMetric() {
            return this.cloudwatchMetric;
        }

        @Override
        public final imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodb getDynamodb() {
            return this.dynamodb;
        }

        @Override
        public final imports.aws.iot_topic_rule.IotTopicRuleErrorActionDynamodbv2 getDynamodbv2() {
            return this.dynamodbv2;
        }

        @Override
        public final imports.aws.iot_topic_rule.IotTopicRuleErrorActionElasticsearch getElasticsearch() {
            return this.elasticsearch;
        }

        @Override
        public final imports.aws.iot_topic_rule.IotTopicRuleErrorActionFirehose getFirehose() {
            return this.firehose;
        }

        @Override
        public final imports.aws.iot_topic_rule.IotTopicRuleErrorActionHttp getHttp() {
            return this.http;
        }

        @Override
        public final imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotAnalytics getIotAnalytics() {
            return this.iotAnalytics;
        }

        @Override
        public final imports.aws.iot_topic_rule.IotTopicRuleErrorActionIotEvents getIotEvents() {
            return this.iotEvents;
        }

        @Override
        public final imports.aws.iot_topic_rule.IotTopicRuleErrorActionKafka getKafka() {
            return this.kafka;
        }

        @Override
        public final imports.aws.iot_topic_rule.IotTopicRuleErrorActionKinesis getKinesis() {
            return this.kinesis;
        }

        @Override
        public final imports.aws.iot_topic_rule.IotTopicRuleErrorActionLambda getLambda() {
            return this.lambda;
        }

        @Override
        public final imports.aws.iot_topic_rule.IotTopicRuleErrorActionRepublish getRepublish() {
            return this.republish;
        }

        @Override
        public final imports.aws.iot_topic_rule.IotTopicRuleErrorActionS3 getS3() {
            return this.s3;
        }

        @Override
        public final imports.aws.iot_topic_rule.IotTopicRuleErrorActionSns getSns() {
            return this.sns;
        }

        @Override
        public final imports.aws.iot_topic_rule.IotTopicRuleErrorActionSqs getSqs() {
            return this.sqs;
        }

        @Override
        public final imports.aws.iot_topic_rule.IotTopicRuleErrorActionStepFunctions getStepFunctions() {
            return this.stepFunctions;
        }

        @Override
        public final imports.aws.iot_topic_rule.IotTopicRuleErrorActionTimestream getTimestream() {
            return this.timestream;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCloudwatchAlarm() != null) {
                data.set("cloudwatchAlarm", om.valueToTree(this.getCloudwatchAlarm()));
            }
            if (this.getCloudwatchLogs() != null) {
                data.set("cloudwatchLogs", om.valueToTree(this.getCloudwatchLogs()));
            }
            if (this.getCloudwatchMetric() != null) {
                data.set("cloudwatchMetric", om.valueToTree(this.getCloudwatchMetric()));
            }
            if (this.getDynamodb() != null) {
                data.set("dynamodb", om.valueToTree(this.getDynamodb()));
            }
            if (this.getDynamodbv2() != null) {
                data.set("dynamodbv2", om.valueToTree(this.getDynamodbv2()));
            }
            if (this.getElasticsearch() != null) {
                data.set("elasticsearch", om.valueToTree(this.getElasticsearch()));
            }
            if (this.getFirehose() != null) {
                data.set("firehose", om.valueToTree(this.getFirehose()));
            }
            if (this.getHttp() != null) {
                data.set("http", om.valueToTree(this.getHttp()));
            }
            if (this.getIotAnalytics() != null) {
                data.set("iotAnalytics", om.valueToTree(this.getIotAnalytics()));
            }
            if (this.getIotEvents() != null) {
                data.set("iotEvents", om.valueToTree(this.getIotEvents()));
            }
            if (this.getKafka() != null) {
                data.set("kafka", om.valueToTree(this.getKafka()));
            }
            if (this.getKinesis() != null) {
                data.set("kinesis", om.valueToTree(this.getKinesis()));
            }
            if (this.getLambda() != null) {
                data.set("lambda", om.valueToTree(this.getLambda()));
            }
            if (this.getRepublish() != null) {
                data.set("republish", om.valueToTree(this.getRepublish()));
            }
            if (this.getS3() != null) {
                data.set("s3", om.valueToTree(this.getS3()));
            }
            if (this.getSns() != null) {
                data.set("sns", om.valueToTree(this.getSns()));
            }
            if (this.getSqs() != null) {
                data.set("sqs", om.valueToTree(this.getSqs()));
            }
            if (this.getStepFunctions() != null) {
                data.set("stepFunctions", om.valueToTree(this.getStepFunctions()));
            }
            if (this.getTimestream() != null) {
                data.set("timestream", om.valueToTree(this.getTimestream()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.iotTopicRule.IotTopicRuleErrorAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IotTopicRuleErrorAction.Jsii$Proxy that = (IotTopicRuleErrorAction.Jsii$Proxy) o;

            if (this.cloudwatchAlarm != null ? !this.cloudwatchAlarm.equals(that.cloudwatchAlarm) : that.cloudwatchAlarm != null) return false;
            if (this.cloudwatchLogs != null ? !this.cloudwatchLogs.equals(that.cloudwatchLogs) : that.cloudwatchLogs != null) return false;
            if (this.cloudwatchMetric != null ? !this.cloudwatchMetric.equals(that.cloudwatchMetric) : that.cloudwatchMetric != null) return false;
            if (this.dynamodb != null ? !this.dynamodb.equals(that.dynamodb) : that.dynamodb != null) return false;
            if (this.dynamodbv2 != null ? !this.dynamodbv2.equals(that.dynamodbv2) : that.dynamodbv2 != null) return false;
            if (this.elasticsearch != null ? !this.elasticsearch.equals(that.elasticsearch) : that.elasticsearch != null) return false;
            if (this.firehose != null ? !this.firehose.equals(that.firehose) : that.firehose != null) return false;
            if (this.http != null ? !this.http.equals(that.http) : that.http != null) return false;
            if (this.iotAnalytics != null ? !this.iotAnalytics.equals(that.iotAnalytics) : that.iotAnalytics != null) return false;
            if (this.iotEvents != null ? !this.iotEvents.equals(that.iotEvents) : that.iotEvents != null) return false;
            if (this.kafka != null ? !this.kafka.equals(that.kafka) : that.kafka != null) return false;
            if (this.kinesis != null ? !this.kinesis.equals(that.kinesis) : that.kinesis != null) return false;
            if (this.lambda != null ? !this.lambda.equals(that.lambda) : that.lambda != null) return false;
            if (this.republish != null ? !this.republish.equals(that.republish) : that.republish != null) return false;
            if (this.s3 != null ? !this.s3.equals(that.s3) : that.s3 != null) return false;
            if (this.sns != null ? !this.sns.equals(that.sns) : that.sns != null) return false;
            if (this.sqs != null ? !this.sqs.equals(that.sqs) : that.sqs != null) return false;
            if (this.stepFunctions != null ? !this.stepFunctions.equals(that.stepFunctions) : that.stepFunctions != null) return false;
            return this.timestream != null ? this.timestream.equals(that.timestream) : that.timestream == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cloudwatchAlarm != null ? this.cloudwatchAlarm.hashCode() : 0;
            result = 31 * result + (this.cloudwatchLogs != null ? this.cloudwatchLogs.hashCode() : 0);
            result = 31 * result + (this.cloudwatchMetric != null ? this.cloudwatchMetric.hashCode() : 0);
            result = 31 * result + (this.dynamodb != null ? this.dynamodb.hashCode() : 0);
            result = 31 * result + (this.dynamodbv2 != null ? this.dynamodbv2.hashCode() : 0);
            result = 31 * result + (this.elasticsearch != null ? this.elasticsearch.hashCode() : 0);
            result = 31 * result + (this.firehose != null ? this.firehose.hashCode() : 0);
            result = 31 * result + (this.http != null ? this.http.hashCode() : 0);
            result = 31 * result + (this.iotAnalytics != null ? this.iotAnalytics.hashCode() : 0);
            result = 31 * result + (this.iotEvents != null ? this.iotEvents.hashCode() : 0);
            result = 31 * result + (this.kafka != null ? this.kafka.hashCode() : 0);
            result = 31 * result + (this.kinesis != null ? this.kinesis.hashCode() : 0);
            result = 31 * result + (this.lambda != null ? this.lambda.hashCode() : 0);
            result = 31 * result + (this.republish != null ? this.republish.hashCode() : 0);
            result = 31 * result + (this.s3 != null ? this.s3.hashCode() : 0);
            result = 31 * result + (this.sns != null ? this.sns.hashCode() : 0);
            result = 31 * result + (this.sqs != null ? this.sqs.hashCode() : 0);
            result = 31 * result + (this.stepFunctions != null ? this.stepFunctions.hashCode() : 0);
            result = 31 * result + (this.timestream != null ? this.timestream.hashCode() : 0);
            return result;
        }
    }
}
