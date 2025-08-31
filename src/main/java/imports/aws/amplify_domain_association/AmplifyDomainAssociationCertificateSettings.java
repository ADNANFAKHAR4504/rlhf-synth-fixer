package imports.aws.amplify_domain_association;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.935Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.amplifyDomainAssociation.AmplifyDomainAssociationCertificateSettings")
@software.amazon.jsii.Jsii.Proxy(AmplifyDomainAssociationCertificateSettings.Jsii$Proxy.class)
public interface AmplifyDomainAssociationCertificateSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#type AmplifyDomainAssociation#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#custom_certificate_arn AmplifyDomainAssociation#custom_certificate_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomCertificateArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AmplifyDomainAssociationCertificateSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AmplifyDomainAssociationCertificateSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AmplifyDomainAssociationCertificateSettings> {
        java.lang.String type;
        java.lang.String customCertificateArn;

        /**
         * Sets the value of {@link AmplifyDomainAssociationCertificateSettings#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#type AmplifyDomainAssociation#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyDomainAssociationCertificateSettings#getCustomCertificateArn}
         * @param customCertificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#custom_certificate_arn AmplifyDomainAssociation#custom_certificate_arn}.
         * @return {@code this}
         */
        public Builder customCertificateArn(java.lang.String customCertificateArn) {
            this.customCertificateArn = customCertificateArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AmplifyDomainAssociationCertificateSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AmplifyDomainAssociationCertificateSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AmplifyDomainAssociationCertificateSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AmplifyDomainAssociationCertificateSettings {
        private final java.lang.String type;
        private final java.lang.String customCertificateArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customCertificateArn = software.amazon.jsii.Kernel.get(this, "customCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.customCertificateArn = builder.customCertificateArn;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getCustomCertificateArn() {
            return this.customCertificateArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getCustomCertificateArn() != null) {
                data.set("customCertificateArn", om.valueToTree(this.getCustomCertificateArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.amplifyDomainAssociation.AmplifyDomainAssociationCertificateSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AmplifyDomainAssociationCertificateSettings.Jsii$Proxy that = (AmplifyDomainAssociationCertificateSettings.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            return this.customCertificateArn != null ? this.customCertificateArn.equals(that.customCertificateArn) : that.customCertificateArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.customCertificateArn != null ? this.customCertificateArn.hashCode() : 0);
            return result;
        }
    }
}
