package imports.aws.redshift_scheduled_action;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.166Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftScheduledAction.RedshiftScheduledActionTargetActionResizeCluster")
@software.amazon.jsii.Jsii.Proxy(RedshiftScheduledActionTargetActionResizeCluster.Jsii$Proxy.class)
public interface RedshiftScheduledActionTargetActionResizeCluster extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_scheduled_action#cluster_identifier RedshiftScheduledAction#cluster_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClusterIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_scheduled_action#classic RedshiftScheduledAction#classic}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getClassic() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_scheduled_action#cluster_type RedshiftScheduledAction#cluster_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClusterType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_scheduled_action#node_type RedshiftScheduledAction#node_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNodeType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_scheduled_action#number_of_nodes RedshiftScheduledAction#number_of_nodes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNumberOfNodes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RedshiftScheduledActionTargetActionResizeCluster}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RedshiftScheduledActionTargetActionResizeCluster}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RedshiftScheduledActionTargetActionResizeCluster> {
        java.lang.String clusterIdentifier;
        java.lang.Object classic;
        java.lang.String clusterType;
        java.lang.String nodeType;
        java.lang.Number numberOfNodes;

        /**
         * Sets the value of {@link RedshiftScheduledActionTargetActionResizeCluster#getClusterIdentifier}
         * @param clusterIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_scheduled_action#cluster_identifier RedshiftScheduledAction#cluster_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder clusterIdentifier(java.lang.String clusterIdentifier) {
            this.clusterIdentifier = clusterIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftScheduledActionTargetActionResizeCluster#getClassic}
         * @param classic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_scheduled_action#classic RedshiftScheduledAction#classic}.
         * @return {@code this}
         */
        public Builder classic(java.lang.Boolean classic) {
            this.classic = classic;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftScheduledActionTargetActionResizeCluster#getClassic}
         * @param classic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_scheduled_action#classic RedshiftScheduledAction#classic}.
         * @return {@code this}
         */
        public Builder classic(com.hashicorp.cdktf.IResolvable classic) {
            this.classic = classic;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftScheduledActionTargetActionResizeCluster#getClusterType}
         * @param clusterType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_scheduled_action#cluster_type RedshiftScheduledAction#cluster_type}.
         * @return {@code this}
         */
        public Builder clusterType(java.lang.String clusterType) {
            this.clusterType = clusterType;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftScheduledActionTargetActionResizeCluster#getNodeType}
         * @param nodeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_scheduled_action#node_type RedshiftScheduledAction#node_type}.
         * @return {@code this}
         */
        public Builder nodeType(java.lang.String nodeType) {
            this.nodeType = nodeType;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftScheduledActionTargetActionResizeCluster#getNumberOfNodes}
         * @param numberOfNodes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_scheduled_action#number_of_nodes RedshiftScheduledAction#number_of_nodes}.
         * @return {@code this}
         */
        public Builder numberOfNodes(java.lang.Number numberOfNodes) {
            this.numberOfNodes = numberOfNodes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RedshiftScheduledActionTargetActionResizeCluster}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RedshiftScheduledActionTargetActionResizeCluster build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RedshiftScheduledActionTargetActionResizeCluster}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RedshiftScheduledActionTargetActionResizeCluster {
        private final java.lang.String clusterIdentifier;
        private final java.lang.Object classic;
        private final java.lang.String clusterType;
        private final java.lang.String nodeType;
        private final java.lang.Number numberOfNodes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.clusterIdentifier = software.amazon.jsii.Kernel.get(this, "clusterIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.classic = software.amazon.jsii.Kernel.get(this, "classic", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.clusterType = software.amazon.jsii.Kernel.get(this, "clusterType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nodeType = software.amazon.jsii.Kernel.get(this, "nodeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.numberOfNodes = software.amazon.jsii.Kernel.get(this, "numberOfNodes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.clusterIdentifier = java.util.Objects.requireNonNull(builder.clusterIdentifier, "clusterIdentifier is required");
            this.classic = builder.classic;
            this.clusterType = builder.clusterType;
            this.nodeType = builder.nodeType;
            this.numberOfNodes = builder.numberOfNodes;
        }

        @Override
        public final java.lang.String getClusterIdentifier() {
            return this.clusterIdentifier;
        }

        @Override
        public final java.lang.Object getClassic() {
            return this.classic;
        }

        @Override
        public final java.lang.String getClusterType() {
            return this.clusterType;
        }

        @Override
        public final java.lang.String getNodeType() {
            return this.nodeType;
        }

        @Override
        public final java.lang.Number getNumberOfNodes() {
            return this.numberOfNodes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("clusterIdentifier", om.valueToTree(this.getClusterIdentifier()));
            if (this.getClassic() != null) {
                data.set("classic", om.valueToTree(this.getClassic()));
            }
            if (this.getClusterType() != null) {
                data.set("clusterType", om.valueToTree(this.getClusterType()));
            }
            if (this.getNodeType() != null) {
                data.set("nodeType", om.valueToTree(this.getNodeType()));
            }
            if (this.getNumberOfNodes() != null) {
                data.set("numberOfNodes", om.valueToTree(this.getNumberOfNodes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.redshiftScheduledAction.RedshiftScheduledActionTargetActionResizeCluster"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RedshiftScheduledActionTargetActionResizeCluster.Jsii$Proxy that = (RedshiftScheduledActionTargetActionResizeCluster.Jsii$Proxy) o;

            if (!clusterIdentifier.equals(that.clusterIdentifier)) return false;
            if (this.classic != null ? !this.classic.equals(that.classic) : that.classic != null) return false;
            if (this.clusterType != null ? !this.clusterType.equals(that.clusterType) : that.clusterType != null) return false;
            if (this.nodeType != null ? !this.nodeType.equals(that.nodeType) : that.nodeType != null) return false;
            return this.numberOfNodes != null ? this.numberOfNodes.equals(that.numberOfNodes) : that.numberOfNodes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.clusterIdentifier.hashCode();
            result = 31 * result + (this.classic != null ? this.classic.hashCode() : 0);
            result = 31 * result + (this.clusterType != null ? this.clusterType.hashCode() : 0);
            result = 31 * result + (this.nodeType != null ? this.nodeType.hashCode() : 0);
            result = 31 * result + (this.numberOfNodes != null ? this.numberOfNodes.hashCode() : 0);
            return result;
        }
    }
}
