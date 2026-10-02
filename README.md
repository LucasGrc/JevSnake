# Jev Snake 🐍

Un juego autónomo de Snake en Canvas impulsado por **TypeSafe System One** y el modelo **Jev** (`jev-latest`), construido con **Next.js (App Router)**, **TypeScript** y **Tailwind CSS**.

---

## 🚀 Características

- **Toma de decisiones por turnos con IA**: En cada tick, el modelo **Jev** de TypeSafe evalúa el estado del juego y elige la mejor dirección (`up`, `down`, `left`, `right`).
- **Estado semántico en lenguaje natural**: Cero coordenadas crudas. El modelo recibe orientación relativa hacia la comida (e.g. *"arriba y a la derecha"*) y el estado clasificado de las casillas vecinas (*libre*, *pared*, *cuerpo*).
- **El código tiene la última palabra (Modo Seguro)**: Si Jev sugiere un movimiento que causaría una colisión mortal, el código interviene automáticamente, selecciona la siguiente opción segura con mayor probabilidad y lo destaca en pantalla con una alerta visual de *"Corregido por el código"*.
- **Visualización dinámica de probabilidades y confianza**:
  - Cuatro flechas alrededor de la cabeza de la serpiente cuyo tamaño y opacidad reflejan la distribución de probabilidades en tiempo real.
  - Halo/aura de confianza proporcional al `confidence` retornado por Jev.
- **Panel de telemetría y métricas**:
  - Puntaje actual y récord.
  - Latencia por movimiento, promedio y gráfico **Sparkline**.
  - Costo acumulado en USD calculado a **$0.043 por millón de tokens de entrada**.
  - Log interactivo de decisiones (estado -> elección -> probabilidades -> intervenciones).
  - Modal **"Ver JSON"** para inspeccionar las peticiones y respuestas exactas a TypeSafe.
- **Controles**:
  - Play / Pausa.
  - Modo Paso a Paso.
  - Reinicio.
  - Modo manual con teclado (Flechas / WASD) para comparar el rendimiento humano vs Jev.
  - Interruptor de Modo Seguro.
  - Slider de retardo adicional.

---

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript (Strict typing, 0 `any`)
- **Estilos**: Tailwind CSS
- **Motor de IA**: [TypeSafe AI](https://typesafe.ai) (System One - `jev-latest`)
- **Iconos**: Lucide React

---

## ⚙️ Instalación y Uso

1. **Clonar el repositorio**:
   ```bash
   git clone git@github.com:LucasGrc/JevSnake.git
   cd JevSnake
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   Crea un archivo `.env.local` en la raíz del proyecto:
   ```env
   TYPESAFE_APIKEY=tu_api_key_de_typesafe
   ```
   *(Si no configuras una clave, el juego incluye un fallback semántico local para poder probar toda la interfaz y mecánicas).*

4. **Iniciar en desarrollo**:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

5. **Compilar para producción**:
   ```bash
   npm run build
   npm run start
   ```

---

## 📄 Licencia

MIT
