# NexusCase-Systems

> **Sistema de Gestión de Casos** — plataforma para administrar el ciclo de vida completo de un caso: titular, familiares, encuestas, expediente digital y generación automática de documentos legales.

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-FE0902?style=flat&logo=typeorm&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)

---

## 📋 Descripción

**NexusCase-Systems** es una aplicación web para la gestión integral de casos. Permite a un equipo registrar el titular de un caso, asociar familiares, levantar una encuesta única, construir un expediente digital y **generar documentos legales (`.docx`) de forma automática** a partir de plantillas, con un flujo de aprobación y control de versiones.

El sistema está organizado alrededor del **ciclo de vida del caso**: cada caso nace como *Nuevo*, avanza según la documentación y las acciones del operador, y puede cancelarse o finalizarse de forma controlada.

---

## ✨ Funcionalidades

- **Autenticación y roles** — inicio de sesión y control de acceso por perfil de usuario.
- **Gestión de casos** — creación, búsqueda y seguimiento de casos con código único (`CAS-…`).
- **Ciclo de vida del caso** — estados del caso (nuevo, en proceso, finalizado, cancelado) y acciones controladas (finalizar, cancelar, override manual).
- **Titular y familiares** — registro del titular del caso y de sus familiares asociados.
- **Encuesta única** — levantamiento de información que puede generar documentos requeridos de forma automática.
- **Expediente digital** — repositorio de documentos por caso con estados (pendiente, cargado, aprobado, rechazado) y **control de versiones**.
- **Generación de documentos** — creación de archivos `.docx` (poderes y otros) a partir de plantillas, rellenando datos del caso, el titular y el firmante.
- **Tipos de documento** — catálogo de documentos requeridos según el flujo del caso.
- **Tablero de indicadores** — métricas operativas para el seguimiento diario.

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Framework backend | [NestJS](https://nestjs.com/) |
| Lenguaje | TypeScript |
| ORM / Base de datos | [TypeORM](https://typeorm.io/) sobre base de datos relacional |
| Generación de documentos | [docxtemplater](https://docxtemplater.com/) + [PizZip](https://github.com/open-xml-templating/pizzip) |
| Carga de archivos | Multer |
| Autenticación | JWT + Guards de NestJS |

---

## 🧩 Estructura de módulos

El backend está dividido por dominio, siguiendo la arquitectura modular de NestJS:

```
src/
├── auth/             # Autenticación y autorización (login, roles, guards)
├── users/            # Usuarios y operadores del sistema
├── cases/            # Núcleo: creación y gestión de casos
├── case-lifecycle/   # Estados y transiciones del ciclo de vida del caso
├── relatives/        # Familiares asociados al titular del caso
├── surveys/          # Encuesta única
├── documents/        # Expediente digital y generación de documentos
├── document-types/   # Catálogo de tipos de documento requeridos
└── templates/        # Plantillas .docx para generación documental
```

---

## 📄 Generación de documentos

El módulo `documents` genera archivos `.docx` a partir de plantillas:

1. Las plantillas viven en `src/templates/` y usan marcadores con delimitadores **`[[ ]]`** (ej. `[[nombre_cliente]]`, `[[fecha_actual]]`).
2. El servicio carga la plantilla, mapea los datos del caso (titular, firmante, familiares, operador) y rellena los marcadores con `docxtemplater`.
3. El documento generado se guarda en `uploads/generated/` y queda registrado en el expediente del caso con estado **Aprobado** y su versión correspondiente.

> Para agregar una nueva plantilla, basta con crear el `.docx` correspondiente en `src/templates/` con los marcadores `[[ ]]` deseados.

---

## 🚀 Puesta en marcha

### Requisitos previos

- Node.js (versión LTS recomendada)
- Una base de datos relacional compatible con TypeORM
- npm

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/<tu-usuario>/NexusCase-Systems.git
cd NexusCase-Systems/backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# (edita el .env con tus credenciales)

# 4. Levantar en modo desarrollo
npm run start:dev
```

### Variables de entorno (ejemplo)

```env
PORT=3000

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=tu_usuario
DATABASE_PASSWORD=tu_password
DATABASE_NAME=nexuscase

JWT_SECRET=tu_secreto
JWT_EXPIRES_IN=1d
```

---

## 📜 Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run start:dev` | Inicia el servidor en modo desarrollo con recarga automática |
| `npm run build` | Compila el proyecto a `dist/` |
| `npm run start:prod` | Ejecuta la versión compilada |
| `npm run test` | Ejecuta las pruebas |

---

## 👤 Autor

Desarrollado por **[Julian Silva]**.