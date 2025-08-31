package imports.aws.securitylake_subscriber;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.422Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securitylakeSubscriber.SecuritylakeSubscriberSubscriberIdentity")
@software.amazon.jsii.Jsii.Proxy(SecuritylakeSubscriberSubscriberIdentity.Jsii$Proxy.class)
public interface SecuritylakeSubscriberSubscriberIdentity extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#external_id SecuritylakeSubscriber#external_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getExternalId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#principal SecuritylakeSubscriber#principal}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPrincipal();

    /**
     * @return a {@link Builder} of {@link SecuritylakeSubscriberSubscriberIdentity}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecuritylakeSubscriberSubscriberIdentity}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecuritylakeSubscriberSubscriberIdentity> {
        java.lang.String externalId;
        java.lang.String principal;

        /**
         * Sets the value of {@link SecuritylakeSubscriberSubscriberIdentity#getExternalId}
         * @param externalId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#external_id SecuritylakeSubscriber#external_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder externalId(java.lang.String externalId) {
            this.externalId = externalId;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberSubscriberIdentity#getPrincipal}
         * @param principal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber#principal SecuritylakeSubscriber#principal}. This parameter is required.
         * @return {@code this}
         */
        public Builder principal(java.lang.String principal) {
            this.principal = principal;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecuritylakeSubscriberSubscriberIdentity}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecuritylakeSubscriberSubscriberIdentity build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecuritylakeSubscriberSubscriberIdentity}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecuritylakeSubscriberSubscriberIdentity {
        private final java.lang.String externalId;
        private final java.lang.String principal;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.externalId = software.amazon.jsii.Kernel.get(this, "externalId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.principal = software.amazon.jsii.Kernel.get(this, "principal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.externalId = java.util.Objects.requireNonNull(builder.externalId, "externalId is required");
            this.principal = java.util.Objects.requireNonNull(builder.principal, "principal is required");
        }

        @Override
        public final java.lang.String getExternalId() {
            return this.externalId;
        }

        @Override
        public final java.lang.String getPrincipal() {
            return this.principal;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("externalId", om.valueToTree(this.getExternalId()));
            data.set("principal", om.valueToTree(this.getPrincipal()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securitylakeSubscriber.SecuritylakeSubscriberSubscriberIdentity"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecuritylakeSubscriberSubscriberIdentity.Jsii$Proxy that = (SecuritylakeSubscriberSubscriberIdentity.Jsii$Proxy) o;

            if (!externalId.equals(that.externalId)) return false;
            return this.principal.equals(that.principal);
        }

        @Override
        public final int hashCode() {
            int result = this.externalId.hashCode();
            result = 31 * result + (this.principal.hashCode());
            return result;
        }
    }
}
