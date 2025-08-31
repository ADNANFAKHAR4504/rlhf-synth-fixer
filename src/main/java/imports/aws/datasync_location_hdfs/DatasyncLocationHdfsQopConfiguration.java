package imports.aws.datasync_location_hdfs;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.948Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncLocationHdfs.DatasyncLocationHdfsQopConfiguration")
@software.amazon.jsii.Jsii.Proxy(DatasyncLocationHdfsQopConfiguration.Jsii$Proxy.class)
public interface DatasyncLocationHdfsQopConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#data_transfer_protection DatasyncLocationHdfs#data_transfer_protection}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataTransferProtection() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#rpc_protection DatasyncLocationHdfs#rpc_protection}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRpcProtection() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatasyncLocationHdfsQopConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatasyncLocationHdfsQopConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatasyncLocationHdfsQopConfiguration> {
        java.lang.String dataTransferProtection;
        java.lang.String rpcProtection;

        /**
         * Sets the value of {@link DatasyncLocationHdfsQopConfiguration#getDataTransferProtection}
         * @param dataTransferProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#data_transfer_protection DatasyncLocationHdfs#data_transfer_protection}.
         * @return {@code this}
         */
        public Builder dataTransferProtection(java.lang.String dataTransferProtection) {
            this.dataTransferProtection = dataTransferProtection;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsQopConfiguration#getRpcProtection}
         * @param rpcProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#rpc_protection DatasyncLocationHdfs#rpc_protection}.
         * @return {@code this}
         */
        public Builder rpcProtection(java.lang.String rpcProtection) {
            this.rpcProtection = rpcProtection;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatasyncLocationHdfsQopConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatasyncLocationHdfsQopConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatasyncLocationHdfsQopConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatasyncLocationHdfsQopConfiguration {
        private final java.lang.String dataTransferProtection;
        private final java.lang.String rpcProtection;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataTransferProtection = software.amazon.jsii.Kernel.get(this, "dataTransferProtection", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rpcProtection = software.amazon.jsii.Kernel.get(this, "rpcProtection", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataTransferProtection = builder.dataTransferProtection;
            this.rpcProtection = builder.rpcProtection;
        }

        @Override
        public final java.lang.String getDataTransferProtection() {
            return this.dataTransferProtection;
        }

        @Override
        public final java.lang.String getRpcProtection() {
            return this.rpcProtection;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDataTransferProtection() != null) {
                data.set("dataTransferProtection", om.valueToTree(this.getDataTransferProtection()));
            }
            if (this.getRpcProtection() != null) {
                data.set("rpcProtection", om.valueToTree(this.getRpcProtection()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datasyncLocationHdfs.DatasyncLocationHdfsQopConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatasyncLocationHdfsQopConfiguration.Jsii$Proxy that = (DatasyncLocationHdfsQopConfiguration.Jsii$Proxy) o;

            if (this.dataTransferProtection != null ? !this.dataTransferProtection.equals(that.dataTransferProtection) : that.dataTransferProtection != null) return false;
            return this.rpcProtection != null ? this.rpcProtection.equals(that.rpcProtection) : that.rpcProtection == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dataTransferProtection != null ? this.dataTransferProtection.hashCode() : 0;
            result = 31 * result + (this.rpcProtection != null ? this.rpcProtection.hashCode() : 0);
            return result;
        }
    }
}
