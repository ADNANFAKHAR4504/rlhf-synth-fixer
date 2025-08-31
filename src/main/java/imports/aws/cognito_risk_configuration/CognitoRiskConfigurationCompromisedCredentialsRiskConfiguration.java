package imports.aws.cognito_risk_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.347Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoRiskConfiguration.CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration")
@software.amazon.jsii.Jsii.Proxy(CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration.Jsii$Proxy.class)
public interface CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * actions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#actions CognitoRiskConfiguration#actions}
     */
    @org.jetbrains.annotations.NotNull imports.aws.cognito_risk_configuration.CognitoRiskConfigurationCompromisedCredentialsRiskConfigurationActions getActions();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#event_filter CognitoRiskConfiguration#event_filter}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEventFilter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration> {
        imports.aws.cognito_risk_configuration.CognitoRiskConfigurationCompromisedCredentialsRiskConfigurationActions actions;
        java.util.List<java.lang.String> eventFilter;

        /**
         * Sets the value of {@link CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration#getActions}
         * @param actions actions block. This parameter is required.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#actions CognitoRiskConfiguration#actions}
         * @return {@code this}
         */
        public Builder actions(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationCompromisedCredentialsRiskConfigurationActions actions) {
            this.actions = actions;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration#getEventFilter}
         * @param eventFilter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#event_filter CognitoRiskConfiguration#event_filter}.
         * @return {@code this}
         */
        public Builder eventFilter(java.util.List<java.lang.String> eventFilter) {
            this.eventFilter = eventFilter;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration {
        private final imports.aws.cognito_risk_configuration.CognitoRiskConfigurationCompromisedCredentialsRiskConfigurationActions actions;
        private final java.util.List<java.lang.String> eventFilter;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.actions = software.amazon.jsii.Kernel.get(this, "actions", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationCompromisedCredentialsRiskConfigurationActions.class));
            this.eventFilter = software.amazon.jsii.Kernel.get(this, "eventFilter", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.actions = java.util.Objects.requireNonNull(builder.actions, "actions is required");
            this.eventFilter = builder.eventFilter;
        }

        @Override
        public final imports.aws.cognito_risk_configuration.CognitoRiskConfigurationCompromisedCredentialsRiskConfigurationActions getActions() {
            return this.actions;
        }

        @Override
        public final java.util.List<java.lang.String> getEventFilter() {
            return this.eventFilter;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("actions", om.valueToTree(this.getActions()));
            if (this.getEventFilter() != null) {
                data.set("eventFilter", om.valueToTree(this.getEventFilter()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoRiskConfiguration.CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration.Jsii$Proxy that = (CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration.Jsii$Proxy) o;

            if (!actions.equals(that.actions)) return false;
            return this.eventFilter != null ? this.eventFilter.equals(that.eventFilter) : that.eventFilter == null;
        }

        @Override
        public final int hashCode() {
            int result = this.actions.hashCode();
            result = 31 * result + (this.eventFilter != null ? this.eventFilter.hashCode() : 0);
            return result;
        }
    }
}
