package imports.aws.appstream_directory_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.059Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appstreamDirectoryConfig.AppstreamDirectoryConfigServiceAccountCredentials")
@software.amazon.jsii.Jsii.Proxy(AppstreamDirectoryConfigServiceAccountCredentials.Jsii$Proxy.class)
public interface AppstreamDirectoryConfigServiceAccountCredentials extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_directory_config#account_name AppstreamDirectoryConfig#account_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAccountName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_directory_config#account_password AppstreamDirectoryConfig#account_password}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAccountPassword();

    /**
     * @return a {@link Builder} of {@link AppstreamDirectoryConfigServiceAccountCredentials}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppstreamDirectoryConfigServiceAccountCredentials}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppstreamDirectoryConfigServiceAccountCredentials> {
        java.lang.String accountName;
        java.lang.String accountPassword;

        /**
         * Sets the value of {@link AppstreamDirectoryConfigServiceAccountCredentials#getAccountName}
         * @param accountName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_directory_config#account_name AppstreamDirectoryConfig#account_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder accountName(java.lang.String accountName) {
            this.accountName = accountName;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamDirectoryConfigServiceAccountCredentials#getAccountPassword}
         * @param accountPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_directory_config#account_password AppstreamDirectoryConfig#account_password}. This parameter is required.
         * @return {@code this}
         */
        public Builder accountPassword(java.lang.String accountPassword) {
            this.accountPassword = accountPassword;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppstreamDirectoryConfigServiceAccountCredentials}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppstreamDirectoryConfigServiceAccountCredentials build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppstreamDirectoryConfigServiceAccountCredentials}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppstreamDirectoryConfigServiceAccountCredentials {
        private final java.lang.String accountName;
        private final java.lang.String accountPassword;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accountName = software.amazon.jsii.Kernel.get(this, "accountName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accountPassword = software.amazon.jsii.Kernel.get(this, "accountPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accountName = java.util.Objects.requireNonNull(builder.accountName, "accountName is required");
            this.accountPassword = java.util.Objects.requireNonNull(builder.accountPassword, "accountPassword is required");
        }

        @Override
        public final java.lang.String getAccountName() {
            return this.accountName;
        }

        @Override
        public final java.lang.String getAccountPassword() {
            return this.accountPassword;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("accountName", om.valueToTree(this.getAccountName()));
            data.set("accountPassword", om.valueToTree(this.getAccountPassword()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appstreamDirectoryConfig.AppstreamDirectoryConfigServiceAccountCredentials"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppstreamDirectoryConfigServiceAccountCredentials.Jsii$Proxy that = (AppstreamDirectoryConfigServiceAccountCredentials.Jsii$Proxy) o;

            if (!accountName.equals(that.accountName)) return false;
            return this.accountPassword.equals(that.accountPassword);
        }

        @Override
        public final int hashCode() {
            int result = this.accountName.hashCode();
            result = 31 * result + (this.accountPassword.hashCode());
            return result;
        }
    }
}
