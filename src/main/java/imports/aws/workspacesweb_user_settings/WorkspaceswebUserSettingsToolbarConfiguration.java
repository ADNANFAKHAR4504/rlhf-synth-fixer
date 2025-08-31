package imports.aws.workspacesweb_user_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.692Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspaceswebUserSettings.WorkspaceswebUserSettingsToolbarConfiguration")
@software.amazon.jsii.Jsii.Proxy(WorkspaceswebUserSettingsToolbarConfiguration.Jsii$Proxy.class)
public interface WorkspaceswebUserSettingsToolbarConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#hidden_toolbar_items WorkspaceswebUserSettings#hidden_toolbar_items}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getHiddenToolbarItems() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#max_display_resolution WorkspaceswebUserSettings#max_display_resolution}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMaxDisplayResolution() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#toolbar_type WorkspaceswebUserSettings#toolbar_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getToolbarType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#visual_mode WorkspaceswebUserSettings#visual_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVisualMode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WorkspaceswebUserSettingsToolbarConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WorkspaceswebUserSettingsToolbarConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WorkspaceswebUserSettingsToolbarConfiguration> {
        java.util.List<java.lang.String> hiddenToolbarItems;
        java.lang.String maxDisplayResolution;
        java.lang.String toolbarType;
        java.lang.String visualMode;

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsToolbarConfiguration#getHiddenToolbarItems}
         * @param hiddenToolbarItems Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#hidden_toolbar_items WorkspaceswebUserSettings#hidden_toolbar_items}.
         * @return {@code this}
         */
        public Builder hiddenToolbarItems(java.util.List<java.lang.String> hiddenToolbarItems) {
            this.hiddenToolbarItems = hiddenToolbarItems;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsToolbarConfiguration#getMaxDisplayResolution}
         * @param maxDisplayResolution Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#max_display_resolution WorkspaceswebUserSettings#max_display_resolution}.
         * @return {@code this}
         */
        public Builder maxDisplayResolution(java.lang.String maxDisplayResolution) {
            this.maxDisplayResolution = maxDisplayResolution;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsToolbarConfiguration#getToolbarType}
         * @param toolbarType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#toolbar_type WorkspaceswebUserSettings#toolbar_type}.
         * @return {@code this}
         */
        public Builder toolbarType(java.lang.String toolbarType) {
            this.toolbarType = toolbarType;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebUserSettingsToolbarConfiguration#getVisualMode}
         * @param visualMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_user_settings#visual_mode WorkspaceswebUserSettings#visual_mode}.
         * @return {@code this}
         */
        public Builder visualMode(java.lang.String visualMode) {
            this.visualMode = visualMode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WorkspaceswebUserSettingsToolbarConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WorkspaceswebUserSettingsToolbarConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WorkspaceswebUserSettingsToolbarConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WorkspaceswebUserSettingsToolbarConfiguration {
        private final java.util.List<java.lang.String> hiddenToolbarItems;
        private final java.lang.String maxDisplayResolution;
        private final java.lang.String toolbarType;
        private final java.lang.String visualMode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.hiddenToolbarItems = software.amazon.jsii.Kernel.get(this, "hiddenToolbarItems", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.maxDisplayResolution = software.amazon.jsii.Kernel.get(this, "maxDisplayResolution", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.toolbarType = software.amazon.jsii.Kernel.get(this, "toolbarType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.visualMode = software.amazon.jsii.Kernel.get(this, "visualMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.hiddenToolbarItems = builder.hiddenToolbarItems;
            this.maxDisplayResolution = builder.maxDisplayResolution;
            this.toolbarType = builder.toolbarType;
            this.visualMode = builder.visualMode;
        }

        @Override
        public final java.util.List<java.lang.String> getHiddenToolbarItems() {
            return this.hiddenToolbarItems;
        }

        @Override
        public final java.lang.String getMaxDisplayResolution() {
            return this.maxDisplayResolution;
        }

        @Override
        public final java.lang.String getToolbarType() {
            return this.toolbarType;
        }

        @Override
        public final java.lang.String getVisualMode() {
            return this.visualMode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHiddenToolbarItems() != null) {
                data.set("hiddenToolbarItems", om.valueToTree(this.getHiddenToolbarItems()));
            }
            if (this.getMaxDisplayResolution() != null) {
                data.set("maxDisplayResolution", om.valueToTree(this.getMaxDisplayResolution()));
            }
            if (this.getToolbarType() != null) {
                data.set("toolbarType", om.valueToTree(this.getToolbarType()));
            }
            if (this.getVisualMode() != null) {
                data.set("visualMode", om.valueToTree(this.getVisualMode()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.workspaceswebUserSettings.WorkspaceswebUserSettingsToolbarConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WorkspaceswebUserSettingsToolbarConfiguration.Jsii$Proxy that = (WorkspaceswebUserSettingsToolbarConfiguration.Jsii$Proxy) o;

            if (this.hiddenToolbarItems != null ? !this.hiddenToolbarItems.equals(that.hiddenToolbarItems) : that.hiddenToolbarItems != null) return false;
            if (this.maxDisplayResolution != null ? !this.maxDisplayResolution.equals(that.maxDisplayResolution) : that.maxDisplayResolution != null) return false;
            if (this.toolbarType != null ? !this.toolbarType.equals(that.toolbarType) : that.toolbarType != null) return false;
            return this.visualMode != null ? this.visualMode.equals(that.visualMode) : that.visualMode == null;
        }

        @Override
        public final int hashCode() {
            int result = this.hiddenToolbarItems != null ? this.hiddenToolbarItems.hashCode() : 0;
            result = 31 * result + (this.maxDisplayResolution != null ? this.maxDisplayResolution.hashCode() : 0);
            result = 31 * result + (this.toolbarType != null ? this.toolbarType.hashCode() : 0);
            result = 31 * result + (this.visualMode != null ? this.visualMode.hashCode() : 0);
            return result;
        }
    }
}
