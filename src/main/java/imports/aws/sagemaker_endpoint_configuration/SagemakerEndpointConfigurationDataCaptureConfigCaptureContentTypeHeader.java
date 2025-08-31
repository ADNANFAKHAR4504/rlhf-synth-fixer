package imports.aws.sagemaker_endpoint_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.321Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader")
@software.amazon.jsii.Jsii.Proxy(SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader.Jsii$Proxy.class)
public interface SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#csv_content_types SagemakerEndpointConfiguration#csv_content_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCsvContentTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#json_content_types SagemakerEndpointConfiguration#json_content_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getJsonContentTypes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader> {
        java.util.List<java.lang.String> csvContentTypes;
        java.util.List<java.lang.String> jsonContentTypes;

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader#getCsvContentTypes}
         * @param csvContentTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#csv_content_types SagemakerEndpointConfiguration#csv_content_types}.
         * @return {@code this}
         */
        public Builder csvContentTypes(java.util.List<java.lang.String> csvContentTypes) {
            this.csvContentTypes = csvContentTypes;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader#getJsonContentTypes}
         * @param jsonContentTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#json_content_types SagemakerEndpointConfiguration#json_content_types}.
         * @return {@code this}
         */
        public Builder jsonContentTypes(java.util.List<java.lang.String> jsonContentTypes) {
            this.jsonContentTypes = jsonContentTypes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader {
        private final java.util.List<java.lang.String> csvContentTypes;
        private final java.util.List<java.lang.String> jsonContentTypes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.csvContentTypes = software.amazon.jsii.Kernel.get(this, "csvContentTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.jsonContentTypes = software.amazon.jsii.Kernel.get(this, "jsonContentTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.csvContentTypes = builder.csvContentTypes;
            this.jsonContentTypes = builder.jsonContentTypes;
        }

        @Override
        public final java.util.List<java.lang.String> getCsvContentTypes() {
            return this.csvContentTypes;
        }

        @Override
        public final java.util.List<java.lang.String> getJsonContentTypes() {
            return this.jsonContentTypes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCsvContentTypes() != null) {
                data.set("csvContentTypes", om.valueToTree(this.getCsvContentTypes()));
            }
            if (this.getJsonContentTypes() != null) {
                data.set("jsonContentTypes", om.valueToTree(this.getJsonContentTypes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader.Jsii$Proxy that = (SagemakerEndpointConfigurationDataCaptureConfigCaptureContentTypeHeader.Jsii$Proxy) o;

            if (this.csvContentTypes != null ? !this.csvContentTypes.equals(that.csvContentTypes) : that.csvContentTypes != null) return false;
            return this.jsonContentTypes != null ? this.jsonContentTypes.equals(that.jsonContentTypes) : that.jsonContentTypes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.csvContentTypes != null ? this.csvContentTypes.hashCode() : 0;
            result = 31 * result + (this.jsonContentTypes != null ? this.jsonContentTypes.hashCode() : 0);
            return result;
        }
    }
}
