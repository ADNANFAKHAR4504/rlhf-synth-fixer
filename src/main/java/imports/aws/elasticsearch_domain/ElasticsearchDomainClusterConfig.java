package imports.aws.elasticsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.179Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticsearchDomain.ElasticsearchDomainClusterConfig")
@software.amazon.jsii.Jsii.Proxy(ElasticsearchDomainClusterConfig.Jsii$Proxy.class)
public interface ElasticsearchDomainClusterConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * cold_storage_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#cold_storage_options ElasticsearchDomain#cold_storage_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigColdStorageOptions getColdStorageOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#dedicated_master_count ElasticsearchDomain#dedicated_master_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDedicatedMasterCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#dedicated_master_enabled ElasticsearchDomain#dedicated_master_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDedicatedMasterEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#dedicated_master_type ElasticsearchDomain#dedicated_master_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDedicatedMasterType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#instance_count ElasticsearchDomain#instance_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getInstanceCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#instance_type ElasticsearchDomain#instance_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#warm_count ElasticsearchDomain#warm_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getWarmCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#warm_enabled ElasticsearchDomain#warm_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWarmEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#warm_type ElasticsearchDomain#warm_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWarmType() {
        return null;
    }

    /**
     * zone_awareness_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#zone_awareness_config ElasticsearchDomain#zone_awareness_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigZoneAwarenessConfig getZoneAwarenessConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#zone_awareness_enabled ElasticsearchDomain#zone_awareness_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getZoneAwarenessEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElasticsearchDomainClusterConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticsearchDomainClusterConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticsearchDomainClusterConfig> {
        imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigColdStorageOptions coldStorageOptions;
        java.lang.Number dedicatedMasterCount;
        java.lang.Object dedicatedMasterEnabled;
        java.lang.String dedicatedMasterType;
        java.lang.Number instanceCount;
        java.lang.String instanceType;
        java.lang.Number warmCount;
        java.lang.Object warmEnabled;
        java.lang.String warmType;
        imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigZoneAwarenessConfig zoneAwarenessConfig;
        java.lang.Object zoneAwarenessEnabled;

        /**
         * Sets the value of {@link ElasticsearchDomainClusterConfig#getColdStorageOptions}
         * @param coldStorageOptions cold_storage_options block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#cold_storage_options ElasticsearchDomain#cold_storage_options}
         * @return {@code this}
         */
        public Builder coldStorageOptions(imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigColdStorageOptions coldStorageOptions) {
            this.coldStorageOptions = coldStorageOptions;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainClusterConfig#getDedicatedMasterCount}
         * @param dedicatedMasterCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#dedicated_master_count ElasticsearchDomain#dedicated_master_count}.
         * @return {@code this}
         */
        public Builder dedicatedMasterCount(java.lang.Number dedicatedMasterCount) {
            this.dedicatedMasterCount = dedicatedMasterCount;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainClusterConfig#getDedicatedMasterEnabled}
         * @param dedicatedMasterEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#dedicated_master_enabled ElasticsearchDomain#dedicated_master_enabled}.
         * @return {@code this}
         */
        public Builder dedicatedMasterEnabled(java.lang.Boolean dedicatedMasterEnabled) {
            this.dedicatedMasterEnabled = dedicatedMasterEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainClusterConfig#getDedicatedMasterEnabled}
         * @param dedicatedMasterEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#dedicated_master_enabled ElasticsearchDomain#dedicated_master_enabled}.
         * @return {@code this}
         */
        public Builder dedicatedMasterEnabled(com.hashicorp.cdktf.IResolvable dedicatedMasterEnabled) {
            this.dedicatedMasterEnabled = dedicatedMasterEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainClusterConfig#getDedicatedMasterType}
         * @param dedicatedMasterType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#dedicated_master_type ElasticsearchDomain#dedicated_master_type}.
         * @return {@code this}
         */
        public Builder dedicatedMasterType(java.lang.String dedicatedMasterType) {
            this.dedicatedMasterType = dedicatedMasterType;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainClusterConfig#getInstanceCount}
         * @param instanceCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#instance_count ElasticsearchDomain#instance_count}.
         * @return {@code this}
         */
        public Builder instanceCount(java.lang.Number instanceCount) {
            this.instanceCount = instanceCount;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainClusterConfig#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#instance_type ElasticsearchDomain#instance_type}.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainClusterConfig#getWarmCount}
         * @param warmCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#warm_count ElasticsearchDomain#warm_count}.
         * @return {@code this}
         */
        public Builder warmCount(java.lang.Number warmCount) {
            this.warmCount = warmCount;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainClusterConfig#getWarmEnabled}
         * @param warmEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#warm_enabled ElasticsearchDomain#warm_enabled}.
         * @return {@code this}
         */
        public Builder warmEnabled(java.lang.Boolean warmEnabled) {
            this.warmEnabled = warmEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainClusterConfig#getWarmEnabled}
         * @param warmEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#warm_enabled ElasticsearchDomain#warm_enabled}.
         * @return {@code this}
         */
        public Builder warmEnabled(com.hashicorp.cdktf.IResolvable warmEnabled) {
            this.warmEnabled = warmEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainClusterConfig#getWarmType}
         * @param warmType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#warm_type ElasticsearchDomain#warm_type}.
         * @return {@code this}
         */
        public Builder warmType(java.lang.String warmType) {
            this.warmType = warmType;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainClusterConfig#getZoneAwarenessConfig}
         * @param zoneAwarenessConfig zone_awareness_config block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#zone_awareness_config ElasticsearchDomain#zone_awareness_config}
         * @return {@code this}
         */
        public Builder zoneAwarenessConfig(imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigZoneAwarenessConfig zoneAwarenessConfig) {
            this.zoneAwarenessConfig = zoneAwarenessConfig;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainClusterConfig#getZoneAwarenessEnabled}
         * @param zoneAwarenessEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#zone_awareness_enabled ElasticsearchDomain#zone_awareness_enabled}.
         * @return {@code this}
         */
        public Builder zoneAwarenessEnabled(java.lang.Boolean zoneAwarenessEnabled) {
            this.zoneAwarenessEnabled = zoneAwarenessEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainClusterConfig#getZoneAwarenessEnabled}
         * @param zoneAwarenessEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#zone_awareness_enabled ElasticsearchDomain#zone_awareness_enabled}.
         * @return {@code this}
         */
        public Builder zoneAwarenessEnabled(com.hashicorp.cdktf.IResolvable zoneAwarenessEnabled) {
            this.zoneAwarenessEnabled = zoneAwarenessEnabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ElasticsearchDomainClusterConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticsearchDomainClusterConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticsearchDomainClusterConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticsearchDomainClusterConfig {
        private final imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigColdStorageOptions coldStorageOptions;
        private final java.lang.Number dedicatedMasterCount;
        private final java.lang.Object dedicatedMasterEnabled;
        private final java.lang.String dedicatedMasterType;
        private final java.lang.Number instanceCount;
        private final java.lang.String instanceType;
        private final java.lang.Number warmCount;
        private final java.lang.Object warmEnabled;
        private final java.lang.String warmType;
        private final imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigZoneAwarenessConfig zoneAwarenessConfig;
        private final java.lang.Object zoneAwarenessEnabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.coldStorageOptions = software.amazon.jsii.Kernel.get(this, "coldStorageOptions", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigColdStorageOptions.class));
            this.dedicatedMasterCount = software.amazon.jsii.Kernel.get(this, "dedicatedMasterCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.dedicatedMasterEnabled = software.amazon.jsii.Kernel.get(this, "dedicatedMasterEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dedicatedMasterType = software.amazon.jsii.Kernel.get(this, "dedicatedMasterType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceCount = software.amazon.jsii.Kernel.get(this, "instanceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.warmCount = software.amazon.jsii.Kernel.get(this, "warmCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.warmEnabled = software.amazon.jsii.Kernel.get(this, "warmEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.warmType = software.amazon.jsii.Kernel.get(this, "warmType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.zoneAwarenessConfig = software.amazon.jsii.Kernel.get(this, "zoneAwarenessConfig", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigZoneAwarenessConfig.class));
            this.zoneAwarenessEnabled = software.amazon.jsii.Kernel.get(this, "zoneAwarenessEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.coldStorageOptions = builder.coldStorageOptions;
            this.dedicatedMasterCount = builder.dedicatedMasterCount;
            this.dedicatedMasterEnabled = builder.dedicatedMasterEnabled;
            this.dedicatedMasterType = builder.dedicatedMasterType;
            this.instanceCount = builder.instanceCount;
            this.instanceType = builder.instanceType;
            this.warmCount = builder.warmCount;
            this.warmEnabled = builder.warmEnabled;
            this.warmType = builder.warmType;
            this.zoneAwarenessConfig = builder.zoneAwarenessConfig;
            this.zoneAwarenessEnabled = builder.zoneAwarenessEnabled;
        }

        @Override
        public final imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigColdStorageOptions getColdStorageOptions() {
            return this.coldStorageOptions;
        }

        @Override
        public final java.lang.Number getDedicatedMasterCount() {
            return this.dedicatedMasterCount;
        }

        @Override
        public final java.lang.Object getDedicatedMasterEnabled() {
            return this.dedicatedMasterEnabled;
        }

        @Override
        public final java.lang.String getDedicatedMasterType() {
            return this.dedicatedMasterType;
        }

        @Override
        public final java.lang.Number getInstanceCount() {
            return this.instanceCount;
        }

        @Override
        public final java.lang.String getInstanceType() {
            return this.instanceType;
        }

        @Override
        public final java.lang.Number getWarmCount() {
            return this.warmCount;
        }

        @Override
        public final java.lang.Object getWarmEnabled() {
            return this.warmEnabled;
        }

        @Override
        public final java.lang.String getWarmType() {
            return this.warmType;
        }

        @Override
        public final imports.aws.elasticsearch_domain.ElasticsearchDomainClusterConfigZoneAwarenessConfig getZoneAwarenessConfig() {
            return this.zoneAwarenessConfig;
        }

        @Override
        public final java.lang.Object getZoneAwarenessEnabled() {
            return this.zoneAwarenessEnabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getColdStorageOptions() != null) {
                data.set("coldStorageOptions", om.valueToTree(this.getColdStorageOptions()));
            }
            if (this.getDedicatedMasterCount() != null) {
                data.set("dedicatedMasterCount", om.valueToTree(this.getDedicatedMasterCount()));
            }
            if (this.getDedicatedMasterEnabled() != null) {
                data.set("dedicatedMasterEnabled", om.valueToTree(this.getDedicatedMasterEnabled()));
            }
            if (this.getDedicatedMasterType() != null) {
                data.set("dedicatedMasterType", om.valueToTree(this.getDedicatedMasterType()));
            }
            if (this.getInstanceCount() != null) {
                data.set("instanceCount", om.valueToTree(this.getInstanceCount()));
            }
            if (this.getInstanceType() != null) {
                data.set("instanceType", om.valueToTree(this.getInstanceType()));
            }
            if (this.getWarmCount() != null) {
                data.set("warmCount", om.valueToTree(this.getWarmCount()));
            }
            if (this.getWarmEnabled() != null) {
                data.set("warmEnabled", om.valueToTree(this.getWarmEnabled()));
            }
            if (this.getWarmType() != null) {
                data.set("warmType", om.valueToTree(this.getWarmType()));
            }
            if (this.getZoneAwarenessConfig() != null) {
                data.set("zoneAwarenessConfig", om.valueToTree(this.getZoneAwarenessConfig()));
            }
            if (this.getZoneAwarenessEnabled() != null) {
                data.set("zoneAwarenessEnabled", om.valueToTree(this.getZoneAwarenessEnabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.elasticsearchDomain.ElasticsearchDomainClusterConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticsearchDomainClusterConfig.Jsii$Proxy that = (ElasticsearchDomainClusterConfig.Jsii$Proxy) o;

            if (this.coldStorageOptions != null ? !this.coldStorageOptions.equals(that.coldStorageOptions) : that.coldStorageOptions != null) return false;
            if (this.dedicatedMasterCount != null ? !this.dedicatedMasterCount.equals(that.dedicatedMasterCount) : that.dedicatedMasterCount != null) return false;
            if (this.dedicatedMasterEnabled != null ? !this.dedicatedMasterEnabled.equals(that.dedicatedMasterEnabled) : that.dedicatedMasterEnabled != null) return false;
            if (this.dedicatedMasterType != null ? !this.dedicatedMasterType.equals(that.dedicatedMasterType) : that.dedicatedMasterType != null) return false;
            if (this.instanceCount != null ? !this.instanceCount.equals(that.instanceCount) : that.instanceCount != null) return false;
            if (this.instanceType != null ? !this.instanceType.equals(that.instanceType) : that.instanceType != null) return false;
            if (this.warmCount != null ? !this.warmCount.equals(that.warmCount) : that.warmCount != null) return false;
            if (this.warmEnabled != null ? !this.warmEnabled.equals(that.warmEnabled) : that.warmEnabled != null) return false;
            if (this.warmType != null ? !this.warmType.equals(that.warmType) : that.warmType != null) return false;
            if (this.zoneAwarenessConfig != null ? !this.zoneAwarenessConfig.equals(that.zoneAwarenessConfig) : that.zoneAwarenessConfig != null) return false;
            return this.zoneAwarenessEnabled != null ? this.zoneAwarenessEnabled.equals(that.zoneAwarenessEnabled) : that.zoneAwarenessEnabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.coldStorageOptions != null ? this.coldStorageOptions.hashCode() : 0;
            result = 31 * result + (this.dedicatedMasterCount != null ? this.dedicatedMasterCount.hashCode() : 0);
            result = 31 * result + (this.dedicatedMasterEnabled != null ? this.dedicatedMasterEnabled.hashCode() : 0);
            result = 31 * result + (this.dedicatedMasterType != null ? this.dedicatedMasterType.hashCode() : 0);
            result = 31 * result + (this.instanceCount != null ? this.instanceCount.hashCode() : 0);
            result = 31 * result + (this.instanceType != null ? this.instanceType.hashCode() : 0);
            result = 31 * result + (this.warmCount != null ? this.warmCount.hashCode() : 0);
            result = 31 * result + (this.warmEnabled != null ? this.warmEnabled.hashCode() : 0);
            result = 31 * result + (this.warmType != null ? this.warmType.hashCode() : 0);
            result = 31 * result + (this.zoneAwarenessConfig != null ? this.zoneAwarenessConfig.hashCode() : 0);
            result = 31 * result + (this.zoneAwarenessEnabled != null ? this.zoneAwarenessEnabled.hashCode() : 0);
            return result;
        }
    }
}
