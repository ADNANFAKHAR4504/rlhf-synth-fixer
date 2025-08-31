package imports.aws.kinesis_analytics_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.443Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationInputsProcessingConfigurationLambda")
@software.amazon.jsii.Jsii.Proxy(KinesisAnalyticsApplicationInputsProcessingConfigurationLambda.Jsii$Proxy.class)
public interface KinesisAnalyticsApplicationInputsProcessingConfigurationLambda extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#resource_arn KinesisAnalyticsApplication#resource_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResourceArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#role_arn KinesisAnalyticsApplication#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * @return a {@link Builder} of {@link KinesisAnalyticsApplicationInputsProcessingConfigurationLambda}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisAnalyticsApplicationInputsProcessingConfigurationLambda}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisAnalyticsApplicationInputsProcessingConfigurationLambda> {
        java.lang.String resourceArn;
        java.lang.String roleArn;

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationInputsProcessingConfigurationLambda#getResourceArn}
         * @param resourceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#resource_arn KinesisAnalyticsApplication#resource_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder resourceArn(java.lang.String resourceArn) {
            this.resourceArn = resourceArn;
            return this;
        }

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationInputsProcessingConfigurationLambda#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#role_arn KinesisAnalyticsApplication#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisAnalyticsApplicationInputsProcessingConfigurationLambda}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisAnalyticsApplicationInputsProcessingConfigurationLambda build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisAnalyticsApplicationInputsProcessingConfigurationLambda}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisAnalyticsApplicationInputsProcessingConfigurationLambda {
        private final java.lang.String resourceArn;
        private final java.lang.String roleArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.resourceArn = software.amazon.jsii.Kernel.get(this, "resourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.resourceArn = java.util.Objects.requireNonNull(builder.resourceArn, "resourceArn is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
        }

        @Override
        public final java.lang.String getResourceArn() {
            return this.resourceArn;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("resourceArn", om.valueToTree(this.getResourceArn()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationInputsProcessingConfigurationLambda"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisAnalyticsApplicationInputsProcessingConfigurationLambda.Jsii$Proxy that = (KinesisAnalyticsApplicationInputsProcessingConfigurationLambda.Jsii$Proxy) o;

            if (!resourceArn.equals(that.resourceArn)) return false;
            return this.roleArn.equals(that.roleArn);
        }

        @Override
        public final int hashCode() {
            int result = this.resourceArn.hashCode();
            result = 31 * result + (this.roleArn.hashCode());
            return result;
        }
    }
}
