package imports.aws.medialive_multiplex_program;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.894Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveMultiplexProgram.MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptor")
@software.amazon.jsii.Jsii.Proxy(MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptor.Jsii$Proxy.class)
public interface MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptor extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#provider_name MedialiveMultiplexProgram#provider_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProviderName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#service_name MedialiveMultiplexProgram#service_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServiceName();

    /**
     * @return a {@link Builder} of {@link MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptor}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptor}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptor> {
        java.lang.String providerName;
        java.lang.String serviceName;

        /**
         * Sets the value of {@link MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptor#getProviderName}
         * @param providerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#provider_name MedialiveMultiplexProgram#provider_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder providerName(java.lang.String providerName) {
            this.providerName = providerName;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptor#getServiceName}
         * @param serviceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#service_name MedialiveMultiplexProgram#service_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder serviceName(java.lang.String serviceName) {
            this.serviceName = serviceName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptor}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptor build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptor}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptor {
        private final java.lang.String providerName;
        private final java.lang.String serviceName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.providerName = software.amazon.jsii.Kernel.get(this, "providerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceName = software.amazon.jsii.Kernel.get(this, "serviceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.providerName = java.util.Objects.requireNonNull(builder.providerName, "providerName is required");
            this.serviceName = java.util.Objects.requireNonNull(builder.serviceName, "serviceName is required");
        }

        @Override
        public final java.lang.String getProviderName() {
            return this.providerName;
        }

        @Override
        public final java.lang.String getServiceName() {
            return this.serviceName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("providerName", om.valueToTree(this.getProviderName()));
            data.set("serviceName", om.valueToTree(this.getServiceName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveMultiplexProgram.MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptor"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptor.Jsii$Proxy that = (MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptor.Jsii$Proxy) o;

            if (!providerName.equals(that.providerName)) return false;
            return this.serviceName.equals(that.serviceName);
        }

        @Override
        public final int hashCode() {
            int result = this.providerName.hashCode();
            result = 31 * result + (this.serviceName.hashCode());
            return result;
        }
    }
}
