package imports.aws.quicksight_dashboard;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.104Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDashboard.QuicksightDashboardPermissions")
@software.amazon.jsii.Jsii.Proxy(QuicksightDashboardPermissions.Jsii$Proxy.class)
public interface QuicksightDashboardPermissions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#actions QuicksightDashboard#actions}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getActions();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#principal QuicksightDashboard#principal}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPrincipal();

    /**
     * @return a {@link Builder} of {@link QuicksightDashboardPermissions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDashboardPermissions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDashboardPermissions> {
        java.util.List<java.lang.String> actions;
        java.lang.String principal;

        /**
         * Sets the value of {@link QuicksightDashboardPermissions#getActions}
         * @param actions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#actions QuicksightDashboard#actions}. This parameter is required.
         * @return {@code this}
         */
        public Builder actions(java.util.List<java.lang.String> actions) {
            this.actions = actions;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardPermissions#getPrincipal}
         * @param principal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#principal QuicksightDashboard#principal}. This parameter is required.
         * @return {@code this}
         */
        public Builder principal(java.lang.String principal) {
            this.principal = principal;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDashboardPermissions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDashboardPermissions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDashboardPermissions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDashboardPermissions {
        private final java.util.List<java.lang.String> actions;
        private final java.lang.String principal;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.actions = software.amazon.jsii.Kernel.get(this, "actions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.principal = software.amazon.jsii.Kernel.get(this, "principal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.actions = java.util.Objects.requireNonNull(builder.actions, "actions is required");
            this.principal = java.util.Objects.requireNonNull(builder.principal, "principal is required");
        }

        @Override
        public final java.util.List<java.lang.String> getActions() {
            return this.actions;
        }

        @Override
        public final java.lang.String getPrincipal() {
            return this.principal;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("actions", om.valueToTree(this.getActions()));
            data.set("principal", om.valueToTree(this.getPrincipal()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDashboard.QuicksightDashboardPermissions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDashboardPermissions.Jsii$Proxy that = (QuicksightDashboardPermissions.Jsii$Proxy) o;

            if (!actions.equals(that.actions)) return false;
            return this.principal.equals(that.principal);
        }

        @Override
        public final int hashCode() {
            int result = this.actions.hashCode();
            result = 31 * result + (this.principal.hashCode());
            return result;
        }
    }
}
