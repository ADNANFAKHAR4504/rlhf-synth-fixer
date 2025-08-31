package imports.aws.osis_pipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.050Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.osisPipeline.OsisPipelineLogPublishingOptions")
@software.amazon.jsii.Jsii.Proxy(OsisPipelineLogPublishingOptions.Jsii$Proxy.class)
public interface OsisPipelineLogPublishingOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * cloudwatch_log_destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#cloudwatch_log_destination OsisPipeline#cloudwatch_log_destination}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCloudwatchLogDestination() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#is_logging_enabled OsisPipeline#is_logging_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIsLoggingEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OsisPipelineLogPublishingOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OsisPipelineLogPublishingOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OsisPipelineLogPublishingOptions> {
        java.lang.Object cloudwatchLogDestination;
        java.lang.Object isLoggingEnabled;

        /**
         * Sets the value of {@link OsisPipelineLogPublishingOptions#getCloudwatchLogDestination}
         * @param cloudwatchLogDestination cloudwatch_log_destination block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#cloudwatch_log_destination OsisPipeline#cloudwatch_log_destination}
         * @return {@code this}
         */
        public Builder cloudwatchLogDestination(com.hashicorp.cdktf.IResolvable cloudwatchLogDestination) {
            this.cloudwatchLogDestination = cloudwatchLogDestination;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineLogPublishingOptions#getCloudwatchLogDestination}
         * @param cloudwatchLogDestination cloudwatch_log_destination block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#cloudwatch_log_destination OsisPipeline#cloudwatch_log_destination}
         * @return {@code this}
         */
        public Builder cloudwatchLogDestination(java.util.List<? extends imports.aws.osis_pipeline.OsisPipelineLogPublishingOptionsCloudwatchLogDestination> cloudwatchLogDestination) {
            this.cloudwatchLogDestination = cloudwatchLogDestination;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineLogPublishingOptions#getIsLoggingEnabled}
         * @param isLoggingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#is_logging_enabled OsisPipeline#is_logging_enabled}.
         * @return {@code this}
         */
        public Builder isLoggingEnabled(java.lang.Boolean isLoggingEnabled) {
            this.isLoggingEnabled = isLoggingEnabled;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineLogPublishingOptions#getIsLoggingEnabled}
         * @param isLoggingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#is_logging_enabled OsisPipeline#is_logging_enabled}.
         * @return {@code this}
         */
        public Builder isLoggingEnabled(com.hashicorp.cdktf.IResolvable isLoggingEnabled) {
            this.isLoggingEnabled = isLoggingEnabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OsisPipelineLogPublishingOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OsisPipelineLogPublishingOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OsisPipelineLogPublishingOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OsisPipelineLogPublishingOptions {
        private final java.lang.Object cloudwatchLogDestination;
        private final java.lang.Object isLoggingEnabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cloudwatchLogDestination = software.amazon.jsii.Kernel.get(this, "cloudwatchLogDestination", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.isLoggingEnabled = software.amazon.jsii.Kernel.get(this, "isLoggingEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cloudwatchLogDestination = builder.cloudwatchLogDestination;
            this.isLoggingEnabled = builder.isLoggingEnabled;
        }

        @Override
        public final java.lang.Object getCloudwatchLogDestination() {
            return this.cloudwatchLogDestination;
        }

        @Override
        public final java.lang.Object getIsLoggingEnabled() {
            return this.isLoggingEnabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCloudwatchLogDestination() != null) {
                data.set("cloudwatchLogDestination", om.valueToTree(this.getCloudwatchLogDestination()));
            }
            if (this.getIsLoggingEnabled() != null) {
                data.set("isLoggingEnabled", om.valueToTree(this.getIsLoggingEnabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.osisPipeline.OsisPipelineLogPublishingOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OsisPipelineLogPublishingOptions.Jsii$Proxy that = (OsisPipelineLogPublishingOptions.Jsii$Proxy) o;

            if (this.cloudwatchLogDestination != null ? !this.cloudwatchLogDestination.equals(that.cloudwatchLogDestination) : that.cloudwatchLogDestination != null) return false;
            return this.isLoggingEnabled != null ? this.isLoggingEnabled.equals(that.isLoggingEnabled) : that.isLoggingEnabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cloudwatchLogDestination != null ? this.cloudwatchLogDestination.hashCode() : 0;
            result = 31 * result + (this.isLoggingEnabled != null ? this.isLoggingEnabled.hashCode() : 0);
            return result;
        }
    }
}
