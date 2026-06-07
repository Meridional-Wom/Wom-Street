function ocultarLoader(){
  const loader = document.getElementById("loader");
  if(loader){
    loader.style.opacity = "0";
    setTimeout(() => {
      loader.style.display = "none";
    }, 400);
  }
}const CODIGO_LIDER = "WSCHILOE2026";
const API_URL = "https://script.google.com/macros/s/AKfycbxP2L869vhRVma1iNcwDEY8sV8X7OunPWuve4ot0BDr3v9fJFZmvhvZWjo2suF3cJsKdw/exec";

let datos = {};

async function iniciar(){
  try{
    const res = await fetch(API_URL + "?t=" + Date.now());
    const data = await res.json();

    datos = transformarDatos(data);
    renderTodo();

  }catch(error){
    console.error(error);
    alert("No se pudieron cargar los datos desde Google Sheets.");
  }
}

function transformarDatos(data){
  const dashboard = data.dashboard || {};

  return {
    ultima_actualizacion: dashboard["Última actualización"] || "",

    dashboard: {
      ventas_dia: Number(dashboard["Ventas día"] || 0),
      meta_dia: Number(dashboard["Meta día"] || 0),
      ventas_mtd: Number(dashboard["Ventas MTD"] || 0),
      meta_mes: Number(dashboard["Meta mes"] || 0),
      fcst: Number(dashboard["FCST"] || 0)
    },

    equipo: (data.equipo || []).map(e => ({
      nombre: e["Ejecutivo"] || "",
      ventas_dia: Number(e["Ventas Día"] || 0),
      mtd: Number(e["Ventas MTD"] || 0),
      meta: Number(e["Meta Mes"] || 0),
      observacion: e["Observación"] || ""
    })),

    avisos: (data.avisos || []).map(a => ({
      titulo: a["Título"] || "",
      descripcion: a["Descripción"] || ""
    })),

    biblioteca: (data.biblioteca || []).map(b => ({
      titulo: b["Título"] || "",
      descripcion: b["Descripción"] || "",
      url: b["Link"] || "#"
    })),

    publicidad: (data.publicidad || []).map(p => ({
      titulo: p["Título"] || "",
      descripcion: p["Descripción"] || "",
      url: p["Link"] || "#"
    })),

    links: (data.links || []).map(l => ({
      nombre: l["Nombre"] || "",
      categoria: l["Categoría"] || "",
      url: l["URL"] || "#"
    })),

    rutas: (data.rutas || []).map(r => ({
      dia: r["Día"] || "",
      sector: r["Sector"] || "",
      responsable: r["Responsable"] || ""
    })),

    reembolsos: (data.reembolsos || []).map(r => ({
      ejecutivo: r["Ejecutivo"] || "",
      monto: r["Monto"] || "",
      estado: r["Estado"] || ""
    }))
  };
}

function mostrar(id){
  document.querySelectorAll(".section").forEach(s => {
    s.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validarCodigo(){
  const codigo = document.getElementById("codigo").value.trim();
  const error = document.getElementById("error");

  if(codigo === CODIGO_LIDER){
    document.getElementById("loginLider").classList.add("hidden");
    document.getElementById("panelLider").classList.remove("hidden");
    error.textContent = "";
    cargarFormulario();
  }else{
    error.textContent = "Código incorrecto";
  }
}

function porcentaje(valor, meta){
  if(!meta || meta === 0) return 0;
  return Math.round((valor / meta) * 100);
}

function color(p){
  if(p >= 90) return "green";
  if(p >= 60) return "yellow";
  return "red";
}

function estado(p){
  if(p >= 90) return "Sobre meta";
  if(p >= 60) return "En riesgo";
  return "Bajo meta";
}

function calcular(){
  const d = datos.dashboard;

  d.cumplimiento_dia = porcentaje(d.ventas_dia, d.meta_dia);
  d.cumplimiento_mes = porcentaje(d.ventas_mtd, d.meta_mes);
  d.gap = d.ventas_mtd - d.meta_mes;
  d.diferencia_fcst = d.fcst - d.meta_mes;
  d.estado_fcst = porcentaje(d.fcst, d.meta_mes);

  datos.equipo.forEach(e => {
    e.cumplimiento = porcentaje(e.mtd, e.meta);
    e.gap = e.mtd - e.meta;
  });
}

function renderTodo(){
  calcular();
  renderHeader();
  renderKpis();
  renderEquipo();
  renderAvisos();
  renderBiblioteca();
  renderPublicidad();
  renderLinks();
  renderPrivado();
}

function renderHeader(){
  document.getElementById("ultimaActualizacion").textContent =
    "Última actualización: " + datos.ultima_actualizacion;
}

function kpi(titulo, valor, subtitulo, progreso){
  const barra = progreso !== undefined
    ? `<div class="progress"><span style="width:${Math.min(progreso,100)}%"></span></div>`
    : "";

  return `
    <div class="card">
      <div class="kpi-title">${titulo}</div>
      <div class="kpi-value">${valor}</div>
      <p class="kpi-sub">${subtitulo || ""}</p>
      ${barra}
    </div>
  `;
}

function renderKpis(){
  const d = datos.dashboard;

  document.getElementById("kpisDia").innerHTML = `
    ${kpi("Ventas del día", d.ventas_dia, "Gestión diaria")}
    ${kpi("Meta diaria", d.meta_dia, "Objetivo del día")}
    ${kpi("Cumplimiento diario", d.cumplimiento_dia + "%", estado(d.cumplimiento_dia), d.cumplimiento_dia)}
  `;

  document.getElementById("kpisMes").innerHTML = `
    ${kpi("Ventas MTD", d.ventas_mtd, "Acumulado del mes")}
    ${kpi("Meta mensual", d.meta_mes, "Objetivo mensual")}
    ${kpi("Cumplimiento mes", d.cumplimiento_mes + "%", estado(d.cumplimiento_mes), d.cumplimiento_mes)}
    ${kpi("GAP", d.gap, "Diferencia contra meta")}
  `;

  document.getElementById("kpisForecast").innerHTML = `
    ${kpi("FCST", d.fcst, "Proyección de cierre")}
    ${kpi("Diferencia FCST", d.diferencia_fcst, "Forecast vs meta")}
    <div class="card">
      <div class="kpi-title">Estado de cierre</div>
      <div class="kpi-value">
        <span class="badge ${color(d.estado_fcst)}">${estado(d.estado_fcst)}</span>
      </div>
      <p class="kpi-sub">Según la proyección actual</p>
    </div>
  `;
}

function renderEquipo(){
  document.getElementById("equipoCards").innerHTML = datos.equipo.map(e => `
    <div class="person">
      <div class="person-top">
        <div class="person-name">${e.nombre}</div>
        <span class="badge ${color(e.cumplimiento)}">${estado(e.cumplimiento)}</span>
      </div>

      <div class="person-grid">
        <div class="mini"><span>Hoy</span><strong>${e.ventas_dia}</strong></div>
        <div class="mini"><span>MTD</span><strong>${e.mtd}</strong></div>
        <div class="mini"><span>Meta</span><strong>${e.meta}</strong></div>
        <div class="mini"><span>Cump.</span><strong>${e.cumplimiento}%</strong></div>
      </div>
    </div>
  `).join("");
}

function renderAvisos(){
  document.getElementById("avisosLista").innerHTML = datos.avisos.map(a => `
    <div class="card">
      <h3>${a.titulo}</h3>
      <p>${a.descripcion}</p>
    </div>
  `).join("");
}

function renderBiblioteca(){
  document.getElementById("bibliotecaLista").innerHTML = datos.biblioteca.map(b => `
    <div class="card">
      <h3>${b.titulo}</h3>
      <p>${b.descripcion}</p>
      <a href="${b.url}" target="_blank">Abrir</a>
    </div>
  `).join("");
}

function renderPublicidad(){
  document.getElementById("publicidadLista").innerHTML = datos.publicidad.map(p => `
    <div class="card">
      <h3>${p.titulo}</h3>
      <p>${p.descripcion}</p>
      <a href="${p.url}" target="_blank">Ver material</a>
    </div>
  `).join("");
}

function renderLinks(){
  document.getElementById("linksLista").innerHTML = datos.links.map(l => `
    <div class="card">
      <h3>${l.nombre}</h3>
      <p>${l.categoria}</p>
      <a href="${l.url}" target="_blank">Abrir enlace</a>
    </div>
  `).join("");
}

function renderPrivado(){
  document.getElementById("liderEquipo").innerHTML = datos.equipo.map(e => `
    <div class="person">
      <div class="person-top">
        <div class="person-name">${e.nombre}</div>
        <span class="badge ${color(e.cumplimiento)}">${estado(e.cumplimiento)}</span>
      </div>

      <div class="person-grid">
        <div class="mini"><span>Hoy</span><strong>${e.ventas_dia}</strong></div>
        <div class="mini"><span>MTD</span><strong>${e.mtd}</strong></div>
        <div class="mini"><span>Meta</span><strong>${e.meta}</strong></div>
        <div class="mini"><span>GAP</span><strong>${e.gap}</strong></div>
      </div>

      <p>${e.observacion}</p>
    </div>
  `).join("");

  document.getElementById("rutasLista").innerHTML = datos.rutas.map(r => `
    <div class="card">
      <h3>${r.dia}</h3>
      <p>${r.sector}</p>
      <small>${r.responsable}</small>
    </div>
  `).join("");

  document.getElementById("reembolsosLista").innerHTML = datos.reembolsos.map(r => `
    <div class="card">
      <h3>${r.ejecutivo}</h3>
      <p>Monto: ${r.monto}</p>
      <span class="badge yellow">${r.estado}</span>
    </div>
  `).join("");
}

function cargarFormulario(){
  const d = datos.dashboard;

  document.getElementById("formVentasDia").value = d.ventas_dia;
  document.getElementById("formMetaDia").value = d.meta_dia;
  document.getElementById("formVentasMTD").value = d.ventas_mtd;
  document.getElementById("formMetaMes").value = d.meta_mes;
  document.getElementById("formFcst").value = d.fcst;
}

function guardarIndicadores(){
  alert("Por ahora los datos se actualizan desde Google Sheets. La escritura desde la web la agregamos en el siguiente paso.");
}

function resetearDatos(){
  location.reload();
}

iniciar();