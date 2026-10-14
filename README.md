StockMaster Full Stack

Sistema de Gestión de Depósito, Inventario y Control de Stock

StockMaster Full Stack es un proyecto académico de desarrollo web orientado a la gestión integral de depósitos e inventarios. Su objetivo es centralizar el control de productos, registrar los movimientos de stock y facilitar el seguimiento de las existencias mediante una aplicación web moderna, segura y escalable.

Objetivos del proyecto
Gestionar productos, categorías y proveedores.
Registrar entradas, salidas y ajustes de inventario.
Calcular y consultar las existencias actuales.
Mantener un historial de movimientos de stock.
Implementar autenticación y autorización mediante roles de usuario.
Incorporar búsquedas, filtros, paginación y reportes.
Integrar diferentes tecnologías mediante APIs RESTful.
Facilitar el despliegue y la configuración del entorno mediante Docker.
Tecnologías previstas
Frontend: React, JavaScript, HTML y CSS.
Backend principal: Node.js y Express.
Base de datos NoSQL: MongoDB.
Backend complementario: Laravel y PHP.
Base de datos relacional: MySQL.
CMS Headless: WordPress y su API REST.
Contenedores: Docker y Docker Compose.
Control de versiones: Git y GitHub.
Módulos principales
Autenticación y gestión de usuarios.
Administración de productos y categorías.
Gestión de proveedores.
Control de entradas y salidas de inventario.
Historial de movimientos y ajustes de stock.
Dashboard y reportes.
Integración de servicios mediante APIs RESTful.
Gestión complementaria de compras y recepción de mercaderías.
Centro de ayuda y documentación mediante WordPress Headless.
Arquitectura

El sistema está planteado con una arquitectura modular, donde React se encarga de la interfaz de usuario y Node.js con Express administra la API principal y las operaciones de inventario. MongoDB almacena los datos operativos, mientras que Laravel y MySQL proporcionan funcionalidades complementarias. WordPress se utiliza como gestor de contenidos independiente.

Estado del proyecto

Proyecto académico en desarrollo. La implementación se realizará progresivamente por módulos, incluyendo pruebas, documentación y preparación para el despliegue.

Propósito académico

Aplicar conocimientos de desarrollo Full Stack, programación JavaScript, diseño e integración de APIs RESTful, bases de datos relacionales y NoSQL, autenticación, seguridad web, control de versiones y contenedores.

---

## 5. Puesta en Marcha Rápida (Entorno de Desarrollo)

### Paso 1: Clonar y configurar variables de entorno
```powershell

Copy-Item .env.example .env
```

### Paso 2: Ejecución de Bases de Datos con Docker
Para iniciar las bases de datos (MongoDB y MySQL) en segundo plano:
```powershell
docker compose up -d mongodb mysql
```

---

## 6. Estructura del Repositorio

* `frontend/`: Cliente React SPA con Vite.
* `backend-node/`: API RESTful Node.js + Express.
* `backend-laravel/`: Servicio complementario de compras en Laravel.
* `wordpress/`: Archivos y configuración de WordPress Headless.
* `docker/`: Dockerfiles y plantillas de configuración de contenedores.
* `docs/`: Documentación académica, diagramas Mermaid y especificaciones OpenAPI.
* `postman/`: Colección de pruebas de endpoints.
* `scripts/`: Scripts de inicialización y carga de datos de prueba (seeds).
