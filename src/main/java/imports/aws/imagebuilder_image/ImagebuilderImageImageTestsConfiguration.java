package imports.aws.imagebuilder_image;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.357Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderImage.ImagebuilderImageImageTestsConfiguration")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderImageImageTestsConfiguration.Jsii$Proxy.class)
public interface ImagebuilderImageImageTestsConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#image_tests_enabled ImagebuilderImage#image_tests_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getImageTestsEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#timeout_minutes ImagebuilderImage#timeout_minutes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutMinutes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderImageImageTestsConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderImageImageTestsConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderImageImageTestsConfiguration> {
        java.lang.Object imageTestsEnabled;
        java.lang.Number timeoutMinutes;

        /**
         * Sets the value of {@link ImagebuilderImageImageTestsConfiguration#getImageTestsEnabled}
         * @param imageTestsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#image_tests_enabled ImagebuilderImage#image_tests_enabled}.
         * @return {@code this}
         */
        public Builder imageTestsEnabled(java.lang.Boolean imageTestsEnabled) {
            this.imageTestsEnabled = imageTestsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageImageTestsConfiguration#getImageTestsEnabled}
         * @param imageTestsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#image_tests_enabled ImagebuilderImage#image_tests_enabled}.
         * @return {@code this}
         */
        public Builder imageTestsEnabled(com.hashicorp.cdktf.IResolvable imageTestsEnabled) {
            this.imageTestsEnabled = imageTestsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageImageTestsConfiguration#getTimeoutMinutes}
         * @param timeoutMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image#timeout_minutes ImagebuilderImage#timeout_minutes}.
         * @return {@code this}
         */
        public Builder timeoutMinutes(java.lang.Number timeoutMinutes) {
            this.timeoutMinutes = timeoutMinutes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderImageImageTestsConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderImageImageTestsConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderImageImageTestsConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderImageImageTestsConfiguration {
        private final java.lang.Object imageTestsEnabled;
        private final java.lang.Number timeoutMinutes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.imageTestsEnabled = software.amazon.jsii.Kernel.get(this, "imageTestsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeoutMinutes = software.amazon.jsii.Kernel.get(this, "timeoutMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.imageTestsEnabled = builder.imageTestsEnabled;
            this.timeoutMinutes = builder.timeoutMinutes;
        }

        @Override
        public final java.lang.Object getImageTestsEnabled() {
            return this.imageTestsEnabled;
        }

        @Override
        public final java.lang.Number getTimeoutMinutes() {
            return this.timeoutMinutes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getImageTestsEnabled() != null) {
                data.set("imageTestsEnabled", om.valueToTree(this.getImageTestsEnabled()));
            }
            if (this.getTimeoutMinutes() != null) {
                data.set("timeoutMinutes", om.valueToTree(this.getTimeoutMinutes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderImage.ImagebuilderImageImageTestsConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderImageImageTestsConfiguration.Jsii$Proxy that = (ImagebuilderImageImageTestsConfiguration.Jsii$Proxy) o;

            if (this.imageTestsEnabled != null ? !this.imageTestsEnabled.equals(that.imageTestsEnabled) : that.imageTestsEnabled != null) return false;
            return this.timeoutMinutes != null ? this.timeoutMinutes.equals(that.timeoutMinutes) : that.timeoutMinutes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.imageTestsEnabled != null ? this.imageTestsEnabled.hashCode() : 0;
            result = 31 * result + (this.timeoutMinutes != null ? this.timeoutMinutes.hashCode() : 0);
            return result;
        }
    }
}
