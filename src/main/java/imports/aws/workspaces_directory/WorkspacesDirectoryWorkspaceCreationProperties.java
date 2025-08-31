package imports.aws.workspaces_directory;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.687Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspacesDirectory.WorkspacesDirectoryWorkspaceCreationProperties")
@software.amazon.jsii.Jsii.Proxy(WorkspacesDirectoryWorkspaceCreationProperties.Jsii$Proxy.class)
public interface WorkspacesDirectoryWorkspaceCreationProperties extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#custom_security_group_id WorkspacesDirectory#custom_security_group_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomSecurityGroupId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#default_ou WorkspacesDirectory#default_ou}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultOu() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#enable_internet_access WorkspacesDirectory#enable_internet_access}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableInternetAccess() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#enable_maintenance_mode WorkspacesDirectory#enable_maintenance_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableMaintenanceMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#user_enabled_as_local_administrator WorkspacesDirectory#user_enabled_as_local_administrator}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUserEnabledAsLocalAdministrator() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WorkspacesDirectoryWorkspaceCreationProperties}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WorkspacesDirectoryWorkspaceCreationProperties}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WorkspacesDirectoryWorkspaceCreationProperties> {
        java.lang.String customSecurityGroupId;
        java.lang.String defaultOu;
        java.lang.Object enableInternetAccess;
        java.lang.Object enableMaintenanceMode;
        java.lang.Object userEnabledAsLocalAdministrator;

        /**
         * Sets the value of {@link WorkspacesDirectoryWorkspaceCreationProperties#getCustomSecurityGroupId}
         * @param customSecurityGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#custom_security_group_id WorkspacesDirectory#custom_security_group_id}.
         * @return {@code this}
         */
        public Builder customSecurityGroupId(java.lang.String customSecurityGroupId) {
            this.customSecurityGroupId = customSecurityGroupId;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryWorkspaceCreationProperties#getDefaultOu}
         * @param defaultOu Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#default_ou WorkspacesDirectory#default_ou}.
         * @return {@code this}
         */
        public Builder defaultOu(java.lang.String defaultOu) {
            this.defaultOu = defaultOu;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryWorkspaceCreationProperties#getEnableInternetAccess}
         * @param enableInternetAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#enable_internet_access WorkspacesDirectory#enable_internet_access}.
         * @return {@code this}
         */
        public Builder enableInternetAccess(java.lang.Boolean enableInternetAccess) {
            this.enableInternetAccess = enableInternetAccess;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryWorkspaceCreationProperties#getEnableInternetAccess}
         * @param enableInternetAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#enable_internet_access WorkspacesDirectory#enable_internet_access}.
         * @return {@code this}
         */
        public Builder enableInternetAccess(com.hashicorp.cdktf.IResolvable enableInternetAccess) {
            this.enableInternetAccess = enableInternetAccess;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryWorkspaceCreationProperties#getEnableMaintenanceMode}
         * @param enableMaintenanceMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#enable_maintenance_mode WorkspacesDirectory#enable_maintenance_mode}.
         * @return {@code this}
         */
        public Builder enableMaintenanceMode(java.lang.Boolean enableMaintenanceMode) {
            this.enableMaintenanceMode = enableMaintenanceMode;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryWorkspaceCreationProperties#getEnableMaintenanceMode}
         * @param enableMaintenanceMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#enable_maintenance_mode WorkspacesDirectory#enable_maintenance_mode}.
         * @return {@code this}
         */
        public Builder enableMaintenanceMode(com.hashicorp.cdktf.IResolvable enableMaintenanceMode) {
            this.enableMaintenanceMode = enableMaintenanceMode;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryWorkspaceCreationProperties#getUserEnabledAsLocalAdministrator}
         * @param userEnabledAsLocalAdministrator Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#user_enabled_as_local_administrator WorkspacesDirectory#user_enabled_as_local_administrator}.
         * @return {@code this}
         */
        public Builder userEnabledAsLocalAdministrator(java.lang.Boolean userEnabledAsLocalAdministrator) {
            this.userEnabledAsLocalAdministrator = userEnabledAsLocalAdministrator;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryWorkspaceCreationProperties#getUserEnabledAsLocalAdministrator}
         * @param userEnabledAsLocalAdministrator Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#user_enabled_as_local_administrator WorkspacesDirectory#user_enabled_as_local_administrator}.
         * @return {@code this}
         */
        public Builder userEnabledAsLocalAdministrator(com.hashicorp.cdktf.IResolvable userEnabledAsLocalAdministrator) {
            this.userEnabledAsLocalAdministrator = userEnabledAsLocalAdministrator;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WorkspacesDirectoryWorkspaceCreationProperties}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WorkspacesDirectoryWorkspaceCreationProperties build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WorkspacesDirectoryWorkspaceCreationProperties}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WorkspacesDirectoryWorkspaceCreationProperties {
        private final java.lang.String customSecurityGroupId;
        private final java.lang.String defaultOu;
        private final java.lang.Object enableInternetAccess;
        private final java.lang.Object enableMaintenanceMode;
        private final java.lang.Object userEnabledAsLocalAdministrator;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.customSecurityGroupId = software.amazon.jsii.Kernel.get(this, "customSecurityGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultOu = software.amazon.jsii.Kernel.get(this, "defaultOu", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enableInternetAccess = software.amazon.jsii.Kernel.get(this, "enableInternetAccess", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableMaintenanceMode = software.amazon.jsii.Kernel.get(this, "enableMaintenanceMode", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.userEnabledAsLocalAdministrator = software.amazon.jsii.Kernel.get(this, "userEnabledAsLocalAdministrator", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.customSecurityGroupId = builder.customSecurityGroupId;
            this.defaultOu = builder.defaultOu;
            this.enableInternetAccess = builder.enableInternetAccess;
            this.enableMaintenanceMode = builder.enableMaintenanceMode;
            this.userEnabledAsLocalAdministrator = builder.userEnabledAsLocalAdministrator;
        }

        @Override
        public final java.lang.String getCustomSecurityGroupId() {
            return this.customSecurityGroupId;
        }

        @Override
        public final java.lang.String getDefaultOu() {
            return this.defaultOu;
        }

        @Override
        public final java.lang.Object getEnableInternetAccess() {
            return this.enableInternetAccess;
        }

        @Override
        public final java.lang.Object getEnableMaintenanceMode() {
            return this.enableMaintenanceMode;
        }

        @Override
        public final java.lang.Object getUserEnabledAsLocalAdministrator() {
            return this.userEnabledAsLocalAdministrator;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCustomSecurityGroupId() != null) {
                data.set("customSecurityGroupId", om.valueToTree(this.getCustomSecurityGroupId()));
            }
            if (this.getDefaultOu() != null) {
                data.set("defaultOu", om.valueToTree(this.getDefaultOu()));
            }
            if (this.getEnableInternetAccess() != null) {
                data.set("enableInternetAccess", om.valueToTree(this.getEnableInternetAccess()));
            }
            if (this.getEnableMaintenanceMode() != null) {
                data.set("enableMaintenanceMode", om.valueToTree(this.getEnableMaintenanceMode()));
            }
            if (this.getUserEnabledAsLocalAdministrator() != null) {
                data.set("userEnabledAsLocalAdministrator", om.valueToTree(this.getUserEnabledAsLocalAdministrator()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.workspacesDirectory.WorkspacesDirectoryWorkspaceCreationProperties"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WorkspacesDirectoryWorkspaceCreationProperties.Jsii$Proxy that = (WorkspacesDirectoryWorkspaceCreationProperties.Jsii$Proxy) o;

            if (this.customSecurityGroupId != null ? !this.customSecurityGroupId.equals(that.customSecurityGroupId) : that.customSecurityGroupId != null) return false;
            if (this.defaultOu != null ? !this.defaultOu.equals(that.defaultOu) : that.defaultOu != null) return false;
            if (this.enableInternetAccess != null ? !this.enableInternetAccess.equals(that.enableInternetAccess) : that.enableInternetAccess != null) return false;
            if (this.enableMaintenanceMode != null ? !this.enableMaintenanceMode.equals(that.enableMaintenanceMode) : that.enableMaintenanceMode != null) return false;
            return this.userEnabledAsLocalAdministrator != null ? this.userEnabledAsLocalAdministrator.equals(that.userEnabledAsLocalAdministrator) : that.userEnabledAsLocalAdministrator == null;
        }

        @Override
        public final int hashCode() {
            int result = this.customSecurityGroupId != null ? this.customSecurityGroupId.hashCode() : 0;
            result = 31 * result + (this.defaultOu != null ? this.defaultOu.hashCode() : 0);
            result = 31 * result + (this.enableInternetAccess != null ? this.enableInternetAccess.hashCode() : 0);
            result = 31 * result + (this.enableMaintenanceMode != null ? this.enableMaintenanceMode.hashCode() : 0);
            result = 31 * result + (this.userEnabledAsLocalAdministrator != null ? this.userEnabledAsLocalAdministrator.hashCode() : 0);
            return result;
        }
    }
}
