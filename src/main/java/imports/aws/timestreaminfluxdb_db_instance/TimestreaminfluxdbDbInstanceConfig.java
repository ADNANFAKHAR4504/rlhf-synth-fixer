package imports.aws.timestreaminfluxdb_db_instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.544Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreaminfluxdbDbInstance.TimestreaminfluxdbDbInstanceConfig")
@software.amazon.jsii.Jsii.Proxy(TimestreaminfluxdbDbInstanceConfig.Jsii$Proxy.class)
public interface TimestreaminfluxdbDbInstanceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * The amount of storage to allocate for your DB storage type in GiB (gibibytes).
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#allocated_storage TimestreaminfluxdbDbInstance#allocated_storage}
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getAllocatedStorage();

    /**
     * The name of the initial InfluxDB bucket.
     * <p>
     * All InfluxDB data is stored in a bucket.
     * A bucket combines the concept of a database and a retention period (the duration of time
     * that each data point persists). A bucket belongs to an organization.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#bucket TimestreaminfluxdbDbInstance#bucket}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucket();

    /**
     * The Timestream for InfluxDB DB instance type to run InfluxDB on.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#db_instance_type TimestreaminfluxdbDbInstance#db_instance_type}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDbInstanceType();

    /**
     * The name that uniquely identifies the DB instance when interacting with the  					Amazon Timestream for InfluxDB API and CLI commands.
     * <p>
     * This name will also be a
     * prefix included in the endpoint. DB instance names must be unique per customer
     * and per region.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#name TimestreaminfluxdbDbInstance#name}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * The name of the initial organization for the initial admin user in InfluxDB.
     * <p>
     * An
     * InfluxDB organization is a workspace for a group of users.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#organization TimestreaminfluxdbDbInstance#organization}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOrganization();

    /**
     * The password of the initial admin user created in InfluxDB.
     * <p>
     * This password will
     * allow you to access the InfluxDB UI to perform various administrative tasks and
     * also use the InfluxDB CLI to create an operator token. These attributes will be
     * stored in a Secret created in AWS SecretManager in your account.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#password TimestreaminfluxdbDbInstance#password}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPassword();

    /**
     * The username of the initial admin user created in InfluxDB.
     * <p>
     * Must start with a letter and can't end with a hyphen or contain two
     * consecutive hyphens. For example, my-user1. This username will allow
     * you to access the InfluxDB UI to perform various administrative tasks
     * and also use the InfluxDB CLI to create an operator token. These
     * attributes will be stored in a Secret created in Amazon Secrets
     * Manager in your account
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#username TimestreaminfluxdbDbInstance#username}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUsername();

    /**
     * A list of VPC security group IDs to associate with the DB instance.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#vpc_security_group_ids TimestreaminfluxdbDbInstance#vpc_security_group_ids}
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getVpcSecurityGroupIds();

    /**
     * A list of VPC subnet IDs to associate with the DB instance.
     * <p>
     * Provide at least
     * two VPC subnet IDs in different availability zones when deploying with a Multi-AZ standby.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#vpc_subnet_ids TimestreaminfluxdbDbInstance#vpc_subnet_ids}
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getVpcSubnetIds();

    /**
     * The id of the DB parameter group assigned to your DB instance.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#db_parameter_group_identifier TimestreaminfluxdbDbInstance#db_parameter_group_identifier}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDbParameterGroupIdentifier() {
        return null;
    }

    /**
     * The Timestream for InfluxDB DB storage type to read and write InfluxDB data.
     * <p>
     * You can choose between 3 different types of provisioned Influx IOPS included storage according
     * to your workloads requirements: Influx IO Included 3000 IOPS, Influx IO Included 12000 IOPS,
     * Influx IO Included 16000 IOPS.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#db_storage_type TimestreaminfluxdbDbInstance#db_storage_type}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDbStorageType() {
        return null;
    }

    /**
     * Specifies whether the DB instance will be deployed as a standalone instance or  					with a Multi-AZ standby for high availability.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#deployment_type TimestreaminfluxdbDbInstance#deployment_type}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeploymentType() {
        return null;
    }

    /**
     * log_delivery_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#log_delivery_configuration TimestreaminfluxdbDbInstance#log_delivery_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLogDeliveryConfiguration() {
        return null;
    }

    /**
     * Specifies whether the networkType of the Timestream for InfluxDB instance is  					IPV4, which can communicate over IPv4 protocol only, or DUAL, which can communicate  					over both IPv4 and IPv6 protocols.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#network_type TimestreaminfluxdbDbInstance#network_type}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNetworkType() {
        return null;
    }

    /**
     * The port number on which InfluxDB accepts connections.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#port TimestreaminfluxdbDbInstance#port}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * Configures the DB instance with a public IP to facilitate access.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#publicly_accessible TimestreaminfluxdbDbInstance#publicly_accessible}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPubliclyAccessible() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#tags TimestreaminfluxdbDbInstance#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#timeouts TimestreaminfluxdbDbInstance#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TimestreaminfluxdbDbInstanceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TimestreaminfluxdbDbInstanceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TimestreaminfluxdbDbInstanceConfig> {
        java.lang.Number allocatedStorage;
        java.lang.String bucket;
        java.lang.String dbInstanceType;
        java.lang.String name;
        java.lang.String organization;
        java.lang.String password;
        java.lang.String username;
        java.util.List<java.lang.String> vpcSecurityGroupIds;
        java.util.List<java.lang.String> vpcSubnetIds;
        java.lang.String dbParameterGroupIdentifier;
        java.lang.String dbStorageType;
        java.lang.String deploymentType;
        java.lang.Object logDeliveryConfiguration;
        java.lang.String networkType;
        java.lang.Number port;
        java.lang.Object publiclyAccessible;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getAllocatedStorage}
         * @param allocatedStorage The amount of storage to allocate for your DB storage type in GiB (gibibytes). This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#allocated_storage TimestreaminfluxdbDbInstance#allocated_storage}
         * @return {@code this}
         */
        public Builder allocatedStorage(java.lang.Number allocatedStorage) {
            this.allocatedStorage = allocatedStorage;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getBucket}
         * @param bucket The name of the initial InfluxDB bucket. This parameter is required.
         *               All InfluxDB data is stored in a bucket.
         *               A bucket combines the concept of a database and a retention period (the duration of time
         *               that each data point persists). A bucket belongs to an organization.
         *               
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#bucket TimestreaminfluxdbDbInstance#bucket}
         * @return {@code this}
         */
        public Builder bucket(java.lang.String bucket) {
            this.bucket = bucket;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getDbInstanceType}
         * @param dbInstanceType The Timestream for InfluxDB DB instance type to run InfluxDB on. This parameter is required.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#db_instance_type TimestreaminfluxdbDbInstance#db_instance_type}
         * @return {@code this}
         */
        public Builder dbInstanceType(java.lang.String dbInstanceType) {
            this.dbInstanceType = dbInstanceType;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getName}
         * @param name The name that uniquely identifies the DB instance when interacting with the  					Amazon Timestream for InfluxDB API and CLI commands. This parameter is required.
         *             This name will also be a
         *             prefix included in the endpoint. DB instance names must be unique per customer
         *             and per region.
         *             
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#name TimestreaminfluxdbDbInstance#name}
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getOrganization}
         * @param organization The name of the initial organization for the initial admin user in InfluxDB. This parameter is required.
         *                     An
         *                     InfluxDB organization is a workspace for a group of users.
         *                     
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#organization TimestreaminfluxdbDbInstance#organization}
         * @return {@code this}
         */
        public Builder organization(java.lang.String organization) {
            this.organization = organization;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getPassword}
         * @param password The password of the initial admin user created in InfluxDB. This parameter is required.
         *                 This password will
         *                 allow you to access the InfluxDB UI to perform various administrative tasks and
         *                 also use the InfluxDB CLI to create an operator token. These attributes will be
         *                 stored in a Secret created in AWS SecretManager in your account.
         *                 
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#password TimestreaminfluxdbDbInstance#password}
         * @return {@code this}
         */
        public Builder password(java.lang.String password) {
            this.password = password;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getUsername}
         * @param username The username of the initial admin user created in InfluxDB. This parameter is required.
         *                 Must start with a letter and can't end with a hyphen or contain two
         *                 consecutive hyphens. For example, my-user1. This username will allow
         *                 you to access the InfluxDB UI to perform various administrative tasks
         *                 and also use the InfluxDB CLI to create an operator token. These
         *                 attributes will be stored in a Secret created in Amazon Secrets
         *                 Manager in your account
         *                 
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#username TimestreaminfluxdbDbInstance#username}
         * @return {@code this}
         */
        public Builder username(java.lang.String username) {
            this.username = username;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getVpcSecurityGroupIds}
         * @param vpcSecurityGroupIds A list of VPC security group IDs to associate with the DB instance. This parameter is required.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#vpc_security_group_ids TimestreaminfluxdbDbInstance#vpc_security_group_ids}
         * @return {@code this}
         */
        public Builder vpcSecurityGroupIds(java.util.List<java.lang.String> vpcSecurityGroupIds) {
            this.vpcSecurityGroupIds = vpcSecurityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getVpcSubnetIds}
         * @param vpcSubnetIds A list of VPC subnet IDs to associate with the DB instance. This parameter is required.
         *                     Provide at least
         *                     two VPC subnet IDs in different availability zones when deploying with a Multi-AZ standby.
         *                     
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#vpc_subnet_ids TimestreaminfluxdbDbInstance#vpc_subnet_ids}
         * @return {@code this}
         */
        public Builder vpcSubnetIds(java.util.List<java.lang.String> vpcSubnetIds) {
            this.vpcSubnetIds = vpcSubnetIds;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getDbParameterGroupIdentifier}
         * @param dbParameterGroupIdentifier The id of the DB parameter group assigned to your DB instance.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#db_parameter_group_identifier TimestreaminfluxdbDbInstance#db_parameter_group_identifier}
         * @return {@code this}
         */
        public Builder dbParameterGroupIdentifier(java.lang.String dbParameterGroupIdentifier) {
            this.dbParameterGroupIdentifier = dbParameterGroupIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getDbStorageType}
         * @param dbStorageType The Timestream for InfluxDB DB storage type to read and write InfluxDB data.
         *                      You can choose between 3 different types of provisioned Influx IOPS included storage according
         *                      to your workloads requirements: Influx IO Included 3000 IOPS, Influx IO Included 12000 IOPS,
         *                      Influx IO Included 16000 IOPS.
         *                      
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#db_storage_type TimestreaminfluxdbDbInstance#db_storage_type}
         * @return {@code this}
         */
        public Builder dbStorageType(java.lang.String dbStorageType) {
            this.dbStorageType = dbStorageType;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getDeploymentType}
         * @param deploymentType Specifies whether the DB instance will be deployed as a standalone instance or  					with a Multi-AZ standby for high availability.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#deployment_type TimestreaminfluxdbDbInstance#deployment_type}
         * @return {@code this}
         */
        public Builder deploymentType(java.lang.String deploymentType) {
            this.deploymentType = deploymentType;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getLogDeliveryConfiguration}
         * @param logDeliveryConfiguration log_delivery_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#log_delivery_configuration TimestreaminfluxdbDbInstance#log_delivery_configuration}
         * @return {@code this}
         */
        public Builder logDeliveryConfiguration(com.hashicorp.cdktf.IResolvable logDeliveryConfiguration) {
            this.logDeliveryConfiguration = logDeliveryConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getLogDeliveryConfiguration}
         * @param logDeliveryConfiguration log_delivery_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#log_delivery_configuration TimestreaminfluxdbDbInstance#log_delivery_configuration}
         * @return {@code this}
         */
        public Builder logDeliveryConfiguration(java.util.List<? extends imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceLogDeliveryConfiguration> logDeliveryConfiguration) {
            this.logDeliveryConfiguration = logDeliveryConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getNetworkType}
         * @param networkType Specifies whether the networkType of the Timestream for InfluxDB instance is  					IPV4, which can communicate over IPv4 protocol only, or DUAL, which can communicate  					over both IPv4 and IPv6 protocols.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#network_type TimestreaminfluxdbDbInstance#network_type}
         * @return {@code this}
         */
        public Builder networkType(java.lang.String networkType) {
            this.networkType = networkType;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getPort}
         * @param port The port number on which InfluxDB accepts connections.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#port TimestreaminfluxdbDbInstance#port}
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getPubliclyAccessible}
         * @param publiclyAccessible Configures the DB instance with a public IP to facilitate access.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#publicly_accessible TimestreaminfluxdbDbInstance#publicly_accessible}
         * @return {@code this}
         */
        public Builder publiclyAccessible(java.lang.Boolean publiclyAccessible) {
            this.publiclyAccessible = publiclyAccessible;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getPubliclyAccessible}
         * @param publiclyAccessible Configures the DB instance with a public IP to facilitate access.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#publicly_accessible TimestreaminfluxdbDbInstance#publicly_accessible}
         * @return {@code this}
         */
        public Builder publiclyAccessible(com.hashicorp.cdktf.IResolvable publiclyAccessible) {
            this.publiclyAccessible = publiclyAccessible;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#tags TimestreaminfluxdbDbInstance#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreaminfluxdb_db_instance#timeouts TimestreaminfluxdbDbInstance#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link TimestreaminfluxdbDbInstanceConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TimestreaminfluxdbDbInstanceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TimestreaminfluxdbDbInstanceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TimestreaminfluxdbDbInstanceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TimestreaminfluxdbDbInstanceConfig {
        private final java.lang.Number allocatedStorage;
        private final java.lang.String bucket;
        private final java.lang.String dbInstanceType;
        private final java.lang.String name;
        private final java.lang.String organization;
        private final java.lang.String password;
        private final java.lang.String username;
        private final java.util.List<java.lang.String> vpcSecurityGroupIds;
        private final java.util.List<java.lang.String> vpcSubnetIds;
        private final java.lang.String dbParameterGroupIdentifier;
        private final java.lang.String dbStorageType;
        private final java.lang.String deploymentType;
        private final java.lang.Object logDeliveryConfiguration;
        private final java.lang.String networkType;
        private final java.lang.Number port;
        private final java.lang.Object publiclyAccessible;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceTimeouts timeouts;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allocatedStorage = software.amazon.jsii.Kernel.get(this, "allocatedStorage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.bucket = software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dbInstanceType = software.amazon.jsii.Kernel.get(this, "dbInstanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.organization = software.amazon.jsii.Kernel.get(this, "organization", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.password = software.amazon.jsii.Kernel.get(this, "password", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.username = software.amazon.jsii.Kernel.get(this, "username", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcSecurityGroupIds = software.amazon.jsii.Kernel.get(this, "vpcSecurityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpcSubnetIds = software.amazon.jsii.Kernel.get(this, "vpcSubnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.dbParameterGroupIdentifier = software.amazon.jsii.Kernel.get(this, "dbParameterGroupIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dbStorageType = software.amazon.jsii.Kernel.get(this, "dbStorageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deploymentType = software.amazon.jsii.Kernel.get(this, "deploymentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logDeliveryConfiguration = software.amazon.jsii.Kernel.get(this, "logDeliveryConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.networkType = software.amazon.jsii.Kernel.get(this, "networkType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.publiclyAccessible = software.amazon.jsii.Kernel.get(this, "publiclyAccessible", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceTimeouts.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allocatedStorage = java.util.Objects.requireNonNull(builder.allocatedStorage, "allocatedStorage is required");
            this.bucket = java.util.Objects.requireNonNull(builder.bucket, "bucket is required");
            this.dbInstanceType = java.util.Objects.requireNonNull(builder.dbInstanceType, "dbInstanceType is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.organization = java.util.Objects.requireNonNull(builder.organization, "organization is required");
            this.password = java.util.Objects.requireNonNull(builder.password, "password is required");
            this.username = java.util.Objects.requireNonNull(builder.username, "username is required");
            this.vpcSecurityGroupIds = java.util.Objects.requireNonNull(builder.vpcSecurityGroupIds, "vpcSecurityGroupIds is required");
            this.vpcSubnetIds = java.util.Objects.requireNonNull(builder.vpcSubnetIds, "vpcSubnetIds is required");
            this.dbParameterGroupIdentifier = builder.dbParameterGroupIdentifier;
            this.dbStorageType = builder.dbStorageType;
            this.deploymentType = builder.deploymentType;
            this.logDeliveryConfiguration = builder.logDeliveryConfiguration;
            this.networkType = builder.networkType;
            this.port = builder.port;
            this.publiclyAccessible = builder.publiclyAccessible;
            this.tags = builder.tags;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Number getAllocatedStorage() {
            return this.allocatedStorage;
        }

        @Override
        public final java.lang.String getBucket() {
            return this.bucket;
        }

        @Override
        public final java.lang.String getDbInstanceType() {
            return this.dbInstanceType;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getOrganization() {
            return this.organization;
        }

        @Override
        public final java.lang.String getPassword() {
            return this.password;
        }

        @Override
        public final java.lang.String getUsername() {
            return this.username;
        }

        @Override
        public final java.util.List<java.lang.String> getVpcSecurityGroupIds() {
            return this.vpcSecurityGroupIds;
        }

        @Override
        public final java.util.List<java.lang.String> getVpcSubnetIds() {
            return this.vpcSubnetIds;
        }

        @Override
        public final java.lang.String getDbParameterGroupIdentifier() {
            return this.dbParameterGroupIdentifier;
        }

        @Override
        public final java.lang.String getDbStorageType() {
            return this.dbStorageType;
        }

        @Override
        public final java.lang.String getDeploymentType() {
            return this.deploymentType;
        }

        @Override
        public final java.lang.Object getLogDeliveryConfiguration() {
            return this.logDeliveryConfiguration;
        }

        @Override
        public final java.lang.String getNetworkType() {
            return this.networkType;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        public final java.lang.Object getPubliclyAccessible() {
            return this.publiclyAccessible;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.timestreaminfluxdb_db_instance.TimestreaminfluxdbDbInstanceTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("allocatedStorage", om.valueToTree(this.getAllocatedStorage()));
            data.set("bucket", om.valueToTree(this.getBucket()));
            data.set("dbInstanceType", om.valueToTree(this.getDbInstanceType()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("organization", om.valueToTree(this.getOrganization()));
            data.set("password", om.valueToTree(this.getPassword()));
            data.set("username", om.valueToTree(this.getUsername()));
            data.set("vpcSecurityGroupIds", om.valueToTree(this.getVpcSecurityGroupIds()));
            data.set("vpcSubnetIds", om.valueToTree(this.getVpcSubnetIds()));
            if (this.getDbParameterGroupIdentifier() != null) {
                data.set("dbParameterGroupIdentifier", om.valueToTree(this.getDbParameterGroupIdentifier()));
            }
            if (this.getDbStorageType() != null) {
                data.set("dbStorageType", om.valueToTree(this.getDbStorageType()));
            }
            if (this.getDeploymentType() != null) {
                data.set("deploymentType", om.valueToTree(this.getDeploymentType()));
            }
            if (this.getLogDeliveryConfiguration() != null) {
                data.set("logDeliveryConfiguration", om.valueToTree(this.getLogDeliveryConfiguration()));
            }
            if (this.getNetworkType() != null) {
                data.set("networkType", om.valueToTree(this.getNetworkType()));
            }
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getPubliclyAccessible() != null) {
                data.set("publiclyAccessible", om.valueToTree(this.getPubliclyAccessible()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.timestreaminfluxdbDbInstance.TimestreaminfluxdbDbInstanceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TimestreaminfluxdbDbInstanceConfig.Jsii$Proxy that = (TimestreaminfluxdbDbInstanceConfig.Jsii$Proxy) o;

            if (!allocatedStorage.equals(that.allocatedStorage)) return false;
            if (!bucket.equals(that.bucket)) return false;
            if (!dbInstanceType.equals(that.dbInstanceType)) return false;
            if (!name.equals(that.name)) return false;
            if (!organization.equals(that.organization)) return false;
            if (!password.equals(that.password)) return false;
            if (!username.equals(that.username)) return false;
            if (!vpcSecurityGroupIds.equals(that.vpcSecurityGroupIds)) return false;
            if (!vpcSubnetIds.equals(that.vpcSubnetIds)) return false;
            if (this.dbParameterGroupIdentifier != null ? !this.dbParameterGroupIdentifier.equals(that.dbParameterGroupIdentifier) : that.dbParameterGroupIdentifier != null) return false;
            if (this.dbStorageType != null ? !this.dbStorageType.equals(that.dbStorageType) : that.dbStorageType != null) return false;
            if (this.deploymentType != null ? !this.deploymentType.equals(that.deploymentType) : that.deploymentType != null) return false;
            if (this.logDeliveryConfiguration != null ? !this.logDeliveryConfiguration.equals(that.logDeliveryConfiguration) : that.logDeliveryConfiguration != null) return false;
            if (this.networkType != null ? !this.networkType.equals(that.networkType) : that.networkType != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.publiclyAccessible != null ? !this.publiclyAccessible.equals(that.publiclyAccessible) : that.publiclyAccessible != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allocatedStorage.hashCode();
            result = 31 * result + (this.bucket.hashCode());
            result = 31 * result + (this.dbInstanceType.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.organization.hashCode());
            result = 31 * result + (this.password.hashCode());
            result = 31 * result + (this.username.hashCode());
            result = 31 * result + (this.vpcSecurityGroupIds.hashCode());
            result = 31 * result + (this.vpcSubnetIds.hashCode());
            result = 31 * result + (this.dbParameterGroupIdentifier != null ? this.dbParameterGroupIdentifier.hashCode() : 0);
            result = 31 * result + (this.dbStorageType != null ? this.dbStorageType.hashCode() : 0);
            result = 31 * result + (this.deploymentType != null ? this.deploymentType.hashCode() : 0);
            result = 31 * result + (this.logDeliveryConfiguration != null ? this.logDeliveryConfiguration.hashCode() : 0);
            result = 31 * result + (this.networkType != null ? this.networkType.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.publiclyAccessible != null ? this.publiclyAccessible.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
