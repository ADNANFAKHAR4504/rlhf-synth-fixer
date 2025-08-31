package imports.aws.ecs_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.133Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsService.EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority")
@software.amazon.jsii.Jsii.Proxy(EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority.Jsii$Proxy.class)
public interface EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#aws_pca_authority_arn EcsService#aws_pca_authority_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAwsPcaAuthorityArn();

    /**
     * @return a {@link Builder} of {@link EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority> {
        java.lang.String awsPcaAuthorityArn;

        /**
         * Sets the value of {@link EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority#getAwsPcaAuthorityArn}
         * @param awsPcaAuthorityArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#aws_pca_authority_arn EcsService#aws_pca_authority_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder awsPcaAuthorityArn(java.lang.String awsPcaAuthorityArn) {
            this.awsPcaAuthorityArn = awsPcaAuthorityArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority {
        private final java.lang.String awsPcaAuthorityArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.awsPcaAuthorityArn = software.amazon.jsii.Kernel.get(this, "awsPcaAuthorityArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.awsPcaAuthorityArn = java.util.Objects.requireNonNull(builder.awsPcaAuthorityArn, "awsPcaAuthorityArn is required");
        }

        @Override
        public final java.lang.String getAwsPcaAuthorityArn() {
            return this.awsPcaAuthorityArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("awsPcaAuthorityArn", om.valueToTree(this.getAwsPcaAuthorityArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsService.EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority.Jsii$Proxy that = (EcsServiceServiceConnectConfigurationServiceTlsIssuerCertAuthority.Jsii$Proxy) o;

            return this.awsPcaAuthorityArn.equals(that.awsPcaAuthorityArn);
        }

        @Override
        public final int hashCode() {
            int result = this.awsPcaAuthorityArn.hashCode();
            return result;
        }
    }
}
