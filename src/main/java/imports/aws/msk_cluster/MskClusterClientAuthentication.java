package imports.aws.msk_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.910Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskCluster.MskClusterClientAuthentication")
@software.amazon.jsii.Jsii.Proxy(MskClusterClientAuthentication.Jsii$Proxy.class)
public interface MskClusterClientAuthentication extends software.amazon.jsii.JsiiSerializable {

    /**
     * sasl block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#sasl MskCluster#sasl}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterClientAuthenticationSasl getSasl() {
        return null;
    }

    /**
     * tls block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#tls MskCluster#tls}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterClientAuthenticationTls getTls() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#unauthenticated MskCluster#unauthenticated}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUnauthenticated() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskClusterClientAuthentication}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskClusterClientAuthentication}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskClusterClientAuthentication> {
        imports.aws.msk_cluster.MskClusterClientAuthenticationSasl sasl;
        imports.aws.msk_cluster.MskClusterClientAuthenticationTls tls;
        java.lang.Object unauthenticated;

        /**
         * Sets the value of {@link MskClusterClientAuthentication#getSasl}
         * @param sasl sasl block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#sasl MskCluster#sasl}
         * @return {@code this}
         */
        public Builder sasl(imports.aws.msk_cluster.MskClusterClientAuthenticationSasl sasl) {
            this.sasl = sasl;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterClientAuthentication#getTls}
         * @param tls tls block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#tls MskCluster#tls}
         * @return {@code this}
         */
        public Builder tls(imports.aws.msk_cluster.MskClusterClientAuthenticationTls tls) {
            this.tls = tls;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterClientAuthentication#getUnauthenticated}
         * @param unauthenticated Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#unauthenticated MskCluster#unauthenticated}.
         * @return {@code this}
         */
        public Builder unauthenticated(java.lang.Boolean unauthenticated) {
            this.unauthenticated = unauthenticated;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterClientAuthentication#getUnauthenticated}
         * @param unauthenticated Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#unauthenticated MskCluster#unauthenticated}.
         * @return {@code this}
         */
        public Builder unauthenticated(com.hashicorp.cdktf.IResolvable unauthenticated) {
            this.unauthenticated = unauthenticated;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskClusterClientAuthentication}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskClusterClientAuthentication build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskClusterClientAuthentication}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskClusterClientAuthentication {
        private final imports.aws.msk_cluster.MskClusterClientAuthenticationSasl sasl;
        private final imports.aws.msk_cluster.MskClusterClientAuthenticationTls tls;
        private final java.lang.Object unauthenticated;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sasl = software.amazon.jsii.Kernel.get(this, "sasl", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterClientAuthenticationSasl.class));
            this.tls = software.amazon.jsii.Kernel.get(this, "tls", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterClientAuthenticationTls.class));
            this.unauthenticated = software.amazon.jsii.Kernel.get(this, "unauthenticated", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sasl = builder.sasl;
            this.tls = builder.tls;
            this.unauthenticated = builder.unauthenticated;
        }

        @Override
        public final imports.aws.msk_cluster.MskClusterClientAuthenticationSasl getSasl() {
            return this.sasl;
        }

        @Override
        public final imports.aws.msk_cluster.MskClusterClientAuthenticationTls getTls() {
            return this.tls;
        }

        @Override
        public final java.lang.Object getUnauthenticated() {
            return this.unauthenticated;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSasl() != null) {
                data.set("sasl", om.valueToTree(this.getSasl()));
            }
            if (this.getTls() != null) {
                data.set("tls", om.valueToTree(this.getTls()));
            }
            if (this.getUnauthenticated() != null) {
                data.set("unauthenticated", om.valueToTree(this.getUnauthenticated()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskCluster.MskClusterClientAuthentication"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskClusterClientAuthentication.Jsii$Proxy that = (MskClusterClientAuthentication.Jsii$Proxy) o;

            if (this.sasl != null ? !this.sasl.equals(that.sasl) : that.sasl != null) return false;
            if (this.tls != null ? !this.tls.equals(that.tls) : that.tls != null) return false;
            return this.unauthenticated != null ? this.unauthenticated.equals(that.unauthenticated) : that.unauthenticated == null;
        }

        @Override
        public final int hashCode() {
            int result = this.sasl != null ? this.sasl.hashCode() : 0;
            result = 31 * result + (this.tls != null ? this.tls.hashCode() : 0);
            result = 31 * result + (this.unauthenticated != null ? this.unauthenticated.hashCode() : 0);
            return result;
        }
    }
}
