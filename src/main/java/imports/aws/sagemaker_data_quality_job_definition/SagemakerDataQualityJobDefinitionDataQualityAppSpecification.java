package imports.aws.sagemaker_data_quality_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.301Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityAppSpecification")
@software.amazon.jsii.Jsii.Proxy(SagemakerDataQualityJobDefinitionDataQualityAppSpecification.Jsii$Proxy.class)
public interface SagemakerDataQualityJobDefinitionDataQualityAppSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#image_uri SagemakerDataQualityJobDefinition#image_uri}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getImageUri();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#environment SagemakerDataQualityJobDefinition#environment}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getEnvironment() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#post_analytics_processor_source_uri SagemakerDataQualityJobDefinition#post_analytics_processor_source_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPostAnalyticsProcessorSourceUri() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#record_preprocessor_source_uri SagemakerDataQualityJobDefinition#record_preprocessor_source_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRecordPreprocessorSourceUri() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDataQualityJobDefinitionDataQualityAppSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDataQualityJobDefinitionDataQualityAppSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDataQualityJobDefinitionDataQualityAppSpecification> {
        java.lang.String imageUri;
        java.util.Map<java.lang.String, java.lang.String> environment;
        java.lang.String postAnalyticsProcessorSourceUri;
        java.lang.String recordPreprocessorSourceUri;

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionDataQualityAppSpecification#getImageUri}
         * @param imageUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#image_uri SagemakerDataQualityJobDefinition#image_uri}. This parameter is required.
         * @return {@code this}
         */
        public Builder imageUri(java.lang.String imageUri) {
            this.imageUri = imageUri;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionDataQualityAppSpecification#getEnvironment}
         * @param environment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#environment SagemakerDataQualityJobDefinition#environment}.
         * @return {@code this}
         */
        public Builder environment(java.util.Map<java.lang.String, java.lang.String> environment) {
            this.environment = environment;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionDataQualityAppSpecification#getPostAnalyticsProcessorSourceUri}
         * @param postAnalyticsProcessorSourceUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#post_analytics_processor_source_uri SagemakerDataQualityJobDefinition#post_analytics_processor_source_uri}.
         * @return {@code this}
         */
        public Builder postAnalyticsProcessorSourceUri(java.lang.String postAnalyticsProcessorSourceUri) {
            this.postAnalyticsProcessorSourceUri = postAnalyticsProcessorSourceUri;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionDataQualityAppSpecification#getRecordPreprocessorSourceUri}
         * @param recordPreprocessorSourceUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#record_preprocessor_source_uri SagemakerDataQualityJobDefinition#record_preprocessor_source_uri}.
         * @return {@code this}
         */
        public Builder recordPreprocessorSourceUri(java.lang.String recordPreprocessorSourceUri) {
            this.recordPreprocessorSourceUri = recordPreprocessorSourceUri;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDataQualityJobDefinitionDataQualityAppSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDataQualityJobDefinitionDataQualityAppSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDataQualityJobDefinitionDataQualityAppSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDataQualityJobDefinitionDataQualityAppSpecification {
        private final java.lang.String imageUri;
        private final java.util.Map<java.lang.String, java.lang.String> environment;
        private final java.lang.String postAnalyticsProcessorSourceUri;
        private final java.lang.String recordPreprocessorSourceUri;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.imageUri = software.amazon.jsii.Kernel.get(this, "imageUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.environment = software.amazon.jsii.Kernel.get(this, "environment", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.postAnalyticsProcessorSourceUri = software.amazon.jsii.Kernel.get(this, "postAnalyticsProcessorSourceUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.recordPreprocessorSourceUri = software.amazon.jsii.Kernel.get(this, "recordPreprocessorSourceUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.imageUri = java.util.Objects.requireNonNull(builder.imageUri, "imageUri is required");
            this.environment = builder.environment;
            this.postAnalyticsProcessorSourceUri = builder.postAnalyticsProcessorSourceUri;
            this.recordPreprocessorSourceUri = builder.recordPreprocessorSourceUri;
        }

        @Override
        public final java.lang.String getImageUri() {
            return this.imageUri;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getEnvironment() {
            return this.environment;
        }

        @Override
        public final java.lang.String getPostAnalyticsProcessorSourceUri() {
            return this.postAnalyticsProcessorSourceUri;
        }

        @Override
        public final java.lang.String getRecordPreprocessorSourceUri() {
            return this.recordPreprocessorSourceUri;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("imageUri", om.valueToTree(this.getImageUri()));
            if (this.getEnvironment() != null) {
                data.set("environment", om.valueToTree(this.getEnvironment()));
            }
            if (this.getPostAnalyticsProcessorSourceUri() != null) {
                data.set("postAnalyticsProcessorSourceUri", om.valueToTree(this.getPostAnalyticsProcessorSourceUri()));
            }
            if (this.getRecordPreprocessorSourceUri() != null) {
                data.set("recordPreprocessorSourceUri", om.valueToTree(this.getRecordPreprocessorSourceUri()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityAppSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDataQualityJobDefinitionDataQualityAppSpecification.Jsii$Proxy that = (SagemakerDataQualityJobDefinitionDataQualityAppSpecification.Jsii$Proxy) o;

            if (!imageUri.equals(that.imageUri)) return false;
            if (this.environment != null ? !this.environment.equals(that.environment) : that.environment != null) return false;
            if (this.postAnalyticsProcessorSourceUri != null ? !this.postAnalyticsProcessorSourceUri.equals(that.postAnalyticsProcessorSourceUri) : that.postAnalyticsProcessorSourceUri != null) return false;
            return this.recordPreprocessorSourceUri != null ? this.recordPreprocessorSourceUri.equals(that.recordPreprocessorSourceUri) : that.recordPreprocessorSourceUri == null;
        }

        @Override
        public final int hashCode() {
            int result = this.imageUri.hashCode();
            result = 31 * result + (this.environment != null ? this.environment.hashCode() : 0);
            result = 31 * result + (this.postAnalyticsProcessorSourceUri != null ? this.postAnalyticsProcessorSourceUri.hashCode() : 0);
            result = 31 * result + (this.recordPreprocessorSourceUri != null ? this.recordPreprocessorSourceUri.hashCode() : 0);
            return result;
        }
    }
}
