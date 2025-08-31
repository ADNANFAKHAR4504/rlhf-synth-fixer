package imports.aws.bcmdataexports_export;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.137Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bcmdataexportsExport.BcmdataexportsExportExportDestinationConfigurations")
@software.amazon.jsii.Jsii.Proxy(BcmdataexportsExportExportDestinationConfigurations.Jsii$Proxy.class)
public interface BcmdataexportsExportExportDestinationConfigurations extends software.amazon.jsii.JsiiSerializable {

    /**
     * s3_destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#s3_destination BcmdataexportsExport#s3_destination}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getS3Destination() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BcmdataexportsExportExportDestinationConfigurations}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BcmdataexportsExportExportDestinationConfigurations}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BcmdataexportsExportExportDestinationConfigurations> {
        java.lang.Object s3Destination;

        /**
         * Sets the value of {@link BcmdataexportsExportExportDestinationConfigurations#getS3Destination}
         * @param s3Destination s3_destination block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#s3_destination BcmdataexportsExport#s3_destination}
         * @return {@code this}
         */
        public Builder s3Destination(com.hashicorp.cdktf.IResolvable s3Destination) {
            this.s3Destination = s3Destination;
            return this;
        }

        /**
         * Sets the value of {@link BcmdataexportsExportExportDestinationConfigurations#getS3Destination}
         * @param s3Destination s3_destination block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#s3_destination BcmdataexportsExport#s3_destination}
         * @return {@code this}
         */
        public Builder s3Destination(java.util.List<? extends imports.aws.bcmdataexports_export.BcmdataexportsExportExportDestinationConfigurationsS3Destination> s3Destination) {
            this.s3Destination = s3Destination;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BcmdataexportsExportExportDestinationConfigurations}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BcmdataexportsExportExportDestinationConfigurations build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BcmdataexportsExportExportDestinationConfigurations}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BcmdataexportsExportExportDestinationConfigurations {
        private final java.lang.Object s3Destination;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3Destination = software.amazon.jsii.Kernel.get(this, "s3Destination", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3Destination = builder.s3Destination;
        }

        @Override
        public final java.lang.Object getS3Destination() {
            return this.s3Destination;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getS3Destination() != null) {
                data.set("s3Destination", om.valueToTree(this.getS3Destination()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bcmdataexportsExport.BcmdataexportsExportExportDestinationConfigurations"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BcmdataexportsExportExportDestinationConfigurations.Jsii$Proxy that = (BcmdataexportsExportExportDestinationConfigurations.Jsii$Proxy) o;

            return this.s3Destination != null ? this.s3Destination.equals(that.s3Destination) : that.s3Destination == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3Destination != null ? this.s3Destination.hashCode() : 0;
            return result;
        }
    }
}
