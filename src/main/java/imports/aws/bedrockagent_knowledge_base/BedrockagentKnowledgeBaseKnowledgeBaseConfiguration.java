package imports.aws.bedrockagent_knowledge_base;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.172Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseKnowledgeBaseConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentKnowledgeBaseKnowledgeBaseConfiguration.Jsii$Proxy.class)
public interface BedrockagentKnowledgeBaseKnowledgeBaseConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#type BedrockagentKnowledgeBase#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * vector_knowledge_base_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#vector_knowledge_base_configuration BedrockagentKnowledgeBase#vector_knowledge_base_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVectorKnowledgeBaseConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentKnowledgeBaseKnowledgeBaseConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentKnowledgeBaseKnowledgeBaseConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentKnowledgeBaseKnowledgeBaseConfiguration> {
        java.lang.String type;
        java.lang.Object vectorKnowledgeBaseConfiguration;

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseKnowledgeBaseConfiguration#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#type BedrockagentKnowledgeBase#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseKnowledgeBaseConfiguration#getVectorKnowledgeBaseConfiguration}
         * @param vectorKnowledgeBaseConfiguration vector_knowledge_base_configuration block.
         *                                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#vector_knowledge_base_configuration BedrockagentKnowledgeBase#vector_knowledge_base_configuration}
         * @return {@code this}
         */
        public Builder vectorKnowledgeBaseConfiguration(com.hashicorp.cdktf.IResolvable vectorKnowledgeBaseConfiguration) {
            this.vectorKnowledgeBaseConfiguration = vectorKnowledgeBaseConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseKnowledgeBaseConfiguration#getVectorKnowledgeBaseConfiguration}
         * @param vectorKnowledgeBaseConfiguration vector_knowledge_base_configuration block.
         *                                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#vector_knowledge_base_configuration BedrockagentKnowledgeBase#vector_knowledge_base_configuration}
         * @return {@code this}
         */
        public Builder vectorKnowledgeBaseConfiguration(java.util.List<? extends imports.aws.bedrockagent_knowledge_base.BedrockagentKnowledgeBaseKnowledgeBaseConfigurationVectorKnowledgeBaseConfiguration> vectorKnowledgeBaseConfiguration) {
            this.vectorKnowledgeBaseConfiguration = vectorKnowledgeBaseConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentKnowledgeBaseKnowledgeBaseConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentKnowledgeBaseKnowledgeBaseConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentKnowledgeBaseKnowledgeBaseConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentKnowledgeBaseKnowledgeBaseConfiguration {
        private final java.lang.String type;
        private final java.lang.Object vectorKnowledgeBaseConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vectorKnowledgeBaseConfiguration = software.amazon.jsii.Kernel.get(this, "vectorKnowledgeBaseConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.vectorKnowledgeBaseConfiguration = builder.vectorKnowledgeBaseConfiguration;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.Object getVectorKnowledgeBaseConfiguration() {
            return this.vectorKnowledgeBaseConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getVectorKnowledgeBaseConfiguration() != null) {
                data.set("vectorKnowledgeBaseConfiguration", om.valueToTree(this.getVectorKnowledgeBaseConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseKnowledgeBaseConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentKnowledgeBaseKnowledgeBaseConfiguration.Jsii$Proxy that = (BedrockagentKnowledgeBaseKnowledgeBaseConfiguration.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            return this.vectorKnowledgeBaseConfiguration != null ? this.vectorKnowledgeBaseConfiguration.equals(that.vectorKnowledgeBaseConfiguration) : that.vectorKnowledgeBaseConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.vectorKnowledgeBaseConfiguration != null ? this.vectorKnowledgeBaseConfiguration.hashCode() : 0);
            return result;
        }
    }
}
