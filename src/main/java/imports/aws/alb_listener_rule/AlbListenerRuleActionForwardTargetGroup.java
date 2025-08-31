package imports.aws.alb_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.912Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.albListenerRule.AlbListenerRuleActionForwardTargetGroup")
@software.amazon.jsii.Jsii.Proxy(AlbListenerRuleActionForwardTargetGroup.Jsii$Proxy.class)
public interface AlbListenerRuleActionForwardTargetGroup extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#arn AlbListenerRule#arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#weight AlbListenerRule#weight}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getWeight() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AlbListenerRuleActionForwardTargetGroup}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AlbListenerRuleActionForwardTargetGroup}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AlbListenerRuleActionForwardTargetGroup> {
        java.lang.String arn;
        java.lang.Number weight;

        /**
         * Sets the value of {@link AlbListenerRuleActionForwardTargetGroup#getArn}
         * @param arn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#arn AlbListenerRule#arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder arn(java.lang.String arn) {
            this.arn = arn;
            return this;
        }

        /**
         * Sets the value of {@link AlbListenerRuleActionForwardTargetGroup#getWeight}
         * @param weight Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#weight AlbListenerRule#weight}.
         * @return {@code this}
         */
        public Builder weight(java.lang.Number weight) {
            this.weight = weight;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AlbListenerRuleActionForwardTargetGroup}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AlbListenerRuleActionForwardTargetGroup build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AlbListenerRuleActionForwardTargetGroup}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AlbListenerRuleActionForwardTargetGroup {
        private final java.lang.String arn;
        private final java.lang.Number weight;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.arn = software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.weight = software.amazon.jsii.Kernel.get(this, "weight", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.arn = java.util.Objects.requireNonNull(builder.arn, "arn is required");
            this.weight = builder.weight;
        }

        @Override
        public final java.lang.String getArn() {
            return this.arn;
        }

        @Override
        public final java.lang.Number getWeight() {
            return this.weight;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("arn", om.valueToTree(this.getArn()));
            if (this.getWeight() != null) {
                data.set("weight", om.valueToTree(this.getWeight()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.albListenerRule.AlbListenerRuleActionForwardTargetGroup"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AlbListenerRuleActionForwardTargetGroup.Jsii$Proxy that = (AlbListenerRuleActionForwardTargetGroup.Jsii$Proxy) o;

            if (!arn.equals(that.arn)) return false;
            return this.weight != null ? this.weight.equals(that.weight) : that.weight == null;
        }

        @Override
        public final int hashCode() {
            int result = this.arn.hashCode();
            result = 31 * result + (this.weight != null ? this.weight.hashCode() : 0);
            return result;
        }
    }
}
