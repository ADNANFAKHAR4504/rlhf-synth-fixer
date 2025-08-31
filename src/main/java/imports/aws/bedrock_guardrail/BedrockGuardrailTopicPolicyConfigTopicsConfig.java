package imports.aws.bedrock_guardrail;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.147Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockGuardrail.BedrockGuardrailTopicPolicyConfigTopicsConfig")
@software.amazon.jsii.Jsii.Proxy(BedrockGuardrailTopicPolicyConfigTopicsConfig.Jsii$Proxy.class)
public interface BedrockGuardrailTopicPolicyConfigTopicsConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#definition BedrockGuardrail#definition}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDefinition();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#name BedrockGuardrail#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#type BedrockGuardrail#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#examples BedrockGuardrail#examples}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExamples() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockGuardrailTopicPolicyConfigTopicsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockGuardrailTopicPolicyConfigTopicsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockGuardrailTopicPolicyConfigTopicsConfig> {
        java.lang.String definition;
        java.lang.String name;
        java.lang.String type;
        java.util.List<java.lang.String> examples;

        /**
         * Sets the value of {@link BedrockGuardrailTopicPolicyConfigTopicsConfig#getDefinition}
         * @param definition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#definition BedrockGuardrail#definition}. This parameter is required.
         * @return {@code this}
         */
        public Builder definition(java.lang.String definition) {
            this.definition = definition;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailTopicPolicyConfigTopicsConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#name BedrockGuardrail#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailTopicPolicyConfigTopicsConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#type BedrockGuardrail#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link BedrockGuardrailTopicPolicyConfigTopicsConfig#getExamples}
         * @param examples Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#examples BedrockGuardrail#examples}.
         * @return {@code this}
         */
        public Builder examples(java.util.List<java.lang.String> examples) {
            this.examples = examples;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockGuardrailTopicPolicyConfigTopicsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockGuardrailTopicPolicyConfigTopicsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockGuardrailTopicPolicyConfigTopicsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockGuardrailTopicPolicyConfigTopicsConfig {
        private final java.lang.String definition;
        private final java.lang.String name;
        private final java.lang.String type;
        private final java.util.List<java.lang.String> examples;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.definition = software.amazon.jsii.Kernel.get(this, "definition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.examples = software.amazon.jsii.Kernel.get(this, "examples", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.definition = java.util.Objects.requireNonNull(builder.definition, "definition is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.examples = builder.examples;
        }

        @Override
        public final java.lang.String getDefinition() {
            return this.definition;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.util.List<java.lang.String> getExamples() {
            return this.examples;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("definition", om.valueToTree(this.getDefinition()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("type", om.valueToTree(this.getType()));
            if (this.getExamples() != null) {
                data.set("examples", om.valueToTree(this.getExamples()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockGuardrail.BedrockGuardrailTopicPolicyConfigTopicsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockGuardrailTopicPolicyConfigTopicsConfig.Jsii$Proxy that = (BedrockGuardrailTopicPolicyConfigTopicsConfig.Jsii$Proxy) o;

            if (!definition.equals(that.definition)) return false;
            if (!name.equals(that.name)) return false;
            if (!type.equals(that.type)) return false;
            return this.examples != null ? this.examples.equals(that.examples) : that.examples == null;
        }

        @Override
        public final int hashCode() {
            int result = this.definition.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.examples != null ? this.examples.hashCode() : 0);
            return result;
        }
    }
}
