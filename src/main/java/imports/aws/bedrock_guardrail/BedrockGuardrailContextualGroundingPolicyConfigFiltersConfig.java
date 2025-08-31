package imports.aws.bedrock_guardrail;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.146Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockGuardrail.BedrockGuardrailContextualGroundingPolicyConfigFiltersConfig")
@software.amazon.jsii.Jsii.Proxy(BedrockGuardrailContextualGroundingPolicyConfigFiltersConfig.Jsii$Proxy.class)
public interface BedrockGuardrailContextualGroundingPolicyConfigFiltersConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#threshold BedrockGuardrail#threshold}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getThreshold();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#type BedrockGuardrail#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * @return a {@link Builder} of {@link BedrockGuardrailContextualGroundingPolicyConfigFiltersConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockGuardrailContextualGroundingPolicyConfigFiltersConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockGuardrailContextualGroundingPolicyConfigFiltersConfig> {
        java.lang.Number threshold;
        java.lang.String type;

        /**
         * Sets the value of {@link BedrockGuardrailContextualGroundingPolicyConfigFiltersConfig#getThreshold}
         * @param threshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#threshold BedrockGuardrail#threshold}. This parameter is required.
         * @return {@code this}
         */
        public Builder threshold(java.lang.Number threshold) {
            this.threshold = threshold;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailContextualGroundingPolicyConfigFiltersConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#type BedrockGuardrail#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockGuardrailContextualGroundingPolicyConfigFiltersConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockGuardrailContextualGroundingPolicyConfigFiltersConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockGuardrailContextualGroundingPolicyConfigFiltersConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockGuardrailContextualGroundingPolicyConfigFiltersConfig {
        private final java.lang.Number threshold;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.threshold = software.amazon.jsii.Kernel.get(this, "threshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.threshold = java.util.Objects.requireNonNull(builder.threshold, "threshold is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
        }

        @Override
        public final java.lang.Number getThreshold() {
            return this.threshold;
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

            data.set("threshold", om.valueToTree(this.getThreshold()));
            data.set("type", om.valueToTree(this.getType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockGuardrail.BedrockGuardrailContextualGroundingPolicyConfigFiltersConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockGuardrailContextualGroundingPolicyConfigFiltersConfig.Jsii$Proxy that = (BedrockGuardrailContextualGroundingPolicyConfigFiltersConfig.Jsii$Proxy) o;

            if (!threshold.equals(that.threshold)) return false;
            return this.type.equals(that.type);
        }

        @Override
        public final int hashCode() {
            int result = this.threshold.hashCode();
            result = 31 * result + (this.type.hashCode());
            return result;
        }
    }
}
