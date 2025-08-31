package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.872Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#destination MedialiveChannel#destination}
     */
    @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettingsDestination getDestination();

    /**
     * archive_cdn_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#archive_cdn_settings MedialiveChannel#archive_cdn_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettingsArchiveCdnSettings getArchiveCdnSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#rollover_interval MedialiveChannel#rollover_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRolloverInterval() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettings> {
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettingsDestination destination;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettingsArchiveCdnSettings archiveCdnSettings;
        java.lang.Number rolloverInterval;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettings#getDestination}
         * @param destination destination block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#destination MedialiveChannel#destination}
         * @return {@code this}
         */
        public Builder destination(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettingsDestination destination) {
            this.destination = destination;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettings#getArchiveCdnSettings}
         * @param archiveCdnSettings archive_cdn_settings block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#archive_cdn_settings MedialiveChannel#archive_cdn_settings}
         * @return {@code this}
         */
        public Builder archiveCdnSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettingsArchiveCdnSettings archiveCdnSettings) {
            this.archiveCdnSettings = archiveCdnSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettings#getRolloverInterval}
         * @param rolloverInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#rollover_interval MedialiveChannel#rollover_interval}.
         * @return {@code this}
         */
        public Builder rolloverInterval(java.lang.Number rolloverInterval) {
            this.rolloverInterval = rolloverInterval;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettings {
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettingsDestination destination;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettingsArchiveCdnSettings archiveCdnSettings;
        private final java.lang.Number rolloverInterval;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destination = software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettingsDestination.class));
            this.archiveCdnSettings = software.amazon.jsii.Kernel.get(this, "archiveCdnSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettingsArchiveCdnSettings.class));
            this.rolloverInterval = software.amazon.jsii.Kernel.get(this, "rolloverInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destination = java.util.Objects.requireNonNull(builder.destination, "destination is required");
            this.archiveCdnSettings = builder.archiveCdnSettings;
            this.rolloverInterval = builder.rolloverInterval;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettingsDestination getDestination() {
            return this.destination;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettingsArchiveCdnSettings getArchiveCdnSettings() {
            return this.archiveCdnSettings;
        }

        @Override
        public final java.lang.Number getRolloverInterval() {
            return this.rolloverInterval;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("destination", om.valueToTree(this.getDestination()));
            if (this.getArchiveCdnSettings() != null) {
                data.set("archiveCdnSettings", om.valueToTree(this.getArchiveCdnSettings()));
            }
            if (this.getRolloverInterval() != null) {
                data.set("rolloverInterval", om.valueToTree(this.getRolloverInterval()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsArchiveGroupSettings.Jsii$Proxy) o;

            if (!destination.equals(that.destination)) return false;
            if (this.archiveCdnSettings != null ? !this.archiveCdnSettings.equals(that.archiveCdnSettings) : that.archiveCdnSettings != null) return false;
            return this.rolloverInterval != null ? this.rolloverInterval.equals(that.rolloverInterval) : that.rolloverInterval == null;
        }

        @Override
        public final int hashCode() {
            int result = this.destination.hashCode();
            result = 31 * result + (this.archiveCdnSettings != null ? this.archiveCdnSettings.hashCode() : 0);
            result = 31 * result + (this.rolloverInterval != null ? this.rolloverInterval.hashCode() : 0);
            return result;
        }
    }
}
