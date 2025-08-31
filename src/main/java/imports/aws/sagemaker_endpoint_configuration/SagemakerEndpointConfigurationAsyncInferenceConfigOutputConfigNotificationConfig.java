package imports.aws.sagemaker_endpoint_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.320Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig.Jsii$Proxy.class)
public interface SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#error_topic SagemakerEndpointConfiguration#error_topic}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getErrorTopic() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#include_inference_response_in SagemakerEndpointConfiguration#include_inference_response_in}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIncludeInferenceResponseIn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#success_topic SagemakerEndpointConfiguration#success_topic}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSuccessTopic() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig> {
        java.lang.String errorTopic;
        java.util.List<java.lang.String> includeInferenceResponseIn;
        java.lang.String successTopic;

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig#getErrorTopic}
         * @param errorTopic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#error_topic SagemakerEndpointConfiguration#error_topic}.
         * @return {@code this}
         */
        public Builder errorTopic(java.lang.String errorTopic) {
            this.errorTopic = errorTopic;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig#getIncludeInferenceResponseIn}
         * @param includeInferenceResponseIn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#include_inference_response_in SagemakerEndpointConfiguration#include_inference_response_in}.
         * @return {@code this}
         */
        public Builder includeInferenceResponseIn(java.util.List<java.lang.String> includeInferenceResponseIn) {
            this.includeInferenceResponseIn = includeInferenceResponseIn;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig#getSuccessTopic}
         * @param successTopic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#success_topic SagemakerEndpointConfiguration#success_topic}.
         * @return {@code this}
         */
        public Builder successTopic(java.lang.String successTopic) {
            this.successTopic = successTopic;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig {
        private final java.lang.String errorTopic;
        private final java.util.List<java.lang.String> includeInferenceResponseIn;
        private final java.lang.String successTopic;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.errorTopic = software.amazon.jsii.Kernel.get(this, "errorTopic", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.includeInferenceResponseIn = software.amazon.jsii.Kernel.get(this, "includeInferenceResponseIn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.successTopic = software.amazon.jsii.Kernel.get(this, "successTopic", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.errorTopic = builder.errorTopic;
            this.includeInferenceResponseIn = builder.includeInferenceResponseIn;
            this.successTopic = builder.successTopic;
        }

        @Override
        public final java.lang.String getErrorTopic() {
            return this.errorTopic;
        }

        @Override
        public final java.util.List<java.lang.String> getIncludeInferenceResponseIn() {
            return this.includeInferenceResponseIn;
        }

        @Override
        public final java.lang.String getSuccessTopic() {
            return this.successTopic;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getErrorTopic() != null) {
                data.set("errorTopic", om.valueToTree(this.getErrorTopic()));
            }
            if (this.getIncludeInferenceResponseIn() != null) {
                data.set("includeInferenceResponseIn", om.valueToTree(this.getIncludeInferenceResponseIn()));
            }
            if (this.getSuccessTopic() != null) {
                data.set("successTopic", om.valueToTree(this.getSuccessTopic()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig.Jsii$Proxy that = (SagemakerEndpointConfigurationAsyncInferenceConfigOutputConfigNotificationConfig.Jsii$Proxy) o;

            if (this.errorTopic != null ? !this.errorTopic.equals(that.errorTopic) : that.errorTopic != null) return false;
            if (this.includeInferenceResponseIn != null ? !this.includeInferenceResponseIn.equals(that.includeInferenceResponseIn) : that.includeInferenceResponseIn != null) return false;
            return this.successTopic != null ? this.successTopic.equals(that.successTopic) : that.successTopic == null;
        }

        @Override
        public final int hashCode() {
            int result = this.errorTopic != null ? this.errorTopic.hashCode() : 0;
            result = 31 * result + (this.includeInferenceResponseIn != null ? this.includeInferenceResponseIn.hashCode() : 0);
            result = 31 * result + (this.successTopic != null ? this.successTopic.hashCode() : 0);
            return result;
        }
    }
}
