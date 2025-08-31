package imports.aws.lb_listener;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.526Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbListener.LbListenerDefaultAction")
@software.amazon.jsii.Jsii.Proxy(LbListenerDefaultAction.Jsii$Proxy.class)
public interface LbListenerDefaultAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#type LbListener#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * authenticate_cognito block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#authenticate_cognito LbListener#authenticate_cognito}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb_listener.LbListenerDefaultActionAuthenticateCognito getAuthenticateCognito() {
        return null;
    }

    /**
     * authenticate_oidc block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#authenticate_oidc LbListener#authenticate_oidc}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb_listener.LbListenerDefaultActionAuthenticateOidc getAuthenticateOidc() {
        return null;
    }

    /**
     * fixed_response block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#fixed_response LbListener#fixed_response}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb_listener.LbListenerDefaultActionFixedResponse getFixedResponse() {
        return null;
    }

    /**
     * forward block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#forward LbListener#forward}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb_listener.LbListenerDefaultActionForward getForward() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#order LbListener#order}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getOrder() {
        return null;
    }

    /**
     * redirect block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#redirect LbListener#redirect}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb_listener.LbListenerDefaultActionRedirect getRedirect() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#target_group_arn LbListener#target_group_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTargetGroupArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LbListenerDefaultAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LbListenerDefaultAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LbListenerDefaultAction> {
        java.lang.String type;
        imports.aws.lb_listener.LbListenerDefaultActionAuthenticateCognito authenticateCognito;
        imports.aws.lb_listener.LbListenerDefaultActionAuthenticateOidc authenticateOidc;
        imports.aws.lb_listener.LbListenerDefaultActionFixedResponse fixedResponse;
        imports.aws.lb_listener.LbListenerDefaultActionForward forward;
        java.lang.Number order;
        imports.aws.lb_listener.LbListenerDefaultActionRedirect redirect;
        java.lang.String targetGroupArn;

        /**
         * Sets the value of {@link LbListenerDefaultAction#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#type LbListener#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerDefaultAction#getAuthenticateCognito}
         * @param authenticateCognito authenticate_cognito block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#authenticate_cognito LbListener#authenticate_cognito}
         * @return {@code this}
         */
        public Builder authenticateCognito(imports.aws.lb_listener.LbListenerDefaultActionAuthenticateCognito authenticateCognito) {
            this.authenticateCognito = authenticateCognito;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerDefaultAction#getAuthenticateOidc}
         * @param authenticateOidc authenticate_oidc block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#authenticate_oidc LbListener#authenticate_oidc}
         * @return {@code this}
         */
        public Builder authenticateOidc(imports.aws.lb_listener.LbListenerDefaultActionAuthenticateOidc authenticateOidc) {
            this.authenticateOidc = authenticateOidc;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerDefaultAction#getFixedResponse}
         * @param fixedResponse fixed_response block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#fixed_response LbListener#fixed_response}
         * @return {@code this}
         */
        public Builder fixedResponse(imports.aws.lb_listener.LbListenerDefaultActionFixedResponse fixedResponse) {
            this.fixedResponse = fixedResponse;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerDefaultAction#getForward}
         * @param forward forward block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#forward LbListener#forward}
         * @return {@code this}
         */
        public Builder forward(imports.aws.lb_listener.LbListenerDefaultActionForward forward) {
            this.forward = forward;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerDefaultAction#getOrder}
         * @param order Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#order LbListener#order}.
         * @return {@code this}
         */
        public Builder order(java.lang.Number order) {
            this.order = order;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerDefaultAction#getRedirect}
         * @param redirect redirect block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#redirect LbListener#redirect}
         * @return {@code this}
         */
        public Builder redirect(imports.aws.lb_listener.LbListenerDefaultActionRedirect redirect) {
            this.redirect = redirect;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerDefaultAction#getTargetGroupArn}
         * @param targetGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener#target_group_arn LbListener#target_group_arn}.
         * @return {@code this}
         */
        public Builder targetGroupArn(java.lang.String targetGroupArn) {
            this.targetGroupArn = targetGroupArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LbListenerDefaultAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LbListenerDefaultAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LbListenerDefaultAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LbListenerDefaultAction {
        private final java.lang.String type;
        private final imports.aws.lb_listener.LbListenerDefaultActionAuthenticateCognito authenticateCognito;
        private final imports.aws.lb_listener.LbListenerDefaultActionAuthenticateOidc authenticateOidc;
        private final imports.aws.lb_listener.LbListenerDefaultActionFixedResponse fixedResponse;
        private final imports.aws.lb_listener.LbListenerDefaultActionForward forward;
        private final java.lang.Number order;
        private final imports.aws.lb_listener.LbListenerDefaultActionRedirect redirect;
        private final java.lang.String targetGroupArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authenticateCognito = software.amazon.jsii.Kernel.get(this, "authenticateCognito", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener.LbListenerDefaultActionAuthenticateCognito.class));
            this.authenticateOidc = software.amazon.jsii.Kernel.get(this, "authenticateOidc", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener.LbListenerDefaultActionAuthenticateOidc.class));
            this.fixedResponse = software.amazon.jsii.Kernel.get(this, "fixedResponse", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener.LbListenerDefaultActionFixedResponse.class));
            this.forward = software.amazon.jsii.Kernel.get(this, "forward", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener.LbListenerDefaultActionForward.class));
            this.order = software.amazon.jsii.Kernel.get(this, "order", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.redirect = software.amazon.jsii.Kernel.get(this, "redirect", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener.LbListenerDefaultActionRedirect.class));
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
        public final imports.aws.lb_listener.LbListenerDefaultActionAuthenticateCognito getAuthenticateCognito() {
            return this.authenticateCognito;
        }

        @Override
        public final imports.aws.lb_listener.LbListenerDefaultActionAuthenticateOidc getAuthenticateOidc() {
            return this.authenticateOidc;
        }

        @Override
        public final imports.aws.lb_listener.LbListenerDefaultActionFixedResponse getFixedResponse() {
            return this.fixedResponse;
        }

        @Override
        public final imports.aws.lb_listener.LbListenerDefaultActionForward getForward() {
            return this.forward;
        }

        @Override
        public final java.lang.Number getOrder() {
            return this.order;
        }

        @Override
        public final imports.aws.lb_listener.LbListenerDefaultActionRedirect getRedirect() {
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
            struct.set("fqn", om.valueToTree("aws.lbListener.LbListenerDefaultAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LbListenerDefaultAction.Jsii$Proxy that = (LbListenerDefaultAction.Jsii$Proxy) o;

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
