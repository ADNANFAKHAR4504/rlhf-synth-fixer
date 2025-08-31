package imports.aws.apigatewayv2_domain_name;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.969Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apigatewayv2DomainName.Apigatewayv2DomainNameDomainNameConfiguration")
@software.amazon.jsii.Jsii.Proxy(Apigatewayv2DomainNameDomainNameConfiguration.Jsii$Proxy.class)
public interface Apigatewayv2DomainNameDomainNameConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_domain_name#certificate_arn Apigatewayv2DomainName#certificate_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCertificateArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_domain_name#endpoint_type Apigatewayv2DomainName#endpoint_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEndpointType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_domain_name#security_policy Apigatewayv2DomainName#security_policy}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSecurityPolicy();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_domain_name#ip_address_type Apigatewayv2DomainName#ip_address_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpAddressType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_domain_name#ownership_verification_certificate_arn Apigatewayv2DomainName#ownership_verification_certificate_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOwnershipVerificationCertificateArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Apigatewayv2DomainNameDomainNameConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Apigatewayv2DomainNameDomainNameConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Apigatewayv2DomainNameDomainNameConfiguration> {
        java.lang.String certificateArn;
        java.lang.String endpointType;
        java.lang.String securityPolicy;
        java.lang.String ipAddressType;
        java.lang.String ownershipVerificationCertificateArn;

        /**
         * Sets the value of {@link Apigatewayv2DomainNameDomainNameConfiguration#getCertificateArn}
         * @param certificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_domain_name#certificate_arn Apigatewayv2DomainName#certificate_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder certificateArn(java.lang.String certificateArn) {
            this.certificateArn = certificateArn;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2DomainNameDomainNameConfiguration#getEndpointType}
         * @param endpointType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_domain_name#endpoint_type Apigatewayv2DomainName#endpoint_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder endpointType(java.lang.String endpointType) {
            this.endpointType = endpointType;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2DomainNameDomainNameConfiguration#getSecurityPolicy}
         * @param securityPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_domain_name#security_policy Apigatewayv2DomainName#security_policy}. This parameter is required.
         * @return {@code this}
         */
        public Builder securityPolicy(java.lang.String securityPolicy) {
            this.securityPolicy = securityPolicy;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2DomainNameDomainNameConfiguration#getIpAddressType}
         * @param ipAddressType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_domain_name#ip_address_type Apigatewayv2DomainName#ip_address_type}.
         * @return {@code this}
         */
        public Builder ipAddressType(java.lang.String ipAddressType) {
            this.ipAddressType = ipAddressType;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2DomainNameDomainNameConfiguration#getOwnershipVerificationCertificateArn}
         * @param ownershipVerificationCertificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_domain_name#ownership_verification_certificate_arn Apigatewayv2DomainName#ownership_verification_certificate_arn}.
         * @return {@code this}
         */
        public Builder ownershipVerificationCertificateArn(java.lang.String ownershipVerificationCertificateArn) {
            this.ownershipVerificationCertificateArn = ownershipVerificationCertificateArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Apigatewayv2DomainNameDomainNameConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Apigatewayv2DomainNameDomainNameConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Apigatewayv2DomainNameDomainNameConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Apigatewayv2DomainNameDomainNameConfiguration {
        private final java.lang.String certificateArn;
        private final java.lang.String endpointType;
        private final java.lang.String securityPolicy;
        private final java.lang.String ipAddressType;
        private final java.lang.String ownershipVerificationCertificateArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.certificateArn = software.amazon.jsii.Kernel.get(this, "certificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endpointType = software.amazon.jsii.Kernel.get(this, "endpointType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityPolicy = software.amazon.jsii.Kernel.get(this, "securityPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipAddressType = software.amazon.jsii.Kernel.get(this, "ipAddressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ownershipVerificationCertificateArn = software.amazon.jsii.Kernel.get(this, "ownershipVerificationCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.certificateArn = java.util.Objects.requireNonNull(builder.certificateArn, "certificateArn is required");
            this.endpointType = java.util.Objects.requireNonNull(builder.endpointType, "endpointType is required");
            this.securityPolicy = java.util.Objects.requireNonNull(builder.securityPolicy, "securityPolicy is required");
            this.ipAddressType = builder.ipAddressType;
            this.ownershipVerificationCertificateArn = builder.ownershipVerificationCertificateArn;
        }

        @Override
        public final java.lang.String getCertificateArn() {
            return this.certificateArn;
        }

        @Override
        public final java.lang.String getEndpointType() {
            return this.endpointType;
        }

        @Override
        public final java.lang.String getSecurityPolicy() {
            return this.securityPolicy;
        }

        @Override
        public final java.lang.String getIpAddressType() {
            return this.ipAddressType;
        }

        @Override
        public final java.lang.String getOwnershipVerificationCertificateArn() {
            return this.ownershipVerificationCertificateArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("certificateArn", om.valueToTree(this.getCertificateArn()));
            data.set("endpointType", om.valueToTree(this.getEndpointType()));
            data.set("securityPolicy", om.valueToTree(this.getSecurityPolicy()));
            if (this.getIpAddressType() != null) {
                data.set("ipAddressType", om.valueToTree(this.getIpAddressType()));
            }
            if (this.getOwnershipVerificationCertificateArn() != null) {
                data.set("ownershipVerificationCertificateArn", om.valueToTree(this.getOwnershipVerificationCertificateArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apigatewayv2DomainName.Apigatewayv2DomainNameDomainNameConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Apigatewayv2DomainNameDomainNameConfiguration.Jsii$Proxy that = (Apigatewayv2DomainNameDomainNameConfiguration.Jsii$Proxy) o;

            if (!certificateArn.equals(that.certificateArn)) return false;
            if (!endpointType.equals(that.endpointType)) return false;
            if (!securityPolicy.equals(that.securityPolicy)) return false;
            if (this.ipAddressType != null ? !this.ipAddressType.equals(that.ipAddressType) : that.ipAddressType != null) return false;
            return this.ownershipVerificationCertificateArn != null ? this.ownershipVerificationCertificateArn.equals(that.ownershipVerificationCertificateArn) : that.ownershipVerificationCertificateArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.certificateArn.hashCode();
            result = 31 * result + (this.endpointType.hashCode());
            result = 31 * result + (this.securityPolicy.hashCode());
            result = 31 * result + (this.ipAddressType != null ? this.ipAddressType.hashCode() : 0);
            result = 31 * result + (this.ownershipVerificationCertificateArn != null ? this.ownershipVerificationCertificateArn.hashCode() : 0);
            return result;
        }
    }
}
