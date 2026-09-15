# Checklist de Proyecto de Portafolio — Pulso

## 0. Ficha del proyecto

- **Nombre del proyecto:** Pulso
- **Repo (kebab-case):** `pulso`
- **Problema que resuelve:** El sistema actual en Notion (lista de tareas que se va marcando) es tedioso de mantener, no permite saber cuánto se avanza/cumple por día, y no tiene diseño visual que motive a usarlo.
- **Quién lo usaría:** Carlos, para su sistema de estudio diario. Diseñado desde el inicio como multi-usuario (cuentas y datos aislados), aunque el único usuario real por ahora es él mismo.
- **Stack a usar:** Vanilla JS + Supabase, más Chart.js (gráficas), Supabase Views/RPC en SQL (cálculo de métricas en backend), Row Level Security — RLS (aislamiento de datos por usuario), Service Worker + Web App Manifest (PWA instalable), date-fns (manejo de fechas).
- **Criterio de "terminado":**
  1. CRUD funcional de tareas y hábitos, claramente diferenciados
  2. Autenticación real con datos aislados por cuenta
  3. Vista "hoy" unificada (tareas + hábitos del día en un solo lugar)
  4. Los 3 indicadores calculados y visibles, con al menos una gráfica
  5. Diseño cuidado (no una tabla cruda)
  6. Instalable como PWA y desplegada en una URL real (no solo localhost)
  7. README con decisiones técnicas, listo para portafolio
  8. Categorías por materia/proyecto asignables a tareas y hábitos
  9. Probado con una segunda cuenta que no puede ver datos de la primera (verificación explícita de RLS)

---

## Fase 1 — Define solo, sin LLM

- [x] Escribí a mano/en doc el problema y quién lo usa
- [x] Dibujé un borrador (feo está bien) de arquitectura o flujo de pantallas
- [x] Listé las tecnologías que quiero aprender/demostrar
- [x] Definí criterios de éxito

### Boceto de flujo de pantallas

1. **Login / registro**
2. **Pantalla principal** — los 3 indicadores en una sola vista:
   - % de tareas completadas ese día
   - Racha (streak) de días cumplidos por hábito
   - % de cumplimiento de la semana pasada
3. **Lista de tareas/hábitos** — diferenciados visualmente entre sí; botones de crear, editar y eliminar por registro
4. **Formulario de creación** — diferencia tarea vs. hábito (sin campo de prioridad en v1)
5. **Calendario / historial** — qué tareas/hábitos se completaron cada día

### Decisiones adicionales de alcance (para no perderlas)

- El tracking de sesiones de Pomodoro **queda fuera de alcance** de este proyecto.
- Los hábitos en v1 son **todos diarios** (sin selección de días específicos por hábito).
- **No hay botón de "reiniciar progreso del día" ni cron de reinicio automático**: cada registro de cumplimiento se guarda como `(hábito_id, fecha, completado)`, así que un día nuevo simplemente no tiene registro todavía — no hace falta "reiniciar" nada.
- El campo de **prioridad** en tareas/hábitos se descarta de v1 y queda para v2.

---

## Fase 2 — LLM de planificación como auditor (no diseñador)

- [x] Usé el prompt de auditoría con el boceto de Pulso
- [x] Ajusté el borrador con el feedback (sin dejar que el LLM rediseñe todo)

### Huecos detectados y resueltos

| # | Hueco | Resolución |
|---|---|---|
| 1 | Zonas horarias / definición de "día" | Fecha calculada en el cliente (local), enviada como `DATE`; no se deriva de `now()` en el servidor |
| 2 | Denominador del % diario y semanal | Tareas + hábitos combinados en un solo porcentaje (diario y semanal) |
| 3 | Tareas sin completar en su fecha | Desaparecen de la vista "hoy" al pasar la fecha; el historial del calendario las conserva como no completadas en esa fecha pasada |
| 4 | Archivar vs. eliminar | Soft-delete (`archived_at`) para hábitos con historial; `DELETE` real aceptable para tareas sin historial de streak |
| 5 | Prueba de RLS | Se agrega como ítem explícito del criterio de "terminado" (punto 9) |
| 6 | Categorías | Sí, en v1, por materia/proyecto — se agrega como criterio de "terminado" (punto 8) |
| — | Offline (detectado como riesgo de scope, no como hueco) | Explícito en README desde v1: "PWA instalable para experiencia de app nativa; requiere conexión, sin soporte offline en v1" |

---

## Regla de oro

**Si no lo puedes explicar en una entrevista, no lo pusiste tú.**
