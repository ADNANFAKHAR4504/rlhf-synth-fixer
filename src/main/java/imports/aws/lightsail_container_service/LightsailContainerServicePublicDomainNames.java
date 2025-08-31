package imports.aws.lightsail_container_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.819Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailContainerService.LightsailContainerServicePublicDomainNames")
@software.amazon.jsii.Jsii.Proxy(LightsailContainerServicePublicDomainNames.Jsii$Proxy.class)
public interface LightsailContainerServicePublicDomainNames extends software.amazon.jsii.JsiiSerializable {

    /**
     * certificate block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service#certificate LightsailContainerService#certificate}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getCertificate();

    /**
     * @return a {@link Builder} of {@link LightsailContainerServicePublicDomainNames}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LightsailContainerServicePublicDomainNames}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LightsailContainerServicePublicDomainNames> {
        java.lang.Object certificate;

        /**
         * Sets the value of {@link LightsailContainerServicePublicDomainNames#getCertificate}
         * @param certificate certificate block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service#certificate LightsailContainerService#certificate}
         * @return {@code this}
         */
        public Builder certificate(com.hashicorp.cdktf.IResolvable certificate) {
            this.certificate = certificate;
            return this;
        }

        /**
         * Sets the value of {@link LightsailContainerServicePublicDomainNames#getCertificate}
         * @param certificate certificate block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service#certificate LightsailContainerService#certificate}
         * @return {@code this}
         */
        public Builder certificate(java.util.List<? extends imports.aws.lightsail_container_service.LightsailContainerServicePublicDomainNamesCertificate> certificate) {
            this.certificate = certificate;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LightsailContainerServicePublicDomainNames}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LightsailContainerServicePublicDomainNames build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LightsailContainerServicePublicDomainNames}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LightsailContainerServicePublicDomainNames {
        private final java.lang.Object certificate;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.certificate = software.amazon.jsii.Kernel.get(this, "certificate", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.certificate = java.util.Objects.requireNonNull(builder.certificate, "certificate is required");
        }

        @Override
        public final java.lang.Object getCertificate() {
            return this.certificate;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("certificate", om.valueToTree(this.getCertificate()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lightsailContainerService.LightsailContainerServicePublicDomainNames"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LightsailContainerServicePublicDomainNames.Jsii$Proxy that = (LightsailContainerServicePublicDomainNames.Jsii$Proxy) o;

            return this.certificate.equals(that.certificate);
        }

        @Override
        public final int hashCode() {
            int result = this.certificate.hashCode();
            return result;
        }
    }
}
