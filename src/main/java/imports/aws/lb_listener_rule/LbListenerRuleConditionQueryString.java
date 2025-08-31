package imports.aws.lb_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.532Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbListenerRule.LbListenerRuleConditionQueryString")
@software.amazon.jsii.Jsii.Proxy(LbListenerRuleConditionQueryString.Jsii$Proxy.class)
public interface LbListenerRuleConditionQueryString extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#value LbListenerRule#value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getValue();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#key LbListenerRule#key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKey() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LbListenerRuleConditionQueryString}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LbListenerRuleConditionQueryString}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LbListenerRuleConditionQueryString> {
        java.lang.String value;
        java.lang.String key;

        /**
         * Sets the value of {@link LbListenerRuleConditionQueryString#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#value LbListenerRule#value}. This parameter is required.
         * @return {@code this}
         */
        public Builder value(java.lang.String value) {
            this.value = value;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleConditionQueryString#getKey}
         * @param key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#key LbListenerRule#key}.
         * @return {@code this}
         */
        public Builder key(java.lang.String key) {
            this.key = key;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LbListenerRuleConditionQueryString}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LbListenerRuleConditionQueryString build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LbListenerRuleConditionQueryString}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LbListenerRuleConditionQueryString {
        private final java.lang.String value;
        private final java.lang.String key;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.key = software.amazon.jsii.Kernel.get(this, "key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.value = java.util.Objects.requireNonNull(builder.value, "value is required");
            this.key = builder.key;
        }

        @Override
        public final java.lang.String getValue() {
            return this.value;
        }

        @Override
        public final java.lang.String getKey() {
            return this.key;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("value", om.valueToTree(this.getValue()));
            if (this.getKey() != null) {
                data.set("key", om.valueToTree(this.getKey()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lbListenerRule.LbListenerRuleConditionQueryString"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LbListenerRuleConditionQueryString.Jsii$Proxy that = (LbListenerRuleConditionQueryString.Jsii$Proxy) o;

            if (!value.equals(that.value)) return false;
            return this.key != null ? this.key.equals(that.key) : that.key == null;
        }

        @Override
        public final int hashCode() {
            int result = this.value.hashCode();
            result = 31 * result + (this.key != null ? this.key.hashCode() : 0);
            return result;
        }
    }
}
