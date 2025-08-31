package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.881Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#destination MedialiveChannel#destination}
     */
    @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettingsDestination getDestination();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#certificate_mode MedialiveChannel#certificate_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCertificateMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#connection_retry_interval MedialiveChannel#connection_retry_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getConnectionRetryInterval() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#num_retries MedialiveChannel#num_retries}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNumRetries() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings> {
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettingsDestination destination;
        java.lang.String certificateMode;
        java.lang.Number connectionRetryInterval;
        java.lang.Number numRetries;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings#getDestination}
         * @param destination destination block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#destination MedialiveChannel#destination}
         * @return {@code this}
         */
        public Builder destination(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettingsDestination destination) {
            this.destination = destination;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings#getCertificateMode}
         * @param certificateMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#certificate_mode MedialiveChannel#certificate_mode}.
         * @return {@code this}
         */
        public Builder certificateMode(java.lang.String certificateMode) {
            this.certificateMode = certificateMode;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings#getConnectionRetryInterval}
         * @param connectionRetryInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#connection_retry_interval MedialiveChannel#connection_retry_interval}.
         * @return {@code this}
         */
        public Builder connectionRetryInterval(java.lang.Number connectionRetryInterval) {
            this.connectionRetryInterval = connectionRetryInterval;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings#getNumRetries}
         * @param numRetries Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#num_retries MedialiveChannel#num_retries}.
         * @return {@code this}
         */
        public Builder numRetries(java.lang.Number numRetries) {
            this.numRetries = numRetries;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings {
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettingsDestination destination;
        private final java.lang.String certificateMode;
        private final java.lang.Number connectionRetryInterval;
        private final java.lang.Number numRetries;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destination = software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettingsDestination.class));
            this.certificateMode = software.amazon.jsii.Kernel.get(this, "certificateMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connectionRetryInterval = software.amazon.jsii.Kernel.get(this, "connectionRetryInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.numRetries = software.amazon.jsii.Kernel.get(this, "numRetries", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destination = java.util.Objects.requireNonNull(builder.destination, "destination is required");
            this.certificateMode = builder.certificateMode;
            this.connectionRetryInterval = builder.connectionRetryInterval;
            this.numRetries = builder.numRetries;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettingsDestination getDestination() {
            return this.destination;
        }

        @Override
        public final java.lang.String getCertificateMode() {
            return this.certificateMode;
        }

        @Override
        public final java.lang.Number getConnectionRetryInterval() {
            return this.connectionRetryInterval;
        }

        @Override
        public final java.lang.Number getNumRetries() {
            return this.numRetries;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("destination", om.valueToTree(this.getDestination()));
            if (this.getCertificateMode() != null) {
                data.set("certificateMode", om.valueToTree(this.getCertificateMode()));
            }
            if (this.getConnectionRetryInterval() != null) {
                data.set("connectionRetryInterval", om.valueToTree(this.getConnectionRetryInterval()));
            }
            if (this.getNumRetries() != null) {
                data.set("numRetries", om.valueToTree(this.getNumRetries()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings.Jsii$Proxy) o;

            if (!destination.equals(that.destination)) return false;
            if (this.certificateMode != null ? !this.certificateMode.equals(that.certificateMode) : that.certificateMode != null) return false;
            if (this.connectionRetryInterval != null ? !this.connectionRetryInterval.equals(that.connectionRetryInterval) : that.connectionRetryInterval != null) return false;
            return this.numRetries != null ? this.numRetries.equals(that.numRetries) : that.numRetries == null;
        }

        @Override
        public final int hashCode() {
            int result = this.destination.hashCode();
            result = 31 * result + (this.certificateMode != null ? this.certificateMode.hashCode() : 0);
            result = 31 * result + (this.connectionRetryInterval != null ? this.connectionRetryInterval.hashCode() : 0);
            result = 31 * result + (this.numRetries != null ? this.numRetries.hashCode() : 0);
            return result;
        }
    }
}
