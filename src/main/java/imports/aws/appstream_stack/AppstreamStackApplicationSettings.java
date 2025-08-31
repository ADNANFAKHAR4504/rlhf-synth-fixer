package imports.aws.appstream_stack;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.062Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appstreamStack.AppstreamStackApplicationSettings")
@software.amazon.jsii.Jsii.Proxy(AppstreamStackApplicationSettings.Jsii$Proxy.class)
public interface AppstreamStackApplicationSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#enabled AppstreamStack#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#settings_group AppstreamStack#settings_group}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSettingsGroup() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppstreamStackApplicationSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppstreamStackApplicationSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppstreamStackApplicationSettings> {
        java.lang.Object enabled;
        java.lang.String settingsGroup;

        /**
         * Sets the value of {@link AppstreamStackApplicationSettings#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#enabled AppstreamStack#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackApplicationSettings#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#enabled AppstreamStack#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackApplicationSettings#getSettingsGroup}
         * @param settingsGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#settings_group AppstreamStack#settings_group}.
         * @return {@code this}
         */
        public Builder settingsGroup(java.lang.String settingsGroup) {
            this.settingsGroup = settingsGroup;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppstreamStackApplicationSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppstreamStackApplicationSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppstreamStackApplicationSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppstreamStackApplicationSettings {
        private final java.lang.Object enabled;
        private final java.lang.String settingsGroup;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.settingsGroup = software.amazon.jsii.Kernel.get(this, "settingsGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
            this.settingsGroup = builder.settingsGroup;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.String getSettingsGroup() {
            return this.settingsGroup;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("enabled", om.valueToTree(this.getEnabled()));
            if (this.getSettingsGroup() != null) {
                data.set("settingsGroup", om.valueToTree(this.getSettingsGroup()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appstreamStack.AppstreamStackApplicationSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppstreamStackApplicationSettings.Jsii$Proxy that = (AppstreamStackApplicationSettings.Jsii$Proxy) o;

            if (!enabled.equals(that.enabled)) return false;
            return this.settingsGroup != null ? this.settingsGroup.equals(that.settingsGroup) : that.settingsGroup == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled.hashCode();
            result = 31 * result + (this.settingsGroup != null ? this.settingsGroup.hashCode() : 0);
            return result;
        }
    }
}
