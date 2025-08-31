package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.048Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecLoggingAccessLogFileFormat")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualNodeSpecLoggingAccessLogFileFormat.Jsii$Proxy.class)
public interface AppmeshVirtualNodeSpecLoggingAccessLogFileFormat extends software.amazon.jsii.JsiiSerializable {

    /**
     * json block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#json AppmeshVirtualNode#json}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getJson() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#text AppmeshVirtualNode#text}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getText() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualNodeSpecLoggingAccessLogFileFormat}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualNodeSpecLoggingAccessLogFileFormat}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualNodeSpecLoggingAccessLogFileFormat> {
        java.lang.Object json;
        java.lang.String text;

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecLoggingAccessLogFileFormat#getJson}
         * @param json json block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#json AppmeshVirtualNode#json}
         * @return {@code this}
         */
        public Builder json(com.hashicorp.cdktf.IResolvable json) {
            this.json = json;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecLoggingAccessLogFileFormat#getJson}
         * @param json json block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#json AppmeshVirtualNode#json}
         * @return {@code this}
         */
        public Builder json(java.util.List<? extends imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecLoggingAccessLogFileFormatJson> json) {
            this.json = json;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecLoggingAccessLogFileFormat#getText}
         * @param text Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#text AppmeshVirtualNode#text}.
         * @return {@code this}
         */
        public Builder text(java.lang.String text) {
            this.text = text;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualNodeSpecLoggingAccessLogFileFormat}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualNodeSpecLoggingAccessLogFileFormat build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualNodeSpecLoggingAccessLogFileFormat}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualNodeSpecLoggingAccessLogFileFormat {
        private final java.lang.Object json;
        private final java.lang.String text;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.json = software.amazon.jsii.Kernel.get(this, "json", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.text = software.amazon.jsii.Kernel.get(this, "text", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.json = builder.json;
            this.text = builder.text;
        }

        @Override
        public final java.lang.Object getJson() {
            return this.json;
        }

        @Override
        public final java.lang.String getText() {
            return this.text;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getJson() != null) {
                data.set("json", om.valueToTree(this.getJson()));
            }
            if (this.getText() != null) {
                data.set("text", om.valueToTree(this.getText()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualNode.AppmeshVirtualNodeSpecLoggingAccessLogFileFormat"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualNodeSpecLoggingAccessLogFileFormat.Jsii$Proxy that = (AppmeshVirtualNodeSpecLoggingAccessLogFileFormat.Jsii$Proxy) o;

            if (this.json != null ? !this.json.equals(that.json) : that.json != null) return false;
            return this.text != null ? this.text.equals(that.text) : that.text == null;
        }

        @Override
        public final int hashCode() {
            int result = this.json != null ? this.json.hashCode() : 0;
            result = 31 * result + (this.text != null ? this.text.hashCode() : 0);
            return result;
        }
    }
}
