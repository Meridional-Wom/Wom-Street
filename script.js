const CODIGO_LIDER = "WSCHILOE2026";
const API_URL = "https://script.google.com/macros/s/AKfycbxP2L869vhRVma1iNcwDEY8sV8X7OunPWuve4ot0BDr3v9fJFZmvhvZWjo2suF3cJsKdw/exec";

const META_EJECUTIVO = 33;
const META_GRUPAL = 131;

let datos = {};

function ocultarLoader(){
  const loader = document.getElementById("loader");
  if(loader){
    loader.style.opacity = "0";
    setTimeout(() => loader.remove(), 500);
  }
}

setTimeout(() => ocultarLoader(), 10000);

async function iniciar(){
  try{
    const res = await fetch(API_URL + "?t=" + Date.now());
    const data = await res.json();
    datos = transformarDatos(data);
    renderTodo();
  }catch(error){
    console.error("Error al cargar datos:", error);
    alert("No se pudieron cargar los datos desde Google Sheets.");
  }finally{
    ocultarLoader();
  }
}

async function actualizarDatos(){
  const boton = document.querySelector(".refresh-btn");
  if(boton){
    boton.textContent = "⏳";
    boton.disabled = true;
  }

  try{
    const res = await fetch(API_URL + "?t=" + Date.now());
    const data = await res.json();
    datos = transformarDatos(data);
    renderTodo();
  }catch(error){
    console.error("Error al actualizar datos:", error);
    alert("No se pudieron actualizar los datos.");
  }finally{
    if(boton){
      boton.textContent = "🔄";
      boton.disabled = false;
    }
  }
}

function normalizar(texto){
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/\s+/g," ")
    .trim();
}

function obtener(obj, nombres){
  if(!obj) return "";
  const claves = Object.keys(obj);

  for(const nombre of nombres){
    const buscado = normalizar(nombre);
    const clave = claves.find(k => normalizar(k) === buscado);

    if(clave && obj[clave] !== "" && obj[clave] !== null && obj[clave] !== undefined){
      return obj[clave];
    }
  }

  return "";
}

function numero(valor){
  if(valor === "" || valor === null || valor === undefined) return 0;
  if(typeof valor === "string"){
    valor = valor.replace(",", ".").replace("%", "").trim();
  }
  const n = Number(valor);
  return isNaN(n) ? 0 : n;
}

function porcentajeDecimal(valor, meta){
  if(!meta || meta === 0) return 0;
  return Number(((valor / meta) * 100).toFixed(2));
}

function color(p){
  if(p >= 100) return "green";
  if(p >= 80) return "yellow";
  return "red";
}

function estado(p){
  if(p >= 100) return "Bueno";
  if(p >= 80) return "En progreso";
  return "En riesgo";
}

function fechaSoloDia(){
  const fecha = new Date();
  return fecha.toLocaleDateString("es-CL",{
    day:"2-digit",
    month:"2-digit",
    year:"numeric"
  });
}

function formatoFecha(){
  return fechaSoloDia();
}

function iniciales(nombre){
  const partes = String(nombre || "").trim().split(" ").filter(Boolean);
  if(partes.length === 0) return "W";
  if(partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
}

function mismoEjecutivo(a,b){
  const na = normalizar(a);
  const nb = normalizar(b);
  if(!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

function obtenerVentasDiaDesdeControl(data, equipo){
  const control = data.control_diario || data.controldiario || data.diario || [];
  const mapa = {};

  control.forEach(r => {
    const nombre = obtener(r, ["TEAM CHILOÉ","TEAM CHILOE","Ejecutivo","Usuario","Nombre"]);
    const ventas = numero(obtener(r, ["Ventas Día","Ventas Dia","Ventas día","Hoy","PP","Cantidad","Ventas"]));
    if(!nombre || ventas === 0) return;

    const ejecutivo = equipo.find(e => mismoEjecutivo(e.nombre, nombre));
    const key = ejecutivo ? ejecutivo.nombre : nombre;

    mapa[key] = (mapa[key] || 0) + ventas;
  });

  return mapa;
}

function transformarDatos(data){
  const dashboard = data.dashboard || {};

  let equipo = (data.equipo || []).map(e => ({
    nombre: obtener(e, ["TEAM CHILOÉ","TEAM CHILOE","Ejecutivo","Usuario","Nombre"]),
    ventas_dia: numero(obtener(e, ["Ventas Día","Ventas Dia","Ventas día","Hoy"])),
    mtd: numero(obtener(e, ["PP","Ventas MTD","MTD"])),
    meta: META_EJECUTIVO,
    observacion: obtener(e, ["Observación","Observacion"])
  })).filter(e => e.nombre);

  const ventasPorControl = obtenerVentasDiaDesdeControl(data, equipo);

  equipo = equipo.map(e => ({
    ...e,
    ventas_dia: ventasPorControl[e.nombre] !== undefined ? ventasPorControl[e.nombre] : e.ventas_dia
  }));

  const ventasDiaEquipo = equipo.reduce((total, e) => total + e.ventas_dia, 0);
  const ventasMTDEquipo = equipo.reduce((total, e) => total + e.mtd, 0);

  const dashboardFinal = {
    ventas_dia: numero(obtener(dashboard, ["Ventas día","Ventas Día","Ventas dia","Ventas Dia"])),
    meta_dia: numero(obtener(dashboard, ["Meta día","Meta Día","Meta dia","Meta Dia"])),
    ventas_mtd: numero(obtener(dashboard, ["Ventas MTD","MTD","Ventas acumuladas","TOTAL"])),
    meta_mes: META_GRUPAL,
    deberian_llevar: numero(obtener(dashboard, ["Deberían llevar","Deberian llevar","DEBERIAN LLEVAR"]))
  };

  if(dashboardFinal.ventas_dia === 0 && ventasDiaEquipo > 0){
    dashboardFinal.ventas_dia = ventasDiaEquipo;
  }

  if(dashboardFinal.ventas_mtd === 0 && ventasMTDEquipo > 0){
    dashboardFinal.ventas_mtd = ventasMTDEquipo;
  }

  if(dashboardFinal.meta_dia === 0){
    dashboardFinal.meta_dia = 8;
  }

  if(dashboardFinal.deberian_llevar === 0){
    dashboardFinal.deberian_llevar = 66;
  }

  return {
    ultima_actualizacion: obtener(dashboard, [
      "Última actualización",
      "Ultima actualización",
      "Actualización",
      "Fecha actualización"
    ]),
    dashboard: dashboardFinal,
    equipo: equipo,

    avisos:(data.avisos || []).map(a => ({
      titulo: obtener(a, ["Título","Titulo"]),
      descripcion: obtener(a, ["Descripción","Descripcion"])
    })).filter(a => a.titulo || a.descripcion),

    recursos:(data.links || data.recursos || []).map(l => ({
      nombre: obtener(l, ["Nombre","Título","Titulo"]),
      categoria: obtener(l, ["Categoría","Categoria","Tipo","Descripción","Descripcion"]),
      url: obtener(l, ["URL","Link"]) || "#"
    })).filter(l => l.nombre),

    rutas:(data.rutas || []).map(r => ({
      dia: obtener(r, ["Día","Dia","Fecha"]),
      sector: obtener(r, ["Sector"]),
      responsable: obtener(r, ["Responsable"])
    })).filter(r => r.dia || r.sector),

    reembolsos:(data.reembolsos || []).map(r => ({
      ejecutivo: obtener(r, ["Ejecutivo"]),
      monto: obtener(r, ["Monto"]),
      estado: obtener(r, ["Estado"])
    })).filter(r => r.ejecutivo || r.monto)
  };
}

function mostrar(id){
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  const seccion = document.getElementById(id);

  if(seccion){
    seccion.classList.add("active");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  document.querySelectorAll(".nav button").forEach(b => b.classList.remove("active"));
  const boton = document.querySelector(`.nav button[onclick="mostrar('${id}')"]`);
  if(boton) boton.classList.add("active");
}

function validarCodigo(){
  const codigo = document.getElementById("codigo").value.trim();
  const error = document.getElementById("error");

  if(codigo === CODIGO_LIDER){
    document.getElementById("loginLider").classList.add("hidden");
    document.getElementById("panelLider").classList.remove("hidden");
    error.textContent = "";
  }else{
    error.textContent = "Código incorrecto";
  }
}

function calcular(){
  const d = datos.dashboard;

  d.gap_dia = d.ventas_dia - d.meta_dia;
  d.avance_meta = porcentajeDecimal(d.ventas_mtd, d.meta_mes);
  d.proyeccion = porcentajeDecimal(d.ventas_mtd, d.deberian_llevar);
  d.gap = d.ventas_mtd - d.deberian_llevar;

  const cantidad = datos.equipo.length || 1;
  const deberianIndividual = d.deberian_llevar / cantidad;

  datos.equipo.forEach(e => {
    e.meta = META_EJECUTIVO;
    e.avance_meta = porcentajeDecimal(e.mtd, META_EJECUTIVO);
    e.proyeccion = porcentajeDecimal(e.mtd, deberianIndividual);
    e.gap = Number((e.mtd - deberianIndividual).toFixed(1));
    e.estado_dia = e.ventas_dia > 0 ? "Con venta" : "Sin venta";
  });

  datos.equipo.sort((a,b) => b.mtd - a.mtd);
}

function renderTodo(){
  calcular();
  renderHeader();
  renderKpisDia();
  renderAvanceDiarioIndividual();
  renderTeamChiloe();
  renderDesempenoMensual();
  renderAvisos();
  renderRecursos();
  renderPrivado();
}

function renderHeader(){
  const el = document.getElementById("ultimaActualizacion");
  if(el){
    el.textContent = "Actualizado: " + formatoFecha(datos.ultima_actualizacion);
  }
}

function renderKpisDia(){
  const d = datos.dashboard;
  const kpisDia = document.getElementById("kpisDia");
  if(!kpisDia) return;

  kpisDia.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-icon kpi-purple">🛍️</div>
      <div>
        <div class="kpi-title">Ventas Día</div>
        <div class="kpi-value">${d.ventas_dia}</div>
      </div>
    </div>

    <div class="kpi-card">
      <div class="kpi-icon kpi-pink">🎯</div>
      <div>
        <div class="kpi-title">Meta Día</div>
        <div class="kpi-value">${d.meta_dia}</div>
      </div>
    </div>

    <div class="kpi-card">
      <div class="kpi-icon kpi-yellow">📊</div>
      <div>
        <div class="kpi-title">Diferencia</div>
        <div class="kpi-value ${d.gap_dia < 0 ? "negative" : ""}">${d.gap_dia}</div>
      </div>
    </div>
  `;
}

function renderAvanceDiarioIndividual(){
  const contenedor = document.getElementById("avanceDiarioIndividual");
  if(!contenedor) return;

  contenedor.innerHTML = datos.equipo.map(e => `
    <div class="daily-card">
      <div class="avatar">${iniciales(e.nombre)}</div>
      <div>
        <h4>${e.nombre}</h4>
        <p>Ventas del día</p>
        <strong>${e.ventas_dia}</strong>
      </div>
    </div>
  `).join("");
}

function renderTeamChiloe(){
  const contenedor = document.getElementById("teamChiloe");
  if(!contenedor) return;

  const d = datos.dashboard;

  contenedor.innerHTML = `
    <div class="summary-grid">
      <div class="summary-panel">
        <div class="summary-row"><span>🎯 Meta Grupal</span><strong>${d.meta_mes}</strong></div>
        <div class="summary-row"><span>🛍️ PP Actual</span><strong>${d.ventas_mtd}</strong></div>
        <div class="summary-row"><span>📊 % Avance Meta</span><strong>${d.avance_meta}%</strong></div>
      </div>

      <div class="summary-panel">
        <div class="summary-row"><span>📋 Deberían Llevar</span><strong>${d.deberian_llevar}</strong></div>
        <div class="summary-row"><span>📈 Proyección</span><strong>${d.proyeccion}%</strong></div>
        <div class="summary-row"><span>↕ GAP</span><strong class="${d.gap < 0 ? "negative" : ""}">${d.gap}</strong></div>
      </div>
    </div>
  `;
}

function ranking(n){
  if(n === 1) return "1";
  if(n === 2) return "2";
  if(n === 3) return "3";
  return String(n);
}

function renderDesempenoMensual(){
  const contenedor = document.getElementById("desempenoMensual");
  const cantidad = document.getElementById("cantidadEjecutivos");

  if(cantidad){
    cantidad.textContent = `(${datos.equipo.length} ejecutivos)`;
  }

  if(!contenedor) return;

  contenedor.innerHTML = datos.equipo.map((e, index) => {
    const estadoColor = color(e.proyeccion);

    return `
      <div class="executive-card ${estadoColor}-border">
        <div class="executive-top">
          <div class="executive-title">
            <div class="rank">${ranking(index + 1)}</div>
            <div>
              <h4>${e.nombre}</h4>
              <span class="badge ${estadoColor}">${estado(e.proyeccion)}</span>
            </div>
          </div>
        </div>

        <div class="metric-row"><span>Meta Individual</span><strong>${e.meta}</strong></div>
        <div class="metric-row"><span>PP Actual</span><strong>${e.mtd}</strong></div>
        <div class="metric-row"><span>% Avance Meta</span><strong>${e.avance_meta}%</strong></div>
        <div class="metric-row"><span>Proyección</span><strong>${e.proyeccion}%</strong></div>
      </div>
    `;
  }).join("");
}

function renderAvisos(){
  const contenedor = document.getElementById("avisosLista");
  if(!contenedor) return;

  contenedor.innerHTML = datos.avisos.map(a => `
    <div class="card">
      <h3>${a.titulo || "Aviso"}</h3>
      <p>${a.descripcion}</p>
    </div>
  `).join("");
}

function iconoRecurso(categoria){
  const c = normalizar(categoria);
  if(c.includes("pdf") || c.includes("documento")) return "📄";
  if(c.includes("imagen") || c.includes("campaña")) return "🖼️";
  if(c.includes("video") || c.includes("capacitacion")) return "▶️";
  if(c.includes("formulario")) return "📋";
  if(c.includes("reporte")) return "📊";
  return "🔗";
}

function renderRecursos(){
  const contenedor = document.getElementById("recursosLista");
  if(!contenedor) return;

  contenedor.innerHTML = datos.recursos.map(r => `
    <a class="resource-card" href="${r.url}" target="_blank">
      <div class="resource-left">
        <div class="resource-icon">${iconoRecurso(r.categoria)}</div>
        <div>
          <h3>${r.nombre}</h3>
          <p>${r.categoria || "Abrir recurso"}</p>
        </div>
      </div>
      <div class="resource-arrow">›</div>
    </a>
  `).join("");
}

function renderPrivado(){
  const liderEquipo = document.getElementById("liderEquipo");

  if(liderEquipo){
    liderEquipo.innerHTML = datos.equipo.map(e => `
      <div class="person">
        <div class="person-top">
          <div class="person-name">${e.nombre}</div>
          <span class="badge ${color(e.proyeccion)}">${estado(e.proyeccion)}</span>
        </div>

        <div class="person-grid">
          <div class="mini"><span>Hoy</span><strong>${e.ventas_dia}</strong></div>
          <div class="mini"><span>PP</span><strong>${e.mtd}</strong></div>
          <div class="mini"><span>Avance</span><strong>${e.avance_meta}%</strong></div>
          <div class="mini"><span>Proyección</span><strong>${e.proyeccion}%</strong></div>
        </div>

        <p>${e.observacion || ""}</p>
      </div>
    `).join("");
  }

  const rutasLista = document.getElementById("rutasLista");
  if(rutasLista){
    rutasLista.innerHTML = datos.rutas.map(r => `
      <div class="card">
        <h3>${r.dia}</h3>
        <p>${r.sector}</p>
        <small>${r.responsable}</small>
      </div>
    `).join("");
  }

  const reembolsosLista = document.getElementById("reembolsosLista");
  if(reembolsosLista){
    reembolsosLista.innerHTML = datos.reembolsos.map(r => `
      <div class="card">
        <h3>${r.ejecutivo}</h3>
        <p>Monto: ${r.monto}</p>
        <span class="badge yellow">${r.estado}</span>
      </div>
    `).join("");
  }
}

function fechaReporte(){
  const fecha = new Date();
  const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  return `${dias[fecha.getDay()]} ${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

function generarHTMLReporte(){
  const d = datos.dashboard;

  return `
    <div id="cardReporte" class="report-card">
      <div class="report-shell">
        <div class="report-head">
          <div>
            <h1>WOM Street Chiloé</h1>
            <p>Reporte comercial diario y mensual</p>
          </div>
          <div>
            <p>${fechaReporte()}</p>
          </div>
        </div>

        <div class="report-body">
          <div class="report-title">Gestión diaria</div>
          <div class="report-grid">
            <div class="report-kpi"><span>Ventas día</span><strong>${d.ventas_dia}</strong></div>
            <div class="report-kpi"><span>Meta diaria</span><strong>${d.meta_dia}</strong></div>
            <div class="report-kpi"><span>Diferencia</span><strong>${d.gap_dia}</strong></div>
          </div>

          <div class="report-title">Avance individual del día</div>
          <table class="report-table">
            <thead>
              <tr><th>Ejecutivo</th><th>Hoy</th></tr>
            </thead>
            <tbody>
              ${datos.equipo.map(e => `<tr><td>${e.nombre}</td><td>${e.ventas_dia}</td></tr>`).join("")}
            </tbody>
          </table>

          <div class="report-title">Avance mensual Team Chiloé</div>
          <div class="report-grid">
            <div class="report-kpi"><span>Meta grupal</span><strong>${d.meta_mes}</strong></div>
            <div class="report-kpi"><span>PP actual</span><strong>${d.ventas_mtd}</strong></div>
            <div class="report-kpi"><span>% avance</span><strong>${d.avance_meta}%</strong></div>
            <div class="report-kpi"><span>Deberían llevar</span><strong>${d.deberian_llevar}</strong></div>
            <div class="report-kpi"><span>Proyección</span><strong>${d.proyeccion}%</strong></div>
            <div class="report-kpi"><span>GAP</span><strong>${d.gap}</strong></div>
          </div>

          <div class="report-title">Detalle mensual individual</div>
          <table class="report-table">
            <thead>
              <tr>
                <th>Ejecutivo</th>
                <th>Meta</th>
                <th>PP</th>
                <th>Avance</th>
                <th>Proyección</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${datos.equipo.map(e => `
                <tr>
                  <td>${e.nombre}</td>
                  <td>${e.meta}</td>
                  <td>${e.mtd}</td>
                  <td>${e.avance_meta}%</td>
                  <td>${e.proyeccion}%</td>
                  <td>${estado(e.proyeccion)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

async function descargarImagen(id, nombreArchivo){
  const elemento = document.getElementById(id);

  const canvas = await html2canvas(elemento,{
    scale:2,
    backgroundColor:"#ffffff",
    useCORS:true
  });

  const blob = await new Promise(resolve => canvas.toBlob(resolve,"image/png"));
  const file = new File([blob], nombreArchivo, {type:"image/png"});

  if(navigator.canShare && navigator.canShare({files:[file]})){
    await navigator.share({
      files:[file],
      title:"WOM Street Chiloé",
      text:"Reporte comercial WOM Street Chiloé"
    });
  }else{
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = nombreArchivo;
    link.click();
  }
}

async function generarImagenReporte(){
  const area = document.getElementById("shareArea");
  area.innerHTML = generarHTMLReporte();
  await descargarImagen("cardReporte","reporte-comercial-wom-street.png");
  area.innerHTML = "";
}

window.addEventListener("load", () => {
  iniciar().catch(error => {
    console.error("Error general:", error);
    ocultarLoader();
    alert("Error al iniciar la web. Revisa script.js.");
  });
});