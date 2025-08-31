package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.865Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * nielsen_cbet_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#nielsen_cbet_settings MedialiveChannel#nielsen_cbet_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings getNielsenCbetSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#nielsen_distribution_type MedialiveChannel#nielsen_distribution_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNielsenDistributionType() {
        return null;
    }

    /**
     * nielsen_naes_ii_nw_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#nielsen_naes_ii_nw_settings MedialiveChannel#nielsen_naes_ii_nw_settings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNielsenNaesIiNwSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettings> {
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings nielsenCbetSettings;
        java.lang.String nielsenDistributionType;
        java.lang.Object nielsenNaesIiNwSettings;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettings#getNielsenCbetSettings}
         * @param nielsenCbetSettings nielsen_cbet_settings block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#nielsen_cbet_settings MedialiveChannel#nielsen_cbet_settings}
         * @return {@code this}
         */
        public Builder nielsenCbetSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings nielsenCbetSettings) {
            this.nielsenCbetSettings = nielsenCbetSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettings#getNielsenDistributionType}
         * @param nielsenDistributionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#nielsen_distribution_type MedialiveChannel#nielsen_distribution_type}.
         * @return {@code this}
         */
        public Builder nielsenDistributionType(java.lang.String nielsenDistributionType) {
            this.nielsenDistributionType = nielsenDistributionType;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettings#getNielsenNaesIiNwSettings}
         * @param nielsenNaesIiNwSettings nielsen_naes_ii_nw_settings block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#nielsen_naes_ii_nw_settings MedialiveChannel#nielsen_naes_ii_nw_settings}
         * @return {@code this}
         */
        public Builder nielsenNaesIiNwSettings(com.hashicorp.cdktf.IResolvable nielsenNaesIiNwSettings) {
            this.nielsenNaesIiNwSettings = nielsenNaesIiNwSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettings#getNielsenNaesIiNwSettings}
         * @param nielsenNaesIiNwSettings nielsen_naes_ii_nw_settings block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#nielsen_naes_ii_nw_settings MedialiveChannel#nielsen_naes_ii_nw_settings}
         * @return {@code this}
         */
        public Builder nielsenNaesIiNwSettings(java.util.List<? extends imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenNaesIiNwSettings> nielsenNaesIiNwSettings) {
            this.nielsenNaesIiNwSettings = nielsenNaesIiNwSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettings {
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings nielsenCbetSettings;
        private final java.lang.String nielsenDistributionType;
        private final java.lang.Object nielsenNaesIiNwSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.nielsenCbetSettings = software.amazon.jsii.Kernel.get(this, "nielsenCbetSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings.class));
            this.nielsenDistributionType = software.amazon.jsii.Kernel.get(this, "nielsenDistributionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nielsenNaesIiNwSettings = software.amazon.jsii.Kernel.get(this, "nielsenNaesIiNwSettings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.nielsenCbetSettings = builder.nielsenCbetSettings;
            this.nielsenDistributionType = builder.nielsenDistributionType;
            this.nielsenNaesIiNwSettings = builder.nielsenNaesIiNwSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettingsNielsenCbetSettings getNielsenCbetSettings() {
            return this.nielsenCbetSettings;
        }

        @Override
        public final java.lang.String getNielsenDistributionType() {
            return this.nielsenDistributionType;
        }

        @Override
        public final java.lang.Object getNielsenNaesIiNwSettings() {
            return this.nielsenNaesIiNwSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getNielsenCbetSettings() != null) {
                data.set("nielsenCbetSettings", om.valueToTree(this.getNielsenCbetSettings()));
            }
            if (this.getNielsenDistributionType() != null) {
                data.set("nielsenDistributionType", om.valueToTree(this.getNielsenDistributionType()));
            }
            if (this.getNielsenNaesIiNwSettings() != null) {
                data.set("nielsenNaesIiNwSettings", om.valueToTree(this.getNielsenNaesIiNwSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsAudioDescriptionsAudioWatermarkSettingsNielsenWatermarksSettings.Jsii$Proxy) o;

            if (this.nielsenCbetSettings != null ? !this.nielsenCbetSettings.equals(that.nielsenCbetSettings) : that.nielsenCbetSettings != null) return false;
            if (this.nielsenDistributionType != null ? !this.nielsenDistributionType.equals(that.nielsenDistributionType) : that.nielsenDistributionType != null) return false;
            return this.nielsenNaesIiNwSettings != null ? this.nielsenNaesIiNwSettings.equals(that.nielsenNaesIiNwSettings) : that.nielsenNaesIiNwSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.nielsenCbetSettings != null ? this.nielsenCbetSettings.hashCode() : 0;
            result = 31 * result + (this.nielsenDistributionType != null ? this.nielsenDistributionType.hashCode() : 0);
            result = 31 * result + (this.nielsenNaesIiNwSettings != null ? this.nielsenNaesIiNwSettings.hashCode() : 0);
            return result;
        }
    }
}
