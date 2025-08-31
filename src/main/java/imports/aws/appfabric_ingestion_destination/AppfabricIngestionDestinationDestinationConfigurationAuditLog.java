package imports.aws.appfabric_ingestion_destination;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.995Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appfabricIngestionDestination.AppfabricIngestionDestinationDestinationConfigurationAuditLog")
@software.amazon.jsii.Jsii.Proxy(AppfabricIngestionDestinationDestinationConfigurationAuditLog.Jsii$Proxy.class)
public interface AppfabricIngestionDestinationDestinationConfigurationAuditLog extends software.amazon.jsii.JsiiSerializable {

    /**
     * destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#destination AppfabricIngestionDestination#destination}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDestination() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppfabricIngestionDestinationDestinationConfigurationAuditLog}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppfabricIngestionDestinationDestinationConfigurationAuditLog}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppfabricIngestionDestinationDestinationConfigurationAuditLog> {
        java.lang.Object destination;

        /**
         * Sets the value of {@link AppfabricIngestionDestinationDestinationConfigurationAuditLog#getDestination}
         * @param destination destination block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#destination AppfabricIngestionDestination#destination}
         * @return {@code this}
         */
        public Builder destination(com.hashicorp.cdktf.IResolvable destination) {
            this.destination = destination;
            return this;
        }

        /**
         * Sets the value of {@link AppfabricIngestionDestinationDestinationConfigurationAuditLog#getDestination}
         * @param destination destination block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#destination AppfabricIngestionDestination#destination}
         * @return {@code this}
         */
        public Builder destination(java.util.List<? extends imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationDestinationConfigurationAuditLogDestination> destination) {
            this.destination = destination;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppfabricIngestionDestinationDestinationConfigurationAuditLog}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppfabricIngestionDestinationDestinationConfigurationAuditLog build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppfabricIngestionDestinationDestinationConfigurationAuditLog}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppfabricIngestionDestinationDestinationConfigurationAuditLog {
        private final java.lang.Object destination;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destination = software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destination = builder.destination;
        }

        @Override
        public final java.lang.Object getDestination() {
            return this.destination;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDestination() != null) {
                data.set("destination", om.valueToTree(this.getDestination()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appfabricIngestionDestination.AppfabricIngestionDestinationDestinationConfigurationAuditLog"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppfabricIngestionDestinationDestinationConfigurationAuditLog.Jsii$Proxy that = (AppfabricIngestionDestinationDestinationConfigurationAuditLog.Jsii$Proxy) o;

            return this.destination != null ? this.destination.equals(that.destination) : that.destination == null;
        }

        @Override
        public final int hashCode() {
            int result = this.destination != null ? this.destination.hashCode() : 0;
            return result;
        }
    }
}
