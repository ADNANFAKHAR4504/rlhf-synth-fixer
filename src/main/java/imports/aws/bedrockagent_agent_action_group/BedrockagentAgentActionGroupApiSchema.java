package imports.aws.bedrockagent_agent_action_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.155Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgentActionGroup.BedrockagentAgentActionGroupApiSchema")
@software.amazon.jsii.Jsii.Proxy(BedrockagentAgentActionGroupApiSchema.Jsii$Proxy.class)
public interface BedrockagentAgentActionGroupApiSchema extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#payload BedrockagentAgentActionGroup#payload}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPayload() {
        return null;
    }

    /**
     * s3 block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#s3 BedrockagentAgentActionGroup#s3}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getS3() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentAgentActionGroupApiSchema}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentAgentActionGroupApiSchema}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentAgentActionGroupApiSchema> {
        java.lang.String payload;
        java.lang.Object s3;

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupApiSchema#getPayload}
         * @param payload Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#payload BedrockagentAgentActionGroup#payload}.
         * @return {@code this}
         */
        public Builder payload(java.lang.String payload) {
            this.payload = payload;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupApiSchema#getS3}
         * @param s3 s3 block.
         *           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#s3 BedrockagentAgentActionGroup#s3}
         * @return {@code this}
         */
        public Builder s3(com.hashicorp.cdktf.IResolvable s3) {
            this.s3 = s3;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupApiSchema#getS3}
         * @param s3 s3 block.
         *           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#s3 BedrockagentAgentActionGroup#s3}
         * @return {@code this}
         */
        public Builder s3(java.util.List<? extends imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupApiSchemaS3> s3) {
            this.s3 = s3;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentAgentActionGroupApiSchema}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentAgentActionGroupApiSchema build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentAgentActionGroupApiSchema}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentAgentActionGroupApiSchema {
        private final java.lang.String payload;
        private final java.lang.Object s3;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.payload = software.amazon.jsii.Kernel.get(this, "payload", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3 = software.amazon.jsii.Kernel.get(this, "s3", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.payload = builder.payload;
            this.s3 = builder.s3;
        }

        @Override
        public final java.lang.String getPayload() {
            return this.payload;
        }

        @Override
        public final java.lang.Object getS3() {
            return this.s3;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getPayload() != null) {
                data.set("payload", om.valueToTree(this.getPayload()));
            }
            if (this.getS3() != null) {
                data.set("s3", om.valueToTree(this.getS3()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentAgentActionGroup.BedrockagentAgentActionGroupApiSchema"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentAgentActionGroupApiSchema.Jsii$Proxy that = (BedrockagentAgentActionGroupApiSchema.Jsii$Proxy) o;

            if (this.payload != null ? !this.payload.equals(that.payload) : that.payload != null) return false;
            return this.s3 != null ? this.s3.equals(that.s3) : that.s3 == null;
        }

        @Override
        public final int hashCode() {
            int result = this.payload != null ? this.payload.hashCode() : 0;
            result = 31 * result + (this.s3 != null ? this.s3.hashCode() : 0);
            return result;
        }
    }
}
