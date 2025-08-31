package imports.aws.storagegateway_gateway;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.533Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.storagegatewayGateway.StoragegatewayGatewaySmbActiveDirectorySettings")
@software.amazon.jsii.Jsii.Proxy(StoragegatewayGatewaySmbActiveDirectorySettings.Jsii$Proxy.class)
public interface StoragegatewayGatewaySmbActiveDirectorySettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#domain_name StoragegatewayGateway#domain_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomainName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#password StoragegatewayGateway#password}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPassword();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#username StoragegatewayGateway#username}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUsername();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#domain_controllers StoragegatewayGateway#domain_controllers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDomainControllers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#organizational_unit StoragegatewayGateway#organizational_unit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOrganizationalUnit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#timeout_in_seconds StoragegatewayGateway#timeout_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutInSeconds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link StoragegatewayGatewaySmbActiveDirectorySettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link StoragegatewayGatewaySmbActiveDirectorySettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<StoragegatewayGatewaySmbActiveDirectorySettings> {
        java.lang.String domainName;
        java.lang.String password;
        java.lang.String username;
        java.util.List<java.lang.String> domainControllers;
        java.lang.String organizationalUnit;
        java.lang.Number timeoutInSeconds;

        /**
         * Sets the value of {@link StoragegatewayGatewaySmbActiveDirectorySettings#getDomainName}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#domain_name StoragegatewayGateway#domain_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder domainName(java.lang.String domainName) {
            this.domainName = domainName;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewaySmbActiveDirectorySettings#getPassword}
         * @param password Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#password StoragegatewayGateway#password}. This parameter is required.
         * @return {@code this}
         */
        public Builder password(java.lang.String password) {
            this.password = password;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewaySmbActiveDirectorySettings#getUsername}
         * @param username Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#username StoragegatewayGateway#username}. This parameter is required.
         * @return {@code this}
         */
        public Builder username(java.lang.String username) {
            this.username = username;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewaySmbActiveDirectorySettings#getDomainControllers}
         * @param domainControllers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#domain_controllers StoragegatewayGateway#domain_controllers}.
         * @return {@code this}
         */
        public Builder domainControllers(java.util.List<java.lang.String> domainControllers) {
            this.domainControllers = domainControllers;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewaySmbActiveDirectorySettings#getOrganizationalUnit}
         * @param organizationalUnit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#organizational_unit StoragegatewayGateway#organizational_unit}.
         * @return {@code this}
         */
        public Builder organizationalUnit(java.lang.String organizationalUnit) {
            this.organizationalUnit = organizationalUnit;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayGatewaySmbActiveDirectorySettings#getTimeoutInSeconds}
         * @param timeoutInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#timeout_in_seconds StoragegatewayGateway#timeout_in_seconds}.
         * @return {@code this}
         */
        public Builder timeoutInSeconds(java.lang.Number timeoutInSeconds) {
            this.timeoutInSeconds = timeoutInSeconds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link StoragegatewayGatewaySmbActiveDirectorySettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public StoragegatewayGatewaySmbActiveDirectorySettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link StoragegatewayGatewaySmbActiveDirectorySettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements StoragegatewayGatewaySmbActiveDirectorySettings {
        private final java.lang.String domainName;
        private final java.lang.String password;
        private final java.lang.String username;
        private final java.util.List<java.lang.String> domainControllers;
        private final java.lang.String organizationalUnit;
        private final java.lang.Number timeoutInSeconds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.domainName = software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.password = software.amazon.jsii.Kernel.get(this, "password", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.username = software.amazon.jsii.Kernel.get(this, "username", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domainControllers = software.amazon.jsii.Kernel.get(this, "domainControllers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.organizationalUnit = software.amazon.jsii.Kernel.get(this, "organizationalUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeoutInSeconds = software.amazon.jsii.Kernel.get(this, "timeoutInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.domainName = java.util.Objects.requireNonNull(builder.domainName, "domainName is required");
            this.password = java.util.Objects.requireNonNull(builder.password, "password is required");
            this.username = java.util.Objects.requireNonNull(builder.username, "username is required");
            this.domainControllers = builder.domainControllers;
            this.organizationalUnit = builder.organizationalUnit;
            this.timeoutInSeconds = builder.timeoutInSeconds;
        }

        @Override
        public final java.lang.String getDomainName() {
            return this.domainName;
        }

        @Override
        public final java.lang.String getPassword() {
            return this.password;
        }

        @Override
        public final java.lang.String getUsername() {
            return this.username;
        }

        @Override
        public final java.util.List<java.lang.String> getDomainControllers() {
            return this.domainControllers;
        }

        @Override
        public final java.lang.String getOrganizationalUnit() {
            return this.organizationalUnit;
        }

        @Override
        public final java.lang.Number getTimeoutInSeconds() {
            return this.timeoutInSeconds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("domainName", om.valueToTree(this.getDomainName()));
            data.set("password", om.valueToTree(this.getPassword()));
            data.set("username", om.valueToTree(this.getUsername()));
            if (this.getDomainControllers() != null) {
                data.set("domainControllers", om.valueToTree(this.getDomainControllers()));
            }
            if (this.getOrganizationalUnit() != null) {
                data.set("organizationalUnit", om.valueToTree(this.getOrganizationalUnit()));
            }
            if (this.getTimeoutInSeconds() != null) {
                data.set("timeoutInSeconds", om.valueToTree(this.getTimeoutInSeconds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.storagegatewayGateway.StoragegatewayGatewaySmbActiveDirectorySettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            StoragegatewayGatewaySmbActiveDirectorySettings.Jsii$Proxy that = (StoragegatewayGatewaySmbActiveDirectorySettings.Jsii$Proxy) o;

            if (!domainName.equals(that.domainName)) return false;
            if (!password.equals(that.password)) return false;
            if (!username.equals(that.username)) return false;
            if (this.domainControllers != null ? !this.domainControllers.equals(that.domainControllers) : that.domainControllers != null) return false;
            if (this.organizationalUnit != null ? !this.organizationalUnit.equals(that.organizationalUnit) : that.organizationalUnit != null) return false;
            return this.timeoutInSeconds != null ? this.timeoutInSeconds.equals(that.timeoutInSeconds) : that.timeoutInSeconds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.domainName.hashCode();
            result = 31 * result + (this.password.hashCode());
            result = 31 * result + (this.username.hashCode());
            result = 31 * result + (this.domainControllers != null ? this.domainControllers.hashCode() : 0);
            result = 31 * result + (this.organizationalUnit != null ? this.organizationalUnit.hashCode() : 0);
            result = 31 * result + (this.timeoutInSeconds != null ? this.timeoutInSeconds.hashCode() : 0);
            return result;
        }
    }
}
