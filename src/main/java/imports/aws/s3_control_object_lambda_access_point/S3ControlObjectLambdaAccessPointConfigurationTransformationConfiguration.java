package imports.aws.s3_control_object_lambda_access_point;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.283Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlObjectLambdaAccessPoint.S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration")
@software.amazon.jsii.Jsii.Proxy(S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration.Jsii$Proxy.class)
public interface S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_object_lambda_access_point#actions S3ControlObjectLambdaAccessPoint#actions}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getActions();

    /**
     * content_transformation block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_object_lambda_access_point#content_transformation S3ControlObjectLambdaAccessPoint#content_transformation}
     */
    @org.jetbrains.annotations.NotNull imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationContentTransformation getContentTransformation();

    /**
     * @return a {@link Builder} of {@link S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration> {
        java.util.List<java.lang.String> actions;
        imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationContentTransformation contentTransformation;

        /**
         * Sets the value of {@link S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration#getActions}
         * @param actions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_object_lambda_access_point#actions S3ControlObjectLambdaAccessPoint#actions}. This parameter is required.
         * @return {@code this}
         */
        public Builder actions(java.util.List<java.lang.String> actions) {
            this.actions = actions;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration#getContentTransformation}
         * @param contentTransformation content_transformation block. This parameter is required.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_object_lambda_access_point#content_transformation S3ControlObjectLambdaAccessPoint#content_transformation}
         * @return {@code this}
         */
        public Builder contentTransformation(imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationContentTransformation contentTransformation) {
            this.contentTransformation = contentTransformation;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration {
        private final java.util.List<java.lang.String> actions;
        private final imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationContentTransformation contentTransformation;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.actions = software.amazon.jsii.Kernel.get(this, "actions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.contentTransformation = software.amazon.jsii.Kernel.get(this, "contentTransformation", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationContentTransformation.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.actions = java.util.Objects.requireNonNull(builder.actions, "actions is required");
            this.contentTransformation = java.util.Objects.requireNonNull(builder.contentTransformation, "contentTransformation is required");
        }

        @Override
        public final java.util.List<java.lang.String> getActions() {
            return this.actions;
        }

        @Override
        public final imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationContentTransformation getContentTransformation() {
            return this.contentTransformation;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("actions", om.valueToTree(this.getActions()));
            data.set("contentTransformation", om.valueToTree(this.getContentTransformation()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3ControlObjectLambdaAccessPoint.S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration.Jsii$Proxy that = (S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration.Jsii$Proxy) o;

            if (!actions.equals(that.actions)) return false;
            return this.contentTransformation.equals(that.contentTransformation);
        }

        @Override
        public final int hashCode() {
            int result = this.actions.hashCode();
            result = 31 * result + (this.contentTransformation.hashCode());
            return result;
        }
    }
}
