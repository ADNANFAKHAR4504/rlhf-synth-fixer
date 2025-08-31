package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.070Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration")
@software.amazon.jsii.Jsii.Proxy(PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration.Jsii$Proxy.class)
public interface PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * aws_vpc_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#aws_vpc_configuration PipesPipe#aws_vpc_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration getAwsVpcConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration> {
        imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration awsVpcConfiguration;

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration#getAwsVpcConfiguration}
         * @param awsVpcConfiguration aws_vpc_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#aws_vpc_configuration PipesPipe#aws_vpc_configuration}
         * @return {@code this}
         */
        public Builder awsVpcConfiguration(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration awsVpcConfiguration) {
            this.awsVpcConfiguration = awsVpcConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration {
        private final imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration awsVpcConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.awsVpcConfiguration = software.amazon.jsii.Kernel.get(this, "awsVpcConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.awsVpcConfiguration = builder.awsVpcConfiguration;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfigurationAwsVpcConfiguration getAwsVpcConfiguration() {
            return this.awsVpcConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAwsVpcConfiguration() != null) {
                data.set("awsVpcConfiguration", om.valueToTree(this.getAwsVpcConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration.Jsii$Proxy that = (PipesPipeTargetParametersEcsTaskParametersNetworkConfiguration.Jsii$Proxy) o;

            return this.awsVpcConfiguration != null ? this.awsVpcConfiguration.equals(that.awsVpcConfiguration) : that.awsVpcConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.awsVpcConfiguration != null ? this.awsVpcConfiguration.hashCode() : 0;
            return result;
        }
    }
}
