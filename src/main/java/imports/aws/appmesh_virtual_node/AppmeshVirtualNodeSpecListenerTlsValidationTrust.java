package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.047Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListenerTlsValidationTrust")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualNodeSpecListenerTlsValidationTrust.Jsii$Proxy.class)
public interface AppmeshVirtualNodeSpecListenerTlsValidationTrust extends software.amazon.jsii.JsiiSerializable {

    /**
     * file block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#file AppmeshVirtualNode#file}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTlsValidationTrustFile getFile() {
        return null;
    }

    /**
     * sds block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#sds AppmeshVirtualNode#sds}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTlsValidationTrustSds getSds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualNodeSpecListenerTlsValidationTrust}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualNodeSpecListenerTlsValidationTrust}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualNodeSpecListenerTlsValidationTrust> {
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTlsValidationTrustFile file;
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTlsValidationTrustSds sds;

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListenerTlsValidationTrust#getFile}
         * @param file file block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#file AppmeshVirtualNode#file}
         * @return {@code this}
         */
        public Builder file(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTlsValidationTrustFile file) {
            this.file = file;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListenerTlsValidationTrust#getSds}
         * @param sds sds block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#sds AppmeshVirtualNode#sds}
         * @return {@code this}
         */
        public Builder sds(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTlsValidationTrustSds sds) {
            this.sds = sds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualNodeSpecListenerTlsValidationTrust}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualNodeSpecListenerTlsValidationTrust build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualNodeSpecListenerTlsValidationTrust}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualNodeSpecListenerTlsValidationTrust {
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTlsValidationTrustFile file;
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTlsValidationTrustSds sds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.file = software.amazon.jsii.Kernel.get(this, "file", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTlsValidationTrustFile.class));
            this.sds = software.amazon.jsii.Kernel.get(this, "sds", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTlsValidationTrustSds.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.file = builder.file;
            this.sds = builder.sds;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTlsValidationTrustFile getFile() {
            return this.file;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerTlsValidationTrustSds getSds() {
            return this.sds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFile() != null) {
                data.set("file", om.valueToTree(this.getFile()));
            }
            if (this.getSds() != null) {
                data.set("sds", om.valueToTree(this.getSds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListenerTlsValidationTrust"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualNodeSpecListenerTlsValidationTrust.Jsii$Proxy that = (AppmeshVirtualNodeSpecListenerTlsValidationTrust.Jsii$Proxy) o;

            if (this.file != null ? !this.file.equals(that.file) : that.file != null) return false;
            return this.sds != null ? this.sds.equals(that.sds) : that.sds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.file != null ? this.file.hashCode() : 0;
            result = 31 * result + (this.sds != null ? this.sds.hashCode() : 0);
            return result;
        }
    }
}
