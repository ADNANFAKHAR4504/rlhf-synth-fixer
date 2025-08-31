package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.890Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsVideoSelector")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachmentsInputSettingsVideoSelector.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachmentsInputSettingsVideoSelector extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#color_space MedialiveChannel#color_space}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getColorSpace() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#color_space_usage MedialiveChannel#color_space_usage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getColorSpaceUsage() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachmentsInputSettingsVideoSelector}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachmentsInputSettingsVideoSelector}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachmentsInputSettingsVideoSelector> {
        java.lang.String colorSpace;
        java.lang.String colorSpaceUsage;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsVideoSelector#getColorSpace}
         * @param colorSpace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#color_space MedialiveChannel#color_space}.
         * @return {@code this}
         */
        public Builder colorSpace(java.lang.String colorSpace) {
            this.colorSpace = colorSpace;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsVideoSelector#getColorSpaceUsage}
         * @param colorSpaceUsage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#color_space_usage MedialiveChannel#color_space_usage}.
         * @return {@code this}
         */
        public Builder colorSpaceUsage(java.lang.String colorSpaceUsage) {
            this.colorSpaceUsage = colorSpaceUsage;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachmentsInputSettingsVideoSelector}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachmentsInputSettingsVideoSelector build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachmentsInputSettingsVideoSelector}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachmentsInputSettingsVideoSelector {
        private final java.lang.String colorSpace;
        private final java.lang.String colorSpaceUsage;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.colorSpace = software.amazon.jsii.Kernel.get(this, "colorSpace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.colorSpaceUsage = software.amazon.jsii.Kernel.get(this, "colorSpaceUsage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.colorSpace = builder.colorSpace;
            this.colorSpaceUsage = builder.colorSpaceUsage;
        }

        @Override
        public final java.lang.String getColorSpace() {
            return this.colorSpace;
        }

        @Override
        public final java.lang.String getColorSpaceUsage() {
            return this.colorSpaceUsage;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getColorSpace() != null) {
                data.set("colorSpace", om.valueToTree(this.getColorSpace()));
            }
            if (this.getColorSpaceUsage() != null) {
                data.set("colorSpaceUsage", om.valueToTree(this.getColorSpaceUsage()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsVideoSelector"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachmentsInputSettingsVideoSelector.Jsii$Proxy that = (MedialiveChannelInputAttachmentsInputSettingsVideoSelector.Jsii$Proxy) o;

            if (this.colorSpace != null ? !this.colorSpace.equals(that.colorSpace) : that.colorSpace != null) return false;
            return this.colorSpaceUsage != null ? this.colorSpaceUsage.equals(that.colorSpaceUsage) : that.colorSpaceUsage == null;
        }

        @Override
        public final int hashCode() {
            int result = this.colorSpace != null ? this.colorSpace.hashCode() : 0;
            result = 31 * result + (this.colorSpaceUsage != null ? this.colorSpaceUsage.hashCode() : 0);
            return result;
        }
    }
}
