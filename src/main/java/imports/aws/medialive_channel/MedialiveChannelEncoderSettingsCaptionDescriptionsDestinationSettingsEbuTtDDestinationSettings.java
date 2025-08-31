package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.868Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#copyright_holder MedialiveChannel#copyright_holder}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCopyrightHolder() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#fill_line_gap MedialiveChannel#fill_line_gap}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFillLineGap() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#font_family MedialiveChannel#font_family}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFontFamily() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#style_control MedialiveChannel#style_control}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStyleControl() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings> {
        java.lang.String copyrightHolder;
        java.lang.String fillLineGap;
        java.lang.String fontFamily;
        java.lang.String styleControl;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings#getCopyrightHolder}
         * @param copyrightHolder Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#copyright_holder MedialiveChannel#copyright_holder}.
         * @return {@code this}
         */
        public Builder copyrightHolder(java.lang.String copyrightHolder) {
            this.copyrightHolder = copyrightHolder;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings#getFillLineGap}
         * @param fillLineGap Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#fill_line_gap MedialiveChannel#fill_line_gap}.
         * @return {@code this}
         */
        public Builder fillLineGap(java.lang.String fillLineGap) {
            this.fillLineGap = fillLineGap;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings#getFontFamily}
         * @param fontFamily Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#font_family MedialiveChannel#font_family}.
         * @return {@code this}
         */
        public Builder fontFamily(java.lang.String fontFamily) {
            this.fontFamily = fontFamily;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings#getStyleControl}
         * @param styleControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#style_control MedialiveChannel#style_control}.
         * @return {@code this}
         */
        public Builder styleControl(java.lang.String styleControl) {
            this.styleControl = styleControl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings {
        private final java.lang.String copyrightHolder;
        private final java.lang.String fillLineGap;
        private final java.lang.String fontFamily;
        private final java.lang.String styleControl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.copyrightHolder = software.amazon.jsii.Kernel.get(this, "copyrightHolder", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fillLineGap = software.amazon.jsii.Kernel.get(this, "fillLineGap", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fontFamily = software.amazon.jsii.Kernel.get(this, "fontFamily", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.styleControl = software.amazon.jsii.Kernel.get(this, "styleControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.copyrightHolder = builder.copyrightHolder;
            this.fillLineGap = builder.fillLineGap;
            this.fontFamily = builder.fontFamily;
            this.styleControl = builder.styleControl;
        }

        @Override
        public final java.lang.String getCopyrightHolder() {
            return this.copyrightHolder;
        }

        @Override
        public final java.lang.String getFillLineGap() {
            return this.fillLineGap;
        }

        @Override
        public final java.lang.String getFontFamily() {
            return this.fontFamily;
        }

        @Override
        public final java.lang.String getStyleControl() {
            return this.styleControl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCopyrightHolder() != null) {
                data.set("copyrightHolder", om.valueToTree(this.getCopyrightHolder()));
            }
            if (this.getFillLineGap() != null) {
                data.set("fillLineGap", om.valueToTree(this.getFillLineGap()));
            }
            if (this.getFontFamily() != null) {
                data.set("fontFamily", om.valueToTree(this.getFontFamily()));
            }
            if (this.getStyleControl() != null) {
                data.set("styleControl", om.valueToTree(this.getStyleControl()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsEbuTtDDestinationSettings.Jsii$Proxy) o;

            if (this.copyrightHolder != null ? !this.copyrightHolder.equals(that.copyrightHolder) : that.copyrightHolder != null) return false;
            if (this.fillLineGap != null ? !this.fillLineGap.equals(that.fillLineGap) : that.fillLineGap != null) return false;
            if (this.fontFamily != null ? !this.fontFamily.equals(that.fontFamily) : that.fontFamily != null) return false;
            return this.styleControl != null ? this.styleControl.equals(that.styleControl) : that.styleControl == null;
        }

        @Override
        public final int hashCode() {
            int result = this.copyrightHolder != null ? this.copyrightHolder.hashCode() : 0;
            result = 31 * result + (this.fillLineGap != null ? this.fillLineGap.hashCode() : 0);
            result = 31 * result + (this.fontFamily != null ? this.fontFamily.hashCode() : 0);
            result = 31 * result + (this.styleControl != null ? this.styleControl.hashCode() : 0);
            return result;
        }
    }
}
