# Panel Sintético de Opinión y Encuestas para Chile

## Visión del Producto

Plataforma de simulación de opinión pública que utiliza agentes sintéticos para:
- Simular encuestas de coyuntura
- Testear cuestionarios
- Comparar segmentos poblacionales
- Evaluar impacto de eventos noticiosos

## Objetivo Principal

Construir una población sintética chilena de 10.000 agentes donde cada agente tenga:
- Perfil demográfico (región, comuna, edad, educación, ingresos)
- Rasgos de personalidad (confianza institucional, aversión al riesgo, etc.)
- Memoria y contexto histórico
- Capacidad de responder encuestas de forma consistente

## Casos de Uso Iniciales (V1)

1. **Simular encuestas semanales de coyuntura**
   - Reproducir preguntas de encuestas reales (Cadem, CEP, etc.)
   - Comparar resultados sintéticos vs benchmarks reales

2. **Testear cuestionarios**
   - Validar formulación de preguntas
   - Detectar sesgos o ambigüedades

3. **Comparar segmentos**
   - Analizar diferencias por región, edad, educación, ingresos
   - Identificar patrones de opinión por grupo

4. **Evaluar impacto de eventos**
   - Modelar cómo noticias afectan la opinión
   - Simular escenarios "qué pasaría si"

## Qué NO es este producto (V1)

- ❌ **No es una encuesta real**: No reemplaza encuestas tradicionales
- ❌ **No es predicción electoral**: No promete predecir resultados electorales
- ❌ **No son agentes 24/7 vivos**: Agentes dormidos, activación por estudio
- ❌ **No es un juego**: El mundo AI Town es interfaz, no el núcleo
- ❌ **No deja decisiones al LLM**: El motor estructurado decide, LLM solo expresa

## Principios de Diseño

1. **Validación continua**: Comparación constante con benchmarks reales
2. **Bajo costo**: Agentes dormidos en DB, activación solo cuando se necesita
3. **Trazabilidad total**: Cada respuesta tiene auditoría completa
4. **Separación de responsabilidades**: Datos, simulación, memoria y visualización separados
5. **LLM controlado**: Solo para expresión natural, no para decisiones

## Métricas de Éxito V1

- [ ] 1.000-2.000 agentes sintéticos generados
- [ ] Rasgos y memoria persistida en Supabase
- [ ] Encuestas sintéticas ejecutables
- [ ] Comparación con 2-3 benchmarks reales (Cadem)
- [ ] Error absoluto promedio < 5 puntos porcentuales
- [ ] Dashboard básico de resultados funcional

## Roadmap de Fases

| Fase | Nombre | Entregable Principal |
|------|--------|---------------------|
| 0 | Redefinir producto | Este documento |
| 1 | Reordenar arquitectura | Diagrama + Supabase conectado |
| 2 | Modelo de datos | Schema SQL completo |
| 3 | Población sintética V1 | 1.000-2.000 agentes |
| 4 | Personalidad de agentes | Rasgos generados |
| 5 | Motor de eventos | Pipeline de noticias |
| 6 | Motor de encuestas | Survey engine funcional |
| 7 | Validación | Comparación con Cadem |
| 8 | Recalibración | Módulo de calibración |
| 9 | Frontend | Dashboard de resultados |
| 10 | Escala a 10.000 | Población nacional |

## Stakeholders y Usuarios

### Usuarios Primarios
- Analistas políticos
- Equipos de estrategia gubernamental
- Equipos de campaña
- Investigadores sociales
- Medios de comunicación

### Usuarios Secundarios
- Consultoras de opinión pública
- Think tanks
- Académicos

## Posicionamiento

> "Simulación calibrada de opinión pública chilena para análisis estratégico y validación de instrumentos de medición"

**No es**: "Predicción electoral" o "Encuesta real"

## Consideraciones Éticas

1. Transparencia sobre naturaleza sintética de los datos
2. No usar para manipulación política encubierta
3. Mantener metodología documentada y auditable
4. Validar constantemente con datos reales
5. Reconocer limitaciones explícitamente