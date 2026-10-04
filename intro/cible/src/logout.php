<?php
// app_intro-compromission/cible/src/logout.php
// LAB VOLONTAIREMENT VULNÉRABLE - ne pas corriger, ne pas réutiliser en production.
session_start();
session_destroy();
header('Location: index.php');
