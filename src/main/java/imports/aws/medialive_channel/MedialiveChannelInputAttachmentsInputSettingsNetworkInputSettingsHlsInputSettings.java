package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.890Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#bandwidth MedialiveChannel#bandwidth}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBandwidth() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#buffer_segments MedialiveChannel#buffer_segments}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBufferSegments() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#retries MedialiveChannel#retries}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRetries() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#retry_interval MedialiveChannel#retry_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRetryInterval() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#scte35_source MedialiveChannel#scte35_source}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScte35Source() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings> {
        java.lang.Number bandwidth;
        java.lang.Number bufferSegments;
        java.lang.Number retries;
        java.lang.Number retryInterval;
        java.lang.String scte35Source;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings#getBandwidth}
         * @param bandwidth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#bandwidth MedialiveChannel#bandwidth}.
         * @return {@code this}
         */
        public Builder bandwidth(java.lang.Number bandwidth) {
            this.bandwidth = bandwidth;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings#getBufferSegments}
         * @param bufferSegments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#buffer_segments MedialiveChannel#buffer_segments}.
         * @return {@code this}
         */
        public Builder bufferSegments(java.lang.Number bufferSegments) {
            this.bufferSegments = bufferSegments;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings#getRetries}
         * @param retries Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#retries MedialiveChannel#retries}.
         * @return {@code this}
         */
        public Builder retries(java.lang.Number retries) {
            this.retries = retries;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings#getRetryInterval}
         * @param retryInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#retry_interval MedialiveChannel#retry_interval}.
         * @return {@code this}
         */
        public Builder retryInterval(java.lang.Number retryInterval) {
            this.retryInterval = retryInterval;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings#getScte35Source}
         * @param scte35Source Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#scte35_source MedialiveChannel#scte35_source}.
         * @return {@code this}
         */
        public Builder scte35Source(java.lang.String scte35Source) {
            this.scte35Source = scte35Source;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings {
        private final java.lang.Number bandwidth;
        private final java.lang.Number bufferSegments;
        private final java.lang.Number retries;
        private final java.lang.Number retryInterval;
        private final java.lang.String scte35Source;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bandwidth = software.amazon.jsii.Kernel.get(this, "bandwidth", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.bufferSegments = software.amazon.jsii.Kernel.get(this, "bufferSegments", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.retries = software.amazon.jsii.Kernel.get(this, "retries", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.retryInterval = software.amazon.jsii.Kernel.get(this, "retryInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.scte35Source = software.amazon.jsii.Kernel.get(this, "scte35Source", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bandwidth = builder.bandwidth;
            this.bufferSegments = builder.bufferSegments;
            this.retries = builder.retries;
            this.retryInterval = builder.retryInterval;
            this.scte35Source = builder.scte35Source;
        }

        @Override
        public final java.lang.Number getBandwidth() {
            return this.bandwidth;
        }

        @Override
        public final java.lang.Number getBufferSegments() {
            return this.bufferSegments;
        }

        @Override
        public final java.lang.Number getRetries() {
            return this.retries;
        }

        @Override
        public final java.lang.Number getRetryInterval() {
            return this.retryInterval;
        }

        @Override
        public final java.lang.String getScte35Source() {
            return this.scte35Source;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBandwidth() != null) {
                data.set("bandwidth", om.valueToTree(this.getBandwidth()));
            }
            if (this.getBufferSegments() != null) {
                data.set("bufferSegments", om.valueToTree(this.getBufferSegments()));
            }
            if (this.getRetries() != null) {
                data.set("retries", om.valueToTree(this.getRetries()));
            }
            if (this.getRetryInterval() != null) {
                data.set("retryInterval", om.valueToTree(this.getRetryInterval()));
            }
            if (this.getScte35Source() != null) {
                data.set("scte35Source", om.valueToTree(this.getScte35Source()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings.Jsii$Proxy that = (MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings.Jsii$Proxy) o;

            if (this.bandwidth != null ? !this.bandwidth.equals(that.bandwidth) : that.bandwidth != null) return false;
            if (this.bufferSegments != null ? !this.bufferSegments.equals(that.bufferSegments) : that.bufferSegments != null) return false;
            if (this.retries != null ? !this.retries.equals(that.retries) : that.retries != null) return false;
            if (this.retryInterval != null ? !this.retryInterval.equals(that.retryInterval) : that.retryInterval != null) return false;
            return this.scte35Source != null ? this.scte35Source.equals(that.scte35Source) : that.scte35Source == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bandwidth != null ? this.bandwidth.hashCode() : 0;
            result = 31 * result + (this.bufferSegments != null ? this.bufferSegments.hashCode() : 0);
            result = 31 * result + (this.retries != null ? this.retries.hashCode() : 0);
            result = 31 * result + (this.retryInterval != null ? this.retryInterval.hashCode() : 0);
            result = 31 * result + (this.scte35Source != null ? this.scte35Source.hashCode() : 0);
            return result;
        }
    }
}
