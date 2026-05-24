# 🌌 Proyecto Omega | Senior Ecosystem

## 📚 Tabla de Contenidos

- [📋 Inicio](#inicio)
- [📚 Tabla de Contenidos](#tabla-de-contenidos)
- [🛠️ Stack Tecnológico](#stack-tecnológico)
- [🏗️ Arquitectura del Sistema](#arquitectura-del-sistema)
- [📦 Componentes](#componentes)
- [📝 Documentación](#documentación)
- [🚀 Ejecución](#ejecución)
- [🧪 Testing](#testing)
- [🛠️ Instalación](#instalación)
- [📝 Configuración](#configuración)
- [🤝 Colaboración](#colaboración)
- [📝 Licencia](#licencia)

## 📋 Inicio

Proyecto Omega es un ecosistema modular construido con Vanilla TypeScript y Tailwind CSS. El proyecto incluye un panel de monitoreo de mercado para criptomonedas, un sistema de temas persistente y una capa de servicios que consumen datos remotos de APIs externas.

## 🛠️ Stack Tecnológico

- TypeScript
- Vite
- Tailwind CSS v4
- Fetch API
- CoinGecko API
- Fake Store API
- Vitest (Testing Framework)

## 🏗️ Arquitectura del Sistema

La arquitectura de Proyecto Omega está pensada para ser modular y fácil de mantener.

- **Service-Mapper Pattern**: separa la obtención de datos de su transformación y uso en la UI.
- **UI Composition**: `src/main.ts` orquesta la carga del layout, los estados de carga y la renderización de la tabla.
- **Theme Management**: servicio de tema con persistencia en `localStorage`.

## 📦 Componentes

- `themeService`: control de temas y persistencia de configuración.
- `CryptoService`: servicio responsable de obtener y normalizar los datos de CoinGecko.
- `ProductService`: servicio de simulación de catálogo que consume Fake Store API.
- `TaskService`: servicio para gestión de tareas con persistencia.
- `CryptoMapper` / `ProductMapper` / `TaskMapper`: transformación de DTOs a modelos de dominio.
- `storage`: abstracción simple sobre `localStorage`.
- **Tests**: cobertura de pruebas unitarias para mappers (CryptoMapper, ProductMapper, TaskMapper) usando Vitest.

## 📝 Documentación

La documentación del proyecto se apoya en los comentarios del código fuente y la estructura de carpetas de `src`. Los principales puntos de interés son:

- `src/main.ts`: orquestación de la aplicación.
- `src/services`: lógica de datos y gestión de temas.
- `src/mappers`: conversión de DTOs a modelos de dominio.
- `src/interfaces`: contratos de datos para la aplicación.

## 🚀 Ejecución

1. Clonar el repositorio: `git clone https://
2. Compilar para producción: `npm run build`

## 🧪 Testing

El proyecto incluye pruebas unitarias para los mappers principales usando **Vitest**.

- **Ejecutar tests**: `npm run test`
- **Tests incluidos**:
  - `src/mappers/crypto.mapper.test.ts`: pruebas para el mapper de criptomonedas
  - `src/mappers/product.mapper.test.ts`: pruebas para el mapper de productos
  - `src/mappers/task.mapper.test.ts`: pruebas para el mapper de tareas

Los tests validan la transformación correcta de DTOs a modelos de dominio, asegurando la integridad de los datos en la capa de presentación.github.com/Joseph160997/Proyecto-Omega.git`2. Instalar dependencias:`npm install`3. Ejecutar en modo desarrollo:`npm run dev`

## 🛠️ Instalación

1. Clonar el repositorio: `git clone https://github.com/Joseph160997/Proyecto-Omega.git`
2. Instalar dependencias: `npm install`

## 📝 Configuración

1. `src/main.ts`: ajusta la composición del dashboard y los módulos de interfaz.
2. `src/services/theme.ts`: personaliza los temas disponibles y la persistencia.
3. `src/services/crypto.services.ts`: modifica la configuración de la API de CoinGecko.
4. `src/services/product.services.ts`: ajusta la simulación de productos y el consumo de Fake Store API.

## 🤝 Colaboración

Las contribuciones son bienvenidas. Puedes colaborar mediante issues o pull requests, especialmente para ampliar módulos de mercado, inventario simulado o mejorar la experiencia de usuario.

## 📝 Licencia

Este proyecto está publicado bajo la licencia MIT. Consulta el archivo `LICENSE` para ver los términos completos de uso, modificación y distribución.
