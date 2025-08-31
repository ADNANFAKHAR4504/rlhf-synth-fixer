package imports.aws.chime_voice_connector_streaming;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.206Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimeVoiceConnectorStreaming.ChimeVoiceConnectorStreamingMediaInsightsConfiguration")
@software.amazon.jsii.Jsii.Proxy(ChimeVoiceConnectorStreamingMediaInsightsConfiguration.Jsii$Proxy.class)
public interface ChimeVoiceConnectorStreamingMediaInsightsConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_streaming#configuration_arn ChimeVoiceConnectorStreaming#configuration_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConfigurationArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_streaming#disabled ChimeVoiceConnectorStreaming#disabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ChimeVoiceConnectorStreamingMediaInsightsConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ChimeVoiceConnectorStreamingMediaInsightsConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ChimeVoiceConnectorStreamingMediaInsightsConfiguration> {
        java.lang.String configurationArn;
        java.lang.Object disabled;

        /**
         * Sets the value of {@link ChimeVoiceConnectorStreamingMediaInsightsConfiguration#getConfigurationArn}
         * @param configurationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_streaming#configuration_arn ChimeVoiceConnectorStreaming#configuration_arn}.
         * @return {@code this}
         */
        public Builder configurationArn(java.lang.String configurationArn) {
            this.configurationArn = configurationArn;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorStreamingMediaInsightsConfiguration#getDisabled}
         * @param disabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_streaming#disabled ChimeVoiceConnectorStreaming#disabled}.
         * @return {@code this}
         */
        public Builder disabled(java.lang.Boolean disabled) {
            this.disabled = disabled;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorStreamingMediaInsightsConfiguration#getDisabled}
         * @param disabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_streaming#disabled ChimeVoiceConnectorStreaming#disabled}.
         * @return {@code this}
         */
        public Builder disabled(com.hashicorp.cdktf.IResolvable disabled) {
            this.disabled = disabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ChimeVoiceConnectorStreamingMediaInsightsConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ChimeVoiceConnectorStreamingMediaInsightsConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ChimeVoiceConnectorStreamingMediaInsightsConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ChimeVoiceConnectorStreamingMediaInsightsConfiguration {
        private final java.lang.String configurationArn;
        private final java.lang.Object disabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.configurationArn = software.amazon.jsii.Kernel.get(this, "configurationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.disabled = software.amazon.jsii.Kernel.get(this, "disabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.configurationArn = builder.configurationArn;
            this.disabled = builder.disabled;
        }

        @Override
        public final java.lang.String getConfigurationArn() {
            return this.configurationArn;
        }

        @Override
        public final java.lang.Object getDisabled() {
            return this.disabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getConfigurationArn() != null) {
                data.set("configurationArn", om.valueToTree(this.getConfigurationArn()));
            }
            if (this.getDisabled() != null) {
                data.set("disabled", om.valueToTree(this.getDisabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.chimeVoiceConnectorStreaming.ChimeVoiceConnectorStreamingMediaInsightsConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ChimeVoiceConnectorStreamingMediaInsightsConfiguration.Jsii$Proxy that = (ChimeVoiceConnectorStreamingMediaInsightsConfiguration.Jsii$Proxy) o;

            if (this.configurationArn != null ? !this.configurationArn.equals(that.configurationArn) : that.configurationArn != null) return false;
            return this.disabled != null ? this.disabled.equals(that.disabled) : that.disabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.configurationArn != null ? this.configurationArn.hashCode() : 0;
            result = 31 * result + (this.disabled != null ? this.disabled.hashCode() : 0);
            return result;
        }
    }
}
