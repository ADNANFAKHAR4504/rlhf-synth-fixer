package imports.aws.s3_control_object_lambda_access_point;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.283Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlObjectLambdaAccessPoint.S3ControlObjectLambdaAccessPointConfiguration")
@software.amazon.jsii.Jsii.Proxy(S3ControlObjectLambdaAccessPointConfiguration.Jsii$Proxy.class)
public interface S3ControlObjectLambdaAccessPointConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_object_lambda_access_point#supporting_access_point S3ControlObjectLambdaAccessPoint#supporting_access_point}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSupportingAccessPoint();

    /**
     * transformation_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_object_lambda_access_point#transformation_configuration S3ControlObjectLambdaAccessPoint#transformation_configuration}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getTransformationConfiguration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_object_lambda_access_point#allowed_features S3ControlObjectLambdaAccessPoint#allowed_features}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowedFeatures() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_object_lambda_access_point#cloud_watch_metrics_enabled S3ControlObjectLambdaAccessPoint#cloud_watch_metrics_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCloudWatchMetricsEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3ControlObjectLambdaAccessPointConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ControlObjectLambdaAccessPointConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ControlObjectLambdaAccessPointConfiguration> {
        java.lang.String supportingAccessPoint;
        java.lang.Object transformationConfiguration;
        java.util.List<java.lang.String> allowedFeatures;
        java.lang.Object cloudWatchMetricsEnabled;

        /**
         * Sets the value of {@link S3ControlObjectLambdaAccessPointConfiguration#getSupportingAccessPoint}
         * @param supportingAccessPoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_object_lambda_access_point#supporting_access_point S3ControlObjectLambdaAccessPoint#supporting_access_point}. This parameter is required.
         * @return {@code this}
         */
        public Builder supportingAccessPoint(java.lang.String supportingAccessPoint) {
            this.supportingAccessPoint = supportingAccessPoint;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlObjectLambdaAccessPointConfiguration#getTransformationConfiguration}
         * @param transformationConfiguration transformation_configuration block. This parameter is required.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_object_lambda_access_point#transformation_configuration S3ControlObjectLambdaAccessPoint#transformation_configuration}
         * @return {@code this}
         */
        public Builder transformationConfiguration(com.hashicorp.cdktf.IResolvable transformationConfiguration) {
            this.transformationConfiguration = transformationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlObjectLambdaAccessPointConfiguration#getTransformationConfiguration}
         * @param transformationConfiguration transformation_configuration block. This parameter is required.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_object_lambda_access_point#transformation_configuration S3ControlObjectLambdaAccessPoint#transformation_configuration}
         * @return {@code this}
         */
        public Builder transformationConfiguration(java.util.List<? extends imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration> transformationConfiguration) {
            this.transformationConfiguration = transformationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlObjectLambdaAccessPointConfiguration#getAllowedFeatures}
         * @param allowedFeatures Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_object_lambda_access_point#allowed_features S3ControlObjectLambdaAccessPoint#allowed_features}.
         * @return {@code this}
         */
        public Builder allowedFeatures(java.util.List<java.lang.String> allowedFeatures) {
            this.allowedFeatures = allowedFeatures;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlObjectLambdaAccessPointConfiguration#getCloudWatchMetricsEnabled}
         * @param cloudWatchMetricsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_object_lambda_access_point#cloud_watch_metrics_enabled S3ControlObjectLambdaAccessPoint#cloud_watch_metrics_enabled}.
         * @return {@code this}
         */
        public Builder cloudWatchMetricsEnabled(java.lang.Boolean cloudWatchMetricsEnabled) {
            this.cloudWatchMetricsEnabled = cloudWatchMetricsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlObjectLambdaAccessPointConfiguration#getCloudWatchMetricsEnabled}
         * @param cloudWatchMetricsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_object_lambda_access_point#cloud_watch_metrics_enabled S3ControlObjectLambdaAccessPoint#cloud_watch_metrics_enabled}.
         * @return {@code this}
         */
        public Builder cloudWatchMetricsEnabled(com.hashicorp.cdktf.IResolvable cloudWatchMetricsEnabled) {
            this.cloudWatchMetricsEnabled = cloudWatchMetricsEnabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ControlObjectLambdaAccessPointConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ControlObjectLambdaAccessPointConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ControlObjectLambdaAccessPointConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ControlObjectLambdaAccessPointConfiguration {
        private final java.lang.String supportingAccessPoint;
        private final java.lang.Object transformationConfiguration;
        private final java.util.List<java.lang.String> allowedFeatures;
        private final java.lang.Object cloudWatchMetricsEnabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.supportingAccessPoint = software.amazon.jsii.Kernel.get(this, "supportingAccessPoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.transformationConfiguration = software.amazon.jsii.Kernel.get(this, "transformationConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.allowedFeatures = software.amazon.jsii.Kernel.get(this, "allowedFeatures", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.cloudWatchMetricsEnabled = software.amazon.jsii.Kernel.get(this, "cloudWatchMetricsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.supportingAccessPoint = java.util.Objects.requireNonNull(builder.supportingAccessPoint, "supportingAccessPoint is required");
            this.transformationConfiguration = java.util.Objects.requireNonNull(builder.transformationConfiguration, "transformationConfiguration is required");
            this.allowedFeatures = builder.allowedFeatures;
            this.cloudWatchMetricsEnabled = builder.cloudWatchMetricsEnabled;
        }

        @Override
        public final java.lang.String getSupportingAccessPoint() {
            return this.supportingAccessPoint;
        }

        @Override
        public final java.lang.Object getTransformationConfiguration() {
            return this.transformationConfiguration;
        }

        @Override
        public final java.util.List<java.lang.String> getAllowedFeatures() {
            return this.allowedFeatures;
        }

        @Override
        public final java.lang.Object getCloudWatchMetricsEnabled() {
            return this.cloudWatchMetricsEnabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("supportingAccessPoint", om.valueToTree(this.getSupportingAccessPoint()));
            data.set("transformationConfiguration", om.valueToTree(this.getTransformationConfiguration()));
            if (this.getAllowedFeatures() != null) {
                data.set("allowedFeatures", om.valueToTree(this.getAllowedFeatures()));
            }
            if (this.getCloudWatchMetricsEnabled() != null) {
                data.set("cloudWatchMetricsEnabled", om.valueToTree(this.getCloudWatchMetricsEnabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3ControlObjectLambdaAccessPoint.S3ControlObjectLambdaAccessPointConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ControlObjectLambdaAccessPointConfiguration.Jsii$Proxy that = (S3ControlObjectLambdaAccessPointConfiguration.Jsii$Proxy) o;

            if (!supportingAccessPoint.equals(that.supportingAccessPoint)) return false;
            if (!transformationConfiguration.equals(that.transformationConfiguration)) return false;
            if (this.allowedFeatures != null ? !this.allowedFeatures.equals(that.allowedFeatures) : that.allowedFeatures != null) return false;
            return this.cloudWatchMetricsEnabled != null ? this.cloudWatchMetricsEnabled.equals(that.cloudWatchMetricsEnabled) : that.cloudWatchMetricsEnabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.supportingAccessPoint.hashCode();
            result = 31 * result + (this.transformationConfiguration.hashCode());
            result = 31 * result + (this.allowedFeatures != null ? this.allowedFeatures.hashCode() : 0);
            result = 31 * result + (this.cloudWatchMetricsEnabled != null ? this.cloudWatchMetricsEnabled.hashCode() : 0);
            return result;
        }
    }
}
