package imports.aws.eks_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.158Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksCluster.EksClusterKubernetesNetworkConfig")
@software.amazon.jsii.Jsii.Proxy(EksClusterKubernetesNetworkConfig.Jsii$Proxy.class)
public interface EksClusterKubernetesNetworkConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * elastic_load_balancing block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#elastic_load_balancing EksCluster#elastic_load_balancing}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterKubernetesNetworkConfigElasticLoadBalancing getElasticLoadBalancing() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#ip_family EksCluster#ip_family}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpFamily() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#service_ipv4_cidr EksCluster#service_ipv4_cidr}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceIpv4Cidr() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EksClusterKubernetesNetworkConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EksClusterKubernetesNetworkConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EksClusterKubernetesNetworkConfig> {
        imports.aws.eks_cluster.EksClusterKubernetesNetworkConfigElasticLoadBalancing elasticLoadBalancing;
        java.lang.String ipFamily;
        java.lang.String serviceIpv4Cidr;

        /**
         * Sets the value of {@link EksClusterKubernetesNetworkConfig#getElasticLoadBalancing}
         * @param elasticLoadBalancing elastic_load_balancing block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#elastic_load_balancing EksCluster#elastic_load_balancing}
         * @return {@code this}
         */
        public Builder elasticLoadBalancing(imports.aws.eks_cluster.EksClusterKubernetesNetworkConfigElasticLoadBalancing elasticLoadBalancing) {
            this.elasticLoadBalancing = elasticLoadBalancing;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterKubernetesNetworkConfig#getIpFamily}
         * @param ipFamily Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#ip_family EksCluster#ip_family}.
         * @return {@code this}
         */
        public Builder ipFamily(java.lang.String ipFamily) {
            this.ipFamily = ipFamily;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterKubernetesNetworkConfig#getServiceIpv4Cidr}
         * @param serviceIpv4Cidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#service_ipv4_cidr EksCluster#service_ipv4_cidr}.
         * @return {@code this}
         */
        public Builder serviceIpv4Cidr(java.lang.String serviceIpv4Cidr) {
            this.serviceIpv4Cidr = serviceIpv4Cidr;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EksClusterKubernetesNetworkConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EksClusterKubernetesNetworkConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EksClusterKubernetesNetworkConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EksClusterKubernetesNetworkConfig {
        private final imports.aws.eks_cluster.EksClusterKubernetesNetworkConfigElasticLoadBalancing elasticLoadBalancing;
        private final java.lang.String ipFamily;
        private final java.lang.String serviceIpv4Cidr;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.elasticLoadBalancing = software.amazon.jsii.Kernel.get(this, "elasticLoadBalancing", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterKubernetesNetworkConfigElasticLoadBalancing.class));
            this.ipFamily = software.amazon.jsii.Kernel.get(this, "ipFamily", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceIpv4Cidr = software.amazon.jsii.Kernel.get(this, "serviceIpv4Cidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.elasticLoadBalancing = builder.elasticLoadBalancing;
            this.ipFamily = builder.ipFamily;
            this.serviceIpv4Cidr = builder.serviceIpv4Cidr;
        }

        @Override
        public final imports.aws.eks_cluster.EksClusterKubernetesNetworkConfigElasticLoadBalancing getElasticLoadBalancing() {
            return this.elasticLoadBalancing;
        }

        @Override
        public final java.lang.String getIpFamily() {
            return this.ipFamily;
        }

        @Override
        public final java.lang.String getServiceIpv4Cidr() {
            return this.serviceIpv4Cidr;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getElasticLoadBalancing() != null) {
                data.set("elasticLoadBalancing", om.valueToTree(this.getElasticLoadBalancing()));
            }
            if (this.getIpFamily() != null) {
                data.set("ipFamily", om.valueToTree(this.getIpFamily()));
            }
            if (this.getServiceIpv4Cidr() != null) {
                data.set("serviceIpv4Cidr", om.valueToTree(this.getServiceIpv4Cidr()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.eksCluster.EksClusterKubernetesNetworkConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EksClusterKubernetesNetworkConfig.Jsii$Proxy that = (EksClusterKubernetesNetworkConfig.Jsii$Proxy) o;

            if (this.elasticLoadBalancing != null ? !this.elasticLoadBalancing.equals(that.elasticLoadBalancing) : that.elasticLoadBalancing != null) return false;
            if (this.ipFamily != null ? !this.ipFamily.equals(that.ipFamily) : that.ipFamily != null) return false;
            return this.serviceIpv4Cidr != null ? this.serviceIpv4Cidr.equals(that.serviceIpv4Cidr) : that.serviceIpv4Cidr == null;
        }

        @Override
        public final int hashCode() {
            int result = this.elasticLoadBalancing != null ? this.elasticLoadBalancing.hashCode() : 0;
            result = 31 * result + (this.ipFamily != null ? this.ipFamily.hashCode() : 0);
            result = 31 * result + (this.serviceIpv4Cidr != null ? this.serviceIpv4Cidr.hashCode() : 0);
            return result;
        }
    }
}
