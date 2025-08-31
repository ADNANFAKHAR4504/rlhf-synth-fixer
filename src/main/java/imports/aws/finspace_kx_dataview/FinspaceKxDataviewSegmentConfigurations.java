package imports.aws.finspace_kx_dataview;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.223Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxDataview.FinspaceKxDataviewSegmentConfigurations")
@software.amazon.jsii.Jsii.Proxy(FinspaceKxDataviewSegmentConfigurations.Jsii$Proxy.class)
public interface FinspaceKxDataviewSegmentConfigurations extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#db_paths FinspaceKxDataview#db_paths}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getDbPaths();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#volume_name FinspaceKxDataview#volume_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVolumeName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#on_demand FinspaceKxDataview#on_demand}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOnDemand() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FinspaceKxDataviewSegmentConfigurations}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FinspaceKxDataviewSegmentConfigurations}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FinspaceKxDataviewSegmentConfigurations> {
        java.util.List<java.lang.String> dbPaths;
        java.lang.String volumeName;
        java.lang.Object onDemand;

        /**
         * Sets the value of {@link FinspaceKxDataviewSegmentConfigurations#getDbPaths}
         * @param dbPaths Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#db_paths FinspaceKxDataview#db_paths}. This parameter is required.
         * @return {@code this}
         */
        public Builder dbPaths(java.util.List<java.lang.String> dbPaths) {
            this.dbPaths = dbPaths;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewSegmentConfigurations#getVolumeName}
         * @param volumeName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#volume_name FinspaceKxDataview#volume_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder volumeName(java.lang.String volumeName) {
            this.volumeName = volumeName;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewSegmentConfigurations#getOnDemand}
         * @param onDemand Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#on_demand FinspaceKxDataview#on_demand}.
         * @return {@code this}
         */
        public Builder onDemand(java.lang.Boolean onDemand) {
            this.onDemand = onDemand;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxDataviewSegmentConfigurations#getOnDemand}
         * @param onDemand Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#on_demand FinspaceKxDataview#on_demand}.
         * @return {@code this}
         */
        public Builder onDemand(com.hashicorp.cdktf.IResolvable onDemand) {
            this.onDemand = onDemand;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FinspaceKxDataviewSegmentConfigurations}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FinspaceKxDataviewSegmentConfigurations build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FinspaceKxDataviewSegmentConfigurations}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FinspaceKxDataviewSegmentConfigurations {
        private final java.util.List<java.lang.String> dbPaths;
        private final java.lang.String volumeName;
        private final java.lang.Object onDemand;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dbPaths = software.amazon.jsii.Kernel.get(this, "dbPaths", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.volumeName = software.amazon.jsii.Kernel.get(this, "volumeName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.onDemand = software.amazon.jsii.Kernel.get(this, "onDemand", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dbPaths = java.util.Objects.requireNonNull(builder.dbPaths, "dbPaths is required");
            this.volumeName = java.util.Objects.requireNonNull(builder.volumeName, "volumeName is required");
            this.onDemand = builder.onDemand;
        }

        @Override
        public final java.util.List<java.lang.String> getDbPaths() {
            return this.dbPaths;
        }

        @Override
        public final java.lang.String getVolumeName() {
            return this.volumeName;
        }

        @Override
        public final java.lang.Object getOnDemand() {
            return this.onDemand;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("dbPaths", om.valueToTree(this.getDbPaths()));
            data.set("volumeName", om.valueToTree(this.getVolumeName()));
            if (this.getOnDemand() != null) {
                data.set("onDemand", om.valueToTree(this.getOnDemand()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.finspaceKxDataview.FinspaceKxDataviewSegmentConfigurations"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FinspaceKxDataviewSegmentConfigurations.Jsii$Proxy that = (FinspaceKxDataviewSegmentConfigurations.Jsii$Proxy) o;

            if (!dbPaths.equals(that.dbPaths)) return false;
            if (!volumeName.equals(that.volumeName)) return false;
            return this.onDemand != null ? this.onDemand.equals(that.onDemand) : that.onDemand == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dbPaths.hashCode();
            result = 31 * result + (this.volumeName.hashCode());
            result = 31 * result + (this.onDemand != null ? this.onDemand.hashCode() : 0);
            return result;
        }
    }
}
