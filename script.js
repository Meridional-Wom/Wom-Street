const API_URL = "https://script.google.com/macros/s/AKfycbxP2L869vhRVma1iNcwDEY8sV8X7OunPWuve4ot0BDr3v9fJFZmvhvZWjo2suF3cJsKdw/exec";

let DATA = {};
let liderActivo = false;

document.addEventListener("DOMContentLoaded", () => {
  mostrarFechaWeb();
  renderDemo();
  cargarDatos();
});

/* FECHA */

function fechaWeb(){
  const hoy = new Date();
  const meses = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
  const dia = String(hoy.getDate()).padStart(2,"0");
  const mes = meses[hoy.getMonth()];
  const anio = hoy.getFullYear();
  return `${dia} ${mes} ${anio}`;
}

function mostrarFechaWeb(){
  const fecha = fechaWeb();

  const header = document.getElementById("fechaActualizacion");
  if(header) header.textContent = fecha;

  const rep = document.getElementById("reporteFecha");
  if(rep) rep.textContent = fecha;
}

/* CARGA */

async function cargarDatos(){
  mostrarLoader();

  const timeout = setTimeout(() => {
    ocultarLoader();
    console.warn("Tiempo agotado conectando con Google Sheets.");
  }, 10000);

  try{
    const res = await fetch(API_URL + "?v=" + Date.now());

    if(!res.ok){
      throw new Error("Error API: " + res.status);
    }

    DATA = await res.json();

    if(DATA.ok === false){
      throw new Error(DATA.error || "Error en Apps Script");
    }

    renderInicio(DATA);
    renderRecursos(DATA);

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
      "Estado día":"--",
      "Ventas MTD":0,
      "Meta mes":0,
      "Cumplimiento mes":"0%",
      "GAP":0,
      "Reembolsos pendientes":0,
      "FCST auto":"0%",
      "Diferencia FCST":0,
      "Estado cierre":"--",
      "FCST mensual":"0%"
    },
    equipo:[],
    avisos:[],
    biblioteca:[],
    publicidad:[],
    links:[],
    config:{
      "Clave acceso líder":"CHILOE2026"
    }
  };

  renderInicio(DATA);
  renderRecursos(DATA);
}

function mostrarLoader(){
  const loader = document.getElementById("loader");
  if(loader) loader.style.display = "flex";
}

function ocultarLoader(){
  const loader = document.getElementById("loader");
  if(loader) loader.style.display = "none";
}

/* SIDEBAR */

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
  const d = normalizarDashboard(data.dashboard || {});
  const equipo = normalizarEquipo(data.equipo || []);

  const fecha = d.fechaActualizacion || data.generado || fechaWeb();

  const header = document.getElementById("fechaActualizacion");
  if(header) header.textContent = fecha;

  const rep = document.getElementById("reporteFecha");
  if(rep) rep.textContent = fecha;

  renderAvisoImportante(data.avisos || []);
  renderGestionDiaria(d);
  renderVentasDia(equipo);
  renderResumenTeam(d);
  renderDesempenoIndividual(equipo);
  renderAvisosGenerales(data.avisos || []);
}

function normalizarDashboard(d){
  const ventasDia = numero(pick(d, ["Ventas día","Ventas Día","Ventas Dia","ventasDia"]));
  const metaDia = numero(pick(d, ["Meta día","Meta Día","Meta Dia","metaDia"]));

  return {
    fechaActualizacion: pick(d, ["Ultima actualización","Última actualización","Fecha actualización","Fecha Actualización"]),
    lider: pick(d, ["Líder","Lider"]),
    equipo: pick(d, ["Equipo"]),
    grupo: pick(d, ["Grupo"]),

    ventasDia,
    metaDia,
    cumplimientoDia: formatoPorcentaje(pick(d, ["Cumplimiento día","Cumplimiento Día"])),
    estadoDia: pick(d, ["Estado día","Estado Día"]),
    diferenciaDia: ventasDia - metaDia,

    ventasMTD: numero(pick(d, ["Ventas MTD","PP Actual","PP actual"])),
    metaMes: numero(pick(d, ["Meta mes","Meta Mes","Meta mensual","Meta Grupal"])),
    cumplimientoMes: formatoPorcentaje(pick(d, ["Cumplimiento mes","Cumplimiento Mes","% Avance Meta","Cumplimiento"])),
    gap: numero(pick(d, ["GAP","Gap"])),
    reembolsosPendientes: numero(pick(d, ["Reembolsos pendientes","Reembolso pendiente"])),

    fcstAuto: formatoPorcentaje(pick(d, ["FCST auto","FCST Auto","FCST","Proyección","Proyeccion"])),
    diferenciaFCST: numero(pick(d, ["Diferencia FCST"])),
    estadoCierre: pick(d, ["Estado cierre","Estado Cierre","Estado"]),
    fcstMensual: formatoPorcentaje(pick(d, ["FCST mensual","FCST Mensual"]))
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
      estado: pick(e, ["Estado","estado"]) || calcularEstado(pick(e, ["Cumplimiento","cumplimiento"])),
      productividad: pick(e, ["Productividad","productividad"]),
      observacion: pick(e, ["Observación","Observacion","observación","observacion"])
    };
  });
}

/* HOME */

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

  const html = equipo.length ? equipo.map(e => {
    const color = e.ventasDia > 0 ? "green" : "";
    return `
      <div class="daily-row">
        <div class="dot ${color}"></div>
        <div>${nombreCorto(e.ejecutivo)}</div>
        <strong>${e.ventasDia}</strong>
      </div>
    `;
  }).join("") : `<div class="empty-msg">Sin datos de equipo</div>`;

  box.innerHTML = html;
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

  const html = equipo.length ? equipo.map(e => {
    const estadoClass = claseEstado(e.estado);
    const dotClass =
      estadoClass === "verde" ? "green" :
      estadoClass === "amarillo" ? "yellow" :
      "red";

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

  box.innerHTML = html;
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

  box.innerHTML = `
    <h3>🔔 AVISOS GENERALES</h3>
    <ul>${lista}</ul>
  `;
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

  const codigo =
    pick(DATA.config || {}, [
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
  }else{
    document.getElementById("loginError").textContent = "Código incorrecto";
  }
}

function abrirModulo(modulo){
  const panel = document.getElementById("liderModuloView");
  const titulo = document.getElementById("liderModuloTitulo");
  const contenido = document.getElementById("liderModuloContenido");

  const d = normalizarDashboard(DATA.dashboard || {});
  const equipo = normalizarEquipo(DATA.equipo || []);

  if(!panel || !titulo || !contenido) return;

  panel.classList.remove("hidden");

  if(modulo === "registrarRuta"){
    titulo.textContent = "REGISTRAR RUTA";
    contenido.innerHTML = formularioRuta();
  }

  if(modulo === "planes"){
    titulo.textContent = "PLANES DE ACCIÓN";
    contenido.innerHTML = formularioPlan(equipo);
  }

  if(modulo === "bitacora"){
    titulo.textContent = "BITÁCORA DEL MES";
    contenido.innerHTML = formularioBitacora(equipo);
  }

  if(modulo === "metas"){
    titulo.textContent = "METAS Y CUMPLIMIENTO";
    contenido.innerHTML = `
      <div class="module-card">
        <h3>🎯 METAS Y CUMPLIMIENTO</h3>
        <p><strong>Ventas MTD:</strong> ${d.ventasMTD}</p>
        <p><strong>Meta mes:</strong> ${d.metaMes}</p>
        <p><strong>Cumplimiento:</strong> ${d.cumplimientoMes}</p>
        <p><strong>FCST Auto:</strong> ${d.fcstAuto}</p>
        <p><strong>Diferencia FCST:</strong> ${d.diferenciaFCST}</p>
        <p><strong>GAP:</strong> ${d.gap}</p>
        <p><strong>Estado cierre:</strong> ${d.estadoCierre}</p>
      </div>
    `;
  }

  if(modulo === "reembolsos"){
    titulo.textContent = "REEMBOLSOS";
    contenido.innerHTML = formularioReembolso(equipo);
  }

  if(modulo === "mes"){
    titulo.textContent = "MES";
    contenido.innerHTML = `
      <div class="module-card">
        <h3>📅 MES</h3>
        <p><strong>Ventas MTD:</strong> ${d.ventasMTD}</p>
        <p><strong>Meta mes:</strong> ${d.metaMes}</p>
        <p><strong>Cumplimiento mes:</strong> ${d.cumplimientoMes}</p>
        <p><strong>FCST Auto:</strong> ${d.fcstAuto}</p>
        <p><strong>FCST mensual:</strong> ${d.fcstMensual}</p>
        <p><strong>Estado cierre:</strong> ${d.estadoCierre}</p>
      </div>
    `;
  }
}

function cerrarModuloLider(){
  const panel = document.getElementById("liderModuloView");
  if(panel) panel.classList.add("hidden");
}

function opcionesEjecutivos(equipo){
  return equipo.map(e => `<option value="${escapeAttr(e.ejecutivo)}">${e.ejecutivo}</option>`).join("");
}

/* FORMULARIOS */

function formularioRuta(){
  return `
    <div class="module-card">
      <h3>🗺️ REGISTRAR RUTA</h3>
      <div class="form-grid">
        <input id="rutaFecha" type="date">
        <input id="rutaDia" placeholder="Día">
        <input id="rutaSector" placeholder="Sector">
        <input id="rutaResponsable" placeholder="Responsable">
        <select id="rutaEstado">
          <option>Planificada</option>
          <option>En ejecución</option>
          <option>Completada</option>
          <option>Pendiente</option>
        </select>
        <textarea id="rutaObs" placeholder="Observación"></textarea>
      </div>
      <div class="form-actions">
        <button class="primary-btn" onclick="guardarRuta()">Guardar</button>
      </div>
      <div id="rutaMsg" class="save-msg"></div>
    </div>
  `;
}

function formularioReembolso(equipo){
  return `
    <div class="module-card">
      <h3>💸 REEMBOLSOS</h3>
      <div class="form-grid">
        <input id="reFecha" type="date">
        <select id="reEjecutivo">
          <option value="">Ejecutivo</option>
          ${opcionesEjecutivos(equipo)}
        </select>
        <input id="reMonto" type="number" placeholder="Monto">
        <input id="reMotivo" placeholder="Motivo">
        <select id="reEstado">
          <option>Pendiente</option>
          <option>Pagado</option>
          <option>Rechazado</option>
        </select>
        <textarea id="reObs" placeholder="Observación"></textarea>
      </div>
      <div class="form-actions">
        <button class="primary-btn" onclick="guardarReembolso()">Guardar</button>
      </div>
      <div id="reMsg" class="save-msg"></div>
    </div>
  `;
}

function formularioBitacora(equipo){
  return `
    <div class="module-card">
      <h3>📝 BITÁCORA DEL MES</h3>
      <div class="form-grid">
        <input id="bitFecha" type="date">
        <select id="bitEjecutivo">
          <option value="">Ejecutivo</option>
          ${opcionesEjecutivos(equipo)}
        </select>
        <input id="bitTipo" placeholder="Tipo de gestión">
        <textarea id="bitDetalle" placeholder="Detalle"></textarea>
        <select id="bitEstado">
          <option>Pendiente</option>
          <option>Completado</option>
          <option>En seguimiento</option>
        </select>
      </div>
      <div class="form-actions">
        <button class="primary-btn" onclick="guardarBitacora()">Guardar</button>
      </div>
      <div id="bitMsg" class="save-msg"></div>
    </div>
  `;
}

function formularioPlan(equipo){
  return `
    <div class="module-card">
      <h3>🚦 PLANES DE ACCIÓN</h3>
      <div class="form-grid">
        <input id="planFecha" type="date">
        <select id="planEjecutivo">
          <option value="">Ejecutivo</option>
          ${opcionesEjecutivos(equipo)}
        </select>
        <input id="planMotivo" placeholder="Motivo">
        <textarea id="planAccion" placeholder="Acción comprometida"></textarea>
        <input id="planCompromiso" type="date">
        <select id="planEstado">
          <option>Pendiente</option>
          <option>En seguimiento</option>
          <option>Completado</option>
        </select>
      </div>
      <div class="form-actions">
        <button class="primary-btn" onclick="guardarPlan()">Guardar</button>
      </div>
      <div id="planMsg" class="save-msg"></div>
    </div>
  `;
}

/* GUARDAR */

function guardarRuta(){
  guardarRegistro("ruta", {
    Fecha: val("rutaFecha"),
    Día: val("rutaDia"),
    Sector: val("rutaSector"),
    Responsable: val("rutaResponsable"),
    Estado: val("rutaEstado"),
    Observación: val("rutaObs")
  }, "rutaMsg");
}

function guardarReembolso(){
  guardarRegistro("reembolso", {
    Fecha: val("reFecha"),
    Ejecutivo: val("reEjecutivo"),
    Monto: val("reMonto"),
    Motivo: val("reMotivo"),
    Estado: val("reEstado"),
    Observación: val("reObs")
  }, "reMsg");
}

function guardarBitacora(){
  guardarRegistro("bitacora", {
    Fecha: val("bitFecha"),
    Ejecutivo: val("bitEjecutivo"),
    Tipo: val("bitTipo"),
    Descripción: val("bitDetalle"),
    Estado: val("bitEstado")
  }, "bitMsg");
}

function guardarPlan(){
  guardarRegistro("plan", {
    Fecha: val("planFecha"),
    Ejecutivo: val("planEjecutivo"),
    Motivo: val("planMotivo"),
    Acción: val("planAccion"),
    "Fecha compromiso": val("planCompromiso"),
    Estado: val("planEstado")
  }, "planMsg");
}

async function guardarRegistro(tipo, data, msgId){
  const msg = document.getElementById(msgId);
  if(msg) msg.textContent = "Guardando...";

  try{
    await fetch(API_URL, {
      method:"POST",
      mode:"no-cors",
      headers:{
        "Content-Type":"text/plain;charset=utf-8"
      },
      body:JSON.stringify({tipo, data})
    });

    if(msg) msg.textContent = "Registro enviado correctamente.";
    setTimeout(cargarDatos, 1200);
  }catch(error){
    console.error(error);
    if(msg) msg.textContent = "No se pudo guardar.";
  }
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
      backgroundColor: null,
      scale: 3,
      useCORS: true
    });

    canvas.toBlob(async blob => {
      const file = new File([blob], "reporte-wom-street-chiloe.png", {
        type: "image/png"
      });

      if(navigator.canShare && navigator.canShare({ files:[file] })){
        await navigator.share({
          files:[file],
          title:"Reporte WOM Street Chiloé"
        });
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
  const d = normalizarDashboard(DATA.dashboard || {});
  const equipo = normalizarEquipo(DATA.equipo || []);

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

  const cumplimientoTotal =
    totalMeta > 0 ? Math.round((totalPP / totalMeta) * 100) : 0;

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

  const limpio = String(v)
    .replace("%","")
    .replace(",",".")
    .trim();

  const n = Number(limpio);
  return isNaN(n) ? 0 : Math.round(n);
}

function formatoPorcentaje(v){
  if(v === undefined || v === null || v === "") return "0%";

  if(typeof v === "string" && v.includes("%")){
    return v;
  }

  if(typeof v === "number"){
    if(v > 0 && v <= 1){
      return Math.round(v * 100) + "%";
    }

    return Math.round(v) + "%";
  }

  const n = numero(v);

  if(n > 0 && n <= 1){
    return Math.round(n * 100) + "%";
  }

  return n + "%";
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

function nombreCorto(nombre){
  if(!nombre) return "";

  const partes = String(nombre).trim().split(/\s+/);

  if(partes.length <= 2){
    return nombre;
  }

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