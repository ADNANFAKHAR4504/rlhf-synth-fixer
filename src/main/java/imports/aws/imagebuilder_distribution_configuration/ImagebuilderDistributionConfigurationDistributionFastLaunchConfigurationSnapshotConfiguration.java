package imports.aws.imagebuilder_distribution_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration.Jsii$Proxy.class)
public interface ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#target_resource_count ImagebuilderDistributionConfiguration#target_resource_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTargetResourceCount() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration> {
        java.lang.Number targetResourceCount;

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration#getTargetResourceCount}
         * @param targetResourceCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#target_resource_count ImagebuilderDistributionConfiguration#target_resource_count}.
         * @return {@code this}
         */
        public Builder targetResourceCount(java.lang.Number targetResourceCount) {
            this.targetResourceCount = targetResourceCount;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration {
        private final java.lang.Number targetResourceCount;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.targetResourceCount = software.amazon.jsii.Kernel.get(this, "targetResourceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.targetResourceCount = builder.targetResourceCount;
        }

        @Override
        public final java.lang.Number getTargetResourceCount() {
            return this.targetResourceCount;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getTargetResourceCount() != null) {
                data.set("targetResourceCount", om.valueToTree(this.getTargetResourceCount()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration.Jsii$Proxy that = (ImagebuilderDistributionConfigurationDistributionFastLaunchConfigurationSnapshotConfiguration.Jsii$Proxy) o;

            return this.targetResourceCount != null ? this.targetResourceCount.equals(that.targetResourceCount) : that.targetResourceCount == null;
        }

        @Override
        public final int hashCode() {
            int result = this.targetResourceCount != null ? this.targetResourceCount.hashCode() : 0;
            return result;
        }
    }
}
