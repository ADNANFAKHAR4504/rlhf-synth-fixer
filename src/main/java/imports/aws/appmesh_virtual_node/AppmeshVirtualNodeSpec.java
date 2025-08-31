package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.040Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpec")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualNodeSpec.Jsii$Proxy.class)
public interface AppmeshVirtualNodeSpec extends software.amazon.jsii.JsiiSerializable {

    /**
     * backend block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#backend AppmeshVirtualNode#backend}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBackend() {
        return null;
    }

    /**
     * backend_defaults block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#backend_defaults AppmeshVirtualNode#backend_defaults}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendDefaults getBackendDefaults() {
        return null;
    }

    /**
     * listener block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#listener AppmeshVirtualNode#listener}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getListener() {
        return null;
    }

    /**
     * logging block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#logging AppmeshVirtualNode#logging}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecLogging getLogging() {
        return null;
    }

    /**
     * service_discovery block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#service_discovery AppmeshVirtualNode#service_discovery}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecServiceDiscovery getServiceDiscovery() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualNodeSpec}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualNodeSpec}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualNodeSpec> {
        java.lang.Object backend;
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendDefaults backendDefaults;
        java.lang.Object listener;
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecLogging logging;
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecServiceDiscovery serviceDiscovery;

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpec#getBackend}
         * @param backend backend block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#backend AppmeshVirtualNode#backend}
         * @return {@code this}
         */
        public Builder backend(com.hashicorp.cdktf.IResolvable backend) {
            this.backend = backend;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpec#getBackend}
         * @param backend backend block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#backend AppmeshVirtualNode#backend}
         * @return {@code this}
         */
        public Builder backend(java.util.List<? extends imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackend> backend) {
            this.backend = backend;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpec#getBackendDefaults}
         * @param backendDefaults backend_defaults block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#backend_defaults AppmeshVirtualNode#backend_defaults}
         * @return {@code this}
         */
        public Builder backendDefaults(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendDefaults backendDefaults) {
            this.backendDefaults = backendDefaults;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpec#getListener}
         * @param listener listener block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#listener AppmeshVirtualNode#listener}
         * @return {@code this}
         */
        public Builder listener(com.hashicorp.cdktf.IResolvable listener) {
            this.listener = listener;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpec#getListener}
         * @param listener listener block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#listener AppmeshVirtualNode#listener}
         * @return {@code this}
         */
        public Builder listener(java.util.List<? extends imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListener> listener) {
            this.listener = listener;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpec#getLogging}
         * @param logging logging block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#logging AppmeshVirtualNode#logging}
         * @return {@code this}
         */
        public Builder logging(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecLogging logging) {
            this.logging = logging;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpec#getServiceDiscovery}
         * @param serviceDiscovery service_discovery block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#service_discovery AppmeshVirtualNode#service_discovery}
         * @return {@code this}
         */
        public Builder serviceDiscovery(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecServiceDiscovery serviceDiscovery) {
            this.serviceDiscovery = serviceDiscovery;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualNodeSpec}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualNodeSpec build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualNodeSpec}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualNodeSpec {
        private final java.lang.Object backend;
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendDefaults backendDefaults;
        private final java.lang.Object listener;
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecLogging logging;
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecServiceDiscovery serviceDiscovery;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.backend = software.amazon.jsii.Kernel.get(this, "backend", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.backendDefaults = software.amazon.jsii.Kernel.get(this, "backendDefaults", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendDefaults.class));
            this.listener = software.amazon.jsii.Kernel.get(this, "listener", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.logging = software.amazon.jsii.Kernel.get(this, "logging", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecLogging.class));
            this.serviceDiscovery = software.amazon.jsii.Kernel.get(this, "serviceDiscovery", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecServiceDiscovery.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.backend = builder.backend;
            this.backendDefaults = builder.backendDefaults;
            this.listener = builder.listener;
            this.logging = builder.logging;
            this.serviceDiscovery = builder.serviceDiscovery;
        }

        @Override
        public final java.lang.Object getBackend() {
            return this.backend;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecBackendDefaults getBackendDefaults() {
            return this.backendDefaults;
        }

        @Override
        public final java.lang.Object getListener() {
            return this.listener;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecLogging getLogging() {
            return this.logging;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecServiceDiscovery getServiceDiscovery() {
            return this.serviceDiscovery;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBackend() != null) {
                data.set("backend", om.valueToTree(this.getBackend()));
            }
            if (this.getBackendDefaults() != null) {
                data.set("backendDefaults", om.valueToTree(this.getBackendDefaults()));
            }
            if (this.getListener() != null) {
                data.set("listener", om.valueToTree(this.getListener()));
            }
            if (this.getLogging() != null) {
                data.set("logging", om.valueToTree(this.getLogging()));
            }
            if (this.getServiceDiscovery() != null) {
                data.set("serviceDiscovery", om.valueToTree(this.getServiceDiscovery()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualNode.AppmeshVirtualNodeSpec"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualNodeSpec.Jsii$Proxy that = (AppmeshVirtualNodeSpec.Jsii$Proxy) o;

            if (this.backend != null ? !this.backend.equals(that.backend) : that.backend != null) return false;
            if (this.backendDefaults != null ? !this.backendDefaults.equals(that.backendDefaults) : that.backendDefaults != null) return false;
            if (this.listener != null ? !this.listener.equals(that.listener) : that.listener != null) return false;
            if (this.logging != null ? !this.logging.equals(that.logging) : that.logging != null) return false;
            return this.serviceDiscovery != null ? this.serviceDiscovery.equals(that.serviceDiscovery) : that.serviceDiscovery == null;
        }

        @Override
        public final int hashCode() {
            int result = this.backend != null ? this.backend.hashCode() : 0;
            result = 31 * result + (this.backendDefaults != null ? this.backendDefaults.hashCode() : 0);
            result = 31 * result + (this.listener != null ? this.listener.hashCode() : 0);
            result = 31 * result + (this.logging != null ? this.logging.hashCode() : 0);
            result = 31 * result + (this.serviceDiscovery != null ? this.serviceDiscovery.hashCode() : 0);
            return result;
        }
    }
}
