package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.890Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangle")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangle.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangle extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#height MedialiveChannel#height}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getHeight();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#left_offset MedialiveChannel#left_offset}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getLeftOffset();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#top_offset MedialiveChannel#top_offset}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getTopOffset();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#width MedialiveChannel#width}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getWidth();

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangle}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangle}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangle> {
        java.lang.Number height;
        java.lang.Number leftOffset;
        java.lang.Number topOffset;
        java.lang.Number width;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangle#getHeight}
         * @param height Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#height MedialiveChannel#height}. This parameter is required.
         * @return {@code this}
         */
        public Builder height(java.lang.Number height) {
            this.height = height;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangle#getLeftOffset}
         * @param leftOffset Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#left_offset MedialiveChannel#left_offset}. This parameter is required.
         * @return {@code this}
         */
        public Builder leftOffset(java.lang.Number leftOffset) {
            this.leftOffset = leftOffset;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangle#getTopOffset}
         * @param topOffset Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#top_offset MedialiveChannel#top_offset}. This parameter is required.
         * @return {@code this}
         */
        public Builder topOffset(java.lang.Number topOffset) {
            this.topOffset = topOffset;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangle#getWidth}
         * @param width Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#width MedialiveChannel#width}. This parameter is required.
         * @return {@code this}
         */
        public Builder width(java.lang.Number width) {
            this.width = width;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangle}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangle build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangle}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangle {
        private final java.lang.Number height;
        private final java.lang.Number leftOffset;
        private final java.lang.Number topOffset;
        private final java.lang.Number width;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.height = software.amazon.jsii.Kernel.get(this, "height", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.leftOffset = software.amazon.jsii.Kernel.get(this, "leftOffset", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.topOffset = software.amazon.jsii.Kernel.get(this, "topOffset", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.width = software.amazon.jsii.Kernel.get(this, "width", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.height = java.util.Objects.requireNonNull(builder.height, "height is required");
            this.leftOffset = java.util.Objects.requireNonNull(builder.leftOffset, "leftOffset is required");
            this.topOffset = java.util.Objects.requireNonNull(builder.topOffset, "topOffset is required");
            this.width = java.util.Objects.requireNonNull(builder.width, "width is required");
        }

        @Override
        public final java.lang.Number getHeight() {
            return this.height;
        }

        @Override
        public final java.lang.Number getLeftOffset() {
            return this.leftOffset;
        }

        @Override
        public final java.lang.Number getTopOffset() {
            return this.topOffset;
        }

        @Override
        public final java.lang.Number getWidth() {
            return this.width;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("height", om.valueToTree(this.getHeight()));
            data.set("leftOffset", om.valueToTree(this.getLeftOffset()));
            data.set("topOffset", om.valueToTree(this.getTopOffset()));
            data.set("width", om.valueToTree(this.getWidth()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangle"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangle.Jsii$Proxy that = (MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettingsOutputRectangle.Jsii$Proxy) o;

            if (!height.equals(that.height)) return false;
            if (!leftOffset.equals(that.leftOffset)) return false;
            if (!topOffset.equals(that.topOffset)) return false;
            return this.width.equals(that.width);
        }

        @Override
        public final int hashCode() {
            int result = this.height.hashCode();
            result = 31 * result + (this.leftOffset.hashCode());
            result = 31 * result + (this.topOffset.hashCode());
            result = 31 * result + (this.width.hashCode());
            return result;
        }
    }
}
