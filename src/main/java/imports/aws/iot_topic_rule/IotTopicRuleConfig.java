package imports.aws.iot_topic_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.413Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotTopicRule.IotTopicRuleConfig")
@software.amazon.jsii.Jsii.Proxy(IotTopicRuleConfig.Jsii$Proxy.class)
public interface IotTopicRuleConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#enabled IotTopicRule#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#name IotTopicRule#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sql IotTopicRule#sql}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSql();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sql_version IotTopicRule#sql_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSqlVersion();

    /**
     * cloudwatch_alarm block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_alarm IotTopicRule#cloudwatch_alarm}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCloudwatchAlarm() {
        return null;
    }

    /**
     * cloudwatch_logs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_logs IotTopicRule#cloudwatch_logs}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCloudwatchLogs() {
        return null;
    }

    /**
     * cloudwatch_metric block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_metric IotTopicRule#cloudwatch_metric}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCloudwatchMetric() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#description IotTopicRule#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * dynamodb block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#dynamodb IotTopicRule#dynamodb}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDynamodb() {
        return null;
    }

    /**
     * dynamodbv2 block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#dynamodbv2 IotTopicRule#dynamodbv2}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDynamodbv2() {
        return null;
    }

    /**
     * elasticsearch block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#elasticsearch IotTopicRule#elasticsearch}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getElasticsearch() {
        return null;
    }

    /**
     * error_action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#error_action IotTopicRule#error_action}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.iot_topic_rule.IotTopicRuleErrorAction getErrorAction() {
        return null;
    }

    /**
     * firehose block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#firehose IotTopicRule#firehose}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFirehose() {
        return null;
    }

    /**
     * http block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#http IotTopicRule#http}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHttp() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#id IotTopicRule#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * iot_analytics block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#iot_analytics IotTopicRule#iot_analytics}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIotAnalytics() {
        return null;
    }

    /**
     * iot_events block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#iot_events IotTopicRule#iot_events}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIotEvents() {
        return null;
    }

    /**
     * kafka block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#kafka IotTopicRule#kafka}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getKafka() {
        return null;
    }

    /**
     * kinesis block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#kinesis IotTopicRule#kinesis}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getKinesis() {
        return null;
    }

    /**
     * lambda block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#lambda IotTopicRule#lambda}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLambda() {
        return null;
    }

    /**
     * republish block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#republish IotTopicRule#republish}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRepublish() {
        return null;
    }

    /**
     * s3 block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#s3 IotTopicRule#s3}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getS3() {
        return null;
    }

    /**
     * sns block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sns IotTopicRule#sns}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSns() {
        return null;
    }

    /**
     * sqs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sqs IotTopicRule#sqs}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSqs() {
        return null;
    }

    /**
     * step_functions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#step_functions IotTopicRule#step_functions}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStepFunctions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#tags IotTopicRule#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#tags_all IotTopicRule#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timestream block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#timestream IotTopicRule#timestream}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTimestream() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IotTopicRuleConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IotTopicRuleConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IotTopicRuleConfig> {
        java.lang.Object enabled;
        java.lang.String name;
        java.lang.String sql;
        java.lang.String sqlVersion;
        java.lang.Object cloudwatchAlarm;
        java.lang.Object cloudwatchLogs;
        java.lang.Object cloudwatchMetric;
        java.lang.String description;
        java.lang.Object dynamodb;
        java.lang.Object dynamodbv2;
        java.lang.Object elasticsearch;
        imports.aws.iot_topic_rule.IotTopicRuleErrorAction errorAction;
        java.lang.Object firehose;
        java.lang.Object http;
        java.lang.String id;
        java.lang.Object iotAnalytics;
        java.lang.Object iotEvents;
        java.lang.Object kafka;
        java.lang.Object kinesis;
        java.lang.Object lambda;
        java.lang.Object republish;
        java.lang.Object s3;
        java.lang.Object sns;
        java.lang.Object sqs;
        java.lang.Object stepFunctions;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object timestream;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link IotTopicRuleConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#enabled IotTopicRule#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#enabled IotTopicRule#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#name IotTopicRule#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getSql}
         * @param sql Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sql IotTopicRule#sql}. This parameter is required.
         * @return {@code this}
         */
        public Builder sql(java.lang.String sql) {
            this.sql = sql;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getSqlVersion}
         * @param sqlVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sql_version IotTopicRule#sql_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder sqlVersion(java.lang.String sqlVersion) {
            this.sqlVersion = sqlVersion;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getCloudwatchAlarm}
         * @param cloudwatchAlarm cloudwatch_alarm block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_alarm IotTopicRule#cloudwatch_alarm}
         * @return {@code this}
         */
        public Builder cloudwatchAlarm(com.hashicorp.cdktf.IResolvable cloudwatchAlarm) {
            this.cloudwatchAlarm = cloudwatchAlarm;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getCloudwatchAlarm}
         * @param cloudwatchAlarm cloudwatch_alarm block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_alarm IotTopicRule#cloudwatch_alarm}
         * @return {@code this}
         */
        public Builder cloudwatchAlarm(java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleCloudwatchAlarm> cloudwatchAlarm) {
            this.cloudwatchAlarm = cloudwatchAlarm;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getCloudwatchLogs}
         * @param cloudwatchLogs cloudwatch_logs block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_logs IotTopicRule#cloudwatch_logs}
         * @return {@code this}
         */
        public Builder cloudwatchLogs(com.hashicorp.cdktf.IResolvable cloudwatchLogs) {
            this.cloudwatchLogs = cloudwatchLogs;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getCloudwatchLogs}
         * @param cloudwatchLogs cloudwatch_logs block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_logs IotTopicRule#cloudwatch_logs}
         * @return {@code this}
         */
        public Builder cloudwatchLogs(java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleCloudwatchLogs> cloudwatchLogs) {
            this.cloudwatchLogs = cloudwatchLogs;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getCloudwatchMetric}
         * @param cloudwatchMetric cloudwatch_metric block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_metric IotTopicRule#cloudwatch_metric}
         * @return {@code this}
         */
        public Builder cloudwatchMetric(com.hashicorp.cdktf.IResolvable cloudwatchMetric) {
            this.cloudwatchMetric = cloudwatchMetric;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getCloudwatchMetric}
         * @param cloudwatchMetric cloudwatch_metric block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#cloudwatch_metric IotTopicRule#cloudwatch_metric}
         * @return {@code this}
         */
        public Builder cloudwatchMetric(java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleCloudwatchMetric> cloudwatchMetric) {
            this.cloudwatchMetric = cloudwatchMetric;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#description IotTopicRule#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getDynamodb}
         * @param dynamodb dynamodb block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#dynamodb IotTopicRule#dynamodb}
         * @return {@code this}
         */
        public Builder dynamodb(com.hashicorp.cdktf.IResolvable dynamodb) {
            this.dynamodb = dynamodb;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getDynamodb}
         * @param dynamodb dynamodb block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#dynamodb IotTopicRule#dynamodb}
         * @return {@code this}
         */
        public Builder dynamodb(java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleDynamodb> dynamodb) {
            this.dynamodb = dynamodb;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getDynamodbv2}
         * @param dynamodbv2 dynamodbv2 block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#dynamodbv2 IotTopicRule#dynamodbv2}
         * @return {@code this}
         */
        public Builder dynamodbv2(com.hashicorp.cdktf.IResolvable dynamodbv2) {
            this.dynamodbv2 = dynamodbv2;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getDynamodbv2}
         * @param dynamodbv2 dynamodbv2 block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#dynamodbv2 IotTopicRule#dynamodbv2}
         * @return {@code this}
         */
        public Builder dynamodbv2(java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleDynamodbv2> dynamodbv2) {
            this.dynamodbv2 = dynamodbv2;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getElasticsearch}
         * @param elasticsearch elasticsearch block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#elasticsearch IotTopicRule#elasticsearch}
         * @return {@code this}
         */
        public Builder elasticsearch(com.hashicorp.cdktf.IResolvable elasticsearch) {
            this.elasticsearch = elasticsearch;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getElasticsearch}
         * @param elasticsearch elasticsearch block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#elasticsearch IotTopicRule#elasticsearch}
         * @return {@code this}
         */
        public Builder elasticsearch(java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleElasticsearch> elasticsearch) {
            this.elasticsearch = elasticsearch;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getErrorAction}
         * @param errorAction error_action block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#error_action IotTopicRule#error_action}
         * @return {@code this}
         */
        public Builder errorAction(imports.aws.iot_topic_rule.IotTopicRuleErrorAction errorAction) {
            this.errorAction = errorAction;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getFirehose}
         * @param firehose firehose block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#firehose IotTopicRule#firehose}
         * @return {@code this}
         */
        public Builder firehose(com.hashicorp.cdktf.IResolvable firehose) {
            this.firehose = firehose;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getFirehose}
         * @param firehose firehose block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#firehose IotTopicRule#firehose}
         * @return {@code this}
         */
        public Builder firehose(java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleFirehose> firehose) {
            this.firehose = firehose;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getHttp}
         * @param http http block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#http IotTopicRule#http}
         * @return {@code this}
         */
        public Builder http(com.hashicorp.cdktf.IResolvable http) {
            this.http = http;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getHttp}
         * @param http http block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#http IotTopicRule#http}
         * @return {@code this}
         */
        public Builder http(java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleHttp> http) {
            this.http = http;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#id IotTopicRule#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getIotAnalytics}
         * @param iotAnalytics iot_analytics block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#iot_analytics IotTopicRule#iot_analytics}
         * @return {@code this}
         */
        public Builder iotAnalytics(com.hashicorp.cdktf.IResolvable iotAnalytics) {
            this.iotAnalytics = iotAnalytics;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getIotAnalytics}
         * @param iotAnalytics iot_analytics block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#iot_analytics IotTopicRule#iot_analytics}
         * @return {@code this}
         */
        public Builder iotAnalytics(java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleIotAnalytics> iotAnalytics) {
            this.iotAnalytics = iotAnalytics;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getIotEvents}
         * @param iotEvents iot_events block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#iot_events IotTopicRule#iot_events}
         * @return {@code this}
         */
        public Builder iotEvents(com.hashicorp.cdktf.IResolvable iotEvents) {
            this.iotEvents = iotEvents;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getIotEvents}
         * @param iotEvents iot_events block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#iot_events IotTopicRule#iot_events}
         * @return {@code this}
         */
        public Builder iotEvents(java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleIotEvents> iotEvents) {
            this.iotEvents = iotEvents;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getKafka}
         * @param kafka kafka block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#kafka IotTopicRule#kafka}
         * @return {@code this}
         */
        public Builder kafka(com.hashicorp.cdktf.IResolvable kafka) {
            this.kafka = kafka;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getKafka}
         * @param kafka kafka block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#kafka IotTopicRule#kafka}
         * @return {@code this}
         */
        public Builder kafka(java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleKafka> kafka) {
            this.kafka = kafka;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getKinesis}
         * @param kinesis kinesis block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#kinesis IotTopicRule#kinesis}
         * @return {@code this}
         */
        public Builder kinesis(com.hashicorp.cdktf.IResolvable kinesis) {
            this.kinesis = kinesis;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getKinesis}
         * @param kinesis kinesis block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#kinesis IotTopicRule#kinesis}
         * @return {@code this}
         */
        public Builder kinesis(java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleKinesis> kinesis) {
            this.kinesis = kinesis;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getLambda}
         * @param lambda lambda block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#lambda IotTopicRule#lambda}
         * @return {@code this}
         */
        public Builder lambda(com.hashicorp.cdktf.IResolvable lambda) {
            this.lambda = lambda;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getLambda}
         * @param lambda lambda block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#lambda IotTopicRule#lambda}
         * @return {@code this}
         */
        public Builder lambda(java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleLambda> lambda) {
            this.lambda = lambda;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getRepublish}
         * @param republish republish block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#republish IotTopicRule#republish}
         * @return {@code this}
         */
        public Builder republish(com.hashicorp.cdktf.IResolvable republish) {
            this.republish = republish;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getRepublish}
         * @param republish republish block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#republish IotTopicRule#republish}
         * @return {@code this}
         */
        public Builder republish(java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleRepublish> republish) {
            this.republish = republish;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getS3}
         * @param s3 s3 block.
         *           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#s3 IotTopicRule#s3}
         * @return {@code this}
         */
        public Builder s3(com.hashicorp.cdktf.IResolvable s3) {
            this.s3 = s3;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getS3}
         * @param s3 s3 block.
         *           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#s3 IotTopicRule#s3}
         * @return {@code this}
         */
        public Builder s3(java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleS3> s3) {
            this.s3 = s3;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getSns}
         * @param sns sns block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sns IotTopicRule#sns}
         * @return {@code this}
         */
        public Builder sns(com.hashicorp.cdktf.IResolvable sns) {
            this.sns = sns;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getSns}
         * @param sns sns block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sns IotTopicRule#sns}
         * @return {@code this}
         */
        public Builder sns(java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleSns> sns) {
            this.sns = sns;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getSqs}
         * @param sqs sqs block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sqs IotTopicRule#sqs}
         * @return {@code this}
         */
        public Builder sqs(com.hashicorp.cdktf.IResolvable sqs) {
            this.sqs = sqs;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getSqs}
         * @param sqs sqs block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#sqs IotTopicRule#sqs}
         * @return {@code this}
         */
        public Builder sqs(java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleSqs> sqs) {
            this.sqs = sqs;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getStepFunctions}
         * @param stepFunctions step_functions block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#step_functions IotTopicRule#step_functions}
         * @return {@code this}
         */
        public Builder stepFunctions(com.hashicorp.cdktf.IResolvable stepFunctions) {
            this.stepFunctions = stepFunctions;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getStepFunctions}
         * @param stepFunctions step_functions block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#step_functions IotTopicRule#step_functions}
         * @return {@code this}
         */
        public Builder stepFunctions(java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleStepFunctions> stepFunctions) {
            this.stepFunctions = stepFunctions;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#tags IotTopicRule#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#tags_all IotTopicRule#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getTimestream}
         * @param timestream timestream block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#timestream IotTopicRule#timestream}
         * @return {@code this}
         */
        public Builder timestream(com.hashicorp.cdktf.IResolvable timestream) {
            this.timestream = timestream;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getTimestream}
         * @param timestream timestream block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#timestream IotTopicRule#timestream}
         * @return {@code this}
         */
        public Builder timestream(java.util.List<? extends imports.aws.iot_topic_rule.IotTopicRuleTimestream> timestream) {
            this.timestream = timestream;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IotTopicRuleConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IotTopicRuleConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IotTopicRuleConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IotTopicRuleConfig {
        private final java.lang.Object enabled;
        private final java.lang.String name;
        private final java.lang.String sql;
        private final java.lang.String sqlVersion;
        private final java.lang.Object cloudwatchAlarm;
        private final java.lang.Object cloudwatchLogs;
        private final java.lang.Object cloudwatchMetric;
        private final java.lang.String description;
        private final java.lang.Object dynamodb;
        private final java.lang.Object dynamodbv2;
        private final java.lang.Object elasticsearch;
        private final imports.aws.iot_topic_rule.IotTopicRuleErrorAction errorAction;
        private final java.lang.Object firehose;
        private final java.lang.Object http;
        private final java.lang.String id;
        private final java.lang.Object iotAnalytics;
        private final java.lang.Object iotEvents;
        private final java.lang.Object kafka;
        private final java.lang.Object kinesis;
        private final java.lang.Object lambda;
        private final java.lang.Object republish;
        private final java.lang.Object s3;
        private final java.lang.Object sns;
        private final java.lang.Object sqs;
        private final java.lang.Object stepFunctions;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Object timestream;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sql = software.amazon.jsii.Kernel.get(this, "sql", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sqlVersion = software.amazon.jsii.Kernel.get(this, "sqlVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cloudwatchAlarm = software.amazon.jsii.Kernel.get(this, "cloudwatchAlarm", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.cloudwatchLogs = software.amazon.jsii.Kernel.get(this, "cloudwatchLogs", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.cloudwatchMetric = software.amazon.jsii.Kernel.get(this, "cloudwatchMetric", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dynamodb = software.amazon.jsii.Kernel.get(this, "dynamodb", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dynamodbv2 = software.amazon.jsii.Kernel.get(this, "dynamodbv2", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.elasticsearch = software.amazon.jsii.Kernel.get(this, "elasticsearch", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.errorAction = software.amazon.jsii.Kernel.get(this, "errorAction", software.amazon.jsii.NativeType.forClass(imports.aws.iot_topic_rule.IotTopicRuleErrorAction.class));
            this.firehose = software.amazon.jsii.Kernel.get(this, "firehose", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.http = software.amazon.jsii.Kernel.get(this, "http", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iotAnalytics = software.amazon.jsii.Kernel.get(this, "iotAnalytics", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.iotEvents = software.amazon.jsii.Kernel.get(this, "iotEvents", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.kafka = software.amazon.jsii.Kernel.get(this, "kafka", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.kinesis = software.amazon.jsii.Kernel.get(this, "kinesis", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.lambda = software.amazon.jsii.Kernel.get(this, "lambda", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.republish = software.amazon.jsii.Kernel.get(this, "republish", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.s3 = software.amazon.jsii.Kernel.get(this, "s3", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sns = software.amazon.jsii.Kernel.get(this, "sns", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sqs = software.amazon.jsii.Kernel.get(this, "sqs", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.stepFunctions = software.amazon.jsii.Kernel.get(this, "stepFunctions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timestream = software.amazon.jsii.Kernel.get(this, "timestream", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.sql = java.util.Objects.requireNonNull(builder.sql, "sql is required");
            this.sqlVersion = java.util.Objects.requireNonNull(builder.sqlVersion, "sqlVersion is required");
            this.cloudwatchAlarm = builder.cloudwatchAlarm;
            this.cloudwatchLogs = builder.cloudwatchLogs;
            this.cloudwatchMetric = builder.cloudwatchMetric;
            this.description = builder.description;
            this.dynamodb = builder.dynamodb;
            this.dynamodbv2 = builder.dynamodbv2;
            this.elasticsearch = builder.elasticsearch;
            this.errorAction = builder.errorAction;
            this.firehose = builder.firehose;
            this.http = builder.http;
            this.id = builder.id;
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
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timestream = builder.timestream;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getSql() {
            return this.sql;
        }

        @Override
        public final java.lang.String getSqlVersion() {
            return this.sqlVersion;
        }

        @Override
        public final java.lang.Object getCloudwatchAlarm() {
            return this.cloudwatchAlarm;
        }

        @Override
        public final java.lang.Object getCloudwatchLogs() {
            return this.cloudwatchLogs;
        }

        @Override
        public final java.lang.Object getCloudwatchMetric() {
            return this.cloudwatchMetric;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getDynamodb() {
            return this.dynamodb;
        }

        @Override
        public final java.lang.Object getDynamodbv2() {
            return this.dynamodbv2;
        }

        @Override
        public final java.lang.Object getElasticsearch() {
            return this.elasticsearch;
        }

        @Override
        public final imports.aws.iot_topic_rule.IotTopicRuleErrorAction getErrorAction() {
            return this.errorAction;
        }

        @Override
        public final java.lang.Object getFirehose() {
            return this.firehose;
        }

        @Override
        public final java.lang.Object getHttp() {
            return this.http;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getIotAnalytics() {
            return this.iotAnalytics;
        }

        @Override
        public final java.lang.Object getIotEvents() {
            return this.iotEvents;
        }

        @Override
        public final java.lang.Object getKafka() {
            return this.kafka;
        }

        @Override
        public final java.lang.Object getKinesis() {
            return this.kinesis;
        }

        @Override
        public final java.lang.Object getLambda() {
            return this.lambda;
        }

        @Override
        public final java.lang.Object getRepublish() {
            return this.republish;
        }

        @Override
        public final java.lang.Object getS3() {
            return this.s3;
        }

        @Override
        public final java.lang.Object getSns() {
            return this.sns;
        }

        @Override
        public final java.lang.Object getSqs() {
            return this.sqs;
        }

        @Override
        public final java.lang.Object getStepFunctions() {
            return this.stepFunctions;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final java.lang.Object getTimestream() {
            return this.timestream;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("enabled", om.valueToTree(this.getEnabled()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("sql", om.valueToTree(this.getSql()));
            data.set("sqlVersion", om.valueToTree(this.getSqlVersion()));
            if (this.getCloudwatchAlarm() != null) {
                data.set("cloudwatchAlarm", om.valueToTree(this.getCloudwatchAlarm()));
            }
            if (this.getCloudwatchLogs() != null) {
                data.set("cloudwatchLogs", om.valueToTree(this.getCloudwatchLogs()));
            }
            if (this.getCloudwatchMetric() != null) {
                data.set("cloudwatchMetric", om.valueToTree(this.getCloudwatchMetric()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
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
            if (this.getErrorAction() != null) {
                data.set("errorAction", om.valueToTree(this.getErrorAction()));
            }
            if (this.getFirehose() != null) {
                data.set("firehose", om.valueToTree(this.getFirehose()));
            }
            if (this.getHttp() != null) {
                data.set("http", om.valueToTree(this.getHttp()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
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
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimestream() != null) {
                data.set("timestream", om.valueToTree(this.getTimestream()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.iotTopicRule.IotTopicRuleConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IotTopicRuleConfig.Jsii$Proxy that = (IotTopicRuleConfig.Jsii$Proxy) o;

            if (!enabled.equals(that.enabled)) return false;
            if (!name.equals(that.name)) return false;
            if (!sql.equals(that.sql)) return false;
            if (!sqlVersion.equals(that.sqlVersion)) return false;
            if (this.cloudwatchAlarm != null ? !this.cloudwatchAlarm.equals(that.cloudwatchAlarm) : that.cloudwatchAlarm != null) return false;
            if (this.cloudwatchLogs != null ? !this.cloudwatchLogs.equals(that.cloudwatchLogs) : that.cloudwatchLogs != null) return false;
            if (this.cloudwatchMetric != null ? !this.cloudwatchMetric.equals(that.cloudwatchMetric) : that.cloudwatchMetric != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.dynamodb != null ? !this.dynamodb.equals(that.dynamodb) : that.dynamodb != null) return false;
            if (this.dynamodbv2 != null ? !this.dynamodbv2.equals(that.dynamodbv2) : that.dynamodbv2 != null) return false;
            if (this.elasticsearch != null ? !this.elasticsearch.equals(that.elasticsearch) : that.elasticsearch != null) return false;
            if (this.errorAction != null ? !this.errorAction.equals(that.errorAction) : that.errorAction != null) return false;
            if (this.firehose != null ? !this.firehose.equals(that.firehose) : that.firehose != null) return false;
            if (this.http != null ? !this.http.equals(that.http) : that.http != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
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
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timestream != null ? !this.timestream.equals(that.timestream) : that.timestream != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.sql.hashCode());
            result = 31 * result + (this.sqlVersion.hashCode());
            result = 31 * result + (this.cloudwatchAlarm != null ? this.cloudwatchAlarm.hashCode() : 0);
            result = 31 * result + (this.cloudwatchLogs != null ? this.cloudwatchLogs.hashCode() : 0);
            result = 31 * result + (this.cloudwatchMetric != null ? this.cloudwatchMetric.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.dynamodb != null ? this.dynamodb.hashCode() : 0);
            result = 31 * result + (this.dynamodbv2 != null ? this.dynamodbv2.hashCode() : 0);
            result = 31 * result + (this.elasticsearch != null ? this.elasticsearch.hashCode() : 0);
            result = 31 * result + (this.errorAction != null ? this.errorAction.hashCode() : 0);
            result = 31 * result + (this.firehose != null ? this.firehose.hashCode() : 0);
            result = 31 * result + (this.http != null ? this.http.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
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
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timestream != null ? this.timestream.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
