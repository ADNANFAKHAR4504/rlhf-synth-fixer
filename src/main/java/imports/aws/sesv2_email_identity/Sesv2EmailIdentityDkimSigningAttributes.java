package imports.aws.sesv2_email_identity;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.459Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2EmailIdentity.Sesv2EmailIdentityDkimSigningAttributes")
@software.amazon.jsii.Jsii.Proxy(Sesv2EmailIdentityDkimSigningAttributes.Jsii$Proxy.class)
public interface Sesv2EmailIdentityDkimSigningAttributes extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_email_identity#domain_signing_private_key Sesv2EmailIdentity#domain_signing_private_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomainSigningPrivateKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_email_identity#domain_signing_selector Sesv2EmailIdentity#domain_signing_selector}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomainSigningSelector() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_email_identity#next_signing_key_length Sesv2EmailIdentity#next_signing_key_length}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNextSigningKeyLength() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Sesv2EmailIdentityDkimSigningAttributes}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Sesv2EmailIdentityDkimSigningAttributes}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Sesv2EmailIdentityDkimSigningAttributes> {
        java.lang.String domainSigningPrivateKey;
        java.lang.String domainSigningSelector;
        java.lang.String nextSigningKeyLength;

        /**
         * Sets the value of {@link Sesv2EmailIdentityDkimSigningAttributes#getDomainSigningPrivateKey}
         * @param domainSigningPrivateKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_email_identity#domain_signing_private_key Sesv2EmailIdentity#domain_signing_private_key}.
         * @return {@code this}
         */
        public Builder domainSigningPrivateKey(java.lang.String domainSigningPrivateKey) {
            this.domainSigningPrivateKey = domainSigningPrivateKey;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2EmailIdentityDkimSigningAttributes#getDomainSigningSelector}
         * @param domainSigningSelector Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_email_identity#domain_signing_selector Sesv2EmailIdentity#domain_signing_selector}.
         * @return {@code this}
         */
        public Builder domainSigningSelector(java.lang.String domainSigningSelector) {
            this.domainSigningSelector = domainSigningSelector;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2EmailIdentityDkimSigningAttributes#getNextSigningKeyLength}
         * @param nextSigningKeyLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_email_identity#next_signing_key_length Sesv2EmailIdentity#next_signing_key_length}.
         * @return {@code this}
         */
        public Builder nextSigningKeyLength(java.lang.String nextSigningKeyLength) {
            this.nextSigningKeyLength = nextSigningKeyLength;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Sesv2EmailIdentityDkimSigningAttributes}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Sesv2EmailIdentityDkimSigningAttributes build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Sesv2EmailIdentityDkimSigningAttributes}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Sesv2EmailIdentityDkimSigningAttributes {
        private final java.lang.String domainSigningPrivateKey;
        private final java.lang.String domainSigningSelector;
        private final java.lang.String nextSigningKeyLength;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.domainSigningPrivateKey = software.amazon.jsii.Kernel.get(this, "domainSigningPrivateKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domainSigningSelector = software.amazon.jsii.Kernel.get(this, "domainSigningSelector", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nextSigningKeyLength = software.amazon.jsii.Kernel.get(this, "nextSigningKeyLength", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.domainSigningPrivateKey = builder.domainSigningPrivateKey;
            this.domainSigningSelector = builder.domainSigningSelector;
            this.nextSigningKeyLength = builder.nextSigningKeyLength;
        }

        @Override
        public final java.lang.String getDomainSigningPrivateKey() {
            return this.domainSigningPrivateKey;
        }

        @Override
        public final java.lang.String getDomainSigningSelector() {
            return this.domainSigningSelector;
        }

        @Override
        public final java.lang.String getNextSigningKeyLength() {
            return this.nextSigningKeyLength;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDomainSigningPrivateKey() != null) {
                data.set("domainSigningPrivateKey", om.valueToTree(this.getDomainSigningPrivateKey()));
            }
            if (this.getDomainSigningSelector() != null) {
                data.set("domainSigningSelector", om.valueToTree(this.getDomainSigningSelector()));
            }
            if (this.getNextSigningKeyLength() != null) {
                data.set("nextSigningKeyLength", om.valueToTree(this.getNextSigningKeyLength()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesv2EmailIdentity.Sesv2EmailIdentityDkimSigningAttributes"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Sesv2EmailIdentityDkimSigningAttributes.Jsii$Proxy that = (Sesv2EmailIdentityDkimSigningAttributes.Jsii$Proxy) o;

            if (this.domainSigningPrivateKey != null ? !this.domainSigningPrivateKey.equals(that.domainSigningPrivateKey) : that.domainSigningPrivateKey != null) return false;
            if (this.domainSigningSelector != null ? !this.domainSigningSelector.equals(that.domainSigningSelector) : that.domainSigningSelector != null) return false;
            return this.nextSigningKeyLength != null ? this.nextSigningKeyLength.equals(that.nextSigningKeyLength) : that.nextSigningKeyLength == null;
        }

        @Override
        public final int hashCode() {
            int result = this.domainSigningPrivateKey != null ? this.domainSigningPrivateKey.hashCode() : 0;
            result = 31 * result + (this.domainSigningSelector != null ? this.domainSigningSelector.hashCode() : 0);
            result = 31 * result + (this.nextSigningKeyLength != null ? this.nextSigningKeyLength.hashCode() : 0);
            return result;
        }
    }
}
