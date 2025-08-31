package imports.aws.alb_listener;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.909Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.albListener.AlbListenerMutualAuthentication")
@software.amazon.jsii.Jsii.Proxy(AlbListenerMutualAuthentication.Jsii$Proxy.class)
public interface AlbListenerMutualAuthentication extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener#mode AlbListener#mode}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener#advertise_trust_store_ca_names AlbListener#advertise_trust_store_ca_names}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAdvertiseTrustStoreCaNames() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener#ignore_client_certificate_expiry AlbListener#ignore_client_certificate_expiry}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIgnoreClientCertificateExpiry() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener#trust_store_arn AlbListener#trust_store_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTrustStoreArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AlbListenerMutualAuthentication}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AlbListenerMutualAuthentication}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AlbListenerMutualAuthentication> {
        java.lang.String mode;
        java.lang.String advertiseTrustStoreCaNames;
        java.lang.Object ignoreClientCertificateExpiry;
        java.lang.String trustStoreArn;

        /**
         * Sets the value of {@link AlbListenerMutualAuthentication#getMode}
         * @param mode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener#mode AlbListener#mode}. This parameter is required.
         * @return {@code this}
         */
        public Builder mode(java.lang.String mode) {
            this.mode = mode;
            return this;
        }

        /**
         * Sets the value of {@link AlbListenerMutualAuthentication#getAdvertiseTrustStoreCaNames}
         * @param advertiseTrustStoreCaNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener#advertise_trust_store_ca_names AlbListener#advertise_trust_store_ca_names}.
         * @return {@code this}
         */
        public Builder advertiseTrustStoreCaNames(java.lang.String advertiseTrustStoreCaNames) {
            this.advertiseTrustStoreCaNames = advertiseTrustStoreCaNames;
            return this;
        }

        /**
         * Sets the value of {@link AlbListenerMutualAuthentication#getIgnoreClientCertificateExpiry}
         * @param ignoreClientCertificateExpiry Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener#ignore_client_certificate_expiry AlbListener#ignore_client_certificate_expiry}.
         * @return {@code this}
         */
        public Builder ignoreClientCertificateExpiry(java.lang.Boolean ignoreClientCertificateExpiry) {
            this.ignoreClientCertificateExpiry = ignoreClientCertificateExpiry;
            return this;
        }

        /**
         * Sets the value of {@link AlbListenerMutualAuthentication#getIgnoreClientCertificateExpiry}
         * @param ignoreClientCertificateExpiry Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener#ignore_client_certificate_expiry AlbListener#ignore_client_certificate_expiry}.
         * @return {@code this}
         */
        public Builder ignoreClientCertificateExpiry(com.hashicorp.cdktf.IResolvable ignoreClientCertificateExpiry) {
            this.ignoreClientCertificateExpiry = ignoreClientCertificateExpiry;
            return this;
        }

        /**
         * Sets the value of {@link AlbListenerMutualAuthentication#getTrustStoreArn}
         * @param trustStoreArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener#trust_store_arn AlbListener#trust_store_arn}.
         * @return {@code this}
         */
        public Builder trustStoreArn(java.lang.String trustStoreArn) {
            this.trustStoreArn = trustStoreArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AlbListenerMutualAuthentication}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AlbListenerMutualAuthentication build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AlbListenerMutualAuthentication}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AlbListenerMutualAuthentication {
        private final java.lang.String mode;
        private final java.lang.String advertiseTrustStoreCaNames;
        private final java.lang.Object ignoreClientCertificateExpiry;
        private final java.lang.String trustStoreArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.mode = software.amazon.jsii.Kernel.get(this, "mode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.advertiseTrustStoreCaNames = software.amazon.jsii.Kernel.get(this, "advertiseTrustStoreCaNames", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ignoreClientCertificateExpiry = software.amazon.jsii.Kernel.get(this, "ignoreClientCertificateExpiry", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.trustStoreArn = software.amazon.jsii.Kernel.get(this, "trustStoreArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.mode = java.util.Objects.requireNonNull(builder.mode, "mode is required");
            this.advertiseTrustStoreCaNames = builder.advertiseTrustStoreCaNames;
            this.ignoreClientCertificateExpiry = builder.ignoreClientCertificateExpiry;
            this.trustStoreArn = builder.trustStoreArn;
        }

        @Override
        public final java.lang.String getMode() {
            return this.mode;
        }

        @Override
        public final java.lang.String getAdvertiseTrustStoreCaNames() {
            return this.advertiseTrustStoreCaNames;
        }

        @Override
        public final java.lang.Object getIgnoreClientCertificateExpiry() {
            return this.ignoreClientCertificateExpiry;
        }

        @Override
        public final java.lang.String getTrustStoreArn() {
            return this.trustStoreArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("mode", om.valueToTree(this.getMode()));
            if (this.getAdvertiseTrustStoreCaNames() != null) {
                data.set("advertiseTrustStoreCaNames", om.valueToTree(this.getAdvertiseTrustStoreCaNames()));
            }
            if (this.getIgnoreClientCertificateExpiry() != null) {
                data.set("ignoreClientCertificateExpiry", om.valueToTree(this.getIgnoreClientCertificateExpiry()));
            }
            if (this.getTrustStoreArn() != null) {
                data.set("trustStoreArn", om.valueToTree(this.getTrustStoreArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.albListener.AlbListenerMutualAuthentication"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AlbListenerMutualAuthentication.Jsii$Proxy that = (AlbListenerMutualAuthentication.Jsii$Proxy) o;

            if (!mode.equals(that.mode)) return false;
            if (this.advertiseTrustStoreCaNames != null ? !this.advertiseTrustStoreCaNames.equals(that.advertiseTrustStoreCaNames) : that.advertiseTrustStoreCaNames != null) return false;
            if (this.ignoreClientCertificateExpiry != null ? !this.ignoreClientCertificateExpiry.equals(that.ignoreClientCertificateExpiry) : that.ignoreClientCertificateExpiry != null) return false;
            return this.trustStoreArn != null ? this.trustStoreArn.equals(that.trustStoreArn) : that.trustStoreArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.mode.hashCode();
            result = 31 * result + (this.advertiseTrustStoreCaNames != null ? this.advertiseTrustStoreCaNames.hashCode() : 0);
            result = 31 * result + (this.ignoreClientCertificateExpiry != null ? this.ignoreClientCertificateExpiry.hashCode() : 0);
            result = 31 * result + (this.trustStoreArn != null ? this.trustStoreArn.hashCode() : 0);
            return result;
        }
    }
}
