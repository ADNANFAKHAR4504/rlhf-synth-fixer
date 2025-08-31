package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.048Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecLoggingAccessLogFile")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualNodeSpecLoggingAccessLogFile.Jsii$Proxy.class)
public interface AppmeshVirtualNodeSpecLoggingAccessLogFile extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#path AppmeshVirtualNode#path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPath();

    /**
     * format block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#format AppmeshVirtualNode#format}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecLoggingAccessLogFileFormat getFormat() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualNodeSpecLoggingAccessLogFile}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualNodeSpecLoggingAccessLogFile}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualNodeSpecLoggingAccessLogFile> {
        java.lang.String path;
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecLoggingAccessLogFileFormat format;

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecLoggingAccessLogFile#getPath}
         * @param path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#path AppmeshVirtualNode#path}. This parameter is required.
         * @return {@code this}
         */
        public Builder path(java.lang.String path) {
            this.path = path;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecLoggingAccessLogFile#getFormat}
         * @param format format block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#format AppmeshVirtualNode#format}
         * @return {@code this}
         */
        public Builder format(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecLoggingAccessLogFileFormat format) {
            this.format = format;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualNodeSpecLoggingAccessLogFile}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualNodeSpecLoggingAccessLogFile build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualNodeSpecLoggingAccessLogFile}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualNodeSpecLoggingAccessLogFile {
        private final java.lang.String path;
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecLoggingAccessLogFileFormat format;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.path = software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.format = software.amazon.jsii.Kernel.get(this, "format", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecLoggingAccessLogFileFormat.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.path = java.util.Objects.requireNonNull(builder.path, "path is required");
            this.format = builder.format;
        }

        @Override
        public final java.lang.String getPath() {
            return this.path;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecLoggingAccessLogFileFormat getFormat() {
            return this.format;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("path", om.valueToTree(this.getPath()));
            if (this.getFormat() != null) {
                data.set("format", om.valueToTree(this.getFormat()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualNode.AppmeshVirtualNodeSpecLoggingAccessLogFile"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualNodeSpecLoggingAccessLogFile.Jsii$Proxy that = (AppmeshVirtualNodeSpecLoggingAccessLogFile.Jsii$Proxy) o;

            if (!path.equals(that.path)) return false;
            return this.format != null ? this.format.equals(that.format) : that.format == null;
        }

        @Override
        public final int hashCode() {
            int result = this.path.hashCode();
            result = 31 * result + (this.format != null ? this.format.hashCode() : 0);
            return result;
        }
    }
}
