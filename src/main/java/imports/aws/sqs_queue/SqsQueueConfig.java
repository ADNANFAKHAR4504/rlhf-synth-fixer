package imports.aws.sqs_queue;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.493Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sqsQueue.SqsQueueConfig")
@software.amazon.jsii.Jsii.Proxy(SqsQueueConfig.Jsii$Proxy.class)
public interface SqsQueueConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#content_based_deduplication SqsQueue#content_based_deduplication}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getContentBasedDeduplication() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#deduplication_scope SqsQueue#deduplication_scope}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeduplicationScope() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#delay_seconds SqsQueue#delay_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDelaySeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#fifo_queue SqsQueue#fifo_queue}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFifoQueue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#fifo_throughput_limit SqsQueue#fifo_throughput_limit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFifoThroughputLimit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#id SqsQueue#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#kms_data_key_reuse_period_seconds SqsQueue#kms_data_key_reuse_period_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getKmsDataKeyReusePeriodSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#kms_master_key_id SqsQueue#kms_master_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsMasterKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#max_message_size SqsQueue#max_message_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxMessageSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#message_retention_seconds SqsQueue#message_retention_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMessageRetentionSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#name SqsQueue#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#name_prefix SqsQueue#name_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamePrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#policy SqsQueue#policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#receive_wait_time_seconds SqsQueue#receive_wait_time_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getReceiveWaitTimeSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#redrive_allow_policy SqsQueue#redrive_allow_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRedriveAllowPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#redrive_policy SqsQueue#redrive_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRedrivePolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#sqs_managed_sse_enabled SqsQueue#sqs_managed_sse_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSqsManagedSseEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#tags SqsQueue#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#tags_all SqsQueue#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#timeouts SqsQueue#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sqs_queue.SqsQueueTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#visibility_timeout_seconds SqsQueue#visibility_timeout_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getVisibilityTimeoutSeconds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SqsQueueConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SqsQueueConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SqsQueueConfig> {
        java.lang.Object contentBasedDeduplication;
        java.lang.String deduplicationScope;
        java.lang.Number delaySeconds;
        java.lang.Object fifoQueue;
        java.lang.String fifoThroughputLimit;
        java.lang.String id;
        java.lang.Number kmsDataKeyReusePeriodSeconds;
        java.lang.String kmsMasterKeyId;
        java.lang.Number maxMessageSize;
        java.lang.Number messageRetentionSeconds;
        java.lang.String name;
        java.lang.String namePrefix;
        java.lang.String policy;
        java.lang.Number receiveWaitTimeSeconds;
        java.lang.String redriveAllowPolicy;
        java.lang.String redrivePolicy;
        java.lang.Object sqsManagedSseEnabled;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.sqs_queue.SqsQueueTimeouts timeouts;
        java.lang.Number visibilityTimeoutSeconds;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SqsQueueConfig#getContentBasedDeduplication}
         * @param contentBasedDeduplication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#content_based_deduplication SqsQueue#content_based_deduplication}.
         * @return {@code this}
         */
        public Builder contentBasedDeduplication(java.lang.Boolean contentBasedDeduplication) {
            this.contentBasedDeduplication = contentBasedDeduplication;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getContentBasedDeduplication}
         * @param contentBasedDeduplication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#content_based_deduplication SqsQueue#content_based_deduplication}.
         * @return {@code this}
         */
        public Builder contentBasedDeduplication(com.hashicorp.cdktf.IResolvable contentBasedDeduplication) {
            this.contentBasedDeduplication = contentBasedDeduplication;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getDeduplicationScope}
         * @param deduplicationScope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#deduplication_scope SqsQueue#deduplication_scope}.
         * @return {@code this}
         */
        public Builder deduplicationScope(java.lang.String deduplicationScope) {
            this.deduplicationScope = deduplicationScope;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getDelaySeconds}
         * @param delaySeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#delay_seconds SqsQueue#delay_seconds}.
         * @return {@code this}
         */
        public Builder delaySeconds(java.lang.Number delaySeconds) {
            this.delaySeconds = delaySeconds;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getFifoQueue}
         * @param fifoQueue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#fifo_queue SqsQueue#fifo_queue}.
         * @return {@code this}
         */
        public Builder fifoQueue(java.lang.Boolean fifoQueue) {
            this.fifoQueue = fifoQueue;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getFifoQueue}
         * @param fifoQueue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#fifo_queue SqsQueue#fifo_queue}.
         * @return {@code this}
         */
        public Builder fifoQueue(com.hashicorp.cdktf.IResolvable fifoQueue) {
            this.fifoQueue = fifoQueue;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getFifoThroughputLimit}
         * @param fifoThroughputLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#fifo_throughput_limit SqsQueue#fifo_throughput_limit}.
         * @return {@code this}
         */
        public Builder fifoThroughputLimit(java.lang.String fifoThroughputLimit) {
            this.fifoThroughputLimit = fifoThroughputLimit;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#id SqsQueue#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getKmsDataKeyReusePeriodSeconds}
         * @param kmsDataKeyReusePeriodSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#kms_data_key_reuse_period_seconds SqsQueue#kms_data_key_reuse_period_seconds}.
         * @return {@code this}
         */
        public Builder kmsDataKeyReusePeriodSeconds(java.lang.Number kmsDataKeyReusePeriodSeconds) {
            this.kmsDataKeyReusePeriodSeconds = kmsDataKeyReusePeriodSeconds;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getKmsMasterKeyId}
         * @param kmsMasterKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#kms_master_key_id SqsQueue#kms_master_key_id}.
         * @return {@code this}
         */
        public Builder kmsMasterKeyId(java.lang.String kmsMasterKeyId) {
            this.kmsMasterKeyId = kmsMasterKeyId;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getMaxMessageSize}
         * @param maxMessageSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#max_message_size SqsQueue#max_message_size}.
         * @return {@code this}
         */
        public Builder maxMessageSize(java.lang.Number maxMessageSize) {
            this.maxMessageSize = maxMessageSize;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getMessageRetentionSeconds}
         * @param messageRetentionSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#message_retention_seconds SqsQueue#message_retention_seconds}.
         * @return {@code this}
         */
        public Builder messageRetentionSeconds(java.lang.Number messageRetentionSeconds) {
            this.messageRetentionSeconds = messageRetentionSeconds;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#name SqsQueue#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getNamePrefix}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#name_prefix SqsQueue#name_prefix}.
         * @return {@code this}
         */
        public Builder namePrefix(java.lang.String namePrefix) {
            this.namePrefix = namePrefix;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getPolicy}
         * @param policy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#policy SqsQueue#policy}.
         * @return {@code this}
         */
        public Builder policy(java.lang.String policy) {
            this.policy = policy;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getReceiveWaitTimeSeconds}
         * @param receiveWaitTimeSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#receive_wait_time_seconds SqsQueue#receive_wait_time_seconds}.
         * @return {@code this}
         */
        public Builder receiveWaitTimeSeconds(java.lang.Number receiveWaitTimeSeconds) {
            this.receiveWaitTimeSeconds = receiveWaitTimeSeconds;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getRedriveAllowPolicy}
         * @param redriveAllowPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#redrive_allow_policy SqsQueue#redrive_allow_policy}.
         * @return {@code this}
         */
        public Builder redriveAllowPolicy(java.lang.String redriveAllowPolicy) {
            this.redriveAllowPolicy = redriveAllowPolicy;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getRedrivePolicy}
         * @param redrivePolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#redrive_policy SqsQueue#redrive_policy}.
         * @return {@code this}
         */
        public Builder redrivePolicy(java.lang.String redrivePolicy) {
            this.redrivePolicy = redrivePolicy;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getSqsManagedSseEnabled}
         * @param sqsManagedSseEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#sqs_managed_sse_enabled SqsQueue#sqs_managed_sse_enabled}.
         * @return {@code this}
         */
        public Builder sqsManagedSseEnabled(java.lang.Boolean sqsManagedSseEnabled) {
            this.sqsManagedSseEnabled = sqsManagedSseEnabled;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getSqsManagedSseEnabled}
         * @param sqsManagedSseEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#sqs_managed_sse_enabled SqsQueue#sqs_managed_sse_enabled}.
         * @return {@code this}
         */
        public Builder sqsManagedSseEnabled(com.hashicorp.cdktf.IResolvable sqsManagedSseEnabled) {
            this.sqsManagedSseEnabled = sqsManagedSseEnabled;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#tags SqsQueue#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#tags_all SqsQueue#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#timeouts SqsQueue#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.sqs_queue.SqsQueueTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getVisibilityTimeoutSeconds}
         * @param visibilityTimeoutSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#visibility_timeout_seconds SqsQueue#visibility_timeout_seconds}.
         * @return {@code this}
         */
        public Builder visibilityTimeoutSeconds(java.lang.Number visibilityTimeoutSeconds) {
            this.visibilityTimeoutSeconds = visibilityTimeoutSeconds;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getDependsOn}
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
         * Sets the value of {@link SqsQueueConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SqsQueueConfig#getProvisioners}
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
         * @return a new instance of {@link SqsQueueConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SqsQueueConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SqsQueueConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SqsQueueConfig {
        private final java.lang.Object contentBasedDeduplication;
        private final java.lang.String deduplicationScope;
        private final java.lang.Number delaySeconds;
        private final java.lang.Object fifoQueue;
        private final java.lang.String fifoThroughputLimit;
        private final java.lang.String id;
        private final java.lang.Number kmsDataKeyReusePeriodSeconds;
        private final java.lang.String kmsMasterKeyId;
        private final java.lang.Number maxMessageSize;
        private final java.lang.Number messageRetentionSeconds;
        private final java.lang.String name;
        private final java.lang.String namePrefix;
        private final java.lang.String policy;
        private final java.lang.Number receiveWaitTimeSeconds;
        private final java.lang.String redriveAllowPolicy;
        private final java.lang.String redrivePolicy;
        private final java.lang.Object sqsManagedSseEnabled;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.sqs_queue.SqsQueueTimeouts timeouts;
        private final java.lang.Number visibilityTimeoutSeconds;
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
            this.contentBasedDeduplication = software.amazon.jsii.Kernel.get(this, "contentBasedDeduplication", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.deduplicationScope = software.amazon.jsii.Kernel.get(this, "deduplicationScope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.delaySeconds = software.amazon.jsii.Kernel.get(this, "delaySeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.fifoQueue = software.amazon.jsii.Kernel.get(this, "fifoQueue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.fifoThroughputLimit = software.amazon.jsii.Kernel.get(this, "fifoThroughputLimit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsDataKeyReusePeriodSeconds = software.amazon.jsii.Kernel.get(this, "kmsDataKeyReusePeriodSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.kmsMasterKeyId = software.amazon.jsii.Kernel.get(this, "kmsMasterKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxMessageSize = software.amazon.jsii.Kernel.get(this, "maxMessageSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.messageRetentionSeconds = software.amazon.jsii.Kernel.get(this, "messageRetentionSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namePrefix = software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.policy = software.amazon.jsii.Kernel.get(this, "policy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.receiveWaitTimeSeconds = software.amazon.jsii.Kernel.get(this, "receiveWaitTimeSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.redriveAllowPolicy = software.amazon.jsii.Kernel.get(this, "redriveAllowPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.redrivePolicy = software.amazon.jsii.Kernel.get(this, "redrivePolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sqsManagedSseEnabled = software.amazon.jsii.Kernel.get(this, "sqsManagedSseEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.sqs_queue.SqsQueueTimeouts.class));
            this.visibilityTimeoutSeconds = software.amazon.jsii.Kernel.get(this, "visibilityTimeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
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
            this.contentBasedDeduplication = builder.contentBasedDeduplication;
            this.deduplicationScope = builder.deduplicationScope;
            this.delaySeconds = builder.delaySeconds;
            this.fifoQueue = builder.fifoQueue;
            this.fifoThroughputLimit = builder.fifoThroughputLimit;
            this.id = builder.id;
            this.kmsDataKeyReusePeriodSeconds = builder.kmsDataKeyReusePeriodSeconds;
            this.kmsMasterKeyId = builder.kmsMasterKeyId;
            this.maxMessageSize = builder.maxMessageSize;
            this.messageRetentionSeconds = builder.messageRetentionSeconds;
            this.name = builder.name;
            this.namePrefix = builder.namePrefix;
            this.policy = builder.policy;
            this.receiveWaitTimeSeconds = builder.receiveWaitTimeSeconds;
            this.redriveAllowPolicy = builder.redriveAllowPolicy;
            this.redrivePolicy = builder.redrivePolicy;
            this.sqsManagedSseEnabled = builder.sqsManagedSseEnabled;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.visibilityTimeoutSeconds = builder.visibilityTimeoutSeconds;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Object getContentBasedDeduplication() {
            return this.contentBasedDeduplication;
        }

        @Override
        public final java.lang.String getDeduplicationScope() {
            return this.deduplicationScope;
        }

        @Override
        public final java.lang.Number getDelaySeconds() {
            return this.delaySeconds;
        }

        @Override
        public final java.lang.Object getFifoQueue() {
            return this.fifoQueue;
        }

        @Override
        public final java.lang.String getFifoThroughputLimit() {
            return this.fifoThroughputLimit;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getKmsDataKeyReusePeriodSeconds() {
            return this.kmsDataKeyReusePeriodSeconds;
        }

        @Override
        public final java.lang.String getKmsMasterKeyId() {
            return this.kmsMasterKeyId;
        }

        @Override
        public final java.lang.Number getMaxMessageSize() {
            return this.maxMessageSize;
        }

        @Override
        public final java.lang.Number getMessageRetentionSeconds() {
            return this.messageRetentionSeconds;
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
        public final java.lang.Number getReceiveWaitTimeSeconds() {
            return this.receiveWaitTimeSeconds;
        }

        @Override
        public final java.lang.String getRedriveAllowPolicy() {
            return this.redriveAllowPolicy;
        }

        @Override
        public final java.lang.String getRedrivePolicy() {
            return this.redrivePolicy;
        }

        @Override
        public final java.lang.Object getSqsManagedSseEnabled() {
            return this.sqsManagedSseEnabled;
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
        public final imports.aws.sqs_queue.SqsQueueTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Number getVisibilityTimeoutSeconds() {
            return this.visibilityTimeoutSeconds;
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

            if (this.getContentBasedDeduplication() != null) {
                data.set("contentBasedDeduplication", om.valueToTree(this.getContentBasedDeduplication()));
            }
            if (this.getDeduplicationScope() != null) {
                data.set("deduplicationScope", om.valueToTree(this.getDeduplicationScope()));
            }
            if (this.getDelaySeconds() != null) {
                data.set("delaySeconds", om.valueToTree(this.getDelaySeconds()));
            }
            if (this.getFifoQueue() != null) {
                data.set("fifoQueue", om.valueToTree(this.getFifoQueue()));
            }
            if (this.getFifoThroughputLimit() != null) {
                data.set("fifoThroughputLimit", om.valueToTree(this.getFifoThroughputLimit()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsDataKeyReusePeriodSeconds() != null) {
                data.set("kmsDataKeyReusePeriodSeconds", om.valueToTree(this.getKmsDataKeyReusePeriodSeconds()));
            }
            if (this.getKmsMasterKeyId() != null) {
                data.set("kmsMasterKeyId", om.valueToTree(this.getKmsMasterKeyId()));
            }
            if (this.getMaxMessageSize() != null) {
                data.set("maxMessageSize", om.valueToTree(this.getMaxMessageSize()));
            }
            if (this.getMessageRetentionSeconds() != null) {
                data.set("messageRetentionSeconds", om.valueToTree(this.getMessageRetentionSeconds()));
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
            if (this.getReceiveWaitTimeSeconds() != null) {
                data.set("receiveWaitTimeSeconds", om.valueToTree(this.getReceiveWaitTimeSeconds()));
            }
            if (this.getRedriveAllowPolicy() != null) {
                data.set("redriveAllowPolicy", om.valueToTree(this.getRedriveAllowPolicy()));
            }
            if (this.getRedrivePolicy() != null) {
                data.set("redrivePolicy", om.valueToTree(this.getRedrivePolicy()));
            }
            if (this.getSqsManagedSseEnabled() != null) {
                data.set("sqsManagedSseEnabled", om.valueToTree(this.getSqsManagedSseEnabled()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getVisibilityTimeoutSeconds() != null) {
                data.set("visibilityTimeoutSeconds", om.valueToTree(this.getVisibilityTimeoutSeconds()));
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
            struct.set("fqn", om.valueToTree("aws.sqsQueue.SqsQueueConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SqsQueueConfig.Jsii$Proxy that = (SqsQueueConfig.Jsii$Proxy) o;

            if (this.contentBasedDeduplication != null ? !this.contentBasedDeduplication.equals(that.contentBasedDeduplication) : that.contentBasedDeduplication != null) return false;
            if (this.deduplicationScope != null ? !this.deduplicationScope.equals(that.deduplicationScope) : that.deduplicationScope != null) return false;
            if (this.delaySeconds != null ? !this.delaySeconds.equals(that.delaySeconds) : that.delaySeconds != null) return false;
            if (this.fifoQueue != null ? !this.fifoQueue.equals(that.fifoQueue) : that.fifoQueue != null) return false;
            if (this.fifoThroughputLimit != null ? !this.fifoThroughputLimit.equals(that.fifoThroughputLimit) : that.fifoThroughputLimit != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsDataKeyReusePeriodSeconds != null ? !this.kmsDataKeyReusePeriodSeconds.equals(that.kmsDataKeyReusePeriodSeconds) : that.kmsDataKeyReusePeriodSeconds != null) return false;
            if (this.kmsMasterKeyId != null ? !this.kmsMasterKeyId.equals(that.kmsMasterKeyId) : that.kmsMasterKeyId != null) return false;
            if (this.maxMessageSize != null ? !this.maxMessageSize.equals(that.maxMessageSize) : that.maxMessageSize != null) return false;
            if (this.messageRetentionSeconds != null ? !this.messageRetentionSeconds.equals(that.messageRetentionSeconds) : that.messageRetentionSeconds != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.namePrefix != null ? !this.namePrefix.equals(that.namePrefix) : that.namePrefix != null) return false;
            if (this.policy != null ? !this.policy.equals(that.policy) : that.policy != null) return false;
            if (this.receiveWaitTimeSeconds != null ? !this.receiveWaitTimeSeconds.equals(that.receiveWaitTimeSeconds) : that.receiveWaitTimeSeconds != null) return false;
            if (this.redriveAllowPolicy != null ? !this.redriveAllowPolicy.equals(that.redriveAllowPolicy) : that.redriveAllowPolicy != null) return false;
            if (this.redrivePolicy != null ? !this.redrivePolicy.equals(that.redrivePolicy) : that.redrivePolicy != null) return false;
            if (this.sqsManagedSseEnabled != null ? !this.sqsManagedSseEnabled.equals(that.sqsManagedSseEnabled) : that.sqsManagedSseEnabled != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.visibilityTimeoutSeconds != null ? !this.visibilityTimeoutSeconds.equals(that.visibilityTimeoutSeconds) : that.visibilityTimeoutSeconds != null) return false;
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
            int result = this.contentBasedDeduplication != null ? this.contentBasedDeduplication.hashCode() : 0;
            result = 31 * result + (this.deduplicationScope != null ? this.deduplicationScope.hashCode() : 0);
            result = 31 * result + (this.delaySeconds != null ? this.delaySeconds.hashCode() : 0);
            result = 31 * result + (this.fifoQueue != null ? this.fifoQueue.hashCode() : 0);
            result = 31 * result + (this.fifoThroughputLimit != null ? this.fifoThroughputLimit.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsDataKeyReusePeriodSeconds != null ? this.kmsDataKeyReusePeriodSeconds.hashCode() : 0);
            result = 31 * result + (this.kmsMasterKeyId != null ? this.kmsMasterKeyId.hashCode() : 0);
            result = 31 * result + (this.maxMessageSize != null ? this.maxMessageSize.hashCode() : 0);
            result = 31 * result + (this.messageRetentionSeconds != null ? this.messageRetentionSeconds.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.namePrefix != null ? this.namePrefix.hashCode() : 0);
            result = 31 * result + (this.policy != null ? this.policy.hashCode() : 0);
            result = 31 * result + (this.receiveWaitTimeSeconds != null ? this.receiveWaitTimeSeconds.hashCode() : 0);
            result = 31 * result + (this.redriveAllowPolicy != null ? this.redriveAllowPolicy.hashCode() : 0);
            result = 31 * result + (this.redrivePolicy != null ? this.redrivePolicy.hashCode() : 0);
            result = 31 * result + (this.sqsManagedSseEnabled != null ? this.sqsManagedSseEnabled.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.visibilityTimeoutSeconds != null ? this.visibilityTimeoutSeconds.hashCode() : 0);
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
