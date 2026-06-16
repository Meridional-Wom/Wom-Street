const API_URL = "https://script.google.com/macros/s/AKfycbxP2L869vhRVma1iNcwDEY8sV8X7OunPWuve4ot0BDr3v9fJFZmvhvZWjo2suF3cJsKdw/exec";

let DATA = {};
let liderActivo = false;

document.addEventListener("DOMContentLoaded", () => {
  mostrarFechaWeb();
  renderDemo();
  cargarDatos();
});

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

async function cargarDatos(){
  mostrarLoader();

  const timeout = setTimeout(() => {
    ocultarLoader();
    renderDemo();
    console.warn("Tiempo agotado conectando con Google Sheets.");
  }, 8000);

  try{
    const res = await fetch(API_URL + "?v=" + Date.now());

    if(!res.ok){
      throw new Error("Error API: " + res.status);
    }

    DATA = await res.json();

    renderInicio(DATA);
    renderRecursos(DATA);
    mostrarFechaWeb();

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
      "Diferencia":0,
      "Meta Grupal":0,
      "PP Actual":0,
      "% Avance Meta":"0%",
      "Deberían Llevar":0,
      "Proyección":"0%",
      "GAP":0,
      "Estado":"--"
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

function renderInicio(data){
  const d = normalizarDashboard(data.dashboard || {});
  const equipo = normalizarEquipo(data.equipo || []);

  mostrarFechaWeb();

  renderAvisoImportante(data.avisos || []);
  renderGestionDiaria(d);
  renderVentasDia(equipo);
  renderResumenTeam(d);
  renderDesempenoIndividual(equipo);
  renderAvisosGenerales(data.avisos || []);
}

function normalizarDashboard(d){
  return {
    ventasDia: numero(pick(d, ["ventasDia","Ventas día","Ventas Día","Ventas Dia"])),
    metaDia: numero(pick(d, ["metaDia","Meta día","Meta Día","Meta Dia"])),
    diferenciaDia: numero(pick(d, ["diferenciaDia","Diferencia","Diferencia día","Diferencia Día"])),
    metaGrupal: numero(pick(d, ["metaGrupal","Meta Grupal","Meta grupal","Meta Mes","Meta mensual"])),
    ppActual: numero(pick(d, ["ppActual","PP Actual","PP actual","Ventas MTD","Total PP"])),
    avanceMeta: formatoPorcentaje(pick(d, ["avanceMeta","% Avance Meta","Cumplimiento mes","Cumplimiento"])),
    deberianLlevar: numero(pick(d, ["deberianLlevar","Deberían Llevar","Deberian Llevar","Deberian llevar"])),
    proyeccion: formatoPorcentaje(pick(d, ["proyeccion","Proyección","Proyeccion","FCST","FCST Auto"])),
    gap: numero(pick(d, ["gap","GAP"])),
    estado: pick(d, ["estado","Estado","Estado cierre"]) || "--"
  };
}

function normalizarEquipo(equipo){
  return equipo.map(e => {
    const ventasMTD = numero(pick(e, ["ventasMTD","Ventas MTD","PP Actual","PP actual"]));
    const metaMes = numero(pick(e, ["metaMes","Meta Mes","Meta Individual","Meta"]));
    const gapBase = pick(e, ["gap","GAP","GAP Ind.","Gap"]);
    const gap = gapBase !== "" && gapBase !== undefined ? numero(gapBase) : ventasMTD - metaMes;

    return {
      ejecutivo: pick(e, ["ejecutivo","Ejecutivo","Nombre","nombre"]) || "",
      ventasDia: numero(pick(e, ["ventasDia","Ventas día","Ventas Día","Ventas Dia"])),
      ventasMTD,
      metaMes,
      cumplimiento: formatoPorcentaje(pick(e, ["cumplimiento","Cumplimiento","% Avance Meta","Avance"])),
      fcst: formatoPorcentaje(pick(e, ["fcst","FCST Auto","FCST","Proyección","Proyeccion"])),
      gap,
      estado: pick(e, ["estado","Estado"]) || calcularEstado(pick(e, ["cumplimiento","Cumplimiento"]))
    };
  });
}

function renderAvisoImportante(avisos){
  const box = document.getElementById("avisoImportante");

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
  document.getElementById("gestionDiaria").innerHTML = `
    ${kpiBox("📱","VENTAS DÍA",d.ventasDia)}
    ${kpiBox("🎯","META DÍA",d.metaDia)}
    ${kpiBox("📊","DIFERENCIA",d.diferenciaDia, d.diferenciaDia < 0)}
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

  document.getElementById("ventasDiaLista").innerHTML = html;
}

function renderResumenTeam(d){
  document.getElementById("resumenTeam").innerHTML = `
    ${summaryItem("🎯","META GRUPAL",d.metaGrupal)}
    ${summaryItem("📱","PP ACTUAL",d.ppActual)}
    ${summaryItem("📊","% AVANCE META",d.avanceMeta)}
    ${summaryItem("📋","DEBERÍAN LLEVAR",d.deberianLlevar)}
    ${summaryItem("📈","PROYECCIÓN",d.proyeccion)}
    ${summaryItem("↕","GAP",d.gap,true)}
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
  const html = equipo.length ? equipo.map(e => {
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
          <div class="metric-mini"><small>PP</small><strong>${e.ventasMTD}</strong></div>
          <div class="metric-mini"><small>Meta</small><strong>${e.metaMes}</strong></div>
          <div class="metric-mini"><small>Avance</small><strong>${e.cumplimiento}</strong></div>
          <div class="metric-mini"><small>FCST</small><strong>${e.fcst}</strong></div>
          <div class="metric-mini"><small>GAP</small><strong class="${e.gap < 0 ? "red" : ""}">${e.gap}</strong></div>
        </div>
      </div>
    `;
  }).join("") : `<div class="empty-msg">Sin desempeño individual</div>`;

  document.getElementById("desempenoIndividual").innerHTML = html;
}

function renderAvisosGenerales(avisos){
  const generales = avisos.filter(a =>
    String(pick(a, ["Prioridad","prioridad"])).toLowerCase() !== "alta" &&
    String(pick(a, ["Activo","activo"]) || "Sí").toLowerCase() !== "no"
  );

  const lista = generales.length
    ? generales.map(a => `<li>${pick(a, ["Descripción","Descripcion","descripcion","descripción","Título","Titulo"])}</li>`).join("")
    : `<li>Sin avisos generales activos.</li>`;

  document.getElementById("avisosGenerales").innerHTML = `
    <h3>🔔 AVISOS GENERALES</h3>
    <ul>${lista}</ul>
  `;
}

function renderRecursos(data){
  renderListaRecursos("bibliotecaContainer", data.biblioteca || [], "📚");
  renderListaRecursos("publicidadContainer", data.publicidad || [], "📢");
  renderListaRecursos("linksContainer", data.links || [], "🔗");
}

function renderListaRecursos(id, items, icono){
  const box = document.getElementById(id);

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
        <p><strong>PP Actual:</strong> ${d.ppActual}</p>
        <p><strong>Meta:</strong> ${d.metaGrupal}</p>
        <p><strong>Avance:</strong> ${d.avanceMeta}</p>
        <p><strong>FCST:</strong> ${d.proyeccion}</p>
        <p><strong>GAP:</strong> ${d.gap}</p>
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
        <p><strong>Meta mensual:</strong> ${d.metaGrupal}</p>
        <p><strong>PP actual:</strong> ${d.ppActual}</p>
        <p><strong>Deberían llevar:</strong> ${d.deberianLlevar}</p>
        <p><strong>Proyección:</strong> ${d.proyeccion}</p>
        <p><strong>Estado:</strong> ${d.estado}</p>
      </div>
    `;
  }
}

function cerrarModuloLider(){
  document.getElementById("liderModuloView").classList.add("hidden");