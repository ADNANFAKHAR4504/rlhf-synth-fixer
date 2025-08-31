package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.013Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendesk")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendesk.Jsii$Proxy.class)
public interface AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendesk extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#object AppflowFlow#object}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getObject();

    /**
     * error_handling_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#error_handling_config AppflowFlow#error_handling_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendeskErrorHandlingConfig getErrorHandlingConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#id_field_names AppflowFlow#id_field_names}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIdFieldNames() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#write_operation_type AppflowFlow#write_operation_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWriteOperationType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendesk}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendesk}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendesk> {
        java.lang.String object;
        imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendeskErrorHandlingConfig errorHandlingConfig;
        java.util.List<java.lang.String> idFieldNames;
        java.lang.String writeOperationType;

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendesk#getObject}
         * @param object Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#object AppflowFlow#object}. This parameter is required.
         * @return {@code this}
         */
        public Builder object(java.lang.String object) {
            this.object = object;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendesk#getErrorHandlingConfig}
         * @param errorHandlingConfig error_handling_config block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#error_handling_config AppflowFlow#error_handling_config}
         * @return {@code this}
         */
        public Builder errorHandlingConfig(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendeskErrorHandlingConfig errorHandlingConfig) {
            this.errorHandlingConfig = errorHandlingConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendesk#getIdFieldNames}
         * @param idFieldNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#id_field_names AppflowFlow#id_field_names}.
         * @return {@code this}
         */
        public Builder idFieldNames(java.util.List<java.lang.String> idFieldNames) {
            this.idFieldNames = idFieldNames;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendesk#getWriteOperationType}
         * @param writeOperationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#write_operation_type AppflowFlow#write_operation_type}.
         * @return {@code this}
         */
        public Builder writeOperationType(java.lang.String writeOperationType) {
            this.writeOperationType = writeOperationType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendesk}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendesk build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendesk}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendesk {
        private final java.lang.String object;
        private final imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendeskErrorHandlingConfig errorHandlingConfig;
        private final java.util.List<java.lang.String> idFieldNames;
        private final java.lang.String writeOperationType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.object = software.amazon.jsii.Kernel.get(this, "object", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.errorHandlingConfig = software.amazon.jsii.Kernel.get(this, "errorHandlingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendeskErrorHandlingConfig.class));
            this.idFieldNames = software.amazon.jsii.Kernel.get(this, "idFieldNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.writeOperationType = software.amazon.jsii.Kernel.get(this, "writeOperationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.object = java.util.Objects.requireNonNull(builder.object, "object is required");
            this.errorHandlingConfig = builder.errorHandlingConfig;
            this.idFieldNames = builder.idFieldNames;
            this.writeOperationType = builder.writeOperationType;
        }

        @Override
        public final java.lang.String getObject() {
            return this.object;
        }

        @Override
        public final imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendeskErrorHandlingConfig getErrorHandlingConfig() {
            return this.errorHandlingConfig;
        }

        @Override
        public final java.util.List<java.lang.String> getIdFieldNames() {
            return this.idFieldNames;
        }

        @Override
        public final java.lang.String getWriteOperationType() {
            return this.writeOperationType;
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
            if (this.getIdFieldNames() != null) {
                data.set("idFieldNames", om.valueToTree(this.getIdFieldNames()));
            }
            if (this.getWriteOperationType() != null) {
                data.set("writeOperationType", om.valueToTree(this.getWriteOperationType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendesk"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendesk.Jsii$Proxy that = (AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesZendesk.Jsii$Proxy) o;

            if (!object.equals(that.object)) return false;
            if (this.errorHandlingConfig != null ? !this.errorHandlingConfig.equals(that.errorHandlingConfig) : that.errorHandlingConfig != null) return false;
            if (this.idFieldNames != null ? !this.idFieldNames.equals(that.idFieldNames) : that.idFieldNames != null) return false;
            return this.writeOperationType != null ? this.writeOperationType.equals(that.writeOperationType) : that.writeOperationType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.object.hashCode();
            result = 31 * result + (this.errorHandlingConfig != null ? this.errorHandlingConfig.hashCode() : 0);
            result = 31 * result + (this.idFieldNames != null ? this.idFieldNames.hashCode() : 0);
            result = 31 * result + (this.writeOperationType != null ? this.writeOperationType.hashCode() : 0);
            return result;
        }
    }
}
