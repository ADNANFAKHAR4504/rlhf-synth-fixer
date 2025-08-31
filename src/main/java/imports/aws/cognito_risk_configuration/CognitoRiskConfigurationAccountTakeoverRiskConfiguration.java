package imports.aws.cognito_risk_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.347Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoRiskConfiguration.CognitoRiskConfigurationAccountTakeoverRiskConfiguration")
@software.amazon.jsii.Jsii.Proxy(CognitoRiskConfigurationAccountTakeoverRiskConfiguration.Jsii$Proxy.class)
public interface CognitoRiskConfigurationAccountTakeoverRiskConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * actions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#actions CognitoRiskConfiguration#actions}
     */
    @org.jetbrains.annotations.NotNull imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationActions getActions();

    /**
     * notify_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#notify_configuration CognitoRiskConfiguration#notify_configuration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration getNotifyConfiguration();

    /**
     * @return a {@link Builder} of {@link CognitoRiskConfigurationAccountTakeoverRiskConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoRiskConfigurationAccountTakeoverRiskConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoRiskConfigurationAccountTakeoverRiskConfiguration> {
        imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationActions actions;
        imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration notifyConfiguration;

        /**
         * Sets the value of {@link CognitoRiskConfigurationAccountTakeoverRiskConfiguration#getActions}
         * @param actions actions block. This parameter is required.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#actions CognitoRiskConfiguration#actions}
         * @return {@code this}
         */
        public Builder actions(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationActions actions) {
            this.actions = actions;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationAccountTakeoverRiskConfiguration#getNotifyConfiguration}
         * @param notifyConfiguration notify_configuration block. This parameter is required.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#notify_configuration CognitoRiskConfiguration#notify_configuration}
         * @return {@code this}
         */
        public Builder notifyConfiguration(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration notifyConfiguration) {
            this.notifyConfiguration = notifyConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoRiskConfigurationAccountTakeoverRiskConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoRiskConfigurationAccountTakeoverRiskConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoRiskConfigurationAccountTakeoverRiskConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoRiskConfigurationAccountTakeoverRiskConfiguration {
        private final imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationActions actions;
        private final imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration notifyConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.actions = software.amazon.jsii.Kernel.get(this, "actions", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationActions.class));
            this.notifyConfiguration = software.amazon.jsii.Kernel.get(this, "notifyConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.actions = java.util.Objects.requireNonNull(builder.actions, "actions is required");
            this.notifyConfiguration = java.util.Objects.requireNonNull(builder.notifyConfiguration, "notifyConfiguration is required");
        }

        @Override
        public final imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationActions getActions() {
            return this.actions;
        }

        @Override
        public final imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration getNotifyConfiguration() {
            return this.notifyConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("actions", om.valueToTree(this.getActions()));
            data.set("notifyConfiguration", om.valueToTree(this.getNotifyConfiguration()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoRiskConfiguration.CognitoRiskConfigurationAccountTakeoverRiskConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoRiskConfigurationAccountTakeoverRiskConfiguration.Jsii$Proxy that = (CognitoRiskConfigurationAccountTakeoverRiskConfiguration.Jsii$Proxy) o;

            if (!actions.equals(that.actions)) return false;
            return this.notifyConfiguration.equals(that.notifyConfiguration);
        }

        @Override
        public final int hashCode() {
            int result = this.actions.hashCode();
            result = 31 * result + (this.notifyConfiguration.hashCode());
            return result;
        }
    }
}
