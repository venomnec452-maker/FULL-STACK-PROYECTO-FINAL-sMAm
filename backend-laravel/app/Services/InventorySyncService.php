<?php

namespace App\Services;

use App\Models\GoodsReceipt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Servicio de Integración Inter-Servicios:
 * Comunica las recepciones aprobadas en Laravel hacia la API de Node.js
 * mediante HTTP REST seguro con autenticación M2M y claves de idempotencia.
 */
class InventorySyncService
{
    protected string $nodeApiUrl;
    protected string $internalApiKey;

    public function __construct()
    {
        $this->nodeApiUrl = env('NODE_INTERNAL_API_URL', 'http://api:5000/api/v1');
        $this->internalApiKey = env('INTERNAL_API_KEY', 'stockmaster_internal_secure_key_m2m_token_2026');
    }

    /**
     * Sincroniza la recepción de mercadería impactando las existencias en Node.js/MongoDB.
     *
     * @param GoodsReceipt $receipt
     * @return array Resultado de la operación
     * @throws \Exception Si la API de Node.js rechaza la operación
     */
    public function syncReceiptWithNode(GoodsReceipt $receipt): array
    {
        // 1. Verificar idempotencia: si ya fue sincronizada, evitar duplicación
        if ($receipt->status === 'sincronizada_con_nodo') {
            Log::info("[InventorySync] La recepción {$receipt->receipt_number} ya fue sincronizada previamente (Idempotencia verificada).");
            return ['success' => true, 'message' => 'Recepción ya sincronizada previamente'];
        }

        $items = $receipt->items()->get();
        $syncedMovements = [];

        foreach ($items as $item) {
            // Preparar payload de entrada de inventario para Node.js
            $payload = [
                'product' => $item->product_mongo_id,
                'quantity' => (int) $item->quantity_received,
                'documentReference' => "REC-{$receipt->receipt_number} | REMITO: {$receipt->supplier_delivery_note}",
                'reason' => "Recepción de Compra física validada en Módulo Laravel (Orden #{$receipt->purchaseOrder->order_number})",
                'notes' => "Recepcionado por: {$receipt->received_by}. Clave idempotencia: {$receipt->idempotency_key}",
            ];

            try {
                // Petición HTTP POST hacia Node.js con cabeceras de seguridad M2M
                $response = Http::timeout(10)
                    ->withHeaders([
                        'x-internal-api-key' => $this->internalApiKey,
                        'Idempotency-Key' => "{$receipt->idempotency_key}-item-{$item->id}",
                        'Content-Type' => 'application/json',
                    ])
                    ->post("{$this->nodeApiUrl}/inventory/entries", $payload);

                if ($response->successful()) {
                    $resData = $response->json();
                    $syncedMovements[] = $resData['data']['movement']['_id'] ?? 'OK';
                    Log::info("[InventorySync] Ítem {$item->product_sku} impactado exitosamente en stock MongoDB.");
                } else {
                    $errorMessage = $response->json()['message'] ?? $response->body();
                    Log::error("[InventorySync Error] Fallo al impactar ítem {$item->product_sku} en Node.js: {$errorMessage}");
                    $receipt->status = 'error_sincronizacion';
                    $receipt->save();
                    throw new \Exception("Error al sincronizar con el depósito central: {$errorMessage}");
                }
            } catch (\Exception $e) {
                Log::error("[InventorySync Exception] Conexión fallida con backend Node.js: " . $e->getMessage());
                $receipt->status = 'error_sincronizacion';
                $receipt->save();
                throw $e;
            }
        }

        // Marcar la recepción como sincronizada con éxito
        $receipt->status = 'sincronizada_con_nodo';
        $receipt->save();

        return [
            'success' => true,
            'message' => 'Recepción de mercadería sincronizada exitosamente con el depósito central',
            'movements' => $syncedMovements,
        ];
    }
}
