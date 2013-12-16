-- MySQL dump 10.13  Distrib 5.5.22, for osx10.6 (i386)
--
-- Host: localhost    Database: fhb
-- ------------------------------------------------------
-- Server version	5.5.22

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
-- Table structure for table `command`
--

DROP TABLE IF EXISTS `command`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `command` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `sportId` int(11) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `sportId` (`sportId`),
  CONSTRAINT `command_ibfk_1` FOREIGN KEY (`sportId`) REFERENCES `dictionary` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `command`
--

LOCK TABLES `command` WRITE;
/*!40000 ALTER TABLE `command` DISABLE KEYS */;
INSERT INTO `command` VALUES (1,'ЦСКА',3),(3,'Спартак',3),(4,'Динамо',3),(5,'Локомотив',3),(6,'Зенит',3),(7,'Ростов',3),(8,'Волга',8),(9,'Томь',3),(10,'Терек',3);
/*!40000 ALTER TABLE `command` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dictionary`
--

DROP TABLE IF EXISTS `dictionary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dictionary` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `externalId` varchar(50) DEFAULT NULL,
  `discriminator` varchar(50) NOT NULL DEFAULT '',
  `description` varchar(200) DEFAULT NULL,
  `sortOrder` int(11) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dictionary`
--

LOCK TABLES `dictionary` WRITE;
/*!40000 ALTER TABLE `dictionary` DISABLE KEYS */;
INSERT INTO `dictionary` VALUES (3,'Футбол','FOOTBALL','SPORT','',1),(8,'Хоккей','HOCKEY','SPORT','',2),(9,'Баскетбол','BASKETBALL','SPORT','',3),(10,'Русский','RUSSIAN','LANGUAGE','',1),(11,'Английский','ENGLISH','LANGUAGE','',2);
/*!40000 ALTER TABLE `dictionary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `object_link`
--

DROP TABLE IF EXISTS `object_link`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `object_link` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `discriminator` varchar(50) DEFAULT '',
  `parentId` int(11) DEFAULT '0',
  `childId` int(11) DEFAULT '0',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `object_link`
--

LOCK TABLES `object_link` WRITE;
/*!40000 ALTER TABLE `object_link` DISABLE KEYS */;
INSERT INTO `object_link` VALUES (2,'COMMANDINTURNIR',11,3),(3,'COMMANDINTURNIR',11,4),(4,'COMMANDINTURNIR',11,5),(5,'COMMANDINTURNIR',12,6),(7,'COMMANDINTURNIR',12,3),(20,'COMMANDINTURNIR',13,5),(22,'COMMANDINTURNIR',11,1),(23,'COMMANDINTURNIR',13,1),(24,'COMMANDINTURNIR',11,7),(25,'COMMANDINTURNIR',12,7);
/*!40000 ALTER TABLE `object_link` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `turnir`
--

DROP TABLE IF EXISTS `turnir`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `turnir` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `sportId` int(11) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `sportId` (`sportId`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `turnir`
--

LOCK TABLES `turnir` WRITE;
/*!40000 ALTER TABLE `turnir` DISABLE KEYS */;
INSERT INTO `turnir` VALUES (11,'111',NULL),(12,'турнир2',NULL),(13,'туринр3',NULL);
/*!40000 ALTER TABLE `turnir` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2013-12-16 23:55:12
