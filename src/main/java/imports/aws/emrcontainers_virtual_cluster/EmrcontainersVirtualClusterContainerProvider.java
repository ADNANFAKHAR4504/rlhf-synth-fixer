package imports.aws.emrcontainers_virtual_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.208Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrcontainersVirtualCluster.EmrcontainersVirtualClusterContainerProvider")
@software.amazon.jsii.Jsii.Proxy(EmrcontainersVirtualClusterContainerProvider.Jsii$Proxy.class)
public interface EmrcontainersVirtualClusterContainerProvider extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_virtual_cluster#id EmrcontainersVirtualCluster#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getId();

    /**
     * info block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_virtual_cluster#info EmrcontainersVirtualCluster#info}
     */
    @org.jetbrains.annotations.NotNull imports.aws.emrcontainers_virtual_cluster.EmrcontainersVirtualClusterContainerProviderInfo getInfo();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_virtual_cluster#type EmrcontainersVirtualCluster#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * @return a {@link Builder} of {@link EmrcontainersVirtualClusterContainerProvider}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrcontainersVirtualClusterContainerProvider}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrcontainersVirtualClusterContainerProvider> {
        java.lang.String id;
        imports.aws.emrcontainers_virtual_cluster.EmrcontainersVirtualClusterContainerProviderInfo info;
        java.lang.String type;

        /**
         * Sets the value of {@link EmrcontainersVirtualClusterContainerProvider#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_virtual_cluster#id EmrcontainersVirtualCluster#id}. This parameter is required.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link EmrcontainersVirtualClusterContainerProvider#getInfo}
         * @param info info block. This parameter is required.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_virtual_cluster#info EmrcontainersVirtualCluster#info}
         * @return {@code this}
         */
        public Builder info(imports.aws.emrcontainers_virtual_cluster.EmrcontainersVirtualClusterContainerProviderInfo info) {
            this.info = info;
            return this;
        }

        /**
         * Sets the value of {@link EmrcontainersVirtualClusterContainerProvider#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrcontainers_virtual_cluster#type EmrcontainersVirtualCluster#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrcontainersVirtualClusterContainerProvider}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrcontainersVirtualClusterContainerProvider build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrcontainersVirtualClusterContainerProvider}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrcontainersVirtualClusterContainerProvider {
        private final java.lang.String id;
        private final imports.aws.emrcontainers_virtual_cluster.EmrcontainersVirtualClusterContainerProviderInfo info;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.info = software.amazon.jsii.Kernel.get(this, "info", software.amazon.jsii.NativeType.forClass(imports.aws.emrcontainers_virtual_cluster.EmrcontainersVirtualClusterContainerProviderInfo.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.id = java.util.Objects.requireNonNull(builder.id, "id is required");
            this.info = java.util.Objects.requireNonNull(builder.info, "info is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.emrcontainers_virtual_cluster.EmrcontainersVirtualClusterContainerProviderInfo getInfo() {
            return this.info;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("id", om.valueToTree(this.getId()));
            data.set("info", om.valueToTree(this.getInfo()));
            data.set("type", om.valueToTree(this.getType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrcontainersVirtualCluster.EmrcontainersVirtualClusterContainerProvider"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrcontainersVirtualClusterContainerProvider.Jsii$Proxy that = (EmrcontainersVirtualClusterContainerProvider.Jsii$Proxy) o;

            if (!id.equals(that.id)) return false;
            if (!info.equals(that.info)) return false;
            return this.type.equals(that.type);
        }

        @Override
        public final int hashCode() {
            int result = this.id.hashCode();
            result = 31 * result + (this.info.hashCode());
            result = 31 * result + (this.type.hashCode());
            return result;
        }
    }
}
