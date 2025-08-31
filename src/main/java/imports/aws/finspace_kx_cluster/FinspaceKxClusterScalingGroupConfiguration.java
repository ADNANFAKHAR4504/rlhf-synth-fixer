package imports.aws.finspace_kx_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.218Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxCluster.FinspaceKxClusterScalingGroupConfiguration")
@software.amazon.jsii.Jsii.Proxy(FinspaceKxClusterScalingGroupConfiguration.Jsii$Proxy.class)
public interface FinspaceKxClusterScalingGroupConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#memory_reservation FinspaceKxCluster#memory_reservation}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMemoryReservation();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#node_count FinspaceKxCluster#node_count}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getNodeCount();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scaling_group_name FinspaceKxCluster#scaling_group_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getScalingGroupName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cpu FinspaceKxCluster#cpu}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCpu() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#memory_limit FinspaceKxCluster#memory_limit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMemoryLimit() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FinspaceKxClusterScalingGroupConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FinspaceKxClusterScalingGroupConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FinspaceKxClusterScalingGroupConfiguration> {
        java.lang.Number memoryReservation;
        java.lang.Number nodeCount;
        java.lang.String scalingGroupName;
        java.lang.Number cpu;
        java.lang.Number memoryLimit;

        /**
         * Sets the value of {@link FinspaceKxClusterScalingGroupConfiguration#getMemoryReservation}
         * @param memoryReservation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#memory_reservation FinspaceKxCluster#memory_reservation}. This parameter is required.
         * @return {@code this}
         */
        public Builder memoryReservation(java.lang.Number memoryReservation) {
            this.memoryReservation = memoryReservation;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterScalingGroupConfiguration#getNodeCount}
         * @param nodeCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#node_count FinspaceKxCluster#node_count}. This parameter is required.
         * @return {@code this}
         */
        public Builder nodeCount(java.lang.Number nodeCount) {
            this.nodeCount = nodeCount;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterScalingGroupConfiguration#getScalingGroupName}
         * @param scalingGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scaling_group_name FinspaceKxCluster#scaling_group_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder scalingGroupName(java.lang.String scalingGroupName) {
            this.scalingGroupName = scalingGroupName;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterScalingGroupConfiguration#getCpu}
         * @param cpu Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cpu FinspaceKxCluster#cpu}.
         * @return {@code this}
         */
        public Builder cpu(java.lang.Number cpu) {
            this.cpu = cpu;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterScalingGroupConfiguration#getMemoryLimit}
         * @param memoryLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#memory_limit FinspaceKxCluster#memory_limit}.
         * @return {@code this}
         */
        public Builder memoryLimit(java.lang.Number memoryLimit) {
            this.memoryLimit = memoryLimit;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FinspaceKxClusterScalingGroupConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FinspaceKxClusterScalingGroupConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FinspaceKxClusterScalingGroupConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FinspaceKxClusterScalingGroupConfiguration {
        private final java.lang.Number memoryReservation;
        private final java.lang.Number nodeCount;
        private final java.lang.String scalingGroupName;
        private final java.lang.Number cpu;
        private final java.lang.Number memoryLimit;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.memoryReservation = software.amazon.jsii.Kernel.get(this, "memoryReservation", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.nodeCount = software.amazon.jsii.Kernel.get(this, "nodeCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.scalingGroupName = software.amazon.jsii.Kernel.get(this, "scalingGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cpu = software.amazon.jsii.Kernel.get(this, "cpu", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.memoryLimit = software.amazon.jsii.Kernel.get(this, "memoryLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.memoryReservation = java.util.Objects.requireNonNull(builder.memoryReservation, "memoryReservation is required");
            this.nodeCount = java.util.Objects.requireNonNull(builder.nodeCount, "nodeCount is required");
            this.scalingGroupName = java.util.Objects.requireNonNull(builder.scalingGroupName, "scalingGroupName is required");
            this.cpu = builder.cpu;
            this.memoryLimit = builder.memoryLimit;
        }

        @Override
        public final java.lang.Number getMemoryReservation() {
            return this.memoryReservation;
        }

        @Override
        public final java.lang.Number getNodeCount() {
            return this.nodeCount;
        }

        @Override
        public final java.lang.String getScalingGroupName() {
            return this.scalingGroupName;
        }

        @Override
        public final java.lang.Number getCpu() {
            return this.cpu;
        }

        @Override
        public final java.lang.Number getMemoryLimit() {
            return this.memoryLimit;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("memoryReservation", om.valueToTree(this.getMemoryReservation()));
            data.set("nodeCount", om.valueToTree(this.getNodeCount()));
            data.set("scalingGroupName", om.valueToTree(this.getScalingGroupName()));
            if (this.getCpu() != null) {
                data.set("cpu", om.valueToTree(this.getCpu()));
            }
            if (this.getMemoryLimit() != null) {
                data.set("memoryLimit", om.valueToTree(this.getMemoryLimit()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.finspaceKxCluster.FinspaceKxClusterScalingGroupConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FinspaceKxClusterScalingGroupConfiguration.Jsii$Proxy that = (FinspaceKxClusterScalingGroupConfiguration.Jsii$Proxy) o;

            if (!memoryReservation.equals(that.memoryReservation)) return false;
            if (!nodeCount.equals(that.nodeCount)) return false;
            if (!scalingGroupName.equals(that.scalingGroupName)) return false;
            if (this.cpu != null ? !this.cpu.equals(that.cpu) : that.cpu != null) return false;
            return this.memoryLimit != null ? this.memoryLimit.equals(that.memoryLimit) : that.memoryLimit == null;
        }

        @Override
        public final int hashCode() {
            int result = this.memoryReservation.hashCode();
            result = 31 * result + (this.nodeCount.hashCode());
            result = 31 * result + (this.scalingGroupName.hashCode());
            result = 31 * result + (this.cpu != null ? this.cpu.hashCode() : 0);
            result = 31 * result + (this.memoryLimit != null ? this.memoryLimit.hashCode() : 0);
            return result;
        }
    }
}
