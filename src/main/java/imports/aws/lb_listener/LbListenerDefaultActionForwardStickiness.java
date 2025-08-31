package imports.aws.lb_listener;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.530Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbListener.LbListenerDefaultActionForwardStickiness")
@software.amazon.jsii.Jsii.Proxy(LbListenerDefaultActionForwardStickiness.Jsii$Proxy.class)
public interface LbListenerDefaultActionForwardStickiness extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#duration LbListener#duration}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getDuration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#enabled LbListener#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LbListenerDefaultActionForwardStickiness}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LbListenerDefaultActionForwardStickiness}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LbListenerDefaultActionForwardStickiness> {
        java.lang.Number duration;
        java.lang.Object enabled;

        /**
         * Sets the value of {@link LbListenerDefaultActionForwardStickiness#getDuration}
         * @param duration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#duration LbListener#duration}. This parameter is required.
         * @return {@code this}
         */
        public Builder duration(java.lang.Number duration) {
            this.duration = duration;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerDefaultActionForwardStickiness#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#enabled LbListener#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerDefaultActionForwardStickiness#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#enabled LbListener#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LbListenerDefaultActionForwardStickiness}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LbListenerDefaultActionForwardStickiness build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LbListenerDefaultActionForwardStickiness}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LbListenerDefaultActionForwardStickiness {
        private final java.lang.Number duration;
        private final java.lang.Object enabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.duration = software.amazon.jsii.Kernel.get(this, "duration", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.duration = java.util.Objects.requireNonNull(builder.duration, "duration is required");
            this.enabled = builder.enabled;
        }

        @Override
        public final java.lang.Number getDuration() {
            return this.duration;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("duration", om.valueToTree(this.getDuration()));
            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lbListener.LbListenerDefaultActionForwardStickiness"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LbListenerDefaultActionForwardStickiness.Jsii$Proxy that = (LbListenerDefaultActionForwardStickiness.Jsii$Proxy) o;

            if (!duration.equals(that.duration)) return false;
            return this.enabled != null ? this.enabled.equals(that.enabled) : that.enabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.duration.hashCode();
            result = 31 * result + (this.enabled != null ? this.enabled.hashCode() : 0);
            return result;
        }
    }
}
