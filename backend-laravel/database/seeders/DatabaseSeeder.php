<?php

namespace Database\Seeders;

use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Proveedores iniciales
        $supplierA = Supplier::firstOrCreate(
            ['name' => 'Distribuidora Global S.A.'],
            [
                'tax_id' => '30-71234567-9',
                'phone' => '+54 11 4567-8901',
                'email' => 'ventas@distribuidoraglobal.com',
                'address' => 'Av. Industrial 4500, Parque Logístico',
                'status' => 'active',
            ]
        );

        $supplierB = Supplier::firstOrCreate(
            ['name' => 'Suministros Industriales SRL'],
            [
                'tax_id' => '30-68912345-4',
                'phone' => '+54 11 5123-4567',
                'email' => 'contacto@suministrosind.com',
                'address' => 'Ruta 8 Km 54, Depósito 12',
                'status' => 'active',
            ]
        );

        // 2. Orden de compra de demostración
        $order = PurchaseOrder::firstOrCreate(
            ['order_number' => 'OC-DEMO-001-2026'],
            [
                'supplier_id' => $supplierA->id,
                'issue_date' => now()->toDateString(),
                'expected_date' => now()->addDays(7)->toDateString(),
                'status' => 'aprobada',
                'total_amount' => 5000.00,
                'notes' => 'Orden de compra inicial para abastecimiento de componentes',
            ]
        );

        PurchaseOrderItem::firstOrCreate(
            [
                'purchase_order_id' => $order->id,
                'product_sku' => 'TAL-001',
            ],
            [
                'product_name' => 'Taladro Percutor 750W',
                'product_mongo_id' => '65f123456789abcdef012345',
                'quantity_ordered' => 100,
                'quantity_received' => 0,
                'unit_price' => 50.00,
                'subtotal' => 5000.00,
            ]
        );
    }
}
