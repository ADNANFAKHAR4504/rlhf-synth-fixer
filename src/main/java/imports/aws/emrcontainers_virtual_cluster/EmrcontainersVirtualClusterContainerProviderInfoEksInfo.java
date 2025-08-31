package imports.aws.emrcontainers_virtual_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.208Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrcontainersVirtualCluster.EmrcontainersVirtualClusterContainerProviderInfoEksInfo")
@software.amazon.jsii.Jsii.Proxy(EmrcontainersVirtualClusterContainerProviderInfoEksInfo.Jsii$Proxy.class)
public interface EmrcontainersVirtualClusterContainerProviderInfoEksInfo extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_virtual_cluster#namespace EmrcontainersVirtualCluster#namespace}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamespace() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrcontainersVirtualClusterContainerProviderInfoEksInfo}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrcontainersVirtualClusterContainerProviderInfoEksInfo}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrcontainersVirtualClusterContainerProviderInfoEksInfo> {
        java.lang.String namespace;

        /**
         * Sets the value of {@link EmrcontainersVirtualClusterContainerProviderInfoEksInfo#getNamespace}
         * @param namespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_virtual_cluster#namespace EmrcontainersVirtualCluster#namespace}.
         * @return {@code this}
         */
        public Builder namespace(java.lang.String namespace) {
            this.namespace = namespace;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrcontainersVirtualClusterContainerProviderInfoEksInfo}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrcontainersVirtualClusterContainerProviderInfoEksInfo build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrcontainersVirtualClusterContainerProviderInfoEksInfo}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrcontainersVirtualClusterContainerProviderInfoEksInfo {
        private final java.lang.String namespace;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.namespace = software.amazon.jsii.Kernel.get(this, "namespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.namespace = builder.namespace;
        }

        @Override
        public final java.lang.String getNamespace() {
            return this.namespace;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getNamespace() != null) {
                data.set("namespace", om.valueToTree(this.getNamespace()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrcontainersVirtualCluster.EmrcontainersVirtualClusterContainerProviderInfoEksInfo"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrcontainersVirtualClusterContainerProviderInfoEksInfo.Jsii$Proxy that = (EmrcontainersVirtualClusterContainerProviderInfoEksInfo.Jsii$Proxy) o;

            return this.namespace != null ? this.namespace.equals(that.namespace) : that.namespace == null;
        }

        @Override
        public final int hashCode() {
            int result = this.namespace != null ? this.namespace.hashCode() : 0;
            return result;
        }
    }
}
