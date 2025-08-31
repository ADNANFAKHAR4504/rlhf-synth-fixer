package imports.aws.appfabric_ingestion_destination;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.995Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appfabricIngestionDestination.AppfabricIngestionDestinationDestinationConfiguration")
@software.amazon.jsii.Jsii.Proxy(AppfabricIngestionDestinationDestinationConfiguration.Jsii$Proxy.class)
public interface AppfabricIngestionDestinationDestinationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * audit_log block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#audit_log AppfabricIngestionDestination#audit_log}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAuditLog() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppfabricIngestionDestinationDestinationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppfabricIngestionDestinationDestinationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppfabricIngestionDestinationDestinationConfiguration> {
        java.lang.Object auditLog;

        /**
         * Sets the value of {@link AppfabricIngestionDestinationDestinationConfiguration#getAuditLog}
         * @param auditLog audit_log block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#audit_log AppfabricIngestionDestination#audit_log}
         * @return {@code this}
         */
        public Builder auditLog(com.hashicorp.cdktf.IResolvable auditLog) {
            this.auditLog = auditLog;
            return this;
        }

        /**
         * Sets the value of {@link AppfabricIngestionDestinationDestinationConfiguration#getAuditLog}
         * @param auditLog audit_log block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#audit_log AppfabricIngestionDestination#audit_log}
         * @return {@code this}
         */
        public Builder auditLog(java.util.List<? extends imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationDestinationConfigurationAuditLog> auditLog) {
            this.auditLog = auditLog;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppfabricIngestionDestinationDestinationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppfabricIngestionDestinationDestinationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppfabricIngestionDestinationDestinationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppfabricIngestionDestinationDestinationConfiguration {
        private final java.lang.Object auditLog;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.auditLog = software.amazon.jsii.Kernel.get(this, "auditLog", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.auditLog = builder.auditLog;
        }

        @Override
        public final java.lang.Object getAuditLog() {
            return this.auditLog;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAuditLog() != null) {
                data.set("auditLog", om.valueToTree(this.getAuditLog()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appfabricIngestionDestination.AppfabricIngestionDestinationDestinationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppfabricIngestionDestinationDestinationConfiguration.Jsii$Proxy that = (AppfabricIngestionDestinationDestinationConfiguration.Jsii$Proxy) o;

            return this.auditLog != null ? this.auditLog.equals(that.auditLog) : that.auditLog == null;
        }

        @Override
        public final int hashCode() {
            int result = this.auditLog != null ? this.auditLog.hashCode() : 0;
            return result;
        }
    }
}
