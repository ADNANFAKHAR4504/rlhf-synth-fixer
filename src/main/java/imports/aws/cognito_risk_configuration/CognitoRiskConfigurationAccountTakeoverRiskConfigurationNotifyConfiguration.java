package imports.aws.cognito_risk_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.347Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoRiskConfiguration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration")
@software.amazon.jsii.Jsii.Proxy(CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration.Jsii$Proxy.class)
public interface CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#source_arn CognitoRiskConfiguration#source_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceArn();

    /**
     * block_email block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#block_email CognitoRiskConfiguration#block_email}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationBlockEmail getBlockEmail() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#from CognitoRiskConfiguration#from}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFrom() {
        return null;
    }

    /**
     * mfa_email block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#mfa_email CognitoRiskConfiguration#mfa_email}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationMfaEmail getMfaEmail() {
        return null;
    }

    /**
     * no_action_email block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#no_action_email CognitoRiskConfiguration#no_action_email}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationNoActionEmail getNoActionEmail() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#reply_to CognitoRiskConfiguration#reply_to}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReplyTo() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration> {
        java.lang.String sourceArn;
        imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationBlockEmail blockEmail;
        java.lang.String from;
        imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationMfaEmail mfaEmail;
        imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationNoActionEmail noActionEmail;
        java.lang.String replyTo;

        /**
         * Sets the value of {@link CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration#getSourceArn}
         * @param sourceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#source_arn CognitoRiskConfiguration#source_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceArn(java.lang.String sourceArn) {
            this.sourceArn = sourceArn;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration#getBlockEmail}
         * @param blockEmail block_email block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#block_email CognitoRiskConfiguration#block_email}
         * @return {@code this}
         */
        public Builder blockEmail(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationBlockEmail blockEmail) {
            this.blockEmail = blockEmail;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration#getFrom}
         * @param from Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#from CognitoRiskConfiguration#from}.
         * @return {@code this}
         */
        public Builder from(java.lang.String from) {
            this.from = from;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration#getMfaEmail}
         * @param mfaEmail mfa_email block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#mfa_email CognitoRiskConfiguration#mfa_email}
         * @return {@code this}
         */
        public Builder mfaEmail(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationMfaEmail mfaEmail) {
            this.mfaEmail = mfaEmail;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration#getNoActionEmail}
         * @param noActionEmail no_action_email block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#no_action_email CognitoRiskConfiguration#no_action_email}
         * @return {@code this}
         */
        public Builder noActionEmail(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationNoActionEmail noActionEmail) {
            this.noActionEmail = noActionEmail;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration#getReplyTo}
         * @param replyTo Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#reply_to CognitoRiskConfiguration#reply_to}.
         * @return {@code this}
         */
        public Builder replyTo(java.lang.String replyTo) {
            this.replyTo = replyTo;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration {
        private final java.lang.String sourceArn;
        private final imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationBlockEmail blockEmail;
        private final java.lang.String from;
        private final imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationMfaEmail mfaEmail;
        private final imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationNoActionEmail noActionEmail;
        private final java.lang.String replyTo;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sourceArn = software.amazon.jsii.Kernel.get(this, "sourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.blockEmail = software.amazon.jsii.Kernel.get(this, "blockEmail", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationBlockEmail.class));
            this.from = software.amazon.jsii.Kernel.get(this, "from", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mfaEmail = software.amazon.jsii.Kernel.get(this, "mfaEmail", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationMfaEmail.class));
            this.noActionEmail = software.amazon.jsii.Kernel.get(this, "noActionEmail", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationNoActionEmail.class));
            this.replyTo = software.amazon.jsii.Kernel.get(this, "replyTo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sourceArn = java.util.Objects.requireNonNull(builder.sourceArn, "sourceArn is required");
            this.blockEmail = builder.blockEmail;
            this.from = builder.from;
            this.mfaEmail = builder.mfaEmail;
            this.noActionEmail = builder.noActionEmail;
            this.replyTo = builder.replyTo;
        }

        @Override
        public final java.lang.String getSourceArn() {
            return this.sourceArn;
        }

        @Override
        public final imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationBlockEmail getBlockEmail() {
            return this.blockEmail;
        }

        @Override
        public final java.lang.String getFrom() {
            return this.from;
        }

        @Override
        public final imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationMfaEmail getMfaEmail() {
            return this.mfaEmail;
        }

        @Override
        public final imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfigurationNoActionEmail getNoActionEmail() {
            return this.noActionEmail;
        }

        @Override
        public final java.lang.String getReplyTo() {
            return this.replyTo;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("sourceArn", om.valueToTree(this.getSourceArn()));
            if (this.getBlockEmail() != null) {
                data.set("blockEmail", om.valueToTree(this.getBlockEmail()));
            }
            if (this.getFrom() != null) {
                data.set("from", om.valueToTree(this.getFrom()));
            }
            if (this.getMfaEmail() != null) {
                data.set("mfaEmail", om.valueToTree(this.getMfaEmail()));
            }
            if (this.getNoActionEmail() != null) {
                data.set("noActionEmail", om.valueToTree(this.getNoActionEmail()));
            }
            if (this.getReplyTo() != null) {
                data.set("replyTo", om.valueToTree(this.getReplyTo()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoRiskConfiguration.CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration.Jsii$Proxy that = (CognitoRiskConfigurationAccountTakeoverRiskConfigurationNotifyConfiguration.Jsii$Proxy) o;

            if (!sourceArn.equals(that.sourceArn)) return false;
            if (this.blockEmail != null ? !this.blockEmail.equals(that.blockEmail) : that.blockEmail != null) return false;
            if (this.from != null ? !this.from.equals(that.from) : that.from != null) return false;
            if (this.mfaEmail != null ? !this.mfaEmail.equals(that.mfaEmail) : that.mfaEmail != null) return false;
            if (this.noActionEmail != null ? !this.noActionEmail.equals(that.noActionEmail) : that.noActionEmail != null) return false;
            return this.replyTo != null ? this.replyTo.equals(that.replyTo) : that.replyTo == null;
        }

        @Override
        public final int hashCode() {
            int result = this.sourceArn.hashCode();
            result = 31 * result + (this.blockEmail != null ? this.blockEmail.hashCode() : 0);
            result = 31 * result + (this.from != null ? this.from.hashCode() : 0);
            result = 31 * result + (this.mfaEmail != null ? this.mfaEmail.hashCode() : 0);
            result = 31 * result + (this.noActionEmail != null ? this.noActionEmail.hashCode() : 0);
            result = 31 * result + (this.replyTo != null ? this.replyTo.hashCode() : 0);
            return result;
        }
    }
}
