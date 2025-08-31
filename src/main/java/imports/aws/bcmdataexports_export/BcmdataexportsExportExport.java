package imports.aws.bcmdataexports_export;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.137Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bcmdataexportsExport.BcmdataexportsExportExport")
@software.amazon.jsii.Jsii.Proxy(BcmdataexportsExportExport.Jsii$Proxy.class)
public interface BcmdataexportsExportExport extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#name BcmdataexportsExport#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * data_query block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#data_query BcmdataexportsExport#data_query}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDataQuery() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#description BcmdataexportsExport#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * destination_configurations block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#destination_configurations BcmdataexportsExport#destination_configurations}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDestinationConfigurations() {
        return null;
    }

    /**
     * refresh_cadence block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#refresh_cadence BcmdataexportsExport#refresh_cadence}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRefreshCadence() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BcmdataexportsExportExport}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BcmdataexportsExportExport}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BcmdataexportsExportExport> {
        java.lang.String name;
        java.lang.Object dataQuery;
        java.lang.String description;
        java.lang.Object destinationConfigurations;
        java.lang.Object refreshCadence;

        /**
         * Sets the value of {@link BcmdataexportsExportExport#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#name BcmdataexportsExport#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link BcmdataexportsExportExport#getDataQuery}
         * @param dataQuery data_query block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#data_query BcmdataexportsExport#data_query}
         * @return {@code this}
         */
        public Builder dataQuery(com.hashicorp.cdktf.IResolvable dataQuery) {
            this.dataQuery = dataQuery;
            return this;
        }

        /**
         * Sets the value of {@link BcmdataexportsExportExport#getDataQuery}
         * @param dataQuery data_query block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#data_query BcmdataexportsExport#data_query}
         * @return {@code this}
         */
        public Builder dataQuery(java.util.List<? extends imports.aws.bcmdataexports_export.BcmdataexportsExportExportDataQuery> dataQuery) {
            this.dataQuery = dataQuery;
            return this;
        }

        /**
         * Sets the value of {@link BcmdataexportsExportExport#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#description BcmdataexportsExport#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link BcmdataexportsExportExport#getDestinationConfigurations}
         * @param destinationConfigurations destination_configurations block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#destination_configurations BcmdataexportsExport#destination_configurations}
         * @return {@code this}
         */
        public Builder destinationConfigurations(com.hashicorp.cdktf.IResolvable destinationConfigurations) {
            this.destinationConfigurations = destinationConfigurations;
            return this;
        }

        /**
         * Sets the value of {@link BcmdataexportsExportExport#getDestinationConfigurations}
         * @param destinationConfigurations destination_configurations block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#destination_configurations BcmdataexportsExport#destination_configurations}
         * @return {@code this}
         */
        public Builder destinationConfigurations(java.util.List<? extends imports.aws.bcmdataexports_export.BcmdataexportsExportExportDestinationConfigurations> destinationConfigurations) {
            this.destinationConfigurations = destinationConfigurations;
            return this;
        }

        /**
         * Sets the value of {@link BcmdataexportsExportExport#getRefreshCadence}
         * @param refreshCadence refresh_cadence block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#refresh_cadence BcmdataexportsExport#refresh_cadence}
         * @return {@code this}
         */
        public Builder refreshCadence(com.hashicorp.cdktf.IResolvable refreshCadence) {
            this.refreshCadence = refreshCadence;
            return this;
        }

        /**
         * Sets the value of {@link BcmdataexportsExportExport#getRefreshCadence}
         * @param refreshCadence refresh_cadence block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#refresh_cadence BcmdataexportsExport#refresh_cadence}
         * @return {@code this}
         */
        public Builder refreshCadence(java.util.List<? extends imports.aws.bcmdataexports_export.BcmdataexportsExportExportRefreshCadence> refreshCadence) {
            this.refreshCadence = refreshCadence;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BcmdataexportsExportExport}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BcmdataexportsExportExport build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BcmdataexportsExportExport}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BcmdataexportsExportExport {
        private final java.lang.String name;
        private final java.lang.Object dataQuery;
        private final java.lang.String description;
        private final java.lang.Object destinationConfigurations;
        private final java.lang.Object refreshCadence;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataQuery = software.amazon.jsii.Kernel.get(this, "dataQuery", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.destinationConfigurations = software.amazon.jsii.Kernel.get(this, "destinationConfigurations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.refreshCadence = software.amazon.jsii.Kernel.get(this, "refreshCadence", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.dataQuery = builder.dataQuery;
            this.description = builder.description;
            this.destinationConfigurations = builder.destinationConfigurations;
            this.refreshCadence = builder.refreshCadence;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getDataQuery() {
            return this.dataQuery;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getDestinationConfigurations() {
            return this.destinationConfigurations;
        }

        @Override
        public final java.lang.Object getRefreshCadence() {
            return this.refreshCadence;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            if (this.getDataQuery() != null) {
                data.set("dataQuery", om.valueToTree(this.getDataQuery()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDestinationConfigurations() != null) {
                data.set("destinationConfigurations", om.valueToTree(this.getDestinationConfigurations()));
            }
            if (this.getRefreshCadence() != null) {
                data.set("refreshCadence", om.valueToTree(this.getRefreshCadence()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bcmdataexportsExport.BcmdataexportsExportExport"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BcmdataexportsExportExport.Jsii$Proxy that = (BcmdataexportsExportExport.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.dataQuery != null ? !this.dataQuery.equals(that.dataQuery) : that.dataQuery != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.destinationConfigurations != null ? !this.destinationConfigurations.equals(that.destinationConfigurations) : that.destinationConfigurations != null) return false;
            return this.refreshCadence != null ? this.refreshCadence.equals(that.refreshCadence) : that.refreshCadence == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.dataQuery != null ? this.dataQuery.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.destinationConfigurations != null ? this.destinationConfigurations.hashCode() : 0);
            result = 31 * result + (this.refreshCadence != null ? this.refreshCadence.hashCode() : 0);
            return result;
        }
    }
}
