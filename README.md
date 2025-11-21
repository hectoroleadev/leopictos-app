# LeoPictos - Generador de Pictogramas con IA

Aplicación web diseñada para ayudar a niños con autismo (como Leonel) mediante la generación de pictogramas estilo PECS utilizando Inteligencia Artificial Generativa (Google Gemini) y síntesis de voz (TTS).

## 🏗 Arquitectura del Proyecto

Este proyecto utiliza una **Arquitectura por Capas (Layered Architecture)** en React para garantizar escalabilidad, mantenibilidad y separación de responsabilidades.

### Estructura de Carpetas

```
src/
├── components/      # Átomos y moléculas de UI reutilizables (Botones, Cards, Modales)
│   └── layout/      # Componentes estructurales (Header, Layout principal)
├── context/         # Inyección de dependencias y estado global (Context API)
├── hooks/           # Lógica de negocio reutilizable (Custom Hooks)
├── pages/           # [CONTENEDORES] Rutas de la aplicación. Conectan URL -> Vista
├── reducers/        # Lógica de estado compleja y predecible (Patrón Reducer)
├── services/        # [CAPA DE SERVICIOS] Comunicación con APIs externas (Gemini, AWS)
├── types/           # Definiciones de tipos TypeScript (Interfaces, Enums)
├── views/           # [VISTAS] Contenido visual de las páginas. UI pura.
├── App.tsx          # Enrutador principal y proveedores de contexto
└── index.tsx        # Punto de entrada
```

### Patrones de Diseño Implementados

1.  **Container/View Pattern (Página/Vista):**
    *   **`pages/` (Container):** Maneja la lógica de ruta, SEO y parámetros de URL.
    *   **`views/` (View):** Maneja la presentación visual y la interacción del usuario. Esto permite reutilizar la vista "Home" en otros contextos si fuera necesario.

2.  **Service Layer Pattern:**
    *   Toda la lógica externa (llamadas a Gemini AI, subidas a S3) está aislada en `services/`. Los componentes de React nunca llaman a `fetch` directamente, llaman a un servicio.

3.  **Context + Reducer:**
    *   Utilizamos `useReducer` para gestionar el estado de los pictogramas (CRUD complejo) y `Context` para distribuir ese estado a través del árbol de componentes sin "prop drilling".

## 🚀 Tecnologías Clave

*   **Frontend:** React 19, TypeScript, Vite (implícito).
*   **Estilos:** Tailwind CSS (Soporte Dark Mode nativo).
*   **AI & Audio:** Google Gemini API (`gemini-2.5-flash-image` para imágenes, `gemini-2.5-flash-preview-tts` para voz).
*   **Iconos:** Lucide React.
*   **Almacenamiento:** AWS S3 (Integración vía URLs firmadas).

## 🛠 Configuración

El proyecto requiere una API Key de Google Gemini inyectada vía variables de entorno para funcionar correctamente.

```env
API_KEY=tu_api_key_de_google
```

## ✨ Funcionalidades

1.  **Generación de Pictogramas:** Crea imágenes estilo PECS (simple, fondo blanco, líneas gruesas) a partir de texto.
2.  **Síntesis de Voz (TTS):** Genera audio en español latinoamericano para cada pictograma.
3.  **Tira de Frases:** Permite seleccionar varios pictogramas para formar una oración y reproducirla secuencialmente.
4.  **Modo Edición:** Permite renombrar o eliminar pictogramas existentes.
5.  **Modo Oscuro/Claro:** Adaptabilidad visual.
