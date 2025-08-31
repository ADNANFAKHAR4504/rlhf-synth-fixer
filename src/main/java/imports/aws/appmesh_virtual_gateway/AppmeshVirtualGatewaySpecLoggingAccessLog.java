package imports.aws.appmesh_virtual_gateway;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.039Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecLoggingAccessLog")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualGatewaySpecLoggingAccessLog.Jsii$Proxy.class)
public interface AppmeshVirtualGatewaySpecLoggingAccessLog extends software.amazon.jsii.JsiiSerializable {

    /**
     * file block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#file AppmeshVirtualGateway#file}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecLoggingAccessLogFile getFile() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualGatewaySpecLoggingAccessLog}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualGatewaySpecLoggingAccessLog}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualGatewaySpecLoggingAccessLog> {
        imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecLoggingAccessLogFile file;

        /**
         * Sets the value of {@link AppmeshVirtualGatewaySpecLoggingAccessLog#getFile}
         * @param file file block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#file AppmeshVirtualGateway#file}
         * @return {@code this}
         */
        public Builder file(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecLoggingAccessLogFile file) {
            this.file = file;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualGatewaySpecLoggingAccessLog}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualGatewaySpecLoggingAccessLog build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualGatewaySpecLoggingAccessLog}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualGatewaySpecLoggingAccessLog {
        private final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecLoggingAccessLogFile file;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.file = software.amazon.jsii.Kernel.get(this, "file", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecLoggingAccessLogFile.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.file = builder.file;
        }

        @Override
        public final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecLoggingAccessLogFile getFile() {
            return this.file;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFile() != null) {
                data.set("file", om.valueToTree(this.getFile()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecLoggingAccessLog"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualGatewaySpecLoggingAccessLog.Jsii$Proxy that = (AppmeshVirtualGatewaySpecLoggingAccessLog.Jsii$Proxy) o;

            return this.file != null ? this.file.equals(that.file) : that.file == null;
        }

        @Override
        public final int hashCode() {
            int result = this.file != null ? this.file.hashCode() : 0;
            return result;
        }
    }
}
