package imports.aws.neptune_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.929Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.neptuneCluster.NeptuneClusterServerlessV2ScalingConfiguration")
@software.amazon.jsii.Jsii.Proxy(NeptuneClusterServerlessV2ScalingConfiguration.Jsii$Proxy.class)
public interface NeptuneClusterServerlessV2ScalingConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#max_capacity NeptuneCluster#max_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxCapacity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#min_capacity NeptuneCluster#min_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinCapacity() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NeptuneClusterServerlessV2ScalingConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NeptuneClusterServerlessV2ScalingConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NeptuneClusterServerlessV2ScalingConfiguration> {
        java.lang.Number maxCapacity;
        java.lang.Number minCapacity;

        /**
         * Sets the value of {@link NeptuneClusterServerlessV2ScalingConfiguration#getMaxCapacity}
         * @param maxCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#max_capacity NeptuneCluster#max_capacity}.
         * @return {@code this}
         */
        public Builder maxCapacity(java.lang.Number maxCapacity) {
            this.maxCapacity = maxCapacity;
            return this;
        }

        /**
         * Sets the value of {@link NeptuneClusterServerlessV2ScalingConfiguration#getMinCapacity}
         * @param minCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptune_cluster#min_capacity NeptuneCluster#min_capacity}.
         * @return {@code this}
         */
        public Builder minCapacity(java.lang.Number minCapacity) {
            this.minCapacity = minCapacity;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NeptuneClusterServerlessV2ScalingConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NeptuneClusterServerlessV2ScalingConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NeptuneClusterServerlessV2ScalingConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NeptuneClusterServerlessV2ScalingConfiguration {
        private final java.lang.Number maxCapacity;
        private final java.lang.Number minCapacity;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxCapacity = software.amazon.jsii.Kernel.get(this, "maxCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minCapacity = software.amazon.jsii.Kernel.get(this, "minCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxCapacity = builder.maxCapacity;
            this.minCapacity = builder.minCapacity;
        }

        @Override
        public final java.lang.Number getMaxCapacity() {
            return this.maxCapacity;
        }

        @Override
        public final java.lang.Number getMinCapacity() {
            return this.minCapacity;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMaxCapacity() != null) {
                data.set("maxCapacity", om.valueToTree(this.getMaxCapacity()));
            }
            if (this.getMinCapacity() != null) {
                data.set("minCapacity", om.valueToTree(this.getMinCapacity()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.neptuneCluster.NeptuneClusterServerlessV2ScalingConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NeptuneClusterServerlessV2ScalingConfiguration.Jsii$Proxy that = (NeptuneClusterServerlessV2ScalingConfiguration.Jsii$Proxy) o;

            if (this.maxCapacity != null ? !this.maxCapacity.equals(that.maxCapacity) : that.maxCapacity != null) return false;
            return this.minCapacity != null ? this.minCapacity.equals(that.minCapacity) : that.minCapacity == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maxCapacity != null ? this.maxCapacity.hashCode() : 0;
            result = 31 * result + (this.minCapacity != null ? this.minCapacity.hashCode() : 0);
            return result;
        }
    }
}
