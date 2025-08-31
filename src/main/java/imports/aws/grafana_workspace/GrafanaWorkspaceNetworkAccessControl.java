package imports.aws.grafana_workspace;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.309Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.grafanaWorkspace.GrafanaWorkspaceNetworkAccessControl")
@software.amazon.jsii.Jsii.Proxy(GrafanaWorkspaceNetworkAccessControl.Jsii$Proxy.class)
public interface GrafanaWorkspaceNetworkAccessControl extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#prefix_list_ids GrafanaWorkspace#prefix_list_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPrefixListIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#vpce_ids GrafanaWorkspace#vpce_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getVpceIds();

    /**
     * @return a {@link Builder} of {@link GrafanaWorkspaceNetworkAccessControl}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GrafanaWorkspaceNetworkAccessControl}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GrafanaWorkspaceNetworkAccessControl> {
        java.util.List<java.lang.String> prefixListIds;
        java.util.List<java.lang.String> vpceIds;

        /**
         * Sets the value of {@link GrafanaWorkspaceNetworkAccessControl#getPrefixListIds}
         * @param prefixListIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#prefix_list_ids GrafanaWorkspace#prefix_list_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder prefixListIds(java.util.List<java.lang.String> prefixListIds) {
            this.prefixListIds = prefixListIds;
            return this;
        }

        /**
         * Sets the value of {@link GrafanaWorkspaceNetworkAccessControl#getVpceIds}
         * @param vpceIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/grafana_workspace#vpce_ids GrafanaWorkspace#vpce_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder vpceIds(java.util.List<java.lang.String> vpceIds) {
            this.vpceIds = vpceIds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GrafanaWorkspaceNetworkAccessControl}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GrafanaWorkspaceNetworkAccessControl build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GrafanaWorkspaceNetworkAccessControl}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GrafanaWorkspaceNetworkAccessControl {
        private final java.util.List<java.lang.String> prefixListIds;
        private final java.util.List<java.lang.String> vpceIds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.prefixListIds = software.amazon.jsii.Kernel.get(this, "prefixListIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpceIds = software.amazon.jsii.Kernel.get(this, "vpceIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.prefixListIds = java.util.Objects.requireNonNull(builder.prefixListIds, "prefixListIds is required");
            this.vpceIds = java.util.Objects.requireNonNull(builder.vpceIds, "vpceIds is required");
        }

        @Override
        public final java.util.List<java.lang.String> getPrefixListIds() {
            return this.prefixListIds;
        }

        @Override
        public final java.util.List<java.lang.String> getVpceIds() {
            return this.vpceIds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("prefixListIds", om.valueToTree(this.getPrefixListIds()));
            data.set("vpceIds", om.valueToTree(this.getVpceIds()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.grafanaWorkspace.GrafanaWorkspaceNetworkAccessControl"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GrafanaWorkspaceNetworkAccessControl.Jsii$Proxy that = (GrafanaWorkspaceNetworkAccessControl.Jsii$Proxy) o;

            if (!prefixListIds.equals(that.prefixListIds)) return false;
            return this.vpceIds.equals(that.vpceIds);
        }

        @Override
        public final int hashCode() {
            int result = this.prefixListIds.hashCode();
            result = 31 * result + (this.vpceIds.hashCode());
            return result;
        }
    }
}
