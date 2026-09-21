# ⚡ Pulso — Sistema Personal de Hábitos y Tareas

**Pulso** es un sistema inteligente, visual y de alto rendimiento para la gestión diaria de estudio y productividad personal. Desarrollado con la filosofía de *"cero fricción y máximo enfoque"*, reemplaza la complejidad y lentitud de Notion con una experiencia fluida, motivadora, basada en datos en tiempo real y arquitectura de clase producción.

---

## 🎯 Problema y Solución

* **El problema:** Mantener listas tradicionales de tareas en Notion resulta tedioso, no ofrece visibilidad sobre el porcentaje real de avance diario ni semanal, carece de incentivos visuales para mantener el ritmo y sufre de latencia en la carga.
* **La solución:** **Pulso** unifica tareas puntuales y hábitos diarios en una vista diaria inteligente ("Hoy"), calculando automáticamente 3 métricas clave (porcentaje de cumplimiento diario, rachas o *streaks* e indicador semanal) aisladas por usuario de forma 100% segura.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend** | Vanilla JavaScript (ES6 Modules) | Arquitectura modular nativa, ultra ligera y sin frameworks ni bundlers pesados |
| **Estilos** | Vanilla CSS3 | Design system personalizado con variables CSS, tokens de diseño y dark mode elegante |
| **BaaS / Backend** | [Supabase](https://supabase.com/) | Autenticación JWT, Base de datos PostgreSQL y Row Level Security (RLS) |
| **Métricas en Backend** | Supabase Views & RPC (PL/pgSQL) | Cálculo procedimental de rachas e indicadores porcentuales directamente en la base de datos |
| **Visualización** | Chart.js | Gráficas dinámicas e interactivas de rendimiento en tiempo real |
| **Mobile / App** | Service Worker + Manifest (PWA) | Aplicación web progresiva instalable en móvil y escritorio en modo `standalone` |
| **Utilidades** | Client-Side Date Utils | Manejo estricto de fechas locales `DATE` (`YYYY-MM-DD`) sin desajustes por zona horaria UTC |

---

## 📂 Estructura del Proyecto

```text
pulso/
├── index.html              # Punto de entrada principal de la SPA (Dashboard + Pestañas)
├── manifest.json           # Configuración PWA (instalabilidad y temas)
├── sw.js                   # Service Worker PWA (caché de recursos estáticos)
├── README.md               # Documentación técnica completa y arquitectura
├── checklist-pulso.md      # Ficha del proyecto y desglose de tickets ejecutados
├── assets/                 # Recursos estáticos e iconos PWA
│   └── icons/              # Iconos vectorial SVG (192px, 512px)
├── css/                    # Hojas de estilo organizadas
│   ├── main.css            # Design tokens, variables globales y reset
│   ├── components.css      # Componentes (cards, botones, modales, badges, RLS tags)
│   └── pages.css           # Estilos de layouts y enrutador SPA
├── js/                     # Lógica frontend en ES Modules nativos
│   ├── app.js              # Inicializador principal, enrutador SPA y estado de Auth
│   ├── config.js           # Cliente centralizado de Supabase
│   ├── utils/              # Funciones auxiliares
│   │   └── date.js         # Formateo y cálculo de fechas en zona horaria local (YYYY-MM-DD)
│   ├── services/           # Capa de servicios de datos (Supabase Client)
│   │   ├── categories.js   # CRUD de categorías (solo nombre y color)
│   │   ├── tasks.js        # CRUD de tareas (due_date y borrado físico)
│   │   ├── habits.js       # CRUD de hábitos (soft-delete archived_at)
│   │   ├── completions.js  # Registros diarios de habit_completions
│   │   └── metrics.js      # Consumo de funciones RPC SQL de Supabase
│   ├── components/         # Componentes interactivos de UI
│   │   ├── chart.js        # Wrapper gráfico dinámico con Chart.js
│   │   └── modals.js       # Modal flotante de creación (Tarea vs Hábito)
│   └── pages/              # Controladores de vistas
│       ├── today.js        # Vista unificada "Hoy" (Tareas + Hábitos + % Avance)
│       ├── manage.js       # Vista de administración CRUD (Editar, Archivar, Eliminar)
│       └── history.js      # Vista de Calendario / Historial por fecha pasada
└── supabase/               # Configuración SQL y backend
    ├── migrations/         # Scripts DDL y funciones procedimentales
    │   ├── 001_initial_schema.sql  # Estrategia de tablas, FKs e índices
    │   ├── 002_rls_policies.sql    # Activación de RLS y políticas por auth.uid()
    │   ├── 003_streak_rpc.sql      # Procedimiento almacendo de Rachas (PL/pgSQL)
    │   └── 004_metrics_rpc.sql     # Procedimientos de % Diario y % Semanal
    ├── seed.sql            # Datos iniciales para pruebas de desarrollo
    ├── test_rls.sql        # Script de verificación de aislamiento RLS de 2 cuentas
    ├── test_streak.sql     # Script de verificación de algoritmo de racha
    └── test_metrics.sql    # Script de verificación de indicadores porcentuales
```

---

## 📐 Decisiones de Arquitectura y Diseño

### 1. Aislamiento de Datos Multi-usuario (RLS):
La seguridad está garantizada a nivel de motor de base de datos PostgreSQL en Supabase usando **Row Level Security (RLS)**. Cada consulta valida implícitamente `auth.uid() = user_id`. Ninguna cuenta puede leer ni alterar los registros de otra, incluso si intenta realizar llamadas API directas.

### 2. Manejo de Fechas sin Desfase de Zona Horaria (`YYYY-MM-DD`):
Las fechas de cumplimiento se determinan en el cliente según la zona horaria local del navegador y se envían a la base de datos como tipo `DATE` (`YYYY-MM-DD`). Se evita derivar fechas desde `now()` en el servidor para prevenir desajustes (UTC vs Hora Local).

### 3. Registro Histórico de Hábitos sin Cron Jobs:
Cada cumplimiento de hábito se almacena como una entrada individual `(habit_id, completed_date, completed = true)`. Esto elimina la necesidad de tareas programadas (cron jobs) para "reiniciar" hábitos a medianoche: un nuevo día simplemente no tiene registro aún.

### 4. Algoritmo Procedimental de Rachas (*Streaks*) en SQL RPC:
En lugar de descargar miles de filas al frontend, la racha consecutiva se evalúa mediante una función RPC en PL/pgSQL (`get_habit_streak`). Si el hábito se completó hoy o ayer, la racha se mantiene activa acumulando días anteriores consecutivos; si el último completado fue antes de ayer, la racha devuelve `0` automáticamente.

### 5. Persistencia Histórica vs Limpieza:
- **Hábitos:** Utilizan *Soft-delete* (`archived_at`) para conservar el historial de racha (*streaks*) incluso si un hábito deja de practicarse.
- **Tareas:** Permiten borrado físico (`DELETE`), ya que su ciclo de vida concluye al completarse.

### 6. PWA Instalable (Web-First):
Incluye soporte PWA (`manifest.json` + `sw.js`) con estrategia *Network-First* para comportarse como una aplicación nativa en dispositivos móviles (iOS / Android) y de escritorio en modo `standalone`.

---

## 🚀 Guía de Instalación Local y Despliegue

### 1. Clonar el repositorio
```bash
git clone https://github.com/Carlosnm0802/pulso.git
cd pulso
```

### 2. Configurar la Base de Datos en Supabase
1. Crea un proyecto en [Supabase](https://supabase.com/).
2. Ve al **SQL Editor** de Supabase y ejecuta en orden las migraciones ubicadas en `supabase/migrations/`:
   - `001_initial_schema.sql` (Crea las 4 tablas e índices)
   - `002_rls_policies.sql` (Activa la seguridad RLS)
   - `003_streak_rpc.sql` (Crea las funciones de racha)
   - `004_metrics_rpc.sql` (Crea las funciones de métricas)

### 3. Configurar Credenciales en Frontend
Abre `js/config.js` y coloca las credenciales de tu proyecto (Settings -> API):
```javascript
export const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
export const SUPABASE_ANON_KEY = 'tu-publishable-key-aqui';
```

### 4. Ejecutar Localmente
Al usar ES Modules nativos (`type="module"`), sirve la carpeta con cualquier servidor local HTTP:
```bash
npx serve .
# o usa Live Server en VS Code
```

---

## 📄 Licencia

Desarrollado con dedicación por **Carlos Nares** como proyecto de portafolio personal.
