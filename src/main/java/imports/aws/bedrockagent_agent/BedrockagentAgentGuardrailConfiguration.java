package imports.aws.bedrockagent_agent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.151Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgent.BedrockagentAgentGuardrailConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentAgentGuardrailConfiguration.Jsii$Proxy.class)
public interface BedrockagentAgentGuardrailConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#guardrail_identifier BedrockagentAgent#guardrail_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGuardrailIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#guardrail_version BedrockagentAgent#guardrail_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGuardrailVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentAgentGuardrailConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentAgentGuardrailConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentAgentGuardrailConfiguration> {
        java.lang.String guardrailIdentifier;
        java.lang.String guardrailVersion;

        /**
         * Sets the value of {@link BedrockagentAgentGuardrailConfiguration#getGuardrailIdentifier}
         * @param guardrailIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#guardrail_identifier BedrockagentAgent#guardrail_identifier}.
         * @return {@code this}
         */
        public Builder guardrailIdentifier(java.lang.String guardrailIdentifier) {
            this.guardrailIdentifier = guardrailIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentGuardrailConfiguration#getGuardrailVersion}
         * @param guardrailVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#guardrail_version BedrockagentAgent#guardrail_version}.
         * @return {@code this}
         */
        public Builder guardrailVersion(java.lang.String guardrailVersion) {
            this.guardrailVersion = guardrailVersion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentAgentGuardrailConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentAgentGuardrailConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentAgentGuardrailConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentAgentGuardrailConfiguration {
        private final java.lang.String guardrailIdentifier;
        private final java.lang.String guardrailVersion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.guardrailIdentifier = software.amazon.jsii.Kernel.get(this, "guardrailIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.guardrailVersion = software.amazon.jsii.Kernel.get(this, "guardrailVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.guardrailIdentifier = builder.guardrailIdentifier;
            this.guardrailVersion = builder.guardrailVersion;
        }

        @Override
        public final java.lang.String getGuardrailIdentifier() {
            return this.guardrailIdentifier;
        }

        @Override
        public final java.lang.String getGuardrailVersion() {
            return this.guardrailVersion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getGuardrailIdentifier() != null) {
                data.set("guardrailIdentifier", om.valueToTree(this.getGuardrailIdentifier()));
            }
            if (this.getGuardrailVersion() != null) {
                data.set("guardrailVersion", om.valueToTree(this.getGuardrailVersion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentAgent.BedrockagentAgentGuardrailConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentAgentGuardrailConfiguration.Jsii$Proxy that = (BedrockagentAgentGuardrailConfiguration.Jsii$Proxy) o;

            if (this.guardrailIdentifier != null ? !this.guardrailIdentifier.equals(that.guardrailIdentifier) : that.guardrailIdentifier != null) return false;
            return this.guardrailVersion != null ? this.guardrailVersion.equals(that.guardrailVersion) : that.guardrailVersion == null;
        }

        @Override
        public final int hashCode() {
            int result = this.guardrailIdentifier != null ? this.guardrailIdentifier.hashCode() : 0;
            result = 31 * result + (this.guardrailVersion != null ? this.guardrailVersion.hashCode() : 0);
            return result;
        }
    }
}
