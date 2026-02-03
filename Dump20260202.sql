-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: attendance_db
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attendance_day`
--

DROP TABLE IF EXISTS `attendance_day`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_day` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` int unsigned NOT NULL,
  `site_id` int unsigned DEFAULT NULL,
  `attendance_date` int unsigned NOT NULL,
  `first_in_time` int unsigned DEFAULT NULL,
  `last_out_time` int unsigned DEFAULT NULL,
  `total_work_seconds` int unsigned DEFAULT '0',
  `session_count` int unsigned DEFAULT '0',
  `status` varchar(32) NOT NULL DEFAULT 'present',
  `created_at` int unsigned NOT NULL DEFAULT 0,
  `updated_at` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_att_day` (`employee_id`,`site_id`,`attendance_date`),
  KEY `idx_att_day_date` (`attendance_date`),
  KEY `idx_att_day_site` (`site_id`),
  CONSTRAINT `attendance_day_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attendance_day_ibfk_2` FOREIGN KEY (`site_id`) REFERENCES `site` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_day`
--

LOCK TABLES `attendance_day` WRITE;
/*!40000 ALTER TABLE `attendance_day` DISABLE KEYS */;
INSERT INTO `attendance_day` VALUES (1,1,1,20260129,1769657400,1769689800,32400,1,'present',1769710806,1769710806),(2,2,1,20260129,1769657400,1769689800,32400,1,'present',1769710806,1769710806),(3,3,1,20260129,1769657400,1769689800,32400,1,'present',1769710806,1769710806),(4,1,1,20260130,1769750315,1769754211,3896,1,'present',1769750315,1769750611),(5,4,1,20260130,1769763595,1769769936,6341,1,'present',1769763596,1769769938),(7,5,1,20260130,NULL,1769769988,0,1,'present',1769769989,1769769989),(8,8,1,20260130,1769776707,1769776748,41,1,'present',1769776709,1769776750),(9,4,1,20260131,1769860144,1769864825,4681,1,'present',1769860144,1769864825),(11,16,NULL,20260202,1770009410,1770010029,0,1,'present',1770010030,1770010132),(12,16,NULL,20260130,1769768167,NULL,0,1,'present',1770010132,1770010132),(13,17,NULL,20260202,1770010374,NULL,0,1,'present',1770010375,1770010375),(14,17,1,20260202,NULL,1770010501,0,1,'present',1770010502,1770010502);
/*!40000 ALTER TABLE `attendance_day` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company`
--

DROP TABLE IF EXISTS `company`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` int unsigned NOT NULL,
  `company_code` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `timezone` varchar(64) NOT NULL DEFAULT 'UTC',
  `settings` json DEFAULT NULL,
  `created_at` int unsigned NOT NULL DEFAULT 0,
  `updated_at` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_company` (`tenant_id`,`company_code`),
  CONSTRAINT `company_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenant` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company`
--

LOCK TABLES `company` WRITE;
/*!40000 ALTER TABLE `company` DISABLE KEYS */;
INSERT INTO `company` VALUES (1,1,'C001','Demo Company','active','Asia/Kolkata',NULL,1769710806,1769710806),(2,2,'mivi','MIVI','active','UTC',NULL,1769796996,1769796996),(3,3,'adani-ports','Adani Ports','active','IST',NULL,1769849413,1769854990),(4,3,'adani-total-gas','Adani Total Gas','active','IST',NULL,1769855099,1769855099);
/*!40000 ALTER TABLE `company` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee`
--

DROP TABLE IF EXISTS `employee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `company_id` int unsigned NOT NULL,
  `employee_code` varchar(64) NOT NULL,
  `first_name` varchar(128) NOT NULL,
  `last_name` varchar(128) DEFAULT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(64) DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `created_at` int unsigned NOT NULL DEFAULT 0,
  `updated_at` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employee` (`company_id`,`employee_code`),
  CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `company` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee`
--

LOCK TABLES `employee` WRITE;
/*!40000 ALTER TABLE `employee` DISABLE KEYS */;
INSERT INTO `employee` VALUES (1,1,'EMP001','Admin','User',NULL,'admin@demo.com',NULL,'active',1769710806,1769710806),(2,1,'EMP002','Jane','Doe',NULL,NULL,NULL,'active',1769710806,1769710806),(3,1,'EMP003','John','Smith',NULL,NULL,NULL,'inactive',1769710806,1770008748),(4,1,'EMP004','Ram','Kishan','Ram','hishas2609@gmail.com','8249334535','active',1769758472,1769758472),(5,1,'EMP005','Ravi','Ranjan','Ravi','usenetflix33@gmail.com','7894561237','active',1769761411,1769761411),(7,1,'TEST1234','Test','User','Tester','tisipab522@gamening.com','+1234567890','active',1769776313,1769776451),(8,1,'EMP006','Aman','Rajak','Aman','amanra382@em.zenuino.in','9110152652','active',1769776586,1769776604),(9,1,'TEST002','Test','User2','Tester1','testuser2@gmail.com','+1472583690','active',1769776993,1769777037),(10,2,'EMP001','Mukesh','Ambani','Mukesh','tisipab522@gamening.com','7894561237','active',1769845292,1769845292),(11,2,'EMP002','Akash','Ambani','Akash','nihar08ranjansamal@gmail.com','7894585221','active',1769847477,1769847477),(12,2,'EMP003','Anil','Ambani','Anil','niharranjansamal.19180@gmail.com','7898524561','active',1769848653,1769848653),(13,3,'EMP001','Gautam','Adani','Gautam','cg89l@virgilian.com','7419645525','active',1769849642,1769849642),(14,3,'EMP002','Karan','Adani','Karan','riv4e@virgilian.com','7418527893','active',1769855270,1769855270),(16,1,'EMP0087','Nitin','Kumar','Nitin','csecnw@gmail.com','1472584563','active',1770009197,1770009255),(17,1,'EMP0088','Nitikesh','Samal','Nitikesh','samalniharranjan08@gmail.com','8249334552','active',1770010266,1770010282);
/*!40000 ALTER TABLE `employee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_user_map`
--

DROP TABLE IF EXISTS `employee_user_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_user_map` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `is_primary` tinyint unsigned NOT NULL DEFAULT '1',
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `created_at` int unsigned NOT NULL DEFAULT 0,
  `updated_at` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_emp_user` (`employee_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `employee_user_map_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_user_map_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user_account` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_user_map`
--

LOCK TABLES `employee_user_map` WRITE;
/*!40000 ALTER TABLE `employee_user_map` DISABLE KEYS */;
INSERT INTO `employee_user_map` VALUES (1,1,1,1,'active',1769710806,1769710806),(2,4,2,1,'active',1769758708,1769758708),(3,5,3,1,'active',1769761438,1769761438),(5,7,5,1,'active',1769776313,1769776313),(6,8,6,1,'active',1769776586,1769776586),(7,9,7,1,'active',1769776993,1769776993),(8,10,9,1,'active',1769845439,1769845439),(9,11,10,1,'active',1769847517,1769847517),(10,12,11,1,'active',1769848679,1769848679),(11,13,13,1,'active',1769849689,1769849689),(12,14,14,1,'active',1769855312,1769855312),(14,16,16,1,'active',1770009197,1770009197),(15,17,17,1,'active',1770010266,1770010266);
/*!40000 ALTER TABLE `employee_user_map` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_zone_assignment`
--

DROP TABLE IF EXISTS `employee_zone_assignment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_zone_assignment` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` int unsigned NOT NULL,
  `zone_id` int unsigned DEFAULT NULL COMMENT 'NULL when no_location = 1',
  `no_location` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '1 = no location required for attendance',
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `created_at` int unsigned NOT NULL DEFAULT 0,
  `updated_at` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_emp_zone_emp` (`employee_id`),
  KEY `idx_emp_zone_zone` (`zone_id`),
  CONSTRAINT `employee_zone_assignment_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_zone_assignment_ibfk_2` FOREIGN KEY (`zone_id`) REFERENCES `site_zone` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_zone_assignment`
--

LOCK TABLES `employee_zone_assignment` WRITE;
/*!40000 ALTER TABLE `employee_zone_assignment` DISABLE KEYS */;
INSERT INTO `employee_zone_assignment` VALUES (1,4,2,0,'inactive',1769759479,1769761783),(2,4,2,0,'inactive',1769759490,1769761783),(3,4,2,0,'inactive',1769760669,1769761783),(4,4,1,0,'inactive',1769760669,1769761783),(5,4,2,0,'inactive',1769760686,1769761783),(6,4,1,0,'inactive',1769760686,1769761783),(7,4,2,0,'inactive',1769760832,1769761783),(8,4,2,0,'inactive',1769760872,1769761783),(9,4,1,0,'inactive',1769760872,1769761783),(10,5,NULL,1,'active',1769761442,1769761442),(11,4,2,0,'active',1769761783,1769761783),(12,4,1,0,'active',1769761783,1769761783),(13,8,1,0,'active',1769776638,1769776638),(14,10,NULL,1,'active',1769845572,1769845572),(15,12,NULL,1,'active',1769848695,1769848695),(16,14,NULL,1,'active',1769855317,1769855317),(17,16,1,0,'inactive',1770009346,1770009364),(18,16,NULL,1,'active',1770009364,1770009364),(19,17,NULL,1,'inactive',1770010334,1770010558),(20,17,NULL,1,'inactive',1770010453,1770010558),(21,17,1,0,'inactive',1770010481,1770010558),(22,17,NULL,1,'active',1770010558,1770010558);
/*!40000 ALTER TABLE `employee_zone_assignment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site`
--

DROP TABLE IF EXISTS `site`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `company_id` int unsigned NOT NULL,
  `site_code` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(512) DEFAULT NULL,
  `timezone` varchar(64) DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `created_at` int unsigned NOT NULL DEFAULT 0,
  `updated_at` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_site` (`company_id`,`site_code`),
  CONSTRAINT `site_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `company` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site`
--

LOCK TABLES `site` WRITE;
/*!40000 ALTER TABLE `site` DISABLE KEYS */;
INSERT INTO `site` VALUES (1,1,'S001','Main Office',NULL,NULL,'active',1769710806,1769710806),(2,1,'S002','Elina','wook floor','IST','active',1769759628,1769759628);
/*!40000 ALTER TABLE `site` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_zone`
--

DROP TABLE IF EXISTS `site_zone`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_zone` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `site_id` int unsigned NOT NULL,
  `zone_code` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(512) DEFAULT NULL,
  `zone_type` varchar(32) NOT NULL DEFAULT 'circle' COMMENT 'circle, polygon, digipin',
  `center_latitude` double DEFAULT NULL,
  `center_longitude` double DEFAULT NULL,
  `radius_meters` int unsigned DEFAULT NULL,
  `polygon_boundary` json DEFAULT NULL COMMENT 'Array of {latitude, longitude}',
  `digipin_code` varchar(64) DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `created_at` int unsigned NOT NULL DEFAULT 0,
  `updated_at` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_site_zone` (`site_id`,`zone_code`),
  CONSTRAINT `site_zone_ibfk_1` FOREIGN KEY (`site_id`) REFERENCES `site` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_zone`
--

LOCK TABLES `site_zone` WRITE;
/*!40000 ALTER TABLE `site_zone` DISABLE KEYS */;
INSERT INTO `site_zone` VALUES (1,1,'Zone001','CH_Office','Circuit House office','circle',22.809231,86.18767,100,NULL,NULL,'active',1769759113,1769763229),(2,1,'Zone002','CH_Canteen','Ravi canteen','circle',22.81094,86.186719,20,NULL,NULL,'active',1769759451,1769759451);
/*!40000 ALTER TABLE `site_zone` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant`
--

DROP TABLE IF EXISTS `tenant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenant` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `tenant_code` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `subscription_tier` varchar(32) NOT NULL DEFAULT 'basic',
  `max_companies` int unsigned DEFAULT NULL,
  `settings` json DEFAULT NULL,
  `created_at` int unsigned NOT NULL DEFAULT 0,
  `updated_at` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_code` (`tenant_code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant`
--

LOCK TABLES `tenant` WRITE;
/*!40000 ALTER TABLE `tenant` DISABLE KEYS */;
INSERT INTO `tenant` VALUES (1,'T001','Demo Tenant','active','standard',NULL,NULL,1769710806,1769710806),(2,'spk','Speaker','active','basic',NULL,NULL,1769796996,1769796996),(3,'adani-ent','Adani Enterprises','active','basic',2,NULL,1769849413,1769855717);
/*!40000 ALTER TABLE `tenant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_account`
--

DROP TABLE IF EXISTS `user_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_account` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` int unsigned NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email_verified` tinyint unsigned NOT NULL DEFAULT '0',
  `email_verification_token` varchar(255) DEFAULT NULL,
  `email_verification_expires_at` int unsigned DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `role` varchar(32) NOT NULL DEFAULT 'employee',
  `role_mobile` varchar(32) DEFAULT NULL,
  `company_id` int unsigned DEFAULT NULL,
  `site_id` int unsigned DEFAULT NULL,
  `created_at` int unsigned NOT NULL DEFAULT 0,
  `updated_at` int unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_email` (`tenant_id`,`email`),
  KEY `company_id` (`company_id`),
  KEY `site_id` (`site_id`),
  KEY `idx_verification_token` (`email_verification_token`),
  CONSTRAINT `user_account_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenant` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_account_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `company` (`id`) ON DELETE SET NULL,
  CONSTRAINT `user_account_ibfk_3` FOREIGN KEY (`site_id`) REFERENCES `site` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_account`
--

LOCK TABLES `user_account` WRITE;
/*!40000 ALTER TABLE `user_account` DISABLE KEYS */;
INSERT INTO `user_account` VALUES (1,1,'admin@demo.com','$2a$10$S.yojHPLRwO477SfBxXMsu6pAls/2WLtDPtK0ZiuYyyx5Xbjs8qiu',1,NULL,NULL,'active','super_admin',NULL,1,1,1769710806,1769804683),(2,1,'hishas2609@gmail.com','$2a$10$//1P.JDKadmP.YFlZ2lgeuFgxfzjXj6eXXTKf/Jd4DB2KkSGofRaS',1,NULL,NULL,'active','super_admin','employee',1,NULL,1769758708,1769857789),(3,1,'usenetflix33@gmail.com','$2a$10$HeaUHINWu5FVenN4on/n0.FSCxpuBksNlESnww7fi50RAnDd/v6am',1,NULL,NULL,'active','employee','employee',1,NULL,1769761438,1769761438),(5,1,'tisipab522@gamening.com','$2a$10$ptmzF71spZcm4YzK/j6Ike9yvhSV3HzALYx4vHpMBvHTneFlWbehe',1,'u9dk7mej8dymxdgwdtb3c',1769862713,'active','employee',NULL,1,NULL,1769776313,1769776451),(6,1,'amanra382@em.zenuino.in','$2a$10$RkRlM/gSkKV7pCWlUZZ.8eGiy/XB24DnKua4Ql0RHeouTDaIKjZo6',1,'mjdsx8bp9urfcggl6wu3uu',1769862986,'active','employee',NULL,1,NULL,1769776586,1769776604),(7,1,'testuser2@gmail.com','$2a$10$lf0lurw0IQcSmoDeJ4DJl.7awRwyGi6bqllbp4bgJN3GfnOlRmAKG',1,'w4rdi25pzkmbrkxby29zv',1769863393,'active','employee',NULL,1,NULL,1769776993,1769777037),(8,2,'hishas2609@gmail.com','$2a$10$ODtN24rP4XCZJMqas.SnGOdZvYzVSXP5/pfPxpzBP9kWL0ZcTXEsO',0,NULL,NULL,'active','admin',NULL,2,NULL,1769796996,1769796996),(9,2,'tisipab522@gamening.com','$2a$10$uIyOb66l97tzLS.oBCe8cONl7mL9LNRIi7CzBZ5X33B7Xxfn6D5eG',0,NULL,NULL,'active','tenant_admin','employee',2,NULL,1769845439,1769847349),(10,2,'nihar08ranjansamal@gmail.com','$2a$10$oOjGJBgoZvRITm1BqVxlB.SCvgCabtKVl2JwQ2Jx2LWwRGq3igr7a',0,NULL,NULL,'active','tenant_admin','employee',2,NULL,1769847517,1769847517),(11,2,'niharranjansamal.19180@gmail.com','$2a$10$.qmcvEPhLZulVICGxtTt.OMcrWz9.LXI.ryMFi2CZvpif3hSNiXh2',0,NULL,NULL,'active','company_admin','employee',2,NULL,1769848679,1769848679),(12,3,'cg89l@virgilian.com','$2a$10$CnzTNZLKWUfCkPjpEzKVdOEFlLMmnSEzV4KJYnPentHkwwxaXgH4K',0,NULL,NULL,'active','tenant_admin',NULL,3,NULL,1769849413,1769849413),(13,3,'ykk7w@virgilian.com','$2a$10$.dB5/3JBkunSJfjZpnhapOq6.zO2M4JmhARPGuXcZHPMPg8kGukrC',0,NULL,NULL,'active','tenant_admin','employee',3,NULL,1769849689,1769849689),(14,3,'riv4e@virgilian.com','$2a$10$I42C6Dv/PdlftKJ.1CD8ZOIaoACCTiA9QxT1ijpdQikx1wshXu0oa',0,NULL,NULL,'active','company_admin','employee',3,NULL,1769855312,1769857517),(16,1,'csecnw@gmail.com','$2a$10$haOXG9FBZl4jUFg1BjJVB./TsdjnyJMfcGy1V978ldeGthV3dpPrW',1,'wroxnz90hnilkonx1gqm8',1770095597,'active','employee','employee',1,NULL,1770009197,1770009328),(17,1,'samalniharranjan08@gmail.com','$2a$10$WPQv83hZdCTzF7a9LQQkhezVt03LOR8emP0ROu41vfMd5NBPlBP4e',1,'nvgjp6vdcisx619qyoi9ke',1770096666,'active','employee','employee',1,NULL,1770010266,1770010339);
/*!40000 ALTER TABLE `user_account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'attendance_db'
--

--
-- Dumping routines for database 'attendance_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-02 16:56:06
