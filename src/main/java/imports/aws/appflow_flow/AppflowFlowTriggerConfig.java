package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.016Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowTriggerConfig")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowTriggerConfig.Jsii$Proxy.class)
public interface AppflowFlowTriggerConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#trigger_type AppflowFlow#trigger_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTriggerType();

    /**
     * trigger_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#trigger_properties AppflowFlow#trigger_properties}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowTriggerConfigTriggerProperties getTriggerProperties() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowTriggerConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowTriggerConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowTriggerConfig> {
        java.lang.String triggerType;
        imports.aws.appflow_flow.AppflowFlowTriggerConfigTriggerProperties triggerProperties;

        /**
         * Sets the value of {@link AppflowFlowTriggerConfig#getTriggerType}
         * @param triggerType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#trigger_type AppflowFlow#trigger_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder triggerType(java.lang.String triggerType) {
            this.triggerType = triggerType;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTriggerConfig#getTriggerProperties}
         * @param triggerProperties trigger_properties block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#trigger_properties AppflowFlow#trigger_properties}
         * @return {@code this}
         */
        public Builder triggerProperties(imports.aws.appflow_flow.AppflowFlowTriggerConfigTriggerProperties triggerProperties) {
            this.triggerProperties = triggerProperties;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowTriggerConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowTriggerConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowTriggerConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowTriggerConfig {
        private final java.lang.String triggerType;
        private final imports.aws.appflow_flow.AppflowFlowTriggerConfigTriggerProperties triggerProperties;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.triggerType = software.amazon.jsii.Kernel.get(this, "triggerType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.triggerProperties = software.amazon.jsii.Kernel.get(this, "triggerProperties", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowTriggerConfigTriggerProperties.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.triggerType = java.util.Objects.requireNonNull(builder.triggerType, "triggerType is required");
            this.triggerProperties = builder.triggerProperties;
        }

        @Override
        public final java.lang.String getTriggerType() {
            return this.triggerType;
        }

        @Override
        public final imports.aws.appflow_flow.AppflowFlowTriggerConfigTriggerProperties getTriggerProperties() {
            return this.triggerProperties;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("triggerType", om.valueToTree(this.getTriggerType()));
            if (this.getTriggerProperties() != null) {
                data.set("triggerProperties", om.valueToTree(this.getTriggerProperties()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowTriggerConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowTriggerConfig.Jsii$Proxy that = (AppflowFlowTriggerConfig.Jsii$Proxy) o;

            if (!triggerType.equals(that.triggerType)) return false;
            return this.triggerProperties != null ? this.triggerProperties.equals(that.triggerProperties) : that.triggerProperties == null;
        }

        @Override
        public final int hashCode() {
            int result = this.triggerType.hashCode();
            result = 31 * result + (this.triggerProperties != null ? this.triggerProperties.hashCode() : 0);
            return result;
        }
    }
}
