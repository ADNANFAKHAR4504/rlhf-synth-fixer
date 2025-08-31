package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.355Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolEmailConfiguration")
@software.amazon.jsii.Jsii.Proxy(CognitoUserPoolEmailConfiguration.Jsii$Proxy.class)
public interface CognitoUserPoolEmailConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#configuration_set CognitoUserPool#configuration_set}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConfigurationSet() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#email_sending_account CognitoUserPool#email_sending_account}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEmailSendingAccount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#from_email_address CognitoUserPool#from_email_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFromEmailAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#reply_to_email_address CognitoUserPool#reply_to_email_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReplyToEmailAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#source_arn CognitoUserPool#source_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoUserPoolEmailConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoUserPoolEmailConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoUserPoolEmailConfiguration> {
        java.lang.String configurationSet;
        java.lang.String emailSendingAccount;
        java.lang.String fromEmailAddress;
        java.lang.String replyToEmailAddress;
        java.lang.String sourceArn;

        /**
         * Sets the value of {@link CognitoUserPoolEmailConfiguration#getConfigurationSet}
         * @param configurationSet Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#configuration_set CognitoUserPool#configuration_set}.
         * @return {@code this}
         */
        public Builder configurationSet(java.lang.String configurationSet) {
            this.configurationSet = configurationSet;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolEmailConfiguration#getEmailSendingAccount}
         * @param emailSendingAccount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#email_sending_account CognitoUserPool#email_sending_account}.
         * @return {@code this}
         */
        public Builder emailSendingAccount(java.lang.String emailSendingAccount) {
            this.emailSendingAccount = emailSendingAccount;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolEmailConfiguration#getFromEmailAddress}
         * @param fromEmailAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#from_email_address CognitoUserPool#from_email_address}.
         * @return {@code this}
         */
        public Builder fromEmailAddress(java.lang.String fromEmailAddress) {
            this.fromEmailAddress = fromEmailAddress;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolEmailConfiguration#getReplyToEmailAddress}
         * @param replyToEmailAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#reply_to_email_address CognitoUserPool#reply_to_email_address}.
         * @return {@code this}
         */
        public Builder replyToEmailAddress(java.lang.String replyToEmailAddress) {
            this.replyToEmailAddress = replyToEmailAddress;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolEmailConfiguration#getSourceArn}
         * @param sourceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool#source_arn CognitoUserPool#source_arn}.
         * @return {@code this}
         */
        public Builder sourceArn(java.lang.String sourceArn) {
            this.sourceArn = sourceArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoUserPoolEmailConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoUserPoolEmailConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoUserPoolEmailConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoUserPoolEmailConfiguration {
        private final java.lang.String configurationSet;
        private final java.lang.String emailSendingAccount;
        private final java.lang.String fromEmailAddress;
        private final java.lang.String replyToEmailAddress;
        private final java.lang.String sourceArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.configurationSet = software.amazon.jsii.Kernel.get(this, "configurationSet", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.emailSendingAccount = software.amazon.jsii.Kernel.get(this, "emailSendingAccount", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fromEmailAddress = software.amazon.jsii.Kernel.get(this, "fromEmailAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.replyToEmailAddress = software.amazon.jsii.Kernel.get(this, "replyToEmailAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceArn = software.amazon.jsii.Kernel.get(this, "sourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.configurationSet = builder.configurationSet;
            this.emailSendingAccount = builder.emailSendingAccount;
            this.fromEmailAddress = builder.fromEmailAddress;
            this.replyToEmailAddress = builder.replyToEmailAddress;
            this.sourceArn = builder.sourceArn;
        }

        @Override
        public final java.lang.String getConfigurationSet() {
            return this.configurationSet;
        }

        @Override
        public final java.lang.String getEmailSendingAccount() {
            return this.emailSendingAccount;
        }

        @Override
        public final java.lang.String getFromEmailAddress() {
            return this.fromEmailAddress;
        }

        @Override
        public final java.lang.String getReplyToEmailAddress() {
            return this.replyToEmailAddress;
        }

        @Override
        public final java.lang.String getSourceArn() {
            return this.sourceArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getConfigurationSet() != null) {
                data.set("configurationSet", om.valueToTree(this.getConfigurationSet()));
            }
            if (this.getEmailSendingAccount() != null) {
                data.set("emailSendingAccount", om.valueToTree(this.getEmailSendingAccount()));
            }
            if (this.getFromEmailAddress() != null) {
                data.set("fromEmailAddress", om.valueToTree(this.getFromEmailAddress()));
            }
            if (this.getReplyToEmailAddress() != null) {
                data.set("replyToEmailAddress", om.valueToTree(this.getReplyToEmailAddress()));
            }
            if (this.getSourceArn() != null) {
                data.set("sourceArn", om.valueToTree(this.getSourceArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoUserPool.CognitoUserPoolEmailConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoUserPoolEmailConfiguration.Jsii$Proxy that = (CognitoUserPoolEmailConfiguration.Jsii$Proxy) o;

            if (this.configurationSet != null ? !this.configurationSet.equals(that.configurationSet) : that.configurationSet != null) return false;
            if (this.emailSendingAccount != null ? !this.emailSendingAccount.equals(that.emailSendingAccount) : that.emailSendingAccount != null) return false;
            if (this.fromEmailAddress != null ? !this.fromEmailAddress.equals(that.fromEmailAddress) : that.fromEmailAddress != null) return false;
            if (this.replyToEmailAddress != null ? !this.replyToEmailAddress.equals(that.replyToEmailAddress) : that.replyToEmailAddress != null) return false;
            return this.sourceArn != null ? this.sourceArn.equals(that.sourceArn) : that.sourceArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.configurationSet != null ? this.configurationSet.hashCode() : 0;
            result = 31 * result + (this.emailSendingAccount != null ? this.emailSendingAccount.hashCode() : 0);
            result = 31 * result + (this.fromEmailAddress != null ? this.fromEmailAddress.hashCode() : 0);
            result = 31 * result + (this.replyToEmailAddress != null ? this.replyToEmailAddress.hashCode() : 0);
            result = 31 * result + (this.sourceArn != null ? this.sourceArn.hashCode() : 0);
            return result;
        }
    }
}
