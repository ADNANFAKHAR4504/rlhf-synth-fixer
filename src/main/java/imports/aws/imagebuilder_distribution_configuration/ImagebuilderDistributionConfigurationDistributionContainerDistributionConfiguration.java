package imports.aws.imagebuilder_distribution_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.355Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionContainerDistributionConfiguration")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderDistributionConfigurationDistributionContainerDistributionConfiguration.Jsii$Proxy.class)
public interface ImagebuilderDistributionConfigurationDistributionContainerDistributionConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * target_repository block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#target_repository ImagebuilderDistributionConfiguration#target_repository}
     */
    @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionContainerDistributionConfigurationTargetRepository getTargetRepository();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#container_tags ImagebuilderDistributionConfiguration#container_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getContainerTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#description ImagebuilderDistributionConfiguration#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderDistributionConfigurationDistributionContainerDistributionConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderDistributionConfigurationDistributionContainerDistributionConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderDistributionConfigurationDistributionContainerDistributionConfiguration> {
        imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionContainerDistributionConfigurationTargetRepository targetRepository;
        java.util.List<java.lang.String> containerTags;
        java.lang.String description;

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionContainerDistributionConfiguration#getTargetRepository}
         * @param targetRepository target_repository block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#target_repository ImagebuilderDistributionConfiguration#target_repository}
         * @return {@code this}
         */
        public Builder targetRepository(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionContainerDistributionConfigurationTargetRepository targetRepository) {
            this.targetRepository = targetRepository;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionContainerDistributionConfiguration#getContainerTags}
         * @param containerTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#container_tags ImagebuilderDistributionConfiguration#container_tags}.
         * @return {@code this}
         */
        public Builder containerTags(java.util.List<java.lang.String> containerTags) {
            this.containerTags = containerTags;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionContainerDistributionConfiguration#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#description ImagebuilderDistributionConfiguration#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderDistributionConfigurationDistributionContainerDistributionConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderDistributionConfigurationDistributionContainerDistributionConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderDistributionConfigurationDistributionContainerDistributionConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderDistributionConfigurationDistributionContainerDistributionConfiguration {
        private final imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionContainerDistributionConfigurationTargetRepository targetRepository;
        private final java.util.List<java.lang.String> containerTags;
        private final java.lang.String description;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.targetRepository = software.amazon.jsii.Kernel.get(this, "targetRepository", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionContainerDistributionConfigurationTargetRepository.class));
            this.containerTags = software.amazon.jsii.Kernel.get(this, "containerTags", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.targetRepository = java.util.Objects.requireNonNull(builder.targetRepository, "targetRepository is required");
            this.containerTags = builder.containerTags;
            this.description = builder.description;
        }

        @Override
        public final imports.aws.imagebuilder_distribution_configuration.ImagebuilderDistributionConfigurationDistributionContainerDistributionConfigurationTargetRepository getTargetRepository() {
            return this.targetRepository;
        }

        @Override
        public final java.util.List<java.lang.String> getContainerTags() {
            return this.containerTags;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("targetRepository", om.valueToTree(this.getTargetRepository()));
            if (this.getContainerTags() != null) {
                data.set("containerTags", om.valueToTree(this.getContainerTags()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionContainerDistributionConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderDistributionConfigurationDistributionContainerDistributionConfiguration.Jsii$Proxy that = (ImagebuilderDistributionConfigurationDistributionContainerDistributionConfiguration.Jsii$Proxy) o;

            if (!targetRepository.equals(that.targetRepository)) return false;
            if (this.containerTags != null ? !this.containerTags.equals(that.containerTags) : that.containerTags != null) return false;
            return this.description != null ? this.description.equals(that.description) : that.description == null;
        }

        @Override
        public final int hashCode() {
            int result = this.targetRepository.hashCode();
            result = 31 * result + (this.containerTags != null ? this.containerTags.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            return result;
        }
    }
}
