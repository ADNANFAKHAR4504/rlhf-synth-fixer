package imports.aws.cloudwatch_log_anomaly_detector;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector aws_cloudwatch_log_anomaly_detector}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.281Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchLogAnomalyDetector.CloudwatchLogAnomalyDetector")
public class CloudwatchLogAnomalyDetector extends com.hashicorp.cdktf.TerraformResource {

    protected CloudwatchLogAnomalyDetector(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudwatchLogAnomalyDetector(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.cloudwatch_log_anomaly_detector.CloudwatchLogAnomalyDetector.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector aws_cloudwatch_log_anomaly_detector} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CloudwatchLogAnomalyDetector(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_log_anomaly_detector.CloudwatchLogAnomalyDetectorConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CloudwatchLogAnomalyDetector resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudwatchLogAnomalyDetector to import. This parameter is required.
     * @param importFromId The id of the existing CloudwatchLogAnomalyDetector that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CloudwatchLogAnomalyDetector to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudwatch_log_anomaly_detector.CloudwatchLogAnomalyDetector.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CloudwatchLogAnomalyDetector resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudwatchLogAnomalyDetector to import. This parameter is required.
     * @param importFromId The id of the existing CloudwatchLogAnomalyDetector that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudwatch_log_anomaly_detector.CloudwatchLogAnomalyDetector.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetAnomalyVisibilityTime() {
        software.amazon.jsii.Kernel.call(this, "resetAnomalyVisibilityTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDetectorName() {
        software.amazon.jsii.Kernel.call(this, "resetDetectorName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEvaluationFrequency() {
        software.amazon.jsii.Kernel.call(this, "resetEvaluationFrequency", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilterPattern() {
        software.amazon.jsii.Kernel.call(this, "resetFilterPattern", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAnomalyVisibilityTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "anomalyVisibilityTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDetectorNameInput() {
        return software.amazon.jsii.Kernel.get(this, "detectorNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEvaluationFrequencyInput() {
        return software.amazon.jsii.Kernel.get(this, "evaluationFrequencyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFilterPatternInput() {
        return software.amazon.jsii.Kernel.get(this, "filterPatternInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLogGroupArnListInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "logGroupArnListInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAnomalyVisibilityTime() {
        return software.amazon.jsii.Kernel.get(this, "anomalyVisibilityTime", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAnomalyVisibilityTime(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "anomalyVisibilityTime", java.util.Objects.requireNonNull(value, "anomalyVisibilityTime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDetectorName() {
        return software.amazon.jsii.Kernel.get(this, "detectorName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDetectorName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "detectorName", java.util.Objects.requireNonNull(value, "detectorName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEvaluationFrequency() {
        return software.amazon.jsii.Kernel.get(this, "evaluationFrequency", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEvaluationFrequency(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "evaluationFrequency", java.util.Objects.requireNonNull(value, "evaluationFrequency is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFilterPattern() {
        return software.amazon.jsii.Kernel.get(this, "filterPattern", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFilterPattern(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "filterPattern", java.util.Objects.requireNonNull(value, "filterPattern is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyId", java.util.Objects.requireNonNull(value, "kmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getLogGroupArnList() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "logGroupArnList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setLogGroupArnList(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "logGroupArnList", java.util.Objects.requireNonNull(value, "logGroupArnList is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.cloudwatch_log_anomaly_detector.CloudwatchLogAnomalyDetector}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.cloudwatch_log_anomaly_detector.CloudwatchLogAnomalyDetector> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.cloudwatch_log_anomaly_detector.CloudwatchLogAnomalyDetectorConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.cloudwatch_log_anomaly_detector.CloudwatchLogAnomalyDetectorConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#enabled CloudwatchLogAnomalyDetector#enabled}.
         * <p>
         * @return {@code this}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#enabled CloudwatchLogAnomalyDetector#enabled}. This parameter is required.
         */
        public Builder enabled(final java.lang.Boolean enabled) {
            this.config.enabled(enabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#enabled CloudwatchLogAnomalyDetector#enabled}.
         * <p>
         * @return {@code this}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#enabled CloudwatchLogAnomalyDetector#enabled}. This parameter is required.
         */
        public Builder enabled(final com.hashicorp.cdktf.IResolvable enabled) {
            this.config.enabled(enabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#log_group_arn_list CloudwatchLogAnomalyDetector#log_group_arn_list}.
         * <p>
         * @return {@code this}
         * @param logGroupArnList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#log_group_arn_list CloudwatchLogAnomalyDetector#log_group_arn_list}. This parameter is required.
         */
        public Builder logGroupArnList(final java.util.List<java.lang.String> logGroupArnList) {
            this.config.logGroupArnList(logGroupArnList);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#anomaly_visibility_time CloudwatchLogAnomalyDetector#anomaly_visibility_time}.
         * <p>
         * @return {@code this}
         * @param anomalyVisibilityTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#anomaly_visibility_time CloudwatchLogAnomalyDetector#anomaly_visibility_time}. This parameter is required.
         */
        public Builder anomalyVisibilityTime(final java.lang.Number anomalyVisibilityTime) {
            this.config.anomalyVisibilityTime(anomalyVisibilityTime);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#detector_name CloudwatchLogAnomalyDetector#detector_name}.
         * <p>
         * @return {@code this}
         * @param detectorName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#detector_name CloudwatchLogAnomalyDetector#detector_name}. This parameter is required.
         */
        public Builder detectorName(final java.lang.String detectorName) {
            this.config.detectorName(detectorName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#evaluation_frequency CloudwatchLogAnomalyDetector#evaluation_frequency}.
         * <p>
         * @return {@code this}
         * @param evaluationFrequency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#evaluation_frequency CloudwatchLogAnomalyDetector#evaluation_frequency}. This parameter is required.
         */
        public Builder evaluationFrequency(final java.lang.String evaluationFrequency) {
            this.config.evaluationFrequency(evaluationFrequency);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#filter_pattern CloudwatchLogAnomalyDetector#filter_pattern}.
         * <p>
         * @return {@code this}
         * @param filterPattern Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#filter_pattern CloudwatchLogAnomalyDetector#filter_pattern}. This parameter is required.
         */
        public Builder filterPattern(final java.lang.String filterPattern) {
            this.config.filterPattern(filterPattern);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#kms_key_id CloudwatchLogAnomalyDetector#kms_key_id}.
         * <p>
         * @return {@code this}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#kms_key_id CloudwatchLogAnomalyDetector#kms_key_id}. This parameter is required.
         */
        public Builder kmsKeyId(final java.lang.String kmsKeyId) {
            this.config.kmsKeyId(kmsKeyId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#tags CloudwatchLogAnomalyDetector#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#tags CloudwatchLogAnomalyDetector#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.cloudwatch_log_anomaly_detector.CloudwatchLogAnomalyDetector}.
         */
        @Override
        public imports.aws.cloudwatch_log_anomaly_detector.CloudwatchLogAnomalyDetector build() {
            return new imports.aws.cloudwatch_log_anomaly_detector.CloudwatchLogAnomalyDetector(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
