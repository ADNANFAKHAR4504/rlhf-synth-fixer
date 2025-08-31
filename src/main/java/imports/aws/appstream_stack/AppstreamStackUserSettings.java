package imports.aws.appstream_stack;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.066Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appstreamStack.AppstreamStackUserSettings")
@software.amazon.jsii.Jsii.Proxy(AppstreamStackUserSettings.Jsii$Proxy.class)
public interface AppstreamStackUserSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#action AppstreamStack#action}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAction();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#permission AppstreamStack#permission}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPermission();

    /**
     * @return a {@link Builder} of {@link AppstreamStackUserSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppstreamStackUserSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppstreamStackUserSettings> {
        java.lang.String action;
        java.lang.String permission;

        /**
         * Sets the value of {@link AppstreamStackUserSettings#getAction}
         * @param action Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#action AppstreamStack#action}. This parameter is required.
         * @return {@code this}
         */
        public Builder action(java.lang.String action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackUserSettings#getPermission}
         * @param permission Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#permission AppstreamStack#permission}. This parameter is required.
         * @return {@code this}
         */
        public Builder permission(java.lang.String permission) {
            this.permission = permission;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppstreamStackUserSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppstreamStackUserSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppstreamStackUserSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppstreamStackUserSettings {
        private final java.lang.String action;
        private final java.lang.String permission;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.permission = software.amazon.jsii.Kernel.get(this, "permission", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.action = java.util.Objects.requireNonNull(builder.action, "action is required");
            this.permission = java.util.Objects.requireNonNull(builder.permission, "permission is required");
        }

        @Override
        public final java.lang.String getAction() {
            return this.action;
        }

        @Override
        public final java.lang.String getPermission() {
            return this.permission;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("action", om.valueToTree(this.getAction()));
            data.set("permission", om.valueToTree(this.getPermission()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appstreamStack.AppstreamStackUserSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppstreamStackUserSettings.Jsii$Proxy that = (AppstreamStackUserSettings.Jsii$Proxy) o;

            if (!action.equals(that.action)) return false;
            return this.permission.equals(that.permission);
        }

        @Override
        public final int hashCode() {
            int result = this.action.hashCode();
            result = 31 * result + (this.permission.hashCode());
            return result;
        }
    }
}
