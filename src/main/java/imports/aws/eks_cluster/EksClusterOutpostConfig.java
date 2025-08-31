package imports.aws.eks_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.158Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksCluster.EksClusterOutpostConfig")
@software.amazon.jsii.Jsii.Proxy(EksClusterOutpostConfig.Jsii$Proxy.class)
public interface EksClusterOutpostConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#control_plane_instance_type EksCluster#control_plane_instance_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getControlPlaneInstanceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#outpost_arns EksCluster#outpost_arns}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getOutpostArns();

    /**
     * control_plane_placement block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#control_plane_placement EksCluster#control_plane_placement}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterOutpostConfigControlPlanePlacement getControlPlanePlacement() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EksClusterOutpostConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EksClusterOutpostConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EksClusterOutpostConfig> {
        java.lang.String controlPlaneInstanceType;
        java.util.List<java.lang.String> outpostArns;
        imports.aws.eks_cluster.EksClusterOutpostConfigControlPlanePlacement controlPlanePlacement;

        /**
         * Sets the value of {@link EksClusterOutpostConfig#getControlPlaneInstanceType}
         * @param controlPlaneInstanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#control_plane_instance_type EksCluster#control_plane_instance_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder controlPlaneInstanceType(java.lang.String controlPlaneInstanceType) {
            this.controlPlaneInstanceType = controlPlaneInstanceType;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterOutpostConfig#getOutpostArns}
         * @param outpostArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#outpost_arns EksCluster#outpost_arns}. This parameter is required.
         * @return {@code this}
         */
        public Builder outpostArns(java.util.List<java.lang.String> outpostArns) {
            this.outpostArns = outpostArns;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterOutpostConfig#getControlPlanePlacement}
         * @param controlPlanePlacement control_plane_placement block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#control_plane_placement EksCluster#control_plane_placement}
         * @return {@code this}
         */
        public Builder controlPlanePlacement(imports.aws.eks_cluster.EksClusterOutpostConfigControlPlanePlacement controlPlanePlacement) {
            this.controlPlanePlacement = controlPlanePlacement;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EksClusterOutpostConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EksClusterOutpostConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EksClusterOutpostConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EksClusterOutpostConfig {
        private final java.lang.String controlPlaneInstanceType;
        private final java.util.List<java.lang.String> outpostArns;
        private final imports.aws.eks_cluster.EksClusterOutpostConfigControlPlanePlacement controlPlanePlacement;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.controlPlaneInstanceType = software.amazon.jsii.Kernel.get(this, "controlPlaneInstanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.outpostArns = software.amazon.jsii.Kernel.get(this, "outpostArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.controlPlanePlacement = software.amazon.jsii.Kernel.get(this, "controlPlanePlacement", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterOutpostConfigControlPlanePlacement.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.controlPlaneInstanceType = java.util.Objects.requireNonNull(builder.controlPlaneInstanceType, "controlPlaneInstanceType is required");
            this.outpostArns = java.util.Objects.requireNonNull(builder.outpostArns, "outpostArns is required");
            this.controlPlanePlacement = builder.controlPlanePlacement;
        }

        @Override
        public final java.lang.String getControlPlaneInstanceType() {
            return this.controlPlaneInstanceType;
        }

        @Override
        public final java.util.List<java.lang.String> getOutpostArns() {
            return this.outpostArns;
        }

        @Override
        public final imports.aws.eks_cluster.EksClusterOutpostConfigControlPlanePlacement getControlPlanePlacement() {
            return this.controlPlanePlacement;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("controlPlaneInstanceType", om.valueToTree(this.getControlPlaneInstanceType()));
            data.set("outpostArns", om.valueToTree(this.getOutpostArns()));
            if (this.getControlPlanePlacement() != null) {
                data.set("controlPlanePlacement", om.valueToTree(this.getControlPlanePlacement()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.eksCluster.EksClusterOutpostConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EksClusterOutpostConfig.Jsii$Proxy that = (EksClusterOutpostConfig.Jsii$Proxy) o;

            if (!controlPlaneInstanceType.equals(that.controlPlaneInstanceType)) return false;
            if (!outpostArns.equals(that.outpostArns)) return false;
            return this.controlPlanePlacement != null ? this.controlPlanePlacement.equals(that.controlPlanePlacement) : that.controlPlanePlacement == null;
        }

        @Override
        public final int hashCode() {
            int result = this.controlPlaneInstanceType.hashCode();
            result = 31 * result + (this.outpostArns.hashCode());
            result = 31 * result + (this.controlPlanePlacement != null ? this.controlPlanePlacement.hashCode() : 0);
            return result;
        }
    }
}
