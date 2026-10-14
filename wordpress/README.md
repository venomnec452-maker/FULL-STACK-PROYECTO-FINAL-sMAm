# WordPress Headless — Centro de Ayuda y Manuales de StockMaster

## 1. Rol en la Arquitectura
WordPress actúa como un **CMS desacoplado (Headless)**. Esto significa que:
* **No se utiliza el frontend de temas tradicionales de WordPress (PHP/HTML).**
* Se aprovecha el panel editorial (`/wp-admin`) para que el equipo de soporte o administración redacte noticias, tutoriales y procedimientos operativos.
* **El Frontend en React** consume exclusivamente los datos en formato JSON mediante la **WordPress REST API** (`/wp-json/wp/v2/posts`).

---

## 2. Puesta en Marcha con Docker Compose
El CMS y su base de datos dedicada se inician automáticamente:
```powershell
docker compose up -d wordpress-db wordpress
```

* **URL del CMS:** [http://localhost:8080](http://localhost:8080)
* **REST API pública:** [http://localhost:8080/wp-json/wp/v2/posts](http://localhost:8080/wp-json/wp/v2/posts)

---

## 3. Configuración de CORS
Para permitir que la SPA de React (puerto 3000) consulte la API de WordPress (puerto 8080), se incluye el plugin `enable-cors.php`. Puede copiarse a la carpeta `wp-content/mu-plugins/` para activación automática inmediata.

---

## 4. Tolerancia a Fallos y Resiliencia
Si el contenedor de WordPress se apaga o se encuentra en mantenimiento, la sección **Centro de Ayuda** de la aplicación React no se rompe: activa automáticamente su modo resiliente mostrando los manuales y preguntas frecuentes almacenados localmente en caché.
