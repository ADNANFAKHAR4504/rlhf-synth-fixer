package imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.208Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings")
@software.amazon.jsii.Jsii.Proxy(ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings.Jsii$Proxy.class)
public interface ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#data_access_role_arn ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#data_access_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDataAccessRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#output_location ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#output_location}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOutputLocation();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_redaction_output ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_redaction_output}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContentRedactionOutput() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#output_encryption_kms_key_id ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#output_encryption_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOutputEncryptionKmsKeyId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings> {
        java.lang.String dataAccessRoleArn;
        java.lang.String outputLocation;
        java.lang.String contentRedactionOutput;
        java.lang.String outputEncryptionKmsKeyId;

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings#getDataAccessRoleArn}
         * @param dataAccessRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#data_access_role_arn ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#data_access_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataAccessRoleArn(java.lang.String dataAccessRoleArn) {
            this.dataAccessRoleArn = dataAccessRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings#getOutputLocation}
         * @param outputLocation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#output_location ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#output_location}. This parameter is required.
         * @return {@code this}
         */
        public Builder outputLocation(java.lang.String outputLocation) {
            this.outputLocation = outputLocation;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings#getContentRedactionOutput}
         * @param contentRedactionOutput Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#content_redaction_output ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#content_redaction_output}.
         * @return {@code this}
         */
        public Builder contentRedactionOutput(java.lang.String contentRedactionOutput) {
            this.contentRedactionOutput = contentRedactionOutput;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings#getOutputEncryptionKmsKeyId}
         * @param outputEncryptionKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#output_encryption_kms_key_id ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#output_encryption_kms_key_id}.
         * @return {@code this}
         */
        public Builder outputEncryptionKmsKeyId(java.lang.String outputEncryptionKmsKeyId) {
            this.outputEncryptionKmsKeyId = outputEncryptionKmsKeyId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings {
        private final java.lang.String dataAccessRoleArn;
        private final java.lang.String outputLocation;
        private final java.lang.String contentRedactionOutput;
        private final java.lang.String outputEncryptionKmsKeyId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataAccessRoleArn = software.amazon.jsii.Kernel.get(this, "dataAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.outputLocation = software.amazon.jsii.Kernel.get(this, "outputLocation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contentRedactionOutput = software.amazon.jsii.Kernel.get(this, "contentRedactionOutput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.outputEncryptionKmsKeyId = software.amazon.jsii.Kernel.get(this, "outputEncryptionKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataAccessRoleArn = java.util.Objects.requireNonNull(builder.dataAccessRoleArn, "dataAccessRoleArn is required");
            this.outputLocation = java.util.Objects.requireNonNull(builder.outputLocation, "outputLocation is required");
            this.contentRedactionOutput = builder.contentRedactionOutput;
            this.outputEncryptionKmsKeyId = builder.outputEncryptionKmsKeyId;
        }

        @Override
        public final java.lang.String getDataAccessRoleArn() {
            return this.dataAccessRoleArn;
        }

        @Override
        public final java.lang.String getOutputLocation() {
            return this.outputLocation;
        }

        @Override
        public final java.lang.String getContentRedactionOutput() {
            return this.contentRedactionOutput;
        }

        @Override
        public final java.lang.String getOutputEncryptionKmsKeyId() {
            return this.outputEncryptionKmsKeyId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("dataAccessRoleArn", om.valueToTree(this.getDataAccessRoleArn()));
            data.set("outputLocation", om.valueToTree(this.getOutputLocation()));
            if (this.getContentRedactionOutput() != null) {
                data.set("contentRedactionOutput", om.valueToTree(this.getContentRedactionOutput()));
            }
            if (this.getOutputEncryptionKmsKeyId() != null) {
                data.set("outputEncryptionKmsKeyId", om.valueToTree(this.getOutputEncryptionKmsKeyId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings.Jsii$Proxy that = (ChimesdkmediapipelinesMediaInsightsPipelineConfigurationElementsAmazonTranscribeCallAnalyticsProcessorConfigurationPostCallAnalyticsSettings.Jsii$Proxy) o;

            if (!dataAccessRoleArn.equals(that.dataAccessRoleArn)) return false;
            if (!outputLocation.equals(that.outputLocation)) return false;
            if (this.contentRedactionOutput != null ? !this.contentRedactionOutput.equals(that.contentRedactionOutput) : that.contentRedactionOutput != null) return false;
            return this.outputEncryptionKmsKeyId != null ? this.outputEncryptionKmsKeyId.equals(that.outputEncryptionKmsKeyId) : that.outputEncryptionKmsKeyId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dataAccessRoleArn.hashCode();
            result = 31 * result + (this.outputLocation.hashCode());
            result = 31 * result + (this.contentRedactionOutput != null ? this.contentRedactionOutput.hashCode() : 0);
            result = 31 * result + (this.outputEncryptionKmsKeyId != null ? this.outputEncryptionKmsKeyId.hashCode() : 0);
            return result;
        }
    }
}
