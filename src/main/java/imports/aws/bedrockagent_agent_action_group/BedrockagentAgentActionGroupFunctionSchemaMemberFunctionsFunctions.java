package imports.aws.bedrockagent_agent_action_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.156Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgentActionGroup.BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctions")
@software.amazon.jsii.Jsii.Proxy(BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctions.Jsii$Proxy.class)
public interface BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#name BedrockagentAgentActionGroup#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#description BedrockagentAgentActionGroup#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#parameters BedrockagentAgentActionGroup#parameters}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getParameters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctions> {
        java.lang.String name;
        java.lang.String description;
        java.lang.Object parameters;

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctions#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#name BedrockagentAgentActionGroup#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctions#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#description BedrockagentAgentActionGroup#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctions#getParameters}
         * @param parameters parameters block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#parameters BedrockagentAgentActionGroup#parameters}
         * @return {@code this}
         */
        public Builder parameters(com.hashicorp.cdktf.IResolvable parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctions#getParameters}
         * @param parameters parameters block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#parameters BedrockagentAgentActionGroup#parameters}
         * @return {@code this}
         */
        public Builder parameters(java.util.List<? extends imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctionsParameters> parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctions {
        private final java.lang.String name;
        private final java.lang.String description;
        private final java.lang.Object parameters;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameters = software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.description = builder.description;
            this.parameters = builder.parameters;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getParameters() {
            return this.parameters;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getParameters() != null) {
                data.set("parameters", om.valueToTree(this.getParameters()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentAgentActionGroup.BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctions.Jsii$Proxy that = (BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctions.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            return this.parameters != null ? this.parameters.equals(that.parameters) : that.parameters == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.parameters != null ? this.parameters.hashCode() : 0);
            return result;
        }
    }
}
