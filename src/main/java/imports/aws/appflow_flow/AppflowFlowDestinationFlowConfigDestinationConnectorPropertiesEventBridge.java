package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.008Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridge")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridge.Jsii$Proxy.class)
public interface AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridge extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#object AppflowFlow#object}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getObject();

    /**
     * error_handling_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#error_handling_config AppflowFlow#error_handling_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridgeErrorHandlingConfig getErrorHandlingConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridge}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridge}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridge> {
        java.lang.String object;
        imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridgeErrorHandlingConfig errorHandlingConfig;

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridge#getObject}
         * @param object Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#object AppflowFlow#object}. This parameter is required.
         * @return {@code this}
         */
        public Builder object(java.lang.String object) {
            this.object = object;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridge#getErrorHandlingConfig}
         * @param errorHandlingConfig error_handling_config block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#error_handling_config AppflowFlow#error_handling_config}
         * @return {@code this}
         */
        public Builder errorHandlingConfig(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridgeErrorHandlingConfig errorHandlingConfig) {
            this.errorHandlingConfig = errorHandlingConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridge}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridge build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridge}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridge {
        private final java.lang.String object;
        private final imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridgeErrorHandlingConfig errorHandlingConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.object = software.amazon.jsii.Kernel.get(this, "object", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.errorHandlingConfig = software.amazon.jsii.Kernel.get(this, "errorHandlingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridgeErrorHandlingConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.object = java.util.Objects.requireNonNull(builder.object, "object is required");
            this.errorHandlingConfig = builder.errorHandlingConfig;
        }

        @Override
        public final java.lang.String getObject() {
            return this.object;
        }

        @Override
        public final imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridgeErrorHandlingConfig getErrorHandlingConfig() {
            return this.errorHandlingConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("object", om.valueToTree(this.getObject()));
            if (this.getErrorHandlingConfig() != null) {
                data.set("errorHandlingConfig", om.valueToTree(this.getErrorHandlingConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridge"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridge.Jsii$Proxy that = (AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesEventBridge.Jsii$Proxy) o;

            if (!object.equals(that.object)) return false;
            return this.errorHandlingConfig != null ? this.errorHandlingConfig.equals(that.errorHandlingConfig) : that.errorHandlingConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.object.hashCode();
            result = 31 * result + (this.errorHandlingConfig != null ? this.errorHandlingConfig.hashCode() : 0);
            return result;
        }
    }
}
