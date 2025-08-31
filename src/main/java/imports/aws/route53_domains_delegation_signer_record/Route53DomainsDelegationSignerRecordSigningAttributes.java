package imports.aws.route53_domains_delegation_signer_record;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.196Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53DomainsDelegationSignerRecord.Route53DomainsDelegationSignerRecordSigningAttributes")
@software.amazon.jsii.Jsii.Proxy(Route53DomainsDelegationSignerRecordSigningAttributes.Jsii$Proxy.class)
public interface Route53DomainsDelegationSignerRecordSigningAttributes extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_delegation_signer_record#algorithm Route53DomainsDelegationSignerRecord#algorithm}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getAlgorithm();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_delegation_signer_record#flags Route53DomainsDelegationSignerRecord#flags}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getFlags();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_delegation_signer_record#public_key Route53DomainsDelegationSignerRecord#public_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPublicKey();

    /**
     * @return a {@link Builder} of {@link Route53DomainsDelegationSignerRecordSigningAttributes}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Route53DomainsDelegationSignerRecordSigningAttributes}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Route53DomainsDelegationSignerRecordSigningAttributes> {
        java.lang.Number algorithm;
        java.lang.Number flags;
        java.lang.String publicKey;

        /**
         * Sets the value of {@link Route53DomainsDelegationSignerRecordSigningAttributes#getAlgorithm}
         * @param algorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_delegation_signer_record#algorithm Route53DomainsDelegationSignerRecord#algorithm}. This parameter is required.
         * @return {@code this}
         */
        public Builder algorithm(java.lang.Number algorithm) {
            this.algorithm = algorithm;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDelegationSignerRecordSigningAttributes#getFlags}
         * @param flags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_delegation_signer_record#flags Route53DomainsDelegationSignerRecord#flags}. This parameter is required.
         * @return {@code this}
         */
        public Builder flags(java.lang.Number flags) {
            this.flags = flags;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDelegationSignerRecordSigningAttributes#getPublicKey}
         * @param publicKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_delegation_signer_record#public_key Route53DomainsDelegationSignerRecord#public_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder publicKey(java.lang.String publicKey) {
            this.publicKey = publicKey;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Route53DomainsDelegationSignerRecordSigningAttributes}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Route53DomainsDelegationSignerRecordSigningAttributes build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Route53DomainsDelegationSignerRecordSigningAttributes}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Route53DomainsDelegationSignerRecordSigningAttributes {
        private final java.lang.Number algorithm;
        private final java.lang.Number flags;
        private final java.lang.String publicKey;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.algorithm = software.amazon.jsii.Kernel.get(this, "algorithm", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.flags = software.amazon.jsii.Kernel.get(this, "flags", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.publicKey = software.amazon.jsii.Kernel.get(this, "publicKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.algorithm = java.util.Objects.requireNonNull(builder.algorithm, "algorithm is required");
            this.flags = java.util.Objects.requireNonNull(builder.flags, "flags is required");
            this.publicKey = java.util.Objects.requireNonNull(builder.publicKey, "publicKey is required");
        }

        @Override
        public final java.lang.Number getAlgorithm() {
            return this.algorithm;
        }

        @Override
        public final java.lang.Number getFlags() {
            return this.flags;
        }

        @Override
        public final java.lang.String getPublicKey() {
            return this.publicKey;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("algorithm", om.valueToTree(this.getAlgorithm()));
            data.set("flags", om.valueToTree(this.getFlags()));
            data.set("publicKey", om.valueToTree(this.getPublicKey()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.route53DomainsDelegationSignerRecord.Route53DomainsDelegationSignerRecordSigningAttributes"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Route53DomainsDelegationSignerRecordSigningAttributes.Jsii$Proxy that = (Route53DomainsDelegationSignerRecordSigningAttributes.Jsii$Proxy) o;

            if (!algorithm.equals(that.algorithm)) return false;
            if (!flags.equals(that.flags)) return false;
            return this.publicKey.equals(that.publicKey);
        }

        @Override
        public final int hashCode() {
            int result = this.algorithm.hashCode();
            result = 31 * result + (this.flags.hashCode());
            result = 31 * result + (this.publicKey.hashCode());
            return result;
        }
    }
}
