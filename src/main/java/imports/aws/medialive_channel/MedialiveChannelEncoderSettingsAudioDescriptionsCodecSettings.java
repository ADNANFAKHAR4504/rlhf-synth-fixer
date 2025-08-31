package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.865Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * aac_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#aac_settings MedialiveChannel#aac_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings getAacSettings() {
        return null;
    }

    /**
     * ac3_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#ac3_settings MedialiveChannel#ac3_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings getAc3Settings() {
        return null;
    }

    /**
     * eac3_atmos_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#eac3_atmos_settings MedialiveChannel#eac3_atmos_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings getEac3AtmosSettings() {
        return null;
    }

    /**
     * eac3_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#eac3_settings MedialiveChannel#eac3_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3Settings getEac3Settings() {
        return null;
    }

    /**
     * mp2_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#mp2_settings MedialiveChannel#mp2_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsMp2Settings getMp2Settings() {
        return null;
    }

    /**
     * pass_through_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#pass_through_settings MedialiveChannel#pass_through_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsPassThroughSettings getPassThroughSettings() {
        return null;
    }

    /**
     * wav_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#wav_settings MedialiveChannel#wav_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings getWavSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings> {
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings aacSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings ac3Settings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings eac3AtmosSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3Settings eac3Settings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsMp2Settings mp2Settings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsPassThroughSettings passThroughSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings wavSettings;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings#getAacSettings}
         * @param aacSettings aac_settings block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#aac_settings MedialiveChannel#aac_settings}
         * @return {@code this}
         */
        public Builder aacSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings aacSettings) {
            this.aacSettings = aacSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings#getAc3Settings}
         * @param ac3Settings ac3_settings block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#ac3_settings MedialiveChannel#ac3_settings}
         * @return {@code this}
         */
        public Builder ac3Settings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings ac3Settings) {
            this.ac3Settings = ac3Settings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings#getEac3AtmosSettings}
         * @param eac3AtmosSettings eac3_atmos_settings block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#eac3_atmos_settings MedialiveChannel#eac3_atmos_settings}
         * @return {@code this}
         */
        public Builder eac3AtmosSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings eac3AtmosSettings) {
            this.eac3AtmosSettings = eac3AtmosSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings#getEac3Settings}
         * @param eac3Settings eac3_settings block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#eac3_settings MedialiveChannel#eac3_settings}
         * @return {@code this}
         */
        public Builder eac3Settings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3Settings eac3Settings) {
            this.eac3Settings = eac3Settings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings#getMp2Settings}
         * @param mp2Settings mp2_settings block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#mp2_settings MedialiveChannel#mp2_settings}
         * @return {@code this}
         */
        public Builder mp2Settings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsMp2Settings mp2Settings) {
            this.mp2Settings = mp2Settings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings#getPassThroughSettings}
         * @param passThroughSettings pass_through_settings block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#pass_through_settings MedialiveChannel#pass_through_settings}
         * @return {@code this}
         */
        public Builder passThroughSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsPassThroughSettings passThroughSettings) {
            this.passThroughSettings = passThroughSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings#getWavSettings}
         * @param wavSettings wav_settings block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#wav_settings MedialiveChannel#wav_settings}
         * @return {@code this}
         */
        public Builder wavSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings wavSettings) {
            this.wavSettings = wavSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings {
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings aacSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings ac3Settings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings eac3AtmosSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3Settings eac3Settings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsMp2Settings mp2Settings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsPassThroughSettings passThroughSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings wavSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.aacSettings = software.amazon.jsii.Kernel.get(this, "aacSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings.class));
            this.ac3Settings = software.amazon.jsii.Kernel.get(this, "ac3Settings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings.class));
            this.eac3AtmosSettings = software.amazon.jsii.Kernel.get(this, "eac3AtmosSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings.class));
            this.eac3Settings = software.amazon.jsii.Kernel.get(this, "eac3Settings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3Settings.class));
            this.mp2Settings = software.amazon.jsii.Kernel.get(this, "mp2Settings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsMp2Settings.class));
            this.passThroughSettings = software.amazon.jsii.Kernel.get(this, "passThroughSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsPassThroughSettings.class));
            this.wavSettings = software.amazon.jsii.Kernel.get(this, "wavSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.aacSettings = builder.aacSettings;
            this.ac3Settings = builder.ac3Settings;
            this.eac3AtmosSettings = builder.eac3AtmosSettings;
            this.eac3Settings = builder.eac3Settings;
            this.mp2Settings = builder.mp2Settings;
            this.passThroughSettings = builder.passThroughSettings;
            this.wavSettings = builder.wavSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAacSettings getAacSettings() {
            return this.aacSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsAc3Settings getAc3Settings() {
            return this.ac3Settings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings getEac3AtmosSettings() {
            return this.eac3AtmosSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3Settings getEac3Settings() {
            return this.eac3Settings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsMp2Settings getMp2Settings() {
            return this.mp2Settings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsPassThroughSettings getPassThroughSettings() {
            return this.passThroughSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsWavSettings getWavSettings() {
            return this.wavSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAacSettings() != null) {
                data.set("aacSettings", om.valueToTree(this.getAacSettings()));
            }
            if (this.getAc3Settings() != null) {
                data.set("ac3Settings", om.valueToTree(this.getAc3Settings()));
            }
            if (this.getEac3AtmosSettings() != null) {
                data.set("eac3AtmosSettings", om.valueToTree(this.getEac3AtmosSettings()));
            }
            if (this.getEac3Settings() != null) {
                data.set("eac3Settings", om.valueToTree(this.getEac3Settings()));
            }
            if (this.getMp2Settings() != null) {
                data.set("mp2Settings", om.valueToTree(this.getMp2Settings()));
            }
            if (this.getPassThroughSettings() != null) {
                data.set("passThroughSettings", om.valueToTree(this.getPassThroughSettings()));
            }
            if (this.getWavSettings() != null) {
                data.set("wavSettings", om.valueToTree(this.getWavSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettings.Jsii$Proxy) o;

            if (this.aacSettings != null ? !this.aacSettings.equals(that.aacSettings) : that.aacSettings != null) return false;
            if (this.ac3Settings != null ? !this.ac3Settings.equals(that.ac3Settings) : that.ac3Settings != null) return false;
            if (this.eac3AtmosSettings != null ? !this.eac3AtmosSettings.equals(that.eac3AtmosSettings) : that.eac3AtmosSettings != null) return false;
            if (this.eac3Settings != null ? !this.eac3Settings.equals(that.eac3Settings) : that.eac3Settings != null) return false;
            if (this.mp2Settings != null ? !this.mp2Settings.equals(that.mp2Settings) : that.mp2Settings != null) return false;
            if (this.passThroughSettings != null ? !this.passThroughSettings.equals(that.passThroughSettings) : that.passThroughSettings != null) return false;
            return this.wavSettings != null ? this.wavSettings.equals(that.wavSettings) : that.wavSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.aacSettings != null ? this.aacSettings.hashCode() : 0;
            result = 31 * result + (this.ac3Settings != null ? this.ac3Settings.hashCode() : 0);
            result = 31 * result + (this.eac3AtmosSettings != null ? this.eac3AtmosSettings.hashCode() : 0);
            result = 31 * result + (this.eac3Settings != null ? this.eac3Settings.hashCode() : 0);
            result = 31 * result + (this.mp2Settings != null ? this.mp2Settings.hashCode() : 0);
            result = 31 * result + (this.passThroughSettings != null ? this.passThroughSettings.hashCode() : 0);
            result = 31 * result + (this.wavSettings != null ? this.wavSettings.hashCode() : 0);
            return result;
        }
    }
}
