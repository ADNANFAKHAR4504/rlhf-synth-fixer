package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.014Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesCustomConnector")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowSourceFlowConfigSourceConnectorPropertiesCustomConnector.Jsii$Proxy.class)
public interface AppflowFlowSourceFlowConfigSourceConnectorPropertiesCustomConnector extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#entity_name AppflowFlow#entity_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEntityName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#custom_properties AppflowFlow#custom_properties}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getCustomProperties() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesCustomConnector}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesCustomConnector}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowSourceFlowConfigSourceConnectorPropertiesCustomConnector> {
        java.lang.String entityName;
        java.util.Map<java.lang.String, java.lang.String> customProperties;

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesCustomConnector#getEntityName}
         * @param entityName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#entity_name AppflowFlow#entity_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder entityName(java.lang.String entityName) {
            this.entityName = entityName;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesCustomConnector#getCustomProperties}
         * @param customProperties Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#custom_properties AppflowFlow#custom_properties}.
         * @return {@code this}
         */
        public Builder customProperties(java.util.Map<java.lang.String, java.lang.String> customProperties) {
            this.customProperties = customProperties;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesCustomConnector}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowSourceFlowConfigSourceConnectorPropertiesCustomConnector build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowSourceFlowConfigSourceConnectorPropertiesCustomConnector}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowSourceFlowConfigSourceConnectorPropertiesCustomConnector {
        private final java.lang.String entityName;
        private final java.util.Map<java.lang.String, java.lang.String> customProperties;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.entityName = software.amazon.jsii.Kernel.get(this, "entityName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customProperties = software.amazon.jsii.Kernel.get(this, "customProperties", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.entityName = java.util.Objects.requireNonNull(builder.entityName, "entityName is required");
            this.customProperties = builder.customProperties;
        }

        @Override
        public final java.lang.String getEntityName() {
            return this.entityName;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getCustomProperties() {
            return this.customProperties;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("entityName", om.valueToTree(this.getEntityName()));
            if (this.getCustomProperties() != null) {
                data.set("customProperties", om.valueToTree(this.getCustomProperties()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesCustomConnector"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowSourceFlowConfigSourceConnectorPropertiesCustomConnector.Jsii$Proxy that = (AppflowFlowSourceFlowConfigSourceConnectorPropertiesCustomConnector.Jsii$Proxy) o;

            if (!entityName.equals(that.entityName)) return false;
            return this.customProperties != null ? this.customProperties.equals(that.customProperties) : that.customProperties == null;
        }

        @Override
        public final int hashCode() {
            int result = this.entityName.hashCode();
            result = 31 * result + (this.customProperties != null ? this.customProperties.hashCode() : 0);
            return result;
        }
    }
}
