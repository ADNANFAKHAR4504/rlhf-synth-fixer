package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.886Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#pid MedialiveChannel#pid}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPid();

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection> {
        java.lang.Number pid;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection#getPid}
         * @param pid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#pid MedialiveChannel#pid}. This parameter is required.
         * @return {@code this}
         */
        public Builder pid(java.lang.Number pid) {
            this.pid = pid;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection {
        private final java.lang.Number pid;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.pid = software.amazon.jsii.Kernel.get(this, "pid", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.pid = java.util.Objects.requireNonNull(builder.pid, "pid is required");
        }

        @Override
        public final java.lang.Number getPid() {
            return this.pid;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("pid", om.valueToTree(this.getPid()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection.Jsii$Proxy that = (MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection.Jsii$Proxy) o;

            return this.pid.equals(that.pid);
        }

        @Override
        public final int hashCode() {
            int result = this.pid.hashCode();
            return result;
        }
    }
}
