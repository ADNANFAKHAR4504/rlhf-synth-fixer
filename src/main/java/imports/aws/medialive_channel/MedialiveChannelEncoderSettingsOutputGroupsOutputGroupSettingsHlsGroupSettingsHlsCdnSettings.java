package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.873Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * hls_akamai_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#hls_akamai_settings MedialiveChannel#hls_akamai_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsAkamaiSettings getHlsAkamaiSettings() {
        return null;
    }

    /**
     * hls_basic_put_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#hls_basic_put_settings MedialiveChannel#hls_basic_put_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsBasicPutSettings getHlsBasicPutSettings() {
        return null;
    }

    /**
     * hls_media_store_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#hls_media_store_settings MedialiveChannel#hls_media_store_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsMediaStoreSettings getHlsMediaStoreSettings() {
        return null;
    }

    /**
     * hls_s3_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#hls_s3_settings MedialiveChannel#hls_s3_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsS3Settings getHlsS3Settings() {
        return null;
    }

    /**
     * hls_webdav_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#hls_webdav_settings MedialiveChannel#hls_webdav_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings getHlsWebdavSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings> {
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsAkamaiSettings hlsAkamaiSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsBasicPutSettings hlsBasicPutSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsMediaStoreSettings hlsMediaStoreSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsS3Settings hlsS3Settings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings hlsWebdavSettings;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings#getHlsAkamaiSettings}
         * @param hlsAkamaiSettings hls_akamai_settings block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#hls_akamai_settings MedialiveChannel#hls_akamai_settings}
         * @return {@code this}
         */
        public Builder hlsAkamaiSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsAkamaiSettings hlsAkamaiSettings) {
            this.hlsAkamaiSettings = hlsAkamaiSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings#getHlsBasicPutSettings}
         * @param hlsBasicPutSettings hls_basic_put_settings block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#hls_basic_put_settings MedialiveChannel#hls_basic_put_settings}
         * @return {@code this}
         */
        public Builder hlsBasicPutSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsBasicPutSettings hlsBasicPutSettings) {
            this.hlsBasicPutSettings = hlsBasicPutSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings#getHlsMediaStoreSettings}
         * @param hlsMediaStoreSettings hls_media_store_settings block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#hls_media_store_settings MedialiveChannel#hls_media_store_settings}
         * @return {@code this}
         */
        public Builder hlsMediaStoreSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsMediaStoreSettings hlsMediaStoreSettings) {
            this.hlsMediaStoreSettings = hlsMediaStoreSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings#getHlsS3Settings}
         * @param hlsS3Settings hls_s3_settings block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#hls_s3_settings MedialiveChannel#hls_s3_settings}
         * @return {@code this}
         */
        public Builder hlsS3Settings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsS3Settings hlsS3Settings) {
            this.hlsS3Settings = hlsS3Settings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings#getHlsWebdavSettings}
         * @param hlsWebdavSettings hls_webdav_settings block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#hls_webdav_settings MedialiveChannel#hls_webdav_settings}
         * @return {@code this}
         */
        public Builder hlsWebdavSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings hlsWebdavSettings) {
            this.hlsWebdavSettings = hlsWebdavSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings {
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsAkamaiSettings hlsAkamaiSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsBasicPutSettings hlsBasicPutSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsMediaStoreSettings hlsMediaStoreSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsS3Settings hlsS3Settings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings hlsWebdavSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.hlsAkamaiSettings = software.amazon.jsii.Kernel.get(this, "hlsAkamaiSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsAkamaiSettings.class));
            this.hlsBasicPutSettings = software.amazon.jsii.Kernel.get(this, "hlsBasicPutSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsBasicPutSettings.class));
            this.hlsMediaStoreSettings = software.amazon.jsii.Kernel.get(this, "hlsMediaStoreSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsMediaStoreSettings.class));
            this.hlsS3Settings = software.amazon.jsii.Kernel.get(this, "hlsS3Settings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsS3Settings.class));
            this.hlsWebdavSettings = software.amazon.jsii.Kernel.get(this, "hlsWebdavSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.hlsAkamaiSettings = builder.hlsAkamaiSettings;
            this.hlsBasicPutSettings = builder.hlsBasicPutSettings;
            this.hlsMediaStoreSettings = builder.hlsMediaStoreSettings;
            this.hlsS3Settings = builder.hlsS3Settings;
            this.hlsWebdavSettings = builder.hlsWebdavSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsAkamaiSettings getHlsAkamaiSettings() {
            return this.hlsAkamaiSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsBasicPutSettings getHlsBasicPutSettings() {
            return this.hlsBasicPutSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsMediaStoreSettings getHlsMediaStoreSettings() {
            return this.hlsMediaStoreSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsS3Settings getHlsS3Settings() {
            return this.hlsS3Settings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings getHlsWebdavSettings() {
            return this.hlsWebdavSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHlsAkamaiSettings() != null) {
                data.set("hlsAkamaiSettings", om.valueToTree(this.getHlsAkamaiSettings()));
            }
            if (this.getHlsBasicPutSettings() != null) {
                data.set("hlsBasicPutSettings", om.valueToTree(this.getHlsBasicPutSettings()));
            }
            if (this.getHlsMediaStoreSettings() != null) {
                data.set("hlsMediaStoreSettings", om.valueToTree(this.getHlsMediaStoreSettings()));
            }
            if (this.getHlsS3Settings() != null) {
                data.set("hlsS3Settings", om.valueToTree(this.getHlsS3Settings()));
            }
            if (this.getHlsWebdavSettings() != null) {
                data.set("hlsWebdavSettings", om.valueToTree(this.getHlsWebdavSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings.Jsii$Proxy) o;

            if (this.hlsAkamaiSettings != null ? !this.hlsAkamaiSettings.equals(that.hlsAkamaiSettings) : that.hlsAkamaiSettings != null) return false;
            if (this.hlsBasicPutSettings != null ? !this.hlsBasicPutSettings.equals(that.hlsBasicPutSettings) : that.hlsBasicPutSettings != null) return false;
            if (this.hlsMediaStoreSettings != null ? !this.hlsMediaStoreSettings.equals(that.hlsMediaStoreSettings) : that.hlsMediaStoreSettings != null) return false;
            if (this.hlsS3Settings != null ? !this.hlsS3Settings.equals(that.hlsS3Settings) : that.hlsS3Settings != null) return false;
            return this.hlsWebdavSettings != null ? this.hlsWebdavSettings.equals(that.hlsWebdavSettings) : that.hlsWebdavSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.hlsAkamaiSettings != null ? this.hlsAkamaiSettings.hashCode() : 0;
            result = 31 * result + (this.hlsBasicPutSettings != null ? this.hlsBasicPutSettings.hashCode() : 0);
            result = 31 * result + (this.hlsMediaStoreSettings != null ? this.hlsMediaStoreSettings.hashCode() : 0);
            result = 31 * result + (this.hlsS3Settings != null ? this.hlsS3Settings.hashCode() : 0);
            result = 31 * result + (this.hlsWebdavSettings != null ? this.hlsWebdavSettings.hashCode() : 0);
            return result;
        }
    }
}
