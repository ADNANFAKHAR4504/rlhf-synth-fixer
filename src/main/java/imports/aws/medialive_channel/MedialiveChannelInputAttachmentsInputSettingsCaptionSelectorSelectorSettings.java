package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.889Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettings.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * ancillary_source_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#ancillary_source_settings MedialiveChannel#ancillary_source_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings getAncillarySourceSettings() {
        return null;
    }

    /**
     * arib_source_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#arib_source_settings MedialiveChannel#arib_source_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAribSourceSettings getAribSourceSettings() {
        return null;
    }

    /**
     * dvb_sub_source_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#dvb_sub_source_settings MedialiveChannel#dvb_sub_source_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsDvbSubSourceSettings getDvbSubSourceSettings() {
        return null;
    }

    /**
     * embedded_source_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#embedded_source_settings MedialiveChannel#embedded_source_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsEmbeddedSourceSettings getEmbeddedSourceSettings() {
        return null;
    }

    /**
     * scte20_source_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#scte20_source_settings MedialiveChannel#scte20_source_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings getScte20SourceSettings() {
        return null;
    }

    /**
     * scte27_source_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#scte27_source_settings MedialiveChannel#scte27_source_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings getScte27SourceSettings() {
        return null;
    }

    /**
     * teletext_source_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#teletext_source_settings MedialiveChannel#teletext_source_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettings getTeletextSourceSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettings> {
        imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings ancillarySourceSettings;
        imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAribSourceSettings aribSourceSettings;
        imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsDvbSubSourceSettings dvbSubSourceSettings;
        imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsEmbeddedSourceSettings embeddedSourceSettings;
        imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings scte20SourceSettings;
        imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings scte27SourceSettings;
        imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettings teletextSourceSettings;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettings#getAncillarySourceSettings}
         * @param ancillarySourceSettings ancillary_source_settings block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#ancillary_source_settings MedialiveChannel#ancillary_source_settings}
         * @return {@code this}
         */
        public Builder ancillarySourceSettings(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings ancillarySourceSettings) {
            this.ancillarySourceSettings = ancillarySourceSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettings#getAribSourceSettings}
         * @param aribSourceSettings arib_source_settings block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#arib_source_settings MedialiveChannel#arib_source_settings}
         * @return {@code this}
         */
        public Builder aribSourceSettings(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAribSourceSettings aribSourceSettings) {
            this.aribSourceSettings = aribSourceSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettings#getDvbSubSourceSettings}
         * @param dvbSubSourceSettings dvb_sub_source_settings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#dvb_sub_source_settings MedialiveChannel#dvb_sub_source_settings}
         * @return {@code this}
         */
        public Builder dvbSubSourceSettings(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsDvbSubSourceSettings dvbSubSourceSettings) {
            this.dvbSubSourceSettings = dvbSubSourceSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettings#getEmbeddedSourceSettings}
         * @param embeddedSourceSettings embedded_source_settings block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#embedded_source_settings MedialiveChannel#embedded_source_settings}
         * @return {@code this}
         */
        public Builder embeddedSourceSettings(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsEmbeddedSourceSettings embeddedSourceSettings) {
            this.embeddedSourceSettings = embeddedSourceSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettings#getScte20SourceSettings}
         * @param scte20SourceSettings scte20_source_settings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#scte20_source_settings MedialiveChannel#scte20_source_settings}
         * @return {@code this}
         */
        public Builder scte20SourceSettings(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings scte20SourceSettings) {
            this.scte20SourceSettings = scte20SourceSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettings#getScte27SourceSettings}
         * @param scte27SourceSettings scte27_source_settings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#scte27_source_settings MedialiveChannel#scte27_source_settings}
         * @return {@code this}
         */
        public Builder scte27SourceSettings(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings scte27SourceSettings) {
            this.scte27SourceSettings = scte27SourceSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettings#getTeletextSourceSettings}
         * @param teletextSourceSettings teletext_source_settings block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#teletext_source_settings MedialiveChannel#teletext_source_settings}
         * @return {@code this}
         */
        public Builder teletextSourceSettings(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettings teletextSourceSettings) {
            this.teletextSourceSettings = teletextSourceSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettings {
        private final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings ancillarySourceSettings;
        private final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAribSourceSettings aribSourceSettings;
        private final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsDvbSubSourceSettings dvbSubSourceSettings;
        private final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsEmbeddedSourceSettings embeddedSourceSettings;
        private final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings scte20SourceSettings;
        private final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings scte27SourceSettings;
        private final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettings teletextSourceSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ancillarySourceSettings = software.amazon.jsii.Kernel.get(this, "ancillarySourceSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings.class));
            this.aribSourceSettings = software.amazon.jsii.Kernel.get(this, "aribSourceSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAribSourceSettings.class));
            this.dvbSubSourceSettings = software.amazon.jsii.Kernel.get(this, "dvbSubSourceSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsDvbSubSourceSettings.class));
            this.embeddedSourceSettings = software.amazon.jsii.Kernel.get(this, "embeddedSourceSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsEmbeddedSourceSettings.class));
            this.scte20SourceSettings = software.amazon.jsii.Kernel.get(this, "scte20SourceSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings.class));
            this.scte27SourceSettings = software.amazon.jsii.Kernel.get(this, "scte27SourceSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings.class));
            this.teletextSourceSettings = software.amazon.jsii.Kernel.get(this, "teletextSourceSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ancillarySourceSettings = builder.ancillarySourceSettings;
            this.aribSourceSettings = builder.aribSourceSettings;
            this.dvbSubSourceSettings = builder.dvbSubSourceSettings;
            this.embeddedSourceSettings = builder.embeddedSourceSettings;
            this.scte20SourceSettings = builder.scte20SourceSettings;
            this.scte27SourceSettings = builder.scte27SourceSettings;
            this.teletextSourceSettings = builder.teletextSourceSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAncillarySourceSettings getAncillarySourceSettings() {
            return this.ancillarySourceSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsAribSourceSettings getAribSourceSettings() {
            return this.aribSourceSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsDvbSubSourceSettings getDvbSubSourceSettings() {
            return this.dvbSubSourceSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsEmbeddedSourceSettings getEmbeddedSourceSettings() {
            return this.embeddedSourceSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte20SourceSettings getScte20SourceSettings() {
            return this.scte20SourceSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsScte27SourceSettings getScte27SourceSettings() {
            return this.scte27SourceSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettingsTeletextSourceSettings getTeletextSourceSettings() {
            return this.teletextSourceSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAncillarySourceSettings() != null) {
                data.set("ancillarySourceSettings", om.valueToTree(this.getAncillarySourceSettings()));
            }
            if (this.getAribSourceSettings() != null) {
                data.set("aribSourceSettings", om.valueToTree(this.getAribSourceSettings()));
            }
            if (this.getDvbSubSourceSettings() != null) {
                data.set("dvbSubSourceSettings", om.valueToTree(this.getDvbSubSourceSettings()));
            }
            if (this.getEmbeddedSourceSettings() != null) {
                data.set("embeddedSourceSettings", om.valueToTree(this.getEmbeddedSourceSettings()));
            }
            if (this.getScte20SourceSettings() != null) {
                data.set("scte20SourceSettings", om.valueToTree(this.getScte20SourceSettings()));
            }
            if (this.getScte27SourceSettings() != null) {
                data.set("scte27SourceSettings", om.valueToTree(this.getScte27SourceSettings()));
            }
            if (this.getTeletextSourceSettings() != null) {
                data.set("teletextSourceSettings", om.valueToTree(this.getTeletextSourceSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettings.Jsii$Proxy that = (MedialiveChannelInputAttachmentsInputSettingsCaptionSelectorSelectorSettings.Jsii$Proxy) o;

            if (this.ancillarySourceSettings != null ? !this.ancillarySourceSettings.equals(that.ancillarySourceSettings) : that.ancillarySourceSettings != null) return false;
            if (this.aribSourceSettings != null ? !this.aribSourceSettings.equals(that.aribSourceSettings) : that.aribSourceSettings != null) return false;
            if (this.dvbSubSourceSettings != null ? !this.dvbSubSourceSettings.equals(that.dvbSubSourceSettings) : that.dvbSubSourceSettings != null) return false;
            if (this.embeddedSourceSettings != null ? !this.embeddedSourceSettings.equals(that.embeddedSourceSettings) : that.embeddedSourceSettings != null) return false;
            if (this.scte20SourceSettings != null ? !this.scte20SourceSettings.equals(that.scte20SourceSettings) : that.scte20SourceSettings != null) return false;
            if (this.scte27SourceSettings != null ? !this.scte27SourceSettings.equals(that.scte27SourceSettings) : that.scte27SourceSettings != null) return false;
            return this.teletextSourceSettings != null ? this.teletextSourceSettings.equals(that.teletextSourceSettings) : that.teletextSourceSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.ancillarySourceSettings != null ? this.ancillarySourceSettings.hashCode() : 0;
            result = 31 * result + (this.aribSourceSettings != null ? this.aribSourceSettings.hashCode() : 0);
            result = 31 * result + (this.dvbSubSourceSettings != null ? this.dvbSubSourceSettings.hashCode() : 0);
            result = 31 * result + (this.embeddedSourceSettings != null ? this.embeddedSourceSettings.hashCode() : 0);
            result = 31 * result + (this.scte20SourceSettings != null ? this.scte20SourceSettings.hashCode() : 0);
            result = 31 * result + (this.scte27SourceSettings != null ? this.scte27SourceSettings.hashCode() : 0);
            result = 31 * result + (this.teletextSourceSettings != null ? this.teletextSourceSettings.hashCode() : 0);
            return result;
        }
    }
}
