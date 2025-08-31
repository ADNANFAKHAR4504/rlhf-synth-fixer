package imports.aws.lightsail_container_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.819Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailContainerService.LightsailContainerServicePublicDomainNamesCertificate")
@software.amazon.jsii.Jsii.Proxy(LightsailContainerServicePublicDomainNamesCertificate.Jsii$Proxy.class)
public interface LightsailContainerServicePublicDomainNamesCertificate extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service#certificate_name LightsailContainerService#certificate_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCertificateName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service#domain_names LightsailContainerService#domain_names}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getDomainNames();

    /**
     * @return a {@link Builder} of {@link LightsailContainerServicePublicDomainNamesCertificate}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LightsailContainerServicePublicDomainNamesCertificate}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LightsailContainerServicePublicDomainNamesCertificate> {
        java.lang.String certificateName;
        java.util.List<java.lang.String> domainNames;

        /**
         * Sets the value of {@link LightsailContainerServicePublicDomainNamesCertificate#getCertificateName}
         * @param certificateName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service#certificate_name LightsailContainerService#certificate_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder certificateName(java.lang.String certificateName) {
            this.certificateName = certificateName;
            return this;
        }

        /**
         * Sets the value of {@link LightsailContainerServicePublicDomainNamesCertificate#getDomainNames}
         * @param domainNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service#domain_names LightsailContainerService#domain_names}. This parameter is required.
         * @return {@code this}
         */
        public Builder domainNames(java.util.List<java.lang.String> domainNames) {
            this.domainNames = domainNames;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LightsailContainerServicePublicDomainNamesCertificate}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LightsailContainerServicePublicDomainNamesCertificate build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LightsailContainerServicePublicDomainNamesCertificate}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LightsailContainerServicePublicDomainNamesCertificate {
        private final java.lang.String certificateName;
        private final java.util.List<java.lang.String> domainNames;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.certificateName = software.amazon.jsii.Kernel.get(this, "certificateName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domainNames = software.amazon.jsii.Kernel.get(this, "domainNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.certificateName = java.util.Objects.requireNonNull(builder.certificateName, "certificateName is required");
            this.domainNames = java.util.Objects.requireNonNull(builder.domainNames, "domainNames is required");
        }

        @Override
        public final java.lang.String getCertificateName() {
            return this.certificateName;
        }

        @Override
        public final java.util.List<java.lang.String> getDomainNames() {
            return this.domainNames;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("certificateName", om.valueToTree(this.getCertificateName()));
            data.set("domainNames", om.valueToTree(this.getDomainNames()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lightsailContainerService.LightsailContainerServicePublicDomainNamesCertificate"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LightsailContainerServicePublicDomainNamesCertificate.Jsii$Proxy that = (LightsailContainerServicePublicDomainNamesCertificate.Jsii$Proxy) o;

            if (!certificateName.equals(that.certificateName)) return false;
            return this.domainNames.equals(that.domainNames);
        }

        @Override
        public final int hashCode() {
            int result = this.certificateName.hashCode();
            result = 31 * result + (this.domainNames.hashCode());
            return result;
        }
    }
}
