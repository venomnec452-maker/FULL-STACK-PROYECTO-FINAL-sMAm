<?php

use App\Http\Controllers\Api\GoodsReceiptController;
use App\Http\Controllers\Api\PurchaseOrderController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Módulo de Compras y Recepciones StockMaster
|--------------------------------------------------------------------------
*/

Route::prefix('compras')->group(function () {
    // 1. Órdenes de Compra
    Route::get('/ordenes', [PurchaseOrderController::class, 'index']);
    Route::get('/ordenes/{id}', [PurchaseOrderController::class, 'show']);
    Route::post('/ordenes', [PurchaseOrderController::class, 'store']);
    Route::patch('/ordenes/{id}/cancelar', [PurchaseOrderController::class, 'cancel']);

    // 2. Recepción de Mercadería contra Remito
    Route::get('/recepciones', [GoodsReceiptController::class, 'index']);
    Route::post('/recepciones', [GoodsReceiptController::class, 'store']);
});
