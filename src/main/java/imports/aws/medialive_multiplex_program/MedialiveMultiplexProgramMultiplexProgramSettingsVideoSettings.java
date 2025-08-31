package imports.aws.medialive_multiplex_program;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.894Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveMultiplexProgram.MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings.Jsii$Proxy.class)
public interface MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#constant_bitrate MedialiveMultiplexProgram#constant_bitrate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getConstantBitrate() {
        return null;
    }

    /**
     * statmux_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#statmux_settings MedialiveMultiplexProgram#statmux_settings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStatmuxSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings> {
        java.lang.Number constantBitrate;
        java.lang.Object statmuxSettings;

        /**
         * Sets the value of {@link MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings#getConstantBitrate}
         * @param constantBitrate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#constant_bitrate MedialiveMultiplexProgram#constant_bitrate}.
         * @return {@code this}
         */
        public Builder constantBitrate(java.lang.Number constantBitrate) {
            this.constantBitrate = constantBitrate;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings#getStatmuxSettings}
         * @param statmuxSettings statmux_settings block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#statmux_settings MedialiveMultiplexProgram#statmux_settings}
         * @return {@code this}
         */
        public Builder statmuxSettings(com.hashicorp.cdktf.IResolvable statmuxSettings) {
            this.statmuxSettings = statmuxSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings#getStatmuxSettings}
         * @param statmuxSettings statmux_settings block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#statmux_settings MedialiveMultiplexProgram#statmux_settings}
         * @return {@code this}
         */
        public Builder statmuxSettings(java.util.List<? extends imports.aws.medialive_multiplex_program.MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettingsStatmuxSettings> statmuxSettings) {
            this.statmuxSettings = statmuxSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings {
        private final java.lang.Number constantBitrate;
        private final java.lang.Object statmuxSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.constantBitrate = software.amazon.jsii.Kernel.get(this, "constantBitrate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.statmuxSettings = software.amazon.jsii.Kernel.get(this, "statmuxSettings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.constantBitrate = builder.constantBitrate;
            this.statmuxSettings = builder.statmuxSettings;
        }

        @Override
        public final java.lang.Number getConstantBitrate() {
            return this.constantBitrate;
        }

        @Override
        public final java.lang.Object getStatmuxSettings() {
            return this.statmuxSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getConstantBitrate() != null) {
                data.set("constantBitrate", om.valueToTree(this.getConstantBitrate()));
            }
            if (this.getStatmuxSettings() != null) {
                data.set("statmuxSettings", om.valueToTree(this.getStatmuxSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveMultiplexProgram.MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings.Jsii$Proxy that = (MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings.Jsii$Proxy) o;

            if (this.constantBitrate != null ? !this.constantBitrate.equals(that.constantBitrate) : that.constantBitrate != null) return false;
            return this.statmuxSettings != null ? this.statmuxSettings.equals(that.statmuxSettings) : that.statmuxSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.constantBitrate != null ? this.constantBitrate.hashCode() : 0;
            result = 31 * result + (this.statmuxSettings != null ? this.statmuxSettings.hashCode() : 0);
            return result;
        }
    }
}
