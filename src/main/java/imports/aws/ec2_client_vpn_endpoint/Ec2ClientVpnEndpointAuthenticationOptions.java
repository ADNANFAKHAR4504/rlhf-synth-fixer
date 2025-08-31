package imports.aws.ec2_client_vpn_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.072Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2ClientVpnEndpoint.Ec2ClientVpnEndpointAuthenticationOptions")
@software.amazon.jsii.Jsii.Proxy(Ec2ClientVpnEndpointAuthenticationOptions.Jsii$Proxy.class)
public interface Ec2ClientVpnEndpointAuthenticationOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#type Ec2ClientVpnEndpoint#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#active_directory_id Ec2ClientVpnEndpoint#active_directory_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getActiveDirectoryId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#root_certificate_chain_arn Ec2ClientVpnEndpoint#root_certificate_chain_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRootCertificateChainArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#saml_provider_arn Ec2ClientVpnEndpoint#saml_provider_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSamlProviderArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#self_service_saml_provider_arn Ec2ClientVpnEndpoint#self_service_saml_provider_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSelfServiceSamlProviderArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2ClientVpnEndpointAuthenticationOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2ClientVpnEndpointAuthenticationOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2ClientVpnEndpointAuthenticationOptions> {
        java.lang.String type;
        java.lang.String activeDirectoryId;
        java.lang.String rootCertificateChainArn;
        java.lang.String samlProviderArn;
        java.lang.String selfServiceSamlProviderArn;

        /**
         * Sets the value of {@link Ec2ClientVpnEndpointAuthenticationOptions#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#type Ec2ClientVpnEndpoint#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link Ec2ClientVpnEndpointAuthenticationOptions#getActiveDirectoryId}
         * @param activeDirectoryId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#active_directory_id Ec2ClientVpnEndpoint#active_directory_id}.
         * @return {@code this}
         */
        public Builder activeDirectoryId(java.lang.String activeDirectoryId) {
            this.activeDirectoryId = activeDirectoryId;
            return this;
        }

        /**
         * Sets the value of {@link Ec2ClientVpnEndpointAuthenticationOptions#getRootCertificateChainArn}
         * @param rootCertificateChainArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#root_certificate_chain_arn Ec2ClientVpnEndpoint#root_certificate_chain_arn}.
         * @return {@code this}
         */
        public Builder rootCertificateChainArn(java.lang.String rootCertificateChainArn) {
            this.rootCertificateChainArn = rootCertificateChainArn;
            return this;
        }

        /**
         * Sets the value of {@link Ec2ClientVpnEndpointAuthenticationOptions#getSamlProviderArn}
         * @param samlProviderArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#saml_provider_arn Ec2ClientVpnEndpoint#saml_provider_arn}.
         * @return {@code this}
         */
        public Builder samlProviderArn(java.lang.String samlProviderArn) {
            this.samlProviderArn = samlProviderArn;
            return this;
        }

        /**
         * Sets the value of {@link Ec2ClientVpnEndpointAuthenticationOptions#getSelfServiceSamlProviderArn}
         * @param selfServiceSamlProviderArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#self_service_saml_provider_arn Ec2ClientVpnEndpoint#self_service_saml_provider_arn}.
         * @return {@code this}
         */
        public Builder selfServiceSamlProviderArn(java.lang.String selfServiceSamlProviderArn) {
            this.selfServiceSamlProviderArn = selfServiceSamlProviderArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Ec2ClientVpnEndpointAuthenticationOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2ClientVpnEndpointAuthenticationOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2ClientVpnEndpointAuthenticationOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2ClientVpnEndpointAuthenticationOptions {
        private final java.lang.String type;
        private final java.lang.String activeDirectoryId;
        private final java.lang.String rootCertificateChainArn;
        private final java.lang.String samlProviderArn;
        private final java.lang.String selfServiceSamlProviderArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.activeDirectoryId = software.amazon.jsii.Kernel.get(this, "activeDirectoryId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rootCertificateChainArn = software.amazon.jsii.Kernel.get(this, "rootCertificateChainArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.samlProviderArn = software.amazon.jsii.Kernel.get(this, "samlProviderArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.selfServiceSamlProviderArn = software.amazon.jsii.Kernel.get(this, "selfServiceSamlProviderArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.activeDirectoryId = builder.activeDirectoryId;
            this.rootCertificateChainArn = builder.rootCertificateChainArn;
            this.samlProviderArn = builder.samlProviderArn;
            this.selfServiceSamlProviderArn = builder.selfServiceSamlProviderArn;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getActiveDirectoryId() {
            return this.activeDirectoryId;
        }

        @Override
        public final java.lang.String getRootCertificateChainArn() {
            return this.rootCertificateChainArn;
        }

        @Override
        public final java.lang.String getSamlProviderArn() {
            return this.samlProviderArn;
        }

        @Override
        public final java.lang.String getSelfServiceSamlProviderArn() {
            return this.selfServiceSamlProviderArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getActiveDirectoryId() != null) {
                data.set("activeDirectoryId", om.valueToTree(this.getActiveDirectoryId()));
            }
            if (this.getRootCertificateChainArn() != null) {
                data.set("rootCertificateChainArn", om.valueToTree(this.getRootCertificateChainArn()));
            }
            if (this.getSamlProviderArn() != null) {
                data.set("samlProviderArn", om.valueToTree(this.getSamlProviderArn()));
            }
            if (this.getSelfServiceSamlProviderArn() != null) {
                data.set("selfServiceSamlProviderArn", om.valueToTree(this.getSelfServiceSamlProviderArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ec2ClientVpnEndpoint.Ec2ClientVpnEndpointAuthenticationOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2ClientVpnEndpointAuthenticationOptions.Jsii$Proxy that = (Ec2ClientVpnEndpointAuthenticationOptions.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            if (this.activeDirectoryId != null ? !this.activeDirectoryId.equals(that.activeDirectoryId) : that.activeDirectoryId != null) return false;
            if (this.rootCertificateChainArn != null ? !this.rootCertificateChainArn.equals(that.rootCertificateChainArn) : that.rootCertificateChainArn != null) return false;
            if (this.samlProviderArn != null ? !this.samlProviderArn.equals(that.samlProviderArn) : that.samlProviderArn != null) return false;
            return this.selfServiceSamlProviderArn != null ? this.selfServiceSamlProviderArn.equals(that.selfServiceSamlProviderArn) : that.selfServiceSamlProviderArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.activeDirectoryId != null ? this.activeDirectoryId.hashCode() : 0);
            result = 31 * result + (this.rootCertificateChainArn != null ? this.rootCertificateChainArn.hashCode() : 0);
            result = 31 * result + (this.samlProviderArn != null ? this.samlProviderArn.hashCode() : 0);
            result = 31 * result + (this.selfServiceSamlProviderArn != null ? this.selfServiceSamlProviderArn.hashCode() : 0);
            return result;
        }
    }
}
