package imports.aws.cloudwatch_log_anomaly_detector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.281Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchLogAnomalyDetector.CloudwatchLogAnomalyDetectorConfig")
@software.amazon.jsii.Jsii.Proxy(CloudwatchLogAnomalyDetectorConfig.Jsii$Proxy.class)
public interface CloudwatchLogAnomalyDetectorConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#enabled CloudwatchLogAnomalyDetector#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#log_group_arn_list CloudwatchLogAnomalyDetector#log_group_arn_list}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getLogGroupArnList();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#anomaly_visibility_time CloudwatchLogAnomalyDetector#anomaly_visibility_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAnomalyVisibilityTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#detector_name CloudwatchLogAnomalyDetector#detector_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDetectorName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#evaluation_frequency CloudwatchLogAnomalyDetector#evaluation_frequency}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEvaluationFrequency() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#filter_pattern CloudwatchLogAnomalyDetector#filter_pattern}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFilterPattern() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#kms_key_id CloudwatchLogAnomalyDetector#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#tags CloudwatchLogAnomalyDetector#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchLogAnomalyDetectorConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchLogAnomalyDetectorConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchLogAnomalyDetectorConfig> {
        java.lang.Object enabled;
        java.util.List<java.lang.String> logGroupArnList;
        java.lang.Number anomalyVisibilityTime;
        java.lang.String detectorName;
        java.lang.String evaluationFrequency;
        java.lang.String filterPattern;
        java.lang.String kmsKeyId;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CloudwatchLogAnomalyDetectorConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#enabled CloudwatchLogAnomalyDetector#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogAnomalyDetectorConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#enabled CloudwatchLogAnomalyDetector#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogAnomalyDetectorConfig#getLogGroupArnList}
         * @param logGroupArnList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#log_group_arn_list CloudwatchLogAnomalyDetector#log_group_arn_list}. This parameter is required.
         * @return {@code this}
         */
        public Builder logGroupArnList(java.util.List<java.lang.String> logGroupArnList) {
            this.logGroupArnList = logGroupArnList;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogAnomalyDetectorConfig#getAnomalyVisibilityTime}
         * @param anomalyVisibilityTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#anomaly_visibility_time CloudwatchLogAnomalyDetector#anomaly_visibility_time}.
         * @return {@code this}
         */
        public Builder anomalyVisibilityTime(java.lang.Number anomalyVisibilityTime) {
            this.anomalyVisibilityTime = anomalyVisibilityTime;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogAnomalyDetectorConfig#getDetectorName}
         * @param detectorName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#detector_name CloudwatchLogAnomalyDetector#detector_name}.
         * @return {@code this}
         */
        public Builder detectorName(java.lang.String detectorName) {
            this.detectorName = detectorName;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogAnomalyDetectorConfig#getEvaluationFrequency}
         * @param evaluationFrequency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#evaluation_frequency CloudwatchLogAnomalyDetector#evaluation_frequency}.
         * @return {@code this}
         */
        public Builder evaluationFrequency(java.lang.String evaluationFrequency) {
            this.evaluationFrequency = evaluationFrequency;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogAnomalyDetectorConfig#getFilterPattern}
         * @param filterPattern Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#filter_pattern CloudwatchLogAnomalyDetector#filter_pattern}.
         * @return {@code this}
         */
        public Builder filterPattern(java.lang.String filterPattern) {
            this.filterPattern = filterPattern;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogAnomalyDetectorConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#kms_key_id CloudwatchLogAnomalyDetector#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogAnomalyDetectorConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_anomaly_detector#tags CloudwatchLogAnomalyDetector#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogAnomalyDetectorConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogAnomalyDetectorConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogAnomalyDetectorConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogAnomalyDetectorConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogAnomalyDetectorConfig#getDependsOn}
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
         * Sets the value of {@link CloudwatchLogAnomalyDetectorConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogAnomalyDetectorConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogAnomalyDetectorConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogAnomalyDetectorConfig#getProvisioners}
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
         * @return a new instance of {@link CloudwatchLogAnomalyDetectorConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchLogAnomalyDetectorConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchLogAnomalyDetectorConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchLogAnomalyDetectorConfig {
        private final java.lang.Object enabled;
        private final java.util.List<java.lang.String> logGroupArnList;
        private final java.lang.Number anomalyVisibilityTime;
        private final java.lang.String detectorName;
        private final java.lang.String evaluationFrequency;
        private final java.lang.String filterPattern;
        private final java.lang.String kmsKeyId;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
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
            this.logGroupArnList = software.amazon.jsii.Kernel.get(this, "logGroupArnList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.anomalyVisibilityTime = software.amazon.jsii.Kernel.get(this, "anomalyVisibilityTime", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.detectorName = software.amazon.jsii.Kernel.get(this, "detectorName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.evaluationFrequency = software.amazon.jsii.Kernel.get(this, "evaluationFrequency", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.filterPattern = software.amazon.jsii.Kernel.get(this, "filterPattern", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.logGroupArnList = java.util.Objects.requireNonNull(builder.logGroupArnList, "logGroupArnList is required");
            this.anomalyVisibilityTime = builder.anomalyVisibilityTime;
            this.detectorName = builder.detectorName;
            this.evaluationFrequency = builder.evaluationFrequency;
            this.filterPattern = builder.filterPattern;
            this.kmsKeyId = builder.kmsKeyId;
            this.tags = builder.tags;
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
        public final java.util.List<java.lang.String> getLogGroupArnList() {
            return this.logGroupArnList;
        }

        @Override
        public final java.lang.Number getAnomalyVisibilityTime() {
            return this.anomalyVisibilityTime;
        }

        @Override
        public final java.lang.String getDetectorName() {
            return this.detectorName;
        }

        @Override
        public final java.lang.String getEvaluationFrequency() {
            return this.evaluationFrequency;
        }

        @Override
        public final java.lang.String getFilterPattern() {
            return this.filterPattern;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
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
            data.set("logGroupArnList", om.valueToTree(this.getLogGroupArnList()));
            if (this.getAnomalyVisibilityTime() != null) {
                data.set("anomalyVisibilityTime", om.valueToTree(this.getAnomalyVisibilityTime()));
            }
            if (this.getDetectorName() != null) {
                data.set("detectorName", om.valueToTree(this.getDetectorName()));
            }
            if (this.getEvaluationFrequency() != null) {
                data.set("evaluationFrequency", om.valueToTree(this.getEvaluationFrequency()));
            }
            if (this.getFilterPattern() != null) {
                data.set("filterPattern", om.valueToTree(this.getFilterPattern()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
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
            struct.set("fqn", om.valueToTree("aws.cloudwatchLogAnomalyDetector.CloudwatchLogAnomalyDetectorConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchLogAnomalyDetectorConfig.Jsii$Proxy that = (CloudwatchLogAnomalyDetectorConfig.Jsii$Proxy) o;

            if (!enabled.equals(that.enabled)) return false;
            if (!logGroupArnList.equals(that.logGroupArnList)) return false;
            if (this.anomalyVisibilityTime != null ? !this.anomalyVisibilityTime.equals(that.anomalyVisibilityTime) : that.anomalyVisibilityTime != null) return false;
            if (this.detectorName != null ? !this.detectorName.equals(that.detectorName) : that.detectorName != null) return false;
            if (this.evaluationFrequency != null ? !this.evaluationFrequency.equals(that.evaluationFrequency) : that.evaluationFrequency != null) return false;
            if (this.filterPattern != null ? !this.filterPattern.equals(that.filterPattern) : that.filterPattern != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
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
            result = 31 * result + (this.logGroupArnList.hashCode());
            result = 31 * result + (this.anomalyVisibilityTime != null ? this.anomalyVisibilityTime.hashCode() : 0);
            result = 31 * result + (this.detectorName != null ? this.detectorName.hashCode() : 0);
            result = 31 * result + (this.evaluationFrequency != null ? this.evaluationFrequency.hashCode() : 0);
            result = 31 * result + (this.filterPattern != null ? this.filterPattern.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
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
