package imports.aws.imagebuilder_container_recipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.349Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderContainerRecipe.ImagebuilderContainerRecipeInstanceConfiguration")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderContainerRecipeInstanceConfiguration.Jsii$Proxy.class)
public interface ImagebuilderContainerRecipeInstanceConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * block_device_mapping block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#block_device_mapping ImagebuilderContainerRecipe#block_device_mapping}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBlockDeviceMapping() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#image ImagebuilderContainerRecipe#image}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getImage() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderContainerRecipeInstanceConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderContainerRecipeInstanceConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderContainerRecipeInstanceConfiguration> {
        java.lang.Object blockDeviceMapping;
        java.lang.String image;

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeInstanceConfiguration#getBlockDeviceMapping}
         * @param blockDeviceMapping block_device_mapping block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#block_device_mapping ImagebuilderContainerRecipe#block_device_mapping}
         * @return {@code this}
         */
        public Builder blockDeviceMapping(com.hashicorp.cdktf.IResolvable blockDeviceMapping) {
            this.blockDeviceMapping = blockDeviceMapping;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeInstanceConfiguration#getBlockDeviceMapping}
         * @param blockDeviceMapping block_device_mapping block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#block_device_mapping ImagebuilderContainerRecipe#block_device_mapping}
         * @return {@code this}
         */
        public Builder blockDeviceMapping(java.util.List<? extends imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeInstanceConfigurationBlockDeviceMapping> blockDeviceMapping) {
            this.blockDeviceMapping = blockDeviceMapping;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeInstanceConfiguration#getImage}
         * @param image Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#image ImagebuilderContainerRecipe#image}.
         * @return {@code this}
         */
        public Builder image(java.lang.String image) {
            this.image = image;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderContainerRecipeInstanceConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderContainerRecipeInstanceConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderContainerRecipeInstanceConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderContainerRecipeInstanceConfiguration {
        private final java.lang.Object blockDeviceMapping;
        private final java.lang.String image;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.blockDeviceMapping = software.amazon.jsii.Kernel.get(this, "blockDeviceMapping", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.image = software.amazon.jsii.Kernel.get(this, "image", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.blockDeviceMapping = builder.blockDeviceMapping;
            this.image = builder.image;
        }

        @Override
        public final java.lang.Object getBlockDeviceMapping() {
            return this.blockDeviceMapping;
        }

        @Override
        public final java.lang.String getImage() {
            return this.image;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBlockDeviceMapping() != null) {
                data.set("blockDeviceMapping", om.valueToTree(this.getBlockDeviceMapping()));
            }
            if (this.getImage() != null) {
                data.set("image", om.valueToTree(this.getImage()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderContainerRecipe.ImagebuilderContainerRecipeInstanceConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderContainerRecipeInstanceConfiguration.Jsii$Proxy that = (ImagebuilderContainerRecipeInstanceConfiguration.Jsii$Proxy) o;

            if (this.blockDeviceMapping != null ? !this.blockDeviceMapping.equals(that.blockDeviceMapping) : that.blockDeviceMapping != null) return false;
            return this.image != null ? this.image.equals(that.image) : that.image == null;
        }

        @Override
        public final int hashCode() {
            int result = this.blockDeviceMapping != null ? this.blockDeviceMapping.hashCode() : 0;
            result = 31 * result + (this.image != null ? this.image.hashCode() : 0);
            return result;
        }
    }
}
