package imports.aws.batch_compute_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.129Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchComputeEnvironment.BatchComputeEnvironmentEksConfiguration")
@software.amazon.jsii.Jsii.Proxy(BatchComputeEnvironmentEksConfiguration.Jsii$Proxy.class)
public interface BatchComputeEnvironmentEksConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#eks_cluster_arn BatchComputeEnvironment#eks_cluster_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEksClusterArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#kubernetes_namespace BatchComputeEnvironment#kubernetes_namespace}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKubernetesNamespace();

    /**
     * @return a {@link Builder} of {@link BatchComputeEnvironmentEksConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchComputeEnvironmentEksConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchComputeEnvironmentEksConfiguration> {
        java.lang.String eksClusterArn;
        java.lang.String kubernetesNamespace;

        /**
         * Sets the value of {@link BatchComputeEnvironmentEksConfiguration#getEksClusterArn}
         * @param eksClusterArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#eks_cluster_arn BatchComputeEnvironment#eks_cluster_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder eksClusterArn(java.lang.String eksClusterArn) {
            this.eksClusterArn = eksClusterArn;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentEksConfiguration#getKubernetesNamespace}
         * @param kubernetesNamespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#kubernetes_namespace BatchComputeEnvironment#kubernetes_namespace}. This parameter is required.
         * @return {@code this}
         */
        public Builder kubernetesNamespace(java.lang.String kubernetesNamespace) {
            this.kubernetesNamespace = kubernetesNamespace;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BatchComputeEnvironmentEksConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchComputeEnvironmentEksConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchComputeEnvironmentEksConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchComputeEnvironmentEksConfiguration {
        private final java.lang.String eksClusterArn;
        private final java.lang.String kubernetesNamespace;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.eksClusterArn = software.amazon.jsii.Kernel.get(this, "eksClusterArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kubernetesNamespace = software.amazon.jsii.Kernel.get(this, "kubernetesNamespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.eksClusterArn = java.util.Objects.requireNonNull(builder.eksClusterArn, "eksClusterArn is required");
            this.kubernetesNamespace = java.util.Objects.requireNonNull(builder.kubernetesNamespace, "kubernetesNamespace is required");
        }

        @Override
        public final java.lang.String getEksClusterArn() {
            return this.eksClusterArn;
        }

        @Override
        public final java.lang.String getKubernetesNamespace() {
            return this.kubernetesNamespace;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("eksClusterArn", om.valueToTree(this.getEksClusterArn()));
            data.set("kubernetesNamespace", om.valueToTree(this.getKubernetesNamespace()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.batchComputeEnvironment.BatchComputeEnvironmentEksConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchComputeEnvironmentEksConfiguration.Jsii$Proxy that = (BatchComputeEnvironmentEksConfiguration.Jsii$Proxy) o;

            if (!eksClusterArn.equals(that.eksClusterArn)) return false;
            return this.kubernetesNamespace.equals(that.kubernetesNamespace);
        }

        @Override
        public final int hashCode() {
            int result = this.eksClusterArn.hashCode();
            result = 31 * result + (this.kubernetesNamespace.hashCode());
            return result;
        }
    }
}
