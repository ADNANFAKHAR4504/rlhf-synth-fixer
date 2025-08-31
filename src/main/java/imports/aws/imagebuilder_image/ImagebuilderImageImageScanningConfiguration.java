package imports.aws.imagebuilder_image;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.357Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderImage.ImagebuilderImageImageScanningConfiguration")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderImageImageScanningConfiguration.Jsii$Proxy.class)
public interface ImagebuilderImageImageScanningConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * ecr_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#ecr_configuration ImagebuilderImage#ecr_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_image.ImagebuilderImageImageScanningConfigurationEcrConfiguration getEcrConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#image_scanning_enabled ImagebuilderImage#image_scanning_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getImageScanningEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderImageImageScanningConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderImageImageScanningConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderImageImageScanningConfiguration> {
        imports.aws.imagebuilder_image.ImagebuilderImageImageScanningConfigurationEcrConfiguration ecrConfiguration;
        java.lang.Object imageScanningEnabled;

        /**
         * Sets the value of {@link ImagebuilderImageImageScanningConfiguration#getEcrConfiguration}
         * @param ecrConfiguration ecr_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#ecr_configuration ImagebuilderImage#ecr_configuration}
         * @return {@code this}
         */
        public Builder ecrConfiguration(imports.aws.imagebuilder_image.ImagebuilderImageImageScanningConfigurationEcrConfiguration ecrConfiguration) {
            this.ecrConfiguration = ecrConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageImageScanningConfiguration#getImageScanningEnabled}
         * @param imageScanningEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#image_scanning_enabled ImagebuilderImage#image_scanning_enabled}.
         * @return {@code this}
         */
        public Builder imageScanningEnabled(java.lang.Boolean imageScanningEnabled) {
            this.imageScanningEnabled = imageScanningEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageImageScanningConfiguration#getImageScanningEnabled}
         * @param imageScanningEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#image_scanning_enabled ImagebuilderImage#image_scanning_enabled}.
         * @return {@code this}
         */
        public Builder imageScanningEnabled(com.hashicorp.cdktf.IResolvable imageScanningEnabled) {
            this.imageScanningEnabled = imageScanningEnabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderImageImageScanningConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderImageImageScanningConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderImageImageScanningConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderImageImageScanningConfiguration {
        private final imports.aws.imagebuilder_image.ImagebuilderImageImageScanningConfigurationEcrConfiguration ecrConfiguration;
        private final java.lang.Object imageScanningEnabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ecrConfiguration = software.amazon.jsii.Kernel.get(this, "ecrConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_image.ImagebuilderImageImageScanningConfigurationEcrConfiguration.class));
            this.imageScanningEnabled = software.amazon.jsii.Kernel.get(this, "imageScanningEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ecrConfiguration = builder.ecrConfiguration;
            this.imageScanningEnabled = builder.imageScanningEnabled;
        }

        @Override
        public final imports.aws.imagebuilder_image.ImagebuilderImageImageScanningConfigurationEcrConfiguration getEcrConfiguration() {
            return this.ecrConfiguration;
        }

        @Override
        public final java.lang.Object getImageScanningEnabled() {
            return this.imageScanningEnabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEcrConfiguration() != null) {
                data.set("ecrConfiguration", om.valueToTree(this.getEcrConfiguration()));
            }
            if (this.getImageScanningEnabled() != null) {
                data.set("imageScanningEnabled", om.valueToTree(this.getImageScanningEnabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderImage.ImagebuilderImageImageScanningConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderImageImageScanningConfiguration.Jsii$Proxy that = (ImagebuilderImageImageScanningConfiguration.Jsii$Proxy) o;

            if (this.ecrConfiguration != null ? !this.ecrConfiguration.equals(that.ecrConfiguration) : that.ecrConfiguration != null) return false;
            return this.imageScanningEnabled != null ? this.imageScanningEnabled.equals(that.imageScanningEnabled) : that.imageScanningEnabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.ecrConfiguration != null ? this.ecrConfiguration.hashCode() : 0;
            result = 31 * result + (this.imageScanningEnabled != null ? this.imageScanningEnabled.hashCode() : 0);
            return result;
        }
    }
}
