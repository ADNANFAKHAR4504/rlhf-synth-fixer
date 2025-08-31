package imports.aws.imagebuilder_image;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.357Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderImage.ImagebuilderImageImageScanningConfigurationEcrConfiguration")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderImageImageScanningConfigurationEcrConfiguration.Jsii$Proxy.class)
public interface ImagebuilderImageImageScanningConfigurationEcrConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#container_tags ImagebuilderImage#container_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getContainerTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#repository_name ImagebuilderImage#repository_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRepositoryName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderImageImageScanningConfigurationEcrConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderImageImageScanningConfigurationEcrConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderImageImageScanningConfigurationEcrConfiguration> {
        java.util.List<java.lang.String> containerTags;
        java.lang.String repositoryName;

        /**
         * Sets the value of {@link ImagebuilderImageImageScanningConfigurationEcrConfiguration#getContainerTags}
         * @param containerTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#container_tags ImagebuilderImage#container_tags}.
         * @return {@code this}
         */
        public Builder containerTags(java.util.List<java.lang.String> containerTags) {
            this.containerTags = containerTags;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageImageScanningConfigurationEcrConfiguration#getRepositoryName}
         * @param repositoryName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#repository_name ImagebuilderImage#repository_name}.
         * @return {@code this}
         */
        public Builder repositoryName(java.lang.String repositoryName) {
            this.repositoryName = repositoryName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderImageImageScanningConfigurationEcrConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderImageImageScanningConfigurationEcrConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderImageImageScanningConfigurationEcrConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderImageImageScanningConfigurationEcrConfiguration {
        private final java.util.List<java.lang.String> containerTags;
        private final java.lang.String repositoryName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.containerTags = software.amazon.jsii.Kernel.get(this, "containerTags", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.repositoryName = software.amazon.jsii.Kernel.get(this, "repositoryName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.containerTags = builder.containerTags;
            this.repositoryName = builder.repositoryName;
        }

        @Override
        public final java.util.List<java.lang.String> getContainerTags() {
            return this.containerTags;
        }

        @Override
        public final java.lang.String getRepositoryName() {
            return this.repositoryName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getContainerTags() != null) {
                data.set("containerTags", om.valueToTree(this.getContainerTags()));
            }
            if (this.getRepositoryName() != null) {
                data.set("repositoryName", om.valueToTree(this.getRepositoryName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderImage.ImagebuilderImageImageScanningConfigurationEcrConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderImageImageScanningConfigurationEcrConfiguration.Jsii$Proxy that = (ImagebuilderImageImageScanningConfigurationEcrConfiguration.Jsii$Proxy) o;

            if (this.containerTags != null ? !this.containerTags.equals(that.containerTags) : that.containerTags != null) return false;
            return this.repositoryName != null ? this.repositoryName.equals(that.repositoryName) : that.repositoryName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.containerTags != null ? this.containerTags.hashCode() : 0;
            result = 31 * result + (this.repositoryName != null ? this.repositoryName.hashCode() : 0);
            return result;
        }
    }
}
