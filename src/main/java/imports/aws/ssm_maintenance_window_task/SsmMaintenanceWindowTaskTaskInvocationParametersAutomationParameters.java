package imports.aws.ssm_maintenance_window_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.503Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmMaintenanceWindowTask.SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters")
@software.amazon.jsii.Jsii.Proxy(SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters.Jsii$Proxy.class)
public interface SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#document_version SsmMaintenanceWindowTask#document_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDocumentVersion() {
        return null;
    }

    /**
     * parameter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#parameter SsmMaintenanceWindowTask#parameter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getParameter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters> {
        java.lang.String documentVersion;
        java.lang.Object parameter;

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters#getDocumentVersion}
         * @param documentVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#document_version SsmMaintenanceWindowTask#document_version}.
         * @return {@code this}
         */
        public Builder documentVersion(java.lang.String documentVersion) {
            this.documentVersion = documentVersion;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters#getParameter}
         * @param parameter parameter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#parameter SsmMaintenanceWindowTask#parameter}
         * @return {@code this}
         */
        public Builder parameter(com.hashicorp.cdktf.IResolvable parameter) {
            this.parameter = parameter;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters#getParameter}
         * @param parameter parameter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#parameter SsmMaintenanceWindowTask#parameter}
         * @return {@code this}
         */
        public Builder parameter(java.util.List<? extends imports.aws.ssm_maintenance_window_task.SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParametersParameter> parameter) {
            this.parameter = parameter;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters {
        private final java.lang.String documentVersion;
        private final java.lang.Object parameter;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.documentVersion = software.amazon.jsii.Kernel.get(this, "documentVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameter = software.amazon.jsii.Kernel.get(this, "parameter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.documentVersion = builder.documentVersion;
            this.parameter = builder.parameter;
        }

        @Override
        public final java.lang.String getDocumentVersion() {
            return this.documentVersion;
        }

        @Override
        public final java.lang.Object getParameter() {
            return this.parameter;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDocumentVersion() != null) {
                data.set("documentVersion", om.valueToTree(this.getDocumentVersion()));
            }
            if (this.getParameter() != null) {
                data.set("parameter", om.valueToTree(this.getParameter()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmMaintenanceWindowTask.SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters.Jsii$Proxy that = (SsmMaintenanceWindowTaskTaskInvocationParametersAutomationParameters.Jsii$Proxy) o;

            if (this.documentVersion != null ? !this.documentVersion.equals(that.documentVersion) : that.documentVersion != null) return false;
            return this.parameter != null ? this.parameter.equals(that.parameter) : that.parameter == null;
        }

        @Override
        public final int hashCode() {
            int result = this.documentVersion != null ? this.documentVersion.hashCode() : 0;
            result = 31 * result + (this.parameter != null ? this.parameter.hashCode() : 0);
            return result;
        }
    }
}
