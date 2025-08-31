package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.874Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#connection_retry_interval MedialiveChannel#connection_retry_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getConnectionRetryInterval() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#filecache_duration MedialiveChannel#filecache_duration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getFilecacheDuration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#http_transfer_mode MedialiveChannel#http_transfer_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHttpTransferMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#num_retries MedialiveChannel#num_retries}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNumRetries() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#restart_delay MedialiveChannel#restart_delay}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRestartDelay() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings> {
        java.lang.Number connectionRetryInterval;
        java.lang.Number filecacheDuration;
        java.lang.String httpTransferMode;
        java.lang.Number numRetries;
        java.lang.Number restartDelay;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings#getConnectionRetryInterval}
         * @param connectionRetryInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#connection_retry_interval MedialiveChannel#connection_retry_interval}.
         * @return {@code this}
         */
        public Builder connectionRetryInterval(java.lang.Number connectionRetryInterval) {
            this.connectionRetryInterval = connectionRetryInterval;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings#getFilecacheDuration}
         * @param filecacheDuration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#filecache_duration MedialiveChannel#filecache_duration}.
         * @return {@code this}
         */
        public Builder filecacheDuration(java.lang.Number filecacheDuration) {
            this.filecacheDuration = filecacheDuration;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings#getHttpTransferMode}
         * @param httpTransferMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#http_transfer_mode MedialiveChannel#http_transfer_mode}.
         * @return {@code this}
         */
        public Builder httpTransferMode(java.lang.String httpTransferMode) {
            this.httpTransferMode = httpTransferMode;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings#getNumRetries}
         * @param numRetries Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#num_retries MedialiveChannel#num_retries}.
         * @return {@code this}
         */
        public Builder numRetries(java.lang.Number numRetries) {
            this.numRetries = numRetries;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings#getRestartDelay}
         * @param restartDelay Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#restart_delay MedialiveChannel#restart_delay}.
         * @return {@code this}
         */
        public Builder restartDelay(java.lang.Number restartDelay) {
            this.restartDelay = restartDelay;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings {
        private final java.lang.Number connectionRetryInterval;
        private final java.lang.Number filecacheDuration;
        private final java.lang.String httpTransferMode;
        private final java.lang.Number numRetries;
        private final java.lang.Number restartDelay;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.connectionRetryInterval = software.amazon.jsii.Kernel.get(this, "connectionRetryInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.filecacheDuration = software.amazon.jsii.Kernel.get(this, "filecacheDuration", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.httpTransferMode = software.amazon.jsii.Kernel.get(this, "httpTransferMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.numRetries = software.amazon.jsii.Kernel.get(this, "numRetries", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.restartDelay = software.amazon.jsii.Kernel.get(this, "restartDelay", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.connectionRetryInterval = builder.connectionRetryInterval;
            this.filecacheDuration = builder.filecacheDuration;
            this.httpTransferMode = builder.httpTransferMode;
            this.numRetries = builder.numRetries;
            this.restartDelay = builder.restartDelay;
        }

        @Override
        public final java.lang.Number getConnectionRetryInterval() {
            return this.connectionRetryInterval;
        }

        @Override
        public final java.lang.Number getFilecacheDuration() {
            return this.filecacheDuration;
        }

        @Override
        public final java.lang.String getHttpTransferMode() {
            return this.httpTransferMode;
        }

        @Override
        public final java.lang.Number getNumRetries() {
            return this.numRetries;
        }

        @Override
        public final java.lang.Number getRestartDelay() {
            return this.restartDelay;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getConnectionRetryInterval() != null) {
                data.set("connectionRetryInterval", om.valueToTree(this.getConnectionRetryInterval()));
            }
            if (this.getFilecacheDuration() != null) {
                data.set("filecacheDuration", om.valueToTree(this.getFilecacheDuration()));
            }
            if (this.getHttpTransferMode() != null) {
                data.set("httpTransferMode", om.valueToTree(this.getHttpTransferMode()));
            }
            if (this.getNumRetries() != null) {
                data.set("numRetries", om.valueToTree(this.getNumRetries()));
            }
            if (this.getRestartDelay() != null) {
                data.set("restartDelay", om.valueToTree(this.getRestartDelay()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings.Jsii$Proxy) o;

            if (this.connectionRetryInterval != null ? !this.connectionRetryInterval.equals(that.connectionRetryInterval) : that.connectionRetryInterval != null) return false;
            if (this.filecacheDuration != null ? !this.filecacheDuration.equals(that.filecacheDuration) : that.filecacheDuration != null) return false;
            if (this.httpTransferMode != null ? !this.httpTransferMode.equals(that.httpTransferMode) : that.httpTransferMode != null) return false;
            if (this.numRetries != null ? !this.numRetries.equals(that.numRetries) : that.numRetries != null) return false;
            return this.restartDelay != null ? this.restartDelay.equals(that.restartDelay) : that.restartDelay == null;
        }

        @Override
        public final int hashCode() {
            int result = this.connectionRetryInterval != null ? this.connectionRetryInterval.hashCode() : 0;
            result = 31 * result + (this.filecacheDuration != null ? this.filecacheDuration.hashCode() : 0);
            result = 31 * result + (this.httpTransferMode != null ? this.httpTransferMode.hashCode() : 0);
            result = 31 * result + (this.numRetries != null ? this.numRetries.hashCode() : 0);
            result = 31 * result + (this.restartDelay != null ? this.restartDelay.hashCode() : 0);
            return result;
        }
    }
}
