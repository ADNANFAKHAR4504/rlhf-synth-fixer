package imports.aws.cognito_risk_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.347Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoRiskConfiguration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationActionsMediumAction")
@software.amazon.jsii.Jsii.Proxy(CognitoRiskConfigurationAccountTakeoverRiskConfigurationActionsMediumAction.Jsii$Proxy.class)
public interface CognitoRiskConfigurationAccountTakeoverRiskConfigurationActionsMediumAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#event_action CognitoRiskConfiguration#event_action}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEventAction();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#notify CognitoRiskConfiguration#notify}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getNotify();

    /**
     * @return a {@link Builder} of {@link CognitoRiskConfigurationAccountTakeoverRiskConfigurationActionsMediumAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoRiskConfigurationAccountTakeoverRiskConfigurationActionsMediumAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoRiskConfigurationAccountTakeoverRiskConfigurationActionsMediumAction> {
        java.lang.String eventAction;
        java.lang.Object notify;

        /**
         * Sets the value of {@link CognitoRiskConfigurationAccountTakeoverRiskConfigurationActionsMediumAction#getEventAction}
         * @param eventAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#event_action CognitoRiskConfiguration#event_action}. This parameter is required.
         * @return {@code this}
         */
        public Builder eventAction(java.lang.String eventAction) {
            this.eventAction = eventAction;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationAccountTakeoverRiskConfigurationActionsMediumAction#getNotify}
         * @param notify Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#notify CognitoRiskConfiguration#notify}. This parameter is required.
         * @return {@code this}
         */
        public Builder notify(java.lang.Boolean notify) {
            this.notify = notify;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationAccountTakeoverRiskConfigurationActionsMediumAction#getNotify}
         * @param notify Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#notify CognitoRiskConfiguration#notify}. This parameter is required.
         * @return {@code this}
         */
        public Builder notify(com.hashicorp.cdktf.IResolvable notify) {
            this.notify = notify;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoRiskConfigurationAccountTakeoverRiskConfigurationActionsMediumAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoRiskConfigurationAccountTakeoverRiskConfigurationActionsMediumAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoRiskConfigurationAccountTakeoverRiskConfigurationActionsMediumAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoRiskConfigurationAccountTakeoverRiskConfigurationActionsMediumAction {
        private final java.lang.String eventAction;
        private final java.lang.Object notify;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.eventAction = software.amazon.jsii.Kernel.get(this, "eventAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.notify = software.amazon.jsii.Kernel.get(this, "notify", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.eventAction = java.util.Objects.requireNonNull(builder.eventAction, "eventAction is required");
            this.notify = java.util.Objects.requireNonNull(builder.notify, "notify is required");
        }

        @Override
        public final java.lang.String getEventAction() {
            return this.eventAction;
        }

        @Override
        public final java.lang.Object getNotify() {
            return this.notify;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("eventAction", om.valueToTree(this.getEventAction()));
            data.set("notify", om.valueToTree(this.getNotify()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoRiskConfiguration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationActionsMediumAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoRiskConfigurationAccountTakeoverRiskConfigurationActionsMediumAction.Jsii$Proxy that = (CognitoRiskConfigurationAccountTakeoverRiskConfigurationActionsMediumAction.Jsii$Proxy) o;

            if (!eventAction.equals(that.eventAction)) return false;
            return this.notify.equals(that.notify);
        }

        @Override
        public final int hashCode() {
            int result = this.eventAction.hashCode();
            result = 31 * result + (this.notify.hashCode());
            return result;
        }
    }
}
