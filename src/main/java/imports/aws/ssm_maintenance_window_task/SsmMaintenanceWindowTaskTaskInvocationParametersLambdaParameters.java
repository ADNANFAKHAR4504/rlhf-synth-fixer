package imports.aws.ssm_maintenance_window_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.503Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmMaintenanceWindowTask.SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters")
@software.amazon.jsii.Jsii.Proxy(SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters.Jsii$Proxy.class)
public interface SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#client_context SsmMaintenanceWindowTask#client_context}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClientContext() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#payload SsmMaintenanceWindowTask#payload}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPayload() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#qualifier SsmMaintenanceWindowTask#qualifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getQualifier() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters> {
        java.lang.String clientContext;
        java.lang.String payload;
        java.lang.String qualifier;

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters#getClientContext}
         * @param clientContext Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#client_context SsmMaintenanceWindowTask#client_context}.
         * @return {@code this}
         */
        public Builder clientContext(java.lang.String clientContext) {
            this.clientContext = clientContext;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters#getPayload}
         * @param payload Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#payload SsmMaintenanceWindowTask#payload}.
         * @return {@code this}
         */
        public Builder payload(java.lang.String payload) {
            this.payload = payload;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters#getQualifier}
         * @param qualifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#qualifier SsmMaintenanceWindowTask#qualifier}.
         * @return {@code this}
         */
        public Builder qualifier(java.lang.String qualifier) {
            this.qualifier = qualifier;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters {
        private final java.lang.String clientContext;
        private final java.lang.String payload;
        private final java.lang.String qualifier;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.clientContext = software.amazon.jsii.Kernel.get(this, "clientContext", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.payload = software.amazon.jsii.Kernel.get(this, "payload", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.qualifier = software.amazon.jsii.Kernel.get(this, "qualifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.clientContext = builder.clientContext;
            this.payload = builder.payload;
            this.qualifier = builder.qualifier;
        }

        @Override
        public final java.lang.String getClientContext() {
            return this.clientContext;
        }

        @Override
        public final java.lang.String getPayload() {
            return this.payload;
        }

        @Override
        public final java.lang.String getQualifier() {
            return this.qualifier;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getClientContext() != null) {
                data.set("clientContext", om.valueToTree(this.getClientContext()));
            }
            if (this.getPayload() != null) {
                data.set("payload", om.valueToTree(this.getPayload()));
            }
            if (this.getQualifier() != null) {
                data.set("qualifier", om.valueToTree(this.getQualifier()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmMaintenanceWindowTask.SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters.Jsii$Proxy that = (SsmMaintenanceWindowTaskTaskInvocationParametersLambdaParameters.Jsii$Proxy) o;

            if (this.clientContext != null ? !this.clientContext.equals(that.clientContext) : that.clientContext != null) return false;
            if (this.payload != null ? !this.payload.equals(that.payload) : that.payload != null) return false;
            return this.qualifier != null ? this.qualifier.equals(that.qualifier) : that.qualifier == null;
        }

        @Override
        public final int hashCode() {
            int result = this.clientContext != null ? this.clientContext.hashCode() : 0;
            result = 31 * result + (this.payload != null ? this.payload.hashCode() : 0);
            result = 31 * result + (this.qualifier != null ? this.qualifier.hashCode() : 0);
            return result;
        }
    }
}
