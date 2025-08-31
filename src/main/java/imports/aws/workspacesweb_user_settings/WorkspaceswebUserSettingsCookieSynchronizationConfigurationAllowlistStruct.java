package imports.aws.workspacesweb_user_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.692Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspaceswebUserSettings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct")
@software.amazon.jsii.Jsii.Proxy(WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct.Jsii$Proxy.class)
public interface WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#domain WorkspaceswebUserSettings#domain}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomain();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#name WorkspaceswebUserSettings#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#path WorkspaceswebUserSettings#path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPath() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct> {
        java.lang.String domain;
        java.lang.String name;
        java.lang.String path;

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct#getDomain}
         * @param domain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#domain WorkspaceswebUserSettings#domain}. This parameter is required.
         * @return {@code this}
         */
        public Builder domain(java.lang.String domain) {
            this.domain = domain;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#name WorkspaceswebUserSettings#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct#getPath}
         * @param path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#path WorkspaceswebUserSettings#path}.
         * @return {@code this}
         */
        public Builder path(java.lang.String path) {
            this.path = path;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct {
        private final java.lang.String domain;
        private final java.lang.String name;
        private final java.lang.String path;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.domain = software.amazon.jsii.Kernel.get(this, "domain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.path = software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.domain = java.util.Objects.requireNonNull(builder.domain, "domain is required");
            this.name = builder.name;
            this.path = builder.path;
        }

        @Override
        public final java.lang.String getDomain() {
            return this.domain;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getPath() {
            return this.path;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("domain", om.valueToTree(this.getDomain()));
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getPath() != null) {
                data.set("path", om.valueToTree(this.getPath()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.workspaceswebUserSettings.WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct.Jsii$Proxy that = (WorkspaceswebUserSettingsCookieSynchronizationConfigurationAllowlistStruct.Jsii$Proxy) o;

            if (!domain.equals(that.domain)) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            return this.path != null ? this.path.equals(that.path) : that.path == null;
        }

        @Override
        public final int hashCode() {
            int result = this.domain.hashCode();
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.path != null ? this.path.hashCode() : 0);
            return result;
        }
    }
}
