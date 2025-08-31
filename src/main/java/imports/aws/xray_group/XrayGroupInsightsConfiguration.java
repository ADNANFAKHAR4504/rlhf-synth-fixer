package imports.aws.xray_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.696Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.xrayGroup.XrayGroupInsightsConfiguration")
@software.amazon.jsii.Jsii.Proxy(XrayGroupInsightsConfiguration.Jsii$Proxy.class)
public interface XrayGroupInsightsConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_group#insights_enabled XrayGroup#insights_enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getInsightsEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_group#notifications_enabled XrayGroup#notifications_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNotificationsEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link XrayGroupInsightsConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link XrayGroupInsightsConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<XrayGroupInsightsConfiguration> {
        java.lang.Object insightsEnabled;
        java.lang.Object notificationsEnabled;

        /**
         * Sets the value of {@link XrayGroupInsightsConfiguration#getInsightsEnabled}
         * @param insightsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_group#insights_enabled XrayGroup#insights_enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder insightsEnabled(java.lang.Boolean insightsEnabled) {
            this.insightsEnabled = insightsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link XrayGroupInsightsConfiguration#getInsightsEnabled}
         * @param insightsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_group#insights_enabled XrayGroup#insights_enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder insightsEnabled(com.hashicorp.cdktf.IResolvable insightsEnabled) {
            this.insightsEnabled = insightsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link XrayGroupInsightsConfiguration#getNotificationsEnabled}
         * @param notificationsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_group#notifications_enabled XrayGroup#notifications_enabled}.
         * @return {@code this}
         */
        public Builder notificationsEnabled(java.lang.Boolean notificationsEnabled) {
            this.notificationsEnabled = notificationsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link XrayGroupInsightsConfiguration#getNotificationsEnabled}
         * @param notificationsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/xray_group#notifications_enabled XrayGroup#notifications_enabled}.
         * @return {@code this}
         */
        public Builder notificationsEnabled(com.hashicorp.cdktf.IResolvable notificationsEnabled) {
            this.notificationsEnabled = notificationsEnabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link XrayGroupInsightsConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public XrayGroupInsightsConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link XrayGroupInsightsConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements XrayGroupInsightsConfiguration {
        private final java.lang.Object insightsEnabled;
        private final java.lang.Object notificationsEnabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.insightsEnabled = software.amazon.jsii.Kernel.get(this, "insightsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.notificationsEnabled = software.amazon.jsii.Kernel.get(this, "notificationsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.insightsEnabled = java.util.Objects.requireNonNull(builder.insightsEnabled, "insightsEnabled is required");
            this.notificationsEnabled = builder.notificationsEnabled;
        }

        @Override
        public final java.lang.Object getInsightsEnabled() {
            return this.insightsEnabled;
        }

        @Override
        public final java.lang.Object getNotificationsEnabled() {
            return this.notificationsEnabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("insightsEnabled", om.valueToTree(this.getInsightsEnabled()));
            if (this.getNotificationsEnabled() != null) {
                data.set("notificationsEnabled", om.valueToTree(this.getNotificationsEnabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.xrayGroup.XrayGroupInsightsConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            XrayGroupInsightsConfiguration.Jsii$Proxy that = (XrayGroupInsightsConfiguration.Jsii$Proxy) o;

            if (!insightsEnabled.equals(that.insightsEnabled)) return false;
            return this.notificationsEnabled != null ? this.notificationsEnabled.equals(that.notificationsEnabled) : that.notificationsEnabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.insightsEnabled.hashCode();
            result = 31 * result + (this.notificationsEnabled != null ? this.notificationsEnabled.hashCode() : 0);
            return result;
        }
    }
}
