<?php
/**
 * Plugin Name: StockMaster Headless CORS & REST API Helper
 * Description: Habilita cabeceras CORS para permitir que el frontend React consuma la REST API de WordPress
 * Version: 1.0.0
 * Author: StockMaster Team
 */

add_action('init', function () {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        status_header(200);
        exit();
    }
});
