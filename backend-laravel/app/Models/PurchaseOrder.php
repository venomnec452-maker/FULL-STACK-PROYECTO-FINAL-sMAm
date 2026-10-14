<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrder extends Model
{
    protected $fillable = [
        'order_number',
        'supplier_id',
        'issue_date',
        'expected_date',
        'status', // 'borrador', 'pendiente', 'aprobada', 'parcialmente_recibida', 'recibida', 'cancelada'
        'total_amount',
        'notes',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'expected_date' => 'date',
        'total_amount' => 'decimal:2',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function goodsReceipts(): HasMany
    {
        return $this->hasMany(GoodsReceipt::class);
    }

    /**
     * Recalcula el estado de la orden en base a las cantidades recibidas de cada ítem.
     */
    public function updateReceiptStatus(): void
    {
        $items = $this->items()->get();

        if ($items->isEmpty()) {
            return;
        }

        $allReceived = $items->every(fn($item) => $item->quantity_received >= $item->quantity_ordered);
        $someReceived = $items->some(fn($item) => $item->quantity_received > 0);

        if ($allReceived) {
            $this->status = 'recibida';
        } elseif ($someReceived) {
            $this->status = 'parcialmente_recibida';
        }

        $this->save();
    }
}
