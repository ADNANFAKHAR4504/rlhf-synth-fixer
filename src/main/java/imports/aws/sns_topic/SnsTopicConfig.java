package imports.aws.sns_topic;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.476Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.snsTopic.SnsTopicConfig")
@software.amazon.jsii.Jsii.Proxy(SnsTopicConfig.Jsii$Proxy.class)
public interface SnsTopicConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#application_failure_feedback_role_arn SnsTopic#application_failure_feedback_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getApplicationFailureFeedbackRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#application_success_feedback_role_arn SnsTopic#application_success_feedback_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getApplicationSuccessFeedbackRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#application_success_feedback_sample_rate SnsTopic#application_success_feedback_sample_rate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getApplicationSuccessFeedbackSampleRate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#archive_policy SnsTopic#archive_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getArchivePolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#content_based_deduplication SnsTopic#content_based_deduplication}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getContentBasedDeduplication() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#delivery_policy SnsTopic#delivery_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeliveryPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#display_name SnsTopic#display_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDisplayName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#fifo_throughput_scope SnsTopic#fifo_throughput_scope}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFifoThroughputScope() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#fifo_topic SnsTopic#fifo_topic}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFifoTopic() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#firehose_failure_feedback_role_arn SnsTopic#firehose_failure_feedback_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFirehoseFailureFeedbackRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#firehose_success_feedback_role_arn SnsTopic#firehose_success_feedback_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFirehoseSuccessFeedbackRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#firehose_success_feedback_sample_rate SnsTopic#firehose_success_feedback_sample_rate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getFirehoseSuccessFeedbackSampleRate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#http_failure_feedback_role_arn SnsTopic#http_failure_feedback_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHttpFailureFeedbackRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#http_success_feedback_role_arn SnsTopic#http_success_feedback_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHttpSuccessFeedbackRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#http_success_feedback_sample_rate SnsTopic#http_success_feedback_sample_rate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getHttpSuccessFeedbackSampleRate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#id SnsTopic#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#kms_master_key_id SnsTopic#kms_master_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsMasterKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#lambda_failure_feedback_role_arn SnsTopic#lambda_failure_feedback_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLambdaFailureFeedbackRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#lambda_success_feedback_role_arn SnsTopic#lambda_success_feedback_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLambdaSuccessFeedbackRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#lambda_success_feedback_sample_rate SnsTopic#lambda_success_feedback_sample_rate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getLambdaSuccessFeedbackSampleRate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#name SnsTopic#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#name_prefix SnsTopic#name_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamePrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#policy SnsTopic#policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#signature_version SnsTopic#signature_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSignatureVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#sqs_failure_feedback_role_arn SnsTopic#sqs_failure_feedback_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSqsFailureFeedbackRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#sqs_success_feedback_role_arn SnsTopic#sqs_success_feedback_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSqsSuccessFeedbackRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#sqs_success_feedback_sample_rate SnsTopic#sqs_success_feedback_sample_rate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSqsSuccessFeedbackSampleRate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#tags SnsTopic#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#tags_all SnsTopic#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#tracing_config SnsTopic#tracing_config}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTracingConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SnsTopicConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SnsTopicConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SnsTopicConfig> {
        java.lang.String applicationFailureFeedbackRoleArn;
        java.lang.String applicationSuccessFeedbackRoleArn;
        java.lang.Number applicationSuccessFeedbackSampleRate;
        java.lang.String archivePolicy;
        java.lang.Object contentBasedDeduplication;
        java.lang.String deliveryPolicy;
        java.lang.String displayName;
        java.lang.String fifoThroughputScope;
        java.lang.Object fifoTopic;
        java.lang.String firehoseFailureFeedbackRoleArn;
        java.lang.String firehoseSuccessFeedbackRoleArn;
        java.lang.Number firehoseSuccessFeedbackSampleRate;
        java.lang.String httpFailureFeedbackRoleArn;
        java.lang.String httpSuccessFeedbackRoleArn;
        java.lang.Number httpSuccessFeedbackSampleRate;
        java.lang.String id;
        java.lang.String kmsMasterKeyId;
        java.lang.String lambdaFailureFeedbackRoleArn;
        java.lang.String lambdaSuccessFeedbackRoleArn;
        java.lang.Number lambdaSuccessFeedbackSampleRate;
        java.lang.String name;
        java.lang.String namePrefix;
        java.lang.String policy;
        java.lang.Number signatureVersion;
        java.lang.String sqsFailureFeedbackRoleArn;
        java.lang.String sqsSuccessFeedbackRoleArn;
        java.lang.Number sqsSuccessFeedbackSampleRate;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String tracingConfig;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SnsTopicConfig#getApplicationFailureFeedbackRoleArn}
         * @param applicationFailureFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#application_failure_feedback_role_arn SnsTopic#application_failure_feedback_role_arn}.
         * @return {@code this}
         */
        public Builder applicationFailureFeedbackRoleArn(java.lang.String applicationFailureFeedbackRoleArn) {
            this.applicationFailureFeedbackRoleArn = applicationFailureFeedbackRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getApplicationSuccessFeedbackRoleArn}
         * @param applicationSuccessFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#application_success_feedback_role_arn SnsTopic#application_success_feedback_role_arn}.
         * @return {@code this}
         */
        public Builder applicationSuccessFeedbackRoleArn(java.lang.String applicationSuccessFeedbackRoleArn) {
            this.applicationSuccessFeedbackRoleArn = applicationSuccessFeedbackRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getApplicationSuccessFeedbackSampleRate}
         * @param applicationSuccessFeedbackSampleRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#application_success_feedback_sample_rate SnsTopic#application_success_feedback_sample_rate}.
         * @return {@code this}
         */
        public Builder applicationSuccessFeedbackSampleRate(java.lang.Number applicationSuccessFeedbackSampleRate) {
            this.applicationSuccessFeedbackSampleRate = applicationSuccessFeedbackSampleRate;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getArchivePolicy}
         * @param archivePolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#archive_policy SnsTopic#archive_policy}.
         * @return {@code this}
         */
        public Builder archivePolicy(java.lang.String archivePolicy) {
            this.archivePolicy = archivePolicy;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getContentBasedDeduplication}
         * @param contentBasedDeduplication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#content_based_deduplication SnsTopic#content_based_deduplication}.
         * @return {@code this}
         */
        public Builder contentBasedDeduplication(java.lang.Boolean contentBasedDeduplication) {
            this.contentBasedDeduplication = contentBasedDeduplication;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getContentBasedDeduplication}
         * @param contentBasedDeduplication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#content_based_deduplication SnsTopic#content_based_deduplication}.
         * @return {@code this}
         */
        public Builder contentBasedDeduplication(com.hashicorp.cdktf.IResolvable contentBasedDeduplication) {
            this.contentBasedDeduplication = contentBasedDeduplication;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getDeliveryPolicy}
         * @param deliveryPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#delivery_policy SnsTopic#delivery_policy}.
         * @return {@code this}
         */
        public Builder deliveryPolicy(java.lang.String deliveryPolicy) {
            this.deliveryPolicy = deliveryPolicy;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getDisplayName}
         * @param displayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#display_name SnsTopic#display_name}.
         * @return {@code this}
         */
        public Builder displayName(java.lang.String displayName) {
            this.displayName = displayName;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getFifoThroughputScope}
         * @param fifoThroughputScope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#fifo_throughput_scope SnsTopic#fifo_throughput_scope}.
         * @return {@code this}
         */
        public Builder fifoThroughputScope(java.lang.String fifoThroughputScope) {
            this.fifoThroughputScope = fifoThroughputScope;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getFifoTopic}
         * @param fifoTopic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#fifo_topic SnsTopic#fifo_topic}.
         * @return {@code this}
         */
        public Builder fifoTopic(java.lang.Boolean fifoTopic) {
            this.fifoTopic = fifoTopic;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getFifoTopic}
         * @param fifoTopic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#fifo_topic SnsTopic#fifo_topic}.
         * @return {@code this}
         */
        public Builder fifoTopic(com.hashicorp.cdktf.IResolvable fifoTopic) {
            this.fifoTopic = fifoTopic;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getFirehoseFailureFeedbackRoleArn}
         * @param firehoseFailureFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#firehose_failure_feedback_role_arn SnsTopic#firehose_failure_feedback_role_arn}.
         * @return {@code this}
         */
        public Builder firehoseFailureFeedbackRoleArn(java.lang.String firehoseFailureFeedbackRoleArn) {
            this.firehoseFailureFeedbackRoleArn = firehoseFailureFeedbackRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getFirehoseSuccessFeedbackRoleArn}
         * @param firehoseSuccessFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#firehose_success_feedback_role_arn SnsTopic#firehose_success_feedback_role_arn}.
         * @return {@code this}
         */
        public Builder firehoseSuccessFeedbackRoleArn(java.lang.String firehoseSuccessFeedbackRoleArn) {
            this.firehoseSuccessFeedbackRoleArn = firehoseSuccessFeedbackRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getFirehoseSuccessFeedbackSampleRate}
         * @param firehoseSuccessFeedbackSampleRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#firehose_success_feedback_sample_rate SnsTopic#firehose_success_feedback_sample_rate}.
         * @return {@code this}
         */
        public Builder firehoseSuccessFeedbackSampleRate(java.lang.Number firehoseSuccessFeedbackSampleRate) {
            this.firehoseSuccessFeedbackSampleRate = firehoseSuccessFeedbackSampleRate;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getHttpFailureFeedbackRoleArn}
         * @param httpFailureFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#http_failure_feedback_role_arn SnsTopic#http_failure_feedback_role_arn}.
         * @return {@code this}
         */
        public Builder httpFailureFeedbackRoleArn(java.lang.String httpFailureFeedbackRoleArn) {
            this.httpFailureFeedbackRoleArn = httpFailureFeedbackRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getHttpSuccessFeedbackRoleArn}
         * @param httpSuccessFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#http_success_feedback_role_arn SnsTopic#http_success_feedback_role_arn}.
         * @return {@code this}
         */
        public Builder httpSuccessFeedbackRoleArn(java.lang.String httpSuccessFeedbackRoleArn) {
            this.httpSuccessFeedbackRoleArn = httpSuccessFeedbackRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getHttpSuccessFeedbackSampleRate}
         * @param httpSuccessFeedbackSampleRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#http_success_feedback_sample_rate SnsTopic#http_success_feedback_sample_rate}.
         * @return {@code this}
         */
        public Builder httpSuccessFeedbackSampleRate(java.lang.Number httpSuccessFeedbackSampleRate) {
            this.httpSuccessFeedbackSampleRate = httpSuccessFeedbackSampleRate;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#id SnsTopic#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getKmsMasterKeyId}
         * @param kmsMasterKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#kms_master_key_id SnsTopic#kms_master_key_id}.
         * @return {@code this}
         */
        public Builder kmsMasterKeyId(java.lang.String kmsMasterKeyId) {
            this.kmsMasterKeyId = kmsMasterKeyId;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getLambdaFailureFeedbackRoleArn}
         * @param lambdaFailureFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#lambda_failure_feedback_role_arn SnsTopic#lambda_failure_feedback_role_arn}.
         * @return {@code this}
         */
        public Builder lambdaFailureFeedbackRoleArn(java.lang.String lambdaFailureFeedbackRoleArn) {
            this.lambdaFailureFeedbackRoleArn = lambdaFailureFeedbackRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getLambdaSuccessFeedbackRoleArn}
         * @param lambdaSuccessFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#lambda_success_feedback_role_arn SnsTopic#lambda_success_feedback_role_arn}.
         * @return {@code this}
         */
        public Builder lambdaSuccessFeedbackRoleArn(java.lang.String lambdaSuccessFeedbackRoleArn) {
            this.lambdaSuccessFeedbackRoleArn = lambdaSuccessFeedbackRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getLambdaSuccessFeedbackSampleRate}
         * @param lambdaSuccessFeedbackSampleRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#lambda_success_feedback_sample_rate SnsTopic#lambda_success_feedback_sample_rate}.
         * @return {@code this}
         */
        public Builder lambdaSuccessFeedbackSampleRate(java.lang.Number lambdaSuccessFeedbackSampleRate) {
            this.lambdaSuccessFeedbackSampleRate = lambdaSuccessFeedbackSampleRate;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#name SnsTopic#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getNamePrefix}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#name_prefix SnsTopic#name_prefix}.
         * @return {@code this}
         */
        public Builder namePrefix(java.lang.String namePrefix) {
            this.namePrefix = namePrefix;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getPolicy}
         * @param policy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#policy SnsTopic#policy}.
         * @return {@code this}
         */
        public Builder policy(java.lang.String policy) {
            this.policy = policy;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getSignatureVersion}
         * @param signatureVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#signature_version SnsTopic#signature_version}.
         * @return {@code this}
         */
        public Builder signatureVersion(java.lang.Number signatureVersion) {
            this.signatureVersion = signatureVersion;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getSqsFailureFeedbackRoleArn}
         * @param sqsFailureFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#sqs_failure_feedback_role_arn SnsTopic#sqs_failure_feedback_role_arn}.
         * @return {@code this}
         */
        public Builder sqsFailureFeedbackRoleArn(java.lang.String sqsFailureFeedbackRoleArn) {
            this.sqsFailureFeedbackRoleArn = sqsFailureFeedbackRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getSqsSuccessFeedbackRoleArn}
         * @param sqsSuccessFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#sqs_success_feedback_role_arn SnsTopic#sqs_success_feedback_role_arn}.
         * @return {@code this}
         */
        public Builder sqsSuccessFeedbackRoleArn(java.lang.String sqsSuccessFeedbackRoleArn) {
            this.sqsSuccessFeedbackRoleArn = sqsSuccessFeedbackRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getSqsSuccessFeedbackSampleRate}
         * @param sqsSuccessFeedbackSampleRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#sqs_success_feedback_sample_rate SnsTopic#sqs_success_feedback_sample_rate}.
         * @return {@code this}
         */
        public Builder sqsSuccessFeedbackSampleRate(java.lang.Number sqsSuccessFeedbackSampleRate) {
            this.sqsSuccessFeedbackSampleRate = sqsSuccessFeedbackSampleRate;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#tags SnsTopic#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#tags_all SnsTopic#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getTracingConfig}
         * @param tracingConfig Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#tracing_config SnsTopic#tracing_config}.
         * @return {@code this}
         */
        public Builder tracingConfig(java.lang.String tracingConfig) {
            this.tracingConfig = tracingConfig;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getDependsOn}
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
         * Sets the value of {@link SnsTopicConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SnsTopicConfig#getProvisioners}
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
         * @return a new instance of {@link SnsTopicConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SnsTopicConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SnsTopicConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SnsTopicConfig {
        private final java.lang.String applicationFailureFeedbackRoleArn;
        private final java.lang.String applicationSuccessFeedbackRoleArn;
        private final java.lang.Number applicationSuccessFeedbackSampleRate;
        private final java.lang.String archivePolicy;
        private final java.lang.Object contentBasedDeduplication;
        private final java.lang.String deliveryPolicy;
        private final java.lang.String displayName;
        private final java.lang.String fifoThroughputScope;
        private final java.lang.Object fifoTopic;
        private final java.lang.String firehoseFailureFeedbackRoleArn;
        private final java.lang.String firehoseSuccessFeedbackRoleArn;
        private final java.lang.Number firehoseSuccessFeedbackSampleRate;
        private final java.lang.String httpFailureFeedbackRoleArn;
        private final java.lang.String httpSuccessFeedbackRoleArn;
        private final java.lang.Number httpSuccessFeedbackSampleRate;
        private final java.lang.String id;
        private final java.lang.String kmsMasterKeyId;
        private final java.lang.String lambdaFailureFeedbackRoleArn;
        private final java.lang.String lambdaSuccessFeedbackRoleArn;
        private final java.lang.Number lambdaSuccessFeedbackSampleRate;
        private final java.lang.String name;
        private final java.lang.String namePrefix;
        private final java.lang.String policy;
        private final java.lang.Number signatureVersion;
        private final java.lang.String sqsFailureFeedbackRoleArn;
        private final java.lang.String sqsSuccessFeedbackRoleArn;
        private final java.lang.Number sqsSuccessFeedbackSampleRate;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String tracingConfig;
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
            this.applicationFailureFeedbackRoleArn = software.amazon.jsii.Kernel.get(this, "applicationFailureFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.applicationSuccessFeedbackRoleArn = software.amazon.jsii.Kernel.get(this, "applicationSuccessFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.applicationSuccessFeedbackSampleRate = software.amazon.jsii.Kernel.get(this, "applicationSuccessFeedbackSampleRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.archivePolicy = software.amazon.jsii.Kernel.get(this, "archivePolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contentBasedDeduplication = software.amazon.jsii.Kernel.get(this, "contentBasedDeduplication", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.deliveryPolicy = software.amazon.jsii.Kernel.get(this, "deliveryPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.displayName = software.amazon.jsii.Kernel.get(this, "displayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fifoThroughputScope = software.amazon.jsii.Kernel.get(this, "fifoThroughputScope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fifoTopic = software.amazon.jsii.Kernel.get(this, "fifoTopic", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.firehoseFailureFeedbackRoleArn = software.amazon.jsii.Kernel.get(this, "firehoseFailureFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.firehoseSuccessFeedbackRoleArn = software.amazon.jsii.Kernel.get(this, "firehoseSuccessFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.firehoseSuccessFeedbackSampleRate = software.amazon.jsii.Kernel.get(this, "firehoseSuccessFeedbackSampleRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.httpFailureFeedbackRoleArn = software.amazon.jsii.Kernel.get(this, "httpFailureFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.httpSuccessFeedbackRoleArn = software.amazon.jsii.Kernel.get(this, "httpSuccessFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.httpSuccessFeedbackSampleRate = software.amazon.jsii.Kernel.get(this, "httpSuccessFeedbackSampleRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsMasterKeyId = software.amazon.jsii.Kernel.get(this, "kmsMasterKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lambdaFailureFeedbackRoleArn = software.amazon.jsii.Kernel.get(this, "lambdaFailureFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lambdaSuccessFeedbackRoleArn = software.amazon.jsii.Kernel.get(this, "lambdaSuccessFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lambdaSuccessFeedbackSampleRate = software.amazon.jsii.Kernel.get(this, "lambdaSuccessFeedbackSampleRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namePrefix = software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.policy = software.amazon.jsii.Kernel.get(this, "policy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.signatureVersion = software.amazon.jsii.Kernel.get(this, "signatureVersion", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.sqsFailureFeedbackRoleArn = software.amazon.jsii.Kernel.get(this, "sqsFailureFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sqsSuccessFeedbackRoleArn = software.amazon.jsii.Kernel.get(this, "sqsSuccessFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sqsSuccessFeedbackSampleRate = software.amazon.jsii.Kernel.get(this, "sqsSuccessFeedbackSampleRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tracingConfig = software.amazon.jsii.Kernel.get(this, "tracingConfig", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.applicationFailureFeedbackRoleArn = builder.applicationFailureFeedbackRoleArn;
            this.applicationSuccessFeedbackRoleArn = builder.applicationSuccessFeedbackRoleArn;
            this.applicationSuccessFeedbackSampleRate = builder.applicationSuccessFeedbackSampleRate;
            this.archivePolicy = builder.archivePolicy;
            this.contentBasedDeduplication = builder.contentBasedDeduplication;
            this.deliveryPolicy = builder.deliveryPolicy;
            this.displayName = builder.displayName;
            this.fifoThroughputScope = builder.fifoThroughputScope;
            this.fifoTopic = builder.fifoTopic;
            this.firehoseFailureFeedbackRoleArn = builder.firehoseFailureFeedbackRoleArn;
            this.firehoseSuccessFeedbackRoleArn = builder.firehoseSuccessFeedbackRoleArn;
            this.firehoseSuccessFeedbackSampleRate = builder.firehoseSuccessFeedbackSampleRate;
            this.httpFailureFeedbackRoleArn = builder.httpFailureFeedbackRoleArn;
            this.httpSuccessFeedbackRoleArn = builder.httpSuccessFeedbackRoleArn;
            this.httpSuccessFeedbackSampleRate = builder.httpSuccessFeedbackSampleRate;
            this.id = builder.id;
            this.kmsMasterKeyId = builder.kmsMasterKeyId;
            this.lambdaFailureFeedbackRoleArn = builder.lambdaFailureFeedbackRoleArn;
            this.lambdaSuccessFeedbackRoleArn = builder.lambdaSuccessFeedbackRoleArn;
            this.lambdaSuccessFeedbackSampleRate = builder.lambdaSuccessFeedbackSampleRate;
            this.name = builder.name;
            this.namePrefix = builder.namePrefix;
            this.policy = builder.policy;
            this.signatureVersion = builder.signatureVersion;
            this.sqsFailureFeedbackRoleArn = builder.sqsFailureFeedbackRoleArn;
            this.sqsSuccessFeedbackRoleArn = builder.sqsSuccessFeedbackRoleArn;
            this.sqsSuccessFeedbackSampleRate = builder.sqsSuccessFeedbackSampleRate;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.tracingConfig = builder.tracingConfig;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getApplicationFailureFeedbackRoleArn() {
            return this.applicationFailureFeedbackRoleArn;
        }

        @Override
        public final java.lang.String getApplicationSuccessFeedbackRoleArn() {
            return this.applicationSuccessFeedbackRoleArn;
        }

        @Override
        public final java.lang.Number getApplicationSuccessFeedbackSampleRate() {
            return this.applicationSuccessFeedbackSampleRate;
        }

        @Override
        public final java.lang.String getArchivePolicy() {
            return this.archivePolicy;
        }

        @Override
        public final java.lang.Object getContentBasedDeduplication() {
            return this.contentBasedDeduplication;
        }

        @Override
        public final java.lang.String getDeliveryPolicy() {
            return this.deliveryPolicy;
        }

        @Override
        public final java.lang.String getDisplayName() {
            return this.displayName;
        }

        @Override
        public final java.lang.String getFifoThroughputScope() {
            return this.fifoThroughputScope;
        }

        @Override
        public final java.lang.Object getFifoTopic() {
            return this.fifoTopic;
        }

        @Override
        public final java.lang.String getFirehoseFailureFeedbackRoleArn() {
            return this.firehoseFailureFeedbackRoleArn;
        }

        @Override
        public final java.lang.String getFirehoseSuccessFeedbackRoleArn() {
            return this.firehoseSuccessFeedbackRoleArn;
        }

        @Override
        public final java.lang.Number getFirehoseSuccessFeedbackSampleRate() {
            return this.firehoseSuccessFeedbackSampleRate;
        }

        @Override
        public final java.lang.String getHttpFailureFeedbackRoleArn() {
            return this.httpFailureFeedbackRoleArn;
        }

        @Override
        public final java.lang.String getHttpSuccessFeedbackRoleArn() {
            return this.httpSuccessFeedbackRoleArn;
        }

        @Override
        public final java.lang.Number getHttpSuccessFeedbackSampleRate() {
            return this.httpSuccessFeedbackSampleRate;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getKmsMasterKeyId() {
            return this.kmsMasterKeyId;
        }

        @Override
        public final java.lang.String getLambdaFailureFeedbackRoleArn() {
            return this.lambdaFailureFeedbackRoleArn;
        }

        @Override
        public final java.lang.String getLambdaSuccessFeedbackRoleArn() {
            return this.lambdaSuccessFeedbackRoleArn;
        }

        @Override
        public final java.lang.Number getLambdaSuccessFeedbackSampleRate() {
            return this.lambdaSuccessFeedbackSampleRate;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getNamePrefix() {
            return this.namePrefix;
        }

        @Override
        public final java.lang.String getPolicy() {
            return this.policy;
        }

        @Override
        public final java.lang.Number getSignatureVersion() {
            return this.signatureVersion;
        }

        @Override
        public final java.lang.String getSqsFailureFeedbackRoleArn() {
            return this.sqsFailureFeedbackRoleArn;
        }

        @Override
        public final java.lang.String getSqsSuccessFeedbackRoleArn() {
            return this.sqsSuccessFeedbackRoleArn;
        }

        @Override
        public final java.lang.Number getSqsSuccessFeedbackSampleRate() {
            return this.sqsSuccessFeedbackSampleRate;
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
        public final java.lang.String getTracingConfig() {
            return this.tracingConfig;
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

            if (this.getApplicationFailureFeedbackRoleArn() != null) {
                data.set("applicationFailureFeedbackRoleArn", om.valueToTree(this.getApplicationFailureFeedbackRoleArn()));
            }
            if (this.getApplicationSuccessFeedbackRoleArn() != null) {
                data.set("applicationSuccessFeedbackRoleArn", om.valueToTree(this.getApplicationSuccessFeedbackRoleArn()));
            }
            if (this.getApplicationSuccessFeedbackSampleRate() != null) {
                data.set("applicationSuccessFeedbackSampleRate", om.valueToTree(this.getApplicationSuccessFeedbackSampleRate()));
            }
            if (this.getArchivePolicy() != null) {
                data.set("archivePolicy", om.valueToTree(this.getArchivePolicy()));
            }
            if (this.getContentBasedDeduplication() != null) {
                data.set("contentBasedDeduplication", om.valueToTree(this.getContentBasedDeduplication()));
            }
            if (this.getDeliveryPolicy() != null) {
                data.set("deliveryPolicy", om.valueToTree(this.getDeliveryPolicy()));
            }
            if (this.getDisplayName() != null) {
                data.set("displayName", om.valueToTree(this.getDisplayName()));
            }
            if (this.getFifoThroughputScope() != null) {
                data.set("fifoThroughputScope", om.valueToTree(this.getFifoThroughputScope()));
            }
            if (this.getFifoTopic() != null) {
                data.set("fifoTopic", om.valueToTree(this.getFifoTopic()));
            }
            if (this.getFirehoseFailureFeedbackRoleArn() != null) {
                data.set("firehoseFailureFeedbackRoleArn", om.valueToTree(this.getFirehoseFailureFeedbackRoleArn()));
            }
            if (this.getFirehoseSuccessFeedbackRoleArn() != null) {
                data.set("firehoseSuccessFeedbackRoleArn", om.valueToTree(this.getFirehoseSuccessFeedbackRoleArn()));
            }
            if (this.getFirehoseSuccessFeedbackSampleRate() != null) {
                data.set("firehoseSuccessFeedbackSampleRate", om.valueToTree(this.getFirehoseSuccessFeedbackSampleRate()));
            }
            if (this.getHttpFailureFeedbackRoleArn() != null) {
                data.set("httpFailureFeedbackRoleArn", om.valueToTree(this.getHttpFailureFeedbackRoleArn()));
            }
            if (this.getHttpSuccessFeedbackRoleArn() != null) {
                data.set("httpSuccessFeedbackRoleArn", om.valueToTree(this.getHttpSuccessFeedbackRoleArn()));
            }
            if (this.getHttpSuccessFeedbackSampleRate() != null) {
                data.set("httpSuccessFeedbackSampleRate", om.valueToTree(this.getHttpSuccessFeedbackSampleRate()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsMasterKeyId() != null) {
                data.set("kmsMasterKeyId", om.valueToTree(this.getKmsMasterKeyId()));
            }
            if (this.getLambdaFailureFeedbackRoleArn() != null) {
                data.set("lambdaFailureFeedbackRoleArn", om.valueToTree(this.getLambdaFailureFeedbackRoleArn()));
            }
            if (this.getLambdaSuccessFeedbackRoleArn() != null) {
                data.set("lambdaSuccessFeedbackRoleArn", om.valueToTree(this.getLambdaSuccessFeedbackRoleArn()));
            }
            if (this.getLambdaSuccessFeedbackSampleRate() != null) {
                data.set("lambdaSuccessFeedbackSampleRate", om.valueToTree(this.getLambdaSuccessFeedbackSampleRate()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getNamePrefix() != null) {
                data.set("namePrefix", om.valueToTree(this.getNamePrefix()));
            }
            if (this.getPolicy() != null) {
                data.set("policy", om.valueToTree(this.getPolicy()));
            }
            if (this.getSignatureVersion() != null) {
                data.set("signatureVersion", om.valueToTree(this.getSignatureVersion()));
            }
            if (this.getSqsFailureFeedbackRoleArn() != null) {
                data.set("sqsFailureFeedbackRoleArn", om.valueToTree(this.getSqsFailureFeedbackRoleArn()));
            }
            if (this.getSqsSuccessFeedbackRoleArn() != null) {
                data.set("sqsSuccessFeedbackRoleArn", om.valueToTree(this.getSqsSuccessFeedbackRoleArn()));
            }
            if (this.getSqsSuccessFeedbackSampleRate() != null) {
                data.set("sqsSuccessFeedbackSampleRate", om.valueToTree(this.getSqsSuccessFeedbackSampleRate()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTracingConfig() != null) {
                data.set("tracingConfig", om.valueToTree(this.getTracingConfig()));
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
            struct.set("fqn", om.valueToTree("aws.snsTopic.SnsTopicConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SnsTopicConfig.Jsii$Proxy that = (SnsTopicConfig.Jsii$Proxy) o;

            if (this.applicationFailureFeedbackRoleArn != null ? !this.applicationFailureFeedbackRoleArn.equals(that.applicationFailureFeedbackRoleArn) : that.applicationFailureFeedbackRoleArn != null) return false;
            if (this.applicationSuccessFeedbackRoleArn != null ? !this.applicationSuccessFeedbackRoleArn.equals(that.applicationSuccessFeedbackRoleArn) : that.applicationSuccessFeedbackRoleArn != null) return false;
            if (this.applicationSuccessFeedbackSampleRate != null ? !this.applicationSuccessFeedbackSampleRate.equals(that.applicationSuccessFeedbackSampleRate) : that.applicationSuccessFeedbackSampleRate != null) return false;
            if (this.archivePolicy != null ? !this.archivePolicy.equals(that.archivePolicy) : that.archivePolicy != null) return false;
            if (this.contentBasedDeduplication != null ? !this.contentBasedDeduplication.equals(that.contentBasedDeduplication) : that.contentBasedDeduplication != null) return false;
            if (this.deliveryPolicy != null ? !this.deliveryPolicy.equals(that.deliveryPolicy) : that.deliveryPolicy != null) return false;
            if (this.displayName != null ? !this.displayName.equals(that.displayName) : that.displayName != null) return false;
            if (this.fifoThroughputScope != null ? !this.fifoThroughputScope.equals(that.fifoThroughputScope) : that.fifoThroughputScope != null) return false;
            if (this.fifoTopic != null ? !this.fifoTopic.equals(that.fifoTopic) : that.fifoTopic != null) return false;
            if (this.firehoseFailureFeedbackRoleArn != null ? !this.firehoseFailureFeedbackRoleArn.equals(that.firehoseFailureFeedbackRoleArn) : that.firehoseFailureFeedbackRoleArn != null) return false;
            if (this.firehoseSuccessFeedbackRoleArn != null ? !this.firehoseSuccessFeedbackRoleArn.equals(that.firehoseSuccessFeedbackRoleArn) : that.firehoseSuccessFeedbackRoleArn != null) return false;
            if (this.firehoseSuccessFeedbackSampleRate != null ? !this.firehoseSuccessFeedbackSampleRate.equals(that.firehoseSuccessFeedbackSampleRate) : that.firehoseSuccessFeedbackSampleRate != null) return false;
            if (this.httpFailureFeedbackRoleArn != null ? !this.httpFailureFeedbackRoleArn.equals(that.httpFailureFeedbackRoleArn) : that.httpFailureFeedbackRoleArn != null) return false;
            if (this.httpSuccessFeedbackRoleArn != null ? !this.httpSuccessFeedbackRoleArn.equals(that.httpSuccessFeedbackRoleArn) : that.httpSuccessFeedbackRoleArn != null) return false;
            if (this.httpSuccessFeedbackSampleRate != null ? !this.httpSuccessFeedbackSampleRate.equals(that.httpSuccessFeedbackSampleRate) : that.httpSuccessFeedbackSampleRate != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsMasterKeyId != null ? !this.kmsMasterKeyId.equals(that.kmsMasterKeyId) : that.kmsMasterKeyId != null) return false;
            if (this.lambdaFailureFeedbackRoleArn != null ? !this.lambdaFailureFeedbackRoleArn.equals(that.lambdaFailureFeedbackRoleArn) : that.lambdaFailureFeedbackRoleArn != null) return false;
            if (this.lambdaSuccessFeedbackRoleArn != null ? !this.lambdaSuccessFeedbackRoleArn.equals(that.lambdaSuccessFeedbackRoleArn) : that.lambdaSuccessFeedbackRoleArn != null) return false;
            if (this.lambdaSuccessFeedbackSampleRate != null ? !this.lambdaSuccessFeedbackSampleRate.equals(that.lambdaSuccessFeedbackSampleRate) : that.lambdaSuccessFeedbackSampleRate != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.namePrefix != null ? !this.namePrefix.equals(that.namePrefix) : that.namePrefix != null) return false;
            if (this.policy != null ? !this.policy.equals(that.policy) : that.policy != null) return false;
            if (this.signatureVersion != null ? !this.signatureVersion.equals(that.signatureVersion) : that.signatureVersion != null) return false;
            if (this.sqsFailureFeedbackRoleArn != null ? !this.sqsFailureFeedbackRoleArn.equals(that.sqsFailureFeedbackRoleArn) : that.sqsFailureFeedbackRoleArn != null) return false;
            if (this.sqsSuccessFeedbackRoleArn != null ? !this.sqsSuccessFeedbackRoleArn.equals(that.sqsSuccessFeedbackRoleArn) : that.sqsSuccessFeedbackRoleArn != null) return false;
            if (this.sqsSuccessFeedbackSampleRate != null ? !this.sqsSuccessFeedbackSampleRate.equals(that.sqsSuccessFeedbackSampleRate) : that.sqsSuccessFeedbackSampleRate != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.tracingConfig != null ? !this.tracingConfig.equals(that.tracingConfig) : that.tracingConfig != null) return false;
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
            int result = this.applicationFailureFeedbackRoleArn != null ? this.applicationFailureFeedbackRoleArn.hashCode() : 0;
            result = 31 * result + (this.applicationSuccessFeedbackRoleArn != null ? this.applicationSuccessFeedbackRoleArn.hashCode() : 0);
            result = 31 * result + (this.applicationSuccessFeedbackSampleRate != null ? this.applicationSuccessFeedbackSampleRate.hashCode() : 0);
            result = 31 * result + (this.archivePolicy != null ? this.archivePolicy.hashCode() : 0);
            result = 31 * result + (this.contentBasedDeduplication != null ? this.contentBasedDeduplication.hashCode() : 0);
            result = 31 * result + (this.deliveryPolicy != null ? this.deliveryPolicy.hashCode() : 0);
            result = 31 * result + (this.displayName != null ? this.displayName.hashCode() : 0);
            result = 31 * result + (this.fifoThroughputScope != null ? this.fifoThroughputScope.hashCode() : 0);
            result = 31 * result + (this.fifoTopic != null ? this.fifoTopic.hashCode() : 0);
            result = 31 * result + (this.firehoseFailureFeedbackRoleArn != null ? this.firehoseFailureFeedbackRoleArn.hashCode() : 0);
            result = 31 * result + (this.firehoseSuccessFeedbackRoleArn != null ? this.firehoseSuccessFeedbackRoleArn.hashCode() : 0);
            result = 31 * result + (this.firehoseSuccessFeedbackSampleRate != null ? this.firehoseSuccessFeedbackSampleRate.hashCode() : 0);
            result = 31 * result + (this.httpFailureFeedbackRoleArn != null ? this.httpFailureFeedbackRoleArn.hashCode() : 0);
            result = 31 * result + (this.httpSuccessFeedbackRoleArn != null ? this.httpSuccessFeedbackRoleArn.hashCode() : 0);
            result = 31 * result + (this.httpSuccessFeedbackSampleRate != null ? this.httpSuccessFeedbackSampleRate.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsMasterKeyId != null ? this.kmsMasterKeyId.hashCode() : 0);
            result = 31 * result + (this.lambdaFailureFeedbackRoleArn != null ? this.lambdaFailureFeedbackRoleArn.hashCode() : 0);
            result = 31 * result + (this.lambdaSuccessFeedbackRoleArn != null ? this.lambdaSuccessFeedbackRoleArn.hashCode() : 0);
            result = 31 * result + (this.lambdaSuccessFeedbackSampleRate != null ? this.lambdaSuccessFeedbackSampleRate.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.namePrefix != null ? this.namePrefix.hashCode() : 0);
            result = 31 * result + (this.policy != null ? this.policy.hashCode() : 0);
            result = 31 * result + (this.signatureVersion != null ? this.signatureVersion.hashCode() : 0);
            result = 31 * result + (this.sqsFailureFeedbackRoleArn != null ? this.sqsFailureFeedbackRoleArn.hashCode() : 0);
            result = 31 * result + (this.sqsSuccessFeedbackRoleArn != null ? this.sqsSuccessFeedbackRoleArn.hashCode() : 0);
            result = 31 * result + (this.sqsSuccessFeedbackSampleRate != null ? this.sqsSuccessFeedbackSampleRate.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.tracingConfig != null ? this.tracingConfig.hashCode() : 0);
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
