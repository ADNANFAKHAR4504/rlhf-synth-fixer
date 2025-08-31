package imports.aws.medialive_multiplex_program;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.894Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveMultiplexProgram.MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettings.Jsii$Proxy.class)
public interface MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#maximum_bitrate MedialiveMultiplexProgram#maximum_bitrate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumBitrate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#minimum_bitrate MedialiveMultiplexProgram#minimum_bitrate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinimumBitrate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#priority MedialiveMultiplexProgram#priority}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPriority() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettings> {
        java.lang.Number maximumBitrate;
        java.lang.Number minimumBitrate;
        java.lang.Number priority;

        /**
         * Sets the value of {@link MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettings#getMaximumBitrate}
         * @param maximumBitrate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#maximum_bitrate MedialiveMultiplexProgram#maximum_bitrate}.
         * @return {@code this}
         */
        public Builder maximumBitrate(java.lang.Number maximumBitrate) {
            this.maximumBitrate = maximumBitrate;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettings#getMinimumBitrate}
         * @param minimumBitrate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#minimum_bitrate MedialiveMultiplexProgram#minimum_bitrate}.
         * @return {@code this}
         */
        public Builder minimumBitrate(java.lang.Number minimumBitrate) {
            this.minimumBitrate = minimumBitrate;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettings#getPriority}
         * @param priority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#priority MedialiveMultiplexProgram#priority}.
         * @return {@code this}
         */
        public Builder priority(java.lang.Number priority) {
            this.priority = priority;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettings {
        private final java.lang.Number maximumBitrate;
        private final java.lang.Number minimumBitrate;
        private final java.lang.Number priority;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maximumBitrate = software.amazon.jsii.Kernel.get(this, "maximumBitrate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minimumBitrate = software.amazon.jsii.Kernel.get(this, "minimumBitrate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.priority = software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maximumBitrate = builder.maximumBitrate;
            this.minimumBitrate = builder.minimumBitrate;
            this.priority = builder.priority;
        }

        @Override
        public final java.lang.Number getMaximumBitrate() {
            return this.maximumBitrate;
        }

        @Override
        public final java.lang.Number getMinimumBitrate() {
            return this.minimumBitrate;
        }

        @Override
        public final java.lang.Number getPriority() {
            return this.priority;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMaximumBitrate() != null) {
                data.set("maximumBitrate", om.valueToTree(this.getMaximumBitrate()));
            }
            if (this.getMinimumBitrate() != null) {
                data.set("minimumBitrate", om.valueToTree(this.getMinimumBitrate()));
            }
            if (this.getPriority() != null) {
                data.set("priority", om.valueToTree(this.getPriority()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveMultiplexProgram.MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettings.Jsii$Proxy that = (MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettings.Jsii$Proxy) o;

            if (this.maximumBitrate != null ? !this.maximumBitrate.equals(that.maximumBitrate) : that.maximumBitrate != null) return false;
            if (this.minimumBitrate != null ? !this.minimumBitrate.equals(that.minimumBitrate) : that.minimumBitrate != null) return false;
            return this.priority != null ? this.priority.equals(that.priority) : that.priority == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maximumBitrate != null ? this.maximumBitrate.hashCode() : 0;
            result = 31 * result + (this.minimumBitrate != null ? this.minimumBitrate.hashCode() : 0);
            result = 31 * result + (this.priority != null ? this.priority.hashCode() : 0);
            return result;
        }
    }
}
