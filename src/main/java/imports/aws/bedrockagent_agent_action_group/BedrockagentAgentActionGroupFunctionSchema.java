package imports.aws.bedrockagent_agent_action_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.155Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgentActionGroup.BedrockagentAgentActionGroupFunctionSchema")
@software.amazon.jsii.Jsii.Proxy(BedrockagentAgentActionGroupFunctionSchema.Jsii$Proxy.class)
public interface BedrockagentAgentActionGroupFunctionSchema extends software.amazon.jsii.JsiiSerializable {

    /**
     * member_functions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#member_functions BedrockagentAgentActionGroup#member_functions}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMemberFunctions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentAgentActionGroupFunctionSchema}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentAgentActionGroupFunctionSchema}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentAgentActionGroupFunctionSchema> {
        java.lang.Object memberFunctions;

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupFunctionSchema#getMemberFunctions}
         * @param memberFunctions member_functions block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#member_functions BedrockagentAgentActionGroup#member_functions}
         * @return {@code this}
         */
        public Builder memberFunctions(com.hashicorp.cdktf.IResolvable memberFunctions) {
            this.memberFunctions = memberFunctions;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupFunctionSchema#getMemberFunctions}
         * @param memberFunctions member_functions block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#member_functions BedrockagentAgentActionGroup#member_functions}
         * @return {@code this}
         */
        public Builder memberFunctions(java.util.List<? extends imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupFunctionSchemaMemberFunctions> memberFunctions) {
            this.memberFunctions = memberFunctions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentAgentActionGroupFunctionSchema}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentAgentActionGroupFunctionSchema build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentAgentActionGroupFunctionSchema}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentAgentActionGroupFunctionSchema {
        private final java.lang.Object memberFunctions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.memberFunctions = software.amazon.jsii.Kernel.get(this, "memberFunctions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.memberFunctions = builder.memberFunctions;
        }

        @Override
        public final java.lang.Object getMemberFunctions() {
            return this.memberFunctions;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMemberFunctions() != null) {
                data.set("memberFunctions", om.valueToTree(this.getMemberFunctions()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentAgentActionGroup.BedrockagentAgentActionGroupFunctionSchema"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentAgentActionGroupFunctionSchema.Jsii$Proxy that = (BedrockagentAgentActionGroupFunctionSchema.Jsii$Proxy) o;

            return this.memberFunctions != null ? this.memberFunctions.equals(that.memberFunctions) : that.memberFunctions == null;
        }

        @Override
        public final int hashCode() {
            int result = this.memberFunctions != null ? this.memberFunctions.hashCode() : 0;
            return result;
        }
    }
}
