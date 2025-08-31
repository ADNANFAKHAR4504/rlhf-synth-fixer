package imports.aws.cloudtrail;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.262Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudtrail.CloudtrailConfig")
@software.amazon.jsii.Jsii.Proxy(CloudtrailConfig.Jsii$Proxy.class)
public interface CloudtrailConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#name Cloudtrail#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#s3_bucket_name Cloudtrail#s3_bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3BucketName();

    /**
     * advanced_event_selector block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#advanced_event_selector Cloudtrail#advanced_event_selector}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAdvancedEventSelector() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#cloud_watch_logs_group_arn Cloudtrail#cloud_watch_logs_group_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCloudWatchLogsGroupArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#cloud_watch_logs_role_arn Cloudtrail#cloud_watch_logs_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCloudWatchLogsRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#enable_log_file_validation Cloudtrail#enable_log_file_validation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableLogFileValidation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#enable_logging Cloudtrail#enable_logging}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableLogging() {
        return null;
    }

    /**
     * event_selector block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#event_selector Cloudtrail#event_selector}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEventSelector() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#id Cloudtrail#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#include_global_service_events Cloudtrail#include_global_service_events}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeGlobalServiceEvents() {
        return null;
    }

    /**
     * insight_selector block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#insight_selector Cloudtrail#insight_selector}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInsightSelector() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#is_multi_region_trail Cloudtrail#is_multi_region_trail}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIsMultiRegionTrail() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#is_organization_trail Cloudtrail#is_organization_trail}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIsOrganizationTrail() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#kms_key_id Cloudtrail#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#s3_key_prefix Cloudtrail#s3_key_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3KeyPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#sns_topic_name Cloudtrail#sns_topic_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnsTopicName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#tags Cloudtrail#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#tags_all Cloudtrail#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudtrailConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudtrailConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudtrailConfig> {
        java.lang.String name;
        java.lang.String s3BucketName;
        java.lang.Object advancedEventSelector;
        java.lang.String cloudWatchLogsGroupArn;
        java.lang.String cloudWatchLogsRoleArn;
        java.lang.Object enableLogFileValidation;
        java.lang.Object enableLogging;
        java.lang.Object eventSelector;
        java.lang.String id;
        java.lang.Object includeGlobalServiceEvents;
        java.lang.Object insightSelector;
        java.lang.Object isMultiRegionTrail;
        java.lang.Object isOrganizationTrail;
        java.lang.String kmsKeyId;
        java.lang.String s3KeyPrefix;
        java.lang.String snsTopicName;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CloudtrailConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#name Cloudtrail#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getS3BucketName}
         * @param s3BucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#s3_bucket_name Cloudtrail#s3_bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3BucketName(java.lang.String s3BucketName) {
            this.s3BucketName = s3BucketName;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getAdvancedEventSelector}
         * @param advancedEventSelector advanced_event_selector block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#advanced_event_selector Cloudtrail#advanced_event_selector}
         * @return {@code this}
         */
        public Builder advancedEventSelector(com.hashicorp.cdktf.IResolvable advancedEventSelector) {
            this.advancedEventSelector = advancedEventSelector;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getAdvancedEventSelector}
         * @param advancedEventSelector advanced_event_selector block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#advanced_event_selector Cloudtrail#advanced_event_selector}
         * @return {@code this}
         */
        public Builder advancedEventSelector(java.util.List<? extends imports.aws.cloudtrail.CloudtrailAdvancedEventSelector> advancedEventSelector) {
            this.advancedEventSelector = advancedEventSelector;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getCloudWatchLogsGroupArn}
         * @param cloudWatchLogsGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#cloud_watch_logs_group_arn Cloudtrail#cloud_watch_logs_group_arn}.
         * @return {@code this}
         */
        public Builder cloudWatchLogsGroupArn(java.lang.String cloudWatchLogsGroupArn) {
            this.cloudWatchLogsGroupArn = cloudWatchLogsGroupArn;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getCloudWatchLogsRoleArn}
         * @param cloudWatchLogsRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#cloud_watch_logs_role_arn Cloudtrail#cloud_watch_logs_role_arn}.
         * @return {@code this}
         */
        public Builder cloudWatchLogsRoleArn(java.lang.String cloudWatchLogsRoleArn) {
            this.cloudWatchLogsRoleArn = cloudWatchLogsRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getEnableLogFileValidation}
         * @param enableLogFileValidation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#enable_log_file_validation Cloudtrail#enable_log_file_validation}.
         * @return {@code this}
         */
        public Builder enableLogFileValidation(java.lang.Boolean enableLogFileValidation) {
            this.enableLogFileValidation = enableLogFileValidation;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getEnableLogFileValidation}
         * @param enableLogFileValidation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#enable_log_file_validation Cloudtrail#enable_log_file_validation}.
         * @return {@code this}
         */
        public Builder enableLogFileValidation(com.hashicorp.cdktf.IResolvable enableLogFileValidation) {
            this.enableLogFileValidation = enableLogFileValidation;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getEnableLogging}
         * @param enableLogging Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#enable_logging Cloudtrail#enable_logging}.
         * @return {@code this}
         */
        public Builder enableLogging(java.lang.Boolean enableLogging) {
            this.enableLogging = enableLogging;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getEnableLogging}
         * @param enableLogging Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#enable_logging Cloudtrail#enable_logging}.
         * @return {@code this}
         */
        public Builder enableLogging(com.hashicorp.cdktf.IResolvable enableLogging) {
            this.enableLogging = enableLogging;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getEventSelector}
         * @param eventSelector event_selector block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#event_selector Cloudtrail#event_selector}
         * @return {@code this}
         */
        public Builder eventSelector(com.hashicorp.cdktf.IResolvable eventSelector) {
            this.eventSelector = eventSelector;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getEventSelector}
         * @param eventSelector event_selector block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#event_selector Cloudtrail#event_selector}
         * @return {@code this}
         */
        public Builder eventSelector(java.util.List<? extends imports.aws.cloudtrail.CloudtrailEventSelector> eventSelector) {
            this.eventSelector = eventSelector;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#id Cloudtrail#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getIncludeGlobalServiceEvents}
         * @param includeGlobalServiceEvents Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#include_global_service_events Cloudtrail#include_global_service_events}.
         * @return {@code this}
         */
        public Builder includeGlobalServiceEvents(java.lang.Boolean includeGlobalServiceEvents) {
            this.includeGlobalServiceEvents = includeGlobalServiceEvents;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getIncludeGlobalServiceEvents}
         * @param includeGlobalServiceEvents Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#include_global_service_events Cloudtrail#include_global_service_events}.
         * @return {@code this}
         */
        public Builder includeGlobalServiceEvents(com.hashicorp.cdktf.IResolvable includeGlobalServiceEvents) {
            this.includeGlobalServiceEvents = includeGlobalServiceEvents;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getInsightSelector}
         * @param insightSelector insight_selector block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#insight_selector Cloudtrail#insight_selector}
         * @return {@code this}
         */
        public Builder insightSelector(com.hashicorp.cdktf.IResolvable insightSelector) {
            this.insightSelector = insightSelector;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getInsightSelector}
         * @param insightSelector insight_selector block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#insight_selector Cloudtrail#insight_selector}
         * @return {@code this}
         */
        public Builder insightSelector(java.util.List<? extends imports.aws.cloudtrail.CloudtrailInsightSelector> insightSelector) {
            this.insightSelector = insightSelector;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getIsMultiRegionTrail}
         * @param isMultiRegionTrail Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#is_multi_region_trail Cloudtrail#is_multi_region_trail}.
         * @return {@code this}
         */
        public Builder isMultiRegionTrail(java.lang.Boolean isMultiRegionTrail) {
            this.isMultiRegionTrail = isMultiRegionTrail;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getIsMultiRegionTrail}
         * @param isMultiRegionTrail Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#is_multi_region_trail Cloudtrail#is_multi_region_trail}.
         * @return {@code this}
         */
        public Builder isMultiRegionTrail(com.hashicorp.cdktf.IResolvable isMultiRegionTrail) {
            this.isMultiRegionTrail = isMultiRegionTrail;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getIsOrganizationTrail}
         * @param isOrganizationTrail Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#is_organization_trail Cloudtrail#is_organization_trail}.
         * @return {@code this}
         */
        public Builder isOrganizationTrail(java.lang.Boolean isOrganizationTrail) {
            this.isOrganizationTrail = isOrganizationTrail;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getIsOrganizationTrail}
         * @param isOrganizationTrail Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#is_organization_trail Cloudtrail#is_organization_trail}.
         * @return {@code this}
         */
        public Builder isOrganizationTrail(com.hashicorp.cdktf.IResolvable isOrganizationTrail) {
            this.isOrganizationTrail = isOrganizationTrail;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#kms_key_id Cloudtrail#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getS3KeyPrefix}
         * @param s3KeyPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#s3_key_prefix Cloudtrail#s3_key_prefix}.
         * @return {@code this}
         */
        public Builder s3KeyPrefix(java.lang.String s3KeyPrefix) {
            this.s3KeyPrefix = s3KeyPrefix;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getSnsTopicName}
         * @param snsTopicName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#sns_topic_name Cloudtrail#sns_topic_name}.
         * @return {@code this}
         */
        public Builder snsTopicName(java.lang.String snsTopicName) {
            this.snsTopicName = snsTopicName;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#tags Cloudtrail#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#tags_all Cloudtrail#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getDependsOn}
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
         * Sets the value of {@link CloudtrailConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailConfig#getProvisioners}
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
         * @return a new instance of {@link CloudtrailConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudtrailConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudtrailConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudtrailConfig {
        private final java.lang.String name;
        private final java.lang.String s3BucketName;
        private final java.lang.Object advancedEventSelector;
        private final java.lang.String cloudWatchLogsGroupArn;
        private final java.lang.String cloudWatchLogsRoleArn;
        private final java.lang.Object enableLogFileValidation;
        private final java.lang.Object enableLogging;
        private final java.lang.Object eventSelector;
        private final java.lang.String id;
        private final java.lang.Object includeGlobalServiceEvents;
        private final java.lang.Object insightSelector;
        private final java.lang.Object isMultiRegionTrail;
        private final java.lang.Object isOrganizationTrail;
        private final java.lang.String kmsKeyId;
        private final java.lang.String s3KeyPrefix;
        private final java.lang.String snsTopicName;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3BucketName = software.amazon.jsii.Kernel.get(this, "s3BucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.advancedEventSelector = software.amazon.jsii.Kernel.get(this, "advancedEventSelector", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.cloudWatchLogsGroupArn = software.amazon.jsii.Kernel.get(this, "cloudWatchLogsGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cloudWatchLogsRoleArn = software.amazon.jsii.Kernel.get(this, "cloudWatchLogsRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enableLogFileValidation = software.amazon.jsii.Kernel.get(this, "enableLogFileValidation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableLogging = software.amazon.jsii.Kernel.get(this, "enableLogging", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.eventSelector = software.amazon.jsii.Kernel.get(this, "eventSelector", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.includeGlobalServiceEvents = software.amazon.jsii.Kernel.get(this, "includeGlobalServiceEvents", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.insightSelector = software.amazon.jsii.Kernel.get(this, "insightSelector", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.isMultiRegionTrail = software.amazon.jsii.Kernel.get(this, "isMultiRegionTrail", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.isOrganizationTrail = software.amazon.jsii.Kernel.get(this, "isOrganizationTrail", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3KeyPrefix = software.amazon.jsii.Kernel.get(this, "s3KeyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.snsTopicName = software.amazon.jsii.Kernel.get(this, "snsTopicName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.s3BucketName = java.util.Objects.requireNonNull(builder.s3BucketName, "s3BucketName is required");
            this.advancedEventSelector = builder.advancedEventSelector;
            this.cloudWatchLogsGroupArn = builder.cloudWatchLogsGroupArn;
            this.cloudWatchLogsRoleArn = builder.cloudWatchLogsRoleArn;
            this.enableLogFileValidation = builder.enableLogFileValidation;
            this.enableLogging = builder.enableLogging;
            this.eventSelector = builder.eventSelector;
            this.id = builder.id;
            this.includeGlobalServiceEvents = builder.includeGlobalServiceEvents;
            this.insightSelector = builder.insightSelector;
            this.isMultiRegionTrail = builder.isMultiRegionTrail;
            this.isOrganizationTrail = builder.isOrganizationTrail;
            this.kmsKeyId = builder.kmsKeyId;
            this.s3KeyPrefix = builder.s3KeyPrefix;
            this.snsTopicName = builder.snsTopicName;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getS3BucketName() {
            return this.s3BucketName;
        }

        @Override
        public final java.lang.Object getAdvancedEventSelector() {
            return this.advancedEventSelector;
        }

        @Override
        public final java.lang.String getCloudWatchLogsGroupArn() {
            return this.cloudWatchLogsGroupArn;
        }

        @Override
        public final java.lang.String getCloudWatchLogsRoleArn() {
            return this.cloudWatchLogsRoleArn;
        }

        @Override
        public final java.lang.Object getEnableLogFileValidation() {
            return this.enableLogFileValidation;
        }

        @Override
        public final java.lang.Object getEnableLogging() {
            return this.enableLogging;
        }

        @Override
        public final java.lang.Object getEventSelector() {
            return this.eventSelector;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getIncludeGlobalServiceEvents() {
            return this.includeGlobalServiceEvents;
        }

        @Override
        public final java.lang.Object getInsightSelector() {
            return this.insightSelector;
        }

        @Override
        public final java.lang.Object getIsMultiRegionTrail() {
            return this.isMultiRegionTrail;
        }

        @Override
        public final java.lang.Object getIsOrganizationTrail() {
            return this.isOrganizationTrail;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.String getS3KeyPrefix() {
            return this.s3KeyPrefix;
        }

        @Override
        public final java.lang.String getSnsTopicName() {
            return this.snsTopicName;
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

            data.set("name", om.valueToTree(this.getName()));
            data.set("s3BucketName", om.valueToTree(this.getS3BucketName()));
            if (this.getAdvancedEventSelector() != null) {
                data.set("advancedEventSelector", om.valueToTree(this.getAdvancedEventSelector()));
            }
            if (this.getCloudWatchLogsGroupArn() != null) {
                data.set("cloudWatchLogsGroupArn", om.valueToTree(this.getCloudWatchLogsGroupArn()));
            }
            if (this.getCloudWatchLogsRoleArn() != null) {
                data.set("cloudWatchLogsRoleArn", om.valueToTree(this.getCloudWatchLogsRoleArn()));
            }
            if (this.getEnableLogFileValidation() != null) {
                data.set("enableLogFileValidation", om.valueToTree(this.getEnableLogFileValidation()));
            }
            if (this.getEnableLogging() != null) {
                data.set("enableLogging", om.valueToTree(this.getEnableLogging()));
            }
            if (this.getEventSelector() != null) {
                data.set("eventSelector", om.valueToTree(this.getEventSelector()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIncludeGlobalServiceEvents() != null) {
                data.set("includeGlobalServiceEvents", om.valueToTree(this.getIncludeGlobalServiceEvents()));
            }
            if (this.getInsightSelector() != null) {
                data.set("insightSelector", om.valueToTree(this.getInsightSelector()));
            }
            if (this.getIsMultiRegionTrail() != null) {
                data.set("isMultiRegionTrail", om.valueToTree(this.getIsMultiRegionTrail()));
            }
            if (this.getIsOrganizationTrail() != null) {
                data.set("isOrganizationTrail", om.valueToTree(this.getIsOrganizationTrail()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getS3KeyPrefix() != null) {
                data.set("s3KeyPrefix", om.valueToTree(this.getS3KeyPrefix()));
            }
            if (this.getSnsTopicName() != null) {
                data.set("snsTopicName", om.valueToTree(this.getSnsTopicName()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.cloudtrail.CloudtrailConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudtrailConfig.Jsii$Proxy that = (CloudtrailConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!s3BucketName.equals(that.s3BucketName)) return false;
            if (this.advancedEventSelector != null ? !this.advancedEventSelector.equals(that.advancedEventSelector) : that.advancedEventSelector != null) return false;
            if (this.cloudWatchLogsGroupArn != null ? !this.cloudWatchLogsGroupArn.equals(that.cloudWatchLogsGroupArn) : that.cloudWatchLogsGroupArn != null) return false;
            if (this.cloudWatchLogsRoleArn != null ? !this.cloudWatchLogsRoleArn.equals(that.cloudWatchLogsRoleArn) : that.cloudWatchLogsRoleArn != null) return false;
            if (this.enableLogFileValidation != null ? !this.enableLogFileValidation.equals(that.enableLogFileValidation) : that.enableLogFileValidation != null) return false;
            if (this.enableLogging != null ? !this.enableLogging.equals(that.enableLogging) : that.enableLogging != null) return false;
            if (this.eventSelector != null ? !this.eventSelector.equals(that.eventSelector) : that.eventSelector != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.includeGlobalServiceEvents != null ? !this.includeGlobalServiceEvents.equals(that.includeGlobalServiceEvents) : that.includeGlobalServiceEvents != null) return false;
            if (this.insightSelector != null ? !this.insightSelector.equals(that.insightSelector) : that.insightSelector != null) return false;
            if (this.isMultiRegionTrail != null ? !this.isMultiRegionTrail.equals(that.isMultiRegionTrail) : that.isMultiRegionTrail != null) return false;
            if (this.isOrganizationTrail != null ? !this.isOrganizationTrail.equals(that.isOrganizationTrail) : that.isOrganizationTrail != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.s3KeyPrefix != null ? !this.s3KeyPrefix.equals(that.s3KeyPrefix) : that.s3KeyPrefix != null) return false;
            if (this.snsTopicName != null ? !this.snsTopicName.equals(that.snsTopicName) : that.snsTopicName != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.s3BucketName.hashCode());
            result = 31 * result + (this.advancedEventSelector != null ? this.advancedEventSelector.hashCode() : 0);
            result = 31 * result + (this.cloudWatchLogsGroupArn != null ? this.cloudWatchLogsGroupArn.hashCode() : 0);
            result = 31 * result + (this.cloudWatchLogsRoleArn != null ? this.cloudWatchLogsRoleArn.hashCode() : 0);
            result = 31 * result + (this.enableLogFileValidation != null ? this.enableLogFileValidation.hashCode() : 0);
            result = 31 * result + (this.enableLogging != null ? this.enableLogging.hashCode() : 0);
            result = 31 * result + (this.eventSelector != null ? this.eventSelector.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.includeGlobalServiceEvents != null ? this.includeGlobalServiceEvents.hashCode() : 0);
            result = 31 * result + (this.insightSelector != null ? this.insightSelector.hashCode() : 0);
            result = 31 * result + (this.isMultiRegionTrail != null ? this.isMultiRegionTrail.hashCode() : 0);
            result = 31 * result + (this.isOrganizationTrail != null ? this.isOrganizationTrail.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.s3KeyPrefix != null ? this.s3KeyPrefix.hashCode() : 0);
            result = 31 * result + (this.snsTopicName != null ? this.snsTopicName.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
