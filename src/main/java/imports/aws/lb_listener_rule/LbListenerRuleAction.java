package imports.aws.lb_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.531Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbListenerRule.LbListenerRuleAction")
@software.amazon.jsii.Jsii.Proxy(LbListenerRuleAction.Jsii$Proxy.class)
public interface LbListenerRuleAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#type LbListenerRule#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * authenticate_cognito block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#authenticate_cognito LbListenerRule#authenticate_cognito}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb_listener_rule.LbListenerRuleActionAuthenticateCognito getAuthenticateCognito() {
        return null;
    }

    /**
     * authenticate_oidc block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#authenticate_oidc LbListenerRule#authenticate_oidc}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb_listener_rule.LbListenerRuleActionAuthenticateOidc getAuthenticateOidc() {
        return null;
    }

    /**
     * fixed_response block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#fixed_response LbListenerRule#fixed_response}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb_listener_rule.LbListenerRuleActionFixedResponse getFixedResponse() {
        return null;
    }

    /**
     * forward block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#forward LbListenerRule#forward}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb_listener_rule.LbListenerRuleActionForward getForward() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#order LbListenerRule#order}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getOrder() {
        return null;
    }

    /**
     * redirect block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#redirect LbListenerRule#redirect}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb_listener_rule.LbListenerRuleActionRedirect getRedirect() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#target_group_arn LbListenerRule#target_group_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTargetGroupArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LbListenerRuleAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LbListenerRuleAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LbListenerRuleAction> {
        java.lang.String type;
        imports.aws.lb_listener_rule.LbListenerRuleActionAuthenticateCognito authenticateCognito;
        imports.aws.lb_listener_rule.LbListenerRuleActionAuthenticateOidc authenticateOidc;
        imports.aws.lb_listener_rule.LbListenerRuleActionFixedResponse fixedResponse;
        imports.aws.lb_listener_rule.LbListenerRuleActionForward forward;
        java.lang.Number order;
        imports.aws.lb_listener_rule.LbListenerRuleActionRedirect redirect;
        java.lang.String targetGroupArn;

        /**
         * Sets the value of {@link LbListenerRuleAction#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#type LbListenerRule#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleAction#getAuthenticateCognito}
         * @param authenticateCognito authenticate_cognito block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#authenticate_cognito LbListenerRule#authenticate_cognito}
         * @return {@code this}
         */
        public Builder authenticateCognito(imports.aws.lb_listener_rule.LbListenerRuleActionAuthenticateCognito authenticateCognito) {
            this.authenticateCognito = authenticateCognito;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleAction#getAuthenticateOidc}
         * @param authenticateOidc authenticate_oidc block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#authenticate_oidc LbListenerRule#authenticate_oidc}
         * @return {@code this}
         */
        public Builder authenticateOidc(imports.aws.lb_listener_rule.LbListenerRuleActionAuthenticateOidc authenticateOidc) {
            this.authenticateOidc = authenticateOidc;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleAction#getFixedResponse}
         * @param fixedResponse fixed_response block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#fixed_response LbListenerRule#fixed_response}
         * @return {@code this}
         */
        public Builder fixedResponse(imports.aws.lb_listener_rule.LbListenerRuleActionFixedResponse fixedResponse) {
            this.fixedResponse = fixedResponse;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleAction#getForward}
         * @param forward forward block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#forward LbListenerRule#forward}
         * @return {@code this}
         */
        public Builder forward(imports.aws.lb_listener_rule.LbListenerRuleActionForward forward) {
            this.forward = forward;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleAction#getOrder}
         * @param order Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#order LbListenerRule#order}.
         * @return {@code this}
         */
        public Builder order(java.lang.Number order) {
            this.order = order;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleAction#getRedirect}
         * @param redirect redirect block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#redirect LbListenerRule#redirect}
         * @return {@code this}
         */
        public Builder redirect(imports.aws.lb_listener_rule.LbListenerRuleActionRedirect redirect) {
            this.redirect = redirect;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleAction#getTargetGroupArn}
         * @param targetGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#target_group_arn LbListenerRule#target_group_arn}.
         * @return {@code this}
         */
        public Builder targetGroupArn(java.lang.String targetGroupArn) {
            this.targetGroupArn = targetGroupArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LbListenerRuleAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LbListenerRuleAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LbListenerRuleAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LbListenerRuleAction {
        private final java.lang.String type;
        private final imports.aws.lb_listener_rule.LbListenerRuleActionAuthenticateCognito authenticateCognito;
        private final imports.aws.lb_listener_rule.LbListenerRuleActionAuthenticateOidc authenticateOidc;
        private final imports.aws.lb_listener_rule.LbListenerRuleActionFixedResponse fixedResponse;
        private final imports.aws.lb_listener_rule.LbListenerRuleActionForward forward;
        private final java.lang.Number order;
        private final imports.aws.lb_listener_rule.LbListenerRuleActionRedirect redirect;
        private final java.lang.String targetGroupArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authenticateCognito = software.amazon.jsii.Kernel.get(this, "authenticateCognito", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener_rule.LbListenerRuleActionAuthenticateCognito.class));
            this.authenticateOidc = software.amazon.jsii.Kernel.get(this, "authenticateOidc", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener_rule.LbListenerRuleActionAuthenticateOidc.class));
            this.fixedResponse = software.amazon.jsii.Kernel.get(this, "fixedResponse", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener_rule.LbListenerRuleActionFixedResponse.class));
            this.forward = software.amazon.jsii.Kernel.get(this, "forward", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener_rule.LbListenerRuleActionForward.class));
            this.order = software.amazon.jsii.Kernel.get(this, "order", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.redirect = software.amazon.jsii.Kernel.get(this, "redirect", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener_rule.LbListenerRuleActionRedirect.class));
            this.targetGroupArn = software.amazon.jsii.Kernel.get(this, "targetGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.authenticateCognito = builder.authenticateCognito;
            this.authenticateOidc = builder.authenticateOidc;
            this.fixedResponse = builder.fixedResponse;
            this.forward = builder.forward;
            this.order = builder.order;
            this.redirect = builder.redirect;
            this.targetGroupArn = builder.targetGroupArn;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final imports.aws.lb_listener_rule.LbListenerRuleActionAuthenticateCognito getAuthenticateCognito() {
            return this.authenticateCognito;
        }

        @Override
        public final imports.aws.lb_listener_rule.LbListenerRuleActionAuthenticateOidc getAuthenticateOidc() {
            return this.authenticateOidc;
        }

        @Override
        public final imports.aws.lb_listener_rule.LbListenerRuleActionFixedResponse getFixedResponse() {
            return this.fixedResponse;
        }

        @Override
        public final imports.aws.lb_listener_rule.LbListenerRuleActionForward getForward() {
            return this.forward;
        }

        @Override
        public final java.lang.Number getOrder() {
            return this.order;
        }

        @Override
        public final imports.aws.lb_listener_rule.LbListenerRuleActionRedirect getRedirect() {
            return this.redirect;
        }

        @Override
        public final java.lang.String getTargetGroupArn() {
            return this.targetGroupArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getAuthenticateCognito() != null) {
                data.set("authenticateCognito", om.valueToTree(this.getAuthenticateCognito()));
            }
            if (this.getAuthenticateOidc() != null) {
                data.set("authenticateOidc", om.valueToTree(this.getAuthenticateOidc()));
            }
            if (this.getFixedResponse() != null) {
                data.set("fixedResponse", om.valueToTree(this.getFixedResponse()));
            }
            if (this.getForward() != null) {
                data.set("forward", om.valueToTree(this.getForward()));
            }
            if (this.getOrder() != null) {
                data.set("order", om.valueToTree(this.getOrder()));
            }
            if (this.getRedirect() != null) {
                data.set("redirect", om.valueToTree(this.getRedirect()));
            }
            if (this.getTargetGroupArn() != null) {
                data.set("targetGroupArn", om.valueToTree(this.getTargetGroupArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lbListenerRule.LbListenerRuleAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LbListenerRuleAction.Jsii$Proxy that = (LbListenerRuleAction.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            if (this.authenticateCognito != null ? !this.authenticateCognito.equals(that.authenticateCognito) : that.authenticateCognito != null) return false;
            if (this.authenticateOidc != null ? !this.authenticateOidc.equals(that.authenticateOidc) : that.authenticateOidc != null) return false;
            if (this.fixedResponse != null ? !this.fixedResponse.equals(that.fixedResponse) : that.fixedResponse != null) return false;
            if (this.forward != null ? !this.forward.equals(that.forward) : that.forward != null) return false;
            if (this.order != null ? !this.order.equals(that.order) : that.order != null) return false;
            if (this.redirect != null ? !this.redirect.equals(that.redirect) : that.redirect != null) return false;
            return this.targetGroupArn != null ? this.targetGroupArn.equals(that.targetGroupArn) : that.targetGroupArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.authenticateCognito != null ? this.authenticateCognito.hashCode() : 0);
            result = 31 * result + (this.authenticateOidc != null ? this.authenticateOidc.hashCode() : 0);
            result = 31 * result + (this.fixedResponse != null ? this.fixedResponse.hashCode() : 0);
            result = 31 * result + (this.forward != null ? this.forward.hashCode() : 0);
            result = 31 * result + (this.order != null ? this.order.hashCode() : 0);
            result = 31 * result + (this.redirect != null ? this.redirect.hashCode() : 0);
            result = 31 * result + (this.targetGroupArn != null ? this.targetGroupArn.hashCode() : 0);
            return result;
        }
    }
}
