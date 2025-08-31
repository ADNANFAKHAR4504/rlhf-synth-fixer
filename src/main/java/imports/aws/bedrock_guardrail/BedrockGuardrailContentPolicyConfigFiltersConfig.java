package imports.aws.bedrock_guardrail;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.145Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockGuardrail.BedrockGuardrailContentPolicyConfigFiltersConfig")
@software.amazon.jsii.Jsii.Proxy(BedrockGuardrailContentPolicyConfigFiltersConfig.Jsii$Proxy.class)
public interface BedrockGuardrailContentPolicyConfigFiltersConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#input_strength BedrockGuardrail#input_strength}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInputStrength();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#output_strength BedrockGuardrail#output_strength}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOutputStrength();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#type BedrockGuardrail#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * @return a {@link Builder} of {@link BedrockGuardrailContentPolicyConfigFiltersConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockGuardrailContentPolicyConfigFiltersConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockGuardrailContentPolicyConfigFiltersConfig> {
        java.lang.String inputStrength;
        java.lang.String outputStrength;
        java.lang.String type;

        /**
         * Sets the value of {@link BedrockGuardrailContentPolicyConfigFiltersConfig#getInputStrength}
         * @param inputStrength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#input_strength BedrockGuardrail#input_strength}. This parameter is required.
         * @return {@code this}
         */
        public Builder inputStrength(java.lang.String inputStrength) {
            this.inputStrength = inputStrength;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailContentPolicyConfigFiltersConfig#getOutputStrength}
         * @param outputStrength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#output_strength BedrockGuardrail#output_strength}. This parameter is required.
         * @return {@code this}
         */
        public Builder outputStrength(java.lang.String outputStrength) {
            this.outputStrength = outputStrength;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailContentPolicyConfigFiltersConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#type BedrockGuardrail#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockGuardrailContentPolicyConfigFiltersConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockGuardrailContentPolicyConfigFiltersConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockGuardrailContentPolicyConfigFiltersConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockGuardrailContentPolicyConfigFiltersConfig {
        private final java.lang.String inputStrength;
        private final java.lang.String outputStrength;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.inputStrength = software.amazon.jsii.Kernel.get(this, "inputStrength", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.outputStrength = software.amazon.jsii.Kernel.get(this, "outputStrength", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.inputStrength = java.util.Objects.requireNonNull(builder.inputStrength, "inputStrength is required");
            this.outputStrength = java.util.Objects.requireNonNull(builder.outputStrength, "outputStrength is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
        }

        @Override
        public final java.lang.String getInputStrength() {
            return this.inputStrength;
        }

        @Override
        public final java.lang.String getOutputStrength() {
            return this.outputStrength;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("inputStrength", om.valueToTree(this.getInputStrength()));
            data.set("outputStrength", om.valueToTree(this.getOutputStrength()));
            data.set("type", om.valueToTree(this.getType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockGuardrail.BedrockGuardrailContentPolicyConfigFiltersConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockGuardrailContentPolicyConfigFiltersConfig.Jsii$Proxy that = (BedrockGuardrailContentPolicyConfigFiltersConfig.Jsii$Proxy) o;

            if (!inputStrength.equals(that.inputStrength)) return false;
            if (!outputStrength.equals(that.outputStrength)) return false;
            return this.type.equals(that.type);
        }

        @Override
        public final int hashCode() {
            int result = this.inputStrength.hashCode();
            result = 31 * result + (this.outputStrength.hashCode());
            result = 31 * result + (this.type.hashCode());
            return result;
        }
    }
}
