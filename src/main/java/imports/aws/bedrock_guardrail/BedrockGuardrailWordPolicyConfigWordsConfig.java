package imports.aws.bedrock_guardrail;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.147Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockGuardrail.BedrockGuardrailWordPolicyConfigWordsConfig")
@software.amazon.jsii.Jsii.Proxy(BedrockGuardrailWordPolicyConfigWordsConfig.Jsii$Proxy.class)
public interface BedrockGuardrailWordPolicyConfigWordsConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#text BedrockGuardrail#text}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getText();

    /**
     * @return a {@link Builder} of {@link BedrockGuardrailWordPolicyConfigWordsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockGuardrailWordPolicyConfigWordsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockGuardrailWordPolicyConfigWordsConfig> {
        java.lang.String text;

        /**
         * Sets the value of {@link BedrockGuardrailWordPolicyConfigWordsConfig#getText}
         * @param text Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#text BedrockGuardrail#text}. This parameter is required.
         * @return {@code this}
         */
        public Builder text(java.lang.String text) {
            this.text = text;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockGuardrailWordPolicyConfigWordsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockGuardrailWordPolicyConfigWordsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockGuardrailWordPolicyConfigWordsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockGuardrailWordPolicyConfigWordsConfig {
        private final java.lang.String text;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.text = software.amazon.jsii.Kernel.get(this, "text", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.text = java.util.Objects.requireNonNull(builder.text, "text is required");
        }

        @Override
        public final java.lang.String getText() {
            return this.text;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("text", om.valueToTree(this.getText()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockGuardrail.BedrockGuardrailWordPolicyConfigWordsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockGuardrailWordPolicyConfigWordsConfig.Jsii$Proxy that = (BedrockGuardrailWordPolicyConfigWordsConfig.Jsii$Proxy) o;

            return this.text.equals(that.text);
        }

        @Override
        public final int hashCode() {
            int result = this.text.hashCode();
            return result;
        }
    }
}
