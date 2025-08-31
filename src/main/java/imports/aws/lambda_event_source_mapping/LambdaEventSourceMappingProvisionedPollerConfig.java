package imports.aws.lambda_event_source_mapping;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.502Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaEventSourceMapping.LambdaEventSourceMappingProvisionedPollerConfig")
@software.amazon.jsii.Jsii.Proxy(LambdaEventSourceMappingProvisionedPollerConfig.Jsii$Proxy.class)
public interface LambdaEventSourceMappingProvisionedPollerConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_event_source_mapping#maximum_pollers LambdaEventSourceMapping#maximum_pollers}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumPollers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_event_source_mapping#minimum_pollers LambdaEventSourceMapping#minimum_pollers}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinimumPollers() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LambdaEventSourceMappingProvisionedPollerConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LambdaEventSourceMappingProvisionedPollerConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LambdaEventSourceMappingProvisionedPollerConfig> {
        java.lang.Number maximumPollers;
        java.lang.Number minimumPollers;

        /**
         * Sets the value of {@link LambdaEventSourceMappingProvisionedPollerConfig#getMaximumPollers}
         * @param maximumPollers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_event_source_mapping#maximum_pollers LambdaEventSourceMapping#maximum_pollers}.
         * @return {@code this}
         */
        public Builder maximumPollers(java.lang.Number maximumPollers) {
            this.maximumPollers = maximumPollers;
            return this;
        }

        /**
         * Sets the value of {@link LambdaEventSourceMappingProvisionedPollerConfig#getMinimumPollers}
         * @param minimumPollers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_event_source_mapping#minimum_pollers LambdaEventSourceMapping#minimum_pollers}.
         * @return {@code this}
         */
        public Builder minimumPollers(java.lang.Number minimumPollers) {
            this.minimumPollers = minimumPollers;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LambdaEventSourceMappingProvisionedPollerConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LambdaEventSourceMappingProvisionedPollerConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LambdaEventSourceMappingProvisionedPollerConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LambdaEventSourceMappingProvisionedPollerConfig {
        private final java.lang.Number maximumPollers;
        private final java.lang.Number minimumPollers;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maximumPollers = software.amazon.jsii.Kernel.get(this, "maximumPollers", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minimumPollers = software.amazon.jsii.Kernel.get(this, "minimumPollers", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maximumPollers = builder.maximumPollers;
            this.minimumPollers = builder.minimumPollers;
        }

        @Override
        public final java.lang.Number getMaximumPollers() {
            return this.maximumPollers;
        }

        @Override
        public final java.lang.Number getMinimumPollers() {
            return this.minimumPollers;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMaximumPollers() != null) {
                data.set("maximumPollers", om.valueToTree(this.getMaximumPollers()));
            }
            if (this.getMinimumPollers() != null) {
                data.set("minimumPollers", om.valueToTree(this.getMinimumPollers()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lambdaEventSourceMapping.LambdaEventSourceMappingProvisionedPollerConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LambdaEventSourceMappingProvisionedPollerConfig.Jsii$Proxy that = (LambdaEventSourceMappingProvisionedPollerConfig.Jsii$Proxy) o;

            if (this.maximumPollers != null ? !this.maximumPollers.equals(that.maximumPollers) : that.maximumPollers != null) return false;
            return this.minimumPollers != null ? this.minimumPollers.equals(that.minimumPollers) : that.minimumPollers == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maximumPollers != null ? this.maximumPollers.hashCode() : 0;
            result = 31 * result + (this.minimumPollers != null ? this.minimumPollers.hashCode() : 0);
            return result;
        }
    }
}
