package imports.aws.verifiedaccess_trust_provider;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.579Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedaccessTrustProvider.VerifiedaccessTrustProviderDeviceOptions")
@software.amazon.jsii.Jsii.Proxy(VerifiedaccessTrustProviderDeviceOptions.Jsii$Proxy.class)
public interface VerifiedaccessTrustProviderDeviceOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#tenant_id VerifiedaccessTrustProvider#tenant_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTenantId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VerifiedaccessTrustProviderDeviceOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedaccessTrustProviderDeviceOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedaccessTrustProviderDeviceOptions> {
        java.lang.String tenantId;

        /**
         * Sets the value of {@link VerifiedaccessTrustProviderDeviceOptions#getTenantId}
         * @param tenantId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_trust_provider#tenant_id VerifiedaccessTrustProvider#tenant_id}.
         * @return {@code this}
         */
        public Builder tenantId(java.lang.String tenantId) {
            this.tenantId = tenantId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VerifiedaccessTrustProviderDeviceOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedaccessTrustProviderDeviceOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedaccessTrustProviderDeviceOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedaccessTrustProviderDeviceOptions {
        private final java.lang.String tenantId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.tenantId = software.amazon.jsii.Kernel.get(this, "tenantId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.tenantId = builder.tenantId;
        }

        @Override
        public final java.lang.String getTenantId() {
            return this.tenantId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getTenantId() != null) {
                data.set("tenantId", om.valueToTree(this.getTenantId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.verifiedaccessTrustProvider.VerifiedaccessTrustProviderDeviceOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedaccessTrustProviderDeviceOptions.Jsii$Proxy that = (VerifiedaccessTrustProviderDeviceOptions.Jsii$Proxy) o;

            return this.tenantId != null ? this.tenantId.equals(that.tenantId) : that.tenantId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.tenantId != null ? this.tenantId.hashCode() : 0;
            return result;
        }
    }
}
