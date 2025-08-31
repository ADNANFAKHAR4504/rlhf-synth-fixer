package imports.aws.cognito_user_pool_client;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.357Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPoolClient.CognitoUserPoolClientAnalyticsConfiguration")
@software.amazon.jsii.Jsii.Proxy(CognitoUserPoolClientAnalyticsConfiguration.Jsii$Proxy.class)
public interface CognitoUserPoolClientAnalyticsConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#application_arn CognitoUserPoolClient#application_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getApplicationArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#application_id CognitoUserPoolClient#application_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getApplicationId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#external_id CognitoUserPoolClient#external_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExternalId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#role_arn CognitoUserPoolClient#role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#user_data_shared CognitoUserPoolClient#user_data_shared}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUserDataShared() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoUserPoolClientAnalyticsConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoUserPoolClientAnalyticsConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoUserPoolClientAnalyticsConfiguration> {
        java.lang.String applicationArn;
        java.lang.String applicationId;
        java.lang.String externalId;
        java.lang.String roleArn;
        java.lang.Object userDataShared;

        /**
         * Sets the value of {@link CognitoUserPoolClientAnalyticsConfiguration#getApplicationArn}
         * @param applicationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#application_arn CognitoUserPoolClient#application_arn}.
         * @return {@code this}
         */
        public Builder applicationArn(java.lang.String applicationArn) {
            this.applicationArn = applicationArn;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolClientAnalyticsConfiguration#getApplicationId}
         * @param applicationId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#application_id CognitoUserPoolClient#application_id}.
         * @return {@code this}
         */
        public Builder applicationId(java.lang.String applicationId) {
            this.applicationId = applicationId;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolClientAnalyticsConfiguration#getExternalId}
         * @param externalId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#external_id CognitoUserPoolClient#external_id}.
         * @return {@code this}
         */
        public Builder externalId(java.lang.String externalId) {
            this.externalId = externalId;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolClientAnalyticsConfiguration#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#role_arn CognitoUserPoolClient#role_arn}.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolClientAnalyticsConfiguration#getUserDataShared}
         * @param userDataShared Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#user_data_shared CognitoUserPoolClient#user_data_shared}.
         * @return {@code this}
         */
        public Builder userDataShared(java.lang.Boolean userDataShared) {
            this.userDataShared = userDataShared;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolClientAnalyticsConfiguration#getUserDataShared}
         * @param userDataShared Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#user_data_shared CognitoUserPoolClient#user_data_shared}.
         * @return {@code this}
         */
        public Builder userDataShared(com.hashicorp.cdktf.IResolvable userDataShared) {
            this.userDataShared = userDataShared;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoUserPoolClientAnalyticsConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoUserPoolClientAnalyticsConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoUserPoolClientAnalyticsConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoUserPoolClientAnalyticsConfiguration {
        private final java.lang.String applicationArn;
        private final java.lang.String applicationId;
        private final java.lang.String externalId;
        private final java.lang.String roleArn;
        private final java.lang.Object userDataShared;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.applicationArn = software.amazon.jsii.Kernel.get(this, "applicationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.applicationId = software.amazon.jsii.Kernel.get(this, "applicationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.externalId = software.amazon.jsii.Kernel.get(this, "externalId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userDataShared = software.amazon.jsii.Kernel.get(this, "userDataShared", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.applicationArn = builder.applicationArn;
            this.applicationId = builder.applicationId;
            this.externalId = builder.externalId;
            this.roleArn = builder.roleArn;
            this.userDataShared = builder.userDataShared;
        }

        @Override
        public final java.lang.String getApplicationArn() {
            return this.applicationArn;
        }

        @Override
        public final java.lang.String getApplicationId() {
            return this.applicationId;
        }

        @Override
        public final java.lang.String getExternalId() {
            return this.externalId;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.Object getUserDataShared() {
            return this.userDataShared;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getApplicationArn() != null) {
                data.set("applicationArn", om.valueToTree(this.getApplicationArn()));
            }
            if (this.getApplicationId() != null) {
                data.set("applicationId", om.valueToTree(this.getApplicationId()));
            }
            if (this.getExternalId() != null) {
                data.set("externalId", om.valueToTree(this.getExternalId()));
            }
            if (this.getRoleArn() != null) {
                data.set("roleArn", om.valueToTree(this.getRoleArn()));
            }
            if (this.getUserDataShared() != null) {
                data.set("userDataShared", om.valueToTree(this.getUserDataShared()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoUserPoolClient.CognitoUserPoolClientAnalyticsConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoUserPoolClientAnalyticsConfiguration.Jsii$Proxy that = (CognitoUserPoolClientAnalyticsConfiguration.Jsii$Proxy) o;

            if (this.applicationArn != null ? !this.applicationArn.equals(that.applicationArn) : that.applicationArn != null) return false;
            if (this.applicationId != null ? !this.applicationId.equals(that.applicationId) : that.applicationId != null) return false;
            if (this.externalId != null ? !this.externalId.equals(that.externalId) : that.externalId != null) return false;
            if (this.roleArn != null ? !this.roleArn.equals(that.roleArn) : that.roleArn != null) return false;
            return this.userDataShared != null ? this.userDataShared.equals(that.userDataShared) : that.userDataShared == null;
        }

        @Override
        public final int hashCode() {
            int result = this.applicationArn != null ? this.applicationArn.hashCode() : 0;
            result = 31 * result + (this.applicationId != null ? this.applicationId.hashCode() : 0);
            result = 31 * result + (this.externalId != null ? this.externalId.hashCode() : 0);
            result = 31 * result + (this.roleArn != null ? this.roleArn.hashCode() : 0);
            result = 31 * result + (this.userDataShared != null ? this.userDataShared.hashCode() : 0);
            return result;
        }
    }
}
