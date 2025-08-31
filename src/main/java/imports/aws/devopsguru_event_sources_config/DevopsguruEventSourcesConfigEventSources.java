package imports.aws.devopsguru_event_sources_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.993Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.devopsguruEventSourcesConfig.DevopsguruEventSourcesConfigEventSources")
@software.amazon.jsii.Jsii.Proxy(DevopsguruEventSourcesConfigEventSources.Jsii$Proxy.class)
public interface DevopsguruEventSourcesConfigEventSources extends software.amazon.jsii.JsiiSerializable {

    /**
     * amazon_code_guru_profiler block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_event_sources_config#amazon_code_guru_profiler DevopsguruEventSourcesConfig#amazon_code_guru_profiler}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAmazonCodeGuruProfiler() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DevopsguruEventSourcesConfigEventSources}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DevopsguruEventSourcesConfigEventSources}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DevopsguruEventSourcesConfigEventSources> {
        java.lang.Object amazonCodeGuruProfiler;

        /**
         * Sets the value of {@link DevopsguruEventSourcesConfigEventSources#getAmazonCodeGuruProfiler}
         * @param amazonCodeGuruProfiler amazon_code_guru_profiler block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_event_sources_config#amazon_code_guru_profiler DevopsguruEventSourcesConfig#amazon_code_guru_profiler}
         * @return {@code this}
         */
        public Builder amazonCodeGuruProfiler(com.hashicorp.cdktf.IResolvable amazonCodeGuruProfiler) {
            this.amazonCodeGuruProfiler = amazonCodeGuruProfiler;
            return this;
        }

        /**
         * Sets the value of {@link DevopsguruEventSourcesConfigEventSources#getAmazonCodeGuruProfiler}
         * @param amazonCodeGuruProfiler amazon_code_guru_profiler block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_event_sources_config#amazon_code_guru_profiler DevopsguruEventSourcesConfig#amazon_code_guru_profiler}
         * @return {@code this}
         */
        public Builder amazonCodeGuruProfiler(java.util.List<? extends imports.aws.devopsguru_event_sources_config.DevopsguruEventSourcesConfigEventSourcesAmazonCodeGuruProfiler> amazonCodeGuruProfiler) {
            this.amazonCodeGuruProfiler = amazonCodeGuruProfiler;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DevopsguruEventSourcesConfigEventSources}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DevopsguruEventSourcesConfigEventSources build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DevopsguruEventSourcesConfigEventSources}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DevopsguruEventSourcesConfigEventSources {
        private final java.lang.Object amazonCodeGuruProfiler;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.amazonCodeGuruProfiler = software.amazon.jsii.Kernel.get(this, "amazonCodeGuruProfiler", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.amazonCodeGuruProfiler = builder.amazonCodeGuruProfiler;
        }

        @Override
        public final java.lang.Object getAmazonCodeGuruProfiler() {
            return this.amazonCodeGuruProfiler;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAmazonCodeGuruProfiler() != null) {
                data.set("amazonCodeGuruProfiler", om.valueToTree(this.getAmazonCodeGuruProfiler()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.devopsguruEventSourcesConfig.DevopsguruEventSourcesConfigEventSources"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DevopsguruEventSourcesConfigEventSources.Jsii$Proxy that = (DevopsguruEventSourcesConfigEventSources.Jsii$Proxy) o;

            return this.amazonCodeGuruProfiler != null ? this.amazonCodeGuruProfiler.equals(that.amazonCodeGuruProfiler) : that.amazonCodeGuruProfiler == null;
        }

        @Override
        public final int hashCode() {
            int result = this.amazonCodeGuruProfiler != null ? this.amazonCodeGuruProfiler.hashCode() : 0;
            return result;
        }
    }
}
