package imports.aws.msk_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.910Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskCluster.MskClusterClientAuthenticationTls")
@software.amazon.jsii.Jsii.Proxy(MskClusterClientAuthenticationTls.Jsii$Proxy.class)
public interface MskClusterClientAuthenticationTls extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#certificate_authority_arns MskCluster#certificate_authority_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCertificateAuthorityArns() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskClusterClientAuthenticationTls}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskClusterClientAuthenticationTls}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskClusterClientAuthenticationTls> {
        java.util.List<java.lang.String> certificateAuthorityArns;

        /**
         * Sets the value of {@link MskClusterClientAuthenticationTls#getCertificateAuthorityArns}
         * @param certificateAuthorityArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#certificate_authority_arns MskCluster#certificate_authority_arns}.
         * @return {@code this}
         */
        public Builder certificateAuthorityArns(java.util.List<java.lang.String> certificateAuthorityArns) {
            this.certificateAuthorityArns = certificateAuthorityArns;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskClusterClientAuthenticationTls}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskClusterClientAuthenticationTls build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskClusterClientAuthenticationTls}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskClusterClientAuthenticationTls {
        private final java.util.List<java.lang.String> certificateAuthorityArns;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.certificateAuthorityArns = software.amazon.jsii.Kernel.get(this, "certificateAuthorityArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.certificateAuthorityArns = builder.certificateAuthorityArns;
        }

        @Override
        public final java.util.List<java.lang.String> getCertificateAuthorityArns() {
            return this.certificateAuthorityArns;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCertificateAuthorityArns() != null) {
                data.set("certificateAuthorityArns", om.valueToTree(this.getCertificateAuthorityArns()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskCluster.MskClusterClientAuthenticationTls"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskClusterClientAuthenticationTls.Jsii$Proxy that = (MskClusterClientAuthenticationTls.Jsii$Proxy) o;

            return this.certificateAuthorityArns != null ? this.certificateAuthorityArns.equals(that.certificateAuthorityArns) : that.certificateAuthorityArns == null;
        }

        @Override
        public final int hashCode() {
            int result = this.certificateAuthorityArns != null ? this.certificateAuthorityArns.hashCode() : 0;
            return result;
        }
    }
}
