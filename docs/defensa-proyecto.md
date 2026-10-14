# StockMaster Full Stack — Guía Estratégica para la Defensa Oral del Proyecto

> **Carrera:** Analista de Sistemas / Tecnicatura Superior en Desarrollo de Software  
> **Materia:** Proyecto Final Full Stack  
> **Sistema:** StockMaster Full Stack — Sistema Integral de Gestión de Depósito, Inventario y Control de Stock  
> **Autor:** Estudiante de Analista de Sistemas  
> **Calificación Objetivo:** Sobresaliente (10/10)

---

## 1. El "Elevator Pitch": Cómo presentar el proyecto en 2 minutos

> *"Buenos días profesores y miembros de la mesa evaluadora. Mi proyecto final se titula **StockMaster Full Stack**.*
>
> *Nace como respuesta a una problemática crítica que enfrentan empresas logísticas, distribuidoras y comercios minoristas: **la discrepancia entre el stock físico real y las existencias registradas en el sistema**, provocada por fallas humanas, operaciones desarticuladas, falta de trazabilidad y condiciones de carrera concurrentes.*
>
> *Para resolverlo, diseñé e implementé una **solución Full Stack modular desacoplada en microservicios contenerizados con Docker**:*
> 1. *Un **Frontend reactivo en React 18 con Vite y Tailwind CSS**, con control de acceso por roles (RBAC) y formularios validados estrictamente con Zod.*
> 2. *Un **Backend Core en Node.js y Express sobre MongoDB**, responsable de la lógica del almacén, que implementa **operaciones atómicas para impedir stock negativo**, JWT con rotación mediante **cookies HttpOnly**, y un **Kardex inmutable** que audita cada movimiento.*
> 3. *Un **Módulo Satélite en PHP 8.3 y Laravel 11 sobre MySQL**, que gestiona el ciclo comercial de compras y recepciones, sincronizándose con el núcleo de Node.js mediante una **API HTTP idempotente** con llaves M2M.*
> 4. *Un **Centro de Ayuda desacoplado con WordPress Headless**, que consume manuales vía REST API y cuenta con resiliencia y caché de contingencia ante caídas del CMS.*
> 5. *Todo el ecosistema cuenta con **27 pruebas automatizadas con 100% de cobertura de reglas de negocio**, contratos OpenAPI 3.0 y orquestación integral mediante Docker Compose.*
>
> *A continuación, les mostraré la arquitectura técnica y una demostración funcional en vivo."*

---

## 2. Preguntas Difíciles del Tribunal y Respuestas con Solvencia Técnica

### Pregunta 1: *"¿Por qué utilizaron dos bases de datos distintas (MongoDB y MySQL)? ¿No era más fácil usar solo una?"*
* **Respuesta del estudiante:**  
  *"Elegimos conscientemente una arquitectura de **Persistencia Políglota**.  
  - Para el **Núcleo de Depósito (Node.js + MongoDB)**, los productos de un almacén son altamente heterogéneos: un taladro tiene voltajes y marcas, una pintura tiene litros y colores, y los metadatos de auditoría son semi-estructurados y crecen rápidamente en volumen. MongoDB nos ofrece una alta velocidad de lectura/escritura y flexibilidad de esquema.
  - Para el **Módulo de Compras (Laravel + MySQL)**, las órdenes de compra y las recepciones son operaciones financieras y contables donde se requiere una **estricta normalización relacional (3FN)** con claves foráneas, integridad referencial cascada y cumplimiento ACID estricto.  
  Además, esto demuestra nuestra capacidad para diseñar **sistemas distribuidos desacoplados**, donde cada microservicio es dueño de su propio almacén de datos (Database-per-Service Pattern)."*

---

### Pregunta 2: *"¿Cómo garantizan que dos usuarios no vendan el mismo producto al mismo tiempo dejando el stock en números negativos?"*
* **Respuesta del estudiante:**  
  *"En la industria, el error más común es el antipatrón **Read-Modify-Write**: leer el producto en memoria (`const prod = await Product.findById`), restar en JavaScript (`prod.stock -= cantidad`), y luego guardar (`await prod.save()`). Si dos peticiones llegan en el mismo milisegundo, ambas leen el mismo saldo y una sobreescribe a la otra, corrompiendo el inventario.  
  En StockMaster implementamos una **operación atómica directa en el motor de base de datos** utilizando `Product.findOneAndUpdate` con una condición de guarda:
  ```javascript
  const product = await Product.findOneAndUpdate(
    { _id: productId, status: 'activo', currentStock: { $gte: quantity } },
    { $inc: { currentStock: -quantity } },
    { new: true }
  );
  ```
  El operador `$gte: quantity` garantiza a nivel de bloqueo atómico de documento en WiredTiger (MongoDB) que la resta solo se ejecutará si hay saldo suficiente. Si no lo hay, la base de datos devuelve `null` y el servidor responde inmediatamente con un error HTTP 400 'Stock insuficiente', garantizando consistencia absoluta sin necesidad de bloqueos distribuidos complejos ni transacciones pesadas."*

---

### Pregunta 3: *"¿Por qué almacenan el Refresh Token en una cookie HttpOnly y el Access Token en memoria/cabecera? ¿Por qué no usar simplemente localStorage?"*
* **Respuesta del estudiante:**  
  *"Guardar tokens en `localStorage` es una vulnerabilidad grave frente a ataques de tipo **XSS (Cross-Site Scripting)**: cualquier script malicioso inyectado vía librerías de terceros puede leer `localStorage.getItem('token')` y exfiltrarlo silenciosamente.  
  En StockMaster adoptamos el estándar de seguridad bancaria y moderna:
  1. El **Access Token** tiene una vida útil corta (15 minutos) y viaja en la cabecera `Authorization: Bearer <token>`.
  2. El **Refresh Token** tiene una vigencia de 7 días y está resguardado en una cookie con los atributos `HttpOnly` (inaccesible para JavaScript del DOM), `SameSite=Lax` (protección contra ataques CSRF) y `Path=/api/v1/auth` (limitada exclusivamente a las rutas de autenticación).  
  Cuando el Access Token expira, el interceptor de Axios en React detecta el código HTTP 401, invoca automáticamente `/auth/refresh` enviando la cookie de forma transparente, obtiene un nuevo Access Token y reintenta la petición original sin que el usuario sufra interrupciones."*

---

### Pregunta 4: *"¿Qué es la idempotencia y cómo la resolvieron en la comunicación entre Laravel y Node.js?"*
* **Respuesta del estudiante:**  
  *"En redes y arquitecturas distribuidas, una petición HTTP puede completarse en el servidor pero fallar en el camino de regreso debido a un corte de red o timeout. Si el cliente (en este caso Laravel) reintenta la petición para registrar la entrada de 20 taladros, sin idempotencia el almacén registraría 40 unidades (duplicación de stock).  
  Para resolverlo, implementamos el patrón **Idempotency-Key**:
  - Laravel genera un UUID único (`Str::uuid()`) para cada evento de recepción y lo envía en la cabecera `Idempotency-Key` junto a la firma `x-internal-api-key`.
  - Node.js verifica en la colección de movimientos si ya existe un movimiento registrado con esa referencia documental o clave de idempotencia.
  - Si ya existe, el servicio no incrementa el stock de nuevo; devuelve el registro previamente creado con éxito, garantizando que **$f(f(x)) = f(x)$**, es decir, el resultado final es el mismo sin importar cuántas veces se retransmita el mensaje."*

---

### Pregunta 5: *"¿Por qué los productos tienen 'Soft Delete' en vez de eliminarse de la base de datos?"*
* **Respuesta del estudiante:**  
  *"Por una regla fundamental de **Auditoría Contable y Trazabilidad**.  
  Si un usuario eliminara físicamente un producto que tuvo 100 movimientos de entrada y salida durante el año, el Kardex y los reportes históricos quedarían huérfanos con referencias nulas (`null pointer`), rompiendo la conciliación de balances patrimoniales pasados.  
  En StockMaster, nuestro `ProductService.delete` verifica si el producto posee movimientos asociados en `StockMovement`. Si nunca tuvo movimientos, permite el borrado físico; pero si posee historial, lo marca automáticamente como `status: 'inactivo'`. De este modo, no puede seguir operando en el depósito actual pero su historial queda 100% preservado para auditorías legales y fiscales."*

---

### Pregunta 6: *"¿Cómo se comunican los contenedores de Docker si no están en la misma máquina física?"*
* **Respuesta del estudiante:**  
  *"Todos los servicios están orquestados bajo una red interna tipo puente (*bridge network*) denominada `stockmaster-network` en nuestro archivo `compose.yaml`.  
  Docker provee un **servidor DNS interno**:
  - Node.js se conecta a MongoDB usando el nombre del servicio `mongodb:27017` en lugar de una IP fija.
  - Laravel se conecta a MySQL usando `mysql:3306`.
  - Laravel se comunica con la API de Node.js mediante `http://backend-node:5000/api/v1/inventory/entries`.  
  Los puertos expuestos al host (como el 3000 para React o el 5000 para Node) solo se abren para el navegador del usuario final, mientras que los datos sensibles viajan de forma aislada dentro de la red privada de Docker."*

---

## 3. Guión para la Demostración en Vivo (Paso a Paso)

| Paso | Acción en Pantalla | Qué decir al profesor | Qué verificar |
| :--- | :--- | :--- | :--- |
| **1. Estado de Servicios** | Abrir la terminal y mostrar `docker compose ps` | *"Aquí pueden observar los contenedores de MongoDB, MySQL y los servicios de aplicación corriendo en Docker."* | Estado `Up / Healthy` |
| **2. Pruebas Automatizadas** | Ejecutar `npm test` en `backend-node` | *"Antes de tocar la interfaz gráfica, validamos la solidez de la lógica de negocio con nuestra suite de pruebas unitarias y de integración."* | **27 tests passing (100% éxito)** |
| **3. Acceso con Roles (RBAC)** | Entrar a `http://localhost:3000` y usar el botón **"Demo Admin"** | *"El sistema cuenta con RBAC. El Administrador posee acceso total a la gestión de catálogo, auditoría, reportes y ajustes."* | Redirección inmediata al Dashboard con KPIs cargados |
| **4. Visualización y Métricas** | Mostrar el Dashboard | *"Recharts renderiza la distribución de artículos por categoría y la actividad mensual en tiempo real."* | Gráficos de barras y pastel responsivos |
| **5. Catálogo de Productos** | Ir a **Productos**, filtrar por categoría y búsqueda en vivo | *"La tabla cuenta con debounce de búsqueda, paginación y badges de advertencia de stock bajo."* | Búsqueda fluida sin recargar la página |
| **6. Entrada de Mercadería** | Ir a **Movimientos** > Botón **"Nueva Entrada"** > Cargar 20 unidades de un producto | *"Registramos una entrada con número de remisión. Al confirmar, el stock se actualiza atómicamente y se genera el asiento en el Kardex."* | Notificación de éxito y actualización del stock en tabla |
| **7. Prueba de Fuego: Control de Concurrencia y Stock Negativo** | Botón **"Nueva Salida"** > Intentar sacar 9999 unidades | *"Aquí demostramos la regla de negocio fundamental: el sistema bloquea cualquier salida que supere el stock físico actual."* | **Alerta en rojo: 'Stock insuficiente para completar la salida'** |
| **8. Alerta de Stock Bajo** | Registrar una salida válida que deje el stock por debajo del mínimo | *"Al cruzar el umbral del punto de reorden, el producto ingresa automáticamente a la vista de Alertas de Stock Bajo para compras urgentes."* | Aparece en la sección 'Stock Bajo' con su déficit |
| **9. Auditoría y Ajuste Físico** | Botón **"Ajuste de Auditoría"** | *"Un ajuste regulariza faltantes por rotura o desvíos de conteo. Exige obligatoriamente motivo formal y queda auditado con el usuario responsable."* | Asiento registrado con tipo 'Ajuste' y motivo |
| **10. Exportación de Reportes** | Ir a **Reportes** > Clic en **"Exportar CSV"** | *"Generamos reportes ejecutivos de valuación patrimonial y exportación nativa en formato CSV para análisis contable."* | Descarga inmediata del archivo `.csv` |
| **11. Centro de Ayuda WordPress** | Ir a **Centro de Ayuda** | *"Consumimos noticias y guías desde WordPress Headless vía REST API. Si el CMS no responde, el frontend activa su fallback con manuales locales."* | Artículos cargados con acordeones interactivos |
| **12. Swagger UI y OpenAPI** | Abrir `http://localhost:5000/api/v1/docs` en el navegador | *"Toda la API está formalmente documentada bajo el estándar OpenAPI 3.0 con Swagger UI interactivo."* | Interfaz Swagger interactiva con esquemas y modelos |

---

## 4. Tabla Rápida de Credenciales para la Presentación

| Perfil | Correo Electrónico | Contraseña | Capacidades Demostrables |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@stockmaster.com` | `Admin1234!` | Acceso total, creación de productos, ajuste de stock, reportes y configuración. |
| **Operario** | `operario@stockmaster.com` | `Operario1234!` | Registro de entradas y salidas diarias, consulta de catálogo y movimientos. Sin acceso a ajustes ni borrado. |

---

## 5. Glosario Técnico de Términos Clave para Mencionar

* **Kardex:** Registro estructurado y cronológico de todas las entradas y salidas de un almacén para el seguimiento de costos y saldos.
* **Idempotencia:** Propiedad de una operación que produce exactamente el mismo efecto en el sistema sin importar cuántas veces se ejecute repetidamente.
* **Soft Delete:** Marcado lógico de un registro como inactivo (`deletedAt` o `status: 'inactivo'`) para evitar romper la integridad referencial y preservar la trazabilidad fiscal.
* **WiredTiger Lockless Concurrency:** Motor de almacenamiento de MongoDB que utiliza control de concurrencia optimista a nivel de documento sin bloquear la colección completa.
* **CORS (Cross-Origin Resource Sharing):** Mecanismo de seguridad del navegador que restringe qué orígenes externos pueden solicitar recursos a nuestra API REST.
* **Rate Limiting:** Técnica de protección contra denegación de servicio (DoS) y fuerza bruta que limita la cantidad de peticiones que una dirección IP puede realizar en una ventana de tiempo.
* **Persistencia Políglota:** Uso de diferentes tecnologías de bases de datos en una misma arquitectura empresarial, seleccionando la mejor herramienta para cada modelo de datos específico.
