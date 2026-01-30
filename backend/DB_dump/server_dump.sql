-- MySQL dump 10.13  Distrib 5.7.44, for Linux (x86_64)
--
-- Host: localhost    Database: ORAN_mysql
-- ------------------------------------------------------
-- Server version	5.7.44-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `CU`
--

DROP TABLE IF EXISTS `CU`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `CU` (
  `CUID` int(11) NOT NULL,
  `PID` int(11) NOT NULL,
  `name` varchar(30) DEFAULT NULL,
  `brand_ID` int(11) DEFAULT NULL,
  PRIMARY KEY (`CUID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CU`
--

LOCK TABLES `CU` WRITE;
/*!40000 ALTER TABLE `CU` DISABLE KEYS */;
INSERT INTO `CU` VALUES (5,19,'CU1',NULL),(7,22,'CU1',NULL),(14,26,'CU1',NULL),(15,27,'1',NULL),(16,27,'1',NULL),(17,30,'0',NULL),(18,30,'1',NULL);
/*!40000 ALTER TABLE `CU` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `DU`
--

DROP TABLE IF EXISTS `DU`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `DU` (
  `DUID` int(11) NOT NULL,
  `CUID` int(11) DEFAULT NULL,
  `PID` int(11) NOT NULL,
  `name` varchar(30) DEFAULT NULL,
  `brand_ID` int(11) DEFAULT NULL,
  PRIMARY KEY (`DUID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `DU`
--

LOCK TABLES `DU` WRITE;
/*!40000 ALTER TABLE `DU` DISABLE KEYS */;
INSERT INTO `DU` VALUES (5,5,19,'DU1',NULL),(8,7,22,'DU1',NULL),(9,7,22,'DU2',NULL),(10,14,26,'1',NULL),(11,14,26,'2',NULL),(12,16,27,'DU1',NULL),(13,16,27,'DU2',NULL),(14,17,30,'0',NULL),(15,17,30,'1',NULL);
/*!40000 ALTER TABLE `DU` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RU`
--

DROP TABLE IF EXISTS `RU`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `RU` (
  `RUID` int(11) NOT NULL,
  `name` varchar(20) DEFAULT NULL,
  `DUID` int(11) DEFAULT NULL,
  `PID` int(11) DEFAULT NULL,
  `brand_ID` int(11) DEFAULT NULL,
  `location_x` double DEFAULT NULL,
  `location_y` double DEFAULT NULL,
  `location_z` double DEFAULT NULL,
  `config` json DEFAULT NULL,
  PRIMARY KEY (`RUID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RU`
--

LOCK TABLES `RU` WRITE;
/*!40000 ALTER TABLE `RU` DISABLE KEYS */;
INSERT INTO `RU` VALUES (33,'RU1',NULL,19,NULL,120.9967369000002,24.78730134309579,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(34,'RU2',NULL,19,NULL,120.99652151761086,24.787003225444877,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(35,'RU3',NULL,19,NULL,120.99689461169488,24.787158161230607,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(36,'RU4',NULL,19,NULL,120.99710999408428,24.787069473873643,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(37,'RU5',NULL,19,NULL,120.99710646322455,24.787263944863867,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(38,'RU6',NULL,19,NULL,120.99648738597574,24.787300274575344,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(49,'RU1',8,22,1,120.9968961667663,24.786698324092143,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"RUID\": 49, \"power\": 10, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(50,'RU2',8,22,1,120.99666119429298,24.78670193557568,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"RUID\": 50, \"power\": 10, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(51,'RU3',9,22,1,120.99665458221864,24.786952715033678,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"RUID\": 51, \"power\": 10, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(52,'RU4',9,22,1,120.99666798277354,24.787214164069027,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"RUID\": 52, \"power\": 10, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(53,'RU5',9,22,1,120.99687219298738,24.78722579585491,0,'{\"IP\": \"0\", \"ch\": 0, \"RUID\": 53, \"power\": 24, \"state\": 1, \"format\": 0, \"mac_4g\": \"0\", \"mac_5g\": \"0\", \"protocol\": \"0\", \"throughput\": 0}'),(63,'p1_ru1',1,1,1,1.2,1.2,1.2,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(64,'0',10,26,1,120.99667232196646,24.787201746017004,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"RUID\": 64, \"power\": 10, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(65,'1',NULL,26,NULL,120.99688137582145,24.78669651766387,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(66,'2',NULL,26,NULL,120.99667232215012,24.78670644612039,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(67,'3',NULL,26,NULL,120.99684512360938,24.78721295187934,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(68,'0',13,27,1,120.996776,24.786964,0,'{\"IP\": \"0\", \"ch\": 0, \"RUID\": 68, \"power\": 24, \"state\": 1, \"format\": 0, \"mac_4g\": \"0\", \"mac_5g\": \"0\", \"protocol\": \"0\", \"throughput\": 0}'),(69,'2',12,27,1,120.99665437634081,24.787208560197598,0,'{\"IP\": \"0\", \"ch\": 0, \"RUID\": 69, \"power\": 24, \"state\": 1, \"format\": 0, \"mac_4g\": \"0\", \"mac_5g\": \"0\", \"protocol\": \"0\", \"throughput\": 0}'),(70,'0',NULL,29,NULL,120.99672545872278,24.787145651538864,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(71,'1',NULL,29,NULL,120.99695774777848,24.786889300223805,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(72,'2',NULL,29,NULL,120.9964375257756,24.786894351515045,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(73,'3',NULL,29,NULL,120.99643196190452,24.787359069425023,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(74,'4',NULL,29,NULL,120.99693140177152,24.787358117082036,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(75,'5',NULL,29,NULL,120.99699484887373,24.78712959857205,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(76,'6',NULL,29,NULL,120.99673690000236,24.78697756742926,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(77,'7',NULL,29,NULL,120.99643110577848,24.787140930078053,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(78,'0',NULL,32,NULL,120.99678786570792,24.787364727115715,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(79,'1',NULL,32,NULL,120.99653303718576,24.78735528421056,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(80,'2',NULL,32,NULL,120.9970187715519,24.787358117082036,0,'{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}'),(81,'0',15,30,1,120.99995685231511,24.78779259897665,0,'{\"IP\": \"0\", \"ch\": 0, \"RUID\": 81, \"power\": 24, \"state\": 2, \"format\": 0, \"mac_4g\": \"0\", \"mac_5g\": \"5\", \"protocol\": \"0\", \"throughput\": 0}'),(82,'0',15,30,1,120.99957666757382,24.78778608657794,0,'{\"IP\": \"0\", \"ch\": 0, \"power\": 24, \"state\": 2, \"format\": 0, \"mac_4g\": \"0\", \"mac_5g\": \"0\", \"protocol\": \"0\", \"throughput\": 0}');
/*!40000 ALTER TABLE `RU` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RU_cache`
--

DROP TABLE IF EXISTS `RU_cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `RU_cache` (
  `PID` int(11) DEFAULT NULL,
  `pos` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RU_cache`
--

LOCK TABLES `RU_cache` WRITE;
/*!40000 ALTER TABLE `RU_cache` DISABLE KEYS */;
INSERT INTO `RU_cache` VALUES (22,'{\"1\": {\"heatmapID\": \"22\", \"RU_positions\": [{\"location_x\": 120.99687622272036, \"location_y\": 24.78722454773984}, {\"location_x\": 120.99666075286342, \"location_y\": 24.787218850103287}, {\"location_x\": 120.99665233301909, \"location_y\": 24.787047763026735}, {\"location_x\": 120.9966523851022, \"location_y\": 24.78669276725536}, {\"location_x\": 120.99687831466063, \"location_y\": 24.786687069595104}], \"simulationID\": \"1\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"1\\\"\": {\"heatmapID\": \"22\", \"RU_positions\": [{\"location_x\": 120.996776, \"location_y\": 24.78696399950688}, {\"location_x\": 120.9966224548167, \"location_y\": 24.78684478204929}], \"simulationID\": \"\\\"1\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"null\": {\"heatmapID\": \"22\", \"RU_positions\": [], \"simulationID\": \"null\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"null\\\"\": {\"heatmapID\": \"22\", \"RU_positions\": [], \"simulationID\": \"\\\"null\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"1\\\\\\\"\\\"\": {\"heatmapID\": \"22\", \"RU_positions\": [{\"location_x\": 120.99677280114406, \"location_y\": 24.787145362170776}, {\"location_x\": 120.9966224548167, \"location_y\": 24.78684478204929}], \"simulationID\": \"\\\"\\\\\\\"1\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"null\\\\\\\"\\\"\": {\"heatmapID\": \"22\", \"RU_positions\": [], \"simulationID\": \"\\\"\\\\\\\"null\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\"\\\\\\\"\\\"\": {\"heatmapID\": \"22\", \"RU_positions\": [{\"location_x\": 120.99677280114406, \"location_y\": 24.787145362170776}, {\"location_x\": 120.9966224548167, \"location_y\": 24.78684478204929}], \"simulationID\": \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\"\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"null\\\\\\\\\\\\\\\"\\\\\\\"\\\"\": {\"heatmapID\": \"22\", \"RU_positions\": [], \"simulationID\": \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"null\\\\\\\\\\\\\\\"\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\"\\\"\": {\"heatmapID\": \"22\", \"RU_positions\": [{\"location_x\": 120.99677280114406, \"location_y\": 24.787145362170776}, {\"location_x\": 120.9966224548167, \"location_y\": 24.78684478204929}], \"simulationID\": \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"null\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\"\\\"\": {\"heatmapID\": \"22\", \"RU_positions\": [], \"simulationID\": \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"null\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\"\\\"\": {\"heatmapID\": \"22\", \"RU_positions\": [{\"location_x\": 120.99677280114406, \"location_y\": 24.787145362170776}, {\"location_x\": 120.9966224548167, \"location_y\": 24.78684478204929}], \"simulationID\": \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\"\\\"\": {\"heatmapID\": \"22\", \"RU_positions\": [{\"location_x\": 120.99681598572757, \"location_y\": 24.78713374556077}, {\"location_x\": 120.9966224548167, \"location_y\": 24.78684478204929}], \"simulationID\": \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}}'),(24,'{\"1\": {\"heatmapID\": \"24\", \"RU_positions\": [{\"location_x\": 120.996776, \"location_y\": 24.78696399950688}, {\"location_x\": 120.996776, \"location_y\": 24.78696399950688}, {\"location_x\": 120.996776, \"location_y\": 24.78696399950688}, {\"location_x\": 120.996776, \"location_y\": 24.78696399950688}, {\"location_x\": 120.99665695491184, \"location_y\": 24.786775665830177}, {\"location_x\": 120.99692480635326, \"location_y\": 24.787228241502746}, {\"location_x\": 120.99690496550676, \"location_y\": 24.786699110578382}, {\"location_x\": 120.99680328116273, \"location_y\": 24.78716294461701}], \"simulationID\": \"1\", \"RU_manufacturer\": \"WiSDON\"}, \"2\": {\"heatmapID\": \"24\", \"RU_positions\": [{\"location_x\": 120.99689089460372, \"location_y\": 24.786687859190877}, {\"location_x\": 120.99666961090378, \"location_y\": 24.786689479307825}, {\"location_x\": 120.99666941381338, \"location_y\": 24.78719922339738}, {\"location_x\": 120.99686528381164, \"location_y\": 24.787203473722343}], \"simulationID\": 2, \"RU_manufacturer\": \"WiSDON\"}, \"\\\"1\\\"\": {\"heatmapID\": \"24\", \"RU_positions\": [{\"location_x\": 120.996776, \"location_y\": 24.78696399950688}, {\"location_x\": 120.996776, \"location_y\": 24.78696399950688}, {\"location_x\": 120.996776, \"location_y\": 24.78696399950688}, {\"location_x\": 120.996776, \"location_y\": 24.78696399950688}, {\"location_x\": 120.99665695491184, \"location_y\": 24.786775665830177}, {\"location_x\": 120.99692480635326, \"location_y\": 24.787228241502746}, {\"location_x\": 120.99690496550676, \"location_y\": 24.786699110578382}, {\"location_x\": 120.99680328116273, \"location_y\": 24.78716294461701}], \"simulationID\": \"\\\"1\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"null\": {\"heatmapID\": \"24\", \"RU_positions\": [], \"simulationID\": \"null\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"null\\\"\": {\"heatmapID\": \"24\", \"RU_positions\": [], \"simulationID\": \"\\\"null\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"null\\\\\\\"\\\"\": {\"heatmapID\": \"24\", \"RU_positions\": [], \"simulationID\": \"\\\"\\\\\\\"null\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}}'),(21,'{\"1\": {\"heatmapID\": \"21\", \"RU_positions\": [{\"location_x\": 120.99691172407836, \"location_y\": 24.78667243506665}, {\"location_x\": 120.99666115973316, \"location_y\": 24.786696811055137}, {\"location_x\": 120.996664128195, \"location_y\": 24.786887710409403}, {\"location_x\": 120.99687971775025, \"location_y\": 24.787200098512344}, {\"location_x\": 120.99666617898282, \"location_y\": 24.78720484903199}], \"simulationID\": \"1\", \"RU_manufacturer\": \"WiSDON\"}, \"2\": {\"heatmapID\": \"21\", \"RU_positions\": [{\"location_x\": 120.99690425100812, \"location_y\": 24.786682095802988}, {\"location_x\": 120.99666412826856, \"location_y\": 24.78668952766364}, {\"location_x\": 120.99665867092546, \"location_y\": 24.78695707471388}, {\"location_x\": 120.99666958553804, \"location_y\": 24.78719984801799}, {\"location_x\": 120.9969124369519, \"location_y\": 24.787209757165584}], \"simulationID\": \"2\", \"RU_manufacturer\": \"WiSDON\"}, \"3\": {\"heatmapID\": \"21\", \"RU_positions\": [], \"simulationID\": \"3\", \"RU_manufacturer\": \"WiSDON\"}, \"4\": {\"heatmapID\": \"21\", \"RU_positions\": [{\"location_x\": 120.9966512445369, \"location_y\": 24.786798315491993}], \"simulationID\": \"4\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"1\\\"\": {\"heatmapID\": \"21\", \"RU_positions\": [{\"location_x\": 120.99679541848997, \"location_y\": 24.78718090527937}, {\"location_x\": 120.99659664820348, \"location_y\": 24.787046423886807}, {\"location_x\": 120.99691316139764, \"location_y\": 24.7866418294184}, {\"location_x\": 120.99670426269086, \"location_y\": 24.7867165415647}, {\"location_x\": 120.99657006109489, \"location_y\": 24.78679125366594}], \"simulationID\": \"\\\"1\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"null\": {\"heatmapID\": \"21\", \"RU_positions\": [], \"simulationID\": \"null\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"null\\\"\": {\"heatmapID\": \"21\", \"RU_positions\": [{\"location_x\": 120.9966512445369, \"location_y\": 24.786798315491993}], \"simulationID\": \"\\\"null\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"1\\\\\\\"\\\"\": {\"heatmapID\": \"21\", \"RU_positions\": [{\"location_x\": 120.99659411609964, \"location_y\": 24.786841827985754}, {\"location_x\": 120.99659918030972, \"location_y\": 24.786779759499534}, {\"location_x\": 120.99662703347144, \"location_y\": 24.786842977402173}, {\"location_x\": 120.9966460242636, \"location_y\": 24.786786655999293}, {\"location_x\": 120.99657006109489, \"location_y\": 24.78679125366594}], \"simulationID\": \"\\\"\\\\\\\"1\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"null\\\\\\\"\\\"\": {\"heatmapID\": \"21\", \"RU_positions\": [{\"location_x\": 120.9966512445369, \"location_y\": 24.786798315491993}], \"simulationID\": \"\\\"\\\\\\\"null\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\"\\\\\\\"\\\"\": {\"heatmapID\": \"21\", \"RU_positions\": [{\"location_x\": 120.99691062929378, \"location_y\": 24.78664872592691}], \"simulationID\": \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\"\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\"\\\"\": {\"heatmapID\": \"21\", \"RU_positions\": [{\"location_x\": 120.99691062929378, \"location_y\": 24.78664872592691}], \"simulationID\": \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\"\\\"\": {\"heatmapID\": \"21\", \"RU_positions\": [{\"location_x\": 120.99672831769313, \"location_y\": 24.786942976563495}], \"simulationID\": \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\"\\\"\": {\"heatmapID\": \"21\", \"RU_positions\": [{\"location_x\": 120.9967979505962, \"location_y\": 24.787193548820724}], \"simulationID\": \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\"\\\"\": {\"heatmapID\": \"21\", \"RU_positions\": [{\"location_x\": 120.9967979505962, \"location_y\": 24.787193548820724}], \"simulationID\": \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"\\\\\\\\\\\\\\\"\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}}'),(26,'{\"1\": {\"heatmapID\": \"26\", \"RU_positions\": [{\"location_x\": 120.9968098124188, \"location_y\": 24.78720545946166}, {\"location_x\": 120.9967208031398, \"location_y\": 24.78693340977307}, {\"location_x\": 120.9969089742512, \"location_y\": 24.787245468880712}], \"simulationID\": \"1\", \"RU_manufacturer\": \"WiSDON\"}, \"2\": {\"heatmapID\": \"26\", \"RU_positions\": [{\"location_x\": 120.99667232196646, \"location_y\": 24.787201746017004}, {\"location_x\": 120.99688137582145, \"location_y\": 24.78669651766387}, {\"location_x\": 120.99667232215012, \"location_y\": 24.78670644612039}, {\"location_x\": 120.99684512360938, \"location_y\": 24.78721295187934}], \"simulationID\": \"2\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"2\\\"\": {\"heatmapID\": \"26\", \"RU_positions\": [{\"location_x\": 120.99667232196646, \"location_y\": 24.787201746017004}, {\"location_x\": 120.99688137582145, \"location_y\": 24.78669651766387}, {\"location_x\": 120.99667232215012, \"location_y\": 24.78670644612039}, {\"location_x\": 120.99684512360938, \"location_y\": 24.78721295187934}], \"simulationID\": \"\\\"2\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"2\\\\\\\"\\\"\": {\"heatmapID\": \"26\", \"RU_positions\": [{\"location_x\": 120.99679356263516, \"location_y\": 24.78669423985346}, {\"location_x\": 120.99688137582145, \"location_y\": 24.78669651766387}, {\"location_x\": 120.9967233120883, \"location_y\": 24.7867056289076}, {\"location_x\": 120.99694660847314, \"location_y\": 24.786691962042156}], \"simulationID\": \"\\\"\\\\\\\"2\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}}'),(23,'{\"1\": {\"heatmapID\": \"23\", \"RU_positions\": [], \"simulationID\": 1, \"RU_manufacturer\": \"WiSDON\"}}'),(27,'{\"\\\"1\\\"\": {\"heatmapID\": \"27\", \"RU_positions\": [{\"location_x\": 120.99674559408572, \"location_y\": 24.786732379049383}, {\"location_x\": 120.99662016968767, \"location_y\": 24.786965293970297}, {\"location_x\": 120.99666387818915, \"location_y\": 24.787196483162404}], \"simulationID\": \"\\\"1\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"1\\\\\\\"\\\"\": {\"heatmapID\": \"27\", \"RU_positions\": [{\"location_x\": 120.99674559408572, \"location_y\": 24.786732379049383}, {\"location_x\": 120.99662016968767, \"location_y\": 24.786965293970297}, {\"location_x\": 120.99666387818915, \"location_y\": 24.787196483162404}], \"simulationID\": \"\\\"\\\\\\\"1\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\"\\\\\\\"\\\"\": {\"heatmapID\": \"27\", \"RU_positions\": [{\"location_x\": 120.99674559408572, \"location_y\": 24.786732379049383}, {\"location_x\": 120.99662016968767, \"location_y\": 24.786965293970297}, {\"location_x\": 120.99666387818915, \"location_y\": 24.787196483162404}], \"simulationID\": \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\"\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}}'),(29,'{\"1\": {\"heatmapID\": \"29\", \"RU_positions\": [{\"location_x\": 120.99672545872278, \"location_y\": 24.787145651538864}, {\"location_x\": 120.99695774777848, \"location_y\": 24.786889300223805}, {\"location_x\": 120.9964375257756, \"location_y\": 24.786894351515045}, {\"location_x\": 120.99657880230428, \"location_y\": 24.787243857881776}, {\"location_x\": 120.99693140177152, \"location_y\": 24.787358117082036}, {\"location_x\": 120.99699484887373, \"location_y\": 24.78712959857205}, {\"location_x\": 120.99673690000236, \"location_y\": 24.78697756742926}, {\"location_x\": 120.99643110577848, \"location_y\": 24.787140930078053}], \"simulationID\": \"1\", \"RU_manufacturer\": \"WiSDON\"}, \"2\": {\"heatmapID\": \"29\", \"RU_positions\": [{\"location_x\": 120.99673689999996, \"location_y\": 24.787122899796316}], \"simulationID\": 2, \"RU_manufacturer\": \"WiSDON\"}, \"\\\"1\\\"\": {\"heatmapID\": \"29\", \"RU_positions\": [{\"location_x\": 120.99672545872278, \"location_y\": 24.787145651538864}, {\"location_x\": 120.99695948491188, \"location_y\": 24.787008729109047}, {\"location_x\": 120.9964375257756, \"location_y\": 24.786894351515045}, {\"location_x\": 120.99657880230428, \"location_y\": 24.787243857881776}, {\"location_x\": 120.99693140177152, \"location_y\": 24.787358117082036}, {\"location_x\": 120.99696572561032, \"location_y\": 24.78697851172491}, {\"location_x\": 120.99673690000236, \"location_y\": 24.78697756742926}, {\"location_x\": 120.99643110577848, \"location_y\": 24.787140930078053}], \"simulationID\": \"\\\"1\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"null\": {\"heatmapID\": \"29\", \"RU_positions\": [], \"simulationID\": \"null\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"1\\\\\\\"\\\"\": {\"heatmapID\": \"29\", \"RU_positions\": [{\"location_x\": 120.99672545872278, \"location_y\": 24.787145651538864}, {\"location_x\": 120.99695948491188, \"location_y\": 24.787008729109047}, {\"location_x\": 120.9964375257756, \"location_y\": 24.786894351515045}, {\"location_x\": 120.99657880230428, \"location_y\": 24.787243857881776}, {\"location_x\": 120.99693140177152, \"location_y\": 24.787358117082036}, {\"location_x\": 120.99696572561032, \"location_y\": 24.78697851172491}, {\"location_x\": 120.99673690000236, \"location_y\": 24.78697756742926}, {\"location_x\": 120.99643110577848, \"location_y\": 24.787140930078053}], \"simulationID\": \"\\\"\\\\\\\"1\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}, \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\"\\\\\\\"\\\"\": {\"heatmapID\": \"29\", \"RU_positions\": [{\"location_x\": 120.99672545872278, \"location_y\": 24.787145651538864}, {\"location_x\": 120.99695774777848, \"location_y\": 24.786889300223805}, {\"location_x\": 120.9964375257756, \"location_y\": 24.786894351515045}, {\"location_x\": 120.99643196190452, \"location_y\": 24.787359069425023}, {\"location_x\": 120.99693140177152, \"location_y\": 24.787358117082036}, {\"location_x\": 120.99699484887373, \"location_y\": 24.78712959857205}, {\"location_x\": 120.99673690000236, \"location_y\": 24.78697756742926}, {\"location_x\": 120.99643110577848, \"location_y\": 24.787140930078053}], \"simulationID\": \"\\\"\\\\\\\"\\\\\\\\\\\\\\\"1\\\\\\\\\\\\\\\"\\\\\\\"\\\"\", \"RU_manufacturer\": \"WiSDON\"}}'),(32,'{\"\\\"2\\\"\": {\"heatmapID\": \"32\", \"RU_positions\": [{\"location_x\": 120.99678786570792, \"location_y\": 24.787364727115715}, {\"location_x\": 120.99653303718576, \"location_y\": 24.78735528421056}, {\"location_x\": 120.9970187715519, \"location_y\": 24.787358117082036}], \"simulationID\": \"\\\"2\\\"\", \"RU_manufacturer\": \"WiSDON\"}}'),(30,'{\"1\": {\"heatmapID\": \"30\", \"RU_positions\": [{\"location_x\": 120.99975599999998, \"location_y\": 24.78795199979629}, {\"location_x\": 120.99987255772032, \"location_y\": 24.788050566727097}, {\"location_x\": 121.00000266633084, \"location_y\": 24.78815293825923}], \"simulationID\": 1, \"RU_manufacturer\": \"WiSDON\"}}');
/*!40000 ALTER TABLE `RU_cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `brand`
--

DROP TABLE IF EXISTS `brand`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `brand` (
  `brand_ID` int(11) NOT NULL,
  `brand_name` varchar(20) DEFAULT NULL,
  `config` json DEFAULT NULL,
  PRIMARY KEY (`brand_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brand`
--

LOCK TABLES `brand` WRITE;
/*!40000 ALTER TABLE `brand` DISABLE KEYS */;
INSERT INTO `brand` VALUES (1,'WiSDON','{\"IP\": \"127.0.0.1\", \"ch\": 1, \"power\": 1, \"state\": 1, \"format\": 1.2, \"mac_4g\": \"xx:xx:xx:xx:xx:xx\", \"mac_5g\": \"xx:xx:xx:xx:xx:xx\", \"protocol\": \"protocal/xx 8.0.3\", \"throughput\": 1.2}');
/*!40000 ALTER TABLE `brand` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation`
--

DROP TABLE IF EXISTS `evaluation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `evaluation` (
  `eval_ID` int(11) NOT NULL,
  `UID` int(11) DEFAULT NULL,
  `data` json DEFAULT NULL,
  PRIMARY KEY (`eval_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation`
--

LOCK TABLES `evaluation` WRITE;
/*!40000 ALTER TABLE `evaluation` DISABLE KEYS */;
/*!40000 ALTER TABLE `evaluation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `heatmap`
--

DROP TABLE IF EXISTS `heatmap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `heatmap` (
  `heatmap_ID` int(11) NOT NULL,
  `MID` int(11) DEFAULT NULL,
  `data` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`heatmap_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `heatmap`
--

LOCK TABLES `heatmap` WRITE;
/*!40000 ALTER TABLE `heatmap` DISABLE KEYS */;
INSERT INTO `heatmap` VALUES (1,1,'./heatmap/1.json'),(19,19,'./heatmap/19.json'),(20,20,'./heatmap/20.json'),(22,22,'./heatmap/22.json'),(23,23,'./heatmap/23.json'),(26,26,'./heatmap/26.json'),(27,27,'./heatmap/27.json'),(28,28,'./heatmap/28.json'),(29,29,'./heatmap/29.json'),(30,30,'./heatmap/30.json'),(31,31,'./heatmap/31.json'),(32,32,'./heatmap/32.json');
/*!40000 ALTER TABLE `heatmap` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `map`
--

DROP TABLE IF EXISTS `map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `map` (
  `MID` int(11) NOT NULL,
  `UID` int(11) DEFAULT NULL,
  `image` varchar(20) DEFAULT NULL,
  `position` json DEFAULT NULL,
  `name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`MID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map`
--

LOCK TABLES `map` WRITE;
/*!40000 ALTER TABLE `map` DISABLE KEYS */;
INSERT INTO `map` VALUES (5,1,'./img/5.json','{\"bbox\": {\"max\": {\"x\": 38.500000717640205, \"y\": 23.049998092651837, \"z\": 3.000000083446523}, \"min\": {\"x\": -38.500000717640205, \"y\": -23.049998092651833, \"z\": 0}}, \"boundary\": {\"max\": {\"lat\": 24.787313802886985, \"lng\": 120.99655436207588}, \"min\": {\"lat\": 24.786614196126777, \"lng\": 120.99699763792415}}, \"rotation\": [0.017452406437284195, 0.9998476951563912, 0, 0, -0.9998476951563912, 0.017452406437284195, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], \"coordinates\": {\"lat\": 24.786964, \"lng\": 120.996776}}','2024-09-20'),(6,2,'./img/6.json','{\"bbox\": {\"max\": {\"x\": 38.500000717640205, \"y\": 23.049998092651837, \"z\": 3.000000083446523}, \"min\": {\"x\": -38.500000717640205, \"y\": -23.049998092651833, \"z\": 0}}, \"boundary\": {\"max\": {\"lat\": 24.787330193153498, \"lng\": 120.9971182736416}, \"min\": {\"lat\": 24.78691560650013, \"lng\": 120.99635552635834}}, \"rotation\": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], \"coordinates\": {\"lat\": 24.7871229, \"lng\": 120.9967369}}','test1'),(7,2,'./img/7.json','{\"bbox\": {\"max\": {\"x\": 38.500000717640205, \"y\": 23.049998092651837, \"z\": 3.000000083446523}, \"min\": {\"x\": -38.500000717640205, \"y\": -23.049998092651833, \"z\": 0}}, \"boundary\": {\"max\": {\"lat\": 24.784132496777616, \"lng\": 121.0000490178602}, \"min\": {\"lat\": 24.783717910124224, \"lng\": 120.9992862902334}}, \"rotation\": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], \"coordinates\": {\"lat\": 24.78392520362408, \"lng\": 120.9996676540468}}','asdfsdf'),(8,2,'./img/8.json','{\"bbox\": {\"max\": {\"x\": 38.500000717640205, \"y\": 23.049998092651837, \"z\": 3.000000083446523}, \"min\": {\"x\": -38.500000717640205, \"y\": -23.049998092651833, \"z\": 0}}, \"boundary\": {\"max\": {\"lat\": 24.787330193153498, \"lng\": 120.9971182736416}, \"min\": {\"lat\": 24.78691560650013, \"lng\": 120.99635552635834}}, \"rotation\": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], \"coordinates\": {\"lat\": 24.7871229, \"lng\": 120.9967369}}','jlkjklj'),(9,1,'./img/9.json','{\"bbox\": {\"max\": {\"x\": 19.67500042915344, \"y\": 27.5, \"z\": 2.500000000000012}, \"min\": {\"x\": -19.67500042915344, \"y\": -27.5, \"z\": 0}}, \"boundary\": {\"max\": {\"lat\": 24.787238312853532, \"lng\": 120.99697489658304}, \"min\": {\"lat\": 24.786743686653494, \"lng\": 120.99658510341698}}, \"rotation\": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], \"coordinates\": {\"lat\": 24.786991, \"lng\": 120.99678}}','TestUpload'),(10,1,'./img/10.json','{\"bbox\": {\"max\": {\"x\": 25, \"y\": 25.000000000000007, \"z\": 50.000000000000014}, \"min\": {\"x\": -25, \"y\": -25.000000000000007, \"z\": 0}}, \"boundary\": {\"max\": {\"lat\": 24.789070829887223, \"lng\": 120.99493164865665}, \"min\": {\"lat\": 24.788621169705337, \"lng\": 120.99443635134338}}, \"rotation\": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], \"coordinates\": {\"lat\": 24.788846, \"lng\": 120.994684}}','cube_50_skyblue'),(11,1,'./img/11.json','{\"bbox\": {\"max\": {\"x\": 25, \"y\": 25.000000000000007, \"z\": 50.000000000000014}, \"min\": {\"x\": -25, \"y\": -25.000000000000007, \"z\": 0}}, \"boundary\": {\"max\": {\"lat\": 24.788600829887187, \"lng\": 121.00033764771842}, \"min\": {\"lat\": 24.788151169705344, \"lng\": 120.99984235228152}}, \"rotation\": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], \"coordinates\": {\"lat\": 24.788376, \"lng\": 121.00009}}','cube_50'),(12,1,'./img/12.json','{\"bbox\": {\"max\": {\"x\": 3, \"y\": 10, \"z\": 6.000000000000004}, \"min\": {\"x\": -3, \"y\": -10, \"z\": 0}}, \"boundary\": {\"max\": {\"lat\": 24.788942932003792, \"lng\": 120.99523171784053}, \"min\": {\"lat\": 24.78876306793103, \"lng\": 120.99517228215956}}, \"rotation\": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], \"coordinates\": {\"lat\": 24.788853, \"lng\": 120.995202}}','building_model'),(13,18,'./img/13.json','{\"bbox\": {\"max\": {\"x\": 25, \"y\": 25.000000000000007, \"z\": 50.000000000000014}, \"min\": {\"x\": -25, \"y\": -25.000000000000007, \"z\": 0}}, \"boundary\": {\"max\": {\"lat\": 24.78734772988726, \"lng\": 120.99698454521716}, \"min\": {\"lat\": 24.786898069705373, \"lng\": 120.99648925478276}}, \"rotation\": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], \"coordinates\": {\"lat\": 24.7871229, \"lng\": 120.9967369}}','test_931'),(14,1,'./img/14.json','{\"bbox\": {\"max\": {\"x\": 25, \"y\": 25.000000000000007, \"z\": 50.000000000000014}, \"min\": {\"x\": -25, \"y\": -25.000000000000007, \"z\": 0}}, \"boundary\": {\"max\": {\"lat\": 24.78817682988722, \"lng\": 121.00000364687212}, \"min\": {\"lat\": 24.787727169705363, \"lng\": 120.99950835312784}}, \"rotation\": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], \"coordinates\": {\"lat\": 24.787952, \"lng\": 120.999756}}','test_931_2'),(15,1,'./img/15.json','{\"bbox\": {\"max\": {\"x\": 25, \"y\": 25.000000000000007, \"z\": 50.000000000000014}, \"min\": {\"x\": -25, \"y\": -25.000000000000007, \"z\": 0}}, \"boundary\": {\"max\": {\"lat\": 24.78734772988726, \"lng\": 120.99698454521716}, \"min\": {\"lat\": 24.786898069705373, \"lng\": 120.99648925478276}}, \"rotation\": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], \"coordinates\": {\"lat\": 24.7871229, \"lng\": 120.9967369}}','test_931_3'),(16,18,'./img/16.json','{\"bbox\": {\"max\": {\"x\": 25, \"y\": 25.000000000000007, \"z\": 50.000000000000014}, \"min\": {\"x\": -25, \"y\": -25.000000000000007, \"z\": 0}}, \"boundary\": {\"max\": {\"lat\": 24.78734772988726, \"lng\": 120.99698454521716}, \"min\": {\"lat\": 24.786898069705373, \"lng\": 120.99648925478276}}, \"rotation\": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], \"coordinates\": {\"lat\": 24.7871229, \"lng\": 120.9967369}}','test');
/*!40000 ALTER TABLE `map` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `model`
--

DROP TABLE IF EXISTS `model`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `model` (
  `model_ID` int(11) NOT NULL,
  `PID` int(11) DEFAULT NULL,
  `name` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`model_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `model`
--

LOCK TABLES `model` WRITE;
/*!40000 ALTER TABLE `model` DISABLE KEYS */;
INSERT INTO `model` VALUES (2,2,'MRO'),(11,24,'ANR'),(12,24,'ANR2'),(13,22,'000'),(14,22,'777'),(15,32,'haha'),(16,26,'RSM');
/*!40000 ALTER TABLE `model` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project`
--

DROP TABLE IF EXISTS `project`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project` (
  `PID` int(11) NOT NULL,
  `title` varchar(50) NOT NULL,
  `date` varchar(20) NOT NULL,
  PRIMARY KEY (`PID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project`
--

LOCK TABLES `project` WRITE;
/*!40000 ALTER TABLE `project` DISABLE KEYS */;
INSERT INTO `project` VALUES (1,'test222','2025-6-20'),(19,'test','2024-10-06'),(20,'dsf','2024-10-06'),(22,'IPS-demo','2025-06-23'),(23,'35437','2024-10-20'),(26,'ED8F','2025-06-23'),(27,'0620test4','2025-06-23'),(28,'0624','2025-06-24'),(29,'931','2025-06-24'),(30,'931_2','2025-06-24'),(31,'931_3','2025-06-24'),(32,'test','2025-06-24');
/*!40000 ALTER TABLE `project` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_map`
--

DROP TABLE IF EXISTS `project_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project_map` (
  `PID` int(11) NOT NULL,
  `MID` int(11) NOT NULL,
  PRIMARY KEY (`PID`,`MID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_map`
--

LOCK TABLES `project_map` WRITE;
/*!40000 ALTER TABLE `project_map` DISABLE KEYS */;
INSERT INTO `project_map` VALUES (19,6),(20,7),(22,5),(23,8),(26,5),(27,5),(28,11),(29,13),(30,14),(31,15),(32,16);
/*!40000 ALTER TABLE `project_map` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `throughtput`
--

DROP TABLE IF EXISTS `throughtput`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `throughtput` (
  `throughtput_ID` int(11) NOT NULL,
  `MID` int(11) DEFAULT NULL,
  `data` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`throughtput_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `throughtput`
--

LOCK TABLES `throughtput` WRITE;
/*!40000 ALTER TABLE `throughtput` DISABLE KEYS */;
INSERT INTO `throughtput` VALUES (22,22,'./throughtput/22.json'),(23,23,'./throughtput/23.json'),(26,26,'./throughtput/26.json'),(27,27,'./throughtput/27.json'),(28,28,'./throughtput/28.json'),(29,29,'./throughtput/29.json'),(30,30,'./throughtput/30.json'),(31,31,'./throughtput/31.json'),(32,32,'./throughtput/32.json');
/*!40000 ALTER TABLE `throughtput` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `UID` int(11) NOT NULL,
  `account` varchar(50) NOT NULL,
  `password` varchar(100) NOT NULL,
  `email` varchar(50) NOT NULL,
  `salt` varchar(20) NOT NULL,
  PRIMARY KEY (`UID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'a','78e228ce48158598f2fafc462eed6812631c585c08eed459158c8421c39488f2','aaa@gmail.com','\"4p)[(6MWF'),(2,'admin','2e56d20900a420e374242a796e842ddcec2b96a507ea8349256ec7d92c442a9b','jake95068@gmail.com','~nz4<j4t)m'),(3,'hsiluchao','1853226f1fb3a028155b9affe552c2ed26e0a6ffc597cd1fb50ce28347ff1425','hsiluchao@gmail.com','5=5R!!&`C1'),(9,'user1','6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b','user1@gmail.com','asdfghjkl;'),(10,'b','dbc7fc971ba1b6e05102b8ea62d761d71b2d7aa4bf2d30965e3fb653e1006eab','bbb@gmail.com','}},A8w8Lx3'),(13,'1','aaea7f17f3a7aad1d3ef2482ef3f54357e03e5fb8368b231807312a8a75599f6','111@gmail.com','=jec8E33Ve'),(14,'eddy','1d60fab5d15c059ccb08988ae073ad9193dd1c095d703857e0aa570e16fed355','eddy100073@gmail.com','q.80QN&`)?'),(15,'c','f94dd6127807dcde34f393f7dc4f850a556af73ba2c96d8328f4f68d2f83a9cc','cccc@gmail.com','GkVSB+9aL0'),(16,'123','edeba6ef1da38ae37c836a1d15e81486683f12a2d7226621a6c268efcf5f75a0','123@gmail.com','WG]k@1fmK<'),(17,'111','47875afaa7357cabdeae7f3644726a6afe7aef1ad1364702768ec4d49cc093a4','111@111','qK<Q/xA\"<B'),(18,'YinXuanLi','83b2affa98a3cd3784b5e5a22124552dcd56965ee9f8baab8f7cac2bef5d4d92','leeyinxuan.cs12@nycu.edu.tw','B/GE9t!@a,'),(19,'t0624','c21748bf8065eeb4d618190a15ec8821ffd49a5f906edd207e36a9742297ba71','0624@gmail.com','Vr]R4krk=a'),(20,'imgood','f3b75c1cb67790676bf9c5581f4e63eb51a100b38ebaa39fa40e322c26344007','hahaha@gmail.com','OKt:r&%]H^');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_project`
--

DROP TABLE IF EXISTS `user_project`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_project` (
  `UID` int(11) NOT NULL,
  `PID` int(11) NOT NULL,
  `auth` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`UID`,`PID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_project`
--

LOCK TABLES `user_project` WRITE;
/*!40000 ALTER TABLE `user_project` DISABLE KEYS */;
INSERT INTO `user_project` VALUES (1,22,'admin'),(1,26,'admin'),(1,27,'admin'),(1,28,'admin'),(1,30,'admin'),(1,31,'admin'),(2,19,'admin'),(2,20,'admin'),(2,23,'admin'),(18,29,'admin'),(18,32,'admin');
/*!40000 ALTER TABLE `user_project` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-25 10:05:15
