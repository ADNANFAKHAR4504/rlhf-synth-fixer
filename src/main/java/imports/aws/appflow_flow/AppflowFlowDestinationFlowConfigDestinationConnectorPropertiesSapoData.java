package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.012Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoData")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoData.Jsii$Proxy.class)
public interface AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoData extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#object_path AppflowFlow#object_path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getObjectPath();

    /**
     * error_handling_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#error_handling_config AppflowFlow#error_handling_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataErrorHandlingConfig getErrorHandlingConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#id_field_names AppflowFlow#id_field_names}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIdFieldNames() {
        return null;
    }

    /**
     * success_response_handling_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#success_response_handling_config AppflowFlow#success_response_handling_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig getSuccessResponseHandlingConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#write_operation_type AppflowFlow#write_operation_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWriteOperationType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoData}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoData}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoData> {
        java.lang.String objectPath;
        imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataErrorHandlingConfig errorHandlingConfig;
        java.util.List<java.lang.String> idFieldNames;
        imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig successResponseHandlingConfig;
        java.lang.String writeOperationType;

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoData#getObjectPath}
         * @param objectPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#object_path AppflowFlow#object_path}. This parameter is required.
         * @return {@code this}
         */
        public Builder objectPath(java.lang.String objectPath) {
            this.objectPath = objectPath;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoData#getErrorHandlingConfig}
         * @param errorHandlingConfig error_handling_config block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#error_handling_config AppflowFlow#error_handling_config}
         * @return {@code this}
         */
        public Builder errorHandlingConfig(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataErrorHandlingConfig errorHandlingConfig) {
            this.errorHandlingConfig = errorHandlingConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoData#getIdFieldNames}
         * @param idFieldNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#id_field_names AppflowFlow#id_field_names}.
         * @return {@code this}
         */
        public Builder idFieldNames(java.util.List<java.lang.String> idFieldNames) {
            this.idFieldNames = idFieldNames;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoData#getSuccessResponseHandlingConfig}
         * @param successResponseHandlingConfig success_response_handling_config block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#success_response_handling_config AppflowFlow#success_response_handling_config}
         * @return {@code this}
         */
        public Builder successResponseHandlingConfig(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig successResponseHandlingConfig) {
            this.successResponseHandlingConfig = successResponseHandlingConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoData#getWriteOperationType}
         * @param writeOperationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#write_operation_type AppflowFlow#write_operation_type}.
         * @return {@code this}
         */
        public Builder writeOperationType(java.lang.String writeOperationType) {
            this.writeOperationType = writeOperationType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoData}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoData build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoData}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoData {
        private final java.lang.String objectPath;
        private final imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataErrorHandlingConfig errorHandlingConfig;
        private final java.util.List<java.lang.String> idFieldNames;
        private final imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig successResponseHandlingConfig;
        private final java.lang.String writeOperationType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.objectPath = software.amazon.jsii.Kernel.get(this, "objectPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.errorHandlingConfig = software.amazon.jsii.Kernel.get(this, "errorHandlingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataErrorHandlingConfig.class));
            this.idFieldNames = software.amazon.jsii.Kernel.get(this, "idFieldNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.successResponseHandlingConfig = software.amazon.jsii.Kernel.get(this, "successResponseHandlingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig.class));
            this.writeOperationType = software.amazon.jsii.Kernel.get(this, "writeOperationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.objectPath = java.util.Objects.requireNonNull(builder.objectPath, "objectPath is required");
            this.errorHandlingConfig = builder.errorHandlingConfig;
            this.idFieldNames = builder.idFieldNames;
            this.successResponseHandlingConfig = builder.successResponseHandlingConfig;
            this.writeOperationType = builder.writeOperationType;
        }

        @Override
        public final java.lang.String getObjectPath() {
            return this.objectPath;
        }

        @Override
        public final imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataErrorHandlingConfig getErrorHandlingConfig() {
            return this.errorHandlingConfig;
        }

        @Override
        public final java.util.List<java.lang.String> getIdFieldNames() {
            return this.idFieldNames;
        }

        @Override
        public final imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoDataSuccessResponseHandlingConfig getSuccessResponseHandlingConfig() {
            return this.successResponseHandlingConfig;
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

            data.set("objectPath", om.valueToTree(this.getObjectPath()));
            if (this.getErrorHandlingConfig() != null) {
                data.set("errorHandlingConfig", om.valueToTree(this.getErrorHandlingConfig()));
            }
            if (this.getIdFieldNames() != null) {
                data.set("idFieldNames", om.valueToTree(this.getIdFieldNames()));
            }
            if (this.getSuccessResponseHandlingConfig() != null) {
                data.set("successResponseHandlingConfig", om.valueToTree(this.getSuccessResponseHandlingConfig()));
            }
            if (this.getWriteOperationType() != null) {
                data.set("writeOperationType", om.valueToTree(this.getWriteOperationType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoData"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoData.Jsii$Proxy that = (AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSapoData.Jsii$Proxy) o;

            if (!objectPath.equals(that.objectPath)) return false;
            if (this.errorHandlingConfig != null ? !this.errorHandlingConfig.equals(that.errorHandlingConfig) : that.errorHandlingConfig != null) return false;
            if (this.idFieldNames != null ? !this.idFieldNames.equals(that.idFieldNames) : that.idFieldNames != null) return false;
            if (this.successResponseHandlingConfig != null ? !this.successResponseHandlingConfig.equals(that.successResponseHandlingConfig) : that.successResponseHandlingConfig != null) return false;
            return this.writeOperationType != null ? this.writeOperationType.equals(that.writeOperationType) : that.writeOperationType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.objectPath.hashCode();
            result = 31 * result + (this.errorHandlingConfig != null ? this.errorHandlingConfig.hashCode() : 0);
            result = 31 * result + (this.idFieldNames != null ? this.idFieldNames.hashCode() : 0);
            result = 31 * result + (this.successResponseHandlingConfig != null ? this.successResponseHandlingConfig.hashCode() : 0);
            result = 31 * result + (this.writeOperationType != null ? this.writeOperationType.hashCode() : 0);
            return result;
        }
    }
}
