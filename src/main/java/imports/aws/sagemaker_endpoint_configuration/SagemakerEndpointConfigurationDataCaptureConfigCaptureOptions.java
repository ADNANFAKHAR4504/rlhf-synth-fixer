package imports.aws.sagemaker_endpoint_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.321Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationDataCaptureConfigCaptureOptions")
@software.amazon.jsii.Jsii.Proxy(SagemakerEndpointConfigurationDataCaptureConfigCaptureOptions.Jsii$Proxy.class)
public interface SagemakerEndpointConfigurationDataCaptureConfigCaptureOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#capture_mode SagemakerEndpointConfiguration#capture_mode}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCaptureMode();

    /**
     * @return a {@link Builder} of {@link SagemakerEndpointConfigurationDataCaptureConfigCaptureOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerEndpointConfigurationDataCaptureConfigCaptureOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerEndpointConfigurationDataCaptureConfigCaptureOptions> {
        java.lang.String captureMode;

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationDataCaptureConfigCaptureOptions#getCaptureMode}
         * @param captureMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#capture_mode SagemakerEndpointConfiguration#capture_mode}. This parameter is required.
         * @return {@code this}
         */
        public Builder captureMode(java.lang.String captureMode) {
            this.captureMode = captureMode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerEndpointConfigurationDataCaptureConfigCaptureOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerEndpointConfigurationDataCaptureConfigCaptureOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerEndpointConfigurationDataCaptureConfigCaptureOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerEndpointConfigurationDataCaptureConfigCaptureOptions {
        private final java.lang.String captureMode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.captureMode = software.amazon.jsii.Kernel.get(this, "captureMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.captureMode = java.util.Objects.requireNonNull(builder.captureMode, "captureMode is required");
        }

        @Override
        public final java.lang.String getCaptureMode() {
            return this.captureMode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("captureMode", om.valueToTree(this.getCaptureMode()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationDataCaptureConfigCaptureOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerEndpointConfigurationDataCaptureConfigCaptureOptions.Jsii$Proxy that = (SagemakerEndpointConfigurationDataCaptureConfigCaptureOptions.Jsii$Proxy) o;

            return this.captureMode.equals(that.captureMode);
        }

        @Override
        public final int hashCode() {
            int result = this.captureMode.hashCode();
            return result;
        }
    }
}
