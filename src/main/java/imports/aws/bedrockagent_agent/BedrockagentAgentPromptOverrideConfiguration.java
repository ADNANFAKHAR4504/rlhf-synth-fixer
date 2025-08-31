package imports.aws.bedrockagent_agent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.151Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgent.BedrockagentAgentPromptOverrideConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentAgentPromptOverrideConfiguration.Jsii$Proxy.class)
public interface BedrockagentAgentPromptOverrideConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#override_lambda BedrockagentAgent#override_lambda}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOverrideLambda() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_configurations BedrockagentAgent#prompt_configurations}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPromptConfigurations() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentAgentPromptOverrideConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentAgentPromptOverrideConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentAgentPromptOverrideConfiguration> {
        java.lang.String overrideLambda;
        java.lang.Object promptConfigurations;

        /**
         * Sets the value of {@link BedrockagentAgentPromptOverrideConfiguration#getOverrideLambda}
         * @param overrideLambda Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#override_lambda BedrockagentAgent#override_lambda}.
         * @return {@code this}
         */
        public Builder overrideLambda(java.lang.String overrideLambda) {
            this.overrideLambda = overrideLambda;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentPromptOverrideConfiguration#getPromptConfigurations}
         * @param promptConfigurations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_configurations BedrockagentAgent#prompt_configurations}.
         * @return {@code this}
         */
        public Builder promptConfigurations(com.hashicorp.cdktf.IResolvable promptConfigurations) {
            this.promptConfigurations = promptConfigurations;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentPromptOverrideConfiguration#getPromptConfigurations}
         * @param promptConfigurations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#prompt_configurations BedrockagentAgent#prompt_configurations}.
         * @return {@code this}
         */
        public Builder promptConfigurations(java.util.List<? extends imports.aws.bedrockagent_agent.BedrockagentAgentPromptOverrideConfigurationPromptConfigurations> promptConfigurations) {
            this.promptConfigurations = promptConfigurations;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentAgentPromptOverrideConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentAgentPromptOverrideConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentAgentPromptOverrideConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentAgentPromptOverrideConfiguration {
        private final java.lang.String overrideLambda;
        private final java.lang.Object promptConfigurations;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.overrideLambda = software.amazon.jsii.Kernel.get(this, "overrideLambda", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.promptConfigurations = software.amazon.jsii.Kernel.get(this, "promptConfigurations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.overrideLambda = builder.overrideLambda;
            this.promptConfigurations = builder.promptConfigurations;
        }

        @Override
        public final java.lang.String getOverrideLambda() {
            return this.overrideLambda;
        }

        @Override
        public final java.lang.Object getPromptConfigurations() {
            return this.promptConfigurations;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getOverrideLambda() != null) {
                data.set("overrideLambda", om.valueToTree(this.getOverrideLambda()));
            }
            if (this.getPromptConfigurations() != null) {
                data.set("promptConfigurations", om.valueToTree(this.getPromptConfigurations()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentAgent.BedrockagentAgentPromptOverrideConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentAgentPromptOverrideConfiguration.Jsii$Proxy that = (BedrockagentAgentPromptOverrideConfiguration.Jsii$Proxy) o;

            if (this.overrideLambda != null ? !this.overrideLambda.equals(that.overrideLambda) : that.overrideLambda != null) return false;
            return this.promptConfigurations != null ? this.promptConfigurations.equals(that.promptConfigurations) : that.promptConfigurations == null;
        }

        @Override
        public final int hashCode() {
            int result = this.overrideLambda != null ? this.overrideLambda.hashCode() : 0;
            result = 31 * result + (this.promptConfigurations != null ? this.promptConfigurations.hashCode() : 0);
            return result;
        }
    }
}
