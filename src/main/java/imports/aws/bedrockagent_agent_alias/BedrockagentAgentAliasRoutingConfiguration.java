package imports.aws.bedrockagent_agent_alias;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.157Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgentAlias.BedrockagentAgentAliasRoutingConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentAgentAliasRoutingConfiguration.Jsii$Proxy.class)
public interface BedrockagentAgentAliasRoutingConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_alias#agent_version BedrockagentAgentAlias#agent_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAgentVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_alias#provisioned_throughput BedrockagentAgentAlias#provisioned_throughput}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProvisionedThroughput() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentAgentAliasRoutingConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentAgentAliasRoutingConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentAgentAliasRoutingConfiguration> {
        java.lang.String agentVersion;
        java.lang.String provisionedThroughput;

        /**
         * Sets the value of {@link BedrockagentAgentAliasRoutingConfiguration#getAgentVersion}
         * @param agentVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_alias#agent_version BedrockagentAgentAlias#agent_version}.
         * @return {@code this}
         */
        public Builder agentVersion(java.lang.String agentVersion) {
            this.agentVersion = agentVersion;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentAliasRoutingConfiguration#getProvisionedThroughput}
         * @param provisionedThroughput Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_alias#provisioned_throughput BedrockagentAgentAlias#provisioned_throughput}.
         * @return {@code this}
         */
        public Builder provisionedThroughput(java.lang.String provisionedThroughput) {
            this.provisionedThroughput = provisionedThroughput;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentAgentAliasRoutingConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentAgentAliasRoutingConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentAgentAliasRoutingConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentAgentAliasRoutingConfiguration {
        private final java.lang.String agentVersion;
        private final java.lang.String provisionedThroughput;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.agentVersion = software.amazon.jsii.Kernel.get(this, "agentVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.provisionedThroughput = software.amazon.jsii.Kernel.get(this, "provisionedThroughput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.agentVersion = builder.agentVersion;
            this.provisionedThroughput = builder.provisionedThroughput;
        }

        @Override
        public final java.lang.String getAgentVersion() {
            return this.agentVersion;
        }

        @Override
        public final java.lang.String getProvisionedThroughput() {
            return this.provisionedThroughput;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAgentVersion() != null) {
                data.set("agentVersion", om.valueToTree(this.getAgentVersion()));
            }
            if (this.getProvisionedThroughput() != null) {
                data.set("provisionedThroughput", om.valueToTree(this.getProvisionedThroughput()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentAgentAlias.BedrockagentAgentAliasRoutingConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentAgentAliasRoutingConfiguration.Jsii$Proxy that = (BedrockagentAgentAliasRoutingConfiguration.Jsii$Proxy) o;

            if (this.agentVersion != null ? !this.agentVersion.equals(that.agentVersion) : that.agentVersion != null) return false;
            return this.provisionedThroughput != null ? this.provisionedThroughput.equals(that.provisionedThroughput) : that.provisionedThroughput == null;
        }

        @Override
        public final int hashCode() {
            int result = this.agentVersion != null ? this.agentVersion.hashCode() : 0;
            result = 31 * result + (this.provisionedThroughput != null ? this.provisionedThroughput.hashCode() : 0);
            return result;
        }
    }
}
