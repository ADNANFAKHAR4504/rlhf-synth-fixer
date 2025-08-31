package imports.aws.sagemaker_endpoint_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.321Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationDataCaptureConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerEndpointConfigurationDataCaptureConfig.Jsii$Proxy.class)
public interface SagemakerEndpointConfigurationDataCaptureConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * capture_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#capture_options SagemakerEndpointConfiguration#capture_options}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getCaptureOptions();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#destination_s3_uri SagemakerEndpointConfiguration#destination_s3_uri}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDestinationS3Uri();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#initial_sampling_percentage SagemakerEndpointConfiguration#initial_sampling_percentage}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getInitialSamplingPercentage();

    /**
     * capture_content_type_header block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#capture_content_type_header SagemakerEndpointConfiguration#capture_content_type_header}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader getCaptureContentTypeHeader() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#enable_capture SagemakerEndpointConfiguration#enable_capture}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableCapture() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#kms_key_id SagemakerEndpointConfiguration#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerEndpointConfigurationDataCaptureConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerEndpointConfigurationDataCaptureConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerEndpointConfigurationDataCaptureConfig> {
        java.lang.Object captureOptions;
        java.lang.String destinationS3Uri;
        java.lang.Number initialSamplingPercentage;
        imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader captureContentTypeHeader;
        java.lang.Object enableCapture;
        java.lang.String kmsKeyId;

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationDataCaptureConfig#getCaptureOptions}
         * @param captureOptions capture_options block. This parameter is required.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#capture_options SagemakerEndpointConfiguration#capture_options}
         * @return {@code this}
         */
        public Builder captureOptions(com.hashicorp.cdktf.IResolvable captureOptions) {
            this.captureOptions = captureOptions;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationDataCaptureConfig#getCaptureOptions}
         * @param captureOptions capture_options block. This parameter is required.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#capture_options SagemakerEndpointConfiguration#capture_options}
         * @return {@code this}
         */
        public Builder captureOptions(java.util.List<? extends imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfigCaptureOptions> captureOptions) {
            this.captureOptions = captureOptions;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationDataCaptureConfig#getDestinationS3Uri}
         * @param destinationS3Uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#destination_s3_uri SagemakerEndpointConfiguration#destination_s3_uri}. This parameter is required.
         * @return {@code this}
         */
        public Builder destinationS3Uri(java.lang.String destinationS3Uri) {
            this.destinationS3Uri = destinationS3Uri;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationDataCaptureConfig#getInitialSamplingPercentage}
         * @param initialSamplingPercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#initial_sampling_percentage SagemakerEndpointConfiguration#initial_sampling_percentage}. This parameter is required.
         * @return {@code this}
         */
        public Builder initialSamplingPercentage(java.lang.Number initialSamplingPercentage) {
            this.initialSamplingPercentage = initialSamplingPercentage;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationDataCaptureConfig#getCaptureContentTypeHeader}
         * @param captureContentTypeHeader capture_content_type_header block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#capture_content_type_header SagemakerEndpointConfiguration#capture_content_type_header}
         * @return {@code this}
         */
        public Builder captureContentTypeHeader(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader captureContentTypeHeader) {
            this.captureContentTypeHeader = captureContentTypeHeader;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationDataCaptureConfig#getEnableCapture}
         * @param enableCapture Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#enable_capture SagemakerEndpointConfiguration#enable_capture}.
         * @return {@code this}
         */
        public Builder enableCapture(java.lang.Boolean enableCapture) {
            this.enableCapture = enableCapture;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationDataCaptureConfig#getEnableCapture}
         * @param enableCapture Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#enable_capture SagemakerEndpointConfiguration#enable_capture}.
         * @return {@code this}
         */
        public Builder enableCapture(com.hashicorp.cdktf.IResolvable enableCapture) {
            this.enableCapture = enableCapture;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationDataCaptureConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#kms_key_id SagemakerEndpointConfiguration#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerEndpointConfigurationDataCaptureConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerEndpointConfigurationDataCaptureConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerEndpointConfigurationDataCaptureConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerEndpointConfigurationDataCaptureConfig {
        private final java.lang.Object captureOptions;
        private final java.lang.String destinationS3Uri;
        private final java.lang.Number initialSamplingPercentage;
        private final imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader captureContentTypeHeader;
        private final java.lang.Object enableCapture;
        private final java.lang.String kmsKeyId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.captureOptions = software.amazon.jsii.Kernel.get(this, "captureOptions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.destinationS3Uri = software.amazon.jsii.Kernel.get(this, "destinationS3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.initialSamplingPercentage = software.amazon.jsii.Kernel.get(this, "initialSamplingPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.captureContentTypeHeader = software.amazon.jsii.Kernel.get(this, "captureContentTypeHeader", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader.class));
            this.enableCapture = software.amazon.jsii.Kernel.get(this, "enableCapture", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.captureOptions = java.util.Objects.requireNonNull(builder.captureOptions, "captureOptions is required");
            this.destinationS3Uri = java.util.Objects.requireNonNull(builder.destinationS3Uri, "destinationS3Uri is required");
            this.initialSamplingPercentage = java.util.Objects.requireNonNull(builder.initialSamplingPercentage, "initialSamplingPercentage is required");
            this.captureContentTypeHeader = builder.captureContentTypeHeader;
            this.enableCapture = builder.enableCapture;
            this.kmsKeyId = builder.kmsKeyId;
        }

        @Override
        public final java.lang.Object getCaptureOptions() {
            return this.captureOptions;
        }

        @Override
        public final java.lang.String getDestinationS3Uri() {
            return this.destinationS3Uri;
        }

        @Override
        public final java.lang.Number getInitialSamplingPercentage() {
            return this.initialSamplingPercentage;
        }

        @Override
        public final imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader getCaptureContentTypeHeader() {
            return this.captureContentTypeHeader;
        }

        @Override
        public final java.lang.Object getEnableCapture() {
            return this.enableCapture;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("captureOptions", om.valueToTree(this.getCaptureOptions()));
            data.set("destinationS3Uri", om.valueToTree(this.getDestinationS3Uri()));
            data.set("initialSamplingPercentage", om.valueToTree(this.getInitialSamplingPercentage()));
            if (this.getCaptureContentTypeHeader() != null) {
                data.set("captureContentTypeHeader", om.valueToTree(this.getCaptureContentTypeHeader()));
            }
            if (this.getEnableCapture() != null) {
                data.set("enableCapture", om.valueToTree(this.getEnableCapture()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationDataCaptureConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerEndpointConfigurationDataCaptureConfig.Jsii$Proxy that = (SagemakerEndpointConfigurationDataCaptureConfig.Jsii$Proxy) o;

            if (!captureOptions.equals(that.captureOptions)) return false;
            if (!destinationS3Uri.equals(that.destinationS3Uri)) return false;
            if (!initialSamplingPercentage.equals(that.initialSamplingPercentage)) return false;
            if (this.captureContentTypeHeader != null ? !this.captureContentTypeHeader.equals(that.captureContentTypeHeader) : that.captureContentTypeHeader != null) return false;
            if (this.enableCapture != null ? !this.enableCapture.equals(that.enableCapture) : that.enableCapture != null) return false;
            return this.kmsKeyId != null ? this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.captureOptions.hashCode();
            result = 31 * result + (this.destinationS3Uri.hashCode());
            result = 31 * result + (this.initialSamplingPercentage.hashCode());
            result = 31 * result + (this.captureContentTypeHeader != null ? this.captureContentTypeHeader.hashCode() : 0);
            result = 31 * result + (this.enableCapture != null ? this.enableCapture.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            return result;
        }
    }
}
