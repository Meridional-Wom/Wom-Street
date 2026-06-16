const API_URL = "https://script.google.com/macros/s/AKfycbxP2L869vhRVma1iNcwDEY8sV8X7OunPWuve4ot0BDr3v9fJFZmvhvZWjo2suF3cJsKdw/exec";

let DATA = {};
let liderActivo = false;

document.addEventListener("DOMContentLoaded", cargarDatos);

async function cargarDatos(){
  try{
    const res = await fetch(API_URL + "?v=" + Date.now());
    DATA = await res.json();
    renderInicio(DATA);
  }catch(error){
    console.error(error);
    renderDemo();
  }
}

function renderDemo(){
  DATA = {
    dashboard:{
      fechaActualizacion:"15-06-2026",
      ventasDia:4,
      metaDia:8,
      diferenciaDia:-4,
      metaGrupal:131,
      ppActual:41,
      avanceMeta:"31%",
      deberianLlevar:66,
      proyeccion:"82%",
      gap:-25,
      estado:"Bajo meta"
    },
    equipo:[
      {
        ejecutivo:"Sebastián Chacón",
        ventasDia:1,
        ventasMTD:11,
        metaMes:33,
        cumplimiento:"33%",
        fcst:"67%",
        gap:-22,
        estado:"En riesgo"
      },
      {
        ejecutivo:"Paulina Pérez",
        ventasDia:1,
        ventasMTD:14,
        metaMes:33,
        cumplimiento:"42%",
        fcst:"85%",
        gap:-19,
        estado:"Sobre meta"
      },
      {
        ejecutivo:"Julieth Orozco",
        ventasDia:1,
        ventasMTD:3,
        metaMes:33,
        cumplimiento:"9%",
        fcst:"35%",
        gap:-30,
        estado:"Bajo meta"
      },
      {
        ejecutivo:"Johanna Vargas",
        ventasDia:1,
        ventasMTD:13,
        metaMes:33,
        cumplimiento:"39%",
        fcst:"81%",
        gap:-20,
        estado:"En riesgo"
      }
    ],
    avisos:[
      {
        titulo:"AVISO IMPORTANTE",
        descripcion:"No olvidar marcar Geovictoria al iniciar y finalizar tu jornada.",
        prioridad:"Alta",
        activo:"Sí"
      },
      {
        titulo:"Aviso general",
        descripcion:"Recuerda registrar tus ventas diariamente antes de finalizar tu jornada.",
        prioridad:"Media",
        activo:"Sí"
      },
      {
        titulo:"Aviso general",
        descripcion:"Mantén actualizada tu ruta en Geovictoria.",
        prioridad:"Media",
        activo:"Sí"
      }
    ],
    config:{
      codigoLider:"CHILOE2026"
    },
    rutas:[],
    reembolsos:[]
  };

  renderInicio(DATA);
}

function renderInicio(data){
  const d = normalizarDashboard(data.dashboard || {});
  const equipo = normalizarEquipo(data.equipo || []);

  document.getElementById("fechaActualizacion").textContent =
    "Actualizado: " + (d.fechaActualizacion || "--");

  renderAvisoImportante(data.avisos || []);
  renderGestionDiaria(d);
  renderVentasDia(equipo);
  renderResumenTeam(d);
  renderDesempenoIndividual(equipo);
  renderAvisosGenerales(data.avisos || []);
}

function normalizarDashboard(d){
  return {
    fechaActualizacion: d.fechaActualizacion || d["Fecha actualización"] || d["Fecha Actualización"] || d.fecha || "",
    ventasDia: numero(d.ventasDia ?? d["Ventas Día"] ?? d["Ventas Dia"] ?? d["Ventas día"]),
    metaDia: numero(d.metaDia ?? d["Meta Día"] ?? d["Meta Dia"] ?? d["Meta día"]),
    diferenciaDia: numero(d.diferenciaDia ?? d["Diferencia"] ?? d["Diferencia Día"]),
    metaGrupal: numero(d.metaGrupal ?? d["Meta Grupal"] ?? d["Meta mensual"] ?? d["Meta Mes"]),
    ppActual: numero(d.ppActual ?? d["PP Actual"] ?? d["Ventas MTD"] ?? d["Total PP"]),
    avanceMeta: formatoPorcentaje(d.avanceMeta ?? d["% Avance Meta"] ?? d["Cumplimiento mes"] ?? d["Cumplimiento"]),
    deberianLlevar: numero(d.deberianLlevar ?? d["Deberían Llevar"] ?? d["Deberian llevar"]),
    proyeccion: formatoPorcentaje(d.proyeccion ?? d["Proyección"] ?? d["FCST"] ?? d["FCST Auto"]),
    gap: numero(d.gap ?? d["GAP"]),
    estado: d.estado ?? d["Estado"] ?? d["Estado cierre"] ?? ""
  };
}

function normalizarEquipo(equipo){
  return equipo.map(e => {
    const ventasMTD = numero(e.ventasMTD ?? e["Ventas MTD"] ?? e["PP Actual"]);
    const metaMes = numero(e.metaMes ?? e["Meta Mes"] ?? e["Meta Individual"] ?? e["Meta"]);
    const gap = numero(e.gap ?? e["GAP"] ?? e["GAP Ind."] ?? (ventasMTD - metaMes));

    return {
      ejecutivo: e.ejecutivo || e["Ejecutivo"] || e.nombre || e["Nombre"] || "",
      ventasDia: numero(e.ventasDia ?? e["Ventas Día"] ?? e["Ventas Dia"] ?? e["Ventas día"]),
      ventasMTD,
      metaMes,
      cumplimiento: formatoPorcentaje(e.cumplimiento ?? e["Cumplimiento"] ?? e["% Avance Meta"]),
      fcst: formatoPorcentaje(e.fcst ?? e["FCST Auto"] ?? e["FCST"] ?? e["Proyección"]),
      gap,
      estado: e.estado || e["Estado"] || calcularEstado(e.cumplimiento ?? e["Cumplimiento"])
    };
  });
}

function renderAvisoImportante(avisos){
  const box = document.getElementById("avisoImportante");

  const aviso = avisos.find(a =>
    String(a.prioridad || a["Prioridad"] || "").toLowerCase() === "alta" &&
    String(a.activo || a["Activo"] || "Sí").toLowerCase() !== "no"
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
      <h3>${aviso.titulo || aviso["Título"] || "AVISO IMPORTANTE"}</h3>
      <p>${aviso.descripcion || aviso["Descripción"] || ""}</p>
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
  const html = equipo.map(e => {
    const color = e.ventasDia > 0 ? "green" : "";
    return `
      <div class="daily-row">
        <div class="dot ${color}"></div>
        <div>${nombreCorto(e.ejecutivo)}</div>
        <strong>${e.ventasDia}</strong>
      </div>
    `;
  }).join("");

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
  const html = equipo.map(e => {
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
          <div class="metric-mini">
            <small>PP</small>
            <strong>${e.ventasMTD}</strong>
          </div>

          <div class="metric-mini">
            <small>Meta</small>
            <strong>${e.metaMes}</strong>
          </div>

          <div class="metric-mini">
            <small>Avance</small>
            <strong>${e.cumplimiento}</strong>
          </div>

          <div class="metric-mini">
            <small>FCST</small>
            <strong>${e.fcst}</strong>
          </div>

          <div class="metric-mini">
            <small>GAP</small>
            <strong class="${e.gap < 0 ? "red" : ""}">${e.gap}</strong>
          </div>
        </div>
      </div>
    `;
  }).join("");

  document.getElementById("desempenoIndividual").innerHTML = html;
}

function renderAvisosGenerales(avisos){
  const generales = avisos.filter(a =>
    String(a.prioridad || a["Prioridad"] || "").toLowerCase() !== "alta" &&
    String(a.activo || a["Activo"] || "Sí").toLowerCase() !== "no"
  );

  const lista = generales.length
    ? generales.map(a => `<li>${a.descripcion || a["Descripción"] || a.titulo || a["Título"]}</li>`).join("")
    : `
      <li>Recuerda registrar tus ventas diariamente antes de finalizar tu jornada.</li>
      <li>Mantén actualizada tu ruta en Geovictoria.</li>
      <li>Cualquier duda o inconveniente, contacta a tu líder de equipo.</li>
    `;

  document.getElementById("avisosGenerales").innerHTML = `
    <h3>🔔 AVISOS GENERALES</h3>
    <ul>${lista}</ul>
  `;
}

function mostrarVista(id, btn){
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

function validarLider(){
  const pin = document.getElementById("pinLider").value.trim();
  const codigo = DATA?.config?.codigoLider || DATA?.config?.["Código líder"] || "CHILOE2026";

  if(pin === codigo){
    liderActivo = true;
    document.getElementById("loginLider").classList.add("hidden");
    document.getElementById("panelLider").classList.remove("hidden");
    document.getElementById("loginError").textContent = "";
  }else{
    document.getElementById("loginError").textContent = "Código incorrecto";
  }
}

function abrirModulo(modulo){
  const box = document.getElementById("moduloLider");

  const d = normalizarDashboard(DATA.dashboard || {});
  const equipo = normalizarEquipo(DATA.equipo || []);

  if(modulo === "registrarRuta"){
    box.innerHTML = `
      <div class="module-card">
        <h3>🗺️ REGISTRAR RUTA</h3>
        <p><strong>Función:</strong> crear nueva ruta del equipo.</p>
        <p><strong>Campos:</strong> fecha, día, sector, responsable, estado y observación.</p>
      </div>
    `;
  }

  if(modulo === "planes"){
    box.innerHTML = `
      <div class="module-card">
        <h3>🚦 PLANES DE ACCIÓN</h3>
        ${equipo.map(e => `
          <p><strong>${nombreCorto(e.ejecutivo)}</strong></p>
          <p>PP ${e.ventasMTD} | GAP ${e.gap} | ${e.estado}</p>
          <hr>
        `).join("")}
      </div>
    `;
  }

  if(modulo === "bitacora"){
    box.innerHTML = `
      <div class="module-card">
        <h3>📝 BITÁCORA DEL MES</h3>
        <p>Registro mensual de gestiones importantes, acompañamientos, incidencias y compromisos.</p>
      </div>
    `;
  }

  if(modulo === "metas"){
    box.innerHTML = `
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
    box.innerHTML = `
      <div class="module-card">
        <h3>💸 REEMBOLSOS</h3>
        <p>Gastos pendientes y pagados del equipo.</p>
      </div>
    `;
  }

  if(modulo === "mes"){
    box.innerHTML = `
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

function compartirReporte(){
  const d = normalizarDashboard(DATA.dashboard || {});

  const texto =
`WOM Street Chiloé
Ventas día: ${d.ventasDia}
Meta día: ${d.metaDia}
PP Actual: ${d.ppActual}
Meta grupal: ${d.metaGrupal}
Avance: ${d.avanceMeta}
GAP: ${d.gap}`;

  if(navigator.share){
    navigator.share({text:texto});
  }else{
    navigator.clipboard.writeText(texto);
    alert("Reporte copiado");
  }
}

function numero(v){
  if(v === undefined || v === null || v === "") return 0;

  if(typeof v === "number"){
    return Math.round(v);
  }

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

  const n = numero(v);
  return `${n}%`;
}

function calcularEstado(cumplimiento){
  const n = numero(cumplimiento);

  if(n >= 100) return "Sobre meta";
  if(n >= 80) return "En riesgo";
  return "Bajo meta";
}

function claseEstado(estado){
  const e = String(estado || "").toLowerCase();

  if(e.includes("sobre") || e.includes("excelente")){
    return "verde";
  }

  if(e.includes("riesgo") || e.includes("progreso") || e.includes("seguimiento")){
    return "amarillo";
  }

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