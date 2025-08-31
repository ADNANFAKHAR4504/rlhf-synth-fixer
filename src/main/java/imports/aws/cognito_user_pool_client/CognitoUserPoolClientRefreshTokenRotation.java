package imports.aws.cognito_user_pool_client;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.358Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPoolClient.CognitoUserPoolClientRefreshTokenRotation")
@software.amazon.jsii.Jsii.Proxy(CognitoUserPoolClientRefreshTokenRotation.Jsii$Proxy.class)
public interface CognitoUserPoolClientRefreshTokenRotation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#feature CognitoUserPoolClient#feature}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFeature();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#retry_grace_period_seconds CognitoUserPoolClient#retry_grace_period_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRetryGracePeriodSeconds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoUserPoolClientRefreshTokenRotation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoUserPoolClientRefreshTokenRotation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoUserPoolClientRefreshTokenRotation> {
        java.lang.String feature;
        java.lang.Number retryGracePeriodSeconds;

        /**
         * Sets the value of {@link CognitoUserPoolClientRefreshTokenRotation#getFeature}
         * @param feature Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#feature CognitoUserPoolClient#feature}. This parameter is required.
         * @return {@code this}
         */
        public Builder feature(java.lang.String feature) {
            this.feature = feature;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserPoolClientRefreshTokenRotation#getRetryGracePeriodSeconds}
         * @param retryGracePeriodSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user_pool_client#retry_grace_period_seconds CognitoUserPoolClient#retry_grace_period_seconds}.
         * @return {@code this}
         */
        public Builder retryGracePeriodSeconds(java.lang.Number retryGracePeriodSeconds) {
            this.retryGracePeriodSeconds = retryGracePeriodSeconds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoUserPoolClientRefreshTokenRotation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoUserPoolClientRefreshTokenRotation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoUserPoolClientRefreshTokenRotation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoUserPoolClientRefreshTokenRotation {
        private final java.lang.String feature;
        private final java.lang.Number retryGracePeriodSeconds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.feature = software.amazon.jsii.Kernel.get(this, "feature", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.retryGracePeriodSeconds = software.amazon.jsii.Kernel.get(this, "retryGracePeriodSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.feature = java.util.Objects.requireNonNull(builder.feature, "feature is required");
            this.retryGracePeriodSeconds = builder.retryGracePeriodSeconds;
        }

        @Override
        public final java.lang.String getFeature() {
            return this.feature;
        }

        @Override
        public final java.lang.Number getRetryGracePeriodSeconds() {
            return this.retryGracePeriodSeconds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("feature", om.valueToTree(this.getFeature()));
            if (this.getRetryGracePeriodSeconds() != null) {
                data.set("retryGracePeriodSeconds", om.valueToTree(this.getRetryGracePeriodSeconds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoUserPoolClient.CognitoUserPoolClientRefreshTokenRotation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoUserPoolClientRefreshTokenRotation.Jsii$Proxy that = (CognitoUserPoolClientRefreshTokenRotation.Jsii$Proxy) o;

            if (!feature.equals(that.feature)) return false;
            return this.retryGracePeriodSeconds != null ? this.retryGracePeriodSeconds.equals(that.retryGracePeriodSeconds) : that.retryGracePeriodSeconds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.feature.hashCode();
            result = 31 * result + (this.retryGracePeriodSeconds != null ? this.retryGracePeriodSeconds.hashCode() : 0);
            return result;
        }
    }
}
