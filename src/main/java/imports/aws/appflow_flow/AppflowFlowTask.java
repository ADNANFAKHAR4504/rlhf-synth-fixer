package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.016Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowTask")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowTask.Jsii$Proxy.class)
public interface AppflowFlowTask extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#task_type AppflowFlow#task_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTaskType();

    /**
     * connector_operator block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#connector_operator AppflowFlow#connector_operator}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getConnectorOperator() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#destination_field AppflowFlow#destination_field}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDestinationField() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#source_fields AppflowFlow#source_fields}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSourceFields() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#task_properties AppflowFlow#task_properties}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTaskProperties() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowTask}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowTask}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowTask> {
        java.lang.String taskType;
        java.lang.Object connectorOperator;
        java.lang.String destinationField;
        java.util.List<java.lang.String> sourceFields;
        java.util.Map<java.lang.String, java.lang.String> taskProperties;

        /**
         * Sets the value of {@link AppflowFlowTask#getTaskType}
         * @param taskType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#task_type AppflowFlow#task_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder taskType(java.lang.String taskType) {
            this.taskType = taskType;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTask#getConnectorOperator}
         * @param connectorOperator connector_operator block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#connector_operator AppflowFlow#connector_operator}
         * @return {@code this}
         */
        public Builder connectorOperator(com.hashicorp.cdktf.IResolvable connectorOperator) {
            this.connectorOperator = connectorOperator;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTask#getConnectorOperator}
         * @param connectorOperator connector_operator block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#connector_operator AppflowFlow#connector_operator}
         * @return {@code this}
         */
        public Builder connectorOperator(java.util.List<? extends imports.aws.appflow_flow.AppflowFlowTaskConnectorOperator> connectorOperator) {
            this.connectorOperator = connectorOperator;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTask#getDestinationField}
         * @param destinationField Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#destination_field AppflowFlow#destination_field}.
         * @return {@code this}
         */
        public Builder destinationField(java.lang.String destinationField) {
            this.destinationField = destinationField;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTask#getSourceFields}
         * @param sourceFields Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#source_fields AppflowFlow#source_fields}.
         * @return {@code this}
         */
        public Builder sourceFields(java.util.List<java.lang.String> sourceFields) {
            this.sourceFields = sourceFields;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowTask#getTaskProperties}
         * @param taskProperties Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#task_properties AppflowFlow#task_properties}.
         * @return {@code this}
         */
        public Builder taskProperties(java.util.Map<java.lang.String, java.lang.String> taskProperties) {
            this.taskProperties = taskProperties;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowTask}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowTask build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowTask}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowTask {
        private final java.lang.String taskType;
        private final java.lang.Object connectorOperator;
        private final java.lang.String destinationField;
        private final java.util.List<java.lang.String> sourceFields;
        private final java.util.Map<java.lang.String, java.lang.String> taskProperties;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.taskType = software.amazon.jsii.Kernel.get(this, "taskType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connectorOperator = software.amazon.jsii.Kernel.get(this, "connectorOperator", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.destinationField = software.amazon.jsii.Kernel.get(this, "destinationField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceFields = software.amazon.jsii.Kernel.get(this, "sourceFields", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.taskProperties = software.amazon.jsii.Kernel.get(this, "taskProperties", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.taskType = java.util.Objects.requireNonNull(builder.taskType, "taskType is required");
            this.connectorOperator = builder.connectorOperator;
            this.destinationField = builder.destinationField;
            this.sourceFields = builder.sourceFields;
            this.taskProperties = builder.taskProperties;
        }

        @Override
        public final java.lang.String getTaskType() {
            return this.taskType;
        }

        @Override
        public final java.lang.Object getConnectorOperator() {
            return this.connectorOperator;
        }

        @Override
        public final java.lang.String getDestinationField() {
            return this.destinationField;
        }

        @Override
        public final java.util.List<java.lang.String> getSourceFields() {
            return this.sourceFields;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTaskProperties() {
            return this.taskProperties;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("taskType", om.valueToTree(this.getTaskType()));
            if (this.getConnectorOperator() != null) {
                data.set("connectorOperator", om.valueToTree(this.getConnectorOperator()));
            }
            if (this.getDestinationField() != null) {
                data.set("destinationField", om.valueToTree(this.getDestinationField()));
            }
            if (this.getSourceFields() != null) {
                data.set("sourceFields", om.valueToTree(this.getSourceFields()));
            }
            if (this.getTaskProperties() != null) {
                data.set("taskProperties", om.valueToTree(this.getTaskProperties()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowTask"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowTask.Jsii$Proxy that = (AppflowFlowTask.Jsii$Proxy) o;

            if (!taskType.equals(that.taskType)) return false;
            if (this.connectorOperator != null ? !this.connectorOperator.equals(that.connectorOperator) : that.connectorOperator != null) return false;
            if (this.destinationField != null ? !this.destinationField.equals(that.destinationField) : that.destinationField != null) return false;
            if (this.sourceFields != null ? !this.sourceFields.equals(that.sourceFields) : that.sourceFields != null) return false;
            return this.taskProperties != null ? this.taskProperties.equals(that.taskProperties) : that.taskProperties == null;
        }

        @Override
        public final int hashCode() {
            int result = this.taskType.hashCode();
            result = 31 * result + (this.connectorOperator != null ? this.connectorOperator.hashCode() : 0);
            result = 31 * result + (this.destinationField != null ? this.destinationField.hashCode() : 0);
            result = 31 * result + (this.sourceFields != null ? this.sourceFields.hashCode() : 0);
            result = 31 * result + (this.taskProperties != null ? this.taskProperties.hashCode() : 0);
            return result;
        }
    }
}
