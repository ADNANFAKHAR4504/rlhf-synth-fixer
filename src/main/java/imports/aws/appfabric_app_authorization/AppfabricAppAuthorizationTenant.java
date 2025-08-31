package imports.aws.appfabric_app_authorization;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.992Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appfabricAppAuthorization.AppfabricAppAuthorizationTenant")
@software.amazon.jsii.Jsii.Proxy(AppfabricAppAuthorizationTenant.Jsii$Proxy.class)
public interface AppfabricAppAuthorizationTenant extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization#tenant_display_name AppfabricAppAuthorization#tenant_display_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTenantDisplayName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization#tenant_identifier AppfabricAppAuthorization#tenant_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTenantIdentifier();

    /**
     * @return a {@link Builder} of {@link AppfabricAppAuthorizationTenant}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppfabricAppAuthorizationTenant}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppfabricAppAuthorizationTenant> {
        java.lang.String tenantDisplayName;
        java.lang.String tenantIdentifier;

        /**
         * Sets the value of {@link AppfabricAppAuthorizationTenant#getTenantDisplayName}
         * @param tenantDisplayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization#tenant_display_name AppfabricAppAuthorization#tenant_display_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder tenantDisplayName(java.lang.String tenantDisplayName) {
            this.tenantDisplayName = tenantDisplayName;
            return this;
        }

        /**
         * Sets the value of {@link AppfabricAppAuthorizationTenant#getTenantIdentifier}
         * @param tenantIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_app_authorization#tenant_identifier AppfabricAppAuthorization#tenant_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder tenantIdentifier(java.lang.String tenantIdentifier) {
            this.tenantIdentifier = tenantIdentifier;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppfabricAppAuthorizationTenant}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppfabricAppAuthorizationTenant build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppfabricAppAuthorizationTenant}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppfabricAppAuthorizationTenant {
        private final java.lang.String tenantDisplayName;
        private final java.lang.String tenantIdentifier;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.tenantDisplayName = software.amazon.jsii.Kernel.get(this, "tenantDisplayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tenantIdentifier = software.amazon.jsii.Kernel.get(this, "tenantIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.tenantDisplayName = java.util.Objects.requireNonNull(builder.tenantDisplayName, "tenantDisplayName is required");
            this.tenantIdentifier = java.util.Objects.requireNonNull(builder.tenantIdentifier, "tenantIdentifier is required");
        }

        @Override
        public final java.lang.String getTenantDisplayName() {
            return this.tenantDisplayName;
        }

        @Override
        public final java.lang.String getTenantIdentifier() {
            return this.tenantIdentifier;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("tenantDisplayName", om.valueToTree(this.getTenantDisplayName()));
            data.set("tenantIdentifier", om.valueToTree(this.getTenantIdentifier()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appfabricAppAuthorization.AppfabricAppAuthorizationTenant"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppfabricAppAuthorizationTenant.Jsii$Proxy that = (AppfabricAppAuthorizationTenant.Jsii$Proxy) o;

            if (!tenantDisplayName.equals(that.tenantDisplayName)) return false;
            return this.tenantIdentifier.equals(that.tenantIdentifier);
        }

        @Override
        public final int hashCode() {
            int result = this.tenantDisplayName.hashCode();
            result = 31 * result + (this.tenantIdentifier.hashCode());
            return result;
        }
    }
}
