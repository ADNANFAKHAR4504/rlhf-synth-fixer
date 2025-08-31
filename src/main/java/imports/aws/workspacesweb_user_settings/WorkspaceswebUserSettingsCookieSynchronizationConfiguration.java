package imports.aws.workspacesweb_user_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.692Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspaceswebUserSettings.WorkspaceswebUserSettingsCookieSynchronizationConfiguration")
@software.amazon.jsii.Jsii.Proxy(WorkspaceswebUserSettingsCookieSynchronizationConfiguration.Jsii$Proxy.class)
public interface WorkspaceswebUserSettingsCookieSynchronizationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * allowlist block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#allowlist WorkspaceswebUserSettings#allowlist}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowlist() {
        return null;
    }

    /**
     * blocklist block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#blocklist WorkspaceswebUserSettings#blocklist}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBlocklist() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WorkspaceswebUserSettingsCookieSynchronizationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WorkspaceswebUserSettingsCookieSynchronizationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WorkspaceswebUserSettingsCookieSynchronizationConfiguration> {
        java.lang.Object allowlist;
        java.lang.Object blocklist;

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsCookieSynchronizationConfiguration#getAllowlist}
         * @param allowlist allowlist block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#allowlist WorkspaceswebUserSettings#allowlist}
         * @return {@code this}
         */
        public Builder allowlist(com.hashicorp.cdktf.IResolvable allowlist) {
            this.allowlist = allowlist;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsCookieSynchronizationConfiguration#getAllowlist}
         * @param allowlist allowlist block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#allowlist WorkspaceswebUserSettings#allowlist}
         * @return {@code this}
         */
        public Builder allowlist(java.util.List<? extends imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct> allowlist) {
            this.allowlist = allowlist;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsCookieSynchronizationConfiguration#getBlocklist}
         * @param blocklist blocklist block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#blocklist WorkspaceswebUserSettings#blocklist}
         * @return {@code this}
         */
        public Builder blocklist(com.hashicorp.cdktf.IResolvable blocklist) {
            this.blocklist = blocklist;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsCookieSynchronizationConfiguration#getBlocklist}
         * @param blocklist blocklist block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#blocklist WorkspaceswebUserSettings#blocklist}
         * @return {@code this}
         */
        public Builder blocklist(java.util.List<? extends imports.aws.workspacesweb_user_settings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationBlocklistStruct> blocklist) {
            this.blocklist = blocklist;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WorkspaceswebUserSettingsCookieSynchronizationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WorkspaceswebUserSettingsCookieSynchronizationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WorkspaceswebUserSettingsCookieSynchronizationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WorkspaceswebUserSettingsCookieSynchronizationConfiguration {
        private final java.lang.Object allowlist;
        private final java.lang.Object blocklist;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allowlist = software.amazon.jsii.Kernel.get(this, "allowlist", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.blocklist = software.amazon.jsii.Kernel.get(this, "blocklist", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allowlist = builder.allowlist;
            this.blocklist = builder.blocklist;
        }

        @Override
        public final java.lang.Object getAllowlist() {
            return this.allowlist;
        }

        @Override
        public final java.lang.Object getBlocklist() {
            return this.blocklist;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAllowlist() != null) {
                data.set("allowlist", om.valueToTree(this.getAllowlist()));
            }
            if (this.getBlocklist() != null) {
                data.set("blocklist", om.valueToTree(this.getBlocklist()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.workspaceswebUserSettings.WorkspaceswebUserSettingsCookieSynchronizationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WorkspaceswebUserSettingsCookieSynchronizationConfiguration.Jsii$Proxy that = (WorkspaceswebUserSettingsCookieSynchronizationConfiguration.Jsii$Proxy) o;

            if (this.allowlist != null ? !this.allowlist.equals(that.allowlist) : that.allowlist != null) return false;
            return this.blocklist != null ? this.blocklist.equals(that.blocklist) : that.blocklist == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allowlist != null ? this.allowlist.hashCode() : 0;
            result = 31 * result + (this.blocklist != null ? this.blocklist.hashCode() : 0);
            return result;
        }
    }
}
