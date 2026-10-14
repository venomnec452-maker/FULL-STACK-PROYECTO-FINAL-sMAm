<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptItem;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Services\InventorySyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GoodsReceiptController extends Controller
{
    protected InventorySyncService $syncService;

    public function __construct(InventorySyncService $syncService)
    {
        $this->syncService = $syncService;
    }

    public function index(Request $request): JsonResponse
    {
        $receipts = GoodsReceipt::with(['purchaseOrder.supplier', 'items'])
            ->orderBy('id', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $receipts->items(),
            'meta' => [
                'current_page' => $receipts->currentPage(),
                'total' => $receipts->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'purchase_order_id' => 'required|exists:purchase_orders,id',
            'supplier_delivery_note' => 'required|string', // N° de Remito del Proveedor
            'receipt_date' => 'required|date',
            'received_by' => 'required|string',
            'notes' => 'nullable|string',
            'idempotency_key' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.purchase_order_item_id' => 'required|exists:purchase_order_items,id',
            'items.*.quantity_received' => 'required|integer|min:1',
        ]);

        // 1. Control de Idempotencia: Verificar si esta misma recepción ya fue procesada
        $idempotencyKey = $validated['idempotency_key'] ?? Str::uuid()->toString();
        $existingReceipt = GoodsReceipt::where('idempotency_key', $idempotencyKey)->first();

        if ($existingReceipt) {
            return response()->json([
                'success' => true,
                'message' => 'Esta recepción ya fue procesada previamente (Idempotencia garantizada).',
                'data' => $existingReceipt->load('items'),
            ], 200);
        }

        // 2. Verificar que la orden permita recepciones
        $order = PurchaseOrder::with('items')->findOrFail($validated['purchase_order_id']);

        if (!in_array($order->status, ['aprobada', 'parcialmente_recibida'])) {
            return response()->json([
                'success' => false,
                'message' => "La orden #{$order->order_number} está en estado '{$order->status}' y no admite recepciones de mercadería.",
            ], 400);
        }

        // 3. Validar que las cantidades recibidas no superen lo pendiente de la orden
        foreach ($validated['items'] as $itemData) {
            $orderItem = $order->items->firstWhere('id', $itemData['purchase_order_item_id']);
            $pending = $orderItem->quantity_ordered - $orderItem->quantity_received;

            if ($itemData['quantity_received'] > $pending) {
                return response()->json([
                    'success' => false,
                    'message' => "La cantidad recibida ({$itemData['quantity_received']}) para el producto {$orderItem->product_sku} supera la cantidad pendiente por recibir ({$pending}).",
                ], 400);
            }
        }

        // 4. Transacción Relacional en MySQL
        $receipt = DB::transaction(function () use ($validated, $order, $idempotencyKey) {
            $receiptNumber = 'REC-' . strtoupper(Str::random(6)) . '-' . date('Y');

            $receipt = GoodsReceipt::create([
                'receipt_number' => $receiptNumber,
                'purchase_order_id' => $order->id,
                'supplier_delivery_note' => $validated['supplier_delivery_note'],
                'receipt_date' => $validated['receipt_date'],
                'received_by' => $validated['received_by'],
                'status' => 'registrada',
                'idempotency_key' => $idempotencyKey,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $itemData) {
                $orderItem = PurchaseOrderItem::findOrFail($itemData['purchase_order_item_id']);

                GoodsReceiptItem::create([
                    'goods_receipt_id' => $receipt->id,
                    'purchase_order_item_id' => $orderItem->id,
                    'product_sku' => $orderItem->product_sku,
                    'product_mongo_id' => $orderItem->product_mongo_id,
                    'quantity_received' => $itemData['quantity_received'],
                ]);

                // Actualizar cantidad acumulada recibida en la orden
                $orderItem->quantity_received += $itemData['quantity_received'];
                $orderItem->save();
            }

            // Recalcular estado de la orden (parcialmente_recibida o recibida)
            $order->updateReceiptStatus();

            return $receipt;
        });

        // 5. Integración HTTP con Node.js: Notificar la recepción para incrementar stock en MongoDB
        try {
            $syncResult = $this->syncService->syncReceiptWithNode($receipt);
        } catch (\Exception $e) {
            return response()->json([
                'success' => true,
                'warning' => 'La recepción fue registrada en MySQL, pero la sincronización automática con el inventario de Node.js reportó un error: ' . $e->getMessage(),
                'data' => $receipt->load('items'),
            ], 207); // 207 Multi-Status
        }

        return response()->json([
            'success' => true,
            'message' => 'Recepción de mercadería registrada e impactada en el inventario central exitosamente',
            'data' => $receipt->load(['purchaseOrder', 'items']),
            'sync' => $syncResult,
        ], 201);
    }
}
