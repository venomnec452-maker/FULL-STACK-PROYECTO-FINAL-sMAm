import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { User, Category, Supplier, Product, StockMovement } from '../models/index.js';

/**
 * Script de inicialización de datos de prueba (Seed).
 * Crea usuarios base (Admin y Operario), categorías, proveedores, productos y movimientos iniciales.
 */
const seedDatabase = async () => {
  try {
    console.log('--- Iniciando Seed de Base de Datos StockMaster ---');
    await connectDB();

    // 1. Usuarios iniciales
    const usersToSeed = [
      {
        name: 'Administrador del Sistema',
        email: 'admin@stockmaster.com',
        password: 'Admin1234!',
        role: 'admin',
        status: 'active',
      },
      {
        name: 'Operario de Depósito',
        email: 'operario@stockmaster.com',
        password: 'Operario1234!',
        role: 'operario',
        status: 'active',
      },
    ];

    for (const userData of usersToSeed) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        await User.create(userData);
        console.log(`[Seed] Usuario creado: ${userData.email} (${userData.role})`);
      } else {
        console.log(`[Seed] Usuario ya existía: ${userData.email}`);
      }
    }

    // 2. Categorías iniciales
    const categoriesToSeed = [
      { name: 'Electrónica y Computación', description: 'Componentes, placas y accesorios electrónicos' },
      { name: 'Herramientas y Ferretería', description: 'Equipamiento manual, eléctrico y fijaciones' },
      { name: 'Embalaje y Despacho', description: 'Cajas de cartón, cinta film, etiquetas' },
      { name: 'Materiales y Repuestos', description: 'Insumos generales de mantenimiento' },
    ];

    for (const catData of categoriesToSeed) {
      const exists = await Category.findOne({ name: catData.name });
      if (!exists) {
        await Category.create(catData);
        console.log(`[Seed] Categoría creada: ${catData.name}`);
      }
    }

    // 3. Proveedores iniciales
    const suppliersToSeed = [
      {
        name: 'Distribuidora Global S.A.',
        taxId: '30-71234567-9',
        phone: '+54 11 4567-8901',
        email: 'ventas@distribuidoraglobal.com',
        address: 'Av. Industrial 4500, Parque Logístico',
      },
      {
        name: 'Suministros Industriales SRL',
        taxId: '30-68912345-4',
        phone: '+54 11 5123-4567',
        email: 'contacto@suministrosind.com',
        address: 'Ruta 8 Km 54, Depósito 12',
      },
    ];

    for (const supData of suppliersToSeed) {
      const exists = await Supplier.findOne({ name: supData.name });
      if (!exists) {
        await Supplier.create(supData);
        console.log(`[Seed] Proveedor creado: ${supData.name}`);
      }
    }

    // 4. Productos de muestra y movimientos iniciales
    const adminUser = await User.findOne({ email: 'admin@stockmaster.com' });
    const catHerramientas = await Category.findOne({ name: 'Herramientas y Ferretería' });
    const catElectronica = await Category.findOne({ name: 'Electrónica y Computación' });
    const catEmbalaje = await Category.findOne({ name: 'Embalaje y Despacho' });
    const supGlobal = await Supplier.findOne({ name: 'Distribuidora Global S.A.' });

    const productsToSeed = [
      {
        name: 'Taladro Percutor Industrial 750W',
        description: 'Mandril 13mm, velocidad variable con percutor metálico',
        sku: 'HERR-TAL-001',
        barcode: '7791234567890',
        category: catHerramientas?._id,
        unit: 'unidad',
        costPrice: 45.0,
        salePrice: 72.5,
        currentStock: 25,
        minStock: 10,
        location: 'Pasillo A - Estante 2',
        status: 'active',
      },
      {
        name: 'Multímetro Digital True RMS',
        description: 'Medición de voltaje, corriente, capacitancia y temperatura',
        sku: 'ELEC-MUL-002',
        barcode: '7791234567891',
        category: catElectronica?._id,
        unit: 'unidad',
        costPrice: 32.0,
        salePrice: 58.0,
        currentStock: 12,
        minStock: 5,
        location: 'Pasillo B - Gabinete 1',
        status: 'active',
      },
      {
        name: 'Cinta de Embalaje Frágil 48mm x 100m',
        description: 'Cinta autoadhesiva de polipropileno con leyenda FRÁGIL',
        sku: 'EMB-CIN-003',
        barcode: '7791234567892',
        category: catEmbalaje?._id,
        unit: 'unidad',
        costPrice: 2.1,
        salePrice: 4.5,
        currentStock: 4, // Stock crítico (< minStock: 15)
        minStock: 15,
        location: 'Sector Despacho - Riel 4',
        status: 'active',
      },
      {
        name: 'Set Destornilladores Aislados 1000V (7 Piezas)',
        description: 'Varilla de acero cromo vanadio con certificación VDE/GS',
        sku: 'HERR-DES-004',
        barcode: '7791234567893',
        category: catHerramientas?._id,
        unit: 'unidad',
        costPrice: 18.5,
        salePrice: 34.0,
        currentStock: 18,
        minStock: 8,
        location: 'Pasillo A - Estante 4',
        status: 'active',
      },
      {
        name: 'Cable UTP Cat6 100% Cobre Bobina 305m',
        description: 'Conductor 23 AWG para redes Gigabit de alta velocidad',
        sku: 'ELEC-UTP-005',
        barcode: '7791234567894',
        category: catElectronica?._id,
        unit: 'caja',
        costPrice: 85.0,
        salePrice: 140.0,
        currentStock: 2, // Stock crítico (< minStock: 6)
        minStock: 6,
        location: 'Pasillo C - Pallet 2',
        status: 'active',
      },
    ];

    for (const prodData of productsToSeed) {
      if (!prodData.category) continue;
      const exists = await Product.findOne({ sku: prodData.sku });
      if (!exists) {
        const newProduct = await Product.create(prodData);
        console.log(`[Seed] Producto creado: ${newProduct.name} (SKU: ${newProduct.sku})`);

        // Registrar movimiento inicial de entrada en el Kardex
        if (adminUser) {
          await StockMovement.create({
            product: newProduct._id,
            type: 'entry',
            quantity: newProduct.currentStock,
            previousStock: 0,
            subsequentStock: newProduct.currentStock,
            reason: 'Carga inicial de inventario - Apertura de depósito',
            supplier: supGlobal?._id || null,
            user: adminUser._id,
            documentReference: 'INIT-2026-001',
            notes: 'Verificación física y alta de catálogo conforme',
          });
        }
      }
    }

    console.log('--- Seed completado exitosamente ---');
    console.log('Credenciales de acceso para pruebas:');
    console.log('  Admin:    admin@stockmaster.com    | Password: Admin1234!');
    console.log('  Operario: operario@stockmaster.com | Password: Operario1234!');
    console.log('------------------------------------');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();
