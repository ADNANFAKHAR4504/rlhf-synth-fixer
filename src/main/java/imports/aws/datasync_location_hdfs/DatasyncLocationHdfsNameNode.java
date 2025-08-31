package imports.aws.datasync_location_hdfs;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.947Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncLocationHdfs.DatasyncLocationHdfsNameNode")
@software.amazon.jsii.Jsii.Proxy(DatasyncLocationHdfsNameNode.Jsii$Proxy.class)
public interface DatasyncLocationHdfsNameNode extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#hostname DatasyncLocationHdfs#hostname}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHostname();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#port DatasyncLocationHdfs#port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPort();

    /**
     * @return a {@link Builder} of {@link DatasyncLocationHdfsNameNode}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatasyncLocationHdfsNameNode}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatasyncLocationHdfsNameNode> {
        java.lang.String hostname;
        java.lang.Number port;

        /**
         * Sets the value of {@link DatasyncLocationHdfsNameNode#getHostname}
         * @param hostname Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#hostname DatasyncLocationHdfs#hostname}. This parameter is required.
         * @return {@code this}
         */
        public Builder hostname(java.lang.String hostname) {
            this.hostname = hostname;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsNameNode#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#port DatasyncLocationHdfs#port}. This parameter is required.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatasyncLocationHdfsNameNode}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatasyncLocationHdfsNameNode build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatasyncLocationHdfsNameNode}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatasyncLocationHdfsNameNode {
        private final java.lang.String hostname;
        private final java.lang.Number port;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.hostname = software.amazon.jsii.Kernel.get(this, "hostname", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.hostname = java.util.Objects.requireNonNull(builder.hostname, "hostname is required");
            this.port = java.util.Objects.requireNonNull(builder.port, "port is required");
        }

        @Override
        public final java.lang.String getHostname() {
            return this.hostname;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("hostname", om.valueToTree(this.getHostname()));
            data.set("port", om.valueToTree(this.getPort()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datasyncLocationHdfs.DatasyncLocationHdfsNameNode"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatasyncLocationHdfsNameNode.Jsii$Proxy that = (DatasyncLocationHdfsNameNode.Jsii$Proxy) o;

            if (!hostname.equals(that.hostname)) return false;
            return this.port.equals(that.port);
        }

        @Override
        public final int hashCode() {
            int result = this.hostname.hashCode();
            result = 31 * result + (this.port.hashCode());
            return result;
        }
    }
}
