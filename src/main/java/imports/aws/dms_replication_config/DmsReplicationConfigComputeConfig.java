package imports.aws.dms_replication_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.015Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dmsReplicationConfig.DmsReplicationConfigComputeConfig")
@software.amazon.jsii.Jsii.Proxy(DmsReplicationConfigComputeConfig.Jsii$Proxy.class)
public interface DmsReplicationConfigComputeConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#replication_subnet_group_id DmsReplicationConfig#replication_subnet_group_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getReplicationSubnetGroupId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#availability_zone DmsReplicationConfig#availability_zone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZone() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#dns_name_servers DmsReplicationConfig#dns_name_servers}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDnsNameServers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#kms_key_id DmsReplicationConfig#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#max_capacity_units DmsReplicationConfig#max_capacity_units}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxCapacityUnits() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#min_capacity_units DmsReplicationConfig#min_capacity_units}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinCapacityUnits() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#multi_az DmsReplicationConfig#multi_az}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMultiAz() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#preferred_maintenance_window DmsReplicationConfig#preferred_maintenance_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPreferredMaintenanceWindow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#vpc_security_group_ids DmsReplicationConfig#vpc_security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcSecurityGroupIds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DmsReplicationConfigComputeConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DmsReplicationConfigComputeConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DmsReplicationConfigComputeConfig> {
        java.lang.String replicationSubnetGroupId;
        java.lang.String availabilityZone;
        java.lang.String dnsNameServers;
        java.lang.String kmsKeyId;
        java.lang.Number maxCapacityUnits;
        java.lang.Number minCapacityUnits;
        java.lang.Object multiAz;
        java.lang.String preferredMaintenanceWindow;
        java.util.List<java.lang.String> vpcSecurityGroupIds;

        /**
         * Sets the value of {@link DmsReplicationConfigComputeConfig#getReplicationSubnetGroupId}
         * @param replicationSubnetGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#replication_subnet_group_id DmsReplicationConfig#replication_subnet_group_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder replicationSubnetGroupId(java.lang.String replicationSubnetGroupId) {
            this.replicationSubnetGroupId = replicationSubnetGroupId;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigComputeConfig#getAvailabilityZone}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#availability_zone DmsReplicationConfig#availability_zone}.
         * @return {@code this}
         */
        public Builder availabilityZone(java.lang.String availabilityZone) {
            this.availabilityZone = availabilityZone;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigComputeConfig#getDnsNameServers}
         * @param dnsNameServers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#dns_name_servers DmsReplicationConfig#dns_name_servers}.
         * @return {@code this}
         */
        public Builder dnsNameServers(java.lang.String dnsNameServers) {
            this.dnsNameServers = dnsNameServers;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigComputeConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#kms_key_id DmsReplicationConfig#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigComputeConfig#getMaxCapacityUnits}
         * @param maxCapacityUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#max_capacity_units DmsReplicationConfig#max_capacity_units}.
         * @return {@code this}
         */
        public Builder maxCapacityUnits(java.lang.Number maxCapacityUnits) {
            this.maxCapacityUnits = maxCapacityUnits;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigComputeConfig#getMinCapacityUnits}
         * @param minCapacityUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#min_capacity_units DmsReplicationConfig#min_capacity_units}.
         * @return {@code this}
         */
        public Builder minCapacityUnits(java.lang.Number minCapacityUnits) {
            this.minCapacityUnits = minCapacityUnits;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigComputeConfig#getMultiAz}
         * @param multiAz Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#multi_az DmsReplicationConfig#multi_az}.
         * @return {@code this}
         */
        public Builder multiAz(java.lang.Boolean multiAz) {
            this.multiAz = multiAz;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigComputeConfig#getMultiAz}
         * @param multiAz Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#multi_az DmsReplicationConfig#multi_az}.
         * @return {@code this}
         */
        public Builder multiAz(com.hashicorp.cdktf.IResolvable multiAz) {
            this.multiAz = multiAz;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigComputeConfig#getPreferredMaintenanceWindow}
         * @param preferredMaintenanceWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#preferred_maintenance_window DmsReplicationConfig#preferred_maintenance_window}.
         * @return {@code this}
         */
        public Builder preferredMaintenanceWindow(java.lang.String preferredMaintenanceWindow) {
            this.preferredMaintenanceWindow = preferredMaintenanceWindow;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigComputeConfig#getVpcSecurityGroupIds}
         * @param vpcSecurityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#vpc_security_group_ids DmsReplicationConfig#vpc_security_group_ids}.
         * @return {@code this}
         */
        public Builder vpcSecurityGroupIds(java.util.List<java.lang.String> vpcSecurityGroupIds) {
            this.vpcSecurityGroupIds = vpcSecurityGroupIds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DmsReplicationConfigComputeConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DmsReplicationConfigComputeConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DmsReplicationConfigComputeConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DmsReplicationConfigComputeConfig {
        private final java.lang.String replicationSubnetGroupId;
        private final java.lang.String availabilityZone;
        private final java.lang.String dnsNameServers;
        private final java.lang.String kmsKeyId;
        private final java.lang.Number maxCapacityUnits;
        private final java.lang.Number minCapacityUnits;
        private final java.lang.Object multiAz;
        private final java.lang.String preferredMaintenanceWindow;
        private final java.util.List<java.lang.String> vpcSecurityGroupIds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.replicationSubnetGroupId = software.amazon.jsii.Kernel.get(this, "replicationSubnetGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.availabilityZone = software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dnsNameServers = software.amazon.jsii.Kernel.get(this, "dnsNameServers", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxCapacityUnits = software.amazon.jsii.Kernel.get(this, "maxCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minCapacityUnits = software.amazon.jsii.Kernel.get(this, "minCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.multiAz = software.amazon.jsii.Kernel.get(this, "multiAz", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.preferredMaintenanceWindow = software.amazon.jsii.Kernel.get(this, "preferredMaintenanceWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcSecurityGroupIds = software.amazon.jsii.Kernel.get(this, "vpcSecurityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.replicationSubnetGroupId = java.util.Objects.requireNonNull(builder.replicationSubnetGroupId, "replicationSubnetGroupId is required");
            this.availabilityZone = builder.availabilityZone;
            this.dnsNameServers = builder.dnsNameServers;
            this.kmsKeyId = builder.kmsKeyId;
            this.maxCapacityUnits = builder.maxCapacityUnits;
            this.minCapacityUnits = builder.minCapacityUnits;
            this.multiAz = builder.multiAz;
            this.preferredMaintenanceWindow = builder.preferredMaintenanceWindow;
            this.vpcSecurityGroupIds = builder.vpcSecurityGroupIds;
        }

        @Override
        public final java.lang.String getReplicationSubnetGroupId() {
            return this.replicationSubnetGroupId;
        }

        @Override
        public final java.lang.String getAvailabilityZone() {
            return this.availabilityZone;
        }

        @Override
        public final java.lang.String getDnsNameServers() {
            return this.dnsNameServers;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.Number getMaxCapacityUnits() {
            return this.maxCapacityUnits;
        }

        @Override
        public final java.lang.Number getMinCapacityUnits() {
            return this.minCapacityUnits;
        }

        @Override
        public final java.lang.Object getMultiAz() {
            return this.multiAz;
        }

        @Override
        public final java.lang.String getPreferredMaintenanceWindow() {
            return this.preferredMaintenanceWindow;
        }

        @Override
        public final java.util.List<java.lang.String> getVpcSecurityGroupIds() {
            return this.vpcSecurityGroupIds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("replicationSubnetGroupId", om.valueToTree(this.getReplicationSubnetGroupId()));
            if (this.getAvailabilityZone() != null) {
                data.set("availabilityZone", om.valueToTree(this.getAvailabilityZone()));
            }
            if (this.getDnsNameServers() != null) {
                data.set("dnsNameServers", om.valueToTree(this.getDnsNameServers()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getMaxCapacityUnits() != null) {
                data.set("maxCapacityUnits", om.valueToTree(this.getMaxCapacityUnits()));
            }
            if (this.getMinCapacityUnits() != null) {
                data.set("minCapacityUnits", om.valueToTree(this.getMinCapacityUnits()));
            }
            if (this.getMultiAz() != null) {
                data.set("multiAz", om.valueToTree(this.getMultiAz()));
            }
            if (this.getPreferredMaintenanceWindow() != null) {
                data.set("preferredMaintenanceWindow", om.valueToTree(this.getPreferredMaintenanceWindow()));
            }
            if (this.getVpcSecurityGroupIds() != null) {
                data.set("vpcSecurityGroupIds", om.valueToTree(this.getVpcSecurityGroupIds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dmsReplicationConfig.DmsReplicationConfigComputeConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DmsReplicationConfigComputeConfig.Jsii$Proxy that = (DmsReplicationConfigComputeConfig.Jsii$Proxy) o;

            if (!replicationSubnetGroupId.equals(that.replicationSubnetGroupId)) return false;
            if (this.availabilityZone != null ? !this.availabilityZone.equals(that.availabilityZone) : that.availabilityZone != null) return false;
            if (this.dnsNameServers != null ? !this.dnsNameServers.equals(that.dnsNameServers) : that.dnsNameServers != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.maxCapacityUnits != null ? !this.maxCapacityUnits.equals(that.maxCapacityUnits) : that.maxCapacityUnits != null) return false;
            if (this.minCapacityUnits != null ? !this.minCapacityUnits.equals(that.minCapacityUnits) : that.minCapacityUnits != null) return false;
            if (this.multiAz != null ? !this.multiAz.equals(that.multiAz) : that.multiAz != null) return false;
            if (this.preferredMaintenanceWindow != null ? !this.preferredMaintenanceWindow.equals(that.preferredMaintenanceWindow) : that.preferredMaintenanceWindow != null) return false;
            return this.vpcSecurityGroupIds != null ? this.vpcSecurityGroupIds.equals(that.vpcSecurityGroupIds) : that.vpcSecurityGroupIds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.replicationSubnetGroupId.hashCode();
            result = 31 * result + (this.availabilityZone != null ? this.availabilityZone.hashCode() : 0);
            result = 31 * result + (this.dnsNameServers != null ? this.dnsNameServers.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.maxCapacityUnits != null ? this.maxCapacityUnits.hashCode() : 0);
            result = 31 * result + (this.minCapacityUnits != null ? this.minCapacityUnits.hashCode() : 0);
            result = 31 * result + (this.multiAz != null ? this.multiAz.hashCode() : 0);
            result = 31 * result + (this.preferredMaintenanceWindow != null ? this.preferredMaintenanceWindow.hashCode() : 0);
            result = 31 * result + (this.vpcSecurityGroupIds != null ? this.vpcSecurityGroupIds.hashCode() : 0);
            return result;
        }
    }
}
