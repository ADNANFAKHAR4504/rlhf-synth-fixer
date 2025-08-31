package imports.aws.fsx_ontap_volume;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.249Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOntapVolume.FsxOntapVolumeAggregateConfiguration")
@software.amazon.jsii.Jsii.Proxy(FsxOntapVolumeAggregateConfiguration.Jsii$Proxy.class)
public interface FsxOntapVolumeAggregateConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#aggregates FsxOntapVolume#aggregates}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAggregates() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#constituents_per_aggregate FsxOntapVolume#constituents_per_aggregate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getConstituentsPerAggregate() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxOntapVolumeAggregateConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxOntapVolumeAggregateConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxOntapVolumeAggregateConfiguration> {
        java.util.List<java.lang.String> aggregates;
        java.lang.Number constituentsPerAggregate;

        /**
         * Sets the value of {@link FsxOntapVolumeAggregateConfiguration#getAggregates}
         * @param aggregates Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#aggregates FsxOntapVolume#aggregates}.
         * @return {@code this}
         */
        public Builder aggregates(java.util.List<java.lang.String> aggregates) {
            this.aggregates = aggregates;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeAggregateConfiguration#getConstituentsPerAggregate}
         * @param constituentsPerAggregate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#constituents_per_aggregate FsxOntapVolume#constituents_per_aggregate}.
         * @return {@code this}
         */
        public Builder constituentsPerAggregate(java.lang.Number constituentsPerAggregate) {
            this.constituentsPerAggregate = constituentsPerAggregate;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxOntapVolumeAggregateConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxOntapVolumeAggregateConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxOntapVolumeAggregateConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxOntapVolumeAggregateConfiguration {
        private final java.util.List<java.lang.String> aggregates;
        private final java.lang.Number constituentsPerAggregate;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.aggregates = software.amazon.jsii.Kernel.get(this, "aggregates", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.constituentsPerAggregate = software.amazon.jsii.Kernel.get(this, "constituentsPerAggregate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.aggregates = builder.aggregates;
            this.constituentsPerAggregate = builder.constituentsPerAggregate;
        }

        @Override
        public final java.util.List<java.lang.String> getAggregates() {
            return this.aggregates;
        }

        @Override
        public final java.lang.Number getConstituentsPerAggregate() {
            return this.constituentsPerAggregate;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAggregates() != null) {
                data.set("aggregates", om.valueToTree(this.getAggregates()));
            }
            if (this.getConstituentsPerAggregate() != null) {
                data.set("constituentsPerAggregate", om.valueToTree(this.getConstituentsPerAggregate()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxOntapVolume.FsxOntapVolumeAggregateConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxOntapVolumeAggregateConfiguration.Jsii$Proxy that = (FsxOntapVolumeAggregateConfiguration.Jsii$Proxy) o;

            if (this.aggregates != null ? !this.aggregates.equals(that.aggregates) : that.aggregates != null) return false;
            return this.constituentsPerAggregate != null ? this.constituentsPerAggregate.equals(that.constituentsPerAggregate) : that.constituentsPerAggregate == null;
        }

        @Override
        public final int hashCode() {
            int result = this.aggregates != null ? this.aggregates.hashCode() : 0;
            result = 31 * result + (this.constituentsPerAggregate != null ? this.constituentsPerAggregate.hashCode() : 0);
            return result;
        }
    }
}
