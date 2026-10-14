<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PurchaseOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $query = PurchaseOrder::with(['supplier', 'items']);

        if ($status) {
            $query->where('status', $status);
        }

        $orders = $query->orderBy('id', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $orders->items(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'total' => $orders->total(),
                'last_page' => $orders->lastPage(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $order = PurchaseOrder::with(['supplier', 'items', 'goodsReceipts.items'])->find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => "Orden de compra #{$id} no encontrada",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'issue_date' => 'required|date',
            'expected_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_sku' => 'required|string',
            'items.*.product_name' => 'required|string',
            'items.*.product_mongo_id' => 'required|string',
            'items.*.quantity_ordered' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated) {
            $orderNumber = 'OC-' . strtoupper(Str::random(6)) . '-' . date('Y');

            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $totalAmount += $item['quantity_ordered'] * $item['unit_price'];
            }

            $order = PurchaseOrder::create([
                'order_number' => $orderNumber,
                'supplier_id' => $validated['supplier_id'],
                'issue_date' => $validated['issue_date'],
                'expected_date' => $validated['expected_date'] ?? null,
                'status' => 'aprobada', // Se genera aprobada para permitir recepciones
                'total_amount' => $totalAmount,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                PurchaseOrderItem::create([
                    'purchase_order_id' => $order->id,
                    'product_sku' => strtoupper($item['product_sku']),
                    'product_name' => $item['product_name'],
                    'product_mongo_id' => $item['product_mongo_id'],
                    'quantity_ordered' => $item['quantity_ordered'],
                    'quantity_received' => 0,
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $item['quantity_ordered'] * $item['unit_price'],
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Orden de compra emitida y aprobada exitosamente',
                'data' => $order->load(['supplier', 'items']),
            ], 201);
        });
    }

    public function cancel(int $id): JsonResponse
    {
        $order = PurchaseOrder::find($id);

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Orden no encontrada'], 404);
        }

        if (in_array($order->status, ['parcialmente_recibida', 'recibida'])) {
            return response()->json([
                'success' => false,
                'message' => 'No es posible cancelar una orden que ya registra recepciones físicas de mercadería',
            ], 400);
        }

        $order->status = 'cancelada';
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Orden de compra cancelada exitosamente',
            'data' => $order,
        ]);
    }
}
