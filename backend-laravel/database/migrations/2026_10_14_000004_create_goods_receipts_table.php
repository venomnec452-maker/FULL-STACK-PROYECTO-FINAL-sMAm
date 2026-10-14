<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('goods_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_number')->unique();
            $table->foreignId('purchase_order_id')->constrained('purchase_orders')->onDelete('restrict');
            $table->string('supplier_delivery_note')->index(); // Número de remito oficial
            $table->date('receipt_date');
            $table->string('received_by');
            $table->enum('status', [
                'registrada',
                'sincronizada_con_nodo',
                'error_sincronizacion'
            ])->default('registrada');
            $table->string('idempotency_key')->unique(); // Clave de idempotencia única
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('goods_receipts');
    }
};
