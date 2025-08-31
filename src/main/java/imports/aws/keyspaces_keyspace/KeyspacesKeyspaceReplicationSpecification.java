package imports.aws.keyspaces_keyspace;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.440Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.keyspacesKeyspace.KeyspacesKeyspaceReplicationSpecification")
@software.amazon.jsii.Jsii.Proxy(KeyspacesKeyspaceReplicationSpecification.Jsii$Proxy.class)
public interface KeyspacesKeyspaceReplicationSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_keyspace#region_list KeyspacesKeyspace#region_list}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRegionList() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_keyspace#replication_strategy KeyspacesKeyspace#replication_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReplicationStrategy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KeyspacesKeyspaceReplicationSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KeyspacesKeyspaceReplicationSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KeyspacesKeyspaceReplicationSpecification> {
        java.util.List<java.lang.String> regionList;
        java.lang.String replicationStrategy;

        /**
         * Sets the value of {@link KeyspacesKeyspaceReplicationSpecification#getRegionList}
         * @param regionList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_keyspace#region_list KeyspacesKeyspace#region_list}.
         * @return {@code this}
         */
        public Builder regionList(java.util.List<java.lang.String> regionList) {
            this.regionList = regionList;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesKeyspaceReplicationSpecification#getReplicationStrategy}
         * @param replicationStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_keyspace#replication_strategy KeyspacesKeyspace#replication_strategy}.
         * @return {@code this}
         */
        public Builder replicationStrategy(java.lang.String replicationStrategy) {
            this.replicationStrategy = replicationStrategy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KeyspacesKeyspaceReplicationSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KeyspacesKeyspaceReplicationSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KeyspacesKeyspaceReplicationSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KeyspacesKeyspaceReplicationSpecification {
        private final java.util.List<java.lang.String> regionList;
        private final java.lang.String replicationStrategy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.regionList = software.amazon.jsii.Kernel.get(this, "regionList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.replicationStrategy = software.amazon.jsii.Kernel.get(this, "replicationStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.regionList = builder.regionList;
            this.replicationStrategy = builder.replicationStrategy;
        }

        @Override
        public final java.util.List<java.lang.String> getRegionList() {
            return this.regionList;
        }

        @Override
        public final java.lang.String getReplicationStrategy() {
            return this.replicationStrategy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRegionList() != null) {
                data.set("regionList", om.valueToTree(this.getRegionList()));
            }
            if (this.getReplicationStrategy() != null) {
                data.set("replicationStrategy", om.valueToTree(this.getReplicationStrategy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.keyspacesKeyspace.KeyspacesKeyspaceReplicationSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KeyspacesKeyspaceReplicationSpecification.Jsii$Proxy that = (KeyspacesKeyspaceReplicationSpecification.Jsii$Proxy) o;

            if (this.regionList != null ? !this.regionList.equals(that.regionList) : that.regionList != null) return false;
            return this.replicationStrategy != null ? this.replicationStrategy.equals(that.replicationStrategy) : that.replicationStrategy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.regionList != null ? this.regionList.hashCode() : 0;
            result = 31 * result + (this.replicationStrategy != null ? this.replicationStrategy.hashCode() : 0);
            return result;
        }
    }
}
