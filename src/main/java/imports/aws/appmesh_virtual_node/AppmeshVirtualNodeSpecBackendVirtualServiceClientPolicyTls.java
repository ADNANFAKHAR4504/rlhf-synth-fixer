package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.042Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTls")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTls.Jsii$Proxy.class)
public interface AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTls extends software.amazon.jsii.JsiiSerializable {

    /**
     * validation block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#validation AppmeshVirtualNode#validation}
     */
    @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsValidation getValidation();

    /**
     * certificate block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#certificate AppmeshVirtualNode#certificate}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificate getCertificate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#enforce AppmeshVirtualNode#enforce}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnforce() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#ports AppmeshVirtualNode#ports}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.Number> getPorts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTls}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTls}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTls> {
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsValidation validation;
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificate certificate;
        java.lang.Object enforce;
        java.util.List<java.lang.Number> ports;

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTls#getValidation}
         * @param validation validation block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#validation AppmeshVirtualNode#validation}
         * @return {@code this}
         */
        public Builder validation(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsValidation validation) {
            this.validation = validation;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTls#getCertificate}
         * @param certificate certificate block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#certificate AppmeshVirtualNode#certificate}
         * @return {@code this}
         */
        public Builder certificate(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificate certificate) {
            this.certificate = certificate;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTls#getEnforce}
         * @param enforce Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#enforce AppmeshVirtualNode#enforce}.
         * @return {@code this}
         */
        public Builder enforce(java.lang.Boolean enforce) {
            this.enforce = enforce;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTls#getEnforce}
         * @param enforce Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#enforce AppmeshVirtualNode#enforce}.
         * @return {@code this}
         */
        public Builder enforce(com.hashicorp.cdktf.IResolvable enforce) {
            this.enforce = enforce;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTls#getPorts}
         * @param ports Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#ports AppmeshVirtualNode#ports}.
         * @return {@code this}
         */
        @SuppressWarnings("unchecked")
        public Builder ports(java.util.List<? extends java.lang.Number> ports) {
            this.ports = (java.util.List<java.lang.Number>)ports;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTls}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTls build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTls}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTls {
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsValidation validation;
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificate certificate;
        private final java.lang.Object enforce;
        private final java.util.List<java.lang.Number> ports;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.validation = software.amazon.jsii.Kernel.get(this, "validation", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsValidation.class));
            this.certificate = software.amazon.jsii.Kernel.get(this, "certificate", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificate.class));
            this.enforce = software.amazon.jsii.Kernel.get(this, "enforce", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ports = software.amazon.jsii.Kernel.get(this, "ports", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.validation = java.util.Objects.requireNonNull(builder.validation, "validation is required");
            this.certificate = builder.certificate;
            this.enforce = builder.enforce;
            this.ports = (java.util.List<java.lang.Number>)builder.ports;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsValidation getValidation() {
            return this.validation;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTlsCertificate getCertificate() {
            return this.certificate;
        }

        @Override
        public final java.lang.Object getEnforce() {
            return this.enforce;
        }

        @Override
        public final java.util.List<java.lang.Number> getPorts() {
            return this.ports;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("validation", om.valueToTree(this.getValidation()));
            if (this.getCertificate() != null) {
                data.set("certificate", om.valueToTree(this.getCertificate()));
            }
            if (this.getEnforce() != null) {
                data.set("enforce", om.valueToTree(this.getEnforce()));
            }
            if (this.getPorts() != null) {
                data.set("ports", om.valueToTree(this.getPorts()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualNode.AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTls"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTls.Jsii$Proxy that = (AppmeshVirtualNodeSpecBackendVirtualServiceClientPolicyTls.Jsii$Proxy) o;

            if (!validation.equals(that.validation)) return false;
            if (this.certificate != null ? !this.certificate.equals(that.certificate) : that.certificate != null) return false;
            if (this.enforce != null ? !this.enforce.equals(that.enforce) : that.enforce != null) return false;
            return this.ports != null ? this.ports.equals(that.ports) : that.ports == null;
        }

        @Override
        public final int hashCode() {
            int result = this.validation.hashCode();
            result = 31 * result + (this.certificate != null ? this.certificate.hashCode() : 0);
            result = 31 * result + (this.enforce != null ? this.enforce.hashCode() : 0);
            result = 31 * result + (this.ports != null ? this.ports.hashCode() : 0);
            return result;
        }
    }
}
