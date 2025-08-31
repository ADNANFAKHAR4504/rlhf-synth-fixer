package imports.aws.fsx_openzfs_volume;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.257Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOpenzfsVolume.FsxOpenzfsVolumeNfsExportsClientConfigurations")
@software.amazon.jsii.Jsii.Proxy(FsxOpenzfsVolumeNfsExportsClientConfigurations.Jsii$Proxy.class)
public interface FsxOpenzfsVolumeNfsExportsClientConfigurations extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#clients FsxOpenzfsVolume#clients}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClients();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#options FsxOpenzfsVolume#options}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getOptions();

    /**
     * @return a {@link Builder} of {@link FsxOpenzfsVolumeNfsExportsClientConfigurations}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxOpenzfsVolumeNfsExportsClientConfigurations}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxOpenzfsVolumeNfsExportsClientConfigurations> {
        java.lang.String clients;
        java.util.List<java.lang.String> options;

        /**
         * Sets the value of {@link FsxOpenzfsVolumeNfsExportsClientConfigurations#getClients}
         * @param clients Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#clients FsxOpenzfsVolume#clients}. This parameter is required.
         * @return {@code this}
         */
        public Builder clients(java.lang.String clients) {
            this.clients = clients;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeNfsExportsClientConfigurations#getOptions}
         * @param options Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#options FsxOpenzfsVolume#options}. This parameter is required.
         * @return {@code this}
         */
        public Builder options(java.util.List<java.lang.String> options) {
            this.options = options;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxOpenzfsVolumeNfsExportsClientConfigurations}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxOpenzfsVolumeNfsExportsClientConfigurations build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxOpenzfsVolumeNfsExportsClientConfigurations}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxOpenzfsVolumeNfsExportsClientConfigurations {
        private final java.lang.String clients;
        private final java.util.List<java.lang.String> options;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.clients = software.amazon.jsii.Kernel.get(this, "clients", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.options = software.amazon.jsii.Kernel.get(this, "options", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.clients = java.util.Objects.requireNonNull(builder.clients, "clients is required");
            this.options = java.util.Objects.requireNonNull(builder.options, "options is required");
        }

        @Override
        public final java.lang.String getClients() {
            return this.clients;
        }

        @Override
        public final java.util.List<java.lang.String> getOptions() {
            return this.options;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("clients", om.valueToTree(this.getClients()));
            data.set("options", om.valueToTree(this.getOptions()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxOpenzfsVolume.FsxOpenzfsVolumeNfsExportsClientConfigurations"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxOpenzfsVolumeNfsExportsClientConfigurations.Jsii$Proxy that = (FsxOpenzfsVolumeNfsExportsClientConfigurations.Jsii$Proxy) o;

            if (!clients.equals(that.clients)) return false;
            return this.options.equals(that.options);
        }

        @Override
        public final int hashCode() {
            int result = this.clients.hashCode();
            result = 31 * result + (this.options.hashCode());
            return result;
        }
    }
}
