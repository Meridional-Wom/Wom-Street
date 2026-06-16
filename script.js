const API_URL = "https://script.google.com/macros/s/AKfycbxP2L869vhRVma1iNcwDEY8sV8X7OunPWuve4ot0BDr3v9fJFZmvhvZWjo2suF3cJsKdw/exec";

let DATA = {};
let liderActivo = false;

const MODULOS = {
  rutas:{ titulo:"Rutas", icono:"📍", sheet:"RUTAS", dataKey:"rutas", tipo:"ruta" },
  reembolsos:{ titulo:"Reembolsos", icono:"💸", sheet:"REEMBOLSOS", dataKey:"reembolsos", tipo:"reembolso" },
  planes:{ titulo:"Planes de acción", icono:"🚦", sheet:"PLANES_ACCION", dataKey:"planesAccion", tipo:"plan" },
  feedback:{ titulo:"Feedback", icono:"💬", sheet:"FEEDBACK", dataKey:"feedback", tipo:"feedback" },
  bitacora:{ titulo:"Bitácora", icono:"📝", sheet:"BITACORA", dataKey:"bitacora", tipo:"bitacora" },
  metas:{ titulo:"Metas", icono:"🎯", sheet:"METAS_REGISTRO", dataKey:"metasRegistro", tipo:"meta" }
};

document.addEventListener("DOMContentLoaded", () => {
  mostrarFechaWeb();
  renderDemo();
  cargarDatos();
});

function fechaWeb(){
  const hoy = new Date();
  const meses = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
  return `${String(hoy.getDate()).padStart(2,"0")} ${meses[hoy.getMonth()]} ${hoy.getFullYear()}`;
}

function mostrarFechaWeb(){
  setText("fechaActualizacion", fechaWeb());
  setText("reporteFecha", fechaWeb());
}

async function cargarDatos(){
  mostrarLoader();

  const timeout = setTimeout(() => {
    ocultarLoader();
    console.warn("Tiempo agotado conectando con Google Sheets.");
  }, 10000);

  try{
    const res = await fetch(API_URL + "?v=" + Date.now());
    if(!res.ok) throw new Error("Error API: " + res.status);

    DATA = await res.json();
    if(DATA.ok === false) throw new Error(DATA.error || "Error en Apps Script");

    renderInicio(DATA);
    renderRecursos(DATA);
    renderDashboardLider();

  }catch(error){
    console.error("Error al cargar datos:", error);
    renderDemo();
  }finally{
    clearTimeout(timeout);
    ocultarLoader();
  }
}

function renderDemo(){
  DATA = {
    dashboard:{
      "Ventas día":0,
      "Meta día":0,
      "Cumplimiento día":"0%",
      "Ventas MTD":0,
      "Meta mes":0,
      "Cumplimiento mes":"0%",
      "GAP":0,
      "FCST auto":"0%",
      "Diferencia FCST":0,
      "Estado cierre":"--"
    },
    equipo:[],
    avisos:[],
    biblioteca:[],
    publicidad:[],
    links:[],
    rutas:[],
    reembolsos:[],
    planesAccion:[],
    feedback:[],
    bitacora:[],
    metasRegistro:[],
    config:{ "Clave acceso líder":"CHILOE2026" }
  };

  renderInicio(DATA);
  renderRecursos(DATA);
  renderDashboardLider();
}

function mostrarLoader(){
  const loader = document.getElementById("loader");
  if(loader) loader.style.display = "flex";
}

function ocultarLoader(){
  const loader = document.getElementById("loader");
  if(loader) loader.style.display = "none";
}

function abrirSidebar(){
  document.getElementById("sidebar").classList.add("active");
  document.getElementById("sidebarOverlay").classList.add("active");
}

function cerrarSidebar(){
  document.getElementById("sidebar").classList.remove("active");
  document.getElementById("sidebarOverlay").classList.remove("active");
}

function mostrarVistaDesdeSidebar(id){
  const btns = document.querySelectorAll(".nav-btn");
  const index = id === "inicioView" ? 0 : id === "recursosView" ? 1 : 2;
  mostrarVista(id, btns[index]);
  cerrarSidebar();
}

function mostrarVista(id, btn){
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  if(btn) btn.classList.add("active");
}

/* INICIO */

function renderInicio(data){
  const equipo = normalizarEquipo(data.equipo || []);
  const d = completarDashboard(normalizarDashboard(data.dashboard || {}), equipo);

  const fecha = d.fechaActualizacion || data.generado || fechaWeb();
  setText("fechaActualizacion", fecha);
  setText("reporteFecha", fecha);

  renderAvisoImportante(data.avisos || []);
  renderGestionDiaria(d);
  renderVentasDia(equipo);
  renderResumenTeam(d);
  renderDesempenoIndividual(equipo);
  renderAvisosGenerales(data.avisos || []);
}

function completarDashboard(d, equipo){
  if(d.ventasMTD === 0 && equipo.length){
    d.ventasMTD = equipo.reduce((t,e) => t + Number(e.ventasMTD || 0), 0);
  }

  if(d.metaMes === 0 && equipo.length){
    d.metaMes = equipo.reduce((t,e) => t + Number(e.metaMes || 0), 0);
  }

  if((d.cumplimientoMes === "0%" || d.cumplimientoMes === "0") && d.metaMes > 0){
    d.cumplimientoMes = Math.round((d.ventasMTD / d.metaMes) * 100) + "%";
  }

  if(d.gap === 0 && d.metaMes > 0){
    d.gap = d.ventasMTD - d.metaMes;
  }

  return d;
}

function normalizarDashboard(d){
  const ventasDia = numero(pick(d, ["Ventas día","Ventas Día","Ventas Dia","ventasDia"]));
  const metaDia = numero(pick(d, ["Meta día","Meta Día","Meta Dia","metaDia"]));

  return {
    fechaActualizacion: pick(d, ["Ultima actualización","Última actualización","Fecha actualización","Fecha Actualización"]),
    ventasDia,
    metaDia,
    cumplimientoDia: formatoPorcentaje(pick(d, ["Cumplimiento día","Cumplimiento Día"])),
    diferenciaDia: ventasDia - metaDia,
    ventasMTD: numero(pick(d, ["Ventas MTD","Ventas mtd","PP Actual","PP actual","Total PP","PP"])),
    metaMes: numero(pick(d, ["Meta mes","Meta Mes","Meta mensual","Meta Grupal"])),
    cumplimientoMes: formatoPorcentaje(pick(d, ["Cumplimiento mes","Cumplimiento Mes","% Avance Meta","Cumplimiento"])),
    gap: numero(pick(d, ["GAP","Gap"])),
    fcstAuto: formatoPorcentaje(pick(d, ["FCST auto","FCST Auto","FCST","Proyección","Proyeccion"])),
    diferenciaFCST: numero(pick(d, ["Diferencia FCST"])),
    estadoCierre: pick(d, ["Estado cierre","Estado Cierre","Estado"]) || "--"
  };
}

function normalizarEquipo(equipo){
  return equipo.map(e => {
    const ventasMTD = numero(pick(e, ["Ventas MTD","ventasMTD","PP Actual","PP actual"]));
    const metaMes = numero(pick(e, ["Meta Mes","Meta mes","Meta Individual","Meta"]));
    const gapBase = pick(e, ["GAP","gap","GAP Ind.","Gap"]);
    const gap = gapBase !== "" && gapBase !== undefined ? numero(gapBase) : ventasMTD - metaMes;

    return {
      ejecutivo: pick(e, ["Ejecutivo","ejecutivo","Nombre","nombre"]) || "",
      ventasDia: numero(pick(e, ["Ventas Día","Ventas día","Ventas Dia","ventasDia"])),
      ventasMTD,
      metaMes,
      cumplimiento: formatoPorcentaje(pick(e, ["Cumplimiento","cumplimiento","% Avance Meta","Avance"])),
      gap,
      fcst: formatoPorcentaje(pick(e, ["FCST Auto","FCST auto","FCST","fcst"])),
      estado: pick(e, ["Estado","estado"]) || calcularEstado(pick(e, ["Cumplimiento","cumplimiento"]))
    };
  });
}

function renderAvisoImportante(avisos){
  const box = document.getElementById("avisoImportante");
  if(!box) return;

  const aviso = avisos.find(a =>
    String(pick(a, ["Prioridad","prioridad"])).toLowerCase() === "alta" &&
    String(pick(a, ["Activo","activo"]) || "Sí").toLowerCase() !== "no"
  );

  if(!aviso){
    box.classList.add("hidden");
    box.innerHTML = "";
    return;
  }

  box.classList.remove("hidden");
  box.innerHTML = `
    <div style="font-size:30px;">📣</div>
    <div>
      <h3>${pick(aviso, ["Título","Titulo","titulo","título"]) || "AVISO IMPORTANTE"}</h3>
      <p>${pick(aviso, ["Descripción","Descripcion","descripcion","descripción"]) || ""}</p>
    </div>
  `;
}

function renderGestionDiaria(d){
  const box = document.getElementById("gestionDiaria");
  if(!box) return;

  box.innerHTML = `
    ${kpiBox("📱","VENTAS DÍA",d.ventasDia)}
    ${kpiBox("🎯","META DÍA",d.metaDia)}
    ${kpiBox("📊","CUMPLIMIENTO",d.cumplimientoDia)}
  `;
}

function kpiBox(icon,title,value,red=false){
  return `
    <div class="kpi-box">
      <div class="kpi-icon">${icon}</div>
      <div class="kpi-title">${title}</div>
      <div class="kpi-value ${red ? "red" : ""}">${value}</div>
    </div>
  `;
}

function renderVentasDia(equipo){
  const box = document.getElementById("ventasDiaLista");
  if(!box) return;

  box.innerHTML = equipo.length ? equipo.map(e => `
    <div class="daily-row">
      <div class="dot ${e.ventasDia > 0 ? "green" : ""}"></div>
      <div>${nombreCorto(e.ejecutivo)}</div>
      <strong>${e.ventasDia}</strong>
    </div>
  `).join("") : `<div class="empty-msg">Sin datos de equipo</div>`;
}

function renderResumenTeam(d){
  const box = document.getElementById("resumenTeam");
  if(!box) return;

  box.innerHTML = `
    ${summaryItem("📱","VENTAS MTD",d.ventasMTD)}
    ${summaryItem("🎯","META MES",d.metaMes)}
    ${summaryItem("📊","CUMPLIMIENTO",d.cumplimientoMes)}
    ${summaryItem("📈","FCST AUTO",d.fcstAuto)}
    ${summaryItem("↕","DIF. FCST",d.diferenciaFCST,true)}
    ${summaryItem("📉","GAP",d.gap,true)}
  `;
}

function summaryItem(icon,label,value,red=false){
  return `
    <div class="summary-item">
      <div class="summary-icon">${icon}</div>
      <div class="summary-label">${label}</div>
      <div class="summary-value ${red && Number(value) < 0 ? "red" : ""}">${value}</div>
    </div>
  `;
}

function renderDesempenoIndividual(equipo){
  const box = document.getElementById("desempenoIndividual");
  if(!box) return;

  box.innerHTML = equipo.length ? equipo.map(e => {
    const estadoClass = claseEstado(e.estado);
    const dotClass = estadoClass === "verde" ? "green" : estadoClass === "amarillo" ? "yellow" : "red";

    return `
      <div class="person-card">
        <div class="person-top">
          <div class="person-name">
            <div class="dot ${dotClass}"></div>
            ${nombreCorto(e.ejecutivo)}
          </div>
          <div class="estado ${estadoClass}">${e.estado}</div>
        </div>
        <div class="person-metrics">
          <div class="metric-mini"><small>Día</small><strong>${e.ventasDia}</strong></div>
          <div class="metric-mini"><small>MTD</small><strong>${e.ventasMTD}</strong></div>
          <div class="metric-mini"><small>Meta</small><strong>${e.metaMes}</strong></div>
          <div class="metric-mini"><small>Avance</small><strong>${e.cumplimiento}</strong></div>
          <div class="metric-mini"><small>GAP</small><strong class="${e.gap < 0 ? "red" : ""}">${e.gap}</strong></div>
        </div>
      </div>
    `;
  }).join("") : `<div class="empty-msg">Sin desempeño individual</div>`;
}

function renderAvisosGenerales(avisos){
  const box = document.getElementById("avisosGenerales");
  if(!box) return;

  const generales = avisos.filter(a =>
    String(pick(a, ["Prioridad","prioridad"])).toLowerCase() !== "alta" &&
    String(pick(a, ["Activo","activo"]) || "Sí").toLowerCase() !== "no"
  );

  const lista = generales.length
    ? generales.map(a => `<li>${pick(a, ["Descripción","Descripcion","descripcion","descripción","Título","Titulo"])}</li>`).join("")
    : `<li>Sin avisos generales activos.</li>`;

  box.innerHTML = `<h3>🔔 AVISOS GENERALES</h3><ul>${lista}</ul>`;
}

/* RECURSOS */

function renderRecursos(data){
  renderListaRecursos("bibliotecaContainer", data.biblioteca || [], "📚");
  renderListaRecursos("publicidadContainer", data.publicidad || [], "📢");
  renderListaRecursos("linksContainer", data.links || [], "🔗");
}

function renderListaRecursos(id, items, icono){
  const box = document.getElementById(id);
  if(!box) return;

  if(!items || !items.length){
    box.innerHTML = `<div class="empty-msg">Sin registros disponibles</div>`;
    return;
  }

  box.innerHTML = items.map(item => {
    const nombre = pick(item, ["Nombre","nombre","Título","Titulo","Módulo","Modulo"]) || "Recurso";
    const desc = pick(item, ["Descripción","Descripcion","Categoria","Categoría","Tipo"]) || "Abrir enlace";
    const url = pick(item, ["URL","Url","url","Link","link"]);

    return `
      <div class="resource-card" onclick="abrirLink('${escapeAttr(url)}')">
        <div class="res-icon">${icono}</div>
        <div>
          <h4>${nombre}</h4>
          <p>${desc}</p>
        </div>
        <span>›</span>
      </div>
    `;
  }).join("");
}

function abrirLink(url){
  if(!url){
    alert("Este recurso no tiene link cargado.");
    return;
  }
  window.open(url, "_blank");
}

/* LÍDER */

function validarLider(){
  const pin = document.getElementById("pinLider").value.trim();

  const codigo = pick(DATA.config || {}, [
    "Clave acceso líder",
    "Clave acceso lider",
    "Código líder",
    "Codigo líder",
    "codigoLider",
    "Código"
  ]) || "CHILOE2026";

  if(pin === String(codigo).trim()){
    liderActivo = true;
    document.getElementById("loginLider").classList.add("hidden");
    document.getElementById("panelLider").classList.remove("hidden");
    document.getElementById("loginError").textContent = "";
    renderDashboardLider();
  }else{
    document.getElementById("loginError").textContent = "Código incorrecto";
  }
}

function renderDashboardLider(){
  const box = document.getElementById("dashboardLider");
  if(!box) return;

  const rutas = DATA.rutas || [];
  const reembolsos = DATA.reembolsos || [];
  const planes = DATA.planesAccion || [];
  const feedback = DATA.feedback || [];
  const bitacora = DATA.bitacora || [];
  const metas = DATA.metasRegistro || [];

  box.innerHTML = `
    ${leaderStat("📍","Rutas",rutas.length)}
    ${leaderStat("🚦","Planes",planes.length)}
    ${leaderStat("💬","Feedback",feedback.length)}
    ${leaderStat("📝","Bitácora",bitacora.length)}
    ${leaderStat("🎯","Metas",metas.length)}
    ${leaderStat("💸","Reembolsos",reembolsos.length)}
  `;
}

function leaderStat(icon,label,value){
  return `
    <div class="leader-stat">
      <div class="leader-stat-icon">${icon}</div>
      <div class="leader-stat-label">${label}</div>
      <div class="leader-stat-value">${value}</div>
    </div>
  `;
}

function abrirModulo(modulo){
  const panel = document.getElementById("liderModuloView");
  const titulo = document.getElementById("liderModuloTitulo");
  const contenido = document.getElementById("liderModuloContenido");

  if(!panel || !titulo || !contenido) return;

  panel.classList.remove("hidden");

  if(modulo === "historial"){
    titulo.textContent = "HISTORIAL";
    contenido.innerHTML = renderHistorial();
    return;
  }

  const cfg = MODULOS[modulo];
  if(!cfg) return;

  titulo.textContent = cfg.titulo.toUpperCase();
  contenido.innerHTML = `
    ${formularioModulo(modulo)}
    ${renderRegistrosModulo(modulo)}
  `;
}

function cerrarModuloLider(){
  const panel = document.getElementById("liderModuloView");
  if(panel) panel.classList.add("hidden");
}

function opcionesEjecutivos(){
  const equipo = normalizarEquipo(DATA.equipo || []);
  return equipo.map(e => `<option value="${escapeAttr(e.ejecutivo)}">${e.ejecutivo}</option>`).join("");
}

function formularioModulo(modulo){
  if(modulo === "rutas") return formularioRuta();
  if(modulo === "reembolsos") return formularioReembolso();
  if(modulo === "planes") return formularioPlan();
  if(modulo === "feedback") return formularioFeedback();
  if(modulo === "bitacora") return formularioBitacora();
  if(modulo === "metas") return formularioMeta();
  return "";
}

function camposBase(prefix){
  return `
    <input id="${prefix}Fecha" type="date">
    <input id="${prefix}RegistradoPor" placeholder="Registrado por">
    <select id="${prefix}Ejecutivo">
      <option value="">Ejecutivo</option>
      ${opcionesEjecutivos()}
    </select>
  `;
}

function formularioRuta(){
  return `
    <div class="module-card">
      <h3>📍 Registrar ruta</h3>
      <div class="form-grid">
        ${camposBase("ruta")}
        <input id="rutaSector" placeholder="Sector">
        <input id="rutaObjetivo" placeholder="Objetivo">
        <select id="rutaEstado">
          <option>Planificada</option>
          <option>En ejecución</option>
          <option>Completada</option>
          <option>Pendiente</option>
        </select>
        <textarea id="rutaDetalle" placeholder="Detalle u observación"></textarea>
      </div>
      <div class="form-actions">
        <button class="primary-btn" onclick="guardarRuta()">Guardar</button>
      </div>
      <div id="rutaMsg" class="save-msg"></div>
    </div>
  `;
}

function formularioReembolso(){
  return `
    <div class="module-card">
      <h3>💸 Registrar reembolso</h3>
      <div class="form-grid">
        ${camposBase("re")}
        <input id="reMonto" type="number" placeholder="Monto">
        <input id="reMotivo" placeholder="Motivo">
        <input id="reDocumento" placeholder="Link documento">
        <select id="reEstado">
          <option>Pendiente</option>
          <option>Pagado</option>
          <option>Rechazado</option>
        </select>
        <textarea id="reDetalle" placeholder="Detalle u observación"></textarea>
      </div>
      <div class="form-actions">
        <button class="primary-btn" onclick="guardarReembolso()">Guardar</button>
      </div>
      <div id="reMsg" class="save-msg"></div>
    </div>
  `;
}

function formularioPlan(){
  return `
    <div class="module-card">
      <h3>🚦 Registrar plan de acción</h3>
      <div class="form-grid">
        ${camposBase("plan")}
        <input id="planMotivo" placeholder="Motivo">
        <textarea id="planAccion" placeholder="Acción comprometida"></textarea>
        <input id="planCompromiso" type="date">
        <select id="planEstado">
          <option>Pendiente</option>
          <option>En seguimiento</option>
          <option>Completado</option>
        </select>
        <textarea id="planDetalle" placeholder="Detalle u observación"></textarea>
      </div>
      <div class="form-actions">
        <button class="primary-btn" onclick="guardarPlan()">Guardar</button>
      </div>
      <div id="planMsg" class="save-msg"></div>
    </div>
  `;
}

function formularioFeedback(){
  return `
    <div class="module-card">
      <h3>💬 Registrar feedback</h3>
      <div class="form-grid">
        ${camposBase("feed")}
        <select id="feedTipo">
          <option>Coaching</option>
          <option>Seguimiento</option>
          <option>Desempeño</option>
          <option>Capacitación</option>
          <option>Reconocimiento</option>
        </select>
        <textarea id="feedFortalezas" placeholder="Fortalezas"></textarea>
        <textarea id="feedOportunidades" placeholder="Oportunidades de mejora"></textarea>
        <textarea id="feedCompromisos" placeholder="Compromisos"></textarea>
        <select id="feedEstado">
          <option>Pendiente</option>
          <option>En seguimiento</option>
          <option>Completado</option>
        </select>
      </div>
      <div class="form-actions">
        <button class="primary-btn" onclick="guardarFeedback()">Guardar</button>
      </div>
      <div id="feedMsg" class="save-msg"></div>
    </div>
  `;
}

function formularioBitacora(){
  return `
    <div class="module-card">
      <h3>📝 Registrar bitácora</h3>
      <div class="form-grid">
        ${camposBase("bit")}
        <select id="bitCategoria">
          <option>Observación</option>
          <option>Idea comercial</option>
          <option>Incidencia</option>
          <option>Terreno</option>
          <option>Seguimiento</option>
          <option>Apunte del mes</option>
        </select>
        <select id="bitEstado">
          <option>Pendiente</option>
          <option>En seguimiento</option>
          <option>Completado</option>
        </select>
        <textarea id="bitDetalle" placeholder="Detalle"></textarea>
      </div>
      <div class="form-actions">
        <button class="primary-btn" onclick="guardarBitacora()">Guardar</button>
      </div>
      <div id="bitMsg" class="save-msg"></div>
    </div>
  `;
}

function formularioMeta(){
  const d = completarDashboard(normalizarDashboard(DATA.dashboard || {}), normalizarEquipo(DATA.equipo || []));

  return `
    <div class="module-card">
      <h3>🎯 Indicadores actuales</h3>
      <p><strong>Ventas MTD:</strong> ${d.ventasMTD}</p>
      <p><strong>Meta mes:</strong> ${d.metaMes}</p>
      <p><strong>Cumplimiento:</strong> ${d.cumplimientoMes}</p>
      <p><strong>FCST Auto:</strong> ${d.fcstAuto}</p>
      <p><strong>GAP:</strong> ${d.gap}</p>
    </div>

    <div class="module-card">
      <h3>🎯 Registrar meta</h3>
      <div class="form-grid">
        ${camposBase("meta")}
        <input id="metaComprometida" type="number" placeholder="Meta comprometida">
        <input id="metaAvance" type="number" placeholder="Avance actual">
        <textarea id="metaAccion" placeholder="Acción para cumplir"></textarea>
        <select id="metaEstado">
          <option>Pendiente</option>
          <option>En seguimiento</option>
          <option>Completado</option>
        </select>
        <textarea id="metaDetalle" placeholder="Detalle u observación"></textarea>
      </div>
      <div class="form-actions">
        <button class="primary-btn" onclick="guardarMeta()">Guardar</button>
      </div>
      <div id="metaMsg" class="save-msg"></div>
    </div>
  `;
}

/* GUARDAR */

function guardarRuta(){
  guardarRegistro("ruta", {
    Fecha: val("rutaFecha"),
    RegistradoPor: val("rutaRegistradoPor"),
    Ejecutivo: val("rutaEjecutivo"),
    Sector: val("rutaSector"),
    Objetivo: val("rutaObjetivo"),
    Estado: val("rutaEstado"),
    Detalle: val("rutaDetalle")
  }, "rutaMsg");
}

function guardarReembolso(){
  guardarRegistro("reembolso", {
    Fecha: val("reFecha"),
    RegistradoPor: val("reRegistradoPor"),
    Ejecutivo: val("reEjecutivo"),
    Monto: val("reMonto"),
    Motivo: val("reMotivo"),
    DocumentoLink: val("reDocumento"),
    Estado: val("reEstado"),
    Detalle: val("reDetalle")
  }, "reMsg");
}

function guardarPlan(){
  guardarRegistro("plan", {
    Fecha: val("planFecha"),
    RegistradoPor: val("planRegistradoPor"),
    Ejecutivo: val("planEjecutivo"),
    Motivo: val("planMotivo"),
    Acción: val("planAccion"),
    FechaCompromiso: val("planCompromiso"),
    Estado: val("planEstado"),
    Detalle: val("planDetalle")
  }, "planMsg");
}

function guardarFeedback(){
  guardarRegistro("feedback", {
    Fecha: val("feedFecha"),
    RegistradoPor: val("feedRegistradoPor"),
    Ejecutivo: val("feedEjecutivo"),
    Tipo: val("feedTipo"),
    Fortalezas: val("feedFortalezas"),
    Oportunidades: val("feedOportunidades"),
    Compromisos: val("feedCompromisos"),
    Estado: val("feedEstado"),
    Detalle: val("feedCompromisos")
  }, "feedMsg");
}

function guardarBitacora(){
  guardarRegistro("bitacora", {
    Fecha: val("bitFecha"),
    RegistradoPor: val("bitRegistradoPor"),
    Ejecutivo: val("bitEjecutivo"),
    Categoría: val("bitCategoria"),
    Estado: val("bitEstado"),
    Detalle: val("bitDetalle")
  }, "bitMsg");
}

function guardarMeta(){
  guardarRegistro("meta", {
    Fecha: val("metaFecha"),
    RegistradoPor: val("metaRegistradoPor"),
    Ejecutivo: val("metaEjecutivo"),
    MetaComprometida: val("metaComprometida"),
    AvanceActual: val("metaAvance"),
    Acción: val("metaAccion"),
    Estado: val("metaEstado"),
    Detalle: val("metaDetalle")
  }, "metaMsg");
}

async function guardarRegistro(tipo, data, msgId){
  const msg = document.getElementById(msgId);
  if(msg) msg.textContent = "Guardando...";

  try{
    await fetch(API_URL, {
      method:"POST",
      mode:"no-cors",
      headers:{ "Content-Type":"text/plain;charset=utf-8" },
      body:JSON.stringify({ tipo, data })
    });

    if(msg) msg.textContent = "Registro enviado correctamente.";
    setTimeout(cargarDatos, 1200);

  }catch(error){
    console.error(error);
    if(msg) msg.textContent = "No se pudo guardar.";
  }
}

/* REGISTROS */

function getRegistrosModulo(modulo){
  const cfg = MODULOS[modulo];
  return cfg ? (DATA[cfg.dataKey] || []) : [];
}

function renderRegistrosModulo(modulo){
  const cfg = MODULOS[modulo];
  const registros = getRegistrosModulo(modulo);

  return `
    <div class="module-card">
      <div class="module-toolbar">
        <button class="export-btn" onclick="exportarCSV('${modulo}')">Exportar CSV</button>
      </div>
      <h3>${cfg.icono} Registros</h3>
      <div class="module-history">
        ${
          registros.length
          ? registros.slice().reverse().map(r => registroCard(r, modulo)).join("")
          : `<div class="empty-msg">Sin registros disponibles</div>`
        }
      </div>
    </div>
  `;
}

function registroCard(r, modulo){
  const estado = pick(r, ["Estado","estado"]) || "--";
  const detalle = pick(r, ["Detalle","Observación","Observacion","Descripción","Descripcion"]) || "";
  const ejecutivo = pick(r, ["Ejecutivo","ejecutivo"]) || "Sin ejecutivo";
  const fecha = pick(r, ["Fecha","FechaRegistro","Fecha Registro"]) || "";
  const registradoPor = pick(r, ["RegistradoPor","Registrado Por","Registrado por"]) || "--";
  const id = pick(r, ["ID","id"]);

  return `
    <div class="registro-card">
      <div class="registro-header">
        <div>
          <div class="registro-title">${ejecutivo}</div>
          <div class="registro-fecha">${fecha}</div>
        </div>
        <span class="badge ${badgeClass(estado)}">${estado}</span>
      </div>

      <div class="registro-body">
        <strong>Registrado por:</strong> ${registradoPor}<br>
        ${detalle}
      </div>

      <div class="registro-actions">
        <button class="delete-btn" onclick="eliminarRegistro('${modulo}','${escapeAttr(id)}')">Eliminar</button>
      </div>
    </div>
  `;
}

async function eliminarRegistro(modulo, id){
  if(!id){
    alert("Registro sin ID. No se puede eliminar.");
    return;
  }

  if(!confirm("¿Eliminar este registro?")) return;

  const cfg = MODULOS[modulo];

  try{
    await fetch(API_URL, {
      method:"POST",
      mode:"no-cors",
      headers:{ "Content-Type":"text/plain;charset=utf-8" },
      body:JSON.stringify({
        tipo:"eliminar",
        sheetName:cfg.sheet,
        id
      })
    });

    alert("Registro eliminado.");
    cargarDatos();
    cerrarModuloLider();

  }catch(error){
    console.error(error);
    alert("No se pudo eliminar.");
  }
}

/* HISTORIAL */

function renderHistorial(){
  const todos = [];

  Object.keys(MODULOS).forEach(key => {
    const cfg = MODULOS[key];
    (DATA[cfg.dataKey] || []).forEach(r => {
      todos.push({ ...r, _modulo:key, _titulo:cfg.titulo, _icono:cfg.icono });
    });
  });

  if(!todos.length){
    return `<div class="empty-msg">Sin historial disponible</div>`;
  }

  const agrupado = {};

  todos.forEach(r => {
    const mes = pick(r, ["Mes","mes"]) || mesDesdeFecha(pick(r, ["FechaRegistro","Fecha Registro","Fecha"])) || "Sin mes";
    const anio = pick(r, ["Año","Ano","anio","año"]) || "";
    const key = `${mes} ${anio}`.trim();

    if(!agrupado[key]) agrupado[key] = {};
    if(!agrupado[key][r._modulo]) agrupado[key][r._modulo] = [];
    agrupado[key][r._modulo].push(r);
  });

  return Object.keys(agrupado).map((mesKey, i) => `
    <div class="historial-card">
      <div class="historial-mes" onclick="toggleHistorial('histMes${i}')">
        ${mesKey}
        <span>⌄</span>
      </div>
      <div id="histMes${i}" class="historial-contenido">
        ${Object.keys(MODULOS).map(mod => {
          const cfg = MODULOS[mod];
          const regs = agrupado[mesKey][mod] || [];

          return `
            <div class="historial-modulo" onclick="toggleHistorial('hist${i}${mod}')">
              ${cfg.icono} ${cfg.titulo} ${regs.length}
            </div>
            <div id="hist${i}${mod}" class="historial-registros">
              ${
                regs.length
                ? regs.map(r => historialRegistro(r, mod)).join("")
                : `<div class="empty-msg">Sin registros</div>`
              }
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `).join("");
}

function historialRegistro(r, modulo){
  const ejecutivo = pick(r, ["Ejecutivo","ejecutivo"]) || "Sin ejecutivo";
  const fecha = pick(r, ["Fecha","FechaRegistro","Fecha Registro"]) || "";
  const estado = pick(r, ["Estado","estado"]) || "--";
  const detalle = pick(r, ["Detalle","Observación","Observacion"]) || "";
  const id = pick(r, ["ID","id"]);

  return `
    <div class="historial-registro">
      <strong>${ejecutivo}</strong>
      <small>${fecha} · ${estado}</small>
      <p>${detalle}</p>
      <div class="registro-actions">
        <button class="delete-btn" onclick="eliminarRegistro('${modulo}','${escapeAttr(id)}')">Eliminar</button>
      </div>
    </div>
  `;
}

function toggleHistorial(id){
  const el = document.getElementById(id);
  if(el) el.classList.toggle("active");
}

/* EXPORTAR */

function exportarCSV(modulo){
  const cfg = MODULOS[modulo];
  const registros = getRegistrosModulo(modulo);

  if(!registros.length){
    alert("No hay registros para exportar.");
    return;
  }

  const headers = Array.from(new Set(registros.flatMap(r => Object.keys(r))));
  const rows = registros.map(r => headers.map(h => `"${String(r[h] || "").replace(/"/g,'""')}"`).join(","));
  const csv = [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${cfg.titulo.replace(/\s+/g,"-").toLowerCase()}.csv`;
  link.click();
}

/* REPORTE */

async function compartirReporteImagen(){
  prepararReporte();

  const node = document.getElementById("reportCanvas");
  if(!node){
    alert("No se encontró el reporte.");
    return;
  }

  try{
    const canvas = await html2canvas(node, {
      backgroundColor:null,
      scale:3,
      useCORS:true
    });

    canvas.toBlob(async blob => {
      const file = new File([blob], "reporte-wom-street-chiloe.png", { type:"image/png" });

      if(navigator.canShare && navigator.canShare({ files:[file] })){
        await navigator.share({ files:[file], title:"Reporte WOM Street Chiloé" });
      }else{
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "reporte-wom-street-chiloe.png";
        link.click();
      }
    });

  }catch(error){
    console.error(error);
    alert("No se pudo generar la imagen del reporte.");
  }
}

function prepararReporte(){
  const equipo = normalizarEquipo(DATA.equipo || []);
  const d = completarDashboard(normalizarDashboard(DATA.dashboard || {}), equipo);

  setText("reporteFecha", d.fechaActualizacion || DATA.generado || fechaWeb());
  setText("repVentasDia", d.ventasDia);
  setText("repMetaDia", d.metaDia);
  setText("repPP", d.ventasMTD);
  setText("repMeta", d.metaMes);
  setText("repAvance", d.cumplimientoMes);
  setText("repGap", d.gap);

  let totalPP = 0;
  let totalMeta = 0;

  const ventasBox = document.getElementById("repVentasEjecutivos");
  if(ventasBox){
    ventasBox.innerHTML = equipo.map(e => `
      <div class="report-day-row">
        <div class="report-dot">${e.ventasDia}</div>
        <span>${nombreCorto(e.ejecutivo)}</span>
        <strong>${e.ventasDia}</strong>
      </div>
    `).join("");
  }

  const avanceBox = document.getElementById("repAvanceIndividual");
  if(avanceBox){
    avanceBox.innerHTML = equipo.map(e => {
      totalPP += Number(e.ventasMTD || 0);
      totalMeta += Number(e.metaMes || 0);

      return `
        <div class="report-mtd-row">
          <div class="report-dot">•</div>
          <span>${nombreCorto(e.ejecutivo)}</span>
          <strong>${e.ventasMTD}</strong>
          <strong>${e.metaMes}</strong>
          <strong class="report-percent">${e.cumplimiento}</strong>
        </div>
      `;
    }).join("");
  }

  const cumplimientoTotal = totalMeta > 0 ? Math.round((totalPP / totalMeta) * 100) : 0;

  setText("repTotalPP", totalPP);
  setText("repTotalMeta", totalMeta);
  setText("repTotalCumplimiento", cumplimientoTotal + "%");
}

/* HELPERS */

function setText(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = value;
}

function numero(v){
  if(v === undefined || v === null || v === "") return 0;
  if(typeof v === "number") return Math.round(v);

  const limpio = String(v).replace("%","").replace(",",".").trim();
  const n = Number(limpio);

  return isNaN(n) ? 0 : Math.round(n);
}

function formatoPorcentaje(v){
  if(v === undefined || v === null || v === "") return "0%";

  if(typeof v === "string" && v.includes("%")){
    return v;
  }

  if(typeof v === "number"){
    if(v > 0 && v <= 1) return Math.round(v * 100) + "%";
    return Math.round(v) + "%";
  }

  const n = Number(String(v).replace(",","."));

  if(!isNaN(n)){
    if(n > 0 && n <= 1) return Math.round(n * 100) + "%";
    return Math.round(n) + "%";
  }

  return "0%";
}

function calcularEstado(cumplimiento){
  const n = numero(cumplimiento);
  if(n >= 100) return "Sobre meta";
  if(n >= 80) return "En riesgo";
  return "Bajo meta";
}

function claseEstado(estado){
  const e = String(estado || "").toLowerCase();
  if(e.includes("sobre") || e.includes("excelente")) return "verde";
  if(e.includes("riesgo") || e.includes("progreso") || e.includes("seguimiento")) return "amarillo";
  return "rojo";
}

function badgeClass(estado){
  const e = String(estado || "").toLowerCase();
  if(e.includes("completado") || e.includes("pagado")) return "completado";
  if(e.includes("seguimiento") || e.includes("ejecución")) return "seguimiento";
  if(e.includes("rechazado")) return "rechazado";
  return "pendiente";
}

function nombreCorto(nombre){
  if(!nombre) return "";
  const partes = String(nombre).trim().split(/\s+/);
  if(partes.length <= 2) return nombre;
  return `${partes[0]} ${partes[2] || partes[1]}`;
}

function val(id){
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function pick(obj, keys){
  if(!obj) return "";

  for(const key of keys){
    if(obj[key] !== undefined && obj[key] !== null && obj[key] !== ""){
      return obj[key];
    }
  }

  const normalized = {};
  Object.keys(obj).forEach(k => {
    normalized[normalizarTexto(k)] = obj[k];
  });

  for(const key of keys){
    const nk = normalizarTexto(key);
    if(normalized[nk] !== undefined && normalized[nk] !== null && normalized[nk] !== ""){
      return normalized[nk];
    }
  }

  return "";
}

function normalizarTexto(txt){
  return String(txt || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"");
}

function escapeAttr(str){
  return String(str || "").replace(/'/g, "\\'");
}

function mesDesdeFecha(fecha){
  if(!fecha) return "";
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const partes = String(fecha).split("-");
  if(partes.length >= 2){
    const mes = Number(partes[1]);
    if(mes >= 1 && mes <= 12) return meses[mes - 1];
  }
  return "";
}