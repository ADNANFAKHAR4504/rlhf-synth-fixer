package imports.aws.rolesanywhere_trust_anchor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.194Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rolesanywhereTrustAnchor.RolesanywhereTrustAnchorNotificationSettings")
@software.amazon.jsii.Jsii.Proxy(RolesanywhereTrustAnchorNotificationSettings.Jsii$Proxy.class)
public interface RolesanywhereTrustAnchorNotificationSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rolesanywhere_trust_anchor#channel RolesanywhereTrustAnchor#channel}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getChannel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rolesanywhere_trust_anchor#enabled RolesanywhereTrustAnchor#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rolesanywhere_trust_anchor#event RolesanywhereTrustAnchor#event}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEvent() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rolesanywhere_trust_anchor#threshold RolesanywhereTrustAnchor#threshold}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getThreshold() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RolesanywhereTrustAnchorNotificationSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RolesanywhereTrustAnchorNotificationSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RolesanywhereTrustAnchorNotificationSettings> {
        java.lang.String channel;
        java.lang.Object enabled;
        java.lang.String event;
        java.lang.Number threshold;

        /**
         * Sets the value of {@link RolesanywhereTrustAnchorNotificationSettings#getChannel}
         * @param channel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rolesanywhere_trust_anchor#channel RolesanywhereTrustAnchor#channel}.
         * @return {@code this}
         */
        public Builder channel(java.lang.String channel) {
            this.channel = channel;
            return this;
        }

        /**
         * Sets the value of {@link RolesanywhereTrustAnchorNotificationSettings#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rolesanywhere_trust_anchor#enabled RolesanywhereTrustAnchor#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link RolesanywhereTrustAnchorNotificationSettings#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rolesanywhere_trust_anchor#enabled RolesanywhereTrustAnchor#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link RolesanywhereTrustAnchorNotificationSettings#getEvent}
         * @param event Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rolesanywhere_trust_anchor#event RolesanywhereTrustAnchor#event}.
         * @return {@code this}
         */
        public Builder event(java.lang.String event) {
            this.event = event;
            return this;
        }

        /**
         * Sets the value of {@link RolesanywhereTrustAnchorNotificationSettings#getThreshold}
         * @param threshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rolesanywhere_trust_anchor#threshold RolesanywhereTrustAnchor#threshold}.
         * @return {@code this}
         */
        public Builder threshold(java.lang.Number threshold) {
            this.threshold = threshold;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RolesanywhereTrustAnchorNotificationSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RolesanywhereTrustAnchorNotificationSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RolesanywhereTrustAnchorNotificationSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RolesanywhereTrustAnchorNotificationSettings {
        private final java.lang.String channel;
        private final java.lang.Object enabled;
        private final java.lang.String event;
        private final java.lang.Number threshold;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.channel = software.amazon.jsii.Kernel.get(this, "channel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.event = software.amazon.jsii.Kernel.get(this, "event", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.threshold = software.amazon.jsii.Kernel.get(this, "threshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.channel = builder.channel;
            this.enabled = builder.enabled;
            this.event = builder.event;
            this.threshold = builder.threshold;
        }

        @Override
        public final java.lang.String getChannel() {
            return this.channel;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.String getEvent() {
            return this.event;
        }

        @Override
        public final java.lang.Number getThreshold() {
            return this.threshold;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getChannel() != null) {
                data.set("channel", om.valueToTree(this.getChannel()));
            }
            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getEvent() != null) {
                data.set("event", om.valueToTree(this.getEvent()));
            }
            if (this.getThreshold() != null) {
                data.set("threshold", om.valueToTree(this.getThreshold()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rolesanywhereTrustAnchor.RolesanywhereTrustAnchorNotificationSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RolesanywhereTrustAnchorNotificationSettings.Jsii$Proxy that = (RolesanywhereTrustAnchorNotificationSettings.Jsii$Proxy) o;

            if (this.channel != null ? !this.channel.equals(that.channel) : that.channel != null) return false;
            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            if (this.event != null ? !this.event.equals(that.event) : that.event != null) return false;
            return this.threshold != null ? this.threshold.equals(that.threshold) : that.threshold == null;
        }

        @Override
        public final int hashCode() {
            int result = this.channel != null ? this.channel.hashCode() : 0;
            result = 31 * result + (this.enabled != null ? this.enabled.hashCode() : 0);
            result = 31 * result + (this.event != null ? this.event.hashCode() : 0);
            result = 31 * result + (this.threshold != null ? this.threshold.hashCode() : 0);
            return result;
        }
    }
}
