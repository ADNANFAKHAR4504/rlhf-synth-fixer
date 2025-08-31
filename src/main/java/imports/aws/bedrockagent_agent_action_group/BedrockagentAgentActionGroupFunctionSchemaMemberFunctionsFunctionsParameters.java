package imports.aws.bedrockagent_agent_action_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.156Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgentActionGroup.BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctionsParameters")
@software.amazon.jsii.Jsii.Proxy(BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctionsParameters.Jsii$Proxy.class)
public interface BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctionsParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#map_block_key BedrockagentAgentActionGroup#map_block_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMapBlockKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#type BedrockagentAgentActionGroup#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#description BedrockagentAgentActionGroup#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#required BedrockagentAgentActionGroup#required}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequired() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctionsParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctionsParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctionsParameters> {
        java.lang.String mapBlockKey;
        java.lang.String type;
        java.lang.String description;
        java.lang.Object required;

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctionsParameters#getMapBlockKey}
         * @param mapBlockKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#map_block_key BedrockagentAgentActionGroup#map_block_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder mapBlockKey(java.lang.String mapBlockKey) {
            this.mapBlockKey = mapBlockKey;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctionsParameters#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#type BedrockagentAgentActionGroup#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctionsParameters#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#description BedrockagentAgentActionGroup#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctionsParameters#getRequired}
         * @param required Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#required BedrockagentAgentActionGroup#required}.
         * @return {@code this}
         */
        public Builder required(java.lang.Boolean required) {
            this.required = required;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctionsParameters#getRequired}
         * @param required Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent_action_group#required BedrockagentAgentActionGroup#required}.
         * @return {@code this}
         */
        public Builder required(com.hashicorp.cdktf.IResolvable required) {
            this.required = required;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctionsParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctionsParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctionsParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctionsParameters {
        private final java.lang.String mapBlockKey;
        private final java.lang.String type;
        private final java.lang.String description;
        private final java.lang.Object required;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.mapBlockKey = software.amazon.jsii.Kernel.get(this, "mapBlockKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.required = software.amazon.jsii.Kernel.get(this, "required", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.mapBlockKey = java.util.Objects.requireNonNull(builder.mapBlockKey, "mapBlockKey is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.description = builder.description;
            this.required = builder.required;
        }

        @Override
        public final java.lang.String getMapBlockKey() {
            return this.mapBlockKey;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getRequired() {
            return this.required;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("mapBlockKey", om.valueToTree(this.getMapBlockKey()));
            data.set("type", om.valueToTree(this.getType()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getRequired() != null) {
                data.set("required", om.valueToTree(this.getRequired()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentAgentActionGroup.BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctionsParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctionsParameters.Jsii$Proxy that = (BedrockagentAgentActionGroupFunctionSchemaMemberFunctionsFunctionsParameters.Jsii$Proxy) o;

            if (!mapBlockKey.equals(that.mapBlockKey)) return false;
            if (!type.equals(that.type)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            return this.required != null ? this.required.equals(that.required) : that.required == null;
        }

        @Override
        public final int hashCode() {
            int result = this.mapBlockKey.hashCode();
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.required != null ? this.required.hashCode() : 0);
            return result;
        }
    }
}
