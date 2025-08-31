package imports.aws.imagebuilder_infrastructure_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.365Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderInfrastructureConfiguration.ImagebuilderInfrastructureConfigurationLogging")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderInfrastructureConfigurationLogging.Jsii$Proxy.class)
public interface ImagebuilderInfrastructureConfigurationLogging extends software.amazon.jsii.JsiiSerializable {

    /**
     * s3_logs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#s3_logs ImagebuilderInfrastructureConfiguration#s3_logs}
     */
    @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationLoggingS3Logs getS3Logs();

    /**
     * @return a {@link Builder} of {@link ImagebuilderInfrastructureConfigurationLogging}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderInfrastructureConfigurationLogging}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderInfrastructureConfigurationLogging> {
        imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationLoggingS3Logs s3Logs;

        /**
         * Sets the value of {@link ImagebuilderInfrastructureConfigurationLogging#getS3Logs}
         * @param s3Logs s3_logs block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#s3_logs ImagebuilderInfrastructureConfiguration#s3_logs}
         * @return {@code this}
         */
        public Builder s3Logs(imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationLoggingS3Logs s3Logs) {
            this.s3Logs = s3Logs;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderInfrastructureConfigurationLogging}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderInfrastructureConfigurationLogging build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderInfrastructureConfigurationLogging}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderInfrastructureConfigurationLogging {
        private final imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationLoggingS3Logs s3Logs;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3Logs = software.amazon.jsii.Kernel.get(this, "s3Logs", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationLoggingS3Logs.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3Logs = java.util.Objects.requireNonNull(builder.s3Logs, "s3Logs is required");
        }

        @Override
        public final imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationLoggingS3Logs getS3Logs() {
            return this.s3Logs;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("s3Logs", om.valueToTree(this.getS3Logs()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderInfrastructureConfiguration.ImagebuilderInfrastructureConfigurationLogging"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderInfrastructureConfigurationLogging.Jsii$Proxy that = (ImagebuilderInfrastructureConfigurationLogging.Jsii$Proxy) o;

            return this.s3Logs.equals(that.s3Logs);
        }

        @Override
        public final int hashCode() {
            int result = this.s3Logs.hashCode();
            return result;
        }
    }
}
