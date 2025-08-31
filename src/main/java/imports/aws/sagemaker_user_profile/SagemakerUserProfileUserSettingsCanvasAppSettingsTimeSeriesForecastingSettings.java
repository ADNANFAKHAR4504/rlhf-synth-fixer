package imports.aws.sagemaker_user_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.349Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings.Jsii$Proxy.class)
public interface SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#amazon_forecast_role_arn SagemakerUserProfile#amazon_forecast_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAmazonForecastRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings> {
        java.lang.String amazonForecastRoleArn;
        java.lang.String status;

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings#getAmazonForecastRoleArn}
         * @param amazonForecastRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#amazon_forecast_role_arn SagemakerUserProfile#amazon_forecast_role_arn}.
         * @return {@code this}
         */
        public Builder amazonForecastRoleArn(java.lang.String amazonForecastRoleArn) {
            this.amazonForecastRoleArn = amazonForecastRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#status SagemakerUserProfile#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings {
        private final java.lang.String amazonForecastRoleArn;
        private final java.lang.String status;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.amazonForecastRoleArn = software.amazon.jsii.Kernel.get(this, "amazonForecastRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.amazonForecastRoleArn = builder.amazonForecastRoleArn;
            this.status = builder.status;
        }

        @Override
        public final java.lang.String getAmazonForecastRoleArn() {
            return this.amazonForecastRoleArn;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAmazonForecastRoleArn() != null) {
                data.set("amazonForecastRoleArn", om.valueToTree(this.getAmazonForecastRoleArn()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings.Jsii$Proxy that = (SagemakerUserProfileUserSettingsCanvasAppSettingsTimeSeriesForecastingSettings.Jsii$Proxy) o;

            if (this.amazonForecastRoleArn != null ? !this.amazonForecastRoleArn.equals(that.amazonForecastRoleArn) : that.amazonForecastRoleArn != null) return false;
            return this.status != null ? this.status.equals(that.status) : that.status == null;
        }

        @Override
        public final int hashCode() {
            int result = this.amazonForecastRoleArn != null ? this.amazonForecastRoleArn.hashCode() : 0;
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            return result;
        }
    }
}
