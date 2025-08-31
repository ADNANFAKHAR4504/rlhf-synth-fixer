package imports.aws.vpclattice_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.620Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeListenerRule.VpclatticeListenerRuleAction")
@software.amazon.jsii.Jsii.Proxy(VpclatticeListenerRuleAction.Jsii$Proxy.class)
public interface VpclatticeListenerRuleAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * fixed_response block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#fixed_response VpclatticeListenerRule#fixed_response}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleActionFixedResponse getFixedResponse() {
        return null;
    }

    /**
     * forward block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#forward VpclatticeListenerRule#forward}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleActionForward getForward() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpclatticeListenerRuleAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpclatticeListenerRuleAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpclatticeListenerRuleAction> {
        imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleActionFixedResponse fixedResponse;
        imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleActionForward forward;

        /**
         * Sets the value of {@link VpclatticeListenerRuleAction#getFixedResponse}
         * @param fixedResponse fixed_response block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#fixed_response VpclatticeListenerRule#fixed_response}
         * @return {@code this}
         */
        public Builder fixedResponse(imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleActionFixedResponse fixedResponse) {
            this.fixedResponse = fixedResponse;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeListenerRuleAction#getForward}
         * @param forward forward block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#forward VpclatticeListenerRule#forward}
         * @return {@code this}
         */
        public Builder forward(imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleActionForward forward) {
            this.forward = forward;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpclatticeListenerRuleAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpclatticeListenerRuleAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpclatticeListenerRuleAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpclatticeListenerRuleAction {
        private final imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleActionFixedResponse fixedResponse;
        private final imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleActionForward forward;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.fixedResponse = software.amazon.jsii.Kernel.get(this, "fixedResponse", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleActionFixedResponse.class));
            this.forward = software.amazon.jsii.Kernel.get(this, "forward", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleActionForward.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.fixedResponse = builder.fixedResponse;
            this.forward = builder.forward;
        }

        @Override
        public final imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleActionFixedResponse getFixedResponse() {
            return this.fixedResponse;
        }

        @Override
        public final imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleActionForward getForward() {
            return this.forward;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFixedResponse() != null) {
                data.set("fixedResponse", om.valueToTree(this.getFixedResponse()));
            }
            if (this.getForward() != null) {
                data.set("forward", om.valueToTree(this.getForward()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpclatticeListenerRule.VpclatticeListenerRuleAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpclatticeListenerRuleAction.Jsii$Proxy that = (VpclatticeListenerRuleAction.Jsii$Proxy) o;

            if (this.fixedResponse != null ? !this.fixedResponse.equals(that.fixedResponse) : that.fixedResponse != null) return false;
            return this.forward != null ? this.forward.equals(that.forward) : that.forward == null;
        }

        @Override
        public final int hashCode() {
            int result = this.fixedResponse != null ? this.fixedResponse.hashCode() : 0;
            result = 31 * result + (this.forward != null ? this.forward.hashCode() : 0);
            return result;
        }
    }
}
