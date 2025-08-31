package imports.aws.bedrockagent_agent_collaborator;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.157Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgentCollaborator.BedrockagentAgentCollaboratorAgentDescriptor")
@software.amazon.jsii.Jsii.Proxy(BedrockagentAgentCollaboratorAgentDescriptor.Jsii$Proxy.class)
public interface BedrockagentAgentCollaboratorAgentDescriptor extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#alias_arn BedrockagentAgentCollaborator#alias_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAliasArn();

    /**
     * @return a {@link Builder} of {@link BedrockagentAgentCollaboratorAgentDescriptor}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentAgentCollaboratorAgentDescriptor}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentAgentCollaboratorAgentDescriptor> {
        java.lang.String aliasArn;

        /**
         * Sets the value of {@link BedrockagentAgentCollaboratorAgentDescriptor#getAliasArn}
         * @param aliasArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_collaborator#alias_arn BedrockagentAgentCollaborator#alias_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder aliasArn(java.lang.String aliasArn) {
            this.aliasArn = aliasArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentAgentCollaboratorAgentDescriptor}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentAgentCollaboratorAgentDescriptor build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentAgentCollaboratorAgentDescriptor}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentAgentCollaboratorAgentDescriptor {
        private final java.lang.String aliasArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.aliasArn = software.amazon.jsii.Kernel.get(this, "aliasArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.aliasArn = java.util.Objects.requireNonNull(builder.aliasArn, "aliasArn is required");
        }

        @Override
        public final java.lang.String getAliasArn() {
            return this.aliasArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("aliasArn", om.valueToTree(this.getAliasArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentAgentCollaborator.BedrockagentAgentCollaboratorAgentDescriptor"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentAgentCollaboratorAgentDescriptor.Jsii$Proxy that = (BedrockagentAgentCollaboratorAgentDescriptor.Jsii$Proxy) o;

            return this.aliasArn.equals(that.aliasArn);
        }

        @Override
        public final int hashCode() {
            int result = this.aliasArn.hashCode();
            return result;
        }
    }
}
