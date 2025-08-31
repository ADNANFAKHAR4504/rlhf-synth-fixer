package imports.aws.dsql_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.032Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dsqlCluster.DsqlClusterMultiRegionProperties")
@software.amazon.jsii.Jsii.Proxy(DsqlClusterMultiRegionProperties.Jsii$Proxy.class)
public interface DsqlClusterMultiRegionProperties extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dsql_cluster#clusters DsqlCluster#clusters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getClusters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dsql_cluster#witness_region DsqlCluster#witness_region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWitnessRegion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DsqlClusterMultiRegionProperties}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DsqlClusterMultiRegionProperties}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DsqlClusterMultiRegionProperties> {
        java.util.List<java.lang.String> clusters;
        java.lang.String witnessRegion;

        /**
         * Sets the value of {@link DsqlClusterMultiRegionProperties#getClusters}
         * @param clusters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dsql_cluster#clusters DsqlCluster#clusters}.
         * @return {@code this}
         */
        public Builder clusters(java.util.List<java.lang.String> clusters) {
            this.clusters = clusters;
            return this;
        }

        /**
         * Sets the value of {@link DsqlClusterMultiRegionProperties#getWitnessRegion}
         * @param witnessRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dsql_cluster#witness_region DsqlCluster#witness_region}.
         * @return {@code this}
         */
        public Builder witnessRegion(java.lang.String witnessRegion) {
            this.witnessRegion = witnessRegion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DsqlClusterMultiRegionProperties}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DsqlClusterMultiRegionProperties build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DsqlClusterMultiRegionProperties}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DsqlClusterMultiRegionProperties {
        private final java.util.List<java.lang.String> clusters;
        private final java.lang.String witnessRegion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.clusters = software.amazon.jsii.Kernel.get(this, "clusters", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.witnessRegion = software.amazon.jsii.Kernel.get(this, "witnessRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.clusters = builder.clusters;
            this.witnessRegion = builder.witnessRegion;
        }

        @Override
        public final java.util.List<java.lang.String> getClusters() {
            return this.clusters;
        }

        @Override
        public final java.lang.String getWitnessRegion() {
            return this.witnessRegion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getClusters() != null) {
                data.set("clusters", om.valueToTree(this.getClusters()));
            }
            if (this.getWitnessRegion() != null) {
                data.set("witnessRegion", om.valueToTree(this.getWitnessRegion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dsqlCluster.DsqlClusterMultiRegionProperties"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DsqlClusterMultiRegionProperties.Jsii$Proxy that = (DsqlClusterMultiRegionProperties.Jsii$Proxy) o;

            if (this.clusters != null ? !this.clusters.equals(that.clusters) : that.clusters != null) return false;
            return this.witnessRegion != null ? this.witnessRegion.equals(that.witnessRegion) : that.witnessRegion == null;
        }

        @Override
        public final int hashCode() {
            int result = this.clusters != null ? this.clusters.hashCode() : 0;
            result = 31 * result + (this.witnessRegion != null ? this.witnessRegion.hashCode() : 0);
            return result;
        }
    }
}
