package imports.aws.appmesh_virtual_gateway;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.039Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecListenerTlsValidationTrust")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualGatewaySpecListenerTlsValidationTrust.Jsii$Proxy.class)
public interface AppmeshVirtualGatewaySpecListenerTlsValidationTrust extends software.amazon.jsii.JsiiSerializable {

    /**
     * file block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#file AppmeshVirtualGateway#file}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationTrustFile getFile() {
        return null;
    }

    /**
     * sds block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#sds AppmeshVirtualGateway#sds}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationTrustSds getSds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualGatewaySpecListenerTlsValidationTrust}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualGatewaySpecListenerTlsValidationTrust}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualGatewaySpecListenerTlsValidationTrust> {
        imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationTrustFile file;
        imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationTrustSds sds;

        /**
         * Sets the value of {@link AppmeshVirtualGatewaySpecListenerTlsValidationTrust#getFile}
         * @param file file block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#file AppmeshVirtualGateway#file}
         * @return {@code this}
         */
        public Builder file(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationTrustFile file) {
            this.file = file;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualGatewaySpecListenerTlsValidationTrust#getSds}
         * @param sds sds block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_gateway#sds AppmeshVirtualGateway#sds}
         * @return {@code this}
         */
        public Builder sds(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationTrustSds sds) {
            this.sds = sds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualGatewaySpecListenerTlsValidationTrust}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualGatewaySpecListenerTlsValidationTrust build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualGatewaySpecListenerTlsValidationTrust}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualGatewaySpecListenerTlsValidationTrust {
        private final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationTrustFile file;
        private final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationTrustSds sds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.file = software.amazon.jsii.Kernel.get(this, "file", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationTrustFile.class));
            this.sds = software.amazon.jsii.Kernel.get(this, "sds", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationTrustSds.class));
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
        public final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationTrustFile getFile() {
            return this.file;
        }

        @Override
        public final imports.aws.appmesh_virtual_gateway.AppmeshVirtualGatewaySpecListenerTlsValidationTrustSds getSds() {
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
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualGateway.AppmeshVirtualGatewaySpecListenerTlsValidationTrust"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualGatewaySpecListenerTlsValidationTrust.Jsii$Proxy that = (AppmeshVirtualGatewaySpecListenerTlsValidationTrust.Jsii$Proxy) o;

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
